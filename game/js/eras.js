/* TheLife — v1.26: lives before the modern world. Each era in TL.eras
 * (js/ancient.js for Rome, js/medieval.js for medieval England) has the same
 * shape; TL.ancient routes the engine's hooks to the era of the current life,
 * and jobs to the era their career belongs to. */
TL.ancient = (function () {
  var E = TL.engine, D = TL.data;
  function era() { var id = TL.S && E.ancient(); return id ? TL.eras[id] : null; }
  function on() { return !!era(); }
  function all() { return Object.keys(TL.eras).map(function (k) { return TL.eras[k]; }); }
  function byCareer(id) { return all().filter(function (e) { return e.career(id); })[0] || null; }
  function byOption(v) { return all().filter(function (e) { return e.birthOptions().some(function (o) { return o[0] === v; }); })[0] || null; }
  var api = {
    on: on, era: era, all: all, byOption: byOption,
    career: function (id) { var e = byCareer(id); return e ? e.career(id) : null; },
    setup: function (st, opts) {
      var par = E.people(['mother', 'father']), was = par.map(function (p) { return p.job; });
      TL.eras[D.country(st.country).ancient].setup(st, opts);
      // The birth log already introduced my parents with modern jobs: use the era's.
      par.forEach(function (p, i) {
        if (p.job === was[i]) return;
        st.log.forEach(function (y) { y.entries.forEach(function (e) { if (e.t.indexOf(' is ' + E.fullName(p) + ', ') > 0) e.t = e.t.replace(', ' + E.jobPhrase(was[i]) + ' (', ', ' + E.jobPhrase(p.job) + ' ('); }); });
      });
    },
    birthOptions: function () { return all().reduce(function (a, e) { return a.concat(e.birthOptions()); }, []); }
  };
  ['heir', 'housed'].forEach(function (n) { api[n] = function () { var e = era(); return e[n].apply(e, arguments); }; });
  ['jobYear', 'salary', 'title'].forEach(function (n) { api[n] = function (j) { return (byCareer(j.career) || era())[n](j); }; });
  ['st', 'yearly', 'npcJob', 'homeLabel', 'occupationMenu', 'assetsMenu', 'activitiesMenu', 'acts', 'aboutRows', 'recapRow', 'illName', 'txt'].forEach(function (n) {
    api[n] = function () { var e = era(); return e[n].apply(e, arguments); };
  });
  ['WEDDINGS', 'TOPICS', 'KID_TOPICS', 'ACH'].forEach(function (n) { Object.defineProperty(api, n, { get: function () { return era()[n]; } }); });
  return api;
})();

/* v1.28: plots, revolts and reigns, shared by every early era. An era hands
 * over a config (coupCfg) with its own words and costs: who you can recruit,
 * whom you can bribe, what happens if you win. Plotting builds strength but
 * also suspicion; strike when you're strong enough, before you're found out.
 * Seize the throne and you must keep it: the people and the guard (or the
 * barons) have to be kept happy, or someone will do to you what you did.
 * State: S.anc.plot while plotting, S.anc.rule while reigning. */
