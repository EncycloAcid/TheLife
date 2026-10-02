/* TheLife — a realistic military career: recruiters and the ASVAB, branches
 * and jobs, contracts, basic training, real enlisted/officer ranks and pay,
 * promotion boards, deployments and medals, special forces selection,
 * officer routes (OCS, ROTC, service academies), re-enlistment, 20-year
 * retirement, discharges, the GI Bill, PTSD and conscription.
 * State lives in S().mil; a serving member's job has job.mil = true. */
TL.military = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function onceAYear(key) { var y = S().yearActs || (S().yearActs = {}); if (y[key]) return false; y[key] = 1; return true; }
  function us() { return S().country === 'United States'; }

  // ------------------------------------------------------------- branches
  var ADJ = { 'United Kingdom': 'British', 'Canada': 'Canadian', 'Australia': 'Australian', 'Mexico': 'Mexican', 'Brazil': 'Brazilian', 'Germany': 'German', 'France': 'French', 'Italy': 'Italian', 'Spain': 'Spanish', 'India': 'Indian', 'Nigeria': 'Nigerian', 'South Africa': 'South African', 'Philippine': 'Philippine', 'Philippines': 'Philippine', 'Jamaica': 'Jamaica', 'South Korea': 'Republic of Korea' };
  function branches() {
    var c = S().country;
    if (c === 'United States') return [
      ['army', '🪖', 'U.S. Army', 'The largest branch. Every kind of job, on land.'],
      ['marines', '⚔️', 'U.S. Marine Corps', 'The few, the proud. Toughest boot camp, most combat.'],
      ['navy', '⚓', 'U.S. Navy', 'Ships, submarines, aircraft carriers and sea duty.'],
      ['airforce', '✈️', 'U.S. Air Force', 'Aircraft, technology and the best quality of life.'],
      ['coastguard', '🛟', 'U.S. Coast Guard', 'Search and rescue, at home. Few deployments.'],
      ['spaceforce', '🛰️', 'U.S. Space Force', 'Satellites and space operations. Very selective.']];
    if (c === 'United Kingdom') return [['army', '🪖', 'British Army', 'Infantry, armour, engineers and more.'], ['marines', '⚔️', 'Royal Marines', 'Elite amphibious commandos.'], ['navy', '⚓', 'Royal Navy', 'Ships and submarines.'], ['airforce', '✈️', 'Royal Air Force', 'Aircraft and air operations.']];
    if (c === 'Japan') return [['army', '🪖', 'Japan Ground Self-Defense Force', 'Defense and disaster relief.'], ['navy', '⚓', 'Japan Maritime Self-Defense Force', 'Ships and maritime patrol.'], ['airforce', '✈️', 'Japan Air Self-Defense Force', 'Air defense.']];
    var a = ADJ[c] || c;
    var roy = c === 'Canada' || c === 'Australia' ? 'Royal ' : '';
    return [['army', '🪖', a + ' Army', 'Ground forces.'], ['navy', '⚓', roy + a + ' Navy', 'Ships and sea duty.'], ['airforce', '✈️', roy + a + ' Air Force', 'Aircraft and air operations.']];
  }
  function branchName(id) { var b = branches().filter(function (x) { return x[0] === id; })[0]; return b ? b[2] : 'the Army'; }

  // ---------------------------------------------------------------- ranks
  // [enlisted titles E-1..E-9], [officer titles O-1..O-10]
  var RANKS = {
    army: [['Private', 'Private (PV2)', 'Private First Class', 'Specialist', 'Sergeant', 'Staff Sergeant', 'Sergeant First Class', 'Master Sergeant', 'Sergeant Major'],
      ['Second Lieutenant', 'First Lieutenant', 'Captain', 'Major', 'Lieutenant Colonel', 'Colonel', 'Brigadier General', 'Major General', 'Lieutenant General', 'General']],
    marines: [['Private', 'Private First Class', 'Lance Corporal', 'Corporal', 'Sergeant', 'Staff Sergeant', 'Gunnery Sergeant', 'Master Sergeant', 'Sergeant Major'],
      ['Second Lieutenant', 'First Lieutenant', 'Captain', 'Major', 'Lieutenant Colonel', 'Colonel', 'Brigadier General', 'Major General', 'Lieutenant General', 'General']],
    navy: [['Seaman Recruit', 'Seaman Apprentice', 'Seaman', 'Petty Officer Third Class', 'Petty Officer Second Class', 'Petty Officer First Class', 'Chief Petty Officer', 'Senior Chief Petty Officer', 'Master Chief Petty Officer'],
      ['Ensign', 'Lieutenant (junior grade)', 'Lieutenant', 'Lieutenant Commander', 'Commander', 'Captain', 'Rear Admiral (lower half)', 'Rear Admiral', 'Vice Admiral', 'Admiral']],
    airforce: [['Airman Basic', 'Airman', 'Airman First Class', 'Senior Airman', 'Staff Sergeant', 'Technical Sergeant', 'Master Sergeant', 'Senior Master Sergeant', 'Chief Master Sergeant'],
      ['Second Lieutenant', 'First Lieutenant', 'Captain', 'Major', 'Lieutenant Colonel', 'Colonel', 'Brigadier General', 'Major General', 'Lieutenant General', 'General']]
  };
  RANKS.coastguard = RANKS.navy; RANKS.spaceforce = [['Specialist 1', 'Specialist 2', 'Specialist 3', 'Specialist 4', 'Sergeant', 'Technical Sergeant', 'Master Sergeant', 'Senior Master Sergeant', 'Chief Master Sergeant'], RANKS.airforce[1]];
  // Yearly basic pay in base dollars, roughly US 2025, plus a housing allowance.
  var PAY_E = [24000, 27000, 28500, 31500, 35000, 40000, 48000, 58000, 72000];
  var PAY_O = [46000, 54000, 64000, 78000, 95000, 115000, 150000, 165000, 185000, 205000];
  // Active service only holds while the military job does: prison, emigrating
  // or anything else that ends the job ends the service.
  function m() {
    var x = S().mil || null, j = S().job;
    if (x && x.active && !(j && j.mil)) { x.active = false; x.discharge = x.discharge || (S().prison ? 'Other Than Honorable' : 'General'); x.endYear = S().year; }
    return x;
  }
  function officer() { return m().track === 'officer'; }
  function rankTitle(x) { x = x || m(); var r = RANKS[x.branch] || RANKS.army; return x.track === 'officer' ? r[1][x.grade] : r[0][x.grade]; }
  function payGrade(x) { x = x || m(); return (x.track === 'officer' ? 'O-' : 'E-') + (x.grade + 1); }
  function basePay(x) { x = x || m(); var p = x.track === 'officer' ? PAY_O[x.grade] : PAY_E[x.grade]; return Math.round(p * (1 + Math.min(0.4, x.yos * 0.02))); }
  function totalPay(x) { x = x || m(); return basePay(x) + (x.track === 'officer' ? 22000 : x.grade >= 4 ? 16000 : 11000); }

  // ----------------------------------------------------------------- jobs
  var JOBS = [
    // id, name, min ASVAB, combat risk (0-3), icon, civilian edge
    ['infantry', 'Infantry', 31, 3, '🎯', null],
    ['medic', 'Combat Medic', 50, 2, '🩹', 'nurse'],
    ['mp', 'Military Police', 41, 1, '🚓', 'police'],
    ['mechanic', 'Vehicle Mechanic', 35, 1, '🔧', 'mechanic'],
    ['logistics', 'Logistics Specialist', 31, 1, '📦', null],
    ['intel', 'Intelligence Analyst', 65, 1, '🛰️', 'detective'],
    ['cyber', 'Cyber Operations', 75, 0, '💻', 'software'],
    ['aviation', 'Aviation Technician', 55, 1, '🛩️', 'engineer']
  ];
  var OFFICER_JOBS = [['infantry', 'Infantry Officer', 0, 3, '🎯'], ['aviator', 'Pilot', 0, 2, '✈️'], ['intel', 'Intelligence Officer', 0, 1, '🛰️'], ['logistics', 'Logistics Officer', 0, 1, '📦'], ['cyber', 'Cyber Officer', 0, 0, '💻']];
  function job(id, off) { return (off ? OFFICER_JOBS : JOBS).filter(function (j) { return j[0] === id; })[0] || JOBS[0]; }
  function jobName(x) { x = x || m(); if (x.sf) return x.sf; var j = job(x.mos, x.track === 'officer'); return j[1]; }
  function risk(x) { x = x || m(); return x.sf ? 3 : job(x.mos, x.track === 'officer')[3]; }

  // ------------------------------------------------------------- joining
  function startService(o) {
    var s = S();
    if (s.job && !s.job.mil) E.quitJob(true);
    s.mil = { branch: o.branch, track: o.track, grade: o.grade || 0, mos: o.mos, yos: 0, tig: 0, perf: 60, contractEnd: s.year + o.years, years: o.years, medals: [], deployments: 0, combat: 0, conscript: !!o.conscript, asvab: o.asvab || null, passed: 0 };
    s.job = { career: 'military', mil: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, company: branchName(o.branch) };
    sync();
    E.achieve('enlisted');
    if (o.track === 'officer') E.achieve('officer');
  }
  // Keep the job record's title and pay in step with rank.
  function sync() {
    var s = S(), x = m();
    if (!x || !s.job || !s.job.mil) return;
    s.job.title = rankTitle(x); s.job.salary = E.$(totalPay(x)); s.job.company = branchName(x.branch);
  }
  function eligibleToEnlist() {
    var s = S(), a = me().age;
    if (s.mil && s.mil.active) return 'I\'m already serving.';
    if (s.mil && s.mil.discharge === 'Dishonorable') return 'A dishonorable discharge bars me from serving again.';
    if (a < 17) return 'Recruiters can\'t sign me until I\'m 17.';
    if (a > 39) return 'I\'m past the maximum enlistment age.';
    if (s.record.some(function (r) { return /Robbery|Heist|Burglary|Assault|DUI/.test(r.crime || ''); })) return 'My criminal record disqualifies me.';
    if (me().health < 40) return 'I can\'t pass the medical exam (MEPS) in my condition.';
    if (s.prison) return 'Not from prison.';
    return null;
  }
  function takeAsvab() {
    var s = S(), x = s.flags;
    if (x.asvabYear === s.year) return x.asvab;
    x.asvabYear = s.year;
    x.asvab = U.clamp(Math.round(me().smarts * 0.9 + U.rand(-12, 18)), 1, 99);
    return x.asvab;
  }
  function recruiter() {
    var why = eligibleToEnlist();
    if (why) return done(nope(why));
    ui().menu('Recruiting office', function () {
      var s = S(), items = [{ info: true, html: '<p>Every branch offers a steady paycheck, free healthcare, housing, the GI Bill for college and a pension after 20 years. In return: a contract, discipline, and the chance of deployment.</p>' }];
      items.push({ section: 'Enlist' });
      branches().forEach(function (b) {
        items.push({ icon: b[1], label: b[2], sub: b[3], onClick: function () { enlistFlow(b[0]); } });
      });
      var deg = s.degrees.some(function (d) { return d.type === 'bachelor'; });
      items.push({ section: 'Become an officer' });
      items.push({ icon: '⭐', label: 'Officer Candidate School', sub: deg ? 'For college graduates up to 32 · 12 weeks' : 'Requires a bachelor\'s degree', disabled: !deg || me().age > 32, onClick: ocs });
      if (s.edu && s.edu.stage === 'uni' && me().age <= 23) items.push({ icon: '🎓', label: 'Join ROTC', sub: 'Scholarship now, commission at graduation', onClick: rotc });
      if (us() && !s.edu && E.hasDegree('hs') && !s.degrees.some(function (d) { return d.type === 'bachelor'; }) && me().age <= 22) items.push({ icon: '🏛️', label: 'Apply to a service academy', sub: 'West Point · Annapolis · Air Force Academy', onClick: academyMenu });
      return items;
    });
  }
  function enlistFlow(branch) {
    var score = takeAsvab(), min = branch === 'airforce' || branch === 'spaceforce' ? 36 : branch === 'coastguard' ? 40 : 31;
    if (score < min) return done(bad('I scored ' + score + ' on the ASVAB. ' + branchName(branch) + ' needs at least ' + min + '. I can retake it next year.'));
    ui().menu('Choose a job', function () {
      var items = [{ info: true, html: '<p>ASVAB score: <b>' + score + '</b>. Jobs with a higher combat risk deploy more and earn more medals, but they\'re dangerous.</p>' }];
      JOBS.forEach(function (j) {
        if (j[0] === 'infantry' && (branch === 'airforce' || branch === 'spaceforce' || branch === 'coastguard' || branch === 'navy')) return;
        if (branch === 'spaceforce' && ['cyber', 'intel'].indexOf(j[0]) < 0) return;
        var ok = score >= j[2];
        items.push({ icon: j[4], label: j[1], sub: (ok ? '' : 'Needs ASVAB ' + j[2] + ' · ') + 'Combat risk: ' + ['low', 'some', 'moderate', 'high'][j[3]], disabled: !ok, onClick: function () { contractFlow(branch, j[0], score); } });
      });
      return items;
    });
  }
  function contractFlow(branch, mos, score) {
    var bonus = mos === 'infantry' ? 20000 : mos === 'cyber' ? 30000 : mos === 'medic' ? 10000 : 5000;
    ui().choose('Enlistment contract', 'I\'ll serve as ' + E.an(job(mos)[1]) + ' in ' + branchName(branch) + '. A longer contract pays a bigger signing bonus.', [
      { label: '4-year contract', fn: function () { swearIn(branch, mos, score, 4, Math.round(bonus / 2)); } },
      { label: '6-year contract (+' + E.fmt(E.$(bonus)) + ' bonus)', fn: function () { swearIn(branch, mos, score, 6, bonus); } }
    ]);
  }
  function swearIn(branch, mos, score, years, bonus) {
    // Basic training can wash you out.
    // Most recruits graduate (roughly 85-90%); the unfit and the Marines' crucible wash more out.
    var p = 0.86 + (me().athl - 50) / 250 + (me().health - 70) / 400 + (branch === 'marines' ? -0.04 : 0);
    if (!U.chance(U.clamp(p, 0.5, 0.97))) {
      E.stat('happy', -8);
      return done(bad('I washed out of ' + (branch === 'marines' ? 'boot camp at Parris Island' : branch === 'navy' ? 'boot camp' : 'basic training') + '. I was sent home with an entry-level separation.'));
    }
    startService({ branch: branch, track: 'enlisted', mos: mos, years: years, asvab: score });
    S().mil.active = true;
    me().athl = U.clamp(me().athl + U.rand(6, 12), 0, 100); E.stat('health', 4);
    E.addMoney(E.$(bonus));
    ui().closeAll();
    done(good('I graduated ' + (branch === 'marines' ? 'Marine Corps boot camp and earned the title of Marine' : branch === 'navy' || branch === 'coastguard' ? 'boot camp' : 'basic training') + '! I\'m now ' + E.an(rankTitle()) + ' (' + jobName() + ') in ' + branchName(branch) + '. Enlistment bonus: ' + E.fmt(E.$(bonus)) + '. 🎖️'));
  }
  function ocs() {
    if (!onceAYear('mil_ocs')) return done(nope('I already applied this year.'));
    var p = 0.55 + (me().athl - 50) / 150 + (me().smarts - 60) / 200;
    if (!U.chance(U.clamp(p, 0.15, 0.92))) return done(bad('I didn\'t make it through Officer Candidate School.'));
    ui().menu('Officer specialty', function () {
      return OFFICER_JOBS.map(function (j) {
        var ok = j[0] !== 'aviator' || (me().athl >= 55 && me().smarts >= 65);
        return { icon: j[4], label: j[1], sub: ok ? 'Combat risk: ' + ['low', 'some', 'moderate', 'high'][j[3]] : 'Needs good fitness and smarts', disabled: !ok, onClick: function () {
          var b = branches()[0][0];
          startService({ branch: b, track: 'officer', mos: j[0], years: j[0] === 'aviator' ? 10 : 4 });
          S().mil.active = true;
          ui().closeAll();
          done(good('I graduated from OCS and was commissioned as ' + E.an(rankTitle()) + ' in ' + branchName(b) + '! ⭐'));
        } };
      });
    });
  }
  function rotc() {
    var s = S();
    if (s.mil && s.mil.track === 'rotc') return done(nope('I\'m already in ROTC.'));
    s.mil = { track: 'rotc', branch: 'army', grade: 0, yos: 0, medals: [], deployments: 0, combat: 0, perf: 60 };
    me().athl = U.clamp(me().athl + 3, 0, 100);
    done(good('I joined ROTC. Early-morning PT, drill on weekends, and the military pays my tuition. 🎓'));
  }
  var ACADEMIES = [['army', 'United States Military Academy (West Point)'], ['navy', 'United States Naval Academy (Annapolis)'], ['airforce', 'United States Air Force Academy']];
  function academyMenu() {
    ui().menu('Service academies', function () {
      var s = S(), g = s.lastGrade || 60, chance = Math.round(U.clamp((g - 72) / 40 + (me().athl - 55) / 120 + (s.sat >= 1350 ? 0.1 : 0), 0.02, 0.6) * 100);
      return [{ info: true, html: '<p>Free tuition, room and board — and a 5-year service commitment after graduation. Admission takes top grades, fitness and a nomination. Your chance: <b>' + chance + '%</b>.</p>' }].concat(ACADEMIES.map(function (a) {
        return { icon: '🏛️', label: a[1], disabled: s.flags['acad_' + s.year], onClick: function () {
          s.flags['acad_' + s.year] = true;
          if (!U.chance(chance / 100)) return done(bad('The ' + a[1].split(' (')[0] + ' rejected my application.'));
          s.edu = null;
          E.enroll('uni', { major: U.pick(['Engineering', 'Political Science', 'Computer Science', 'History'].filter(function (x) { return TL.data.MAJORS.indexOf(x) >= 0; }).concat(['Business'])), funding: 'academy', school: a[1].split(' (')[0], tier: 3 });
          s.mil = { track: 'cadet', branch: a[0], grade: 0, yos: 0, medals: [], deployments: 0, combat: 0, perf: 65 };
          ui().closeAll();
          done(good('I was accepted to the ' + a[1] + '! I reported for Cadet Basic Training this summer. 🏛️'));
        } };
      }));
    });
  }

  // --------------------------------------------------------------- yearly
  // Runs inside the job step while serving; returns pay earned.
  function year() {
    var s = S(), x = m();
    if (!x || !x.active) return 0;
    if (!(s.job && s.job.mil)) { x.active = false; x.discharge = 'General'; return 0; }
    x.yos++; x.tig++;
    if (s.record.length > (x.records || 0)) return courtMartial();
    x.perf = U.clamp(Math.round(x.perf + U.rand(-6, 6) + (me().athl - 60) / 20 + (s.flags.milEffort || 0) * 4), 0, 100);
    s.flags.milEffort = 0;
    promote();
    // Deployment: high-risk jobs and special forces go most often.
    var r = risk(x), dp = [0.12, 0.22, 0.32, 0.45][r] + (s.flags.milVolunteer ? 0.4 : 0) - (x.branch === 'coastguard' ? 0.1 : 0);
    s.flags.milVolunteer = 0;
    if (!x.conscript || x.yos >= 1) { if (U.chance(dp)) s.pending.push({ id: 'mil_deploy', data: {} }); }
    if (s.year >= x.contractEnd) s.pending.push({ id: x.conscript ? 'mil_conscript_done' : 'mil_contract', data: {} });
    else if (x.track === 'officer' && x.grade === 3 && x.yos >= 14 && x.passed >= 2) s.pending.push({ id: 'mil_upout', data: {} });
    sync();
    return s.job.salary;
  }
  // [years of service needed, yearly base chance] to reach E-(i+2). Senior NCO
  // ranks are rare: few careerists make E-8 and only a sliver make E-9.
  var PROMO_E = [[1, 1], [2, 1], [3, 0.95], [4, 0.4], [7, 0.22], [11, 0.06], [15, 0.022], [19, 0.012]];
  var PROMO_O = [[2, 0.97], [4, 0.9], [10, 0.7], [16, 0.6], [22, 0.45], [25, 0.08], [28, 0.4], [30, 0.3], [32, 0.25]];
  function promote() {
    var x = m(), table = officer() ? PROMO_O : PROMO_E, max = officer() ? 9 : 8;
    if (x.grade >= max || x.conscript && x.grade >= 4) return;
    var need = table[x.grade];
    if (x.yos < need[0] || x.tig < 1) return;
    var p = need[1] * (0.6 + x.perf / 125) + Math.min(0.15, x.medals.length * 0.03);
    if (U.chance(U.clamp(p, 0.02, 0.98))) {
      x.grade++; x.tig = 0; x.passed = 0;
      E.log('🎖️ I was promoted to ' + rankTitle() + ' (' + payGrade() + ')!', 'good');
      E.stat('happy', 6);
      if (officer() && x.grade >= 6) { E.achieve('general'); E.fame(5); }
    } else if (need[1] < 0.9) { x.passed = (x.passed || 0) + 1; if (x.passed <= 2) E.log('The promotion board passed me over for ' + (officer() ? RANKS[x.branch][1] : RANKS[x.branch][0])[x.grade + 1] + '.'); }
  }
  function medal(name) { var x = m(); x.medals.push({ name: name, year: S().year }); E.log('🎖️ I was awarded the ' + name + '!', 'good'); x.perf = U.clamp(x.perf + 8, 0, 100); }
  function medalName(kind) {
    if (us()) return { ach: 'Achievement Medal', com: 'Commendation Medal', bronze: 'Bronze Star', purple: 'Purple Heart', silver: 'Silver Star', moh: 'Medal of Honor' }[kind];
    return { ach: 'Service Medal', com: 'Commendation', bronze: 'Medal for Gallantry', purple: 'Wound Badge', silver: 'Cross for Valour', moh: 'highest award for valour' }[kind];
  }
  function courtMartial() {
    var s = S(), x = m();
    x.records = s.record.length;
    E.log('⚖️ I was court-martialed for my crime and received a dishonorable discharge.', 'bad');
    discharge('Dishonorable');
    return 0;
  }
  function discharge(type, retired) {
    var s = S(), x = m();
    x.active = false; x.discharge = type; x.endYear = s.year;
    if (s.job && s.job.mil) { s.jobHistory.push({ career: 'military', title: rankTitle(x), years: x.yos, company: branchName(x.branch) }); s.job = null; }
    if (retired) {
      var high3 = basePay(x);
      s.retired = true; s.pension = E.$(Math.round(high3 * 0.025 * x.yos));
      E.achieve('retired');
    }
  }

  // ---------------------------------------------------------------- events
  function def(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  var THEATERS = ['the Middle East', 'Eastern Europe', 'the Horn of Africa', 'the Pacific', 'Central Asia', 'a NATO mission in the Baltics', 'a UN peacekeeping mission'];
  def('mil_deploy', { cond: function () { return m() && m().active; }, build: function () {
    var x = m(), where = U.pick(THEATERS), r = risk(x);
    return { icon: '🎖️', title: 'Deployment', text: 'My unit is deploying to ' + where + ' for ' + U.pick(['six', 'nine', 'twelve']) + ' months. I\'m ' + E.an(rankTitle()) + ' (' + jobName() + ').', choices: [
      { label: 'Lead from the front', run: function () { return deployment(where, r + 1); } },
      { label: 'Do my job by the book', run: function () { return deployment(where, r); } },
      { label: 'Volunteer for a support role', run: function () { return deployment(where, Math.max(0, r - 1)); } }
    ] };
  } });
  function deployment(where, danger) {
    var s = S(), x = m();
    x.deployments++;
    E.stat('happy', -4);
    var partner = E.partner(); if (partner) E.rel(partner, -4);
    // Most deployments are long, hard and uneventful.
    var kia = [0.001, 0.003, 0.008, 0.016, 0.025][Math.min(4, danger)], wia = [0.01, 0.03, 0.07, 0.12, 0.16][Math.min(4, danger)];
    if (danger >= 2) x.combat++;
    if (U.chance(kia)) {
      if (danger >= 3 && U.chance(0.03)) { x.medals.push({ name: medalName('moh'), year: s.year }); E.achieve('medal_of_honor'); }
      E.die('killed in action in ' + where);
      return bad('I was killed in action in ' + where + '.');
    }
    var out = [];
    if (U.chance(wia)) {
      E.stat('health', -U.rand(15, 35)); E.addCondition(U.pick(['Concussion', 'Broken Leg', 'Broken Arm']));
      medal(medalName('purple')); E.achieve('purple_heart'); x.wounded = (x.wounded || 0) + 1;
      out.push('I was wounded in action');
    }
    var valor = danger >= 3 ? 0.06 : danger >= 2 ? 0.025 : 0;
    if (U.chance(valor * 0.02)) { medal(medalName('moh')); E.achieve('medal_of_honor'); E.fame(25); out.push('my actions under fire earned the ' + medalName('moh')); }
    else if (U.chance(valor * 0.3)) { medal(medalName('silver')); E.fame(6); out.push('I earned the ' + medalName('silver') + ' for gallantry'); }
    else if (U.chance(valor + (danger >= 2 ? 0.04 : 0.005))) { medal(medalName('bronze')); E.fame(2); out.push('I earned the ' + medalName('bronze')); }
    else if (U.chance(0.35)) { medal(medalName(U.chance(0.6) ? 'ach' : 'com')); }
    if (danger >= 2 && U.chance(0.12 + (x.combat >= 3 ? 0.1 : 0)) && !E.hasCondition('PTSD')) { E.addCondition('PTSD'); out.push('the things I saw stayed with me'); }
    x.perf = U.clamp(x.perf + 6, 0, 100);
    var msg = 'I came home from ' + where + (out.length ? '. ' + U.cap(out.join('; ')) + '.' : ' safe.');
    return out.length && /wounded|stayed/.test(out.join()) ? bad(msg) : out.length ? good(msg) : msg;
  }
  def('mil_contract', { cond: function () { return m() && m().active; }, build: function () {
    var x = m(), bonus = Math.round(totalPay(x) * (x.grade >= 4 ? 0.5 : 0.3)), ch = [];
    ch.push({ label: (officer() ? 'Stay in' : 'Re-enlist') + ' for 4 years (+' + E.fmt(E.$(bonus)) + ')', run: function () { x.contractEnd = S().year + 4; E.addMoney(E.$(bonus)); return good('I ' + (officer() ? 'extended my service' : 're-enlisted') + ' for four more years. 🎖️'); } });
    if (x.yos >= 20) ch.push({ label: 'Retire with a pension (' + E.fmt(E.$(Math.round(basePay(x) * 0.025 * x.yos))) + '/yr)', run: function () { var t = rankTitle(); discharge('Honorable', true); E.stat('happy', 10); return good('I retired from ' + branchName(x.branch) + ' as ' + E.an(t) + ' after ' + x.yos + ' years. 🎖️'); } });
    else ch.push({ label: 'Leave the military (honorable discharge)', run: function () { discharge('Honorable'); return 'I left the military with an honorable discharge after ' + U.plural(x.yos, 'year') + '. I\'m a veteran now, with the GI Bill.'; } });
    return { icon: '📝', title: 'End of contract', text: 'My ' + (officer() ? 'service commitment' : 'enlistment') + ' is up. I\'ve served ' + U.plural(x.yos, 'year') + ' and I\'m ' + E.an(rankTitle()) + '.', choices: ch };
  } });
  def('mil_upout', { cond: function () { return m() && m().active && m().grade === 3; }, build: function () {
    return { icon: '📉', title: 'Up or out', text: 'I\'ve been passed over for promotion too many times. The service is separating me.', choices: [{ label: 'Accept it', run: function () { discharge('Honorable', m().yos >= 20); return 'I was separated from the service after ' + U.plural(m().yos, 'year') + '.'; } }] };
  } });
  def('mil_conscript_notice', { build: function () {
    return { icon: '📨', title: 'Conscription notice', text: 'Every able-bodied man in South Korea must serve. My enlistment date has arrived: about 18 months in the Republic of Korea Army.', choices: [
      { label: 'Report for duty', run: function () { startService({ branch: 'army', track: 'enlisted', mos: U.pick(['infantry', 'logistics', 'mp', 'mechanic']), years: 2, conscript: true }); m().active = true; S().edu = S().edu && S().edu.stage === 'uni' ? S().edu : null; me().athl = U.clamp(me().athl + 8, 0, 100); return 'I shaved my head and reported to the training center. 🪖'; } },
      { label: 'Refuse to serve', run: function () { E.jail(1, 'Draft evasion'); return bad('Refusing military service is a crime. I was sentenced to prison.'); } }
    ] };
  } });
  def('mil_conscript_done', { cond: function () { return m() && m().active; }, build: function () {
    return { icon: '🎖️', title: 'Discharged', text: 'My mandatory service is complete.', choices: [{ label: 'Head home', run: function () { var t = rankTitle(); discharge('Honorable'); E.stat('happy', 12); return good('I completed my military service as ' + E.an(t) + '. Freedom! 🎉'); } }] };
  } });
  def('mil_sf', { build: function () {
    var x = m(), names = { army: ['Ranger Assessment and Selection', 'the 75th Ranger Regiment', 'Green Beret (Special Forces)'], marines: ['MARSOC Assessment and Selection', 'Marine Raiders', 'Marine Raider'], navy: ['BUD/S', 'the Navy SEALs', 'Navy SEAL'], airforce: ['Pararescue Indoctrination', 'Pararescue', 'Pararescueman (PJ)'] }[x.branch] || ['special forces selection', 'the special forces', 'Special Forces Operator'];
    var p = U.clamp(0.08 + (me().athl - 70) / 80 + (me().health - 70) / 200 + (me().happy - 50) / 300, 0.03, 0.55);
    return { icon: '🪖', title: names[0], text: 'Weeks of no sleep, cold water and endless miles. Most candidates quit. My odds: about ' + Math.round(p * 100) + '%.', choices: [
      { label: 'Never quit', run: function () { if (U.chance(p)) { x.sf = names[2]; E.achieve('operator'); E.fame(4); x.perf = U.clamp(x.perf + 15, 0, 100); return good('I made it through ' + names[0] + ' and joined ' + names[1] + '. I\'m a ' + names[2] + ' now. 🪖'); } E.stat('health', -10); return bad('My body gave out. I was dropped from ' + names[0] + '.'); } },
      { label: 'Ring the bell (quit)', run: function () { return 'I rang the bell. No shame — most people do.'; } }
    ] };
  } });

  // School-age paths, retirement eligibility, conscription and benefits.
  function yearly() {
    var s = S(), x = m(), a = me().age;
    if (x && (x.track === 'rotc' || x.track === 'cadet')) {
      if (s.edu && s.edu.stage === 'uni') {
        me().athl = U.clamp(me().athl + 2, 0, 100);
        if (x.track === 'rotc' && s.studentDebt > 0) { var cut = Math.min(s.studentDebt, E.$(14000)); s.studentDebt -= cut; E.log('🎓 My ROTC scholarship covered ' + E.fmt(cut) + ' of tuition.'); }
      } else if (s.degrees.some(function (d) { return d.type === 'bachelor'; })) {
        var t = x.track;
        startService({ branch: x.branch, track: 'officer', mos: U.pick(['infantry', 'intel', 'logistics', 'cyber']), years: t === 'cadet' ? 5 : 4 });
        m().active = true;
        E.log('⭐ I was commissioned as ' + E.an(rankTitle()) + ' in ' + branchName(m().branch) + '!', 'good');
      } else { s.mil = null; E.log('I left ' + (x.track === 'rotc' ? 'ROTC' : 'the academy') + ' without a commission.'); }
      return;
    }
    // South Korean men are conscripted in their early twenties.
    if (s.country === 'South Korea' && me().gender === 'M' && !s.mil && !s.flags.conscripted && a >= (s.edu && s.edu.stage === 'uni' ? 21 : 20) && a <= 28 && !s.prison && me().health >= 40) {
      s.flags.conscripted = true; s.pending.push({ id: 'mil_conscript_notice', data: {} });
    }
  }

  // ------------------------------------------------------------------ menu
  function card() {
    var x = m(), s = S();
    var medals = {}; (x.medals || []).forEach(function (q) { medals[q.name] = (medals[q.name] || 0) + 1; });
    var ml = Object.keys(medals).map(function (k) { return k + (medals[k] > 1 ? ' ×' + medals[k] : ''); }).join(', ');
    if (x.track === 'rotc' || x.track === 'cadet') return '<div class="kv"><b>' + (x.track === 'rotc' ? 'ROTC cadet' : 'Cadet') + '</b> · ' + U.esc(branchName(x.branch)) + '<br>I\'ll be commissioned as ' + E.an(RANKS[x.branch] ? RANKS[x.branch][1][0] : 'officer') + ' when I graduate, then serve ' + (x.track === 'cadet' ? 5 : 4) + ' years.</div>';
    if (!x.active) return '<div class="kv"><b>Veteran</b> · ' + U.esc(branchName(x.branch)) + '<br>' + U.plural(x.yos, 'year') + ' of service · ' + U.esc(x.discharge || '') + ' discharge' + (ml ? '<br>🎖️ ' + U.esc(ml) : '') + '</div>';
    return '<div class="mil-card"><div class="mc-ins">' + payGrade() + '</div><div class="mc-main"><b>' + U.esc(rankTitle()) + '</b><small>' + U.esc(jobName()) + ' · ' + U.esc(branchName(x.branch)) + '</small><small>' + U.plural(x.yos, 'year') + ' served · ' + (x.conscript ? 'conscript' : 'contract ends ' + x.contractEnd) + '</small></div></div>' +
      '<div class="minibar"><span>Evaluations</span><span class="track"><span class="fill ' + (x.perf >= 66 ? 'hi' : x.perf >= 33 ? 'mid' : 'lo') + '" style="width:' + x.perf + '%"></span></span></div>' +
      '<p class="small muted">Pay: ' + E.fmt(s.job.salary) + '/yr incl. housing · ' + U.plural(x.deployments, 'deployment') + '</p>' + (ml ? '<p class="small">🎖️ ' + U.esc(ml) + '</p>' : '');
  }
  function menu() {
    ui().menu('Military 🎖️', function () {
      var x = m(), s = S();
      // Left the service (quit ROTC, discharged) while this menu was open.
      if (!x) return [{ info: true, html: '<p class="muted">I\'m no longer in the military.</p>' }];
      var items = [{ info: true, html: card() }];
      if (x.track === 'rotc' || x.track === 'cadet') {
        items.push({ icon: '🏃', label: 'Cadet training', sub: 'Fitness and leadership', onClick: function () { if (!onceAYear('mil_cadet')) return done(nope('I already trained hard this year.')); me().athl = U.clamp(me().athl + 3, 0, 100); E.stat('smarts', 1); done('I led my squad through a field training exercise. 🧭'); } });
        if (x.track === 'rotc') items.push({ icon: '🚪', label: 'Quit ROTC', danger: true, onClick: function () { S().mil = null; done('I left ROTC.'); } });
        return items;
      }
      if (!x.active) {
        items.push({ icon: '🏳️', label: 'Veteran benefits', sub: x.discharge === 'Honorable' ? 'GI Bill · VA healthcare · hiring preference' : 'Lost with a ' + String(x.discharge || 'general').toLowerCase() + ' discharge', disabled: x.discharge !== 'Honorable', onClick: function () { done('As a veteran I can use the GI Bill for college, and employers give me preference for police, fire and federal jobs.'); } });
        return items;
      }
      items.push({ section: 'Duty' });
      items.push({ icon: '🏃', label: 'Physical training', sub: 'Fitness and evaluations', onClick: function () { if (!onceAYear('mil_pt')) return done(nope('I\'m already doing PT every morning.')); me().athl = U.clamp(me().athl + U.rand(2, 4), 0, 100); s.flags.milEffort = 1; E.stat('health', 2); done('I maxed out my fitness test. 💪'); } });
      items.push({ icon: '📚', label: 'Study for the promotion board', onClick: function () { if (!onceAYear('mil_study')) return done(nope('I already studied this year.')); E.stat('smarts', 2); x.perf = U.clamp(x.perf + 6, 0, 100); done('I studied regulations and military history for the board. 📚'); } });
      items.push({ icon: '🎯', label: 'Volunteer for deployment', sub: 'More likely to deploy next year', onClick: function () { if (!onceAYear('mil_vol')) return done(nope('My name is already on the list.')); s.flags.milVolunteer = 1; done('I volunteered for the next deployment.'); } });
      if (!x.sf && !x.conscript && ['army', 'marines', 'navy', 'airforce'].indexOf(x.branch) >= 0 && (officer() ? x.grade >= 1 : x.grade >= 2)) items.push({ icon: '🪖', label: 'Special forces selection', sub: 'Needs elite fitness', disabled: me().athl < 70, onClick: function () { if (!onceAYear('mil_sf')) return done(nope('Selection only runs once a year.')); s.pending.push({ id: 'mil_sf', data: {} }); ui().closeAll(); ui().runPending(); } });
      if (!officer() && !x.conscript && s.degrees.some(function (d) { return d.type === 'bachelor'; }) && me().age <= 32) items.push({ icon: '⭐', label: 'Apply to OCS', sub: 'Become an officer', onClick: function () { if (!onceAYear('mil_ocs2')) return done(nope('I already applied this year.')); if (U.chance(0.6)) { x.track = 'officer'; x.grade = 0; x.tig = 0; sync(); E.achieve('officer'); return done(good('I was commissioned as ' + E.an(rankTitle()) + '! ⭐')); } done(bad('I wasn\'t selected for OCS this year.')); } });
      items.push({ icon: '🏖️', label: 'Take leave', sub: '30 days a year', onClick: function () { if (!onceAYear('mil_leave')) return done(nope('I\'ve used my leave this year.')); E.stat('happy', 6); E.people(['mother', 'father', 'spouse', 'child']).forEach(function (p) { E.rel(p, 3); }); done('I took leave and spent time with family. 🏡'); } });
      items.push({ section: 'Leaving' });
      items.push({ icon: '🚪', label: 'Go AWOL', sub: 'Leave without permission', danger: true, onClick: function () { ui().confirm('Desert?', 'Walking away from a contract means an other-than-honorable discharge and losing veteran benefits.', function () { discharge('Other Than Honorable'); E.karma(-6); E.stat('happy', -4); done(bad('I deserted. I received an other-than-honorable discharge.')); }); } });
      return items;
    });
  }
  function summary() { var x = m(); if (!x) return ''; return x.active ? rankTitle() + ' · ' + branchName(x.branch) : x.track === 'rotc' ? 'ROTC cadet' : x.track === 'cadet' ? 'Academy cadet' : 'Veteran · ' + x.discharge; }
  function veteran() { var x = m(); return !!(x && !x.active && x.discharge === 'Honorable' && x.yos >= 2); }
  function aboutRow() { var x = m(); if (!x || !x.yos) return null; return ['🎖️ Military', (x.active ? rankTitle() : 'Veteran') + ' · ' + branchName(x.branch) + ' · ' + U.plural(x.yos, 'year')]; }

  return { recruiter: recruiter, menu: menu, year: year, yearly: yearly, summary: summary, veteran: veteran, rankTitle: rankTitle, aboutRow: aboutRow, sync: sync };
})();
