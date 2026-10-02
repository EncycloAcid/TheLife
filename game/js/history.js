/* TheLife — v1.23: living through historical times. Start a life in any
 * year from 1900. Prices and pay follow the era (a US-CPI curve applied in
 * engine.k), life expectancy is lower in earlier decades, technology and
 * companies only exist once they were invented or went public, and history
 * happens to you: world wars and drafts, the Spanish flu, the 1929 crash
 * and the Great Depression, Korea and Vietnam, the moon landing, the fall
 * of the Berlin Wall, 9/11, the 2008 crisis and COVID. What you lived
 * through goes into S.era.seen and shows up in the life recap. */
TL.history = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function def(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  var NOW = 2025;

  // Price level relative to today (US CPI), by year; interpolated between points.
  var CPI = [[1900, 0.026], [1910, 0.029], [1915, 0.032], [1920, 0.063], [1925, 0.055], [1930, 0.053], [1933, 0.041], [1940, 0.044], [1945, 0.057],
    [1950, 0.080], [1955, 0.086], [1960, 0.093], [1965, 0.10], [1970, 0.12], [1975, 0.17], [1980, 0.26], [1985, 0.34], [1990, 0.41], [1995, 0.48],
    [2000, 0.54], [2005, 0.61], [2010, 0.69], [2015, 0.74], [2020, 0.81], [2022, 0.91], [2025, 1]];
  function lerp(tab, y) {
    if (y <= tab[0][0]) return tab[0][1];
    for (var i = 1; i < tab.length; i++) if (y <= tab[i][0]) { var a = tab[i - 1], b = tab[i]; return a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0]); }
    return tab[tab.length - 1][1];
  }
  function priceLevel(y) { return y >= NOW ? 1 : lerp(CPI, y); }
  // Years of life expectancy missing compared with today.
  var LIFE = [[1900, -32], [1920, -24], [1940, -16], [1960, -9], [1980, -5], [2000, -2], [2025, 0]];
  function lifeGap(y) { return y >= NOW ? 0 : lerp(LIFE, y); }

  // When things were invented, and when companies went public.
  var SINCE = { social: 2004, dating: 2012, crypto: 2009, youtube: 2005, tiktok: 2016, twitch: 2011, gig: 2009, software: 1955, gamedev: 1975, astronaut: 1959, pt_rideshare: 2012 };
  var LABEL = { social: 'social media', dating: 'dating apps', crypto: 'crypto', youtube: 'YouTube', tiktok: 'TikTok', twitch: 'Twitch', gig: 'gig apps', software: 'software jobs', gamedev: 'video game jobs', astronaut: 'the space program', pt_rideshare: 'ridesharing' };
  var IPO = { VOO: 1976, BND: 1986, AAPL: 1980, MSFT: 1986, NVDA: 1999, TSLA: 2010, AMZN: 1997, WMT: 1970, KO: 1919, PFE: 1942, GS: 1999 };
  function year() { return S() ? S().year : NOW; }
  function exists(key) { return !SINCE[key] || year() >= SINCE[key]; }
  function notYet(key) { return exists(key) ? null : 'Not invented until ' + SINCE[key]; }
  function listed(sym) { return !IPO[sym] || year() >= IPO[sym]; }
  function ipoYear(sym) { return IPO[sym]; }

  // ------------------------------------------------------------ the timeline
  // Wars: which countries drafted whom, and when.
  var WARS = [
    { id: 'ww1', name: 'World War I', from: 1914, to: 1918, icon: '🪖', draft: { 'United Kingdom': 1916, 'France': 1914, 'Germany': 1914, 'Italy': 1915, 'United States': 1917, 'Canada': 1917, 'Australia': 1916 }, ages: [18, 41], death: 0.12, end: 'World War I is over. The armistice was signed on November 11.' },
    { id: 'ww2', name: 'World War II', from: 1939, to: 1945, icon: '🪖', draft: { 'United Kingdom': 1939, 'France': 1939, 'Germany': 1939, 'Canada': 1940, 'Australia': 1939, 'South Africa': 1940, 'Italy': 1940, 'Japan': 1939, 'United States': 1941 }, ages: [18, 45], death: 0.08, end: 'World War II is over. People danced in the streets.' },
    { id: 'korea', name: 'the Korean War', from: 1950, to: 1953, icon: '🎖️', draft: { 'United States': 1950, 'South Korea': 1950, 'United Kingdom': 1950 }, ages: [18, 26], death: 0.03, end: 'An armistice ended the fighting in Korea.' },
    { id: 'vietnam', name: 'the Vietnam War', from: 1965, to: 1972, icon: '🎖️', draft: { 'United States': 1965, 'Australia': 1965, 'South Korea': 1965 }, ages: [19, 26], death: 0.02, end: 'The last American combat troops left Vietnam.' }
  ];
  // One-off moments everyone remembers: [year, icon, log line, only these countries, short label].
  var MOMENTS = [
    [1903, '✈️', 'The Wright brothers flew the first airplane.', null, 'First airplane flight'],
    [1912, '🚢', 'The Titanic sank on its first voyage.', null, 'The Titanic'],
    [1914, '🪖', 'World War I broke out in Europe.', null, 'World War I'],
    [1927, '🎬', 'The first movie with sound came out. Everyone went to see "The Jazz Singer."', null, 'The first talkies'],
    [1929, '📉', 'The stock market crashed on Black Tuesday.', null, 'The 1929 crash'],
    [1939, '🪖', 'World War II began.', null, 'World War II'],
    [1941, '💥', 'Japan attacked Pearl Harbor.', ['United States'], 'Pearl Harbor'],
    [1945, '☢️', 'Atomic bombs were dropped on Hiroshima and Nagasaki.', null, 'Hiroshima'],
    [1953, '🧬', 'Scientists discovered the structure of DNA.', null, 'DNA discovered'],
    [1955, '📺', 'Our family got its first television set.', null, 'The first TV'],
    [1957, '🛰️', 'The Soviets launched Sputnik, the first satellite.', null, 'Sputnik'],
    [1962, '☢️', 'The Cuban Missile Crisis. For thirteen days the world held its breath.', null, 'Cuban Missile Crisis'],
    [1963, '🕯️', 'President Kennedy was assassinated in Dallas.', ['United States'], 'JFK assassination'],
    [1964, '🎸', 'The Beatles played on The Ed Sullivan Show.', ['United States', 'United Kingdom'], 'Beatlemania'],
    [1968, '🕯️', 'Dr. Martin Luther King Jr. was assassinated.', ['United States'], 'MLK assassination'],
    [1969, '🌕', 'Neil Armstrong walked on the moon. I watched it on TV.', null, 'Moon landing'],
    [1977, '🎬', 'Everyone was talking about a new movie called "Star Wars."', null, 'Star Wars'],
    [1981, '🖥️', 'Personal computers started showing up in homes and offices.', null, 'Home computers'],
    [1986, '🚀', 'The Space Shuttle Challenger exploded after launch.', ['United States'], 'Challenger disaster'],
    [1989, '🧱', 'The Berlin Wall fell.', null, 'Fall of the Berlin Wall'],
    [1991, '🌐', 'The World Wide Web went public. The internet was coming.', null, 'The World Wide Web'],
    [1991, '🚩', 'The Soviet Union collapsed.', null, 'Fall of the Soviet Union'],
    [1994, '🕊️', 'Nelson Mandela became president in the first free elections.', ['South Africa'], 'Mandela elected'],
    [1997, '🕯️', 'Princess Diana died in a car crash in Paris.', ['United Kingdom'], 'Princess Diana\'s death'],
    [2000, '🎆', 'The new millennium arrived, and Y2K turned out to be nothing.', null, 'Y2K'],
    [2001, '🕯️', 'Terrorists attacked the World Trade Center on September 11.', null, '9/11'],
    [2004, '👍', 'A website called Facebook launched. Social media had begun.', null, 'Social media'],
    [2007, '📱', 'Apple released the iPhone. Phones would never be the same.', null, 'The iPhone'],
    [2008, '📉', 'The global financial crisis hit. Banks collapsed.', null, '2008 financial crisis'],
    [2009, '🗳️', 'Barack Obama became the first Black U.S. president.', ['United States'], 'Obama elected'],
    [2011, '🌊', 'A massive earthquake and tsunami struck Japan.', ['Japan'], 'Japan tsunami'],
    [2016, '🗳️', 'The UK voted to leave the European Union.', ['United Kingdom'], 'Brexit'],
    [2020, '😷', 'A new coronavirus spread around the world. COVID-19 was a pandemic.', null, 'COVID-19 pandemic'],
    [2022, '🤖', 'AI chatbots took the world by storm.', null, 'The AI boom']
  ];
  function st() { var s = S(); return s.era || (s.era = { seen: [], served: [] }); }
  function see(title, icon) { var h = st(); if (h.seen.length < 40) h.seen.push({ year: S().year, age: me().age, icon: icon, title: title }); }

  // Runs once a year from engine.ageUp, after the year advances.
  function yearly() {
    var s = S(), y = s.year, a = me().age, c = s.country, h = st();
    if (y >= NOW + 1 || s.dead) return;
    // Remembered moments (small children don't remember).
    MOMENTS.forEach(function (mo) {
      if (mo[0] !== y || a < 5 || (mo[3] && mo[3].indexOf(c) < 0)) return;
      E.log(mo[1] + ' ' + mo[2]); see(mo[4], mo[1]);
    });
    // Wars: drafts, and the end.
    WARS.forEach(function (w) {
      var start = w.draft[c];
      if (y === w.to + 1 && h.inWar === w.id) { h.inWar = null; }
      if (y === w.to && a >= 5 && start) { E.log('🕊️ ' + w.end, 'good'); }
      if (!start || y < start || y > w.to || h['drafted_' + w.id]) return;
      if (me().gender !== 'M' || a < w.ages[0] || a > w.ages[1] || s.prison) return;
      if (s.job && s.job.mil) return;
      if (U.chance(w.id === 'ww1' || w.id === 'ww2' ? 0.6 : 0.25)) { h['drafted_' + w.id] = true; s.pending.push({ id: 'hist_draft', data: { war: w.id } }); }
    });
    // Women and older men on the home front in the world wars.
    if ((y === 1917 || y === 1942) && a >= 18 && a <= 50 && !h.homefront && (me().gender === 'F' || a > 45) && WARS.some(function (w) { return w.draft[c] && y >= w.draft[c] && y <= w.to; })) {
      h.homefront = true; s.pending.push({ id: 'hist_homefront' });
    }
    // The Spanish flu.
    if ((y === 1918 || y === 1919) && !h.flu && U.chance(0.3)) {
      h.flu = true; E.stat('health', -U.rand(10, 25)); E.log('🤒 I caught the Spanish flu. Millions died that year.', 'bad');
      if (me().health < 25 && U.chance(0.35)) E.die('the Spanish flu');
    } else if (y === 1918 && a >= 5 && !h.flu) see('The Spanish flu', '🦠');
    // The Great Depression.
    if (y >= 1930 && y <= 1939 && a >= 16) {
      if (y === 1930) { E.log('🏚️ The Great Depression has begun. Breadlines stretch around the block.', 'bad'); see('The Great Depression', '🏚️'); }
      if (s.job && !s.job.partTime && !s.job.mil && U.chance(0.12)) E.fire('The company went under in the Depression.');
      E.stat('happy', -2);
    }
    // 2008 and COVID hit jobs too.
    if (y === 2009 && s.job && !s.job.mil && U.chance(0.08)) E.fire('I was laid off in the recession.');
    if (y === 2020 && a >= 3) {
      E.stat('happy', -5);
      if (U.chance(0.25)) { E.stat('health', -U.rand(5, 15)); E.log('🤒 I caught COVID-19.', 'bad'); if (me().age > 75 && me().health < 30 && U.chance(0.3)) E.die('COVID-19'); }
      if (s.job && !s.job.mil && U.chance(0.1)) E.fire('I lost my job in the COVID lockdowns.');
    }
    if (h.seen.length >= 10) E.achieve('history_buff');
  }
  // Forced market years for js/market.js (log return), or null.
  function marketYear(y) {
    return { 1929: -0.35, 1930: -0.4, 1931: -0.6, 1932: -0.15, 1937: -0.4, 1973: -0.2, 1974: -0.35, 1987: -0.05, 2000: -0.1, 2001: -0.14, 2002: -0.25, 2008: -0.45,
      1933: 0.4, 1954: 0.4, 1958: 0.35, 1975: 0.3, 1995: 0.32, 1997: 0.28, 2009: 0.24, 2013: 0.28, 2019: 0.27, 2020: 0.16, 2021: 0.25, 2022: -0.2 }[y];
  }

  // ------------------------------------------------------------ events
  def('hist_draft', { build: function (d) {
    var w = WARS.filter(function (x) { return x.id === d.war; })[0];
    if (!w) return null;
    return { icon: w.icon, title: 'Drafted', text: 'A letter came in the mail. I\'ve been drafted to fight in ' + w.name + '.', choices: [
      { label: 'Report for duty', run: function () {
        var h = st(); h.served.push(w.id); see('Served in ' + w.name, '🎖️'); E.achieve('veteran_war');
        S().flags.veteran = true;
        var r = U.rand(1, 100), dead = w.death * 100;
        if (r <= dead) { E.die('wounds suffered in ' + w.name); return bad('I never came home from ' + w.name + '.'); }
        if (r <= dead * 3) { E.stat('health', -U.rand(20, 35)); E.addCondition('PTSD'); return bad('I was badly wounded in ' + w.name + '. I came home a different person.'); }
        if (r <= dead * 6) { E.addCondition('PTSD'); E.stat('happy', -10); return 'I survived ' + w.name + ', but I still have nightmares.'; }
        E.stat('happy', 5); E.karma(4); return good('I served in ' + w.name + ' and came home a decorated veteran. 🎖️');
      } },
      { label: 'Refuse to fight', run: function () {
        E.karma(w.id === 'vietnam' ? 2 : -4);
        if (U.chance(0.4)) { E.jail(U.rand(1, 3), 'draft evasion'); return bad('I refused the draft and was sent to prison.'); }
        E.stat('happy', -5); return 'I declared myself a conscientious objector and did alternative service at home.';
      } }
    ] };
  } });
  def('hist_homefront', { build: function () {
    return { icon: '🏭', title: 'The home front', text: 'With so many men away at war, factories need workers.', choices: [
      { label: 'Work in a war factory', run: function () { E.addMoney(E.$(U.rand(2500, 5000))); E.karma(3); see('Worked on the home front', '🏭'); return good('I worked long shifts building for the war effort and earned good money.'); } },
      { label: 'Volunteer with the Red Cross', run: function () { E.karma(6); E.stat('happy', 4); see('Volunteered in the war', '⛑️'); return good('I rolled bandages and packed care packages for the troops.'); } }
    ] };
  } });

  // ------------------------------------------------------------ recap
  function aboutRow() {
    var h = S().era; if (!h || !h.seen.length) return null;
    var big = h.seen.filter(function (x) { return /War|Depression|Moon|Wall|pandemic|9\/11|crisis|Served|crash/.test(x.title); });
    var list = big.concat(h.seen.filter(function (x) { return big.indexOf(x) < 0; })).slice(0, 5);
    return ['📜', 'Lived through', list.map(function (x) { return x.title; }).join(' · ') + (h.seen.length > 5 ? ' · and more' : '')];
  }
  function eraName(y) { return y < 1914 ? 'the early 1900s' : y < 1920 ? 'the Great War years' : y < 1930 ? 'the Roaring Twenties' : y < 1940 ? 'the Great Depression' : y < 1946 ? 'World War II' : y < 1960 ? 'the postwar boom' : y < 1970 ? 'the Sixties' : y < 1980 ? 'the Seventies' : y < 1990 ? 'the Eighties' : y < 2000 ? 'the Nineties' : y < 2010 ? 'the 2000s' : 'the modern era'; }

  return { priceLevel: priceLevel, lifeGap: lifeGap, exists: exists, notYet: notYet, listed: listed, ipoYear: ipoYear, yearly: yearly, marketYear: marketYear, aboutRow: aboutRow, eraName: eraName, LABEL: LABEL, SINCE: SINCE, NOW: NOW };
})();
