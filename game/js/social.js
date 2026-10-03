/* TheLife — social.js
 * Social media, in depth. Real platforms by era (MySpace, Facebook, Twitter
 * then X, Instagram, Snapchat, TikTok), each with its own followers and
 * audience; a niche; post types that suit each platform; the year's real
 * viral trend; a feed of my posts with likes and comments; brand deals
 * (negotiable, multi-year ambassador contracts, sketchy sponsors that can
 * come back to bite); DMs (collabs, scams, fans, celebrities, haters);
 * cancel-culture drama; analytics; fake followers; breaks and doomscrolling.
 * State: S().social { platform, acc{id:{f,yr,posts,ver,joined}}, niche, feed[], hist[], deals, amb, fake, ... }.
 * S().followers stays the total across platforms (other modules add to it;
 * the difference flows into my main account).
 */
TL.social = (function () {
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
  function big(n) { n = Math.round(n); return n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B' : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e4 ? Math.round(n / 1e3) + 'K' : n >= 1e3 ? (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K' : String(n); }

  // ------------------------------------------------------------ platforms
  // [id, name, icon, from, until, what it rewards]
  var PLATS = [
    ['myspace', 'MySpace', '🎸', 2003, 2010, 'music and top-8 drama'],
    ['fb', 'Facebook', '👍', 2004, 9999, 'family, friends and long life updates'],
    ['tw', 'Twitter', '🐦', 2006, 9999, 'hot takes, jokes and news'],
    ['ig', 'Instagram', '📸', 2010, 9999, 'looks, food, travel and aesthetics'],
    ['snap', 'Snapchat', '👻', 2011, 9999, 'friends, streaks and stories'],
    ['tt', 'TikTok', '🎵', 2017, 9999, 'trends, dances, skits and the algorithm']
  ];
  function plat(id) { return PLATS.filter(function (p) { return p[0] === id; })[0]; }
  function pname(id, y) { y = y || S().year; return id === 'tw' && y >= 2023 ? 'X' : plat(id)[1]; }
  function picon(id, y) { y = y || S().year; return id === 'tw' && y >= 2023 ? '𝕏' : plat(id)[2]; }
  function live(id, y) { var p = plat(id); y = y || S().year; return y >= p[3] && y <= p[4]; }
  var NICHES = [['Lifestyle', '✨'], ['Comedy', '😂'], ['Fitness', '💪'], ['Fashion', '👗'], ['Food', '🍜'], ['Travel', '✈️'], ['Gaming', '🎮'], ['Music', '🎶'], ['Sports', '🏅'], ['Beauty', '💄'], ['Politics', '🗳️'], ['Tech', '💻']];
  var TIERS = [[0, 'Regular user'], [1000, 'Nano influencer'], [10000, 'Micro influencer'], [100000, 'Mid-tier influencer'], [500000, 'Macro influencer'], [1e6, 'Mega influencer'], [1e7, 'Internet celebrity']];
  function tier(f) { var t = TIERS[0][1]; TIERS.forEach(function (q) { if (f >= q[0]) t = q[1]; }); return t; }
  // The year's real viral trend.
  var TRENDS = { 2007: 'Chocolate Rain covers', 2008: 'Rickrolling', 2009: 'the Single Ladies dance', 2010: 'Double Rainbow reactions', 2011: 'planking', 2012: 'the Gangnam Style dance', 2013: 'the Harlem Shake', 2014: 'the Ice Bucket Challenge', 2015: 'the dress (blue or gold?)', 2016: 'the Mannequin Challenge', 2017: 'fidget spinner tricks', 2018: 'the In My Feelings challenge', 2019: 'the bottle cap challenge', 2020: 'whipped coffee and sourdough', 2021: 'Squid Game challenges', 2022: 'the Wednesday dance', 2023: '"How often do you think about the Roman Empire?"', 2024: 'brat summer and "very demure"', 2025: 'the "6-7" meme' };
  var FAKE_TRENDS = ['a dance to a sped-up throwback', 'the AI twin challenge', 'a 5-second recipe hack', 'POV skits about first jobs', 'the silent vlog trend', 'a lip-sync to a movie quote', 'the photo-dump challenge'];
  function trend() { var s = S(), c = st(); if (!c.trend || c.trend.y !== s.year) c.trend = { y: s.year, t: TRENDS[s.year] || (s.year > 2025 ? U.pick(FAKE_TRENDS) : null) }; return c.trend.t; }

  // ------------------------------------------------------------ state
  function st() {
    var s = S(), c = s.social || (s.social = { platform: false });
    if (!c.acc) {
      c.acc = {}; c.feed = []; c.hist = [];
      // Older saves: one generic account becomes an account on the best platform of the day.
      if (c.platform) { var p = best(); if (p) c.acc[p] = { f: s.followers || 0, yr: 0, posts: 0, joined: s.year }; }
    }
    return c;
  }
  function best() { var y = S().year; var l = ['tt', 'ig', 'tw', 'fb', 'myspace'].filter(function (id) { return live(id, y); }); return l[0] || null; }
  function accounts() { var c = st(); return Object.keys(c.acc).filter(function (id) { return c.acc[id]; }); }
  function main() { var c = st(); return accounts().sort(function (a, b) { return c.acc[b].f - c.acc[a].f; })[0]; }
  function total() { var c = st(); return accounts().reduce(function (t, id) { return t + c.acc[id].f; }, 0); }
  // Other parts of the game add to S().followers; that growth lands on my main account.
  function sync() {
    var s = S(), c = st(), ids = accounts();
    // Something else switched social media on (a basketball career, a viral moment): open the account.
    if (!ids.length && c.platform && best()) { c.acc[best()] = { f: s.followers || 0, yr: 0, posts: 0, joined: s.year }; ids = accounts(); }
    if (!ids.length) return;
    c.platform = true;
    var diff = (s.followers || 0) - total(), m = main();
    if (diff && m) c.acc[m].f = Math.max(0, c.acc[m].f + diff);
    s.followers = total();
    ids.forEach(function (id) { var a = c.acc[id]; if (!a.ver && a.f >= 100000 && (id !== 'tw' || S().year < 2023)) { a.ver = S().year; } });
    if (s.followers >= 1e6) E.achieve('influencer');
  }
  function handle() { var m = me(), c = st(); return c.handle || (c.handle = '@' + (m.first + m.last).toLowerCase().replace(/[^a-z0-9]/g, '') + (U.chance(0.5) ? U.rand(1, 99) : '')); }
  // Real engagement falls as accounts grow; bought followers drag it down.
  function engagement() { var c = st(), f = Math.max(1, total()); return U.clamp(0.09 / Math.pow(f, 0.12) * 4 * (1 - Math.min(0.8, (c.fake || 0) / f)) * (c.drama && S().year - c.drama < 2 ? 0.7 : 1), 0.004, 0.25); }
  function feed(p) { var c = st(); c.feed.push(p); if (c.feed.length > 30) c.feed.shift(); }

  // ------------------------------------------------------------ posting
  // [key, icon, label, stat, platforms it suits, niches it suits, risk]
  var POSTS = [
    ['selfie', '🤳', 'Post a selfie', 'looks', ['ig', 'snap', 'fb', 'myspace'], ['Fashion', 'Beauty', 'Lifestyle'], 0],
    ['meme', '😂', 'Post a meme', 'smarts', ['tw', 'ig', 'tt', 'fb'], ['Comedy', 'Gaming'], 0],
    ['take', '🗣️', 'Post a hot take', 'smarts', ['tw', 'fb'], ['Politics', 'Sports', 'Tech'], 0.22],
    ['thread', '🧵', 'Write a thread', 'smarts', ['tw'], ['Tech', 'Politics', 'Sports'], 0.05],
    ['food', '🍜', 'Post a food pic', null, ['ig', 'snap'], ['Food', 'Travel', 'Lifestyle'], 0],
    ['workout', '💪', 'Post a workout video', 'athl', ['ig', 'tt'], ['Fitness', 'Sports'], 0],
    ['dance', '🕺', 'Post a dance video', 'looks', ['tt', 'ig'], ['Music', 'Comedy', 'Lifestyle'], 0],
    ['skit', '🎭', 'Film a comedy skit', 'smarts', ['tt', 'ig'], ['Comedy'], 0.04],
    ['vlog', '📹', 'Post a day-in-my-life vlog', null, ['tt', 'ig'], ['Lifestyle', 'Travel', 'Fitness'], 0],
    ['update', '📝', 'Post a big life update', null, ['fb', 'ig'], ['Lifestyle'], 0],
    ['thirst', '🔥', 'Post a thirst trap', 'looks', ['ig', 'tt'], ['Fashion', 'Fitness', 'Beauty'], 0.06],
    ['song', '🎸', 'Post a song I made', 'smarts', ['myspace', 'tt', 'ig'], ['Music'], 0],
    ['story', '👻', 'Send a snap story', null, ['snap'], ['Lifestyle'], 0],
    ['live', '🎥', 'Go live', null, ['tt', 'ig', 'fb', 'tw'], [], 0.03]
  ];
  function postsFor(id) { return POSTS.filter(function (p) { return p[4].indexOf(id) >= 0; }); }
  var COMMENTS_GOOD = ['this is everything 😍', 'how are you so talented', 'okay but why is this so good', 'needed this today', 'core memory unlocked', 'the algorithm finally blessed me', 'saving this forever', 'obsessed 🔥'];
  var COMMENTS_MID = ['first', 'lol', 'mid but ok', 'ratio', 'didn\'t ask but ok', 'pov: you\'re reading comments'];
  var COMMENTS_BAD = ['unfollowing', 'this ain\'t it', 'delete this', 'cringe 💀', 'who asked?', 'touch grass'];
  function comment(score, id) { if (id === 'tt' && score >= 45 && U.chance(0.25)) return 'who else is here from the For You page?'; return score >= 70 ? U.pick(COMMENTS_GOOD) : score >= 45 ? U.pick(COMMENTS_MID) : U.pick(COMMENTS_BAD); }
  function post(id, p, onTrend) {
    var s = S(), c = st(), a = c.acc[id];
    if (c.breakY === s.year) return done(nope('I\'m on a social media break this year.'));
    if (count('sp_' + id) >= 3) return done(nope('I\'ve posted enough on ' + pname(id) + ' this year. Any more and people will mute me.'));
    bump('sp_' + id); a.yr++; a.posts++;
    var q = p[3] ? E.statValue(p[3]) : 50, fit = (c.niche && p[5].indexOf(c.niche) >= 0 ? 18 : 0) + (onTrend ? 22 : 0) + (id === 'tt' ? 6 : 0);
    var score = U.clamp(q * 0.55 + fit + U.rand(0, 40) + (s.fame || 0) / 6, 1, 100);
    var reach = a.f * engagement() * 1.6 + U.rand(3, 40) + (s.fame || 0) * 25;
    var viral = U.chance(0.02 + score / 1500 + (onTrend ? 0.05 : 0) + (id === 'tt' ? 0.03 : 0));
    var likes = Math.round(reach * (0.4 + score / 60) * (viral ? U.rand(15, 120) : 1));
    var gain = Math.round(likes * U.randf(0.04, 0.12) * (score >= 50 ? 1 : 0.3));
    var cancel = p[6] && U.chance(p[6] * ((s.karma || 50) < 35 ? 1.6 : 1));
    var label = onTrend ? 'Joined ' + trend() : U.cap(p[2].replace(/^(Post|Write|Film|Send|Go) /, '').replace(/^a |^an /, ''));
    var what = onTrend ? 'Joining ' + trend() : 'My ' + label.toLowerCase();
    if (cancel) {
      var lost = Math.round(a.f * U.randf(0.05, 0.2)); a.f -= lost; c.drama = s.year; E.stat('happy', -8); E.karma(-2);
      feed({ y: s.year, p: id, t: label, l: likes, c: U.pick(['this aged badly', 'ratio + you fell off', 'the screenshots are forever']), bad: 1 });
      sync(); return done(bad(what + ' on ' + pname(id) + ' blew up for all the wrong reasons. Lost ' + big(lost) + ' followers.'));
    }
    a.f += gain; if (p[0] === 'live' && a.f >= 5000) { var tips = E.$(Math.round(a.f * U.randf(0.002, 0.01))); E.addMoney(tips); }
    if (p[0] === 'story' || p[0] === 'update') TL.S.people.filter(function (q0) { return q0.alive && /friend|sibling|mother|father/.test(q0.role); }).slice(0, 4).forEach(function (q0) { E.rel(q0, 1); });
    if (viral) E.fame(U.rand(2, 6));
    E.stat('happy', score >= 60 ? 3 : score < 35 ? -2 : 1);
    feed({ y: s.year, p: id, t: label, l: likes, c: comment(score, id), v: viral ? 1 : 0 });
    sync();
    var msg = (viral ? '🚀 It went viral! ' : '') + what + ' on ' + pname(id) + ' got ' + big(likes) + ' likes and +' + big(gain) + ' followers. Top comment: "' + comment(score, id) + '"';
    if (p[0] === 'live' && tips) msg += ' Viewers tipped ' + E.fmt(tips) + '.';
    return done(viral || score >= 75 ? good(msg) : msg);
  }

  // ------------------------------------------------------------ brand deals
  var BRANDS = { Lifestyle: ['a meal-kit company', 'a mattress brand', 'a candle shop'], Comedy: ['a mobile game', 'a snack brand', 'a streaming service'], Fitness: ['a protein powder', 'a gym chain', 'a smartwatch'], Fashion: ['a fast-fashion app', 'a sunglasses brand', 'a sneaker brand'], Food: ['a hot sauce', 'a delivery app', 'a cookware brand'], Travel: ['a luggage brand', 'a hotel chain', 'an airline'], Gaming: ['an energy drink', 'a gaming chair', 'a headset brand'], Music: ['a headphone brand', 'a music app', 'a guitar maker'], Sports: ['a sports drink', 'a betting app', 'a sneaker brand'], Beauty: ['a skincare line', 'a makeup brand', 'a hair-care brand'], Politics: ['a news app', 'a podcast network', 'a VPN'], Tech: ['a VPN', 'a password manager', 'a phone maker'] };
  var SKETCHY = ['a crypto coin nobody has heard of', 'a "detox" tea', 'a get-rich-quick course', 'a shady dropshipping store'];
  function offers() {
    var s = S(), c = st(), f = total();
    if (c.offers && c.offers.y === s.year) return c.offers.l;
    var l = [], n = f >= 1e6 ? 3 : f >= 50000 ? 2 : f >= 5000 ? 1 : 0, pool = U.shuffle((BRANDS[c.niche] || BRANDS.Lifestyle).slice());
    for (var i = 0; i < n; i++) {
      var sk = U.chance(0.25), amb = !sk && f >= 300000 && U.chance(0.3);
      var pay = Math.round(f * U.randf(0.006, 0.02) * (c.niche && !sk ? 1.3 : 1) * (sk ? 1.8 : 1) * (amb ? 2.5 : 1) * (0.5 + engagement() * 10) / 100) * 100 + 200;
      l.push({ b: sk ? U.pick(SKETCHY) : pool[i % pool.length], pay: pay, sk: sk, amb: amb });
    }
    c.offers = { y: s.year, l: l };
    return l;
  }
  function takeDeal(o, how) {
    var s = S(), c = st();
    c.offers.l = c.offers.l.filter(function (q) { return q !== o; });
    var pay = o.pay;
    if (how === 'haggle') {
      if (U.chance(0.45 + engagement() * 2)) pay = Math.round(pay * U.randf(1.3, 1.8));
      else return done(bad(U.cap(o.b) + ' walked away from the table. Never mind.'));
    }
    if (o.amb) { c.amb = { b: o.b, pay: pay, until: s.year + 2 }; E.addMoney(E.$(pay)); feed({ y: s.year, p: main(), t: 'Ambassador for ' + o.b, l: Math.round(total() * engagement() * 8), c: 'congrats!! 👏' }); return done(good('I\'m now a brand ambassador for ' + o.b + ': ' + E.fmt(E.$(pay)) + ' a year for three years. 🤝')); }
    E.addMoney(E.$(pay));
    if (o.sk) c.sketchy = (c.sketchy || 0) + 1;
    feed({ y: s.year, p: main(), t: '#ad for ' + o.b, l: Math.round(total() * engagement() * 6), c: o.sk ? 'is this a scam?' : 'ok the ad was actually funny' });
    return done(good('I posted a sponsored post for ' + o.b + ' and earned ' + E.fmt(E.$(pay)) + '. 💰'));
  }

  // ------------------------------------------------------------ menus
  function menu() {
    if (TL.history && !TL.history.exists('social')) return done(nope(TL.history.notYet('social')));
    sync();
    ui().menu('Social media', function () {
      var s = S(), c = st(), ids = accounts(), items = [], f = total();
      if (!ids.length) {
        items.push({ info: true, html: '<div class="hb-arch">📱 No accounts yet</div><p class="small muted">Each platform has its own crowd. Pick where to start.</p>' });
        PLATS.filter(function (p) { return live(p[0]); }).forEach(function (p) { items.push({ icon: picon(p[0]), label: 'Join ' + pname(p[0]), sub: U.cap(p[5]), onClick: function () { join(p[0]); } }); });
        return items;
      }
      items.push({ info: true, html: '<div class="hb-arch">📱 ' + U.esc(handle()) + ' · ' + tier(f) + (c.niche ? ' · ' + c.niche : '') + '</div><p class="small muted"><b>' + big(f) + '</b> followers across ' + U.plural(ids.length, 'platform') + ' · ' + (engagement() * 100).toFixed(1) + '% engagement' + (c.amb && c.amb.until >= s.year ? ' · ambassador for ' + U.esc(c.amb.b) : '') + (c.breakY === s.year ? ' · on a break' : '') + (trend() ? '<br>🔥 Trending: ' + U.esc(trend()) : '') + '</p>' });
      ids.forEach(function (id) {
        var a = c.acc[id];
        items.push({ icon: picon(id), label: pname(id) + (a.ver ? ' ✔️' : ''), sub: big(a.f) + ' followers' + (live(id) ? ' · ' + U.plural(a.yr || 0, 'post') + ' this year' : ' · shut down'), onClick: function () { account(id); } });
      });
      var more = PLATS.filter(function (p) { return live(p[0]) && !c.acc[p[0]]; });
      if (more.length) items.push({ icon: '➕', label: 'Join another platform', sub: more.map(function (p) { return pname(p[0]); }).join(', '), onClick: function () { ui().choose('➕ Join a platform', 'Where next?', more.map(function (p) { return { label: picon(p[0]) + ' ' + pname(p[0]) + ': ' + p[5], fn: function () { join(p[0]); } }; })); } });
      items.push({ section: 'Grow' });
      items.push({ icon: '🎯', label: c.niche ? 'Change my niche' : 'Pick a niche', sub: c.niche ? 'Now: ' + c.niche + ' · brands pay more for a clear niche' : 'Focused accounts grow faster and get better deals', onClick: pickNiche });
      var ol = offers();
      items.push({ icon: '🤝', label: 'Brand deals', sub: ol.length ? U.plural(ol.length, 'offer') + ' this year' : f < 5000 ? 'Brands start calling around 5K followers' : 'No offers right now', disabled: !ol.length, onClick: deals });
      if (f >= 1000) items.push({ icon: '🤖', label: 'Buy followers', sub: 'Cheap, fast, and it shows', disabled: count('sp_buy') > 0, onClick: buy });
      if (c.acc.tw && s.year >= 2023 && !c.acc.tw.ver) items.push({ icon: '✔️', label: 'Buy a blue check on X', right: E.fmt(E.$(96)) + '/yr', onClick: function () { E.addMoney(-E.$(96)); c.acc.tw.ver = s.year; c.paidCheck = 1; done('I paid for a blue check. Some people respect it; most people roast it.'); } });
      items.push({ section: 'Me' });
      items.push({ icon: '📰', label: 'My feed', sub: c.feed.length ? U.plural(c.feed.length, 'recent post') : 'Nothing posted yet', onClick: feedView });
      items.push({ icon: '📊', label: 'Analytics', sub: 'Growth, engagement and best posts', onClick: analytics });
      items.push({ icon: '🌀', label: 'Doomscroll', sub: 'Lose an hour (or four)', disabled: count('sp_doom') > 0, onClick: doomscroll });
      items.push({ icon: '🧘', label: c.breakY === s.year ? 'On a break this year' : 'Take a social media break', sub: 'Better mood, slower growth', disabled: c.breakY === s.year, onClick: function () { c.breakY = s.year; E.stat('happy', 6); E.stat('health', 2); done(good('I logged off for the year. I slept better and read actual books. 🧘')); } });
      return items;
    });
  }
  function join(id) {
    var s = S(), c = st();
    if (c.acc[id]) return done(nope('I already have a ' + pname(id) + ' account.'));
    var start = U.rand(5, 60) + (s.fame || 0) * U.rand(50, 300) + Math.round(total() * U.randf(0.05, 0.2));
    c.acc[id] = { f: start, yr: 0, posts: 0, joined: s.year };
    s.followers = (s.followers || 0) + start; sync();
    return done('I joined ' + pname(id) + ' as ' + handle() + '. ' + big(start) + ' people followed me right away.');
  }
  function pickNiche() {
    var c = st();
    ui().choose('🎯 My niche', 'What is my account about? Posts that fit it do better, and brands pay more.', NICHES.map(function (n) { return { label: n[1] + ' ' + n[0], fn: function () { var was = c.niche; c.niche = n[0]; if (was && was !== n[0]) { var m = main(); if (m) c.acc[m].f = Math.round(c.acc[m].f * 0.92); sync(); return done('I rebranded from ' + was + ' to ' + n[0] + '. Some followers didn\'t come along.'); } done('My account is all about ' + n[0].toLowerCase() + ' now. ' + n[1]); } }; }));
  }
  function account(id) {
    var c = st();
    ui().menu(picon(id) + ' ' + pname(id), function () {
      var a = c.acc[id], items = [{ info: true, html: '<div class="hb-arch">' + picon(id) + ' ' + U.esc(handle()) + (a.ver ? ' ✔️' : '') + '</div><p class="small muted">' + big(a.f) + ' followers · ' + U.plural(a.posts, 'post') + ' · joined ' + a.joined + '<br>' + U.cap(plat(id)[5]) + '.</p>' }];
      if (!live(id)) { items.push({ info: true, html: '<p class="muted">' + pname(id) + ' is a ghost town now.</p>' }); }
      else {
        var t = trend();
        if (t && ['tt', 'ig', 'tw', 'snap'].indexOf(id) >= 0) items.push({ icon: '🔥', label: 'Join the trend', sub: t, disabled: count('sp_trend') > 0, onClick: function () { bump('sp_trend'); post(id, ['trend', '🔥', 'Join the trend', 'looks', [id], [], 0.02], true); } });
        postsFor(id).forEach(function (p) { items.push({ icon: p[1], label: p[2], sub: (p[3] ? U.cap(E.statLabel ? E.statLabel(p[3]) : p[3]) : 'Anyone can') + (c.niche && p[5].indexOf(c.niche) >= 0 ? ' · fits my niche' : '') + (p[6] >= 0.1 ? ' · risky' : ''), onClick: function () { post(id, p); } }); });
      }
      items.push({ icon: '🗑️', label: 'Delete my ' + pname(id) + ' account', danger: true, onClick: function () { var s = S(); s.followers = Math.max(0, (s.followers || 0) - a.f); delete c.acc[id]; sync(); ui().back(); done('I deleted my ' + pname(id) + ' account.'); } });
      return items;
    });
  }
  function deals() {
    var c = st();
    ui().menu('Brand deals', function () {
      var items = [];
      if (c.amb && c.amb.until >= S().year) items.push({ info: true, html: '<p class="small">🤝 Ambassador for ' + U.esc(c.amb.b) + ' through ' + c.amb.until + ' (' + E.fmt(E.$(c.amb.pay)) + '/yr)</p>' });
      offers().forEach(function (o) {
        items.push({ icon: o.amb ? '🤝' : o.sk ? '🚩' : '💼', label: U.cap(o.b) + (o.amb ? ' · ambassador' : ''), sub: (o.amb ? '3-year deal · ' : 'One post · ') + (o.sk ? 'pays well, smells off' : 'solid brand'), right: E.fmt(E.$(o.pay)), onClick: function () {
          ui().choose('💼 ' + U.cap(o.b), 'They\'re offering ' + E.fmt(E.$(o.pay)) + (o.amb ? ' a year for three years' : ' for one post') + '.', [
            { label: 'Accept', fn: function () { takeDeal(o, 'yes'); } },
            { label: 'Ask for more', fn: function () { takeDeal(o, 'haggle'); } },
            { label: 'Turn it down', fn: function () { c.offers.l = c.offers.l.filter(function (q) { return q !== o; }); if (o.sk) E.karma(1); done('I passed on ' + o.b + '.'); } }
          ]);
        } });
      });
      if (!items.length) items.push({ info: true, html: '<p class="muted">No offers right now.</p>' });
      return items;
    });
  }
  function buy() {
    var c = st(), n = U.pick([1000, 10000, 50000]), cost = E.$(Math.round(n * 0.012));
    ui().choose('🤖 Buy followers', 'A sketchy site sells followers: ' + big(n) + ' for ' + E.fmt(cost) + '. They\'re bots. Engagement will drop, and people can tell.', [
      { label: 'Buy ' + big(n), fn: function () { if (S().money < cost) return done(nope('I can\'t afford it.')); bump('sp_buy'); E.addMoney(-cost); c.fake = (c.fake || 0) + n; S().followers += n; sync(); done('+' + big(n) + ' followers overnight. None of them have profile pictures. 🤖'); } },
      { label: 'Never mind', fn: function () { done(null); } }
    ]);
  }
  function doomscroll() {
    bump('sp_doom');
    var r = U.rand(1, 4);
    E.stat('happy', -2);
    if (r === 1) { E.stat('smarts', 1); return done('I fell down a rabbit hole of history videos for three hours. Learned something, at least.'); }
    if (r === 2) return done('I doomscrolled until 3 a.m. and now I know everything about a stranger\'s divorce.');
    if (r === 3) { E.stat('happy', -3); return done(bad('I compared my life to everyone\'s highlight reel for hours. I feel awful.')); }
    return done('I scrolled for so long my phone asked if I was okay. 🌀');
  }
  function feedView() {
    var c = st();
    ui().menu('My feed', function () {
      if (!c.feed.length) return [{ info: true, html: '<p class="muted">Nothing posted yet.</p>' }];
      return c.feed.slice().reverse().map(function (p) { return { icon: p.v ? '🚀' : p.bad ? '😬' : picon(p.p, p.y), label: p.t, sub: pname(p.p, p.y) + ' · ' + p.y + ' · ' + big(p.l) + ' likes · "' + p.c + '"' }; });
    });
  }
  function analytics() {
    var c = st();
    ui().menu('Analytics', function () {
      var items = [], h = c.hist.slice(-12), top = Math.max.apply(null, h.map(function (q) { return q.f; }).concat([1]));
      items.push({ info: true, html: '<div class="hb-arch">📊 ' + tier(total()) + '</div><p class="small muted">' + big(total()) + ' followers · ' + (engagement() * 100).toFixed(1) + '% engagement' + (c.fake ? ' · about ' + big(c.fake) + ' are bots' : '') + '</p>' });
      if (h.length) {
        items.push({ section: 'Followers by year' });
        h.forEach(function (q) { var w = Math.max(2, Math.round(q.f / top * 100)); items.push({ info: true, html: '<div class="minibar wide"><span>' + q.y + ' · ' + big(q.f) + '</span><span class="track"><span class="fill hi" style="width:' + w + '%"></span></span></div>' }); });
      }
      var bestP = c.feed.slice().sort(function (a, b) { return b.l - a.l; })[0];
      if (bestP) { items.push({ section: 'Best post' }); items.push({ icon: '🏆', label: bestP.t, sub: pname(bestP.p, bestP.y) + ' · ' + bestP.y + ' · ' + big(bestP.l) + ' likes' }); }
      items.push({ section: 'By platform' });
      accounts().forEach(function (id) { var a = c.acc[id]; items.push({ icon: picon(id), label: pname(id), sub: big(a.f) + ' followers · ' + U.plural(a.posts, 'post') + (a.ver ? ' · verified' : ''), right: Math.round(a.f / Math.max(1, total()) * 100) + '%' }); });
      return items;
    });
  }

  // ------------------------------------------------------------ the year
  function yearly() {
    var s = S(); if (!s || s.dead || !s.social) return;
    var c = st(), ids = accounts(); if (!ids.length) return;
    sync();
    ids.forEach(function (id) {
      var a = c.acc[id];
      if (!live(id)) { if (a.f > 0 && !a.dead) { a.dead = s.year; var lost = Math.round(a.f * 0.85); a.f -= lost; E.log('👻 ' + pname(id) + ' is a ghost town now. My ' + big(lost + a.f) + ' followers there scattered.', ''); } return; }
      // Active accounts grow; quiet ones fade; fame always draws people in.
      var act = a.yr || 0, brk = c.breakY === s.year;
      var g = act ? U.randf(0.02, 0.06) * act + engagement() * 0.6 : brk ? -U.randf(0.01, 0.04) : -U.randf(0.02, 0.08);
      a.f = Math.max(0, Math.round(a.f * (1 + g) + (s.fame || 0) * U.rand(5, 60) * (id === 'tt' ? 2 : 1)));
      a.yr = 0;
    });
    if (s.year === 2023 && c.acc.tw && !c.renamed) { c.renamed = 1; E.log('𝕏 Twitter is called X now. Nobody calls it that.', ''); if (!c.paidCheck && c.acc.tw.ver) { c.acc.tw.ver = 0; } }
    // Ambassador money.
    if (c.amb && c.amb.until >= s.year) { var p = E.$(c.amb.pay); E.addMoney(p); E.log('🤝 Brand ambassador deal with ' + c.amb.b + ': ' + E.fmt(p), 'money'); }
    // Bots get noticed.
    if (c.fake && c.fake > total() * 0.2 && U.chance(0.3)) { s.pending.push({ id: 'soc_exposed', data: { year: s.year } }); }
    // Something lands in my DMs.
    var f = total();
    if (U.chance(Math.min(0.6, 0.15 + Math.log10(1 + f) / 12))) s.pending.push({ id: 'soc_dm', data: { year: s.year, k: dmKind(f) } });
    // Old posts resurface; sketchy sponsors catch up with me.
    if ((c.sketchy && U.chance(0.25)) || (f >= 50000 && (s.karma || 50) < 40 && U.chance(0.15)) || (f >= 200000 && U.chance(0.05))) s.pending.push({ id: 'soc_drama', data: { year: s.year, why: c.sketchy && U.chance(0.6) ? 'sketchy' : 'old' } });
    if (c.sketchy && U.chance(0.4)) c.sketchy--;
    c.hist.push({ y: s.year, f: total() }); if (c.hist.length > 40) c.hist.shift();
    s.followers = total();
  }
  function dmKind(f) {
    var l = [['fan', 3], ['hater', f >= 1000 ? 2 : 0.5], ['scam', 1.5], ['collab', f >= 5000 ? 2 : 0], ['celeb', f >= 100000 ? 1 : 0.1], ['crush', me().age >= 18 && me().age <= 40 ? 1.2 : 0]];
    var t = l.reduce(function (a, q) { return a + q[1]; }, 0), r = Math.random() * t;
    for (var i = 0; i < l.length; i++) { r -= l[i][1]; if (r <= 0) return l[i][0]; }
    return 'fan';
  }

  // ------------------------------------------------------------ events
  function ok(d) { return d && d.year === S().year && S().social && accounts().length; }
  def('soc_dm', { build: function (d) {
    if (!ok(d)) return null;
    var s = S(), c = st(), m = main(), k = d.k;
    if (k === 'collab') {
      var nm = E.randomName(U.pick(['M', 'F'])), who = '@' + (nm.first + nm.last).toLowerCase(), their = Math.round(total() * U.randf(0.5, 3));
      return { icon: '🤝', title: 'Collab request', text: who + ' (' + big(their) + ' followers) wants to film a collab' + (c.niche ? ' for our ' + c.niche.toLowerCase() + ' audiences' : '') + '.', choices: [
        { label: 'Film it together', run: function () { var g = Math.round(their * U.randf(0.02, 0.1)); c.acc[m].f += g; sync(); feed({ y: s.year, p: m, t: 'Collab with ' + who, l: Math.round(g * 12), c: 'the duo we needed 😭' }); if (U.chance(0.2)) { E.addPerson({ role: 'friend', age: me().age + U.rand(-4, 4), rel: 60, first: nm.first }); } return good('The collab with ' + who + ' did numbers. +' + big(g) + ' followers.'); } },
        { label: 'Leave them on read', run: function () { return 'I left ' + who + ' on read.'; } }
      ] };
    }
    if (k === 'scam') {
      var loss = E.$(U.pick([200, 500, 1500]));
      return { icon: '🎣', title: 'Suspicious DM', text: U.pick(['"Congrats! You\'ve been selected as a brand ambassador! Just pay a small shipping fee…"', '"Your account will be deleted for copyright violation. Verify here: totally-legit-login.co"', '"Hey!! Is this you in this video?? 😳 [link]"', '"I can 10x your crypto in a week. DM me."']), choices: [
        { label: 'Click the link', run: function () { E.addMoney(-loss); var lost = Math.round(c.acc[m].f * 0.02); c.acc[m].f -= lost; sync(); return bad('It was a scam. They got into my account and drained ' + E.fmt(loss) + ' before I got it back.'); } },
        { label: 'Report and block', run: function () { E.stat('smarts', 1); return 'I reported it and blocked them. Nice try.'; } }
      ] };
    }
    if (k === 'hater') {
      return { icon: '😡', title: 'A hater', text: 'Someone has been leaving nasty comments on every post I make: "' + U.pick(['you\'re so fake it hurts', 'fell off so hard lol', 'nobody would follow you if you weren\'t ' + (me().looks > 60 ? 'pretty' : 'desperate'), 'the most boring account on here']) + '"', choices: [
        { label: 'Clap back publicly', run: function () { if (U.chance(0.5)) { var g = Math.round(total() * 0.04 + 100); c.acc[m].f += g; sync(); E.fame(1); return good('My clapback went viral. +' + big(g) + ' followers.'); } c.drama = s.year; E.stat('happy', -5); return bad('The clapback started a pile-on. On me.'); } },
        { label: 'Block them', run: function () { E.stat('happy', 1); return 'Blocked. Peace.'; } },
        { label: 'Read every comment and spiral', run: function () { E.stat('happy', -8); return bad('I read every comment at 2 a.m. It did not help.'); } }
      ] };
    }
    if (k === 'celeb') {
      var who2 = TL.nba && U.chance(0.3) ? TL.nba.anyStar(U.pick(['M', 'F']), s.year, []) : null; who2 = who2 || U.pick(['a pop star', 'a famous actor', 'a late-night host', 'a reality TV star', 'a famous chef']);
      return { icon: '🌟', title: 'Celebrity follow', text: who2.charAt(0).toUpperCase() + who2.slice(1) + ' followed me and liked three of my posts.', choices: [
        { label: 'Screenshot it and post it', run: function () { var g = Math.round(total() * 0.08 + 500); c.acc[m].f += g; sync(); E.stat('happy', 8); return good('I posted the screenshot. +' + big(g) + ' followers. I\'m framing it.'); } },
        { label: 'Play it cool', run: function () { E.stat('happy', 5); return 'I played it cool. (I screamed into a pillow.)'; } }
      ] };
    }
    if (k === 'crush') {
      var g2 = me().gender === 'M' ? 'F' : 'M', nm2 = E.randomName(g2);
      return { icon: '💌', title: 'Slid into my DMs', text: nm2.first + ' from my comments sent a really sweet message and asked if I\'d ever want to grab coffee.', choices: [
        { label: 'Meet up', run: function () { if (U.chance(0.6) && !E.partner()) { E.addPerson({ role: 'partner', age: me().age + U.rand(-3, 3), gender: g2, first: nm2.first, rel: 60 }); E.stat('happy', 10); return good('Coffee turned into dinner. ' + nm2.first + ' and I are dating now! 💕'); } return 'We met up. Nice person, zero spark.'; } },
        { label: 'Leave it on seen', run: function () { return 'I left it on seen.'; } }
      ] };
    }
    return { icon: '💬', title: 'Fan mail', text: 'A follower messaged me: "' + U.pick(['your posts got me through a really hard year. thank you.', 'I started working out because of you!', 'you made me laugh on the worst day of my life', 'my little sister wants to be just like you']) + '"', choices: [
      { label: 'Write back', run: function () { E.stat('happy', 6); E.karma(1); return good('I wrote back. They screenshotted it and it made their year. 🥹'); } },
      { label: 'Heart it', run: function () { E.stat('happy', 3); return 'I hearted the message.'; } }
    ] };
  } });
  def('soc_drama', { build: function (d) {
    if (!ok(d)) return null;
    var s = S(), c = st(), sk = d.why === 'sketchy';
    var text = sk ? 'The sketchy product I promoted turned out to be a scam, and my followers lost money. People are tagging me in everything.' : 'Someone dug up ' + U.pick(['a tweet I posted ten years ago', 'an old video of me saying something awful', 'screenshots from my group chat', 'a post where I mocked a fan']) + '. It\'s trending, and not in a good way.';
    var lost = function (k0) { var t = 0; accounts().forEach(function (id) { var a = c.acc[id], l = Math.round(a.f * k0); a.f -= l; t += l; }); sync(); return t; };
    c.drama = s.year;
    return { icon: '🔥', title: sk ? 'Scam fallout' : 'Canceled', text: text, choices: [
      { label: 'Post a sincere video apology', run: function () { var l = lost(U.randf(0.02, 0.08)); E.karma(2); return 'I apologized on camera and meant it. Most people accepted it. Lost ' + big(l) + ' followers.'; } },
      { label: 'Post a Notes-app apology', run: function () { var l = lost(U.randf(0.06, 0.15)); return bad('The Notes-app apology got roasted harder than the original post. Lost ' + big(l) + ' followers.'); } },
      { label: 'Double down', run: function () { if (U.chance(0.35)) { var g = Math.round(total() * 0.1); c.acc[main()].f += g; sync(); E.karma(-3); return 'I doubled down. Half the internet hates me; the other half made me their hero. +' + big(g) + ' followers.'; } var l2 = lost(U.randf(0.15, 0.35)); E.karma(-3); E.stat('happy', -10); return bad('I doubled down and it got so much worse. Lost ' + big(l2) + ' followers.'); } },
      { label: 'Go quiet and wait it out', run: function () { var l3 = lost(U.randf(0.04, 0.1)); c.breakY = s.year; return 'I went dark for a while. The internet moved on to someone else. Lost ' + big(l3) + ' followers.'; } }
    ] };
  } });
  def('soc_exposed', { build: function (d) {
    if (!ok(d)) return null;
    var c = st();
    return { icon: '🤖', title: 'Exposed', text: 'An account that tracks fake followers posted that about ' + Math.round(c.fake / Math.max(1, total()) * 100) + '% of my followers are bots.', choices: [
      { label: 'Purge the bots', run: function () { var n = c.fake; S().followers = Math.max(0, S().followers - n); c.fake = 0; sync(); return 'I purged the bots. My follower count dropped by ' + big(n) + ', but my engagement is real again.'; } },
      { label: 'Deny it', run: function () { c.drama = S().year; E.karma(-2); return bad('Nobody believed me. Brands are quietly backing away.'); } }
    ] };
  } });

  return { menu: menu, yearly: yearly, sync: sync, total: total, handle: handle, platformName: pname, tier: tier };
})();
