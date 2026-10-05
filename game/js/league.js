/* TheLife — league.js
 * A simulated NBA and WNBA. History before the league starts is real
 * (js/nba.js); from the first season I play in it (or from 2026, where the
 * real data ends) the league runs on its own:
 *  - every team has a roster of rated players, seeded from the real stars of
 *    that season (rated by how great they really became) plus role players;
 *  - each offseason players develop, peak, decline and retire; a lottery
 *    draft brings in new prospects; free agents re-sign or chase contenders;
 *    stars on bad teams get traded; now and then the league expands;
 *  - each season, team ratings decide the standings, playoff series are
 *    played game by game, and MVP, Rookie of the Year and Finals MVP go to
 *    whoever earned them (me included).
 * My own deciding playoff games pause the bracket until I take the last shot.
 * State: S().lg.M / S().lg.F.
 */
TL.league = (function () {
  var U = TL.util;
  function S() { return TL.S; }
  function E() { return TL.engine; }
  function raw() { return TL.nba._raw; }
  function st(g) { var s = S(); return s && s.lg && s.lg[g] || null; }
  function lgName(g) { return g === 'F' ? 'WNBA' : 'NBA'; }
  function active(g, y) { var L = st(g); return !!(L && y >= L.start); }
  var EAST = { M: ['atl', 'bos', 'bkn', 'cha', 'chi', 'cle', 'det', 'ind', 'mia', 'mil', 'nyk', 'orl', 'phi', 'tor', 'was'], F: ['atl', 'chi', 'con', 'ind', 'nyl', 'was', 'tor', 'cha', 'cle', 'mia'] };
  var EXPANSION = { M: [['sea', 'Seattle SuperSonics'], ['lv', 'Las Vegas Gamblers'], ['mex', 'Mexico City Capitanes'], ['van', 'Vancouver Grizzlies'], ['kc', 'Kansas City Monarchs'], ['nash', 'Nashville Stars'], ['lou', 'Louisville Colonels'], ['mtl', 'Montreal Royals'], ['pit', 'Pittsburgh Condors'], ['sd', 'San Diego Waves']], F: [['phl', 'Philadelphia Liberty Belles'], ['den', 'Denver Peaks'], ['nsh', 'Nashville Sound'], ['bos', 'Boston Shamrocks'], ['hou', 'Houston Comets'], ['sac', 'Sacramento Monarchs'], ['stl', 'St. Louis Arch'], ['mia', 'Miami Sol']] };
  var POS = ['PG', 'SG', 'SF', 'PF', 'C'];
  var ORIGINS = ['United States', 'United States', 'United States', 'United States', 'Canada', 'France', 'Spain', 'Nigeria', 'Serbia', 'Australia', 'Germany', 'Greece', 'Slovenia', 'Brazil'];

  // ------------------------------------------------------------ people
  function newName(g) { var c = U.pick(ORIGINS), nm = E().randomName(g, null, c); return nm.first + ' ' + nm.last; }
  // Ratings follow a career arc: rising to a peak at 27-31, then falling.
  function arc(pot, age) { return Math.round(age < 27 ? pot - (27 - age) * 1.6 : age > 31 ? pot - (age - 31) * 2.2 : pot); }
  function player(L, o) { var p = { n: o.n || newName(L.g), a: o.a, o: U.clamp(Math.round(o.o), 40, 99), p: U.clamp(Math.round(o.p), 40, 99), pos: o.pos || U.pick(POS), t: o.t, c: o.c || U.rand(1, 4) }; if (o.r) p.r = 1; if (o.rk) p.rk = o.rk; L.pl.push(p); return p; }
  function roster(L, fid) { return L.pl.filter(function (p) { return p.t === fid; }).sort(function (a, b) { return b.o - a.o; }); }
  function fidOf(L, name) { var hit = null; Object.keys(L.teams).forEach(function (f) { if (L.teams[f].n === name) hit = f; }); return hit; }
  function myName() { var m = S().me; return m.first + ' ' + m.last; }
  // Me, if I'm playing in this league right now.
  function meIn(g) {
    var x = S().hoops, L = st(g);
    if (!L || !x || x.stage !== 'pro' || x.league !== lgName(g) || S().me.gender !== g) return null;
    var f = fidOf(L, x.team); return f ? { t: f, o: x.ovr + (x.lgBoost || 0), n: myName(), me: true, a: S().me.age } : null;
  }

  // ------------------------------------------------------------ seeding
  // Start the simulated league at season y, from that season's real rosters
  // (or the latest real ones we have).
  function begin(g, y) {
    var R = raw(), sy = Math.min(y, R.LAST_ROSTER), s = S();
    s.lg = s.lg || {};
    var L = s.lg[g] = { g: g, start: sy, year: sy - 1, teams: {}, pl: [], hist: {}, moves: [], exp: 0 };
    var tab = R.table(g), mv = R.mvps(g), count = {};
    Object.keys(mv).forEach(function (yr) { count[mv[yr]] = (count[mv[yr]] || 0) + 1; });
    Object.keys(tab).forEach(function (f) { var n = R.nameIn(tab[f], sy); if (n && !Object.keys(L.teams).some(function (k) { return L.teams[k].n === n; })) L.teams[f] = { n: n, c: EAST[g].indexOf(f) >= 0 ? 'East' : 'West', rec: {} }; });
    // From 2025 on, the whole league is the real 2025-26 rosters (js/nbarosters.js).
    var real = g === 'M' && sy >= 2025 && TL.nbaRosters ? TL.nbaRosters.all() : null;
    if (real) Object.keys(real).forEach(function (f) {
      if (!L.teams[f]) return;
      real[f].forEach(function (q) {
        var a = q.a - (TL.nbaRosters.SEASON - sy), up = a < 23 ? U.rand(4, 10) : a < 26 ? U.rand(1, 5) : 0;
        player(L, { n: q.n, a: a, o: q.o, p: q.o + up, pos: q.pos, t: f, r: q.o >= 84 ? 1 : 0, c: U.rand(1, 4) });
      });
    });
    // Before that: real stars on their real teams, rated by how great they really were.
    if (!real) R.stars(g).forEach(function (sp) {
      var name = sp[0], spans = sp.slice(1), cur = spans.filter(function (q) { return sy >= q[1] && sy <= q[2]; })[0];
      if (!cur || !L.teams[cur[0]]) return;
      var first = Math.min.apply(null, spans.map(function (q) { return q[1]; })), age = 20 + (sy - first);
      var pot = Math.min(97, (count[name] ? 90 + count[name] * 2 : U.rand(85, 89)));
      player(L, { n: name, a: age, o: arc(pot, age) + U.rand(-1, 1), p: Math.max(pot, arc(pot, age)), t: cur[0], r: 1, c: U.rand(1, 4) });
    });
    // Everyone else: role players around a team's own level.
    Object.keys(L.teams).forEach(function (f) {
      var base = U.rand(68, 75), have = roster(L, f).length;
      for (var i = have; i < 13; i++) { var a = U.rand(20, 33), o = base + U.rand(-10, 5) - i * 0.6; player(L, { a: a, o: o, p: Math.max(o, o + (a < 25 ? U.rand(2, 10) : 0)), t: f }); }
    });
    return L;
  }
  // Make sure seasons through y have been played (only up to the current year).
  function ensure(g, y) {
    var L = st(g), s = S(); if (!s) return null;
    y = Math.min(y, s.year);
    if (!L) { if (y <= raw().LAST_REAL) return null; L = begin(g, raw().LAST_REAL + 1); }
    var guard = 0;
    while (L.year < y && guard++ < 200) { if (L.wait) finish(L, U.chance(0.5)); season(L, L.year + 1, {}); }
    return L;
  }

  // ------------------------------------------------------------ ratings
  var W = [0.25, 0.2, 0.16, 0.12, 0.1, 0.08, 0.05, 0.04];
  function rating(L, f, me) {
    var os = roster(L, f).map(function (p) { return p.o; });
    if (me && me.t === f) os.push(me.o);
    os.sort(function (a, b) { return b - a; });
    var r = 0; for (var i = 0; i < 8; i++) r += (os[i] || 55) * W[i];
    return r;
  }
  function ratings(L, me) {
    var by = {}, o = {};
    L.pl.forEach(function (p) { (by[p.t] = by[p.t] || []).push(p.o); });
    if (me) (by[me.t] = by[me.t] || []).push(me.o);
    Object.keys(L.teams).forEach(function (f) { var os = (by[f] || []).sort(function (a, b) { return b - a; }), r = 0; for (var i = 0; i < 8; i++) r += (os[i] || 55) * W[i]; o[f] = r; });
    return o;
  }
  // A team's strength on the 25-75 scale js/hoops.js uses for "contender" and friends.
  function quality(g, name) {
    var L = st(g); if (!L) return null;
    var f = fidOf(L, name); if (!f) return null;
    var me = meIn(g), rs = ratings(L, me), avg = mean(rs);
    return U.clamp(Math.round(50 + (rs[f] - avg) * 4.5), 25, 75);
  }
  function mean(o) { var k = Object.keys(o); return k.reduce(function (t, f) { return t + o[f]; }, 0) / (k.length || 1); }

  // ------------------------------------------------------------ offseason
  function offseason(L, y) {
    var g = L.g, H = L.hist[y] = L.hist[y] || {}, moves = [];
    var last = L.hist[y - 1] || {}, pct = {};
    Object.keys(L.teams).forEach(function (f) { var r = L.teams[f].rec[y - 1]; pct[f] = r ? r[0] / (r[0] + r[1]) : 0.5; });
    // Development, decline and retirement.
    for (var i = L.pl.length - 1; i >= 0; i--) {
      var p = L.pl[i]; p.a++;
      var dev = p.a <= 22 ? U.rand(1, 5) : p.a <= 26 ? U.rand(0, 3) : p.a <= 30 ? U.rand(-1, 1) : p.a <= 33 ? U.rand(-3, 0) : U.rand(-5, -1);
      p.o = U.clamp(Math.min(p.o + dev, Math.max(p.p, p.o)), 40, 99);
      if (p.a > 30) p.p = Math.min(p.p, p.o + 1);
      var quit = (p.a >= 35 && U.chance(0.3 + (p.a - 35) * 0.15)) || (p.a >= 30 && p.o < 60 && U.chance(0.5)) || p.a >= 41;
      if (quit) { if (p.o >= 82 || p.r) (H.retired = H.retired || []).push(p.n); L.pl.splice(i, 1); }
    }
    // Expansion, now and then.
    var cap = g === 'F' ? 18 : 32, nT = Object.keys(L.teams).length;
    if (nT < cap && y - (L.exp || L.start) >= 8 && U.chance(0.12)) {
      var pick = EXPANSION[g].filter(function (e) { return !L.teams[e[0]] && !Object.keys(L.teams).some(function (k) { return L.teams[k].n === e[1]; }); })[0];
      if (pick) {
        var east = Object.keys(L.teams).filter(function (k) { return L.teams[k].c === 'East'; }).length;
        L.teams[pick[0]] = { n: pick[1], c: east * 2 < nT ? 'East' : 'West', rec: {}, born: y }; L.exp = y;
        // Expansion draft: one unprotected player from each of up to ten teams.
        U.shuffle(Object.keys(L.teams).filter(function (k) { return k !== pick[0]; })).slice(0, 10).forEach(function (k) { var r = roster(L, k); if (r[8]) r[8].t = pick[0]; });
        moves.push('🆕 The league expanded: welcome the ' + pick[1] + '!');
      }
    }
    // Free agency: expiring deals re-sign, or chase money and rings.
    var rs = ratings(L), order = Object.keys(L.teams).sort(function (a, b) { return rs[b] - rs[a]; });
    L.pl.forEach(function (p) {
      p.c--;
      if (p.c > 0) return;
      p.c = U.rand(1, 5);
      var stay = U.chance(p.o >= 84 && pct[p.t] < 0.45 ? 0.35 : 0.6);
      if (stay) return;
      var to = p.o >= 82 ? U.pick(order.slice(0, 8)) : U.pick(Object.keys(L.teams));
      if (to !== p.t) { if (p.o >= 82) moves.push('✍️ ' + p.n + ' signed with the ' + L.teams[to].n + '.'); p.t = to; }
    });
    // Trades: stars on losing teams get moved to contenders.
    L.pl.filter(function (p) { return p.o >= 84 && pct[p.t] < 0.4; }).forEach(function (p) {
      if (!U.chance(0.25)) return;
      var to = U.pick(order.slice(0, 10).filter(function (f) { return f !== p.t && pct[f] >= 0.5; }));
      if (!to) return;
      var back = roster(L, to).slice(3, 5), from = p.t;
      back.forEach(function (q) { q.t = from; }); p.t = to;
      moves.push(('🔁 ' + p.n + ' was traded to the ' + L.teams[to].n + (back.length ? ' for ' + back.map(function (q) { return q.n; }).join(' and ') : '')).replace(/\.?$/, '.'));
    });
    // The draft: worst teams pick first, top four by lottery.
    var dorder = Object.keys(L.teams).sort(function (a, b) { return pct[a] - pct[b]; });
    var lot = U.shuffle(dorder.slice(0, Math.min(6, dorder.length))).slice(0, 4);
    dorder = lot.concat(dorder.filter(function (f) { return lot.indexOf(f) < 0; }));
    dorder.forEach(function (f, i) {
      var gen = i === 0 && U.chance(0.06), o = (g === 'F' ? 72 : 74) - i * 0.45 + U.rand(-4, 4), pot = o + U.rand(6, 20) + (gen ? 8 : 0);
      var p = player(L, { a: U.rand(19, 22), o: o, p: Math.min(98, pot), t: f, rk: y, c: 4 });
      if (i === 0) { H.top = p.n; H.topTeam = L.teams[f].n; }
    });
    // Rosters: trim to 15, fill to 13.
    Object.keys(L.teams).forEach(function (f) {
      var r = roster(L, f);
      r.slice(15).forEach(function (p) { var k = L.pl.indexOf(p); if (k >= 0) L.pl.splice(k, 1); });
      for (var i = r.length; i < 13; i++) { var a = U.rand(22, 32), o = U.rand(58, 69); player(L, { a: a, o: o, p: o + (a < 25 ? U.rand(0, 6) : 0), t: f }); }
    });
    H.moves = moves.slice(0, 8);
    // Old seasons keep just the champion and the awards.
    var old = L.hist[y - 6]; if (old) { delete old.moves; delete old.retired; delete old.topTeam; delete old.best; delete old.bestRec; }
  }

  // ------------------------------------------------------------ the season
  function series(ra, rb, n, home) {
    var wa = 0, wb = 0, need = Math.ceil(n / 2);
    while (wa < need && wb < need) { var pa = 1 / (1 + Math.exp(-(ra - rb) / 3.2)) + (home ? 0.03 : -0.03); if (U.chance(pa)) wa++; else wb++; }
    return { a: wa, b: wb };
  }
  function bestOf(g, round, rounds) { return g === 'F' ? (round === 0 ? 3 : round === rounds - 1 ? 7 : 5) : 7; }
  var BRACKET = [0, 7, 3, 4, 2, 5, 1, 6];
  function season(L, y, opts) {
    var g = L.g, gp = g === 'F' ? (y >= 2025 ? 44 : y >= 2003 ? 34 : 32) : 82;
    if (y > L.start) offseason(L, y); else L.hist[y] = L.hist[y] || {};
    L.year = y;
    var me = meIn(g), rs = ratings(L, me), avg = mean(rs), fids = Object.keys(L.teams), H = L.hist[y];
    // Regular season.
    var wins = {};
    fids.forEach(function (f) { var p = U.clamp(0.5 + (rs[f] - avg) * 0.036, 0.16, 0.84); wins[f] = U.clamp(Math.round(gp * p + U.gauss(0, 3)), 4, gp - 4); });
    var off = (fids.reduce(function (t, f) { return t + wins[f]; }, 0) - fids.length * gp / 2) / fids.length;
    fids.forEach(function (f) { wins[f] = U.clamp(Math.round(wins[f] - off), 2, gp - 2); L.teams[f].rec[y] = [wins[f], gp - wins[f], -1]; var ks = Object.keys(L.teams[f].rec).map(Number).sort(); while (ks.length > 15) delete L.teams[f].rec[ks.shift()]; });
    var byW = function (a, b) { return wins[b] - wins[a] || rs[b] - rs[a]; };
    // Playoffs: eight per conference (four in a small league); the WNBA seeds its top eight overall.
    var groups;
    if (g === 'F') groups = [fids.slice().sort(byW).slice(0, Math.min(8, fids.length - (fids.length % 2)))];
    else {
      var e = fids.filter(function (f) { return L.teams[f].c === 'East'; }).sort(byW), w = fids.filter(function (f) { return L.teams[f].c !== 'East'; }).sort(byW), k = Math.min(e.length, w.length) >= 12 ? 8 : 4;
      groups = [e.slice(0, k), w.slice(0, k)];
    }
    groups = groups.map(function (gr) { return (gr.length === 8 ? BRACKET : [0, 3, 1, 2]).map(function (i) { return gr[i]; }).filter(Boolean); });
    var conf = groups.length > 1, rounds = Math.round(Math.log(groups[0].length) / Math.LN2) + (conf ? 1 : 0);
    var meRookie = !!(me && !(S().hoops.seasons || []).some(function (q) { return q.league === lgName(g); }));
    L.po = { y: y, groups: groups, r: 0, rounds: rounds, conf: conf, me: me ? me.t : null, meRookie: meRookie, rs: rs, wins: wins, clutch: !!(opts && opts.clutch), out: {} };
    H.best = fids.slice().sort(byW)[0]; H.bestRec = wins[H.best] + '-' + (gp - wins[H.best]);
    play(L);
    return L;
  }
  // Play the bracket round by round; stops if my series reaches a deciding game
  // and I get the last shot.
  function play(L) {
    var po = L.po;
    while (!po.done) {
      if (po.groups.every(function (x) { return x.length === 1; })) {
        if (po.groups.length === 1) { po.done = true; po.champ = po.groups[0][0]; break; }
        po.groups = [[po.groups[0][0], po.groups[1][0]]]; // the Finals
        continue;
      }
      var n = bestOf(L.g, po.r, po.rounds), next = [];
      for (var gi = 0; gi < po.groups.length; gi++) {
        var list = po.groups[gi], win = [];
        for (var i = 0; i < list.length; i += 2) {
          var a = list[i], b = list[i + 1];
          if (b == null) { win.push(a); continue; }
          var home = po.wins[a] >= po.wins[b], res, mine = po.me === a || po.me === b;
          if (po.decided && po.decided.r === po.r && mine) { res = po.decided.won === (po.me === a) ? { a: 1, b: 0 } : { a: 0, b: 1 }; po.decided = null; }
          else res = (po.cache = po.cache || {})[po.r + ':' + a + ':' + b] || (po.cache[po.r + ':' + a + ':' + b] = series(po.rs[a] + (home ? 0.4 : 0), po.rs[b] + (home ? 0 : 0.4), n, home));
          // A deciding game for my team: the ball is in my hands.
          if (mine && po.clutch && !po.asked && res.a + res.b === n && U.chance(0.45)) {
            po.asked = true; L.wait = { r: po.r, opp: po.me === a ? b : a, n: n }; return;
          }
          var wnr = res.a > res.b ? a : b, lsr = wnr === a ? b : a;
          po.out[lsr] = po.r; win.push(wnr);
          if (po.groups.length === 1 && list.length === 2) po.runner = lsr;
        }
        next.push(win);
      }
      po.groups = next; po.r++;
    }
    wrap(L);
  }
  // The deciding game's result from my clutch shot.
  function finish(L, won) {
    if (!L.wait || !L.po) return;
    var w = L.wait; L.wait = null;
    L.po.decided = { r: w.r, won: won };
    play(L);
  }
  function wrap(L) {
    var po = L.po, y = po.y, H = L.hist[y], g = L.g, me = meIn(g);
    var champ = po.champ;
    Object.keys(L.teams).forEach(function (f) { var r = L.teams[f].rec[y]; if (!r) return; r[2] = f === champ ? po.rounds : po.out[f] != null ? po.out[f] : -1; });
    H.ch = L.teams[champ].n; H.ru = po.runner ? L.teams[po.runner].n : null;
    // Awards.
    var pool = L.pl.map(function (p) { return { n: p.n, o: p.o, t: p.t, rk: p.rk }; });
    if (me) pool.push({ n: me.n, o: me.o, t: me.t, me: true, rk: po.meRookie ? y : 0 });
    var gp = po.wins ? (L.teams[champ].rec[y][0] + L.teams[champ].rec[y][1]) : 82;
    // Voters tire of giving it to the same player every year.
    var prev = L.hist[y - 1] || {}, run = prev.mvp ? 1 + ((L.hist[y - 2] || {}).mvp === prev.mvp ? 1 : 0) + ((L.hist[y - 3] || {}).mvp === prev.mvp ? 1 : 0) : 0;
    var score = function (p) { return p.o + (po.wins[p.t] / gp) * 14 + U.randf(0, 3) - (p.n === prev.mvp ? run * 2.6 : 0); };
    var mvp = pool.slice().sort(function (a, b) { return score(b) - score(a); })[0];
    H.mvp = mvp.n; H.mvpMe = !!mvp.me; H.mvpT = L.teams[mvp.t].n;
    var rook = pool.filter(function (p) { return p.rk === y; }).sort(function (a, b) { return b.o - a.o; })[0];
    if (rook) { H.roy = rook.n; H.royMe = !!rook.me; }
    var fm = pool.filter(function (p) { return p.t === champ; }).sort(function (a, b) { return b.o + U.randf(0, 3) - a.o; })[0];
    if (fm) { H.fmvp = fm.n; H.fmvpMe = !!fm.me; }
    L.po = { done: true, y: y, champ: champ, out: po.out, rounds: po.rounds };
  }

  // ------------------------------------------------------------ for js/hoops.js
  // Play this season with me in it; returns my record and how far we went.
  function mine(g, y, opts) {
    var L = st(g);
    if (!L) L = begin(g, y);
    while (L.year < y - 1) { if (L.wait) finish(L, U.chance(0.5)); season(L, L.year + 1, {}); }
    if (L.wait) finish(L, U.chance(0.5));
    if (L.year < y) season(L, y, opts || {});
    return result(g, y);
  }
  // My team's season, in js/hoops.js terms (round 0-3 lost in that round, 4 champions).
  function result(g, y) {
    var L = st(g), me = meIn(g); if (!L || !me) return null;
    var t = L.teams[me.t], r = t.rec[y]; if (!r) return null;
    var po = L.po, R = po.rounds || 4, H = L.hist[y] || {};
    var map = function (k) { return k < 0 ? -1 : k >= R ? 4 : k === R - 1 ? 3 : k === 0 ? 0 : Math.min(2, k + (4 - R)); };
    return { w: r[0], l: r[1], round: L.wait ? null : map(r[2]), wait: L.wait ? { round: map(L.wait.r), opp: L.teams[L.wait.opp].n } : null, mvp: H.mvpMe, roy: H.royMe, fmvp: H.fmvpMe, champ: L.wait ? null : H.ch, H: H };
  }
  function resume(g, won) {
    var L = st(g); if (!L || !L.wait) return null;
    finish(L, won);
    return result(g, L.year);
  }

  // ------------------------------------------------------------ for js/nba.js
  function teamNames(g) { var L = st(g); return L ? Object.keys(L.teams).map(function (f) { return L.teams[f].n; }) : []; }
  function starsOn(g, name) { var L = st(g); if (!L) return []; var f = fidOf(L, name); return f ? roster(L, f).filter(function (p) { return p.o >= 80; }).slice(0, 3).map(function (p) { return p.n; }) : []; }
  function anyStar(g, not) { var L = st(g); if (!L) return null; var l = L.pl.filter(function (p) { return p.o >= 84 && (not || []).indexOf(p.n) < 0; }); return l.length ? U.pick(l).n : null; }
  function rosterOf(g, name) { var L = st(g); if (!L) return []; var f = fidOf(L, name); return f ? roster(L, f) : []; }
  function histOf(g, y) { var L = ensure(g, y); return L && y >= L.start && L.year >= y && !(L.wait && L.year === y) ? L.hist[y] || null : null; }

  // ------------------------------------------------------------ the menu
  function menu() {
    var g = S().me.gender, L = ensure(g, S().year);
    if (!L) return TL.actions.nope('The league is still running on real history. It takes over in your first pro season (or in 2026).');
    TL.ui.menu('🏟️ ' + lgName(g), function () {
      var y = L.year, me = meIn(g), rs = ratings(L, me), H = L.hist[y] || {}, items = [];
      items.push({ info: true, html: '<div class="hb-arch">🏟️ ' + lgName(g) + ' · ' + y + ' season</div><p class="small muted">' + (H.ch ? '🏆 ' + U.esc(H.ch) + (H.ru ? ' beat the ' + U.esc(H.ru) + ' in the Finals' : '') + ' · ' : '') + (H.mvp ? '⭐ MVP ' + U.esc(H.mvp) : '') + '<br>Real history through ' + (L.start - 1) + '; simulated since.</p>' });
      var confs = g === 'F' ? ['League'] : ['East', 'West'];
      confs.forEach(function (c) {
        items.push({ section: c === 'League' ? 'Standings' : c });
        Object.keys(L.teams).filter(function (f) { return c === 'League' || L.teams[f].c === c || (c === 'West' && L.teams[f].c !== 'East'); }).sort(function (a, b) { var ra = L.teams[a].rec[y] || [0, 0], rb = L.teams[b].rec[y] || [0, 0]; return rb[0] - ra[0]; }).forEach(function (f, i) {
          var t = L.teams[f], r = t.rec[y], mine0 = me && me.t === f;
          items.push({ icon: mine0 ? '⭐' : String(i + 1), label: t.n, sub: (r ? r[0] + '-' + r[1] + ' · ' + finish0(L, r[2]) : 'No games yet') + ' · ' + label(rs[f], mean(rs)), onClick: function () { team(f); } });
        });
      });
      items.push({ section: 'Champions' });
      for (var yy = y; yy >= Math.max(y - 30, 1947); yy--) {
        var h = yy >= L.start ? L.hist[yy] : null, ch = h ? h.ch : TL.nba.champOf(g, yy), mv = h ? h.mvp : TL.nba.mvpOf(g, yy);
        if (!ch) continue;
        items.push({ icon: yy >= L.start ? '🏆' : '📜', label: yy + ' · ' + ch, sub: (mv ? 'MVP ' + mv : '') + (h && h.fmvp ? ' · Finals MVP ' + h.fmvp : '') + (yy < L.start ? ' · real history' : '') });
      }
      items.push({ section: 'Top players' });
      var top = L.pl.slice().sort(function (a, b) { return b.o - a.o; }).slice(0, 15);
      if (me) top.push({ n: me.n + ' (me)', o: me.o, a: me.a, t: me.t, pos: S().hoops.pos }), top.sort(function (a, b) { return b.o - a.o; });
      top.slice(0, 16).forEach(function (p, i) { items.push({ icon: String(i + 1), label: p.n, sub: (L.teams[p.t] ? L.teams[p.t].n : 'Free agent') + ' · ' + p.pos + ' · age ' + p.a, right: p.o + ' OVR' }); });
      var mv2 = (H.moves || []).concat(H.retired && H.retired.length ? ['👋 Retired: ' + H.retired.slice(0, 5).join(', ').replace(/\.?$/, '.')] : []).concat(H.top ? ['🎓 #1 pick: ' + H.top + ' (' + H.topTeam + ')'] : []).concat(H.roy ? ['🌱 Rookie of the Year: ' + H.roy] : []);
      if (mv2.length) { items.push({ section: 'News' }); mv2.forEach(function (m) { items.push({ info: true, html: '<p class="small">' + U.esc(m) + '</p>' }); }); }
      return items;
    });
  }
  function finish0(L, k) { var R = (L.po && L.po.rounds) || 4; return k < 0 ? 'missed the playoffs' : k >= R ? '🏆 champions' : k === R - 1 ? 'lost in the Finals' : k === R - 2 ? 'lost in the ' + (L.g === 'F' ? 'semifinals' : 'conference finals') : k === 0 ? 'lost in the first round' : 'lost in the second round'; }
  function label(r, avg) { var q = 50 + (r - avg) * 4.5; return q >= 60 ? 'Contender' : q >= 49 ? 'Playoff team' : q >= 39 ? 'Middle of the pack' : 'Rebuilding'; }
  function team(f) {
    var g = S().me.gender, L = st(g), t = L.teams[f], me = meIn(g);
    TL.ui.menu(t.n, function () {
      var items = [{ info: true, html: '<div class="hb-arch" style="display:flex;align-items:center;gap:10px">' + (TL.logos ? TL.logos.badge(t.n, { shape: 'team', size: 'md' }) : '') + '<span>' + U.esc(t.n) + ' · ' + t.c + (t.born ? ' · since ' + t.born : '') + '</span></div>' }];
      items.push({ section: 'Roster' });
      var r = roster(L, f).map(function (p) { return p; });
      if (me && me.t === f) r.push({ n: me.n + ' (me)', o: me.o, a: me.a, pos: S().hoops.pos }), r.sort(function (a, b) { return b.o - a.o; });
      r.forEach(function (p) { items.push({ icon: p.pos, label: p.n, sub: 'Age ' + p.a + (p.rk === L.year ? ' · rookie' : '') + (p.c ? ' · ' + U.plural(p.c, 'year') + ' left' : ''), right: p.o + ' OVR' }); });
      items.push({ section: 'Recent seasons' });
      Object.keys(t.rec).map(Number).sort(function (a, b) { return b - a; }).forEach(function (yy) { var q = t.rec[yy]; items.push({ icon: L.hist[yy] && L.hist[yy].ch === t.n ? '🏆' : '📅', label: yy + ': ' + q[0] + '-' + q[1], sub: L.hist[yy] && L.hist[yy].ch === t.n ? 'Champions' : finish0(L, q[2]) }); });
      return items;
    });
  }

  return { st: st, active: active, begin: begin, ensure: ensure, mine: mine, resume: resume, quality: quality, teamNames: teamNames, starsOn: starsOn, anyStar: anyStar, rosterOf: rosterOf, hist: histOf, menu: menu };
})();
