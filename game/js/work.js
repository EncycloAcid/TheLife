/* TheLife — v1.15: deeper regular jobs. Every job has a boss with a
 * personality, big projects to lead (or dodge), one-on-ones, raise
 * negotiations, outside offers to job-hop or negotiate with, and a yearly
 * performance review with a merit raise and a clear path to promotion.
 * State lives on the job: job.boss, job.won (a project win this year),
 * job.review. Special careers (fame, politics, military, basketball,
 * acting, part-time) keep their own systems. */
TL.work = (function () {
  var U = TL.util, D = TL.data, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function count(key) { var y = S().yearActs || (S().yearActs = {}); return y[key] || 0; }
  function bump(key) { var y = S().yearActs || (S().yearActs = {}); y[key] = (y[key] || 0) + 1; }

  function regular(j) { return !!(j && !j.partTime && !j.fame && !j.politics && !j.mil && !j.hoops && !j.acting); }
  // Boss personalities change what works with them.
  var BOSS_TRAITS = {
    Supportive: 'cares about growth and rewards honest effort',
    Demanding: 'expects a lot and respects results',
    Micromanager: 'wants updates on everything',
    Hands_off: 'leaves people alone and hates being bothered',
    Political: 'cares about who gets credit',
    Visionary: 'loves big ideas'
  };
  function boss(j) {
    if (!j.boss) {
      var g = U.pick(['M', 'F']), n = E.randomName(g);
      j.boss = { first: n.first, last: n.last, gender: g, rel: U.rand(40, 60), trait: U.pick(Object.keys(BOSS_TRAITS)) };
    }
    return j.boss;
  }
  function bossName(b) { return b.first + ' ' + b.last; }
  function traitName(b) { return b.trait.replace('_', '-'); }
  function brel(b, d) { b.rel = U.clamp(Math.round(b.rel + d), 0, 100); }
  function stat(j) { return E.statValue(D.career(j.career).stat); }

  // ------------------------------------------------------------ projects
  var PROJECTS = {
    tech: ['the big system migration', 'a new app launch', 'fixing the outage that took the site down', 'the AI feature everyone wants', 'a security audit'],
    medical: ['a new patient-safety program', 'training the new residents', 'a clinical study', 'the hospital\'s accreditation review'],
    office: ['the quarterly board presentation', 'pitching our biggest client', 'the merger due diligence', 'a cost-cutting plan', 'the annual budget'],
    service: ['the grand reopening', 'training the new hires', 'the holiday rush', 'a new menu rollout', 'the health inspection'],
    trades: ['a huge commercial contract', 'a rush job for a big client', 'training the apprentices', 'a tricky renovation'],
    public: ['a major investigation', 'a community outreach program', 'a new safety initiative', 'the big inspection'],
    school: ['a new curriculum', 'the school accreditation', 'coaching the debate team', 'a grant proposal'],
    creative: ['a major ad campaign', 'the rebrand', 'a flagship design', 'a big feature story']
  };
  var GROUP = { software: 'tech', engineer: 'tech', scientist: 'tech', gamedev: 'tech', astronaut: 'tech', doctor: 'medical', surgeon: 'medical', nurse: 'medical', vet: 'medical', dentist: 'medical', pharmacist: 'medical', accountant: 'office', finance: 'office', lawyer: 'office', executive: 'office', realestate: 'office', marketing: 'creative', design: 'creative', journalist: 'creative', fashion: 'creative', architect: 'creative', model: 'creative', fastfood: 'service', retail: 'service', waiter: 'service', chef: 'service', barber: 'service', trainer: 'service', zookeeper: 'service', janitor: 'service', electrician: 'trades', plumber: 'trades', welder: 'trades', hvac: 'trades', construction: 'trades', mechanic: 'trades', driver: 'trades', police: 'public', firefighter: 'public', detective: 'public', security: 'public', social: 'public', judge: 'public', flight: 'service', pilot: 'public', teacher: 'school', professor: 'school' };
  function project() {
    var j = S().job, b = boss(j);
    if (count('wk_project')) return done(nope('I already took on a big project this year.'));
    var what = U.pick(PROJECTS[GROUP[j.career] || 'office']);
    ui().choose('📁 A big project', b.first + ' needs someone to take on ' + what + '.', [
      { label: 'Lead it', fn: function () {
        bump('wk_project');
        var p = U.clamp(0.3 + (stat(j) - 50) / 110 + j.perf / 400 + (TL.features ? TL.features.skillBonus(j.career) : 0) + (b.trait === 'Visionary' ? 0.05 : 0), 0.1, 0.85);
        if (U.chance(p)) {
          j.perf = U.clamp(j.perf + U.rand(12, 20), 0, 100); j.won = true; brel(b, b.trait === 'Political' ? 4 : 10); E.stat('happy', 6);
          return done(good('I led ' + what + ' and it was a huge success. ' + b.first + ' noticed. 🌟'));
        }
        j.perf = U.clamp(j.perf - U.rand(8, 14), 0, 100); brel(b, -8); E.stat('happy', -6);
        return done(bad('I led ' + what + ' and it fell apart. Everyone knows whose project it was.'));
      } },
      { label: 'Help a coworker lead it', fn: function () {
        bump('wk_project');
        j.perf = U.clamp(j.perf + U.rand(3, 7), 0, 100); brel(b, 2);
        var cw = E.people('coworker')[0]; if (cw) E.rel(cw, 8);
        if (b.trait === 'Political' && U.chance(0.4)) return done('I did half the work on ' + what + '. ' + b.first + ' gave all the credit to someone else.');
        return done('I pitched in on ' + what + '. Solid, safe work.');
      } },
      { label: 'Pass on it', fn: function () { bump('wk_project'); if (b.trait === 'Demanding') brel(b, -4); return done('I let someone else take ' + what + '.'); } }
    ]);
  }
  function oneOnOne() {
    var j = S().job, b = boss(j);
    if (count('wk_1on1')) return done(nope('I already had a one-on-one with ' + b.first + ' this year.'));
    ui().choose('🗣️ One-on-one with ' + b.first, b.first + ' is ' + E.an(traitName(b).toLowerCase()) + ' boss who ' + BOSS_TRAITS[b.trait] + '.', [
      { label: 'Ask for feedback', fn: function () { bump('wk_1on1'); brel(b, b.trait === 'Hands_off' ? -2 : b.trait === 'Supportive' ? 8 : 5); j.perf = U.clamp(j.perf + 3, 0, 100); return done(b.trait === 'Hands_off' ? b.first + ' said "you\'re fine" and went back to their email.' : b.first + ' gave me honest feedback. I know what to work on now.'); } },
      { label: 'Pitch a bold idea', fn: function () {
        bump('wk_1on1');
        var p = 0.35 + (me().smarts - 50) / 120 + (b.trait === 'Visionary' ? 0.25 : b.trait === 'Micromanager' ? -0.15 : 0);
        if (U.chance(U.clamp(p, 0.1, 0.85))) { brel(b, 9); j.perf = U.clamp(j.perf + 8, 0, 100); return done(good(b.first + ' loved my idea and wants me to run with it. 💡')); }
        brel(b, -5); return done(b.first + ' shot my idea down in about ten seconds.');
      } },
      { label: 'Flatter them', fn: function () {
        bump('wk_1on1');
        if (b.trait === 'Political' || U.chance(0.4)) { brel(b, 7); return done('I told ' + b.first + ' their last presentation was "visionary". It worked. 😏'); }
        brel(b, -4); return done(bad(b.first + ' saw right through my flattery.'));
      } }
    ]);
  }
  function raise() {
    var j = S().job, b = boss(j);
    if (count('wk_raise')) return done(nope('I already asked for a raise this year.'));
    var lever = j.offer && j.offer.year === S().year;
    ui().choose('💰 Ask for a raise', 'I make ' + E.fmt(E.jobSalary(j)) + '/yr. How much should I ask for?' + (lever ? ' I have a competing offer.' : ''), [5, 10, 20].map(function (pct) {
      return { label: 'Ask for ' + pct + '% more', fn: function () {
        bump('wk_raise');
        if ((j.mult || 1) * (1 + pct / 100) > 1.6) return done(nope(b.first + ' said I\'m already at the top of the pay band for my role. A promotion is the way up.'));
        var p = 0.15 + (j.perf - 60) / 80 + (b.rel - 50) / 120 - (pct - 5) / 40 + (lever ? 0.2 : 0) + (b.trait === 'Supportive' ? 0.05 : 0) - Math.max(0, (j.mult || 1) - 1.2) * 1.5;
        if ((j.mult || 1) * (1 + pct / 100) > 1.6) p = 0; // top of the pay band
        if (U.chance(U.clamp(p, 0.03, 0.9))) {
          j.mult = (j.mult || 1) * (1 + pct / 100);
          return done(good(b.first + ' approved a ' + pct + '% raise! New salary: ' + E.fmt(E.jobSalary(j)) + '. 💰'));
        }
        brel(b, -(pct / 3)); j.perf = Math.max(0, j.perf - (pct >= 20 ? 6 : 2));
        return done(bad(b.first + ' turned down my raise request.' + (pct >= 20 ? ' Asking for 20% may have been a bit much.' : '')));
      } };
    }));
  }
  // Interview elsewhere for a better offer, then take it or use it as leverage.
  function hunt() {
    var s = S(), j = s.job, c = D.career(j.career);
    if (count('wk_hunt')) return done(nope('I already looked around this year.'));
    bump('wk_hunt');
    var p = 0.3 + (stat(j) - 50) / 120 + j.perf / 300 + Math.min(0.2, j.years * 0.03);
    if (!U.chance(U.clamp(p, 0.08, 0.85))) return done('I interviewed at a few places, but nothing panned out this year.');
    var up = j.level < c.levels.length - 1 && j.perf >= 70 && j.levelYears >= 2 && U.chance(0.35);
    var lvl = j.level + (up ? 1 : 0), mult = U.randf(1.0, 1.25);
    // Offers are market rate for the role; they only beat my pay if I'm underpaid or moving up.
    if (!up && mult <= (j.mult || 1) * 1.02) return done('I interviewed around, but nobody could beat what I make now. I\'m paid well for my level.');
    var co = TL.engine.companyName ? TL.engine.companyName(c) : 'another company';
    if (co === j.company) co = 'a rival ' + c.name.toLowerCase() + ' firm';
    var pay = Math.round(E.$(c.levels[lvl][1]) * mult);
    j.offer = { year: s.year, company: co, level: lvl, mult: mult };
    ui().choose('📨 Job offer', co + ' offered me ' + E.an(c.levels[lvl][0]) + ' role at ' + E.fmt(pay) + '/yr (I make ' + E.fmt(E.jobSalary(j)) + ').', [
      { label: 'Take the offer', fn: function () {
        var keep = { career: j.career, level: lvl, perf: 55, years: 0, levelYears: 0, mult: mult, company: co };
        E.quitJob(true); s.job = keep; s.counts.jobs++;
        E.leaveWork();
        return done(good('I took the job at ' + co + ' as ' + E.an(E.jobTitle(keep)) + '. New salary: ' + E.fmt(E.jobSalary(keep)) + '. 📈'));
      } },
      { label: 'Ask my boss to match it', fn: function () {
        var b = boss(j), q = 0.35 + (j.perf - 60) / 80 + (b.rel - 50) / 150;
        if (U.chance(U.clamp(q, 0.1, 0.85))) { j.mult = Math.min(1.6, Math.max(j.mult || 1, mult * (c.levels[lvl][1] / c.levels[j.level][1]))); if (up) { j.level = lvl; j.levelYears = 0; } brel(b, -3); return done(good(b.first + ' matched the offer to keep me! New salary: ' + E.fmt(E.jobSalary(j)) + '.')); }
        brel(b, -12); return done(bad(b.first + ' wouldn\'t match it, and now they know I\'m looking. Awkward.'));
      } },
      { label: 'Stay where I am', fn: function () { return done('I turned down ' + co + '. I\'m staying put for now.'); } }
    ]);
  }
  function mentor() {
    var j = S().job, b = boss(j);
    if (count('wk_mentor')) return done(nope('I\'m already mentoring someone this year.'));
    bump('wk_mentor');
    var cw = E.people('coworker')[0];
    if (cw) E.rel(cw, 12);
    brel(b, 4); E.karma(2); j.perf = U.clamp(j.perf + 2, 0, 100); E.stat('happy', 3);
    return done('I mentored ' + (cw ? cw.first : 'a new hire') + '. Teaching someone else made me better at my job too. 🧑‍🏫');
  }

  // ------------------------------------------------------------ office rival
  // A coworker gunning for the same promotion. Their edge (0-40) cuts my odds.
  function standing(r) { return r.edge >= 22 ? 'ahead of me' : r.edge >= 10 ? 'neck and neck' : 'falling behind'; }
  function rivalry() {
    var j = S().job, r = j.rival;
    if (!r) return done(nope('Nobody is competing with me right now.'));
    if (count('wk_rival')) return done(nope('I already dealt with ' + r.first + ' this year.'));
    var b = boss(j), m = me(), win = U.clamp(0.3 + (m.smarts + m.looks - 110) / 250 + (b.trait === 'Supportive' ? 0.1 : 0), 0.15, 0.7);
    ui().choose('⚔️ ' + r.first + ' ' + r.last, r.first + ' wants the same promotion I do, and right now ' + (r.gender === 'F' ? 'she\'s ' : 'he\'s ') + standing(r) + '.', [
      { label: 'Outwork ' + (r.gender === 'F' ? 'her' : 'him') + ' (long hours, costs some health)', fn: function () {
        bump('wk_rival'); r.edge = U.clamp(r.edge - U.rand(5, 10), 0, 40); j.perf = U.clamp(j.perf + 1, 0, 100); E.stat('health', -5); E.stat('happy', -2);
        return done('I was first in and last out all year. ' + r.first + ' noticed. 💼');
      } },
      { label: 'Try to make ' + (r.gender === 'F' ? 'her' : 'him') + ' an ally (' + Math.round(win * 100) + '%)', fn: function () {
        bump('wk_rival');
        if (U.chance(win)) { j.rival = null; j.rivalCool = 3; j.perf = U.clamp(j.perf + 3, 0, 100); E.stat('happy', 4); E.log('🤝 ' + r.first + ' and I stopped competing and started covering for each other.', 'good'); return done(good('Over lunch, ' + r.first + ' and I agreed there\'s room for both of us. We\'re allies now. 🤝')); }
        r.edge = U.clamp(r.edge + 3, 0, 40); return done('I tried to be friendly. ' + r.first + ' smiled and then took credit for my slides.');
      } },
      { label: 'Undermine ' + (r.gender === 'F' ? 'her' : 'him') + ' (risky, bad karma)', fn: function () {
        bump('wk_rival'); E.karma(-6);
        if (U.chance(b.trait === 'Political' ? 0.25 : 0.35)) { brel(b, -15); j.perf = U.clamp(j.perf - 8, 0, 100); r.edge = U.clamp(r.edge + 8, 0, 40); E.log('😬 Everyone found out I tried to sabotage ' + r.first + '.', 'bad'); return done(bad('It got back to ' + b.first + '. Now I\'m the one who looks bad. 😬')); }
        r.edge = U.clamp(r.edge - U.rand(12, 20), 0, 40); return done('A few well-timed comments, and ' + r.first + '\'s star has dimmed. 🐍');
      } }
    ]);
  }
  // Once a year: a rival may appear, gain ground, win, or give up.
  function rivalYear(j, promoted) {
    var c = D.career(j.career), top = j.level >= c.levels.length - 1, r = j.rival;
    if (top) { j.rival = null; return; }
    if (!r) {
      if (j.rivalCool) { j.rivalCool--; return; }
      if (j.years >= 1 && U.chance(0.2)) { var g = U.pick(['M', 'F']), n = E.randomName(g); j.rival = { first: n.first, last: n.last, gender: g, edge: U.rand(8, 20) }; E.log('⚔️ ' + n.first + ' ' + n.last + ' started at work, and ' + (g === 'F' ? 'she' : 'he') + ' wants the same promotion I do.'); }
      return;
    }
    if (promoted) { j.rival = null; j.rivalCool = 2; E.log('😤 ' + r.first + ' congratulated me on the promotion through gritted teeth.'); return; }
    r.edge = U.clamp(r.edge + U.rand(0, 4), 0, 40);
    if (r.edge >= 24 && U.chance(0.2)) { j.rival = null; j.rivalCool = 2; E.stat('happy', -6); E.log('😞 ' + r.first + ' ' + r.last + ' got the promotion I wanted.', 'bad'); return; }
    if (r.edge <= 3) { j.rival = null; j.rivalCool = 2; E.log('🏳️ ' + r.first + ' gave up on the promotion race and transferred to another team.'); }
  }

  // ------------------------------------------------------------ the year
  // Extra promotion odds from my boss and a project win.
  function promoBonus(j) { if (!regular(j)) return 0; var b = boss(j); return (b.rel - 50) / 300 - (j.rival ? j.rival.edge / 200 : 0) + (j.won ? 0.1 : 0) + (b.trait === 'Demanding' && j.perf >= 85 ? 0.05 : 0); }
  // The annual review: a rating, a merit raise, and a word on promotion.
  function review(j, promoted) {
    if (!regular(j) || !S().job || S().job !== j) { if (j) j.won = false; return; }
    var b = boss(j), c = D.career(j.career), r;
    if (j.perf >= 85) r = ['Outstanding', 1.04, 1.06];
    else if (j.perf >= 70) r = ['Exceeds expectations', 1.02, 1.04];
    else if (j.perf >= 45) r = ['Meets expectations', 1.0, 1.02];
    else if (j.perf >= 30) r = ['Needs improvement', 1, 1];
    else r = ['Performance plan', 1, 1];
    j.review = r[0];
    if (!promoted && r[1] > 1) j.mult = (j.mult || 1) * U.randf(r[1], r[2]);
    var top = j.level >= c.levels.length - 1, wait = Math.max(0, 2 - j.levelYears);
    var note = promoted ? '' : top ? '' : j.perf >= 70 ? (wait ? ' I\'m on track for a promotion in ' + U.plural(wait, 'year') + '.' : ' A promotion could come any time now.') : r[0] === 'Performance plan' ? ' I\'m on thin ice.' : '';
    if (!promoted) E.log('📋 Performance review: ' + r[0] + (r[1] > 1 ? ' (merit raise)' : '') + '.' + note, r[0] === 'Outstanding' ? 'good' : r[0] === 'Performance plan' ? 'bad' : '');
    j.won = false;
    rivalYear(j, promoted);
    // Bosses come and go.
    if (U.chance(0.07)) { var old = bossName(b); j.boss = null; var nb = boss(j); E.log('👔 My boss ' + old + ' left the company. My new boss is ' + bossName(nb) + '.'); }
    else brel(b, U.rand(-4, 2));
  }
  function card(j) {
    if (!regular(j)) return '';
    var b = boss(j), c = D.career(j.career), top = j.level >= c.levels.length - 1;
    var next = top ? 'Top of the ladder' : 'Next: ' + c.levels[j.level + 1][0] + ' (' + (j.perf >= 70 ? (j.levelYears >= 2 ? 'ready' : 'in ' + U.plural(2 - j.levelYears, 'year')) : 'needs 70+ performance') + ')';
    return '<div class="minibar"><span>Boss</span><div class="track"><div class="fill ' + (b.rel >= 66 ? 'hi' : b.rel >= 33 ? 'mid' : 'lo') + '" style="width:' + b.rel + '%"></div></div></div>' +
      '<div class="wk-line">👔 ' + U.esc(bossName(b)) + ' · ' + traitName(b) + '</div><div class="wk-line">📈 ' + U.esc(next) + (j.review ? ' · last review: ' + j.review : '') + '</div>' + (j.rival ? '<div class="wk-line">⚔️ Rival: ' + U.esc(j.rival.first + ' ' + j.rival.last) + ' · ' + standing(j.rival) + '</div>' : '');
  }
  function items(j) {
    if (!regular(j)) return [];
    boss(j);
    return [
      { icon: '📁', label: 'Take on a big project', sub: count('wk_project') ? 'Done this year' : 'Lead it for a shot at promotion', disabled: count('wk_project') > 0, onClick: project },
      { icon: '🗣️', label: 'One-on-one with ' + j.boss.first, sub: count('wk_1on1') ? 'Done this year' : 'Feedback, ideas or flattery', disabled: count('wk_1on1') > 0, onClick: oneOnOne },
      { icon: '💰', label: 'Ask for a raise', disabled: count('wk_raise') > 0, sub: count('wk_raise') ? 'Asked this year' : '', onClick: raise },
      { icon: '🔍', label: 'Look for a better job', sub: count('wk_hunt') ? 'Looked this year' : 'Get an offer to take or negotiate with', disabled: count('wk_hunt') > 0, onClick: hunt }
    ].concat(j.rival ? [{ icon: '⚔️', label: 'Deal with ' + j.rival.first, sub: count('wk_rival') ? 'Done this year' : 'Outwork, befriend or undermine my rival', disabled: count('wk_rival') > 0, onClick: rivalry }] : []).concat(j.level >= 2 ? [{ icon: '🧑‍🏫', label: 'Mentor a coworker', disabled: count('wk_mentor') > 0, onClick: mentor }] : []);
  }
  return { regular: regular, boss: boss, card: card, items: items, promoBonus: promoBonus, review: review };
})();
