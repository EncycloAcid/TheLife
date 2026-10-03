/* TheLife — social media for basketball players (js/hoops.js): the platform
 * of the era, a handle and a verified badge, posts that grow (or shrink) a
 * following, a feed of what fans and media say about your season, beefs
 * with other players, sponsored posts and college NIL deals. Followers are
 * the life's S().followers. */
TL.hsocial = (function () {
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
  function big(n) { return n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? Math.round(n / 1e3) + 'K' : String(Math.round(n)); }

  // The platform athletes lived on in a given year.
  function platform(y) { return y < 2004 ? null : y < 2008 ? 'MySpace' : y < 2011 ? 'Facebook' : y < 2015 ? 'Twitter' : y < 2020 ? 'Instagram' : 'Instagram and TikTok'; }
  function on() { return !!platform(S().year); }
  function st() {
    var x = S().hoops; if (!x) return null;
    if (!x.soc) {
      var m = me(), h = (m.first + m.last).toLowerCase().replace(/[^a-z]/g, '');
      x.soc = { handle: U.pick([h, h + x.num, m.first.toLowerCase().replace(/[^a-z]/g, '') + '.' + m.last.toLowerCase().replace(/[^a-z]/g, ''), 'the' + h, h + '_']), feed: [], beefs: [] };
    }
    return x.soc;
  }
  function join() { var s = S(); if (!s.social.platform) { s.social.platform = true; s.followers = Math.max(s.followers || 0, U.rand(200, 2000)); } }
  function feed(text, who, likes) { var c = st(); c.feed.push({ year: S().year, who: who || 'me', text: text, likes: Math.round(likes || 0) }); if (c.feed.length > 40) c.feed.shift(); }
  function room() { var c = st().cap || 2e5; return Math.max(0.05, 1 - S().followers / c); }
  function verified() { return S().followers >= 100000; }
  function handle() { return '@' + st().handle + (verified() ? ' ✔️' : ''); }

  // ------------------------------------------------------------ the season
  // Called at the end of every season: the internet reacts.
  function season(x, line, F) {
    if (!on()) return;
    var s = S(), c = st();
    if (!s.social.platform) { if (x.stage === 'pro' || x.stage === 'college') join(); else return; }
    var heat = (line.ppg || 0) * 1.6 + (line.honors ? line.honors.length * 12 : 0) + (line.result === 'Won the championship' ? 30 : 0) + (x.stage === 'pro' ? 15 : 5);
    // Audiences saturate: the ceiling grows with how good and how famous I am.
    c.cap = Math.max(c.cap || 0, Math.round((2e5 + Math.pow(Math.min(heat, 110), 2) * 2500) * (1 + s.fame / 50)));
    var gain = Math.round((s.followers * U.randf(0.04, 0.14) * room() + Math.pow(heat, 2.2) * U.randf(4, 12)) * (1 + s.fame / 120));
    s.followers += gain;
    var star = line.honors && line.honors.length, me2 = handle();
    var media = U.pick(['ESPN', 'Bleacher Report', 'House of Highlights', 'The Athletic', 'SportsCenter', 'Overtime']);
    if (line.result === 'Won the championship') feed('🏆 CHAMPIONS. ' + me2 + ' and the ' + x.team + ' are on top of the world.', media, gain * 3);
    else if (star) feed('🔥 ' + me2 + ' this season: ' + line.ppg + ' PPG, ' + line.honors.join(', ') + '. Respect the name.', media, gain * 2);
    else if ((line.ppg || 0) >= 20) feed('📈 ' + me2 + ' is quietly putting up ' + line.ppg + ' a night. Are we sleeping on this?', media, gain);
    else if ((line.ppg || 0) < 6 && x.stage === 'pro') feed('🪑 ' + me2 + ' has been glued to the bench. Trade candidate?', U.pick(['a fan account', 'r/nba', 'a trade-rumor account']), gain * 0.4);
    if (line.hi >= 40) feed('🎥 ' + line.hi + ' points. Every bucket from ' + me2 + '\'s career night.', 'House of Highlights', gain * 1.5);
    E.fame(Math.min(4, Math.log10(1 + gain) - 2));
    if (s.followers >= 1e6) E.achieve('influencer');
    // The internet loves a beef.
    if (x.stage === 'pro' && U.chance(0.12)) s.pending.push({ id: 'hs_beef', data: { year: s.year } });
    // College athletes can profit from their name, image and likeness since 2021.
    if (x.stage === 'college' && s.year >= 2022 && U.chance(0.6)) s.pending.push({ id: 'hs_nil', data: { year: s.year } });
  }

  // ------------------------------------------------------------ menu
  var POSTS = [
    ['🎬', 'Post a highlight reel', 'hl', function (x) { return 1.4 + (x.ovr - 60) / 30; }, 'Dropped my season mixtape. Defenders, I\'m sorry. 🎬'],
    ['📹', 'Post a day-in-the-life vlog', 'vlog', function () { return 1.1; }, 'Took y\'all behind the scenes: 5 a.m. workouts, team flights and my mom\'s cooking. 📹'],
    ['🎙️', 'Go live and answer fan questions', 'live', function () { return 0.9; }, 'Went live for an hour answering questions. You all are wild. 🎙️'],
    ['💛', 'Promote a charity drive', 'charity', function () { return 0.8; }, 'Raised money for my old rec center. Thank you for showing up. 💛']
  ];
  function post(p) {
    var x = S().hoops, s = S();
    if (count('hs_' + p[2])) return done(nope('I already did that this year.'));
    bump('hs_' + p[2]); join();
    var base = (s.followers * U.randf(0.01, 0.05) * room() + U.rand(200, 2000)) * p[3](x) * (1 + s.fame / 150);
    var viral = U.chance(p[2] === 'hl' ? 0.08 : 0.04);
    var gain = Math.round(base * (viral ? U.rand(5, 20) : 1)), likes = gain * U.randf(4, 12);
    s.followers += gain;
    if (p[2] === 'charity') E.karma(3);
    if (viral) E.fame(3);
    feed(p[4], 'me', likes);
    return done((viral ? good : function (t) { return t; })((viral ? '🚀 It went viral! ' : '') + p[4].replace(/ [^\w\s.,!?'-]+$/, '') + ' ' + big(likes) + ' likes, +' + big(gain) + ' followers.'));
  }
  function trash() {
    var x = S().hoops, s = S();
    if (count('hs_trash')) return done(nope('One callout a year is plenty.'));
    bump('hs_trash'); join();
    var g = me().gender, target = TL.nba ? TL.nba.anyStar(g, s.year, []) : null;
    if (!target) return done(nope('There\'s nobody worth calling out right now.'));
    var win = U.chance(0.35 + (x.ovr - 75) / 60);
    st().beefs.push({ year: s.year, with: target, won: win });
    if (win) { var gtn = Math.round(s.followers * U.randf(0.08, 0.25) * room() + 5000); s.followers += gtn; E.fame(4); feed('😤 Called out ' + target + '. Come see me on the court.', 'me', gtn * 8); return done(good('I called out ' + target + ' on ' + platform(s.year) + '. The internet took my side. +' + big(gtn) + ' followers.')); }
    var lost = Math.round(s.followers * U.randf(0.02, 0.08)); s.followers = Math.max(0, s.followers - lost); E.karma(-2);
    if (U.chance(0.3)) { E.addMoney(-E.$(25000)); feed('🤡 ' + target + ' responded with a picture of their rings. Ouch.', target, lost * 20); return done(bad('I called out ' + target + '. They clapped back with their stats, and the league fined me ' + E.fmt(E.$(25000)) + '.')); }
    feed('🤡 ' + target + ' responded with a picture of their rings. Ouch.', target, lost * 20);
    return done(bad('I called out ' + target + '. It did not go well. -' + big(lost) + ' followers.'));
  }
  function sponsored() {
    var s = S();
    if (count('hs_spon')) return done(nope('One sponsored campaign a year keeps it authentic.'));
    if (s.followers < 50000) return done(nope('Brands want at least 50K followers.'));
    bump('hs_spon');
    var brand = U.pick(['Gatorade', 'Beats by Dre', 'State Farm', 'Nike', 'a sneaker app', 'a fantasy sports app', 'a protein shake brand', 'a mobile game']);
    var pay = E.$(Math.round(s.followers * U.randf(0.01, 0.03) + 5000));
    E.addMoney(pay); s.followers = Math.round(s.followers * U.randf(0.98, 1.01));
    feed('#ad Big thanks to ' + brand + ' for keeping me ready. 💯', 'me', s.followers * 0.02);
    return done('I posted a sponsored campaign for ' + brand + ' and earned ' + E.fmt(pay) + '. 💰');
  }
  function feedView() {
    ui().menu('Feed', function () {
      var c = st(); if (!c.feed.length) return [{ info: true, html: '<p class="muted">Nothing yet. Play a season or post something.</p>' }];
      return c.feed.slice().reverse().map(function (f) { return { icon: f.who === 'me' ? '📱' : '💬', label: f.text, sub: (f.who === 'me' ? handle() : f.who) + ' · ' + f.year + ' · ' + big(f.likes) + ' likes' }; });
    });
  }
  function items() {
    var x = S().hoops, s = S();
    if (!x || !on() || (x.stage !== 'pro' && x.stage !== 'college' && x.stage !== 'retired')) return [];
    var p = platform(s.year), out = [{ section: 'Social media' }];
    out.push({ info: true, html: '<div class="hb-arch">📱 ' + U.esc(handle()) + ' · ' + U.esc(p) + '</div><p class="small muted">' + big(s.followers) + ' followers' + (verified() ? ' · verified' : ' · verified at 100K') + ((st().beefs || []).length ? ' · ' + U.plural(st().beefs.length, 'beef') : '') + '</p>' });
    POSTS.forEach(function (q) { out.push({ icon: q[0], label: q[1], disabled: count('hs_' + q[2]) > 0, onClick: function () { post(q); } }); });
    if (x.stage === 'pro') out.push({ icon: '😤', label: 'Call out a rival', sub: 'Could win the internet, or get you fined', disabled: count('hs_trash') > 0, onClick: trash });
    if (s.followers >= 50000) out.push({ icon: '🤑', label: 'Sponsored post', sub: '~' + E.fmt(E.$(Math.round(s.followers * 0.02 + 5000))), disabled: count('hs_spon') > 0, onClick: sponsored });
    out.push({ icon: '💬', label: 'Read my feed', sub: 'What fans and media are saying', onClick: feedView });
    return out;
  }

  // ------------------------------------------------------------ events
  def('hs_beef', { cond: function () { var x = S().hoops; return !!(x && x.stage === 'pro' && on()); }, build: function (d) {
    var s = S(), x = s.hoops, who = TL.nba ? TL.nba.anyStar(me().gender, s.year, []) : null;
    if (!who || !d || d.year !== s.year) return null;
    return { icon: '📱', title: 'Subtweeted', text: who + ' took a shot at me online: "Some people get paid on potential." Everyone knows who they mean.', choices: [
      { label: 'Answer with a highlight video', run: function () { var g = Math.round(s.followers * U.randf(0.05, 0.15) * room() + 3000); s.followers += g; st().beefs.push({ year: s.year, with: who, won: true }); feed('🎥 No caption needed.', 'me', g * 10); return good('I posted my best dunk on them with no caption. The internet ate it up. +' + big(g) + ' followers.'); } },
      { label: 'Fire back with words', run: function () { var w = U.chance(0.5); st().beefs.push({ year: s.year, with: who, won: w }); if (w) { E.fame(3); s.followers += 20000; return good('My reply got more likes than their post. Point to me.'); } E.karma(-2); return bad('My reply aged badly after we lost to them. The memes were brutal.'); } },
      { label: 'Ignore it', run: function () { E.karma(1); return 'I let my game do the talking.'; } }
    ] };
  } });
  def('hs_nil', { cond: function () { var x = S().hoops; return !!(x && x.stage === 'college'); }, build: function (d) {
    var s = S(), x = s.hoops; if (!d || d.year !== s.year) return null;
    var brand = U.pick(['a local car dealership', 'a sports-drink company', 'a sneaker brand', 'a video-game studio', 'a fast-food chain', 'a regional bank']);
    var pay = E.$(Math.round(5000 + s.followers * U.randf(0.02, 0.06) + (x.stars || 2) * 15000));
    return { icon: '🎓', title: 'NIL deal', text: U.cap(brand) + ' wants to pay me ' + E.fmt(pay) + ' for my name, image and likeness.', choices: [
      { label: 'Sign the NIL deal', run: function () { E.addMoney(pay); s.followers += U.rand(2000, 20000); feed('Proud to team up with ' + brand + '! #NIL', 'me', 20000); return good('I signed an NIL deal with ' + brand + ' for ' + E.fmt(pay) + '. 💰'); } },
      { label: 'Stay focused on school and ball', run: function () { E.stat('smarts', 1); return 'I turned it down to focus on my game.'; } }
    ] };
  } });

  return { season: season, items: items, platform: platform, handle: handle };
})();
