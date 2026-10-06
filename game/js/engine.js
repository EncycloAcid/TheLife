/* TheLife — core simulation. Operates on the current save in TL.S. */
TL.engine = (function () {
  var U = TL.util, D = TL.data;
  var SAVE_VERSION = 1;

  // ---------- small helpers ----------
  function S() { return TL.S; }
  function me() { return TL.S.me; }
  function country() { return D.country(TL.S.country); }
  // Local currency per base dollar, times the era's price level (js/history.js).
  function k() { var c = country(); return c.ancient ? c.k : c.k * (TL.history && TL.S ? TL.history.priceLevel(TL.S.year) : 1); }
  function ancient() { return TL.S && country().ancient ? country().ancient : null; }
  // "AD 79" for Roman and Viking lives, "1979" otherwise.
  // A condition's name as people of the time would say it (js/ancient.js).
  function illName(n) { return TL.S && country().ancient && TL.ancient ? TL.ancient.illName(n) : n; }
  // "a common cold", "the flu", "PTSD": an illness as it reads after "diagnosed with".
  var ILL_ART = { 'Common Cold': 'a', 'Flu': 'the', 'Ear Infection': 'an', 'Migraine': 'a', 'Broken Arm': 'a', 'Broken Leg': 'a', 'Concussion': 'a', 'Gambling Addiction': 'a', 'Nicotine Addiction': 'a' };
  // Lowercase for mid-sentence use, but keep acronyms (PTSD).
  function illLow(t) { return /^[A-Z0-9]{2,}$/.test(t) ? t : t.toLowerCase(); }
  function illWith(n) {
    var t = illName(n), low = illLow(t);
    return t === n && ILL_ART[n] ? ILL_ART[n] + ' ' + low : low;
  }
  function yearLabel(y) { var e = TL.S && country().ancient && TL.ancient && TL.ancient.era(); return e && e.ad ? 'AD ' + y : String(y); }
  // Convert a base-dollar amount into the local currency, rounded to look natural.
  function $(usd) {
    var v = usd * k();
    if (Math.abs(v) >= 1000) return Math.round(v / 10) * 10;
    return Math.round(v);
  }
  function fmt(n) { return U.money(n, country().cur); }
  // "the United States", "the Philippines"; other countries take no article.
  function countryName(n) { return (/^(United|Philippines|Roman|Kingdom)/.test(n) ? 'the ' : '') + n; }
  // "a nurse", "an engineer", "unemployed", "retired".
  function jobPhrase(job) {
    var j = job.toLowerCase();
    if (j === 'unemployed' || j === 'retired') return j;
    if (/^(emperor|empress|king|queen)$/.test(j)) return 'the ' + job;
    return (/^[aeiou]/.test(j) ? 'an ' : 'a ') + j;
  }
  function an(w) { return (/^[aeiou]/i.test(w) ? 'an ' : 'a ') + w; }
  // A Roman woman's name was her family's (Caecilia of the Caecilii), so it's said once.
  function fullName(p) { return p.first === p.last ? p.first : p.first + ' ' + p.last; }
  // "my grandmother", not "my grandparent": the role in everyday words.
  function relWord(p) {
    var r = p.role, M = p.gender === 'M';
    var w = { sibling: M ? 'brother' : 'sister', child: M ? 'son' : 'daughter', grandparent: M ? 'grandfather' : 'grandmother', grandchild: M ? 'grandson' : 'granddaughter', 'in-law': M ? 'son-in-law' : 'daughter-in-law', spouse: M ? 'husband' : 'wife', fiance: M ? 'fiancé' : 'fiancée', partner: M ? 'boyfriend' : 'girlfriend' }[r];
    return w || r;
  }
  function he(p, cap) { var w = p.gender === 'M' ? 'he' : 'she'; return cap ? U.cap(w) : w; }
  function his(p, cap) { var w = p.gender === 'M' ? 'his' : 'her'; return cap ? U.cap(w) : w; }
  function him(p) { return p.gender === 'M' ? 'him' : 'her'; }

  // Entries that differ only in numbers ("I practiced painting (4/100)" then
  // "(5/100)") collapse into the newest one with a count, keeping the log readable.
  function logKey(t) { return t.replace(/\(.*?\)/g, '').replace(/[\d.,]+/g, '#'); }
  function log(text, cls) {
    if (typeof text !== 'string' || !text) return;
    text = text.replace(/([^.])\.\.(?!\.)/g, '$1.'); // names ending in a period, like Pioneer Inc., don't double up
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

  var aging = false; // true while ageUp runs
  function stat(name, delta) {
    var m = me(), v = m[name] + delta, lo = Math.floor(v);
    // Round by chance, so small gains (a second trip to the library) still add up on average.
    // Outside the year-end death check, health bottoms out at 1 (critical): nobody
    // walks around for a year at zero health.
    m[name] = U.clamp(lo + (Math.random() < v - lo ? 1 : 0), name === 'health' && !aging ? Math.min(1, m[name]) : 0, 100);
    // Looks you work for (gym, diet, surgery, a glow-up) partly stick: a quarter
    // of the gain moves your natural baseline (see looksYear).
    if (name === 'looks' && delta > 0 && !aging) m.looksBase = Math.min(98, looksBase(m) + delta / 4);
    return m[name];
  }
  // Natural looks: genetics set at birth (never below 20), reshaped a little in
  // the teen years and fading slowly after 35.
  function looksBase(m) { if (m.looksBase == null) m.looksBase = U.clamp(m.looks, 20, 95); return m.looksBase; }
  function looksYear(m, a) {
    var b = looksBase(m);
    if (a >= 12 && a <= 18 && U.chance(0.35)) b += U.rand(-2, 3);
    if (a > 35) b -= U.chance(0.5) ? (a > 60 ? U.rand(1, 2) : 1) : 0;
    m.looksBase = U.clamp(b, a > 70 ? 8 : 20, 98);
    // Looks drift a quarter of the way back toward that baseline each year.
    stat('looks', (m.looksBase - m.looks) / 4);
  }
  // Where happiness settles over time, and why (shown in About me). People adapt:
  // a good life, good people and good habits set the baseline.
  function moodTarget(acts) {
    var s = S(), m = me(), a = m.age, parts = [];
    var friends = s.people.some(function (p) { return p.alive && /friend/.test(p.role) && p.rel >= 50; });
    // Habits count: taking care of myself (exercise, meditation, reading, hobbies) lifts my baseline.
    var la = acts || {}, care = ['med', 'walk', 'gym', 'karate', 'diet', 'lib', 'vacation'].filter(function (k) { return la[k]; }).length + Object.keys(la).filter(function (k) { return /^skill/.test(k); }).length;
    function add(v, why) { if (v) parts.push([v, why]); return v; }
    var t = 58 + add(s.money > $(100000) ? 5 : 0, 'money') + add(partner() ? 7 : 0, 'love') + add(s.job || s.edu || a < 22 || s.retired ? 3 : -6, s.job || s.edu || a < 22 || s.retired ? 'purpose' : 'no job') + add(s.prison ? -25 : 0, 'prison') + add(-s.conditions.reduce(function (t, n) { var il = D.illness(n); return t + (!il ? 3 : il.happy || il.selfHeal >= 0.5 ? 1 : 3); }, 0), 'health problems') + add(friends ? 3 : 0, 'friends') + add(s.pets.length && !s.prison ? 3 : 0, 'pets') + add(Math.min(8, care * 2), 'habits') + add(m.health < 35 ? -5 : 0, 'poor health');
    return { t: U.clamp(Math.round(t), 0, 100), parts: parts };
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
    return { hs: 'High School Diploma', trade: 'Trade Certificate (' + d.major + ')', bachelor: 'Bachelor\'s in ' + d.major, mba: 'MBA', law: 'Juris Doctor', med: 'Doctor of Medicine', vet: 'Doctor of Veterinary Medicine', dental: 'Doctor of Dental Surgery', phd: 'PhD in ' + d.major }[d.type];
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
      log('🏅 Achievement unlocked: ' + a.name + (/[.!?]$/.test(a.name) ? '' : '!'), 'good'); // never "Is...!"
      var global = loadGlobal();
      if (global.ach.indexOf(id) < 0) { global.ach.push(id); saveGlobal(global); }
    }
  }

  function netWorth() {
    var s = S(), w = s.money - s.studentDebt;
    s.assets.forEach(function (a) { w += a.value - (a.loan || 0); });
    Object.keys(s.stocks).forEach(function (sym) { w += s.stocks[sym] * s.prices[sym]; });
    if (TL.creator) w += TL.creator.cryptoValue();
    return Math.round(w);
  }

  // ---------- people ----------
  function randomName(gender, lastName, ctry) {
    var c = ctry ? D.country(ctry) : country();
    var first = U.pick(gender === 'M' ? c.male : c.female), last = lastName || U.pick(c.last);
    for (var i = 0; i < 6 && !lastName && last === first; i++) last = U.pick(c.last); // no "Carter Carter"
    return { first: first, last: last };
  }
  function npcJob(age) {
    if (TL.S && country().ancient && TL.ancient) return TL.ancient.npcJob(age);
    if (age < 5) return 'Toddler';
    if (age < 18) return 'Student';
    if (age >= 67) return 'Retired';
    if (age < 23 && U.chance(0.5)) return 'University Student';
    if (U.chance(0.1)) return 'Unemployed';
    var c = U.pick(D.CAREERS);
    var lvl = Math.min(c.levels.length - 1, Math.floor(U.randf(0, Math.min(c.levels.length, (age - 18) / 7 + 1))));
    return c.levels[lvl][0];
  }
  // A job for someone with a given kind of schooling ('bachelor', 'trade', or 'hs' for none beyond high school).
  function npcJobFor(age, edu) {
    var ok = edu === 'bachelor' ? ['bachelor'] : edu === 'trade' ? ['trade'] : ['none', 'hs'];
    var pool = D.CAREERS.filter(function (c) { return ok.indexOf(c.edu) >= 0; });
    if (!pool.length || (TL.S && country().ancient)) return npcJob(age);
    var c = U.pick(pool), lvl = Math.min(c.levels.length - 1, Math.floor(U.randf(0, Math.min(c.levels.length, (age - 18) / 7 + 1))));
    return c.levels[lvl][0];
  }
  function makePerson(o) {
    var gender = o.gender || (U.chance(0.5) ? 'M' : 'F');
    var nm = randomName(gender, o.last, o.country);
    if (S() && country().ancient) nm.last = D.surname(nm.last, gender, country().ancient);
    // Roman women take the family name (Livia of the Livii); never "Livia Livia".
    for (var t0 = 0; t0 < 6 && !o.first && nm.first === nm.last; t0++) nm.first = randomName(gender, null, o.country).first;
    // No two people in one life share a full name (two "James Wilson" classmates was confusing).
    var taken = function (f, l) { return S() && ((S().me && S().me.first === f && S().me.last === l) || S().people.some(function (q) { return q.first === f && q.last === l; })); }; // nobody shares my full name either
    for (var tries = 0; tries < 8 && taken(o.first || nm.first, nm.last); tries++) {
      var alt = randomName(gender, o.last, o.country);
      if (o.first) nm.last = o.last ? nm.last : alt.last; else { alt.last = nm.last; nm = alt; }
    }
    for (var t2 = 0; t2 < 6 && !o.first && nm.first === nm.last; t2++) nm.first = randomName(gender, null, o.country).first;
    // A given first name ("a collab partner named Mitchell") rerolls the surname instead: never "Mitchell Mitchell".
    for (var t3 = 0; t3 < 6 && o.first && !o.last && o.first === nm.last; t3++) { nm.last = randomName(gender, null, o.country).last; if (S() && country().ancient) nm.last = D.surname(nm.last, gender, country().ancient); }
    var age = o.age != null ? o.age : 20;
    // Romance stays age-appropriate: nobody under 13 dates, a minor's partner is
    // within two years of them, and nobody under 16 is engaged or married.
    if (['partner', 'fiance', 'spouse'].indexOf(o.role) >= 0 && S() && S().me) {
      var my = S().me.age;
      if (my < 18) age = U.clamp(age, Math.max(13, my - 2), my + 2);
      else age = Math.max(18, age);
      if (o.role !== 'partner' && age < 16) age = 16;
      if (my < 13) o.role = 'friend'; // kids make friends, not boyfriends
    }
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
      gen: opts.gen || 1, country: ctry.name, birthCountry: ctry.name, year: startYear, city: ctry.cities ? U.pick(ctry.cities) : TL.real ? TL.real.city(ctry.name) : null,
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
      famePerks: null, social: { platform: false }, home: { type: 'parents' }
    };
    TL.S = st;
    if (ctry.ancient) { st.me.last = D.surname(st.me.last, gender, ctry.ancient); st.flags.noSchool = true; }
    // Same rule as makePerson: a Roman girl of the Tullii isn't "Tullia Tullia".
    for (var t1 = 0; t1 < 6 && !opts.first && st.me.first === st.me.last; t1++) st.me.first = randomName(gender, null, ctry.name).first;
    // Share prices start near real levels, in local currency.
    D.STOCKS.forEach(function (s) { st.prices[s.sym] = Math.round($(s.price || U.randf(20, 300)) * U.randf(0.75, 1.3) * 100) / 100; });
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
    if (TL.talents) TL.talents.roll(null, opts.talent); // born with a gift? (js/talents.js) Or the one I picked.
    var momAge = U.rand(18, 42), dadAge = momAge + U.rand(-4, 8);
    var parentsMarried = U.chance(0.7);
    var mom = addPerson({ role: 'mother', gender: 'F', age: momAge, last: parentsMarried ? st.me.last : undefined, rel: U.rand(55, 100), money: $(wealthTier.m * U.randf(0.5, 1.5)) });
    var dad = addPerson({ role: 'father', gender: 'M', age: Math.max(18, dadAge), last: st.me.last, rel: U.rand(45, 100), money: $(wealthTier.m * U.randf(0.5, 1.5)) });
    mom.married = dad.married = parentsMarried;
    [mom, dad].forEach(function (p) { if (p.job === 'Student' || p.job === 'University Student') p.job = npcJob(30); });
    if (wealthTier.t === 'rich' && !ctry.ancient) { mom.job = U.pick(['CEO', 'Managing Partner', 'Movie Star', 'Surgeon']); }

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

    if (opts.royal && TL.features && !ctry.ancient) TL.features.makeRoyal(st); // earlier eras crown their own (TL.dynasty)
    var m = st.me;
    st.birthCity = st.city;
    log('I was born a ' + (gender === 'M' ? 'boy' : 'girl') + ' in ' + (st.city ? st.city + ', ' : '') + countryName(ctry.name) + ' ' + ctry.flag + ' on ' + D.MONTHS[month - 1] + ' ' + U.ordinal(day) + ', ' + yearLabel(startYear) + '.');
    log('My name is ' + m.first + ' ' + m.last + '. I am a ' + zodiac + '.');
    log('My mother is ' + fullName(mom) + ', ' + jobPhrase(mom.job) + ' (age ' + mom.age + ').');
    log('My father is ' + fullName(dad) + ', ' + jobPhrase(dad.job) + ' (age ' + dad.age + ').');
    if (!mom.married) log('My parents aren\'t married.');
    people('sibling').forEach(function (s) {
      log('I have ' + (s.gender === 'M' ? 'an older brother' : 'an older sister') + ', ' + s.first + ' (age ' + s.age + ').');
    });
    if (st.royal) TL.features.royalBirthLog();
    else if (wealthTier.t === 'rich') log('My family is extremely wealthy. 💎', 'good');
    else if (wealthTier.t === 'poor' && !ctry.ancient) log('My family struggles to make ends meet.', 'bad');
    if (ctry.ancient && TL.ancient) TL.ancient.setup(st, opts);
    return st;
  }

  // ---------- education ----------
  var SCHOOL_WORDS = ['Maplewood', 'Riverside', 'Lincoln', 'Oakridge', 'Westfield', 'Sunnyvale', 'Hillcrest', 'Lakeview', 'Kingsley', 'Pinecrest', 'Brookside', 'Fairview', 'Northgate', 'Silver Creek'];
  var UNI_WORDS = ['State University', 'Institute of Technology', 'University', 'College', 'Polytechnic'];
  function schoolName(kind) {
    var w = U.pick(SCHOOL_WORDS);
    if (kind === 'uni') return TL.real && S() ? U.pick(TL.real.universities(S().country)).name : w + ' ' + U.pick(UNI_WORDS);
    if (kind === 'trade') return w + ' ' + U.pick(['Technical Institute', 'Trade School', 'Vocational College']);
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
    // Your middle school team carries on into high school.
    if (prev && prev.team && prev.stage === 'middle' && stage === 'high' && !s.edu.team) s.edu.team = prev.team;
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
    if (stage === 'trade') return 2;
    if (stage === 'grad') return D.GRAD_SCHOOLS.filter(function (g) { return g.id === grad; })[0].years;
    return { elementary: 5, middle: 3, high: 4 }[stage];
  }
  function gradeLetter(g) {
    return g >= 93 ? 'A+' : g >= 85 ? 'A' : g >= 78 ? 'B+' : g >= 70 ? 'B' : g >= 62 ? 'C+' : g >= 55 ? 'C' : g >= 45 ? 'D' : 'F';
  }
  // The year's report card: a word on the trend, the honor roll (dean's list
  // at college), and parents who notice either way while I live at home.
  function reportCard(e) {
    var before = e.card, g = e.grade; e.card = g;
    var minor = me().age < 18, folks = minor ? people(['mother', 'father']) : [], a = before == null ? null : gradeLetter(before), b = gradeLetter(g);
    if (e.stage !== 'elementary' && g >= 85) {
      e.honors = (e.honors || 0) + 1;
      var list = e.stage === 'uni' || e.stage === 'grad' ? 'the dean\'s list' : 'the honor roll';
      log('🏅 Report card: ' + b + '. I made ' + list + (e.honors > 1 ? ' (' + e.honors + ' times now)' : '') + '!', 'good');
      if (folks.length && U.chance(0.5)) { var gift = $(U.rand(2, 10) * 10); addMoney(gift); folks.forEach(function (p) { rel(p, 3); }); log('🎁 My parents were so proud they gave me ' + fmt(gift) + '.', 'good'); }
      return;
    }
    if (a === null || a === b) return;
    log('📋 Report card: ' + b + (g > before ? ' (up from ' : ' (down from ') + a + ').', g > before ? 'good' : 'bad');
    if (folks.length && before - g >= 6) { folks.forEach(function (p) { rel(p, -6); }); stat('happy', -3); log('😠 My parents were furious about my report card. I\'m grounded.', 'bad'); }
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
    reportCard(e);
    clubYear(e);
    // Learning gets harder near the top, so not every kid maxes out by 12.
    var room = U.clamp((115 - me().smarts) / 60, 0.25, 1);
    if (e.stage !== 'grad' && e.stage !== 'uni') stat('smarts', Math.round((U.rand(0, 3) + e.study) * room));
    else stat('smarts', Math.round((U.rand(1, 3) + e.study) * room));
    e.study = 0;
    e.year++;
    var total = eduYears(e.stage, e.grad);
    if (e.year <= total) return;

    // finished this stage
    if (e.stage === 'elementary') { log('I graduated from elementary school.'); enroll('middle'); log('I started middle school at ' + s.edu.school + '.'); }
    else if (e.stage === 'middle') { log('I finished middle school.'); enroll('high'); log('I started high school at ' + s.edu.school + '. 🏫'); if (s.edu.team) log('🏅 I\'m playing on the high school ' + s.edu.team.replace(' Team', '').toLowerCase() + (/Team$/.test(s.edu.team) ? ' team' : '') + ' now.'); }
    else if (e.stage === 'high') {
      if (e.grade < 25 && !s.flags.heldBack) {
        s.flags.heldBack = true; e.year = total;
        log('My grades were too low to graduate. I have to repeat my senior year.', 'bad'); stat('happy', -15);
        return;
      }
      s.degrees.push({ type: 'hs' });
      var gl = gradeLetter(e.grade), avg = (/^[AEF]/.test(gl) ? 'an ' : 'a ') + gl + ' average';
      // Only cheer for grades worth cheering.
      log(/^[AB]/.test(gl) ? '🎓 I graduated from ' + e.school + ' with ' + avg + '!' : /^C/.test(gl) ? '🎓 I graduated from ' + e.school + ' with ' + avg + '.' : '🎓 I scraped through ' + e.school + ' with ' + avg + ', but I graduated.', /^[ABC]/.test(gl) ? 'good' : '');
      if (e.grade >= 95) { log('🥇 I was named valedictorian of my class!', 'good'); achieve('valedictorian'); }
      stat('happy', 10);
      s.lastGrade = e.grade;
      s.edu = null;
      queue('after_hs');
    } else if (e.stage === 'uni') {
      if (e.grade < 30) { e.year = total; log('I failed too many classes and must take another year of university.', 'bad'); stat('happy', -10); return; }
      s.degrees.push({ type: 'bachelor', major: e.major, school: e.school, tier: e.tier || 0 });
      log('🎓 I graduated from ' + e.school + ' with a Bachelor\'s degree in ' + e.major + '! (' + gradeLetter(e.grade) + ')', 'good');
      stat('happy', 15); stat('smarts', 5);
      s.lastGrade = e.grade;
      s.edu = null;
      achieve('graduate');
      if (s.job && s.job.partTime) quitJob(true);
    } else if (e.stage === 'trade') {
      if (e.grade < 25) { e.year = total; log('I failed my certification exam and need another year of trade school.', 'bad'); return; }
      s.degrees.push({ type: 'trade', major: e.major });
      log('🔧 I earned my trade certificate in ' + e.major.toLowerCase() + '!', 'good');
      stat('happy', 12);
      s.edu = null;
      achieve('tradesman');
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
  function enrollUni(major, funding, uni) {
    var s = S(), tuition = uni && TL.real ? $(TL.real.tuition(s.country, uni.tier)) * 4 : $(28000) * 4;
    var at = uni ? { school: uni.name, tier: uni.tier } : {};
    if (funding === 'parents') {
      var ps = people(['mother', 'father']).filter(function (p) { return p.money > tuition * 0.5; });
      var rich = ps.sort(function (a, b) { return b.money - a.money; })[0];
      if (!rich || rich.rel < 40 || !U.chance(rich.rel / 100 + (rich.money > tuition * 3 ? 0.3 : 0))) return { ok: false, msg: 'My parents said they can\'t pay for my education.' };
      rich.money -= tuition;
      enroll('uni', Object.assign({ major: major, funding: 'parents' }, at));
      return { ok: true, msg: 'My ' + relWord(rich) + ' agreed to pay my tuition! I enrolled at ' + s.edu.school + ' to study ' + major + '.' };
    }
    if (funding === 'fund') {
      var f = Math.min(s.collegeFund || 0, tuition), rest = tuition - f;
      s.collegeFund = (s.collegeFund || 0) - f; if (rest > 0) s.studentDebt += rest;
      enroll('uni', Object.assign({ major: major, funding: 'fund' }, at));
      return { ok: true, msg: 'My college fund paid ' + fmt(f) + (rest > 0 ? ' and student loans covered the other ' + fmt(rest) : ', the whole bill') + '. I enrolled at ' + s.edu.school + ' to study ' + major + '. 🎓' };
    }
    if (funding === 'gibill') {
      enroll('uni', Object.assign({ major: major, funding: 'gibill' }, at));
      return { ok: true, msg: 'The GI Bill covers my tuition! I enrolled at ' + s.edu.school + ' to study ' + major + '. 🎖️' };
    }
    if (funding === 'scholarship') {
      var g = s.lastGrade || 50;
      var p = (g >= 90 ? 0.8 : g >= 80 ? 0.45 : g >= 70 ? 0.2 : 0.03) + clubBonus();
      if (s.sat) p += (s.sat - 1100) / 1500;
      if (s.flags.athleteScholar) p += 0.3;
      if (!U.chance(p)) return { ok: false, msg: 'My scholarship application was rejected.' };
      enroll('uni', Object.assign({ major: major, funding: 'scholarship' }, at));
      return { ok: true, msg: 'I won a full scholarship! I enrolled at ' + s.edu.school + ' to study ' + major + '. 🏆' };
    }
    if (funding === 'savings') {
      if (s.money < tuition) return { ok: false, msg: 'I don\'t have enough money (' + fmt(tuition) + ' needed).' };
      addMoney(-tuition);
      enroll('uni', Object.assign({ major: major, funding: 'savings' }, at));
      return { ok: true, msg: 'I paid ' + fmt(tuition) + ' and enrolled at ' + s.edu.school + ' to study ' + major + '.' };
    }
    s.studentDebt += tuition;
    enroll('uni', Object.assign({ major: major, funding: 'loans' }, at));
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
  function enrollTrade(trade, funding) {
    var s = S(), cost = $(7000) * 2;
    if (!hasDegree('hs')) return { ok: false, msg: 'I need a high school diploma or GED first.' };
    if (hasDegree('trade', [trade])) return { ok: false, msg: 'I already have that certificate.' };
    if (funding === 'savings') {
      if (s.money < cost) return { ok: false, msg: 'I don\'t have enough money (' + fmt(cost) + ').' };
      addMoney(-cost);
    } else s.studentDebt += cost;
    enroll('trade', { major: trade, funding: funding });
    return { ok: true, msg: 'I enrolled at ' + s.edu.school + ' to train in ' + trade.toLowerCase() + '. ' + (funding === 'savings' ? 'I paid ' : 'I borrowed ') + fmt(cost) + '.' };
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
    if (job.ancient && TL.ancient) return TL.ancient.salary(job);
    if (job.acting || job.music || job.pro || job.special) return job.salary || 0;
    if ((job.hoops || job.mil) && job.salary) return job.salary;
    if (job.partTime) return $(D.PART_TIME.filter(function (p) { return p.id === job.career; })[0].salary);
    var c = D.career(job.career);
    return Math.round($(c.levels[job.level][1]) * (job.mult || 1));
  }
  function jobTitle(job) {
    if (!job) return 'Unemployed';
    if (job.ancient && TL.ancient) return TL.ancient.title(job);
    if (job.mil) return job.title || 'Soldier';
    if (job.special) return TL.specials ? TL.specials.title(job) : 'Freelancer';
    if (job.acting) return TL.acting ? TL.acting.title() : job.title || 'Actor';
    if (job.music) return TL.music ? TL.music.title() : job.title || 'Musician';
    if (job.pro) return TL.pro ? TL.pro.title() : job.title || 'Athlete';
    if (job.coach) return job.title || 'Coach';
    if (job.hoops) return (job.title || 'Basketball Player') + (TL.hoops && S().hoops ? ' (' + ({ PG: 'PG', SG: 'SG', SF: 'SF', PF: 'PF', C: 'C' }[S().hoops.pos]) + ')' : '');
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
      if (c.edu === 'bachelor' && !hasDegree('bachelor', c.majors)) reasons.push(c.majors ? 'Needs a degree in ' + (c.majors.length > 1 ? c.majors.slice(0, -1).join(', ') + ' or ' + c.majors[c.majors.length - 1] : c.majors[0]) : 'Needs a bachelor\'s degree');
      if (c.edu === 'trade' && !hasDegree('trade', c.majors)) reasons.push('Needs ' + c.majors[0].toLowerCase() + ' trade school');
      if (['law', 'med', 'mba', 'phd', 'vet', 'dental'].indexOf(c.edu) >= 0 && !hasDegree(c.edu)) reasons.push('Needs ' + { law: 'law degree', med: 'medical degree', mba: 'an MBA', phd: 'a PhD', vet: 'vet school', dental: 'dental school' }[c.edu]);
    }
    if (c.minStat && statValue(c.stat) < c.minStat) reasons.push('Not enough ' + statLabel(c.stat));
    if (c.noRecord && s.record.length) reasons.push('Criminal record');
    if (c.req) { var extra = c.req(); if (extra) reasons.push(extra); }
    if (TL.history && TL.history.notYet(c.id)) reasons.push(TL.history.notYet(c.id));
    return reasons;
  }
  function statLabel(k) { return { happy: 'happiness', health: 'health', smarts: 'smarts', looks: 'looks', athl: 'athleticism' }[k]; }
  function applyJob(careerId, bonus) {
    var s = S(), c = D.career(careerId);
    if (eligible(c).length) return { ok: false, msg: 'I don\'t qualify: ' + eligible(c).join(', ') + '.' };
    var sv = statValue(c.stat);
    var p = 0.35 + (sv - 50) / 120 + (s.karma - 50) / 400 - (s.record.length ? 0.15 : 0);
    if (c.edu === 'none') p += 0.25;
    var exp = s.jobHistory.filter(function (h) { return h.career === careerId; }).reduce(function (a, h) { return a + h.years; }, 0);
    p += Math.min(0.2, exp * 0.03);
    if (TL.features) p += TL.features.skillBonus(careerId);
    p += Math.min(0.2, (s.internships || 0) * 0.08);
    p += bonus || 0; // how the interview went
    // Veterans get hiring preference, especially where their service skills carry over.
    if (TL.military && TL.military.veteran()) p += ['police', 'firefighter', 'detective', 'security', 'nurse', 'mechanic', 'engineer', 'software', 'pilot'].indexOf(careerId) >= 0 ? 0.15 : 0.05;
    var prestige = s.degrees.reduce(function (t, d) { return Math.max(t, d.tier || 0); }, 0);
    p += prestige === 3 ? 0.12 : prestige === 2 ? 0.05 : 0; // a big-name degree opens doors
    p -= c.hard || 0;
    if (!U.chance(U.clamp(p, 0.05, 0.95))) return { ok: false, msg: 'After the interview, they decided not to hire me.' };
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
  var CO_B = { electrician: 'Electric', plumber: 'Plumbing', hvac: 'Heating & Air', welder: 'Fabrication', vet: 'Animal Hospital', dentist: 'Dental', gamedev: 'Games', zookeeper: 'Zoo', pharmacist: 'Pharmacy', fashion: 'Fashion House', trainer: 'Fitness', software: 'Labs', accountant: 'Accounting', teacher: 'Academy', nurse: 'Medical Center', doctor: 'Hospital', surgeon: 'Hospital', lawyer: 'Law Group', finance: 'Capital', executive: 'Holdings', military: 'Army', police: 'Police Dept.', firefighter: 'Fire Dept.' };
  function companyName(c) {
    var real = TL.real && TL.real.company(c.id, S().country);
    if (real) return real;
    if (c.id === 'military') return 'the Army';
    if (c.id === 'astronaut') return 'the ' + U.pick(['National', 'International', 'United']) + ' Space Agency';
    if (c.id === 'police') return 'the ' + U.pick(SCHOOL_WORDS) + ' Police Department';
    if (c.id === 'judge') return 'the Courts';
    return U.pick(CO_A) + ' ' + (CO_B[c.id] || U.pick(['Group', 'Inc.', 'Corp.', 'Partners', 'Co.', 'Industries']));
  }
  // What a regular career paid when I left it (retirees can consult in that field later).
  function officePay(j) {
    if (!j || j.partTime || j.special || j.acting || j.music || j.pro || j.hoops || j.mil || j.politics || j.ancient || j.fame || !D.career(j.career)) return 0;
    return jobSalary(j) || 0;
  }
  function quitJob(silent) {
    var s = S();
    if (!s.job) return;
    s.jobHistory.push({ career: s.job.career, title: jobTitle(s.job), years: s.job.years, company: s.job.company, pay: officePay(s.job) });
    if (!silent) log('I quit my job as ' + an(jobTitle(s.job)) + '.');
    if (s.job.special === 'gamedev' && TL.gamedev) TL.gamedev.left();
    s.job = null;
    leaveWork();
  }
  function fire(reason) {
    var s = S();
    log('I was fired from my job as ' + an(jobTitle(s.job)) + '. ' + (reason || ''), 'bad');
    if (s.job.special === 'gamedev' && TL.gamedev) TL.gamedev.left();
    s.jobHistory.push({ career: s.job.career, title: jobTitle(s.job), years: s.job.years, fired: true });
    // Losing a job you held a year or more (not for a crime) qualifies for unemployment.
    var pay = jobSalary(s.job) || 0;
    if (s.job.years >= 1 && pay > 0 && !ancient() && s.year >= 1935 && !/caught|stole|steal|embezzl|arrest|prison|jail/i.test(reason || '')) s.uiElig = { pay: pay, year: s.year };
    s.job = null;
    leaveWork();
    stat('happy', -20);
  }
  // Public pension from 67 (Social Security in the US, a state pension
  // elsewhere) for anyone who worked at least ten years, in today's money.
  function statePension() {
    var s = S(), m = me();
    if (ancient() || s.year < 1940 || m.age < 67 || s.prison) return 0;
    if (!s.flags.spBase) {
      var yrs = s.jobHistory.reduce(function (a, h) { return a + (h.years || 0); }, 0) + (s.job ? s.job.years || 0 : 0);
      if (yrs < 10) return 0;
      s.flags.spBase = Math.round(24000 * Math.min(35, yrs) / 35 * (country().life >= 75 ? 1 : 0.6));
      log('📬 I started collecting ' + (country().name === 'United States' ? 'Social Security' : 'my state pension') + ': ' + fmt($(s.flags.spBase)) + ' a year.', 'good');
    }
    return $(s.flags.spBase);
  }
  // How I spend retirement, chosen on the Career screen and lived every year.
  var RET_PLANS = {
    travel: ['✈️', 'Travel the world', 'Lots of happiness, but trips cost money every year'],
    family: ['👪', 'Be there for family', 'Closer to my kids and grandkids'],
    volunteer: ['🙏', 'Volunteer', 'Good karma and a sense of purpose'],
    relax: ['🌻', 'Take it easy', 'Gardening, golf and naps keep me healthy'],
    learn: ['📚', 'Keep learning', 'Classes, books and puzzles keep my mind sharp'],
    consult: ['💼', 'Consult part-time', 'Some income from my old field, while I still have the energy']
  };
  // The career I could consult in: my last regular job, if I spent real years in it.
  function consultField() {
    var h = S().jobHistory, last = h[h.length - 1];
    return last && last.pay > 0 && last.years >= 5 && !last.fired ? last : null;
  }
  // Why a plan can't be picked right now ('' when it can).
  function retPlanBlock(k) {
    if (k !== 'consult') return '';
    if (!consultField()) return 'Needs 5+ years in my last regular job';
    if (me().age >= 75) return 'I\'m past consulting age';
    return '';
  }
  var TRIPS = ['cruised the Mediterranean', 'saw the northern lights in Norway', 'toured Japan in cherry blossom season', 'went on safari in Kenya', 'drove across the country in an RV', 'spent a month in Italy', 'visited the Great Barrier Reef', 'walked the Camino de Santiago'];
  function retirementYear() {
    var s = S(), p = s.retPlan;
    if (!s.retired || !p || s.prison || ancient()) return 0;
    if (p === 'travel') {
      var cost = $(12000);
      if (s.money < cost) { s.retPlan = 'relax'; log('🧳 I can\'t afford to keep traveling. Time to take it easy at home.'); return 0; }
      stat('happy', 4);
      if (U.chance(0.4)) log('✈️ This year I ' + U.pick(TRIPS) + '.', 'good');
      return cost;
    }
    if (p === 'family') {
      var fam = people(['child', 'grandchild']);
      fam.forEach(function (q) { rel(q, 4); });
      stat('happy', fam.length ? 3 : 1);
      if (fam.length && U.chance(0.25)) log('👪 I spent the year with ' + (people('grandchild').length ? 'my grandkids' : 'my kids') + '. Those are the best days.', 'good');
    } else if (p === 'volunteer') {
      karma(2); stat('happy', 2); stat('health', 1);
      // Volunteering is where retirees make new friends.
      if (U.chance(0.12)) { var f = addPerson({ role: 'friend', age: me().age + U.rand(-12, 6), rel: U.rand(50, 70) }); log('🙏 Volunteering, I became friends with ' + fullName(f) + '.', 'good'); }
    }
    else if (p === 'relax') { stat('health', 2); stat('happy', 1); }
    else if (p === 'learn') {
      var fee = $(1500);
      if (s.money < fee) { s.retPlan = 'relax'; log('📚 Classes cost more than I can spare now. Library books and naps it is.'); return 0; }
      stat('smarts', 2); stat('happy', 1);
      if (U.chance(0.2)) log('📚 This year I ' + U.pick(['learned to paint', 'took a history course at the community college', 'finally learned Spanish', 'joined a chess club', 'read fifty books', 'learned to play the piano']) + '.', 'good');
      return fee;
    }
    else if (p === 'consult') {
      var fld = consultField();
      if (!fld || me().age >= 75 || me().health < 30) { s.retPlan = 'relax'; log('💼 I closed the laptop for good. No more consulting, just taking it easy.'); return 0; }
      var earn = Math.round(fld.pay * U.randf(0.2, 0.35) * Math.max(0.5, 1 - (me().age - 62) * 0.04));
      stat('happy', 1); stat('health', -1);
      return -earn; // negative cost is income
    }
    return 0;
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
    if (j.ancient && TL.ancient) return TL.ancient.jobYear(j);
    if (j.hoops && TL.hoops) return TL.hoops.season();
    if (j.mil && TL.military) return TL.military.year();
    if (j.career === 'actor' && !j.acting && TL.acting) TL.acting.st(); // pre-v1.14 actors
    if (j.acting && TL.acting) return TL.acting.year();
    if (j.special && TL.specials) return TL.specials.year();
    if (j.career === 'musician' && !j.music && TL.music) TL.music.st(); // pre-v1.16 musicians
    if (j.music && TL.music) return TL.music.year();
    if (j.career === 'athlete' && !j.pro && !j.hoops && TL.pro) TL.pro.migrate(j); // pre-v1.17 athletes
    if (S().job && S().job.pro && TL.pro) return TL.pro.season();
    var earned = jobSalary(j);
    if (j.partTime) return earned;
    if (j.politics) return politicsYear(j, earned);
    var c = D.career(j.career);
    j.perf = U.clamp(Math.round(j.perf + U.rand(-8, 8) + (statValue(c.stat) - 50) / 15 + (j.workHard || 0) * 4 - (me().happy < 20 ? 6 : 0) - (hasCondition('Alcoholism') ? 8 : 0) + (TL.features ? TL.features.skillBonus(j.career) * 12 : 0)), 0, 100);
    j.workHard = 0;
    if (j.fame) return earned;
    var promoted = false;
    // My boss and a big project win (js/work.js) sway promotions.
    if (j.level < c.levels.length - 1 && j.perf >= 70 && j.levelYears >= 2 && U.chance(0.35 + (j.perf - 70) / 60 + (TL.work ? TL.work.promoBonus(j) : 0))) {
      j.level++; j.levelYears = 0; j.perf = Math.max(50, j.perf - 12); promoted = true; // a new role resets expectations, but not all the way
      log('📈 I was promoted to ' + jobTitle(j) + '! New salary: ' + fmt(jobSalary(j)) + '.', 'good');
      stat('happy', 10);
      if (j.level === c.levels.length - 1) achieve('ceo');
    } else if (j.perf < 15 && U.chance(0.5)) {
      fire('My performance was terrible.');
      return earned;
    } else if (!TL.work) {
      if (j.perf < 30) log('My boss warned me that my performance at work is slipping.', 'bad');
      else if (U.chance(0.25)) j.mult = (j.mult || 1) * U.randf(1.01, 1.05);
    }
    if (TL.work) TL.work.review(j, promoted);
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
    if (TL.politics) { TL.politics.yearly(j); TL.politics.lastApproval(j.perf); }
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
    var p = 0.24 + (m.looks - 50) / 220 + (m.smarts - 50) / 260 + Math.min(0.08, (s.karma - 50) / 220) + s.fame / 350 + CAMPAIGNS[tier][2];
    p -= level * 0.14 + (s.record.length ? 0.3 : 0);
    if (level >= 3) p += s.fame / 600 - 0.18; // national office needs name recognition
    if (level === 3) p -= 0.04;
    if (level === 4) p -= 0.24 + Math.min(0.2, (s.flags.presRuns || 0) * 0.1); // a primary, then the general; parties tire of repeat losers // a primary, then the general; parties tire of repeat losers
    if (incumbent) p = 0.1 + incumbent.perf / 120 + CAMPAIGNS[tier][2] / 2 - (incumbent.terms >= 3 ? 0.08 : 0);
    if (TL.politics) p += TL.politics.bonus(level, !!incumbent);
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
    var chest = TL.politics ? TL.politics.chest() : 0;
    if (s.money + chest < cost) return { ok: false, msg: 'I can\'t afford that campaign (' + fmt(cost) + ').' };
    var fromChest = Math.min(chest, cost); if (fromChest) TL.politics.spend(fromChest);
    addMoney(-(cost - fromChest));
    var opp = makePerson({ age: m.age + U.rand(-10, 15) });
    if (!U.chance(electionChance(level, tier))) {
      fame(2);
      s.flags.nextRun = s.year + (level >= 3 ? 4 : 2);
      if (level === 4) s.flags.presRuns = (s.flags.presRuns || 0) + 1;
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
    var chest = TL.politics ? TL.politics.chest() : 0;
    if (s.money + chest < cost) tier = 0, cost = 0;
    var fromChest = Math.min(chest, cost); if (fromChest) TL.politics.spend(fromChest);
    addMoney(-(cost - fromChest));
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
    if (j && (j.hoops || j.acting || j.music || j.pro || j.special)) return; // these careers handle their own fame
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
  function proTeam() {
    // Basketball has its own career mode (js/hoops.js); otherwise play the sport I grew up playing.
    var sport = (TL.sports && TL.sports.proSport()) || U.pick(D.SPORTS.filter(function (x) { return !TL.hoops || x !== 'Basketball'; })), real = TL.real && TL.real.team(sport, S().country, me().gender);
    return real || 'the ' + U.pick(['Tigers', 'Sharks', 'Wolves', 'Titans', 'Falcons', 'Kings', 'Rangers']) + ' (' + sport + ')';
  }
  function fameAudition(id) {
    var s = S(), c = D.career(id), m = me();
    if (m.age < c.minAge) return { ok: false, msg: 'I\'m too young.' };
    if (c.maxAge && m.age > c.maxAge) return { ok: false, msg: 'I\'m too old to go pro.' };
    var sv = statValue(c.stat);
    var p = (sv - 40) / 120 + s.fame / 200 + (id === 'athlete' ? (m.athl - 70) / 60 + (TL.sports ? TL.sports.auditionBonus() : 0) : 0.05) + (TL.features ? TL.features.skillBonus(id) : 0);
    if (!U.chance(U.clamp(p, 0.03, 0.85))) {
      return { ok: false, msg: { actor: 'The casting director said I wasn\'t right for the role.', musician: 'No labels responded to my demo.', athlete: 'I didn\'t make the team.' }[id] };
    }
    if (s.job && !(s.job.partTime && m.age < 18)) quitJob(true);
    if (s.job && s.job.partTime) quitJob(true);
    s.job = { career: id, level: 0, perf: 60, years: 0, levelYears: 0, fame: true, mult: 1, company: id === 'athlete' ? proTeam() : id === 'musician' ? U.pick(D.GENRES) + ' scene' : 'Hollywood' };
    fame(5);
    return { ok: true, msg: { actor: 'I landed a role as an Extra! My acting career begins. 🎬', musician: 'I started performing ' + s.job.company.replace(' scene', '') + ' music! 🎤', athlete: /Tour$/.test(s.job.company) ? 'I turned pro and joined ' + s.job.company + '! 🎾' : 'I signed with ' + s.job.company + '! 🏅' }[id] };
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
    // Back at a full-time job means I'm not retired anymore (the pension waits).
    if (s.retired && s.job && !s.job.partTime) { s.retired = false; log('💼 Working full-time again, I\'m officially out of retirement. My pension is on hold.'); }
    if (s.retired && s.pension) { income += s.pension; lines.push('Pension ' + fmt(s.pension)); }
    safetyNet(function (amt, what) { income += amt; lines.push(what + ' ' + fmt(amt)); });
    var sp = statePension();
    if (sp) { income += sp; lines.push((country().name === 'United States' ? 'Social Security ' : 'State pension ') + fmt(sp)); }
    expense += routineYear();
    var rp = retirementYear();
    if (rp < 0) { income -= rp; lines.push('Consulting ' + fmt(-rp)); } else expense += rp;
    if (s.social.platform && s.followers >= 10000) income += $(Math.round(s.followers * 0.01));
    // cost of living
    if (m.age >= 18 && !s.prison) {
      validateHome();
      var h = home();
      // Parents cover a young adult at home until they're earning (or turn 22).
      var living = $(h.type === 'parents' ? (m.age < 22 && !s.job ? 0 : 4000) : h.type === 'homeless' ? 2000 : 9000);
      if (!(s.edu && s.edu.funding === 'parents')) living += rentCost(h);
      if (s.edu && (s.edu.stage === 'uni' || s.edu.stage === 'grad' || s.edu.stage === 'trade') && s.edu.funding === 'loans') {
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
        // Run-down houses lag the market; well-kept ones keep pace.
        a.value = Math.round(a.value * (U.randf(0.97, 1.075) - (a.cond < 40 ? 0.03 : 0)));
        a.cond = U.clamp(a.cond - U.rand(1, 5), 0, 100);
        expense += Math.round(a.value * (a.upkeep || 0.013));
        if (a.rented) { var r = Math.round(a.value * 0.055); income += r; a.rentIncome = r; }
      } else if (a.kind === 'car') {
        var craft = a.type === 'Private Jet' || a.type === 'Superyacht';
        if (!a.made) a.made = s.year;
        var carAge = s.year - a.made;
        // A well-kept car 25+ years old becomes a classic and starts gaining value;
        // anything else bottoms out at scrap value rather than sinking to nothing.
        if (!craft && carAge >= 25 && a.cond >= 60) {
          if (!a.classic) { a.classic = s.year; a.value = Math.max(a.value, Math.round(a.price * 0.35)); log('🚘 My ' + a.name + ' is officially a classic now. Collectors are interested.', 'good'); }
          a.value = Math.round(a.value * U.randf(1.03, 1.09));
        } else a.value = Math.max(Math.round(a.price * 0.06), Math.round(a.value * (craft ? 0.93 : 0.86)));
        if (a.classic && a.cond < 60) a.classic = 0;
        a.cond = U.clamp(a.cond - U.rand(3, 10), 0, 100);
        expense += Math.round(a.price * (a.classic ? 0.015 : 0.03));
        // Neglected cars break down, and I have to decide what to do with them.
        if (!craft && a.cond < 30 && U.chance(0.35) && !s.pending.some(function (q) { return q.id === 'car_breakdown'; })) queue('car_breakdown', { id: a.id });
      } else if (a.kind === 'business' && TL.business) {
        // js/business.js runs the books: revenue, costs, staff, reputation.
        var pr = TL.business.year(a);
        if (pr >= 0) income += pr; else expense -= pr;
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
    if (!s.prison) expense += s.pets.length * $(700);
    // caring for an aging parent (js/events.js parent_care)
    expense += careYear();
    // health insurance premiums and prescriptions
    if (TL.health) expense += TL.health.costs();

    // stock market (js/market.js): prices, dividends and news
    var divs = TL.market ? TL.market.year() : 0;
    if (divs) income += divs;
    addMoney(income - expense);
    if (TL.market && earned) TL.market.autoInvest(Math.round(earned * (1 - c.tax)));
    if (income || expense) log('💵 ' + [income ? 'Income ' + fmt(income) : '', expense ? 'Expenses ' + fmt(expense) : ''].filter(Boolean).join(' · '), 'money');
    // Debt: it charges interest (less on a payment plan, more once it's in
    // collections), and the log says how much only when it starts, grows a
    // lot, or ends. Past $20k creditors come calling and I choose what to do.
    if (s.money < 0) {
      var plan = s.flags.debtPlan, coll = s.flags.collections;
      addMoney(-Math.round(-s.money * (plan ? 0.03 : coll ? 0.18 : 0.12)));
      stat('happy', -Math.round((2 + 6 * Math.min(1, -s.money / $(20000))) * (plan ? 0.5 : 1)));
      if (plan && m.age >= 18) stat('happy', -1); // living on a strict budget
      if (plan && -s.money > (s.flags.planOwe || 0) * 1.5 + $(5000)) {
        // Still sinking: the plan falls apart and the debt goes to collections.
        delete s.flags.debtPlan; delete s.flags.planOwe; s.flags.collections = s.year; plan = false; coll = true;
        log('📉 I fell too far behind on my payment plan. The debt went to collections.', 'bad');
      }
      if (s.money < -$(20000) && coll && U.chance(0.35)) bankruptcy();
      else {
        if (s.money < -$(20000) && !plan && !coll && !s.pending.some(function (q) { return q.id === 'debt_collectors'; })) queue('debt_collectors');
        var owe = -s.money, last = s.flags.debtLogged || 0;
        if (!last) log('💳 I\'m ' + fmt(owe) + ' in debt. Creditors keep calling me.', 'bad');
        else if (owe > last * 1.5) log('💳 My debt has grown to ' + fmt(owe) + '.', 'bad');
        if (!last || owe > last * 1.5) s.flags.debtLogged = owe;
      }
    } else if (s.flags.debtLogged || s.flags.debtPlan || s.flags.collections) {
      log(s.flags.debtPlan ? '🎉 I finished my payment plan. I\'m finally out of debt!' : '🎉 I\'m finally out of debt!', 'good');
      delete s.flags.debtLogged; delete s.flags.debtPlan; delete s.flags.planOwe; delete s.flags.collections;
    }
    if (m.age >= 18 && s.money >= 0) s.flags.goodYears = (s.flags.goodYears || 0) + 1;
    // stock market (fallback without js/market.js)
    if (!TL.market) D.STOCKS.forEach(function (st) {
      var change = U.gauss(st.drift, st.vol);
      s.prices[st.sym] = Math.max(0.01 * k(), Math.round(s.prices[st.sym] * (1 + change) * 100) / 100);
    });
  }
  // A FICO-style credit score (300-850) from 1989 on, for adults: debt and
  // collections drag it down, a bankruptcy sinks it for about ten years, and
  // years in the black plus a steady income build it back up.
  function credit() {
    var s = S(), m = me();
    if (m.age < 18 || ancient() || s.year < 1989) return null;
    var sc = 660, f = s.flags;
    if (s.money < 0) sc -= Math.round(Math.min(180, 120 * -s.money / $(20000)));
    if (f.collections) sc -= 100;
    if (f.debtPlan) sc -= 30;
    if (f.bankruptYear && s.year - f.bankruptYear < 10) sc -= 220 - 20 * (s.year - f.bankruptYear);
    sc += Math.min(120, 8 * (f.goodYears || 0));
    if (s.job && !s.job.partTime) sc += Math.min(60, Math.round(jobSalary(s.job) / $(2000)));
    return U.clamp(sc, 300, 850);
  }
  function creditWord(sc) { return sc >= 800 ? 'Excellent' : sc >= 740 ? 'Very good' : sc >= 670 ? 'Good' : sc >= 580 ? 'Fair' : 'Poor'; }
  function bankruptcy() {
    var s = S();
    log('⚖️ I declared bankruptcy. My assets were seized.', 'bad');
    s.assets = s.assets.filter(function (a) { return a.kind === 'house' && a.loan === 0 && a.value < $(150000); });
    s.stocks = {};
    s.money = 0; s.flags.bankrupt = (s.flags.bankrupt || 0) + 1; s.flags.bankruptYear = s.year; s.flags.goodYears = 0;
    delete s.flags.debtLogged; delete s.flags.debtPlan; delete s.flags.planOwe; delete s.flags.collections;
    stat('happy', -25);
    validateHome();
  }

  // ---------- home / living situation ----------
  // [name, yearly rent in base dollars, happiness per year]
  var RENT_TIERS = [['Shared room', 6000, -3], ['Studio apartment', 12000, 0], ['Nice apartment', 24000, 2], ['Luxury loft', 60000, 5]];
  function home() {
    var s = S();
    if (!s.home) {
      // Saves from before v1.4 have no home: infer one.
      var own = s.assets.filter(function (a) { return a.kind === 'house' && !a.rented; })[0];
      s.home = me().age < 18 ? { type: 'parents' } : s.royal ? { type: 'palace' } : own ? { type: 'owned', id: own.id } : { type: 'rent', tier: 1 };
    }
    // Saves before v2.37 kept parent rent in a flag that outlived moving out.
    if (s.flags.parentRent) { if (s.home.type === 'parents' && !s.home.rent) s.home.rent = s.flags.parentRent; delete s.flags.parentRent; }
    return s.home;
  }
  function ownedHome() {
    var h = home();
    return h.type === 'owned' ? S().assets.filter(function (a) { return a.id === h.id; })[0] || null : null;
  }
  function homeLabel() {
    var h = home();
    if (ancient() && TL.ancient) return TL.ancient.homeLabel(h);
    if (h.type === 'parents') return me().age < 18 ? 'My family\'s home' : 'Living with my parents';
    if (h.type === 'palace') return 'The royal palace';
    if (h.type === 'homeless') return 'Homeless';
    if (h.type === 'owned') { var a = ownedHome(); return a ? 'My ' + a.type.toLowerCase() + ' at ' + a.name : 'My house'; }
    return RENT_TIERS[h.tier][0];
  }
  function rentCost(h) {
    h = h || home();
    if (h.type === 'rent') return Math.round($(RENT_TIERS[h.tier][1]) * (h.mult || 1));
    if (h.type === 'parents' && h.rent) return h.rent; // the deal lives on this stay at home, so moving out ends it
    return 0;
  }
  function parentsAround() { return people(['mother', 'father']); }
  // Fix up the home after something changed (house sold, parents died...).
  function validateHome() {
    var s = S(), h = home(), why = null;
    if (h.type === 'owned') { var a = ownedHome(); if (!a || a.rented) why = 'I moved out of my old place and into a studio apartment.'; }
    else if (h.type === 'palace' && !s.royal && !(ancient() && TL.ancient && (TL.ancient.st().rule || (TL.dynasty && TL.dynasty.royal())))) why = 'I left the palace and moved into a studio apartment.';
    else if (h.type === 'parents' && me().age >= 18 && !parentsAround().length && !(ancient() && TL.ancient.housed())) why = ancient() ? TL.ancient.txt('parentsGone') : 'With my parents gone, I moved into a studio apartment.';
    if (why && ancient()) why = why.replace('a studio apartment', TL.ancient.txt('moveOut'));
    if (why) { s.home = ancient() ? JSON.parse(JSON.stringify(TL.ancient.txt('rentHome'))) : { type: 'rent', tier: 1 }; log(why); }
  }
  function moveHome(h, msg) {
    var s = S();
    s.home = h;
    return msg;
  }
  function yearlyHome() {
    var s = S(), m = me();
    if (m.age < 18 || s.prison) return;
    var h = home();
    if (h.type === 'rent') stat('happy', RENT_TIERS[h.tier][2]);
    else if (h.type === 'owned') stat('happy', 2);
    else if (h.type === 'palace') stat('happy', 3);
    else if (h.type === 'homeless') { stat('happy', -8); stat('health', -4); }
    else if (h.type === 'parents' && m.age >= 25 && !ancient() && !(s.flags.care && s.flags.care.kind === 'home')) {
      // Paying my way or pitching in keeps the peace; freeloading wears on everyone.
      var paying = !!h.rent, helped = s.flags.homeHelp === s.year;
      stat('happy', paying ? -1 : -2);
      parentsAround().forEach(function (p) { rel(p, paying ? 1 : helped ? 0 : -U.rand(0, 2)); });
      if (m.age === 30) log('I\'m 30 and I still live with my parents...', 'bad');
      // Parents who've had enough of a freeloader ask them to leave.
      var par = parentsAround();
      if (!paying && !helped && par.length && par.every(function (p) { return p.rel < 20; }) && U.chance(0.3)) {
        var dep = Math.round($(RENT_TIERS[0][1]) / 6);
        if (s.money >= dep) { addMoney(-dep); moveHome({ type: 'rent', tier: 0 }); log('🧳 My parents finally told me to pack my bags. I\'m in a shared room now.', 'bad'); stat('happy', -6); }
        else { par.forEach(function (p) { rel(p, -3); }); log('🧳 My parents want me out, but I can\'t even afford a deposit. The house is tense.', 'bad'); }
      }
    }
    // Rent unpaid for too long: evicted.
    if (h.type === 'rent' && s.money < -rentCost(h)) {
      var par = parentsAround().filter(function (p) { return p.rel >= 30; })[0];
      if (par) { s.home = { type: 'parents' }; log('🏚️ I was evicted and had to move back in with my parents.', 'bad'); }
      else { s.home = { type: 'homeless' }; log('🏚️ I was evicted from my apartment. I\'m homeless now.', 'bad'); }
      stat('happy', -15);
    }
  }

  // ---------- health ----------
  // A fitness routine I keep year after year, instead of tapping the gym every year.
  var ROUTINES = {
    none: ['🛋️', 'No routine', 'Whatever happens, happens', 0],
    walks: ['🚶', 'Daily walks', 'Free · a little healthier and calmer', 0],
    gym: ['🏋️', 'Gym three times a week', 'Healthier, fitter, looks better', 600],
    intense: ['🔥', 'Train hard', 'Big gains, tiring, risk of injury', 1500]
  };
  function routineYear() {
    var s = S(), m = me(), r = s.routine;
    if (!r || r === 'none' || s.prison || m.age < 16 || ancient()) return 0;
    var cost = $(ROUTINES[r][3]);
    if (cost && s.money < cost) { s.routine = 'walks'; log('🚶 I couldn\'t keep paying for the gym. Walks it is.'); r = 'walks'; cost = 0; }
    if (r === 'intense' && m.age >= 70) { s.routine = 'gym'; r = 'gym'; cost = $(ROUTINES.gym[3]); log('🏋️ At my age I eased off the hard training. The gym three times a week is plenty.'); }
    var aging = m.age >= 60 ? 0.5 : 1; // gains come slower later in life
    if (r === 'walks') { stat('health', 1); stat('happy', 1); }
    else if (r === 'gym') { stat('health', 2); stat('happy', 1); if (m.athl < 75) m.athl = Math.min(75, m.athl + Math.round(2 * aging)); if (U.chance(0.5)) stat('looks', 1); }
    else if (r === 'intense') {
      stat('health', 3); stat('happy', -1); if (m.athl < 92) m.athl = Math.min(92, m.athl + Math.round(4 * aging)); stat('looks', 1);
      if (U.chance(m.age >= 45 ? 0.035 : 0.02) && !hasCondition('Broken Leg')) { addCondition('Broken Leg'); stat('health', -10); log('🩼 I pushed too hard in training and broke my leg.', 'bad'); }
    }
    return cost;
  }
  // How much a routine cuts the odds of lifestyle diseases.
  function routineRisk(name) {
    var r = S().routine;
    if (!/Heart Disease|Type 2 Diabetes|High Blood Pressure/.test(name) || !r || r === 'none') return 1;
    return r === 'walks' ? 0.85 : r === 'gym' ? 0.65 : 0.6;
  }
  function yearlyHealth() {
    var s = S(), m = me(), a = m.age, life = country().life;
    // aging: health drifts toward an age-based baseline, then illnesses bite
    var base = a < 30 ? 95 : a < 50 ? 90 - (a - 30) * 0.4 : a < 70 ? 82 - (a - 50) * 0.9 : Math.max(20, 64 - (a - 70) * 1.8);
    if (m.athl > 60) base += 4;
    if (m.health < base) stat('health', (base - m.health) / 3);
    else stat('health', -U.rand(0, a > 60 ? 3 : 1));
    looksYear(m, a);
    if (a > 30 && U.chance(0.5)) m.athl = U.clamp(m.athl - U.rand(0, a > 55 ? 3 : 1), 0, 100);
    if (a >= 22 && a < 65 && s.job && !s.job.partTime && D.career(s.job.career) && D.career(s.job.career).stat === 'smarts' && U.chance(0.3)) stat('smarts', 1);
    if (a > 70 && U.chance(0.4)) stat('smarts', -U.rand(0, a > 82 ? 3 : 1));
    if (a < 18 && U.chance(0.5)) m.athl = U.clamp(m.athl + U.rand(0, 2), 0, 100);
    // existing conditions (js/health.js handles hidden illnesses, cancer stages and medication)
    if (TL.health) TL.health.year();
    s.conditions.slice().forEach(function (n) {
      var ill = D.illness(n);
      if (!ill) return;
      stat('health', -ill.dmg * (a > 70 && ill.oldRisk ? 1.5 : a < 40 ? 0.6 : 1) * (TL.health ? TL.health.mult(n) : 1));
      if (ill.happy) stat('happy', ill.happy / 2);
      if (ill.looks) stat('looks', ill.looks / 2);
      if (ill.smarts) stat('smarts', ill.smarts / 2);
      var heal = ill.selfHeal != null ? ill.selfHeal : (ill.incurable || ill.addiction ? 0 : 0.2);
      // Cancer that has spread doesn't just go away on its own.
      if (n === 'Cancer' && TL.health && (TL.health.st().stage || {}).Cancer >= 2) heal = 0;
      if (heal && U.chance(heal)) { removeCondition(n); log(n === 'Cancer' ? '🎗️ Against the odds, my cancer went into remission.' : 'I recovered from ' + illWith(n) + '.', n === 'Cancer' ? 'good' : ''); }
    });
    // new illnesses
    D.ILLNESSES.forEach(function (ill) {
      if (!ill.p || a < ill.minAge || (ill.maxAge && a > ill.maxAge) || hasCondition(ill.name) || (TL.health && TL.health.has(ill.name))) return;
      var p = ill.p * (m.health < 40 ? 1.8 : 1) * (ill.oldRisk && a > 65 ? 2.5 : 1) * (TL.health && TL.health.risk ? TL.health.risk(ill.name) : 1) * (TL.talents ? TL.talents.sickMult() : 1) * (ill.name === 'Dementia' && s.retired && s.retPlan === 'learn' ? 0.5 : 1) * routineRisk(ill.name); // a busy mind, a fit body
      if (U.chance(p)) {
        if (TL.health && TL.health.hides(ill.name)) return TL.health.hide(ill.name);
        addCondition(ill.name);
        log('🤒 ' + (ancient() ? 'I fell ill with ' : 'I was diagnosed with ') + illWith(ill.name) + '.', 'bad');
      }
    });
    // happiness drift
    // Happiness settles toward a baseline set by your life (people adapt), so
    // bad years hurt but don't pin you near zero forever.
    var target = moodTarget(s.lastActs).t;
    stat('happy', (target - m.happy) / 4 + U.rand(-4, 4));
    if (s.fame > 60 && U.chance(0.3)) stat('happy', U.rand(-6, 6));
  }
  function deathCheck() {
    var s = S(), m = me(), a = m.age, gap = TL.history ? TL.history.lifeGap(s.year) : 0, life = country().life + (s.karma - 50) / 10 + gap * 0.55;
    if (m.health <= 0) {
      // Blame the most serious condition; a passing cold or flu only gets the
      // blame for the very young, the very old or the already frail.
      var c = s.conditions.map(function (n) { return D.illness(n); }).filter(function (i) { return i && i.dmg >= 6 && (!i.selfHeal || i.selfHeal < 0.5 || a < 5 || a >= 75); })
        .sort(function (x, y) { return (y.incurable || y.selfHeal === 0 ? 4 : 0) + y.dmg - ((x.incurable || x.selfHeal === 0 ? 4 : 0) + x.dmg); })[0];
      var hid = !c && TL.health && TL.health.deathCause();
      return die(c ? 'complications from ' + illWith(c.name) : hid || (a >= 70 && !ancient() ? U.pick(['heart failure', 'natural causes', 'old age', 'a stroke']) : 'poor health'));
    }
    var hazard;
    // Earlier eras: far more children died young.
    if (a < 5) hazard = 0.001 * (1 - gap / 3);
    else if (a < 40) hazard = 0.0008;
    // Modern lives follow a real-world-shaped curve (about 2% a year at 70,
    // 5% around life expectancy, 15% at 90), so even a perfectly cared-for
    // body wears out; earlier eras keep their own curve.
    else hazard = ancient() ? 0.012 * Math.exp((a - life) / 5.5) : 0.05 * Math.exp((a - life) / 9);
    hazard *= 1.6 - m.health / 100;
    if (a > 110) hazard = 0.8;
    if (U.chance(Math.min(hazard, 0.75))) {
      if (a < 45) return die(U.pick(ancient() ? TL.ancient.txt('youngDeaths') : ['a car accident', 'a freak accident', 'a sudden aneurysm', 'a heart defect nobody knew about']));
      return die(U.pick(['natural causes', 'old age', 'heart failure', 'a stroke', 'old age, peacefully in my sleep']));
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
  // Someone in my life dies (old age, or a plague in js/medieval.js).
  function npcDies(p, cause) {
    var s = S();
    p.alive = false; p.died = s.year;
    var close = ['mother', 'father', 'sibling', 'spouse', 'child', 'grandparent', 'partner', 'fiance', 'grandchild'].indexOf(p.role) >= 0;
    log('⚰️ My ' + relWord(p) + ' ' + fullName(p) + ' died from ' + cause + ' at age ' + p.age + '.', close ? 'bad' : '');
    if (close) { stat('happy', -U.rand(10, 25)); queue('funeral', { pid: p.id }); startGrief(p); }
    if (TL.features) TL.features.onDeath(p);
    if (TL.health && TL.health.familyDeath) TL.health.familyDeath(p, cause); // family history (js/health.js)
    if (TL.dynasty) TL.dynasty.onDeath(p); // the crown may pass (js/eras.js)
    if (['mother', 'father', 'grandparent', 'spouse'].indexOf(p.role) >= 0 && p.money > 0) inherit(p);
    if ((p.role === 'mother' || p.role === 'father') && me().age >= 18) validateHome(); // no more living with parents who are gone
  }
  // Clubs: each year in one builds a skill and an application; years of
  // commitment can make me president; too many clubs drag my grades down.
  var CLUB_FX = { 'Chess Club': 'smarts', 'Debate Team': 'smarts', 'Robotics Club': 'smarts', 'Science Olympiad': 'smarts', 'Drama Club': 'acting', 'Band': 'music', 'Choir': 'music', 'Art Club': 'happy', 'Yearbook': 'happy', 'Student Council': 'popularity' };
  function clubYear(e) {
    var s = S(), m = me();
    if (!e.clubs || !e.clubs.length) return;
    e.clubYrs = e.clubYrs || {};
    e.clubs.forEach(function (c) {
      e.clubYrs[c] = (e.clubYrs[c] || 0) + 1;
      var fx = CLUB_FX[c];
      if (fx === 'smarts') stat('smarts', 1);
      else if (fx === 'acting' || fx === 'music') s.flags[fx] = (s.flags[fx] || 0) + 0.5;
      else if (fx === 'happy') stat('happy', 1);
      else if (fx === 'popularity') e.popularity = U.clamp((e.popularity || 30) + 3, 0, 100);
    });
    s.flags.clubYears = (s.flags.clubYears || 0) + e.clubs.length;
    var load = e.clubs.length + (e.team ? 1 : 0);
    if (load > 3) { e.grade = U.clamp(e.grade - 3 * (load - 3), 0, 100); stat('happy', -2); if (U.chance(0.5)) log('😵 Between ' + U.plural(load, 'club') + ' and teams, I\'m spread too thin. My grades are slipping.', 'bad'); }
    if (!e.pres && (e.stage === 'high' || e.stage === 'uni')) {
      var vet = e.clubs.filter(function (c) { return e.clubYrs[c] >= 2; })[0];
      if (vet && U.chance(0.04 + m.smarts / 900 + (e.popularity || 30) / 900)) { e.pres = vet; s.flags.clubPres = (s.flags.clubPres || 0) + 1; stat('happy', 5); log('🏅 I was elected president of the ' + vet + '!', 'good'); }
    }
  }
  // What clubs add to a university application (0 to 0.12).
  function clubBonus() { var f = S().flags; return Math.min(0.12, (f.clubYears || 0) * 0.01 + (f.clubPres ? 0.05 : 0)); }
  // A safety net: unemployment after losing a job, public assistance when broke.
  function benefitsOpen() { return !ancient() && S().year >= 1935 && me().age >= 18 && !S().prison; }
  function canClaimUI() { var s = S(); return benefitsOpen() && !s.job && !s.ui && s.uiElig && s.year - s.uiElig.year <= 1; }
  function claimUI() {
    var s = S();
    if (!canClaimUI()) return { ok: false, msg: 'I don\'t qualify for unemployment right now.' };
    s.ui = { pay: Math.min(Math.round(s.uiElig.pay * 0.4), $(20000)), left: 1 }; delete s.uiElig;
    return { ok: true, msg: 'I filed for unemployment. I\'ll get ' + fmt(s.ui.pay) + ' this year while I look for work.' };
  }
  function canAssist() { var s = S(); return benefitsOpen() && !s.job && !s.assist && !s.retired && s.money < $(2000); }
  function applyAssist() {
    var s = S();
    if (!canAssist()) return { ok: false, msg: 'I don\'t qualify for assistance.' };
    s.assist = true; stat('happy', -2);
    return { ok: true, msg: 'I signed up for public assistance. It isn\'t much, but it keeps food on the table.' };
  }
  function safetyNet(pay) {
    var s = S();
    if (s.ui) {
      if (s.job || s.prison) delete s.ui;
      else { pay(s.ui.pay, 'Unemployment'); if (--s.ui.left <= 0) { delete s.ui; log('📭 My unemployment benefits ran out.'); } }
    }
    if (s.uiElig && (s.job || s.year - s.uiElig.year > 1)) delete s.uiElig;
    if (s.assist) {
      if (s.job || s.retired || s.prison || s.money > $(20000) || !benefitsOpen()) { delete s.assist; if (s.job) log('👍 With a paycheck again, I came off public assistance.'); }
      else pay($(6000), 'Assistance');
    }
  }
  // Work friendships: close coworkers have my back, ones I've alienated don't,
  // and the good ones stay in my life after I leave.
  function coworkerYear() {
    var j = S().job;
    if (!j || j.partTime || j.perf == null || j.special || j.fame || j.politics || j.mil) return;
    var cw = people('coworker'), close = cw.filter(function (p) { return p.rel >= 60; }), sour = cw.filter(function (p) { return p.rel <= 15; });
    if (close.length) j.perf = U.clamp(j.perf + Math.min(2, close.length), 0, 100);
    if (sour.length && U.chance(0.3)) { j.perf = U.clamp(j.perf - 3, 0, 100); log('😒 ' + sour[0].first + ' took credit for my work in a meeting.', 'bad'); }
  }
  function leaveWork() {
    people('coworker', true).forEach(function (p) { // the late ones too, or they stay "coworker" forever
      if (p.alive && p.rel >= 70) { p.role = 'friend'; p.fyears = 0; log('🤝 ' + p.first + ' and I stayed friends after I left the job.'); }
      else p.role = 'former coworker';
    });
  }
  // Wedding anniversaries: the big ones (1, 5, 10, 25, 40, 50) ask how I'll mark them.
  var ANNIV = { 1: 'first', 5: 'fifth', 10: 'tenth', 25: 'silver', 40: 'ruby', 50: 'golden' };
  function anniversaryYear() {
    var s = S(), sp = people('spouse')[0];
    if (!sp) return;
    if (sp.wed == null) { sp.wed = s.year; return; } // saves from before v2.49 start counting now
    var yrs = s.year - sp.wed;
    if (ANNIV[yrs] && !s.prison && !s.pending.some(function (q) { return q.id === 'anniversary'; })) queue('anniversary', { pid: sp.id, yrs: yrs });
  }
  // Grief: losing someone close hurts for years, more the closer we were.
  // Visiting the grave, honoring them and counseling help it heal.
  function startGrief(p) {
    var s = S(), yrs = (p.rel >= 70 ? 4 : p.rel >= 40 ? 3 : 1) + (['spouse', 'child'].indexOf(p.role) >= 0 ? 1 : 0);
    s.griefs = (s.griefs || []).filter(function (g) { return g.pid !== p.id; });
    s.griefs.push({ pid: p.id, left: yrs, y: s.year });
  }
  function grief(pid) { return (S().griefs || []).filter(function (g) { return g.pid === pid; })[0] || null; }
  function easeGrief(pid, n) {
    var s = S(), g = grief(pid);
    if (!g) return false;
    g.left = Math.max(g.y === s.year ? 1 : 0, g.left - n); // comfort helps, but no one is over a loss the year it happens
    if (!g.left) { s.griefs = s.griefs.filter(function (x) { return x !== g; }); var p = person(pid); if (p) log('🕊️ I\'ve made peace with losing ' + p.first + '. I still think of them often.'); }
    return true;
  }
  function griefYear() {
    var s = S();
    if (!s.griefs || !s.griefs.length) return;
    s.griefs.slice().forEach(function (g) {
      if (!person(g.pid)) { s.griefs = s.griefs.filter(function (x) { return x !== g; }); return; }
      if (g.y === s.year) return; // the year they died already hurt enough; healing starts next year
      stat('happy', -(1 + Math.min(4, g.left))); // the hurt fades a little each year
      easeGrief(g.pid, 1);
    });
  }
  // Friendships have a history: they count the years, mark the milestones,
  // and a best friend shows up when life is hard. Neglected ones drift apart.
  var FRIEND_MILES = { 10: 'ten', 25: 'twenty-five', 40: 'forty', 60: 'sixty' };
  function friendYear(p) {
    var m = me();
    p.fyears = (p.fyears || 0) + 1;
    var best = p.role === 'best friend';
    if (FRIEND_MILES[p.fyears] && p.rel >= 40) {
      stat('happy', best ? 4 : 2);
      log((best ? '💛 ' : '🤝 ') + p.first + ' and I have been ' + (best ? 'best ' : '') + 'friends for ' + FRIEND_MILES[p.fyears] + ' years.');
    }
    if (best && p.rel < 35) {
      p.role = 'friend';
      log('💔 ' + p.first + ' and I aren\'t as close as we were. We\'re still friends, just not best friends.');
    } else if (!best && p.rel <= 6 && p.fyears >= 3 && U.chance(0.5)) {
      p.role = 'former friend';
      log('🍂 ' + p.first + ' and I drifted apart. We haven\'t really talked in years.');
    } else if (best && p.rel >= 55 && m.happy < 35 && m.age >= 8 && !(p.helped > S().year - 5) && U.chance(0.6)) {
      p.helped = S().year; stat('happy', U.rand(5, 9)); rel(p, 3);
      log('🫂 ' + p.first + ' could tell I was struggling and showed up for me. That\'s what best friends do.');
    }
  }
  function yearlyPeople() {
    var s = S(), m = me();
    s.people.forEach(function (p) {
      if (!p.alive) return;
      p.age++;
      // relationship decay
      if (['classmate', 'coworker', 'former classmate'].indexOf(p.role) < 0) {
        // Family bonds fade slowly and rarely to nothing; friendships fade faster.
        var family = ['mother', 'father', 'stepmother', 'stepfather', 'sibling', 'child', 'grandparent', 'grandchild'].indexOf(p.role) >= 0;
        var decay = p.role === 'spouse' || p.role === 'partner' || p.role === 'fiance' ? U.rand(1, 6) : family ? (p.rel > 40 ? U.rand(0, 2) : U.chance(0.4) ? 1 : 0) : p.role === 'best friend' ? U.rand(0, 2) : U.rand(0, 4);
        rel(p, -decay);
      }
      if (p.role === 'friend' || p.role === 'best friend') friendYear(p);
      if (p.age === 5 && p.job === 'Toddler') p.job = ancient() ? TL.ancient.txt('child') : 'Student';
      if (p.age === 15 && p.job === 'Child') p.job = npcJob(20);
      if (p.age === 18 && p.job === 'Student') {
        // My own kids' next step is a family decision; everyone else's is a coin flip.
        if (p.role === 'child' && !ancient() && !s.dead) { if (p.collegePaid) p.job = 'University Student'; else queue('kid_after_school', { pid: p.id }); }
        else p.job = U.chance(0.5) ? 'University Student' : npcJob(24);
      }
      // The decision never got made (dialog skipped): settle it the usual way so no one stays a "Student" forever.
      if (p.age >= 19 && p.job === 'Student' && !s.pending.some(function (q) { return q.id === 'kid_after_school' && q.data && q.data.pid === p.id; })) p.job = p.age < 22 && U.chance(0.5) ? 'University Student' : npcJob(Math.max(24, p.age));
      if (p.age === 20 && p.job === 'Trade School Student') { p.job = npcJobFor(20, 'trade'); if (p.role === 'child') log('🔧 My ' + relWord(p) + ' ' + p.first + ' finished trade school and works as ' + an(p.job) + ' now.', 'good'); }
      if (p.age === 23 && p.job === 'University Student') {
        p.job = npcJobFor(p.role === 'child' ? 30 : 26, 'bachelor'); p.degree = true; // graduates land jobs that need a degree
        if (p.role === 'child') { log('🎓 My ' + relWord(p) + ' ' + p.first + ' graduated from university! Now: ' + p.job + '.', 'good'); stat('happy', 4); }
      }
      if (p.age === 67 && p.job !== 'Retired' && U.chance(0.7)) p.job = 'Retired';
      p.money = Math.round(p.money * 1.02 + (p.age >= 18 && p.job !== 'Unemployed' && p.job !== 'Student' ? $(U.rand(1000, 8000)) : 0));
      // death
      // Real-world-ish mortality: about 1% a year at 60, 6% at 80, a third at 100,
      // shifted by the country's life expectancy.
      var hazard = p.age < 45 ? 0.0015 : 0.06 * Math.exp((p.age - 80 + (79 - country().life) - (TL.history ? TL.history.lifeGap(s.year) * 0.55 : 0)) / 11.5);
      // Poor health raises the odds a lot; people who are only a bit run down recover slowly.
      var ph = p.health == null ? 70 : p.health;
      hazard = ph <= 0 ? 1 : hazard * (ph < 10 ? 6 : ph < 25 ? 3 : ph < 45 ? 1.6 : 1); // nobody lives on at zero health
      if (ph < 70 && p.age < 75) p.health = Math.min(100, ph + U.rand(0, 5));
      if (ph <= 0 || U.chance(Math.min(0.8, hazard))) {
        // Causes that fit the person's age and the era.
        var yr = s.year, old = yr < 1950, nd = ancient() && TL.ancient.txt('npcDeaths');
        var cause = nd ? U.pick(p.age > 60 ? nd.old : p.age < 18 ? nd.young : nd.adult) : p.age > 70 ? U.pick(['natural causes', 'a heart attack', 'cancer', 'a stroke', 'pneumonia'].concat(old ? ['tuberculosis'] : []))
          : p.age < 18 ? U.pick(old ? ['scarlet fever', 'polio', 'pneumonia', 'an accident', 'diphtheria'] : ['an accident', 'a rare illness', 'cancer', 'a car accident'])
          : U.pick((old ? ['tuberculosis', 'pneumonia', 'an accident at work'] : ['an overdose', 'a boating accident']).concat(['cancer', 'a heart attack', yr >= 1915 ? 'a car accident' : 'a riding accident']).concat(yr === 1918 || yr === 1919 ? ['the Spanish flu', 'the Spanish flu'] : []));
        if (TL.dynasty && ancient()) cause = TL.dynasty.deathCause(p) || cause; // a reigning king doesn't die of "an accident at work"
        npcDies(p, cause);
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
        // Brothers and sisters share one family name, and never a first name.
        if (!c.kidsLast) c.kidsLast = c.gender === 'M' ? c.last : U.pick([c.last, randomName('M').last]);
        var g = addPerson({ role: 'grandchild', age: 0, last: c.kidsLast, rel: U.rand(60, 85), money: 0, job: 'Toddler' });
        g.parentId = c.id;
        var taken = people('grandchild', true).filter(function (q) { return q.parentId === c.id && q !== g; }).map(function (q) { return q.first; }).concat([c.first]);
        if (!country().ancient && taken.indexOf(g.first) >= 0) { var cty0 = country(), free0 = ((g.gender === 'M' ? cty0.male : cty0.female) || []).filter(function (n) { return taken.indexOf(n) < 0; }); if (free0.length) g.first = U.pick(free0); }
        log('👶 My ' + (c.gender === 'M' ? 'son' : 'daughter') + ' ' + c.first + ' had a baby ' + (g.gender === 'M' ? 'boy' : 'girl') + ', ' + g.first + '! I\'m a grandparent' + (gkids ? ' again' : '') + '!', 'good');
        stat('happy', 8);
      }
    });
    // Pregnancy resolution
    if (s.flags.pregnant) {
      var other = person(s.flags.pregnant.with), viaSurrogate = s.flags.pregnant.surrogate;
      delete s.flags.pregnant;
      haveBaby(other, { surrogate: viaSurrogate });
    }
    // Pets
    petsToShelter();
    s.pets.forEach(function (pet) {
      pet.age++;
      // While I'm locked up, family looks after them and we drift apart.
      pet.rel = U.clamp(pet.rel - U.rand(3, 8) - (s.prison ? 6 : 0), 0, 100);
      // Trained pets are a joy; a best friend even more so (js/actions.js).
      if (!s.prison) { if (pet.trained) stat('happy', pet.trained); if (pet.rel >= 80) stat('happy', 2); }
      if (pet.sick) {
        if (U.chance(0.35)) { log('🐾 ' + pet.name + ' got over ' + pet.sick + ' without the vet.'); pet.sick = null; }
        else { pet.life -= 1; pet.rel = U.clamp(pet.rel - 5, 0, 100); log('🐾 ' + pet.name + ' is still suffering from ' + pet.sick + '.', 'bad'); }
      } else if (U.chance(0.07 + (pet.age > pet.life * 0.7 ? 0.08 : 0))) {
        pet.sick = U.pick(['an ear infection', 'a stomach bug', 'an injured leg', 'a parasite', 'a skin infection']);
        log('🤒 ' + pet.name + ' seems unwell. It looks like ' + pet.sick + '.', 'bad');
      }
      if (pet.age > pet.life - 2 && U.chance(0.35 + (pet.age - pet.life) * 0.2 + (pet.sick ? 0.15 : 0) - (pet.rel >= 80 ? 0.12 : 0))) {
        pet.dead = true;
        var together = s.year - (pet.got || s.year);
        log('🐾 My ' + pet.species.toLowerCase() + ' ' + pet.name + ' passed away' + (together >= 2 ? ' after ' + together + ' years together' : '') + '.', 'bad');
        // Grief scales with the bond.
        stat('happy', -Math.round(4 + pet.rel / 8));
      } else if (!s.prison && pet.rel < 20 && /^(Dog|Cat|Horse|Parrot)$/.test(pet.species) && U.chance(0.3) && !s.pending.some(function (q) { return q.id === 'pet_lost'; })) {
        // Neglected pets wander off.
        queue('pet_lost', { id: pet.id });
      }
    });
    s.pets = s.pets.filter(function (p) { return !p.dead; });
    // NPC relationship drama with partner
    var pt = partner();
    if (pt && pt.rel < 15 && U.chance(0.4)) {
      if (pt.role === 'spouse') queue('spouse_leaves', { pid: pt.id });
      else { log(pt.first + ' broke up with me. 💔', 'bad'); pt.role = 'ex'; s.counts.exes++; stat('happy', -15); }
    }
    if (TL.mind) TL.mind.yearly(); // the people in my life act on their own (js/mind.js)
    if (TL.talents) TL.talents.yearly(); // a hidden gift may show itself
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
      // A big estate and a grown sibling can mean a fight over the will (js/events.js).
      var sibs = people(['sibling']).filter(function (q) { return q.age >= 18; });
      if ((p.role === 'mother' || p.role === 'father') && sibs.length && share > $(40000) && !s.prison && U.chance(0.35)) {
        var rival = sibs.slice().sort(function (a, b) { return a.rel - b.rel; })[0];
        queue('estate_dispute', { share: share, from: p.first, rel: relWord(p), sib: rival.id });
        return;
      }
      addMoney(share);
      log('📜 I inherited ' + fmt(share) + ' from ' + p.first + '.', 'good');
    }
  }
  // Brothers and sisters never share a first name, however they joined the family.
  function uniqueKidName(kid) {
    var cty = country(), used = people(['child'], true).filter(function (q) { return q !== kid; }).map(function (q) { return q.first; }).concat([me().first]);
    if (cty.ancient || used.indexOf(kid.first) < 0) return;
    var free = ((kid.gender === 'M' ? cty.male : cty.female) || []).filter(function (n) { return used.indexOf(n) < 0 && n !== kid.last; });
    if (free.length) kid.first = U.pick(free);
  }
  function haveBaby(other, o) {
    var s = S();
    o = o || {};
    var last = me().last;
    var baby = addPerson({ role: 'child', age: 0, last: last, rel: 90, money: 0, job: 'Toddler' });
    baby.otherParent = other ? other.id : null;
    // Brothers and sisters never share a first name (not even twins). Roman
    // daughters sharing the family name is history, so ancient eras keep theirs.
    var cty = country();
    uniqueKidName(baby);
    s.counts.kids++;
    var who = o.surrogate ? 'Our surrogate gave birth to' : me().gender === 'F' ? 'I gave birth to' : (other && other.gender === 'F' ? other.first + ' gave birth to' : 'We welcomed');
    // Outside the ancient eras I get to name my own children (js/events.js baby_name).
    var naming = !cty.ancient && !s.dead;
    if (naming) queue('baby_name', { id: baby.id });
    if (o.twin) log('👶 ...and a second baby ' + (baby.gender === 'M' ? 'boy' : 'girl') + (naming ? '' : ', ' + baby.first) + '! It\'s twins! 👯', 'good');
    else log('👶 ' + who + ' a baby ' + (baby.gender === 'M' ? 'boy' : 'girl') + (naming ? '' : ' named ' + baby.first) + '!', 'good');
    stat('happy', 15);
    achieve('parent');
    if (!o.twin && U.chance(0.03)) { haveBaby(other, { twin: true }); achieve('twins'); }
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
    } else {
      if (U.chance(0.1)) { log('I got into a fight with another inmate.', 'bad'); stat('health', -U.rand(5, 20)); }
      // Halfway through a long sentence I can go before the parole board every year.
      if (!ancient() && s.prison.total >= 3 && s.prison.served >= Math.ceil(s.prison.total / 2)) queue('parole_hearing');
    }
  }
  // My chance of parole: how I've behaved inside and the kind of person I am.
  function paroleOdds() {
    var pr = S().prison;
    return pr ? U.clamp(0.12 + (pr.conduct || 0) * 0.07 + (S().karma - 50) / 250 + (pr.hearings || 0) * 0.02, 0.03, 0.8) : 0;
  }
  function parole() {
    var s = S(), pr = s.prison;
    s.parole = { until: s.year + pr.remaining, from: pr.name };
    log('🔓 I was released on parole from ' + pr.name + ' after serving ' + U.plural(pr.served, 'year') + '. I have to stay out of trouble until ' + s.parole.until + '.', 'good');
    s.prison = null; stat('happy', 18);
  }
  // Seven clean years after my last conviction, a court can seal my record.
  function expungeable() {
    var s = S(), last = s.record.reduce(function (a, r) { return Math.max(a, r.year + (r.years || 0)); }, 0);
    return s.record.length && !s.prison && !s.parole && !ancient() && s.year - last >= 7 && me().age >= 18;
  }
  function yearlyParole() {
    var s = S();
    if (s.parole && s.year >= s.parole.until) { delete s.parole; log('✅ I completed my parole. I\'m truly free.', 'good'); stat('happy', 5); }
  }
  function jail(years, crime) {
    var s = S();
    if (years <= 0 && s.parole && s.parole.until > s.year) years = 0.5; // even a small offense breaks parole
    if (years <= 0) {
      log('I got off with a warning and a fine.', 'bad');
      addMoney(-$(U.rand(200, 1500)));
      s.record.push({ crime: crime, year: s.year, years: 0 });
      return;
    }
    if (s.parole && s.parole.until > s.year) {
      // Breaking parole sends me back for the rest of my old sentence too.
      years = Math.round(years) + s.parole.until - s.year;
      log('🚨 I broke my parole, so the rest of my old sentence was added on.', 'bad');
    }
    delete s.parole;
    s.record.push({ crime: crime, year: s.year, years: years });
    s.prison = { remaining: years, total: years, served: 0, crime: crime, name: U.pick(['Blackrock', 'Ironwood', 'Stonegate', 'Redfield', 'Graymoor', 'Kingsbridge']) + (me().age < 18 ? ' Juvenile Detention Center' : ' State Penitentiary'), appealed: false };
    if (s.job) fire('Being sent to prison cost me my job.');
    if (s.edu) { log('I was expelled from ' + s.edu.school + '.', 'bad'); s.edu = null; }
    log('⛓️ I was sentenced to ' + U.plural(years, 'year') + ' in ' + s.prison.name + ' for ' + crime.toLowerCase() + '.', 'bad');
    stat('happy', -30);
    achieve('jailbird');
    var pt = partner();
    if (pt && U.chance(0.4)) { log(pt.first + ' left me after hearing I was going to prison.', 'bad'); pt.role = 'ex'; s.counts.exes++; }
    petsToShelter();
  }

  // ---------- event queue ----------
  // Caring for an aging parent: at home (cheaper, harder on me) or in a care home.
  var CARE_COST = { home: 4000, carehome: 24000 };
  function careYear() {
    var s = S(), c = s.flags.care;
    if (!c) return 0;
    var p = person(c.pid);
    if (!p || !p.alive) {
      if (p) log('🕊️ I looked after my ' + relWord(p) + ' ' + p.first + ' until the end. I\'m glad I did.', 'good');
      delete s.flags.care; return 0;
    }
    if (s.prison) { log('🏥 With me in prison, ' + p.first + ' moved into a state care home.', 'bad'); rel(p, -10); delete s.flags.care; return 0; }
    c.years = (c.years || 0) + 1;
    p.health = U.clamp(p.health + U.rand(c.kind === 'home' ? 2 : 1, c.kind === 'home' ? 6 : 4), 0, 100);
    rel(p, c.kind === 'home' ? 3 : 1);
    if (c.kind === 'home') { stat('happy', -2); stat('health', -1); if (c.years % 4 === 0) log('🫶 ' + U.plural(c.years, 'year') + ' of looking after ' + p.first + '. Some days are hard, most are worth it.'); }
    return $(CARE_COST[c.kind]);
  }
  function stopCare() {
    var s = S(), c = s.flags.care; if (!c) return null;
    var p = person(c.pid); delete s.flags.care;
    if (p && p.alive) { rel(p, -15); return p; }
    return null;
  }
  // College funds I've set up for my children and grandchildren: invested, then paid out at 18.
  function collegeFunds() {
    var s = S();
    if (s.collegeFund > 0) s.collegeFund = Math.round(s.collegeFund * U.randf(1.03, 1.08)); // my own fund keeps growing until I use it
    s.people.forEach(function (p) {
      if (!p.fund) return;
      if (!p.alive) { addMoney(p.fund); log('🎓 The college fund I saved for ' + p.first + ' came back to me (' + fmt(p.fund) + ').'); p.fund = 0; return; }
      p.fund = Math.round(p.fund * U.randf(1.03, 1.08)); // a modest investment return
      if (p.age >= 18) {
        log('🎓 ' + p.first + '\'s college fund (' + fmt(p.fund) + ') paid for ' + (p.gender === 'M' ? 'his' : 'her') + ' education. Best money I ever spent.', 'good');
        p.money = (p.money || 0) + p.fund; p.fund = 0; p.collegePaid = true; rel(p, 10); stat('happy', 4);
      }
    });
  }
  // In prison, my pets need someone on the outside, or they go to a shelter.
  function petsToShelter() {
    var s = S();
    if (!s.prison || !s.pets.length || partner() || people(['mother', 'father', 'sibling', 'child']).some(function (p) { return p.age >= 18; })) return;
    log('🐾 With nobody to look after them, ' + (s.pets.length > 1 ? 'my pets were' : s.pets[0].name + ' was') + ' taken to a shelter.', 'bad');
    s.pets = [];
  }
  function queue(id, data) { S().pending.push({ id: id, data: data || {} }); }

  // ---------- achievements ----------
  function checkAchievements() {
    var s = S(), nw = netWorth(), m = me();
    if (TL.features && !s.dead) TL.features.checkBucket();
    if (TL.world && !s.dead) TL.world.checkChallenges();
    if (nw >= 1e6) achieve('millionaire');
    if (nw >= 1e9) achieve('billionaire');
    if (s.assets.some(function (a) { return a.kind === 'house'; })) achieve('homeowner');
    if (s.assets.filter(function (a) { return a.kind === 'house'; }).length >= 5) achieve('mogul');
    if (s.followers >= 1e6) achieve('influencer');
    if (s.channel && s.channel.subs >= 1e6) achieve('creator_gold');
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
    aging = true;
    try { ageUpInner(s, m); } finally { aging = false; }
  }
  function ageUpInner(s, m) {
    snapshot();
    m.age++; s.year++;
    s.lastActs = s.yearActs; s.yearActs = {};
    s.log.push({ age: m.age, year: s.year, entries: [] });

    yearlyPrison();
    yearlyParole();
    progressSchool();
    var earned = progressJob();
    if (TL.racing) TL.racing.youthYear(); // kids in karts race without a job
    if (TL.gamedev) TL.gamedev.youthYear(); // and kids make games after school
    collegeFunds();
    fameProgress();
    if (m.age >= 16 || s.money !== 0 || s.assets.length) yearlyFinances(earned);
    yearlyHome();
    yearlyHealth();
    yearlyPeople();
    griefYear();
    anniversaryYear();
    if (TL.features) TL.features.yearly();
    if (m.age === 18 && !s.prison) log('I\'m officially an adult now! 🎉');
    // Allowance for kids from parents
    if (m.age >= 6 && m.age < 18 && !s.prison) {
      var par = people(['mother', 'father']).filter(function (p) { return p.rel > 50 && p.money > $(20000); })[0];
      if (par && U.chance(0.5)) { var al = $(U.rand(50, 600)) * (s.flags.wealth === 'rich' ? 10 : 1); addMoney(al); }
    }
    // social media passive growth
    if (TL.social) TL.social.yearly(); // platforms, deals, DMs and drama (js/social.js)
    if (TL.celebs) TL.celebs.yearly(); // life with a famous partner (js/celebs.js)
    else if (s.social.platform && s.followers > 0) {
      s.followers = Math.max(0, Math.round(s.followers * U.randf(0.9, 1.2) + s.fame * U.rand(50, 500)));
    }
    if (m.age >= 18 && people('friend').length < 1 && U.chance(0.3)) {
      var f = addPerson({ role: 'friend', age: m.age + U.rand(-4, 4), rel: U.rand(40, 70) });
      log('I made a new friend, ' + fullName(f) + '.');
    }
    if (!s.edu && m.age >= 18 && people('coworker').length < 2 && s.job && !s.job.partTime) {
      addPerson({ role: 'coworker', age: m.age + U.rand(-10, 15), rel: U.rand(30, 60) });
    }
    if (!s.job) leaveWork();
    else coworkerYear();
    // Out of school, classmates become old classmates.
    if (!s.edu) people('classmate').forEach(function (p) { p.role = 'former classmate'; });

    // History happens (js/history.js): wars, pandemics, crashes, big moments.
    if (TL.history) TL.history.yearly();
    if (ancient() && TL.ancient && !s.dead) TL.ancient.yearly();
    if (!s.dead) TL.events.roll();
    // Reputation fades: old good deeds (and old sins) matter a little less each
    // year, so karma reflects how I've been living lately, not one act at 12.
    s.karma = Math.round((s.karma + (50 - s.karma) * 0.02) * 10) / 10;
    // When my reputation crosses into a new tier, I hear about it.
    var tier = function (k) { return k >= 85 ? 2 : k >= 65 ? 1 : k >= 40 ? 0 : k >= 20 ? -1 : -2; };
    var kt = s.flags.kTier;
    if (kt == null) kt = s.flags.kTier = tier(s.karma);
    else if (tier(s.karma - 3) > kt) kt = tier(s.karma - 3); // a 3-point margin so it doesn't flicker
    else if (tier(s.karma + 3) < kt) kt = tier(s.karma + 3);
    if (kt !== s.flags.kTier) {
      var up = kt > s.flags.kTier;
      if (m.age >= 12 && !ancient()) log(up ? (kt === 2 ? '😇 People talk about me as one of the kindest people they know.' : kt === 1 ? '🙂 People have started to see me as a genuinely good person.' : '🙂 People are starting to trust me again.')
             : (kt === -2 ? '😈 My name has become a byword for cruelty.' : kt === -1 ? '😒 People have started to see me as shady.' : kt === 1 ? '😐 People don\'t think of me as a saint anymore.' : '😐 People aren\'t sure what to make of me anymore.'), up ? 'good' : 'bad');
      s.flags.kTier = kt;
    }
    // Yearly snapshot for the life chart.
    s.hist = s.hist || [];
    s.hist.push([m.age, netWorth(), m.happy]);
    if (s.hist.length > 130) s.hist.shift();
    if (!s.dead && !deathCheck()) checkAchievements();
    s.updated = Date.now();
  }

  // ---------- legacy / continue as child ----------
  function heirs() {
    var kids = people('child'), r = S().anc && S().anc.rule;
    // A ruler's named heir comes first (js/eras.js).
    if (r && r.heir) kids.sort(function (a, b) { return (b.id === r.heir) - (a.id === r.heir); });
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
      // My brothers and sisters: any college fund our parent saved for them is theirs now.
      kids.forEach(function (k) { if (k.id !== c.id) { k.role = 'sibling'; if (k.fund) { k.money = (k.money || 0) + k.fund; k.fund = 0; } newPeople.push(k); } });
      // carry forward the heir's own spouse and children
      s.people.forEach(function (p) {
        if (p.role === 'in-law' && p.spouseOf === c.id) { p.role = 'spouse'; delete p.spouseOf; newPeople.push(p); }
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
    if (TL.talents) TL.talents.roll(dead.talents); // gifts can run in the family
    if (s.city) st.city = st.birthCity = s.city; // the family stays in the same city
    st.log[0] = { age: c.age, year: s.year, entries: [] };
    log('👑 Generation ' + gen + ': I am ' + c.first + ' ' + c.last + ', age ' + c.age + '.');
    log('My ' + (viaGrandchild ? 'grand' : '') + (dead.gender === 'M' ? 'father' : 'mother') + ', ' + dead.first + ', died from ' + s.cause + '.');
    if (inheritance > 0) log('📜 I inherited ' + fmt(inheritance) + ' from ' + his(dead) + ' estate.', 'good');
    // Earlier eras have no schools to enroll in; the family's standing carries on (js/eras.js).
    if (ancient() && TL.ancient) TL.ancient.heir(s.anc, s);
    else {
      if (c.age >= 6 && c.age < 18) { st.edu = null; enroll(c.age < 11 ? 'elementary' : c.age < 14 ? 'middle' : 'high'); st.edu.year = c.age - (c.age < 11 ? 5 : c.age < 14 ? 10 : 13); }
      if (c.age >= 18) st.degrees.push({ type: 'hs' });
    }
    st.flags.wealth = inheritance > $(1000000) ? 'rich' : 'middle';
    // A college fund saved for me carries over (js/actions.js personItems, enrollUni 'fund').
    if (c.fund > 0) { st.collegeFund = Math.round(c.fund); log('🎓 ' + (viaGrandchild ? 'My grandparent' : 'My parent') + ' left a college fund in my name: ' + fmt(st.collegeFund) + '.', 'good'); }
    if (TL.extras) TL.extras.recordAncestor(s, st);
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
    if (s.bucket && s.bucket.length && s.bucket.every(function (b) { return b.done; })) r.push(['📝', 'Fulfilled', 'Checked off my whole bucket list.']);
    if (s.royal && s.royal.monarch) r.push(['👑', 'Monarch', 'Ruled the realm.']);
    if (s.flags.space) r.push(['🚀', 'Astronaut', 'Touched the stars.']);
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
    // Everyday lives get a label that fits them too, not just "Ordinary".
    var h = s.hist || [], avg = h.length ? h.reduce(function (t, x) { return t + x[2]; }, 0) / h.length : m.happy;
    var sp = people('spouse')[0], kids = people('child', true).length;
    if (!r.length && sp && !s.counts.exes && m.age >= 50) r.push(['💞', 'Devoted', 'One great love, for life.']);
    if (!r.length && (s.lived || []).length >= 2) r.push(['🌍', 'Globetrotter', 'Made a home in ' + ((s.lived || []).length + 1) + ' countries.']);
    if (!r.length && avg >= 70) r.push(['🌻', 'Content', 'Happy most days, and that was enough.']);
    if (!r.length && m.age >= 85) r.push(['🌳', 'Long life', 'Saw ' + m.age + ' years go by.']);
    if (!r.length && !sp && !kids && m.age >= 50) r.push(['🌙', 'Solitary', 'Walked through life mostly alone.']);
    if (!r.length && avg < 35) r.push(['🌧️', 'Hard times', 'Life was a struggle more often than not.']);
    if (!r.length && s.jobHistory.concat(s.job ? [s.job] : []).reduce(function (t, j) { return t + (j.years || 0); }, 0) >= 35) r.push(['🔨', 'Hard worker', 'Put in decades of honest work.']);
    if (!r.length) r.push(['🙂', 'Ordinary', 'A quiet, ordinary life.']);
    return r[0];
  }
  function recordHistory() {
    var s = S(), g = loadGlobal();
    var rb = ribbon();
    g.history.unshift({ id: s.id, name: me().first + ' ' + me().last, age: me().age, cause: s.cause, worth: fmt(netWorth()), ribbon: rb[0] + ' ' + rb[1], country: s.country, gen: s.gen, year: s.year });
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
      saveSnaps(s, idx);
      // drop saves that fell out of the index
      var keep = idx.slice(0, 12).map(function (x) { return x.id; });
      idx.slice(12).forEach(function (x) { if (keep.indexOf(x.id) < 0) store.removeItem('thelife.save.' + x.id); });
    } catch (e) { }
  }
  // ---------- time machine ----------
  // A snapshot of the end of each of the last few years: everything except the
  // log and chart history, which are trimmed back instead. Snapshots live under
  // their own key (only for the most recently played lives) so saves stay small.
  var TM_MAX = 5;
  var tm = { id: null, snaps: [] };
  function tmSnaps() {
    var s = S();
    if (tm.id !== s.id) {
      tm.id = s.id;
      try { tm.snaps = JSON.parse(store.getItem('thelife.tm.' + s.id) || '[]'); } catch (e) { tm.snaps = []; }
    }
    return tm.snaps;
  }
  function snapshot() {
    var s = S(), copy = {};
    Object.keys(s).forEach(function (k) { if (k !== 'log' && k !== 'hist') copy[k] = s[k]; });
    var snap = JSON.parse(JSON.stringify(copy));
    var last = s.log[s.log.length - 1];
    snap.pending = [];
    snap._tm = { logAge: last ? last.age : s.me.age, logN: last ? last.entries.length : 0 };
    var list = tmSnaps();
    list.push(snap);
    while (list.length > TM_MAX) list.shift();
  }
  function saveSnaps(s, idx) {
    if (tm.id === s.id) {
      try { store.setItem('thelife.tm.' + s.id, JSON.stringify(tm.snaps)); }
      catch (e) {
        // Storage is tight: keep fewer snapshots rather than none.
        tm.snaps = tm.snaps.slice(-2);
        try { store.setItem('thelife.tm.' + s.id, JSON.stringify(tm.snaps)); } catch (e2) { }
      }
    }
    idx.slice(3).forEach(function (x) { store.removeItem('thelife.tm.' + x.id); });
  }
  // Ages you can travel back to, most recent first.
  function tmAges() {
    return tmSnaps().slice().reverse().map(function (sn) { return sn.me.age; });
  }
  function timeTravel(k) {
    var s = S(), list = tmSnaps();
    if (!k || k > list.length) return false;
    var snap = list[list.length - k], meta = snap._tm, logArr = s.log, cut = -1;
    for (var i = logArr.length - 1; i >= 0; i--) if (logArr[i].age === meta.logAge) { cut = i; break; }
    var st = JSON.parse(JSON.stringify(snap));
    delete st._tm;
    if (cut >= 0) {
      st.log = logArr.slice(0, cut + 1);
      var y = st.log[cut];
      st.log[cut] = { age: y.age, year: y.year, entries: y.entries.slice(0, meta.logN) };
    } else st.log = [{ age: st.me.age, year: st.year, entries: [] }];
    st.hist = (s.hist || []).filter(function (h) { return h[0] <= st.me.age; });
    var wasDead = s.dead;
    TL.S = st;
    tm.snaps = list.slice(0, list.length - k);
    if (wasDead) {
      var g = loadGlobal();
      g.history = g.history.filter(function (h) { return h.id !== st.id; });
      saveGlobal(g);
    }
    log('⏳ I used the Time Machine to go back to age ' + st.me.age + '.', 'good');
    achieve('timetraveler');
    return true;
  }
  function wipeAll() {
    listSaves().forEach(function (x) { store.removeItem('thelife.save.' + x.id); store.removeItem('thelife.tm.' + x.id); });
    tm = { id: null, snaps: [] };
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
    store.removeItem('thelife.tm.' + id);
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
    ancient: ancient, yearLabel: yearLabel, illName: illName, illWith: illWith, illLow: illLow, npcDies: npcDies, ANNIV: ANNIV, ROUTINES: ROUTINES, canClaimUI: canClaimUI, claimUI: claimUI, canAssist: canAssist, applyAssist: applyAssist, clubBonus: clubBonus, leaveWork: leaveWork, grief: grief, easeGrief: easeGrief,
    home: home, homeLabel: homeLabel, rentCost: rentCost, RENT_TIERS: RENT_TIERS, validateHome: validateHome, moveHome: moveHome, ownedHome: ownedHome, parentsAround: parentsAround,
    exportAll: exportAll, importAll: importAll, wipeAll: wipeAll, tmAges: tmAges, timeTravel: timeTravel,
    countryName: countryName, jobPhrase: jobPhrase, an: an,
    S: S, me: me, country: country, k: k, $: $, fmt: fmt, fullName: fullName, relWord: relWord, moodTarget: moodTarget, he: he, his: his, him: him,
    log: log, stat: stat, addMoney: addMoney, karma: karma, fame: fame, person: person, people: people,
    partner: partner, rel: rel, stopCare: stopCare, CARE_COST: CARE_COST, hasDegree: hasDegree, eduRank: eduRank, highestDegree: highestDegree,
    degreeName: degreeName, hasCondition: hasCondition, addCondition: addCondition, removeCondition: removeCondition,
    achieve: achieve, netWorth: netWorth, paroleOdds: paroleOdds, parole: parole, expungeable: expungeable, RET_PLANS: RET_PLANS, retPlanBlock: retPlanBlock, statePension: statePension, credit: credit, creditWord: creditWord, bankruptcy: bankruptcy, makePerson: makePerson, addPerson: addPerson, randomName: randomName, npcJob: npcJob, npcJobFor: npcJobFor,
    newLife: newLife, enroll: enroll, enrollUni: enrollUni, enrollGrad: enrollGrad, enrollTrade: enrollTrade, dropOut: dropOut, gradeLetter: gradeLetter,
    eduYears: eduYears, jobSalary: jobSalary, jobTitle: jobTitle, companyName: companyName, eligible: eligible, applyJob: applyJob,
    applyPartTime: applyPartTime, quitJob: quitJob, fire: fire, retire: retire, fameAudition: fameAudition,
    statLabel: statLabel, statValue: statValue, haveBaby: haveBaby, jail: jail, queue: queue, die: die,
    runForOffice: runForOffice, reelect: reelect, campaigns: CAMPAIGNS, campaignCost: campaignCost, electionChance: electionChance,
    ageUp: ageUp, heirs: heirs, continueAs: continueAs, uniqueKidName: uniqueKidName, ribbon: ribbon, checkAchievements: checkAchievements,
    save: save, load: load, listSaves: listSaves, deleteSave: deleteSave, loadGlobal: loadGlobal, saveGlobal: saveGlobal,
    schoolName: schoolName
  };
})();