TL.coup = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function count(k) { var y = S().yearActs || (S().yearActs = {}); return y[k] || 0; }
  function bump(k) { var y = S().yearActs || (S().yearActs = {}); y[k] = (y[k] || 0) + 1; }
  function st() { return TL.ancient.st(); }
  function lost(c, how) {
    var s = S(), a = st();
    a.plot = null;
    if (U.chance(0.6)) { E.die(how.cause); return bad(how.text + ' ' + how.death); }
    E.addMoney(-Math.round(Math.max(0, s.money) * 0.6)); E.quitJob(true); E.stat('happy', -20); E.fame(5);
    if (c.exile) c.exile();
    return bad(how.text + ' ' + how.spared);
  }
  // The conspiracy menu (opened from the era's Occupation menu).
  function menu(c) {
    ui().menu(c.title, function () {
      var a = st(), p = a.plot, items = [];
      items.push({ info: true, html: '<p class="muted">' + U.esc(c.intro) + '</p>' });
      if (!p) {
        items.push({ icon: c.strike[0], label: 'Begin plotting', sub: 'There is no turning back once people know', danger: true, onClick: function () { a.plot = { kind: c.kind, power: 5, men: 0, heat: 4, since: S().year }; E.log(c.strike[0] + ' ' + c.begin, 'bad'); done(c.begin); } });
        return items;
      }
      items.push({ info: true, html: '<div class="kv"><b>Strength ' + Math.round(p.power) + '/100 · ' + U.plural(p.men, c.men) + '</b><br><span class="muted">Suspicion ' + Math.round(p.heat) + '/100' + (p.heat >= 50 ? ' · they are watching us' : '') + '</span></div>' });
      items.push({ icon: c.recruit[0], label: c.recruit[1], sub: c.recruit[2], onClick: function () {
        if (count('cp_recruit')) return done(nope('Recruiting twice in a year would draw attention.'));
        bump('cp_recruit'); var n = U.rand(1, 3); p.men += n; p.power = Math.min(100, p.power + U.rand(6, 12) + S().fame / 20 + Math.max(0, me().smarts - 50) / 10); p.heat = Math.min(100, p.heat + 5 + p.men);
        if (U.chance(0.12)) { p.heat = Math.min(100, p.heat + 15); return done(bad('One of the people I approached looked very nervous. I hope they keep quiet.')); }
        done(c.recruit[3].replace('{n}', n));
      } });
      if (c.bribe) items.push({ icon: c.bribe[0], label: c.bribe[1], sub: c.bribe[2], right: E.fmt(c.bribe[3]), onClick: function () {
        if (count('cp_bribe')) return done(nope('Too much gold changing hands would be noticed.'));
        if (S().money < c.bribe[3]) return done(nope('I need ' + E.fmt(c.bribe[3]) + '.'));
        bump('cp_bribe'); E.addMoney(-c.bribe[3]); p.power = Math.min(100, p.power + U.rand(14, 24)); p.heat = Math.min(100, p.heat + 6);
        done(c.bribe[4]);
      } });
      if (c.army) items.push({ icon: c.army[0], label: c.army[1], sub: c.army[2], onClick: function () {
        if (count('cp_army')) return done(nope('My men are already sworn.'));
        bump('cp_army'); p.power = Math.min(100, p.power + U.rand(16, 26)); p.heat = Math.min(100, p.heat + 5);
        done(c.army[3]);
      } });
      items.push({ icon: '🤫', label: 'Lie low for a while', sub: 'Lets suspicion fade, but loses momentum', onClick: function () { if (count('cp_low')) return done(nope('I\'m already keeping my head down.')); bump('cp_low'); p.heat = Math.max(0, p.heat - 18); p.power = Math.max(0, p.power - 3); done('I stayed quiet and was seen at all the right places, smiling.'); } });
      var odds = Math.round(chance(p, c) * 100);
      items.push({ icon: c.strike[0], label: c.strike[1], sub: p.power < 30 ? 'Too weak to strike yet' : 'About ' + odds + '% chance of success', danger: true, disabled: p.power < 30, onClick: function () {
        ui().choose(c.strike[1], 'This is the moment. If we fail, I will almost certainly die.', [
          { label: 'Strike now', fn: function () { strike(c); } },
          { label: 'Wait', fn: function () { done('Not yet.'); } }
        ]);
      } });
      items.push({ icon: '🚪', label: 'Abandon the plot', onClick: function () { a.plot = null; done('I burned my letters and let the plot die. My friends will keep my secret, I hope.'); } });
      return items;
    });
  }
  // Revolts from below rarely won; a well-prepared plot at court often did.
  function chance(p, c) { return Math.min(0.8, (0.02 + p.power / 140 + S().fame / 600) * (c.kind === 'revolt' ? 0.65 : 1)); }
  function strike(c) {
    var a = st(), p = a.plot;
    if (!p) return;
    if (U.chance(chance(p, c))) {
      a.plot = null; ui().closeAll && ui().closeAll();
      E.achieve(c.kind === 'throne' ? 'usurper' : 'rebel');
      return done(good(c.win()));
    }
    done(lost(c, c.lose));
  }
  // Each year a plot runs the risk of being discovered.
  function yearly(c) {
    var a = st(), p = a.plot;
    if (!p) return;
    p.heat = Math.max(0, p.heat - 3);
    if (U.chance(Math.min(0.45, p.heat / 210))) {
      var r = lost(c, c.caught);
      E.log(r.text, 'bad');
    }
  }
  // ---- reigning
  function crown(c) {
    var a = st();
    a.rule = { since: S().year, pop: 55, guard: 55, years: 0 };
    E.quitJob(true);
    S().job = { career: c.rule.career, ancient: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, company: c.rule.seat };
    S().counts.jobs++;
    E.fame(25); E.stat('happy', 20);
  }
  function reignYear(c) {
    var a = st(), r = a.rule, s = S();
    if (!r) return 0;
    r.years++; r.guard = U.clamp(r.guard - U.rand(2, 5), 0, 100); r.pop = U.clamp(r.pop + Math.round((50 - r.pop) / 8) + U.rand(-4, 3), 0, 100);
    E.fame(2);
    if (r.years === 20) E.achieve('long_reign');
    var danger = 0.04 + Math.max(0, 50 - r.guard) / 300 + Math.max(0, 45 - r.pop) / 400;
    if (U.chance(danger)) s.pending.push({ id: 'coup_threat' });
    return E.jobSalary(s.job);
  }
  function reignItems(c) {
    var a = st(), r = a.rule, items = [];
    if (!r) return items;
    items.push({ info: true, html: '<div class="kv"><b>' + U.esc(c.rule.popName) + ' ' + Math.round(r.pop) + '/100 · ' + U.esc(c.rule.guardName) + ' ' + Math.round(r.guard) + '/100</b><br><span class="muted">' + U.plural(r.years, 'year') + ' on the throne. Let either fall too low and someone will try to take it.</span></div>' });
    c.rule.acts.forEach(function (x) {
      var cost = x.cost || 0;
      items.push({ icon: x.icon, label: x.label, sub: x.sub, right: cost ? E.fmt(cost) : null, danger: x.danger, onClick: function () {
        if (count('rule_' + x.id)) return done(nope('Once a year is enough for that.'));
        if (cost && S().money < cost) return done(nope('The treasury can\'t afford ' + E.fmt(cost) + '.'));
        bump('rule_' + x.id); if (cost) E.addMoney(-cost);
        if (x.war) {
          var w = U.chance(0.45 + r.guard / 400);
          if (!w && U.chance(0.08)) { E.die(x.death); return done(bad(x.lose)); }
          r.pop = U.clamp(r.pop + (w ? 18 : -15), 0, 100); r.guard = U.clamp(r.guard + (w ? 8 : -6), 0, 100); if (w) { E.fame(8); E.addMoney(Math.round(cost * U.randf(1.2, 3))); }
          return done(w ? good(x.win) : bad(x.lose));
        }
        var f = x.fx || {};
        if (f.pop) r.pop = U.clamp(r.pop + f.pop, 0, 100);
        if (f.guard) r.guard = U.clamp(r.guard + f.guard, 0, 100);
        if (f.fame) E.fame(f.fame);
        if (f.karma) E.karma(f.karma);
        if (f.happy) E.stat('happy', f.happy);
        if (f.money) E.addMoney(f.money);
        if (x.see) see(x.see[0], x.see[1]);
        done(x.text);
      } });
    });
    items.push({ icon: '🚪', label: 'Abdicate', sub: 'Give up the throne and live quietly, if they let me', danger: true, onClick: function () { a.rule = null; E.quitJob(true); E.stat('happy', 5); done('I gave up the throne. Somewhere, my successor is already counting the knives.'); } });
    return items;
  }
  function see(title, icon) { var s = S(), h = s.era || (s.era = { seen: [], served: [] }); if (h.seen.length < 40) h.seen.push({ year: s.year, age: me().age, icon: icon, title: title }); }
  TL.events.defs.coup_threat = { id: 'coup_threat', scripted: true, build: function () {
    var c = TL.ancient.on() && TL.ancient.era().coupCfg && TL.ancient.era().coupCfg('throne'), r = st().rule;
    if (!c || !r) return null;
    var t = c.rule.threat;
    return { icon: t.icon, title: t.title, text: t.text, choices: [
      { label: t.fight, run: function () { if (U.chance(0.25 + r.guard / 300)) { r.guard = Math.min(100, r.guard + 10); E.fame(3); return good(t.won); } E.die(t.cause); return bad(t.died); } },
      { label: t.flee, run: function () { if (U.chance(0.7)) { st().rule = null; E.quitJob(true); E.addMoney(-Math.round(Math.max(0, S().money) * 0.7)); E.stat('happy', -20); if (c.exile) c.exile(); return t.fled; } E.die(t.cause); return bad(t.caught); } }
    ] };
  } };
  return { menu: menu, yearly: yearly, crown: crown, reignYear: reignYear, reignItems: reignItems };
})();
