/* TheLife — v1.20: running a business. Each business has revenue, costs,
 * staff, locations, a price tier, quality and a star rating from customers.
 * You set prices, hire and lay off staff, invest in quality, market it and
 * open (or close) locations. Tech startups instead burn cash, raise funding
 * rounds that dilute your stake, and either fold, get acquired or go public.
 * State lives on the business asset (kind 'business'); money on the asset is
 * in local currency, and the per-type economics below are in base dollars. */
TL.business = (function () {
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

  // rev: yearly revenue for one location at 3 stars and standard prices;
  // cogs: share of revenue spent on goods; rent per location; staff per
  // location and their yearly wage; mult: what buyers pay per $1 of profit.
  var TYPES = {
    'Food Truck': { rev: 180000, cogs: 0.35, rent: 10000, staff: 2, wage: 30000, mult: 2.5, icon: '🚚', noun: 'truck' },
    'Coffee Shop': { rev: 450000, cogs: 0.3, rent: 60000, staff: 6, wage: 28000, mult: 3, icon: '☕', noun: 'café' },
    'Gym': { rev: 560000, cogs: 0.1, rent: 150000, staff: 8, wage: 35000, mult: 3.5, icon: '🏋️', noun: 'gym' },
    'Restaurant': { rev: 1150000, cogs: 0.32, rent: 150000, staff: 18, wage: 32000, mult: 3, icon: '🍽️', noun: 'restaurant' },
    'Clothing Brand': { rev: 520000, cogs: 0.45, rent: 30000, staff: 5, wage: 40000, mult: 3.5, icon: '👕', noun: 'store' },
    'Car Dealership': { rev: 8000000, cogs: 0.85, rent: 300000, staff: 15, wage: 45000, mult: 3.5, icon: '🚗', noun: 'dealership' },
    'Nightclub': { rev: 1600000, cogs: 0.25, rent: 250000, staff: 25, wage: 30000, mult: 2.5, icon: '🪩', noun: 'club' },
    'Hotel': { rev: 4000000, cogs: 0.2, rent: 0, staff: 60, wage: 35000, mult: 5, icon: '🏨', noun: 'hotel' },
    'Tech Startup': { startup: true, icon: '🚀', noun: 'office' }
  };
  // [label, price multiplier, customer multiplier, the quality customers expect]
  var TIERS = { budget: ['Budget', 0.75, 1.25, 40], standard: ['Standard', 1, 1, 50], premium: ['Premium', 1.45, 0.75, 62] };
  var ROUNDS = ['Seed', 'Series A', 'Series B', 'Series C', 'Series D'];

  function T(a) { return TYPES[a.type] || TYPES['Coffee Shop']; }
  function stars(a) { return Math.max(1, Math.min(5, Math.round((a.rep || 50) / 20 * 2) / 2)); }
  function starText(a) { var s = stars(a), full = Math.floor(s); return '★★★★★'.slice(0, full) + (s % 1 ? '½' : '') + ' ' + s.toFixed(1); }
  // Give older saves (and brand-new businesses) the fields this needs.
  function init(a) {
    if (a.biz) return a;
    var t = T(a);
    a.biz = 1; a.rep = a.rep || 50; a.quality = a.quality || 50; a.tier = a.tier || 'standard'; a.locations = a.locations || 1;
    a.history = a.history || [];
    if (t.startup) { a.share = a.share || 1; a.round = a.round || 0; a.users = a.users || 0; a.burn = a.burn || 0; a.stage = a.stage || 'building'; }
    else a.staff = a.staff != null ? a.staff : t.staff;
    return a;
  }
  function need(a) { return T(a).staff * a.locations; }

  // ------------------------------------------------------------ the year
  // Returns the year's profit (negative = the owner covers the loss).
  function year(a) {
    init(a);
    var t = T(a);
    if (t.startup) return startupYear(a);
    var tier = TIERS[a.tier], staffRatio = Math.min(1.2, a.staff / Math.max(1, need(a)));
    // Customers follow stars; price tier changes both traffic and ticket size.
    var demand = (0.55 + a.rep / 110) * tier[2] * (1 + (a.hype || 0) * 0.04) * U.randf(0.88, 1.12) * Math.min(1, 0.4 + staffRatio * 0.6);
    // Thin-margin businesses (car lots) can only move prices a little.
    var room = Math.min(1, (1 - t.cogs) * 1.6), price = 1 + (tier[1] - 1) * room;
    var goods = 1 + ((a.tier === 'premium' ? 1.15 : a.tier === 'budget' ? 0.9 : 1) - 1) * room;
    var rev = t.rev * a.locations * demand * price;
    var cost = t.rev * a.locations * demand * t.cogs * goods + t.rent * a.locations + a.staff * t.wage * (a.tier === 'premium' ? 1.1 : a.tier === 'budget' ? 0.92 : 1);
    var profit = Math.round(rev - cost);
    // Reputation settles toward what customers get for what they pay.
    a.quality = U.clamp(Math.round(a.quality + (staffRatio < 0.8 ? -6 : staffRatio > 1.05 ? 2 : 0) + U.rand(-3, 2) - (S().job && !S().job.partTime ? 1 : 0)), 5, 100);
    var target = U.clamp(50 + (a.quality - tier[3]) * 1.2, 0, 100);
    a.rep = U.clamp(Math.round(a.rep + (target - a.rep) * 0.35 + U.rand(-4, 4)), 0, 100);
    a.hype = 0;
    a.lastRev = E.$(Math.round(rev)); a.lastProfit = E.$(profit);
    a.history.push({ year: S().year, rev: a.lastRev, profit: a.lastProfit, stars: stars(a) });
    if (a.history.length > 12) a.history.shift();
    // Valuation: a multiple of recent profit, with a floor for the fixtures.
    var recent = a.history.slice(-3).reduce(function (s, h) { return s + h.profit; }, 0) / Math.min(3, a.history.length);
    a.value = Math.max(E.$(Math.round(t.rev * a.locations * 0.08)), Math.round(recent * t.mult * (0.8 + a.rep / 250)));
    // Three bad years in a row with no cushion: the doors close.
    a.losing = profit < 0 ? (a.losing || 0) + 1 : 0;
    if (a.losing >= 3 && U.chance(0.4)) a.bankrupt = true;
    if (a.locations >= 5) E.achieve('franchise');
    if (stars(a) >= 5) E.achieve('five_stars');
    events(a);
    return a.lastProfit;
  }
  function startupYear(a) {
    var s = S();
    if (a.stage === 'public') { a.value = Math.round(a.value * Math.exp(U.gauss(0.07, 0.3))); a.valuation = Math.round(a.value / Math.max(0.01, a.share)); return 0; }
    if (a.stage === 'acquired') return 0;
    // Users grow with product quality; revenue follows users; the team burns cash.
    a.quality = U.clamp(Math.round(a.quality + U.rand(-5, 5) + (me().smarts - 60) / 25 + (s.skills && s.skills.coding ? s.skills.coding / 40 : 0)), 5, 100);
    // Growth slows as the user base gets big.
    var growth = U.gauss(0.6 + (a.quality - 50) / 60 - Math.max(0, Math.log(Math.max(a.users, 1) / 1e4) / Math.LN10) * 0.4, 0.7);
    a.users = Math.max(0, Math.round(Math.max(a.users, 500) * Math.exp(U.clamp(growth, -1.5, 2.2))));
    var rev = a.users * U.randf(2, 8), burn = 250000 * (1 + a.round * 1.4);
    var profit = Math.round(rev - burn);
    a.lastRev = E.$(Math.round(rev)); a.lastProfit = E.$(Math.min(0, profit) * a.share * 0.3);
    a.history.push({ year: s.year, rev: a.lastRev, profit: a.lastProfit, users: a.users });
    if (a.history.length > 12) a.history.shift();
    var val = Math.max(rev * U.randf(6, 14), a.users * U.randf(15, 60));
    a.valuation = E.$(Math.round(val)); a.value = Math.round(a.valuation * a.share);
    if (E.$(val) >= E.$(1e9)) E.achieve('unicorn');
    // A strong year brings investors; a collapse can kill it.
    if (growth < -0.8 && a.round >= 1 && U.chance(0.5)) { a.bankrupt = true; return a.lastProfit; }
    if (a.round < ROUNDS.length && growth > 0.2 && U.chance(0.45)) s.pending.push({ id: 'biz_round', data: { id: a.id } });
    else if (a.round >= 2 && val > 3e8 && U.chance(0.3)) s.pending.push({ id: 'biz_exit', data: { id: a.id } });
    return a.lastProfit;
  }

  // ------------------------------------------------------------ events
  function events(a) {
    var s = S(), t = T(a);
    if (s.prison || !U.chance(0.4)) return;
    var food = /Food|Coffee|Restaurant/.test(a.type);
    var pool = [['biz_review', 3], ['biz_theft', 2], ['biz_competitor', 2], ['biz_buyout', a.value > E.$(200000) ? 2 : 0], ['biz_inspection', food ? 3 : 0], ['biz_lawsuit', 1], ['biz_franchise', a.locations >= 3 && a.rep >= 70 ? 2 : 0]];
    var pick = U.weighted(pool.filter(function (p) { return p[1]; }).map(function (p) { return { w: p[1], id: p[0] }; }));
    if (pick) s.pending.push({ id: pick.id, data: { id: a.id } });
  }
  function biz(d) { var a = S().assets.filter(function (x) { return x.id === d.id && x.kind === 'business'; })[0]; return a ? init(a) : null; }
  function alive(d) { return !!biz(d || {}); }
  def('biz_review', { cond: function () { return true; }, build: function (d) {
    var a = biz(d); if (!a) return null;
    var critic = U.pick(['a food critic', 'a famous influencer', 'a local news segment', 'a viral TikTok reviewer']);
    var good2 = U.chance(0.35 + a.quality / 200);
    return { icon: good2 ? '⭐' : '😬', title: good2 ? 'Great review' : 'Bad review', text: U.cap(critic) + (good2 ? ' raved about ' : ' trashed ') + a.name + '.', choices: [
      good2 ? { label: 'Share it everywhere', run: function () { a.rep = Math.min(100, a.rep + 12); a.hype = (a.hype || 0) + 4; return good(a.name + ' is the talk of the town. ⭐'); } }
            : { label: 'Respond politely and fix it', run: function () { a.rep = Math.max(0, a.rep - 3); a.quality = Math.min(100, a.quality + 6); return 'I owned the mistakes and fixed them. Customers noticed.'; } },
      good2 ? { label: 'Stay humble', run: function () { a.rep = Math.min(100, a.rep + 7); return 'The review brought in a wave of new customers.'; } }
            : { label: 'Fire back online', run: function () { if (U.chance(0.25)) { a.hype = (a.hype || 0) + 3; return 'My clapback went viral. Somehow it helped.'; } a.rep = Math.max(0, a.rep - 15); return bad('Arguing with the reviewer made it so much worse.'); } }
    ] };
  } });
  def('biz_inspection', { build: function (d) {
    var a = biz(d); if (!a) return null;
    var pass = U.chance(0.45 + a.quality / 160 + Math.min(0.15, a.staff / Math.max(1, need(a)) / 7));
    return { icon: '🧑‍⚕️', title: 'Health inspection', text: 'A health inspector showed up unannounced at ' + a.name + '.', choices: [
      { label: 'Let them look around', run: function () { if (pass) { a.rep = Math.min(100, a.rep + 3); return good('We passed with an A. 🅰️'); } a.rep = Math.max(0, a.rep - 12); E.addMoney(-E.$(5000)); return bad('We failed and were fined ' + E.fmt(E.$(5000)) + '. The grade is posted in the window.'); } },
      { label: 'Offer them a free meal', run: function () { if (U.chance(0.5)) return 'They politely declined and inspected anyway. We scraped by.'; E.karma(-5); a.rep = Math.max(0, a.rep - 20); E.addMoney(-E.$(15000)); return bad('Trying to bribe an inspector was a terrible idea. Big fine, worse headlines.'); } }
    ] };
  } });
  def('biz_theft', { build: function (d) {
    var a = biz(d); if (!a) return null;
    var lost = E.$(U.rand(3, 25) * 1000);
    return { icon: '🕵️', title: 'Employee theft', text: 'The books don\'t add up at ' + a.name + '. Someone on staff has been skimming about ' + E.fmt(lost) + '.', choices: [
      { label: 'Fire them and press charges', run: function () { E.addMoney(-Math.round(lost / 2)); a.staff = Math.max(0, a.staff - 1); return 'I fired them and got half the money back in court.'; } },
      { label: 'Give them a second chance', run: function () { E.addMoney(-lost); E.karma(4); return U.chance(0.5) ? 'They paid it back over time and became my most loyal employee.' : bad('They did it again. Lesson learned.'); } }
    ] };
  } });
  def('biz_competitor', { build: function (d) {
    var a = biz(d); if (!a) return null;
    var rival = U.pick(['a big chain', 'a trendy new spot', 'a cheaper rival', 'a well-funded competitor']);
    return { icon: '🥊', title: 'New competition', text: U.cap(rival) + ' opened right across the street from ' + a.name + '.', choices: [
      { label: 'Cut prices to compete', run: function () { a.tier = 'budget'; a.hype = (a.hype || 0) + 2; return 'I cut prices. Margins are thinner, but customers stayed.'; } },
      { label: 'Double down on quality', run: function () { var c = Math.round(a.value * 0.05 + E.$(10000)); E.addMoney(-c); a.quality = Math.min(100, a.quality + 12); return 'I invested ' + E.fmt(c) + ' in quality. Let them try to match it.'; } },
      { label: 'Ignore them', run: function () { a.rep = Math.max(0, a.rep - U.rand(0, 10)); return 'I kept doing what I do. Some regulars drifted away.'; } }
    ] };
  } });
  def('biz_lawsuit', { build: function (d) {
    var a = biz(d); if (!a) return null;
    var amt = E.$(U.rand(20, 200) * 1000);
    return { icon: '⚖️', title: 'Lawsuit', text: 'A customer is suing ' + a.name + ' for ' + E.fmt(amt) + ' after a slip and fall.', choices: [
      { label: 'Settle quietly (' + E.fmt(Math.round(amt * 0.3)) + ')', run: function () { E.addMoney(-Math.round(amt * 0.3)); return 'I settled. Not worth the headache.'; } },
      { label: 'Fight it in court', run: function () { E.addMoney(-E.$(15000)); if (U.chance(0.6)) return good('We won in court. Legal fees still stung.'); E.addMoney(-amt); a.rep = Math.max(0, a.rep - 6); return bad('We lost. I owe ' + E.fmt(amt) + '.'); } }
    ] };
  } });
  def('biz_buyout', { build: function (d) {
    var a = biz(d); if (!a) return null;
    var offer = Math.round(a.value * U.randf(1.1, 1.6));
    return { icon: '💼', title: 'Buyout offer', text: 'A group of investors wants to buy ' + a.name + ' for ' + E.fmt(offer) + '.', choices: [
      { label: 'Sell it', run: function () { E.addMoney(offer); S().assets = S().assets.filter(function (x) { return x !== a; }); E.stat('happy', 10); return good('I sold ' + a.name + ' for ' + E.fmt(offer) + '. 💰'); } },
      { label: 'Not for sale', run: function () { return 'I turned them down. ' + a.name + ' is my baby.'; } }
    ] };
  } });
  def('biz_franchise', { build: function (d) {
    var a = biz(d); if (!a) return null;
    var fee = Math.round(a.value * 0.25);
    return { icon: '🗺️', title: 'Franchise request', text: 'Entrepreneurs in other cities want to open their own ' + a.name + ' locations as franchisees.', choices: [
      { label: 'Sell franchise rights (' + E.fmt(fee) + ')', run: function () { E.addMoney(fee); a.rep = Math.max(0, a.rep - 4); a.locations += 2; a.staff += T(a).staff * 2; return good('Two franchise locations are opening under the ' + a.name + ' name. 🗺️'); } },
      { label: 'Keep it in-house', run: function () { return 'I kept full control of the brand.'; } }
    ] };
  } });
  def('biz_round', { build: function (d) {
    var a = biz(d); if (!a || a.round >= ROUNDS.length) return null;
    var name = ROUNDS[a.round], raise = Math.round(a.valuation * U.randf(0.15, 0.3) / 1000) * 1000, dil = U.randf(0.12, 0.22);
    var vc = U.pick(['Sequoia', 'Andreessen Horowitz', 'Accel', 'Benchmark', 'Y Combinator', 'Tiger Global', 'SoftBank']);
    return { icon: '💸', title: name + ' round', text: vc + ' wants to lead a ' + E.fmt(raise) + ' ' + name + ' round for ' + Math.round(dil * 100) + '% of ' + a.name + ' (valued at ' + E.fmt(a.valuation) + ').', choices: [
      { label: 'Take the money', run: function () { a.round++; a.share = a.share * (1 - dil); a.quality = Math.min(100, a.quality + 10); return good('We closed our ' + name + '. I own ' + Math.round(a.share * 100) + '% now. 🚀'); } },
      { label: 'Bootstrap instead', run: function () { a.quality = Math.max(5, a.quality - 4); return 'I kept my equity and stayed lean.'; } }
    ] };
  } });
  def('biz_exit', { build: function (d) {
    var a = biz(d); if (!a) return null;
    var buyer = U.pick(['Google', 'Microsoft', 'Apple', 'Meta', 'Amazon', 'Salesforce', 'Adobe']), price = Math.round(a.valuation * U.randf(1.1, 1.5));
    return { icon: '🔔', title: 'Exit time', text: buyer + ' offered to acquire ' + a.name + ' for ' + E.fmt(price) + '. Bankers also say we could go public.', choices: [
      { label: 'Sell to ' + buyer, run: function () { var mine = Math.round(price * a.share); E.addMoney(mine); a.stage = 'acquired'; S().assets = S().assets.filter(function (x) { return x !== a; }); E.stat('happy', 20); E.fame(5); return good(buyer + ' acquired ' + a.name + '. My stake was worth ' + E.fmt(mine) + '. 🎉'); } },
      { label: 'Ring the bell: IPO', run: function () { var pop = U.randf(0.6, 1.8), mine = Math.round(a.valuation * pop * a.share * 0.25); E.addMoney(mine); a.share *= 0.75; a.stage = 'public'; a.value = Math.round(a.valuation * pop * a.share); E.fame(8); E.achieve('ipo'); return pop >= 1 ? good(a.name + ' went public and soared on day one. I cashed out ' + E.fmt(mine) + ' and still own ' + Math.round(a.share * 100) + '%. 🔔') : bad(a.name + '\'s IPO flopped, but I still cashed out ' + E.fmt(mine) + '.'); } },
      { label: 'Keep building', run: function () { return 'I\'m not done building. The best is yet to come.'; } }
    ] };
  } });

  // ------------------------------------------------------------ menu
  function card(a) {
    var t = T(a), h = a.history || [];
    // Startups chart revenue (it's what investors watch); everything else charts profit.
    var key = t.startup ? 'rev' : 'profit', spark = h.slice(-8), max = Math.max.apply(null, spark.map(function (x) { return Math.abs(x[key]); }).concat([1]));
    var bars = spark.map(function (x) { return '<i class="' + (x[key] < 0 ? 'neg' : '') + '" style="height:' + Math.max(6, Math.round(Math.abs(x[key]) / max * 100)) + '%"></i>'; }).join('');
    var top = '<div class="bz-top"><span class="bz-ico">' + t.icon + '</span><div><div class="bz-name">' + U.esc(a.name) + '</div><div class="bz-sub">' + U.esc(a.type) + (t.startup ? ' · ' + (a.stage === 'public' ? 'Public company' : a.round ? ROUNDS[a.round - 1] : 'Pre-seed') + ' · I own ' + Math.round(a.share * 100) + '%' : ' · <span class="bz-stars">' + starText(a) + '</span>') + '</div></div></div>';
    var stats = t.startup
      ? cell('Users', (a.users || 0).toLocaleString()) + cell('Revenue', E.fmt(a.lastRev || 0)) + cell('Valuation', E.fmt(a.valuation || a.value)) + cell('My stake', E.fmt(a.value))
      : cell('Revenue', E.fmt(a.lastRev || 0)) + cell('Profit', E.fmt(a.lastProfit || 0), (a.lastProfit || 0) < 0) + cell('Value', E.fmt(a.value)) + cell(U.plural(a.locations, 'location'), a.staff + '/' + need(a) + ' staff');
    return '<div class="bz-card">' + top + '<div class="nw-grid bz-grid">' + stats + '</div>' + (spark.length > 1 ? '<div class="bz-spark" aria-label="Profit history">' + bars + '</div><div class="bz-cap">' + (t.startup ? 'Revenue' : 'Profit') + ', last ' + spark.length + ' years</div>' : '<div class="bz-cap">First results come in at the end of the year.</div>') + '</div>';
  }
  function cell(l, v, neg) { return '<div><small>' + l + '</small><b' + (neg ? ' class="neg"' : '') + '>' + v + '</b></div>'; }
  function items(a) {
    init(a);
    var t = T(a), out = [{ info: true, html: card(a) }];
    if (t.startup) {
      if (a.stage === 'public' || a.stage === 'acquired') return out;
      out.push({ icon: '🧑‍💻', label: 'Ship a big update', sub: 'Better product, more users', disabled: count('bz_ship' + a.id) > 0, onClick: function () { bump('bz_ship' + a.id); a.quality = Math.min(100, a.quality + U.rand(4, 10)); E.stat('happy', -2); done('We shipped a big update. 🚢'); } });
      out.push({ icon: '📣', label: 'Launch campaign', right: E.fmt(E.$(50000)), disabled: count('bz_mkt' + a.id) > 0, onClick: function () { var c = E.$(50000); if (S().money < c) return done(nope('That costs ' + E.fmt(c) + '.')); bump('bz_mkt' + a.id); E.addMoney(-c); a.users = Math.round((a.users || 500) * U.randf(1.1, 1.6)); done('We launched on Product Hunt and ran ads. Users are pouring in. 📈'); } });
      if (a.round < ROUNDS.length) out.push({ icon: '💸', label: 'Pitch investors', sub: 'Next: ' + ROUNDS[a.round], disabled: count('bz_pitch' + a.id) > 0, onClick: function () { bump('bz_pitch' + a.id); if (U.chance(0.25 + a.quality / 200)) { S().pending.push({ id: 'biz_round', data: { id: a.id } }); ui().runPending(); return done('An investor wants in. Let\'s talk terms.'); } done(bad('Every VC passed. "Come back when you have more traction."')); } });
      return out;
    }
    out.push({ section: 'Run it' });
    out.push({ icon: '🏷️', label: 'Pricing', sub: TIERS[a.tier][0] + ' prices', onClick: function () {
      ui().choose('Pricing', 'Premium prices need high quality; budget prices bring crowds but thin margins.', Object.keys(TIERS).map(function (k) { return { label: (a.tier === k ? '✓ ' : '') + TIERS[k][0], fn: function () { a.tier = k; done('I switched ' + a.name + ' to ' + TIERS[k][0].toLowerCase() + ' pricing.'); } }; }));
    } });
    out.push({ icon: '🧑‍🍳', label: 'Staff', sub: a.staff + ' of ' + need(a) + ' needed' + (a.staff < need(a) * 0.8 ? ' · understaffed' : ''), onClick: function () {
      ui().choose('Staff', a.staff + ' employees. ' + need(a) + ' is fully staffed. Wages are ' + E.fmt(E.$(T(a).wage)) + ' each a year.', [
        { label: 'Hire 1', fn: function () { a.staff++; done('I hired a new employee.'); } },
        { label: 'Hire up to full staff', fn: function () { var n = Math.max(0, need(a) - a.staff); a.staff += n; done(n ? 'I hired ' + U.plural(n, 'person').replace('persons', 'people') + '.' : nope('We\'re already fully staffed.')); } },
        { label: 'Lay off 1', fn: function () { if (!a.staff) return done(nope('There\'s no one to lay off.')); a.staff--; a.quality = Math.max(5, a.quality - 2); E.karma(-1); done('I laid off an employee. Morale took a hit.'); } }
      ]);
    } });
    var up = E.$(Math.round(T(a).rev * a.locations * 0.04));
    out.push({ icon: '✨', label: 'Improve quality', sub: 'Training, equipment, renovation', right: E.fmt(up), disabled: count('bz_q' + a.id) > 0, onClick: function () { if (S().money < up) return done(nope('That costs ' + E.fmt(up) + '.')); bump('bz_q' + a.id); E.addMoney(-up); a.quality = Math.min(100, a.quality + U.rand(8, 14)); done(good('I invested in ' + a.name + '. Customers will notice. ✨')); } });
    var mk = E.$(Math.round(T(a).rev * a.locations * 0.02));
    out.push({ icon: '📣', label: 'Marketing campaign', right: E.fmt(mk), disabled: count('bz_mkt' + a.id) > 0, onClick: function () { if (S().money < mk) return done(nope('That costs ' + E.fmt(mk) + '.')); bump('bz_mkt' + a.id); E.addMoney(-mk); a.hype = (a.hype || 0) + U.rand(3, 6); done('I launched a marketing campaign for ' + a.name + '. 📣'); } });
    out.push({ section: 'Grow' });
    var open = Math.round((a.price || a.value) * 0.8);
    out.push({ icon: '📍', label: 'Open a new location', sub: 'Needs 4+ stars to go well', right: E.fmt(open), disabled: a.locations >= 20, onClick: function () {
      if (S().money < open) return done(nope('A new ' + T(a).noun + ' costs ' + E.fmt(open) + '.'));
      E.addMoney(-open); a.locations++; a.staff += T(a).staff;
      if (stars(a) < 4) a.rep = Math.max(0, a.rep - 6);
      done(good('Location #' + a.locations + ' of ' + a.name + ' is open! 📍'));
    } });
    if (a.locations > 1) out.push({ icon: '🔒', label: 'Close a location', sub: 'Cuts rent and staff', onClick: function () { a.locations--; a.staff = Math.max(0, a.staff - T(a).staff); E.addMoney(Math.round(open * 0.3)); done('I closed one of the ' + T(a).noun + 's and sold off the equipment.'); } });
    return out;
  }
  function summary(a) { init(a); return T(a).startup ? (a.stage === 'public' ? 'Public · ' : (a.users || 0).toLocaleString() + ' users · ') + 'stake ' + E.fmt(a.value) : starText(a) + ' · ' + U.plural(a.locations, 'location') + ' · profit ' + E.fmt(a.lastProfit || 0) + '/yr'; }
  return { year: year, items: items, summary: summary, init: init, TYPES: TYPES };
})();
