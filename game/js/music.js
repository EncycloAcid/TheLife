/* TheLife — v1.16: music career. Pick a genre and a stage name, write
 * songs, release singles, EPs and albums that stream, chart on the
 * Billboard Hot 100 and 200 and go Gold or Platinum, play everything from
 * open mics to stadium tours, stay independent or sign with a real label,
 * do features, play festivals and get nominated for Grammys.
 * State: S().music. A professional musician's job has job.music = true and
 * the year's pay in job.salary. Money is in base dollars until paid out. */
TL.music = (function () {
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
  function big(n) { return n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(Math.round(n)); }

  var GENRES = {
    'Pop': { noun: ['Singer', 'Singer'], fest: 1 }, 'Hip Hop': { noun: ['Rapper', 'Rapper'], fest: 1.1 }, 'R&B': { noun: ['Singer', 'Singer'], fest: 0.9 },
    'Rock': { noun: ['Rocker', 'Rocker'], fest: 1.1 }, 'Country': { noun: ['Country Singer', 'Country Singer'], fest: 0.9 }, 'EDM': { noun: ['DJ', 'DJ'], fest: 1.3 },
    'Indie': { noun: ['Singer-Songwriter', 'Singer-Songwriter'], fest: 1 }, 'Latin': { noun: ['Singer', 'Singer'], fest: 1 }, 'Jazz': { noun: ['Jazz Musician', 'Jazz Musician'], fest: 0.6 }
  };
  var LABELS = [
    ['Sub Pop', 'indie', 2000, 20000, 0.5, 2], ['XL Recordings', 'indie', 15000, 60000, 0.5, 2], ['Big Machine Records', 'indie', 50000, 120000, 0.4, 3],
    ['Republic Records', 'major', 100000, 500000, 0.2, 3], ['Atlantic Records', 'major', 200000, 400000, 0.18, 3], ['Columbia Records', 'major', 500000, 600000, 0.18, 4],
    ['Interscope Records', 'major', 1000000, 800000, 0.2, 4], ['Def Jam Recordings', 'major', 300000, 500000, 0.2, 3]
  ];
  // [id, icon, name, min fans, base ticket gross per fan, health cost]
  var GIGS = [
    ['openmic', '🎙️', 'Play an open mic', 0, 0, 0, 'open mic'], ['local', '🍻', 'Play local bars', 300, 0.6, 2, 'bar gigs'], ['club', '🚐', 'Club tour', 15000, 1.2, 5, 'club tour'],
    ['theater', '🎭', 'Theater tour', 250000, 1.6, 7, 'theater tour'], ['arena', '🏟️', 'Arena tour', 2000000, 2.2, 10, 'arena tour'], ['stadium', '🏟️', 'Stadium world tour', 15000000, 3, 14, 'stadium world tour']
  ];
  var W1 = ['Neon', 'Midnight', 'Golden', 'Paper', 'Electric', 'Velvet', 'Broken', 'Summer', 'Cherry', 'Ocean', 'Wild', 'Silver', 'Lonely', 'Rose', 'Diamond', 'Highway'];
  var W2 = ['Hearts', 'Dreams', 'City', 'Lights', 'Love', 'Fever', 'Nights', 'Skies', 'Tears', 'Gold', 'Rain', 'Ghosts', 'Roses', 'Waves', 'Fire', 'Radio'];
  function songTitle() { return U.chance(0.35) ? U.pick(W1) : U.pick(W1) + ' ' + U.pick(W2); }

  // ------------------------------------------------------- artist profile
  // Four crafts kept as offsets from overall musicianship: my genre sets the
  // starting shape and what I work on shifts it (the offsets average zero).
  var CRAFT = [['wri', 'Songwriting'], ['voc', 'Vocals'], ['pro', 'Production'], ['sta', 'Performance']];
  var CSHAPE = { 'Pop': { wri: 1, voc: 5, pro: -1, sta: -5 }, 'Hip Hop': { wri: 5, voc: 2, pro: 1, sta: -8 }, 'R&B': { wri: -1, voc: 7, pro: 0, sta: -6 }, 'Rock': { wri: 2, voc: -2, pro: -4, sta: 4 }, 'Country': { wri: 5, voc: 2, pro: -5, sta: -2 }, 'EDM': { wri: -4, voc: -2, pro: 8, sta: -2 }, 'Indie': { wri: 7, voc: 0, pro: -1, sta: -6 }, 'Latin': { wri: -2, voc: 4, pro: -2, sta: 0 }, 'Jazz': { wri: 1, voc: 4, pro: -6, sta: 1 } };
  // Some genres live on hooks more than others.
  var HOOK = { 'Pop': 3, 'EDM': 2, 'Hip Hop': 2, 'Latin': 1, 'Country': 0, 'R&B': 0, 'Rock': -1, 'Indie': -2, 'Jazz': -6 };
  function craft(x) {
    if (!x.craft) { var t = CSHAPE[x.genre] || CSHAPE.Pop; x.craft = {}; CRAFT.forEach(function (c) { x.craft[c[0]] = t[c[0]] + U.rand(-4, 4); }); cnorm(x); }
    return x.craft;
  }
  function cnorm(x) { var o = x.craft, m = (o.wri + o.voc + o.pro + o.sta) / 4; CRAFT.forEach(function (c) { o[c[0]] = U.clamp(Math.round((o[c[0]] - m) * 10) / 10, -12, 12); }); }
  function shift(x, k, n) { craft(x)[k] += n; cnorm(x); }
  function ca(x, k) { return U.clamp(Math.round(x.skill + craft(x)[k]), 1, 100); }
  function craftName(x, k) { return k === 'voc' ? ({ 'Hip Hop': 'Flow', 'EDM': 'Sound design', 'Jazz': 'Chops' }[x.genre] || 'Vocals') : CRAFT.filter(function (c) { return c[0] === k; })[0][1]; }
  function archetype(x) {
    var o = craft(x), ks = ['wri', 'voc', 'pro', 'sta'].sort(function (a, b) { return o[b] - o[a]; });
    if (o[ks[0]] - o[ks[3]] < 6) return 'All-around artist';
    return { 'voc+wri': 'Hitmaker', 'pro+wri': 'Studio auteur', 'sta+wri': 'Storyteller', 'pro+voc': 'Studio perfectionist', 'sta+voc': 'Born performer', 'pro+sta': 'Spectacle artist' }[[ks[0], ks[1]].sort().join('+')];
  }
  function hookOf(song) { return song.h != null ? song.h : song.q; }
  function catchiest(x) { return x.vault.slice().sort(function (a, b) { return hookOf(b) - hookOf(a); })[0]; }

  function st() {
    var s = S(), j = s.job;
    if (j && j.career === 'musician' && !j.music) migrate(j, s.music);
    return s.music || null;
  }
  function fresh(genre, name) {
    var m = me(), s = S();
    var sing = (s.skills && s.skills.singing) || 0;
    s.music = { genre: genre, name: name, talent: U.clamp(Math.round(U.gauss(58, 16) + m.smarts / 15 + (TL.talents ? TL.talents.ceiling('music') : 0)), 25, 99), skill: U.clamp(12 + (s.flags.music || 0) * 3 + sing / 4 + (TL.talents && TL.talents.has('music') ? 8 : 0), 5, 50), buzz: 0, fans: U.rand(20, 120), label: null, songs: [], vault: [], albums: [], released: 0, streams: 0, earn: 0, noms: 0, wins: 0, started: s.year };
    return s.music;
  }
  // Saves from before v1.16: an old "musician" job becomes a music career.
  function migrate(j, x) {
    var g = String(j.company || '').replace(' scene', '');
    if (!x) x = fresh(GENRES[g] ? g : U.pick(Object.keys(GENRES)), me().first + ' ' + me().last);
    j.music = true; j.salary = 0;
    x.fans = Math.max(x.fans, [500, 8000, 120000, 1500000, 9000000, 40000000][j.level] || 500);
    x.skill = Math.max(x.skill, 30 + (j.level || 0) * 9);
    // A career already under way has a back catalog (and a deal, if signed).
    x.streams = Math.max(x.streams, x.fans * 60); x.released = Math.max(x.released, 1 + (j.level || 0) * 2);
    if ((j.level || 0) >= 2 && !x.label) x.label = { name: U.pick(['Republic Records', 'Atlantic Records', 'Columbia Records']), kind: 'major', rate: 0.18, tier: 3, owed: 2 };
    j.title = title();
  }
  function hasJob() { var j = S().job; return !!(j && j.music); }
  function tier(f) { return f >= 5e7 ? 'Icon' : f >= 1e7 ? 'Superstar' : f >= 1e6 ? 'Star' : f >= 1e5 ? 'Rising' : f >= 1e4 ? 'Indie' : f >= 1e3 ? 'Local' : 'Aspiring'; }
  function title() {
    var x = S().music; if (!x) return 'Musician';
    var t = tier(x.fans), n = GENRES[x.genre].noun[0];
    return t === 'Icon' ? 'Music Icon' : t === 'Superstar' ? 'Superstar ' + n : t === 'Star' ? 'Chart-Topping ' + n : t === 'Rising' ? 'Rising ' + n : t + ' ' + n;
  }
  function grow(x, g) {
    var room = x.talent - x.skill;
    x.skill = U.clamp(Math.round((x.skill + g * (room > 0 ? Math.min(1, room / 20) : 0.08)) * 10) / 10, 0, 100);
  }
  // Pay goes through my music job (taxed) when music is my job.
  function pay(base) {
    var x = st(), s = S(), amt = E.$(base);
    if (amt <= 0) return 0;
    if (!s.job && me().age >= 18 && !s.edu && !s.prison && !s.retired) s.job = { career: 'musician', music: true, fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, company: x.label ? x.label.name : 'Independent', salary: 0, title: title() };
    if (hasJob()) { x.earn += amt; return amt; }
    E.addMoney(Math.round(amt * (me().age < 18 ? 1 : 0.75)));
    return amt;
  }
  function addFans(x, n) { x.fans = Math.max(0, Math.round(x.fans + n)); if (S().social && S().social.platform) S().followers += Math.round(Math.max(0, n) * 0.1); }

  // ------------------------------------------------------------ start
  function start() {
    var m = me();
    ui().choose('🎵 Pick your genre', 'What kind of music do I make?', Object.keys(GENRES).map(function (g) {
      return { label: g, fn: function () {
        var n = [m.first + ' ' + m.last, U.pick(['Lil ', 'Young ', 'DJ ', 'MC ', '']) + m.first, m.first.charAt(0) + '.' + m.last.charAt(0) + '.', U.pick(W1) + ' ' + m.first];
        if (g === 'Hip Hop') n[1] = U.pick(['Lil ', 'Young ', 'MC ']) + m.first;
        if (g === 'EDM') n[1] = 'DJ ' + m.first;
        if (g === 'Rock' || g === 'Indie') n[3] = 'The ' + U.pick(W1) + ' ' + U.pick(W2);
        ui().choose('🎤 Stage name', 'What name do I perform under?', n.filter(function (v, i, a) { return a.indexOf(v) === i; }).map(function (name) {
          return { label: name, fn: function () { fresh(g, name); done(good('I started making ' + g.toLowerCase() + ' music as "' + name + '". 🎵')); menu(); } };
        }));
      } };
    }));
  }

  // ------------------------------------------------------------ craft
  var LESSONS = [['voice', '🎤', 'Voice lessons', 400, 10, [2, 4], 'voc'], ['prod', '🎚️', 'Music production course', 1500, 14, [2, 5], 'pro'], ['stage', '🕺', 'Performance coach', 2500, 16, [2, 4], 'sta'], ['berklee', '🎓', 'Berklee summer program', 6000, 16, [4, 7], 'wri']];
  function lesson(l) {
    var x = st(), cost = E.$(l[3]);
    if (count('mu_' + l[0])) return done(nope('I already did that this year.'));
    if (S().money < cost) return done(nope('That costs ' + E.fmt(cost) + '.'));
    bump('mu_' + l[0]); E.addMoney(-cost);
    grow(x, U.rand(l[5][0], l[5][1]) / (1 + count('mu_trained'))); bump('mu_trained');
    shift(x, l[6], 2);
    S().flags.music = (S().flags.music || 0) + 1;
    return done(l[2] + ': I\'m getting better. 🎶 (' + craftName(x, l[6]).toLowerCase() + ' ' + ca(x, l[6]) + ', musicianship ' + Math.round(x.skill) + ')');
  }
  function write() {
    var x = st();
    if (count('mu_write') >= 4) return done(nope('I\'m out of ideas this year. Writer\'s block is real.'));
    ui().choose('✍️ Write a song', 'What am I going for? Catchy songs stream; deep songs win over critics.', [
      { label: '🎣 Chase a catchy hook', fn: function () { writeSong(-6, 5); } },
      { label: '💔 Write something personal', fn: function () { writeSong(me().happy < 40 ? 11 : 8, -6); } },
      { label: '🤝 Co-write with a hit songwriter (' + E.fmt(E.$(3000)) + ')', fn: function () { if (S().money < E.$(3000)) return done(nope('A co-write session costs ' + E.fmt(E.$(3000)) + '.')); E.addMoney(-E.$(3000)); writeSong(4, 4); } }
    ]);
  }
  function writeSong(dq, dh) {
    var x = st();
    if (count('mu_write') >= 4) return done(nope('I\'m out of ideas this year. Writer\'s block is real.'));
    bump('mu_write');
    var sk = (S().skills && (S().skills.singing || 0)) || 0;
    var q = U.clamp(Math.round(ca(x, 'wri') * 0.55 + sk * 0.1 + U.rand(0, 45) + (me().happy < 25 ? 6 : 0) + dq), 5, 100); // heartbreak makes good songs
    var hk = U.clamp(Math.round(ca(x, 'wri') * 0.3 + ca(x, 'voc') * 0.25 + sk * 0.1 + U.rand(0, 45) + (HOOK[x.genre] || 0) + dh - 3), 5, 100);
    var song = { title: songTitle(), q: q, h: hk };
    x.vault.push(song); grow(x, 1.2); shift(x, 'wri', 0.25);
    var tag = ' (hook ' + hk + ', depth ' + q + ')';
    return done(hk >= 85 ? good('I wrote "' + song.title + '" and I can\'t get it out of my head. Might be a hit. ✍️🔥' + tag) : q >= 85 ? good('I wrote "' + song.title + '", the best thing I\'ve ever written. ✍️' + tag) : q >= 55 || hk >= 55 ? 'I wrote a new song, "' + song.title + '". ✍️' + tag : 'I wrote "' + song.title + '". It\'s... a start. ✍️' + tag);
  }

  // ------------------------------------------------------------ releases
  // Streams from fans, from quality reaching new listeners, label push and luck.
  function streamsFor(x, q, promo) {
    // Great songs find new listeners; the occasional viral moment changes everything.
    var reach = x.fans * U.randf(1.5, 4.5) + Math.pow(q, 2.6) * U.randf(2, 10) * promo * (1 + (x.buzz || 0) / 40); // buzz finds new listeners
    var viral = U.chance(0.004 + Math.max(0, q - 65) / 500 + (promo > 1.4 ? 0.01 : 0));
    return { n: Math.round(reach * (viral ? U.rand(20, 150) : 1)), viral: viral };
  }
  // Chart bars an established star can reach (they used to need freak viral hits).
  function hot100(streams) { return streams >= 2e8 ? 1 : streams >= 6e7 ? U.rand(2, 10) : streams >= 1.8e7 ? U.rand(11, 40) : streams >= 5e6 ? U.rand(41, 100) : 0; }
  function cert(units) { return units >= 1e7 ? 'Diamond' : units >= 2e6 ? (Math.floor(units / 1e6)) + '× Platinum' : units >= 1e6 ? 'Platinum' : units >= 5e5 ? 'Gold' : null; }
  // New artists turn listeners into fans faster: every new fan is a big share of a small base.
  function early(x) { return 1 + 1.5 / (1 + x.fans / 1e5); }
  function labelPromo(x) { return x.label ? (x.label.kind === 'major' ? 1.8 : 1.3) : 1; }
  function royalties(x, streams) { return Math.round(streams * 0.004 * (x.label ? x.label.rate : 0.85)); }
  function single() {
    var x = st();
    if (!x.vault.length) return done(nope('I need to write a song first.'));
    if (count('mu_single') >= 3) return done(nope('Three singles a year is plenty. Let the last one breathe.'));
    // Pick the song: the catchiest isn't always the one I believe in.
    var picks = x.vault.slice().sort(function (a, b) { return hookOf(b) - hookOf(a); }).slice(0, 4);
    ui().choose('🎧 Release a single', 'Which song goes out next? Hooks stream; depth wins critics and awards.' + ((x.buzz || 0) >= 30 ? ' I\'ve got buzz right now, so people are listening.' : ''), picks.map(function (song) {
      return { label: '"' + song.title + '" · hook ' + hookOf(song) + ', depth ' + song.q, fn: function () { promoteSingle(song); } };
    }));
  }
  function promoteSingle(best) {
    var tease = S().year >= 2019 ? 'Tease it on TikTok first' : S().year >= 2006 ? 'Leak a snippet on YouTube' : S().year >= 1981 ? 'Get it to radio DJs first' : null;
    ui().choose('🎧 Release "' + best.title + '" (hook ' + hookOf(best) + ')', 'How do I put it out?', [
      { label: S().year >= 2005 ? 'Just drop it on streaming' : 'Just put it out', fn: function () { releaseSingle(best, 0, 1); } },
      { label: (S().year >= 1981 ? 'Shoot a music video' : 'Pay for a radio push') + ' (' + E.fmt(E.$(5000)) + ')', fn: function () { if (S().money < E.$(5000)) return done(nope('That costs ' + E.fmt(E.$(5000)) + '.')); E.addMoney(-E.$(5000)); releaseSingle(best, 6, 1.25); } }
    ].concat(tease ? [{ label: tease, fn: function () { releaseSingle(best, 0, U.chance(0.3 + hookOf(best) / 400) ? 1.9 : 1.05); } }] : []));
  }
  function releaseSingle(song, bonus, promo) {
    var x = st();
    bump('mu_single');
    x.vault = x.vault.filter(function (v) { return v !== song; });
    var q = U.clamp(hookOf(song) + bonus, 1, 100), r = streamsFor(x, q, promo * labelPromo(x));
    var peak = hot100(r.n), gain = r.n * U.randf(0.008, 0.016) * (q / 70) / (1 + x.fans / 6e6) * early(x);
    addFans(x, gain); x.streams += r.n; x.released++;
    var rec = { title: song.title, year: S().year, q: song.q, h: q, streams: r.n, peak: peak, kind: 'single' };
    if (bonus >= 6) rec.video = true;
    if (peak) { rec.weeks = U.clamp(Math.round((101 - peak) / 5 + (q - 55) / 3 + U.rand(0, 8)), 1, 70); if (peak === 1) rec.top = U.clamp(Math.round(r.n / 1.5e8 * U.randf(0.6, 1.6)), 1, 16); }
    if (x.firstRel == null) x.firstRel = S().year;
    x.songs.push(rec); grow(x, 0.8); // putting music out teaches you
    var c = cert(r.n / 150);
    if (c) { rec.cert = c; if (/Platinum|Diamond/.test(c)) E.achieve('platinum'); }
    x.lastActive = S().year;
    pay(royalties(x, r.n));
    E.fame(Math.min(8, Math.log10(1 + gain) - 1));
    if (peak === 1) E.achieve('number_one');
    x.buzz = U.clamp((x.buzz || 0) + (r.viral ? 30 : 0) + (peak ? (peak <= 10 ? 25 : peak <= 40 ? 15 : 8) : q >= 70 ? 3 : 0), 0, 100);
    var msg = (r.viral ? '🔥 "' + song.title + '" blew up on TikTok! ' : '🎧 I released "' + song.title + '". ') + 'It got ' + big(r.n) + ' streams' + (peak ? ' and peaked at #' + peak + ' on the Billboard Hot 100' + (rec.top ? ' (' + U.plural(rec.top, 'week') + ' at #1)' : ', ' + U.plural(rec.weeks, 'week') + ' on the chart') : '') + (c ? '. Certified ' + c + '!' : '.') + ' +' + big(gain) + ' fans.';
    return done(peak && peak <= 10 || r.viral ? good(msg) : msg);
  }
  function album() {
    var x = st();
    if (x.vault.length < 5) return done(nope('I need at least 5 songs to put out an EP (I have ' + x.vault.length + ').'));
    if (count('mu_album')) return done(nope('I already put out a project this year.'));
    var lp = x.vault.length >= 10;
    ui().choose('💿 Release a' + (lp ? 'n album' : 'n EP'), 'I have ' + x.vault.length + ' songs. How much do I spend on production?', [
      { label: 'Record it at home', fn: function () { releaseAlbum(lp, 0, 0); } },
      { label: 'Book a real studio (' + E.fmt(E.$(20000)) + ')', fn: function () { if (S().money < E.$(20000) && !x.label) return done(nope('Studio time costs ' + E.fmt(E.$(20000)) + '.')); if (!x.label) E.addMoney(-E.$(20000)); releaseAlbum(lp, 6, 0); } },
      { label: 'Hire a star producer (' + E.fmt(E.$(150000)) + ')', fn: function () { if (S().money < E.$(150000) && !(x.label && x.label.kind === 'major')) return done(nope('A star producer costs ' + E.fmt(E.$(150000)) + '.')); if (!(x.label && x.label.kind === 'major')) E.addMoney(-E.$(150000)); releaseAlbum(lp, 11, 0.2); } }
    ]);
  }
  function releaseAlbum(lp, prod, hype) {
    var x = st(), s = S();
    bump('mu_album');
    var tracks = x.vault.slice().sort(function (a, b) { return b.q - a.q; }).slice(0, lp ? 14 : 7);
    x.vault = x.vault.filter(function (v) { return tracks.indexOf(v) < 0; });
    var avg = tracks.reduce(function (a, t) { return a + t.q; }, 0) / tracks.length;
    var hooks = tracks.reduce(function (a, t) { return a + hookOf(t); }, 0) / tracks.length;
    var review = U.clamp(Math.round(avg * 0.75 + prod + (ca(x, 'pro') - x.skill) / 2 + U.rand(0, 30) - 3), 15, 99);
    var promo = labelPromo(x) + hype;
    var week = Math.round((x.fans * U.randf(0.005, 0.02) + Math.pow(review, 2) * U.randf(1, 3) * promo) * (lp ? 1 : 0.4) * (0.8 + hooks / 250));
    if (x.firstRel == null) x.firstRel = s.year;
    shift(x, 'pro', 0.5);
    var peak = week >= 3e5 ? 1 : week >= 1e5 ? U.rand(2, 5) : week >= 3e4 ? U.rand(6, 20) : week >= 8e3 ? U.rand(21, 100) : week >= 3e3 ? U.rand(101, 200) : 0;
    var total = Math.round(week * U.randf(3, 7)), streams = total * 1500;
    var gain = week * U.randf(2.5, 6) * (review / 70) / (1 + x.fans / 6e6) * early(x);
    addFans(x, gain); x.streams += streams; x.released++;
    var title = U.chance(0.4) ? tracks[0].title : U.pick(W1) + ' ' + U.pick(W2);
    var rec = { title: title, year: s.year, kind: lp ? 'album' : 'EP', review: review, week: week, peak: peak, units: total };
    var c = cert(total); if (c) rec.cert = c;
    x.albums.push(rec);
    var earned = royalties(x, streams) + Math.round(total * 0.15 * 10 * (x.label ? x.label.rate : 0.85));
    pay(earned);
    var fulfilled = false;
    if (x.label && x.label.owed) { x.label.owed--; fulfilled = x.label.owed === 0; }
    x.lastActive = s.year;
    E.fame(Math.min(12, Math.log10(1 + gain) * 1.2 - 2));
    if (peak === 1) E.achieve('number_one');
    E.log('💿 My ' + (lp ? 'album' : 'EP') + ' "' + title + '" got a ' + review + ' on Metacritic' + (peak ? ' and debuted at #' + peak + ' on the Billboard 200 with ' + big(week) + ' first-week units' : '') + '.' + (c ? ' Certified ' + c + '! 💿' : ''), review >= 80 || (peak && peak <= 10) ? 'good' : review < 45 ? 'bad' : '');
    rec.nomEligible = review >= 80;
    x.buzz = U.clamp((x.buzz || 0) + (peak && peak <= 10 ? 20 : peak ? 8 : 0) + (review >= 80 ? 10 : 0), 0, 100);
    if (fulfilled) s.pending.push({ id: 'mu_label_done', data: {} });
    if (c && /Platinum|Diamond/.test(c)) E.achieve('platinum');
    return done({ text: '💿 "' + title + '" is out now. ' + (review >= 80 ? 'Critics love it.' : review >= 60 ? 'Solid reviews.' : 'Critics were not kind.'), cls: '', quiet: true });
  }

  // Getting heard without a label: whatever the era offered.
  function online() {
    var y = S().year;
    return y >= 2019 ? ['🎵', 'Post a snippet on TikTok', 'TikTok'] : y >= 2010 ? ['☁️', 'Upload a song to SoundCloud', 'SoundCloud'] : y >= 2006 ? ['▶️', 'Post a song on YouTube', 'YouTube'] : y >= 2004 ? ['🎸', 'Put a song on MySpace', 'MySpace'] : y >= 1999 ? ['💽', 'Upload an MP3 online', 'the internet'] : ['📻', 'Send a demo tape to a radio DJ', 'local radio'];
  }
  function postOnline() {
    var x = st(); if (!x.vault.length) return done(nope('I need a song first.'));
    if (count('mu_online')) return done(nope('I already did that this year.'));
    bump('mu_online'); x.lastActive = S().year;
    var song = catchiest(x), h = hookOf(song), ol = online();
    var chance = U.clamp((h - 60) / 220 + (TL.talents && TL.talents.has('music') ? 0.04 : 0) + (x.fans < 5000 ? 0.03 : 0), 0.01, 0.3);
    if (U.chance(chance)) {
      var gain = Math.round(Math.pow(h, 2.2) * U.randf(4, 14) * (S().year >= 2019 ? 2 : 1));
      addFans(x, gain); x.buzz = U.clamp((x.buzz || 0) + 35, 0, 100); E.fame(3);
      return done(good('🚀 "' + song.title + '" blew up on ' + ol[2] + '! +' + big(gain) + ' fans, and people are asking when the full song drops.'));
    }
    var small = Math.round(Math.max(10, h * U.randf(0.5, 3) + x.fans * U.randf(0.002, 0.01)));
    addFans(x, small);
    return done(ol[2] === 'local radio' ? 'The DJ played "' + song.title + '" once, late at night. +' + big(small) + ' fans.' : 'I posted "' + song.title + '" on ' + ol[2] + '. A few people shared it. +' + big(small) + ' fans.');
  }
  def('mu_talentshow', { min: 9, max: 17, w: 3, cond: function () { return (!!S().music || (TL.talents && TL.talents.mine().some(function (t) { return t.id === 'music' && t.known; }))) && !S().prison; }, build: function () {
    var x = S().music;
    return { icon: '🎤', title: 'School talent show', text: 'The school talent show is next week. Everyone will be there.', choices: [
      { label: 'Sing my heart out', run: function () {
        var gift = TL.talents && TL.talents.has('music'), r = U.rand(0, 100) + (gift ? 30 : 0) + (x ? x.skill / 3 : 0);
        S().flags.music = (S().flags.music || 0) + 1;
        if (r >= 70) { if (x) { x.fans += U.rand(80, 400); x.buzz = U.clamp((x.buzz || 0) + 10, 0, 100); } E.stat('happy', 10); E.fame(1); return good('I won the talent show. Someone\'s video of it got passed around the whole town. 🏆'); }
        if (r >= 35) { E.stat('happy', 5); return 'I placed third. Not bad for a first time on a real stage.'; }
        E.stat('happy', -6); return bad('My voice cracked on the high note. Everyone saw.');
      } },
      { label: 'Stay in the audience', run: function () { return 'I watched from the bleachers. Next year, maybe.'; } }
    ] };
  } });
  def('mu_discovered', { build: function (d) {
    var x = st(); if (!x || x.label || x.retired) return null;
    var who = U.pick(['a producer who works with big names', 'an A&R scout from a major label', 'a famous songwriter']);
    return { icon: '🌟', title: 'Discovered', text: 'My song "' + d.title + '" reached ' + who + '. They want to work with me.', choices: [
      { label: 'Sign a development deal', run: function () { x.label = { name: U.pick(['Republic Records', 'Atlantic Records', 'Interscope Records']), kind: 'major', rate: 0.15, tier: 2, owed: 2 }; x.buzz = U.clamp((x.buzz || 0) + 20, 0, 100); pay(25000); E.achieve('signed'); if (hasJob()) S().job.company = x.label.name; return good('I signed a development deal with ' + x.label.name + '. They believe in me. 📝'); } },
      { label: 'Take them on as a mentor', run: function () { x.talent = Math.min(99, x.talent + 4); grow(x, 5); return good('A year in the studio with a real pro taught me more than any class. My ceiling just went up.'); } },
      { label: 'Stay DIY', run: function () { addFans(x, 500); return 'I said thanks but no thanks. I\'ll do it my way.'; } }
    ] };
  } });

  // ------------------------------------------------------------ live
  // Ticket pricing: [label, crowd, price, new fans].
  var PRICES = [['🎟️ Cheap tickets: pack every room', 1.25, 0.65, 1.35], ['🎫 Standard prices', 1, 1, 1], ['💎 Premium tickets and VIP packages', 0.8, 1.7, 0.7]];
  function gig(g) {
    var x = st();
    if (count('mu_gig_' + g[0])) return done(nope('I already did that this year.'));
    if (x.fans < g[3]) return done(nope('I need about ' + big(g[3]) + ' fans to book that.'));
    var tour = g[0] !== 'openmic' && g[0] !== 'local';
    if (tour && count('mu_tour')) return done(nope('I can only fit one tour into a year.'));
    if (!tour) return playGig(g, PRICES[1]);
    ui().choose(g[1] + ' ' + U.cap(g[6]), 'How do I price the tickets?', PRICES.map(function (p) { return { label: p[0], fn: function () { playGig(g, p); } }; }));
  }
  function playGig(g, price) {
    var x = st(), s = S(), tour = g[0] !== 'openmic' && g[0] !== 'local';
    if (count('mu_gig_' + g[0]) || (tour && count('mu_tour'))) return done(nope('I already did that this year.'));
    bump('mu_gig_' + g[0]); if (tour) bump('mu_tour');
    x.lastActive = s.year;
    var crowd = g[0] === 'openmic' ? U.rand(10, 60) : Math.round(x.fans * U.randf(0.02, 0.08) * price[1]);
    var gross = Math.round(crowd * g[4] * U.randf(25, 60) * price[2]), take = Math.round(gross * 0.4);
    // Fans buy shirts when the show is good.
    var merch = tour ? Math.round(crowd * U.randf(3, 10) * (0.7 + ca(x, 'sta') / 100) * 0.5) : 0;
    var r = U.rand(1, 100) + (ca(x, 'sta') - 50) / 3;
    E.stat('health', -g[5]); E.stat('happy', 6);
    shift(x, 'sta', 0.6);
    if (r <= 8 && g[0] !== 'openmic') { E.stat('health', -8); pay(Math.round(take / 2)); return done(bad('I lost my voice halfway through the ' + g[6] + ' and had to cancel the rest. 😷')); }
    addFans(x, (crowd * U.randf(0.03, r >= 80 ? 0.25 : 0.1) + (g[0] === 'openmic' ? U.rand(5, 30) : 0)) * price[3]);
    grow(x, 0.8);
    if (take + merch) pay(take + merch);
    if (g[0] === 'openmic') return done(r >= 85 ? good('I killed it at the open mic. Someone filmed it and it\'s making the rounds. 🎙️') : 'I played a few songs at an open mic. 🎙️');
    return done((r >= 80 ? good : function (t) { return t; })('My ' + g[6] + ' drew ' + big(crowd) + ' people' + (r >= 80 ? ' and sold out everywhere' : '') + '. I took home ' + E.fmt(E.$(take)) + (merch ? ' plus ' + E.fmt(E.$(merch)) + ' in merch' : '') + '. 🎸'));
  }
  function feature() {
    var x = st();
    if (count('mu_feat')) return done(nope('I already did a feature this year.'));
    if (!x.vault.length && x.fans < 5000) return done(nope('Nobody big will feature me yet.'));
    bump('mu_feat'); x.lastActive = S().year;
    var star = x.fans >= 2e6 ? U.pick(['a global superstar', 'a legendary producer', 'the biggest rapper in the world']) : x.fans >= 1e5 ? U.pick(['a rising star', 'a platinum artist', 'a hot producer']) : U.pick(['a local rapper', 'a SoundCloud artist', 'a friend from the scene']);
    if (U.chance(0.25)) return done('I sent my verse to ' + star + ', but the song never came out. 🤷');
    var gain = Math.max(100, x.fans * U.randf(0.02, 0.07) / (1 + x.fans / 5e6)); addFans(x, gain);
    pay(Math.round(gain * 0.05));
    return done(good('I did a feature with ' + star + '. +' + big(gain) + ' fans. 🤝'));
  }
  function shopLabels() {
    var x = st();
    if (count('mu_shop')) return done(nope('I already met with labels this year.'));
    bump('mu_shop');
    var pool = LABELS.filter(function (l) { return x.fans >= l[3] && (!x.label || l[5] > x.label.tier); });
    if (!pool.length) return done(bad(x.label ? 'No bigger label was interested yet.' : 'Labels passed on my demo. I need more fans first.'));
    var offers = U.shuffle(pool.slice()).slice(0, 2).filter(function () { return U.chance(0.35 + Math.min(0.3, x.fans / 1e7)); });
    if (!offers.length) return done('I took some meetings with labels. Nobody made an offer this year.');
    ui().choose('📝 Record deal', 'Label offers on the table:', offers.map(function (l) {
      var adv = Math.round(l[2] * (1 + x.fans / 2e6) / 1000) * 1000;
      return { label: l[0] + ': ' + E.fmt(E.$(adv)) + ' advance, ' + Math.round(l[4] * 100) + '% royalties, ' + l[5] + ' albums', fn: function () {
        x.label = { name: l[0], kind: l[1], rate: l[4], tier: l[5], owed: l[5] };
        pay(adv);
        if (hasJob()) S().job.company = l[0];
        if (l[1] === 'major') E.achieve('signed');
        return done(good('I signed with ' + l[0] + '! ' + E.fmt(E.$(adv)) + ' advance. 📝'));
      } };
    }).concat([{ label: 'Stay independent', fn: function () { return done('I\'m staying independent. I own my masters. 💪'); } }]));
  }
  function goIndie() {
    var x = st();
    ui().confirm('Leave ' + x.label.name + '?', x.label.owed ? 'I still owe them ' + U.plural(x.label.owed, 'album') + '. Buying out my contract costs a lot.' : 'My contract is done. Go independent?', function () {
      var fee = x.label.owed ? E.$(50000 * x.label.owed * x.label.tier) : 0;
      if (fee && S().money < fee) return done(nope('Buying out my contract would cost ' + E.fmt(fee) + '.'));
      E.addMoney(-fee); var n = x.label.name; x.label = null;
      if (hasJob()) S().job.company = 'Independent';
      ui().back(); done('I left ' + n + (fee ? ' (buyout: ' + E.fmt(fee) + ')' : '') + '. I\'m independent now.');
    });
  }
  function retire() {
    ui().confirm('Retire from music?', 'Play one last show and hang it up?', function () {
      var x = st(); x.retired = S().year;
      if (hasJob()) E.quitJob(true);
      ui().back(); done('I played my farewell show. Thank you and goodnight. 🎤');
    });
  }

  // ------------------------------------------------------------ menus
  function stars(t) { var n = U.clamp(Math.round((t - 30) / 14), 1, 5); return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n); }
  function card(x) {
    var aw = (S().awards || []).filter(function (a) { return a.award === 'Grammy Award'; }).length;
    var hits = x.songs.filter(function (s2) { return s2.peak; }).length;
    return '<div class="mu-card"><div class="mu-top"><span class="mu-ico">' + (x.label && TL.logos ? TL.logos.badge(x.label.name) : '🎵') + '</span><div><div class="mu-name">' + U.esc(x.name) + '</div><div class="mu-sub">' + U.esc(title()) + ' · ' + x.genre + ' · ' + (x.label ? U.esc(x.label.name) : 'Independent') + '</div></div></div>' +
      '<div class="mu-stats"><div><b>' + big(x.fans) + '</b><small>fans</small></div><div><b>' + big(x.streams) + '</b><small>streams</small></div><div><b>' + (hits || '—') + '</b><small>Hot 100 hits</small></div><div><b>' + (aw || '—') + '</b><small>Grammys</small></div></div>' +
      '<div class="hb-arch">' + U.esc(archetype(x)) + '</div>' +
      '<div class="mu-line">Potential ' + stars(x.talent) + (x.skill >= x.talent - 2 ? ' · at my ceiling' : '') + ((x.buzz || 0) >= 10 ? ' · 🔥 Buzz ' + x.buzz : '') + '</div>' +
      '<div class="minibar wide"><span>Musicianship ' + Math.round(x.skill) + '</span><span class="track"><span class="fill ' + (x.skill >= 66 ? 'hi' : x.skill >= 33 ? 'mid' : 'lo') + '" style="width:' + Math.round(x.skill) + '%"></span></span></div>' +
      CRAFT.map(function (c) { var v = ca(x, c[0]); return '<div class="minibar wide"><span>' + craftName(x, c[0]) + ' ' + v + '</span><span class="track"><span class="fill ' + (v >= 66 ? 'hi' : v >= 33 ? 'mid' : 'lo') + '" style="width:' + v + '%"></span></span></div>'; }).join('') +
      '<div class="mu-line">✍️ ' + U.plural(x.vault.length, 'unreleased song') + (x.label && x.label.owed ? ' · owe ' + x.label.name + ' ' + U.plural(x.label.owed, 'album') : '') + '</div></div>';
  }
  function menu() {
    if (me().age < 10) return done(nope('I\'m a little young for a music career. Maybe piano lessons first?'));
    var x = st();
    if (!x) return start();
    ui().menu('Music 🎵', function () {
      x = st();
      var items = [{ info: true, html: card(x) }];
      if (x.retired) {
        items.push({ icon: '🎤', label: 'Come out of retirement', onClick: function () { x.retired = null; done('The comeback tour starts now. 🎤'); } });
        items.push({ icon: '💿', label: 'Discography', onClick: discography });
        items.push({ icon: '🏆', label: 'Career highlights', onClick: highlights });
        return items;
      }
      items.push({ section: 'Studio' });
      items.push({ icon: '✍️', label: 'Write a song', sub: (4 - count('mu_write')) + ' left this year', disabled: count('mu_write') >= 4, onClick: write });
      items.push({ icon: '🎧', label: 'Release a single', sub: x.vault.length ? 'Catchiest unreleased: "' + catchiest(x).title + '" (hook ' + hookOf(catchiest(x)) + ')' : 'Write a song first', disabled: !x.vault.length || count('mu_single') >= 3, onClick: single });
      items.push({ icon: '💿', label: x.vault.length >= 10 ? 'Release an album' : 'Release an EP', sub: x.vault.length >= 5 ? U.plural(x.vault.length, 'song') + ' ready' : 'Needs 5+ songs (' + x.vault.length + ')', disabled: x.vault.length < 5 || count('mu_album') > 0, onClick: album });
      items.push({ icon: '🤝', label: 'Do a feature', disabled: count('mu_feat') > 0, onClick: feature });
      var ol = online();
      items.push({ icon: ol[0], label: ol[1], sub: x.vault.length ? 'Free · could get noticed' : 'Write a song first', disabled: !x.vault.length || count('mu_online') > 0, onClick: postOnline });
      items.push({ section: 'Live' });
      GIGS.forEach(function (g) { if (x.fans >= g[3] * 0.3 || g[0] === 'openmic') items.push({ icon: g[1], label: g[2], sub: x.fans < g[3] ? 'Needs ' + big(g[3]) + ' fans' : '', disabled: x.fans < g[3] || count('mu_gig_' + g[0]) > 0 || (g[0] !== 'openmic' && g[0] !== 'local' && count('mu_tour') > 0), onClick: function () { gig(g); } }); });
      items.push({ section: 'Career' });
      LESSONS.forEach(function (l) { if (me().age >= l[4]) items.push({ icon: l[1], label: l[2], sub: craftName(x, l[6]) + ' ' + ca(x, l[6]), right: E.fmt(E.$(l[3])), disabled: count('mu_' + l[0]) > 0, onClick: function () { lesson(l); } }); });
      if (me().age >= 16) items.push({ icon: '📝', label: x.label ? 'Shop for a bigger deal' : 'Shop my demo to labels', disabled: count('mu_shop') > 0, onClick: shopLabels });
      if (x.label) items.push({ icon: '🔓', label: 'Leave ' + x.label.name, sub: x.label.owed ? 'Owe ' + U.plural(x.label.owed, 'album') : 'Contract complete', onClick: goIndie });
      items.push({ icon: '💿', label: 'Discography', sub: U.plural(x.albums.length, 'project') + ' · ' + U.plural(x.songs.length, 'single'), onClick: discography });
      items.push({ icon: '🏆', label: 'Career highlights', sub: 'Hits, awards and milestones', onClick: highlights });
      if (x.released) items.push({ icon: '🌅', label: 'Retire from music', danger: true, onClick: retire });
      return items;
    });
  }
  function discography() {
    var x = st();
    ui().menu('Discography', function () {
      var all = x.albums.map(function (a) { return { icon: '💿', label: '"' + a.title + '" (' + a.year + ')', sub: U.cap(a.kind) + ' · ' + a.review + ' Metacritic' + (a.peak ? ' · #' + a.peak + ' Billboard 200' : '') + (a.cert ? ' · ' + a.cert : ''), right: a.grammy ? '🏆' : '', y: a.year }; })
        .concat(x.songs.map(function (s2) { return { icon: '🎧', label: '"' + s2.title + '" (' + s2.year + ')', sub: 'Single · ' + big(s2.streams) + ' streams' + (s2.peak ? ' · #' + s2.peak + ' Hot 100' + (s2.top ? ' (' + s2.top + ' wk at #1)' : s2.weeks ? ' · ' + s2.weeks + ' wks' : '') : '') + (s2.cert ? ' · ' + s2.cert : ''), right: '', y: s2.year }; }));
      if (!all.length) return [{ info: true, html: '<p class="muted">Nothing released yet.</p>' }];
      return all.sort(function (a, b) { return b.y - a.y; });
    });
  }

  function highlights() {
    ui().menu('Career highlights', function () {
      var x = st(), rows = [], aws = (S().awards || []).filter(function (a) { return /Grammy|MTV/.test(a.award); });
      var ones = x.songs.filter(function (q) { return q.peak === 1; }), tens = x.songs.filter(function (q) { return q.peak && q.peak <= 10; });
      var lp1 = x.albums.filter(function (a) { return a.peak === 1; });
      var certs = x.songs.concat(x.albums).filter(function (q) { return q.cert; });
      var best = x.songs.slice().sort(function (a, b) { return b.streams - a.streams; })[0];
      aws.forEach(function (a) { rows.push({ icon: '🏆', label: a.award + ' (' + a.year + ')', sub: a.cat }); });
      if (ones.length) rows.push({ icon: '🥇', label: U.plural(ones.length, 'No. 1 hit'), sub: ones.map(function (q) { return '"' + q.title + '"' + (q.top ? ' (' + q.top + ' wk)' : ''); }).join(', ') });
      if (tens.length) rows.push({ icon: '🔟', label: U.plural(tens.length, 'Top 10 hit') });
      if (lp1.length) rows.push({ icon: '💿', label: U.plural(lp1.length, 'No. 1 album'), sub: lp1.map(function (a) { return '"' + a.title + '"'; }).join(', ') });
      ['Diamond', 'Platinum', 'Gold'].forEach(function (c) { var n = certs.filter(function (q) { return c === 'Platinum' ? /Platinum/.test(q.cert) : q.cert === c; }).length; if (n) rows.push({ icon: c === 'Diamond' ? '💎' : '💿', label: U.plural(n, c + ' record') }); });
      if (best) rows.push({ icon: '🎧', label: 'Biggest song: "' + best.title + '"', sub: big(best.streams) + ' streams (' + best.year + ')' });
      if (x.headlined) rows.push({ icon: '🎪', label: 'Headlined ' + U.plural(x.headlined.length, 'festival'), sub: x.headlined.join(', ') });
      if (x.opened) rows.push({ icon: '🚌', label: 'Opened for ' + x.opened.join(', ') });
      if (x.syncs) rows.push({ icon: '📺', label: U.plural(x.syncs.length, 'song placement'), sub: x.syncs.join(', ') });
      rows.push({ icon: '🎵', label: big(x.streams) + ' career streams', sub: big(x.fans) + ' fans · ' + U.plural(x.released, 'release') });
      if (x.rrhof) rows.push({ icon: '🎸', label: 'Rock and Roll Hall of Fame', sub: 'Inducted in ' + x.rrhof });
      return rows;
    });
  }

  // ------------------------------------------------------------ the year
  function year() {
    var s = S(), x = st(), j = s.job;
    if (!x) return 0;
    // The catalog keeps streaming, a little less each year.
    var cat = Math.round(x.streams * 0.04 * U.randf(0.6, 1.2));
    var roy = royalties(x, cat);
    if (roy > 0) x.earn += E.$(roy);
    // Fans drift away if I go quiet.
    // (yearActs are already reset when the year turns, so use the last active year.)
    var active = x.lastActive != null && x.lastActive >= s.year - 1;
    x.fans = Math.round(x.fans * (active ? U.randf(0.95, 0.99) : U.randf(0.82, 0.9)));
    x.buzz = Math.round((x.buzz || 0) * (active ? 0.6 : 0.3));
    if (active) grow(x, 1); // a working musician gets better just by doing it
    // Grammys: a great project this year (or a monster single) can be nominated.
    var proj = x.albums.filter(function (a) { return a.year === s.year - 1 && a.nomEligible && !a.nom; }).sort(function (a, b) { return b.review - a.review; })[0];
    var hit = x.songs.filter(function (q) { return q.year === s.year - 1 && q.peak && q.peak <= 5 && q.q >= 80 && !q.nom; })[0];
    if ((proj || hit) && !s.prison) {
      var first = x.albums.length <= 1 && x.noms === 0;
      var p = proj ? (proj.review - 76) / 30 + Math.min(0.15, x.fans / 6e7) : 0.25;
      if (U.chance(U.clamp(p, 0, 0.8))) {
        var cat2 = proj ? (first && U.chance(0.5) ? 'Best New Artist' : proj.review >= 90 && U.chance(0.5) ? 'Album of the Year, for "' + proj.title + '"' : 'Best ' + x.genre + ' Album, for "' + proj.title + '"') : 'Song of the Year, for "' + hit.title + '"';
        (proj || hit).nom = true; x.noms++;
        E.queue('award', { award: 'Grammy Award', cat: cat2, win: 0.2 + ((proj ? proj.review : 85) - 82) / 45 - x.wins * 0.04 });
      }
    }
    // A big music video can win at the VMAs.
    var vid = x.songs.filter(function (q) { return q.year === s.year - 1 && q.video && q.peak && q.peak <= 10 && !q.vma; })[0];
    if (vid && !s.prison && U.chance(0.4)) { vid.vma = true; E.queue('award', { award: 'MTV Video Music Award', cat: 'Video of the Year, for "' + vid.title + '"', win: 0.3 + (hookOf(vid) - 70) / 100 }); }
    // Legends get into the Rock and Roll Hall of Fame 25 years after their first release.
    var first = x.firstRel != null ? x.firstRel : x.started, plat = x.songs.concat(x.albums).filter(function (q) { return /Platinum|Diamond/.test(q.cert || ''); }).length;
    if (!x.rrhof && x.released && first != null && s.year - first >= 25 && (x.wins >= 2 || x.songs.filter(function (q) { return q.peak === 1; }).length >= 3 || x.fans >= 2e7 || plat >= 6)) {
      x.rrhof = s.year; E.log('🎸 I was inducted into the Rock and Roll Hall of Fame!', 'good'); E.fame(10); E.achieve('rock_hof');
    }
    // Life on the road and in the industry.
    if (!s.prison && !x.retired) {
      if (x.songs.length && x.fans >= 2000 && U.chance(0.08)) s.pending.push({ id: 'mu_sync', data: {} });
      var gem = x.songs.filter(function (q) { return q.year >= s.year - 2 && hookOf(q) >= 75; })[0];
      if (gem && !x.label && x.fans < 80000 && me().age >= 15 && U.chance(0.18)) s.pending.push({ id: 'mu_discovered', data: { title: gem.title } });
      if (x.fans >= 2e4 && x.fans < 2e6 && U.chance(0.15)) s.pending.push({ id: 'mu_opener', data: {} });
      if (x.fans >= 2e5 && U.chance(0.12)) s.pending.push({ id: 'mu_festival', data: {} });
      else if (x.fans >= 5e4 && U.chance(0.07)) s.pending.push({ id: 'mu_beef', data: {} });
      else if (x.vault.length >= 3 && x.fans >= 1e5 && U.chance(0.05)) s.pending.push({ id: 'mu_leak', data: {} });
    }
    if (x.fans >= 1e7) E.achieve('famous');
    if (s.fame < tierFame(x.fans)) E.fame((tierFame(x.fans) - s.fame) / 4);
    var earned = x.earn; x.earn = 0;
    if (j && j.music) { j.salary = earned; j.title = title(); j.perf = U.clamp(Math.round(Math.log10(1 + x.fans) * 12), 0, 100); }
    return earned;
  }
  function tierFame(f) { return f >= 5e7 ? 95 : f >= 1e7 ? 85 : f >= 1e6 ? 65 : f >= 1e5 ? 40 : f >= 1e4 ? 15 : 0; }
  // Musicians who are kids or have a day job still earn from their catalog.
  function yearly() {
    var s = S();
    if (!s || s.dead || !s.music || hasJob()) return;
    var earned = year();
    if (earned) { E.addMoney(Math.round(earned * 0.75)); E.log('🎵 Music income: ' + E.fmt(Math.round(earned * 0.75)), 'money'); }
  }
  function onAward(name, cat) {
    var x = S().music; if (!x || name !== 'Grammy Award') return;
    x.wins++; addFans(x, x.fans * 0.15 + 50000);
    var a = x.albums.filter(function (q) { return q.nom; }).pop(); if (a && /Album/.test(cat || '')) a.grammy = true;
  }

  def('mu_festival', { cond: function () { return !!st(); }, build: function () {
    var x = st(), fest = U.pick(['Coachella', 'Lollapalooza', 'Glastonbury', 'Bonnaroo', 'Austin City Limits', 'Rolling Loud', 'Tomorrowland']);
    var slot = x.fans >= 1e7 ? 'headline' : x.fans >= 2e6 ? 'a prime evening slot at' : 'an afternoon slot at';
    return { icon: '🎪', title: fest, text: fest + ' offered me ' + (slot === 'headline' ? 'a headline slot' : slot + ' the festival') + '.', choices: [
      { label: 'Play it', run: function () { if (slot === 'headline') (x.headlined = x.headlined || []).push(S().year); var g = x.fans * U.randf(0.03, 0.12) * GENRES[x.genre].fest * (0.8 + ca(x, 'sta') / 250); addFans(x, g); pay(Math.round(x.fans * 0.02 + 20000)); E.fame(3); E.stat('happy', 12); return good('I played ' + fest + '. The crowd sang every word. +' + big(g) + ' fans. 🎪'); } },
      { label: 'Turn it down', run: function () { return 'I passed on ' + fest + ' this year.'; } }
    ] };
  } });
  def('mu_beef', { cond: function () { return !!st(); }, build: function () {
    var x = st(), rival = U.pick(['a rival ' + GENRES[x.genre].noun[0].toLowerCase(), 'an old collaborator', 'a chart rival']);
    return { icon: '🥊', title: 'Beef', text: rival.charAt(0).toUpperCase() + rival.slice(1) + ' took shots at me in a new song.', choices: [
      { label: 'Drop a diss track', run: function () { var w = U.chance(0.45 + (x.skill - 60) / 100); if (w) { addFans(x, x.fans * 0.15); return good('My diss track was brutal. The internet declared me the winner. 🔥'); } addFans(x, -x.fans * 0.05); E.stat('happy', -8); return bad('My diss track flopped. I got roasted worse.'); } },
      { label: 'Take the high road', run: function () { E.karma(3); return 'I stayed above it. Some fans called me soft; most respected it.'; } }
    ] };
  } });
  def('mu_leak', { cond: function () { var x = st(); return !!(x && x.vault && x.vault.length); }, build: function () {
    var x = st();
    return { icon: '💧', title: 'Leak', text: 'Some of my unreleased songs leaked online.', choices: [
      { label: 'Release them officially', run: function () { var lost = x.vault.splice(0, 2); lost.forEach(function (sg) { x.songs.push({ title: sg.title, year: S().year, q: sg.q, streams: Math.round(x.fans * 2), peak: 0, kind: 'single' }); }); addFans(x, x.fans * 0.03); return 'I put the leaked songs out officially. Fans loved getting them early.'; } },
      { label: 'Scrap them and write new ones', run: function () { x.vault.splice(0, 2); E.stat('happy', -6); return bad('I scrapped the leaked songs. Back to the studio.'); } }
    ] };
  } });
  def('mu_sync', { cond: function () { var x = st(); return !!(x && x.songs.length && !x.retired); }, build: function () {
    var x = st(), song = U.pick(x.songs), where = U.pick(['a Netflix series', 'an Apple commercial', 'a movie trailer', 'the next FIFA video game', 'a Super Bowl ad', 'a hit TV drama']);
    var fee = Math.min(2000000, Math.round(U.rand(15, 60) * 1000 * (1 + x.fans / 1e6)));
    return { icon: '📺', title: 'Sync offer', text: where.charAt(0).toUpperCase() + where.slice(1) + ' wants to license "' + song.title + '" for ' + E.fmt(E.$(fee)) + '.', choices: [
      { label: 'License it', run: function () { var g = x.fans * U.randf(0.03, 0.12) + U.rand(500, 5000); pay(fee); addFans(x, g); song.streams += Math.round(g * 40); x.streams += Math.round(g * 40); (x.syncs = x.syncs || []).push('"' + song.title + '" in ' + where); return good('"' + song.title + '" played in ' + where + '. Shazam lit up. +' + big(g) + ' fans. 📺'); } },
      { label: 'Say no, it\'s not for sale', run: function () { E.karma(1); return 'I turned it down. Some songs aren\'t for sale.'; } }
    ] };
  } });
  def('mu_opener', { cond: function () { var x = st(); return !!(x && !x.retired); }, build: function () {
    var x = st(), star = U.pick(x.genre === 'Hip Hop' ? ['the biggest rapper in the world', 'a hip hop legend'] : x.genre === 'Country' ? ['a country superstar', 'a Nashville legend'] : x.genre === 'EDM' ? ['a world-famous DJ', 'a festival-headlining DJ'] : x.genre === 'Rock' ? ['a stadium rock band', 'a legendary rock band'] : ['a pop superstar', 'a global superstar']);
    return { icon: '🚌', title: 'Opening slot', text: U.cap(star) + ' asked me to open their arena tour this year. The pay is small, but every night is a room full of new ears.', choices: [
      { label: 'Join the tour', run: function () {
        if (count('mu_tour')) return 'I was already booked on my own tour, so I had to pass.';
        bump('mu_tour'); x.lastActive = S().year;
        var crowd = U.rand(3e5, 1.2e6), r = U.rand(1, 100) + (ca(x, 'sta') - 50) / 3;
        var g = crowd * U.randf(0.004, r >= 80 ? 0.03 : 0.015) / (1 + x.fans / 5e6);
        addFans(x, g); shift(x, 'sta', 0.8); grow(x, 0.8); pay(U.rand(20, 120) * 1000); E.stat('health', -6); E.stat('happy', 8);
        (x.opened = x.opened || []).push(star + ' (' + S().year + ')');
        return good('I opened for ' + star + ' in front of ' + big(crowd) + ' people' + (r >= 80 ? ' and stole a few shows' : '') + '. +' + big(g) + ' fans. 🚌');
      } },
      { label: 'Focus on my own music', run: function () { return 'I passed on the tour to focus on my own music.'; } }
    ] };
  } });
  def('mu_label_done', { build: function () {
    var x = st();
    if (!x || !x.label) return null;
    return { icon: '📝', title: 'Contract complete', text: 'I\'ve delivered every album I owed ' + x.label.name + '.', choices: [
      { label: 'Re-sign for 2 more albums', run: function () { x.label.owed = 2; var adv = Math.round(x.fans * 0.1 + 50000); pay(adv); return good('I re-signed with ' + x.label.name + ' for ' + E.fmt(E.$(adv)) + '.'); } },
      { label: 'Go independent', run: function () { var n = x.label.name; x.label = null; return 'My deal with ' + n + ' is done. I\'m independent and I own my next masters.'; } }
    ] };
  } });

  function summary() { var x = S().music; return x ? x.name + ' · ' + big(x.fans) + ' fans' : 'Write songs, play shows, get signed'; }
  function aboutRow() { var x = S().music; if (!x || !x.released) return null; return ['🎵 Music', '"' + x.name + '" · ' + title() + ' · ' + big(x.fans) + ' fans' + (x.wins ? ' · ' + U.plural(x.wins, 'Grammy') : '')]; }
  return { menu: menu, year: year, yearly: yearly, title: title, summary: summary, aboutRow: aboutRow, onAward: onAward, st: st, migrate: migrate };
})();
