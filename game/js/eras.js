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
  api.heir = function (old, prev) {
    var a = api.st();
    if (old && old.map) a.map = old.map;
    // Once a family has held the throne, history stays changed for its children too.
    if (old && (old.alt || old.ruled || old.after || (old.dyn && old.dyn.how === 'birth'))) { a.alt = true; if (old.after) a.after = old.after; }
    return eraHeir(old, prev);
  };
  // A royal heir's place shows in About and the life recap (TL.dynasty).
  var eraAbout = api.aboutRows, eraRecap = api.recapRow;
  api.aboutRows = function () { return eraAbout().concat(TL.dynasty ? TL.dynasty.about() : []); };
  api.recapRow = function () { return eraRecap().concat(TL.dynasty ? TL.dynasty.recap() : []); };
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
    E.achieve('royal');
    if (TL.dynasty) TL.dynasty.crowned(); // a crown taken from my own family
  }
  // The reign is over (deposed, fled, abdicated): out of the palace.
  function lostThrone() {
    var a = st(), s = S();
    a.rule = null;
    if (TL.dynasty) TL.dynasty.fallen(); // whoever took my throne keeps it; history doesn't come back
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
        r.done = r.done || {}; r.done[x.id] = (r.done[x.id] || 0) + 1; // for the reign's epithet
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
  // How history remembers a reign: an epithet earned by what the ruler did (v1.41).
  function epithet(r, s, a) {
    s = s || S(); a = a || st();
    var d = r.done || {}, won = (a.map && a.map.won) || 0, laws = (r.laws || []).length;
    if (won >= 5) return 'the Conqueror';
    if ((d.purge || 0) >= 3 || s.karma <= 15) return 'the Cruel';
    if (r.years >= 25) return r.pop >= 55 ? 'the Great' : 'the Old';
    if ((d.build || 0) + (d.stone || 0) >= 3) return 'the Builder';
    if (laws >= 3 && s.karma >= 55) return 'the Lawgiver';
    if (s.karma >= 80) return 'the Good';
    if (r.pop >= 75) return 'the Beloved';
    if (r.pop <= 20) return 'the Hated';
    if ((d.war || 0) + won >= 3) return 'the Warlike';
    if ((d.games || 0) + (d.feast || 0) + (d.rings || 0) >= 4) return 'the Generous';
    if (r.years <= 1) return 'the Brief';
    if (s.karma >= 60) return 'the Just';
    return 'the Steady';
  }
  // An ancestor's royal title for the family tree, from their finished life (js/extras.js).
  function titleOf(prev) {
    var a = prev.anc, m = prev.me, f = m.gender === 'F';
    if (a && a.ruled) {
      var w = prev.job && prev.job.career === 'r_emperor' || /Roman/.test(prev.country) ? (f ? 'Empress' : 'Emperor') : (f ? 'Queen' : 'King');
      return w + ' ' + m.first + ' ' + epithet(a.ruled, prev, a);
    }
    if (prev.royal && prev.royal.monarch) return (f ? 'Queen ' : 'King ') + m.first;
    return null;
  }
  // One recap line for a reign: years, conquests, laws and the epithet.
  function legacy(realm) {
    var a = st(), r = a.ruled;
    if (!r) return null;
    var won = (a.map && a.map.won) || 0, laws = (r.laws || []).length, bits = ['Ruled ' + realm + ' for ' + U.plural(r.years, 'year')];
    if (won) bits.push(U.plural(won, 'conquest'));
    if (laws) bits.push(U.plural(laws, 'new law'));
    return { name: me().first + ' ' + epithet(r), text: bits.join(' · ') };
  }
  TL.events.defs.coup_threat = { id: 'coup_threat', scripted: true, build: function () {
    if (!TL.ancient.on()) return null;
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
    if (TL.dynasty) TL.dynasty.sibling(rule.heirName); // the family keeps the throne; it may still come to me
    return false;
  }
  return { menu: menu, yearly: yearly, crown: crown, reignYear: reignYear, reignItems: reignItems, inherits: inherits, lostThrone: lostThrone, endRule: endRule, danger: danger, epithet: epithet, legacy: legacy, titleOf: titleOf };
})();

