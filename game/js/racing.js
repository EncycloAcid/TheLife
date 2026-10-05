/* TheLife — v2.20: motor racing, expanded. Start in karts as a kid, then
 * pick a road: open-wheel (Formula 3 or GP2-style feeders to Formula 1),
 * American open-wheel (to IndyCar and the Indy 500) or stock cars (to
 * NASCAR's top series). Feeder seats cost money unless a sponsor pays.
 * Real teams with era-accurate cars (McLaren-Honda, Williams in the '90s,
 * Mercedes in the hybrid era, Hendrick, Penske...), real rival drivers,
 * full seasons simulated race by race with qualifying, points, DNFs and a
 * championship, the crown jewels (Monaco, the Indy 500, the Daytona 500,
 * Le Mans) with a last-lap decision, driving style, car development,
 * contracts and sponsors, crashes that are far deadlier in the early eras,
 * and a Hall of Fame. State: S().rc. The job is the special career
 * 'racer' (js/specials.js), whose menu and yearly update come here. */
TL.racing = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function yr() { return S().year; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function count(k) { var y = S().yearActs || (S().yearActs = {}); return y[k] || 0; }
  function bump(k) { var y = S().yearActs || (S().yearActs = {}); y[k] = (y[k] || 0) + 1; }
  function last(k) { var y = S().lastActs || {}; return y[k] || 0; }
  function x() { return S().rc; }
  function cl(v, a, b) { return U.clamp(v, a == null ? 0 : a, b == null ? 100 : b); }

  // ------------------------------------------------------------ series
  var PATHS = { open: 'Open-wheel (toward Formula 1)', indy: 'American open-wheel (toward IndyCar)', stock: 'Stock cars (toward NASCAR)' };
  function feeder(path) {
    var y = yr();
    if (path === 'open') return y >= 2017 ? 'Formula 2' : y >= 2005 ? 'GP2' : y >= 1985 ? 'Formula 3000' : y >= 1967 ? 'Formula 2' : 'Formula 3';
    if (path === 'indy') return y >= 1986 ? 'Indy Lights' : 'the sprint car circuit';
    return y >= 2015 ? 'the Xfinity Series' : y >= 2008 ? 'the Nationwide Series' : y >= 1982 ? 'the Busch Series' : 'Late Model Sportsman racing';
  }
  function top(path) {
    var y = yr();
    if (path === 'open') return y >= 1950 ? 'Formula 1' : 'Grand Prix racing';
    if (path === 'indy') return y >= 1996 ? 'the IndyCar Series' : y >= 1979 ? 'CART IndyCar' : y >= 1956 ? 'USAC Championship Car' : 'AAA Championship Car';
    return y >= 2020 ? 'the NASCAR Cup Series' : y >= 2017 ? 'the Monster Energy Cup' : y >= 2008 ? 'the Sprint Cup' : y >= 2004 ? 'the Nextel Cup' : y >= 1971 ? 'the Winston Cup' : y >= 1949 ? 'NASCAR Grand National' : 'stock car racing';
  }
  function seriesName(w) { return w.level === 'kart' ? 'karting' : w.level === 'feeder' ? feeder(w.path) : top(w.path); }
  function races(w) {
    var y = yr();
    if (w.level === 'kart') return 10;
    if (w.level === 'feeder') return 12;
    if (w.path === 'open') return Math.min(24, Math.round(7 + Math.max(0, y - 1950) * 0.23));
    if (w.path === 'indy') return y < 1980 ? 12 : 17;
    return y < 1972 ? 48 : 36;
  }
  // Points for a finishing position (1-based); each series has its own table.
  function points(w, pos) {
    if (w.path === 'open' && w.level === 'top') return [25, 18, 15, 12, 10, 8, 6, 4, 2, 1][pos - 1] || 0;
    if (w.path === 'stock' && w.level === 'top') return Math.max(1, 41 - pos) + (pos === 1 ? 5 : 0);
    return [50, 40, 35, 32, 30, 28, 26, 24, 22, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10][pos - 1] || 5;
  }
  // ------------------------------------------------------------ teams: [name, from, to, base car, [boost windows: from, to, car]]
  var T = {
    open: [['Ferrari', 1950, 2099, 74, [[1952, 1953, 95], [1961, 1961, 95], [1975, 1979, 90], [1999, 2008, 94], [2017, 2018, 88], [2022, 2022, 88]]], ['Alfa Romeo', 1950, 1951, 96, []], ['Maserati', 1950, 1957, 78, [[1957, 1957, 92]]],
      ['Mercedes', 1954, 1955, 96, []], ['Mercedes', 2010, 2099, 72, [[2014, 2020, 97], [2021, 2022, 86]]], ['Lotus', 1958, 1994, 70, [[1963, 1965, 92], [1968, 1968, 90], [1970, 1970, 90], [1973, 1973, 88], [1978, 1978, 94], [1988, 1994, 45]]],
      ['Brabham', 1962, 1992, 66, [[1966, 1967, 90], [1981, 1983, 88], [1986, 1992, 40]]], ['McLaren', 1966, 2099, 70, [[1974, 1976, 86], [1984, 1991, 96], [1998, 1999, 93], [2015, 2018, 45], [2024, 2099, 94]]],
      ['Tyrrell', 1970, 1998, 64, [[1971, 1973, 90], [1980, 1998, 45]]], ['Williams', 1977, 2099, 64, [[1980, 1981, 88], [1986, 1987, 90], [1992, 1997, 96], [2014, 2015, 76], [2018, 2099, 40]]],
      ['Renault', 1977, 1985, 70, []], ['Renault', 2002, 2011, 74, [[2005, 2006, 95]]], ['Benetton', 1986, 2001, 70, [[1994, 1995, 94]]], ['Red Bull', 2005, 2099, 62, [[2009, 2013, 95], [2014, 2020, 80], [2021, 2023, 97], [2024, 2099, 86]]],
      ['Minardi', 1985, 2005, 25, []], ['Sauber', 1993, 2099, 46, []], ['Haas', 2016, 2099, 46, []], ['Aston Martin', 2021, 2099, 62, [[2023, 2023, 80]]], ['Alpine', 2021, 2099, 56, []]],
    indy: [['Penske', 1968, 2099, 86, []], ['Patrick Racing', 1970, 2004, 70, []], ['A.J. Foyt Enterprises', 1965, 2099, 56, [[1965, 1977, 82]]], ['Newman/Haas', 1983, 2011, 82, []], ['Chip Ganassi Racing', 1990, 2099, 80, [[2008, 2021, 90]]],
      ['Rahal Letterman Lanigan', 1992, 2099, 64, []], ['Andretti', 2003, 2099, 78, []], ['Arrow McLaren', 2020, 2099, 76, []]],
    stock: [['Petty Enterprises', 1949, 2008, 60, [[1960, 1979, 92]]], ['Wood Brothers', 1953, 2099, 68, [[1963, 1980, 85]]], ['Junior Johnson & Associates', 1965, 1995, 70, [[1976, 1985, 90]]], ['Richard Childress Racing', 1969, 2099, 72, [[1986, 1994, 92]]],
      ['Hendrick Motorsports', 1984, 2099, 88, [[2006, 2010, 97]]], ['Roush Racing', 1988, 2099, 74, [[2003, 2005, 88], [2016, 2099, 60]]], ['Joe Gibbs Racing', 1992, 2099, 84, [[2015, 2019, 92]]], ['Team Penske', 1991, 2099, 80, []],
      ['Stewart-Haas Racing', 2009, 2024, 84, [[2014, 2018, 90]]], ['23XI Racing', 2021, 2099, 70, []], ['Trackhouse Racing', 2021, 2099, 74, []]]
  };
  function teams(path) {
    var y = yr();
    return (T[path] || []).filter(function (t) { return y >= t[1] && y <= t[2]; }).map(function (t) {
      var car = t[3]; t[4].forEach(function (b) { if (y >= b[0] && y <= b[1]) car = b[2]; });
      // Beyond real history the pecking order shuffles every few years.
      if (y > 2026) car = cl(car + ((Math.floor(y / 3) * 37 + t[0].length * 53) % 29) - 14, 30, 92);
      return { name: t[0], car: car };
    });
  }
  function carOf(w) { if (w.level !== 'top') return w.level === 'kart' ? 60 : 55 + Math.round(w.rep / 5); var t = teams(w.path).filter(function (q) { return q.name === w.team; })[0]; return (t ? t.car : 35) + (w.dev || 0); }
  // ------------------------------------------------------------ real rivals: [name, from, to, rating]
  var D = {
    open: [['Juan Manuel Fangio', 1950, 1958, 97], ['Alberto Ascari', 1950, 1955, 94], ['Stirling Moss', 1951, 1961, 95], ['Jack Brabham', 1955, 1970, 90], ['Jim Clark', 1960, 1968, 97], ['Graham Hill', 1958, 1975, 89], ['Jackie Stewart', 1965, 1973, 96], ['Niki Lauda', 1971, 1985, 95], ['James Hunt', 1973, 1979, 90], ['Emerson Fittipaldi', 1970, 1980, 91], ['Alain Prost', 1980, 1993, 96], ['Ayrton Senna', 1984, 1994, 98], ['Nelson Piquet', 1978, 1991, 92], ['Nigel Mansell', 1980, 1995, 92], ['Michael Schumacher', 1991, 2006, 98], ['Michael Schumacher', 2010, 2012, 90], ['Mika Häkkinen', 1991, 2001, 93], ['Fernando Alonso', 2001, 2018, 95], ['Fernando Alonso', 2021, 2026, 91], ['Kimi Räikkönen', 2001, 2021, 92], ['Lewis Hamilton', 2007, 2026, 98], ['Sebastian Vettel', 2007, 2022, 94], ['Nico Rosberg', 2006, 2016, 91], ['Max Verstappen', 2015, 2026, 98], ['Charles Leclerc', 2018, 2026, 93], ['Lando Norris', 2019, 2026, 93], ['Oscar Piastri', 2023, 2026, 91]],
    indy: [['A.J. Foyt', 1957, 1992, 95], ['Mario Andretti', 1964, 1994, 95], ['Al Unser', 1965, 1993, 92], ['Johnny Rutherford', 1963, 1988, 89], ['Rick Mears', 1978, 1992, 95], ['Bobby Rahal', 1982, 1998, 89], ['Michael Andretti', 1983, 2003, 92], ['Al Unser Jr.', 1982, 2004, 92], ['Alex Zanardi', 1996, 2001, 92], ['Dario Franchitti', 1997, 2013, 93], ['Hélio Castroneves', 1998, 2020, 91], ['Sam Hornish Jr.', 2000, 2007, 89], ['Scott Dixon', 2001, 2026, 95], ['Will Power', 2005, 2026, 92], ['Josef Newgarden', 2012, 2026, 92], ['Álex Palou', 2020, 2026, 95]],
    stock: [['Lee Petty', 1949, 1964, 88], ['Richard Petty', 1958, 1992, 97], ['David Pearson', 1960, 1986, 95], ['Cale Yarborough', 1957, 1988, 93], ['Bobby Allison', 1961, 1988, 91], ['Darrell Waltrip', 1972, 2000, 93], ['Dale Earnhardt', 1975, 2001, 97], ['Rusty Wallace', 1980, 2005, 90], ['Jeff Gordon', 1992, 2016, 96], ['Dale Jarrett', 1984, 2008, 89], ['Tony Stewart', 1999, 2016, 93], ['Jimmie Johnson', 2002, 2020, 97], ['Dale Earnhardt Jr.', 1999, 2017, 89], ['Kevin Harvick', 2001, 2023, 93], ['Kyle Busch', 2004, 2026, 93], ['Denny Hamlin', 2005, 2026, 92], ['Kyle Larson', 2014, 2026, 94], ['Chase Elliott', 2015, 2026, 91], ['Ryan Blaney', 2014, 2026, 91], ['Danica Patrick', 2012, 2018, 78]]
  };
  function field(w) {
    var y = yr(), n = w.level === 'top' ? (w.path === 'stock' ? 36 : 20) : 20, out = [];
    var tm = teams(w.path);
    if (w.level === 'top') (D[w.path] || []).filter(function (d) { return y >= d[1] && y <= d[2]; }).forEach(function (d) { var t = tm.length ? U.pick(tm) : { car: 70 }; out.push({ n: d[0], r: d[3], car: Math.max(t.car, 78), real: true }); }); // the greats drive good cars
    // Every era has its greats: when real history runs out, the next generation fills in.
    if (w.level === 'top') { var elite = out.filter(function (d) { return d.r >= 88; }).length; for (var e = elite; e < 7; e++) { var en = E.randomName(U.chance(0.9) ? 'M' : 'F'); var et = tm.length ? U.pick(tm) : { car: 75 }; out.push({ n: en.first + ' ' + en.last, r: U.rand(88, 97), car: Math.max(et.car, 78), real: true }); } }
    while (out.length < n - 1) { var nm = E.randomName(U.chance(0.9) ? 'M' : 'F'); var t2 = tm.length ? U.pick(tm) : { car: 60 }; out.push({ n: nm.first + ' ' + nm.last, r: w.level === 'top' ? U.rand(72, 88) : w.level === 'feeder' ? U.rand(55, 82) : U.rand(40, 75), car: w.level === 'top' ? t2.car : U.rand(50, 75) }); }
    return out.slice(0, n - 1);
  }

  // ------------------------------------------------------------ joining
  var STYLES = { balanced: ['Balanced', 0, 1, 0], aggressive: ['Aggressive', 3, 1.5, 0.035], smooth: ['Smooth', -2, 0.7, -0.015] }; // [name, pace, spread, crash odds]
  function start(path) {
    var s = S(), m = me();
    if (m.age < 8) return done(nope('I\'m too young even for karts.'));
    if (s.job && s.job.special !== 'racer') return done(nope('I\'d have to quit my current job first.'));
    if (s.prison) return done(nope('Not from in here.'));
    if (m.age > 22 && !s.rc) return done(nope('Nobody starts a racing career after 22.'));
    if (m.athl < 40) return done(nope('Racing is brutal on the body. I need to be fitter (40+ athleticism).'));
    var kid = m.age < 15;
    s.rc = { path: path, level: kid ? 'kart' : 'feeder', team: null, skill: U.rand(15, 28), rep: 3, style: 'balanced', contract: null, sponsor: null, seasons: [], wins: 0, podiums: 0, poles: 0, starts: 0, titles: [], jewels: [], since: yr(), hist: [], dev: 0, injuries: 0, crashes: 0 };
    if (!kid) { if (!payForSeat(s.rc)) { s.rc.level = 'kart'; s.rc.club = true; } }
    if (!kid) setJob(s.rc);
    E.log('🏎️ ' + (kid ? 'I started racing go-karts. Every great driver starts here.' : s.rc.level === 'feeder' ? 'I got a seat in ' + feeder(path) + '.' : 'I couldn\'t afford a seat in ' + feeder(path) + ', so I\'m racing club events while I hunt for a sponsor.'), 'good');
    ui().closeAll(); done(good('🏎️ Lights out and away we go.'));
  }
  function setJob(w) { var s = S(); if (me().age < 15) return; s.job = { career: 'sp_racer', special: 'racer', fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, salary: 0, company: w.team || seriesName(w) }; s.sp = s.sp || {}; s.sp.racer = s.sp.racer || { rep: w.rep, skill: w.skill, since: yr(), peak: w.rep, honors: [], earnTotal: 0 }; s.sp.racer.retired = false; }
  // Feeder seats cost money unless a sponsor (or results) pays for them.
  function seatCost(w) { return E.$(w.path === 'open' ? 900000 : w.path === 'indy' ? 500000 : 300000); }
  function payForSeat(w) {
    var c = seatCost(w);
    if (w.sponsor) return true;
    if (w.rep >= 60) return true; // teams pay for the very best juniors
    if (S().money >= c) { E.addMoney(-c); E.log('💸 I paid ' + E.fmt(c) + ' for my seat in ' + feeder(w.path) + '.'); return true; }
    return false;
  }

  // ------------------------------------------------------------ actions
  function train(kind) {
    var w = x();
    if (count('rctrain') >= 2) return done(nope('That\'s enough training for this season.'));
    bump('rctrain');
    if (kind === 'sim') { var g = Math.max(1, Math.round((95 - w.skill) / 22 * U.randf(0.6, 1.2))); w.skill = cl(w.skill + g); return done(good((yr() >= 1990 ? 'I spent days in the simulator' : 'I walked the tracks and studied every corner') + ' (+' + g + ' racecraft).')); }
    me().athl = cl(me().athl + U.rand(1, 3)); E.stat('health', 2);
    done(good('I trained my neck and core for the g-forces.'));
  }
  function engineers() {
    var w = x();
    if (w.level !== 'top') return done(nope('Only top-series teams have engineers to work with.'));
    if (count('rcdev')) return done(nope('We\'ve done all the development we can this season.'));
    bump('rcdev');
    var g = Math.round(U.rand(1, 5) + (me().smarts - 50) / 15);
    w.dev = cl((w.dev || 0) + Math.max(1, g), 0, 10);
    done(good('🔧 I worked with the engineers on setup and upgrades (+' + Math.max(1, g) + ' car this season).'));
  }
  function setStyle(k) { x().style = k; done('From now on I\'ll drive ' + (k === 'aggressive' ? 'aggressively: more wins, more crashes.' : k === 'smooth' ? 'smoothly: fewer mistakes, fewer heroics.' : 'a balanced race.')); }
  function sponsorHunt() {
    var w = x();
    if (w.sponsor) return done(nope('I already have ' + w.sponsor.name + ' on the car.'));
    if (count('rcspons')) return done(nope('I already pitched sponsors this year.'));
    bump('rcspons');
    var p = U.clamp(0.06 + w.rep / 160 + (me().looks - 50) / 300 + S().fame / 300, 0.03, 0.7);
    if (U.chance(p)) {
      var nm = U.pick(yr() >= 2010 ? ['an energy drink', 'a crypto exchange', 'a tech giant', 'an oil company', 'a luxury watchmaker'] : yr() >= 1970 ? ['a cigarette brand', 'an oil company', 'a beer company', 'a soft drink', 'an auto parts chain'] : ['an oil company', 'a tire maker', 'a local car dealer']);
      w.sponsor = { name: nm, pay: E.$(Math.round(50000 + w.rep * 8000)), years: 3 };
      return done(good('💼 I signed a sponsorship with ' + nm + ': ' + E.fmt(w.sponsor.pay) + ' a year.'));
    }
    done(bad('Sponsors passed. "Come back when you\'re winning."'));
  }
  function leMans() {
    var w = x();
    if (yr() < 1923) return done(nope('Le Mans doesn\'t exist yet.'));
    if (count('rclm')) return done(nope('Le Mans is once a year.'));
    if (w.rep < 35) return done(nope('No team will put me in a Le Mans car yet (reputation 35+).'));
    bump('rclm');
    var p = U.clamp(0.02 + (w.skill - 75) / 400 + w.rep / 1500, 0.01, 0.12); // a whole team over 24 hours, and luck
    if (U.chance(p)) { w.jewels.push({ race: '24 Hours of Le Mans', y: yr() }); w.rep = cl(w.rep + 5); E.fame(5); checkTriple(w); return done(good('🏆 We won the 24 Hours of Le Mans!')); }
    if (U.chance(0.15)) { E.stat('health', -U.rand(5, 15)); return done(bad('Our car crashed in the night at Le Mans.')); }
    done('We finished ' + U.ordinal(U.rand(3, 18)) + ' at Le Mans.');
  }
  function checkTriple(w) {
    var has = function (r) { return w.jewels.some(function (j) { return j.race === r; }); };
    if (!w.triple && has('Monaco Grand Prix') && has('Indianapolis 500') && has('24 Hours of Le Mans')) { w.triple = yr(); E.log('👑 I won the Triple Crown of Motorsport: Monaco, the Indy 500 and Le Mans. Only Graham Hill had ever done it.', 'good'); E.fame(10); }
  }

  // ------------------------------------------------------------ the season
  function season() {
    var s = S(), w = x(), m = me();
    if (!w || w.retired) return 0;
    var st = STYLES[w.style] || STYLES.balanced, n = races(w), car = carOf(w), fl = field(w);
    var tally = fl.map(function (d) { return { n: d.n, pts: 0, real: d.real }; }), my = { pts: 0, wins: 0, pod: 0, poles: 0, dnf: 0, best: 99 };
    var danger = yr() < 1970 ? 3 : yr() < 1994 ? 1.6 : yr() < 2001 ? 1.2 : 1, out = 0;
    for (var r = 0; r < n; r++) {
      var scores = fl.map(function (d) { return d.r * 0.55 + d.car * 0.4 + U.randf(-9, 9); });
      var all = scores.map(function (v, i) { return { i: i, v: v }; });
      var injured = out > 0, crash = false, mech = false;
      if (injured) { out--; my.dnf++; }
      else {
        var me0 = w.skill * 0.55 + car * 0.4 + m.athl * 0.05 + st[1] + U.randf(-9, 9) * st[2] - Math.max(0, m.age - 36) * 1.2;
        var q = w.skill * 0.5 + car * 0.45 + U.randf(-6, 6);
        if (fl.every(function (d) { return d.r * 0.5 + d.car * 0.45 + U.randf(-6, 6) < q; })) { my.poles++; w.poles++; }
        crash = U.chance((0.035 + st[3]) * danger); mech = U.chance(0.03 * (1.3 - car / 140) * (yr() < 1980 ? 2 : 1));
        if (!(crash || mech)) all.push({ i: -1, v: me0 });
      }
      all.sort(function (p1, p2) { return p2.v - p1.v; });
      all.forEach(function (e, k) { if (e.i >= 0) tally[e.i].pts += points(w, k + 1); });
      if (injured) continue;
      w.starts++;
      if (crash || mech) {
        my.dnf++;
        if (crash) {
          w.crashes++;
          if (U.chance(0.12 * danger)) {
            var hurt = U.rand(8, 22) * danger; E.stat('health', -Math.round(hurt)); w.injuries++;
            out = Math.min(n - r - 1, Math.round(hurt / 6));
            E.log('🚑 I crashed hard ' + (yr() < 1970 ? 'in an era when crashes kill drivers' : 'at speed') + (out ? ' and missed ' + U.plural(out, 'race') : '') + '.', 'bad');
          }
        }
        continue;
      }
      var pos = all.findIndex(function (e) { return e.i === -1; }) + 1;
      my.pts += points(w, pos); my.best = Math.min(my.best, pos);
      if (pos === 1) { my.wins++; w.wins++; } if (pos <= 3) { my.pod++; w.podiums++; }
    }
    // Standings.
    tally.push({ n: 'me', pts: my.pts, me: true });
    tally.sort(function (a, b) { return b.pts - a.pts; });
    var place = tally.findIndex(function (t) { return t.me; }) + 1, champ = tally[0], rival = tally.filter(function (t) { return !t.me && t.real; })[0];
    var sname = seriesName(w);
    E.log('🏁 ' + yr() + ' ' + sname + (w.team ? ' with ' + w.team : '') + ': ' + U.ordinal(place) + ' in the championship · ' + U.plural(my.wins, 'win') + ', ' + U.plural(my.pod, 'podium') + ', ' + U.plural(my.poles, 'pole') + (my.dnf ? ', ' + my.dnf + ' DNF' : '') + '.', place === 1 ? 'good' : '');
    if (place === 1) { w.titles.push({ y: yr(), series: sname }); E.log('🏆 I\'M ' + (w.level === 'top' ? (w.path === 'open' ? 'FORMULA 1 WORLD CHAMPION' : w.path === 'indy' ? 'THE INDYCAR CHAMPION' : 'THE CUP SERIES CHAMPION') : 'THE ' + sname.replace(/^the /, '').toUpperCase() + ' CHAMPION') + '!', 'good'); E.fame(w.level === 'top' ? 12 : 4); E.stat('happy', 15); }
    else if (w.level === 'top') E.log('📰 ' + (champ.me ? '' : champ.n + ' won the championship.') + (rival && rival.n !== champ.n ? ' My rival ' + rival.n + ' finished ' + U.ordinal(tally.indexOf(rival) + 1) + '.' : ''));
    // Reputation: results matter most, and the top series counts double.
    var mult = w.level === 'top' ? 1 : w.level === 'feeder' ? 0.8 : 0.6;
    w.rep = cl(w.rep + (my.wins * 2.5 + my.pod * 0.8 + (place === 1 ? 10 : place <= 3 ? 5 : place <= 10 ? 1 : -2)) * mult - w.rep * 0.06 + (w.level === 'top' && car < 50 && place <= 10 ? 3 : 0));
    w.skill = cl(w.skill + (w.skill < 55 ? 1.5 : w.skill < 80 ? 0.5 : 0) - (m.age >= 36 ? U.rand(1, 3) : 0));
    w.seasons.push({ y: yr(), series: sname, team: w.team, place: place, pts: my.pts, wins: my.wins, pod: my.pod, poles: my.poles, dnf: my.dnf, car: car });
    if (w.seasons.length > 50) w.seasons.shift();
    w.dev = 0;
    // The crown jewel of my series: decided on the last lap.
    if (w.level === 'top') { var jw = jewel(w); if (jw) s.pending.push({ id: 'rc_jewel', data: { race: jw } }); }
    if (U.chance(0.5)) s.pending.push({ id: 'rc_story', data: {} });
    // Next season: promotion, contracts, seats.
    var earn = 0;
    if (w.level === 'top') {
      var smul = w.path === 'open' ? 1 : w.path === 'stock' ? 0.6 : 0.3; // F1 money, NASCAR money, IndyCar money
      earn += w.contract ? w.contract.pay : E.$(Math.round((150000 + w.rep * 25000) * smul));
      earn += E.$(Math.round(my.wins * (w.path === 'open' ? 150000 : w.path === 'stock' ? 120000 : 100000) + my.pod * 30000));
      if (w.contract) { w.contract.years--; if (w.contract.years <= 0) { w.contract = null; s.pending.push({ id: 'rc_contract', data: {} }); } }
      else s.pending.push({ id: 'rc_contract', data: {} });
    } else if (w.level === 'feeder') {
      earn += E.$(Math.round(my.wins * 15000 + my.pod * 4000));
      if (place <= 3 || w.rep >= 45) s.pending.push({ id: 'rc_contract', data: {} });
      else if (!payForSeat(w)) { w.level = 'kart'; w.club = true; E.log('💸 I couldn\'t fund another season in ' + sname + '. Back to club racing.', 'bad'); }
    } else {
      // Karting and club racing: move up when ready (and old enough), if the seat can be paid for.
      if (m.age >= 15 && (w.rep >= 20 || (w.club && w.rep >= 12))) { if (payForSeat(w)) { w.level = 'feeder'; w.club = false; E.log('🏎️ I moved up to ' + feeder(w.path) + '.', 'good'); setJob(w); } else E.log('🏎️ I\'m ready for ' + feeder(w.path) + ', but I can\'t afford the seat yet. I need a sponsor.'); }
    }
    if (w.sponsor) { earn += w.sponsor.pay; w.sponsor.years--; if (w.sponsor.years <= 0) { E.log('💼 My sponsorship with ' + w.sponsor.name + ' ended.'); w.sponsor = null; } }
    earn = Math.round(earn);
    w.hist.push({ y: yr(), age: m.age, series: sname, team: w.team || '', place: place, wins: my.wins, earn: earn });
    if (w.hist.length > 60) w.hist.shift();
    E.fame(w.level === 'top' ? Math.min(3, my.wins) : 0);
    var sp = s.sp && s.sp.racer; if (sp) { sp.rep = cl(w.rep); sp.skill = cl(w.skill); sp.peak = Math.max(sp.peak || 0, w.rep); sp.earnTotal = (sp.earnTotal || 0) + earn; }
    if (s.job && s.job.special === 'racer') { s.job.salary = earn; s.job.company = w.team || sname; }
    else if (earn) E.addMoney(earn);
    return earn;
  }
  function jewel(w) {
    var y = yr();
    if (w.path === 'open' && y >= 1950 && y !== 1951 && (y < 1951 || y > 1954)) return 'Monaco Grand Prix';
    if (w.path === 'indy' && y >= 1911 && (y < 1917 || y > 1918) && (y < 1942 || y > 1945)) return 'Indianapolis 500';
    if (w.path === 'stock' && y >= 1959) return 'Daytona 500';
    return null;
  }
  // Kids in karts have no job, so the engine calls this once a year (js/engine.js).
  function youthYear() { var w = x(), s = S(); if (w && !w.retired && w.level === 'kart' && !(s.job && s.job.special === 'racer')) season(); }

  // ------------------------------------------------------------ events
  function def(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  function active() { var w = x(), j = S().job; return !!(w && !w.retired && j && j.special === 'racer'); }
  def('rc_jewel', { build: function (d) {
    var w = x(); if (!active() || !d || !d.race) return null;
    var car = carOf(w), rival = (D[w.path] || []).filter(function (q) { return yr() >= q[1] && yr() <= q[2]; });
    var best = rival.reduce(function (b, q) { return Math.max(b, q[3]); }, 82) * 0.55 + 85 * 0.4;
    var base = U.clamp(0.04 + (w.skill * 0.55 + car * 0.4 - best) / 50, 0.02, 0.2);
    var opp = rival.length ? U.pick(rival)[0] : 'the leader';
    var win = function (txt) { w.jewels.push({ race: d.race, y: yr() }); w.rep = cl(w.rep + 6); w.wins++; E.fame(6); E.stat('happy', 15); checkTriple(w); return good('🏆 I won the ' + d.race + '! ' + txt); };
    return {
      icon: '🏁', title: d.race, text: 'Last lap of the ' + d.race + '. I\'m right behind ' + opp + '.',
      choices: [
        { label: 'Dive for the inside', run: function () { if (U.chance(base * 1.5)) return win('I made the move stick on the last lap.'); if (U.chance(0.3)) { E.stat('health', -U.rand(3, 12)); w.crashes++; return bad('We touched and I ended up in the wall.'); } return 'The move didn\'t stick. I finished second behind ' + opp + '.'; } },
        { label: 'Wait for a mistake', run: function () { if (U.chance(base * 0.9)) return win(opp + ' locked up and I swept past.'); return 'No mistake came. I finished second behind ' + opp + '.'; } },
        { label: 'Bring it home safely', run: function () { w.rep = cl(w.rep + 1); return 'I brought it home in third. Solid points.'; } }
      ]
    };
  } });
  def('rc_contract', { build: function () {
    var w = x(); if (!w || w.retired || !(S().job && S().job.special === 'racer')) return null;
    var tm = teams(w.path).sort(function (a, b) { return b.car - a.car; }), offers = [];
    var reach = w.level === 'top' ? w.rep : w.rep - 15; // juniors step up to the weaker teams first
    tm.forEach(function (t, i) {
      var need = 30 + (t.car - 40);
      var smul = w.path === 'open' ? 1 : w.path === 'stock' ? 0.6 : 0.3;
      if (reach + U.rand(-12, 12) >= need) offers.push({ team: t.name, car: t.car, pay: Math.round(E.$(Math.round((200000 + w.rep * w.rep * 400 + Math.max(0, t.car - 50) * 15000) * smul)) / 1000) * 1000, years: U.rand(1, 3) });
    });
    if (!offers.length && tm.length && w.rep >= 30) { var lo = tm[tm.length - 1]; offers.push({ team: lo.name, car: lo.car, pay: Math.round(E.$(150000) / 1000) * 1000, years: 1 }); }
    offers = offers.sort(function (a, b) { return b.car - a.car; }).slice(0, 4);
    var ch = offers.map(function (o) { return { label: o.team + ' · car ' + (o.car >= 90 ? 'dominant' : o.car >= 78 ? 'front-running' : o.car >= 62 ? 'midfield' : 'backmarker') + ' · ' + E.fmt(o.pay) + '/yr × ' + o.years, run: function () {
      var up = w.level !== 'top'; w.level = 'top'; w.team = o.team; w.contract = { pay: o.pay, years: o.years }; S().job.company = o.team;
      return good((up ? '🏎️ I made it to ' + top(w.path) + '! ' : '✍️ ') + 'I signed with ' + o.team + ' for ' + o.years + (o.years === 1 ? ' year.' : ' years.'));
    } }; });
    if (w.level === 'top') ch.push({ label: 'Retire from racing', run: function () { retire(); return 'I hung up my helmet.'; } });
    else ch.push({ label: 'Another year in ' + feeder(w.path), run: function () { return payForSeat(w) ? 'Another year to prove myself.' : (w.level = 'kart', w.club = true, bad('I couldn\'t fund the seat. Club racing it is.')); } });
    return { icon: '✍️', title: w.level === 'top' ? 'Contract' : 'The big call-up', text: offers.length ? (w.level === 'top' ? 'My contract is up. Here\'s who wants me:' : 'Teams in ' + top(w.path) + ' are calling!') : 'No ' + top(w.path) + ' team has a seat for me this year.', choices: ch };
  } });
  var STORY = [
    { t: 'The team orders me to let my teammate past for the win.', c: [['Obey', { rep: -1, karma: 1, say: 'I moved over. The team owes me one.' }], ['Ignore the order', { p: 0.5, ok: { rep: 4, say: 'I won, and the fans loved it. The team is furious.' }, no: { rep: -3, say: 'We tangled and both lost points.' } }]] },
    { t: 'A journalist asks about my rival\'s dirty driving.', c: [['Call it out', { rep: 1, fame: 2, say: 'The quote ran everywhere.' }], ['Stay diplomatic', { karma: 1, say: 'I kept the peace.' }]] },
    { t: 'I\'m offered a fortune to drive for a team with a slow car.', c: [['Take the money', { pay: 1, say: 'Great money, slow car.' }], ['Stay where I can win', { rep: 2, say: 'Winning matters more.' }]] },
    { t: 'My engineer thinks we should gamble on strategy this weekend.', c: [['Gamble', { p: 0.45, ok: { rep: 4, say: 'The gamble paid off. We won!' }, no: { rep: -2, say: 'It backfired.' } }], ['Play it safe', { say: 'Solid points.' }]] },
    { t: 'A fan built a shrine to my car at the circuit.', c: [['Visit and sign it', { karma: 2, happy: 4, say: 'They cried. So did I, a little.' }], ['Wave from the car', { say: 'They were thrilled anyway.' }]] },
    { t: 'I\'m feeling the fear after a big crash.', c: [['Talk to a sports psychologist', { cost: 3000, happy: 5, say: 'I\'m back to full commitment.' }], ['Push through it', { p: 0.6, ok: { say: 'The fear faded on its own.' }, no: { rep: -3, say: 'I was a second off the pace all season.' } }]] }
  ];
  def('rc_story', { build: function (d) {
    var w = x(); if (!active()) return null;
    var ev = STORY[d && d.k != null ? d.k : U.rand(0, STORY.length - 1)];
    function apply(e) {
      if (e.p != null) return apply(U.chance(e.p) ? e.ok : e.no);
      if (e.cost) { var c = E.$(e.cost); if (S().money < c) return bad('I couldn\'t afford it.'); E.addMoney(-c); }
      if (e.rep) w.rep = cl(w.rep + e.rep); if (e.karma) E.karma(e.karma); if (e.fame) E.fame(e.fame); if (e.happy) E.stat('happy', e.happy);
      if (e.pay && w.contract) w.contract.pay = Math.round(w.contract.pay * 1.4);
      return e.rep > 0 ? good(e.say) : e.rep < 0 ? bad(e.say) : e.say;
    }
    return { icon: '🏎️', title: 'Racing', text: ev.t, choices: ev.c.map(function (c) { return { label: c[0], run: function () { return apply(c[1]); } }; }) };
  } });

  // ------------------------------------------------------------ retire
  function retire() {
    var w = x(), s = S();
    w.retired = yr();
    var big = w.titles.filter(function (t) { return !/Formula 3|Formula 2|GP2|3000|Lights|Busch|Nationwide|Xfinity|Sportsman|sprint|karting/.test(t.series); }).length;
    if (!w.hof && (big >= 3 || (big >= 2 && w.wins >= 30) || w.jewels.length >= 4 || w.triple)) {
      w.hof = yr(); var h = w.path === 'stock' ? (yr() >= 2010 ? 'the NASCAR Hall of Fame' : 'the International Motorsports Hall of Fame') : w.path === 'indy' ? 'the Indianapolis Motor Speedway Hall of Fame' : yr() >= 2017 ? 'the FIA Hall of Fame' : 'the International Motorsports Hall of Fame';
      E.log('🏛️ I was inducted into ' + h + '.', 'good'); w.hofName = h; E.fame(5);
    }
    var sp = s.sp && s.sp.racer; if (sp) sp.retired = yr();
    if (s.job && s.job.special === 'racer') E.quitJob(true);
  }

  // ------------------------------------------------------------ screens
  function card(w) {
    var car = carOf(w), big = w.titles.length;
    var bar = function (l, v) { return '<div class="minibar wide"><span>' + l + ' ' + Math.round(v) + '</span><span class="track"><span class="fill ' + (v >= 75 ? 'hi' : v >= 45 ? 'mid' : 'lo') + '" style="width:' + Math.max(2, Math.min(100, v)) + '%"></span></span></div>'; };
    return '<div class="kv"><b>' + U.esc(seriesName(w).replace(/^the /, '').replace(/^./, function (c) { return c.toUpperCase(); })) + '</b>' + (w.team ? ' · ' + U.esc(w.team) : '') + '<br>' + U.esc(PATHS[w.path]) + (w.contract ? '<br>Contract ' + E.fmt(w.contract.pay) + '/yr · ' + U.plural(w.contract.years, 'year') + ' left' : '') + (w.sponsor ? '<br>💼 Sponsored by ' + U.esc(w.sponsor.name) : '') + '</div>' +
      bar('Racecraft', w.skill) + bar('Car', car) + bar('Reputation', w.rep) + bar('Fitness', me().athl) +
      '<p class="small">Style: ' + STYLES[w.style][0] + '<br>Career: ' + U.plural(w.wins, 'win') + ' · ' + U.plural(w.podiums, 'podium') + ' · ' + U.plural(w.poles, 'pole') + ' · ' + U.plural(w.starts, 'start') + (big ? '<br>🏆 ' + w.titles.map(function (t) { return t.series.replace(/^the /, '') + ' ' + t.y; }).slice(-4).join(' · ') : '') + (w.jewels.length ? '<br>💎 ' + w.jewels.map(function (j) { return j.race + ' ' + j.y; }).slice(-4).join(' · ') : '') + (w.triple ? '<br>👑 Triple Crown of Motorsport' : '') + '</p>';
  }
  function menu() {
    ui().menu('🏎️ Racing', function () {
      var w = x(), j = S().job, items = [];
      var on = w && !w.retired && (w.level === 'kart' || (j && j.special === 'racer'));
      if (!on) {
        items.push({ info: true, html: '<p class="muted">Start in karts as a kid, or jump into a junior series as a teen if you can pay for a seat. Choose your road to the top.</p>' });
        if (w && w.retired) { items.push({ info: true, html: card(w) }); items.push({ icon: '📜', label: 'Season history', onClick: seasons }); return items; }
        Object.keys(PATHS).forEach(function (k) {
          var avail = k !== 'stock' || yr() >= 1940;
          items.push({ icon: k === 'stock' ? '🏁' : '🏎️', label: PATHS[k], sub: 'Toward ' + top(k), disabled: !avail, onClick: function () { start(k); } });
        });
        return items;
      }
      items.push({ info: true, html: card(w) });
      items.push({ section: 'Prepare' });
      items.push({ icon: yr() >= 1990 ? '🎮' : '🗺️', label: yr() >= 1990 ? 'Simulator work' : 'Study the circuits', sub: 'Racecraft ' + Math.round(w.skill), disabled: count('rctrain') >= 2, onClick: function () { train('sim'); } });
      items.push({ icon: '💪', label: 'Fitness training', sub: 'Neck, core and endurance', disabled: count('rctrain') >= 2, onClick: function () { train('fit'); } });
      if (w.level === 'top') items.push({ icon: '🔧', label: 'Work with the engineers', sub: 'Faster car this season', disabled: count('rcdev') > 0, onClick: engineers });
      items.push({ section: 'Driving style' });
      Object.keys(STYLES).forEach(function (k) { items.push({ icon: k === 'aggressive' ? '🔥' : k === 'smooth' ? '🧊' : '⚖️', label: STYLES[k][0] + (w.style === k ? ' ✓' : ''), sub: k === 'aggressive' ? 'Faster, but more crashes' : k === 'smooth' ? 'Fewer mistakes, less pace' : 'A bit of both', onClick: function () { setStyle(k); } }); });
      items.push({ section: 'Business' });
      items.push({ icon: '💼', label: w.sponsor ? 'Sponsored by ' + w.sponsor.name : 'Find a sponsor', sub: w.sponsor ? E.fmt(w.sponsor.pay) + '/yr · ' + U.plural(w.sponsor.years, 'year') + ' left' : 'Money for a seat or a bigger paycheck', disabled: !!w.sponsor || count('rcspons') > 0, onClick: sponsorHunt });
      if (w.level !== 'kart') items.push({ icon: '🕛', label: 'Race the 24 Hours of Le Mans', sub: yr() < 1923 ? 'Not until 1923' : 'Once a year · reputation 35+', disabled: count('rclm') > 0 || w.rep < 35 || yr() < 1923, onClick: leMans });
      items.push({ section: 'Career' });
      items.push({ icon: '📜', label: 'Season history', sub: U.plural(w.seasons.length, 'season'), onClick: seasons });
      if (w.level !== 'kart' || (j && j.special === 'racer')) items.push({ icon: '🏳️', label: 'Retire from racing', danger: true, onClick: function () { ui().confirm('Retire?', 'Hang up your helmet?', function () { retire(); ui().closeAll(); done('I hung up my helmet.'); }); } });
      return items;
    });
  }
  function seasons() {
    ui().menu('Season history', function () {
      var w = x(), items = [{ info: true, html: card(w) }];
      if (w.hofName) items.push({ info: true, html: '<p class="small">🏛️ Inducted into ' + U.esc(w.hofName) + ' (' + w.hof + ')</p>' });
      w.seasons.slice().reverse().forEach(function (q) { items.push({ icon: q.place === 1 ? '🏆' : q.place <= 3 ? '🥉' : '🏁', label: q.y + ' · ' + q.series.replace(/^the /, ''), sub: (q.team ? q.team + ' · ' : '') + U.ordinal(q.place) + ' · ' + U.plural(q.wins, 'win') + ', ' + U.plural(q.pod, 'podium') + ', ' + U.plural(q.poles, 'pole') + (q.dnf ? ', ' + q.dnf + ' DNF' : ''), right: q.pts + ' pts' }); });
      return items;
    });
  }
  function title() { var w = x(); if (!w) return 'Racing Driver'; if (w.level === 'kart') return w.club ? 'Club Racer' : 'Karting'; if (w.level === 'feeder') return feeder(w.path).replace(/^the /, '').replace(/ Series$/, '') + ' Driver'; return w.titles.some(function (t) { return t.series === top(w.path); }) && w.rep >= 70 ? 'Champion Driver' : (w.path === 'open' ? 'Formula 1 Driver' : w.path === 'indy' ? 'IndyCar Driver' : 'Cup Series Driver'); }
  function summary() { var w = x(); return !w ? 'Karts, junior series, F1, IndyCar or NASCAR' : w.retired ? 'Retired · ' + U.plural(w.wins, 'win') + ' · ' + U.plural(w.titles.length, 'title') : title() + (w.team ? ' · ' + w.team : ''); }
  return { menu: menu, season: season, youthYear: youthYear, title: title, summary: summary, seasons: seasons, teams: teams, retire: retire, top: top };
})();
