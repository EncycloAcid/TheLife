/* TheLife — v1.8: challenges (goals that span all your lives), world events
 * (disasters, market swings, pandemics), new activities, DNA tests and
 * lawsuits. Events register into TL.events.defs. */
TL.world = (function () {
  var U = TL.util, D = TL.data, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function def(id, o) { o.id = id; o.w = o.w || 10; TL.events.defs[id] = o; }
  // Once-per-year guard for repeatable activities.
  function usedThisYear(key) { var y = S().yearActs || (S().yearActs = {}); var n = y[key] || 0; y[key] = n + 1; return n; }

  // ====================================================================
  // CHALLENGES: three active goals at a time, shared across every life.
  // ====================================================================
  var CHALLENGES = [
    ['young_money', '💰', 'Young money', 'Become a millionaire before 30', function (s) { return s.me.age < 30 && E.netWorth() >= 1e6; }],
    ['full_house', '👨‍👩‍👧‍👦', 'Full house', 'Have 4 children in one life', function (s) { return E.people('child', true).length >= 4; }],
    ['scholar', '🎓', 'Scholar', 'Earn a PhD or a medical degree', function () { return E.hasDegree('phd') || E.hasDegree('med'); }],
    ['jetsetter', '✈️', 'Jet-setter', 'Take 5 vacations in one life', function (s) { return s.counts.vacations >= 5; }],
    ['heartthrob', '💘', 'Heartthrob', 'Go on 10 dates in one life', function (s) { return s.counts.dates >= 10; }],
    ['ink_addict', '🖋️', 'Ink addict', 'Get 3 tattoos', function (s) { return (s.tattoos || []).length >= 3; }],
    ['brainiac', '🧠', 'Brainiac', 'Reach 100 smarts', function (s) { return s.me.smarts >= 100; }],
    ['peak_shape', '🏋️', 'Peak shape', 'Reach 90 athleticism and 90 health', function (s) { return s.me.athl >= 90 && s.me.health >= 90; }],
    ['animal_house', '🐾', 'Animal house', 'Own 3 pets at once', function (s) { return s.pets.length >= 3; }],
    ['a_lister', '⭐', 'A-lister', 'Reach 90 fame', function (s) { return s.fame >= 90; }],
    ['squeaky_clean', '😇', 'Squeaky clean', 'Reach 60 with a clean record', function (s) { return s.me.age >= 60 && !s.record.length; }],
    ['property_empire', '🏘️', 'Property empire', 'Own 3 properties at once', function (s) { return s.assets.filter(function (a) { return a.kind === 'house'; }).length >= 3; }],
    ['old_soul', '🎂', 'Old soul', 'Live to 95', function (s) { return s.me.age >= 95; }],
    ['fresh_start', '🧳', 'Fresh start', 'Live in a different country than you were born in', function (s) { return s.birthCountry && s.country !== s.birthCountry; }],
    ['pure_joy', '😊', 'Pure joy', 'Have 100 happiness as an adult', function (s) { return s.me.age >= 18 && s.me.happy >= 100; }],
    ['prolific', '📚', 'Prolific', 'Publish 3 books', function (s) { return (s.books || []).length >= 3; }],
    ['married_young', '💍', 'Young love', 'Get married before 25', function (s) { return s.me.age < 25 && !!E.people('spouse').length; }],
    ['go_viral', '🎬', 'Gone viral', 'Reach 100K subscribers on a channel', function (s) { return !!(s.channel && s.channel.subs >= 1e5); }],
    ['side_hustler', '💼', 'Side hustler', 'Earn 50,000 from side hustles in one life', function (s) { return !!(s.hustle && s.hustle.base >= 50000); }],
    ['debt_free', '🧾', 'Self-made', 'Reach a net worth of 100k without inheriting', function (s) { return s.gen === 1 && E.netWorth() >= 1e5 && s.me.age < 40; }]
  ];
  function chal(id) { for (var i = 0; i < CHALLENGES.length; i++) if (CHALLENGES[i][0] === id) return CHALLENGES[i]; return null; }
  function state() {
    var g = E.loadGlobal();
    if (!g.challenges) g.challenges = { active: [], done: [] };
    var c = g.challenges, pool = CHALLENGES.filter(function (x) { return c.active.indexOf(x[0]) < 0; });
    // Prefer ones never completed; cycle back once they're all done.
    var fresh = pool.filter(function (x) { return c.done.indexOf(x[0]) < 0; });
    while (c.active.length < 3 && pool.length) {
      var src = fresh.length ? fresh : pool, pick = U.pick(src);
      c.active.push(pick[0]);
      pool = pool.filter(function (x) { return x !== pick; }); fresh = fresh.filter(function (x) { return x !== pick; });
    }
    return g;
  }
  function checkChallenges() {
    var s = S();
    if (!s || s.dead) return;
    var g = state(), c = g.challenges, won = [];
    c.active.slice().forEach(function (id) {
      var ch = chal(id), ok = false;
      if (ch) { try { ok = !!ch[4](s); } catch (e) { ok = false; } }
      if (!ch || ok) c.active.splice(c.active.indexOf(id), 1);
      if (ok) { c.done.push(id); c.stars = (c.stars || 0) + 1; won.push(ch); }
    });
    E.saveGlobal(g);
    if (c.active.length < 3) E.saveGlobal(state());   // refill
    // Achievements write the global record themselves, so award them last.
    won.forEach(function (ch) { E.log('🏆 Challenge complete: ' + ch[2] + '! ' + ch[3] + '.', 'good'); });
    if (won.length) { E.achieve('challenger'); if (c.stars >= 5) E.achieve('challenge_master'); }
  }
  function challengeItems() {
    var g = state(); E.saveGlobal(g);
    var c = g.challenges, s = S(), items = [];
    items.push({ info: true, html: '<p>Finish a challenge in any life to earn a ⭐. A new one takes its place. <b>' + (c.stars || 0) + ' ⭐ earned.</b></p>' });
    items.push({ section: 'Active' });
    c.active.forEach(function (id) {
      var ch = chal(id); if (!ch) return;
      items.push({ icon: ch[1], label: ch[2], sub: ch[3], check: false });
    });
    if (c.done.length) {
      items.push({ section: 'Completed' });
      c.done.slice(-12).reverse().forEach(function (id) { var ch = chal(id); if (ch) items.push({ icon: ch[1], label: ch[2], sub: ch[3], check: true }); });
    }
    return items;
  }
  function challengesMenu() { ui().menu('Challenges', challengeItems); }
  function starCount() { return (E.loadGlobal().challenges || {}).stars || 0; }

  // ====================================================================
  // ACTIVITIES
  // ====================================================================
  function spa() {
    var cost = E.$(250);
    if (S().money < cost) return done(nope('A spa day costs ' + E.fmt(cost) + '.'));
    if (usedThisYear('spa') >= 2) return done(nope('I\'ve been pampered enough this year.'));
    E.addMoney(-cost); E.stat('happy', U.rand(6, 10)); E.stat('looks', 2); E.stat('health', 2);
    done('I spent the day at the spa: ' + U.pick(['a hot stone massage', 'a mud bath', 'a facial and a sauna', 'a seaweed wrap']) + '. 🧖');
  }
  var FISH = [['🐟', 'a bluegill', 0], ['🐠', 'a rainbow trout', 0], ['🐡', 'a pufferfish', 0], ['🦈', 'a small shark', 400], ['🐟', 'a huge bass', 150], ['👢', 'an old boot', 0], ['🦞', 'a lobster', 60]];
  function fishing() {
    if (usedThisYear('fish') >= 3) return done(nope('The fish are avoiding me. Maybe next year.'));
    E.stat('happy', U.rand(4, 8)); E.stat('health', 1);
    if (U.chance(0.3)) return done('I went fishing and caught nothing but a sunburn. 🎣');
    var f = U.pick(FISH);
    if (f[2]) { var v = E.$(f[2]); E.addMoney(v); return done(good('I went fishing and caught ' + f[1] + '! ' + f[0] + ' I sold it for ' + E.fmt(v) + '.')); }
    done('I went fishing and caught ' + f[1] + '. ' + f[0]);
  }
  function gardening() {
    if (usedThisYear('garden') >= 2) return done(nope('My garden needs time to grow.'));
    var s = S(); s.flags.garden = (s.flags.garden || 0) + 1;
    E.stat('happy', 3); E.stat('health', 2);
    if (s.flags.garden >= 4 && U.chance(0.25)) { E.stat('happy', 5); return done(good('My ' + U.pick(['tomatoes', 'sunflowers', 'pumpkin', 'roses']) + ' won a ribbon at the county fair! 🎀')); }
    done('I spent the afternoon gardening. ' + U.pick(['🌻', '🍅', '🌷', '🥕', '🌿']));
  }
  function shoppingMenu() {
    ui().menu('Shopping', function () {
      return [
        { icon: '👗', label: 'Designer outfit', sub: 'Look your best', right: E.fmt(E.$(800)), onClick: function () { buyClothes(E.$(800), 3, 5, 'a designer outfit'); } },
        { icon: '👟', label: 'Limited-edition sneakers', right: E.fmt(E.$(300)), onClick: function () { buyClothes(E.$(300), 1, 4, 'limited-edition sneakers'); } },
        { icon: '🧥', label: 'Thrift store haul', sub: 'One person\'s trash…', right: E.fmt(E.$(40)), onClick: function () { buyClothes(E.$(40), 1, 2, 'a bag of thrift store finds'); } },
        { icon: '🪟', label: 'Window shopping', sub: 'Free', onClick: function () { E.stat('happy', 1); done('I went window shopping and bought nothing. Very disciplined.'); } }
      ];
    });
  }
  function buyClothes(cost, looks, happy, what) {
    if (S().money < cost) return done(nope('I can\'t afford that.'));
    if (usedThisYear('shop') >= 3) return done(nope('My closet is full. Maybe next year.'));
    E.addMoney(-cost); E.stat('looks', looks); E.stat('happy', happy);
    done('I bought ' + what + '. 🛍️');
  }
  var REGIONS = ['British & Irish', 'Scandinavian', 'Italian', 'West African', 'East Asian', 'South Asian', 'Indigenous American', 'Middle Eastern', 'Eastern European', 'Iberian', 'French & German', 'Polynesian', 'Ashkenazi Jewish', 'North African'];
  function dnaTest() {
    var s = S();
    if (s.flags.dna) return done(nope('I already took a DNA test. My results: ' + s.flags.dna + '.'));
    var cost = E.$(99);
    if (s.money < cost) return done(nope('A DNA kit costs ' + E.fmt(cost) + '.'));
    E.addMoney(-cost);
    var regs = U.shuffle(REGIONS.slice()).slice(0, 3), a = U.rand(45, 80), b = U.rand(8, 100 - a - 5), c = 100 - a - b;
    s.flags.dna = a + '% ' + regs[0] + ', ' + b + '% ' + regs[1] + ', ' + c + '% ' + regs[2];
    E.achieve('dna');
    if (U.chance(0.15)) {
      var sib = E.addPerson({ role: 'sibling', age: U.clamp(me().age + U.rand(-12, 12), 1, 95), rel: 35 });
      return done(good('My DNA results: ' + s.flags.dna + '. And a surprise: I have a half-' + (sib.gender === 'M' ? 'brother' : 'sister') + ', ' + sib.first + ', I never knew about! 🧬'));
    }
    done('My DNA results are in: ' + s.flags.dna + '. 🧬');
  }

  // ====================================================================
  // LAWSUITS
  // ====================================================================
  function sue(p) {
    var s = S(), fee = E.$(5000);
    if (s.money < fee) return done(nope('A lawyer wants ' + E.fmt(fee) + ' up front.'));
    if (usedThisYear('sue' + p.id)) return done(nope('My case against ' + p.first + ' is still in the courts.'));
    E.addMoney(-fee);
    E.rel(p, -35);
    var chance = U.clamp(0.3 + (me().smarts - 50) / 300 + (s.karma - 50) / 300, 0.1, 0.7);
    if (U.chance(chance)) {
      var award = E.$(U.rand(8, 120) * 1000);
      E.addMoney(award); E.stat('happy', 6);
      return done(good('I sued ' + p.first + ' for ' + U.pick(['emotional damages', 'breach of contract', 'an unpaid loan', 'defamation']) + ' and won ' + E.fmt(award) + '! ⚖️'));
    }
    E.stat('happy', -5); E.karma(-2);
    done(bad('I sued ' + p.first + ' and lost. The judge called it "frivolous". ⚖️'));
  }

  // ====================================================================
  // WORLD EVENTS
  // ====================================================================
  var DISASTERS = [['🌊', 'flood', 'Floodwaters are rising in my town.'], ['🌪️', 'tornado', 'A tornado warning just went off.'], ['🔥', 'wildfire', 'A wildfire is heading toward my neighborhood.'], ['🌀', 'hurricane', 'A hurricane is about to make landfall.'], ['🌍', 'earthquake', 'The ground started shaking. Earthquake!']];
  function damageHome(pct) {
    var h = S().assets.filter(function (a) { return a.kind === 'house' && !a.rented; })[0];
    if (!h) return '';
    h.value = Math.round(h.value * (1 - pct)); h.cond = Math.max(0, (h.cond || 100) - Math.round(pct * 150));
    return ' My house was damaged.';
  }
  def('natural_disaster', { min: 6, max: 110, w: 3, cond: function () { return !S().prison; }, build: function () {
    var d = U.pick(DISASTERS);
    return { icon: d[0], title: (/^[aeiou]/.test(d[1]) ? 'An ' : 'A ') + d[1] + '!', text: d[2], choices: [
      { label: 'Evacuate right away', run: function () { var c = E.$(U.rand(200, 1500)); E.addMoney(-c); E.stat('happy', -3); return 'I evacuated in time. The hotel stay cost me ' + E.fmt(c) + '.' + (U.chance(0.4) ? damageHome(0.1) : ''); } },
      { label: 'Ride it out at home', run: function () { if (U.chance(0.5)) { E.stat('health', -U.rand(10, 25)); E.stat('happy', -8); return bad('I rode out the ' + d[1] + ' and got hurt.' + damageHome(0.25)); } return 'I rode out the ' + d[1] + '. Scary, but I\'m okay.' + (U.chance(0.5) ? damageHome(0.12) : ''); } },
      { label: 'Help my neighbors first', run: function () { E.karma(6); if (U.chance(0.25)) { E.stat('health', -12); return 'I helped my neighbors escape the ' + d[1] + ' and got injured. Worth it.'; } E.stat('happy', 6); return good('I helped my neighbors to safety. The local news called me a hero. 🦸'); } }
    ] };
  } });
  function holdings() { var st = S().stocks; return Object.keys(st).filter(function (k) { return st[k] > 0; }); }
  function moveMarket(f) { var s = S(); Object.keys(s.prices).forEach(function (k) { s.prices[k] = Math.max(0.01 * E.k(), Math.round(s.prices[k] * f * U.randf(0.9, 1.1) * 100) / 100); }); }
  def('market_crash', { min: 18, max: 110, w: 3, cond: function () { return holdings().length > 0; }, build: function () {
    moveMarket(0.6);
    return { icon: '📉', title: 'Market crash!', text: 'The stock market just lost 40% in a week. My portfolio is bleeding.', choices: [
      { label: 'Panic sell everything', run: function () { var s = S(), got = 0; holdings().forEach(function (k) { got += s.stocks[k] * s.prices[k]; s.stocks[k] = 0; }); got = Math.round(got); E.addMoney(got); E.stat('happy', -4); return 'I sold everything for ' + E.fmt(got) + '. At least the bleeding stopped.'; } },
      { label: 'Hold and wait it out', run: function () { E.stat('happy', -2); return 'I held on. Markets recover… eventually.'; } },
      { label: 'Buy the dip', run: function () { var s = S(), spend = Math.round(Math.max(0, s.money) * 0.2), k = U.pick(Object.keys(s.prices)); if (spend < s.prices[k]) return 'I wanted to buy the dip, but I had no cash to spare.'; var n = Math.floor(spend / s.prices[k]); s.stocks[k] = (s.stocks[k] || 0) + n; E.addMoney(-Math.round(n * s.prices[k])); return 'I bought ' + n + ' shares of ' + k + ' at a bargain. Bold.'; } }
    ] };
  } });
  def('market_boom', { min: 18, max: 110, w: 3, cond: function () { return holdings().length > 0; }, build: function () {
    moveMarket(1.35);
    return { icon: '📈', title: 'Bull market', text: 'Stocks are soaring. My portfolio is up big this year.', choices: [
      { label: 'Cash out now', run: function () { var s = S(), got = 0; holdings().forEach(function (k) { got += s.stocks[k] * s.prices[k]; s.stocks[k] = 0; }); got = Math.round(got); E.addMoney(got); E.stat('happy', 6); return good('I sold at the top for ' + E.fmt(got) + '. 📈'); } },
      { label: 'Let it ride', run: function () { E.stat('happy', 3); return 'I\'m letting my winners run.'; } }
    ] };
  } });
  def('pandemic', { min: 3, max: 110, w: 2, once: true, cond: function () { return !S().prison; }, build: function () {
    return { icon: '🦠', title: 'Pandemic', text: 'A new virus is spreading around the world. Everything is shutting down.', choices: [
      { label: 'Stay home and stay safe', run: function () { E.stat('happy', -6); E.stat('smarts', 2); S().people.forEach(function (p) { if (p.alive && ['mother', 'father', 'spouse', 'child'].indexOf(p.role) >= 0) E.rel(p, 4); }); return 'I stayed home for months. I baked a lot of bread. 🍞'; } },
      { label: 'Live like normal', run: function () { if (U.chance(0.35)) { E.stat('health', -U.rand(15, 30)); return bad('I caught the virus and was sick for weeks.'); } E.karma(-3); return 'I kept living normally and got lucky.'; } },
      { label: 'Volunteer at a hospital', disabled: me().age < 16, run: function () { E.karma(8); E.stat('happy', 4); if (U.chance(0.25)) { E.stat('health', -15); return 'I volunteered on the front lines and caught the virus, but I recovered.'; } return good('I volunteered at the hospital. The nurses called me an angel. 🩺'); } }
    ].filter(function (c) { return !c.disabled; }) };
  } });

  return {
    checkChallenges: checkChallenges, challengesMenu: challengesMenu, challengeItems: challengeItems, starCount: starCount, CHALLENGES: CHALLENGES,
    spa: spa, fishing: fishing, gardening: gardening, shoppingMenu: shoppingMenu, dnaTest: dnaTest, sue: sue
  };
})();
