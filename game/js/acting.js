/* TheLife — v1.14: acting career. Audition for real casting calls (from
 * commercials and student films to TV series, studio films, blockbusters and
 * Broadway), train your craft, sign with a real agency, build star power,
 * and watch each project release with reviews and box office. Great work
 * earns Golden Globe, Emmy, Tony and Academy Award nominations.
 * State: S().acting. A professional actor's job has job.acting = true and
 * the year's pay in job.salary. */
TL.acting = (function () {
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
  function big(n) { return n >= 1e9 ? '$' + (n / 1e9).toFixed(2).replace(/0$/, '') + 'B' : '$' + Math.round(n / 1e6) + 'M'; }
  function noun() { return me().gender === 'F' ? 'Actress' : 'Actor'; }

  // ------------------------------------------------------------ projects
  // pay: [min, max] base dollars per part; diff: how hard the part is to land;
  // rep: how much a hit moves my reputation; gross: film box office range.
  var KINDS = {
    student: { name: 'Student film', icon: '🎥', parts: { Lead: [0, 300, 8, 1] }, film: true },
    commercial: { name: 'Commercial', icon: '📺', parts: { Featured: [2000, 15000, 18, 1] } },
    theater: { name: 'Local theater', icon: '🎭', parts: { Supporting: [300, 1500, 12, 1], Lead: [800, 3000, 22, 2] } },
    guest: { name: 'TV guest spot', icon: '📺', parts: { 'Guest star': [8000, 25000, 38, 3] } },
    indie: { name: 'Indie film', icon: '🎞️', film: true, gross: [1, 40], parts: { Supporting: [20000, 80000, 46, 4], Lead: [60000, 300000, 58, 7] } },
    series: { name: 'TV series', icon: '📺', series: true, parts: { 'Series regular': [150000, 600000, 56, 6], 'Series lead': [400000, 2000000, 70, 9] } },
    broadway: { name: 'Broadway show', icon: '🎭', stage: true, parts: { Supporting: [80000, 200000, 60, 5], Lead: [150000, 500000, 72, 8] } },
    studio: { name: 'Studio film', icon: '🎬', film: true, gross: [30, 300], parts: { Supporting: [250000, 1500000, 68, 6], Lead: [1000000, 8000000, 82, 10] } },
    blockbuster: { name: 'Blockbuster', icon: '💥', film: true, gross: [180, 1200], parts: { Supporting: [800000, 3000000, 78, 7], Lead: [5000000, 20000000, 92, 12] } }
  };
  // Which projects come my way at each level of reputation.
  var LADDER = [
    [0, ['student', 'commercial', 'theater']],
    [12, ['commercial', 'theater', 'guest', 'indie']],
    [28, ['guest', 'indie', 'series', 'commercial']],
    [45, ['indie', 'series', 'studio', 'broadway']],
    [62, ['series', 'studio', 'broadway', 'blockbuster']],
    [78, ['studio', 'blockbuster', 'series', 'indie']]
  ];
  var KID_KINDS = ['commercial', 'student', 'theater', 'guest', 'series'];
  var STUDIOS = { indie: ['A24', 'Neon', 'Searchlight Pictures', 'Focus Features', 'IFC Films', 'Magnolia Pictures'], studio: ['Warner Bros.', 'Universal', 'Paramount', 'Sony Pictures', 'Lionsgate', '20th Century Studios'], blockbuster: ['Marvel Studios', 'Lucasfilm', 'Warner Bros.', 'Universal', 'Legendary', 'DreamWorks'], series: ['Netflix', 'HBO', 'Apple TV+', 'Hulu', 'Prime Video', 'FX', 'NBC', 'ABC'], kids: ['Disney Channel', 'Nickelodeon'], guest: ['NBC', 'CBS', 'ABC', 'Fox', 'Netflix'], broadway: ['Broadway'], theater: ['a community theater'], student: ['a film school'], commercial: ['a national brand'] };
  var GENRES = ['drama', 'comedy', 'thriller', 'romance', 'horror', 'sci-fi', 'action', 'period drama', 'crime drama', 'musical'];
  var W1 = ['Midnight', 'Silent', 'Golden', 'Broken', 'Last', 'Paper', 'Crimson', 'Hidden', 'Glass', 'Wild', 'Northern', 'Electric', 'Quiet', 'Burning', 'Lost'];
  var W2 = ['Summer', 'Kingdom', 'Hearts', 'Harbor', 'Hours', 'River', 'Signal', 'Season', 'Road', 'Witness', 'Empire', 'Promise', 'Orbit', 'Garden', 'Frontier'];
  var AGENCIES = [['a boutique talent agency', 1, 0, 25], ['Gersh', 2, 20, 35], ['UTA', 3, 40, 50], ['WME', 4, 58, 60], ['CAA', 4, 62, 60]];
  var TIERS = [[0, 'Aspiring'], [10, 'Working'], [25, 'Character'], [42, 'Rising Star'], [58, 'Star'], [74, 'A-List'], [90, 'Hollywood Legend']];

  function st() {
    var s = S(), x = s.acting;
    if (!x) {
      x = s.acting = { talent: U.clamp(Math.round(U.gauss(58, 16) + me().looks / 12), 25, 99), skill: U.clamp(15 + (s.flags.acting || 0) * 3 + Math.round(me().looks / 10), 5, 45), rep: 0, agent: null, credits: [], slate: [], series: null, earn: 0, headshots: 0, noms: 0, wins: 0, best: 0 };
    }
    var j = s.job;
    // Saves from before v1.14: an old "actor" job becomes an acting career.
    if (j && j.career === 'actor' && !j.acting) {
      j.acting = true; j.salary = 0;
      x.rep = Math.max(x.rep, [6, 14, 34, 52, 70, 86][j.level] || 6);
      x.skill = Math.max(x.skill, 30 + (j.level || 0) * 9);
      j.title = title();
      // Carry the career on with a project that fits the old level.
      var lv = j.level || 0, kind = lv >= 4 ? 'studio' : lv >= 3 ? 'studio' : lv >= 2 ? 'series' : null;
      if (kind) {
        var part = kind === 'series' ? 'Series regular' : lv >= 4 ? 'Lead' : 'Supporting', p = KINDS[kind].parts[part];
        var c = { kind: kind, part: part, title: U.pick(W1) + ' ' + U.pick(W2), studio: U.pick(STUDIOS[kind]), genre: U.pick(GENRES), pay: Math.round((p[0] + p[1]) / 2), diff: p[2], rep: p[3] };
        if (kind === 'series') x.series = { title: c.title, network: c.studio, part: part, pay: c.pay, seasons: 0, genre: c.genre, quality: 0 };
        else { x.slate.push(c); x.earn += E.$(c.pay); }
      }
    }
    return x;
  }
  // Growth slows near my natural talent; past it, only grinding helps a little.
  function grow(x, g) {
    if (x.talent == null) x.talent = U.clamp(Math.round(U.gauss(58, 16) + me().looks / 12), 25, 99);
    var room = x.talent - x.skill;
    x.skill = U.clamp(Math.round((x.skill + g * (room > 0 ? Math.min(1, room / 20) : 0.08)) * 10) / 10, 0, 100);
  }
  function tier() { var r = st().rep, t = TIERS[0][1]; TIERS.forEach(function (q) { if (r >= q[0]) t = q[1]; }); return t; }
  function title() { var t = tier(); if (t === 'Star') return S().acting && S().acting.series ? 'TV Star' : 'Movie Star'; return /Star|Legend|A-List/.test(t) ? (t === 'A-List' ? 'A-List ' + noun() : t) : t + ' ' + noun(); }
  function hasJob() { var j = S().job; return !!(j && j.acting); }
  function power(x, c) {
    var m = me();
    return x.skill * 0.45 + x.rep * 0.45 + m.looks * 0.1 + (x.headshots && S().year - x.headshots < 10 ? 2 : 0) + (x.agent ? x.agent.tier * 2.5 : -3) + (c && c.kind === 'commercial' ? m.looks / 10 : 0);
  }
  function odds(x, c) { return U.clamp(0.38 + (power(x, c) - c.diff) / 36, 0.03, 0.85); }
  function oddsWord(p) { return p >= 0.7 ? 'Strong chance' : p >= 0.45 ? 'Good chance' : p >= 0.25 ? 'Long shot' : 'Very long shot'; }

  // Three casting calls, fixed for the year once seen.
  function calls() {
    var x = st(), s = S();
    if (x.calls && x.calls.year === s.year) return x.calls.list;
    var kid = me().age < 18, reach = x.rep + (x.agent ? x.agent.tier * 5 : 0), pool = KID_KINDS;
    if (!kid) LADDER.forEach(function (l) { if (reach >= l[0]) pool = l[1]; });
    var n = x.agent ? 4 : 3, list = [];
    for (var i = 0; i < n; i++) {
      var kind = U.pick(pool), k = KINDS[kind], parts = Object.keys(k.parts);
      // A bigger name gets offered the bigger part more often.
      var part = parts.length > 1 && U.chance(0.3 + x.rep / 150) ? parts[1] : parts[0];
      var p = k.parts[part], studio = U.pick(kid && kind === 'series' ? STUDIOS.kids : STUDIOS[kind] || ['a studio']);
      var pay = Math.round(U.randf(p[0], p[1]) * (0.7 + x.rep / 120) / 100) * 100;
      if (kid) pay = Math.round(pay * 0.4);
      list.push({ kind: kind, part: part, title: U.pick(W1) + ' ' + U.pick(W2), studio: studio, genre: kind === 'commercial' ? 'ad' : U.pick(GENRES), pay: pay, diff: p[2] + (kid ? -6 : 0), rep: p[3] });
    }
    x.calls = { year: s.year, list: list };
    return list;
  }
  function busy(x) { return x.slate.filter(function (r) { return r.kind !== 'commercial' && r.kind !== 'student'; }).length + (x.series ? 1 : 0); }
  function audition(c) {
    var x = st();
    if (count('ac_aud') >= (x.agent ? 6 : 4)) return done(nope('I\'ve been to every audition I could this year.'));
    if (busy(x) >= 2 && c.kind !== 'commercial') return done(nope('My schedule is full. I can\'t shoot another big project this year.'));
    if (KINDS[c.kind].series && x.series) return done(nope('I\'m already a regular on ' + x.series.title + '.'));
    ui().choose('🎬 ' + c.title, KINDS[c.kind].name + ' · ' + c.part + ' · ' + c.studio + '. How do I prepare for the audition?', [
      { label: 'Prepare for weeks', fn: function () { E.stat('happy', -2); go(c, 0.08, 'I prepared for weeks'); } },
      { label: 'Take a bold risk in the room', fn: function () { go(c, U.chance(0.5) ? 0.2 : -0.15, 'I took a bold risk'); } },
      { label: 'Wing it', fn: function () { go(c, -0.1, 'I winged it'); } }
    ]);
  }
  function go(c, mod, how) {
    var x = st();
    bump('ac_aud');
    x.calls.list = x.calls.list.filter(function (q) { return q !== c; });
    if (!U.chance(U.clamp(odds(x, c) + mod, 0.02, 0.95))) {
      E.stat('happy', -4);
      return done(bad(how + ', but I didn\'t get the part in "' + c.title + '". ' + U.pick(['They went another direction.', 'The casting director said I was too ' + U.pick(['young', 'old', 'tall', 'intense', 'nice']) + '.', 'They gave it to someone famous.', 'I never heard back.'])));
    }
    book(c);
    return done(good(how + ' and booked it! ' + phrase(c) + ' ' + KINDS[c.kind].icon));
  }
  function phrase(c) {
    if (c.kind === 'commercial') return 'I\'m in a national commercial for ' + (c.brand = c.brand || U.pick(['a soda brand', 'a car company', 'a phone carrier', 'a burger chain', 'a cereal', 'an insurance company'])) + '.';
    if (c.kind === 'guest') return 'I\'m guest starring on the ' + c.studio + ' show "' + c.title + '".';
    if (c.kind === 'student') return 'I\'m the lead in a student film, "' + c.title + '".';
    if (c.kind === 'series') return 'I\'m a ' + (c.part === 'Series lead' ? 'series lead' : 'series regular') + ' on the ' + c.studio + ' show "' + c.title + '".';
    var where = c.kind === 'theater' ? 'a community theater production of "' + c.title + '"' : c.kind === 'broadway' ? 'the Broadway show "' + c.title + '"' : 'the ' + c.studio + ' ' + KINDS[c.kind].name.toLowerCase() + ' "' + c.title + '"';
    return 'I\'m playing ' + (c.part === 'Lead' ? 'the lead' : 'a supporting role') + ' in ' + where + '.';
  }
  // Pay goes through my acting job (taxed with my salary) when acting is my job.
  function pay(base) {
    var x = st(), s = S(), amt = E.$(base);
    if (x.agent) amt = Math.round(amt * 0.9);
    if (!s.job && me().age >= 18 && !s.edu) s.job = { career: 'actor', acting: true, fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, company: x.agent ? x.agent.name : 'Freelance', salary: 0, title: title() };
    if (hasJob()) { x.earn += amt; return; }
    E.addMoney(Math.round(amt * (me().age < 18 ? 1 : 0.75)));
  }
  function book(c) {
    var x = st(), k = KINDS[c.kind];
    if (k.series) {
      x.series = { title: c.title, network: c.studio, part: c.part, pay: c.pay, seasons: 0, genre: c.genre, quality: 0 };
      x.credits.push({ year: S().year, title: c.title, kind: c.kind, part: c.part, studio: c.studio });
      E.fame(2); return;
    }
    x.slate.push(c);
    pay(c.pay);
    grow(x, U.randf(0.5, 2));
    E.stat('happy', 10);
    if (c.part === 'Lead' && (c.kind === 'studio' || c.kind === 'blockbuster')) E.achieve('big_break');
  }

  // ------------------------------------------------------------ training
  var CLASSES = [
    ['community', '🎭', 'Community acting class', 300, 8, [2, 4]],
    ['groundlings', '😂', 'Improv at The Groundlings', 1200, 14, [2, 4]],
    ['coach', '🧑‍🏫', 'Private acting coach', 3000, 14, [3, 6]],
    ['strasberg', '🎓', 'Lee Strasberg Institute', 8000, 18, [5, 8]]
  ];
  function train(cl) {
    var x = st(), cost = E.$(cl[3]);
    if (count('ac_' + cl[0])) return done(nope('I already did that this year.'));
    if (S().money < cost) return done(nope('That costs ' + E.fmt(cost) + '.'));
    bump('ac_' + cl[0]); E.addMoney(-cost);
    // Stacking classes in one year has diminishing returns.
    grow(x, U.rand(cl[5][0], cl[5][1]) / (1 + count('ac_trained')));
    bump('ac_trained');
    if (cl[0] === 'groundlings') { S().skills = S().skills || {}; S().skills.comedy = Math.min(100, (S().skills.comedy || 0) + 3); }
    S().flags.acting = (S().flags.acting || 0) + 1;
    return done(cl[2] + ': I worked on my craft. 🎭 (craft ' + Math.round(x.skill) + ')');
  }
  function headshots() {
    var x = st(), cost = E.$(600);
    if (S().money < cost) return done(nope('Professional headshots cost ' + E.fmt(cost) + '.'));
    E.addMoney(-cost); x.headshots = S().year;
    return done('I got professional headshots taken. I look like a movie poster. 📸');
  }
  function findAgent() {
    var x = st();
    if (count('ac_agent')) return done(nope('I already met with agents this year.'));
    bump('ac_agent');
    var best = null;
    AGENCIES.forEach(function (a) { if (x.rep >= a[2] && x.skill >= a[3] && (!x.agent || a[1] > x.agent.tier)) best = a; });
    if (!best) return done(bad(x.agent ? 'No bigger agency was interested in me yet.' : 'Agents passed on me. I need more credits or better training.'));
    if (!U.chance(0.55 + (x.rep - best[2]) / 50)) return done(bad(best[0] === AGENCIES[0][0] ? 'The agency passed. Maybe next year.' : best[0] + ' took a meeting but passed for now.'));
    x.agent = { name: best[0], tier: best[1] };
    if (hasJob()) S().job.company = best[0];
    return done(good('I signed with ' + best[0] + '! My agent will send me better auditions. 🤝'));
  }
  function party() {
    var x = st();
    if (count('ac_party')) return done(nope('One industry party a year is plenty.'));
    bump('ac_party');
    var r = U.rand(1, 100);
    if (r <= 12) { x.rep = Math.max(0, x.rep - 2); E.stat('happy', -5); return done(bad('I had one too many and told a producer exactly what I thought of their last movie.')); }
    if (r >= 85) { x.rep += 3; x.calls = null; return done(good('I hit it off with a famous director at a Hollywood party. New auditions are coming my way! 🥂')); }
    x.rep += 1; E.stat('happy', 4);
    return done('I mingled at an industry party and made a few useful connections. 🥂');
  }
  function pressTour() {
    var x = st();
    if (!x.slate.length) return done(nope('I have nothing coming out to promote.'));
    if (count('ac_press')) return done(nope('I already did a press tour this year.'));
    bump('ac_press'); x.press = S().year; E.fame(2); E.stat('happy', -2);
    return done('I did a whirlwind press tour: late-night shows, podcasts and a dozen junkets. 🎤');
  }
  function leaveShow() {
    var x = st();
    ui().confirm('Leave the show?', 'Leave "' + x.series.title + '"?', function () {
      E.log('I left "' + x.series.title + '" after ' + U.plural(x.series.seasons, 'season') + '.');
      x.series = null; ui().back(); done(null);
    });
  }
  function retire() {
    ui().confirm('Retire from acting?', 'Hang it up for good?', function () {
      var x = st(); x.retired = S().year; x.series = null;
      if (hasJob()) E.quitJob(true);
      ui().back(); done('I retired from acting after ' + U.plural(x.credits.length, 'credit') + '. 🎬');
    });
  }

  // ------------------------------------------------------------ menus
  function card(x) {
    var aw = (S().awards || []).filter(function (a) { return /Academy|Emmy|Golden Globe|Tony/.test(a.award); });
    return '<div class="ac-card"><div class="ac-top"><span class="ac-ico">' + (x.agent && x.agent.tier >= 2 && TL.logos ? TL.logos.badge(x.agent.name) : '🎬') + '</span><div><div class="ac-name">' + U.esc(title()) + '</div><div class="ac-sub">' + (x.agent ? 'Repped by ' + U.esc(x.agent.name) : 'No agent') + ' · ' + U.plural(x.credits.length, 'credit') + (aw.length ? ' · 🏆 ' + aw.length : '') + '</div></div></div>' +
      '<div class="minibar"><span>Craft</span><span class="track"><span class="fill ' + (x.skill >= 66 ? 'hi' : x.skill >= 33 ? 'mid' : 'lo') + '" style="width:' + Math.round(x.skill) + '%"></span></span></div>' +
      '<div class="minibar"><span>Star power</span><span class="track"><span class="fill ' + (x.rep >= 60 ? 'hi' : x.rep >= 25 ? 'mid' : 'lo') + '" style="width:' + Math.min(100, Math.round(x.rep)) + '%"></span></span></div>' +
      (x.series ? '<div class="ac-line">📺 Series regular on "' + U.esc(x.series.title) + '" (' + U.esc(x.series.network) + ')' + (x.series.seasons ? ', ' + U.plural(x.series.seasons, 'season') : '') + '</div>' : '') +
      (x.slate.length ? '<div class="ac-line">🎞️ Coming out this year: ' + x.slate.map(function (r) { return '"' + U.esc(r.title) + '"'; }).join(', ') + '</div>' : '') + '</div>';
  }
  function menu() {
    var x = st();
    if (me().age < 8) return done(nope('I\'m too young to act professionally.'));
    ui().menu('Acting 🎬', function () {
      x = st();
      var items = [{ info: true, html: card(x) }], left = (x.agent ? 6 : 4) - count('ac_aud');
      if (x.retired) {
        items.push({ icon: '🎬', label: 'Come out of retirement', onClick: function () { x.retired = null; done('I\'m back. Hollywood loves a comeback story. 🎬'); } });
        items.push({ icon: '🎞️', label: 'Filmography', sub: U.plural(x.credits.length, 'credit'), onClick: filmography });
        return items;
      }
      items.push({ section: 'Casting calls · ' + Math.max(0, left) + ' auditions left' });
      calls().forEach(function (c) {
        var k = KINDS[c.kind], p = odds(x, c);
        items.push({ icon: TL.logos && !/^(a |the )/.test(c.studio) ? TL.logos.badge(c.studio) : k.icon, label: '"' + c.title + '"', sub: k.name + ' · ' + c.part + ' · ' + c.studio + ' · ' + oddsWord(p), right: c.pay ? E.fmt(E.$(c.pay)) + (k.series ? '/season' : '') : 'Unpaid', disabled: left <= 0, onClick: function () { audition(c); } });
      });
      if (!x.calls.list.length) items.push({ info: true, html: '<p class="muted">No more casting calls this year.</p>' });
      items.push({ section: 'Career' });
      CLASSES.forEach(function (cl) { if (me().age >= cl[4]) items.push({ icon: cl[1], label: cl[2], right: E.fmt(E.$(cl[3])), disabled: count('ac_' + cl[0]) > 0, onClick: function () { train(cl); } }); });
      if (!x.headshots || S().year - x.headshots >= 10) items.push({ icon: '📸', label: 'Get headshots', right: E.fmt(E.$(600)), onClick: headshots });
      if (me().age >= 16) items.push({ icon: '🤝', label: x.agent ? 'Look for a bigger agency' : 'Find an agent', sub: x.agent ? 'Now: ' + x.agent.name : 'Better auditions, 10% fee', disabled: count('ac_agent') > 0, onClick: findAgent });
      if (me().age >= 18) items.push({ icon: '🥂', label: 'Go to an industry party', disabled: count('ac_party') > 0, onClick: party });
      if (x.slate.length) items.push({ icon: '🎤', label: 'Do a press tour', sub: 'Better buzz for this year\'s releases', disabled: count('ac_press') > 0, onClick: pressTour });
      if (x.series) items.push({ icon: '🚪', label: 'Leave "' + x.series.title + '"', onClick: leaveShow });
      items.push({ icon: '🎞️', label: 'Filmography', sub: U.plural(x.credits.length, 'credit'), onClick: filmography });
      if (x.credits.length) items.push({ icon: '🌅', label: 'Retire from acting', danger: true, onClick: retire });
      return items;
    });
  }
  function filmography() {
    var x = st();
    ui().menu('Filmography', function () {
      if (!x.credits.length) return [{ info: true, html: '<p class="muted">No credits yet.</p>' }];
      return x.credits.slice().reverse().map(function (r) {
        var k = KINDS[r.kind];
        return { icon: TL.logos && r.studio && !/^(a |the )/.test(r.studio) ? TL.logos.badge(r.studio) : k.icon, label: '"' + r.title + '" (' + r.year + ')', sub: k.name + ' · ' + r.part + (r.studio ? ' · ' + r.studio : '') + (r.review != null ? ' · ' + r.review + '% reviews' : '') + (r.gross ? ' · ' + big(r.gross * 1e6) : ''), right: r.award ? '🏆' : r.nom ? '🎗️' : '' };
      });
    });
  }

  // ------------------------------------------------------------ the year
  // Everything I shot this year comes out; returns this year's acting pay.
  function release(r, x) {
    var k = KINDS[r.kind], s = S();
    var q = x.skill * 0.35 + U.rand(5, 60) + (r.passion ? 12 : 0) + (r.franchise ? -8 : 0) + (x.press === s.year ? 4 : 0);
    var review = U.clamp(Math.round(q), 4, 99);
    var credit = { year: s.year, title: r.title, kind: r.kind, part: r.part, studio: r.studio, review: review };
    var lead = /Lead/.test(r.part), msg, cls = '';
    // Every credit builds my name; good reviews and leading parts build it faster, flops can cost me.
    var dr = r.rep * U.clamp(0.5 + (review - 50) / 40, 0.15, 1.8) * (lead ? 1.2 : 1);
    if (k.film && k.gross) {
      var gross = Math.round(U.randf(k.gross[0], k.gross[1]) * (0.4 + review / 100) * (1 + x.rep / 200) * (r.franchise ? 1.6 : 1));
      credit.gross = gross;
      if (gross >= 1000) { E.achieve('box_office'); dr += 4; }
      msg = k.icon + ' "' + r.title + '" (' + r.genre + ') opened with ' + review + '% on Rotten Tomatoes and grossed ' + big(gross * 1e6) + ' worldwide.';
      if (r.kind === 'blockbuster' && review < 40) { msg += ' Critics called it a box-office bomb.'; dr -= 4; cls = 'bad'; }
      else if (gross >= 1000) { msg += ' A billion-dollar hit! 🍿'; cls = 'good'; }
    } else if (r.kind === 'commercial') {
      msg = '📺 My commercial for ' + (r.brand || 'a soda brand') + ' aired nationwide.'; dr = 0.6;
    } else {
      msg = k.icon + ' ' + (k.stage ? 'My show "' + r.title + '" opened' : '"' + r.title + '" premiered') + ' to ' + (review >= 85 ? 'rave reviews' : review >= 60 ? 'good reviews' : review >= 40 ? 'mixed reviews' : 'terrible reviews') + ' (' + review + '%).';
    }
    x.rep = U.clamp(x.rep + dr + 0.5, 0, 100);
    if (review >= 85 && cls !== 'bad') cls = 'good';
    E.log(msg, cls);
    E.fame(Math.max(0, r.rep * review / 120 * (lead ? 1.4 : 1) - 1));
    x.credits.push(credit);
    if (credit.review > x.best) x.best = credit.review;
    return { credit: credit, review: review, lead: lead };
  }
  function nominate(best, x) {
    if (!best || best.review < 85 || x.nomYear === S().year) return;
    var c = best.credit, k = KINDS[c.kind], f = me().gender === 'F', lead = /Lead/.test(c.part);
    if (!(k.film && c.kind !== 'student') && !k.series && !k.stage) return;
    if (c.kind === 'commercial' || c.part === 'Guest star' && U.chance(0.7)) return;
    var p = (best.review - 82) / 40 + x.rep / 500 + (lead ? 0.04 : 0);
    if (!U.chance(U.clamp(p, 0, 0.75))) return;
    var aw = k.film ? 'Academy Award' : k.series ? 'Emmy Award' : 'Tony Award';
    if (k.film && U.chance(0.35)) aw = 'Golden Globe';
    var cat = k.film ? 'Best ' + (lead ? '' : 'Supporting ') + (f ? 'Actress' : 'Actor') + ' in "' + c.title + '"'
      : k.series ? 'Outstanding ' + (lead ? 'Lead' : 'Supporting') + ' ' + (f ? 'Actress' : 'Actor') + ' for "' + c.title + '"'
      : 'Best ' + (f ? 'Actress' : 'Actor') + ' in a Play for "' + c.title + '"';
    c.nom = aw; x.noms++; x.nomYear = S().year;
    E.queue('award', { award: aw, cat: cat, win: 0.18 + (best.review - 84) / 45 + x.rep / 600 - x.wins * 0.05 });
  }
  function year() {
    var s = S(), x = st(), j = s.job;
    var results = [];
    x.slate.forEach(function (r) { if (r.kind !== 'student' || U.chance(0.5)) results.push(release(r, x)); else x.credits.push({ year: s.year, title: r.title, kind: r.kind, part: r.part, studio: r.studio }); });
    x.slate = [];
    // A season of my TV show airs; the network decides whether to renew it.
    if (x.series) {
      var sr = x.series; sr.seasons++;
      var q = U.clamp(Math.round(x.skill * 0.35 + U.rand(5, 55) + (sr.quality || 0) * 0.15), 5, 99);
      sr.quality = q;
      x.earn += Math.round(E.$(sr.pay * (1 + (sr.seasons - 1) * 0.15)) * (x.agent ? 0.9 : 1));
      x.rep = U.clamp(x.rep + KINDS.series.parts[sr.part][3] * (q - 55) / 50 + 0.3, 0, 100);
      E.fame(Math.max(0, q / 25 - 1));
      E.log('📺 Season ' + sr.seasons + ' of "' + sr.title + '" aired on ' + sr.network + ' (' + q + '% on Rotten Tomatoes).', q >= 85 ? 'good' : '');
      results.push({ credit: { year: s.year, title: sr.title, kind: 'series', part: sr.part, review: q }, review: q, lead: /lead/.test(sr.part) });
      if (U.chance(q >= 75 ? 0.08 : q >= 55 ? 0.25 : 0.6) || sr.seasons >= 9) {
        E.log('📺 ' + sr.network + (sr.seasons >= 9 ? ' wrapped "' + sr.title + '" after ' + sr.seasons + ' seasons. What a run.' : ' canceled "' + sr.title + '" after ' + U.plural(sr.seasons, 'season') + '.'), sr.seasons >= 5 ? '' : 'bad');
        x.series = null;
      }
    }
    // Out of sight, out of mind.
    // Stars fade unless they keep landing hits; out of sight, out of mind.
    x.rep = Math.max(0, x.rep - 0.3 - x.rep / 40);
    if (!results.length && !x.retired) x.rep = Math.max(0, x.rep - U.rand(1, 3));
    if (me().age >= 60) x.rep = Math.max(0, x.rep - 1);
    var best = results.filter(function (r) { return r.credit.kind !== 'commercial'; }).sort(function (a, b) { return b.review - a.review; })[0];
    nominate(best, x);
    // Awards I've won this life.
    var aw = (s.awards || []).map(function (a) { return a.award; });
    if (aw.indexOf('Academy Award') >= 0) E.achieve('oscar');
    if (['Emmy Award', 'Grammy Award', 'Academy Award', 'Tony Award'].every(function (n) { return aw.indexOf(n) >= 0; })) E.achieve('egot');
    // Fame follows star power.
    if (s.fame < x.rep) E.fame((x.rep - s.fame) / 5);
    // Big names get big offers.
    if (!s.prison && !x.retired) {
      if (x.rep >= 55 && !x.franchise && U.chance(0.12)) s.pending.push({ id: 'ac_franchise', data: {} });
      else if (x.rep >= 35 && U.chance(0.1)) s.pending.push({ id: 'ac_passion', data: {} });
      else if (x.rep >= 50 && U.chance(0.06)) s.pending.push({ id: 'ac_scandal', data: {} });
    }
    var earned = x.earn; x.earn = 0;
    if (j && j.acting) { j.salary = earned; j.title = title(); j.perf = U.clamp(Math.round(x.rep), 0, 100); }
    if (x.rep >= 74) E.achieve('famous');
    return earned;
  }
  // Child actors and actors with day jobs still release their projects.
  function yearly() {
    var s = S();
    if (!s || s.dead || !s.acting || hasJob()) return;
    var x = st();
    if (!x.slate.length && !x.series) { if (x.rep > 0 && U.chance(0.5)) x.rep = Math.max(0, x.rep - 1); return; }
    var earned = year();
    if (earned) { E.addMoney(Math.round(earned * 0.75)); E.log('🎬 Acting income: ' + E.fmt(Math.round(earned * 0.75)), 'money'); }
  }

  def('ac_franchise', { build: function () {
    var x = st(), fee = Math.round(U.rand(4, 12) * (1 + x.rep / 100)) * 1e6, hero = U.pick(['a superhero', 'a space captain', 'a vampire hunter', 'a secret agent', 'a fantasy queen', 'a dragon rider']);
    return { icon: '🦸', title: 'Franchise offer', text: U.pick(STUDIOS.blockbuster) + ' wants me to play ' + hero + ' in a three-picture franchise. ' + E.fmt(E.$(fee)) + ' for the first film.', choices: [
      { label: 'Sign the deal', run: function () { x.franchise = true; var c = { kind: 'blockbuster', part: 'Lead', title: U.pick(W1) + ' ' + U.pick(W2), studio: U.pick(STUDIOS.blockbuster), genre: 'action', pay: fee, rep: 12, franchise: true }; x.slate.push(c); pay(fee); E.achieve('big_break'); E.stat('happy', 12); return good('I\'m the new face of a blockbuster franchise! 🦸'); } },
      { label: 'Pass. I want serious roles.', run: function () { x.skill = Math.min(100, x.skill + 1); return 'I turned down the franchise. My agent cried a little.'; } }
    ] };
  } });
  def('ac_passion', { build: function () {
    var x = st(), dir = U.pick(['an acclaimed auteur', 'a festival-darling director', 'a legendary filmmaker']);
    return { icon: '🎞️', title: 'A passion project', text: dir.charAt(0).toUpperCase() + dir.slice(1) + ' offered me the lead in a small, daring film. The pay is tiny, but the script is incredible.', choices: [
      { label: 'Do it for the art', run: function () { if (st().slate.length >= 2) return 'My schedule was too full. I had to say no.'; x.slate.push({ kind: 'indie', part: 'Lead', title: U.pick(W1) + ' ' + U.pick(W2), studio: U.pick(STUDIOS.indie), genre: U.pick(['drama', 'period drama', 'thriller']), pay: 30000, rep: 8, passion: true }); pay(30000); return good('I signed on to the passion project. This one could be special. 🎞️'); } },
      { label: 'Hold out for a paycheck', run: function () { return 'I passed on the indie. Bills don\'t pay themselves.'; } }
    ] };
  } });
  def('ac_scandal', { build: function () {
    var x = st(), what = U.pick(['an old tweet of mine resurfaced', 'I was photographed screaming at a waiter', 'a co-star said I was a nightmare on set', 'my messy breakup is all over the tabloids']);
    return { icon: '📰', title: 'Tabloid scandal', text: 'The internet is furious: ' + what + '.', choices: [
      { label: 'Post a sincere apology', run: function () { x.rep = Math.max(0, x.rep - 2); E.karma(2); return 'I apologized. Most people moved on.'; } },
      { label: 'Deny everything', run: function () { if (U.chance(0.5)) return 'I denied it and the story died.'; x.rep = Math.max(0, x.rep - 8); E.stat('happy', -8); return bad('Receipts came out. My denial made it so much worse.'); } },
      { label: 'Lean into it', run: function () { E.fame(4); x.rep = Math.max(0, x.rep - 4); return 'I leaned into the villain era. Everyone\'s talking about me, for better or worse.'; } }
    ] };
  } });

  // ------------------------------------------------------------ hooks
  function summary() { var x = S().acting; return x ? title() + ' · ' + U.plural(x.credits.length, 'credit') : 'Audition for your first role'; }
  function aboutRow() {
    var x = S().acting;
    if (!x || !x.credits.length) return null;
    return ['🎬 Acting', title() + ' · ' + U.plural(x.credits.length, 'credit') + (x.wins ? ' · ' + U.plural(x.wins, 'award') : '')];
  }
  // A won acting award counts toward my record (called from the award event).
  function onAward(name) { var x = S().acting; if (x && /Academy|Emmy|Golden Globe|Tony/.test(name)) { x.wins++; x.rep = Math.min(100, x.rep + 6); var c = x.credits.filter(function (r) { return r.nom; }).pop(); if (c) c.award = name; } }
  return { menu: menu, year: year, yearly: yearly, summary: summary, aboutRow: aboutRow, title: title, onAward: onAward, st: st, KINDS: KINDS };
})();
