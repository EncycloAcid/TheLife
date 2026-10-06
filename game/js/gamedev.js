/* TheLife — v2.29: game development, expanded. Make games one project at a
 * time: pick a genre (each has its era, from arcade action to battle
 * royales), a platform that existed that year (Atari 2600, NES, PlayStation,
 * Steam, the App Store, Switch...) and a scope from a weekend-sized game to a
 * AAA blockbuster. Design, code, fix bugs, build hype at real shows (CES, E3,
 * Gamescom, GDC), crowdfund, try Early Access, then ship and face the
 * reviews: a score out of 100, sales, fans, long-tail revenue, sequels and
 * franchises, Game of the Year. Start as a teen hobbyist, go indie, work your
 * way up at real studios (Atari, Activision, EA, id, Blizzard, Valve,
 * Rockstar...) or found your own and hire a team. Crunch, publishers, loot
 * boxes, acquisitions, layoffs and a Hall of Fame. Legends of the craft turn
 * up as encounters only. State: S().gd. The job is the special career
 * 'gamedev' (js/specials.js), whose menu and yearly update come here. */
TL.gamedev = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function yr() { return S().year; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function toast(t) { return { text: t, cls: 'good', quiet: true }; } // already in the log
  function count(k) { var y = S().yearActs || (S().yearActs = {}); return y[k] || 0; }
  function bump(k) { var y = S().yearActs || (S().yearActs = {}); y[k] = (y[k] || 0) + 1; }
  function cl(v, a, b) { return U.clamp(v, a == null ? 0 : a, b == null ? 100 : b); }
  // Getting better gets harder near the top.
  function grow(v, k) { return cl(v + (100 - v) / 30 * U.randf(0.5, 1.2) * (k || 1)); }
  function gifted() { return TL.talents && TL.talents.has('genius') ? 1 : 0; }
  function x() {
    var s = S();
    // Saves from before this module: carry the old special career over.
    if (!s.gd && s.job && s.job.special === 'gamedev') { var o = (s.sp && s.sp.gamedev) || {}; s.gd = fresh(); s.gd.stage = 'indie'; s.gd.rep = o.rep || 5; s.gd.skill = Math.max(12, o.skill || 15); setJob(s.gd); }
    return s.gd;
  }

  // ------------------------------------------------------------ the world
  // [name, from, to, market size]
  var PLATS = [['Atari 2600', 1977, 1991, 0.6], ['Arcade', 1978, 2004, 0.7], ['Commodore 64', 1982, 1994, 0.5], ['PC', 1981, 9999, 0.8], ['NES', 1985, 1995, 1], ['Sega Genesis', 1989, 1997, 0.8], ['Game Boy', 1989, 2003, 0.8], ['Super Nintendo', 1991, 1999, 1],
    ['PlayStation', 1995, 2006, 1.3], ['Nintendo 64', 1996, 2002, 0.8], ['PlayStation 2', 2000, 2013, 1.5], ['Xbox', 2001, 2008, 0.7], ['GameCube', 2001, 2007, 0.6], ['Xbox 360', 2005, 2016, 1.2], ['PlayStation 3', 2006, 2017, 1.1], ['Wii', 2006, 2013, 1.2],
    ['iPhone and Android', 2008, 9999, 1.4], ['PlayStation 4', 2013, 2023, 1.4], ['Xbox One', 2013, 2020, 0.9], ['VR headsets', 2016, 9999, 0.4], ['Nintendo Switch', 2017, 9999, 1.3], ['PlayStation 5', 2020, 9999, 1.2], ['Xbox Series X', 2020, 9999, 0.8]];
  // [name, first year, peak from, peak to]
  var GENRES = [['Arcade action', 1977, 1978, 1988], ['Platformer', 1981, 1985, 1999], ['Adventure', 1980, 1984, 1995], ['RPG', 1980, 1993, 9999], ['Shooter', 1992, 1996, 9999], ['Strategy', 1983, 1994, 2005], ['Puzzle', 1984, 1989, 1995],
    ['Racing', 1982, 1997, 2008], ['Sports', 1983, 1990, 9999], ['Horror', 1992, 1996, 2005], ['Simulation', 1989, 2000, 2010], ['Open world', 2001, 2008, 9999], ['MOBA', 2009, 2010, 2016], ['Roguelike', 2008, 2015, 9999], ['Battle royale', 2017, 2017, 2021], ['Cozy farming', 2016, 2016, 9999]];
  // scope: [label, progress per year solo, base units, price (USD), quality bonus]
  var SCALE = { small: 1, mid: 1.3, big: 1.7, aaa: 2.2 }; // bigger games need more work to polish
  var SCOPE = { small: ['Small game', 100, 15000, 8, -5], mid: ['Mid-size game', 55, 80000, 20, 0], big: ['Big game', 34, 400000, 40, 2], aaa: ['AAA blockbuster', 25, 2000000, 60, 4] };
  // Real studios: [name, from, to, prestige (rep needed)]
  var STUDIOS = [['Atari', 1977, 1984, 10], ['Activision', 1979, 9999, 25], ['Sierra On-Line', 1980, 2008, 20], ['Electronic Arts', 1983, 9999, 25], ['Naughty Dog', 1984, 9999, 50], ['Ubisoft', 1986, 9999, 25], ['Square', 1986, 2003, 45], ['id Software', 1991, 9999, 50],
    ['Bungie', 1991, 9999, 45], ['Epic Games', 1991, 9999, 45], ['Blizzard', 1994, 9999, 50], ['BioWare', 1995, 9999, 45], ['Valve', 1996, 9999, 60], ['Rockstar Games', 1998, 9999, 55], ['CD Projekt Red', 2002, 9999, 45], ['Riot Games', 2006, 9999, 40], ['Mojang', 2010, 9999, 35], ['Supercell', 2010, 9999, 35], ['a small local studio', 1977, 9999, 0]];
  // Legends of the craft, met as encounters only.
  var LEGENDS = [['Shigeru Miyamoto', 1981], ['Sid Meier', 1982], ['Hideo Kojima', 1987], ['Will Wright', 1989], ['Tim Schafer', 1990], ['John Carmack', 1991], ['Hidetaka Miyazaki', 2009], ['Toby Fox', 2015]];
  var ROLES = [[0, 'Junior Designer', 45000], [25, 'Game Designer', 70000], [45, 'Senior Designer', 105000], [65, 'Lead Designer', 160000], [80, 'Creative Director', 260000]];
  var W1 = ['Star', 'Shadow', 'Pixel', 'Iron', 'Neon', 'Crystal', 'Dragon', 'Lost', 'Hollow', 'Sky', 'Rogue', 'Ember', 'Silent', 'Wild'], W2 = ['Quest', 'Fortress', 'Odyssey', 'Legends', 'Frontier', 'Knight', 'Runner', 'Valley', 'Kingdom', 'Protocol', 'Saga', 'Drift', 'Garden', 'Hearts'];

  function live(list) { var y = yr(); return list.filter(function (p) { return y >= p[1] && y <= p[2]; }); }
  function platforms(w) {
    var y = yr(), all = live(PLATS).filter(function (p) { return p[0] !== 'Arcade' || w.stage !== 'hobby'; });
    // Before digital stores, a lone indie could only self-publish on computers.
    if ((w.stage === 'hobby' || w.stage === 'indie') && y < 2008) all = all.filter(function (p) { return p[0] === 'PC' || p[0] === 'Commodore 64'; });
    return all.length ? all : [['PC', 1981, 9999, 0.8]];
  }
  function genres() { var y = yr(); return GENRES.filter(function (g) { return y >= g[1]; }); }
  function fit(gname, y) {
    var g = GENRES.filter(function (q) { return q[0] === gname; })[0]; if (!g) return 0.5;
    if (y >= g[2] && y <= g[3]) return 1;
    if (y < g[2]) return 0.35;
    return Math.max(0, 0.75 - (y - g[3]) / 14);
  }
  function plat(name) { return PLATS.filter(function (p) { return p[0] === name; })[0] || ['PC', 1981, 9999, 0.8]; }
  function show() { var y = yr(); return y >= 2021 ? 'Summer Game Fest' : y >= 1995 ? 'E3' : y >= 1977 ? 'CES' : 'a computer fair'; }
  function award() { var y = yr(); return y >= 2014 ? 'The Game Awards' : y >= 2003 ? 'the Spike Video Game Awards' : y >= 1998 ? 'the Interactive Achievement Awards' : 'the Golden Joystick Awards'; }
  function studiosOpen(w) { return live(STUDIOS).filter(function (st) { return st[0] !== w.employer; }); }

  // ------------------------------------------------------------ state
  function fresh() { return { stage: 'hobby', skill: U.rand(10, 22), tech: U.rand(10, 22), rep: 3, fans: 0, employer: null, studio: null, proj: null, games: [], awards: [], franchises: {}, since: yr(), earned: 0, flops: 0 }; }
  function role(w) { var r = ROLES[0]; ROLES.forEach(function (q) { if (w.rep >= q[0]) r = q; }); return r; }
  function title() {
    var w = S().gd; if (!w) return 'Game Developer';
    if (w.stage === 'employed') return role(w)[1];
    if (w.stage === 'owner') return w.rep >= 70 ? 'Studio Head & Creative Director' : 'Studio Founder';
    if (w.stage === 'indie') return w.rep >= 60 ? 'Acclaimed Indie Developer' : 'Indie Developer';
    return 'Hobbyist Game Developer';
  }
  function setJob(w) {
    var s = S(); if (me().age < 16 || w.stage === 'hobby') return;
    s.job = { career: 'sp_gamedev', special: 'gamedev', fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, salary: 0, company: w.stage === 'employed' ? w.employer : w.stage === 'owner' ? w.studio.name : 'Self-published' };
    s.sp = s.sp || {}; s.sp.gamedev = s.sp.gamedev || { rep: w.rep, skill: w.skill, since: yr(), peak: w.rep, honors: [], earnTotal: 0 }; s.sp.gamedev.retired = false;
  }
  function syncSp(w, earn) { var s = S(); s.sp = s.sp || {}; var sp = s.sp.gamedev || (s.sp.gamedev = { since: w.since, honors: [], earnTotal: 0 }); sp.rep = Math.round(w.rep); sp.skill = Math.round(w.skill); sp.peak = Math.max(sp.peak || 0, w.rep); sp.earnTotal = (sp.earnTotal || 0) + (earn || 0); }

  // ------------------------------------------------------------ joining
  function start() {
    var s = S(), m = me();
    if (yr() < 1977) return done(nope('There\'s no home video game industry yet.'));
    if (m.age < 10) return done(nope('I\'m a bit young to make games. I can start at 10.'));
    if (s.prison) return done(nope('Not from in here.'));
    if (s.job && s.job.special !== 'gamedev') return done(nope('I\'d have to quit my current job first.'));
    var w = s.gd && !s.gd.retired ? s.gd : (s.gd = s.gd ? Object.assign(s.gd, { retired: false, stage: 'hobby', employer: null, studio: null }) : fresh());
    if (m.age >= 16) { w.stage = 'indie'; setJob(w); }
    E.log('🕹️ ' + (m.age < 16 ? 'I started making my own games after school.' : 'I\'m making games for a living now. Indie, for now.'), 'good');
    ui().closeAll(); done(toast('🕹️ Press start.'));
  }
  function apply(st) {
    var w = x();
    if (count('gdapply')) return done(nope('I\'ve already been through a round of interviews this year.'));
    bump('gdapply');
    var odds = cl(0.25 + (w.rep - st[3]) / 60 + (w.skill - 40) / 150 + (w.games.length ? 0.1 : 0), 3, 92) / 100;
    if (!U.chance(odds)) return done(bad(st[0] + ' passed on me. ' + (w.games.length ? 'My portfolio needs a bigger hit.' : 'I need a shipped game in my portfolio.')));
    if (w.stage === 'owner') return done(nope('I\'d have to leave my own studio first.'));
    w.stage = 'employed'; w.employer = st[0]; w.proj = w.proj && w.proj.scope === 'small' ? w.proj : null; setJob(w);
    E.log('🕹️ I got hired at ' + st[0] + ' as a ' + role(w)[1].toLowerCase() + '.', 'good'); E.stat('happy', 8);
    ui().back(); return done(toast('I\'m joining ' + st[0] + '!'));
  }
  function quitStudio() {
    var w = x(); if (w.stage !== 'employed') return;
    E.log('🕹️ I left ' + w.employer + ' to go indie.'); w.stage = 'indie'; w.employer = null; w.proj = null; setJob(w);
    ui().back(); done(toast('I handed in my badge. I\'m indie now.'));
  }
  function found() {
    var w = x(), cost = E.$(60000);
    if (w.rep < 30) return done(nope('Nobody will back a studio from me yet (reputation 30+).'));
    if (S().money < cost) return done(nope('Founding a studio takes ' + E.fmt(cost) + '.'));
    ui().prompt('Name your studio', 'What do I call it?', U.pick(['Lantern', 'Moonlight', 'Brightside', 'Paper Crane', 'Northwind', 'Tiny Giant']) + ' Games', function (v) {
      v = String(v || '').trim().replace(/[<>"]/g, '').slice(0, 30); if (!v) return;
      E.addMoney(-cost); w.stage = 'owner'; w.employer = null; w.studio = { name: v, staff: 3, morale: 70, since: yr() }; w.proj = null; setJob(w);
      E.log('🏢 I founded ' + v + ' with three hires.', 'good'); E.stat('happy', 8);
      ui().closeAll(); done(toast('🏢 ' + v + ' is open for business.'));
    });
  }
  function staff(n) {
    var w = x(), st = w.studio; if (!st) return;
    if (n > 0) { if (count('gdhire') >= 2) return done(nope('I\'ve hired enough this year.')); bump('gdhire'); st.staff += n; return done(good('I hired ' + n + ' more developers. ' + st.name + ' is ' + st.staff + ' people now.')); }
    if (st.staff <= 1) return done(nope('There\'s nobody left to lay off.'));
    var k = Math.min(-n, st.staff - 1); st.staff -= k; st.morale = cl(st.morale - 15); E.karma(-2);
    return done(bad('I laid off ' + k + ' people. The office is very quiet.'));
  }

  // ------------------------------------------------------------ projects
  function team(w) { return w.stage === 'employed' ? 1.5 : w.stage === 'owner' ? Math.min(2.2, 1 + w.studio.staff / 12) * (0.6 + w.studio.morale / 250) : 1; }
  function reach(w) { return w.stage === 'employed' ? 1 : w.stage === 'owner' ? Math.min(0.85, 0.5 + w.studio.staff / 80) : 0.35; }
  function maxScope(w) { if (w.stage === 'employed') return w.rep >= 45 ? 'aaa' : w.rep >= 25 ? 'big' : 'mid'; if (w.stage === 'owner') return w.studio.staff >= 40 ? 'aaa' : w.studio.staff >= 10 ? 'big' : 'mid'; return me().age < 16 ? 'small' : 'mid'; }
  function newGame(seq) {
    var w = x();
    if (w.proj) return done(nope('I\'m already working on ' + w.proj.name + '.'));
    var pickGenre = function (cb) {
      if (seq) return cb(seq.genre);
      ui().choose('What kind of game?', 'Genres rise and fall with the times.', genres().map(function (g) { var f = fit(g[0], yr()); return { label: g[0] + (f >= 1 ? ' 🔥' : f < 0.3 ? ' 💤' : ''), fn: function () { cb(g[0]); } }; }));
    };
    pickGenre(function (genre) {
      ui().choose('Which platform?', 'Bigger platforms sell more copies.', platforms(w).map(function (p) { return { label: p[0], fn: function () {
        var order = ['small', 'mid', 'big', 'aaa'], top = order.indexOf(maxScope(w));
        ui().choose('How big?', w.stage === 'employed' ? 'The studio decides how much it\'ll back my pitch.' : 'Bigger games take longer and need a team.', order.slice(0, top + 1).map(function (k) { return { label: SCOPE[k][0], fn: function () {
          if (w.stage === 'employed' && !U.chance(0.45 + w.rep / 120)) { bump('gdpitch'); return done(bad(w.employer + ' passed on my pitch. I\'ll pitch again.')); }
          var n = seq ? seq.name : U.pick(W1) + ' ' + U.pick(W2);
          w.proj = { name: n, genre: genre, plat: p[0], scope: k, prog: 0, q: 0, bugs: 10, hype: Math.min(40, w.fans / 20000), seq: seq ? seq.base : null, num: seq ? seq.num : 1, start: yr(), share: 1 };
          E.log('🕹️ I started work on ' + n + ', ' + (/^[AEIOU]/.test(SCOPE[k][0]) ? 'an ' : 'a ') + SCOPE[k][0].toLowerCase() + ' (' + genre.toLowerCase() + ') for ' + p[0] + '.');
          ui().closeAll(); done(toast('Development of ' + n + ' has begun.'));
        } }; }));
      } }; }));
    });
  }
  function work(kind) {
    var w = x(), p = w.proj;
    if (!p) return done(nope('I need a project first.'));
    if (count('gdwork') >= 3) return done(nope('I\'ve put in all the hours I have this year.'));
    bump('gdwork'); var g = gifted();
    if (kind === 'design') { var dq = Math.round((6 + w.skill / 12) * U.randf(0.7, 1.3) * (g ? 1.25 : 1) / SCALE[p.scope]); p.q = cl(p.q + dq); w.skill = grow(w.skill, g ? 1.3 : 1); return done(good('Long design sessions. ' + p.name + ' is getting more fun (+' + dq + ' quality).')); }
    if (kind === 'code') { var dp = Math.round((10 + w.tech / 8) * U.randf(0.7, 1.3) * team(w)); p.prog = cl(p.prog + dp); p.bugs = cl(p.bugs + U.rand(3, 8)); w.tech = grow(w.tech); E.stat('health', -2); return done('I coded through the night (+' + dp + '% progress, a few new bugs).'); }
    if (kind === 'bugs') { var db = Math.round(10 + w.tech / 5); p.bugs = cl(p.bugs - db); p.q = cl(p.q + 2); return done(good('Bug-fixing week. ' + db + ' points of jank gone.')); }
  }
  function market() {
    var w = x(), p = w.proj, cost = E.$(w.stage === 'employed' ? 0 : SCOPE[p.scope][2] * SCOPE[p.scope][3] * 0.02);
    if (count('gdmkt')) return done(nope('One marketing push a year.'));
    if (cost && S().money < cost) return done(nope('A campaign costs ' + E.fmt(cost) + '.'));
    bump('gdmkt'); if (cost) E.addMoney(-cost);
    var h = Math.round(U.rand(8, 18) + E.me().looks / 25 + (S().social && S().social.followers ? Math.min(10, Math.log10(S().social.followers + 1) * 2) : 0));
    p.hype = cl(p.hype + h);
    return done(good((cost ? 'I spent ' + E.fmt(cost) + ' on a trailer and ads. ' : 'I did interviews with the gaming press. ') + 'Hype +' + h + '.'));
  }
  function showcase() {
    var w = x(), p = w.proj;
    if (count('gdshow')) return done(nope('One big show a year.'));
    if (p.prog < 30) return done(nope('There\'s nothing to show yet (30% progress).'));
    bump('gdshow');
    var demo = p.q * 0.5 + w.skill * 0.3 - p.bugs * 0.4 + U.rand(-10, 10), where = show();
    var leg = live(LEGENDS.map(function (l) { return [l[0], l[1], 9999]; }));
    if (demo >= 30) {
      p.hype = cl(p.hype + 15 + Math.round(demo / 5)); w.rep = cl(w.rep + 1); E.stat('happy', 5);
      if (leg.length && U.chance(0.25)) { var L = U.pick(leg)[0]; E.log('🎮 ' + L + ' played my demo of ' + p.name + ' at ' + where + ' and laughed out loud.', 'good'); E.stat('happy', 6); p.hype = cl(p.hype + 8); return done(good('At ' + where + ', ' + L + ' stopped by and played my demo. I\'ll never forget it.')); }
      return done(good('The ' + p.name + ' demo at ' + where + ' had a line around the booth.'));
    }
    p.hype = cl(p.hype - 5);
    return done(bad('The demo crashed twice in front of the press at ' + where + '. Ouch.'));
  }
  function crowdfund() {
    var w = x(), p = w.proj;
    if (p.funded) return done(nope('I already crowdfunded this one.'));
    p.funded = true;
    var goal = E.$(SCOPE[p.scope][2] * SCOPE[p.scope][3] * 0.08), raised = Math.round(goal * U.randf(0.3, 1.2) * (0.6 + w.rep / 60 + Math.min(1, w.fans / 200000)));
    if (raised < goal) { p.hype = cl(p.hype + 3); return done(bad('The Kickstarter fell short (' + E.fmt(raised) + ' of ' + E.fmt(goal) + '). No money, but some new fans.')); }
    E.addMoney(raised); p.hype = cl(p.hype + 15); p.backers = true;
    E.log('💰 My Kickstarter for ' + p.name + ' raised ' + E.fmt(raised) + '.', 'good');
    return done(good('Funded! ' + E.fmt(raised) + ' from backers. Now I have to deliver.'));
  }
  function earlyAccess() {
    var w = x(), p = w.proj;
    if (p.ea) return done(nope('It\'s already in Early Access.'));
    if (p.prog < 50) return done(nope('It needs to be at least half done (50%).'));
    p.ea = true; var cash = Math.round(E.$(SCOPE[p.scope][2] * SCOPE[p.scope][3] * 0.05) * (0.5 + p.q / 100) * reach(w));
    E.addMoney(cash); p.bugs = cl(p.bugs - 10); p.q = cl(p.q + 5); p.hype = cl(p.hype + 6);
    return done(good('Early Access is live. Players are sending feedback (and ' + E.fmt(cash) + ').'));
  }
  function cancel() {
    var w = x(), p = w.proj; if (!p) return;
    ui().confirm('Cancel ' + p.name + '?', 'All that work goes in a drawer.', function () { w.proj = null; E.stat('happy', -6); E.log('🗑️ I cancelled ' + p.name + '.', 'bad'); ui().back(); done('I shelved ' + p.name + '.'); });
  }

  // ------------------------------------------------------------ launch
  function score(w, p) {
    var f = fit(p.genre, yr()), pf = plat(p.plat), late = yr() > pf[2] - 2 ? -4 : 0;
    var v = 34 + w.skill * 0.28 + w.tech * 0.1 + p.q * 0.18 - p.bugs * 0.25 + f * 7 + SCOPE[p.scope][4] + late + gifted() * 3 + U.rand(-6, 6);
    if (p.seq && w.franchises[p.seq]) v += w.franchises[p.seq].best >= 85 ? 2 : -2; // sequels to hits carry goodwill; to flops, doubt
    return Math.round(cl(v, 15, 99));
  }
  function launch(early) {
    var s = S(), w = x(), p = w.proj; if (!p) return 0;
    if (early) { p.bugs = cl(p.bugs + 20 + (100 - p.prog) / 2); p.q = cl(p.q - (100 - p.prog) / 3); }
    var sc = score(w, p), sp = SCOPE[p.scope], pf = plat(p.plat);
    var units = Math.round(sp[2] * Math.pow(Math.max(0.05, (sc - 35) / 50), 2) * pf[3] * (1 + p.hype / 80) * (1 + Math.min(2, w.fans / sp[2]) * 0.3) * reach(w) * U.randf(0.6, 1.4) * (p.seq ? 1.3 : 1));
    var rev = Math.round(E.$(units * sp[3] * 0.7));
    var g = { name: p.name, y: yr(), genre: p.genre, plat: p.plat, scope: p.scope, score: sc, units: units, rev: rev, at: w.stage === 'employed' ? w.employer : w.stage === 'owner' ? w.studio.name : 'self-published', tail: 3, share: w.stage === 'employed' ? 0 : p.share };
    w.games.push(g); if (w.games.length > 40) w.games.shift();
    var base = p.seq || p.name; w.franchises[base] = w.franchises[base] || { n: 0, best: 0, genre: p.genre }; w.franchises[base].n++; w.franchises[base].best = Math.max(w.franchises[base].best, sc);
    var weight = { small: 0.6, mid: 1, big: 1.2, aaa: 1.4 }[p.scope] * (p.assigned ? 0.6 : 1);
    w.rep = cl(w.rep + (sc - 62) / 3 * weight * (106 - w.rep) / 80);
    w.fans = Math.round(w.fans * 0.9 + units * 0.1);
    w.flops = sc < 50 ? (w.flops || 0) + 1 : 0;
    if (p.backers && sc < 70) { w.rep = cl(w.rep - 4); E.log('😠 My Kickstarter backers are furious about how ' + p.name + ' turned out.', 'bad'); }
    E.fame(sc >= 90 ? 4 : sc >= 80 ? 2 : sc >= 70 ? 1 : 0); E.stat('happy', sc >= 80 ? 10 : sc >= 60 ? 3 : -6);
    var earn = 0;
    if (w.stage === 'employed') { if (sc >= 80) earn = Math.min(rev * 0.01, E.$(500000)); }
    else earn = Math.round(rev * 0.6 * p.share); // the rest comes in over the next few years
    var verdict = sc >= 90 ? 'universal acclaim' : sc >= 75 ? 'great reviews' : sc >= 60 ? 'mixed reviews' : sc >= 45 ? 'bad reviews' : 'a critical mauling';
    E.log('🕹️ ' + p.name + ' launched on ' + p.plat + ' to ' + verdict + ' (' + sc + '/100) and sold ' + units.toLocaleString('en-US') + ' copies.', sc >= 75 ? 'good' : sc < 50 ? 'bad' : '');
    s.pending.push({ id: 'gd_launch', data: { name: p.name, score: sc, units: units, bugs: p.bugs, base: base, genre: p.genre, plat: p.plat, scope: p.scope } });
    if (sc >= 90 && p.scope !== 'small') s.pending.push({ id: 'gd_award', data: { name: p.name, score: sc } });
    if (yr() >= 2011 && sc >= 70 && U.chance(0.25)) s.pending.push({ id: 'gd_stream', data: { name: p.name } });
    w.proj = null;
    return earn;
  }
  function shipEarly() {
    var w = x(), p = w.proj;
    if (!p || p.prog < 60) return done(nope('It\'s not close enough to done (60%).'));
    ui().confirm('Ship ' + p.name + ' now?', 'It\'s ' + Math.round(p.prog) + '% done. Players will notice what\'s missing.', function () {
      var e = launch(true); if (e) addEarn(e); ui().closeAll(); done('I shipped ' + p.name + ' early. Here we go.');
    });
  }
  function addEarn(v) { var s = S(), w = x(); if (s.job && s.job.special === 'gamedev') w.pend = (w.pend || 0) + v; else E.addMoney(v); }

  // ------------------------------------------------------------ the year
  function year() {
    var s = S(), w = x(), m = me(); if (!w || w.retired) return 0;
    var earn = w.pend || 0; w.pend = 0;
    // Skills: practice keeps them sharp; age dulls the fast-moving tech side.
    if (m.age > 55) w.tech = cl(w.tech - U.rand(0, 2));
    var p = w.proj;
    if (p && !p.assigned) w.skill = grow(w.skill, 0.4);
    if (p) {
      var sp = SCOPE[p.scope], solo = w.stage === 'hobby' ? 0.6 : 1;
      p.prog = cl(p.prog + sp[1] * team(w) * solo * U.randf(0.85, 1.15));
      p.q = cl(p.q + (8 + w.skill / 8) * (w.stage === 'employed' ? 1.2 : 1) / SCALE[p.scope]);
      p.bugs = cl(p.bugs + U.rand(2, 6) - w.tech / 25);
      p.hype = cl(p.hype - 4);
      if (w.stage !== 'hobby' && p.prog < 100 && (p.scope === 'big' || p.scope === 'aaa') && U.chance(0.35) && !s.pending.some(function (q) { return q.id === 'gd_crunch'; })) s.pending.push({ id: 'gd_crunch', data: {} });
      if (w.stage !== 'employed' && p.scope !== 'small' && !p.pub && !p.funded && !p.offered && U.chance(0.45)) { p.offered = true; s.pending.push({ id: 'gd_publisher', data: {} }); }
      if (p.prog >= 100) earn += launch(false);
    }
    // Long tail: older games keep selling for a few years.
    w.games.forEach(function (g) { if (g.tail > 0 && g.y < yr()) { if (g.share) earn += Math.round(g.rev * [0, 0.05, 0.1, 0.25][g.tail] * g.share); g.tail--; } });
    if (w.stage === 'employed') {
      earn += E.$(role(w)[2]);
      var rn = role(w)[1]; if (w.roleName && rn !== w.roleName && ROLES.map(function (r) { return r[1]; }).indexOf(rn) > ROLES.map(function (r) { return r[1]; }).indexOf(w.roleName)) { E.log('📈 I was promoted to ' + rn.toLowerCase() + ' at ' + w.employer + '.', 'good'); E.stat('happy', 6); } w.roleName = rn;
      // Between my own pitches, the studio puts me on its next big game.
      if (!w.proj) { var pl = platforms(w), gs = genres(), gg = gs.slice().sort(function (a, b) { return fit(b[0], yr()) - fit(a[0], yr()); })[U.rand(0, Math.min(2, gs.length - 1))]; w.proj = { name: U.pick(W1) + ' ' + U.pick(W2), genre: gg[0], plat: U.pick(pl)[0], scope: maxScope(w), prog: U.rand(10, 40), q: 15, bugs: 15, hype: 15, start: yr(), share: 1, assigned: true }; E.log('🕹️ ' + w.employer + ' put me on the team making ' + w.proj.name + '.'); }
      if (w.flops >= 2 && U.chance(0.5)) { E.log('📦 After two flops in a row, ' + w.employer + ' let me go.', 'bad'); w.stage = 'indie'; w.employer = null; w.flops = 0; w.proj = null; setJob(w); }
      else if (U.chance(yr() >= 2023 ? 0.12 : 0.04) && !s.pending.some(function (q) { return q.id === 'gd_layoff'; })) s.pending.push({ id: 'gd_layoff', data: {} });
      if (yr() >= 2008 && w.proj && w.proj.scope !== 'small' && !w.proj.loot && U.chance(0.2)) s.pending.push({ id: 'gd_loot', data: {} });
    } else if (w.stage === 'owner') {
      var st = w.studio, cost = E.$(65000) * st.staff;
      earn -= cost; st.morale = cl(st.morale + (st.morale < 60 ? 4 : -1));
      if (w.rep >= 60 && U.chance(0.15) && !s.pending.some(function (q) { return q.id === 'gd_acquire'; })) s.pending.push({ id: 'gd_acquire', data: {} });
      if (yr() >= 2008 && w.proj && w.proj.scope !== 'small' && !w.proj.loot && U.chance(0.15)) s.pending.push({ id: 'gd_loot', data: {} });
    } else if (w.stage === 'indie' && p) earn -= E.$(2500); // tools, licenses, coffee (only while I'm actually making something)
    earn = Math.round(earn);
    w.earned = (w.earned || 0) + Math.max(0, earn);
    syncSp(w, Math.max(0, earn));
    if (s.job && s.job.special === 'gamedev') {
      s.job.company = w.stage === 'employed' ? w.employer : w.stage === 'owner' ? w.studio.name : 'Self-published';
      if (earn < 0) { E.addMoney(earn); E.log('💸 ' + (w.stage === 'owner' ? w.studio.name + ' lost ' : 'Making games cost me ') + E.fmt(-earn) + ' this year.', 'bad'); earn = 0; }
      s.job.salary = earn;
    } else if (earn > 0) E.addMoney(earn);
    return earn;
  }
  // The job ended some other way (quit, fired, prison): step away from game development.
  function left() { var s = S(), w = s.gd; if (!w || w.retired || w.stage === 'hobby') return; w.retired = yr(); w.proj = null; var sp = s.sp && s.sp.gamedev; if (sp) sp.retired = yr(); }
  // Kids making games after school (called every year from js/engine.js).
  function youthYear() {
    var s = S(), w = s.gd; if (!w || w.retired) return;
    // Left game development some other way (quit, another job, prison): I've stepped away.
    if (w.stage !== 'hobby' && !(s.job && s.job.special === 'gamedev')) { w.retired = yr(); w.proj = null; var sp = s.sp && s.sp.gamedev; if (sp) sp.retired = yr(); return; }
    if (w.stage !== 'hobby' || (s.job && s.job.special === 'gamedev')) return;
    if (me().age >= 16 && !w.told) { w.told = true; E.log('🕹️ I\'m old enough to make games for a living now.'); }
    year();
  }

  // ------------------------------------------------------------ events
  function def(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  def('gd_launch', { build: function (d) {
    var w = S().gd; if (!w) return null;
    var ch = [];
    if (d.bugs >= 40) ch.push({ label: 'Work all weekend on a day-one patch', run: function () { E.stat('health', -5); w.rep = cl(w.rep + 2); w.fans = Math.round(w.fans * 1.05); return good('The patch fixed the worst of it. Players noticed the effort.'); } });
    if (d.score >= 80 && w.stage !== 'hobby') ch.push({ label: 'Start on ' + d.base + (w.franchises[d.base] ? ' ' + (w.franchises[d.base].n + 1) : ' 2') + ' right away', run: function () { if (w.proj) return 'I\'m already busy with another game.'; var n = w.franchises[d.base].n + 1; w.proj = { name: d.base + ' ' + n, genre: d.genre, plat: d.plat, scope: d.scope, prog: 0, q: 10, bugs: 10, hype: 30, seq: d.base, num: n, start: yr(), share: 1 }; return good('The sequel is officially in development. The fans are already theorizing.'); } });
    ch.push({ label: d.score >= 75 ? 'Celebrate with the team' : 'Read every review and take notes', run: function () { if (d.score >= 75) { E.stat('happy', 6); return good('We celebrated until sunrise.'); } w.skill = cl(w.skill + 3); return 'Some of it stung. Most of it was fair. I\'ll be better next time.'; } });
    return { icon: d.score >= 85 ? '🏆' : d.score >= 60 ? '🕹️' : '📉', title: d.name + ' is out', text: 'Reviews are in: ' + d.score + '/100. ' + d.units.toLocaleString('en-US') + ' copies sold at launch.' + (d.bugs >= 40 ? ' Players are posting clips of the bugs.' : ''), choices: ch };
  } });
  def('gd_award', { build: function (d) {
    var w = S().gd; if (!w) return null;
    var aw = award(), win = U.chance(cl((d.score - 88) * 8 + 10, 5, 80) / 100);
    return { icon: '🏆', title: 'Game of the Year?', text: d.name + ' is nominated for Game of the Year at ' + aw + '.', choices: [{ label: 'Go to the ceremony', run: function () {
      if (!win) { E.stat('happy', 2); return 'We didn\'t win, but being nominated felt like winning. Almost.'; }
      w.awards.push({ y: yr(), name: d.name, what: 'Game of the Year · ' + aw.replace(/^the /, '') }); w.rep = cl(w.rep + 6); E.fame(4); E.stat('happy', 15);
      var sp = S().sp && S().sp.gamedev; if (sp) { sp.honors = sp.honors || []; sp.honors.push('Game of the Year (' + yr() + ')'); }
      E.log('🏆 ' + d.name + ' won Game of the Year at ' + aw + '!', 'good'); return good('🏆 GAME OF THE YEAR. I forgot my whole speech.');
    } }] };
  } });
  def('gd_stream', { build: function (d) {
    var w = S().gd; if (!w) return null;
    return { icon: '📺', title: 'Going viral', text: 'One of the biggest streamers in the world played ' + d.name + ' live for six hours.', choices: [{ label: 'Watch the stream', run: function () { var g = w.games.filter(function (q) { return q.name === d.name; }).slice(-1)[0]; if (g) { var bonus = Math.round(g.rev * 0.3); g.rev += bonus; if (g.share) addEarn(Math.round(bonus * g.share * 0.5)); } w.fans = Math.round(w.fans * 1.3 + 2000); E.stat('happy', 5); return good('Sales spiked overnight. The chat loved the secret boss.'); } }] };
  } });
  def('gd_crunch', { build: function () {
    var w = S().gd; if (!w || !w.proj) return null; var p = w.proj;
    return { icon: '⏰', title: 'Crunch time', text: p.name + ' is behind schedule. ' + (w.stage === 'owner' ? 'I could push the team to crunch.' : 'Management wants everyone in on weekends.'), choices: [
      { label: 'Crunch: nights and weekends', run: function () { p.prog = cl(p.prog + 20); p.bugs = cl(p.bugs + 8); E.stat('health', -8); E.stat('happy', -6); if (w.studio) w.studio.morale = cl(w.studio.morale - 15); if (U.chance(0.2)) { w.rep = cl(w.rep - 3); return bad('We hit the milestone, but a story about our crunch went viral.'); } return 'We hit the milestone. Everyone is exhausted.'; } },
      { label: 'Delay the game', run: function () { p.hype = cl(p.hype - 6); p.q = cl(p.q + 6); if (w.studio) w.studio.morale = cl(w.studio.morale + 6); return good('We announced a delay. "A delayed game is eventually good," someone wrote.'); } },
      { label: 'Cut features to make the date', run: function () { p.prog = cl(p.prog + 15); p.q = cl(p.q - 8); return 'We cut two levels and a whole crafting system. It\'ll ship on time.'; } }
    ] };
  } });
  def('gd_publisher', { build: function () {
    var w = S().gd; if (!w || !w.proj) return null; var p = w.proj, adv = E.$(SCOPE[p.scope][2] * SCOPE[p.scope][3] * 0.06 * (0.6 + w.rep / 100));
    var pub = U.pick(live([['Activision', 1979, 9999], ['Electronic Arts', 1983, 9999], ['Ubisoft', 1986, 9999], ['Devolver Digital', 2009, 9999], ['Annapurna Interactive', 2016, 9999], ['Sega', 1983, 9999]])) || ['a publisher'];
    return { icon: '🤝', title: 'Publishing deal', text: pub[0] + ' wants to publish ' + p.name + ': ' + E.fmt(adv) + ' up front, and they keep half of the sales.', choices: [
      { label: 'Sign (' + E.fmt(adv) + ' advance)', run: function () { p.pub = pub[0]; p.share = 0.5; p.hype = cl(p.hype + 20); E.addMoney(adv); return good('Signed with ' + pub[0] + '. Their marketing team is already making a trailer.'); } },
      { label: 'Stay independent', run: function () { p.pub = 'self'; w.rep = cl(w.rep + 1); return 'I keep every cent, and every risk.'; } }
    ] };
  } });
  def('gd_loot', { build: function () {
    var w = S().gd; if (!w || !w.proj) return null; var p = w.proj;
    return { icon: '🎰', title: 'Monetization meeting', text: (w.stage === 'owner' ? 'Our investors' : 'The executives') + ' want loot boxes and a battle pass in ' + p.name + '.', choices: [
      { label: 'Add them', run: function () { p.loot = true; p.share = (p.share || 1) * 1.4; p.q = cl(p.q - 6); w.rep = cl(w.rep - 3); return 'The spreadsheets look amazing. The forums do not.'; } },
      { label: 'Push back', run: function () { p.loot = 'no'; if (w.stage === 'employed' && U.chance(0.4)) { w.rep = cl(w.rep - 1); return bad('I lost that fight. They\'re adding them anyway, and my name is on the game.'); } w.rep = cl(w.rep + 2); return good('No loot boxes. Players will remember that.'); } }
    ] };
  } });
  def('gd_layoff', { build: function () {
    var w = S().gd; if (!w || w.stage !== 'employed') return null;
    var safe = U.chance(0.35 + w.rep / 150);
    return { icon: '📦', title: 'Layoffs', text: w.employer + ' announced layoffs across the company. My team is in a meeting with HR at 9 AM.', choices: [{ label: 'Go to the meeting', run: function () {
      if (safe) { E.stat('happy', -4); return 'I kept my job. Half my team didn\'t. Lunch is very quiet now.'; }
      E.log('📦 I was laid off from ' + w.employer + '.', 'bad'); w.stage = 'indie'; w.employer = null; w.proj = null; setJob(w); E.stat('happy', -12);
      return bad('I was laid off, along with hundreds of others. Time to go indie.');
    } }] };
  } });
  def('gd_acquire', { build: function () {
    var w = S().gd; if (!w || w.stage !== 'owner') return null; var st = w.studio;
    var buyer = U.pick(live([['Microsoft', 1990, 9999], ['Sony', 1995, 9999], ['Electronic Arts', 1983, 9999], ['Tencent', 2010, 9999], ['Embracer', 2017, 2023], ['Activision', 1979, 9999]])) || ['a big publisher'];
    var price = E.$(Math.round((1 + st.staff * 0.4) * 1e6 * (0.5 + w.rep / 60) * (1 + w.games.filter(function (g) { return g.score >= 85; }).length * 0.3)));
    return { icon: '💼', title: 'Acquisition offer', text: buyer[0] + ' wants to buy ' + st.name + ' for ' + E.fmt(price) + '. I\'d stay on as creative director.', choices: [
      { label: 'Sell the studio', run: function () { E.addMoney(price); E.log('💼 I sold ' + st.name + ' to ' + buyer[0] + ' for ' + E.fmt(price) + '.', 'good'); w.stage = 'employed'; w.employer = buyer[0]; w.studio = null; w.rep = Math.max(w.rep, 80); setJob(w); return good('Sold. I\'m rich, and I have a boss again.'); } },
      { label: 'Stay independent', run: function () { st.morale = cl(st.morale + 10); return 'We\'re not for sale. The team cheered.'; } }
    ] };
  } });

  // ------------------------------------------------------------ retire
  function retire() {
    var w = x(), s = S(); w.retired = yr();
    var hits = w.games.filter(function (g) { return g.score >= 90; }).length;
    if (!w.hof && yr() >= 1998 && (w.awards.length >= 2 || hits >= 4 || (w.awards.length >= 1 && w.rep >= 95))) { w.hof = yr(); E.log('🏛️ I was inducted into the Academy of Interactive Arts & Sciences Hall of Fame.', 'good'); E.fame(5); }
    var sp = s.sp && s.sp.gamedev; if (sp) sp.retired = yr();
    if (s.job && s.job.special === 'gamedev') E.quitJob(true);
  }

  // ------------------------------------------------------------ screens
  function bar(l, v) { return '<div class="minibar wide"><span>' + l + ' ' + Math.round(v) + '</span><span class="track"><span class="fill ' + (v >= 75 ? 'hi' : v >= 45 ? 'mid' : 'lo') + '" style="width:' + Math.max(2, Math.min(100, v)) + '%"></span></span></div>'; }
  function card(w) {
    var best = w.games.reduce(function (b, g) { return !b || g.score > b.score ? g : b; }, null);
    return '<div class="kv"><b>' + U.esc(title()) + '</b>' + (w.employer ? ' · ' + U.esc(w.employer) : w.studio ? ' · ' + U.esc(w.studio.name) + ' (' + (w.studio.staff === 1 ? '1 person' : w.studio.staff + ' people') + ', morale ' + Math.round(w.studio.morale) + ')' : '') + '<br>' +
      bar('Design', w.skill) + bar('Tech', w.tech) + bar('Reputation', w.rep) +
      '<p class="small">' + U.plural(w.games.length, 'game') + ' shipped · ' + Math.round(w.fans).toLocaleString('en-US') + ' fans' + (best ? '<br>Best: ' + U.esc(best.name) + ' (' + best.score + '/100, ' + best.y + ')' : '') + (w.awards.length ? '<br>🏆 ' + w.awards.map(function (a) { return U.esc(a.name) + ' (' + a.y + ')'; }).join(', ') : '') + '</p></div>';
  }
  function projCard(p) {
    return '<div class="kv"><b>' + U.esc(p.name) + '</b> · ' + p.genre + ' · ' + p.plat + '<br><span class="small muted">' + SCOPE[p.scope][0] + (p.pub && p.pub !== 'self' ? ' · published by ' + p.pub : '') + (p.ea ? ' · in Early Access' : '') + (p.funded ? ' · crowdfunded' : '') + '</span>' +
      bar('Progress', p.prog) + bar('Quality', p.q) + bar('Bugs', p.bugs) + bar('Hype', p.hype) + '</div>';
  }
  function menu() {
    ui().menu('🕹️ Game development', function () {
      var w = S().gd, s = S(), j = s.job, items = [], y = yr();
      var on = w && !w.retired && (w.stage === 'hobby' || (j && j.special === 'gamedev'));
      if (!on) {
        items.push({ info: true, html: '<p class="muted">Make games after school, go indie, work at a real studio or found your own. ' + (y < 1977 ? 'The home video game industry doesn\'t exist yet.' : '') + '</p>' });
        if (w && w.retired) { items.push({ info: true, html: card(w) }); items.push({ icon: '📜', label: 'My games', onClick: history }); }
        items.push({ icon: '🕹️', label: w && w.retired ? 'Come back to making games' : me().age < 16 ? 'Start making games' : 'Start making games for a living', sub: y < 1977 ? 'From 1977' : me().age < 10 ? 'Age 10+' : 'Hobby, indie, studios', disabled: y < 1977 || me().age < 10, onClick: start });
        return items;
      }
      items.push({ info: true, html: card(w) });
      var p = w.proj, wk = count('gdwork') >= 3;
      items.push({ section: p ? 'Current project' : 'Projects' });
      if (!p) {
        items.push({ icon: '💡', label: w.stage === 'employed' ? 'Pitch a new game' : 'Start a new game', sub: 'Up to ' + SCOPE[maxScope(w)][0].toLowerCase(), disabled: count('gdpitch') > 0, onClick: function () { newGame(null); } });
        Object.keys(w.franchises).filter(function (k) { return w.franchises[k].best >= 70; }).slice(-2).forEach(function (k) {
          var f = w.franchises[k]; items.push({ icon: '🔁', label: 'Make ' + k + ' ' + (f.n + 1), sub: 'Sequel · best so far ' + f.best + '/100', disabled: count('gdpitch') > 0, onClick: function () { newGame({ name: k + ' ' + (f.n + 1), base: k, genre: f.genre, num: f.n + 1 }); } });
        });
      } else {
        items.push({ info: true, html: projCard(p) });
        items.push({ icon: '✏️', label: 'Design sessions', sub: 'Make it more fun · design ' + Math.round(w.skill), disabled: wk, onClick: function () { work('design'); } });
        items.push({ icon: '⌨️', label: 'Code through the night', sub: 'Faster progress, new bugs', disabled: wk, onClick: function () { work('code'); } });
        items.push({ icon: '🐞', label: 'Bug-fixing week', sub: 'Less jank', disabled: wk, onClick: function () { work('bugs'); } });
        items.push({ icon: '📣', label: w.stage === 'employed' ? 'Talk to the gaming press' : 'Marketing campaign', sub: 'Build hype · once a year', disabled: count('gdmkt') > 0, onClick: market });
        if (w.stage !== 'hobby') items.push({ icon: '🎪', label: 'Show a demo at ' + show(), sub: p.prog < 30 ? 'Needs 30% progress' : 'Hype, and you never know who stops by', disabled: count('gdshow') > 0 || p.prog < 30, onClick: showcase });
        if (y >= 2009 && (w.stage === 'indie' || w.stage === 'owner') && p.scope !== 'small') items.push({ icon: '💰', label: 'Launch a Kickstarter', sub: p.funded ? 'Already crowdfunded' : 'Money now, backers to answer to', disabled: !!p.funded, onClick: crowdfund });
        if (y >= 2013 && (w.stage === 'indie' || w.stage === 'owner') && p.plat === 'PC') items.push({ icon: '🧪', label: 'Release in Early Access', sub: p.ea ? 'Already in Early Access' : 'Needs 50% · feedback and some sales', disabled: !!p.ea || p.prog < 50, onClick: earlyAccess });
        if (w.stage !== 'employed') items.push({ icon: '🚀', label: 'Ship it now', sub: p.prog >= 100 ? 'Ready' : p.prog >= 60 ? 'Ship early (' + Math.round(p.prog) + '% done)' : 'Needs 60%', disabled: p.prog < 60, onClick: shipEarly });
        items.push({ icon: '🗑️', label: 'Cancel this project', danger: true, onClick: cancel });
      }
      if (w.stage === 'hobby' && me().age >= 16) { items.push({ section: 'Career' }); items.push({ icon: '🚀', label: 'Make games for a living', sub: 'Go indie, then apply to studios', onClick: function () { w.stage = 'indie'; setJob(w); E.log('🕹️ I\'m making games for a living now.', 'good'); ui().closeAll(); done(toast('I\'m officially an indie developer.')); } }); }
      if (w.stage !== 'hobby') {
        items.push({ section: 'Career' });
        if (w.stage !== 'employed' && w.stage !== 'owner') studiosOpen(w).filter(function (st) { return st[3] <= w.rep + 15; }).slice(-4).forEach(function (st) { items.push({ icon: '🏢', label: 'Apply to ' + st[0], sub: st[3] > w.rep ? 'A stretch · reputation ' + st[3] + '+' : 'They\'re hiring', disabled: count('gdapply') > 0, onClick: function () { apply(st); } }); });
        if (w.stage === 'employed') items.push({ icon: '🚪', label: 'Leave ' + w.employer + ' and go indie', onClick: function () { ui().confirm('Go indie?', 'No salary, total freedom.', quitStudio); } });
        if (w.stage !== 'owner') items.push({ icon: '🏢', label: 'Found my own studio', sub: w.rep < 30 ? 'Needs reputation 30' : E.fmt(E.$(60000)) + ' to start', disabled: w.rep < 30 || w.stage === 'employed', onClick: found });
        if (w.stage === 'owner') {
          items.push({ icon: '🧑‍💻', label: 'Hire 5 developers', sub: E.fmt(E.$(65000) * 5) + '/yr more payroll', disabled: count('gdhire') >= 2, onClick: function () { staff(5); } });
          items.push({ icon: '📦', label: 'Lay off 5 people', sub: 'Cuts costs, hurts morale', danger: true, disabled: w.studio.staff <= 1, onClick: function () { staff(-5); } });
        }
      }
      items.push({ section: 'History' });
      items.push({ icon: '📜', label: 'My games', sub: U.plural(w.games.length, 'game'), onClick: history });
      if (w.stage !== 'hobby') items.push({ icon: '🏳️', label: 'Retire from making games', danger: true, onClick: function () { ui().confirm('Retire?', 'Save and quit, for good?', function () { retire(); ui().closeAll(); done('I shipped my last game.'); }); } });
      return items;
    });
  }
  function history() {
    ui().menu('My games', function () {
      var w = S().gd, items = [{ info: true, html: card(w) }];
      if (w.hof) items.push({ info: true, html: '<p class="small">🏛️ AIAS Hall of Fame (' + w.hof + ')</p>' });
      if (!w.games.length) items.push({ info: true, html: '<p class="muted">Nothing shipped yet.</p>' });
      w.games.slice().reverse().forEach(function (g) { items.push({ icon: g.score >= 90 ? '🏆' : g.score >= 75 ? '⭐' : g.score >= 50 ? '🕹️' : '📉', label: g.name + ' (' + g.y + ')', sub: g.genre + ' · ' + g.plat + ' · ' + g.score + '/100 · ' + g.units.toLocaleString('en-US') + ' sold', right: g.at === 'self-published' ? '' : g.at }); });
      return items;
    });
  }
  function summary() { var w = S().gd; return !w ? 'Game jams, indie hits, real studios, your own studio · 1977+' : w.retired ? 'Retired · ' + U.plural(w.games.length, 'game') + (w.awards.length ? ' · ' + U.plural(w.awards.length, 'award') : '') : title() + (w.employer ? ' · ' + w.employer : w.studio ? ' · ' + w.studio.name : ''); }
  return { menu: menu, year: year, youthYear: youthYear, left: left, title: title, summary: summary, history: history, retire: retire, score: score, fit: fit, platforms: platforms, SCOPE: SCOPE };
})();
