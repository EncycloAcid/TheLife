/* TheLife — v1.22: the stock market. Real companies plus an index fund and
 * a bond fund. Each year the whole market has a good or bad year (with the
 * occasional crash or boom) and every stock follows it by its beta, plus
 * its own company news. Stocks pay dividends, keep a price history, and
 * track what you paid so you can see your gains. You can auto-invest part
 * of your paycheck in the index fund. State: S.stocks (shares), S.prices,
 * S.mkt (history, cost basis, settings). */
TL.market = (function () {
  var U = TL.util, E = TL.engine, D = TL.data;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function def(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  function info(sym) { return D.STOCKS.filter(function (x) { return x.sym === sym; })[0]; }

  // Older saves: move fictional tickers to the real stocks at the same price.
  function st() {
    var s = S();
    if (!s.mkt) {
      s.mkt = { hist: [], basis: {}, ph: {}, auto: 0, realized: 0, divs: 0 };
      D.STOCKS.forEach(function (x) { if (!(s.prices[x.sym] > 0)) s.prices[x.sym] = Math.round(E.$(x.price) * 100) / 100; });
      // Whole shares of the new stock at today's price; the remainder comes back as cash.
      Object.keys(D.OLD_STOCKS).forEach(function (o) {
        var n = D.OLD_STOCKS[o], worth = (s.stocks[o] || 0) * (s.prices[o] || 0);
        if (worth > 0) { var sh = Math.floor(worth / s.prices[n]); s.stocks[n] = (s.stocks[n] || 0) + sh; s.money += Math.round(worth - sh * s.prices[n]); }
        delete s.stocks[o]; delete s.prices[o];
      });
      Object.keys(s.stocks).forEach(function (k) { if (!info(k) || !(s.stocks[k] > 0)) delete s.stocks[k]; else s.mkt.basis[k] = Math.round(s.stocks[k] * s.prices[k]); });
    }
    return s.mkt;
  }
  function held() { var s = S(); st(); return D.STOCKS.map(function (x) { return x.sym; }).filter(function (k) { return s.stocks[k] > 0; }); }
  function value(k) { var s = S(); return Math.round((s.stocks[k] || 0) * s.prices[k]); }
  function portfolio() { return held().reduce(function (t, k) { return t + value(k); }, 0); }
  function costBasis() { var m = st(); return held().reduce(function (t, k) { return t + (m.basis[k] || 0); }, 0); }
  function pct(x) { return (x >= 0 ? '+' : '−') + Math.abs(Math.round(x * 100)) + '%'; }
  function change(k) { var h = st().ph[k] || []; return h.length > 1 ? h[h.length - 1] / h[h.length - 2] - 1 : null; }

  // ------------------------------------------------------------ trading
  function buy(k, cash) {
    var s = S(), m = st(), price = s.prices[k], n = Math.floor(Math.max(0, cash) / price);
    if (!(n >= 1) || (TL.history && !TL.history.listed(k))) return 0;
    var cost = Math.round(n * price);
    E.addMoney(-cost); s.stocks[k] = (s.stocks[k] || 0) + n; m.basis[k] = (m.basis[k] || 0) + cost;
    return n;
  }
  function sell(k, n) {
    var s = S(), m = st(), have = s.stocks[k] || 0; n = Math.min(have, n);
    if (n <= 0) return 0;
    var got = Math.round(n * s.prices[k]), cost = Math.round((m.basis[k] || 0) * n / have);
    m.basis[k] = (m.basis[k] || 0) - cost; m.realized += got - cost;
    s.stocks[k] = have - n; if (!s.stocks[k]) { delete s.stocks[k]; delete m.basis[k]; }
    E.addMoney(got);
    return got;
  }
  function sellAll() { return held().reduce(function (t, k) { return t + sell(k, S().stocks[k]); }, 0); }

  // ------------------------------------------------------------ the year
  var GOOD = ['beat earnings expectations', 'launched a hit product', 'raised its forecast', 'won a huge contract', 'announced a stock buyback'];
  var BAD = ['missed earnings', 'got hit with a lawsuit', 'recalled a product', 'lost its CEO', 'warned of a slowdown'];
  // Called from engine.yearlyFinances; returns dividend income for the year.
  function year() {
    // Log returns, so the long-run median growth matches each stock's drift.
    var s = S(), m = st(), lr = U.gauss(0.085, 0.14), mood = null;
    if (U.chance(0.07)) { lr = U.randf(-0.5, -0.22); mood = 'crash'; }
    else if (U.chance(0.06)) { lr = U.randf(0.24, 0.34); mood = 'boom'; }
    // Historic years follow what really happened (1929, 2008, the '90s boom...).
    var forced = TL.history ? TL.history.marketYear(s.year) : null;
    if (forced != null) { lr = forced + U.gauss(0, 0.03); mood = forced <= -0.2 ? 'crash' : forced >= 0.24 ? 'boom' : null; }
    var r = Math.exp(lr) - 1;
    m.hist.push({ year: s.year, r: r }); if (m.hist.length > 12) m.hist.shift();
    var divs = 0, news = [];
    D.STOCKS.forEach(function (x) {
      var k = x.sym, p = s.prices[k] || E.$(x.price);
      // Companies only trade once they've gone public.
      if (TL.history && TL.history.ipoYear(k) === s.year) {
        s.prices[k] = Math.round(E.$(x.price) * U.randf(0.4, 0.8) * 100) / 100; m.ph[k] = [s.prices[k]];
        if (me().age >= 16) E.log('🔔 ' + x.name + ' went public on the stock market.');
        return;
      }
      if (TL.history && !TL.history.listed(k)) return;
      divs += Math.round((s.stocks[k] || 0) * p * x.div);
      var own = U.gauss(0, x.vol), ret = Math.max(-0.85, Math.exp(Math.log(1 + x.drift) - x.beta * 0.068 + x.beta * lr + own) - 1);
      s.prices[k] = Math.max(0.01 * E.k(), Math.round(p * (1 + ret) * 100) / 100);
      var h = m.ph[k] || (m.ph[k] = [p]); h.push(s.prices[k]); if (h.length > 11) h.shift();
      // Stock splits keep share prices in a normal range: more shares, same value.
      var base = E.$(x.price);
      if (s.prices[k] > base * 4) {
        var n = s.prices[k] > base * 20 ? 10 : 4;
        s.prices[k] = Math.round(s.prices[k] / n * 100) / 100; m.ph[k] = h.map(function (q) { return Math.round(q / n * 100) / 100; });
        if (s.stocks[k] > 0) { s.stocks[k] *= n; news.unshift(x.name + ' did a ' + n + '-for-1 stock split. I now own ' + s.stocks[k].toLocaleString() + ' shares.'); }
      }
      if (s.stocks[k] > 0 && Math.abs(own) > 0.18 && x.vol > 0.06) news.push(x.name + ' ' + U.pick(own > 0 ? GOOD : BAD) + '. ' + k + ' ' + pct(ret) + '.');
    });
    m.divs += divs;
    if (held().length) {
      news.slice(0, 2).forEach(function (t) { E.log('📰 ' + t); });
      if (mood) s.pending.push({ id: mood === 'crash' ? 'market_crash' : 'market_boom', data: { r: r } });
      if (portfolio() >= E.$(1e6)) E.achieve('market_millionaire');
    }
    return divs;
  }
  // Auto-invest a share of take-home pay in the index fund (after bills are paid).
  function autoInvest(net) {
    var m = st();
    if (!m.auto || !(net > 0) || S().money <= 0) return;
    var n = buy('VOO', Math.min(S().money, Math.round(net * m.auto)));
    if (n) S().flags.autoInvested = (S().flags.autoInvested || 0) + 1;
  }
  // Moving countries converts everything to the new currency.
  function convert(ratio) {
    var m = st();
    Object.keys(m.basis).forEach(function (k) { m.basis[k] = Math.round(m.basis[k] * ratio); });
    Object.keys(m.ph).forEach(function (k) { m.ph[k] = m.ph[k].map(function (p) { return Math.round(p * ratio * 100) / 100; }); });
    m.realized = Math.round(m.realized * ratio); m.divs = Math.round(m.divs * ratio);
  }

  // ------------------------------------------------------------ events
  def('market_crash', { build: function (d) {
    var r = (d && d.r) || -0.3;
    return { icon: '📉', title: 'Market crash', text: 'Stocks fell ' + Math.abs(Math.round(r * 100)) + '% this year. My portfolio is down to ' + E.fmt(portfolio()) + '.', choices: [
      { label: 'Panic sell everything', run: function () { var got = sellAll(); E.stat('happy', -4); return bad('I sold everything for ' + E.fmt(got) + '. At least the bleeding stopped.'); } },
      { label: 'Hold and wait it out', run: function () { E.stat('happy', -2); S().flags.heldCrash = true; return 'I held on. Markets recover… eventually.'; } },
      { label: 'Buy the dip', run: function () { var cash = Math.round(Math.max(0, S().money) * 0.25), n = buy('VOO', cash); if (!n) return 'I wanted to buy the dip, but I had no cash to spare.'; E.achieve('buy_the_dip'); return good('I bought ' + n + ' shares of the S&P 500 while everyone else panicked.'); } }
    ] };
  } });
  def('market_boom', { build: function (d) {
    var r = (d && d.r) || 0.3;
    return { icon: '📈', title: 'Bull market', text: 'Stocks soared ' + Math.round(r * 100) + '% this year. My portfolio is worth ' + E.fmt(portfolio()) + '.', choices: [
      { label: 'Take some profits', run: function () { var got = held().reduce(function (t, k) { return t + sell(k, Math.floor(S().stocks[k] / 2)); }, 0); E.stat('happy', 5); return good('I sold half my shares for ' + E.fmt(got) + '.'); } },
      { label: 'Let it ride', run: function () { E.stat('happy', 3); return 'I\'m letting my winners run.'; } }
    ] };
  } });

  // ------------------------------------------------------------ menus
  function logo(x) { return TL.logos && !/fund/i.test(x.name) ? TL.logos.badge(x.name) : x.sym === 'BND' ? '🏦' : '📊'; }
  function spark(h) {
    if (!h || h.length < 2) return '';
    var lo = Math.min.apply(null, h), hi = Math.max.apply(null, h), w = 300, ht = 56, up = h[h.length - 1] >= h[0];
    var pts = h.map(function (p, i) { return Math.round(i / (h.length - 1) * w) + ',' + Math.round(ht - 4 - (hi > lo ? (p - lo) / (hi - lo) : 0.5) * (ht - 8)); }).join(' ');
    return '<svg class="mk-spark ' + (up ? 'up' : 'down') + '" viewBox="0 0 ' + w + ' ' + ht + '" preserveAspectRatio="none"><polyline points="' + pts + '" fill="none" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
  }
  function gainCls(x) { return x >= 0 ? 'up' : 'down'; }
  function overview() {
    var m = st(), v = portfolio(), b = costBasis(), last = m.hist[m.hist.length - 1];
    var mood = !last ? 'The market moves once a year when you age up.' : last.r <= -0.2 ? 'Last year was a crash: the S&P 500 fell ' + pct(last.r).slice(1) + '.' : last.r >= 0.25 ? 'Last year was a boom: the S&P 500 rose ' + pct(last.r).slice(1) + '.' : 'The S&P 500 was ' + pct(last.r) + ' last year.';
    return '<div class="nw"><small>My portfolio</small><div class="nw-big">' + E.fmt(v) + '</div>' +
      (v ? '<div class="mk-gain ' + gainCls(v - b) + '">' + (v - b >= 0 ? '▲ ' : '▼ ') + E.fmt(Math.abs(v - b)) + ' (' + pct(b ? (v - b) / b : 0) + ') all time</div>' : '') +
      '<div class="nw-grid">' + cell('Cash', S().money) + cell('Dividends earned', m.divs) + cell('Realized gains', m.realized) + cell('Auto-invest', null, m.auto ? Math.round(m.auto * 100) + '% of pay' : 'Off') + '</div>' +
      '<div class="bz-cap">' + mood + '</div></div>';
  }
  function cell(l, v, txt) { return '<div><small>' + l + '</small><b' + (v < 0 ? ' class="neg"' : '') + '>' + (txt || (v < 0 ? '−' : '') + E.fmt(Math.abs(v))) + '</b></div>'; }
  function menu() {
    if (me().age < 18) return done(nope('I need to be 18 to invest.'));
    ui().menu('Stock market', function () {
      var s = S(), items = [{ info: true, html: overview() }], mine = held();
      if (mine.length) {
        items.push({ section: 'My stocks' });
        mine.forEach(function (k) { var x = info(k), m = st(), g = value(k) - (m.basis[k] || 0); items.push({ icon: logo(x), label: x.name, sub: s.stocks[k] + ' shares · ' + (g >= 0 ? 'up ' : 'down ') + E.fmt(Math.abs(g)), right: E.fmt(value(k)), onClick: function () { detail(k); } }); });
      }
      var open = D.STOCKS.filter(function (x) { return !TL.history || TL.history.listed(x.sym); });
      var soon = D.STOCKS.filter(function (x) { return open.indexOf(x) < 0; });
      open.forEach(function (x, i) {
        var fund = /fund/i.test(x.name);
        if (fund && !items.some(function (it) { return it.section === 'Funds'; })) items.push({ section: 'Funds' });
        if (!fund && !items.some(function (it) { return it.section === 'Stocks'; })) items.push({ section: 'Stocks' });
        var c = change(x.sym);
        items.push({ icon: logo(x), label: x.name, sub: x.sym + ' · ' + x.sector + (c != null ? ' · ' + pct(c) + ' last year' : ''), right: E.fmt(s.prices[x.sym]), onClick: function () { detail(x.sym); } });
      });
      if (soon.length) items.push({ info: true, html: '<p class="bz-cap" style="margin:0">Not public yet: ' + soon.map(function (x) { return U.esc(x.name) + ' (' + TL.history.ipoYear(x.sym) + ')'; }).join(', ') + '.</p>' });
      if (!TL.history || TL.history.listed('VOO')) items.push({ section: 'Settings' }, { icon: '🔁', label: 'Auto-invest', sub: st().auto ? Math.round(st().auto * 100) + '% of each year\'s pay goes into the S&P 500' : 'Put part of every paycheck into the S&P 500', onClick: autoMenu });
      return items;
    });
  }
  function detail(k) {
    var x = info(k);
    ui().menu(x.name, function () {
      var s = S(), m = st(), n = s.stocks[k] || 0, price = s.prices[k], h = m.ph[k] || [], c = change(k);
      var risk = x.vol >= 0.4 ? 'Very high' : x.vol >= 0.2 ? 'High' : x.beta >= 0.9 ? 'Moderate' : 'Low';
      var avg = n ? (m.basis[k] || 0) / n : 0, g = value(k) - (m.basis[k] || 0);
      var html = '<div class="bz-card"><div class="bz-top"><span class="bz-ico mk-logo">' + logo(x) + '</span><div><div class="bz-name">' + U.esc(x.name) + '</div><div class="bz-sub">' + x.sym + ' · ' + U.esc(x.sector) + '</div></div></div>' +
        '<div class="mk-price">' + E.fmt(price) + (c != null ? ' <span class="mk-gain ' + gainCls(c) + '">' + pct(c) + '</span>' : '') + '</div>' +
        spark(h) + (h.length > 1 ? '<div class="bz-cap">Last ' + U.plural(h.length - 1, 'year') + '</div>' : '') +
        '<div class="nw-grid bz-grid">' + cell('Risk', null, risk) + cell('Dividend', null, x.div ? (x.div * 100).toFixed(1) + '%/yr' : 'None') +
        (n ? cell('I own', null, n.toLocaleString() + ' shares') + cell('Worth', value(k)) + cell('Avg cost', Math.round(avg * 100) / 100) + '<div><small>Gain</small><b class="mk-gain ' + gainCls(g) + '">' + (g >= 0 ? '+' : '−') + E.fmt(Math.abs(g)) + '</b></div>' : '') + '</div></div>';
      var items = [{ info: true, html: html }, { section: 'Trade' }];
      [0.1, 0.25, 0.5, 1].forEach(function (f) {
        var cash = Math.floor(Math.max(0, s.money) * f), sh = Math.floor(cash / price);
        items.push({ icon: '🛒', label: f === 1 ? 'Buy with all my cash' : 'Buy with ' + Math.round(f * 100) + '% of my cash', sub: sh >= 1 ? sh.toLocaleString() + ' shares' : 'Not enough cash', right: sh >= 1 ? E.fmt(Math.round(sh * price)) : '', disabled: sh < 1, onClick: function () { var b = buy(k, cash); done(b ? 'I bought ' + b.toLocaleString() + ' shares of ' + x.name + '. 📈' : nope('I can\'t afford a share.')); } });
      });
      if (n) {
        if (n >= 2) items.push({ icon: '✂️', label: 'Sell half', right: E.fmt(Math.round(Math.floor(n / 2) * price)), onClick: function () { var got = sell(k, Math.floor(n / 2)); done('I sold half my ' + x.name + ' shares for ' + E.fmt(got) + '.'); } });
        items.push({ icon: '💰', label: 'Sell all', right: E.fmt(value(k)), danger: true, onClick: function () { var gg = g, got = sell(k, n); ui().back(); done(gg >= 0 ? good('I sold my ' + x.name + ' shares for ' + E.fmt(got) + ', a ' + E.fmt(gg) + ' profit. 💰') : bad('I sold my ' + x.name + ' shares for ' + E.fmt(got) + ', locking in a ' + E.fmt(-gg) + ' loss.')); } });
      }
      return items;
    });
  }
  function autoMenu() {
    var m = st();
    ui().choose('Auto-invest', 'Every year, put part of my take-home pay into the S&P 500 index fund. Slow and steady usually wins.', [0, 0.05, 0.1, 0.2].map(function (f) {
      return { label: (m.auto === f ? '✓ ' : '') + (f ? Math.round(f * 100) + '% of my pay' : 'Off'), fn: function () { m.auto = f; done(f ? 'I\'ll invest ' + Math.round(f * 100) + '% of my pay every year. 🔁' : 'I turned off auto-invest.'); } };
    }));
  }

  return { year: year, autoInvest: autoInvest, convert: convert, menu: menu, detail: detail, portfolio: portfolio, held: held, buy: buy, sell: sell, st: st };
})();
