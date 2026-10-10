/* TheLife — v1.94: dating celebrities. Once I'm famous (or rich, or in a
 * famous line of work), the exclusive side of dating opens up: movie stars,
 * pop stars, basketball and football stars, supermodels, tennis champions.
 * They're invented people who fit the era. Dating one puts me in the
 * tabloids: more fame, paparazzi, red carpets and rumors.
 * State: a celebrity person carries p.celeb = { kind, icon, fame }. */
TL.celebs = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function done(r) { return TL.actions.done(r); }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }

  // kind, icon, job title (by gender), first year, who (M/F/any), industry
  var KINDS = [
    { k: 'movie', icon: '🎬', job: function (g, y) { return y < 1960 ? 'Film Star' : 'Movie Star'; }, from: 1915, ind: 'acting' },
    { k: 'tv', icon: '📺', job: function () { return 'TV Star'; }, from: 1955, ind: 'acting' },
    { k: 'pop', icon: '🎤', job: function (g, y) { return y < 1955 ? 'Jazz Singer' : y < 1975 ? 'Rock Star' : 'Pop Star'; }, from: 1925, ind: 'music' },
    { k: 'rap', icon: '🎧', job: function () { return 'Rapper'; }, from: 1985, ind: 'music' },
    { k: 'nba', icon: '🏀', job: function (g) { return g === 'F' ? 'WNBA Star' : 'NBA Star'; }, from: 1950, ind: 'hoops', ok: function (g, y) { return g === 'M' || y >= 1997; } },
    { k: 'nfl', icon: '🏈', job: function () { return 'NFL Star'; }, from: 1950, ind: 'sports', ok: function (g) { return g === 'M'; } },
    { k: 'soccer', icon: '⚽', job: function () { return 'Soccer Star'; }, from: 1930, ind: 'sports', ok: function (g, y) { return g === 'M' || y >= 1995; } },
    { k: 'tennis', icon: '🎾', job: function () { return 'Tennis Champion'; }, from: 1925, ind: 'sports' },
    { k: 'model', icon: '📸', job: function () { return 'Supermodel'; }, from: 1965, ind: 'model' },
    { k: 'reality', icon: '🌴', job: function () { return 'Reality TV Star'; }, from: 2002, ind: 'creator' },
    { k: 'influencer', icon: '📱', job: function () { return 'Influencer'; }, from: 2012, ind: 'creator' },
    { k: 'tech', icon: '💻', job: function () { return 'Tech Billionaire'; }, from: 1985, ind: 'business' }
  ];
  function kind(k) { return KINDS.filter(function (x) { return x.k === k; })[0]; }

  function available() { return !!(S() && me() && S().year >= 1915 && !(E.ancient && E.ancient()) && (!TL.ancient || !TL.ancient.on())); }
  // What industry am I in, if any (a star dates a star more easily).
  function myIndustry() {
    var s = S(), j = s.job || {};
    if (j.acting || s.acting) return 'acting';
    if (j.music || s.music) return 'music';
    if (j.hoops) return 'hoops';
    if (j.pro) return 'sports';
    if (s.creator && s.creator.subs > 100000) return 'creator';
    return null;
  }
  // The famous side of dating opens with fame, serious money or a famous job.
  function unlocked() {
    var s = S();
    return s.fame >= 30 || s.money >= E.$(5e6) || !!myIndustry();
  }
  function lockReason() { return 'Get famous first (fame 30+), get rich, or work in entertainment or sports'; }

  function make(forceKind) {
    var m = me(), y = S().year;
    var g = m.interest === 'A' || !m.interest ? (U.chance(0.5) ? 'M' : 'F') : m.interest;
    var pool = KINDS.filter(function (x) { return y >= x.from && (!x.ok || x.ok(g, y)); });
    if (!pool.length) return null; // before the age of celebrity
    var kd = forceKind ? kind(forceKind) || U.pick(pool) : U.pick(pool);
    var age = U.clamp(m.age + U.rand(-6, 6), 19, 75);
    if (kd.k === 'nba' || kd.k === 'nfl' || kd.k === 'soccer' || kd.k === 'tennis') age = U.clamp(age, 20, 37);
    if (kd.k === 'model' || kd.k === 'influencer') age = U.clamp(age, 19, 45);
    var c = E.makePerson({ gender: g, age: age, role: 'partner', job: kd.job(g, y), money: E.$(U.rand(3, 120) * 1e6) });
    c.looks = U.clamp(Math.round(U.gauss(kd.k === 'model' ? 92 : 80, 7)), 60, 100);
    c.celeb = { kind: kd.k, icon: kd.icon, fame: U.rand(55, 97) };
    // Fame does things to people.
    if (U.chance(0.45)) { var t = U.pick(['Ambitious', 'Jealous', 'Moody', 'Outgoing', 'Greedy'].filter(function (x) { return c.traits.indexOf(x) < 0; })); if (t) c.traits[0] = t; }
    return c;
  }

  // My odds with a star: fame and looks against theirs, plus a few edges.
  function odds(c, party) {
    var m = me(), s = S(), kd = kind(c.celeb.kind);
    var p = 0.08 + s.fame / 250 + (m.looks - 60) / 300 - (c.celeb.fame - 55) / 250 + (TL.talents && TL.talents.has('charm') ? 0.08 : 0)
      + (myIndustry() && myIndustry() === kd.ind ? 0.1 : 0) + (s.money >= E.$(1e7) ? 0.05 : 0) + (party ? 0.12 : 0);
    return U.clamp(p, 0.03, 0.8);
  }
  function oddsWord(p) { return p >= 0.5 ? 'Good chance' : p >= 0.3 ? 'Decent chance' : p >= 0.15 ? 'Long shot' : 'Very long shot'; }

  function startDating(c, how) {
    var pt = E.partner();
    c.id = U.uid(); c.rel = U.rand(55, 75); c.since = me().age;
    if (pt) { c.role = 'friend'; S().people.push(c); return done(good('We hit it off, but I\'m taken. ' + c.first + ' and I are friends now. 🤫')); }
    c.role = 'partner'; S().people.push(c); S().counts.dates++;
    E.stat('happy', 12); E.fame(4);
    E.log(c.celeb.icon + ' I\'m dating ' + c.first + ' ' + c.last + ', the ' + c.job.toLowerCase() + '! The internet is losing it.', 'good');
    return done(good(how + ' ' + c.first + ' ' + c.last + ' and I are officially dating! ' + c.celeb.icon + '💕'));
  }

  function menu() {
    if (!unlocked()) return done(TL.actions.nope ? TL.actions.nope(lockReason() + '.') : lockReason() + '.');
    var ya = S().yearActs, list = ya.celebs;
    if (!list) { list = ya.celebs = []; for (var i = 0; i < 3; i++) { var mk = make(); if (mk) list.push(mk); } }
    ui().menu('Celebrity dating ⭐', function () {
      var items = [{ info: true, html: '<p class="muted">An invite-only dating app for famous people. My fame and looks against theirs decide it; working in the same industry helps. New faces every year.</p>' }];
      if (E.partner()) items.push({ info: true, html: '<p class="small muted">I\'m in a relationship, so anything here stays friendly.</p>' });
      ya.celebs.forEach(function (c) {
        var p = odds(c);
        items.push({ icon: c.celeb.icon, label: c.first + ' ' + c.last + ', ' + c.age, sub: c.job + ' · Fame ' + c.celeb.fame + ' · Looks ' + c.looks + '% · ' + c.traits.join(', ') + (c.tried ? '' : ' · ' + oddsWord(p)),
          right: c.tried ? (c.won ? '💕' : '✖') : '👉', disabled: !!c.tried, onClick: function () { approach(c); } });
      });
      return items;
    });
  }
  function approach(c) {
    var party = E.$(20000);
    ui().choose(c.celeb.icon + ' ' + c.first + ' ' + c.last, c.first + ' is ' + E.an(c.job.toLowerCase()) + ' with ' + c.traits.join(' and ').toLowerCase() + ' energy. How do I make my move?', [
      { label: '💬 Slide into their DMs (' + oddsWord(odds(c)).toLowerCase() + ')', fn: function () { tryIt(c, false); } },
      { label: '🥂 Get introduced at an exclusive party (' + E.fmt(party) + ')', fn: function () { if (S().money < party) return done(bad('I can\'t afford the party circuit right now.')); E.addMoney(-party); tryIt(c, true); } }
    ]);
  }
  function tryIt(c, party) {
    c.tried = true;
    if (U.chance(odds(c, party))) { c.won = true; return startDating(c, party ? 'We talked all night at the party.' : c.first + ' slid back into my DMs.'); }
    E.stat('happy', -3);
    return done(U.pick(party ? [c.first + ' was polite, then disappeared with their entourage.', c.first + '\'s publicist steered them away from me all night.'] : ['Left on read by ' + c.first + '. 💀', c.first + ' never answered. Their team probably filters DMs.', c.first + ' replied with a single 👍. That\'s a no.']));
  }

  // ---- meeting real stars. Real people only ever appear as moments (a selfie,
  // a chat, a shoutout), never as someone in my life I could date, insult or sue.
  // [name, first year, last year active] (a star who has died stops appearing).
  // [name, first year, last year active, genre]
  var MUSIC = [['Billie Holiday', 1935, 1959, 'Jazz'], ['Ella Fitzgerald', 1935, 1990, 'Jazz'], ['Louis Armstrong', 1925, 1971, 'Jazz'], ['Duke Ellington', 1925, 1974, 'Jazz'], ['Frank Sinatra', 1940, 1990, 'Pop'], ['Miles Davis', 1949, 1991, 'Jazz'], ['Elvis Presley', 1956, 1977, 'Rock'], ['Johnny Cash', 1955, 2003, 'Country'], ['Ray Charles', 1955, 2004, 'R&B'], ['Aretha Franklin', 1961, 2017, 'R&B'], ['Paul McCartney', 1962, 2030, 'Rock'], ['Bob Dylan', 1962, 2030, 'Indie'], ['Mick Jagger', 1963, 2030, 'Rock'], ['Stevie Wonder', 1963, 2030, 'R&B'], ['Diana Ross', 1964, 2020, 'R&B'], ['Dolly Parton', 1967, 2035, 'Country'], ['Elton John', 1970, 2025, 'Pop'], ['Willie Nelson', 1970, 2030, 'Country'], ['Michael Jackson', 1971, 2009, 'Pop'], ['Bruce Springsteen', 1973, 2030, 'Rock'], ['Prince', 1979, 2016, 'R&B'], ['Madonna', 1983, 2030, 'Pop'], ['Whitney Houston', 1985, 2012, 'R&B'], ['Gloria Estefan', 1985, 2020, 'Latin'], ['Mariah Carey', 1990, 2035, 'R&B'], ['Celine Dion', 1990, 2030, 'Pop'], ['Garth Brooks', 1989, 2030, 'Country'], ['Tupac Shakur', 1991, 1996, 'Hip Hop'], ['Dr. Dre', 1992, 2030, 'Hip Hop'], ['Thom Yorke', 1993, 2030, 'Indie'], ['Jay-Z', 1996, 2035, 'Hip Hop'], ['Usher', 1997, 2035, 'R&B'], ['Beyoncé', 1998, 2040, 'R&B'], ['Britney Spears', 1998, 2016, 'Pop'], ['Shakira', 1998, 2035, 'Latin'], ['Ricky Martin', 1998, 2030, 'Latin'], ['Eminem', 1999, 2035, 'Hip Hop'], ['Avicii', 2011, 2018, 'EDM'], ['Travis Scott', 2015, 2040, 'Hip Hop'], ['Rihanna', 2005, 2035, 'Pop'], ['Taylor Swift', 2006, 2045, 'Pop'], ['Adele', 2008, 2040, 'Pop'], ['Lady Gaga', 2008, 2045, 'Pop'], ['Drake', 2009, 2040, 'Hip Hop'], ['David Guetta', 2009, 2035, 'EDM'], ['Calvin Harris', 2009, 2035, 'EDM'], ['Bruno Mars', 2010, 2040, 'Pop'], ['Skrillex', 2011, 2035, 'EDM'], ['Ed Sheeran', 2011, 2040, 'Pop'], ['Kendrick Lamar', 2011, 2045, 'Hip Hop'], ['Lana Del Rey', 2012, 2040, 'Indie'], ['Ariana Grande', 2013, 2045, 'Pop'], ['Luke Combs', 2017, 2045, 'Country'], ['SZA', 2017, 2045, 'R&B'], ['Phoebe Bridgers', 2017, 2045, 'Indie'], ['Bad Bunny', 2018, 2045, 'Latin'], ['Karol G', 2018, 2045, 'Latin'], ['Billie Eilish', 2019, 2050, 'Pop'], ['Marshmello', 2016, 2045, 'EDM'], ['Olivia Rodrigo', 2021, 2050, 'Pop'], ['Morgan Wallen', 2020, 2045, 'Country']];
  var SPORT = [['Babe Ruth', 1920, 1935], ['Jackie Robinson', 1947, 1956], ['Pelé', 1957, 1977], ['Muhammad Ali', 1960, 1981], ['Billie Jean King', 1966, 1983], ['Wayne Gretzky', 1979, 1999], ['Tiger Woods', 1996, 2020], ['Venus Williams', 1997, 2020], ['Serena Williams', 1998, 2022], ['Tom Brady', 2000, 2022], ['Cristiano Ronaldo', 2003, 2028], ['Lionel Messi', 2005, 2030], ['Megan Rapinoe', 2006, 2023], ['Usain Bolt', 2008, 2017], ['Simone Biles', 2013, 2024], ['Patrick Mahomes', 2018, 2035], ['Shohei Ohtani', 2018, 2035]];
  function active(list, y) { return list.filter(function (q) { return y >= q[1] && y <= q[2]; }).map(function (q) { return q[0]; }); }
  // A real star who fits the year (and my line of work, when I have one).
  function realStar(prefer) {
    var y = S().year, out = [];
    var actors = TL.acting && TL.acting.COSTARS ? TL.acting.COSTARS.filter(function (q) { return y >= q[2] && y <= q[3]; }).map(function (q) { return q[0]; }) : [];
    var hoops = [];
    if (TL.nba) ['M', 'F'].forEach(function (g) { try { var n = TL.nba.anyStar(g, y); if (n) hoops.push([n, g === 'F' ? 'WNBA star' : 'NBA star']); } catch (e) { } });
    actors.forEach(function (n) { out.push([n, 'actor', 'acting']); });
    active(MUSIC, y).forEach(function (n) { out.push([n, 'singer', 'music']); });
    active(SPORT, y).forEach(function (n) { out.push([n, 'athlete', 'sports']); });
    hoops.forEach(function (h) { out.push([h[0], h[1], 'hoops']); });
    var mine = me().first + ' ' + me().last, seen = (S().metStars || []).map(function (m) { return m.name; });
    out = out.filter(function (q) { return q[0] !== mine && seen.indexOf(q[0]) < 0; });
    if (!out.length) return null;
    var fav = out.filter(function (q) { return q[2] === prefer; });
    return U.pick(fav.length && U.chance(0.7) ? fav : out);
  }
  // A real musician to collaborate with: same genre when possible, active this year.
  function realMusician(genre, not) {
    var y = S().year, mine = me().first + ' ' + me().last;
    var live = MUSIC.filter(function (q) { return y >= q[1] && y <= q[2] && q[0] !== mine && (not || []).indexOf(q[0]) < 0; });
    var same = live.filter(function (q) { return q[3] === genre; });
    var pick = same.length && U.chance(0.85) ? same : live;
    return pick.length ? U.pick(pick)[0] : null;
  }
  var KIND_WORD = { actor: 'the actor', singer: 'the singer', athlete: 'the sports legend', 'NBA star': 'the NBA star', 'WNBA star': 'the WNBA star' };
  function where(ind) {
    var y = S().year;
    var big = { acting: ['the Oscars after-party', 'a movie premiere', 'a table read', 'the Golden Globes'], music: ['the Grammys', 'a studio session', 'a music festival backstage', 'an album release party'], hoops: ['the All-Star Game', 'a charity game', 'a summer pro-am'], sports: ['the ESPYs', 'a charity golf event', 'a sneaker launch'] }[ind];
    var any = ['the airport', 'a coffee shop', 'a restaurant in ' + (y < 1960 ? 'Hollywood' : 'Beverly Hills'), 'a charity gala', 'a hotel lobby'];
    return U.pick(big && U.chance(0.7) ? big : any);
  }
  def('celeb_meet', { build: function (d) {
    var r = d && d.name ? [d.name, d.kind, d.ind] : realStar(myIndustry());
    if (!r) return null;
    var at = d && d.at || where(myIndustry()), s = S(), famous = s.fame >= 60;
    var log = function (how) { (s.metStars = s.metStars || []).push({ name: r[0], kind: r[1], year: s.year, how: how }); };
    var selfie = y0() >= 2008 ? 'Ask for a selfie' : y0() >= 1950 ? 'Ask for a photo' : 'Ask for an autograph';
    return { icon: '🤳', title: 'Star sighting', text: 'I ran into ' + (KIND_WORD[r[1]] || '') + ' ' + r[0] + ' at ' + at + '.', choices: [
      { label: selfie, run: function () { log(selfie.replace(/^Ask for an? /, '').toLowerCase()); E.stat('happy', 6); if (y0() >= 2008) s.followers = (s.followers || 0) + U.rand(20, 400); return good(r[0] + ' was so nice about it. ' + (y0() >= 2008 ? 'My post blew up. 📸' : 'I\'m framing it. ✍️')); } },
      { label: famous ? 'Say hi as a peer' : 'Chat for a minute', run: function () { log('chatted'); E.stat('happy', 5); if (famous) { E.fame(2); return good(r[0] + ' said they\'re a fan of my work! We talked for twenty minutes. 🤯'); } return 'We talked for a minute. ' + r[0] + ' was kind, and a little in a hurry.'; } },
      { label: 'Play it cool and let them be', run: function () { E.karma(1); return 'I gave ' + r[0] + ' some space. Still, what a story.'; } }
    ] };
  } });
  function y0() { return S().year; }
  function starsMenu() {
    ui().menu('Stars I\'ve met 🤳', function () {
      var list = (S().metStars || []).slice().reverse();
      if (!list.length) return [{ info: true, html: '<p class="muted">No star sightings yet. Fame, a famous job or just luck brings them.</p>' }];
      return list.map(function (m) { return { icon: m.kind === 'singer' ? '🎤' : m.kind === 'actor' ? '🎬' : /NBA/.test(m.kind) ? '🏀' : '🏅', label: m.name, sub: U.cap(m.kind) + ' · ' + m.year + ' · ' + m.how }; });
    });
  }

  // ---- life with a famous partner
  function famous() { var p = E.partner && E.partner(); return p && p.celeb && p.alive ? p : null; }
  function yearly() {
    if (!available()) return;
    var s = S(), p = famous();
    if (p) {
      E.fame(U.rand(1, 3));
      if (U.chance(0.5)) s.pending.push({ id: U.pick(['celeb_paps', 'celeb_carpet', 'celeb_rumor']), data: { pid: p.id } });
    }
    // Famous and single: a star may make the first move.
    else if (!E.partner() && me().age >= 18 && s.fame >= 50 && U.chance(0.12)) s.pending.push({ id: 'celeb_dm', data: {} });
    // Real stars cross my path: often if I'm famous or in the business, now and then for anyone.
    var a = me().age, ch = a < 10 ? 0 : s.fame >= 50 || myIndustry() ? 0.3 : s.fame >= 20 ? 0.12 : 0.03;
    if (!s.prison && U.chance(ch)) s.pending.push({ id: 'celeb_meet', data: {} });
  }

  var defs = TL.events.defs;
  function def(id, o) { o.id = id; o.scripted = true; o.w = 10; TL.events.defs[id] = o; }
  function who(d) { var p = d && d.pid ? E.person(d.pid) : null; return p && p.alive && p.celeb ? p : null; }
  def('celeb_paps', { build: function (d) {
    var p = who(d); if (!p) return null;
    return { icon: '📸', title: 'Paparazzi', text: 'Photographers swarmed ' + p.first + ' and me outside ' + U.pick(['a sushi restaurant', 'the airport', 'a club', 'the gym', 'a farmers market']) + '.', choices: [
      { label: 'Smile and wave', run: function () { E.fame(2); E.rel(p, 3); return good('We gave them the shot. Our photo was everywhere by morning. 📸'); } },
      { label: 'Shove a camera away', run: function () { E.fame(4); E.karma(-3); E.addMoney(-E.$(15000)); return bad('The video went viral. I paid ' + E.fmt(E.$(15000)) + ' to settle with the photographer.'); } },
      { label: 'Duck out the back', run: function () { E.rel(p, 6); return p.first + ' loved that I protect our privacy. 🤫'; } }
    ] };
  } });
  def('celeb_carpet', { build: function (d) {
    var p = who(d); if (!p) return null;
    var k = p.celeb.kind, ev = { movie: 'the premiere of their new movie', tv: 'the Emmys', pop: 'the Grammys', rap: 'the Grammys', nba: 'the All-Star Game', nfl: 'the Super Bowl', soccer: 'the championship final', tennis: 'the Wimbledon final', model: 'the Met Gala', reality: 'the reunion taping', influencer: 'a brand launch in Paris', tech: 'a product launch' }[k] || 'a gala';
    var outfit = E.$(U.rand(3, 15) * 1000);
    return { icon: '✨', title: 'Red carpet', text: p.first + ' wants me there for ' + ev + '.', choices: [
      { label: 'Go all out (' + E.fmt(outfit) + ' outfit)', run: function () { E.addMoney(-outfit); E.fame(3); E.stat('happy', 8); E.rel(p, 8); return good('We stole the red carpet. Best-dressed lists, everywhere. ✨'); } },
      { label: 'Go, keep it low-key', run: function () { E.fame(1); E.stat('happy', 4); E.rel(p, 4); return 'We had a great night, mostly away from the cameras.'; } },
      { label: 'Skip it', run: function () { E.rel(p, -8); return bad(p.first + ' went alone. The tabloids noticed I wasn\'t there.'); } }
    ] };
  } });
  def('celeb_rumor', { build: function (d) {
    var p = who(d); if (!p) return null;
    var truth = U.chance((p.traits || []).indexOf('Loyal') >= 0 ? 0.08 : 0.28);
    return { icon: '🗞️', title: 'Tabloid rumor', text: 'A tabloid says ' + p.first + ' was spotted getting close with ' + U.pick(['a co-star', 'a backup dancer', 'a teammate\'s ex', 'a model', 'their personal trainer']) + '.', choices: [
      { label: 'Trust ' + p.first, run: function () {
        if (truth && U.chance(0.5)) { E.stat('happy', -15); E.rel(p, -40); return bad('It was true. I found out the hard way, months later. 💔'); }
        E.rel(p, 8); return good('It was nothing. ' + p.first + ' appreciated that I didn\'t believe the gossip.');
      } },
      { label: 'Confront them', run: function () {
        if (truth) { E.stat('happy', -12); p.role = 'ex'; S().counts.exes++; E.fame(3); return bad(p.first + ' admitted it. We broke up, and it was a headline for a week. 💔'); }
        E.rel(p, -10); return bad(p.first + ' was hurt I believed a tabloid over them.');
      } },
      { label: 'Post a cryptic quote', run: function () { E.fame(2); E.rel(p, -4); return 'My cryptic post got a million likes and made everything weirder. 🙃'; } }
    ] };
  } });
  def('celeb_dm', { build: function () {
    if (E.partner()) return null;
    var c = make(); if (!c) return null;
    return { icon: c.celeb.icon, title: 'A famous DM', text: c.first + ' ' + c.last + ' (' + c.job.toLowerCase() + ', fame ' + c.celeb.fame + ') slid into my DMs.', choices: [
      { label: 'Ask them out', run: function () { c.id = U.uid(); c.rel = U.rand(60, 78); c.role = 'partner'; c.since = me().age; S().people.push(c); S().counts.dates++; E.stat('happy', 12); E.fame(4); return good('First date: a private dinner on a rooftop. ' + c.first + ' and I are dating! ' + c.celeb.icon + '💕'); } },
      { label: 'Leave them on read', run: function () { E.fame(1); return 'I left ' + c.first + ' on read. Power move. 😎'; } }
    ] };
  } });

  return { realMusician: realMusician, starsMenu: starsMenu, realStar: realStar, available: available, unlocked: unlocked, lockReason: lockReason, menu: menu, yearly: yearly, make: make, odds: odds };
})();
