/* TheLife — basketball career: high school varsity, college recruiting and
 * March Madness, the draft, pro seasons with real stats, a player profile
 * (shooting, playmaking, defense, athleticism) shaped by how you train,
 * contracts with contenders or rebuilding teams, trades, injuries, Game 7
 * moments, shoe deals, All-Star Weekend contests, the Olympics, awards,
 * retirement and the Hall of Fame. Women play in the WNBA. State lives in
 * S().hoops; a pro player's job has job.hoops = true. */
TL.hoops = (function () {
  var U = TL.util, D = TL.data, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  // The pro stage only holds while the basketball job does: taking another job,
  // emigrating, prison or retirement elsewhere ends it.
  function h() {
    var x = S().hoops || null, j = S().job;
    if (x && x.stage === 'pro' && !(j && j.hoops)) { x.stage = null; x.contract = null; }
    return x;
  }
  function onceAYear(key) { var y = S().yearActs || (S().yearActs = {}); if (y[key]) return false; y[key] = 1; return true; }
  function usedThisYear(key) { return !!(S().yearActs || {})[key]; }

  // ------------------------------------------------------------ real names
  var NBA = ['Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets', 'Chicago Bulls', 'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets', 'Detroit Pistons', 'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers', 'LA Clippers', 'Los Angeles Lakers', 'Memphis Grizzlies', 'Miami Heat', 'Milwaukee Bucks', 'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks', 'Oklahoma City Thunder', 'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns', 'Portland Trail Blazers', 'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors', 'Utah Jazz', 'Washington Wizards'];
  var WNBA = ['Atlanta Dream', 'Chicago Sky', 'Connecticut Sun', 'Dallas Wings', 'Golden State Valkyries', 'Indiana Fever', 'Las Vegas Aces', 'Los Angeles Sparks', 'Minnesota Lynx', 'New York Liberty', 'Phoenix Mercury', 'Seattle Storm', 'Washington Mystics'];
  var EURO = ['Real Madrid', 'FC Barcelona', 'Olympiacos', 'Panathinaikos', 'Fenerbahçe', 'Anadolu Efes', 'Maccabi Tel Aviv', 'Olimpia Milano', 'Virtus Bologna', 'Bayern Munich', 'ALBA Berlin', 'Žalgiris Kaunas', 'Partizan Belgrade', 'AS Monaco'];
  var GLEAGUE = ['South Bay Lakers', 'Santa Cruz Warriors', 'Maine Celtics', 'Westchester Knicks', 'Sioux Falls Skyforce', 'Austin Spurs', 'Iowa Wolves', 'Rio Grande Valley Vipers'];
  var COLLEGES = ['Duke Blue Devils', 'Kentucky Wildcats', 'Kansas Jayhawks', 'North Carolina Tar Heels', 'UConn Huskies', 'UCLA Bruins', 'Gonzaga Bulldogs', 'Villanova Wildcats', 'Michigan State Spartans', 'Arizona Wildcats', 'Baylor Bears', 'Texas Longhorns', 'Houston Cougars', 'Purdue Boilermakers', 'Indiana Hoosiers', 'Syracuse Orange'];
  var SCHOOL_OF = { 'Duke Blue Devils': 'Duke University', 'Kentucky Wildcats': 'University of Kentucky', 'Kansas Jayhawks': 'University of Kansas', 'North Carolina Tar Heels': 'UNC Chapel Hill', 'UConn Huskies': 'University of Connecticut', 'UCLA Bruins': 'UCLA', 'Gonzaga Bulldogs': 'Gonzaga University', 'Villanova Wildcats': 'Villanova University', 'Michigan State Spartans': 'Michigan State University', 'Arizona Wildcats': 'University of Arizona', 'Baylor Bears': 'Baylor University', 'Texas Longhorns': 'UT Austin', 'Houston Cougars': 'University of Houston', 'Purdue Boilermakers': 'Purdue University', 'Indiana Hoosiers': 'Indiana University', 'Syracuse Orange': 'Syracuse University' };
  var SHOES = ['Nike', 'Jordan Brand', 'Adidas', 'Puma', 'New Balance', 'Under Armour', 'Anta', 'Li-Ning'];
  var POS = { PG: 'Point Guard', SG: 'Shooting Guard', SF: 'Small Forward', PF: 'Power Forward', C: 'Center' };
  var INJURIES = [['a sprained ankle', 8, 0], ['a hamstring strain', 12, 0], ['a broken hand', 20, 1], ['a torn meniscus', 30, 2], ['a torn ACL', 82, 5], ['a ruptured Achilles', 82, 7]];
  var ROUNDS = ['first round', 'second round', 'conference finals', 'Finals'];
  var RESULTS = ['Lost in the first round', 'Lost in the second round', 'Lost in the conference finals', 'Lost in the Finals', 'Won the championship'];
  var MADNESS = ['Round of 64', 'Round of 32', 'Sweet 16', 'Elite Eight', 'Final Four', 'national championship game'];
  var HOSTS = { 1976: 'Montreal', 1980: 'Moscow', 1984: 'Los Angeles', 1988: 'Seoul', 1992: 'Barcelona', 1996: 'Atlanta', 2000: 'Sydney', 2004: 'Athens', 2008: 'Beijing', 2012: 'London', 2016: 'Rio de Janeiro', 2020: 'Tokyo', 2024: 'Paris', 2028: 'Los Angeles', 2032: 'Brisbane' };
  var POWERS = ['Spain', 'France', 'Serbia', 'Canada', 'Australia', 'Argentina', 'Lithuania', 'Germany', 'Greece', 'Slovenia'];

  function league() { return me().gender === 'F' ? 'WNBA' : 'NBA'; }
  // The real teams of the season (js/nba.js), with the old lists as a fallback.
  function teams() { var t = TL.nba && TL.nba.teams(me().gender, S().year); return t && t.length ? t : me().gender === 'F' ? WNBA : NBA; }
  function homeLeague() { return !TL.nba || TL.nba.exists(me().gender, S().year); } // no WNBA before 1997
  var CBA = ['Rockford Lightning', 'Quad City Thunder', 'Sioux Falls Skyforce', 'La Crosse Catbirds', 'Yakima Sun Kings', 'Grand Rapids Hoops'];
  var DLEAGUE = ['Austin Toros', 'Fort Wayne Mad Ants', 'Sioux Falls Skyforce', 'Rio Grande Valley Vipers', 'Iowa Energy', 'Bakersfield Jam', 'Idaho Stampede', 'Reno Bighorns'];
  function minorTeams() { var y = S().year; return y < 2002 ? CBA : y < 2018 ? DLEAGUE : GLEAGUE; }
  // How the minor league was known in a given year.
  function lgName(lg, y) { return lg === 'G League' && TL.nba ? TL.nba.minors(y || S().year) : lg; }
  // Pro salaries grew much faster than prices: scale today's pay scale to the era.
  var AVG = [[1950, 4000], [1960, 9000], [1970, 35000], [1980, 170000], [1985, 330000], [1990, 750000], [1995, 1900000], [2000, 3600000], [2005, 4900000], [2010, 5800000], [2015, 5000000], [2020, 7700000], [2025, 12000000]];
  var WAVG = [[1997, 30000], [2005, 45000], [2015, 75000], [2025, 120000]];
  function eraPay() {
    var y = S().year, t = me().gender === 'F' ? WAVG : AVG, now = t[t.length - 1][1];
    if (y >= t[t.length - 1][0]) return 1;
    var v = t[0][1];
    for (var i = 1; i < t.length; i++) if (y <= t[i][0]) { var a = t[i - 1], b = t[i], f = (y - a[0]) / (b[0] - a[0]); v = y < t[0][0] ? t[0][1] : a[1] + (b[1] - a[1]) * U.clamp(f, 0, 1); break; }
    var price = TL.history ? TL.history.priceLevel(y) : 1;
    return U.clamp(v / now / Math.max(0.05, price), 0.004, 1);
  }
  function games() { return me().gender === 'F' ? 40 : 82; }
  function cm2ft(cm) { var inch = Math.round(cm / 2.54); return Math.floor(inch / 12) + '′' + (inch % 12) + '″'; }
  function posFor(cm, g) { var o = g === 'F' ? -12 : 0; return cm < 191 + o ? 'PG' : cm < 198 + o ? 'SG' : cm < 204 + o ? 'SF' : cm < 209 + o ? 'PF' : 'C'; }
  function opponents(x) { var lg = x.league, pool = lg === 'EuroLeague' ? EURO : lg === 'G League' ? minorTeams() : teams(); return pool.filter(function (t) { return t !== x.team; }); }
  // "the Warriors" or "Stephen Curry and the Warriors".
  function withStar(team) { var st = TL.nba && TL.nba.starsOn(me().gender, team, S().year); return (st && st.length ? U.pick(st) + ' and the ' : 'the ') + team; }

  function start(stage) {
    var m = me(), g = m.gender;
    var cm = Math.round(U.gauss ? U.gauss(g === 'F' ? 178 : 196, 8) : U.rand(g === 'F' ? 168 : 185, g === 'F' ? 193 : 213));
    cm = U.clamp(cm, g === 'F' ? 160 : 172, g === 'F' ? 203 : 224);
    var sp = S().sports, ms = sp && sp.sport === 'Basketball Team' ? (sp.skill - 40) / 8 : 0; // middle school hoops count
    var ovr = U.clamp(Math.round(23 + m.athl * 0.32 + (cm - (g === 'F' ? 178 : 196)) * 0.5 + ms + U.rand(-6, 6)), 20, 70);
    S().hoops = { stage: stage, cm: cm, pos: posFor(cm, g), num: U.pick([0, 1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 15, 21, 23, 24, 30, 32, 33, 34, 35]), ovr: ovr,
      pot: U.clamp(Math.round(ovr + Math.abs(U.gauss(9, 7)) + (m.athl - 65) / 6 + (U.chance(0.06) ? U.rand(8, 16) : 0) + (TL.talents ? TL.talents.ceiling('hoops') : 0)), ovr + 4, 99), seasons: [], rings: 0, mvp: 0, allstar: 0, fmvp: 0, roy: false, stars: 0, fame0: 0 };
    prof(S().hoops);
    return S().hoops;
  }
  function stars(o) { return o >= 66 ? 5 : o >= 60 ? 4 : o >= 53 ? 3 : o >= 45 ? 2 : 1; }

  // ------------------------------------------------------- player profile
  // Four attributes, kept as offsets from my overall rating so OVR still sums
  // me up: my position sets the starting shape, and what I train shifts it.
  var ATTR = [['sho', 'Shooting', '🎯'], ['pla', 'Playmaking', '🧠'], ['def', 'Defense', '🛡️'], ['ath', 'Athleticism', '💥']];
  var SHAPE = { PG: { sho: 2, pla: 8, def: -4, ath: -6 }, SG: { sho: 8, pla: 1, def: -4, ath: -5 }, SF: { sho: 3, pla: -1, def: 1, ath: -3 }, PF: { sho: -3, pla: -4, def: 3, ath: 4 }, C: { sho: -8, pla: -5, def: 7, ath: 6 } };
  var BADGES = { sho: '🎯 Sharpshooter', pla: '🧠 Floor General', def: '🔒 Lockdown Defender', ath: '💥 Highlight Dunker' };
  function prof(x) {
    if (!x.off) {
      var t = SHAPE[x.pos] || SHAPE.SF, a = ((me() && me().athl) || 60) - 70;
      x.off = {};
      ATTR.forEach(function (k) { x.off[k[0]] = t[k[0]] + U.rand(-4, 4) + (k[0] === 'ath' ? Math.round(a / 6) : 0); });
      norm(x);
    }
    return x.off;
  }
  // The profile is relative: offsets average zero, so working on everything
  // evenly keeps a balanced game and focusing on one skill makes a specialist.
  function norm(x) {
    var o = x.off, m = (o.sho + o.pla + o.def + o.ath) / 4;
    ATTR.forEach(function (k) { o[k[0]] = U.clamp(Math.round((o[k[0]] - m) * 10) / 10, -15, 15); });
  }
  function attr(x, k) { return U.clamp(Math.round(x.ovr + prof(x)[k]), 20, 99); }
  function badges(x) { return ATTR.filter(function (k) { return attr(x, k[0]) >= 85; }).map(function (k) { return BADGES[k[0]]; }); }
  function archetype(x) {
    var o = prof(x), ks = ['sho', 'pla', 'def', 'ath'].sort(function (a, b) { return o[b] - o[a]; });
    if (o[ks[0]] - o[ks[3]] < 6) return 'All-around player';
    var big = x.pos === 'C' || x.pos === 'PF';
    return { 'pla+sho': 'Shot creator', 'def+sho': '3-and-D ' + (big ? 'big' : 'wing'), 'ath+sho': big ? 'Stretch big' : 'Athletic scorer', 'def+pla': 'Two-way playmaker', 'ath+pla': big ? 'Point forward' : 'Slashing playmaker', 'ath+def': big ? 'Rim protector' : 'Lockdown defender' }[[ks[0], ks[1]].sort().join('+')];
  }

  // Growth toward potential while young; decline from about 30.
  function develop(x, extra) {
    var a = me().age, room = x.pot - x.ovr;
    var d = a < 23 ? U.rand(2, 6) : a < 27 ? U.rand(0, 3) : a < 29 ? U.rand(-1, 1) : a < 32 ? U.rand(-3, 0) : a < 35 ? U.rand(-4, -1) : U.rand(-6, -2);
    d += extra || 0;
    if (d > 0) d = Math.min(d, Math.max(0, room));
    x.ovr = U.clamp(x.ovr + d, 20, 99);
  }

  // A season's stat line from rating, profile, role and position.
  function statLine(x, minutes) {
    var o = x.ovr, f = minutes / 36 * (me().gender === 'F' ? 0.8 : 1), p = x.pos, of = x.off || { sho: 0, pla: 0, def: 0, ath: 0 };
    var a = function (k) { return U.clamp(o + of[k], 20, 99); }, guard = p === 'PG' || p === 'SG', big = p === 'C' || p === 'PF';
    var eff = o <= 85 ? o : 85 + (o - 85) * 0.6; // scoring flattens out at the very top
    var ppg = Math.max(0.5, ((eff - 50) * 0.75 * (1 + (of.sho + of.ath * 0.5) / 60) + U.randf(-3, 3)) * f + (p === 'SG' || p === 'SF' ? 1.5 : 0));
    var rpg = Math.max(0.3, ((p === 'C' ? 9 : p === 'PF' ? 7.5 : p === 'SF' ? 5 : 3.5) * (o / 80) * (1 + (of.def * 0.5 + of.ath) / 40) + U.randf(-1, 1)) * f);
    var apg = Math.max(0.2, ((p === 'PG' ? 7.5 : p === 'SG' ? 4 : p === 'SF' ? 3.2 : 2) * (o / 80) * (1 + of.pla / 25) + U.randf(-0.8, 0.8)) * f);
    var spg = Math.max(0.1, (0.5 + (a('def') - 60) / 45 + (guard ? 0.3 : 0)) * f + U.randf(-0.2, 0.2));
    var bpg = Math.max(0, ((big ? 0.8 : 0.2) + (a('def') + a('ath') - 130) / (big ? 30 : 70)) * f + U.randf(-0.15, 0.15));
    var fg = U.clamp(0.41 + (a('ath') - 70) / 450 + (a('sho') - 70) / 600 + (big ? 0.06 : 0) + U.randf(-0.02, 0.02), 0.36, 0.68);
    var tp = U.clamp(0.3 + (a('sho') - 70) / 260 + U.randf(-0.025, 0.025), 0.22, 0.47);
    return { ppg: +ppg.toFixed(1), rpg: +rpg.toFixed(1), apg: +apg.toFixed(1), spg: +spg.toFixed(1), bpg: +bpg.toFixed(1), fg: Math.round(fg * 1000) / 10, tp: Math.round(tp * 1000) / 10 };
  }
  // A game plan bends the stat line: shots, passes or stops.
  function planLine(l, k) {
    var f = { score: { ppg: 1.12, apg: 0.85, fg: -1.5 }, team: { ppg: 0.93, apg: 1.3, fg: 0.8 }, def: { ppg: 0.92, spg: 1.4, bpg: 1.4 } }[k];
    if (!f) return l;
    ['ppg', 'rpg', 'apg', 'spg', 'bpg'].forEach(function (s) { if (f[s]) l[s] = +(l[s] * f[s]).toFixed(1); });
    if (f.fg) l.fg = Math.round((l.fg + f.fg) * 10) / 10;
    return l;
  }
  function gamePlan() {
    var s = S(), set = function (k, msg) { s.flags.hoopsPlan = { y: s.year, k: k }; return done(msg); };
    ui().choose('📋 Game plan', 'What kind of season do I want to have?', [
      { label: '🎯 Score-first (more points, more shots, a bit less winning)', fn: function () { set('score', 'I\'m hunting buckets this season. Give me the ball. 🎯'); } },
      { label: '🤝 Team-first (more assists, my team wins more)', fn: function () { set('team', 'I\'m making everyone around me better this season. 🤝'); } },
      { label: '🔒 Lockdown defense (steals, blocks, a shot at DPOY)', fn: function () { set('def', 'I\'m guarding the other team\'s best player every night. 🔒'); } }
    ]);
  }
  function role(o) { return o >= 90 ? ['Franchise Superstar', 36] : o >= 84 ? ['All-Star Starter', 34] : o >= 77 ? ['Starter', 30] : o >= 70 ? ['Rotation Player', 22] : o >= 63 ? ['Bench Player', 14] : ['Deep Bench', 6]; }
  function fmtLine(l) { return l.ppg + ' PTS · ' + l.rpg + ' REB · ' + l.apg + ' AST'; }
  function fmtMore(l) { return l.spg == null ? '' : l.spg + ' STL · ' + l.bpg + ' BLK · ' + l.fg + ' FG% · ' + l.tp + ' 3P%'; }

  // ------------------------------------------------------------- honors
  // Pro awards by name with the years won; school honors as plain text.
  function award(x, name, line) { var a = x.aw || (x.aw = {}); (a[name] = a[name] || []).push(S().year); if (line) (line.honors = line.honors || []).push(name); }
  function awards(x, re) { var a = x.aw || {}, n = 0; Object.keys(a).forEach(function (k) { if (re.test(k)) n += a[k].length; }); return n; }
  function honor(x, t) { (x.honors = x.honors || []).push(t); }
  function hasHonor(x, re) { return (x.honors || []).some(function (t) { return re.test(t); }); }

  // Every team has a strength that carries over from year to year: contenders
  // stay good for a while and rebuilding teams take time.
  function tq(t) {
    var g = me().gender;
    if (TL.league && TL.league.active(g, S().year)) { var lq = TL.league.quality(g, t); if (lq != null) return lq; }
    var x = h(), m = x.tq || (x.tq = {}); if (m[t] == null) m[t] = U.rand(32, 68); return m[t]; }
  function outlook(q) { return q >= 60 ? 'contender' : q >= 49 ? 'playoff team' : q >= 39 ? 'middle of the pack' : 'rebuilding'; }
  function teamKind(q) { return q >= 60 ? 'a contender' : q >= 49 ? 'a playoff team' : q >= 39 ? 'a middle-of-the-pack team' : 'a rebuilding team'; }
  function drift(x) { Object.keys(x.tq || {}).forEach(function (t) { var q = x.tq[t]; x.tq[t] = U.clamp(Math.round(q + (50 - q) * 0.12 + U.rand(-6, 6)), 25, 75); }); }

  // ------------------------------------------------------ school & college
  function amateurSeason(x) {
    var s = S(), e = s.edu, hs = x.stage === 'hs', cls = '';
    develop(x, s.flags.hoopsTrain ? 1 : 0);
    s.flags.hoopsTrain = 0;
    // Growing stronger and quicker as a teenager lifts my ceiling too.
    if (me().athl >= 70 && x.pot < 99 && U.chance((me().athl - 55) / 60)) x.pot++;
    var mins = x.ovr >= (hs ? 55 : 72) ? 32 : x.ovr >= (hs ? 45 : 64) ? 22 : 12;
    var l = statLine({ ovr: x.ovr + (hs ? 22 : 8), pos: x.pos, off: prof(x) }, mins);
    // Big programs win a lot in college; my own game swings it either way.
    var w = hs ? U.clamp(Math.round(U.rand(8, 22) + (x.ovr - 45) * 0.6), 2, 28) : U.clamp(Math.round(U.rand(17, 29) + (x.ovr - 65) * 0.35), 8, 34), gp = hs ? 30 : 35;
    var q = { year: s.year, age: me().age, team: hs ? (e && e.school) || 'High school' : x.team, league: hs ? 'High school' : 'NCAA', ppg: l.ppg, rpg: l.rpg, apg: l.apg, spg: l.spg, bpg: l.bpg, fg: l.fg, tp: l.tp, rec: w + '-' + (gp - w) };
    x.seasons.push(q);
    var msg = '🏀 ' + (hs ? 'Varsity' : 'College') + ' season: ' + fmtLine(l) + '. We went ' + q.rec + '.';
    if (hs) {
      if (w >= 24 && U.chance(0.35)) { q.result = 'Won the state title'; msg += ' We won the state title! 🏆'; cls = 'good'; E.fame(3); E.achieve('state_champ'); }
      x.stars = stars(x.ovr); if (x.stars >= 4) E.fame(2);
      if (e && e.year >= E.eduYears(e.stage, e.grad) && x.stars >= 5 && !hasHonor(x, /McDonald/)) { honor(x, 'McDonald\'s All-American (' + s.year + ')'); msg += ' I was named a McDonald\'s All-American!'; cls = 'good'; E.fame(3); }
    } else {
      // March Madness: a good record gets us into the bracket.
      if (w >= 22 || (w >= 19 && U.chance(0.6))) {
        var rd = 0, p = U.clamp(0.5 + (x.ovr - 68) / 40 + (w - 25) / 30, 0.2, 0.85);
        while (rd < 6 && U.chance(p)) rd++;
        q.result = rd === 6 ? 'Won the national championship' : 'Lost in the ' + MADNESS[rd];
        if (rd === 6) { msg += ' We won the national championship! 🏆'; cls = 'good'; E.fame(8); honor(x, 'NCAA champion (' + s.year + ')'); }
        else { msg += ' March Madness: we ' + (rd >= 4 ? 'made the Final Four and ' : '') + 'lost in the ' + MADNESS[rd] + '.'; if (rd >= 4) E.fame(3); }
      } else { q.result = 'Missed the NCAA Tournament'; msg += ' We missed the NCAA Tournament.'; }
      if (x.ovr >= 72 && l.ppg >= 17 && U.chance(0.35 + (x.ovr - 72) / 15)) { honor(x, 'All-American (' + s.year + ')'); q.honors = ['All-American']; msg += ' I was named an All-American!'; cls = 'good'; E.fame(3); E.achieve('all_american'); }
      if (x.ovr >= 76 && l.ppg >= 20 && U.chance(0.3)) { honor(x, 'National Player of the Year (' + s.year + ')'); (q.honors = q.honors || []).push('Player of the Year'); msg += ' I won National Player of the Year!'; E.fame(5); }
    }
    E.log(msg, cls);
    if (!hs && TL.hsocial) TL.hsocial.season(x, q);
  }

  // ------------------------------------------------------------ pro seasons
  function salaryFor(o, rookiePick) {
    var g = me().gender === 'F';
    var f = eraPay();
    if (rookiePick) return Math.round((g ? 75000 : 12000000 * Math.pow(0.9, rookiePick - 1) + 1100000) * f);
    var max = g ? 250000 : 52000000, min = g ? 66000 : 1200000;
    var t = U.clamp((o - 62) / 33, 0, 1);
    return Math.round((min + (max - min) * Math.pow(t, 2.2)) * f);
  }
  function sign(team, lg, years, salary, title) {
    var s = S(), x = h();
    x.stage = 'pro'; x.team = team; x.league = lg; x.contract = { years: years, salary: salary };
    if (s.job && !s.job.hoops) E.quitJob(true);
    s.job = { career: 'athlete', hoops: true, fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, company: 'the ' + team.replace(/^the /, '') + ' (' + lg + ')', salary: E.$(salary), title: title || role(x.ovr)[0] };
  }
  // A title: rings, the achievement and maybe Finals MVP. With `out`, the lines
  // are collected for a Game 7 story instead of logged.
  function champion(x, lg, out, fm) {
    var pro = lg === 'NBA' || lg === 'WNBA' || lg === 'EuroLeague', say = function (t) { if (out) out.push(t); else E.log(t, 'good'); };
    if (pro) { x.rings++; E.achieve('hoops_ring'); }
    say('💍 We won the ' + (lg === 'EuroLeague' ? 'EuroLeague title' : lg === 'G League' ? 'G League title' : lg + ' championship') + '!' + (x.rings > 1 && pro ? ' That\'s ring number ' + x.rings + '.' : ''));
    E.stat('happy', 15); E.fame(10);
    if (fm != null ? fm : x.ovr >= 84 && U.chance(0.5)) { x.fmvp++; award(x, 'Finals MVP', x.seasons[x.seasons.length - 1]); say('🏅 I was named Finals MVP!'); E.fame(8); }
  }
  function season() {
    var s = S(), x = h(), j = s.job;
    if (j && j.coach) return coachSeason();
    if (!x || x.stage !== 'pro') return 0;
    var before = x.ovr, F = me().gender === 'F', sc = F ? 0.8 : 1;
    develop(x, s.flags.hoopsTrain ? 1 : 0); s.flags.hoopsTrain = 0;
    var r = role(x.ovr), gp = games(), mins = r[1], earned = j.salary || E.$(x.contract.salary);
    // Injury check
    var injured = null;
    if (U.chance(0.1 + Math.max(0, me().age - 29) * 0.03 - (me().health - 70) / 400)) {
      injured = U.weighted(INJURIES.map(function (i, k) { return { w: [30, 22, 16, 12, 8, 4][k], i: i }; })).i;
      x.ovr = U.clamp(x.ovr - injured[2], 20, 99); E.stat('health', -injured[2] * 3 - 3); E.stat('happy', -6);
    }
    var played = injured ? Math.max(0, gp - Math.round(injured[1] * gp / 82)) : gp - U.rand(0, Math.round(gp * 0.08));
    // My game plan this season (chosen from the menu last year): score-first, team-first or lockdown D.
    var gpl = s.flags.hoopsPlan && s.flags.hoopsPlan.y >= s.year - 1 ? s.flags.hoopsPlan.k : null; delete s.flags.hoopsPlan;
    var l = planLine(statLine(x, mins), gpl), lg = x.league, proLeague = lg === 'NBA' || lg === 'WNBA' || lg === 'EuroLeague', home = lg === 'NBA' || lg === 'WNBA';
    // Franchises move and rename (Seattle became Oklahoma City); keep up.
    if (home && TL.nba) { var nowName = TL.nba.current(me().gender, x.team, s.year); if (nowName !== x.team) { E.log('🚚 The ' + x.team + ' are now the ' + nowName + '.'); x.team = nowName; j.company = 'the ' + nowName + ' (' + lg + ')'; } }
    // From my first season in the league, the whole league is simulated
    // (js/league.js): my team's record and playoff run come from it.
    x.lgBoost = gpl === 'team' ? 2 : gpl === 'def' ? 1 : gpl === 'score' ? -1 : 0;
    var sim = home && TL.league ? TL.league.mine(me().gender, s.year, { clutch: mins >= 22 }) : null;
    x.lgBoost = 0;
    var mates = home && TL.nba ? TL.nba.starsOn(me().gender, x.team, s.year) : [];
    var wins, rec, pct, result, round = -1, odds = 0;
    if (sim) {
      var gp0 = gp; gp = sim.w + sim.l; played = Math.min(gp, Math.round(played * gp / gp0)); wins = sim.w;
      round = sim.wait ? sim.wait.round : sim.round;
      result = round < 0 ? 'Missed the playoffs' : RESULTS[round];
    } else {
      // My team's own strength matters as much as I do.
      var strength = 41 + (tq(x.team) - 50) * 0.6 + U.rand(-9, 9) + (x.ovr + (gpl === 'team' ? 2 : gpl === 'def' ? 1 : gpl === 'score' ? -1 : 0) - 75) * (mins / 36) + (played / gp - 1) * 10;
      wins = U.clamp(Math.round(strength * gp / 82), Math.round(gp * 0.15), Math.round(gp * 0.85));
      if (wins / gp < 0.5) result = 'Missed the playoffs';
      else {
        round = 0; odds = U.clamp(0.3 + (wins / gp - 0.5) + (x.ovr - 80) / 150, 0.1, 0.72);
        while (round < 4 && U.chance(odds)) round++;
        result = RESULTS[round];
      }
    }
    rec = wins + '-' + (gp - wins); pct = wins / gp;
    // My best night of the season.
    var hi = played >= 10 ? Math.round(l.ppg + Math.max(4, l.ppg * 0.45) * U.randf(0.6, 1.6) + (U.chance(0.04) ? U.rand(8, 15) : 0)) : 0;
    var line = { year: s.year, age: me().age, team: x.team, league: lg, mates: mates.length ? mates.slice(0, 3) : undefined, gp: played, ppg: l.ppg, rpg: l.rpg, apg: l.apg, spg: l.spg, bpg: l.bpg, fg: l.fg, tp: l.tp, hi: hi, rec: rec, result: result };
    var rookie = !x.seasons.some(function (q) { return q.league === x.league && x.league !== 'NCAA'; }) && x.league !== 'G League';
    x.seasons.push(line);
    E.log('🏀 ' + s.year + ' with the ' + x.team.replace(/^the /, '') + ' (' + rec + '): ' + fmtLine(l) + ' in ' + played + ' games.' + (mates.length ? ' Teammates included ' + mates.slice(0, 2).join(' and ') + '.' : '') + (injured ? ' I missed time with ' + injured[0] + '.' : ''), injured ? 'bad' : '');
    if (hi) {
      var foe = U.pick(opponents(x)), best = !x.high || hi > x.high.pts;
      if (hi >= 50) { x.fifty = (x.fifty || 0) + 1; E.log('🔥 I dropped ' + hi + ' points on ' + (home ? withStar(foe) : 'the ' + foe) + (best ? ', a career high' : '') + '!', 'good'); E.fame(3); }
      else if (hi >= 40 && best) E.log('🔥 Career night: ' + hi + ' points against ' + (home ? withStar(foe) : 'the ' + foe) + '.', 'good');
      if (best) x.high = { pts: hi, year: s.year, opp: foe };
    }
    // Awards
    var allStar = false;
    if (proLeague) {
      if (sim ? sim.roy : rookie && x.ovr >= 74 && l.ppg >= 14 * sc && U.chance(0.55)) { x.roy = true; award(x, 'Rookie of the Year', line); E.log('🌱 I won Rookie of the Year!', 'good'); E.fame(8); }
      if ((l.ppg >= 22 * sc || x.ovr >= 86) && played >= gp * 0.6 && U.chance(0.75)) { allStar = true; x.allstar++; award(x, 'All-Star', line); E.log('⭐ I was named an All-Star' + (x.allstar > 1 ? ' for the ' + U.ordinal(x.allstar) + ' time' : '') + '!', 'good'); E.fame(5); }
      if (sim ? sim.mvp && played >= gp * 0.65 : x.ovr >= 91 && pct >= 0.6 && played >= gp * 0.8 && U.chance(0.15 + (x.ovr - 91) * 0.05)) { x.mvp++; award(x, 'MVP', line); E.log('🏆 I won league MVP!', 'good'); E.fame(15); E.achieve('hoops_mvp'); }
      if (played >= gp * 0.65) {
        var score = x.ovr + (l.ppg - 22 * sc) * 0.25 + U.randf(-1.5, 1.5), tm = score >= 91 ? 0 : score >= 88 ? 1 : score >= 85.5 ? 2 : -1;
        if (tm >= 0) { var nm = (lg === 'EuroLeague' ? 'All-EuroLeague' : 'All-' + lg) + ' ' + ['First', 'Second', 'Third'][tm] + ' Team'; award(x, nm, line); E.log('🏅 I made the ' + nm + '.', 'good'); E.fame(3 - tm); }
        if (mins >= 30 && attr(x, 'def') >= (gpl === 'def' ? 85 : 90) && U.chance(0.15 + (gpl === 'def' ? 0.15 : 0) + (attr(x, 'def') - 90) / 30)) { award(x, 'Defensive Player of the Year', line); E.log('🔒 I won Defensive Player of the Year!', 'good'); E.fame(4); }
        if (mins === 22 && l.ppg >= 13 * sc && U.chance(0.15)) { award(x, 'Sixth Man of the Year', line); E.log('🪑 I won Sixth Man of the Year!', 'good'); E.fame(3); }
        if (!awards(x, /^Most Improved/) && x.ovr - before >= 5 && x.ovr >= 72 && me().age <= 27 && U.chance(0.45)) { award(x, 'Most Improved Player', line); E.log('📈 I won Most Improved Player!', 'good'); E.fame(3); }
        if (l.ppg >= 29 * sc && U.chance(0.3)) { award(x, 'Scoring title', line); E.log('🔥 I led the league in scoring at ' + l.ppg + ' points a game!', 'good'); E.fame(4); }
      }
      // All-Star Weekend contests go to the best shooters and dunkers.
      var c3 = attr(x, 'sho') >= 86, dunk = !F && attr(x, 'ath') >= 84 && me().age <= 30;
      if (lg !== 'EuroLeague' && (c3 || dunk) && played >= gp * 0.5 && U.chance(0.3)) s.pending.push({ id: 'hoops_contest', data: { year: s.year, kind: c3 && (!dunk || U.chance(0.5)) ? '3pt' : 'dunk' } });
    }
    // Playoffs: sometimes it comes down to one possession.
    if (sim && sim.wait) {
      E.log('Playoffs: it all came down to ' + (lg === 'NBA' ? 'Game 7' : 'the deciding game') + ' of the ' + ROUNDS[sim.wait.round] + ' against ' + withStar(sim.wait.opp) + '.');
      s.pending.push({ id: 'hoops_clutch', data: { year: s.year, round: sim.wait.round, opp: sim.wait.opp, lg: me().gender } });
    }
    else if (round < 0) E.stat('happy', -3);
    else if (round === 4) champion(x, lg, null, sim ? !!sim.fmvp : null);
    else if (sim) E.log('Playoffs: we ' + result.charAt(0).toLowerCase() + result.slice(1) + '.');
    else if (proLeague && mins >= 22 && U.chance(0.4)) {
      var opp = U.pick(opponents(x));
      E.log('Playoffs: it all came down to ' + (lg === 'NBA' ? 'Game 7' : 'the deciding game') + ' of the ' + ROUNDS[round] + ' against ' + (home ? withStar(opp) : 'the ' + opp) + '.');
      s.pending.push({ id: 'hoops_clutch', data: { year: s.year, round: round, odds: odds, opp: opp } });
    } else E.log('Playoffs: we ' + result.charAt(0).toLowerCase() + result.slice(1) + '.');
    // The rest of the league: the real champion and MVP (or invented ones in the future).
    if (sim) {
      var H = sim.H || {}, nw = [];
      if (sim.champ && round !== 4) nw.push('the ' + sim.champ + ' won the ' + lg + ' title' + (round === 3 ? ', beating us in the Finals' : ''));
      if (H.mvp && !sim.mvp) nw.push(H.mvp + ' (' + H.mvpT + ') won MVP');
      if (H.top) nw.push('the ' + H.topTeam + ' took ' + H.top + ' first overall');
      if (nw.length) E.log('📰 Around the league: ' + nw.join(', ') + '.');
      if (H.moves && H.moves.length) E.log('📰 ' + H.moves.slice(0, 2).join(' '));
    } else if (home && TL.nba) {
      var realChamp = round === 4 ? null : TL.nba.champOf(me().gender, s.year), realMvp = TL.nba.mvpOf(me().gender, s.year), wonMvp = (line.honors || []).indexOf('MVP') >= 0;
      var news = [];
      if (realChamp && realChamp !== x.team) news.push('the ' + realChamp + ' won the ' + lg + ' title' + (round === 3 ? ', beating us in the Finals' : ''));
      if (realMvp && !wonMvp) news.push(realMvp + ' won MVP');
      if (news.length) E.log('📰 Around the league: ' + news.join(', and ') + '.');
    }
    // The Olympics, every four years, for the best players.
    var usa = S().country === 'United States', yr = s.year;
    if (proLeague && yr % 4 === 0 && yr >= (F ? 1976 : 1992) && !(usa && yr === 1980) && played >= gp * 0.5 && x.ovr >= (usa ? 84 : 79) && me().age <= 36 && U.chance(0.8)) s.pending.push({ id: 'hoops_olympics', data: { year: yr } });
    // Shoe deal pays every year
    if (x.shoe) { var sp = E.$(x.shoe.pay); E.addMoney(sp); E.log('👟 ' + x.shoe.brand + ' shoe deal: ' + E.fmt(sp), 'money'); }
    // Contract year ticks down; free agency when it runs out.
    x.contract.years--;
    j.title = role(x.ovr)[0];
    if (me().age >= 40 || x.ovr < 56 || (me().age >= 35 && x.ovr < 68)) { S().pending.push({ id: 'hoops_retire', data: {} }); }
    else if (x.league === 'G League' && x.ovr >= 74 && U.chance(0.3)) { var t = U.pick(teams()); sign(t, league(), 2, salaryFor(x.ovr)); E.log('📞 The ' + t + ' called me up from the ' + lgName('G League') + '! I\'m in the ' + league() + '!', 'good'); E.stat('happy', 12); }
    else if (x.contract.years <= 0) S().pending.push({ id: 'hoops_fa', data: {} });
    // Outplaying my deal: the team tries to extend me before free agency.
    else if ((lg === 'NBA' || lg === 'WNBA') && x.ovr >= 74 && salaryFor(x.ovr) >= x.contract.salary * 1.4 && x.extYear !== s.year && U.chance(0.55)) { x.extYear = s.year; S().pending.push({ id: 'hoops_ext', data: {} }); }
    else if (!x.shoe && S().fame >= 45 && U.chance(0.5)) S().pending.push({ id: 'hoops_shoe', data: {} });
    drift(x);
    if (TL.hsocial) TL.hsocial.season(x, line);
    return earned;
  }

  // ---------------------------------------------------------------- yearly
  function hofWorthy(x) {
    var allTeams = awards(x, /^All-.* Team$/), dpoy = awards(x, /^Defensive/), golds = awards(x, /^Olympic gold/);
    return x.mvp >= 1 || x.allstar >= 8 || allTeams >= 5 || (x.rings >= 2 && x.allstar >= 3) || (x.rings >= 1 && x.allstar >= 5) || (dpoy >= 2 && x.allstar >= 3) || (golds >= 2 && x.allstar >= 4) || awards(x, /^Scoring title/) >= 2;
  }
  function yearly() {
    var s = S(), x = h(), m = me();
    if (x && TL.league && (TL.league.st(m.gender) || s.year > TL.nba._raw.LAST_REAL)) TL.league.ensure(m.gender, s.year);
    if (!x) {
      // Making the high school basketball team starts the journey.
      if (s.edu && s.edu.stage === 'high' && s.edu.team === 'Basketball Team') { start('hs'); E.log('🏀 I\'m on the varsity basketball team. I wear #' + h().num + '.'); }
      return;
    }
    if (x.stage === 'hs') {
      if (s.edu && s.edu.stage === 'high' && s.edu.team === 'Basketball Team') amateurSeason(x);
      else if (!s.edu && E.hasDegree('hs') && !x.recruited) { x.recruited = true; s.pending.push({ id: 'hoops_recruit', data: {} }); }
      else if (s.edu && s.edu.stage === 'high' && s.edu.team !== 'Basketball Team') { x.stage = null; }
    } else if (x.stage === 'college') {
      if (s.edu && s.edu.stage === 'uni') { amateurSeason(x); if (m.age >= 19) s.pending.push({ id: 'hoops_declare', data: {} }); }
      else s.pending.push({ id: 'hoops_draft', data: {} });
    } else if (x.stage === 'retired') {
      if (!x.hof && x.retiredYear && s.year - x.retiredYear >= 5 && hofWorthy(x)) {
        x.hof = s.year; E.log('🏛️ I was inducted into the Naismith Basketball Hall of Fame!', 'good'); E.fame(15); E.achieve('hoops_hof');
      }
    }
  }

  // ---------------------------------------------------------------- events
  function def(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  function pro() { var x = h(); return !!(x && x.stage === 'pro'); }
  def('hoops_recruit', { cond: function () { return !!h(); }, build: function () {
    var x = h(), st = x.stars || stars(x.ovr);
    var offers = st >= 2 ? U.shuffle(COLLEGES.slice()).slice(0, st >= 4 ? 4 : st >= 3 ? 3 : 1) : [];
    var ch = offers.map(function (c) { return { label: '🎓 ' + c + (st >= 4 && c === offers[0] ? ' (full ride)' : ''), run: function () {
      x.stage = 'college'; x.team = c; x.league = 'NCAA';
      S().edu = null;
      E.enroll('uni', { major: 'Communications', funding: 'scholarship', school: SCHOOL_OF[c] || c, tier: 2 });
      E.stat('happy', 10); E.fame(3);
      return good('I committed to play for the ' + c + ' on a basketball scholarship! 🏀');
    } }; });
    if (x.ovr >= 60) ch.push({ label: '🌍 Go pro overseas', run: function () { sign(U.pick(EURO), 'EuroLeague', 2, salaryFor(x.ovr - 10), 'Prospect'); return 'I skipped college and signed with ' + h().team + ' overseas.'; } });
    ch.push({ label: 'Hang up my sneakers', run: function () { x.stage = null; return 'I decided basketball isn\'t my future.'; } });
    return { icon: '🏀', title: 'College recruiting', text: (offers.length ? 'I\'m a ' + st + '-star recruit (' + cm2ft(x.cm) + ' ' + POS[x.pos] + ', ' + archetype(x).toLowerCase() + '). ' + offers.length + ' program' + (offers.length > 1 ? 's' : '') + ' offered me a scholarship.' : 'No college programs offered me a scholarship.'), choices: ch };
  } });
  def('hoops_declare', { cond: function () { return !!h(); }, build: function () {
    var x = h();
    return { icon: '🏀', title: 'The ' + league() + ' Draft', text: 'Scouts are talking. Draft experts project me as ' + projection(x.ovr) + '. Should I declare?', choices: [
      { label: 'Declare for the draft', run: function () { S().edu = null; return draft(); } },
      { label: 'Stay in school another year', run: function () { E.stat('smarts', 2); return 'I\'m staying in school to develop my game.'; } }
    ] };
  } });
  def('hoops_draft', { cond: function () { return !!h(); }, build: function () {
    return { icon: '🏀', title: 'Draft night', text: 'My college career is over. Time to see where I land.', choices: [{ label: 'Watch the draft', run: function () { return draft(); } }] };
  } });
  function projection(o) { return o >= 80 ? 'a lottery pick' : o >= 74 ? 'a first-round pick' : o >= 68 ? 'a second-round pick' : 'undrafted'; }
  function draft() {
    var x = h(), o = x.ovr + U.rand(-4, 4), pick;
    // The WNBA has only 36 picks, so its bar is higher.
    var f = me().gender === 'F' ? 2 : 0;
    if (o >= 82 + f) pick = U.rand(1, 8); else if (o >= 77 + f) pick = U.rand(6, f ? 12 : 30); else if (o >= 72 + f) pick = U.rand(f ? 13 : 31, f ? 36 : 60); else pick = 0;
    if (me().gender === 'F' && pick > 36) pick = 0;
    var yr = S().year;
    if (!homeLeague()) { x.draft = { year: yr, pick: 0 }; sign(U.pick(EURO), 'EuroLeague', 2, Math.round(90000 * eraPay()), 'Prospect'); return 'There was no women\'s pro league at home yet, so I signed with ' + h().team + ' in Europe.'; }
    if (!pick) {
      x.draft = { year: yr, pick: 0 };
      if (me().gender === 'F') { sign(U.pick(EURO), 'EuroLeague', 1, 90000, 'Prospect'); return 'I went undrafted, so I signed overseas with ' + h().team + '.'; }
      sign(U.pick(minorTeams()), 'G League', 1, Math.round(40000 * eraPay()), 'Two-Way Hopeful');
      return 'I went undrafted. I signed with the ' + h().team + ' in the ' + lgName('G League') + ' to prove myself.';
    }
    var team = U.pick(teams());
    x.draft = { year: yr, pick: pick, team: team };
    // Lottery picks usually land on rebuilding teams.
    if (pick <= 14) { var q0 = tq(team); (x.tq = x.tq || {})[team] = Math.min(q0, U.rand(30, 45)); }
    sign(team, league(), pick <= (me().gender === 'F' ? 12 : 30) ? 4 : 2, salaryFor(x.ovr, pick), 'Rookie');
    E.stat('happy', 15); E.fame(pick <= 5 ? 15 : pick <= 14 ? 8 : 4);
    if (pick <= (me().gender === 'F' ? 12 : 30)) E.achieve('hoops_draft');
    E.achieve('ceo');
    return good('With the ' + U.ordinal(pick) + ' pick in the ' + yr + ' ' + league() + ' Draft, the ' + team + ' selected me! 🧢');
  }
  def('hoops_fa', { cond: pro, build: function () {
    var x = h(), o = x.ovr, ch = [], lg = x.league, bet = x.betSelf ? 1.12 : 1; x.betSelf = false;
    // Teams only want players good enough for the league.
    var gl = lg === 'G League' ? 3 : 0; // G Leaguers have to prove a bit more
    var interest = o >= 76 + gl ? U.rand(2, 3) : o >= 71 + gl ? U.rand(1, 2) : o >= 67 + gl && U.chance(0.4) ? 1 : 0;
    var pool = U.shuffle(teams().filter(function (t) { return t !== x.team; })).slice(0, interest);
    if (o >= 66 && (lg === 'NBA' || lg === 'WNBA')) ch.push({ label: '✍️ Re-sign with the ' + x.team + ' (' + outlook(tq(x.team)) + ', ' + E.fmt(E.$(Math.round(salaryFor(o) * bet))) + '/yr)', run: function () { var t = x.team; sign(t, lg, U.rand(2, 4), Math.round(salaryFor(o) * bet)); E.stat('happy', 5); return 'I re-signed with the ' + t + '.'; } });
    // Contenders pay less (the ring is the pitch); rebuilding teams pay more.
    pool.forEach(function (t) {
      var q = tq(t), pay = Math.round(salaryFor(o) * bet * (q >= 60 ? U.randf(0.8, 1.0) : q < 39 ? U.randf(1.05, 1.3) : U.randf(0.9, 1.15))), yrs = U.rand(1, 5);
      ch.push({ label: '🖊️ ' + t + ' (' + outlook(q) + '): ' + yrs + ' yrs, ' + E.fmt(E.$(pay)) + '/yr', run: function () { sign(t, league(), yrs, pay); E.stat('happy', 6); return good('I signed a ' + yrs + '-year deal with the ' + t + '!'); } });
    });
    if (!ch.length || o < 66) ch.push({ label: '🌍 Sign overseas', run: function () { sign(U.pick(EURO), 'EuroLeague', 2, Math.round(salaryFor(o + 6) * 0.6)); return 'I signed with ' + h().team + ' in Europe.'; } });
    ch.push({ label: '🧓 Retire', run: function () { return retire(); } });
    return { icon: '✍️', title: 'Free agency', text: 'My contract with the ' + x.team + ' is up. I\'m ' + me().age + ' and rated ' + o + '. Do I chase money or a ring?', choices: ch };
  } });
  // A breakout player on a cheap deal: the extension (a max deal for superstars), betting on myself, or a holdout.
  def('hoops_ext', { cond: function () { var x = h(); return !!(x && x.stage === 'pro' && x.contract && x.contract.years >= 1); }, build: function () {
    var x = h(), c = x.contract, a = me().age, market = salaryFor(x.ovr), maxDeal = x.ovr >= 88;
    if (market < c.salary * 1.25) return null;
    var offer = maxDeal ? salaryFor(95) : Math.round(market * U.randf(0.85, 0.95) / 1000) * 1000, yrs = U.clamp(c.years + U.rand(2, 4) - Math.max(0, a - 30), c.years + 1, 5);
    var take = function (pay, msg) { c.salary = pay; c.years = yrs; x.betSelf = false; if (S().job) S().job.salary = E.$(pay); return msg; };
    var ch = [
      { label: (maxDeal ? '💰 Sign the max: ' : '✍️ Sign it: ') + E.fmt(E.$(offer)) + '/yr for ' + U.plural(yrs, 'year'), run: function () { E.stat('happy', 8); return good(take(offer, 'I signed a ' + U.plural(yrs, 'year') + (maxDeal ? ' max' : '') + ' extension with the ' + x.team + ' at ' + E.fmt(E.$(offer)) + ' a year. ✍️')); } },
      { label: '🎲 Bet on myself (play it out, hit free agency)', run: function () { x.betSelf = true; E.fame(1); return 'I turned down the extension. Stay healthy, keep balling, and free agency pays more. 🎲'; } }
    ];
    if (x.ovr >= 82 && !maxDeal) ch.push({ label: '😤 Demand a trade or a bigger deal', run: function () {
      if (U.chance(U.clamp(0.3 + (x.ovr - 82) / 20, 0.3, 0.75))) { var big = Math.round(market * U.randf(1, 1.1) / 1000) * 1000; E.stat('happy', 10); E.fame(2); return good(take(big, 'The ' + x.team + ' caved: ' + E.fmt(E.$(big)) + ' a year for ' + U.plural(yrs, 'year') + '. 💰')); }
      if (U.chance(0.5)) { var old = x.team.replace(/^the /, ''), t = U.pick(teams().filter(function (q) { return q !== x.team; })); x.team = t; if (S().job) S().job.company = 'the ' + t + ' (' + x.league + ')'; E.fame(2); return 'The ' + old + ' wouldn\'t pay, so they traded me. I\'m on the ' + t + ' now, ' + teamKind(tq(t)) + '. 🔁'; }
      E.stat('happy', -8); E.fame(-2); E.karma(-1);
      return bad('The front office called my bluff. Fans booed me on opening night, and I\'m still on my old deal.');
    } });
    return { icon: '✍️', title: maxDeal ? 'Max extension' : 'Contract extension', text: 'The ' + x.team.replace(/^the /, '') + ' want to lock me up before free agency. I\'m rated ' + x.ovr + ', and my deal pays ' + E.fmt(E.$(c.salary)) + ' a year with ' + U.plural(c.years, 'year') + ' left.', choices: ch };
  } });
  def('hoops_shoe', { cond: pro, build: function () {
    var x = h(), b = U.pick(SHOES), pay = Math.round(salaryFor(x.ovr) * U.randf(0.15, 0.5) + 200000 * (S().fame / 50));
    return { icon: '👟', title: 'Shoe deal', text: b + ' wants to sign me to a signature sneaker deal worth ' + E.fmt(E.$(pay)) + ' a year.', choices: [
      { label: 'Sign with ' + b, run: function () { x.shoe = { brand: b, pay: pay }; E.fame(6); return good('I signed a shoe deal with ' + b + '! My first signature sneaker drops next year. 👟'); } },
      { label: 'Hold out for a better offer', run: function () { return 'I turned down ' + b + '. My agent says more offers will come.'; } }
    ] };
  } });
  def('hoops_retire', { build: function () {
    var x0 = h();
    if (!x0 || x0.stage !== 'pro' || !x0.contract) return null; // already out of the league (quit, cut or another job)
    return { icon: '🏀', title: 'Time to retire?', text: 'My body is telling me something. At ' + me().age + ', my rating has slipped to ' + h().ovr + '.', choices: [
      { label: 'Retire', run: function () { return retire(); } },
      { label: 'One more year', run: function () { var x = h(); if (!x || !x.contract) return 'My playing days were already over.'; x.contract.years = 1; S().job.salary = E.$(salaryFor(x.ovr)); return 'I\'m giving it one more season.'; } }
    ] };
  } });
  // Game 7, down two, the ball in my hands. Making it keeps the run going.
  function lastSeason(x, year) { var q = x && x.seasons[x.seasons.length - 1]; return q && q.year === year ? q : null; }
  def('hoops_clutch', { cond: pro, build: function (d) {
    var x = h(), q = lastSeason(x, d && d.year);
    if (!q || q.clutch || d.round == null) return null;
    var g7 = q.league === 'NBA' ? 'Game 7' : 'The deciding game';
    return { icon: '⏱️', title: g7, text: g7 + ' of the ' + ROUNDS[d.round] + ' against the ' + d.opp + '. We\'re down two with eight seconds left, and the ball is in my hands.', choices: [
      { label: '🎯 Pull up for a three to win it (shooting ' + attr(x, 'sho') + ')', run: function () { return clutch(d, 'sho'); } },
      { label: '💥 Attack the rim to tie it (athleticism ' + attr(x, 'ath') + ')', run: function () { return clutch(d, 'ath'); } },
      { label: '🧠 Draw the defense and find the open man (playmaking ' + attr(x, 'pla') + ')', run: function () { return clutch(d, 'pla'); } }
    ] };
  } });
  function clutch(d, how) {
    var x = h(), q = lastSeason(x, d.year);
    if (!q || q.clutch) return 'The moment had passed.';
    q.clutch = 1;
    var a = attr(x, how), p = how === 'sho' ? 0.18 + (a - 75) / 70 : how === 'ath' ? (0.45 + (a - 75) / 60) * 0.6 : 0.3 + (a - 75) / 90;
    var made = U.chance(U.clamp(p, 0.08, 0.65));
    if (d.lg && TL.league) return clutchSim(x, q, d, how, made);
    if (!made) {
      E.stat('happy', -6);
      return bad({ sho: 'My three rimmed out at the buzzer. Our season is over.', ath: 'I drove, but they blocked my layup at the rim. Our season is over.', pla: 'I found the open man, but his shot was off. Our season is over.' }[how]);
    }
    x.clutch = (x.clutch || 0) + 1; E.fame(how === 'pla' ? 2 : 5); E.stat('happy', 10);
    if (how !== 'pla') E.achieve('hoops_clutch');
    var out = [{ sho: '🎯 I buried a step-back three at the buzzer to win it!', ath: '💥 I tied it at the rim and we won in overtime!', pla: '🧠 I drew two defenders and found the open man for the game-winner!' }[how]];
    var round = d.round + 1;
    while (round < 4 && U.chance(d.odds || 0.4)) round++;
    q.result = RESULTS[round];
    if (round === 4) { out.push('We rode that shot all the way.'); champion(x, q.league, out); }
    else out.push('We won the series, then lost in the ' + ROUNDS[round] + '.');
    return good(out.join(' '));
  }
  // The simulated league's bracket waits on my shot.
  function clutchSim(x, q, d, how, made) {
    var r = TL.league.resume(d.lg, made), out = [];
    if (!made) {
      E.stat('happy', -6);
      out.push({ sho: 'My three rimmed out at the buzzer. Our season is over.', ath: 'I drove, but they blocked my layup at the rim. Our season is over.', pla: 'I found the open man, but the shot was off. Our season is over.' }[how]);
      q.result = RESULTS[d.round];
      if (r && r.champ) out.push('The ' + r.champ + ' went on to win the title.');
      return bad(out.join(' '));
    }
    x.clutch = (x.clutch || 0) + 1; E.fame(how === 'pla' ? 2 : 5); E.stat('happy', 10);
    if (how !== 'pla') E.achieve('hoops_clutch');
    out.push({ sho: '🎯 I buried a step-back three at the buzzer to win it!', ath: '💥 I tied it at the rim and we won in overtime!', pla: '🧠 I drew two defenders and found the open man for the game-winner!' }[how]);
    var round = r && r.round != null ? r.round : d.round + 1;
    q.result = RESULTS[round];
    if (round === 4) { out.push('We rode that shot all the way.'); champion(x, q.league, out, !!(r && r.fmvp)); }
    else { out.push('We won the series, then lost in the ' + ROUNDS[round] + '.'); if (r && r.champ) out.push('The ' + r.champ + ' won the title.'); }
    return good(out.join(' '));
  }
  def('hoops_contest', { cond: pro, build: function (d) {
    var x = h();
    if (!lastSeason(x, d && d.year) || !d.kind) return null;
    var three = d.kind === '3pt', name = three ? 'Three-Point Contest' : 'Slam Dunk Contest';
    return { icon: three ? '🎯' : '💥', title: 'All-Star Weekend', text: 'I was invited to the ' + name + ' at All-Star Weekend.', choices: [
      { label: three ? 'Enter and let it fly' : 'Enter and bring out my best dunks', run: function () {
        var a = attr(x, three ? 'sho' : 'ath');
        if (U.chance(U.clamp(0.12 + (a - (three ? 86 : 84)) / 40, 0.08, 0.45))) { award(x, name, lastSeason(x, d.year)); E.fame(4); E.stat('happy', 8); return good(three ? '🎯 I won the Three-Point Contest! The money ball rack was automatic.' : '💥 I won the Slam Dunk Contest with a between-the-legs windmill!'); }
        E.fame(1); return three ? 'I made the final round of the Three-Point Contest but came up just short.' : 'My best dunk took three tries. The judges were not impressed.';
      } },
      { label: 'Sit it out and rest', run: function () { E.stat('health', 2); return 'I skipped the contest and rested up for the second half of the season.'; } }
    ] };
  } });
  def('hoops_olympics', { cond: pro, build: function (d) {
    var x = h(), yr = d && d.year;
    if (!yr || (x.olympics || []).indexOf(yr) >= 0) return null;
    var c = S().country, where = HOSTS[yr] ? ' in ' + HOSTS[yr] : '';
    return { icon: '🏅', title: 'The Olympics', text: (c === 'United States' ? 'Team USA' : E.countryName(c).replace(/^the /, 'The ') + '\'s national team') + ' wants me for the ' + yr + ' Olympics' + where + '.', choices: [
      { label: 'Represent my country', run: function () {
        (x.olympics = x.olympics || []).push(yr);
        var usa = c === 'United States', power = POWERS.indexOf(c) >= 0, F = me().gender === 'F';
        var odds = usa ? (F ? [0.85, 0.08, 0.04] : [0.7, 0.15, 0.08]) : power ? [0.15, 0.2, 0.2] : [0.04, 0.07, 0.1];
        var r = U.rand(1, 1000) / 1000, medal = r < odds[0] ? 'gold' : r < odds[0] + odds[1] ? 'silver' : r < odds[0] + odds[1] + odds[2] ? 'bronze' : null;
        if (!medal) { E.fame(2); return 'We came up short of a medal at the Olympics' + where + '. Wearing my country\'s colors was still an honor.'; }
        award(x, 'Olympic ' + medal); E.fame(medal === 'gold' ? 8 : 4); E.stat('happy', medal === 'gold' ? 12 : 6);
        if (medal === 'gold') E.achieve('hoops_gold');
        return good({ gold: '🥇', silver: '🥈', bronze: '🥉' }[medal] + ' We won Olympic ' + medal + where + '!');
      } },
      { label: 'Rest my body this summer', run: function () { E.stat('health', 3); return 'I turned down the Olympics to rest my body for next season.'; } }
    ] };
  } });
  // ------------------------------------------------------------ coaching
  // After playing: an assistant's chair, then (if I'm good) a head job.
  // Coaching skill comes from my basketball IQ and grows every season.
  function cskill(x) { return Math.round(x.coach.skill); }
  function coachPay(head, skill) { return Math.round((head ? (me().gender === 'F' ? 450000 : 3000000) * (1 + skill / 60) : (me().gender === 'F' ? 120000 : 600000)) * eraPay()); }
  function becomeCoach() {
    var x = h(), s = S();
    if (me().age > 68) return done(nope('I\'m a little old to start coaching.'));
    var iq = attr(x, 'pla'), fame = s.fame || 0, ch = U.clamp(0.35 + (iq - 60) / 80 + fame / 300 + (x.rings ? 0.1 : 0), 0.15, 0.95);
    if (!onceAYear('hoops_coachtry')) return done(nope('I already made my calls this year.'));
    if (!U.chance(ch)) return done('I called around, but nobody had a bench spot open. Next year. 📞');
    var team = U.pick(teams());
    x.coach = x.coach || { skill: U.clamp(20 + iq / 3 + (x.seasons.length) / 2, 20, 60), years: 0, head: 0, wins: 0, losses: 0, titles: 0, coy: 0 };
    x.coach.team = team; x.coach.role = 'assistant'; x.coach.hire = s.year;
    if (s.job) E.quitJob(true);
    s.job = { career: 'coach', hoops: true, coach: true, fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, company: 'the ' + team.replace(/^the /, '') + ' (' + league() + ')', salary: E.$(coachPay(false, x.coach.skill)), title: 'Assistant Coach' };
    E.log('📋 I joined the ' + team.replace(/^the /, '') + ' as an assistant coach.', 'good');
    return done(good('The ' + team.replace(/^the /, '') + ' hired me as an assistant coach. 📋'));
  }
  function coachSeason() {
    var s = S(), x = h(), c = x && x.coach, j = s.job;
    if (!c || !j) return 0;
    c.years++; c.skill = U.clamp(c.skill + U.rand(1, 3) + (me().smarts - 60) / 40, 0, 99);
    if (c.role === 'assistant') {
      E.log('📋 Another season on the ' + c.team.replace(/^the /, '') + '\'s bench. Coaching skill ' + cskill(x) + '.');
      if (c.years >= 2 && U.chance(U.clamp(0.15 + (c.skill - 45) / 60 + (s.fame || 0) / 400, 0.05, 0.75))) s.pending.push({ id: 'hoops_coach_offer', data: {} });
      return j.salary;
    }
    // Head coach: the roster's quality plus my coaching.
    var gp = games(), q = tq(c.team), strength = (q - 50) * 1.05 + (c.skill - 55) / 2.5 + U.rand(-7, 7);
    var plan = s.flags.coachPlan && s.flags.coachPlan.y >= s.year - 1 ? s.flags.coachPlan.k : null; delete s.flags.coachPlan;
    strength += c.carry || 0; c.carry = 0;
    strength += plan === 'win' ? 5 : plan === 'youth' ? -3 : plan === 'system' ? -2 : 0;
    if (plan === 'system' && c.skill < 65) c.skill = Math.min(c.skill + 1, 65);
    var wins = U.clamp(Math.round(gp / 2 + strength * gp / 82), Math.round(gp * 0.12), Math.round(gp * 0.88)), losses = gp - wins;
    c.head++; c.wins += wins; c.losses += losses;
    var rec = wins + '-' + losses, expect = Math.round(gp / 2 + (q - 50) * 1.05 * gp / 82), msg = '📋 Coaching the ' + c.team.replace(/^the /, '') + ': ' + rec + '.', cls = '';
    if (wins / gp >= 0.5) {
      var round = 0, odds = U.clamp(0.3 + (wins / gp - 0.5) + (c.skill - 60) / 150, 0.1, 0.72);
      while (round < 4 && U.chance(odds)) round++;
      msg += ' Playoffs: ' + RESULTS[round].charAt(0).toLowerCase() + RESULTS[round].slice(1) + '.';
      if (round === 4) { c.titles++; E.fame(6); E.stat('happy', 20); msg += ' 🏆'; cls = 'good'; (s.awards = s.awards || []).push({ award: league() + ' championship', cat: 'as head coach of the ' + c.team.replace(/^the /, ''), year: s.year }); }
    } else msg += ' We missed the playoffs.';
    if (wins - expect >= 12 && U.chance(0.35)) { c.coy++; award(x, 'Coach of the Year', { year: s.year }); msg += ' I was named Coach of the Year!'; cls = 'good'; E.fame(3); }
    E.log(msg, cls);
    drift(x);
    // The offseason plan echoes into next year's roster.
    if (plan === 'win') { c.carry = -U.rand(4, 7); E.log('📉 Trading our picks for veterans thinned out the ' + c.team.replace(/^the /, '') + '\'s future.'); }
    if (plan === 'youth') { c.carry = U.rand(2, 5); E.log('📈 The young players I developed on the ' + c.team.replace(/^the /, '') + ' took a step forward.'); }
    // Owners are impatient.
    c.bad = wins / gp < 0.37 ? (c.bad || 0) + 1 : 0;
    if (c.bad >= 2 && U.chance(0.6)) { E.log('✂️ The ' + c.team.replace(/^the /, '') + ' fired me as head coach.', 'bad'); E.stat('happy', -10); c.role = 'assistant'; c.bad = 0; c.carry = 0; x.coach.fired = (x.coach.fired || 0) + 1; j.title = 'Assistant Coach'; j.salary = E.$(coachPay(false, c.skill)); c.team = U.pick(teams()); j.company = 'the ' + c.team.replace(/^the /, '') + ' (' + league() + ')'; E.log('📋 I landed back on a bench as an assistant with the ' + c.team.replace(/^the /, '') + '.'); }
    return j.salary;
  }
  def('hoops_coach_offer', { build: function () {
    var x = h(), c = x && x.coach; if (!c || c.role !== 'assistant') return null;
    var pool = U.shuffle(teams().slice()), bad = pool.filter(function (t) { return tq(t) < 45; })[0] || pool[0], ok = pool.filter(function (t) { return tq(t) >= 50 && t !== bad; })[0];
    var take = function (t) { c.role = 'head'; c.team = t; c.carry = 0; var j = S().job; j.title = 'Head Coach'; j.salary = E.$(coachPay(true, c.skill)); j.company = 'the ' + t.replace(/^the /, '') + ' (' + league() + ')'; E.fame(3); E.stat('happy', 12); return good('I\'m the new head coach of the ' + t.replace(/^the /, '') + ', ' + teamKind(tq(t)) + '. 📋'); };
    var ch = [{ label: 'Rebuild the ' + bad.replace(/^the /, '') + ' (' + outlook(tq(bad)) + ')', run: function () { return take(bad); } }];
    if (ok && U.chance(0.35 + c.skill / 200)) ch.push({ label: 'Take over the ' + ok.replace(/^the /, '') + ' (' + outlook(tq(ok)) + ')', run: function () { return take(ok); } });
    ch.push({ label: 'Stay an assistant for now', run: function () { return 'I stayed on the bench. My time will come.'; } });
    return { icon: '📋', title: 'Head coaching offer', text: 'After ' + U.plural(c.years, 'season') + ' as an assistant, teams want me to run the show. Coaching skill ' + cskill(x) + '.', choices: ch };
  } });
  var CPLANS = { win: 'Win now', youth: 'Develop the young core', system: 'Install my system' };
  function coachPlan() {
    var s = S(), set = function (k, msg) { s.flags.coachPlan = { y: s.year, k: k }; return done(msg); };
    ui().choose('📋 Offseason plan', 'How do I want to build the ' + h().coach.team.replace(/^the /, '') + ' (' + outlook(tq(h().coach.team)) + ') this year?', [
      { label: '🔥 Win now (trade picks for veterans: better this season, thinner next year)', fn: function () { set('win', 'We\'re all in. I traded future picks for veterans who can win today. 🔥'); } },
      { label: '🌱 Develop the young core (lose a bit more now, a better team next year)', fn: function () { set('youth', 'The kids are playing big minutes this year. Short-term pain, long-term gain. 🌱'); } },
      { label: '🧠 Install my system (a small dip now, more coaching skill)', fn: function () { set('system', 'Training camp is all about my schemes this year. 🧠'); } }
    ]);
  }
  function coachLine(x) {
    var c = x.coach; if (!c) return '';
    return '<div class="small muted" style="margin-top:6px">📋 ' + (S().job && S().job.coach ? (c.role === 'head' ? 'Head coach' : 'Assistant coach') + ', ' + c.team.replace(/^the /, '') : 'Former coach') + ' · skill ' + cskill(x) + (c.head ? ' · ' + c.wins + '-' + c.losses + ' as head coach' : '') + (c.titles ? ' · ' + U.plural(c.titles, 'title') : '') + (c.coy ? ' · ' + c.coy + '× Coach of the Year' : '') + '</div>';
  }
  function retire() {
    var x = h(), s = S();
    x.stage = 'retired'; x.retiredYear = s.year;
    if (s.job && s.job.hoops) s.job = null;
    var pro = x.seasons.filter(function (q) { return q.league !== 'High school' && q.league !== 'NCAA'; });
    var pts = pro.reduce(function (t, q) { return t + q.ppg * (q.gp || 0); }, 0);
    if (x.allstar >= 3 || x.rings || x.mvp || awards(x, /^All-.* Team$/) >= 3) { E.fame(5); E.log('🎽 The ' + (x.team || 'team') + ' retired my #' + x.num + ' jersey.', 'good'); }
    E.stat('happy', 4);
    return 'I retired from basketball after ' + U.plural(pro.length, 'pro season') + ' and ' + Math.round(pts).toLocaleString() + ' career points.';
  }

  // ------------------------------------------------------------------ menu
  var ICONS = { 'MVP': '🏆', 'Finals MVP': '🏅', 'All-Star': '⭐', 'Rookie of the Year': '🌱', 'Defensive Player of the Year': '🔒', 'Sixth Man of the Year': '🪑', 'Most Improved Player': '📈', 'Scoring title': '🔥', 'Three-Point Contest': '🎯', 'Slam Dunk Contest': '💥', 'Olympic gold': '🥇', 'Olympic silver': '🥈', 'Olympic bronze': '🥉' };
  var ORDER = [/^MVP/, /^Finals/, /^All-Star/, /^All-.* First/, /^All-.* Second/, /^All-.* Third/, /^Defensive/, /^Sixth/, /^Most Improved/, /^Scoring/, /^Rookie/, /^Olympic gold/, /^Olympic silver/, /^Olympic bronze/, /Contest/];
  function rank(k) { for (var i = 0; i < ORDER.length; i++) if (ORDER[i].test(k)) return i; return ORDER.length; }
  function accolades(x) {
    var acc = [], aw = x.aw || {}, n;
    if (x.rings) acc.push('💍 ' + x.rings + 'x champion'); if (x.mvp) acc.push('🏆 ' + x.mvp + 'x MVP'); if (x.fmvp) acc.push('🏅 ' + x.fmvp + 'x Finals MVP'); if (x.allstar) acc.push('⭐ ' + x.allstar + 'x All-Star');
    if ((n = awards(x, /^All-(NBA|WNBA) /))) acc.push('🏅 ' + n + 'x All-' + league());
    if ((n = awards(x, /^All-EuroLeague /))) acc.push('🏅 ' + n + 'x All-EuroLeague');
    [['Defensive Player of the Year', 'DPOY'], ['Sixth Man of the Year', 'Sixth Man'], ['Most Improved Player', 'Most Improved'], ['Scoring title', 'scoring title']].forEach(function (a) { var k = (aw[a[0]] || []).length; if (k) acc.push(ICONS[a[0]] + ' ' + (k > 1 ? k + 'x ' : '') + a[1]); });
    if (x.roy) acc.push('🌱 Rookie of the Year');
    ['gold', 'silver', 'bronze'].forEach(function (m) { var k = (aw['Olympic ' + m] || []).length; if (k) acc.push(ICONS['Olympic ' + m] + ' ' + (k > 1 ? k + ' Olympic ' + m + 's' : 'Olympic ' + m)); });
    if (x.hof) acc.push('🏛️ Hall of Fame');
    return acc;
  }
  function card() {
    var x = h(), m = me(), pro = x.seasons.filter(function (q) { return q.gp; });
    var avg = function (k) { var g = 0, t = 0; pro.forEach(function (q) { if (q[k] != null) { g += q.gp; t += q[k] * q.gp; } }); return g ? (t / g).toFixed(1) : '—'; };
    var pts = Math.round(pro.reduce(function (t, q) { return t + q.ppg * q.gp; }, 0)), acc = accolades(x), bd = badges(x);
    var where = x.stage === 'pro' ? x.team + ' · ' + lgName(x.league) + ' · ' + U.cap(outlook(tq(x.team))) : x.stage === 'college' ? x.team + ' · NCAA' : x.stage === 'hs' ? (S().edu ? S().edu.school : 'High school') + ' varsity' : x.stage === 'retired' ? 'Retired' : 'Free agent';
    return '<div class="hoops-card">' + (x.team && (x.stage === 'pro' || x.stage === 'college') && TL.logos ? '<div class="hc-logo">' + TL.logos.badge(x.team, { shape: 'team' }) + '</div>' : '') + '<div class="hc-num">#' + x.num + '</div><div class="hc-main"><b>' + U.esc(m.first + ' ' + m.last) + '</b><small>' + U.esc(where) + '</small><small>' + POS[x.pos] + ' · ' + cm2ft(x.cm) + (x.draft ? ' · ' + (x.draft.pick ? 'Pick #' + x.draft.pick + ' (' + x.draft.year + ')' : 'Undrafted') : '') + '</small></div><div class="hc-ovr"><b>' + x.ovr + '</b><small>OVR</small></div></div>' +
      '<div class="hb-arch">' + U.esc(archetype(x)) + '</div>' + (bd.length ? '<div class="hc-chips">' + bd.map(function (b) { return '<span class="hc-chip">' + b + '</span>'; }).join('') + '</div>' : '') +
      ATTR.map(function (k) { var v = attr(x, k[0]); return '<div class="minibar wide"><span>' + k[1] + ' ' + v + '</span><span class="track"><span class="fill ' + (v >= 85 ? 'hi' : v >= 65 ? 'mid' : 'lo') + '" style="width:' + v + '%"></span></span></div>'; }).join('') +
      '<div class="minibar wide"><span>Potential ' + x.pot + '</span><span class="track"><span class="fill ' + (x.pot >= 85 ? 'hi' : x.pot >= 70 ? 'mid' : 'lo') + '" style="width:' + x.pot + '%"></span></span></div>' +
      (x.stage === 'pro' && (x.league === 'NBA' || x.league === 'WNBA') && TL.nba && TL.nba.starsOn(m.gender, x.team, S().year).length ? '<p class="small">🤝 Teammates: ' + U.esc(TL.nba.starsOn(m.gender, x.team, S().year).slice(0, 3).join(', ')) + '</p>' : '') +
      (x.contract && x.stage === 'pro' ? '<p class="small muted">Contract: ' + E.fmt(S().job.salary) + '/yr · ' + U.plural(Math.max(0, x.contract.years), 'year') + ' left' + (x.shoe ? ' · 👟 ' + x.shoe.brand : '') + '</p>' : '') +
      (pro.length ? '<p class="small">Career: <b>' + avg('ppg') + '</b> PTS · <b>' + avg('rpg') + '</b> REB · <b>' + avg('apg') + '</b> AST · ' + pts.toLocaleString() + ' points' + (x.high ? ' · high of ' + x.high.pts : '') + '</p>' : '') +
      (acc.length ? '<p class="small">' + acc.join(' · ') + '</p>' : '');
  }
  function trophyCase() {
    ui().menu('Trophy case', function () {
      var x = h(), rows = [], aw = {}, counter = { 'MVP': x.mvp, 'Finals MVP': x.fmvp, 'All-Star': x.allstar, 'Rookie of the Year': x.roy ? 1 : 0 };
      var champs = x.seasons.filter(function (q) { return q.result === 'Won the championship'; }).map(function (q) { return q.year; });
      if (x.rings) rows.push({ icon: '💍', label: U.plural(x.rings, 'championship'), sub: champs.join(', ') });
      Object.keys(x.aw || {}).forEach(function (k) { aw[k] = x.aw[k]; });
      // Older lives counted some awards without keeping the years.
      Object.keys(counter).forEach(function (k) { if (counter[k] && !aw[k]) aw[k] = []; });
      Object.keys(aw).sort(function (a, b) { return rank(a) - rank(b); }).forEach(function (k) {
        var n = Math.max(aw[k].length, counter[k] || 0);
        if (n) rows.push({ icon: ICONS[k] || '🏅', label: (n > 1 ? n + '× ' : '') + k, sub: aw[k].join(', ') });
      });
      (x.honors || []).forEach(function (t) { rows.push({ icon: /champion/.test(t) ? '🏆' : '🎖️', label: t }); });
      if (x.high) rows.push({ icon: '🔥', label: 'Career high: ' + x.high.pts + ' points', sub: 'Against the ' + x.high.opp + ', ' + x.high.year });
      if (x.fifty) rows.push({ icon: '🔥', label: U.plural(x.fifty, '50-point game') });
      if (x.clutch) rows.push({ icon: '🧊', label: U.plural(x.clutch, 'Game 7 game-winner') });
      if (x.hof) rows.push({ icon: '🏛️', label: 'Naismith Hall of Fame', sub: 'Inducted in ' + x.hof });
      if (!rows.length) rows.push({ info: true, html: '<p class="muted">No hardware yet. Go win something.</p>' });
      return rows;
    });
  }
  function seasonDetail(q) {
    var more = fmtMore(q);
    ui().alert(q.year + ' · ' + q.team.replace(/^the /, ''), [(q.league || '') + (q.rec ? ' · ' + q.rec : '') + (q.gp ? ' · ' + q.gp + ' games' : ''), fmtLine(q) + (more ? ' · ' + more : ''), q.hi ? 'Season high: ' + q.hi + ' points' : '', q.result || '', q.honors ? 'Honors: ' + q.honors.join(', ') : '', q.mates ? 'Teammates: ' + q.mates.join(', ') : ''].filter(Boolean).join('. ') + '.', '');
  }
  function train(kind) {
    if (!onceAYear('hoops_' + kind)) return done(nope('I already worked on that this year.'));
    var x = h(), s = S(), k = { shoot: 'sho', handle: 'pla', defense: 'def', strength: 'ath' }[kind];
    s.flags.hoopsTrain = 1;
    var gain = me().age < 30 ? U.rand(1, 2) : U.rand(0, 1), raised = false, had = badges(x).length;
    // Near my ceiling, hard work raises the ceiling itself, once a year until
    // 31 (more reliably while I'm young).
    var ceil = s.flags.hoopsCeil && s.flags.hoopsCeil.y === s.year ? s.flags.hoopsCeil.n : 0;
    if (x.ovr >= x.pot - 3 && me().age < 31 && x.pot < 99 && ceil < 1 && U.chance(me().age < 26 ? 0.6 : 0.35)) { s.flags.hoopsCeil = { y: s.year, n: ceil + 1 }; x.pot++; raised = true; }
    var capped = x.ovr >= x.pot;
    x.ovr = U.clamp(x.ovr + (capped ? 0 : Math.min(gain, Math.max(0, x.pot - x.ovr))), 20, 99);
    // What I work on shapes the kind of player I become.
    prof(x)[k] += 2; norm(x);
    me().athl = U.clamp(me().athl + 1, 0, 100); E.stat('health', 1);
    var name = ATTR.filter(function (a) { return a[0] === k; })[0][1], earned = badges(x).length > had && attr(x, k) >= 85;
    done((earned ? good : function (t) { return t; })({ shoot: 'I put up 500 jumpers a day. 🎯', handle: 'I worked on my ball handling and court vision until my hands ached.', defense: 'I studied film and drilled defensive footwork. 🛡️', strength: 'I hit the weight room and worked on my explosiveness. 💪' }[kind] + ' (' + name + ' ' + attr(x, k) + ' · OVR ' + x.ovr + ', potential ' + x.pot + (raised ? ', raised by my hard work' : x.ovr >= x.pot ? ', at my ceiling' : '') + ')' + (earned ? ' I earned the ' + BADGES[k] + ' badge!' : '')));
  }
  function trainSub(x, k) { var v = attr(x, k); return name(k) + ' ' + v + (v >= 85 ? ' · ' + BADGES[k] : v >= 80 ? ' · ' + (85 - v) + ' from ' + BADGES[k].replace(/^\S+ /, '') : ''); }
  function name(k) { return ATTR.filter(function (a) { return a[0] === k; })[0][1]; }
  function menu() {
    ui().menu('Basketball 🏀', function () {
      var x = h(), items = [{ info: true, html: card() }];
      if (!x || x.stage === 'retired' || !x.stage) {
        if (x && x.stage === 'retired' && !(S().job && S().job.coach)) items.push({ icon: '📋', label: x.coach ? 'Get back into coaching' : 'Become a coach', sub: 'Start as an assistant; basketball IQ ' + attr(x, 'pla'), disabled: usedThisYear('hoops_coachtry'), onClick: becomeCoach });
        if (x && x.stage === 'retired' && S().job && S().job.coach) items.push({ info: true, html: coachLine(x) });
        if (x && x.coach && x.coach.role === 'head' && S().job && S().job.coach) { var cp = S().flags.coachPlan && S().flags.coachPlan.y === S().year ? S().flags.coachPlan.k : null; items.push({ icon: '📋', label: 'Offseason plan', sub: cp ? 'This year: ' + CPLANS[cp] : 'Win now, develop the kids or install my system', onClick: coachPlan }); }
        if (x && x.stage === 'retired') items.push({ icon: '🎙️', label: 'Become a TV analyst', onClick: function () { if (!onceAYear('hoops_tv')) return done(nope('I already did TV this year.')); var p = E.$(U.rand(200, 900) * 1000); E.addMoney(p); E.fame(2); done(good('I broke down games on TV for ' + E.fmt(p) + '.')); } });
      } else {
        items.push({ section: 'Train' });
        items.push({ info: true, html: '<p class="small muted">What you work on shapes the kind of player you become. Each skill once a year.</p>' });
        [['🎯', 'Shooting', 'shoot', 'sho'], ['🏀', 'Ball handling & vision', 'handle', 'pla'], ['🛡️', 'Defense', 'defense', 'def'], ['💪', 'Strength & explosiveness', 'strength', 'ath']].forEach(function (t) {
          items.push({ icon: t[0], label: t[1], sub: trainSub(x, t[3]), disabled: usedThisYear('hoops_' + t[2]), onClick: function () { train(t[2]); } });
        });
      }
      if (x && x.stage === 'pro') {
        var gpNow = S().flags.hoopsPlan && S().flags.hoopsPlan.y === S().year ? S().flags.hoopsPlan.k : null;
        items.push({ icon: '📋', label: 'Game plan', sub: gpNow ? { score: 'Score-first this season', team: 'Team-first this season', def: 'Lockdown defense this season' }[gpNow] : 'Pick how I play this season', onClick: gamePlan });
        items.push({ section: 'Off the court' });
        items.push({ icon: '🎤', label: 'Press conference', onClick: function () {
          if (!onceAYear('hoops_press')) return done(nope('One press conference a year is plenty.'));
          if (U.chance(0.2)) { E.fame(3); E.karma(-2); return done(bad('I said something wild about the refs. I was fined ' + E.fmt(E.$(25000)) + '.')); }
          E.fame(3); done('I gave a press conference. The clip went viral. 🎤');
        } });
        items.push({ icon: '🔁', label: 'Request a trade', sub: 'Now on ' + teamKind(tq(x.team)), onClick: function () {
          if (!onceAYear('hoops_trade')) return done(nope('My trade request is already out there.'));
          if (U.chance(0.55)) { var t = U.pick(teams().filter(function (q) { return q !== x.team; })); x.team = t; S().job.company = 'the ' + t + ' (' + x.league + ')'; return done(good('I was traded to the ' + t + ', ' + teamKind(tq(t)) + '! 🔁')); }
          E.stat('happy', -3); done('The front office refused to trade me. Awkward.');
        } });
        items.push({ icon: '🧓', label: 'Retire', onClick: function () { ui().confirm('Retire?', 'Hang up my sneakers for good?', function () { done(retire()); }); } });
      }
      if (x && TL.hsocial) TL.hsocial.items().forEach(function (it) { items.push(it); });
      if (TL.league && homeLeague()) items.push({ icon: '🏟️', label: 'The ' + league(), sub: TL.league.st(me().gender) ? 'Standings, champions, top players, news' : 'Real history until my rookie season', onClick: TL.league.menu });
      if (x && (x.aw || x.honors || x.rings || x.high)) items.push({ icon: '🏆', label: 'Trophy case', sub: accolades(x).length ? U.plural(accolades(x).length, 'kind') + ' of hardware' : 'Records and honors', onClick: trophyCase });
      if (x && x.seasons.length) {
        items.push({ section: 'Season by season' });
        x.seasons.slice(-12).reverse().forEach(function (q) {
          items.push({ icon: q.result === 'Won the championship' || /national championship|state title/.test(q.result || '') ? '🏆' : q.honors ? '🏅' : '🏀', label: q.year + ' · ' + q.team.replace(/^the /, ''), sub: lgName(q.league || '', q.year) + ' · ' + q.rec + ' · ' + q.ppg + '/' + q.rpg + '/' + q.apg + (q.result ? ' · ' + q.result : '') + (q.honors ? ' · ' + q.honors.join(', ') : ''), onClick: function () { seasonDetail(q); } });
        });
      }
      return items;
    });
  }
  // Adults without a school background can still try out.
  function tryout() {
    var s = S(), m = me();
    if (m.age < 18 || m.age > 30) return done(nope('Tryouts are for ages 18 to 30.'));
    if (!onceAYear('hoops_tryout')) return done(nope('I already tried out this year.'));
    var x = h() || start(null);
    if (x.stage === 'pro') return done(nope('I\'m already a pro.'));
    if (x.stage === 'college') return done(nope('I\'m playing college ball. The draft comes first.'));
    var p = (x.ovr - 50) / 40 + (m.athl - 60) / 100;
    if (!U.chance(U.clamp(p, 0.03, 0.8))) return done(bad('I didn\'t make it past open tryouts. (OVR ' + x.ovr + ')'));
    if (x.ovr >= 72 && homeLeague()) { sign(U.pick(teams()), league(), 1, salaryFor(x.ovr), 'Rotation Player'); return done(good('I earned a contract with the ' + h().team + '! 🏀')); }
    sign(m.gender === 'F' ? U.pick(EURO) : U.pick(minorTeams()), m.gender === 'F' ? 'EuroLeague' : 'G League', 1, Math.round((m.gender === 'F' ? 60000 : 40000) * eraPay()), 'Prospect');
    done(good('I made the ' + h().team + '! It\'s a start. 🏀'));
  }
  function active() { var x = h(); return !!(x && x.stage); }

  function summary() { var x = h(); if (!x) return ''; return (x.stage === 'pro' ? x.team + ' · ' : x.stage === 'college' ? x.team + ' · ' : x.stage === 'hs' ? 'Varsity · ' : x.stage === 'retired' ? 'Retired · ' : '') + 'OVR ' + x.ovr; }
  return { yearly: yearly, season: season, menu: menu, tryout: tryout, active: active, start: start, sign: sign, draft: draft, retire: retire, summary: summary };
})();
