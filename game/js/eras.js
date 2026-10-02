/* TheLife — v1.26: lives before the modern world. Each era in TL.eras
 * (js/ancient.js for Rome, js/medieval.js for medieval England, js/viking.js
 * for the Viking Age) has the same
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
      var par = E.people(['mother', 'father']), was = par.map(function (p) { return p.job; }), city = st.city;
      TL.eras[D.country(st.country).ancient].setup(st, opts);
      // The era may have moved the family (to a village or a fjord): the birth line follows.
      if (city && st.city !== city) st.log.forEach(function (y) { y.entries.forEach(function (e) { e.t = e.t.replace(' in ' + city + ', ', ' in ' + st.city + ', '); }); });
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
  // An heir keeps the family's map of conquests (js/maps.js).
  var eraHeir = api.heir;
  api.heir = function (old) { if (old && old.map) api.st().map = old.map; return eraHeir(old); };
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
    var a = st(), s = S();
    a.rule = { since: s.year, pop: 55, guard: 55, years: 0 };
    E.quitJob(true);
    s.job = { career: c.rule.career, ancient: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, company: c.rule.seat };
    s.counts.jobs++;
    // A ruler lives in the palace, rent-free; history stops speaking of the old ruler.
    s.home = { type: 'palace' };
    if (c.rule.cls) a.cls = c.rule.cls; // a ruler joins the highest rank
    if (TL.maps) TL.maps.freeze();
    E.fame(25); E.stat('happy', 20);
  }
  // The reign is over (deposed, fled, abdicated): out of the palace.
  function lostThrone() {
    var a = st(), s = S();
    a.rule = null;
    if (s.home && s.home.type === 'palace') s.home = JSON.parse(JSON.stringify(TL.ancient.txt('rentHome')));
  }
  function endRule() { E.quitJob(true); lostThrone(); }
  // How likely someone tries to take the throne this year.
  function danger(r) {
    var d = 0.04 + Math.max(0, 50 - r.guard) / 300 + Math.max(0, 45 - r.pop) / 400;
    if (r.watch && r.watch >= S().year - 1) d /= 2; // spies at court
    return d;
  }
  function reignYear(c) {
    var a = st(), r = a.rule, s = S();
    if (!r) return 0;
    r.years++; r.guard = U.clamp(r.guard - U.rand(2, 5), 0, 100); r.pop = U.clamp(r.pop + Math.round((50 - r.pop) / 8) + U.rand(-4, 3), 0, 100);
    E.fame(2);
    if (r.years === 20) E.achieve('long_reign');
    // Wars, invasions and revolts on the map (js/maps.js).
    if (TL.maps) TL.maps.reignYear();
    if (s.dead || !a.rule) return 0;
    if (U.chance(danger(r))) s.pending.push({ id: 'coup_threat' });
    else if (U.chance(0.35)) s.pending.push({ id: U.pick(['reign_famine', 'reign_envoy', 'reign_plot', 'reign_disaster']) });
    return E.jobSalary(s.job) + (TL.maps ? TL.maps.tribute() : 0);
  }
  function reignItems(c) {
    var a = st(), r = a.rule, items = [];
    if (!r) return items;
    var d = danger(r), dl = d < 0.06 ? 'Low' : d < 0.12 ? 'Rising' : d < 0.2 ? 'High' : 'Extreme';
    var trib = TL.maps ? TL.maps.tribute() : 0, income = E.jobSalary(S().job) + trib;
    items.push({ info: true, html: '<div class="kv"><b>Treasury ' + E.fmt(S().money) + '</b> <span class="muted">· income ' + E.fmt(income) + '/yr' + (trib ? ' (' + (trib > 0 ? '+' : '') + E.fmt(trib) + ' from conquered land)' : '') + '</span>'
      + '<br><b>' + U.esc(c.rule.popName) + ' ' + Math.round(r.pop) + '/100 · ' + U.esc(c.rule.guardName) + ' ' + Math.round(r.guard) + '/100</b> <span class="muted">· danger: ' + dl + '</span>'
      + '<br><span class="muted">' + U.plural(r.years, 'year') + ' on the throne. ' + U.esc(c.rule.popName) + ' like gifts, feasts, lower taxes and victories, and hate taxes, purges and defeats. ' + U.esc(c.rule.guardName) + ' grow restless every year unless they are rewarded. If either falls too low, someone will try to take the throne.</span></div>' });
    if (TL.maps) items.push({ icon: '🗺️', label: 'The map and my wars', sub: TL.maps.summary(), onClick: function () { TL.maps.menu(); } });
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
    // ---- the business of ruling, the same in every era
    var R = c.rule, s = S();
    items.push({ section: 'Govern' });
    items.push({ icon: '👂', label: 'Hear petitions', sub: 'Ordinary people come to ask for justice', onClick: function () { if (count('rule_pet')) return done(nope('I heard petitions all year.')); bump('rule_pet'); r.pop = U.clamp(r.pop + 6, 0, 100); E.karma(2); done(U.pick(['A widow had been cheated of her farm. I gave it back to her, and the crowd cheered.', 'I settled a quarrel between two villages over a river.', 'A farmer asked me to punish the tax collector who beat him. I did.'])); } });
    items.push({ icon: '🕵️', label: 'Set spies on the court', sub: 'Plots are found early, for a year or two', right: E.fmt(R.spy), onClick: function () { if (count('rule_spy')) return done(nope('My spies are already everywhere.')); if (s.money < R.spy) return done(nope('Good spies cost ' + E.fmt(R.spy) + '.')); bump('rule_spy'); E.addMoney(-R.spy); r.watch = s.year; done('My spies listen at every door and read every letter.'); } });
    items.push({ icon: '📉', label: 'Cut taxes', sub: 'The people love it; the treasury doesn\'t', right: E.fmt(R.taxcut), onClick: function () { if (count('rule_cut')) return done(nope('Taxes were already cut this year.')); if (s.money < R.taxcut) return done(nope('The treasury can\'t afford it.')); bump('rule_cut'); E.addMoney(-R.taxcut); r.pop = U.clamp(r.pop + 12, 0, 100); done('I cut taxes across ' + R.realm + '. People are drinking to my health.'); } });
    items.push({ icon: '🕊️', label: 'Make peace with ' + R.neighbors[0], sub: 'Calm borders, a quieter army', onClick: function () { if (count('rule_peace')) return done(nope('One treaty a year is enough.')); bump('rule_peace'); r.pop = U.clamp(r.pop + 6, 0, 100); r.guard = U.clamp(r.guard - 4, 0, 100); E.fame(2); done('We swore peace and exchanged gifts. The warriors grumble that there is no one left to fight.'); } });
    if (!E.partner() && me().age >= 16) items.push({ icon: '💍', label: 'Marry for an alliance', sub: 'A royal match brings allies', onClick: function () {
      var g = me().interest === 'F' ? 'F' : me().interest === 'M' ? 'M' : (me().gender === 'M' ? 'F' : 'M'), who = U.pick(g === 'F' ? R.brides : R.grooms), cty = TL.data.country(s.country);
      var p = E.addPerson({ role: 'spouse', gender: g, age: me().age + U.rand(-6, 4), rel: U.rand(35, 70) }); p.first = U.pick(g === 'F' ? cty.female : cty.male); p.job = 'Royal consort';
      r.guard = U.clamp(r.guard + 12, 0, 100); r.pop = U.clamp(r.pop + 4, 0, 100); E.achieve('married');
      done(good('I married ' + p.first + ', ' + who + '. Their family\'s warriors are mine now. 💍'));
    } });
    var kids = E.people('child');
    if (kids.length) items.push({ icon: '🎖️', label: 'Name my heir', sub: r.heirName ? 'Heir: ' + r.heirName : 'A clear heir keeps the realm stable', onClick: function () {
      ui().choose('Name my heir', 'Who will wear the crown after me?', kids.map(function (k) { return { label: k.first + ' (' + k.age + ')', fn: function () { var first = !r.heirName; r.heir = k.id; r.heirName = k.first; if (first) r.guard = U.clamp(r.guard + 8, 0, 100); E.rel(k, 10); done(k.first + ' is my heir. The great men of ' + R.realm + ' swore to support ' + E.him(k) + '.'); } }; }));
    } });
    var laws = (R.laws || []).filter(function (l) { return (r.laws || []).indexOf(l.id) < 0; });
    if (laws.length) items.push({ icon: '📜', label: 'Issue a decree', sub: (r.laws || []).length ? U.plural(r.laws.length, 'law') + ' passed so far' : 'Change the laws of ' + R.realm, onClick: function () {
      if (count('rule_law')) return done(nope('One great law a year. Let people get used to the last one.'));
      ui().choose('Issue a decree', 'Which law?', laws.map(function (l) { return { label: l.label, fn: function () {
        bump('rule_law'); (r.laws = r.laws || []).push(l.id); var f = l.fx || {};
        if (f.pop) r.pop = U.clamp(r.pop + f.pop, 0, 100); if (f.guard) r.guard = U.clamp(r.guard + f.guard, 0, 100);
        if (f.fame) E.fame(f.fame); if (f.karma) E.karma(f.karma); if (f.money) E.addMoney(f.money);
        if (l.run) l.run(); see(l.label, '📜'); done(l.text);
      } }; }));
    } });
    items.push({ icon: '🚪', label: 'Abdicate', sub: 'Give up the throne and live quietly, if they let me', danger: true, onClick: function () { endRule(); E.stat('happy', 5); done('I gave up the throne and left the palace. Somewhere, my successor is already counting the knives.'); } });
    return items;
  }
  function see(title, icon) { var s = S(), h = s.era || (s.era = { seen: [], served: [] }); if (h.seen.length < 40) h.seen.push({ year: s.year, age: me().age, icon: icon, title: title }); }
  TL.events.defs.coup_threat = { id: 'coup_threat', scripted: true, build: function () {
    var c = TL.ancient.on() && TL.ancient.era().coupCfg && TL.ancient.era().coupCfg('throne'), r = st().rule;
    if (!c || !r) return null;
    var t = c.rule.threat;
    return { icon: t.icon, title: t.title, text: t.text, choices: [
      { label: t.fight, run: function () { if (U.chance(0.25 + r.guard / 300)) { r.guard = Math.min(100, r.guard + 10); E.fame(3); return good(t.won); } E.die(t.cause); return bad(t.died); } },
      { label: t.flee, run: function () { if (U.chance(0.7)) { endRule(); E.addMoney(-Math.round(Math.max(0, S().money) * 0.7)); E.stat('happy', -20); if (c.exile) c.exile(); return t.fled; } E.die(t.cause); return bad(t.caught); } }
    ] };
  } };
  // Events of a reign: every era words them through its rule config.
  function rcfg() { var c = TL.ancient.on() && TL.ancient.era().coupCfg && TL.ancient.era().coupCfg('throne'); return c && st().rule ? c.rule : null; }
  function rdef(id, build) { TL.events.defs[id] = { id: id, scripted: true, build: function () { var R = rcfg(); return R ? build(R, st().rule) : null; } }; }
  rdef('reign_famine', function (R, r) {
    var cost = R.taxcut;
    return { icon: '🌾', title: 'Famine in ' + R.realm, text: 'The harvest failed. People are starving and the granaries are full of my grain.', choices: [
      { label: 'Open the granaries (' + E.fmt(cost) + ')', run: function () { E.addMoney(-Math.min(Math.max(0, S().money), cost)); r.pop = U.clamp(r.pop + 14, 0, 100); E.karma(5); return good('Grain carts went out to every town. They call me the father of the people.'); } },
      { label: 'Sell the grain at famine prices', run: function () { E.addMoney(Math.round(cost * 1.5)); r.pop = U.clamp(r.pop - 16, 0, 100); E.karma(-8); return bad('The treasury filled up. The graveyards did too.'); } }
    ] };
  });
  rdef('reign_envoy', function (R, r) {
    var from = U.pick(R.neighbors);
    return { icon: '🎁', title: 'An envoy from ' + from, text: 'Envoys from ' + from + ' arrived with gifts and ask for an alliance.', choices: [
      { label: 'Accept the alliance', run: function () { E.addMoney(Math.round(R.spy * U.randf(1, 3))); E.fame(3); r.guard = U.clamp(r.guard - 3, 0, 100); return good('We feasted the envoys and swore friendship. The gifts were splendid.'); } },
      { label: 'Send them home insulted', run: function () { E.fame(2); r.guard = U.clamp(r.guard + 5, 0, 100); return 'My warriors loved it. ' + from + ' will not forget.'; } }
    ] };
  });
  rdef('reign_plot', function (R, r) {
    var spied = r.watch && r.watch >= S().year - 1;
    return { icon: '🕵️', title: 'A plot uncovered', text: (spied ? 'My spies' : 'A frightened servant') + ' brought me the names of men plotting to kill me. Some of them eat at my table.', choices: [
      { label: 'Execute them all', run: function () { r.guard = U.clamp(r.guard + 10, 0, 100); r.pop = U.clamp(r.pop - 5, 0, 100); E.karma(-8); return 'They died the next morning. Nobody at court has looked me in the eye since.'; } },
      { label: 'Show mercy', run: function () { r.pop = U.clamp(r.pop + 6, 0, 100); E.karma(5); if (U.chance(0.3)) { S().pending.push({ id: 'coup_threat' }); return bad('I forgave them. They did not forgive me.'); } return good('I forgave them in front of the whole court. They wept and swore loyalty.'); } }
    ] };
  });
  rdef('reign_disaster', function (R, r) {
    return { icon: R.disaster[0], title: R.disaster[1], text: R.disaster[2], choices: [
      { label: 'Rebuild from my own treasury (' + E.fmt(R.taxcut) + ')', run: function () { E.addMoney(-Math.min(Math.max(0, S().money), R.taxcut)); r.pop = U.clamp(r.pop + 12, 0, 100); E.fame(2); return good('I paid for everything. My name is on every new building.'); } },
      { label: 'Tax the survivors to pay for it', run: function () { E.addMoney(Math.round(R.taxcut / 2)); r.pop = U.clamp(r.pop - 14, 0, 100); return bad('The money came in. So did the curses.'); } }
    ] };
  });
  // Does the crown pass to me? Only if I'm the named heir, or no heir was named.
  function inherits(rule) {
    if (!rule.heirName || rule.heirName === me().first) return true;
    E.log('👑 My ' + (rule.heirName ? 'sibling ' + rule.heirName : 'sibling') + ' was named heir and wears the crown now.');
    return false;
  }
  return { menu: menu, yearly: yearly, crown: crown, reignYear: reignYear, reignItems: reignItems, inherits: inherits, lostThrone: lostThrone, endRule: endRule, danger: danger };
})();
