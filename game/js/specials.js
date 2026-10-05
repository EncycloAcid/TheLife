/* TheLife — v2.16: more special careers. Fashion model, chef and esports pro,
 * built on one shared ladder: reputation (0-100) sets your title and the gigs
 * you're offered, a career skill grows with practice, and each career has its
 * own signature system (brand contracts, your own restaurant with Michelin
 * stars, a streaming channel) and its own yearly honors.
 * State: S().sp[id]. The job has job.special = id and the year's pay in
 * job.salary. */
TL.specials = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function count(key) { var y = S().yearActs || (S().yearActs = {}); return y[key] || 0; }
  function bump(key) { var y = S().yearActs || (S().yearActs = {}); y[key] = (y[key] || 0) + 1; }
  function yr() { return S().year; }
  function era(list) { return list.filter(function (q) { return yr() >= q[1] && (!q[2] || yr() <= q[2]); }).map(function (q) { return q[0]; }); }

  // ------------------------------------------------------------ careers
  // ladder: [min rep, title, base yearly retainer]; gigs: [min rep, name, base pay, rep gain, difficulty]
  var C = {
    model: {
      name: 'Fashion model', icon: '📸', minAge: 14, maxStart: 30, skillName: 'Runway & posing',
      need: function () { return me().looks >= 55 ? null : 'Agencies want striking looks (55+ looks).'; },
      power: function (x) { return me().looks * 0.6 + x.skill * 0.4; },
      ladder: [[0, 'New Face', 4000], [25, 'Working Model', 25000], [50, 'In-Demand Model', 90000], [70, 'Top Model', 300000], [85, 'Supermodel', 1200000]],
      agencies: function () { return yr() < 1946 ? ['a local modeling agency', 'a department-store catalog studio'] : era([['Ford Models', 1946], ['Wilhelmina Models', 1967], ['Elite Model Management', 1972], ['IMG Models', 1987], ['Next Management', 1989]]); },
      train: ['Practice my runway walk', 'I practiced my walk and my angles.'],
      gigs: function () {
        return [[0, 'Catalog shoot', 2500, 4, 30], [0, 'Local fashion show', 1500, 4, 35], [25, 'Magazine editorial', 12000, 6, 50], [25, 'TV commercial', 20000, 5, 48],
          [50, 'Walk at ' + U.pick(['New York', 'Paris', 'Milan', 'London']) + ' Fashion Week', 40000, 8, 62],
          [70, 'Cover of ' + U.pick(era([['Vogue', 1892], ["Harper's Bazaar", 1867], ['Elle', 1945], ['Cosmopolitan', 1965], ['Sports Illustrated Swimsuit', 1964]])), 60000, 10, 70]];
      },
      big: ['💎', 'Luxury brand contract', 85, function () { return U.pick(yr() < 1920 ? ['a Paris couture house'] : era([['Chanel', 1920], ['Dior', 1947], ['Louis Vuitton', 1960], ['Calvin Klein', 1968], ['Versace', 1978], ['Victoria\'s Secret', 1995, 2018], ['Prada', 1985], ['Gucci', 1960]])); }],
      decline: 30
    },
    chef: {
      name: 'Chef', icon: '🧑‍🍳', minAge: 16, skillName: 'Cooking',
      need: function () { return null; },
      power: function (x) { return x.skill * 0.6 + me().smarts * 0.15 + me().happy * 0.1 + x.rep * 0.1; },
      ladder: [[0, 'Line Cook', 28000], [20, 'Sous Chef', 48000], [40, 'Head Chef', 72000], [60, 'Executive Chef', 110000], [80, 'Celebrity Chef', 300000]],
      agencies: function () { return ['a busy downtown restaurant', 'a hotel kitchen', 'a French bistro', 'a steakhouse', 'an Italian trattoria']; },
      train: ['Practice new recipes', 'I spent my nights off perfecting new recipes.'],
      gigs: function () {
        var tv = era([['a local cooking contest', 1900], ['Iron Chef', 1993], ['Iron Chef America', 2005], ['Top Chef', 2006], ['Chopped', 2009], ['MasterChef', 2010]]);
        return [[0, 'Cater a private party', 1500, 2, 30], [20, 'Cook at a food festival', 4000, 3, 45], [30, 'Compete on ' + tv[tv.length - 1], 10000, 6, 60],
          [50, 'Write a cookbook', 40000, 5, 55], [70, yr() >= 1993 ? 'Host a Food Network special' : 'Host a TV cooking special', 120000, 6, 65]];
      },
      big: ['🍽️', 'Open my own restaurant', 40, null]
    },
    gamer: {
      name: 'Esports pro', icon: '🎮', minAge: 13, maxStart: 26, minYear: 1997, skillName: 'Mechanics',
      need: function () { return yr() < 1997 ? 'There\'s no esports scene yet.' : null; },
      power: function (x) { return x.skill * 0.7 + me().smarts * 0.2 + (me().age <= 26 ? 10 : Math.max(0, 10 - (me().age - 26) * 3)); },
      ladder: [[0, 'Amateur', 0], [20, 'Semi-Pro', 6000], [40, 'Pro Player', 60000], [65, 'Star Player', 250000], [85, 'Esports Legend', 900000]],
      agencies: function () { return era([['Evil Geniuses', 1999], ['Team Liquid', 2000], ['Fnatic', 2004], ['SK Telecom T1', 2012], ['TSM', 2009], ['FaZe Clan', 2010], ['Cloud9', 2013], ['100 Thieves', 2017]]); },
      train: ['Grind ranked', 'I grinded ranked until 4 a.m.'],
      gigs: function () {
        return [[0, 'Online tournament', 500, 4, 35], [20, 'LAN tournament', 5000, 6, 48], [40, 'Major tournament', 50000, 7, 64]];
      },
      big: ['🏆', 'World Championship', 50, null],
      decline: 27
    }
  };
  var GAMES = [['StarCraft', 1998], ['Counter-Strike', 2000], ['Halo 2', 2004], ['League of Legends', 2009], ['Dota 2', 2013], ['Fortnite', 2017], ['Valorant', 2020]];

  function all() { return S().sp || (S().sp = {}); }
  function st(id) { return all()[id]; }
  function active() { var j = S().job; return j && j.special ? st(j.special) : null; }
  function cdef(id) { return C[id]; }
  function rung(id, rep) { var L = C[id].ladder, r = L[0]; L.forEach(function (q) { if (rep >= q[0]) r = q; }); return r; }
  function title(job) {
    var j = job || S().job, x = j && st(j.special);
    if (!x) return 'Freelancer';
    var t = rung(j.special, x.rep)[1];
    return j.special === 'chef' && x.rest ? 'Chef-Owner' : j.special === 'model' && me().gender === 'M' && t === 'Supermodel' ? 'Supermodel' : t;
  }
  function summary(id) {
    var x = st(id);
    if (!x) return { model: 'Agencies, castings, Fashion Week · looks 55+', chef: 'Kitchens, cookbooks, your own restaurant', gamer: 'Tournaments, teams, streaming · 1997+' }[id];
    return (x.retired ? 'Retired ' + C[id].name.toLowerCase() : rung(id, x.rep)[1]) + ' · reputation ' + Math.round(x.rep);
  }

  // ------------------------------------------------------------ joining
  function start(id) {
    var c = C[id], m = me(), s = S();
    if (m.age < c.minAge) return done(nope('I\'m too young. Come back at ' + c.minAge + '.'));
    if (c.maxStart && m.age > c.maxStart && !st(id)) return done(nope('That ship has sailed. Nobody starts out after ' + c.maxStart + '.'));
    var why = c.need(); if (why) return done(nope(why));
    if (s.prison) return done(nope('Not from in here.'));
    if (s.job && s.job.special === id) return done(nope('I\'m already doing it.'));
    if (s.job) return done(nope('I\'d have to quit my current job first.'));
    var x = st(id);
    if (!x) {
      if (id === 'model' && !U.chance(0.25 + (m.looks - 55) / 50)) { bump('spjoin'); return done(bad('The agency passed on me. Maybe next year.')); }
      x = all()[id] = { rep: 5, skill: U.rand(10, 25), since: s.year, peak: 5, honors: [], earnTotal: 0 };
      if (id === 'gamer') { var gs = era(GAMES); x.game = gs[gs.length - 1] || 'Quake'; }
    }
    x.retired = false;
    var org = U.pick(c.agencies());
    s.job = { career: 'sp_' + id, special: id, fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, salary: 0, company: id === 'gamer' && x.rep < 40 ? 'Free agent' : org };
    if (id === 'gamer' && x.rep >= 40) x.team = org;
    E.log(C[id].icon + ' ' + (id === 'model' ? 'I signed with ' + org + '! I\'m officially a model.' : id === 'chef' ? 'I got a job as a line cook at ' + org + '.' : 'I\'m going pro in ' + x.game + '.'), 'good');
    ui().closeAll(); done(good(id === 'model' ? 'Signed with ' + org + '!' : 'A new career begins.'));
  }

  // ------------------------------------------------------------ the year's work
  function gig(id, g) {
    var x = st(id), c = C[id], key = 'spgig';
    if (count(key) >= 3) return done(nope('I\'ve taken on enough this year.'));
    bump(key);
    var odds = U.clamp(0.25 + (c.power(x) - g[4]) / 60 + (x.rep - g[0]) / 200, 0.08, 0.92);
    if (U.chance(odds)) {
      var pay = E.$(Math.round(g[2] * U.randf(0.7, 1.3) * (1 + x.rep / 100)));
      x.earn = (x.earn || 0) + pay; x.rep = U.clamp(x.rep + g[3] * U.randf(0.6, 1.2) * (110 - x.rep) / 80, 0, 100); // the top is crowded
      E.stat('happy', 3); E.fame(g[3] / 3);
      if (/^Cover of/.test(g[1])) x.covers = (x.covers || 0) + 1;
      if (/^Major|^LAN|^Online/.test(g[1]) && U.chance(0.3 + (c.power(x) - g[4]) / 80)) {
        x.titles = (x.titles || 0) + 1; x.earn += pay; // the winner's share doubles the payout
        return done(good('🏆 I won the ' + g[1].toLowerCase() + '! (+' + E.fmt(pay * 2) + ')'));
      }
      return done(good(g[1] + ': it went great. (+' + E.fmt(pay) + ')'));
    }
    x.rep = Math.max(0, x.rep - 1); E.stat('happy', -2);
    done(bad(g[1] + ': ' + U.pick(id === 'model' ? ['They went with someone else.', 'The client wanted a different look.'] : id === 'chef' ? ['The judges called my dish bland.', 'A critic panned my food.'] : ['We got knocked out early.', 'I choked in the deciding round.'])));
  }
  function train(id) {
    var x = st(id), c = C[id];
    if (count('sptrain') >= 2) return done(nope('I\'ve trained as much as I can this year.'));
    bump('sptrain');
    var gain = Math.max(1, Math.round((100 - x.skill) / 12 * U.randf(0.6, 1.2)));
    x.skill = U.clamp(x.skill + gain, 0, 100);
    if (id === 'gamer') { E.stat('health', -1); E.stat('happy', -1); }
    done(good(c.train[1] + ' (+' + gain + ' ' + c.skillName.toLowerCase() + ')'));
  }
  // Signature moves: a luxury contract, my own restaurant, the World Championship.
  function bigMove(id) {
    var x = st(id), s = S();
    if (id === 'model') {
      if (x.contract) return done(nope('I already have a contract with ' + x.contract.brand + '.'));
      if (count('spbig')) return done(nope('My agent is still negotiating. Try next year.'));
      bump('spbig');
      if (!U.chance(0.35 + (x.rep - 85) / 30)) return done(bad('The brand went with another face this season.'));
      x.contract = { brand: C.model.big[3](), years: 3, pay: Math.round(E.$(U.rand(800000, 3000000))) };
      E.fame(6); E.stat('happy', 10);
      return done(good('💎 I\'m the new face of ' + x.contract.brand + ': ' + E.fmt(x.contract.pay) + ' a year for 3 years!'));
    }
    if (id === 'chef') {
      if (x.rest) return done(nope('I already run ' + x.rest.name + '.'));
      var cost = E.$(250000);
      if (s.money < cost) return done(nope('Opening a restaurant takes about ' + E.fmt(cost) + '.'));
      E.addMoney(-cost);
      x.rest = { name: U.pick(['Ember', 'Juniper', 'The Larder', 'Salt & Vine', 'Marrow', 'Atelier', 'Saffron', 'Harbor House']) + (U.chance(0.3) ? ' by ' + me().first : ''), since: s.year, q: Math.round(C.chef.power(x)), stars: 0 };
      E.stat('happy', 12);
      return done(good('🍽️ I opened my own restaurant, ' + x.rest.name + '!'));
    }
    // Esports: the World Championship, played round by round.
    if (!x.team) return done(nope('Only signed teams get invited. I need to join a team first.'));
    if (count('spbig')) return done(nope('Worlds only comes once a year.'));
    bump('spbig');
    var rounds = ['the group stage', 'the quarterfinals', 'the semifinals', 'the final'], r = 0;
    while (r < 4 && U.chance(U.clamp(0.4 + (C.gamer.power(x) - 75) / 90, 0.12, 0.75))) r++;
    if (r === 4) { x.worlds = (x.worlds || 0) + 1; var prize = E.$(U.rand(500000, 2000000)); x.earn = (x.earn || 0) + prize; x.rep = Math.min(100, x.rep + 10); E.fame(8); E.stat('happy', 15); x.honors.push('World Champion ' + s.year); return done(good('🏆 WE WON WORLDS! ' + x.team + ' are world champions. (+' + E.fmt(prize) + ')')); }
    x.rep = U.clamp(x.rep + r * 2 - 1, 0, 100);
    done(r ? 'We made it to ' + rounds[r] + ' at Worlds before losing.' : bad('We went out in the group stage at Worlds.'));
  }
  function joinTeam() {
    var x = st('gamer');
    if (x.team) return done(nope('I already play for ' + x.team + '.'));
    if (x.rep < 30) return done(nope('No team will sign me yet. I need a bigger reputation (30+).'));
    if (count('spteam')) return done(nope('No offers this year.'));
    bump('spteam');
    if (!U.chance(0.3 + x.rep / 120)) return done(bad('Tryouts didn\'t go my way.'));
    x.team = U.pick(C.gamer.agencies()); S().job.company = x.team;
    done(good('🎮 I signed with ' + x.team + '!'));
  }
  function stream() {
    var x = st('gamer'), s = S();
    if (count('spstream')) return done(nope('I already streamed a ton this year.'));
    bump('spstream');
    var site = yr() >= 2011 ? 'Twitch' : 'YouTube';
    var gain = Math.round(U.rand(200, 2000) * (1 + x.rep / 15) * (yr() >= 2011 ? 1 : 0.3));
    x.subs = (x.subs || 0) + gain; E.fame(gain > 20000 ? 2 : 0.5);
    done(good('I streamed on ' + site + ' all year (+' + gain.toLocaleString() + ' followers).'));
  }
  function retire(id) {
    var x = st(id);
    x.retired = S().year; x.contract = null;
    if (x.rest) { E.addMoney(E.$(Math.round(150000 + x.rest.stars * 400000))); E.log('🍽️ I sold ' + x.rest.name + '.'); x.rest = null; }
    E.quitJob(true);
    ui().closeAll(); done('I stepped away from my career as ' + C[id].name.toLowerCase() + '.');
  }

  // ------------------------------------------------------------ yearly
  function year() {
    var s = S(), j = s.job, id = j.special, x = st(id), c = C[id], m = me();
    if (!x) return 0;
    var r = rung(id, x.rep), earn = E.$(r[2]) + (x.earn || 0); x.earn = 0;
    // Age catches up with models and gamers.
    if (c.decline && m.age > c.decline) { var d = (m.age - c.decline) * (x.rep >= 85 ? 0.3 : 0.8); x.rep = Math.max(0, x.rep - d); if (id === 'gamer') x.skill = Math.max(0, x.skill - 1); }
    // Out of sight, out of mind; working steadily keeps you relevant.
    x.rep = Math.max(0, x.rep - (count('spgig') ? 0.5 : 2.5));
    if (id === 'chef') if (x.rep < 60) x.rep = Math.min(60, x.rep + 0.5 + x.skill / 100); // a good kitchen builds a name slowly, but fame takes more
    if (id === 'model' && x.contract) {
      earn += x.contract.pay; x.contract.years--;
      if (x.contract.years <= 0) { E.log('💎 My contract with ' + x.contract.brand + ' ended.'); x.contract = null; }
    }
    if (id === 'chef' && x.rest) {
      var R = x.rest;
      R.q = U.clamp(Math.round(R.q * 0.6 + c.power(x) * 0.4 + U.rand(-8, 8)), 0, 100);
      var profit = E.$(Math.round((R.q - 55) * 8000 + R.stars * 150000));
      earn += profit;
      var guide = yr() >= 1926 ? 'Michelin' : null;
      var stars = R.q >= 94 ? 3 : R.q >= 89 ? 2 : R.q >= 82 ? 1 : 0;
      if (guide && stars !== R.stars) { E.log(stars > R.stars ? '⭐ ' + R.name + ' earned ' + (stars === 1 ? 'a Michelin star' : stars + ' Michelin stars') + '!' : '📉 ' + R.name + ' lost a Michelin star.', stars > R.stars ? 'good' : 'bad'); if (stars > R.stars) { x.honors.push(stars + ' Michelin star' + (stars > 1 ? 's' : '') + ' ' + s.year); E.fame(stars * 3); x.rep = Math.min(100, x.rep + 3 * (stars - R.stars)); } R.stars = stars; }
      if (profit < 0 && R.q < 35 && U.chance(0.4)) { E.log('🍽️ ' + R.name + ' closed after a bad year.', 'bad'); x.rest = null; E.stat('happy', -10); }
    }
    if (id === 'gamer' && x.subs) earn += E.$(Math.round(x.subs * (yr() >= 2011 ? 1.5 : 0.3)));
    // Honors.
    if (id === 'chef' && x.rep >= 75 && U.chance(0.12) && yr() >= 1991) { x.honors.push('James Beard Award ' + s.year); E.log('🏅 I won a James Beard Award!', 'good'); E.fame(4); }
    if (id === 'model' && x.rep >= 80 && U.chance(0.15)) { x.honors.push('Model of the Year ' + s.year); E.log('🏅 I was named Model of the Year!', 'good'); E.fame(4); }
    if (id === 'gamer' && x.rep >= 70 && U.chance(0.15)) { x.honors.push('Esports Player of the Year ' + s.year); E.log('🏅 I was named Esports Player of the Year!', 'good'); E.fame(4); }
    var r2 = rung(id, x.rep);
    if (r2[0] > r[0]) E.log(c.icon + ' I\'m now a' + (/^[AEIOU]/.test(r2[1]) ? 'n ' : ' ') + r2[1] + '.', 'good');
    x.peak = Math.max(x.peak || 0, x.rep);
    earn = Math.max(0, Math.round(earn));
    x.earnTotal = (x.earnTotal || 0) + earn; j.salary = earn;
    return earn;
  }

  // ------------------------------------------------------------ menus
  function menu(id) {
    ui().menu(C[id].icon + ' ' + C[id].name, function () {
      var x = st(id), c = C[id], j = S().job, on = j && j.special === id, items = [];
      if (!x || !on) {
        items.push({ info: true, html: '<p class="muted">' + summary(id) + '</p>' });
        items.push({ icon: c.icon, label: x ? 'Make a comeback' : 'Start my career', sub: x ? summary(id) : 'Age ' + c.minAge + '+', onClick: function () { start(id); } });
        return items;
      }
      var r = rung(id, x.rep), nxt = c.ladder.filter(function (q) { return q[0] > x.rep; })[0];
      items.push({ info: true, html: '<div class="kv"><b>' + U.esc(title(j)) + '</b> · ' + U.esc(j.company) + '<br>Reputation ' + Math.round(x.rep) + (nxt ? ' (' + nxt[1] + ' at ' + nxt[0] + ')' : '') + ' · ' + c.skillName + ' ' + x.skill +
        (x.game ? '<br>Main game: ' + U.esc(x.game) : '') + (x.contract ? '<br>💎 Face of ' + U.esc(x.contract.brand) + ' · ' + U.plural(x.contract.years, 'year') + ' left' : '') +
        (x.rest ? '<br>🍽️ ' + U.esc(x.rest.name) + ' · quality ' + x.rest.q + (x.rest.stars ? ' · ' + '⭐'.repeat(x.rest.stars) : '') : '') +
        (x.subs ? '<br>📺 ' + x.subs.toLocaleString() + ' followers' : '') + (x.covers ? '<br>📰 ' + U.plural(x.covers, 'magazine cover') : '') + (x.titles ? '<br>🏆 ' + U.plural(x.titles, 'tournament win') : '') +
        (x.honors.length ? '<br>🏅 ' + U.esc(x.honors.slice(-3).join(' · ')) : '') + '</div>' });
      items.push({ section: 'Work' });
      items.push({ icon: '💪', label: c.train[0], sub: c.skillName + ' ' + x.skill, onClick: function () { train(id); } });
      c.gigs().forEach(function (g) {
        if (x.rep + 10 < g[0]) return;
        items.push({ icon: '📅', label: g[1], sub: 'Pays about ' + E.fmt(E.$(g[2])) + (x.rep < g[0] ? ' · a long shot' : ''), disabled: count('spgig') >= 3, onClick: function () { gig(id, g); } });
      });
      var b = c.big;
      if (x.rep >= b[2] - 10) items.push({ icon: b[0], label: b[1], sub: x.rep < b[2] ? 'Needs reputation ' + b[2] : id === 'chef' ? 'About ' + E.fmt(E.$(250000)) : '', disabled: x.rep < b[2], onClick: function () { bigMove(id); } });
      if (id === 'gamer') {
        if (!x.team) items.push({ icon: '🤝', label: 'Try out for a team', sub: 'Reputation 30+', disabled: x.rep < 30, onClick: joinTeam });
        items.push({ icon: '📺', label: 'Stream', sub: yr() >= 2011 ? 'Twitch' : 'YouTube videos', onClick: stream });
      }
      items.push({ section: 'Career' });
      items.push({ icon: '🚪', label: 'Retire', danger: true, onClick: function () { ui().confirm('Retire?', 'Step away from your career as ' + c.name.toLowerCase() + '?', function () { retire(id); }); } });
      return items;
    });
  }
  function fameItems() {
    return Object.keys(C).map(function (id) {
      var c = C[id];
      return { icon: c.icon, label: c.name, sub: summary(id), disabled: me().age < c.minAge, onClick: function () { menu(id); } };
    });
  }
  function aboutRow() {
    var j = S().job; if (!j || !j.special || !st(j.special)) return null;
    return [C[j.special].icon, C[j.special].name, title(j) + ' · reputation ' + Math.round(st(j.special).rep)];
  }
  return { C: C, year: year, title: title, menu: menu, fameItems: fameItems, summary: summary, active: active, aboutRow: aboutRow, start: start, st: st };
})();
