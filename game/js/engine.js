/* TheLife — core simulation. Operates on the current save in TL.S. */
TL.engine = (function () {
  var U = TL.util, D = TL.data;
  var SAVE_VERSION = 1;

  // ---------- small helpers ----------
  function S() { return TL.S; }
  function me() { return TL.S.me; }
  function country() { return D.country(TL.S.country); }
  function k() { return country().k; }
  // Convert a base-dollar amount into the local currency, rounded to look natural.
  function $(usd) {
    var v = usd * k();
    if (Math.abs(v) >= 1000) return Math.round(v / 10) * 10;
    return Math.round(v);
  }
  function fmt(n) { return U.money(n, country().cur); }
  // "the United States", "the Philippines"; other countries take no article.
  function countryName(n) { return (/^(United|Philippines)/.test(n) ? 'the ' : '') + n; }
  // "a nurse", "an engineer", "unemployed", "retired".
  function jobPhrase(job) {
    var j = job.toLowerCase();
    if (j === 'unemployed' || j === 'retired') return j;
    return (/^[aeiou]/.test(j) ? 'an ' : 'a ') + j;
  }
  function an(w) { return (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w; }
  function fullName(p) { return p.first + ' ' + p.last; }
  function he(p, cap) { var w = p.gender === 'M' ? 'he' : 'she'; return cap ? U.cap(w) : w; }
  function his(p, cap) { var w = p.gender === 'M' ? 'his' : 'her'; return cap ? U.cap(w) : w; }
  function him(p) { return p.gender === 'M' ? 'him' : 'her'; }

  // Entries that differ only in numbers ("I practiced painting (4/100)" then
  // "(5/100)") collapse into the newest one with a count, keeping the log readable.
  function logKey(t) { return t.replace(/\(.*?\)/g, '').replace(/[\d.,]+/g, '#'); }
  function log(text, cls) {
    if (typeof text !== 'string' || !text) return;
    var s = S();
    var y = s.log[s.log.length - 1];
    var last = y.entries[y.entries.length - 1];
    if (last && (last.c || '') === (cls || '') && logKey(last.t) === logKey(text)) {
      last.n = (last.n || 1) + 1;
      last.t = text;
      return;
    }
    y.entries.push({ t: text, c: cls || '' });
  }

  function stat(name, delta) {
    var m = me();
    m[name] = U.clamp(Math.round(m[name] + delta), 0, 100);
    return m[name];
  }
  function addMoney(n) { if (isFinite(n)) S().money = Math.round(S().money + n); }
  function karma(d) { S().karma = U.clamp(S().karma + d, 0, 100); }
  function fame(d) { S().fame = U.clamp(Math.round(S().fame + d), 0, 100); }

  function person(id) {
    var ps = S().people;
    for (var i = 0; i < ps.length; i++) if (ps[i].id === id) return ps[i];
    return null;
  }
  function people(roles, includeDead) {
    if (typeof roles === 'string') roles = [roles];
    return S().people.filter(function (p) {
      return (includeDead || p.alive) && (!roles || roles.indexOf(p.role) >= 0);
    });
  }
  function partner() {
    var p = people(['spouse', 'fiance', 'partner']);
    return p.length ? p[0] : null;
  }
  function rel(p, d) { p.rel = U.clamp(Math.round(p.rel + d), 0, 100); }

  function hasDegree(type, majors) {
    return S().degrees.some(function (d) {
      return d.type === type && (!majors || majors.indexOf(d.major) >= 0);
    });
  }
  function eduRank() {
    var r = 0;
    S().degrees.forEach(function (d) { r = Math.max(r, D.EDU_RANK[d.type] || 0); });
    return r;
  }
  function highestDegree() {
    var best = null;
    S().degrees.forEach(function (d) {
      if (!best || D.EDU_RANK[d.type] > D.EDU_RANK[best.type]) best = d;
    });
    return best;
  }
  function degreeName(d) {
    if (!d) return 'None';
    return { hs: 'High School Diploma', bachelor: 'Bachelor\'s in ' + d.major, mba: 'MBA', law: 'Juris Doctor', med: 'Doctor of Medicine', phd: 'PhD in ' + d.major }[d.type];
  }

  function hasCondition(name) { return S().conditions.indexOf(name) >= 0; }
  function addCondition(name) {
    if (hasCondition(name)) return false;
    S().conditions.push(name);
    return true;
  }
  function removeCondition(name) {
    var i = S().conditions.indexOf(name);
    if (i >= 0) S().conditions.splice(i, 1);
  }

  function achieve(id) {
    var s = S();
    if (s.ach.indexOf(id) >= 0) return;
    s.ach.push(id);
    var a = D.ACHIEVEMENTS.filter(function (x) { return x.id === id; })[0];
    if (a) {
      log('🏅 Achievement unlocked: ' + a.name + '!', 'good');
      var global = loadGlobal();
      if (global.ach.indexOf(id) < 0) { global.ach.push(id); saveGlobal(global); }
    }
  }

  function netWorth() {
    var s = S(), w = s.money - s.studentDebt;
    s.assets.forEach(function (a) { w += a.value - (a.loan || 0); });
    Object.keys(s.stocks).forEach(function (sym) { w += s.stocks[sym] * s.prices[sym]; });
    return Math.round(w);
  }

  // ---------- people ----------
  function randomName(gender, lastName, ctry) {
    var c = ctry ? D.country(ctry) : country();
    return { first: U.pick(gender === 'M' ? c.male : c.female), last: lastName || U.pick(c.last) };
  }
  function npcJob(age) {
    if (age < 5) return 'Toddler';
    if (age < 18) return 'Student';
    if (age >= 67) return 'Retired';
    if (age < 23 && U.chance(0.5)) return 'University Student';
    if (U.chance(0.1)) return 'Unemployed';
    var c = U.pick(D.CAREERS);
    var lvl = Math.min(c.levels.length - 1, Math.floor(U.randf(0, Math.min(c.levels.length, (age - 18) / 7 + 1))));
    return c.levels[lvl][0];
  }
  function makePerson(o) {
    var gender = o.gender || (U.chance(0.5) ? 'M' : 'F');
    var nm = randomName(gender, o.last, o.country);
    var age = o.age != null ? o.age : 20;
    var p = {
      id: U.uid(), first: o.first || nm.first, last: nm.last, gender: gender, age: age, alive: true,
      role: o.role || 'friend', rel: o.rel != null ? o.rel : U.rand(40, 80),
      happy: U.rand(30, 95), health: U.rand(55, 100), smarts: U.rand(10, 100), looks: U.rand(10, 100),
      money: o.money != null ? o.money : Math.max(0, Math.round(U.gauss(30000, 40000))),
      job: o.job || npcJob(age), traits: U.shuffle(D.TRAITS).slice(0, 2), since: S() ? S().me.age : 0
    };
    if (o.looks) p.looks = o.looks;
    return p;
  }
  function addPerson(o) { var p = makePerson(o); S().people.push(p); return p; }

  // ---------- new life ----------
  function newLife(opts) {
    opts = opts || {};
    var ctry = D.country(opts.country || U.pick(D.COUNTRIES).name);
    var gender = opts.gender || (U.chance(0.5) ? 'M' : 'F');
    var nm = randomName(gender, opts.last, ctry.name);
    var month = U.rand(1, 12), day = U.rand(1, 28);
    var zodiac = D.ZODIAC.filter(function (z) { return z[1] > month || (z[1] === month && day <= z[2]); })[0][0];
    var startYear = opts.year || new Date().getFullYear();

    var st = {
      v: SAVE_VERSION, id: U.uid(), created: Date.now(), updated: Date.now(),
      gen: opts.gen || 1, country: ctry.name, birthCountry: ctry.name, year: startYear,
      me: {
        first: opts.first || nm.first, last: nm.last, gender: gender, age: 0, month: month, day: day, zodiac: zodiac,
        happy: U.rand(60, 100), health: U.rand(70, 100), smarts: U.rand(5, 100), looks: U.rand(5, 100),
        athl: U.rand(5, 60), interest: opts.interest || (gender === 'M' ? 'F' : 'M')
      },
      money: 0, studentDebt: 0, fame: 0, followers: 0, karma: 50,
      people: [], log: [], degrees: [], conditions: [], assets: [], pets: [],
      stocks: {}, prices: {}, record: [], prison: null, ach: [],
      edu: null, job: null, jobHistory: [], retired: false, pension: 0,
      flags: {}, counts: { vacations: 0, exes: 0, kids: 0, crimes: 0, jobs: 0, dates: 0 },
      yearActs: {}, pending: [], dead: false, cause: null, legacy: opts.legacy || null,
      famePerks: null, social: { platform: false }
    };
    D.STOCKS.forEach(function (s) { st.prices[s.sym] = Math.round(U.randf(20, 300) * 100) / 100; });
    TL.S = st;
    st.log.push({ age: 0, year: startYear, entries: [] });

    if (opts.legacy) {
      // Continuing a family line: caller has already prepared people/money.
      st.people = opts.legacy.people || [];
      st.money = opts.legacy.money || 0;
      st.me = Object.assign(st.me, opts.legacy.me || {});
      st.ach = opts.legacy.ach || [];
      return st;
    }

    var tiers = [{ w: 25, t: 'poor', m: 4000 }, { w: 50, t: 'middle', m: 45000 }, { w: 20, t: 'upper', m: 250000 }, { w: 5, t: 'rich', m: 3000000 }];
    var wealthTier = tiers.filter(function (t) { return t.t === opts.wealth; })[0] || U.weighted(tiers);
    if (opts.stats) ['happy', 'health', 'smarts', 'looks'].forEach(function (k) { if (opts.stats[k] != null) st.me[k] = U.clamp(Math.round(opts.stats[k]), 0, 100); });
    st.flags.wealth = wealthTier.t;
    var momAge = U.rand(18, 42), dadAge = momAge + U.rand(-4, 8);
    var parentsMarried = U.chance(0.7);
    var mom = addPerson({ role: 'mother', gender: 'F', age: momAge, last: parentsMarried ? st.me.last : undefined, rel: U.rand(55, 100), money: $(wealthTier.m * U.randf(0.5, 1.5)) });
    var dad = addPerson({ role: 'father', gender: 'M', age: Math.max(18, dadAge), last: st.me.last, rel: U.rand(45, 100), money: $(wealthTier.m * U.randf(0.5, 1.5)) });
    mom.married = dad.married = parentsMarried;
    [mom, dad].forEach(function (p) { if (p.job === 'Student' || p.job === 'University Student') p.job = npcJob(30); });
    if (wealthTier.t === 'rich') { mom.job = U.pick(['CEO', 'Managing Partner', 'Movie Star', 'Surgeon']); }

    var sibs = U.weighted([{ w: 30, n: 0 }, { w: 40, n: 1 }, { w: 20, n: 2 }, { w: 10, n: 3 }]).n;
    for (var i = 0; i < sibs; i++) {
      var sa = U.rand(1, Math.min(12, momAge - 17));
      if (sa < 1) continue;
      addPerson({ role: 'sibling', age: sa, last: st.me.last, rel: U.rand(35, 90), money: 0 });
    }
    // Grandparents
    var gpCount = U.rand(0, 3);
    for (var g = 0; g < gpCount; g++) {
      var gp = addPerson({ role: 'grandparent', age: U.rand(Math.max(momAge, dadAge) + 18, Math.max(momAge, dadAge) + 38), last: g % 2 ? st.me.last : undefined, rel: U.rand(50, 100), money: $(wealthTier.m * U.randf(0.5, 3)) });
      gp.job = 'Retired';
      if (gp.age > 88) gp.age = 88;
    }

    if (opts.royal && TL.features) TL.features.makeRoyal(st);
    var m = st.me;
    log('I was born a ' + (gender === 'M' ? 'boy' : 'girl') + ' in ' + countryName(ctry.name) + ' ' + ctry.flag + ' on ' + D.MONTHS[month - 1] + ' ' + U.ordinal(day) + ', ' + startYear + '.');
    log('My name is ' + m.first + ' ' + m.last + '. I am a ' + zodiac + '.');
    log('My mother is ' + fullName(mom) + ', ' + jobPhrase(mom.job) + ' (age ' + mom.age + ').');
    log('My father is ' + fullName(dad) + ', ' + jobPhrase(dad.job) + ' (age ' + dad.age + ').');
    if (!mom.married) log('My parents aren\'t married.');
    people('sibling').forEach(function (s) {
      log('I have ' + (s.gender === 'M' ? 'an older brother' : 'an older sister') + ', ' + s.first + ' (age ' + s.age + ').');
    });
    if (st.royal) TL.features.royalBirthLog();
    else if (wealthTier.t === 'rich') log('My family is extremely wealthy. 💎', 'good');
    else if (wealthTier.t === 'poor') log('My family struggles to make ends meet.', 'bad');
    return st;
  }

  // ---------- education ----------
  var SCHOOL_WORDS = ['Maplewood', 'Riverside', 'Lincoln', 'Oakridge', 'Westfield', 'Sunnyvale', 'Hillcrest', 'Lakeview', 'Kingsley', 'Pinecrest', 'Brookside', 'Fairview', 'Northgate', 'Silver Creek'];
  var UNI_WORDS = ['State University', 'Institute of Technology', 'University', 'College', 'Polytechnic'];
  function schoolName(kind) {
    var w = U.pick(SCHOOL_WORDS);
    if (kind === 'uni') return w + ' ' + U.pick(UNI_WORDS);
    return w + ' ' + { elementary: 'Elementary', middle: 'Middle School', high: 'High School' }[kind];
  }
  function enroll(stage, extra) {
    var s = S();
    var prev = s.edu;
    s.edu = Object.assign({
      stage: stage, school: schoolName(stage === 'grad' ? 'uni' : stage), year: 1,
      grade: prev ? U.clamp(prev.grade + U.rand(-5, 5), 20, 95) : U.clamp(me().smarts + U.rand(-15, 15), 20, 95),
      study: 0, clubs: [], popularity: prev ? prev.popularity : U.rand(20, 70)
    }, extra || {});
    // New classmates
    if (stage !== 'grad') {
      people('classmate').forEach(function (p) { p.role = 'former classmate'; });
      var n = U.rand(3, 6);
      for (var i = 0; i < n; i++) addPerson({ role: 'classmate', age: me().age + U.rand(-1, 1), rel: U.rand(10, 60), money: 0 });
    }
    return s.edu;
  }
  function eduYears(stage, grad) {
    if (stage === 'uni') return 4;
    if (stage === 'grad') return D.GRAD_SCHOOLS.filter(function (g) { return g.id === grad; })[0].years;
    return { elementary: 5, middle: 3, high: 4 }[stage];
  }
  function gradeLetter(g) {
    return g >= 93 ? 'A+' : g >= 85 ? 'A' : g >= 78 ? 'B+' : g >= 70 ? 'B' : g >= 62 ? 'C+' : g >= 55 ? 'C' : g >= 45 ? 'D' : 'F';
  }
  function progressSchool() {
    var s = S(), m = me(), e = s.edu;
    if (s.prison) return;
    if (!e) {
      if (m.age === 6 && !s.flags.noSchool) { enroll('elementary'); log('I started first grade at ' + s.edu.school + '. 🎒'); }
      else if (m.age === 3) log('I started preschool.');
      return;
    }
    // yearly grade change
    e.grade = U.clamp(Math.round(e.grade + (m.smarts - 50) / 12 + e.study * 3 + U.rand(-7, 7) - (m.happy < 25 ? 5 : 0)), 0, 100);
    if (e.stage !== 'grad' && e.stage !== 'uni') stat('smarts', U.rand(0, 3) + e.study);
    else stat('smarts', U.rand(1, 3) + e.study);
    e.study = 0;
    e.year++;
    var total = eduYears(e.stage, e.grad);
    if (e.year <= total) return;

    // finished this stage
    if (e.stage === 'elementary') { log('I graduated from elementary school.'); enroll('middle'); log('I started middle school at ' + s.edu.school + '.'); }
    else if (e.stage === 'middle') { log('I finished middle school.'); enroll('high'); log('I started high school at ' + s.edu.school + '. 🏫'); }
    else if (e.stage === 'high') {
      if (e.grade < 25 && !s.flags.heldBack) {
        s.flags.heldBack = true; e.year = total;
        log('My grades were too low to graduate. I have to repeat my senior year.', 'bad'); stat('happy', -15);
        return;
      }
      s.degrees.push({ type: 'hs' });
      log('🎓 I graduated from ' + e.school + ' with a ' + gradeLetter(e.grade) + ' average!', 'good');
      if (e.grade >= 95) { log('🥇 I was named valedictorian of my class!', 'good'); achieve('valedictorian'); }
      stat('happy', 10);
      s.lastGrade = e.grade;
      s.edu = null;
      queue('after_hs');
    } else if (e.stage === 'uni') {
      if (e.grade < 30) { e.year = total; log('I failed too many classes and must take another year of university.', 'bad'); stat('happy', -10); return; }
      s.degrees.push({ type: 'bachelor', major: e.major });
      log('🎓 I graduated from ' + e.school + ' with a Bachelor\'s degree in ' + e.major + '! (' + gradeLetter(e.grade) + ')', 'good');
      stat('happy', 15); stat('smarts', 5);
      s.lastGrade = e.grade;
      s.edu = null;
      achieve('graduate');
      if (s.job && s.job.partTime) quitJob(true);
    } else if (e.stage === 'grad') {
      if (e.grade < 35) { e.year = total; log('I didn\'t pass my exams and need another year.', 'bad'); return; }
      var gs = D.GRAD_SCHOOLS.filter(function (g) { return g.id === e.grad; })[0];
      s.degrees.push({ type: e.grad, major: e.major });
      log('🎓 I earned my ' + gs.degree + (e.grad === 'phd' ? ' in ' + e.major : '') + '!', 'good');
      stat('happy', 15); stat('smarts', 8);
      s.edu = null;
      if (e.grad === 'med' || e.grad === 'phd') achieve('doctorate');
      if (e.grad === 'law') achieve('lawyer');
    }
  }
  // Costs & funding for university; returns {ok, msg}
  function enrollUni(major, funding) {
    var s = S(), tuition = $(28000) * 4;
    if (funding === 'parents') {
      var ps = people(['mother', 'father']).filter(function (p) { return p.money > tuition * 0.5; });
      var rich = ps.sort(function (a, b) { return b.money - a.money; })[0];
      if (!rich || rich.rel < 40 || !U.chance(rich.rel / 100 + (rich.money > tuition * 3 ? 0.3 : 0))) return { ok: false, msg: 'My parents said they can\'t pay for my education.' };
      rich.money -= tuition;
      enroll('uni', { major: major, funding: 'parents' });
      return { ok: true, msg: 'My ' + rich.role + ' agreed to pay my tuition! I enrolled at ' + s.edu.school + ' to study ' + major + '.' };
    }
    if (funding === 'scholarship') {
      var g = s.lastGrade || 50;
      var p = g >= 90 ? 0.8 : g >= 80 ? 0.45 : g >= 70 ? 0.2 : 0.03;
      if (s.sat) p += (s.sat - 1100) / 1500;
      if (s.flags.athleteScholar) p += 0.3;
      if (!U.chance(p)) return { ok: false, msg: 'My scholarship application was rejected.' };
      enroll('uni', { major: major, funding: 'scholarship' });
      return { ok: true, msg: 'I won a full scholarship! I enrolled at ' + s.edu.school + ' to study ' + major + '. 🏆' };
    }
    if (funding === 'savings') {
      if (s.money < tuition) return { ok: false, msg: 'I don\'t have enough money (' + fmt(tuition) + ' needed).' };
      addMoney(-tuition);
      enroll('uni', { major: major, funding: 'savings' });
      return { ok: true, msg: 'I paid ' + fmt(tuition) + ' and enrolled at ' + s.edu.school + ' to study ' + major + '.' };
    }
    s.studentDebt += tuition;
    enroll('uni', { major: major, funding: 'loans' });
    return { ok: true, msg: 'I took out ' + fmt(tuition) + ' in student loans and enrolled at ' + s.edu.school + ' to study ' + major + '.' };
  }
  function enrollGrad(id, funding) {
    var s = S(), gs = D.GRAD_SCHOOLS.filter(function (g) { return g.id === id; })[0];
    var bach = s.degrees.filter(function (d) { return d.type === 'bachelor'; });
    if (!bach.length) return { ok: false, msg: 'I need a bachelor\'s degree first.' };
    if (gs.majors && !bach.some(function (b) { return gs.majors.indexOf(b.major) >= 0; })) return { ok: false, msg: gs.name + ' requires a pre-med major (' + gs.majors.join(', ') + ').' };
    if (hasDegree(id)) return { ok: false, msg: 'I already have this degree.' };
    var chanceIn = U.clamp((me().smarts - gs.minSmarts + 25) / 50 + ((s.lastGrade || 60) - 70) / 100, 0.05, 0.95);
    if (!U.chance(chanceIn)) return { ok: false, msg: 'I was rejected from ' + gs.name + '. 😞' };
    var cost = $(gs.cost) * gs.years;
    var major = id === 'phd' ? bach[bach.length - 1].major : null;
    if (cost > 0) {
      if (funding === 'savings') {
        if (s.money < cost) return { ok: false, msg: 'I don\'t have enough money (' + fmt(cost) + ').' };
        addMoney(-cost);
      } else s.studentDebt += cost;
    }
    enroll('grad', { grad: id, major: major, school: U.pick(SCHOOL_WORDS) + ' ' + gs.name.replace(' (MBA)', '').replace('Graduate School (PhD)', 'Graduate School') });
    return { ok: true, msg: 'I was accepted to ' + s.edu.school + '! ' + (cost ? (funding === 'savings' ? 'I paid ' : 'I borrowed ') + fmt(cost) + '.' : 'My PhD is fully funded.') };
  }
  function dropOut() {
    var s = S(), e = s.edu;
    if (!e) return;
    log('I dropped out of ' + e.school + '.', 'bad');
    s.flags.dropout = true;
    s.edu = null;
  }

  // ---------- jobs ----------
  function jobSalary(job) {
    if (job.partTime) return $(D.PART_TIME.filter(function (p) { return p.id === job.career; })[0].salary);
    var c = D.career(job.career);
    return Math.round($(c.levels[job.level][1]) * (job.mult || 1));
  }
  function jobTitle(job) {
    if (!job) return 'Unemployed';
    if (job.partTime) return D.PART_TIME.filter(function (p) { return p.id === job.career; })[0].name + ' (part-time)';
    return D.career(job.career).levels[job.level][0];
  }
  function statValue(key) {
    var m = me();
    return key === 'athl' ? m.athl : m[key];
  }
  function eligible(c) {
    var s = S(), m = me(), reasons = [];
    if (m.age < c.minAge) reasons.push('Must be ' + c.minAge + '+');
    if (c.maxAge && m.age > c.maxAge) reasons.push('Too old');
    if (c.edu && c.edu !== 'none') {
      if (c.edu === 'hs' && eduRank() < 1) reasons.push('Needs high school diploma');
      if (c.edu === 'bachelor' && !hasDegree('bachelor', c.majors)) reasons.push(c.majors ? 'Needs degree in ' + c.majors.join('/') : 'Needs a bachelor\'s degree');
      if (['law', 'med', 'mba', 'phd'].indexOf(c.edu) >= 0 && !hasDegree(c.edu)) reasons.push('Needs ' + { law: 'law degree', med: 'medical degree', mba: 'an MBA', phd: 'a PhD' }[c.edu]);
    }
    if (c.minStat && statValue(c.stat) < c.minStat) reasons.push('Not enough ' + statLabel(c.stat));
    if (c.noRecord && s.record.length) reasons.push('Criminal record');
    return reasons;
  }
  function statLabel(k) { return { happy: 'happiness', health: 'health', smarts: 'smarts', looks: 'looks', athl: 'athleticism' }[k]; }
  function applyJob(careerId) {
    var s = S(), c = D.career(careerId);
    if (eligible(c).length) return { ok: false, msg: 'I don\'t qualify: ' + eligible(c).join(', ') + '.' };
    var sv = statValue(c.stat);
    var p = 0.35 + (sv - 50) / 120 + (s.karma - 50) / 400 - (s.record.length ? 0.15 : 0);
    if (c.edu === 'none') p += 0.25;
    var exp = s.jobHistory.filter(function (h) { return h.career === careerId; }).reduce(function (a, h) { return a + h.years; }, 0);
    p += Math.min(0.2, exp * 0.03);
    if (TL.features) p += TL.features.skillBonus(careerId);
    p += Math.min(0.2, (s.internships || 0) * 0.08);
    if (!U.chance(U.clamp(p, 0.08, 0.95))) return { ok: false, msg: 'After the interview, they decided not to hire me.' };
    if (s.job) quitJob(true);
    var lvl = exp >= 4 ? Math.min(c.levels.length - 2, Math.floor(exp / 4)) : 0;
    s.job = { career: careerId, level: Math.max(0, lvl), perf: 55, years: 0, levelYears: 0, mult: U.randf(0.92, 1.12), company: companyName(c) };
    s.counts.jobs++;
    return { ok: true, msg: 'I got the job! I\'m now ' + an(jobTitle(s.job)) + ' at ' + s.job.company + ', earning ' + fmt(jobSalary(s.job)) + '/yr.' };
  }
  function applyPartTime(id) {
    var s = S(), pt = D.PART_TIME.filter(function (p) { return p.id === id; })[0];
    if (me().age < pt.minAge) return { ok: false, msg: 'I\'m too young for that job.' };
    if (pt.minStat && statValue(pt.stat) < pt.minStat) return { ok: false, msg: 'They wanted someone more qualified.' };
    if (!U.chance(0.75)) return { ok: false, msg: 'They hired someone else.' };
    if (s.job) quitJob(true);
    s.job = { career: id, partTime: true, level: 0, perf: 55, years: 0, levelYears: 0, company: U.pick(['Local', 'Corner', 'Main Street', 'Downtown']) + ' ' + U.pick(['Shop', 'Co.', 'Services', 'Market']) };
    return { ok: true, msg: 'I was hired as ' + an(pt.name) + '! It pays about ' + fmt($(pt.salary)) + '/yr.' };
  }
  var CO_A = ['Apex', 'Blue', 'Summit', 'Vertex', 'Pioneer', 'Nova', 'Liberty', 'Crescent', 'Evergreen', 'Atlas', 'Iron', 'Golden', 'Northstar', 'Harbor'];
  var CO_B = { software: 'Labs', accountant: 'Accounting', teacher: 'Academy', nurse: 'Medical Center', doctor: 'Hospital', surgeon: 'Hospital', lawyer: 'Law Group', finance: 'Capital', executive: 'Holdings', military: 'Army', police: 'Police Dept.', firefighter: 'Fire Dept.' };
  function companyName(c) {
    if (c.id === 'military') return 'the Army';
    if (c.id === 'police') return 'the ' + U.pick(SCHOOL_WORDS) + ' Police Department';
    if (c.id === 'judge') return 'the Courts';
    return U.pick(CO_A) + ' ' + (CO_B[c.id] || U.pick(['Group', 'Inc.', 'Corp.', 'Partners', 'Co.', 'Industries']));
  }
  function quitJob(silent) {
    var s = S();
    if (!s.job) return;
    s.jobHistory.push({ career: s.job.career, title: jobTitle(s.job), years: s.job.years, company: s.job.company });
    if (!silent) log('I quit my job as ' + an(jobTitle(s.job)) + '.');
    s.job = null;
  }
  function fire(reason) {
    var s = S();
    log('I was fired from my job as ' + an(jobTitle(s.job)) + '. ' + (reason || ''), 'bad');
    s.jobHistory.push({ career: s.job.career, title: jobTitle(s.job), years: s.job.years, fired: true });
    s.job = null;
    stat('happy', -20);
  }
  function retire() {
    var s = S();
    if (!s.job || s.job.partTime) return { ok: false, msg: 'I have nothing to retire from.' };
    if (me().age < 55) return { ok: false, msg: 'I\'m too young to retire.' };
    var total = s.jobHistory.reduce(function (a, h) { return a + h.years; }, 0) + s.job.years;
    s.pension = Math.round(jobSalary(s.job) * Math.min(0.7, 0.012 * total + (s.job.years >= 10 ? 0.15 : 0)));
    var msg = 'I retired from my career as ' + an(jobTitle(s.job)) + '. My pension is ' + fmt(s.pension) + '/yr.';
    quitJob(true);
    s.retired = true;
    achieve('retired');
    return { ok: true, msg: msg };
  }
  function progressJob() {
    var s = S(), j = s.job;
    if (!j || s.prison) return 0;
    j.years++; j.levelYears++;
    var earned = jobSalary(j);
    if (j.partTime) return earned;
    if (j.politics) return politicsYear(j, earned);
    var c = D.career(j.career);
    j.perf = U.clamp(Math.round(j.perf + U.rand(-10, 8) + (statValue(c.stat) - 50) / 15 + (j.workHard || 0) * 4 - (me().happy < 20 ? 6 : 0) - (hasCondition('Alcoholism') ? 8 : 0) + (TL.features ? TL.features.skillBonus(j.career) * 12 : 0)), 0, 100);
    j.workHard = 0;
    if (j.fame) return earned;
    if (j.level < c.levels.length - 1 && j.perf >= 70 && j.levelYears >= 2 && U.chance(0.35 + (j.perf - 70) / 60)) {
      j.level++; j.levelYears = 0; j.perf = Math.max(45, j.perf - 20);
      log('📈 I was promoted to ' + jobTitle(j) + '! New salary: ' + fmt(jobSalary(j)) + '.', 'good');
      stat('happy', 10);
      if (j.level === c.levels.length - 1) achieve('ceo');
    } else if (j.perf < 15 && U.chance(0.5)) {
      fire('My performance was terrible.');
    } else if (j.perf < 30) {
      log('My boss warned me that my performance at work is slipping.', 'bad');
    } else if (U.chance(0.25)) j.mult = (j.mult || 1) * U.randf(1.01, 1.05);
    return earned;
  }

  // ---------- politics ----------
  // j.perf is the approval rating; j.term counts down to the next election.
  function politicsYear(j, earned) {
    var m = me();
    j.perf = U.clamp(Math.round(j.perf + U.rand(-9, 6) + (j.workHard || 0) * 4 + (S().karma - 50) / 20 + (m.smarts - 50) / 25), 0, 100);
    j.workHard = 0;
    j.term--;
    fame(j.level + U.rand(0, 2));
    if (j.perf < 12 && U.chance(0.35)) {
      log('🗳️ Voters recalled me from office. My approval rating was ' + j.perf + '%.', 'bad');
      quitJob(true); stat('happy', -20);
      return earned;
    }
    if (j.term <= 0) queue('reelection');
    else if (j.perf < 30) log('📉 My approval rating has fallen to ' + j.perf + '%.', 'bad');
    return earned;
  }
  var CAMPAIGNS = [['Grassroots campaign', 0, 0], ['Modest campaign', 20000, 0.08], ['Big campaign', 250000, 0.17], ['Massive media blitz', 2000000, 0.28]];
  function campaignCost(tier, level) { return $(CAMPAIGNS[tier][1] * (level + 1)); }
  function electionChance(level, tier, incumbent) {
    var s = S(), m = me();
    var p = 0.24 + (m.looks - 50) / 220 + (m.smarts - 50) / 260 + (s.karma - 50) / 220 + s.fame / 350 + CAMPAIGNS[tier][2];
    p -= level * 0.14 + (s.record.length ? 0.3 : 0);
    if (level >= 3) p += s.fame / 300 - 0.18; // national office needs name recognition
    if (incumbent) p = 0.15 + incumbent.perf / 110 + CAMPAIGNS[tier][2] / 2;
    return U.clamp(p, 0.03, 0.93);
  }
  function runForOffice(level, tier) {
    var s = S(), c = D.POLITICS, j = s.job, m = me();
    var office = c.levels[level][0];
    if (m.age < c.minAge + level * 3) return { ok: false, msg: 'I must be at least ' + (c.minAge + level * 3) + ' to run for ' + office + '.' };
    if (level > 0 && !(j && j.politics && j.level === level - 1)) return { ok: false, msg: 'I need to hold the office of ' + c.levels[level - 1][0] + ' first.' };
    if (s.royal) return { ok: false, msg: 'Members of the royal family must stay out of politics.' };
    if (s.flags.nextRun && s.year < s.flags.nextRun) return { ok: false, msg: 'I just lost an election. My party wants me to wait until ' + s.flags.nextRun + ' before running again.' };
    var cost = campaignCost(tier, level);
    if (s.money < cost) return { ok: false, msg: 'I can\'t afford that campaign (' + fmt(cost) + ').' };
    addMoney(-cost);
    var opp = makePerson({ age: m.age + U.rand(-10, 15) });
    if (!U.chance(electionChance(level, tier))) {
      fame(2);
      s.flags.nextRun = s.year + (level >= 3 ? 4 : 2);
      if (j && j.politics) j.perf = Math.max(0, j.perf - 8);
      return { ok: false, msg: '🗳️ I lost the election for ' + office + ' to ' + fullName(opp) + '.' };
    }
    if (j && !j.politics) quitJob(true);
    else if (j && j.politics) s.jobHistory.push({ career: 'politician', title: jobTitle(j), years: j.years });
    s.job = { career: 'politician', politics: true, level: level, perf: U.rand(50, 65), years: 0, levelYears: 0, term: 4, terms: 1, mult: 1,
      company: level === 4 ? 'the nation' : level === 3 ? 'the Senate' : level === 2 ? 'the state' : level === 1 ? U.pick(SCHOOL_WORDS) + ' City Hall' : 'the ' + U.pick(SCHOOL_WORDS) + ' City Council' };
    fame(5 + level * 6);
    stat('happy', 15);
    if (level === c.levels.length - 1) achieve('ceo');
    return { ok: true, msg: '🗳️ I won the election! I\'m now ' + (level === 4 ? 'the President' : an(office)) + ', defeating ' + fullName(opp) + '.' };
  }
  function reelect(tier) {
    var s = S(), j = s.job;
    var cost = campaignCost(tier, j.level);
    if (s.money < cost) tier = 0, cost = 0;
    addMoney(-cost);
    if (U.chance(electionChance(j.level, tier, j))) {
      j.term = 4; j.terms++;
      j.perf = U.clamp(j.perf + 8, 0, 100);
      stat('happy', 10);
      return { text: '🗳️ I won re-election as ' + jobTitle(j) + '! (term ' + j.terms + ')', cls: 'good' };
    }
    var t = jobTitle(j);
    quitJob(true); stat('happy', -15);
    return { text: '🗳️ I lost my re-election bid. I\'m no longer ' + t + '.', cls: 'bad' };
  }

  // ---------- fame careers ----------
  function fameProgress() {
    var s = S(), j = s.job;
    if (!j || !j.fame || s.prison) { if (s.fame > 0 && U.chance(0.6)) fame(-U.rand(1, 4)); return; }
    var c = D.career(j.career);
    var drive = (statValue(c.stat) - 50) / 10 + (j.workHard || 0) * 3 + U.rand(-6, 9);
    fame(drive / 2);
    if (j.level < c.levels.length - 1 && U.chance(0.12 + s.fame / 250 + j.perf / 400)) {
      j.level++;
      fame(U.rand(6, 15));
      log('🌟 My career took off: I\'m now ' + an(jobTitle(j)) + '!', 'good');
      if (j.level === c.levels.length - 1) achieve('ceo');
    }
    if (c.id === 'athlete' && me().age > 34 && U.chance(0.35)) {
      log('Age caught up with me. My pro sports career is over.', 'bad');
      s.retired = false; quitJob(true); return;
    }
    if (s.fame >= 80) achieve('famous');
  }
  function fameAudition(id) {
    var s = S(), c = D.career(id), m = me();
    if (m.age < c.minAge) return { ok: false, msg: 'I\'m too young.' };
    if (c.maxAge && m.age > c.maxAge) return { ok: false, msg: 'I\'m too old to go pro.' };
    var sv = statValue(c.stat);
    var p = (sv - 40) / 120 + s.fame / 200 + (id === 'athlete' ? (m.athl - 70) / 60 : 0.05) + (TL.features ? TL.features.skillBonus(id) : 0);
    if (!U.chance(U.clamp(p, 0.03, 0.85))) {
      return { ok: false, msg: { actor: 'The casting director said I wasn\'t right for the role.', musician: 'No labels responded to my demo.', athlete: 'I didn\'t make the team.' }[id] };
    }
    if (s.job && !(s.job.partTime && m.age < 18)) quitJob(true);
    if (s.job && s.job.partTime) quitJob(true);
    s.job = { career: id, level: 0, perf: 60, years: 0, levelYears: 0, fame: true, mult: 1, company: id === 'athlete' ? 'the ' + U.pick(['Tigers', 'Sharks', 'Wolves', 'Titans', 'Falcons', 'Kings', 'Rangers']) + ' (' + U.pick(D.SPORTS) + ')' : id === 'musician' ? U.pick(D.GENRES) + ' scene' : 'Hollywood' };
    fame(5);
    return { ok: true, msg: { actor: 'I landed a role as an Extra! My acting career begins. 🎬', musician: 'I started performing ' + s.job.company.replace(' scene', '') + ' music! 🎤', athlete: 'I made the team: ' + s.job.company + '! 🏅' }[id] };
  }

  // ---------- money ----------
  function yearlyFinances(earned) {
    var s = S(), m = me(), c = country(), lines = [];
    var income = 0, expense = 0;
    if (earned) {
      var net = Math.round(earned * (1 - (s.job && s.job.partTime ? c.tax * 0.5 : c.tax)));
      income += net;
      lines.push('Salary ' + fmt(net));
    }
    if (s.retired && s.pension) { income += s.pension; lines.push('Pension ' + fmt(s.pension)); }
    if (s.social.platform && s.followers >= 10000) income += $(Math.round(s.followers * 0.01));
    // cost of living
    if (m.age >= 18 && !s.prison) {
      var homes = s.assets.filter(function (a) { return a.kind === 'house' && !a.rented; });
      var living = $(9000);
      if (!homes.length && !(s.edu && s.edu.funding === 'parents')) living += $(11000);
      if (s.edu && (s.edu.stage === 'uni' || s.edu.stage === 'grad') && s.edu.funding === 'loans') {
        s.studentDebt += living; living = 0;
      }
      expense += living;
      var kidsHome = people('child').filter(function (p) { return p.age < 18; }).length;
      expense += kidsHome * $(9000);
    }
    // student debt repayments
    if (s.studentDebt > 0 && !s.edu) {
      var pay = Math.min(s.studentDebt, Math.max($(3000), Math.round(s.studentDebt * 0.1)));
      s.studentDebt = Math.round(s.studentDebt * 1.04) - pay;
      if (s.studentDebt < 0) s.studentDebt = 0;
      expense += pay;
    }
    // assets
    s.assets.forEach(function (a) {
      if (a.kind === 'house') {
        a.value = Math.round(a.value * U.randf(0.97, 1.075));
        a.cond = U.clamp(a.cond - U.rand(1, 5), 0, 100);
        expense += Math.round(a.value * (a.upkeep || 0.013));
        if (a.rented) { var r = Math.round(a.value * 0.055); income += r; a.rentIncome = r; }
      } else if (a.kind === 'car') {
        a.value = Math.round(a.value * (a.type === 'Private Jet' || a.type === 'Superyacht' ? 0.93 : 0.86));
        a.cond = U.clamp(a.cond - U.rand(3, 10), 0, 100);
        expense += Math.round(a.price * 0.03);
      } else if (a.kind === 'business') {
        var b = D.BUSINESS_TYPES.filter(function (x) { return x.type === a.type; })[0];
        var margin = U.gauss(b.base * 0.35, b.volatile ? 0.35 : 0.15) + (a.hype || 0) * 0.02;
        var profit = Math.round(a.value * margin * 0.5);
        a.value = Math.max($(1000), Math.round(a.value * (1 + U.gauss(b.volatile ? 0.08 : 0.03, b.volatile ? 0.35 : 0.1))));
        a.lastProfit = profit; income += profit;
        a.hype = 0;
        if (a.value < a.price * 0.15 && U.chance(0.3)) { a.bankrupt = true; }
      } else if (a.kind === 'jewelry') {
        a.value = Math.round(a.value * U.randf(0.98, 1.05));
      }
      if (a.loan) {
        var p = Math.min(a.loan, a.payment);
        a.loan = Math.round(a.loan * 1.045 - p);
        if (a.loan < 50) a.loan = 0;
        expense += p;
      }
    });
    s.assets.filter(function (a) { return a.bankrupt; }).forEach(function (a) { log('💸 My business "' + a.name + '" went bankrupt and closed.', 'bad'); stat('happy', -20); });
    s.assets = s.assets.filter(function (a) { return !a.bankrupt; });
    // pets
    expense += s.pets.length * $(700);

    addMoney(income - expense);
    if (income || expense) log('💵 ' + [income ? 'Income ' + fmt(income) : '', expense ? 'Expenses ' + fmt(expense) : ''].filter(Boolean).join(' · '), 'money');
    if (s.money < 0) {
      stat('happy', -8);
      if (s.money < -$(20000) && U.chance(0.35)) bankruptcy();
      else log('I\'m in debt. Creditors keep calling me.', 'bad');
    }
    // stock market
    D.STOCKS.forEach(function (st) {
      var change = U.gauss(st.drift, st.vol);
      s.prices[st.sym] = Math.max(0.01 * k(), Math.round(s.prices[st.sym] * (1 + change) * 100) / 100);
    });
  }
  function bankruptcy() {
    var s = S();
    log('⚖️ I declared bankruptcy. My assets were seized.', 'bad');
    s.assets = s.assets.filter(function (a) { return a.kind === 'house' && a.loan === 0 && a.value < $(150000); });
    s.stocks = {};
    s.money = 0; s.flags.bankrupt = (s.flags.bankrupt || 0) + 1;
    stat('happy', -25);
  }

  // ---------- health ----------
  function yearlyHealth() {
    var s = S(), m = me(), a = m.age, life = country().life;
    // aging: health drifts toward an age-based baseline, then illnesses bite
    var base = a < 30 ? 95 : a < 50 ? 90 - (a - 30) * 0.4 : a < 70 ? 82 - (a - 50) * 0.9 : Math.max(20, 64 - (a - 70) * 1.8);
    if (m.athl > 60) base += 4;
    if (m.health < base) stat('health', (base - m.health) / 3);
    else stat('health', -U.rand(0, a > 60 ? 3 : 1));
    if (a > 35 && U.chance(0.5)) stat('looks', -U.rand(0, a > 60 ? 3 : 1));
    if (a > 30 && U.chance(0.5)) m.athl = U.clamp(m.athl - U.rand(0, a > 55 ? 3 : 1), 0, 100);
    if (a < 18 && U.chance(0.5)) m.athl = U.clamp(m.athl + U.rand(0, 2), 0, 100);
    if (a < 16 && U.chance(0.3)) stat('looks', U.rand(-3, 4));
    if (a >= 12 && a <= 18 && U.chance(0.25)) stat('looks', U.rand(-4, 6));
    // existing conditions
    s.conditions.slice().forEach(function (n) {
      var ill = D.illness(n);
      if (!ill) return;
      stat('health', -ill.dmg * (a > 70 && ill.oldRisk ? 1.5 : a < 40 ? 0.6 : 1));
      if (ill.happy) stat('happy', ill.happy / 2);
      if (ill.looks) stat('looks', ill.looks / 2);
      if (ill.smarts) stat('smarts', ill.smarts / 2);
      var heal = ill.selfHeal != null ? ill.selfHeal : (ill.incurable || ill.addiction ? 0 : 0.2);
      if (heal && U.chance(heal)) { removeCondition(n); log('I recovered from ' + n.toLowerCase() + '.'); }
    });
    // new illnesses
    D.ILLNESSES.forEach(function (ill) {
      if (!ill.p || a < ill.minAge || (ill.maxAge && a > ill.maxAge) || hasCondition(ill.name)) return;
      var p = ill.p * (m.health < 40 ? 1.8 : 1) * (ill.oldRisk && a > 65 ? 2.5 : 1);
      if (U.chance(p)) {
        addCondition(ill.name);
        log('🤒 I was diagnosed with ' + ill.name.toLowerCase() + '.', 'bad');
      }
    });
    // happiness drift
    var target = 55 + (s.money > $(100000) ? 5 : 0) + (partner() ? 7 : 0) + (s.job || s.edu || a < 18 || s.retired ? 3 : -8) - (s.prison ? 25 : 0) - s.conditions.length * 3;
    stat('happy', (target - m.happy) / 6 + U.rand(-4, 4));
    if (s.fame > 60 && U.chance(0.3)) stat('happy', U.rand(-6, 6));
  }
  function deathCheck() {
    var s = S(), m = me(), a = m.age, life = country().life + (s.karma - 50) / 10;
    if (m.health <= 0) {
      var c = s.conditions.filter(function (n) { var i = D.illness(n); return i && i.dmg >= 8; })[0];
      return die(c ? 'complications from ' + c.toLowerCase() : 'poor health');
    }
    var hazard;
    if (a < 5) hazard = 0.001;
    else if (a < 40) hazard = 0.0008;
    else hazard = 0.012 * Math.exp((a - life) / 5.5);
    hazard *= 1.6 - m.health / 100;
    if (a > 110) hazard = 0.8;
    if (U.chance(Math.min(hazard, 0.75))) {
      if (a < 45) return die(U.pick(['a car accident', 'a freak accident', 'a sudden aneurysm', 'a heart defect nobody knew about']));
      return die(U.pick(['natural causes', 'old age', 'heart failure', 'a stroke', 'peacefully in my sleep']));
    }
    return false;
  }
  function die(cause) {
    var s = S();
    s.dead = true; s.cause = cause;
    log('💀 I died from ' + cause + ' at the age of ' + me().age + '.', 'bad');
    if (me().age >= 100) achieve('centenarian');
    recordHistory();
    return true;
  }

  // ---------- people each year ----------
  function yearlyPeople() {
    var s = S(), m = me();
    s.people.forEach(function (p) {
      if (!p.alive) return;
      p.age++;
      // relationship decay
      if (['classmate', 'coworker', 'former classmate'].indexOf(p.role) < 0) {
        var decay = p.role === 'spouse' || p.role === 'partner' || p.role === 'fiance' ? U.rand(1, 6) : U.rand(0, 4);
        rel(p, -decay);
      }
      if (p.age === 5 && p.job === 'Toddler') p.job = 'Student';
      if (p.age === 18 && p.job === 'Student') p.job = U.chance(0.5) ? 'University Student' : npcJob(24);
      if (p.age === 23 && p.job === 'University Student') p.job = npcJob(26);
      if (p.age === 67 && p.job !== 'Retired' && U.chance(0.7)) p.job = 'Retired';
      p.money = Math.round(p.money * 1.02 + (p.age >= 18 && p.job !== 'Unemployed' && p.job !== 'Student' ? $(U.rand(1000, 8000)) : 0));
      // death
      var hazard = p.age < 50 ? 0.0015 : 0.005 * Math.exp((p.age - 78) / 7);
      if (U.chance(Math.min(0.8, hazard))) {
        p.alive = false; p.died = s.year;
        var cause = p.age > 70 ? U.pick(['natural causes', 'a heart attack', 'cancer', 'a stroke', 'pneumonia']) : U.pick(['a car accident', 'cancer', 'an overdose', 'a heart attack', 'a boating accident']);
        var close = ['mother', 'father', 'sibling', 'spouse', 'child', 'grandparent', 'partner', 'fiance', 'grandchild'].indexOf(p.role) >= 0;
        log('⚰️ My ' + (p.role === 'friend' ? 'friend' : p.role) + ' ' + fullName(p) + ' died from ' + cause + ' at age ' + p.age + '.', close ? 'bad' : '');
        if (close) { stat('happy', -U.rand(10, 25)); queue('funeral', { pid: p.id }); }
        if (TL.features) TL.features.onDeath(p);
        if (['mother', 'father', 'grandparent', 'spouse'].indexOf(p.role) >= 0 && p.money > 0) inherit(p);
      }
    });
    // A younger sibling may be born while I'm small
    var mom = people('mother')[0], dad = people('father')[0];
    if (mom && dad && mom.married && mom.age < 42 && m.age < 12 && U.chance(0.12)) {
      var baby = addPerson({ role: 'sibling', age: 0, last: dad.last, rel: 60, money: 0, job: 'Toddler' });
      log('👶 My mother gave birth to a baby ' + (baby.gender === 'M' ? 'brother' : 'sister') + ', ' + baby.first + '!', 'good');
    }
    // Parents may divorce
    if (mom && dad && mom.married && U.chance(0.015)) {
      mom.married = dad.married = false;
      log('💔 My parents got divorced.', 'bad');
      stat('happy', -10);
    }
    // Adult children marry and have kids of their own (grandchildren).
    people('child').forEach(function (c) {
      if (c.age >= 22 && c.age <= 45 && !c.married && U.chance(0.09)) {
        var sp = addPerson({ role: 'in-law', age: U.clamp(c.age + U.rand(-4, 4), 20, 60), gender: c.gender === 'M' ? 'F' : 'M', rel: U.rand(35, 70) });
        sp.spouseOf = c.id; c.married = true;
        log('💒 My ' + (c.gender === 'M' ? 'son' : 'daughter') + ' ' + c.first + ' married ' + fullName(sp) + '.', 'good');
        stat('happy', 5);
      }
      var gkids = people('grandchild').filter(function (g) { return g.parentId === c.id; }).length;
      if (c.married && c.age <= 42 && gkids < 4 && U.chance(0.16)) {
        var g = addPerson({ role: 'grandchild', age: 0, last: c.gender === 'M' ? c.last : U.pick([c.last, randomName('M').last]), rel: U.rand(60, 85), money: 0, job: 'Toddler' });
        g.parentId = c.id;
        log('👶 My ' + (c.gender === 'M' ? 'son' : 'daughter') + ' ' + c.first + ' had a baby ' + (g.gender === 'M' ? 'boy' : 'girl') + ', ' + g.first + '! I\'m a grandparent' + (gkids ? ' again' : '') + '!', 'good');
        stat('happy', 8);
      }
    });
    // Pregnancy resolution
    if (s.flags.pregnant) {
      var other = person(s.flags.pregnant.with);
      delete s.flags.pregnant;
      haveBaby(other);
    }
    // Pets
    s.pets.forEach(function (pet) {
      pet.age++;
      pet.rel = U.clamp(pet.rel - U.rand(0, 5), 0, 100);
      if (pet.age > pet.life - 2 && U.chance(0.35 + (pet.age - pet.life) * 0.2)) {
        pet.dead = true;
        log('🐾 My ' + pet.species.toLowerCase() + ' ' + pet.name + ' passed away.', 'bad');
        stat('happy', -10);
      }
    });
    s.pets = s.pets.filter(function (p) { return !p.dead; });
    // NPC relationship drama with partner
    var pt = partner();
    if (pt && pt.rel < 15 && U.chance(0.4)) {
      if (pt.role === 'spouse') queue('spouse_leaves', { pid: pt.id });
      else { log(pt.first + ' broke up with me. 💔', 'bad'); pt.role = 'ex'; s.counts.exes++; stat('happy', -15); }
    }
  }
  function inherit(p) {
    var s = S(), share;
    if (p.role === 'spouse') share = p.money;
    else {
      var heirs = 1 + people(['sibling']).length;
      if (p.role === 'grandparent') heirs += 2;
      share = Math.round(p.money / heirs * U.randf(0.6, 1));
      if (p.rel < 25) share = Math.round(share * 0.2);
    }
    if (share > $(100)) {
      addMoney(share);
      log('📜 I inherited ' + fmt(share) + ' from ' + p.first + '.', 'good');
    }
  }
  function haveBaby(other) {
    var s = S();
    var last = me().last;
    var baby = addPerson({ role: 'child', age: 0, last: last, rel: 90, money: 0, job: 'Toddler' });
    baby.otherParent = other ? other.id : null;
    s.counts.kids++;
    log('👶 ' + (me().gender === 'F' ? 'I gave birth to' : (other ? other.first + ' gave birth to' : 'I welcomed')) + ' a baby ' + (baby.gender === 'M' ? 'boy' : 'girl') + ' named ' + baby.first + '!', 'good');
    stat('happy', 15);
    achieve('parent');
    if (people('child', true).length >= 5) achieve('bigfamily');
    return baby;
  }

  // ---------- prison ----------
  function yearlyPrison() {
    var s = S();
    if (!s.prison) return;
    s.prison.remaining--;
    s.prison.served++;
    stat('happy', -U.rand(2, 8));
    if (s.prison.remaining <= 0) {
      log('🔓 I was released from ' + s.prison.name + ' after serving ' + U.plural(s.prison.served, 'year') + '.', 'good');
      s.prison = null;
      stat('happy', 20);
    } else if (U.chance(0.1)) {
      log('I got into a fight with another inmate.', 'bad'); stat('health', -U.rand(5, 20));
    }
  }
  function jail(years, crime) {
    var s = S();
    if (years <= 0) {
      log('I got off with a warning and a fine.', 'bad');
      addMoney(-$(U.rand(200, 1500)));
      s.record.push({ crime: crime, year: s.year, years: 0 });
      return;
    }
    s.record.push({ crime: crime, year: s.year, years: years });
    s.prison = { remaining: years, total: years, served: 0, crime: crime, name: U.pick(['Blackrock', 'Ironwood', 'Stonegate', 'Redfield', 'Graymoor', 'Kingsbridge']) + (me().age < 18 ? ' Juvenile Detention Center' : ' State Penitentiary'), appealed: false };
    if (s.job) fire('Being sent to prison cost me my job.');
    if (s.edu) { log('I was expelled from ' + s.edu.school + '.', 'bad'); s.edu = null; }
    log('⛓️ I was sentenced to ' + U.plural(years, 'year') + ' in ' + s.prison.name + ' for ' + crime.toLowerCase() + '.', 'bad');
    stat('happy', -30);
    achieve('jailbird');
    var pt = partner();
    if (pt && U.chance(0.4)) { log(pt.first + ' left me after hearing I was going to prison.', 'bad'); pt.role = 'ex'; s.counts.exes++; }
  }

  // ---------- event queue ----------
  function queue(id, data) { S().pending.push({ id: id, data: data || {} }); }

  // ---------- achievements ----------
  function checkAchievements() {
    var s = S(), nw = netWorth(), m = me();
    if (nw >= 1e6) achieve('millionaire');
    if (nw >= 1e9) achieve('billionaire');
    if (s.assets.some(function (a) { return a.kind === 'house'; })) achieve('homeowner');
    if (s.assets.filter(function (a) { return a.kind === 'house'; }).length >= 5) achieve('mogul');
    if (s.followers >= 1e6) achieve('influencer');
    if (s.pets.length >= 3) achieve('petlover');
    if (s.counts.vacations >= 5) achieve('globetrotter');
    if (s.karma >= 95) achieve('saint');
    if (s.karma <= 5) achieve('villain');
    if (m.athl >= 95) achieve('gymrat');
    if (m.smarts >= 100) achieve('genius');
    if (s.counts.exes >= 10) achieve('heartbreaker');
    if (s.gen >= 3) achieve('dynasty');
    if (s.fame >= 80) achieve('famous');
  }

  // ---------- age up ----------
  function ageUp() {
    var s = S(), m = me();
    if (s.dead) return;
    m.age++; s.year++;
    s.yearActs = {};
    s.log.push({ age: m.age, year: s.year, entries: [] });

    yearlyPrison();
    progressSchool();
    var earned = progressJob();
    fameProgress();
    if (m.age >= 16 || s.money !== 0 || s.assets.length) yearlyFinances(earned);
    yearlyHealth();
    yearlyPeople();
    if (TL.features) TL.features.yearly();
    if (m.age === 18 && !s.prison) log('I\'m officially an adult now! 🎉');
    // Allowance for kids from parents
    if (m.age >= 6 && m.age < 18 && !s.prison) {
      var par = people(['mother', 'father']).filter(function (p) { return p.rel > 50 && p.money > $(20000); })[0];
      if (par && U.chance(0.5)) { var al = $(U.rand(50, 600)) * (s.flags.wealth === 'rich' ? 10 : 1); addMoney(al); }
    }
    // social media passive growth
    if (s.social.platform && s.followers > 0) {
      s.followers = Math.max(0, Math.round(s.followers * U.randf(0.9, 1.2) + s.fame * U.rand(50, 500)));
    }
    if (m.age >= 18 && people('friend').length < 1 && U.chance(0.3)) {
      var f = addPerson({ role: 'friend', age: m.age + U.rand(-4, 4), rel: U.rand(40, 70) });
      log('I made a new friend, ' + fullName(f) + '.');
    }
    if (!s.edu && m.age >= 18 && people('coworker').length < 2 && s.job && !s.job.partTime) {
      addPerson({ role: 'coworker', age: m.age + U.rand(-10, 15), rel: U.rand(30, 60) });
    }
    if (!s.job) people('coworker').forEach(function (p) { p.role = 'former coworker'; });

    TL.events.roll();
    // Yearly snapshot for the life chart.
    s.hist = s.hist || [];
    s.hist.push([m.age, netWorth(), m.happy]);
    if (s.hist.length > 130) s.hist.shift();
    if (!deathCheck()) checkAchievements();
    s.updated = Date.now();
  }

  // ---------- legacy / continue as child ----------
  function heirs() {
    var kids = people('child');
    if (kids.length) return kids;
    // No living children: the family line can continue through a grandchild.
    return people('grandchild');
  }
  function continueAs(childId) {
    var s = S(), c = person(childId);
    var worth = Math.max(0, netWorth());
    var kids = heirs();
    var viaGrandchild = c.role === 'grandchild';
    var estateTax = worth > $(5000000) ? 0.35 : 0.05;
    var share = TL.features ? TL.features.willShare(c, kids) : (kids.length ? 1 / kids.length : 1);
    var inheritance = Math.round(worth * (1 - estateTax) * share * (c.rel > 30 ? 1 : 0.5));
    var dead = me();
    var newPeople = [];
    // the dead player becomes a (dead) parent or grandparent
    var parentRec = {
      id: U.uid(), first: dead.first, last: dead.last, gender: dead.gender, age: dead.age, alive: false, died: s.year,
      role: viaGrandchild ? 'grandparent' : dead.gender === 'M' ? 'father' : 'mother', rel: c.rel, happy: dead.happy, health: 0, smarts: dead.smarts,
      looks: dead.looks, money: 0, job: jobTitle(s.job), traits: []
    };
    newPeople.push(parentRec);
    if (viaGrandchild) {
      var par = person(c.parentId);
      if (par) { par.role = par.gender === 'M' ? 'father' : 'mother'; newPeople.push(par); }
      s.people.forEach(function (p) {
        if (p.role === 'in-law' && p.spouseOf === c.parentId) { p.role = p.gender === 'M' ? 'father' : 'mother'; newPeople.push(p); }
      });
      kids.forEach(function (k) { if (k.id !== c.id && k.parentId === c.parentId) { k.role = 'sibling'; newPeople.push(k); } });
    } else {
      var otherParent = c.otherParent ? person(c.otherParent) : null;
      if (otherParent) { otherParent.role = otherParent.gender === 'M' ? 'father' : 'mother'; newPeople.push(otherParent); }
      kids.forEach(function (k) { if (k.id !== c.id) { k.role = 'sibling'; newPeople.push(k); } });
      // carry forward the heir's own spouse and children
      s.people.forEach(function (p) {
        if (p.role === 'in-law' && p.spouseOf === c.id) { p.role = 'spouse'; newPeople.push(p); }
        if (p.role === 'grandchild' && p.parentId === c.id) { p.role = 'child'; p.otherParent = null; newPeople.push(p); }
      });
    }
    var gen = s.gen + 1;
    var st = newLife({
      country: s.country, gen: gen, year: s.year - c.age,
      legacy: {
        people: newPeople, money: inheritance,
        me: { first: c.first, last: c.last, gender: c.gender, age: c.age, happy: c.happy, health: c.health, smarts: c.smarts, looks: c.looks, athl: U.rand(20, 70), interest: c.gender === 'M' ? 'F' : 'M' },
        ach: s.ach.slice()
      }
    });
    st.year = s.year;
    st.log[0] = { age: c.age, year: s.year, entries: [] };
    log('👑 Generation ' + gen + ': I am ' + c.first + ' ' + c.last + ', age ' + c.age + '.');
    log('My ' + (viaGrandchild ? 'grand' : '') + (dead.gender === 'M' ? 'father' : 'mother') + ', ' + dead.first + ', died from ' + s.cause + '.');
    if (inheritance > 0) log('📜 I inherited ' + fmt(inheritance) + ' from ' + his(dead) + ' estate.', 'good');
    if (c.age >= 6 && c.age < 18) { st.edu = null; enroll(c.age < 11 ? 'elementary' : c.age < 14 ? 'middle' : 'high'); st.edu.year = c.age - (c.age < 11 ? 5 : c.age < 14 ? 10 : 13); }
    if (c.age >= 18) st.degrees.push({ type: 'hs' });
    st.flags.wealth = inheritance > $(1000000) ? 'rich' : 'middle';
    if (gen >= 3) achieve('dynasty');
    if (TL.features) TL.features.inherit(s, c, st, kids);
    return st;
  }

  // ---------- history & persistence ----------
  function ribbon() {
    var s = S(), m = me(), nw = netWorth();
    var r = [];
    if (nw >= $(50000000)) r.push(['💎', 'Tycoon', 'Died with a fortune.']);
    else if (nw >= $(2000000)) r.push(['💰', 'Rich', 'Lived a wealthy life.']);
    if (s.royal && s.royal.monarch) r.push(['👑', 'Monarch', 'Ruled the realm.']);
    if (s.mob && s.mob.rank >= 4) r.push(['🕴️', 'Kingpin', 'Ran the underworld.']);
    if (s.awards && s.awards.length) r.push(['🏆', 'Acclaimed', 'Honored with the ' + s.awards[0].award + '.']);
    if (s.fame >= 70) r.push(['⭐', 'Famous', 'The world knew my name.']);
    if (s.books && s.books.some(function (b) { return b.quality >= 85; })) r.push(['📚', 'Author', 'Wrote a bestseller.']);
    if (s.record.length >= 3) r.push(['🦹', 'Criminal', 'Crime was my career.']);
    if (hasDegree('phd') || hasDegree('med') || hasDegree('law')) r.push(['🎓', 'Scholar', 'A mind well educated.']);
    if (s.counts.exes >= 6) r.push(['💘', 'Heartbreaker', 'Loved and left many.']);
    if (s.counts.kids >= 4) r.push(['👨‍👩‍👧‍👦', 'Family Person', 'Raised a big family.']);
    if (m.age >= 95) r.push(['🧓', 'Ancient', 'Outlived almost everyone.']);
    if (m.age < 30) r.push(['🕯️', 'Tragic', 'Gone far too soon.']);
    if (s.karma >= 85) r.push(['😇', 'Hero', 'A truly good soul.']);
    if (s.karma <= 15) r.push(['😈', 'Villain', 'Left a trail of misery.']);
    if (s.prison && s.prison.remaining > 0) r.push(['⛓️', 'Prisoner', 'Died behind bars.']);
    if (!r.length) r.push(['🙂', 'Ordinary', 'A quiet, ordinary life.']);
    return r[0];
  }
  function recordHistory() {
    var s = S(), g = loadGlobal();
    var rb = ribbon();
    g.history.unshift({ name: me().first + ' ' + me().last, age: me().age, cause: s.cause, worth: fmt(netWorth()), ribbon: rb[0] + ' ' + rb[1], country: s.country, gen: s.gen, year: s.year });
    g.history = g.history.slice(0, 50);
    saveGlobal(g);
  }

  var store = (function () {
    try { var t = globalThis.localStorage; t.setItem('__tl', '1'); t.removeItem('__tl'); return t; }
    catch (e) { var mem = {}; return { getItem: function (k) { return mem[k] || null; }, setItem: function (k, v) { mem[k] = String(v); }, removeItem: function (k) { delete mem[k]; } }; }
  })();
  function loadGlobal() {
    try { var g = JSON.parse(store.getItem('thelife.global') || 'null'); if (g) return g; } catch (e) { }
    return { ach: [], history: [], settings: {} };
  }
  function saveGlobal(g) { try { store.setItem('thelife.global', JSON.stringify(g)); } catch (e) { } }
  function save() {
    var s = S();
    if (!s) return;
    s.updated = Date.now();
    // Trim very long logs to keep saves small.
    if (s.log.length > 130) s.log = s.log.slice(-130);
    try {
      store.setItem('thelife.save.' + s.id, JSON.stringify(s));
      var idx = listSaves().filter(function (x) { return x.id !== s.id; });
      idx.unshift({ id: s.id, name: s.me.first + ' ' + s.me.last, age: s.me.age, dead: s.dead, country: s.country, gen: s.gen, updated: s.updated });
      store.setItem('thelife.index', JSON.stringify(idx.slice(0, 12)));
      // drop saves that fell out of the index
      var keep = idx.slice(0, 12).map(function (x) { return x.id; });
      idx.slice(12).forEach(function (x) { if (keep.indexOf(x.id) < 0) store.removeItem('thelife.save.' + x.id); });
    } catch (e) { }
  }
  function wipeAll() {
    listSaves().forEach(function (x) { store.removeItem('thelife.save.' + x.id); });
    store.removeItem('thelife.index');
    store.removeItem('thelife.global');
  }
  function listSaves() {
    try { return JSON.parse(store.getItem('thelife.index') || '[]'); } catch (e) { return []; }
  }
  function load(id) {
    try {
      var s = JSON.parse(store.getItem('thelife.save.' + id));
      if (s) { TL.S = s; return s; }
    } catch (e) { }
    return null;
  }
  function deleteSave(id) {
    store.removeItem('thelife.save.' + id);
    store.setItem('thelife.index', JSON.stringify(listSaves().filter(function (x) { return x.id !== id; })));
  }

  // Full backup of every saved life plus global progress, as a portable text code.
  function exportAll() {
    var data = { app: 'thelife', v: SAVE_VERSION, global: loadGlobal(), saves: [] };
    listSaves().forEach(function (x) { var raw = store.getItem('thelife.save.' + x.id); if (raw) data.saves.push(JSON.parse(raw)); });
    return 'TL1:' + btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  }
  function importAll(code) {
    var data;
    try { data = JSON.parse(decodeURIComponent(escape(atob(String(code).trim().replace(/^TL1:/, ''))))); }
    catch (e) { return { ok: false, msg: 'That backup code is invalid or incomplete.' }; }
    if (!data || data.app !== 'thelife' || !Array.isArray(data.saves)) return { ok: false, msg: 'That isn\'t a TheLife backup code.' };
    var prev = TL.S, n = 0;
    data.saves.forEach(function (sv) {
      if (sv && sv.id && sv.me && Array.isArray(sv.log)) { TL.S = sv; save(); n++; }
    });
    TL.S = prev;
    var g = loadGlobal(), dg = data.global || {};
    (dg.ach || []).forEach(function (a) { if (g.ach.indexOf(a) < 0) g.ach.push(a); });
    g.history = (dg.history || []).concat(g.history).slice(0, 50);
    saveGlobal(g);
    return { ok: true, msg: 'Restored ' + n + ' saved ' + (n === 1 ? 'life' : 'lives') + '.' };
  }

  return {
    exportAll: exportAll, importAll: importAll, wipeAll: wipeAll,
    countryName: countryName, jobPhrase: jobPhrase, an: an,
    S: S, me: me, country: country, k: k, $: $, fmt: fmt, fullName: fullName, he: he, his: his, him: him,
    log: log, stat: stat, addMoney: addMoney, karma: karma, fame: fame, person: person, people: people,
    partner: partner, rel: rel, hasDegree: hasDegree, eduRank: eduRank, highestDegree: highestDegree,
    degreeName: degreeName, hasCondition: hasCondition, addCondition: addCondition, removeCondition: removeCondition,
    achieve: achieve, netWorth: netWorth, makePerson: makePerson, addPerson: addPerson, randomName: randomName,
    newLife: newLife, enroll: enroll, enrollUni: enrollUni, enrollGrad: enrollGrad, dropOut: dropOut, gradeLetter: gradeLetter,
    eduYears: eduYears, jobSalary: jobSalary, jobTitle: jobTitle, eligible: eligible, applyJob: applyJob,
    applyPartTime: applyPartTime, quitJob: quitJob, fire: fire, retire: retire, fameAudition: fameAudition,
    statLabel: statLabel, statValue: statValue, haveBaby: haveBaby, jail: jail, queue: queue, die: die,
    runForOffice: runForOffice, reelect: reelect, campaigns: CAMPAIGNS, campaignCost: campaignCost, electionChance: electionChance,
    ageUp: ageUp, heirs: heirs, continueAs: continueAs, ribbon: ribbon, checkAchievements: checkAchievements,
    save: save, load: load, listSaves: listSaves, deleteSave: deleteSave, loadGlobal: loadGlobal, saveGlobal: saveGlobal,
    schoolName: schoolName
  };
})();
