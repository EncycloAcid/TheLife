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
    return Math.max(PLANS[m.ins][2], workPlan() ? 0.75 : 0, s.retired && me().age >= 65 ? 0.8 : 0);
  }
  function coverLabel() {
    var c = E.country().name, m = st();
    if (me().age < 18) return 'Covered by my parents';
    if (PUBLIC[c]) return 'Public healthcare · ' + Math.round(PUBLIC[c] * 100) + '% covered';
    if (c !== 'United States') return 'Public clinics · about half covered';
    if (S().retired && me().age >= 65 && coverage() === 0.8) return 'Medicare · 80% covered';
    if (m.ins !== 'none') return PLANS[m.ins][0] + ' · ' + Math.round(PLANS[m.ins][2] * 100) + '% covered';
    return workPlan() ? 'Insurance through work · 75% covered' : 'Uninsured';
  }
  function oop(base) { return Math.round(E.$(base) * (1 - coverage())); }
  // Medical bills don't wait for you to afford them: they can push you into debt.
  function bill(base) { var c = oop(base); E.addMoney(-c); return c; }

  // ------------------------------------------------------------ hooks
  function hides(name) { return !!SILENT[name]; }
  function hide(name) { var m = st(); if (m.hidden[name] != null || E.hasCondition(name)) return; m.hidden[name] = 0; if (name === 'Cancer') m.stage.Cancer = 1; }
  function has(name) { var m = st(); return E.hasCondition(name) || m.hidden[name] != null; }
  // Damage multiplier for a known condition this year.
  function mult(name) {
    var m = st(), ill = D.illness(name) || {};
    if (name === 'Cancer') return STAGE_DMG[m.stage.Cancer || 2] / ill.dmg;
    return m.meds[name] ? 0.65 : 1;
  }
  function diagnose(name, how) {
    var m = st();
    delete m.hidden[name];
    E.addCondition(name);
    var stg = name === 'Cancer' ? ' (stage ' + m.stage.Cancer + ')' : '';
    if (name === 'Cancer' && m.stage.Cancer === 1) E.achieve('caught_early');
    E.log('🩺 ' + how + ' I was diagnosed with ' + name.toLowerCase() + stg + '.', 'bad');
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
      if (E.hasCondition('Cancer')) E.log('📈 My cancer has progressed to stage ' + m.stage.Cancer + '.', 'bad');
    }
    if (!has('Cancer')) delete m.stage.Cancer;
    // Untreated heart disease can mean a heart attack.
    if (has('Heart Disease') && !m.meds['Heart Disease'] && !s.prison && !E.ancient() && U.chance(0.1 + (a > 65 ? 0.06 : 0))) s.pending.push({ id: 'med_heart_attack' });
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
    return n ? 'undiagnosed ' + n.toLowerCase() : null;
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
      (chips ? '<div class="hc-chips">' + chips + '</div>' : '<div class="bz-cap">No known conditions.</div>') + '</div>';
  }
  function priced(base) { var c = oop(base); return c ? E.fmt(c) : 'Covered'; }
  function menu() {
    ui().menu('Doctor', function () {
      var s = S(), m = st(), a = me().age, items = [{ info: true, html: card() }];
      items.push({ section: 'Visits' });
      items.push({ icon: '🩺', label: 'Annual checkup', sub: 'Can catch problems early', right: priced(200), disabled: count('med_check') > 0, onClick: checkup });
      SCREENS.forEach(function (sc) {
        if (a < sc[3]) return;
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
    done(m.doc + ' says my health is ' + verdict + '.' + (c ? ' (' + E.fmt(c) + ')' : ''));
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
        if (U.chance(STAGE_CURE[sg] + 0.05)) return cure(n, 'The surgeons got it all. I\'m cancer-free. 🎗️');
        E.stat('health', -6); done(bad('The surgery went fine, but the cancer wasn\'t all gone.'));
      }) });
      out.push({ icon: '💉', label: 'Chemotherapy', sub: 'Rough side effects', right: priced(80000), onClick: attempt('med_chemo', 80000, function () {
        E.stat('looks', -U.rand(4, 10)); E.stat('happy', -U.rand(4, 10)); E.stat('health', -U.rand(2, 6));
        if (U.chance(STAGE_CURE[sg])) return cure(n, 'After months of chemo, I\'m in remission. 🎗️');
        if (sg > 1 && U.chance(0.6)) { m.stage.Cancer--; return done('Chemo was brutal, but it shrank the cancer back to stage ' + m.stage.Cancer + '.'); }
        done(bad('I lost my hair and my energy, and the cancer held on.'));
      }) });
      if (sg >= 3) out.push({ icon: '🧪', label: 'Clinical trial', sub: 'Experimental · free', right: 'Free', onClick: attempt('med_trial', 0, function () {
        if (U.chance(0.2)) return cure(n, 'The experimental drug worked. My doctors called it a miracle. 🎗️');
        if (U.chance(0.25)) { E.stat('health', -8); return done(bad('The trial drug made me very sick.')); }
        done('The trial didn\'t slow it down, but I helped researchers learn something.');
      }) });
      return out;
    }
    if (n === 'Heart Disease') {
      out.push(medItem(n, ill));
      out.push({ icon: '🫀', label: 'Bypass surgery', sub: 'Could fix it for good', right: priced(ill.cost * 2), onClick: attempt('med_bypass', ill.cost * 2, function () {
        if (me().health < 25 && U.chance(0.15)) { E.stat('health', -30); return done(bad('There were complications on the table. My recovery has been rough.')); }
        if (U.chance(0.6)) return cure(n, 'The bypass worked. My heart is stronger than it\'s been in years. ❤️');
        E.stat('health', 5); done('The surgery helped, but I\'ll still need to manage my heart.');
      }) });
      return out;
    }
    if (ill.incurable) { out.push(medItem(n, ill)); return out; }
    out.push({ icon: '🏥', label: 'Treat ' + n.toLowerCase(), sub: Math.round(ill.cure * 100) + '% success rate', right: priced(ill.cost), onClick: attempt('treat' + n, ill.cost, function () {
      if (U.chance(ill.cure)) return cure(n, 'The treatment worked! I\'m over my ' + n.toLowerCase() + '.');
      done(bad('The treatment didn\'t work this time.'));
    }) });
    if (!ill.therapy && !ill.rehab) out.push({ icon: '🌿', label: 'Try a herbalist', right: E.fmt(E.$(40)), onClick: function () {
      if (count('herb' + n)) return done(nope('I already tried the herbs this year.'));
      bump('herb' + n); E.addMoney(-E.$(40));
      if (U.chance(ill.cure * 0.3)) { E.removeCondition(n); return done(good('Somehow, the herbs worked! My ' + n.toLowerCase() + ' is gone.')); }
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
    var m = st();
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

  return { year: year, costs: costs, hides: hides, hide: hide, has: has, mult: mult, menu: menu, summary: summary, deathCause: deathCause, coverage: coverage, st: st };
})();
