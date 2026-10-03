/* TheLife — v1.17: pro sports careers for football, soccer, baseball, hockey
 * and tennis (basketball has its own mode in js/hoops.js). Get drafted from
 * college or win an open tryout, start in the minors or on a real team,
 * develop a rating toward your potential, play seasons with real stat lines,
 * sign contracts in free agency, win championships, All-Star nods and MVPs,
 * land endorsements, retire and make the Hall of Fame. Women play in real
 * women's leagues (NWSL, PWHL, WSL, WTA…).
 * State: S().pro. A pro athlete's job has job.pro = true and the year's pay
 * in job.salary. Contract money is in base dollars. */
TL.pro = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function def(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  function count(key) { var y = S().yearActs || (S().yearActs = {}); return y[key] || 0; }
  function bump(key) { var y = S().yearActs || (S().yearActs = {}); y[key] = (y[key] || 0) + 1; }
  function n(v) { return Math.max(0, Math.round(v)).toLocaleString(); }
  function female() { return me().gender === 'F'; }

  // ------------------------------------------------------------ sports
  // games: regular season; inj: yearly injury base chance; old: age the body
  // usually calls it a career; school: matching school team (js/sports.js).
  var SP = {
    Football: { icon: '🏈', school: 'Football Team', games: 17, inj: 0.22, old: 32, pos: ['Quarterback', 'Running Back', 'Wide Receiver', 'Linebacker', 'Cornerback', 'Kicker'],
      line: function (k, sh, p) {
        if (p === 'Quarterback') return n((900 + k * 4300) * sh) + ' passing yds · ' + n((4 + k * 36) * sh) + ' TD · ' + n((4 + (1 - k) * 12) * sh) + ' INT';
        if (p === 'Running Back') return n((150 + k * 1650) * sh) + ' rushing yds · ' + n((1 + k * 17) * sh) + ' TD';
        if (p === 'Wide Receiver') return n((15 + k * 110) * sh) + ' catches · ' + n((150 + k * 1550) * sh) + ' yds · ' + n((1 + k * 14) * sh) + ' TD';
        if (p === 'Linebacker') return n((20 + k * 140) * sh) + ' tackles · ' + (Math.round(k * 140 * sh) / 10) + ' sacks';
        if (p === 'Cornerback') return n((15 + k * 70) * sh) + ' tackles · ' + n(k * 8 * sh) + ' INT';
        var fg = Math.round((8 + k * 30) * sh); return fg + '/' + (fg + U.rand(2, 7)) + ' field goals · long of ' + Math.round(44 + k * 18) + ' yds';
      } },
    Soccer: { icon: '⚽', school: 'Soccer Team', games: 38, inj: 0.14, old: 34, pos: ['Striker', 'Winger', 'Midfielder', 'Defender', 'Goalkeeper'],
      line: function (k, sh, p) {
        var apps = Math.round(38 * sh);
        if (p === 'Goalkeeper') return apps + ' apps · ' + n(k * 19 * sh) + ' clean sheets · ' + (64 + k * 16).toFixed(1) + '% saves';
        var g = { Striker: 36, Winger: 20, Midfielder: 12, Defender: 5 }[p], a = { Striker: 10, Winger: 16, Midfielder: 18, Defender: 6 }[p];
        return apps + ' apps · ' + n(k * g * sh) + ' goals · ' + n(k * a * sh) + ' assists';
      } },
    Baseball: { icon: '⚾', school: 'Baseball Team', games: 162, inj: 0.12, old: 36, pos: ['Pitcher', 'Catcher', 'Shortstop', 'Outfielder', 'First Baseman'],
      line: function (k, sh, p) {
        if (p === 'Pitcher') return n((3 + k * 17) * sh) + '-' + n((12 - k * 8) * sh) + ' · ' + (5.6 - k * 3.6).toFixed(2) + ' ERA · ' + n((40 + k * 250) * sh) + ' K';
        return '.' + String(Math.round(205 + k * 125)).padStart(3, '0') + ' AVG · ' + n(k * 50 * sh) + ' HR · ' + n((15 + k * 115) * sh) + ' RBI';
      } },
    Hockey: { icon: '🏒', school: null, games: 82, inj: 0.16, old: 35, pos: ['Center', 'Winger', 'Defenseman', 'Goalie'],
      line: function (k, sh, p) {
        if (p === 'Goalie') return n((8 + k * 35) * sh) + ' wins · ' + (0.885 + k * 0.04).toFixed(3).replace(/^0/, '') + ' SV% · ' + (3.6 - k * 1.6).toFixed(2) + ' GAA';
        var g = Math.round(k * (p === 'Defenseman' ? 22 : 55) * sh), a = Math.round(k * (p === 'Defenseman' ? 55 : 68) * sh);
        return g + ' goals · ' + a + ' assists · ' + (g + a) + ' points';
      } },
    Tennis: { icon: '🎾', school: 'Tennis Team', games: 0, inj: 0.12, old: 33, pos: ['Singles'] }
  };
  var SPORT_NAMES = Object.keys(SP);
  var SLAMS = ['Australian Open', 'French Open', 'Wimbledon', 'US Open'];
  var BRANDS = { Football: ['Nike', 'Gatorade', 'Under Armour', 'State Farm', 'Pepsi'], Soccer: ['Adidas', 'Nike', 'Puma', 'EA Sports FC', 'Pepsi'], Baseball: ['Nike', 'Rawlings', 'New Balance', 'Gatorade'], Hockey: ['Bauer', 'CCM', 'Gatorade', 'Tim Hortons'], Tennis: ['Nike', 'Rolex', 'Wilson', 'Lacoste', 'Uniqlo'] };

  // ------------------------------------------------------------ leagues
  var TOP5 = /Premier League|La Liga|Serie A|Bundesliga|Ligue 1/;
  var NWSL = ['Portland Thorns', 'San Diego Wave', 'Kansas City Current', 'Orlando Pride', 'NJ/NY Gotham FC', 'Washington Spirit', 'North Carolina Courage'];
  var PWHL = ['PWHL Boston', 'PWHL Minnesota', 'PWHL Montréal', 'PWHL New York', 'PWHL Ottawa', 'PWHL Toronto'];
  var WFA = ['Boston Renegades', 'Minnesota Vixen', 'St. Louis Slam', 'Arlington Impact', 'D.C. Divas'];
  var WOMENS = { 'Premier League': "Women's Super League", 'La Liga': 'Liga F', 'Serie A': 'Serie A Femminile', 'Bundesliga': 'Frauen-Bundesliga', 'Ligue 1': 'Première Ligue' };
  var MINORS = {
    Football: function (t) { return { team: t.team, league: 'Practice squad', min: 230000, max: 230000 }; },
    Soccer: function (t, c) { return c === 'United States' || c === 'Canada' ? { team: U.pick(['Louisville City', 'Sacramento Republic', 'Phoenix Rising', 'Tampa Bay Rowdies', 'Orange County SC']), league: 'USL Championship', min: 30000, max: 150000 } : c === 'United Kingdom' ? { team: U.pick(['Leeds United', 'Sunderland', 'Norwich City', 'Middlesbrough', 'Sheffield United']), league: 'EFL Championship', min: 100000, max: 1500000 } : { team: t.team.replace(/^the /, '') + ' B', league: 'Reserve team', min: 20000, max: 120000 }; },
    Baseball: function () { return { team: U.pick(['Durham Bulls', 'Las Vegas Aviators', 'Scranton/Wilkes-Barre RailRiders', 'Sacramento River Cats', 'Syracuse Mets', 'Oklahoma City Comets']), league: 'Triple-A', min: 35000, max: 60000 }; },
    Hockey: function () { return { team: U.pick(['Hershey Bears', 'Toronto Marlies', 'Coachella Valley Firebirds', 'Providence Bruins', 'Chicago Wolves']), league: 'AHL', min: 90000, max: 500000 }; },
    Tennis: function () { return { team: 'the Challenger Tour', league: 'Challenger Tour', min: 20000, max: 120000 }; }
  };
  // A team in the big league for my sport, country and gender.
  function bigLeague(sport, ctry) {
    var c = ctry || S().country, f = female();
    if (sport === 'Tennis') return { team: f ? 'the WTA Tour' : 'the ATP Tour', league: f ? 'WTA' : 'ATP', min: 0, max: 0 };
    if (f) {
      if (sport === 'Soccer') {
        if (c === 'United States' || c === 'Canada') return { team: U.pick(NWSL), league: 'NWSL', min: 48500, max: 700000 };
        var w = parse(TL.real.team('Soccer', c)); return { team: w.team.replace(/^the /, '') + ' Women', league: WOMENS[w.league] || w.league + ' Women', min: 25000, max: 450000 };
      }
      if (sport === 'Hockey') return { team: U.pick(PWHL), league: 'PWHL', min: 35000, max: 150000 };
      if (sport === 'Football') return { team: U.pick(WFA), league: "Women's Football Alliance", min: 3000, max: 40000 };
      return { team: U.pick(['Talons', 'Volts', 'Blaze', 'Bandits', 'Spark', 'Cascade']), league: 'Athletes Unlimited Softball', min: 10000, max: 90000 };
    }
    var t = parse(TL.real.team(sport, c));
    var r = sport === 'Football' ? (t.league === 'NFL' ? [800000, 50000000] : [65000, 600000])
      : sport === 'Baseball' ? (t.league === 'MLB' ? [740000, 35000000] : [60000, 5000000])
      : sport === 'Hockey' ? [775000, 13000000]
      : TOP5.test(t.league) ? [500000, 25000000] : /MLS|Liga MX|Brasileirão|J1|K League/.test(t.league) ? [90000, 8000000] : [20000, 800000];
    t.min = r[0]; t.max = r[1];
    return t;
  }
  function parse(s) { var m = String(s || '').match(/^(.*) \((.*)\)$/); return m ? { team: m[1], league: m[2] } : { team: s || 'a pro team', league: 'Pro' }; }
  function salaryFor(ovr, lg) { var t = U.clamp((ovr - 58) / 39, 0, 1); return Math.round((lg.min + (lg.max - lg.min) * Math.pow(t, 2.4)) / 1000) * 1000; }

  // ------------------------------------------------------------ state
  // The pro stage only holds while the pro job does (prison, another job or
  // emigrating ends it).
  function h() {
    var x = S().pro || null, j = S().job;
    if (x && (x.stage === 'pro' || x.stage === 'minors') && !(j && j.pro)) { x.stage = null; x.contract = null; }
    return x;
  }
  function hasJob() { var j = S().job; return !!(j && j.pro); }
  function role(o) { return o >= 90 ? ['Superstar', 1] : o >= 82 ? ['All-Star', 0.95] : o >= 72 ? ['Starting', 0.85] : o >= 64 ? ['Rotation', 0.5] : ['Backup', 0.2]; }
  function rank(o) { return Math.max(1, Math.round(Math.exp((99 - o) / 6))); }
  function title() {
    var x = S().pro; if (!x) return 'Athlete';
    if (x.sport === 'Tennis') return x.stage === 'minors' ? 'Challenger Tour Pro' : 'Tennis Pro (World No. ' + (x.rank || rank(x.ovr)) + ')';
    if (x.stage === 'minors') return (x.league === 'Practice squad' ? 'Practice Squad ' : 'Minor League ') + x.pos;
    return role(x.ovr)[0] + ' ' + x.pos;
  }
  function start(sport, pos, ovr, entry) {
    var m = me();
    var old = S().pro && S().pro.sport === sport ? S().pro : null; // a comeback keeps the record
    S().pro = { sport: sport, pos: old ? old.pos : pos, ovr: U.clamp(Math.round(ovr), 30, 85), stage: null, team: null, league: null, contract: null, seasons: old ? old.seasons : [], titles: old ? old.titles : 0, mvp: old ? old.mvp : 0, allstar: old ? old.allstar : 0, roy: old ? old.roy : false, slams: old ? old.slams : 0, best: old ? old.best : 0, entry: entry, endorse: old ? old.endorse : null, hof: old ? old.hof : null };
    var x = S().pro;
    x.pot = U.clamp(Math.round(x.ovr + Math.abs(U.gauss(12, 10)) + (m.athl - 75) / 6 + (U.chance(0.08) ? U.rand(8, 20) : 0)), x.ovr + 2, 99);
    return x;
  }
  function sign(t, years, salary, stage) {
    var s = S(), x = h();
    x.stage = stage; x.team = t.team; x.league = t.league; x.contract = { years: years, salary: salary, min: t.min, max: t.max };
    if (s.job && !s.job.pro) E.quitJob(true);
    s.job = { career: 'athlete', pro: true, fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, company: t.team + (x.sport === 'Tennis' ? '' : ' (' + t.league + ')'), salary: E.$(salary), title: title() };
  }
  // Big league if good enough, otherwise the minors.
  function placeFor(x, ctry) {
    var big = bigLeague(x.sport, ctry);
    var bar = x.sport === 'Tennis' ? 63 : female() ? 58 : 62;
    if (x.ovr >= bar) return { t: big, stage: 'pro' };
    return { t: female() && x.sport !== 'Soccer' && x.sport !== 'Tennis' ? { team: big.team + ' (development squad)', league: 'Development squad', min: 5000, max: 25000 } : MINORS[x.sport](big, ctry || S().country), stage: 'minors' };
  }

  // ------------------------------------------------------------ entry
  // From college (js/sports.js): skill 87+ gets you drafted.
  function fromDraft(sport, schoolPos, skill, round) {
    var pos = mapPos(sport, schoolPos);
    var x = start(sport, pos, 44 + (skill - 80) + U.rand(-4, 4), 'draft');
    var p = placeFor(x), first = /first/.test(round);
    var years = first ? 4 : U.rand(2, 3), sal = p.stage === 'pro' ? salaryFor(x.ovr + (first ? 6 : 0), p.t) : salaryFor(x.ovr, p.t);
    sign(p.t, years, sal, p.stage);
    x.draft = { year: S().year, round: round };
    return x;
  }
  function mapPos(sport, p) {
    if (SP[sport].pos.indexOf(p) >= 0) return p;
    return { Forward: 'Striker', Doubles: 'Singles' }[p] || U.pick(SP[sport].pos);
  }
  function schoolSkill(sport) { var s = S().sports, k = SP[sport].school; return s && s.sport === k ? s.skill : 0; }
  // Athleticism matters most; school experience helps but no longer sinks an athlete who never played it in school.
  function tryoutOdds(sport) { var m = me(); return U.clamp((m.athl - 50) / 60 + Math.max(0, schoolSkill(sport) - 35) / 100 - Math.max(0, m.age - 26) * 0.04, 0.03, 0.6); }
  function tryout(sport) {
    var m = me();
    if (m.age < 17 || m.age > 32) return done(nope('Open tryouts are for ages 17 to 32.'));
    if (count('pro_try')) return done(nope('I already went to a tryout this year.'));
    bump('pro_try');
    if (!U.chance(tryoutOdds(sport))) { E.stat('happy', -5); return done(bad('I didn\'t make it past the ' + sport.toLowerCase() + ' tryout. The scouts said I\'m not there yet.')); }
    var sk = schoolSkill(sport), pos = sk && S().sports.pos ? mapPos(sport, S().sports.pos) : U.pick(SP[sport].pos);
    var x = start(sport, pos, 30 + m.athl * 0.25 + sk * 0.25 + U.rand(-4, 4), 'tryout');
    var p = placeFor(x);
    sign(p.t, 1, salaryFor(x.ovr, p.t), p.stage);
    E.stat('happy', 15); E.fame(3);
    return done(good('I made it! I signed with ' + x.team + (p.stage === 'minors' ? ' (' + x.league + ')' : '') + ' as ' + E.an(x.pos.toLowerCase()) + '. ' + SP[sport].icon));
  }
  function tryoutMenu() {
    var x = h();
    if (x && (x.stage === 'pro' || x.stage === 'minors' || x.stage === 'retired')) return menu();
    ui().menu('Pro sports', function () {
      var items = [{ info: true, html: '<p class="muted">Open tryouts, once a year. Athleticism matters most; playing the sport in school helps a lot. College stars can also get drafted.</p>' }];
      SPORT_NAMES.forEach(function (sp) {
        var p = tryoutOdds(sp), lg = female() ? ({ Soccer: 'NWSL / WSL', Hockey: 'PWHL', Football: 'WFA', Baseball: 'Softball', Tennis: 'WTA' }[sp]) : ({ Football: 'NFL', Soccer: 'MLS / Europe', Baseball: 'MLB', Hockey: 'NHL', Tennis: 'ATP' }[sp]);
        items.push({ icon: SP[sp].icon, label: sp, sub: lg + ' · ' + (p >= 0.4 ? 'Good chance' : p >= 0.2 ? 'Fair chance' : p >= 0.08 ? 'Long shot' : 'Very long shot'), disabled: count('pro_try') > 0 || me().age < 17 || me().age > 32, onClick: function () { tryout(sp); } });
      });
      return items;
    });
  }

  // ------------------------------------------------------------ seasons
  function develop(x, extra) {
    var a = me().age, room = x.pot - x.ovr, o = SP[x.sport].old;
    var d = a < 24 ? U.rand(2, 6) : a < 28 ? U.rand(1, 4) : a < o - 4 ? U.rand(-1, 1) : a < o - 1 ? U.rand(-3, 0) : U.rand(-5, -1);
    d += extra || 0;
    if (d > 0) d = Math.min(d, Math.max(0, room));
    x.ovr = U.clamp(x.ovr + d, 20, 99);
  }
  var INJ = [['a sprained ankle', 0.15, 0], ['a pulled hamstring', 0.25, 0], ['a broken wrist', 0.35, 1], ['a torn meniscus', 0.5, 2], ['a concussion', 0.3, 1], ['a torn ACL', 1, 5], ['a ruptured Achilles', 1, 6]];
  function champName(x) {
    var l = x.league;
    if (x.sport === 'Football') return l === 'NFL' ? 'the Super Bowl' : l === 'CFL' ? 'the Grey Cup' : 'the championship';
    if (x.sport === 'Baseball') return l === 'MLB' ? 'the World Series' : l === 'NPB' ? 'the Japan Series' : l === 'KBO' ? 'the Korean Series' : 'the championship';
    if (x.sport === 'Hockey') return l === 'NHL' ? 'the Stanley Cup' : l === 'PWHL' ? 'the Walter Cup' : l === 'AHL' ? 'the Calder Cup' : 'the championship';
    return 'the ' + l + ' title';
  }
  function mvpName(x) {
    if (x.sport === 'Football') return x.league === 'NFL' ? 'NFL MVP' : 'League MVP';
    if (x.sport === 'Soccer') return female() ? 'Ballon d\'Or Féminin' : TOP5.test(x.league) ? 'Ballon d\'Or' : x.league + ' MVP';
    if (x.sport === 'Baseball') return x.pos === 'Pitcher' ? 'Cy Young Award' : x.league === 'MLB' ? 'MLB MVP' : 'League MVP';
    if (x.sport === 'Hockey') return x.league === 'NHL' ? 'Hart Trophy' : 'League MVP';
    return 'MVP';
  }
  function starName(x) { return { Football: 'Pro Bowl', Soccer: 'Team of the Season', Baseball: 'All-Star Game', Hockey: 'All-Star Game' }[x.sport]; }
  function season() {
    var s = S(), x = h(), j = s.job;
    if (!x || (x.stage !== 'pro' && x.stage !== 'minors')) return 0;
    var C = SP[x.sport], a = me().age;
    develop(x, s.flags.proTrain || 0); s.flags.proTrain = 0;
    var played = 1, injured = null;
    if (U.chance(C.inj + Math.max(0, a - 30) * 0.02 - (me().health - 70) / 500 - (s.flags.proRehab ? 0.06 : 0))) {
      injured = U.weighted(INJ.map(function (i, k) { return { w: [30, 22, 14, 10, 10, 8, 4][k] * (x.sport === 'Football' && k === 4 ? 2 : 1), i: i }; })).i;
      played = 1 - injured[1] * U.randf(0.5, 1);
      x.ovr = U.clamp(x.ovr - injured[2], 20, 99); E.stat('health', -injured[2] * 3 - 4); E.stat('happy', -6);
      if (x.sport === 'Football' && injured[0] === 'a concussion') x.concussions = (x.concussions || 0) + 1;
    }
    s.flags.proRehab = 0;
    var bigLg = x.stage === 'pro', firstBig = bigLg && !x.seasons.some(function (q) { return q.big; });
    var rec = { year: s.year, age: a, team: x.team, league: x.league, big: bigLg, ovr: x.ovr };
    var msg;
    if (x.sport === 'Tennis') tennis(x, rec, played);
    else {
      var r = role(bigLg ? x.ovr : Math.min(99, x.ovr + 14)), sh = r[1] * played;
      var k = U.clamp((x.ovr - (bigLg ? 55 : 40)) / 42 + U.randf(-0.06, 0.06), 0.02, 1);
      rec.line = sh < 0.05 ? 'Did not play' : C.line(k, sh, x.pos);
      var gp = C.games, pct = U.clamp(U.randf(0.3, 0.68) + (x.ovr - 75) / 100 * r[1] * played * 0.8, 0.12, 0.88), w = Math.round(gp * pct);
      rec.rec = w + '-' + (gp - w);
      var champ = false, playoffs = pct >= 0.55 || (pct >= 0.48 && U.chance(0.4));
      if (playoffs && U.chance(U.clamp(0.04 + (pct - 0.55) * 0.5 + (x.ovr - 82) / 300 * r[1], 0.01, 0.3))) champ = true;
      rec.result = champ ? 'Won ' + champName(x) : playoffs ? 'Made the playoffs' : 'Missed the playoffs';
      msg = C.icon + ' ' + (bigLg ? '' : x.league + ' ') + 'Season with ' + x.team + ': ' + rec.line + '. We went ' + rec.rec + (champ ? ' and won ' + champName(x) + '! 🏆' : playoffs ? ' and made the playoffs.' : '.');
      if (injured) msg += ' I missed part of the year with ' + injured[0] + '.';
      if (champ) { x.titles++; if (bigLg) E.achieve('champion'); E.fame(bigLg ? 8 : 2); E.stat('happy', 15); }
      if (bigLg) {
        var aw = [];
        if (firstBig && x.ovr >= 72 && played > 0.7 && U.chance(0.35)) { x.roy = true; aw.push('Rookie of the Year'); }
        if (x.ovr >= 82 && r[1] * played >= 0.85 && U.chance(0.25 + (x.ovr - 82) / 20)) { x.allstar++; aw.push(starName(x)); }
        if (x.ovr >= 91 && pct >= 0.55 && played > 0.85 && U.chance(0.12 + (x.ovr - 91) / 25)) { x.mvp++; aw.push(mvpName(x)); s.awards = s.awards || []; s.awards.push({ award: mvpName(x), cat: x.team, year: s.year }); E.achieve('league_mvp'); E.achieve('award'); E.fame(10); }
        if (aw.length) { rec.award = aw.join(', '); msg += ' Honors: ' + rec.award + '.'; }
      }
      E.log(msg, champ || rec.award ? 'good' : injured ? 'bad' : '');
    }
    x.seasons.push(rec);
    var earned = E.$(x.contract ? x.contract.salary : 0);
    if (x.endorse) { earned += E.$(x.endorse.pay); }
    // Fame follows stardom.
    var target = !bigLg ? 8 : x.ovr >= 90 ? 80 : x.ovr >= 82 ? 60 : x.ovr >= 72 ? 35 : 15;
    target += Math.min(15, x.titles * 3 + x.mvp * 5);
    if (s.fame < target) E.fame((target - s.fame) / 4);
    if (s.fame >= 80) E.achieve('famous');
    yearAfter(x);
    if (j) { j.salary = earned; j.title = title(); j.perf = U.clamp(x.ovr, 0, 100); j.company = x.team + (x.sport === 'Tennis' ? '' : ' (' + x.league + ')'); }
    return earned;
  }
  function tennis(x, rec, played) {
    var s = S(), r = Math.max(1, Math.round(rank(x.ovr) * U.randf(0.7, 1.3) / Math.max(0.35, played)));
    x.rank = r; if (!x.best || r < x.best) x.best = r;
    var big = x.stage === 'pro', prize = big ? Math.round(12000000 * Math.pow(r, -0.78) / 1000) * 1000 : U.rand(15, 90) * 1000;
    var wins = U.clamp(Math.round((72 - Math.log(r) * 9) * played), 3, 80), losses = U.clamp(Math.round((10 + Math.log(r) * 4) * played), 4, 30);
    var titles = !big ? 0 : r <= 3 ? U.rand(3, 7) : r <= 10 ? U.rand(1, 4) : r <= 30 ? U.rand(0, 2) : r <= 100 ? (U.chance(0.15) ? 1 : 0) : 0;
    var slams = [];
    if (big) SLAMS.forEach(function (sl) { var p = r === 1 ? 0.25 : r <= 3 ? 0.12 : r <= 10 ? 0.025 : r <= 30 ? 0.003 : 0; if (U.chance(p * played)) slams.push(sl); });
    x.slams += slams.length; x.titles += titles;
    if (slams.length) { E.achieve('grand_slam'); E.achieve('champion'); E.fame(8 * slams.length); E.stat('happy', 15); }
    rec.line = 'Year-end No. ' + r + ' · ' + wins + '-' + losses + ' · ' + U.plural(titles, 'title') + (slams.length ? ' · won ' + slams.join(', ') : '');
    rec.rec = wins + '-' + losses;
    if (r === 1 && big) { x.mvp++; rec.award = 'Year-end World No. 1'; E.achieve('league_mvp'); }
    // Prize money is the pay; travel and coaching eat a chunk of it.
    if (x.contract) x.contract.salary = Math.round(prize * 0.75);
    E.log('🎾 Tennis season: ' + rec.line + '.' + (slams.length ? ' 🏆' : '') + (rec.award ? ' I finished the year as World No. 1! 👑' : '') + ' Prize money: ' + E.fmt(E.$(prize)) + '.', slams.length || r <= 10 ? 'good' : '');
    if (x.stage === 'minors' && r <= 250) { x.stage = 'pro'; x.team = female() ? 'the WTA Tour' : 'the ATP Tour'; x.league = female() ? 'WTA' : 'ATP'; E.log('🎾 My ranking is high enough for main-draw tour events. I\'m on ' + x.team + '!', 'good'); }
    return '';
  }
  // Contracts, call-ups, trades, retirement talk and endorsements.
  function yearAfter(x) {
    var s = S(), a = me().age, C = SP[x.sport];
    if (x.sport !== 'Tennis' && x.contract) {
      x.contract.years--;
      if (x.stage === 'minors' && x.ovr >= (female() ? 58 : 62) && U.chance(0.45)) {
        var t = bigLeague(x.sport); sign(t, 2, salaryFor(x.ovr, t), 'pro');
        E.log('📞 I got called up! I\'m playing for ' + t.team + ' in the ' + t.league + ' now.', 'good'); E.stat('happy', 12); E.fame(4);
      } else if (x.contract.years <= 0) s.pending.push({ id: 'pro_fa', data: {} });
      // Rosters are ruthless: a player who falls off gets released mid-contract.
      else if (x.stage === 'pro' && x.ovr < 60 && U.chance(0.45)) { E.log('✂️ ' + x.team + ' released me.', 'bad'); E.stat('happy', -10); x.contract.years = 0; s.pending.push({ id: 'pro_fa', data: {} }); }
      else if (x.stage === 'pro' && U.chance(0.05)) { var nt = bigLeague(x.sport); if (nt.team !== x.team) { E.log('🔁 I was traded to ' + nt.team + '.'); x.team = nt.team; } }
    }
    var fading = x.ovr < (x.stage === 'minors' ? 50 : 56) || (x.stage === 'minors' && a >= 28 && x.ovr < 60) || (a >= C.old - 2 && x.ovr < 70) || a >= C.old + 3 || (a >= C.old && x.ovr < 75) || (x.concussions || 0) >= 4;
    if (fading && x.asked !== s.year) { x.asked = s.year; s.pending.push({ id: 'pro_retire', data: {} }); }
    if (!x.endorse && s.fame >= 45 && x.stage === 'pro' && U.chance(0.35)) s.pending.push({ id: 'pro_endorse', data: {} });
  }
  function retire() {
    var s = S(), x = h();
    if (hasJob()) E.quitJob(true);
    var big = x.seasons.filter(function (q) { return q.big; }).length;
    x.stage = 'retired'; x.retiredYear = s.year; x.contract = null;
    if (x.endorse && U.chance(0.5)) x.endorse = null;
    var msg = 'I retired from pro ' + x.sport.toLowerCase() + ' after ' + U.plural(x.seasons.length, 'season') + (big && big < x.seasons.length ? ' (' + big + ' in the big leagues)' : '') + (x.titles ? ' and ' + U.plural(x.titles, x.sport === 'Tennis' ? 'title' : 'championship') : '') + '. ' + SP[x.sport].icon;
    if (x.allstar >= 5 || x.titles >= 3 || x.mvp) { E.log('🎽 ' + (x.sport === 'Tennis' ? 'The tour held a farewell ceremony for me.' : x.team + ' retired my jersey.'), 'good'); E.fame(4); }
    return msg;
  }
  function yearly() {
    var s = S(), x = h();
    if (!x || s.dead) return;
    if (x.stage === 'retired' && !x.hof && x.retiredYear && s.year - x.retiredYear >= 5 && (x.mvp >= 1 || x.allstar >= 8 || (x.titles >= 2 && x.allstar >= 5) || x.slams >= 2)) {
      x.hof = s.year;
      var hall = { Football: 'the Pro Football Hall of Fame', Soccer: 'the Hall of Fame', Baseball: 'the Baseball Hall of Fame in Cooperstown', Hockey: 'the Hockey Hall of Fame', Tennis: 'the International Tennis Hall of Fame' }[x.sport];
      E.log('🏛️ I was inducted into ' + hall + '!', 'good'); E.fame(10); E.achieve('pro_hof');
    }
    if (x.endorse && !hasJob()) { var p = E.$(x.endorse.pay); E.addMoney(Math.round(p * 0.75)); E.log('👟 ' + x.endorse.brand + ' deal: ' + E.fmt(Math.round(p * 0.75)), 'money'); if (U.chance(0.25)) x.endorse = null; }
  }

  // ------------------------------------------------------------ events
  def('pro_fa', { cond: function () { var x = h(); return !!(x && (x.stage === 'pro' || x.stage === 'minors')); }, build: function () {
    var x = h(), a = me().age, ch = [];
    // Teams pay for what you'll do next, so age counts against you.
    var eff = x.ovr - Math.max(0, a - 28) * 2;
    var nOff = eff >= 80 ? 3 : eff >= 72 ? 2 : eff >= 64 && U.chance(0.6) ? 1 : 0, seen = {};
    for (var i = 0; i < nOff; i++) {
      var t = x.sport === 'Soccer' && !female() && x.ovr >= 80 && U.chance(0.5) ? bigLeague('Soccer', U.pick(['United Kingdom', 'Spain', 'Italy', 'Germany', 'France'])) : bigLeague(x.sport);
      if (seen[t.team]) continue; seen[t.team] = 1;
      (function (t) {
        var yrs = U.clamp(Math.round(U.rand(1, 5) - Math.max(0, a - 30) / 2), 1, 5), sal = salaryFor(x.ovr + U.rand(-2, 3), t);
        ch.push({ label: (t.team === x.team ? 'Re-sign with ' : '') + t.team + (t.league !== x.league ? ' (' + t.league + ')' : '') + ': ' + E.fmt(E.$(sal)) + '/yr · ' + U.plural(yrs, 'year'), run: function () {
          var moved = t.team !== x.team; sign(t, yrs, sal, 'pro'); E.stat('happy', 8);
          return good((moved ? 'I signed with ' : 'I re-signed with ') + t.team + ' for ' + U.plural(yrs, 'year') + ' at ' + E.fmt(E.$(sal)) + ' a year. ✍️');
        } });
      })(t);
    }
    if (!ch.length) { var mi = placeFor({ sport: x.sport, ovr: 0 }); ch.push({ label: 'Take a ' + mi.t.league.toLowerCase() + ' deal', run: function () { sign(mi.t, 1, salaryFor(x.ovr, mi.t), 'minors'); return 'No big-league team wanted me. I signed with ' + mi.t.team + ' to keep my dream alive.'; } }); }
    ch.push({ label: 'Retire', run: function () { return retire(); } });
    return { icon: '✍️', title: 'Free agency', text: 'My contract with ' + x.team + ' is up. I\'m ' + a + ', rated ' + x.ovr + ' overall. ' + (nOff ? 'Here are my offers:' : 'The phone isn\'t ringing.'), choices: ch };
  } });
  def('pro_retire', { cond: function () { var x = h(); return !!(x && (x.stage === 'pro' || x.stage === 'minors')); }, build: function () {
    var x = h();
    return { icon: '🌅', title: 'Time to hang it up?', text: 'My body is telling me something. I\'m ' + me().age + ' and rated ' + x.ovr + ' overall' + ((x.concussions || 0) >= 4 ? ', and the doctors are worried about my concussions' : '') + '.', choices: [
      { label: 'Retire on my own terms', run: function () { return retire(); } },
      { label: 'One more season', run: function () { if ((x.concussions || 0) >= 4) E.stat('health', -6); return 'I\'m not done yet. One more season.'; } }
    ] };
  } });
  def('pro_endorse', { cond: function () { var x = h(); return !!(x && x.stage === 'pro' && !x.endorse); }, build: function () {
    var x = h(), brand = U.pick(BRANDS[x.sport]), pay = Math.round(S().fame * S().fame * U.randf(80, 260) / 1000) * 1000;
    return { icon: '👟', title: 'Endorsement offer', text: brand + ' wants me as the face of a campaign: ' + E.fmt(E.$(pay)) + ' a year.', choices: [
      { label: 'Sign with ' + brand, run: function () { x.endorse = { brand: brand, pay: pay }; E.fame(3); return good('I\'m now ' + brand + '\'s newest athlete. 👟'); } },
      { label: 'Not interested', run: function () { return 'I turned down ' + brand + '.'; } }
    ] };
  } });

  // ------------------------------------------------------------ menus
  function bar(label, v) { return '<div class="minibar"><span>' + label + '</span><span class="track"><span class="fill ' + (v >= 80 ? 'hi' : v >= 62 ? 'mid' : 'lo') + '" style="width:' + v + '%"></span></span></div>'; }
  function card(x) {
    var C = SP[x.sport], acc = [];
    if (x.titles) acc.push('🏆 ' + U.plural(x.titles, x.sport === 'Tennis' ? 'title' : 'championship'));
    if (x.slams) acc.push('🎾 ' + U.plural(x.slams, 'Grand Slam'));
    if (x.mvp) acc.push('🥇 ' + (x.sport === 'Tennis' ? U.plural(x.mvp, 'year') + ' at No. 1' : x.mvp + '× ' + mvpName(x)));
    if (x.allstar) acc.push('⭐ ' + x.allstar + '× ' + starName(x));
    if (x.roy) acc.push('🌱 Rookie of the Year');
    if (x.best && x.sport === 'Tennis') acc.push('Career-high No. ' + x.best);
    if (x.hof) acc.push('🏛️ Hall of Fame');
    var where = x.stage === 'retired' ? 'Retired' : (x.team || '') + (x.sport === 'Tennis' ? '' : ' · ' + x.league);
    return '<div class="pr-card"><div class="pr-top"><span class="pr-ico">' + (x.team && x.stage !== 'retired' && TL.logos ? TL.logos.badge(x.team, { shape: 'team' }) : C.icon) + '</span><div><div class="pr-name">' + U.esc(x.stage === 'retired' ? 'Retired ' + x.pos : title()) + '</div><div class="pr-sub">' + U.esc(where) + '</div></div></div>' +
      bar('Overall', x.ovr) + (x.stage !== 'retired' ? bar('Potential', x.pot) : '') +
      (x.contract && x.sport !== 'Tennis' ? '<div class="pr-line">✍️ ' + E.fmt(E.$(x.contract.salary)) + '/yr · ' + U.plural(Math.max(0, x.contract.years), 'year') + ' left</div>' : '') +
      (x.endorse ? '<div class="pr-line">' + (TL.logos ? TL.logos.badge(x.endorse.brand, { size: 'xs' }) + ' ' : '👟 ') + U.esc(x.endorse.brand) + ' · ' + E.fmt(E.$(x.endorse.pay)) + '/yr</div>' : '') +
      (acc.length ? '<div class="pr-line">' + acc.join(' · ') + '</div>' : '') + '</div>';
  }
  var TRAIN = [['str', '🏋️', 'Strength & conditioning', function (x) { me().athl = U.clamp(me().athl + 2, 0, 100); E.stat('health', 2); return 1; }],
    ['skill', '🎯', 'Skill work', function () { return 1; }],
    ['film', '🎥', 'Film study', function () { E.stat('smarts', 1); return U.chance(0.6) ? 1 : 0; }],
    ['rehab', '🧊', 'Recovery & rehab', function () { S().flags.proRehab = 1; E.stat('health', 6); return 0; }]];
  function train(t) {
    var x = h();
    if (count('pro_' + t[0])) return done(nope('I already did that this year.'));
    bump('pro_' + t[0]);
    var g = t[3](x), s = S(), raised = false;
    // At my ceiling, hard work slowly raises the ceiling itself (it used to do nothing at all).
    var ceil = s.flags.proCeil && s.flags.proCeil.y === s.year ? s.flags.proCeil.n : 0;
    if (g && x.ovr >= x.pot - 1 && me().age < SP[x.sport].old - 2 && x.pot < 99 && ceil < 2 && U.chance(0.55)) { s.flags.proCeil = { y: s.year, n: ceil + 1 }; x.pot++; raised = true; }
    if (g && x.ovr < x.pot && me().age < SP[x.sport].old) { s.flags.proTrain = Math.min(2, (s.flags.proTrain || 0) + (U.chance(0.5) ? 1 : 0)); }
    // Work done now shows in next season's rating; say where I stand.
    return done(t[2] + ' ' + SP[x.sport].icon + (t[0] === 'rehab' ? ' I feel fresh. Less chance of getting hurt this season.' : ' I\'m sharpening my game. (overall ' + x.ovr + ', potential ' + x.pot + (raised ? ', raised by my hard work' : x.ovr >= x.pot ? ', at my ceiling' : '') + ')'));
  }
  function menu() {
    var x = h();
    if (!x) return tryoutMenu();
    ui().menu('Pro ' + x.sport.toLowerCase() + ' ' + SP[x.sport].icon, function () {
      x = h();
      var items = [{ info: true, html: card(x) }];
      if (x.stage === 'pro' || x.stage === 'minors') {
        items.push({ section: 'Train' });
        TRAIN.forEach(function (t) { items.push({ icon: t[1], label: t[2], disabled: count('pro_' + t[0]) > 0, onClick: function () { train(t); } }); });
        items.push({ section: 'Off the field' });
        items.push({ icon: '🎤', label: 'Press conference', disabled: count('pro_press') > 0, onClick: function () {
          bump('pro_press');
          if (U.chance(0.15)) { E.fame(3); E.karma(-2); E.addMoney(-E.$(25000)); return done(bad('I ripped the refs on camera and got fined ' + E.fmt(E.$(25000)) + '.')); }
          E.fame(2); return done('I handled the media like a pro. 🎤');
        } });
        if (x.stage === 'pro' && x.sport !== 'Tennis') items.push({ icon: '🔁', label: 'Request a trade', disabled: count('pro_trade') > 0, onClick: function () {
          bump('pro_trade');
          if (!U.chance(x.ovr >= 80 ? 0.6 : 0.3)) return done(nope('The front office said no. They\'re not trading me.'));
          var t = bigLeague(x.sport); if (t.team === x.team) return done(nope('No deal came together.'));
          x.team = t.team; x.league = t.league; S().job.company = t.team + ' (' + t.league + ')';
          return done(good('I got my wish: I\'ve been traded to ' + t.team + '. 🔁'));
        } });
        if (S().fame >= 30) items.push({ icon: '💝', label: 'Start a charity foundation', right: E.fmt(E.$(100000)), disabled: !!x.charity, onClick: function () {
          if (S().money < E.$(100000)) return done(nope('That takes ' + E.fmt(E.$(100000)) + ' to set up.'));
          E.addMoney(-E.$(100000)); x.charity = true; E.karma(10); E.fame(3); return done(good('I started a foundation for kids in my hometown. 💝'));
        } });
        items.push({ icon: '🌅', label: 'Retire', danger: true, onClick: function () { ui().confirm('Retire?', 'Hang it up for good?', function () { ui().back(); done(retire()); }); } });
      } else if (x.stage === 'retired') {
        items.push({ icon: '🎙️', label: 'Work as a TV analyst', disabled: count('pro_tv') > 0, onClick: function () { bump('pro_tv'); var p = E.$(Math.round((50 + S().fame * 8) * 1000)); E.addMoney(p); return done('I broke down games on TV this season and earned ' + E.fmt(p) + '. 🎙️'); } });
        if (me().age <= 40) items.push({ icon: '🔄', label: 'Attempt a comeback', disabled: count('pro_try') > 0, onClick: function () { x.stage = null; tryout(x.sport); } });
      }
      items.push({ icon: '📊', label: 'Season history', sub: U.plural(x.seasons.length, 'season'), onClick: history });
      return items;
    });
  }
  function history() {
    var x = h();
    ui().menu('Season history', function () {
      if (!x.seasons.length) return [{ info: true, html: '<p class="muted">No seasons yet.</p>' }];
      return x.seasons.slice().reverse().map(function (q) {
        return { icon: TL.logos && q.team ? TL.logos.badge(q.team, { shape: 'team' }) : SP[x.sport].icon, label: q.year + ' · ' + (q.team || '').replace(/^the /, '') + ' (age ' + q.age + ')', sub: q.line + (q.rec && x.sport !== 'Tennis' ? ' · ' + q.rec : '') + (q.award ? ' · ' + q.award : ''), right: q.ovr ? String(q.ovr) : '' };
      });
    });
  }

  // ------------------------------------------------------------ hooks
  // Saves from before v1.17: an old generic "athlete" job becomes a pro career.
  function migrate(j) {
    var t = parse(j.company), lg = t.league;
    var sport = /NFL|CFL/.test(lg) ? 'Football' : /MLB|NPB|KBO|LMB/.test(lg) ? 'Baseball' : /NHL/.test(lg) ? 'Hockey' : /Tour/.test(j.company || '') ? 'Tennis' : 'Soccer';
    var x = start(sport, U.pick(SP[sport].pos), [62, 70, 78, 86, 93][j.level] || 62, 'tryout');
    var p = bigLeague(sport); if (sport !== 'Tennis' && t.team && t.league !== 'Pro') { p.team = t.team; }
    sign(p, 2, salaryFor(x.ovr, p), 'pro');
    return x;
  }
  function summary() { var x = h(); if (!x) return 'Open tryouts · age 17–32'; return x.stage === 'retired' ? 'Retired · ' + U.plural(x.seasons.length, 'season') : title() + ' · ' + x.team; }
  function aboutRow() {
    var x = S().pro; if (!x || !x.seasons.length) return null;
    var bits = [x.sport, U.plural(x.seasons.length, 'season')];
    if (x.titles) bits.push(U.plural(x.titles, x.sport === 'Tennis' ? 'title' : 'championship'));
    if (x.slams) bits.push(U.plural(x.slams, 'Grand Slam'));
    if (x.mvp && x.sport !== 'Tennis') bits.push(x.mvp + '× ' + mvpName(x));
    if (x.hof) bits.push('Hall of Fame');
    return [SP[x.sport].icon + ' Pro sports', bits.join(' · ')];
  }
  return { menu: menu, tryoutMenu: tryoutMenu, season: season, yearly: yearly, title: title, summary: summary, aboutRow: aboutRow, fromDraft: fromDraft, migrate: migrate, retire: retire, active: function () { var x = h(); return !!(x && (x.stage === 'pro' || x.stage === 'minors')); } };
})();
