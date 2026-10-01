/* TheLife — v1.13: school sports. Try out for a team in middle school, high
 * school or college, practice, play a season every year with a stat line for
 * your sport, win titles and honors, get recruited with an athletic
 * scholarship, and get drafted by a real pro team. Basketball hands over to
 * js/hoops.js once you reach high school varsity.
 * State: S().sports; S().edu.team is the team you're on right now. */
TL.sports = (function () {
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
  function r1(x) { return Math.round(x * 10) / 10; }
  function clock(sec) { var m = Math.floor(sec / 60), s = sec - m * 60; return (m ? m + ':' + (s < 10 ? '0' : '') : '') + s.toFixed(m ? 0 : 2); }

  // pro: the sport's pro league (TL.real.team); pos: positions; line(k, pos):
  // a season stat line where k (0–1) is how good I am this season.
  var SPORTS = {
    'Basketball Team': { name: 'Basketball', icon: '🏀', pro: 'Basketball', pos: ['Guard', 'Forward', 'Center'], line: function (k, p) {
      return r1(2 + k * 22 * (p === 'Center' ? 0.85 : 1)) + ' PPG · ' + r1(1 + k * (p === 'Guard' ? 4 : 9)) + ' RPG · ' + r1(0.5 + k * (p === 'Guard' ? 7 : 2.5)) + ' APG'; } },
    'Soccer Team': { name: 'Soccer', icon: '⚽', pro: 'Soccer', pos: ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'], line: function (k, p) {
      if (p === 'Goalkeeper') return Math.round(20 + k * 90) + ' saves · ' + Math.round(k * 11) + ' clean sheets';
      if (p === 'Defender') return Math.round(k * 4) + ' goals · ' + Math.round(k * 12) + ' clean sheets';
      return Math.round(k * (p === 'Forward' ? 26 : 10)) + ' goals · ' + Math.round(k * (p === 'Forward' ? 9 : 15)) + ' assists'; } },
    'Football Team': { name: 'Football', icon: '🏈', pro: 'Football', pos: ['Quarterback', 'Running Back', 'Wide Receiver', 'Linebacker', 'Kicker'], line: function (k, p) {
      if (p === 'Quarterback') return Math.round(300 + k * 3200).toLocaleString() + ' passing yds · ' + Math.round(1 + k * 34) + ' TD';
      if (p === 'Running Back') return Math.round(150 + k * 1700).toLocaleString() + ' rushing yds · ' + Math.round(k * 20) + ' TD';
      if (p === 'Wide Receiver') return Math.round(100 + k * 1300).toLocaleString() + ' receiving yds · ' + Math.round(k * 15) + ' TD';
      if (p === 'Linebacker') return Math.round(15 + k * 110) + ' tackles · ' + r1(k * 10) + ' sacks';
      return Math.round(3 + k * 20) + ' field goals · long of ' + Math.round(30 + k * 25) + ' yds'; } },
    'Baseball Team': { name: 'Baseball', icon: '⚾', pro: 'Baseball', pos: ['Pitcher', 'Catcher', 'Shortstop', 'Outfielder'], line: function (k, p) {
      if (p === 'Pitcher') { var w = Math.round(1 + k * 10); return w + '-' + Math.max(0, Math.round(8 - k * 6)) + ' · ' + (6.5 - k * 5).toFixed(2) + ' ERA · ' + Math.round(10 + k * 110) + ' K'; }
      return '.' + String(Math.round(180 + k * 260)).padStart(3, '0') + ' AVG · ' + Math.round(k * 14) + ' HR · ' + Math.round(3 + k * 40) + ' RBI'; } },
    'Track Team': { name: 'Track', icon: '🏃', pro: null, pos: ['Sprinter', 'Distance runner', 'Hurdler'], line: function (k, p) {
      var f = me().gender === 'F' ? 1.1 : 1;
      if (p === 'Sprinter') return '100m PR ' + clock((13.4 - k * 2.6) * f);
      if (p === 'Hurdler') return '110m hurdles PR ' + clock((19 - k * 5) * f);
      return '1600m PR ' + clock(Math.round((390 - k * 135) * f)); } },
    'Swim Team': { name: 'Swimming', icon: '🏊', pro: null, pos: ['Freestyle', 'Butterfly', 'Backstroke', 'Breaststroke'], line: function (k, p) {
      var base = { Freestyle: 66, Butterfly: 72, Backstroke: 74, Breaststroke: 80 }[p] * (me().gender === 'F' ? 1.08 : 1);
      return '100 ' + p.toLowerCase() + ' PR ' + clock(base - k * 18); } },
    'Volleyball Team': { name: 'Volleyball', icon: '🏐', pro: null, pos: ['Outside Hitter', 'Setter', 'Middle Blocker', 'Libero'], line: function (k, p) {
      if (p === 'Setter') return Math.round(150 + k * 900) + ' assists';
      if (p === 'Libero') return Math.round(80 + k * 420) + ' digs';
      return Math.round(30 + k * 380) + ' kills · ' + Math.round(5 + k * 70) + ' blocks'; } },
    'Wrestling Team': { name: 'Wrestling', icon: '🤼', pro: null, pos: ['Lightweight', 'Middleweight', 'Heavyweight'], line: function (k) {
      var w = Math.round(6 + k * 32); return w + '-' + Math.max(1, Math.round(26 - k * 24)) + ' record · ' + Math.round(k * w * 0.6) + ' pins'; } },
    'Tennis Team': { name: 'Tennis', icon: '🎾', pro: 'Tennis', pos: ['Singles', 'Doubles'], line: function (k, p) {
      var w = Math.round(4 + k * 20); return w + '-' + Math.max(0, Math.round(16 - k * 14)) + ' in ' + p.toLowerCase(); } },
    'Cheerleading': { name: 'Cheer', icon: '📣', pro: null, pos: ['Flyer', 'Base', 'Tumbler'], line: function (k) {
      return 'Placed ' + (k > 0.85 ? '1st' : k > 0.7 ? '2nd' : k > 0.55 ? '3rd' : Math.round(12 - k * 12) + 'th') + ' at the state competition'; } }
  };
  var TEAMS = Object.keys(SPORTS);
  var LEVEL = { middle: 'Middle school', high: 'High school', uni: 'College' };

  function st() {
    var x = S().sports;
    if (!x) x = S().sports = { team: null, pos: null, skill: 0, seasons: [], letters: 0, titles: 0, honors: [], captain: false, stage: null };
    var e = S().edu;
    // edu.team is the source of truth for "on a team right now".
    if (x.team && !(e && e.team === x.team)) { x.team = null; x.captain = false; }
    if (!x.team && e && e.team && SPORTS[e.team]) { x.team = e.team; if (!x.pos || x.sport !== e.team) { x.pos = U.pick(SPORTS[e.team].pos); x.sport = e.team; } if (x.skill < 10) x.skill = start(); }
    if (x.pot == null) x.pot = U.clamp(Math.round(me().athl * 0.5 + U.rand(15, 50)), 35, 99);
    return x;
  }
  // Growth slows as I near my ceiling.
  function grow(x, g) { return U.clamp(Math.round((x.skill + g * Math.max(0.15, (x.pot - x.skill) / 25)) * 10) / 10, 0, 100); }
  function start() { var m = me(); return U.clamp(Math.round(m.athl * 0.45 + U.rand(0, 15)), 5, 60); }
  function onTeam() { var e = S().edu; return !!(e && e.team && SPORTS[e.team]); }
  // Basketball in high school (and college, if recruited) is the hoops career.
  function hoopsRuns() { var e = S().edu, h = S().hoops; return e && e.team === 'Basketball Team' && (e.stage === 'high' || (h && h.stage === 'college')); }
  function teamLabel(t) { var e = S().edu; return (e && e.stage === 'uni' ? e.school + ' ' : e && e.stage === 'middle' ? 'middle school ' : '') + t.replace(' Team', '').toLowerCase() + (/Team$/.test(t) ? ' team' : ''); }
  function canPlay() { var e = S().edu; return e && (e.stage === 'middle' || e.stage === 'high' || e.stage === 'uni'); }

  function odds(t) {
    var x = st(), m = me(), e = S().edu, same = x.sport === t ? x.skill : 0;
    var p = (m.athl - 30) / 90 + same / 160 + (e.stage === 'middle' ? 0.25 : e.stage === 'uni' ? -0.3 : 0) + (t === 'Cheerleading' ? m.looks / 400 : 0);
    if (t === 'Basketball Team') p += ((S().hoops && S().hoops.cm) || 0) > 190 ? 0.1 : 0;
    return U.clamp(p, 0.04, 0.95);
  }
  function oddsWord(p) { return p >= 0.75 ? 'Great chance' : p >= 0.5 ? 'Good chance' : p >= 0.3 ? 'Fair chance' : p >= 0.15 ? 'Long shot' : 'Very long shot'; }
  function join(t) {
    var x = st(), e = S().edu;
    e.team = t;
    if (x.sport !== t) { x.sport = t; x.pos = U.pick(SPORTS[t].pos); x.skill = start(); x.captain = false; }
    if (x.pot == null) x.pot = U.clamp(Math.round(me().athl * 0.5 + U.rand(15, 50)), 35, 99);
    x.team = t;
    me().athl = U.clamp(me().athl + 3, 0, 100);
    if (me().athl > 80 && me().age >= 15) S().flags.athleteScholar = true;
    E.stat('happy', 6);
    e.popularity = U.clamp((e.popularity || 50) + 4, 0, 100);
  }
  function tryout(t) {
    var e = S().edu;
    if (!canPlay()) return done(nope('I need to be in school to play on a team.'));
    if (e.team === t) return done(nope('I\'m already on the ' + teamLabel(t) + '.'));
    if (count('sp_try_' + t)) return done(nope('Tryouts for the ' + teamLabel(t) + ' are over for this year.'));
    bump('sp_try_' + t);
    if (!U.chance(odds(t))) { E.stat('happy', -4); return done(bad('I didn\'t make the ' + teamLabel(t) + '. Maybe next year.')); }
    var had = e.team;
    join(t);
    var x = st();
    return done(good('I made the ' + teamLabel(t) + '! ' + SPORTS[t].icon + (had && had !== t ? ' (I left the ' + had.toLowerCase() + '.)' : '') + ' Coach put me at ' + x.pos.toLowerCase() + '.'));
  }
  // Called from the random "Tryouts" event so its result goes through the same rules.
  function eventTryout(t) {
    if (!canPlay()) return 'I wasn\'t in school, so I couldn\'t try out.';
    if (U.chance(odds(t))) { join(t); return good('I made the ' + teamLabel(t) + '! ' + SPORTS[t].icon); }
    return 'I didn\'t make the cut.';
  }
  function practice() {
    var x = st(), f = 1 / (1 + count('sp_practice'));
    if (f < 0.25) return done(nope('Coach says I need rest. I\'ve practiced a lot this year.'));
    bump('sp_practice');
    x.skill = grow(x, U.randf(1, 3) * f);
    me().athl = U.clamp(me().athl + Math.max(1, Math.round(2 * f)), 0, 100);
    E.stat('health', 1); E.stat('happy', -1);
    if (S().hoops) S().flags.hoopsTrain = 1;
    if (U.chance(0.03)) { E.stat('health', -8); return done(bad('I rolled my ankle at practice. Ouch.')); }
    return done('I put in extra work at ' + SPORTS[x.team].name.toLowerCase() + ' practice. ' + SPORTS[x.team].icon + ' (skill ' + Math.round(x.skill) + ')');
  }
  function bigGame() {
    var x = st(), sp = SPORTS[x.team], e = S().edu;
    if (count('sp_big')) return done(nope('We already played our big rivalry game this year.'));
    bump('sp_big');
    var r = U.rand(1, 100) + (x.skill - 50) / 2;
    var rival = U.pick(['Central', 'East', 'West', 'North', 'Valley', 'Lincoln', 'Roosevelt', 'St. Mary\'s']) + (e.stage === 'uni' ? ' State' : '');
    if (r >= 85) { e.popularity = U.clamp(e.popularity + 12, 0, 100); E.stat('happy', 12); x.skill = Math.min(100, x.skill + 2); return done(good(sp.icon + ' I was the hero of the big game against ' + rival + '! The whole school chanted my name.')); }
    if (r >= 45) { E.stat('happy', 5); e.popularity = U.clamp(e.popularity + 3, 0, 100); return done('We beat ' + rival + ' in the big game. I played well. ' + sp.icon); }
    if (r >= 15) { E.stat('happy', -3); return done('We lost a close one to ' + rival + '.'); }
    E.stat('happy', -8); e.popularity = U.clamp(e.popularity - 5, 0, 100);
    return done(bad('I choked in the big game against ' + rival + '. Everyone saw it.'));
  }
  function quitTeam() {
    var x = st(), e = S().edu, t = e.team;
    ui().confirm('Quit the team?', 'Leave the ' + teamLabel(t) + '?', function () {
      e.team = null; x.team = null; x.captain = false;
      if (S().hoops && S().hoops.stage === 'hs') S().hoops.stage = null;
      ui().back();
      done('I quit the ' + teamLabel(t) + '.');
    });
  }
  function card(x) {
    var sp = SPORTS[x.team || x.sport], e = S().edu, last = x.seasons[x.seasons.length - 1];
    return '<div class="sp-card"><div class="sp-top"><span class="sp-ico">' + sp.icon + '</span><div><div class="sp-name">' + U.esc(U.cap(teamLabel(x.team))) + '</div><div class="sp-sub">' + U.esc(x.pos) + (x.captain ? ' · Captain' : '') + ' · ' + (LEVEL[e.stage] || '') + '</div></div></div>' +
      '<div class="minibar"><span>Skill</span><span class="track"><span class="fill ' + (x.skill >= 66 ? 'hi' : x.skill >= 33 ? 'mid' : 'lo') + '" style="width:' + x.skill + '%"></span></span></div>' +
      (last ? '<div class="sp-last">Last season: ' + U.esc(last.line) + ' · ' + last.rec + (last.award ? ' · ' + U.esc(last.award) : '') + '</div>' : '<div class="sp-last">My first season starts this year.</div>') +
      (x.titles || x.honors.length ? '<div class="sp-last">' + (x.titles ? '🏆 ' + U.plural(x.titles, 'title') : '') + (x.titles && x.honors.length ? ' · ' : '') + (x.honors.length ? '🎖️ ' + U.esc(x.honors.slice(-2).join(', ')) : '') + '</div>' : '') + '</div>';
  }
  function menu() {
    ui().menu('Sports', function () {
      var x = st(), e = S().edu, items = [];
      if (!canPlay()) return [{ info: true, html: '<p class="muted">School teams are for middle school, high school and college students.</p>' }];
      if (onTeam()) {
        items.push({ info: true, html: card(x) });
        if (hoopsRuns() && S().hoops) items.push({ icon: '🏀', label: 'Basketball card', sub: TL.hoops.summary(), onClick: TL.hoops.menu });
        items.push({ icon: '💪', label: 'Practice', sub: 'Skill and athleticism', onClick: practice });
        items.push({ icon: '🏟️', label: 'Play the big game', sub: 'Rivalry game of the year', disabled: count('sp_big') > 0, onClick: bigGame });
        items.push({ icon: '🚪', label: 'Quit the team', danger: true, onClick: quitTeam });
        items.push({ section: 'Switch sports' });
      } else {
        items.push({ info: true, html: '<p class="muted">Try out for a team. Athleticism helps' + (e.stage === 'uni' ? '; college teams are much harder to make as a walk-on' : '') + '. One tryout per team each year.</p>' });
      }
      TEAMS.forEach(function (t) {
        if (e.team === t) return;
        var p = odds(t), sp = SPORTS[t], tried = count('sp_try_' + t) > 0;
        items.push({ icon: sp.icon, label: sp.name, sub: tried ? 'Tried out this year' : oddsWord(p) + (sp.pro ? ' · has a pro league' : ''), disabled: tried, onClick: function () { tryout(t); } });
      });
      return items;
    });
  }

  // ------------------------------------------------------------- seasons
  function season() {
    var x = st(), e = S().edu, s = S(), sp = SPORTS[x.team], m = me();
    // Growth: young players improve every year; practice and fitness help.
    x.skill = grow(x, U.randf(1.5, 4) + (m.athl - 60) / 20 - (m.health < 40 ? 3 : 0));
    var lvl = e.stage === 'uni' ? 40 : e.stage === 'high' ? 18 : 0;   // tougher competition at each level
    var k = U.clamp((x.skill - lvl) / (100 - lvl) + U.randf(-0.15, 0.1), 0.02, 1);
    var gp = sp.name === 'Football' ? 11 : e.stage === 'uni' ? 30 : 20;
    // The rest of the roster matters as much as I do.
    var w = U.clamp(Math.round(gp * (0.5 + (k - 0.5) * 0.45 + U.randf(-0.28, 0.28))), 0, gp);
    var rec = w + '-' + (gp - w), line = sp.line(k, x.pos), award = null, cls = '';
    var senior = e.year >= E.eduYears(e.stage, e.grad);
    if (!x.captain && senior && x.skill >= 55 && U.chance(0.6)) { x.captain = true; E.log('🧢 My teammates voted me captain of the ' + teamLabel(x.team) + '.', 'good'); }
    // Injuries happen.
    if (U.chance(0.06)) {
      E.stat('health', -10); E.stat('happy', -6); x.skill = Math.max(0, x.skill - 4);
      E.log('🤕 I got hurt and missed most of the ' + sp.name.toLowerCase() + ' season. (' + rec + ')', 'bad');
      x.seasons.push({ year: s.year, age: m.age, level: e.stage, line: 'Injured', rec: rec });
      return;
    }
    var title = w >= gp * 0.8 && U.chance(0.1 + k * 0.2);
    if (k >= 0.85 && e.stage !== 'middle' && U.chance(0.5)) award = e.stage === 'uni' ? 'All-American' : 'All-State';
    else if (k >= 0.7 && U.chance(0.45)) award = e.stage === 'uni' ? 'All-Conference' : 'All-District';
    else if (k >= 0.55 && U.chance(0.3)) award = 'Team MVP';
    if (award) { x.honors.push(award + ' (' + s.year + ')'); cls = 'good'; }
    if (e.stage === 'high') x.letters++;
    x.seasons.push({ year: s.year, age: m.age, level: e.stage, line: line, rec: rec, award: award, title: title });
    var msg = sp.icon + ' ' + sp.name + ' season: ' + line + '. We went ' + rec + '.' + (award ? ' I was named ' + award + '!' : '');
    if (title && e.stage === 'high') E.achieve('state_champ');
    if (award === 'All-American') E.achieve('all_american');
    if (title) { x.titles++; msg += ' We won the ' + (e.stage === 'uni' ? 'conference championship' : e.stage === 'high' ? 'state championship' : 'league title') + '! 🏆'; cls = 'good'; E.stat('happy', 10); }
    E.log(msg, cls);
    E.stat('happy', 3); E.stat('health', 2);
    m.athl = U.clamp(m.athl + U.rand(1, 3), 0, 100);
    e.popularity = U.clamp((e.popularity || 50) + (award || title ? 6 : 2), 0, 100);
    if (x.skill >= 75 && e.stage === 'high') S().flags.athleteScholar = true;
    if (e.stage !== 'middle') E.fame(award === 'All-American' ? 4 : award === 'All-State' ? 2 : 0);
  }
  function yearly() {
    var s = S();
    if (!s || s.dead) return;
    var x = st(), e = s.edu;
    if (s.prison) return;
    if (onTeam() && !hoopsRuns()) season();
    // Recruiting: a strong high school career earns scholarship offers.
    if (!e && E.hasDegree('hs') && x.sport && !x.recruitDone && x.skill >= 70 && x.sport !== 'Basketball Team' && x.seasons.some(function (z) { return z.level === 'high'; }) && me().age <= 20) {
      x.recruitDone = true; s.pending.push({ id: 'sp_recruit', data: {} });
    }
    // College stars get drafted; graduates who played in college get a shot too.
    var pro = SPORTS[x.sport] && SPORTS[x.sport].pro;
    if (pro && pro !== 'Basketball' && !x.drafted && x.seasons.some(function (z) { return z.level === 'uni'; }) && !(s.job && s.job.career === 'athlete')) {
      if ((e && e.stage === 'uni' && e.year >= 3 && x.skill >= 93) || (!e && x.skill >= 88 && me().age <= 25)) { x.drafted = true; s.pending.push({ id: 'sp_draft', data: {} }); }
    }
  }
  def('sp_recruit', { cond: function () { return !S().edu; }, build: function () {
    var x = st(), sp = SPORTS[x.sport], unis = TL.real ? TL.real.universities(S().country) : [{ name: 'State University', tier: 1 }];
    var womens = /Spelman|Wellesley|Barnard|Smith College|Bryn Mawr|Mount Holyoke|Ochanomizu|Ewha/;
    var good3 = x.skill >= 82, pool = U.shuffle(unis.filter(function (u) { return (good3 ? u.tier >= 2 : u.tier <= 2) && !(me().gender === 'M' && womens.test(u.name)); })).slice(0, x.skill >= 82 ? 3 : x.skill >= 72 ? 2 : 1);
    var ch = pool.map(function (u) { return { label: '🎓 ' + u.name + (u.tier === 3 ? ' (elite)' : ''), run: function () {
      E.enroll('uni', { major: U.pick(['Business', 'Communications', 'Psychology', 'Biology', 'Education']), funding: 'scholarship', school: u.name, tier: u.tier, team: x.sport });
      x.team = x.sport;
      E.stat('happy', 12); E.fame(2);
      return good('I signed with ' + u.name + ' on a full ' + sp.name.toLowerCase() + ' scholarship! ' + sp.icon);
    } }; });
    ch.push({ label: 'Hang it up and move on', run: function () { return 'I decided my ' + sp.name.toLowerCase() + ' days are behind me.'; } });
    return { icon: sp.icon, title: 'College recruiting', text: 'College coaches have been watching my ' + sp.name.toLowerCase() + ' games. ' + pool.length + ' school' + (pool.length > 1 ? 's' : '') + ' offered me an athletic scholarship.', choices: ch };
  } });
  def('sp_draft', { build: function () {
    var x = st(), sp = SPORTS[x.sport], team = TL.real && TL.real.team(sp.pro, S().country, me().gender) || 'a pro team';
    var round = x.skill >= 95 ? 'the first round' : x.skill >= 91 ? 'the second round' : x.skill >= 87 ? 'a late round' : 'as an undrafted free agent';
    var tour = /Tour$/.test(team);
    return { icon: sp.icon, title: tour ? 'Turning pro' : 'Pro draft', text: tour ? 'My college results earned me a wildcard into ' + team + '.' : (round.indexOf('free agent') >= 0 ? 'I went undrafted, but ' + team + ' offered me a tryout contract.' : team + ' picked me in ' + round + '!'), choices: [
      { label: 'Go pro', run: function () {
        var s = S();
        if (s.job) E.quitJob(true);
        s.edu = null;
        s.job = { career: 'athlete', level: x.skill >= 95 ? 2 : x.skill >= 91 ? 1 : 0, perf: 65, years: 0, levelYears: 0, fame: true, mult: 1, company: team };
        E.fame(x.skill >= 90 ? 12 : 6); E.stat('happy', 15); E.achieve('drafted');
        return good('I\'m a professional ' + sp.name.toLowerCase() + ' player with ' + team + '! ' + sp.icon);
      } },
      { label: 'Pass and get a regular job', run: function () { return 'I turned down pro ' + sp.name.toLowerCase() + '. Time for real life.'; } }
    ] };
  } });

  // ------------------------------------------------------------- hooks
  // The pro league for the sport I played, so "Pro Sports" matches it.
  function proSport() { var x = S().sports; var sp = x && SPORTS[x.sport]; return sp && sp.pro && sp.pro !== 'Basketball' ? sp.pro : null; }
  function auditionBonus() { var x = S().sports; return x && proSport() ? Math.max(0, (x.skill - 50) / 100) : 0; }
  function summary() {
    var e = S().edu;
    if (e && e.team && SPORTS[e.team]) return SPORTS[e.team].icon + ' ' + SPORTS[e.team].name + (S().sports ? ' · skill ' + Math.round(S().sports.skill) : '');
    return 'Try out for a team';
  }
  function aboutRow() {
    var x = S().sports;
    if (!x || !x.seasons.length) return null;
    var sp = SPORTS[x.sport];
    return [sp.icon + ' ' + sp.name, U.plural(x.seasons.length, 'season') + (x.titles ? ' · ' + U.plural(x.titles, 'title') : '') + (x.honors.length ? ' · ' + x.honors[x.honors.length - 1] : '')];
  }
  return { menu: menu, yearly: yearly, summary: summary, aboutRow: aboutRow, eventTryout: eventTryout, proSport: proSport, auditionBonus: auditionBonus, SPORTS: SPORTS };
})();