/* v1.37: born to rule. In every early era a life can start as the ruler's
 * firstborn: history follows your family from then on, you grow up as the
 * heir, and the crown comes to you when the ruler dies, steps aside, or is
 * pushed. A wayward heir can be passed over for a brother or sister. Each
 * era also opens a road for outsiders: Roman emperors adopt their heirs
 * (js/ancient.js), a Lord Protector can keep a boy king's crown
 * (js/medieval.js), and the Thing can choose a new king (js/viking.js).
 * Each era hands over its words (royalCfg). State: S.anc.dyn = { how ('birth'
 * or 'adopted'), ruler (the person who reigns), heir, rival, regent, hist
 * (an adoptive emperor's name), support, love, craft }. */
TL.dynasty = (function () {
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
  function on() { return !!(TL.S && TL.ancient && TL.ancient.on()); }
  function st() { return TL.ancient.st(); }
  function era() { return TL.ancient.era(); }
  function cfg() { var e = on() && era(); return e && e.royalCfg ? e.royalCfg() : null; }
  function dyn() { return on() ? st().dyn || null : null; }
  function alive(p) { return !!p && p.alive !== false; }
  function ruler() { var y = dyn(), p = y && y.ruler ? E.person(y.ruler) : null; return alive(p) ? p : null; }
  function gi(p) { return p.gender === 'M' ? 0 : 1; }
  function kin(p) { return { father: 'father', mother: 'mother', grandparent: p.gender === 'M' ? 'grandfather' : 'grandmother', sibling: p.gender === 'M' ? 'brother' : 'sister' }[p.role] || 'kinsman'; }
  function parentLike(p) { return ['father', 'mother', 'grandparent'].indexOf(p.role) >= 0; }
  function fill(t, p, c) {
    var mine = c.ruler[gi(me())];
    t = t.replace(/\{title\}/g, mine).replace(/\{titlel\}/g, mine.toLowerCase());
    return p ? t.replace(/\{ruler\}/g, c.ruler[gi(p)] + ' ' + E.fullName(p)).replace(/\{kin\}/g, kin(p)) : t;
  }
  function see(title, icon) { var s = S(), h = s.era || (s.era = { seen: [], served: [] }); if (h.seen.length < 40) h.seen.push({ year: s.year, age: me().age, icon: icon, title: title }); }
  // The era's own record of who rules (a.emp in Rome, a.king elsewhere) follows the family.
  function sync() { var e = era(), a = st(), yr = S().year; if (e.emperor) a.emp = e.emperor(yr); else if (e.king) a.king = e.king(yr); }

  // Who sits on the throne while my family reigns (null when history decides).
  function reigning() {
    if (!on()) return null;
    var a = st(), y = a.dyn;
    if (a.rule) return null;
    if (y && y.regent) return { name: me().first + ' ' + me().last, gender: me().gender };
    var p = ruler();
    if (p) return { name: E.fullName(p), gender: p.gender };
    return a.after || null;
  }
  // My reign (or my family's) ended: the man who took the throne founds a new line.
  function fallen() {
    var a = st(), c = cfg(), cty = TL.data.country(S().country);
    if (!c || !c.usurper) return;
    a.after = { name: c.usurper(U.pick(cty.male)), gender: 'M' };
    if (a.dyn) { a.dyn.heir = false; a.dyn.ruler = null; a.dyn.regent = false; a.dyn.rival = null; }
  }
  // Continuing as my child when my sibling was named heir: the family still reigns.
  function sibling(name) {
    var sib = E.people('sibling').filter(function (p) { return p.first === name; })[0], c = cfg();
    if (!sib || !c) return;
    sib.job = c.ruler[gi(sib)];
    st().dyn = { how: 'birth', ruler: sib.id, heir: false, support: 20, love: 30, craft: 10, since: S().year };
    S().home = { type: 'palace' };
  }
  // Still part of the reigning family (heir, regent, or kin of the ruler).
  function royal() { var y = dyn(); return !!(y && !st().rule && (y.heir || y.regent || ruler())); }
  // History stops being history once my family holds the throne.
  function altered() { var a = on() && st(); return !!(a && (a.rule || a.ruled || a.alt || (a.dyn && a.dyn.how === 'birth'))); }
  function title() { var y = dyn(), c = y && royal() && cfg(); if (!c) return null; return y.regent ? c.ruler[gi(me())] : y.heir ? c.heir[gi(me())] : null; }

  // ---- a royal birth (called by the era's setup)
  function born(s, c) {
    var a = st(), dad = E.people('father')[0], mom = E.people('mother')[0], mon = dad || mom;
    if (!mon) return false;
    // I am the firstborn: older brothers and sisters are left out of this story.
    var older = E.people('sibling').map(function (p) { return p.id; });
    if (older.length) {
      s.people = s.people.filter(function (p) { return older.indexOf(p.id) < 0; });
      s.log.forEach(function (yy) { yy.entries = yy.entries.filter(function (e) { return !/^I have an older (brother|sister), /.test(e.t); }); });
    }
    mon.job = c.ruler[gi(mon)];
    var con = mon === dad ? mom : dad;
    if (con) { con.job = c.consort[gi(con)]; con.married = mon.married = true; s.log.forEach(function (yy) { yy.entries = yy.entries.filter(function (e) { return e.t !== 'My parents aren\'t married.'; }); }); }
    [dad, mom].forEach(function (p) { if (p) p.money = Math.max(p.money, E.$(U.rand(30, 120) * 1000000)); });
    a.cls = c.cls; s.city = c.city; s.home = { type: 'palace' }; s.flags.wealth = 'rich'; s.fame = Math.max(s.fame, 30);
    a.dyn = { how: 'birth', ruler: mon.id, heir: true, support: 10, love: 20, craft: 0, since: s.year };
    E.log(fill(c.born, mon, c), 'good');
    return true;
  }
  // A Roman emperor adopts me as his son and heir (js/ancient.js).
  function adopt(old) {
    var a = st(), s = S();
    a.dyn = { how: 'adopted', hist: old, ruler: null, heir: true, support: 25 + Math.round(s.fame / 4), love: 20 + Math.round(s.fame / 5), craft: 25, since: s.year };
    s.home = { type: 'palace' };
    E.fame(10); E.stat('happy', 15);
    see('Adopted by Emperor ' + old, '👑');
  }

  // ---- the crown passes
  function take(c, text) {
    var e = era(), a = st(), y = a.dyn;
    y.heir = false; y.regent = false; y.ruler = null; y.rival = null;
    TL.coup.crown(e.coupCfg('throne'));
    a.ruled = a.rule; sync();
    // A well-prepared heir starts with the great men and the people behind them.
    a.rule.pop = U.clamp(Math.round(42 + y.love * 0.35 + y.craft * 0.12), 25, 90);
    a.rule.guard = U.clamp(Math.round(40 + y.support * 0.4 + y.craft * 0.12), 25, 90);
    see('Crowned ' + c.ruler[gi(me())], '👑');
    E.log(text, 'good');
  }
  function succeed(p) {
    var y = dyn(), c = cfg(), age = me().age;
    if (!y || !c) return;
    y.ruler = null;
    var rv = !y.heir && y.rival ? E.person(y.rival) : null;
    if (alive(rv)) {
      // I was passed over: my brother or sister wears the crown.
      y.ruler = rv.id; y.rival = null; rv.job = c.ruler[gi(rv)]; sync();
      E.log('👑 My ' + kin(rv) + ' ' + rv.first + ' was crowned ' + c.ruler[gi(rv)] + ' in my place.', 'bad');
      return;
    }
    y.heir = true; y.rival = null;
    if (age < 16) {
      y.regent = true; sync();
      E.log(fill('👑 {ruler}, my {kin}, is dead. The crown is mine, but I am only ' + age + ': ' + c.regent + ' will rule in my name until I turn 16.', p, c), 'good');
      return;
    }
    take(c, fill(c.succeed, p, c));
  }
  // Someone died (engine.npcDies).
  function onDeath(p) {
    var y = dyn();
    if (!y || st().rule) return;
    if (p.id === y.rival) {
      y.rival = null;
      if (!y.heir) { y.heir = true; E.log('👑 With my ' + kin(p) + ' ' + p.first + ' gone, I am heir to the throne again.', 'good'); }
      return;
    }
    if (p.id === y.ruler) succeed(p);
  }
  // I was crowned (TL.coup.crown). If my own family still held the throne, I took it from them.
  function crowned() {
    var y = dyn();
    if (!y) return;
    var p = ruler(), c = cfg();
    y.heir = false; y.regent = false; y.ruler = null; y.rival = null;
    if (!p || !c) return;
    if (c.depose) { p.job = c.deposed[gi(p)]; E.log(fill(c.depose, p, c), 'bad'); }
    else E.npcDies(p, c.killed);
  }

  // How a reigning ruler dies of natural causes (engine.yearlyPeople): no "accident at work" for a king.
  function deathCause(p) {
    var y = dyn(), c = y && y.ruler === p.id && cfg();
    return c ? U.pick(c.deaths.concat(p.age >= 65 ? ['old age', 'old age'] : [])) : null;
  }

  // ---- every year (called first thing by the era's yearly)
  function yearly() {
    var a = st(), y = a.dyn, s = S(), c = cfg();
    if (!y || a.rule || s.dead || !c) return;
    // The treasury keeps the ruler's family.
    if (royal() && c.allowance) { var amt = Math.round(c.allowance * (me().age < 16 ? 0.25 : 1)); E.addMoney(amt); E.log('🏰 An allowance from ' + c.treasury + ': ' + E.fmt(amt), 'money'); }
    if (y.regent) {
      if (me().age >= 16) take(c, '👑 I turned sixteen and took ' + c.realm + ' into my own hands. The regency is over.');
      return;
    }
    if (y.how === 'adopted') {
      // My adoptive father's reign ends when history says it does, or sooner.
      if (y.heir && (era().emperor(s.year) !== y.hist || U.chance(0.06))) take(c, fill(c.adoptedTake.replace('{old}', y.hist), null, c));
      return;
    }
    var p = ruler();
    if (!p) {
      // The ruler vanished from my life without a death (a lost save, an old bug): the crown passes anyway.
      if (y.ruler) succeed(E.person(y.ruler) || { first: '', last: '', gender: 'M', role: 'father' });
      return;
    }
    // Rulers rarely die in bed.
    if (U.chance(0.006 + Math.max(0, p.age - 55) * 0.003)) { E.npcDies(p, U.pick(c.deaths)); return; }
    var age = me().age;
    if (y.heir && age >= 14 && parentLike(p)) {
      // A wayward heir can be passed over for a younger brother or sister.
      var sib = E.people('sibling').filter(function (q) { return q.age >= 4; }).sort(function (x, z) { return z.age - x.age; })[0];
      if (sib && (p.rel < 15 || s.record.length >= 2) && U.chance(0.15)) {
        y.heir = false; y.rival = sib.id;
        E.log('😠 My ' + kin(p) + ' named my ' + kin(sib) + ' ' + sib.first + ' heir to the throne instead of me.', 'bad');
      }
    } else if (!y.heir && y.rival && parentLike(p) && p.rel >= 70 && !s.record.length && U.chance(0.25)) {
      y.heir = true; y.rival = null;
      E.log('👑 My ' + kin(p) + ' forgave me and named me heir to the throne again.', 'good');
    }
    if (age >= 6 && U.chance(0.12)) E.log(fill(U.pick(c.news), p, c));
  }

  // ---- the heir's part of the Occupation menu
  function bar(label, v) { v = Math.round(v); return '<div class="minibar"><span>' + U.esc(label) + '</span><div class="track"><div class="fill ' + (v >= 66 ? 'hi' : v >= 33 ? 'mid' : 'lo') + '" style="width:' + v + '%"></div></div></div>'; }
  function grow(k, d) { var y = dyn(); y[k] = U.clamp(Math.round(y[k] + d), 0, 100); }
  function items() {
    var y = dyn(), c = cfg(), out = [];
    if (!y || !c || !royal()) return out;
    var p = ruler(), age = me().age, s = S(), rv = y.rival ? E.person(y.rival) : null;
    var head = y.regent ? 'The crown is mine. ' + U.cap(c.regent) + ' rules in my name until I turn 16.'
      : y.how === 'adopted' ? 'Adopted son and heir of Emperor ' + y.hist + '.'
      : !y.heir ? (alive(rv) ? 'My ' + kin(rv) + ' ' + rv.first + ' is heir now. Win back the favor I lost, or take what should be mine.' : p && p.role === 'sibling' ? 'My ' + kin(p) + ' wears the crown. If ' + E.he(p) + ' dies, it comes to me.' : 'I am not the heir.')
      : 'Heir to ' + c.realm + '.';
    var who = p ? 'My ' + kin(p) + ', ' + c.ruler[gi(p)] + ' ' + E.fullName(p) + ', is ' + p.age + (p.age >= 60 ? ' and growing old' : '') + '.' : '';
    out.push({ section: c.section });
    out.push({ info: true, html: '<div class="kv"><b>' + U.esc(head) + '</b>' + (who ? '<br><span class="muted">' + U.esc(who) + '</span>' : '') + bar(c.greatName, y.support) + bar(c.peopleName, y.love) + bar('Statecraft', y.craft) + '</div>' });
    if (age < 8) return out;
    out.push({ icon: c.learn[0], label: c.learn[1], sub: c.learn[2], onClick: function () {
      if (count('dy_learn')) return done(nope('I learned enough statecraft for one year.'));
      bump('dy_learn'); grow('craft', U.rand(6, 11)); E.stat('smarts', 1); if (p) E.rel(p, 3);
      // The court's clerks teach the heir to read along the way.
      if (!st().edu && c.edu && U.chance(0.5)) { st().edu = c.edu; return done(good(U.pick(c.learn[3]) + ' The clerks taught me to read and write, too. ✍️')); }
      done(U.pick(c.learn[3]));
    } });
    if (age >= 12) out.push({ icon: c.show[0], label: c.show[1], sub: c.show[2], right: E.fmt(c.show[3]), onClick: function () {
      if (count('dy_show')) return done(nope('Once a year is enough, or it looks like I\'m campaigning.'));
      if (s.money < c.show[3]) return done(nope('That costs ' + E.fmt(c.show[3]) + '.'));
      bump('dy_show'); E.addMoney(-c.show[3]); grow('love', U.rand(9, 15)); E.fame(2);
      done(U.pick(c.show[4]));
    } });
    if (age >= 14) out.push({ icon: c.great[0], label: c.great[1], sub: c.great[2], right: E.fmt(c.great[3]), onClick: function () {
      if (count('dy_great')) return done(nope('Too much courting in one year would look like a plot.'));
      if (s.money < c.great[3]) return done(nope('That costs ' + E.fmt(c.great[3]) + '.'));
      bump('dy_great'); E.addMoney(-c.great[3]); grow('support', U.rand(9, 15));
      done(U.pick(c.great[4]));
    } });
    if (y.regent) return out;
    if (age >= 16) out.push({ icon: c.command[0], label: c.command[1], sub: c.command[2], danger: true, onClick: function () {
      if (count('dy_war')) return done(nope('One campaign a year.'));
      bump('dy_war');
      if (U.chance(0.55 + me().athl / 400 + y.craft / 500)) { E.fame(6); grow('support', 8); grow('love', 6); if (p) E.rel(p, 4); return done(good(U.pick(c.command[3]))); }
      if (U.chance(0.07)) { E.die(c.command[5]); return done(bad(U.pick(c.command[4]) + ' I did not come home.')); }
      grow('support', -5); E.fame(1); E.stat('happy', -4);
      done(bad(U.pick(c.command[4])));
    } });
    if (age >= 16 && !E.partner()) out.push({ icon: '💍', label: 'Make a royal marriage', sub: 'A foreign match brings allies', onClick: function () {
      var R = era().coupCfg('throne').rule, gg = me().interest === 'F' ? 'F' : me().interest === 'M' ? 'M' : (me().gender === 'M' ? 'F' : 'M'), who = U.pick(gg === 'F' ? R.brides : R.grooms), cty = TL.data.country(s.country);
      var sp = E.addPerson({ role: 'spouse', gender: gg, age: me().age + U.rand(-4, 4), rel: U.rand(35, 70) }); sp.first = U.pick(gg === 'F' ? cty.female : cty.male); sp.job = 'Royal consort';
      grow('support', 10); E.achieve('married');
      done(good('I married ' + sp.first + ', ' + who + '. Their family\'s swords stand behind my claim now. 💍'));
    } });
    if (y.heir && p && parentLike(p) && age >= 18) {
      var odds = U.clamp(0.03 + (p.age - 50) * 0.02 + (p.rel - 50) / 250 + y.craft / 500 + (p.health < 40 ? 0.15 : 0), 0.02, 0.75);
      out.push({ icon: c.step[0], label: c.step[1], sub: p.age < 50 ? 'Not while my ' + kin(p) + ' is in ' + E.his(p) + ' prime' : c.step[2] + ' · about ' + Math.round(odds * 100) + '% chance', disabled: p.age < 50, onClick: function () {
        if (count('dy_step')) return done(nope('I asked once this year. Asking again would be an insult.'));
        bump('dy_step');
        if (U.chance(odds)) {
          y.ruler = null; p.job = c.retired[gi(p)];
          ui().closeAll && ui().closeAll();
          take(c, fill('👑 ' + c.step[3], p, c));
          return done(good(fill(c.step[3], p, c) + ' 👑'));
        }
        E.rel(p, -U.rand(4, 9));
        done(bad(fill(U.pick(c.step[4]), p, c)));
      } });
    }
    return out;
  }

  // ---- continuing as my child (the era's heir(), with the previous life)
  // If I die as the heir while my parent still reigns, my own child becomes the heir.
  function inherit(old, prev) {
    var y = old && old.dyn, c = cfg();
    if (!y || old.rule || !y.heir || y.regent || y.how !== 'birth' || !prev || !c) return false;
    var mon = (prev.people || []).filter(function (p) { return p.id === y.ruler && p.alive !== false; })[0];
    if (!mon) return false;
    var gp = E.addPerson({ role: 'grandparent', gender: mon.gender, age: mon.age, first: mon.first, last: mon.last, rel: U.rand(50, 85), money: mon.money });
    gp.first = mon.first; gp.last = mon.last; gp.job = mon.job;
    st().dyn = { how: 'birth', ruler: gp.id, heir: true, support: Math.round(y.support / 2), love: Math.round(y.love / 2), craft: 0, since: S().year };
    S().home = { type: 'palace' };
    E.log(fill('👑 My ' + kin(gp) + ', {ruler}, still reigns. With my ' + (prev.me.gender === 'M' ? 'father' : 'mother') + ' gone, I am heir to the throne.', gp, c), 'good');
    return true;
  }

  // ---- About and the life recap
  function about() {
    var y = dyn(), c = cfg();
    if (!y || !c || !royal()) return [];
    var rv = y.rival ? E.person(y.rival) : null;
    return [['👑 Throne', y.regent ? 'Under a regent until 16' : y.heir ? (y.how === 'adopted' ? 'Adopted heir' : 'Heir') + ' · support ' + Math.round(y.support) + ' · people ' + Math.round(y.love) + ' · statecraft ' + Math.round(y.craft) : alive(rv) ? 'Passed over for my ' + kin(rv) + ' ' + rv.first : 'Royal family']];
  }
  function recap() {
    var a = on() && st(), y = a && a.dyn, c = cfg();
    if (!y || a.ruled || !c) return [];
    return [y.how === 'adopted' ? ['👑', 'Caesar', 'Adopted heir of Emperor ' + y.hist] : ['👑', c.heir[gi(me())], y.heir ? 'Born heir to ' + c.realm + ', but never crowned' : 'Born to the royal family, passed over for the crown']];
  }

  // ---- an heir's life has its own events (v1.38), in every early era
  function hdef(id, o) {
    ['rome', 'medieval', 'viking'].forEach(function (eid) {
      var d = {}; Object.keys(o).forEach(function (k) { d[k] = o[k]; });
      d.id = id + '_' + eid; d.ancient = eid; d.w = o.w || 6;
      var cond = o.cond;
      d.cond = function () { var y = dyn(); return !!(y && royal() && !y.regent && cfg() && (!cond || cond(y))); };
      TL.events.defs[d.id] = d;
    });
  }
  hdef('dy_ill', { min: 10, w: 4, cond: function (y) { var p = ruler(); return !!(p && y.heir && parentLike(p) && p.age >= 40); }, build: function () {
    var p = ruler(), c = cfg(), y = dyn();
    return { icon: '🤒', title: fill('{ruler} is ill', p, c), text: fill('My {kin} has a fever and has not left bed for a week. The court is whispering about what comes next.', p, c), choices: [
      { label: 'Stay at ' + E.his(p) + ' bedside', run: function () { E.rel(p, 12); grow('craft', 3); return good(fill('I sat with my {kin} day and night. ' + U.cap(E.he(p)) + ' squeezed my hand and called me ' + (me().gender === 'M' ? 'a good son' : 'a good daughter') + '.', p, c)); } },
      { label: 'Quietly gather support, just in case', run: function () { grow('support', 12); if (U.chance(0.35)) { E.rel(p, -20); return bad(fill('My {kin} recovered, and heard who I had been meeting while ' + E.he(p) + ' lay sick. ' + U.cap(E.he(p)) + ' has not forgotten.', p, c)); } return fill('A few great men promised me their loyalty "if the worst happens". My {kin} pulled through without hearing of it.', p, c); } },
      { label: 'Pay for the best physicians (' + E.fmt(c.great[3]) + ')', run: function () { if (S().money < c.great[3]) return 'I didn\'t have the money. The court physicians did their best.'; E.addMoney(-c.great[3]); p.health = Math.min(100, (p.health || 50) + 25); E.rel(p, 6); return good(fill('The physicians bled, purged and prayed, and my {kin} got better. ' + U.cap(E.he(p)) + ' knows who paid for them.', p, c)); } }
    ] };
  } });
  hdef('dy_tutor', { min: 8, max: 15, w: 5, build: function () {
    var c = cfg(), cost = c.show[3];
    return { icon: '🧑‍🏫', title: 'A famous teacher', text: 'The most learned teacher in ' + c.realm + ' has offered to take charge of my education. Everyone at court says a future ruler needs one.', choices: [
      { label: 'Study with the master (' + E.fmt(cost) + ')', run: function () { if (S().money < cost) { grow('craft', 3); return 'The treasury refused to pay. I learned what I could from the old court clerks.'; } E.addMoney(-cost); grow('craft', 12); E.stat('smarts', U.rand(4, 8)); if (!st().edu && c.edu) st().edu = c.edu; return good('Years of lessons in law, history and how men really think. I see the realm differently now.'); } },
      { label: 'Spend my days riding and hunting', run: function () { E.stat('happy', 6); me().athl = Math.min(100, me().athl + 4); return 'Books can wait. I rode until the horses were tired.'; } }
    ] };
  } });
  hdef('dy_match', { min: 13, max: 24, w: 5, cond: function () { return !E.partner(); }, build: function () {
    var c = cfg(), R = era().coupCfg('throne').rule, g = me().interest === 'F' ? 'F' : me().interest === 'M' ? 'M' : (me().gender === 'M' ? 'F' : 'M'), who = U.pick(g === 'F' ? R.brides : R.grooms);
    return { icon: '💌', title: 'A royal match', text: 'Envoys have come to propose a marriage between me and ' + who + '. An alliance would make my claim much stronger.', choices: [
      { label: 'Agree to the match', run: function () { var cty = TL.data.country(S().country), sp = E.addPerson({ role: me().age >= 16 ? 'spouse' : 'fiance', gender: g, age: me().age + U.rand(-3, 3), rel: U.rand(30, 60) }); sp.first = U.pick(g === 'F' ? cty.female : cty.male); sp.job = 'Royal consort'; grow('support', 12); if (me().age >= 16) E.achieve('married'); return good((me().age >= 16 ? 'I married ' : 'I was betrothed to ') + sp.first + ', ' + who + '. Their family\'s swords stand behind me now. 💍'); } },
      { label: 'Refuse: I will choose for myself', run: function () { grow('love', 5); grow('support', -6); E.stat('happy', 3); return 'The envoys went home offended. The people liked my spirit; the great men of ' + c.realm + ' did not.'; } }
    ] };
  } });
  hdef('dy_rival', { min: 15, w: 5, cond: function (y) { return y.heir && E.people('sibling').some(function (q) { return q.age >= 13; }); }, build: function () {
    var c = cfg(), sib = E.people('sibling').filter(function (q) { return q.age >= 13; }).sort(function (a, b) { return b.age - a.age; })[0];
    return { icon: '🗡️', title: 'A rival at court', text: 'My ' + kin(sib) + ' ' + sib.first + ' has been feasting with the great men of ' + c.realm + ' and saying ' + E.he(sib) + ' would make a better ruler than me.', choices: [
      { label: 'Make peace with ' + E.him(sib), run: function () { E.rel(sib, 15); E.karma(3); return good('We talked late into the night. ' + sib.first + ' swore to stand behind me.'); } },
      { label: 'Have ' + E.him(sib) + ' sent far away', run: function () { E.rel(sib, -30); grow('support', 6); E.karma(-5); return sib.first + ' was given a post at the far edge of ' + c.realm + '. ' + U.cap(E.he(sib)) + ' left without saying goodbye.'; } },
      { label: 'Ignore it', run: function () { grow('support', -6); return 'The whispering went on. Some of the great men are listening to ' + E.him(sib) + ' now.'; } }
    ] };
  } });
  hdef('dy_rumor', { min: 17, w: 4, cond: function (y) { var p = ruler(); return !!(p && y.heir && parentLike(p)); }, build: function () {
    var p = ruler(), c = cfg();
    return { icon: '👂', title: 'Dangerous rumors', text: fill('Someone told my {kin} that I am plotting to take the throne early. ' + U.cap(E.he(p)) + ' looked at me strangely at dinner.', p, c), choices: [
      { label: 'Swear loyalty before the whole court', run: function () { E.rel(p, 12); grow('support', -3); return good(fill('I knelt before my {kin} in front of everyone. The rumors died that day.', p, c)); } },
      { label: 'Find out who started it', run: function () { if (U.chance(0.5)) { E.rel(p, 8); grow('support', 5); return good('It was a jealous courtier. My ' + kin(p) + ' sent him away, and trusts me more than ever.'); } E.rel(p, -8); return bad('I never found out. My ' + kin(p) + ' still watches me.'); } },
      { label: 'Laugh it off', run: function () { E.rel(p, -6); return 'I laughed. My ' + kin(p) + ' did not.'; } }
    ] };
  } });

  return { reigning: reigning, fallen: fallen, sibling: sibling, deathCause: deathCause, royal: royal, altered: altered, title: title, born: born, adopt: adopt, yearly: yearly, onDeath: onDeath, crowned: crowned,
    items: items, inherit: inherit, about: about, recap: recap };
})();
