/* TheLife — basketball career: high school varsity, college recruiting,
 * the draft, pro seasons with real stats, contracts, trades, injuries,
 * shoe deals, awards, retirement and the Hall of Fame. Women play in the
 * WNBA. State lives in S().hoops; a pro player's job has job.hoops = true. */
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

  function league() { return me().gender === 'F' ? 'WNBA' : 'NBA'; }
  function teams() { return me().gender === 'F' ? WNBA : NBA; }
  function games() { return me().gender === 'F' ? 40 : 82; }
  function cm2ft(cm) { var inch = Math.round(cm / 2.54); return Math.floor(inch / 12) + '′' + (inch % 12) + '″'; }
  function posFor(cm, g) { var o = g === 'F' ? -12 : 0; return cm < 191 + o ? 'PG' : cm < 198 + o ? 'SG' : cm < 204 + o ? 'SF' : cm < 209 + o ? 'PF' : 'C'; }

  function start(stage) {
    var m = me(), g = m.gender;
    var cm = Math.round(U.gauss ? U.gauss(g === 'F' ? 178 : 196, 8) : U.rand(g === 'F' ? 168 : 185, g === 'F' ? 193 : 213));
    cm = U.clamp(cm, g === 'F' ? 160 : 172, g === 'F' ? 203 : 224);
    var sp = S().sports, ms = sp && sp.sport === 'Basketball Team' ? (sp.skill - 40) / 8 : 0; // middle school hoops count
    var ovr = U.clamp(Math.round(23 + m.athl * 0.32 + (cm - (g === 'F' ? 178 : 196)) * 0.5 + ms + U.rand(-6, 6)), 20, 70);
    S().hoops = { stage: stage, cm: cm, pos: posFor(cm, g), num: U.pick([0, 1, 2, 3, 4, 5, 7, 8, 10, 11, 12, 13, 15, 21, 23, 24, 30, 32, 33, 34, 35]), ovr: ovr,
      pot: U.clamp(Math.round(ovr + Math.abs(U.gauss(5, 8)) + (m.athl - 75) / 7 + (U.chance(0.06) ? U.rand(8, 20) : 0)), ovr + 2, 99), seasons: [], rings: 0, mvp: 0, allstar: 0, fmvp: 0, roy: false, stars: 0, fame0: 0 };
    return S().hoops;
  }
  function stars(o) { return o >= 66 ? 5 : o >= 60 ? 4 : o >= 53 ? 3 : o >= 45 ? 2 : 1; }

  // Growth toward potential while young; decline from about 30.
  function develop(x, extra) {
    var a = me().age, room = x.pot - x.ovr;
    var d = a < 23 ? U.rand(2, 6) : a < 27 ? U.rand(0, 3) : a < 29 ? U.rand(-1, 1) : a < 32 ? U.rand(-3, 0) : a < 35 ? U.rand(-4, -1) : U.rand(-6, -2);
    d += extra || 0;
    if (d > 0) d = Math.min(d, Math.max(0, room));
    x.ovr = U.clamp(x.ovr + d, 20, 99);
  }

  // A season's stat line from rating, role and position.
  function statLine(x, minutes) {
    var o = x.ovr, f = minutes / 36 * (me().gender === 'F' ? 0.8 : 1), p = x.pos;
    var ppg = Math.max(0.5, ((o - 50) * 0.75 + U.randf(-3, 3)) * f + (p === 'SG' || p === 'SF' ? 1.5 : 0));
    var rpg = Math.max(0.3, ((p === 'C' ? 9 : p === 'PF' ? 7.5 : p === 'SF' ? 5 : 3.5) * (o / 80) + U.randf(-1, 1)) * f);
    var apg = Math.max(0.2, ((p === 'PG' ? 7.5 : p === 'SG' ? 4 : p === 'SF' ? 3.2 : 2) * (o / 80) + U.randf(-0.8, 0.8)) * f);
    return { ppg: +ppg.toFixed(1), rpg: +rpg.toFixed(1), apg: +apg.toFixed(1) };
  }
  function role(o) { return o >= 90 ? ['Franchise Superstar', 36] : o >= 84 ? ['All-Star Starter', 34] : o >= 77 ? ['Starter', 30] : o >= 70 ? ['Rotation Player', 22] : o >= 63 ? ['Bench Player', 14] : ['Deep Bench', 6]; }
  function fmtLine(l) { return l.ppg + ' PTS · ' + l.rpg + ' REB · ' + l.apg + ' AST'; }

  // ------------------------------------------------------ school & college
  function amateurSeason(x) {
    var s = S(), e = s.edu;
    develop(x, s.flags.hoopsTrain ? 1 : 0);
    s.flags.hoopsTrain = 0;
    var mins = x.ovr >= (x.stage === 'college' ? 72 : 55) ? 32 : x.ovr >= (x.stage === 'college' ? 64 : 45) ? 22 : 12;
    var l = statLine({ ovr: x.ovr + (x.stage === 'hs' ? 22 : 8), pos: x.pos }, mins);
    var w = U.clamp(Math.round(U.rand(8, 22) + (x.ovr - (x.stage === 'hs' ? 45 : 68)) * 0.6), 2, x.stage === 'hs' ? 28 : 34), gp = x.stage === 'hs' ? 30 : 35;
    var where = x.stage === 'hs' ? e.school : x.team;
    x.seasons.push({ year: s.year, age: me().age, team: where, league: x.stage === 'hs' ? 'High school' : 'NCAA', ppg: l.ppg, rpg: l.rpg, apg: l.apg, rec: w + '-' + (gp - w) });
    var msg = '🏀 ' + (x.stage === 'hs' ? 'Varsity' : 'College') + ' season: ' + fmtLine(l) + '. We went ' + w + '-' + (gp - w) + '.';
    if (x.stage === 'college' && w >= 27 && U.chance(0.25 + (x.ovr - 70) / 40)) { msg += ' We won the national championship! 🏆'; E.log(msg, 'good'); E.fame(8); return; }
    if (x.stage === 'hs' && w >= 24 && U.chance(0.35)) { msg += ' We won the state title! 🏆'; E.log(msg, 'good'); E.fame(3); return; }
    E.log(msg);
    if (x.stage === 'hs') { x.stars = stars(x.ovr); if (x.stars >= 4) E.fame(2); }
  }

  // ------------------------------------------------------------ pro seasons
  function salaryFor(o, rookiePick) {
    var g = me().gender === 'F';
    if (rookiePick) return g ? 75000 : Math.round(12000000 * Math.pow(0.9, rookiePick - 1) + 1100000);
    var max = g ? 250000 : 52000000, min = g ? 66000 : 1200000;
    var t = U.clamp((o - 62) / 33, 0, 1);
    return Math.round(min + (max - min) * Math.pow(t, 2.2));
  }
  function sign(team, lg, years, salary, title) {
    var s = S(), x = h();
    x.stage = 'pro'; x.team = team; x.league = lg; x.contract = { years: years, salary: salary };
    if (s.job && !s.job.hoops) E.quitJob(true);
    s.job = { career: 'athlete', hoops: true, fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, company: 'the ' + team.replace(/^the /, '') + ' (' + lg + ')', salary: E.$(salary), title: title || role(x.ovr)[0] };
  }
  function season() {
    var s = S(), x = h(), j = s.job;
    if (!x || x.stage !== 'pro') return 0;
    develop(x, s.flags.hoopsTrain ? 1 : 0); s.flags.hoopsTrain = 0;
    var r = role(x.ovr), gp = games(), mins = r[1], earned = j.salary || E.$(x.contract.salary);
    // Injury check
    var injured = null;
    if (U.chance(0.1 + Math.max(0, me().age - 29) * 0.03 - (me().health - 70) / 400)) {
      injured = U.weighted(INJURIES.map(function (i, k) { return { w: [30, 22, 16, 12, 8, 4][k], i: i }; })).i;
      x.ovr = U.clamp(x.ovr - injured[2], 20, 99); E.stat('health', -injured[2] * 3 - 3); E.stat('happy', -6);
    }
    var played = injured ? Math.max(0, gp - Math.round(injured[1] * gp / 82)) : gp - U.rand(0, Math.round(gp * 0.08));
    var l = statLine(x, mins);
    var strength = U.rand(26, 56) + (x.ovr - 75) * (mins / 36) * 1.0 + (played / gp - 1) * 10;
    var wins = U.clamp(Math.round(strength * gp / 82), Math.round(gp * 0.15), Math.round(gp * 0.85));
    var rec = wins + '-' + (gp - wins), result;
    var pct = wins / gp;
    if (pct < 0.5) result = 'Missed the playoffs';
    else {
      var round = 0, odds = 0.3 + (pct - 0.5) * 1.0 + (x.ovr - 80) / 150;
      while (round < 4 && U.chance(U.clamp(odds, 0.1, 0.72))) round++;
      result = ['Lost in the first round', 'Lost in the second round', 'Lost in the conference finals', 'Lost in the Finals', 'Won the championship'][round];
    }
    var line = { year: s.year, age: me().age, team: x.team, league: x.league, gp: played, ppg: l.ppg, rpg: l.rpg, apg: l.apg, rec: rec, result: result };
    var rookie = !x.seasons.some(function (q) { return q.league === x.league && x.league !== 'NCAA'; }) && x.league !== 'G League';
    x.seasons.push(line);
    var lg = x.league;
    E.log('🏀 ' + s.year + ' with the ' + x.team.replace(/^the /, '') + ' (' + rec + '): ' + fmtLine(l) + ' in ' + played + ' games.' + (injured ? ' I missed time with ' + injured[0] + '.' : ''), injured ? 'bad' : '');
    var proLeague = lg === 'NBA' || lg === 'WNBA' || lg === 'EuroLeague';
    // Awards
    if (proLeague && rookie && x.ovr >= 74 && l.ppg >= 14 && U.chance(0.55)) { x.roy = true; E.log('🏅 I won Rookie of the Year!', 'good'); E.fame(8); }
    if (proLeague && (l.ppg >= 22 || x.ovr >= 86) && played >= gp * 0.6 && U.chance(0.75)) { x.allstar++; E.log('⭐ I was named an All-Star' + (x.allstar > 1 ? ' for the ' + U.ordinal(x.allstar) + ' time' : '') + '!', 'good'); E.fame(5); }
    if (proLeague && x.ovr >= 93 && pct >= 0.65 && played >= gp * 0.8 && U.chance(0.35)) { x.mvp++; E.log('🏆 I won league MVP!', 'good'); E.fame(15); E.achieve('hoops_mvp'); }
    if (result === 'Missed the playoffs') { E.stat('happy', -3); }
    else if (result === 'Won the championship') {
      if (proLeague) { x.rings++; E.achieve('hoops_ring'); }
      E.log('💍 We won the ' + (lg === 'EuroLeague' ? 'EuroLeague title' : lg === 'G League' ? 'G League title' : lg + ' championship') + '!' + (x.rings > 1 && proLeague ? ' That\'s ring number ' + x.rings + '.' : ''), 'good');
      E.stat('happy', 15); E.fame(10);
      if (x.ovr >= 84 && U.chance(0.5)) { x.fmvp++; E.log('🏅 I was named Finals MVP!', 'good'); E.fame(8); }
    } else E.log('Playoffs: we ' + result.charAt(0).toLowerCase() + result.slice(1) + '.');
    // Shoe deal pays every year
    if (x.shoe) { var sp = E.$(x.shoe.pay); E.addMoney(sp); E.log('👟 ' + x.shoe.brand + ' shoe deal: ' + E.fmt(sp), 'money'); }
    // Contract year ticks down; free agency when it runs out.
    x.contract.years--;
    j.title = role(x.ovr)[0];
    if (me().age >= 40 || x.ovr < 56 || (me().age >= 35 && x.ovr < 68)) { S().pending.push({ id: 'hoops_retire', data: {} }); }
    else if (x.league === 'G League' && x.ovr >= 72 && U.chance(0.35)) { var t = U.pick(teams()); sign(t, league(), 2, salaryFor(x.ovr)); E.log('📞 The ' + t + ' called me up from the G League! I\'m in the ' + league() + '!', 'good'); E.stat('happy', 12); }
    else if (x.contract.years <= 0) S().pending.push({ id: 'hoops_fa', data: {} });
    else if (!x.shoe && S().fame >= 45 && U.chance(0.5)) S().pending.push({ id: 'hoops_shoe', data: {} });
    return earned;
  }

  // ---------------------------------------------------------------- yearly
  function yearly() {
    var s = S(), x = h(), m = me();
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
      if (!x.hof && x.retiredYear && s.year - x.retiredYear >= 5 && (x.mvp >= 1 || x.allstar >= 8 || (x.rings >= 2 && x.allstar >= 3) || (x.rings >= 1 && x.allstar >= 5))) {
        x.hof = s.year; E.log('🏛️ I was inducted into the Naismith Basketball Hall of Fame!', 'good'); E.fame(15); E.achieve('hoops_hof');
      }
    }
  }

  // ---------------------------------------------------------------- events
  function def(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
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
    return { icon: '🏀', title: 'College recruiting', text: (offers.length ? 'I\'m a ' + st + '-star recruit (' + cm2ft(x.cm) + ' ' + POS[x.pos] + '). ' + offers.length + ' program' + (offers.length > 1 ? 's' : '') + ' offered me a scholarship.' : 'No college programs offered me a scholarship.'), choices: ch };
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
    if (!pick) {
      x.draft = { year: yr, pick: 0 };
      if (me().gender === 'F') { sign(U.pick(EURO), 'EuroLeague', 1, 90000, 'Prospect'); return 'I went undrafted, so I signed overseas with ' + h().team + '.'; }
      sign(U.pick(GLEAGUE), 'G League', 1, 40000, 'Two-Way Hopeful');
      return 'I went undrafted. I signed with the ' + h().team + ' in the G League to prove myself.';
    }
    var team = U.pick(teams());
    x.draft = { year: yr, pick: pick, team: team };
    sign(team, league(), pick <= (me().gender === 'F' ? 12 : 30) ? 4 : 2, salaryFor(x.ovr, pick), 'Rookie');
    E.stat('happy', 15); E.fame(pick <= 5 ? 15 : pick <= 14 ? 8 : 4);
    if (pick <= (me().gender === 'F' ? 12 : 30)) E.achieve('hoops_draft');
    E.achieve('ceo');
    return good('With the ' + U.ordinal(pick) + ' pick in the ' + yr + ' ' + league() + ' Draft, the ' + team + ' selected me! 🧢');
  }
  def('hoops_fa', { cond: function () { var x = h(); return !!(x && x.stage === 'pro'); }, build: function () {
    var x = h(), o = x.ovr, ch = [], lg = x.league;
    // Teams only want players good enough for the league.
    var interest = o >= 76 ? U.rand(2, 3) : o >= 71 ? U.rand(1, 2) : o >= 67 && U.chance(0.4) ? 1 : 0;
    var pool = U.shuffle(teams().filter(function (t) { return t !== x.team; })).slice(0, interest);
    if (o >= 66 && (lg === 'NBA' || lg === 'WNBA')) ch.push({ label: '✍️ Re-sign with the ' + x.team + ' (' + E.fmt(E.$(salaryFor(o))) + '/yr)', run: function () { var t = x.team; sign(t, lg, U.rand(2, 4), salaryFor(o)); E.stat('happy', 5); return 'I re-signed with the ' + t + '.'; } });
    pool.forEach(function (t) {
      var pay = Math.round(salaryFor(o) * U.randf(0.9, 1.2)), yrs = U.rand(1, 5);
      ch.push({ label: '🖊️ ' + t + ': ' + yrs + ' yrs, ' + E.fmt(E.$(pay)) + '/yr', run: function () { sign(t, league(), yrs, pay); E.stat('happy', 6); return good('I signed a ' + yrs + '-year deal with the ' + t + '!'); } });
    });
    if (!ch.length || o < 66) ch.push({ label: '🌍 Sign overseas', run: function () { sign(U.pick(EURO), 'EuroLeague', 2, Math.round(salaryFor(o + 6) * 0.6)); return 'I signed with ' + h().team + ' in Europe.'; } });
    ch.push({ label: '🧓 Retire', run: function () { return retire(); } });
    return { icon: '✍️', title: 'Free agency', text: 'My contract with the ' + x.team + ' is up. I\'m ' + me().age + ' and rated ' + o + '. Here are my options:', choices: ch };
  } });
  def('hoops_shoe', { cond: function () { var x = h(); return !!(x && x.stage === 'pro'); }, build: function () {
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
  function retire() {
    var x = h(), s = S();
    x.stage = 'retired'; x.retiredYear = s.year;
    if (s.job && s.job.hoops) s.job = null;
    var pro = x.seasons.filter(function (q) { return q.league !== 'High school' && q.league !== 'NCAA'; });
    var pts = pro.reduce(function (t, q) { return t + q.ppg * (q.gp || 0); }, 0);
    if (x.allstar >= 3 || x.rings || x.mvp) { E.fame(5); E.log('🎽 The ' + (x.team || 'team') + ' retired my #' + x.num + ' jersey.', 'good'); }
    E.stat('happy', 4);
    return 'I retired from basketball after ' + U.plural(pro.length, 'pro season') + ' and ' + Math.round(pts).toLocaleString() + ' career points.';
  }

  // ------------------------------------------------------------------ menu
  function card() {
    var x = h(), m = me(), pro = x.seasons.filter(function (q) { return q.gp; });
    var avg = function (k) { var g = pro.reduce(function (t, q) { return t + q.gp; }, 0); return g ? (pro.reduce(function (t, q) { return t + q[k] * q.gp; }, 0) / g).toFixed(1) : '—'; };
    var acc = [];
    if (x.rings) acc.push('💍 ' + x.rings + 'x champion'); if (x.mvp) acc.push('🏆 ' + x.mvp + 'x MVP'); if (x.fmvp) acc.push('🏅 ' + x.fmvp + 'x Finals MVP'); if (x.allstar) acc.push('⭐ ' + x.allstar + 'x All-Star'); if (x.roy) acc.push('🌱 Rookie of the Year'); if (x.hof) acc.push('🏛️ Hall of Fame');
    var where = x.stage === 'pro' ? x.team + ' · ' + x.league : x.stage === 'college' ? x.team + ' · NCAA' : x.stage === 'hs' ? (S().edu ? S().edu.school : 'High school') + ' varsity' : x.stage === 'retired' ? 'Retired' : 'Free agent';
    return '<div class="hoops-card">' + (x.team && (x.stage === 'pro' || x.stage === 'college') && TL.logos ? '<div class="hc-logo">' + TL.logos.badge(x.team, { shape: 'team' }) + '</div>' : '') + '<div class="hc-num">#' + x.num + '</div><div class="hc-main"><b>' + U.esc(m.first + ' ' + m.last) + '</b><small>' + U.esc(where) + '</small><small>' + POS[x.pos] + ' · ' + cm2ft(x.cm) + (x.draft ? ' · ' + (x.draft.pick ? 'Pick #' + x.draft.pick + ' (' + x.draft.year + ')' : 'Undrafted') : '') + '</small></div><div class="hc-ovr"><b>' + x.ovr + '</b><small>OVR</small></div></div>' +
      '<div class="minibar"><span>Potential</span><span class="track"><span class="fill ' + (x.pot >= 85 ? 'hi' : x.pot >= 70 ? 'mid' : 'lo') + '" style="width:' + x.pot + '%"></span></span></div>' +
      (x.contract && x.stage === 'pro' ? '<p class="small muted">Contract: ' + E.fmt(S().job.salary) + '/yr · ' + U.plural(Math.max(0, x.contract.years), 'year') + ' left' + (x.shoe ? ' · 👟 ' + x.shoe.brand : '') + '</p>' : '') +
      (pro.length ? '<p class="small">Career: <b>' + avg('ppg') + '</b> PTS · <b>' + avg('rpg') + '</b> REB · <b>' + avg('apg') + '</b> AST</p>' : '') +
      (acc.length ? '<p class="small">' + acc.join(' · ') + '</p>' : '');
  }
  function train(kind) {
    if (!onceAYear('hoops_' + kind)) return done(nope('I already worked on that this year.'));
    var x = h(), s = S();
    s.flags.hoopsTrain = 1;
    var gain = me().age < 30 ? U.rand(1, 2) : U.rand(0, 1), capped = x.ovr >= x.pot;
    // At my ceiling, hard work slowly raises the ceiling itself (it used to do nothing at all).
    if (capped && me().age < 31 && x.pot < 99 && s.flags.hoopsCeil !== s.year && U.chance(0.6)) { s.flags.hoopsCeil = s.year; x.pot++; capped = false; gain = 1; }
    x.ovr = U.clamp(x.ovr + (capped ? 0 : Math.min(gain, Math.max(0, x.pot - x.ovr))), 20, 99);
    me().athl = U.clamp(me().athl + 1, 0, 100); E.stat('health', 1);
    done({ shoot: 'I put up 500 jumpers a day. 🎯', handle: 'I worked on my ball handling until my hands ached.', defense: 'I studied film and drilled defensive footwork. 🛡️', strength: 'I hit the weight room hard. 💪' }[kind] + ' (OVR ' + x.ovr + (x.ovr >= x.pot ? ', near my ceiling' : '') + ')');
  }
  function menu() {
    ui().menu('Basketball 🏀', function () {
      var x = h(), items = [{ info: true, html: card() }];
      if (!x || x.stage === 'retired' || !x.stage) {
        if (x && x.stage === 'retired') items.push({ icon: '🎙️', label: 'Become a TV analyst', onClick: function () { if (!onceAYear('hoops_tv')) return done(nope('I already did TV this year.')); var p = E.$(U.rand(200, 900) * 1000); E.addMoney(p); E.fame(2); done(good('I broke down games on TV for ' + E.fmt(p) + '.')); } });
      } else {
        items.push({ section: 'Train' });
        items.push({ icon: '🎯', label: 'Shooting', onClick: function () { train('shoot'); } });
        items.push({ icon: '🏀', label: 'Ball handling', onClick: function () { train('handle'); } });
        items.push({ icon: '🛡️', label: 'Defense', onClick: function () { train('defense'); } });
        items.push({ icon: '💪', label: 'Strength & conditioning', onClick: function () { train('strength'); } });
      }
      if (x && x.stage === 'pro') {
        items.push({ section: 'Off the court' });
        items.push({ icon: '🎤', label: 'Press conference', onClick: function () {
          if (!onceAYear('hoops_press')) return done(nope('One press conference a year is plenty.'));
          if (U.chance(0.2)) { E.fame(3); E.karma(-2); return done(bad('I said something wild about the refs. I was fined ' + E.fmt(E.$(25000)) + '.')); }
          E.fame(3); done('I gave a press conference. The clip went viral. 🎤');
        } });
        items.push({ icon: '🔁', label: 'Request a trade', onClick: function () {
          if (!onceAYear('hoops_trade')) return done(nope('My trade request is already out there.'));
          if (U.chance(0.55)) { var t = U.pick(teams().filter(function (q) { return q !== x.team; })); x.team = t; S().job.company = 'the ' + t + ' (' + x.league + ')'; return done(good('I was traded to the ' + t + '! 🔁')); }
          E.stat('happy', -3); done('The front office refused to trade me. Awkward.');
        } });
        items.push({ icon: '🧓', label: 'Retire', onClick: function () { ui().confirm('Retire?', 'Hang up my sneakers for good?', function () { done(retire()); }); } });
      }
      if (x && x.seasons.length) {
        items.push({ section: 'Season by season' });
        x.seasons.slice(-12).reverse().forEach(function (q) {
          items.push({ icon: q.result === 'Won the championship' ? '💍' : '🏀', label: q.year + ' · ' + q.team.replace(/^the /, ''), sub: (q.league || '') + ' · ' + q.rec + ' · ' + q.ppg + '/' + q.rpg + '/' + q.apg + (q.result ? ' · ' + q.result : '') });
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
    if (x.ovr >= 72) { sign(U.pick(teams()), league(), 1, salaryFor(x.ovr), 'Rotation Player'); return done(good('I earned a contract with the ' + h().team + '! 🏀')); }
    sign(m.gender === 'F' ? U.pick(EURO) : U.pick(GLEAGUE), m.gender === 'F' ? 'EuroLeague' : 'G League', 1, m.gender === 'F' ? 60000 : 40000, 'Prospect');
    done(good('I made the ' + h().team + '! It\'s a start. 🏀'));
  }
  function active() { var x = h(); return !!(x && x.stage); }

  function summary() { var x = h(); if (!x) return ''; return (x.stage === 'pro' ? x.team + ' · ' : x.stage === 'college' ? x.team + ' · ' : x.stage === 'hs' ? 'Varsity · ' : x.stage === 'retired' ? 'Retired · ' : '') + 'OVR ' + x.ovr; }
  return { yearly: yearly, season: season, menu: menu, tryout: tryout, active: active, start: start, sign: sign, draft: draft, retire: retire, summary: summary };
})();
