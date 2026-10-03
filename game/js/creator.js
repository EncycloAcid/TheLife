/* TheLife — v1.13: content creator channels (YouTube, TikTok, Twitch),
 * side hustles (Uber, DoorDash, Fiverr…) and a crypto wallet.
 * State: S().channel, S().hustle, S().crypto. Money is tracked in base
 * dollars and converted with E.$ / E.k() so it survives emigrating. */
TL.creator = (function () {
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
  function skill(id) { return (S().skills || {})[id] || 0; }
  function big(n) { return n >= 1e6 ? (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '') + 'M' : n >= 1e3 ? (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace(/\.0$/, '') + 'K' : String(Math.round(n)); }
  // Base dollars → local money, keeping cents-level values (crypto) intact.
  function cash(usd) { return Math.round(usd * E.k()); }

  // ==================================================================
  // CONTENT CREATOR
  // ==================================================================
  // rpm: ad money per 1,000 views; grow: how fast audiences build there;
  // threshold: audience needed before the platform pays you.
  var PLATFORMS = {
    youtube: { name: 'YouTube', icon: '▶️', unit: 'subscribers', verb: 'Upload a video', rpm: 3.5, grow: 1, threshold: 1000, pay: 'the YouTube Partner Program' },
    tiktok: { name: 'TikTok', icon: '🎵', unit: 'followers', verb: 'Post a TikTok', rpm: 0.6, grow: 1.9, threshold: 10000, pay: 'the Creator Rewards Program' },
    twitch: { name: 'Twitch', icon: '🟣', unit: 'followers', verb: 'Go live', rpm: 1.2, grow: 0.6, threshold: 50, pay: 'Twitch Affiliate' }
  };
  // stat: what makes your videos good; mult: how much advertisers pay.
  var NICHES = [
    { id: 'gaming', name: 'Gaming', icon: '🎮', mult: 0.8, talent: function (m) { return m.smarts * 0.4 + m.happy * 0.3 + 15; } },
    { id: 'beauty', name: 'Beauty & fashion', icon: '💄', mult: 1.2, talent: function (m) { return m.looks * 0.8 + 10; } },
    { id: 'comedy', name: 'Comedy & skits', icon: '😂', mult: 0.7, talent: function (m) { return skill('comedy') * 0.6 + m.happy * 0.3 + 10; } },
    { id: 'cooking', name: 'Cooking', icon: '🍳', mult: 1.1, talent: function (m) { return skill('cooking') * 0.6 + m.smarts * 0.2 + 15; } },
    { id: 'fitness', name: 'Fitness', icon: '💪', mult: 1.3, talent: function (m) { return m.athl * 0.5 + skill('fitness') * 0.3 + m.looks * 0.1; } },
    { id: 'tech', name: 'Tech reviews', icon: '💻', mult: 2.0, talent: function (m) { return m.smarts * 0.5 + skill('coding') * 0.3 + 5; } },
    { id: 'vlogs', name: 'Lifestyle vlogs', icon: '📹', mult: 0.9, talent: function (m) { return m.looks * 0.4 + m.happy * 0.4 + 10; } },
    { id: 'music', name: 'Music covers', icon: '🎤', mult: 0.6, talent: function (m) { return skill('singing') * 0.7 + (S().flags.music || 0) * 2 + 10; } },
    { id: 'edu', name: 'Education & science', icon: '🔬', mult: 1.6, talent: function (m) { return m.smarts * 0.7 + 5; } }
  ];
  function niche(id) { for (var i = 0; i < NICHES.length; i++) if (NICHES[i].id === id) return NICHES[i]; return NICHES[0]; }
  var GEAR = [['Phone tripod and ring light', 150, 6], ['Mirrorless camera and mic', 2500, 10], ['Full studio setup', 15000, 14]];
  // YouTube's real creator awards.
  var BUTTONS = [[1e5, 'Silver Play Button', '🥈', 'creator_silver'], [1e6, 'Gold Play Button', '🥇', 'creator_gold'], [1e7, 'Diamond Play Button', '💎', 'creator_diamond']];
  var SPONSORS = ['NordVPN', 'Raid: Shadow Legends', 'HelloFresh', 'Squarespace', 'Audible', 'Manscaped', 'Skillshare', 'Honey', 'G Fuel', 'Ridge Wallet', 'Surfshark', 'Factor Meals'];

  function ch() {
    var c = S().channel || null;
    // A full-time creator who took a job (or went to prison) is part-time again.
    if (c && c.fulltime && (S().job || S().prison)) c.fulltime = false;
    return c;
  }
  function plat(c) { return PLATFORMS[(c || ch()).platform] || PLATFORMS.youtube; }
  function handle() { return '@' + (me().first + me().last).toLowerCase().replace(/[^a-z]/g, '') + (S().channel && S().channel.platform === 'twitch' ? 'tv' : ''); }
  function maxUploads(c) { return c.fulltime ? 8 : 3; }
  function title() { var c = ch(); return c && c.fulltime ? (c.subs >= 1e6 ? 'Star ' : '') + (c.platform === 'twitch' ? 'Streamer' : 'Content Creator') : null; }

  function startChannel() {
    // Only platforms that exist in the current year (js/history.js).
    var choices = Object.keys(PLATFORMS).filter(function (k) { return !TL.history || TL.history.exists(k); }).map(function (k) {
      var p = PLATFORMS[k];
      return { label: p.icon + ' ' + p.name, fn: function () { pickNiche(k); } };
    });
    ui().choose('Start a channel', 'Where do I want to build an audience?', choices);
  }
  function pickNiche(platform) {
    ui().choose('Pick a niche', 'What will my channel be about? Pick something I\'m good at.', NICHES.map(function (n) {
      return { label: n.icon + ' ' + n.name, fn: function () {
        S().channel = { platform: platform, niche: n.id, subs: 0, videos: 0, views: 0, yearViews: 0, gear: 0, craft: 0, fulltime: false, merch: false, buttons: [], earned: 0, lastPay: 0, burnout: 0, started: S().year, best: 0 };
        done(good('I started a ' + PLATFORMS[platform].name + ' channel about ' + n.name.toLowerCase() + ': ' + handle() + '. ' + PLATFORMS[platform].icon));
        menu();
      } };
    }));
  }
  // One video: quality decides views, views decide new subscribers.
  function upload() {
    var c = ch(), p = plat(c), m = me();
    if (count('cr_upload') >= maxUploads(c)) return done(nope(c.fulltime ? 'I\'ve made all the content I can this year. Time to rest.' : 'I can only fit ' + maxUploads(c) + ' videos a year around everything else. Going full-time would give me more time.'));
    bump('cr_upload');
    var n = niche(c.niche);
    var q = U.clamp(n.talent(m) * 0.6 + c.craft * 0.9 + c.gear + U.rand(-15, 20) - c.burnout * 4, 1, 120);
    c.videos++;
    c.craft = Math.min(40, c.craft + U.randf(0.6, 1.6));
    // Existing fans watch; the algorithm shows good videos to strangers.
    var fans = c.subs * U.randf(0.06, 0.25), strangers = Math.pow(q, 1.8) * U.randf(1.5, 6) * p.grow + S().followers * 0.02;
    // The algorithm pushes good videos from bigger channels to more people.
    strangers += c.subs * U.randf(0.2, 1.2) * Math.pow(q / 80, 3);
    var viral = U.chance(0.008 + q / 3000);
    var views = Math.round(fans * (viral ? 2 : 1) + strangers * (viral ? U.rand(20, 100) : 1));
    // Big channels find new fans harder to come by.
    var gain = Math.round(views * U.randf(0.01, 0.03) * (q / 70) / (1 + c.subs / 3e6));
    c.views += views; c.yearViews += views; c.subs += gain;
    if (views > c.best) c.best = views;
    if (c.fulltime) c.burnout += 1;
    S().followers += Math.round(gain * 0.2);
    if (viral) {
      E.fame(U.rand(2, 6)); E.stat('happy', 10);
      return done(good('🔥 My video went VIRAL with ' + big(views) + ' views! +' + big(gain) + ' ' + p.unit + '.'));
    }
    if (q < 25 && U.chance(0.35)) { E.stat('happy', -4); return done(bad('My video flopped. ' + big(views) + ' views and the comments were brutal.')); }
    E.stat('happy', 2);
    return done((c.platform === 'twitch' ? 'My stream peaked at ' + big(Math.max(1, Math.round(views / 40))) + ' viewers' : 'My video got ' + big(views) + ' views') + '. +' + big(gain) + ' ' + p.unit + '.');
  }
  function buyGear() {
    var c = ch(), next = GEAR[c.gear >= 14 ? 3 : c.gear >= 10 ? 2 : c.gear >= 6 ? 1 : 0];
    if (!next) return done(nope('My studio is already top of the line.'));
    var cost = E.$(next[1]);
    if (S().money < cost) return done(nope('A ' + next[0].toLowerCase() + ' costs ' + E.fmt(cost) + '. I can\'t afford it yet.'));
    E.addMoney(-cost); c.gear = next[2];
    return done('I bought a ' + next[0].toLowerCase() + '. My videos look so much better. 🎬');
  }
  function collab() {
    var c = ch(), p = plat(c);
    if (count('cr_collab')) return done(nope('I already did a collab this year.'));
    bump('cr_collab');
    var partner = E.randomName(U.pick(['M', 'F'])).first + U.pick(['Plays', 'TV', 'Vlogs', 'Official', 'Daily', 'IRL', 'Cooks', 'Fit']);
    if (U.chance(0.25)) { E.stat('happy', -3); return done('I pitched a collab to ' + partner + ', but they never replied. 😶'); }
    var gain = Math.round(c.subs * U.randf(0.05, 0.25) + U.rand(200, 3000) * p.grow);
    c.subs += gain; E.stat('happy', 6);
    return done(good('I filmed a collab with ' + partner + '. Their fans loved me: +' + big(gain) + ' ' + p.unit + '. 🤝'));
  }
  function merch() {
    var c = ch(), cost = E.$(5000);
    if (S().money < cost) return done(nope('Launching a merch line costs ' + E.fmt(cost) + '.'));
    E.addMoney(-cost); c.merch = true;
    return done(good('I launched my own merch line: hoodies, mugs and a very questionable hat. 👕'));
  }
  function fullTime() {
    var c = ch();
    if (S().job) return done(nope('I need to quit my job before I can go full-time.'));
    if (S().edu) return done(nope('I should finish school before going full-time.'));
    c.fulltime = true;
    return done('I\'m a full-time ' + (c.platform === 'twitch' ? 'streamer' : 'content creator') + ' now. No boss, no safety net. 😬');
  }
  function takeBreak() {
    var c = ch();
    if (count('cr_break')) return done(nope('I\'m already taking time off this year.'));
    bump('cr_break'); bump('cr_upload'); bump('cr_upload');
    var lost = Math.round(c.subs * U.randf(0.01, 0.05));
    c.subs -= lost; c.burnout = 0;
    E.stat('happy', 12); E.stat('health', 4);
    return done('I posted a "taking a break" video and logged off for a while. I feel human again. 🌿');
  }
  function quitChannel() {
    ui().confirm('Delete channel?', 'Delete ' + handle() + ' and its ' + big(ch().subs) + ' ' + plat().unit + '? This can\'t be undone.', function () {
      S().channel = null; ui().back();
      done('I deleted my channel and walked away from the internet.');
    });
  }
  function menu() {
    var c = ch();
    if (!c) return startChannel();
    ui().menu(plat(c).name + ' channel', function () {
      c = ch();
      if (!c) return [{ info: true, html: '<p class="muted">No channel.</p>' }];
      var p = plat(c), n = niche(c.niche), items = [];
      var btn = BUTTONS.filter(function (b) { return c.buttons.indexOf(b[3]) >= 0; }).pop();
      items.push({ info: true, html: '<div class="cr-card"><div class="cr-top"><span class="cr-ico">' + p.icon + '</span><div><div class="cr-handle">' + U.esc(handle()) + '</div><div class="cr-sub">' + n.icon + ' ' + n.name + ' · ' + (c.fulltime ? 'full-time' : 'part-time') + (btn ? ' · ' + btn[2] : '') + '</div></div></div>' +
        '<div class="cr-stats"><div><b>' + big(c.subs) + '</b><small>' + p.unit + '</small></div><div><b>' + big(c.views) + '</b><small>views</small></div><div><b>' + c.videos + '</b><small>' + (c.platform === 'twitch' ? 'streams' : 'videos') + '</small></div></div>' +
        '<div class="cr-foot">' + (c.subs >= p.threshold ? 'Earned ' + E.fmt(c.lastPay) + ' last year · ' + E.fmt(c.earned) + ' all-time' : 'Monetization at ' + big(p.threshold) + ' ' + p.unit + ' (' + p.pay + ')') + '</div></div>' });
      var left = maxUploads(c) - count('cr_upload');
      items.push({ icon: c.platform === 'twitch' ? '🔴' : '🎬', label: p.verb, sub: left > 0 ? left + ' left this year' : 'Done for this year', disabled: left <= 0, onClick: upload });
      if (c.subs >= 500) items.push({ icon: '🤝', label: 'Collab with a creator', disabled: count('cr_collab') > 0, onClick: collab });
      var next = GEAR[c.gear >= 14 ? 3 : c.gear >= 10 ? 2 : c.gear >= 6 ? 1 : 0];
      if (next) items.push({ icon: '🎥', label: 'Upgrade gear', sub: next[0], right: E.fmt(E.$(next[1])), onClick: buyGear });
      if (c.subs >= 50000 && !c.merch) items.push({ icon: '👕', label: 'Launch merch', right: E.fmt(E.$(5000)), onClick: merch });
      if (me().age >= 18 && !c.fulltime) items.push({ icon: '🚀', label: 'Go full-time', sub: S().job ? 'Quit my job first' : '8 videos a year instead of 3', onClick: fullTime });
      if (c.fulltime) items.push({ icon: '🌿', label: 'Take a break', sub: c.burnout >= 6 ? 'I\'m burning out' : 'Rest and recharge', disabled: count('cr_break') > 0, onClick: takeBreak });
      if (c.fulltime) items.push({ icon: '🧑‍💼', label: 'Go back to part-time', onClick: function () { c.fulltime = false; done('I\'m treating the channel as a side project again.'); } });
      items.push({ icon: '🗑️', label: 'Delete channel', danger: true, onClick: quitChannel });
      return items;
    });
  }
  // Paid once a year: ads on this year's views, sponsors, merch and fan support.
  function yearlyChannel() {
    var c = ch(), s = S();
    if (!c) return;
    var p = plat(c), n = niche(c.niche), uploads = count('cr_upload');
    // The back catalog keeps getting watched; an idle channel decays.
    var back = Math.round(c.subs * U.randf(0.3, 1.2) + c.videos * U.rand(20, 200) * p.grow);
    c.views += back; c.yearViews += back;
    if (s.prison) c.subs = Math.round(c.subs * 0.85);
    else if (!uploads) c.subs = Math.round(c.subs * U.randf(0.8, 0.92));
    else c.subs = Math.round(c.subs * U.randf(0.95, 0.99));
    var pay = 0;
    if (c.subs >= p.threshold) {
      pay += c.yearViews / 1000 * p.rpm * n.mult;
      if (c.platform === 'twitch') pay += c.subs * U.randf(0.005, 0.015) * 2.5 * 12; // paid subs, $2.50 each a month
    }
    if (c.merch) pay += c.subs * U.randf(0.02, 0.08);
    pay = Math.round(pay);
    c.lastPay = cash(pay); c.earned += c.lastPay; c.yearViews = 0;
    if (pay > 0) { E.addMoney(c.lastPay); E.log('📺 Channel income: ' + E.fmt(c.lastPay), 'money'); }
    // Milestones.
    BUTTONS.forEach(function (b) {
      if (c.subs >= b[0] && c.buttons.indexOf(b[3]) < 0) {
        c.buttons.push(b[3]); E.fame(b[0] >= 1e6 ? 15 : 6);
        E.log(c.platform === 'youtube' ? b[2] + ' YouTube sent me a ' + b[1] + ' for ' + big(b[0]) + ' subscribers!' : '🎉 I hit ' + big(b[0]) + ' ' + p.unit + ' on ' + p.name + '!', 'good');
        E.achieve(b[3]);
      }
    });
    if (c.subs >= 1e5) E.fame(Math.min(4, c.subs / 5e5));
    if (s.prison || s.dead) return;
    // Something happens on most years for a real channel.
    var q = function (id) { s.pending.push({ id: id, data: {} }); };
    if (c.subs >= 8000 && U.chance(0.55)) q('cr_sponsor');
    else if (c.fulltime && c.burnout >= 6 && U.chance(0.6)) q('cr_burnout');
    else if (c.subs >= 20000 && U.chance(0.12)) q('cr_drama');
    else if (c.platform === 'youtube' && c.videos >= 5 && U.chance(0.07)) q('cr_strike');
    else if (c.subs >= 50000 && U.chance(0.15)) q('cr_convention');
    else if (c.subs >= 2e6 && U.chance(0.06)) q('cr_buyout');
  }
  def('cr_sponsor', { cond: function () { return !!ch(); }, build: function () {
    var c = ch(), brand = U.pick(SPONSORS), fee = Math.round(Math.max(300, c.subs * U.randf(0.012, 0.035)) / 10) * 10;
    return { icon: '🤑', title: 'Sponsorship offer', text: brand + ' wants me to read an ad in my next ' + (c.platform === 'twitch' ? 'stream' : 'video') + ' for ' + E.fmt(E.$(fee)) + '.', choices: [
      { label: 'Take the deal', run: function () { E.addMoney(E.$(fee)); ch().earned += E.$(fee); if (U.chance(0.15)) { ch().subs = Math.round(ch().subs * 0.98); return 'I took the ' + brand + ' money. A few fans called me a sellout, but rent is rent.'; } return good('This video is sponsored by ' + brand + '! (+' + E.fmt(E.$(fee)) + ')'); } },
      { label: 'Turn it down', run: function () { E.karma(2); ch().subs += Math.round(ch().subs * 0.01); return 'I turned down ' + brand + '. My fans respect that I keep it real.'; } }
    ] };
  } });
  def('cr_burnout', { cond: function () { return !!ch(); }, build: function () {
    return { icon: '🥵', title: 'Burnout', text: 'Making content nonstop is wearing me down. I can\'t remember the last day I didn\'t think about the algorithm.', choices: [
      { label: 'Take a month off', run: function () { var c = ch(); c.burnout = 0; c.subs = Math.round(c.subs * 0.96); E.stat('happy', 12); E.stat('health', 5); return 'I took a month offline. The channel dipped a little; I didn\'t.'; } },
      { label: 'Push through', run: function () { E.stat('health', -8); E.stat('happy', -10); if (U.chance(0.3)) E.addCondition('Depression'); return bad('I kept grinding. Something has to give eventually.'); } }
    ] };
  } });
  def('cr_drama', { cond: function () { return !!ch(); }, build: function () {
    var rival = E.randomName(U.pick(['M', 'F'])).first + U.pick(['Plays', 'TV', 'Vlogs', 'Daily']);
    return { icon: '🍿', title: 'Creator drama', text: rival + ' made a 40-minute video calling me out. The comments are a war zone.', choices: [
      { label: 'Post a response video', run: function () { var c = ch(); if (U.chance(0.55)) { var g = Math.round(c.subs * U.randf(0.05, 0.2)); c.subs += g; c.views += g * 30; return good('My response video ratioed ' + rival + '. +' + big(g) + ' ' + plat().unit + '. 🍿'); } var l = Math.round(c.subs * U.randf(0.05, 0.15)); c.subs -= l; E.stat('happy', -8); return bad('My response made it worse. I lost ' + big(l) + ' ' + plat().unit + '.'); } },
      { label: 'Post an apology video', run: function () { ch().subs = Math.round(ch().subs * 0.97); E.karma(2); return 'I sat in front of a gray wall and apologized. It mostly blew over.'; } },
      { label: 'Stay silent', run: function () { E.stat('happy', -4); return 'I said nothing and let it pass. The internet moved on in a week.'; } }
    ] };
  } });
  def('cr_strike', { cond: function () { return !!ch(); }, build: function () {
    return { icon: '⚠️', title: 'Copyright strike', text: 'One of my videos got a copyright claim. YouTube is sending its ad money to someone else.', choices: [
      { label: 'Dispute the claim', run: function () { if (U.chance(0.5)) return good('I won the dispute. The claim was bogus.'); ch().subs = Math.round(ch().subs * 0.98); return bad('The dispute failed and I got a strike on my channel.'); } },
      { label: 'Take the video down', run: function () { ch().videos = Math.max(0, ch().videos - 1); return 'I deleted the video. Lesson learned about background music.'; } }
    ] };
  } });
  def('cr_convention', { cond: function () { return !!ch(); }, build: function () {
    var con = U.pick(['VidCon', 'TwitchCon', 'PAX', 'Creator Week']);
    return { icon: '🎪', title: con, text: con + ' invited me to a fan meet-and-greet. Travel is on me.', choices: [
      { label: 'Go (' + E.fmt(E.$(1500)) + ')', run: function () { E.addMoney(-E.$(1500)); var c = ch(), g = Math.round(c.subs * U.randf(0.03, 0.1)); c.subs += g; E.stat('happy', 12); E.fame(2); return good('I met hundreds of fans at ' + con + '. Someone cried. I cried. +' + big(g) + ' ' + plat().unit + '.'); } },
      { label: 'Skip it', run: function () { return 'I skipped ' + con + ' this year.'; } }
    ] };
  } });
  def('cr_buyout', { cond: function () { return !!ch(); }, build: function () {
    var c = ch(), offer = Math.round(c.subs * U.randf(1.5, 4) / 1000) * 1000;
    return { icon: '💼', title: 'Buyout offer', text: 'A media company wants to buy my channel and its whole back catalog for ' + E.fmt(E.$(offer)) + '.', choices: [
      { label: 'Sell the channel', run: function () { E.addMoney(E.$(offer)); S().channel = null; E.stat('happy', 15); return good('I sold my channel for ' + E.fmt(E.$(offer)) + '. Retirement looks good from here. 💰'); } },
      { label: 'Keep it', run: function () { E.stat('happy', 3); return 'I turned the offer down. This is my baby.'; } }
    ] };
  } });

  // ==================================================================
  // SIDE HUSTLES
  // ==================================================================
  function earn(base, text, cls) {
    var h = S().hustle || (S().hustle = { base: 0, n: 0 });
    // Hustle culture has a cost: past two gigs a year it starts to wear me down.
    var n = count('hs_total'); bump('hs_total');
    if (n >= 2) E.stat('happy', -3);
    if (n >= 4) E.stat('health', -2);
    var amt = E.$(base);
    E.addMoney(amt); h.base += base; h.n++;
    if (h.n >= 10) E.achieve('hustler');
    return done({ text: text.replace('$$', E.fmt(amt)), cls: cls || 'good' });
  }
  function owns(kind, test) { return S().assets.some(function (a) { return a.kind === kind && (!test || test(a)); }); }
  var HUSTLES = [
    { id: 'uber', icon: '🚗', name: 'Drive for Uber', min: 21, need: function () { return !S().flags.license ? 'I need a driver\'s license' : !owns('car', function (a) { return !/Jet|yacht/i.test(a.type); }) ? 'I need a car' : ''; },
      run: function () {
        var r = U.rand(1, 100);
        if (r <= 6) { E.stat('health', -12); E.addMoney(-E.$(1500)); return done(bad('A driver ran a red light and hit me mid-ride. I paid ' + E.fmt(E.$(1500)) + ' for repairs.')); }
        if (r <= 18) return earn(U.rand(1000, 3500), 'A passenger threw up in my back seat, but cleaning fees helped. I made $$ driving for Uber. 🤢');
        if (r <= 25) return earn(U.rand(2500, 6000), 'A rider turned out to be a famous musician and tipped $500. I made $$ driving for Uber. 🌟');
        return earn(U.rand(1500, 6000), 'I drove for Uber on nights and weekends and made $$.');
      } },
    { id: 'doordash', icon: '🛵', name: 'Deliver for DoorDash', min: 18, run: function () {
        if (U.chance(0.08)) { E.stat('happy', -5); return earn(U.rand(300, 900), 'A customer reported their food "never arrived" (I watched them take it). I still made $$ on DoorDash.', ''); }
        return earn(U.rand(800, 3500), 'I delivered burritos and bubble tea all over town for DoorDash and made $$.');
      } },
    { id: 'freelance', icon: '💻', name: 'Freelance on Fiverr', min: 16, run: function () {
        var best = ['coding', 'writing', 'painting'].reduce(function (a, k) { return skill(k) > skill(a) ? k : a; }, 'coding');
        var lv = skill(best), work = { coding: 'building websites', writing: 'writing blog posts', painting: 'designing logos' }[best];
        if (U.chance(0.12)) { E.stat('happy', -6); return done(bad('A client ghosted me after I delivered the work. I never got paid. 😤')); }
        return earn(Math.round(200 + lv * U.rand(20, 70) + me().smarts * 5), 'I picked up gigs on Fiverr ' + work + ' and made $$.');
      } },
    { id: 'sneakers', icon: '👟', name: 'Resell sneakers', min: 16, cost: 600, run: function () {
        var stake = E.$(600);
        if (S().money < stake) return done(nope('I need ' + E.fmt(stake) + ' to buy a few pairs to flip.'));
        E.addMoney(-stake);
        var roi = U.pick([-0.6, -0.3, 0, 0.2, 0.5, 0.8, 1.2, 2.5]), back = Math.round(600 * (1 + roi));
        if (roi <= 0) { var h = S().hustle || (S().hustle = { base: 0, n: 0 }); h.n++; E.addMoney(E.$(back)); return done(bad('The hype died before I could flip my Jordans on StockX. I got back ' + E.fmt(E.$(back)) + '.')); }
        return earn(back, roi >= 1 ? 'I copped a limited drop and flipped it on StockX for $$. 🔥' : 'I flipped a few pairs on StockX for $$.');
      } },
    { id: 'rover', icon: '🐕', name: 'Walk dogs on Rover', min: 14, run: function () {
        if (U.chance(0.07)) { E.stat('health', -6); return earn(U.rand(150, 400), 'A chihuahua bit me. Still, I made $$ walking dogs on Rover. 🐕'); }
        E.stat('happy', 3); E.stat('health', 1);
        return earn(U.rand(300, 1500), 'I walked dogs around the neighborhood on Rover and made $$. Best job ever. 🐶');
      } },
    { id: 'tutor', icon: '📚', name: 'Tutor students', min: 16, need: function () { return me().smarts < 60 ? 'I need 60+ smarts' : ''; }, run: function () {
        return earn(Math.round(me().smarts * U.rand(8, 30)), 'I tutored high schoolers in math and made $$. One got into their dream school. 🎓');
      } },
    { id: 'airbnb', icon: '🏠', name: 'Host on Airbnb', min: 18, need: function () { return !owns('house', function (a) { return !a.rented; }) ? 'I need a home I own' : ''; }, run: function () {
        if (U.chance(0.1)) { var dmg = E.$(U.rand(1500, 6000)); E.addMoney(-dmg); return done(bad('Guests threw a party in my place and trashed it. I paid ' + E.fmt(dmg) + ' in damage.')); }
        return earn(U.rand(2000, 8000), 'I rented out my spare room on Airbnb and made $$. Mostly five-star reviews. ⭐');
      } },
    { id: 'garage', icon: '🏷️', name: 'Have a garage sale', min: 18, run: function () {
        if (U.chance(0.04)) return earn(U.rand(2000, 6000), 'Someone recognized an old painting as valuable and bought it for $$! 🖼️');
        return earn(U.rand(50, 400), 'I sold old junk on the front lawn and made $$.');
      } }
  ];
  function hustleMenu() {
    ui().menu('Side hustles', function () {
      var a = me().age, h = S().hustle || { base: 0, n: 0 }, items = [];
      items.push({ info: true, html: '<p class="muted">Extra cash on the side. Each hustle once a year.' + (h.n ? ' Earned so far: <b>' + E.fmt(E.$(h.base)) + '</b>.' : '') + '</p>' });
      HUSTLES.forEach(function (x) {
        if (a < x.min - 2) return;
        var why = a < x.min ? 'Age ' + x.min + '+' : x.need ? x.need() : '', usedUp = count('hs_' + x.id) > 0;
        items.push({ icon: x.icon, label: x.name, sub: why || (usedUp ? 'Done this year' : ''), right: x.cost && !why && !usedUp ? E.fmt(E.$(x.cost)) : '', disabled: !!why || usedUp, onClick: function () { bump('hs_' + x.id); x.run(); } });
      });
      return items;
    });
  }

  // ==================================================================
  // CRYPTO
  // ==================================================================
  // price: starting base-dollar price; vol: yearly swing; the meme coin can rug.
  var COINS = [
    { sym: 'BTC', name: 'Bitcoin', icon: '🟠', price: 65000, vol: 0.45, g: 0.04 },
    { sym: 'ETH', name: 'Ethereum', icon: '🔷', price: 3200, vol: 0.6, g: 0.03 },
    { sym: 'SOL', name: 'Solana', icon: '🟣', price: 150, vol: 0.75, g: 0.02 },
    { sym: 'DOGE', name: 'Dogecoin', icon: '🐕', price: 0.15, vol: 0.9, g: 0 }
  ];
  var MEMES = ['PEPE', 'BONK', 'WIF', 'FLOKI', 'SHIB', 'MOON', 'TURBO', 'MOG'];
  function wallet() {
    var w = S().crypto;
    if (!w) {
      w = S().crypto = { hold: {}, price: {}, phase: U.rand(0, 3), meme: null, paid: 0 };
      COINS.forEach(function (c) { w.price[c.sym] = c.price * U.randf(0.6, 1.4); });
    }
    return w;
  }
  function coins() { var w = wallet(), list = COINS.slice(); if (w.meme) list.push({ sym: w.meme, name: '$' + w.meme + ' (meme coin)', icon: '🐸', vol: 1.8, meme: true }); return list; }
  function value(sym) { var w = S().crypto; return w && w.hold[sym] ? cash(w.hold[sym] * w.price[sym]) : 0; }
  function cryptoValue() { var w = S() && S().crypto; if (!w) return 0; var t = 0; Object.keys(w.hold).forEach(function (k) { t += value(k); }); return t; }
  function fmtPrice(usd) { var v = usd * E.k(); return v >= 100 ? E.fmt(Math.round(v)) : E.country().cur + v.toFixed(v < 0.01 ? 6 : v < 1 ? 4 : 2); }
  function buy(c) {
    var w = wallet(), opts = [100, 1000, 10000, 100000].filter(function (b) { return E.$(b) <= S().money; }).map(function (b) {
      return { label: 'Buy ' + E.fmt(E.$(b)), fn: function () { trade(c, E.$(b)); } };
    });
    if (S().money > 0) opts.push({ label: 'Go all in (' + E.fmt(S().money) + ')', fn: function () { trade(c, S().money); } });
    var held = w.hold[c.sym] || 0;
    if (held > 0) {
      opts.push({ label: 'Sell half (' + E.fmt(Math.round(value(c.sym) / 2)) + ')', fn: function () { sell(c, 0.5); } });
      opts.push({ label: 'Sell all (' + E.fmt(value(c.sym)) + ')', fn: function () { sell(c, 1); } });
    }
    if (!opts.length) return done(nope('I don\'t have any money to invest.'));
    ui().choose(c.icon + ' ' + c.name, '1 ' + c.sym + ' = ' + fmtPrice(w.price[c.sym]) + (held ? ' · I hold ' + E.fmt(value(c.sym)) + ' worth.' : ''), opts);
  }
  function trade(c, amt) {
    var w = wallet();
    amt = Math.min(amt, S().money);
    if (amt <= 0) return;
    E.addMoney(-amt);
    w.hold[c.sym] = (w.hold[c.sym] || 0) + amt / E.k() / w.price[c.sym];
    w.paid += amt / E.k();
    done('I bought ' + E.fmt(amt) + ' of ' + c.name + '. ' + (c.meme ? 'To the moon? 🚀' : '📈'));
  }
  function sell(c, frac) {
    var w = wallet(), got = Math.round(value(c.sym) * frac);
    w.hold[c.sym] = (w.hold[c.sym] || 0) * (1 - frac);
    if (frac >= 1 || w.hold[c.sym] * w.price[c.sym] < 0.5) delete w.hold[c.sym];
    E.addMoney(got);
    done('I sold ' + (frac >= 1 ? 'all my' : 'half my') + ' ' + c.name + ' for ' + E.fmt(got) + '.');
  }
  function cryptoMenu() {
    wallet();
    ui().menu('Crypto', function () {
      var w = wallet(), total = cryptoValue(), items = [];
      var cyc = ['🐂 Bull market', '📉 Correction', '🐻 Crypto winter', '🌱 Recovery'][w.phase % 4];
      items.push({ info: true, html: '<div class="kv">Wallet value: <b>' + E.fmt(total) + '</b><br><span class="muted">' + cyc + '. Prices swing wildly; never invest more than I can lose.</span></div>' });
      coins().forEach(function (c) {
        var held = value(c.sym), chg = w.last && w.last[c.sym] ? (w.price[c.sym] / w.last[c.sym] - 1) * 100 : null;
        items.push({ icon: c.icon, label: c.name, sub: fmtPrice(w.price[c.sym]) + (chg != null ? ' · ' + (chg >= 0 ? '+' : '') + Math.round(chg) + '% this year' : '') + (held ? ' · hold ' + E.fmt(held) : ''), onClick: function () { buy(c); } });
      });
      return items;
    });
  }
  // Four-year boom/bust cycle, like the real market around each Bitcoin halving.
  function yearlyCrypto() {
    var w = S().crypto;
    if (!w) return;
    var drift = [0.55, -0.15, -0.5, 0.25][w.phase % 4];
    w.phase++;
    w.last = {};
    coins().forEach(function (c) {
      w.last[c.sym] = w.price[c.sym];
      var r = drift * (c.vol / 0.6) + U.gauss(0, c.vol * 0.5);
      // Booms and busts swing around a slowly rising fair value, so decades of
      // random walk can't turn Dogecoin into a $400 coin. Meme coins drift back
      // toward where they launched.
      var fair = c.meme ? (w.memeAt || w.price[c.sym]) * 5 : c.price * Math.exp(c.g * w.phase);
      r -= (c.meme ? 0.35 : 0.3) * Math.log(w.price[c.sym] / fair);
      w.price[c.sym] = Math.max(c.meme ? 1e-7 : 0.001, w.price[c.sym] * Math.exp(U.clamp(r, -2.5, 1.8)));
    });
    // Meme coins come and go; some get rugged.
    if (w.meme) {
      var held = !!w.hold[w.meme];
      if (U.chance(0.3)) {
        if (held) E.log('🪤 The developers of $' + w.meme + ' pulled the rug. My meme coins are worthless.', 'bad');
        delete w.hold[w.meme]; delete w.price[w.meme]; w.meme = null;
      }
    }
    if (!w.meme && U.chance(0.5)) { w.meme = U.pick(MEMES); w.price[w.meme] = w.memeAt = U.randf(0.000001, 0.01); }
    var total = cryptoValue();
    if (total >= E.$(1e6)) E.achieve('whale');
    if (total > 0 && U.chance(0.03)) S().pending.push({ id: 'cr_hack', data: {} });
  }
  def('cr_hack', { cond: function () { return cryptoValue() > 0; }, build: function () {
    return { icon: '🏴‍☠️', title: 'Exchange hacked', text: 'The crypto exchange I use was hacked overnight. Withdrawals are frozen.', choices: [
      { label: 'Wait it out', run: function () { var w = wallet(); if (U.chance(0.5)) return good('The exchange made everyone whole. Phew.'); Object.keys(w.hold).forEach(function (k) { w.hold[k] *= 0.6; }); E.stat('happy', -10); return bad('The exchange only recovered 60% of my coins.'); } },
      { label: 'Panic and post about it', run: function () { var w = wallet(); Object.keys(w.hold).forEach(function (k) { w.hold[k] *= 0.7; }); E.stat('happy', -6); return bad('I ranted online for days. I still lost 30% of my coins.'); } }
    ] };
  } });

  // ==================================================================
  // HOOKS
  // ==================================================================
  function yearly() {
    if (!S() || S().dead) return;
    yearlyChannel();
    yearlyCrypto();
  }
  function aboutRows() {
    var rows = [], c = ch();
    if (c) rows.push([plat(c).icon + ' Channel', handle() + ' · ' + big(c.subs) + ' ' + plat(c).unit]);
    var cv = cryptoValue();
    if (cv) rows.push(['🪙 Crypto', E.fmt(cv)]);
    if (S().hustle && S().hustle.n) rows.push(['💼 Side hustles', E.fmt(E.$(S().hustle.base)) + ' earned']);
    return rows;
  }
  function summary() {
    var c = ch();
    return c ? plat(c).name + ' · ' + big(c.subs) + ' ' + plat(c).unit : 'Start a channel';
  }
  return { menu: menu, hustleMenu: hustleMenu, cryptoMenu: cryptoMenu, cryptoValue: cryptoValue, yearly: yearly, title: title, aboutRows: aboutRows, summary: summary, PLATFORMS: PLATFORMS, NICHES: NICHES };
})();
