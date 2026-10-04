/* TheLife — v1.21: doctor visits & illnesses. Serious illnesses (cancer,
 * heart disease, high blood pressure, diabetes) start silently: symptoms
 * show up in the log, checkups and screenings catch them, and ignoring them
 * ends in the ER. Cancer has stages 1–4 that worsen each untreated year, so
 * catching it early matters. Chronic illnesses can be managed with yearly
 * prescriptions. Health insurance (or public healthcare outside the US)
 * covers part of every bill. State lives in S.med. */
TL.health = (function () {
  var U = TL.util, E = TL.engine, D = TL.data;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function count(key) { var y = S().yearActs || (S().yearActs = {}); return y[key] || 0; }
  function bump(key) { var y = S().yearActs || (S().yearActs = {}); y[key] = (y[key] || 0) + 1; }

  // Illnesses that grow quietly until a checkup, a screening or the ER finds them.
  var SILENT = {
    'Cancer': { hints: ['I\'ve been exhausted for months and lost weight without trying.', 'I found a lump. It\'s probably nothing.', 'I can\'t shake this cough.'] },
    'Heart Disease': { hints: ['I get short of breath climbing stairs now.', 'I had chest tightness after a long walk.'] },
    'High Blood Pressure': { hints: ['I\'ve had a lot of headaches lately.'] },
    'Type 2 Diabetes': { hints: ['I\'m always thirsty lately, and tired.', 'A cut on my foot is taking forever to heal.'] }
  };
  // Screenings: [id, icon, name, min age, base cost, conditions it finds]
  var SCREENS = [
    ['blood', '🩸', 'Blood panel', 25, 300, ['High Blood Pressure', 'Type 2 Diabetes']],
    ['heart', '🫀', 'Heart scan', 40, 1500, ['Heart Disease', 'High Blood Pressure']],
    ['cancer', '🔬', 'Cancer screening', 40, 2000, ['Cancer']]
  ];
  var STAGE_DMG = [0, 7, 11, 16, 23], STAGE_CURE = [0, 0.7, 0.48, 0.24, 0.06];
  // Countries with public healthcare: share of each bill the system pays.
  var PUBLIC = { 'United Kingdom': 0.95, 'Canada': 0.9, 'Australia': 0.88, 'Germany': 0.9, 'France': 0.9, 'Italy': 0.88, 'Spain': 0.88, 'Japan': 0.7, 'South Korea': 0.7 };
  var PLANS = { none: ['No insurance', 0, 0], basic: ['Basic plan', 4500, 0.7], premium: ['Premium plan', 8500, 0.9] };

  function st() {
    var s = S();
    if (!s.med) s.med = { ins: 'none', meds: {}, hidden: {}, stage: {}, checkup: null, doc: null };
    var m = s.med;
    if (!m.doc) { var n = E.randomName(U.chance(0.5) ? 'M' : 'F'); m.doc = 'Dr. ' + n.last; }
    if (s.conditions.indexOf('Cancer') >= 0 && !m.stage.Cancer) m.stage.Cancer = 2;
    return m;
  }
  function us() { return E.country().name === 'United States'; }
  function workPlan() { var j = S().job; return !!(j && !j.partTime && us()); }
  // Share of a medical bill someone else pays.
  function coverage() {
    var s = S(), m = st(), c = E.country().name;
    if (me().age < 18) return 1;
    if (PUBLIC[c]) return PUBLIC[c];
    if (c !== 'United States') return 0.5;
    if (s.prison) return 1;
    return Math.max(PLANS[m.ins][2], workPlan() ? 0.75 : 0, s.retired && me().age >= 65 && s.year >= 1966 ? 0.8 : 0); // Medicare began in 1966
  }
  function coverLabel() {
    var c = E.country().name, m = st();
    if (me().age < 18) return 'Covered by my parents';
    if (PUBLIC[c]) return 'Public healthcare · ' + Math.round(PUBLIC[c] * 100) + '% covered';
    if (c !== 'United States') return 'Public clinics · about half covered';
    if (S().retired && me().age >= 65 && S().year >= 1966 && coverage() === 0.8) return 'Medicare · 80% covered';
    if (m.ins !== 'none') return PLANS[m.ins][0] + ' · ' + Math.round(PLANS[m.ins][2] * 100) + '% covered';
    return workPlan() ? 'Insurance through work · 75% covered' : 'Uninsured';
  }
  function oop(base) { return Math.round(E.$(base) * (1 - coverage())); }
  // Medical bills don't wait for you to afford them: they can push you into debt.
  function bill(base) {
    var c = oop(base), m = st(); E.addMoney(-c);
    // Big bills can be negotiated, forgiven or crowdfunded.
    if (c >= E.$(15000) && yr() >= 1985 && m.billY !== yr() && !S().prison) { m.billY = yr(); S().pending.push({ id: 'med_bill', data: { amt: c, year: yr() } }); }
    return c;
  }

  // ------------------------------------------------------------ medicine through history
  var INFECTIONS = { 'Strep Throat': 1, 'Pneumonia': 1, 'Ear Infection': 1 };
  function yr() { return S().year; }
  // How well treatment works in a given era (1 = today).
  function eraCure(n) {
    var y = yr();
    if (INFECTIONS[n]) return y < 1942 ? 0.45 : 1;                        // penicillin went into wide use in 1942
    if (n === 'Cancer') return y < 1950 ? 0.5 : y < 1990 ? 0.8 : y < 2015 ? 1 : 1.15; // chemo, then modern therapy, then immunotherapy
    if (/Depression|Anxiety|PTSD/.test(n)) return y < 1960 ? 0.6 : y < 1987 ? 0.85 : 1; // modern therapy, then antidepressants
    return 1;
  }
  // Who in my family had what, and whether I smoke, change my odds.
  var FAMILY_CAUSE = [[/cancer/, 'Cancer'], [/heart attack/, 'Heart Disease'], [/stroke/, 'High Blood Pressure']];
  function familyDeath(p, cause) {
    if (['mother', 'father', 'sibling', 'grandparent'].indexOf(p.role) < 0) return;
    var m = st(); m.fam = m.fam || {};
    FAMILY_CAUSE.forEach(function (f) { if (f[0].test(cause || '') && !m.fam[f[1]]) m.fam[f[1]] = 'my ' + (p.role === 'sibling' ? (p.gender === 'M' ? 'brother' : 'sister') : p.role === 'grandparent' ? (p.gender === 'M' ? 'grandfather' : 'grandmother') : p.role); });
  }
  function risk(n) {
    var m = st(), r = 1;
    if (m.fam && m.fam[n]) r *= 2.2;
    if (E.hasCondition('Nicotine Addiction') && /Cancer|Heart Disease|High Blood Pressure/.test(n)) r *= 2;
    if (INFECTIONS[n] && yr() < 1942) r *= 1.5;
    return r;
  }
  function famNote() { var m = st(); return m.fam ? Object.keys(m.fam).map(function (n) { return m.fam[n] + ' (' + n.toLowerCase() + ')'; }).join(', ') : ''; }

  // ------------------------------------------------------------ hooks
  function hides(name) { return !!SILENT[name]; }
  function hide(name) { var m = st(); if (m.hidden[name] != null || E.hasCondition(name)) return; m.hidden[name] = 0; if (name === 'Cancer') m.stage.Cancer = 1; }
  function has(name) { var m = st(); return E.hasCondition(name) || m.hidden[name] != null; }
  // Damage multiplier for a known condition this year.
  function mult(name) {
    var m = st(), ill = D.illness(name) || {};
    if (name === 'Cancer') return STAGE_DMG[m.stage.Cancer || 2] / ill.dmg;
    if (INFECTIONS[name] && yr() < 1942) return 1.6; // no antibiotics
    if (name === 'Type 2 Diabetes' && yr() < 1922) return 2; // no insulin
    return m.meds[name] ? (name === 'Heart Disease' && yr() < 1987 ? 0.8 : 0.65) : 1; // statins arrived in 1987
  }
  function diagnose(name, how) {
    var m = st();
    delete m.hidden[name];
    E.addCondition(name);
    var stg = name === 'Cancer' && !E.ancient() ? ' (stage ' + m.stage.Cancer + ')' : '';
    if (name === 'Cancer' && m.stage.Cancer === 1) E.achieve('caught_early');
    E.log('🩺 ' + how + ' I was diagnosed with ' + E.illWith(name) + stg + '.', 'bad');
  }
  // Runs once a year from engine.yearlyHealth, before conditions do damage.
  function year() {
    var s = S(), m = st(), a = me().age;
    // Hidden illnesses do their damage, drop hints and eventually surface.
    Object.keys(m.hidden).forEach(function (n) {
      var ill = D.illness(n); if (!ill) { delete m.hidden[n]; return; }
      m.hidden[n]++;
      E.stat('health', -(n === 'Cancer' ? STAGE_DMG[m.stage.Cancer] : ill.dmg) * (a < 40 ? 0.6 : 1));
      if (U.chance(0.45)) E.log('🤔 ' + U.pick(SILENT[n].hints));
      if (me().health < 30 || U.chance(0.12 + m.hidden[n] * 0.08)) {
        var er = bill(n === 'Cancer' || n === 'Heart Disease' ? 12000 : 2500);
        diagnose(n, E.ancient() ? 'I collapsed and a physician was summoned.' : 'I ended up in the ER.' + (er ? ' The bill was ' + E.fmt(er) + '.' : ''));
      }
    });
    // Untreated cancer spreads.
    if (m.stage.Cancer && has('Cancer') && m.stage.Cancer < 4 && U.chance(0.5)) {
      m.stage.Cancer++;
      if (E.hasCondition('Cancer')) E.log(E.ancient() ? '📈 The tumor has grown worse.' : '📈 My cancer has progressed to stage ' + m.stage.Cancer + '.', 'bad');
    }
    if (!has('Cancer')) delete m.stage.Cancer;
    // Untreated heart disease can mean a heart attack.
    if (has('Heart Disease') && !m.meds['Heart Disease'] && !s.prison && !E.ancient() && U.chance(0.1 + (a > 65 ? 0.06 : 0))) s.pending.push({ id: 'med_heart_attack' });
    // COVID-19, 2020-2022 (vaccines from 2021).
    var y = s.year;
    if (y >= 2020 && y <= 2022 && !E.ancient() && U.chance((y === 2021 ? 0.25 : 0.2) * (m.vax ? 0.4 : 1))) {
      var hit = a >= 65 ? U.rand(8, 22) : U.rand(2, 7);
      E.stat('health', -hit); E.log('😷 I caught COVID-19. ' + (hit >= 12 ? 'I ended up in the hospital for a week.' : m.vax ? 'Being vaccinated kept it mild.' : 'A rough couple of weeks in bed.'), hit >= 12 ? 'bad' : '');
      if (hit >= 12) bill(9000);
    }
    if (y === 2021 && a >= 12 && !m.vax && !m.vaxAsked && !E.ancient()) { m.vaxAsked = true; s.pending.push({ id: 'med_vaccine', data: { year: y } }); }
    // Prescriptions for conditions you no longer have lapse.
    Object.keys(m.meds).forEach(function (n) { if (!E.hasCondition(n)) delete m.meds[n]; });
  }
  // Yearly out-of-pocket costs for engine.yearlyFinances: premiums plus prescriptions.
  function costs() {
    var m = st(), c = 0;
    if (me().age < 18) return 0;
    if (us() && m.ins !== 'none') c += E.$(PLANS[m.ins][1]);
    Object.keys(m.meds).forEach(function (n) { var ill = D.illness(n); if (ill) c += oop(Math.max(300, ill.cost * 0.5)); });
    return c;
  }
  function deathCause() {
    var m = st(), n = Object.keys(m.hidden)[0];
    return n ? (E.ancient() ? 'a hidden illness' : 'undiagnosed ' + E.illLow(n)) : null;
  }

  // ------------------------------------------------------------ events
  function def(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  def('med_heart_attack', { build: function () {
    var known = E.hasCondition('Heart Disease');
    return { icon: '🚑', title: 'Heart attack', text: 'Crushing chest pain hit me out of nowhere' + (known ? '' : ', and I had no idea my heart was in trouble') + '.', choices: [
      { label: 'Call 911', run: function () {
        var c = bill(30000); E.stat('health', -U.rand(10, 20));
        if (!known) diagnose('Heart Disease', 'The cardiologist ran tests.');
        E.achieve('second_chance');
        return 'Paramedics got me to the hospital in time. I survived' + (c ? ', with a ' + E.fmt(c) + ' bill' : '') + '.';
      } },
      { label: 'Tough it out', run: function () {
        E.stat('health', -U.rand(25, 45));
        if (!known) st().hidden['Heart Disease'] = 3;
        return bad('I lay down and waited for it to pass. It did, barely. My heart will never be the same.');
      } }
    ] };
  } });

  // ------------------------------------------------------------ menu
  function cond(n) {
    var m = st(), ill = D.illness(n) || {};
    if (n === 'Cancer') return 'Stage ' + (m.stage.Cancer || 2) + (m.stage.Cancer >= 4 ? ' · terminal' : m.stage.Cancer === 1 ? ' · caught early' : '');
    if (m.meds[n]) return 'On medication';
    if (ill.incurable) return 'Chronic · untreated';
    if (ill.therapy) return 'Therapy helps';
    if (ill.rehab) return 'Rehab helps';
    return 'Untreated';
  }
  function card() {
    var s = S(), m = st(), h = Math.round(me().health), last = m.checkup == null ? 'Never' : s.year - m.checkup === 0 ? 'This year' : U.plural(s.year - m.checkup, 'year') + ' ago';
    var chips = s.conditions.map(function (n) {
      var bad2 = n === 'Cancer' || n === 'Heart Disease';
      return '<span class="hc-chip' + (bad2 ? ' bad' : '') + '">' + U.esc(n) + ' <small>' + U.esc(cond(n)) + '</small></span>';
    }).join('');
    return '<div class="hc-card"><div class="bz-top"><span class="bz-ico">🩺</span><div><div class="bz-name">' + U.esc(m.doc) + '</div><div class="bz-sub">My doctor · last checkup ' + U.esc(last.toLowerCase()) + '</div></div></div>' +
      '<div class="minibar"><span>Health</span><span class="track"><span class="fill ' + (h >= 66 ? 'hi' : h >= 33 ? 'mid' : 'lo') + '" style="width:' + h + '%"></span></span></div>' +
      '<div class="hc-ins">🛡️ ' + U.esc(coverLabel()) + '</div>' +
      (chips ? '<div class="hc-chips">' + chips + '</div>' : '<div class="bz-cap">No known conditions.</div>') + (famNote() ? '<div class="bz-cap">🧬 Family history: ' + U.esc(famNote()) + '</div>' : '') + (E.hasCondition('Nicotine Addiction') ? '<div class="bz-cap">🚬 Smoking doubles my risk of cancer and heart disease.</div>' : '') + '</div>';
  }
  function priced(base) { var c = oop(base); return c ? E.fmt(c) : 'Covered'; }
  function menu() {
    ui().menu('Doctor', function () {
      var s = S(), m = st(), a = me().age, items = [{ info: true, html: card() }];
      items.push({ section: 'Visits' });
      items.push({ icon: '🩺', label: 'Annual checkup', sub: 'Can catch problems early', right: priced(200), disabled: count('med_check') > 0, onClick: checkup });
      SCREENS.forEach(function (sc) {
        if (a < sc[3] - (sc[5].some(function (n) { return m.fam && m.fam[n]; }) ? 10 : 0)) return;
        items.push({ icon: sc[1], label: sc[2], sub: 'Looks for ' + sc[5].map(function (x) { return x.toLowerCase(); }).join(' and '), right: priced(sc[4]), disabled: count('med_' + sc[0]) > 0, onClick: function () { screen(sc); } });
      });
      s.conditions.forEach(function (n) { treatments(n).forEach(function (t, i) { if (!i) items.push({ section: n }); items.push(t); }); });
      if (a >= 18 && us()) items.push({ section: 'Insurance' }, { icon: '🛡️', label: 'Health insurance', sub: coverLabel(), onClick: insurance });
      return items;
    });
  }
  function checkup() {
    var s = S(), m = st(), c = bill(200);
    bump('med_check'); m.checkup = s.year;
    E.stat('health', 1);
    var found = Object.keys(m.hidden).filter(function () { return U.chance(0.4); });
    found.forEach(function (n) { diagnose(n, m.doc + ' ordered some tests.'); });
    var h = me().health, verdict = h > 80 ? 'excellent' : h > 55 ? 'decent' : h > 30 ? 'concerning' : 'critical';
    if (found.length) return done({ text: m.doc + ' found something: ' + found.join(' and ').toLowerCase() + (found.indexOf('Cancer') >= 0 ? ' (stage ' + m.stage.Cancer + ')' : '') + '. Better to know now.', cls: 'bad' });
    var untreated = S().conditions.filter(function (n) { var i = D.illness(n); return i && i.incurable && !m.meds[n]; });
    if (untreated.length && verdict === 'excellent') verdict = 'good for now';
    var nag = untreated.length ? ' But I really need to get my ' + untreated[0].toLowerCase() + ' under control.' : '';
    var advice = nag + (m.fam && Object.keys(m.fam).length ? ' Because ' + m.fam[Object.keys(m.fam)[0]] + ' had ' + Object.keys(m.fam)[0].toLowerCase() + ', ' + m.doc + ' wants me screened early.' : E.hasCondition('Nicotine Addiction') ? ' ' + m.doc + ' begged me to quit smoking.' : '');
    done(m.doc + ' says my health is ' + verdict + '.' + advice + (c ? ' (' + E.fmt(c) + ')' : ''));
  }
  function screen(sc) {
    var m = st(); bump('med_' + sc[0]); m.checkup = S().year; bill(sc[4]);
    var found = sc[5].filter(function (n) { return m.hidden[n] != null && U.chance(0.75); });
    found.forEach(function (n) { diagnose(n, 'My ' + sc[2].toLowerCase() + ' came back abnormal.'); });
    done(found.length ? { text: 'The ' + sc[2].toLowerCase() + ' found ' + found.join(' and ').toLowerCase() + (found.indexOf('Cancer') >= 0 ? ' at stage ' + m.stage.Cancer : '') + '.', cls: 'bad' } : good('My ' + sc[2].toLowerCase() + ' came back clear. 🙌'));
  }
  // One attempt per treatment per year; each returns a menu item.
  function attempt(key, base, fn) {
    return function () {
      if (count(key) > 0) return done(nope('That has to wait until next year.'));
      var c = oop(base);
      if (S().money < c && c > E.$(5000) && S().money < -E.$(50000)) return done(nope('The hospital won\'t take more debt from me.'));
      bump(key); bill(base); fn();
    };
  }
  function cure(n, text) { E.removeCondition(n); delete st().meds[n]; if (n === 'Cancer') { delete st().stage.Cancer; E.achieve('survivor'); } E.stat('health', U.rand(6, 14)); E.stat('happy', 10); return done(good(text)); }
  function treatments(n) {
    var m = st(), ill = D.illness(n) || { cure: 0.5, cost: 200 }, out = [];
    if (n === 'Cancer') {
      var sg = m.stage.Cancer || 2;
      if (sg <= 2) out.push({ icon: '🔪', label: 'Surgery', sub: 'Remove the tumor · best while it\'s early', right: priced(60000), onClick: attempt('med_surg', 60000, function () {
        if (U.chance((STAGE_CURE[sg] + 0.05) * eraCure(n))) return cure(n, 'The surgeons got it all. I\'m cancer-free. 🎗️');
        E.stat('health', -6); done(bad('The surgery went fine, but the cancer wasn\'t all gone.'));
      }) });
      if (yr() >= 1950) out.push({ icon: '💉', label: yr() >= 2015 ? 'Chemo and immunotherapy' : 'Chemotherapy', sub: 'Rough side effects', right: priced(80000), onClick: attempt('med_chemo', 80000, function () {
        E.stat('looks', -U.rand(4, 10)); E.stat('happy', -U.rand(4, 10)); E.stat('health', -U.rand(2, 6));
        if (U.chance(STAGE_CURE[sg] * eraCure(n))) return cure(n, 'After months of chemo, I\'m in remission. 🎗️');
        if (sg > 1 && U.chance(0.6)) { m.stage.Cancer--; return done('Chemo was brutal, but it shrank the cancer back to stage ' + m.stage.Cancer + '.'); }
        done(bad('I lost my hair and my energy, and the cancer held on.'));
      }) });
      if (sg >= 3 && yr() >= 1960) out.push({ icon: '🧪', label: 'Clinical trial', sub: 'Experimental · free', right: 'Free', onClick: attempt('med_trial', 0, function () {
        if (U.chance(0.2)) return cure(n, 'The experimental drug worked. My doctors called it a miracle. 🎗️');
        if (U.chance(0.25)) { E.stat('health', -8); return done(bad('The trial drug made me very sick.')); }
        done('The trial didn\'t slow it down, but I helped researchers learn something.');
      }) });
      return out;
    }
    if (n === 'Heart Disease') {
      out.push(medItem(n, ill));
      if (yr() >= 1968) out.push({ icon: '🫀', label: 'Bypass surgery', sub: 'Could fix it for good', right: priced(ill.cost * 2), onClick: attempt('med_bypass', ill.cost * 2, function () {
        if (me().health < 25 && U.chance(0.15)) { E.stat('health', -30); return done(bad('There were complications on the table. My recovery has been rough.')); }
        if (U.chance(0.6)) return cure(n, 'The bypass worked. My heart is stronger than it\'s been in years. ❤️');
        E.stat('health', 5); done('The surgery helped, but I\'ll still need to manage my heart.');
      }) });
      return out;
    }
    if (ill.incurable) { out.push(medItem(n, ill)); return out; }
    var cr = Math.min(0.98, ill.cure * eraCure(n));
    out.push({ icon: '🏥', label: 'Treat ' + E.illLow(n), sub: Math.round(cr * 100) + '% success rate' + (eraCure(n) < 1 ? ' · medicine of the day' : ''), right: priced(ill.cost), onClick: attempt('treat' + n, ill.cost, function () {
      if (U.chance(cr)) return cure(n, 'The treatment worked! I\'m over my ' + n.toLowerCase() + '.');
      done(bad('The treatment didn\'t work this time.'));
    }) });
    if (!ill.therapy && !ill.rehab) out.push({ icon: '🌿', label: 'Try a herbalist', right: E.fmt(E.$(40)), onClick: function () {
      if (count('herb' + n)) return done(nope('I already tried the herbs this year.'));
      bump('herb' + n); E.addMoney(-E.$(40));
      if (U.chance(ill.cure * 0.3)) { E.removeCondition(n); return done(good('Somehow, the herbs worked! My ' + E.illLow(n) + ' is gone.')); }
      if (U.chance(0.2)) { E.stat('health', -5); return done(bad('The herbal tea made me violently ill.')); }
      done('The herbs did nothing.');
    } });
    return out;
  }
  function medItem(n, ill) {
    var m = st(), yearly = oop(Math.max(300, ill.cost * 0.5));
    return { icon: '💊', label: m.meds[n] ? 'Stop medication' : 'Start medication', sub: m.meds[n] ? 'Keeps it under control' : 'Daily pills keep it in check', right: m.meds[n] ? '' : (yearly ? E.fmt(yearly) + '/yr' : 'Covered'), danger: !!m.meds[n], onClick: function () {
      if (m.meds[n]) { delete m.meds[n]; return done('I stopped taking my ' + n.toLowerCase() + ' medication.'); }
      m.meds[n] = true; E.stat('health', 3); done(good('I started medication for my ' + n.toLowerCase() + '. 💊'));
    } };
  }
  function insurance() {
    var m = st(), chronic = S().conditions.some(function (n) { var i = D.illness(n); return i && (i.incurable || n === 'Cancer' || n === 'Heart Disease'); });
    // Before the Affordable Care Act (2014), insurers could turn you down.
    if (yr() < 2014 && chronic && m.ins === 'none' && !workPlan()) return done(nope('Every insurer turned me down because of my pre-existing condition.'));
    ui().choose('Health insurance', 'A plan pays most of every medical bill. ' + (workPlan() ? 'My job already covers 75%.' : 'Without one, I pay everything myself.'), Object.keys(PLANS).map(function (k) {
      var p = PLANS[k];
      return { label: (m.ins === k ? '✓ ' : '') + p[0] + (p[1] ? ' · ' + E.fmt(E.$(p[1])) + '/yr, covers ' + Math.round(p[2] * 100) + '%' : ''), fn: function () { m.ins = k; done(k === 'none' ? 'I dropped my health insurance.' : 'I signed up for the ' + p[0].toLowerCase() + '. 🛡️'); } };
    }));
  }
  function summary() {
    var s = S(), m = st(), n = s.conditions.length;
    if (!n) return m.checkup != null && s.year - m.checkup <= 1 ? 'Checked out recently' : 'No known conditions';
    return s.conditions.map(function (c) { return c === 'Cancer' ? 'Cancer (stage ' + (m.stage.Cancer || 2) + ')' : c; }).join(', ');
  }

  def('med_vaccine', { build: function (d) {
    if (!d || d.year !== S().year) return null;
    return { icon: '💉', title: 'COVID vaccine', text: 'COVID-19 vaccines are available to me now.', choices: [
      { label: 'Get vaccinated', run: function () { st().vax = S().year; E.karma(1); return good('I got my shots. Sore arm, peace of mind. 💉'); } },
      { label: 'Wait and see', run: function () { return 'I decided to wait.'; } }] };
  } });
  def('med_bill', { build: function (d) {
    if (!d || d.year !== S().year) return null;
    var s = S(), amt = d.amt, social = s.social && s.social.platform && s.year >= 2010;
    var ch = [
      { label: 'Negotiate the bill', run: function () { if (U.chance(0.55)) { var back = Math.round(amt * U.randf(0.25, 0.6)); E.addMoney(back); return good('I spent hours on the phone and got ' + E.fmt(back) + ' knocked off.'); } return 'The hospital wouldn\'t budge.'; } },
      { label: 'Apply for financial assistance', run: function () { if (s.money < amt && U.chance(0.45)) { var f = Math.round(amt * U.randf(0.5, 1)); E.addMoney(f); return good('The hospital\'s charity program forgave ' + E.fmt(f) + '.'); } return 'I didn\'t qualify for assistance.'; } }];
    if (social) ch.push({ label: 'Start an online fundraiser', run: function () { var friends = s.people.filter(function (p) { return p.alive && p.rel >= 50 && p.age >= 18; }).length; var raised = Math.min(amt, Math.round(E.$(friends * 120 + (s.followers || 0) * 0.05) * U.randf(0.5, 1.5))); E.addMoney(raised); E.stat('happy', 4); return good('Friends, family and followers chipped in ' + E.fmt(raised) + '. People are good. 💛'); } });
    return { icon: '🧾', title: 'Medical bill', text: 'The hospital sent a bill for ' + E.fmt(amt) + ' after insurance.', choices: ch };
  } });

  return { familyDeath: familyDeath, risk: risk, eraCure: eraCure, year: year, costs: costs, hides: hides, hide: hide, has: has, mult: mult, menu: menu, summary: summary, deathCause: deathCause, coverage: coverage, st: st };
})();
