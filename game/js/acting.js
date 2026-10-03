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
  function big(n) { return n < 1e6 ? '$' + Math.max(1, Math.round(n / 1e3)) + 'K' : n >= 1e9 ? '$' + (n / 1e9).toFixed(2).replace(/0$/, '') + 'B' : '$' + Math.round(n / 1e6) + 'M'; }
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
    voice: { name: 'Animated film', icon: '🎙️', film: true, gross: [120, 900], parts: { 'Voice role': [150000, 3000000, 58, 3] } },
    blockbuster: { name: 'Blockbuster', icon: '💥', film: true, gross: [180, 1200], parts: { Supporting: [800000, 3000000, 78, 7], Lead: [5000000, 20000000, 92, 12] } }
  };
  // Which projects come my way at each level of reputation.
  var LADDER = [
    [0, ['student', 'commercial', 'theater']],
    [12, ['commercial', 'theater', 'guest', 'indie']],
    [28, ['guest', 'indie', 'series', 'commercial']],
    [45, ['indie', 'series', 'studio', 'broadway', 'voice']],
    [62, ['series', 'studio', 'broadway', 'blockbuster', 'voice']],
    [78, ['studio', 'blockbuster', 'series', 'indie', 'voice']]
  ];
  var KID_KINDS = ['commercial', 'student', 'theater', 'guest', 'series'];
  var STUDIOS0 = { voice: ['Walt Disney Pictures', 'Pixar', 'DreamWorks Animation', 'Illumination', 'Sony Pictures Animation'] };
  var STUDIOS = { indie: ['A24', 'Neon', 'Searchlight Pictures', 'Focus Features', 'IFC Films', 'Magnolia Pictures'], studio: ['Warner Bros.', 'Universal', 'Paramount', 'Sony Pictures', 'Lionsgate', '20th Century Studios'], blockbuster: ['Marvel Studios', 'Lucasfilm', 'Warner Bros.', 'Universal', 'Legendary', 'DreamWorks'], series: ['Netflix', 'HBO', 'Apple TV+', 'Hulu', 'Prime Video', 'FX', 'NBC', 'ABC'], kids: ['Disney Channel', 'Nickelodeon'], guest: ['NBC', 'CBS', 'ABC', 'Fox', 'Netflix'], broadway: ['Broadway'], theater: ['a community theater'], student: ['a film school'], commercial: ['a national brand'] };
  // Studios, networks and agencies only turn up in the years they existed:
  // [first year, last year, older name, older name's first year].
  var ERA = { 'Marvel Studios': [2008], 'RKO Pictures': [1928, 1959], 'Lucasfilm': [1971], 'Fox': [1986], 'American International Pictures': [1954, 1980], 'A24': [2013], 'Neon': [2017], 'Searchlight Pictures': [2020, 0, 'Fox Searchlight', 1994], '20th Century Studios': [2020, 0, '20th Century Fox', 1935], 'Sony Pictures': [1989, 0, 'Columbia Pictures', 1924], 'Legendary': [2000], 'DreamWorks': [1994], 'Lionsgate': [1997], 'Focus Features': [2002], 'IFC Films': [2000], 'Magnolia Pictures': [2001], 'Netflix': [2013], 'Apple TV+': [2019], 'Hulu': [2011], 'Prime Video': [2015], 'FX': [2002], 'HBO': [1983], 'Showtime': [1976], 'Disney Channel': [1983], 'Nickelodeon': [1979], 'Miramax': [1979, 2010], 'Orion Pictures': [1978, 1998], 'New Line Cinema': [1967, 2008], 'Carolco Pictures': [1976, 1995], 'UTA': [1991], 'WME': [2009, 0, 'William Morris', 1898], 'CAA': [1975], 'ICM': [1975, 2022] };
  ERA['Pixar'] = [1995]; ERA['DreamWorks Animation'] = [1998]; ERA['Illumination'] = [2010]; ERA['Sony Pictures Animation'] = [2006]; ERA['Walt Disney Pictures'] = [1937];
  STUDIOS.voice = STUDIOS0.voice;
  var OLD = { indie: ['Miramax', 'Orion Pictures', 'New Line Cinema', 'United Artists', 'American International Pictures'], studio: ['MGM', 'Columbia Pictures', 'United Artists'], blockbuster: ['Carolco Pictures', 'Paramount', 'Columbia Pictures', '20th Century Studios'], series: ['CBS', 'Showtime'] };
  function eraName(n, y) {
    var e = ERA[n]; y = y || S().year;
    if (!e || (y >= e[0] && (!e[1] || y <= e[1]))) return n;
    return e[2] && y >= e[3] && y < e[0] ? e[2] : null;
  }
  function pickStudio(kind) {
    var all = (STUDIOS[kind] || ['a studio']).concat(OLD[kind] || []), l = all.map(function (n) { return eraName(n); }).filter(function (n, i, a) { return n && a.indexOf(n) === i; });
    return U.pick(l.length ? l : /series|kids|guest/.test(kind) ? ['NBC', 'CBS', 'ABC'] : all);
  }
  function agencyName(n) { return eraName(n) || (S().year >= 1975 ? 'ICM' : 'William Morris'); }
  // Rotten Tomatoes only launched in 1998.
  function rt(v, y) { return (y || S().year) >= 1999 ? v + '% on Rotten Tomatoes' : v + '% positive reviews'; }
  var GENRES = ['drama', 'comedy', 'thriller', 'romance', 'horror', 'sci-fi', 'action', 'period drama', 'crime drama', 'musical'];
  var W1 = ['Midnight', 'Silent', 'Golden', 'Broken', 'Last', 'Paper', 'Crimson', 'Hidden', 'Glass', 'Wild', 'Northern', 'Electric', 'Quiet', 'Burning', 'Lost'];
  var W2 = ['Summer', 'Kingdom', 'Hearts', 'Harbor', 'Hours', 'River', 'Signal', 'Season', 'Road', 'Witness', 'Empire', 'Promise', 'Orbit', 'Garden', 'Frontier'];
  var AGENCIES = [['a boutique talent agency', 1, 0, 25], ['Gersh', 2, 20, 35], ['UTA', 3, 40, 50], ['WME', 4, 58, 60], ['CAA', 4, 62, 60]];
  var TIERS = [[0, 'Aspiring'], [10, 'Working'], [25, 'Character'], [42, 'Rising Star'], [58, 'Star'], [74, 'A-List'], [90, 'Hollywood Legend']];
  // Directors I can work with again (and again).
  var DIRECTORS = ['Mara Lindqvist', 'Dev Okafor', 'Julian Reyes', 'Sofia Marchetti', 'Theo Nakamura', 'Hannah Brooks', 'Omar Haddad', 'Claire Dumont', 'Rafael Ortiz', 'Ingrid Holm', 'Marcus Bell', 'Yuki Tanaka', 'Priya Raman', 'Elliot Shaw'];
  // Real directors and stars, by the years they were working (they keep
  // going a while past our data; invented names fill in the future).
  var REAL_DIRECTORS = [['Alfred Hitchcock', 1925, 1976], ['John Ford', 1920, 1966], ['Frank Capra', 1927, 1961], ['Billy Wilder', 1942, 1981], ['Orson Welles', 1941, 1973], ['Elia Kazan', 1945, 1976], ['Stanley Kubrick', 1953, 1999], ['Sidney Lumet', 1957, 2007], ['Mike Nichols', 1966, 2007], ['Francis Ford Coppola', 1963, 2024], ['Martin Scorsese', 1967, 2040], ['Steven Spielberg', 1971, 2035], ['George Lucas', 1971, 2005], ['Ridley Scott', 1977, 2035], ['Robert Zemeckis', 1980, 2030], ['Ron Howard', 1982, 2040], ['James Cameron', 1984, 2040], ['John Hughes', 1984, 1991], ['Penny Marshall', 1986, 1996], ['Spike Lee', 1986, 2040], ['Kathryn Bigelow', 1987, 2035], ['Nora Ephron', 1992, 2009], ['Quentin Tarantino', 1992, 2026], ['David Fincher', 1992, 2040], ['Ang Lee', 1992, 2030], ['Guillermo del Toro', 1993, 2045], ['Wes Anderson', 1996, 2045], ['Sofia Coppola', 1999, 2045], ['Christopher Nolan', 2000, 2050], ['Bong Joon-ho', 2003, 2045], ['Denis Villeneuve', 2010, 2050], ['Ava DuVernay', 2010, 2050], ['Ryan Coogler', 2013, 2055], ['Damien Chazelle', 2014, 2055], ['Chloé Zhao', 2015, 2055], ['Barry Jenkins', 2016, 2055], ['Greta Gerwig', 2017, 2055], ['Jordan Peele', 2017, 2055], ['Emerald Fennell', 2020, 2055]];
  var COSTARS = [['Clark Gable', 'M', 1931, 1960], ['Bette Davis', 'F', 1931, 1970], ['Cary Grant', 'M', 1932, 1966], ['Katharine Hepburn', 'F', 1932, 1981], ['James Stewart', 'M', 1935, 1975], ['Humphrey Bogart', 'M', 1936, 1956], ['Ingrid Bergman', 'F', 1939, 1978], ['Elizabeth Taylor', 'F', 1944, 1980], ['Marlon Brando', 'M', 1950, 1980], ['Marilyn Monroe', 'F', 1950, 1962], ['Audrey Hepburn', 'F', 1953, 1976], ['Sidney Poitier', 'M', 1955, 1990], ['Paul Newman', 'M', 1956, 2005], ['Jack Nicholson', 'M', 1969, 2010], ['Al Pacino', 'M', 1971, 2030], ['Diane Keaton', 'F', 1972, 2020], ['Robert De Niro', 'M', 1973, 2030], ['Meryl Streep', 'F', 1977, 2035], ['Harrison Ford', 'M', 1977, 2023], ['Tom Cruise', 'M', 1983, 2035], ['Tom Hanks', 'M', 1984, 2035], ['Whoopi Goldberg', 'F', 1985, 2005], ['Denzel Washington', 'M', 1987, 2035], ['Julia Roberts', 'F', 1988, 2035], ['Brad Pitt', 'M', 1991, 2040], ['Leonardo DiCaprio', 'M', 1993, 2045], ['Sandra Bullock', 'F', 1994, 2035], ['Halle Berry', 'F', 1995, 2030], ['Will Smith', 'M', 1995, 2030], ['Angelina Jolie', 'F', 1999, 2040], ['Scarlett Johansson', 'F', 2003, 2050], ['Ryan Gosling', 'M', 2006, 2050], ['Viola Davis', 'F', 2008, 2045], ['Emma Stone', 'F', 2010, 2055], ['Michael B. Jordan', 'M', 2013, 2055], ['Lupita Nyong\'o', 'F', 2013, 2055], ['Margot Robbie', 'F', 2013, 2055], ['Zendaya', 'F', 2017, 2065], ['Timothée Chalamet', 'M', 2017, 2065], ['Daniel Kaluuya', 'M', 2017, 2060], ['Florence Pugh', 'F', 2019, 2065], ['Pedro Pascal', 'M', 2019, 2045], ['Anya Taylor-Joy', 'F', 2020, 2065], ['Austin Butler', 'M', 2022, 2065], ['Sydney Sweeney', 'F', 2022, 2065]];
  // Late-night TV by era (radio before television).
  var TALK = [['The Ed Sullivan Show', 1948, 1971], ['The Tonight Show with Johnny Carson', 1962, 1992], ['Late Night with David Letterman', 1982, 1993], ['The Oprah Winfrey Show', 1986, 2011], ['The Tonight Show with Jay Leno', 1992, 2014], ['the Late Show with David Letterman', 1993, 2015], ['Jimmy Kimmel Live!', 2003, 2040], ['The Graham Norton Show', 2007, 2045], ['The Tonight Show Starring Jimmy Fallon', 2014, 2045], ['The Late Show with Stephen Colbert', 2015, 2026]];
  function active(list, y, a, b) { return list.filter(function (q) { return y >= q[a] && y <= q[b]; }); }
  function pickDirector() { var y = S().year, real = active(REAL_DIRECTORS, y, 1, 2); return real.length && U.chance(0.65) ? U.pick(real)[0] : U.pick(DIRECTORS); }
  function pickCostar() { var y = S().year, me0 = me().first + ' ' + me().last, real = active(COSTARS, y, 2, 3).filter(function (q) { return q[0] !== me0; }); return real.length && U.chance(0.75) ? U.pick(real)[0] : null; }
  function talkShow() { var l = active(TALK, S().year, 1, 2); return l.length ? U.pick(l)[0] : null; }
  // What exists in a given year: no TV before 1949, no movies before 1910.
  function eraKind(kind) { var y = S().year; if (kind === 'voice' && y < 1937) return 'theater'; if (y < 1949 && /series|guest/.test(kind)) return y < 1910 ? 'theater' : U.chance(0.5) ? 'theater' : 'indie'; if (y < 1910 && /indie|studio|blockbuster|student/.test(kind)) return 'theater'; return kind; }
  // Critics of the day.
  function critic(v, y) {
    if (y < 1967) return ' The New York Times called it ' + (v >= 80 ? '"a triumph."' : v >= 50 ? '"pleasant enough."' : '"a dreary mess."');
    if (y >= 1975 && y <= 1999) return ' Siskel & Ebert gave it ' + (v >= 70 ? 'two thumbs up.' : v >= 45 ? 'a split decision.' : 'two thumbs down.');
    if (y <= 2012) return ' Roger Ebert gave it ' + (v >= 85 ? 'four stars.' : v >= 65 ? 'three stars.' : v >= 40 ? 'two stars.' : 'one star.');
    return '';
  }

  // ------------------------------------------------------------ range
  // Four skills kept as offsets from my overall craft (they average zero):
  // what I train and the parts I play shape the kind of actor I become.
  var CRAFT = [['dra', 'Drama'], ['com', 'Comedy'], ['act', 'Action'], ['pre', 'Presence']];
  var GENRE_CRAFT = { 'animation': 'com', 'drama': 'dra', 'crime drama': 'dra', 'period drama': 'dra', 'thriller': 'dra', 'horror': 'dra', 'comedy': 'com', 'musical': 'com', 'action': 'act', 'sci-fi': 'act', 'romance': 'pre' };
  var TYPE = { dra: ['Dramatic actor', 'Dramatic actress'], com: ['Comedic actor', 'Comedic actress'], act: ['Action star', 'Action star'], pre: ['Leading man', 'Leading lady'] };
  function craft(x) {
    if (!x.craft) {
      var m = me(); x.craft = { dra: U.rand(-4, 4), com: U.rand(-4, 4) + ((S().skills || {}).comedy || 0) / 10, act: U.rand(-4, 4) + (m.athl - 55) / 8, pre: U.rand(-4, 4) + (m.looks - 55) / 6 };
      cnorm(x);
    }
    return x.craft;
  }
  function cnorm(x) { var o = x.craft, m = (o.dra + o.com + o.act + o.pre) / 4; CRAFT.forEach(function (c) { o[c[0]] = U.clamp(Math.round((o[c[0]] - m) * 10) / 10, -12, 12); }); }
  function shiftCraft(x, k, n) { if (!k) return; craft(x)[k] += n; cnorm(x); }
  function ca(x, k) { return U.clamp(Math.round(x.skill + craft(x)[k]), 1, 100); }
  function strongest(x) { var o = craft(x); return ['dra', 'com', 'act', 'pre'].sort(function (a, b) { return o[b] - o[a]; })[0]; }
  function typeName(k) { return TYPE[k][me().gender === 'F' ? 1 : 0]; }
  // Play the same kind of part too often and that's all anyone sees.
  function typecast(x) {
    var recent = x.credits.filter(function (r) { return r.genre && GENRE_CRAFT[r.genre]; }).slice(-8), n = {};
    recent.forEach(function (r) { var k = GENRE_CRAFT[r.genre]; n[k] = (n[k] || 0) + 1; });
    var top = Object.keys(n).sort(function (a, b) { return n[b] - n[a]; })[0];
    return top && n[top] >= 5 ? top : null;
  }
  function collabs(x, d) { return d ? x.credits.filter(function (r) { return r.director === d; }).length : 0; }

  function st() {
    var s = S(), x = s.acting;
    if (!x) {
      x = s.acting = { talent: U.clamp(Math.round(U.gauss(58, 16) + me().looks / 12 + (TL.talents ? TL.talents.ceiling('acting') : 0)), 25, 99), skill: U.clamp(15 + (s.flags.acting || 0) * 3 + Math.round(me().looks / 10), 5, 45), rep: 0, agent: null, credits: [], slate: [], series: null, earn: 0, headshots: 0, noms: 0, wins: 0, best: 0 };
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
        var c = { kind: kind, part: part, title: U.pick(W1) + ' ' + U.pick(W2), studio: pickStudio(kind), genre: U.pick(GENRES), pay: Math.round((p[0] + p[1]) / 2), diff: p[2], rep: p[3] };
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
  // Early credits matter most: going from nobody to working actor takes a few good parts, not a decade.
  function rise(x) { return 1 + 2 / (1 + x.rep / 12); }
  function tier() { var r = st().rep, t = TIERS[0][1]; TIERS.forEach(function (q) { if (r >= q[0]) t = q[1]; }); return t; }
  function title() { var t = tier(); if (t === 'Star') return S().acting && S().acting.series ? 'TV Star' : 'Movie Star'; return /Star|Legend|A-List/.test(t) ? (t === 'A-List' ? 'A-List ' + noun() : t) : t + ' ' + noun(); }
  function hasJob() { var j = S().job; return !!(j && j.acting); }
  // How well a part's genre suits me: comedy chops, athleticism for action,
  // a singing voice for musicals, looks for romance.
  function fit(c) {
    var m = me(), sk = S().skills || {}, g = c && c.genre, x = S().acting, k = GENRE_CRAFT[g];
    if (!x || !k) return 0;
    var f = craft(x)[k] / 2.5 + (g === 'action' ? (m.athl - 55) / 10 : g === 'musical' ? (sk.singing || 0) / 8 - 2 : g === 'romance' ? (m.looks - 55) / 10 : g === 'comedy' ? (sk.comedy || 0) / 20 : 0);
    // Typecast actors struggle to sell anything else.
    var tc = typecast(x); if (tc && tc !== k) f -= 2;
    return U.clamp(Math.round(f), -5, 8);
  }
  function fitWord(c) { var f = fit(c); return f >= 4 ? ' · Perfect fit' : f <= -3 ? ' · Not my type' : ''; }
  function power(x, c) {
    var m = me();
    return fit(c) + x.skill * 0.45 + x.rep * 0.45 + m.looks * 0.1 + (x.headshots && S().year - x.headshots < 10 ? 2 : 0) + (x.agent ? x.agent.tier * 2.5 : -3) + (c && c.kind === 'commercial' ? m.looks / 10 : 0);
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
      var kind = eraKind(U.pick(pool)), k = KINDS[kind], parts = Object.keys(k.parts);
      // A bigger name gets offered the bigger part more often.
      var part = parts.length > 1 && U.chance(0.3 + x.rep / 150) ? parts[1] : parts[0];
      var p = k.parts[part], studio = pickStudio(kid && kind === 'series' ? 'kids' : kind);
      var pay = Math.round(U.randf(p[0], p[1]) * (0.7 + x.rep / 120) / 100) * 100;
      if (kid) pay = Math.round(pay * 0.4);
      var tc = typecast(x), genre = kind === 'voice' ? 'animation' : kind === 'commercial' ? 'ad' : tc && U.chance(0.5) ? U.pick(GENRES.filter(function (g) { return GENRE_CRAFT[g] === tc; })) : U.pick(GENRES);
      var dir = kind === 'commercial' || kind === 'student' || kind === 'theater' ? null : x.muse && i === 0 && U.chance(0.6) ? x.muse : kind === 'broadway' ? U.pick(DIRECTORS) : pickDirector(); // film directors don't stage Broadway
      var call = { kind: kind, part: part, title: U.pick(W1) + ' ' + U.pick(W2), studio: studio, genre: genre, director: dir, pay: pay, diff: p[2] + (kid ? -6 : 0) - (dir && dir === x.muse ? 6 : 0), rep: p[3] };
      if (k.film && kind !== 'student' || k.series) call.costar = pickCostar();
      // Streaming movies: a big upfront fee, no box office.
      if (kind === 'studio' && s.year >= 2015 && U.chance(0.3)) { var sv = ['Netflix', 'Prime Video', 'Apple TV+'].map(function (n) { return eraName(n); }).filter(Boolean); if (sv.length) { call.studio = U.pick(sv); call.streaming = true; call.pay = Math.round(call.pay * 1.3 / 100) * 100; } }
      list.push(call);
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
    ui().choose('🎬 ' + c.title, KINDS[c.kind].name + ' · ' + c.part + ' · ' + c.studio.replace(/\.$/, '') + '. How do I prepare for the audition?', [
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
    var msg = how + ' and booked it! ' + phrase(c) + ' ' + KINDS[c.kind].icon;
    // Leads in big studio pictures negotiate: the full fee, or less up front
    // and a share of the box office (Jimmy Stewart's 1950 deal made that a thing).
    if (/Lead/.test(c.part) && (c.kind === 'studio' || c.kind === 'blockbuster') && !c.streaming && S().year >= 1950 && c.pay > 0) {
      var pts = Math.round(3 + x.rep / 15 + (x.agent ? x.agent.tier : 0));
      // The part is mine either way; walking away from the table means the standard fee.
      c.defer = true; book(c);
      return ui().choose('🤝 The deal', msg + ' My agent says they\'ll pay ' + E.fmt(E.$(c.pay)) + ' up front, or half that plus ' + pts + '% of the box office.', [
        { label: 'Take the full fee', fn: function () { c.defer = false; pay(c.pay); prep(c, msg); } },
        { label: 'Half up front + ' + pts + '% of the gross', fn: function () { c.defer = false; c.pay = Math.round(c.pay / 2); c.points = pts; pay(c.pay); prep(c, msg + ' I bet on myself: ' + pts + ' points on the back end.'); } }
      ]);
    }
    book(c);
    return prep(c, msg);
  }
  // How I get ready for the part, by genre. Each choice nudges the reviews.
  function prep(c, msg) {
    var films = KINDS[c.kind].film || KINDS[c.kind].series || KINDS[c.kind].stage;
    if (!films || c.kind === 'student' || c.kind === 'theater') return done(good(msg));
    if (U.chance(0.35)) S().pending.push({ id: 'ac_set', data: { title: c.title, year: S().year } });
    var g = c.genre, x = st(), opts = null, q = '';
    if (/Lead/.test(c.part) && GENRE_CRAFT[g] === 'dra' && !KINDS[c.kind].series) { q = 'How far do I go to become this character?'; opts = [
      { label: 'Go method: live as the character for months', fn: function () { c.method = true; E.stat('health', -8); E.stat('happy', -5); shiftCraft(st(), 'dra', 1.5); done(good(msg + ' I went full method. My family barely recognized me.')); } },
      { label: 'Prepare like a professional', fn: function () { done(good(msg)); } }]; }
    else if (/action|sci-fi/.test(g)) { q = 'The stunt coordinator wants to know: do I do my own stunts?'; opts = [
      { label: 'Do my own stunts', fn: function () { c.prep = 3; shiftCraft(x, 'act', 1); if (U.chance(0.15)) { E.stat('health', -15); E.log('🤕 I got hurt doing my own stunt. The clip of it went viral.', 'bad'); E.fame(1); } done(good(msg + ' I\'m doing my own stunts. My insurance company is not thrilled.')); } },
      { label: 'Use a stunt double', fn: function () { done(good(msg)); } }]; }
    else if (g === 'musical') { q = 'It\'s a musical. How do I handle the singing?'; opts = [
      { label: 'Train with a vocal coach (' + E.fmt(E.$(5000)) + ')', fn: function () { E.addMoney(-E.$(5000)); c.prep = 2 + Math.round(((S().skills || {}).singing || 30) / 35); done(good(msg + ' I trained with a vocal coach for months.')); } },
      { label: 'Let them dub my voice', fn: function () { c.prep = -2; done(msg + ' A professional singer will dub my songs. Nobody has to know.'); } }]; }
    else if (g === 'period drama' || g === 'crime drama') { q = 'The role needs an accent.'; opts = [
      { label: 'Work with a dialect coach (' + E.fmt(E.$(3000)) + ')', fn: function () { E.addMoney(-E.$(3000)); c.prep = 2; done(good(msg + ' My dialect coach drilled me every day.')); } },
      { label: 'Wing the accent', fn: function () { c.prep = U.chance(0.4) ? -6 : 1; done(msg + ' How hard can an accent be?'); } }]; }
    else if (g === 'comedy' || g === 'animation') { q = 'The director says I can improvise.'; opts = [
      { label: 'Improvise like crazy', fn: function () { c.prep = U.rand(-4, 6); shiftCraft(x, 'com', 1); done(good(msg + ' I improvised half my lines.')); } },
      { label: 'Stick to the script', fn: function () { c.prep = 1; done(good(msg)); } }]; }
    else if (g === 'horror' || g === 'thriller') { q = 'It\'s a dark role. Do I stay in character between takes?'; opts = [
      { label: 'Stay in character', fn: function () { c.prep = 2; E.stat('happy', -4); done(good(msg + ' I stayed in character. The crew started avoiding me.')); } },
      { label: 'Leave it at work', fn: function () { done(good(msg)); } }]; }
    else if (g === 'romance' && c.costar) { q = 'Chemistry is everything in a romance.'; opts = [
      { label: 'Do chemistry reads with ' + c.costar, fn: function () { c.prep = 2; done(good(msg + ' ' + c.costar + ' and I clicked right away.')); } },
      { label: 'Trust it\'ll happen on camera', fn: function () { c.prep = U.chance(0.5) ? 2 : -3; done(good(msg)); } }]; }
    if (!opts) return done(good(msg));
    return ui().choose('🎭 Preparing for the role', msg + ' ' + q, opts);
  }
  // Who was advertising, by era.
  function brand() { var y = S().year; return U.pick(y < 1950 ? ['a soap company', 'a soda brand', 'a car company', 'a cereal', 'a department store', 'a radio maker'] : y < 1985 ? ['a soda brand', 'a car company', 'a cereal', 'a burger chain', 'a laundry detergent', 'an airline'] : ['a soda brand', 'a car company', 'a phone carrier', 'a burger chain', 'a cereal', 'an insurance company', 'a streaming app']); }
  function phrase(c) {
    if (c.kind === 'commercial') return 'I\'m in a national ' + (S().year < 1949 ? 'radio ad' : 'commercial') + ' for ' + (c.brand = c.brand || brand()) + '.';
    if (c.kind === 'guest') return 'I\'m guest starring on the ' + c.studio + ' show "' + c.title + '".';
    if (c.kind === 'student') return 'I\'m the lead in a student film, "' + c.title + '".';
    if (c.kind === 'series') return 'I\'m a ' + (c.part === 'Series lead' ? 'series lead' : 'series regular') + ' on the ' + c.studio + ' show "' + c.title + '"' + (c.costar ? ', alongside ' + c.costar : '') + '.';
    var where = c.kind === 'theater' ? 'a community theater production of "' + c.title + '"' : c.kind === 'broadway' ? 'the Broadway show "' + c.title + '"' : 'the ' + c.studio + ' ' + (c.streaming ? 'movie' : S().year < 1928 ? 'silent picture' : KINDS[c.kind].name.toLowerCase()) + ' "' + c.title + '"';
    return (c.part === 'Voice role' ? 'I\'m voicing a character' : 'I\'m playing ' + (c.part === 'Lead' ? 'the lead' : 'a supporting role')) + ' in ' + where + (c.costar ? ', opposite ' + c.costar : '') + (c.director && !/^(a |the )/.test(c.director) && REAL_DIRECTORS.some(function (d) { return d[0] === c.director; }) ? ', directed by ' + c.director : '') + '.';
  }
  // Pay goes through my acting job (taxed with my salary) when acting is my job.
  function pay(base) {
    var x = st(), s = S(), amt = E.$(base);
    if (x.agent) amt = Math.round(amt * 0.9);
    if (!s.job && me().age >= 18 && !s.edu && !s.prison && !s.retired) s.job = { career: 'actor', acting: true, fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, company: x.agent ? x.agent.name : 'Freelance', salary: 0, title: title() };
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
    if (!c.defer) pay(c.pay);
    grow(x, U.randf(0.5, 2));
    E.stat('happy', 10);
    if (c.part === 'Lead' && (c.kind === 'studio' || c.kind === 'blockbuster')) E.achieve('big_break');
  }

  // ------------------------------------------------------------ training
  var CLASSES = [
    ['community', '🎭', 'Community acting class', 300, 8, [2, 4], 'pre'],
    ['groundlings', '😂', 'Improv at The Groundlings', 1200, 14, [2, 4], 'com'],
    ['stunt', '🤸', 'Stunt and fight training', 2000, 16, [1, 3], 'act'],
    ['coach', '🧑‍🏫', 'Private acting coach', 3000, 14, [3, 6], 'dra'],
    ['strasberg', '🎓', 'Lee Strasberg Institute', 8000, 18, [5, 8], null]
  ];
  function train(cl) {
    var x = st(), cost = E.$(cl[3]);
    if (count('ac_' + cl[0])) return done(nope('I already did that this year.'));
    if (S().money < cost) return done(nope('That costs ' + E.fmt(cost) + '.'));
    bump('ac_' + cl[0]); E.addMoney(-cost);
    // Stacking classes in one year has diminishing returns.
    grow(x, U.rand(cl[5][0], cl[5][1]) / (1 + count('ac_trained')));
    bump('ac_trained');
    shiftCraft(x, cl[6], 2);
    if (cl[0] === 'groundlings') { S().skills = S().skills || {}; S().skills.comedy = Math.min(100, (S().skills.comedy || 0) + 3); }
    S().flags.acting = (S().flags.acting || 0) + 1;
    return done(cl[2] + ': I worked on my craft. 🎭 (' + (cl[6] ? CRAFT.filter(function (c) { return c[0] === cl[6]; })[0][1].toLowerCase() + ' ' + ca(x, cl[6]) + ', ' : '') + 'craft ' + Math.round(x.skill) + ')');
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
    if (!U.chance(0.55 + (x.rep - best[2]) / 50)) return done(bad(best[0] === AGENCIES[0][0] ? 'The agency passed. Maybe next year.' : agencyName(best[0]) + ' took a meeting but passed for now.'));
    var an = agencyName(best[0]);
    x.agent = { name: an, tier: best[1] };
    if (hasJob()) S().job.company = an;
    return done(good('I signed with ' + an + '! My agent will send me better auditions. 🤝'));
  }
  function party() {
    var x = st();
    if (count('ac_party')) return done(nope('One industry party a year is plenty.'));
    bump('ac_party');
    var r = U.rand(1, 100);
    if (r <= 12) { x.rep = Math.max(0, x.rep - 2); E.stat('happy', -5); return done(bad('I had one too many and told a producer exactly what I thought of their last movie.')); }
    if (r >= 85) { x.rep = Math.min(100, x.rep + 3); x.calls = null; return done(good('I hit it off with a famous director at a Hollywood party. New auditions are coming my way! 🥂')); }
    x.rep = Math.min(100, x.rep + 1); E.stat('happy', 4);
    return done('I mingled at an industry party and made a few useful connections. 🥂');
  }
  function talk() {
    var x = st(), sh = S().year < 1948 ? 'the radio' : talkShow() || 'a late-night show';
    if (count('ac_talk')) return done(nope('I already did the talk-show circuit this year.'));
    bump('ac_talk');
    var charm = (me().looks + me().smarts) / 2 + ca(x, 'com') / 3 + U.rand(-25, 25);
    if (x.slate.length) x.press = S().year;
    if (charm >= 70) { E.fame(3); x.rep = Math.min(100, x.rep + 2); return done(good('I was a hit on ' + sh + '. ' + U.pick(['My story about my first audition had the audience crying with laughter.', 'The host and I played a game and I won.', 'The clip of me doing impressions went viral.']))); }
    if (charm < 35) { if (U.chance(0.4)) { E.fame(2); return done('My awkward interview on ' + sh + ' became a meme. Somehow it helped.'); } x.rep = Math.max(0, x.rep - 1); E.stat('happy', -4); return done(bad('I froze on ' + sh + '. The silence was unbearable.')); }
    E.fame(1); return done('I went on ' + sh + ' and plugged my work. Solid, if forgettable.');
  }
  function pressTour() {
    var x = st();
    if (!x.slate.length) return done(nope('I have nothing coming out to promote.'));
    if (count('ac_press')) return done(nope('I already did a press tour this year.'));
    bump('ac_press'); x.press = S().year; E.fame(2); E.stat('happy', -2);
    return done('I did a whirlwind press tour: late-night shows, podcasts and a dozen junkets. 🎤');
  }
  // Ask the network for more money: a hit show and a big name help, but push
  // too hard and the writers might kill off my character.
  function askRaise() {
    var x = st(), sr = x.series;
    if (!sr || !sr.seasons) return done(nope('I need a season under my belt before I ask for more.'));
    if (count('ac_raise')) return done(nope('I already negotiated this year.'));
    bump('ac_raise');
    var p = U.clamp(0.3 + ((sr.quality || 50) - 55) / 80 + x.rep / 200 + (x.agent ? x.agent.tier * 0.04 : 0), 0.08, 0.85);
    if (U.chance(p)) { var up = U.randf(1.2, 1.6); sr.pay = Math.round(sr.pay * up / 1000) * 1000; E.stat('happy', 6); return done(good(sr.network + ' gave me a raise on "' + sr.title + '"! I now make ' + E.fmt(E.$(sr.pay)) + ' a season. 💰')); }
    if (U.chance(0.25)) { var t = sr.title; x.series = null; E.stat('happy', -10); return done(bad('The negotiations got ugly. The writers killed off my character on "' + t + '".')); }
    E.stat('happy', -3); return done(sr.network + ' said no to a raise. I\'m staying on "' + sr.title + '" at the same rate.');
  }
  // Big names can bankroll their own film: risky, but a hit pays far more than a fee.
  function produce() {
    var x = st();
    if (count('ac_produce')) return done(nope('I\'m already developing a project this year.'));
    if (busy(x) >= 2) return done(nope('My schedule is too full to produce a film this year.'));
    var opts = [['indie', 'A small indie', 2000000], ['studio', 'A studio-size film', 20000000]];
    ui().choose('🎬 Produce my own film', 'I put up the budget and star in it. As the producer I keep 20% of an indie\'s box office, or 25% of a studio-size film\'s. What kind of film?', opts.map(function (o) {
      return { label: o[1] + ' (' + E.fmt(E.$(o[2])) + ')', fn: function () {
        if (S().money < E.$(o[2])) return done(nope('I don\'t have ' + E.fmt(E.$(o[2])) + ' to put up.'));
        bump('ac_produce'); E.addMoney(-E.$(o[2]));
        var g = U.pick(GENRES.filter(function (q) { return q !== 'musical' || ((S().skills || {}).singing || 0) > 30; }));
        var c = { kind: o[0], part: 'Lead', title: U.pick(W1) + ' ' + U.pick(W2), studio: o[0] === 'indie' ? 'a self-financed production' : pickStudio('studio'), genre: g, pay: 0, diff: 0, rep: KINDS[o[0]].parts.Lead[3], produced: true, budget: o[2], bud: o[2] / 1e6 };
        x.slate.push(c); grow(x, 1); E.stat('happy', 8);
        done(good('I\'m producing and starring in "' + c.title + '", a ' + g + '. It comes out at the end of the year. 🎬'));
      } };
    }).concat([{ label: 'Not now', fn: function () { done(null); } }]));
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
      '<div class="hb-arch">' + typeName(strongest(x)) + (typecast(x) ? (typecast(x) === strongest(x) ? ' · typecast' : ' · typecast as ' + typeName(typecast(x)).toLowerCase()) : '') + (x.muse ? ' · ' + U.esc(x.muse) + '\'s muse' : '') + '</div>' +
      '<div class="minibar wide"><span>Craft ' + Math.round(x.skill) + '</span><span class="track"><span class="fill ' + (x.skill >= 66 ? 'hi' : x.skill >= 33 ? 'mid' : 'lo') + '" style="width:' + Math.round(x.skill) + '%"></span></span></div>' +
      CRAFT.map(function (c) { var v = ca(x, c[0]); return '<div class="minibar wide"><span>' + c[1] + ' ' + v + '</span><span class="track"><span class="fill ' + (v >= 66 ? 'hi' : v >= 33 ? 'mid' : 'lo') + '" style="width:' + v + '%"></span></span></div>'; }).join('') +
      '<div class="minibar wide"><span>Star power ' + Math.round(x.rep) + '</span><span class="track"><span class="fill ' + (x.rep >= 60 ? 'hi' : x.rep >= 25 ? 'mid' : 'lo') + '" style="width:' + Math.min(100, Math.round(x.rep)) + '%"></span></span></div>' +
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
        items.push({ icon: '🏆', label: 'Career highlights', onClick: highlights });
        return items;
      }
      items.push({ section: 'Casting calls · ' + Math.max(0, left) + ' auditions left' });
      calls().forEach(function (c) {
        var k = KINDS[c.kind], p = odds(x, c);
        items.push({ icon: TL.logos && !/^(a |the )/.test(c.studio) ? TL.logos.badge(c.studio) : k.icon, label: '"' + c.title + '"', sub: k.name + ' · ' + c.part + (c.genre && c.genre !== 'ad' ? ' · ' + c.genre : '') + (c.director ? ' · dir. ' + c.director.split(' ').pop() + (collabs(x, c.director) ? ' (' + collabs(x, c.director) + '× before)' : '') : '') + (c.costar ? ' · with ' + c.costar : '') + (c.streaming ? ' · streaming' : '') + ' · ' + oddsWord(p) + fitWord(c), right: c.pay ? E.fmt(E.$(c.pay)) + (k.series ? '/season' : '') : 'Unpaid', disabled: left <= 0, onClick: function () { audition(c); } });
      });
      if (!x.calls.list.length) items.push({ info: true, html: '<p class="muted">No more casting calls this year.</p>' });
      items.push({ section: 'Career' });
      CLASSES.forEach(function (cl) { if (me().age >= cl[4]) items.push({ icon: cl[1], label: cl[2], sub: cl[6] ? CRAFT.filter(function (c) { return c[0] === cl[6]; })[0][1] + ' ' + ca(x, cl[6]) : 'Everything, a little', right: E.fmt(E.$(cl[3])), disabled: count('ac_' + cl[0]) > 0, onClick: function () { train(cl); } }); });
      if (!x.headshots || S().year - x.headshots >= 10) items.push({ icon: '📸', label: 'Get headshots', right: E.fmt(E.$(600)), onClick: headshots });
      if (me().age >= 16) items.push({ icon: '🤝', label: x.agent ? 'Look for a bigger agency' : 'Find an agent', sub: x.agent ? 'Now: ' + x.agent.name : 'Better auditions, 10% fee', disabled: count('ac_agent') > 0, onClick: findAgent });
      if (me().age >= 18) items.push({ icon: '🥂', label: 'Go to an industry party', disabled: count('ac_party') > 0, onClick: party });
      if (x.contract) items.push({ info: true, html: '<p class="small muted">📜 Under contract with ' + U.esc(x.contract.studio) + ' through ' + x.contract.until + ': they pick a picture for me every year.</p>' });
      if (x.rep >= 25 && me().age >= 16) items.push({ icon: S().year < 1948 ? '📻' : '🛋️', label: S().year < 1948 ? 'Do a radio interview' : 'Go on ' + (talkShow() || 'a talk show'), sub: 'Charm the audience (or go viral for the wrong reasons)', disabled: count('ac_talk') > 0, onClick: talk });
      if (x.slate.length) items.push({ icon: '🎤', label: 'Do a press tour', sub: 'Better buzz for this year\'s releases', disabled: count('ac_press') > 0, onClick: pressTour });
      if (x.series && x.series.seasons) items.push({ icon: '💰', label: 'Ask for a raise', sub: 'Now ' + E.fmt(E.$(x.series.pay)) + '/season · could backfire', disabled: count('ac_raise') > 0, onClick: askRaise });
      if (x.rep >= 50 && me().age >= 21) items.push({ icon: '🎥', label: 'Produce my own film', sub: 'Put up the budget, keep a share of the box office' + (x.produced ? ' · ' + U.plural(x.produced, 'film') + ' so far' : ''), disabled: count('ac_produce') > 0, onClick: produce });
      if (x.series) items.push({ icon: '🚪', label: 'Leave "' + x.series.title + '"', onClick: leaveShow });
      if ((x.sagas || []).length) {
        items.push({ section: 'Franchises' });
        x.sagas.forEach(function (g) { items.push({ icon: '🍿', label: '"' + g.name + '"', sub: U.plural(g.films.length, 'film') + ' · ' + sagaStatus(g), onClick: function () { sagaMenu(g); } }); });
        items.push({ section: 'History' });
      }
      items.push({ icon: '🎞️', label: 'Filmography', sub: U.plural(x.credits.length, 'credit'), onClick: filmography });
      items.push({ icon: '🏆', label: 'Career highlights', sub: 'Awards, box office and milestones', onClick: highlights });
      if (x.credits.length) items.push({ icon: '🌅', label: 'Retire from acting', danger: true, onClick: retire });
      return items;
    });
  }
  function highlights() {
    ui().menu('Career highlights', function () {
      var x = st(), rows = [], aws = (S().awards || []).filter(function (a) { return /Academy|Emmy|Golden Globe|Tony/.test(a.award); });
      var films = x.credits.filter(function (r) { return r.gross; }), total = films.reduce(function (t, r) { return t + r.gross; }, 0);
      var top = films.slice().sort(function (a, b) { return b.gross - a.gross; })[0], best = x.credits.filter(function (r) { return r.review != null && r.kind !== 'commercial'; }).sort(function (a, b) { return b.review - a.review; })[0];
      var dirs = {}; x.credits.forEach(function (r) { if (r.director) dirs[r.director] = (dirs[r.director] || 0) + 1; });
      var fav = Object.keys(dirs).sort(function (a, b) { return dirs[b] - dirs[a]; })[0];
      aws.forEach(function (a) { rows.push({ icon: '🏆', label: a.award + ' (' + a.year + ')', sub: a.cat }); });
      if (x.noms) rows.push({ icon: '🎗️', label: U.plural(x.noms, 'major nomination') });
      var bil = films.filter(function (r) { return r.gross >= 1000; }).length;
      if (bil) rows.push({ icon: '🍿', label: U.plural(bil, 'billion-dollar film') });
      if (total) rows.push({ icon: '🎟️', label: big(total * 1e6) + ' career box office', sub: U.plural(films.length, 'film') });
      if (top) rows.push({ icon: '🎬', label: 'Biggest hit: "' + top.title + '"', sub: big(top.gross * 1e6) + ' worldwide (' + top.year + ')' });
      if (best) rows.push({ icon: '⭐', label: 'Best reviewed: "' + best.title + '"', sub: rt(best.review, best.year) + ' (' + best.year + ')' });
      if (fav && dirs[fav] >= 2) rows.push({ icon: '🎥', label: 'Favorite director: ' + fav, sub: U.plural(dirs[fav], 'project') + ' together' + (x.muse === fav ? ' · their muse' : '') });
      if (x.produced) rows.push({ icon: '🎥', label: 'Produced ' + U.plural(x.produced, 'film') });
      if (x.walk) rows.push({ icon: '⭐', label: 'Star on the Hollywood Walk of Fame', sub: 'Unveiled in ' + x.walk });
      if (x.honorary) rows.push({ icon: '🏆', label: 'Honorary Academy Award', sub: 'For lifetime achievement, ' + x.honorary });
      rows.push({ icon: '🎞️', label: U.plural(x.credits.length, 'credit'), sub: 'Range: ' + CRAFT.map(function (c) { return c[1] + ' ' + ca(x, c[0]); }).join(' · ') });
      return rows;
    });
  }
  function filmography() {
    var x = st();
    ui().menu('Filmography', function () {
      if (!x.credits.length) return [{ info: true, html: '<p class="muted">No credits yet.</p>' }];
      return x.credits.slice().reverse().map(function (r) {
        var k = KINDS[r.kind];
        return { icon: TL.logos && r.studio && !/^(a |the )/.test(r.studio) ? TL.logos.badge(r.studio) : k.icon, label: '"' + r.title + '" (' + r.year + ')', sub: k.name + ' · ' + r.part + (r.studio ? ' · ' + r.studio : '') + (r.director ? ' · dir. ' + r.director : '') + (r.costar ? ' · with ' + r.costar : '') + (r.review != null ? ' · ' + r.review + '% reviews' : '') + (r.gross ? ' · ' + big(r.gross * 1e6) + (r.budget ? ' on ' + big(r.budget * 1e6) : '') : ''), right: r.award ? '🏆' : r.nom ? '🎗️' : r.verdict === 'smash' ? '🍿' : r.verdict === 'bomb' ? '💣' : '' };
      });
    });
  }

  // ------------------------------------------------------------ franchises
  // A hit can turn into a franchise: sequels every few years, contracts,
  // holdouts and recasts, fatigue, spin-offs and a legacy sequel decades later.
  var VERDICT = { bomb: 'A box-office bomb. 💣', flop: 'It lost money.', even: 'It about broke even.', hit: 'A hit!', smash: 'A smash hit! 🍿' };
  var SEQUEL_ODDS = { action: 1.4, 'sci-fi': 1.4, horror: 1.6, comedy: 1, thriller: 0.9, musical: 0.5, romance: 0.4, 'crime drama': 0.6, drama: 0.25, 'period drama': 0.2 };
  var HEROES = ['Captain Nova', 'Agent Cross', 'Nightshade', 'the Ranger', 'Commander Vale', 'Ghost', 'Talon', 'Ember', 'the Warden', 'Specter'];
  // Production budget in millions (today's money); a studio wants about
  // 2.5 times that back before a film counts as a hit.
  function budget(r, prev) {
    if (!r.bud) r.bud = prev && prev.bud ? Math.round(prev.bud * U.randf(1.1, 1.4)) : r.kind === 'indie' ? U.rand(4, 20) : r.kind === 'studio' ? U.rand(30, 120) : U.rand(150, 300);
    return r.bud;
  }
  function saga(x, id) { return (x.sagas || []).filter(function (g) { return g.id === id; })[0] || null; }
  function role(genre) { return /action|sci-fi/.test(genre) ? U.pick(HEROES) : U.pick(['Jack', 'Maggie', 'Danny', 'Rosa', 'Eli', 'Nora', 'Frankie', 'Lucy', 'Sam', 'Tess']) + ' ' + U.pick(['Cole', 'Rivera', 'Hart', 'Monroe', 'Quinn', 'Bishop', 'Lane', 'Brooks']); }
  function newSaga(x, o) { x.sagas = x.sagas || []; o.id = x.sagas.length + 1; o.films = []; o.status = 'active'; o.contract = o.contract || 0; x.sagas.push(o); return o; }
  function maybeSequel(x, r, c) {
    var p = (c.verdict === 'smash' ? 0.42 : c.verdict === 'hit' ? 0.18 : 0) * (SEQUEL_ODDS[r.genre] || 1) * (r.kind === 'indie' ? 0.5 : 1);
    if (!U.chance(p)) return;
    var g = newSaga(x, { name: r.title, studio: r.produced || r.kind === 'indie' ? pickStudio('studio') : r.studio, genre: r.genre, kind: r.kind === 'blockbuster' ? 'blockbuster' : 'studio', part: r.part, role: role(r.genre), fee: Math.max(r.pay || 0, KINDS.studio.parts[r.part === 'Lead' ? 'Lead' : 'Supporting'][0]), director: r.director });
    sagaFilm(x, g, r, c);
    E.log('🍿 ' + g.studio + ' greenlit a sequel to "' + r.title + '". They want me back as ' + g.role + '.', 'good');
  }
  // Record a franchise film and decide what happens next.
  function sagaFilm(x, g, r, c) {
    var y = S().year, n;
    g.films.push({ title: c.title, year: y, gross: c.gross, base: c.base, review: c.review, verdict: c.verdict, part: r.part, bud: budget(r) });
    c.saga = g.id; g.bud = budget(r); n = g.films.length;
    if (r.legacy) { g.status = 'ended'; g.legacy = true; return; }
    if (n >= 3 && g.films.filter(function (f) { return /Lead/.test(f.part); }).length >= 3) E.achieve('franchise_star');
    if (g.contract > 0 || n === 1) { g.due = y + U.rand(2, 3); return; }
    if (c.verdict === 'bomb' || c.verdict === 'flop' || (n >= 3 && U.chance(0.2 + (n - 3) * 0.2))) {
      g.status = 'ended'; g.ended = y;
      E.log('🎬 ' + g.studio + ' closed the book on the "' + g.name + '" franchise after ' + U.plural(n, 'film') + '.', '');
      return;
    }
    g.due = y + U.rand(2, 3);
    // A scene-stealing supporting part can earn its own movie.
    if (!/Lead/.test(r.part) && c.verdict === 'smash' && n >= 2 && U.chance(0.3)) S().pending.push({ id: 'ac_spinoff', data: { id: g.id, year: y } });
  }
  function sequelTitle(g, legacy) {
    var n = g.films.length + 1, b = g.name, used = g.films.map(function (f) { return f.title; }), t;
    for (var i = 0; i < 6; i++) {
      t = legacy ? b + ': ' + U.pick(['Legacy', 'Resurrection', 'Homecoming', 'Reckoning'])
        : n === 2 ? b + U.pick([' 2', ' II', ': Reloaded', ' Returns', ': The Next Chapter'])
        : n === 3 ? b + U.pick([' 3', ': Endgame', ': Rise of the Fallen', ' III'])
        : b + U.pick([' ' + n, ': Origins', ': Dead Reckoning', ': The Final Chapter', ': Revelations', ': Reborn']);
      if (used.indexOf(t) < 0) break;
    }
    return t;
  }
  function sequelFee(x, g) {
    var last = g.films[g.films.length - 1], up = { bomb: 0.8, flop: 0.9, even: 1.05, hit: 1.35, smash: 1.8 }[last ? last.verdict : 'even'] || 1;
    var floor = KINDS[g.kind].parts[/Lead/.test(g.part) ? 'Lead' : 'Supporting'][0];
    return Math.round(Math.max(floor, Math.min(g.fee * up * (1 + x.rep / 300), 30000000)) / 1000) * 1000;
  }
  // Called every year: offers for sequels that are due, and the franchises I left.
  function sagaTick(x) {
    var s = S(), y = s.year;
    (x.sagas || []).forEach(function (g) {
      if (g.status === 'active' && g.due && y >= g.due && g.asked !== y) {
        if (x.retired || s.prison) { g.status = 'recast'; g.due = y + 1; return; }
        g.asked = y; s.pending.push({ id: 'ac_sequel', data: { id: g.id, year: y } });
      } else if (g.status === 'recast' && y >= g.due) {
        g.status = 'ended'; g.ended = y;
        var gr = Math.round(((g.films[g.films.length - 1] || {}).gross || 50) * U.randf(0.4, 0.9)) || 1;
        E.log('🍿 "' + sequelTitle(g) + '" came out with a new actor as ' + g.role + '. It grossed ' + big(gr * 1e6) + '. ' + U.pick(['Fans said it wasn\'t the same without me.', 'Critics said the new lead was fine.', 'Nobody seemed to miss me.']), '');
      } else if ((g.status === 'ended' || g.status === 'left') && !g.legacy && !x.retired && me().age >= 45 && g.films.length) {
        var last = g.films[g.films.length - 1], wasHit = g.films.some(function (f) { return f.verdict === 'hit' || f.verdict === 'smash'; });
        if (wasHit && y - last.year >= 15 && U.chance(0.08)) { g.legacy = true; s.pending.push({ id: 'ac_sequel', data: { id: g.id, year: y, legacy: true } }); }
      }
    });
  }
  function sagaStatus(g) {
    return g.status === 'active' ? (g.contract ? U.plural(g.contract, 'film') + ' left on my contract · ' : '') + 'next film ' + (g.due || S().year + 1)
      : g.status === 'recast' ? 'recast without me' : g.status === 'left' ? 'I walked away' : 'ended' + (g.ended ? ' in ' + g.ended : '');
  }
  function sagaMenu(g) {
    ui().menu('"' + g.name + '"', function () {
      var total = g.films.reduce(function (t, f) { return t + (f.gross || 0); }, 0);
      var rows = [{ info: true, html: '<div class="hb-arch">🍿 ' + U.esc(g.studio) + ' · ' + U.esc(g.genre) + ' · I play ' + U.esc(g.role) + '</div><p class="small muted">' + U.plural(g.films.length, 'film') + ' · ' + big(total * 1e6) + ' worldwide · ' + sagaStatus(g) + '</p>' }];
      g.films.forEach(function (f) { rows.push({ icon: f.verdict === 'smash' ? '🍿' : f.verdict === 'bomb' ? '💣' : '🎬', label: '"' + f.title + '" (' + f.year + ')', sub: f.part + ' · ' + f.review + '% reviews · ' + big((f.gross || 0) * 1e6) + ' on a ' + big((f.bud || 1) * 1e6 * Math.min(1, TL.history ? TL.history.priceLevel(f.year) : 1)) + ' budget', right: { bomb: 'Bomb', flop: 'Flop', even: 'Even', hit: 'Hit', smash: 'Smash' }[f.verdict] || '' }); });
      return rows;
    });
  }
  function shootSequel(x, g, fee, legacy, title) {
    var lead = /Lead/.test(g.part) || legacy;
    var c = { kind: g.kind, part: lead ? 'Lead' : g.part, title: title || sequelTitle(g, legacy), studio: eraName(g.studio) || g.studio, genre: g.genre, director: g.director && U.chance(0.6) ? g.director : pickDirector(), pay: fee, rep: KINDS[g.kind].parts[lead ? 'Lead' : 'Supporting'][3], saga: g.id, legacy: !!legacy };
    g.fee = fee; if (g.contract > 0) g.contract--;
    x.slate.push(c); pay(fee); E.stat('happy', 8);
    return c;
  }

  // ------------------------------------------------------------ the year
  // Everything I shot this year comes out; returns this year's acting pay.
  function release(r, x) {
    var k = KINDS[r.kind], s = S();
    if (r.defer) { r.defer = false; pay(r.pay); } // never settled the deal: the standard fee
    var tc = typecast(x), again = collabs(x, r.director);
    var sg = r.saga ? saga(x, r.saga) : null, prev = sg && sg.films.length ? sg.films[sg.films.length - 1] : null;
    // Sequels tend to review a little worse than the film that earned them.
    var q = x.skill * 0.35 + U.rand(5, 60) + fit(r) + (r.passion ? 12 : 0) + (r.franchise ? -8 : 0) + (prev ? -3 * sg.films.length + (r.legacy ? 6 : 0) : 0) + (x.press === s.year ? 4 : 0) + Math.min(4, again * 1.5) + (r.method ? 5 : 0) + (r.prep || 0) + (r.set || 0);
    var review = U.clamp(Math.round(q), 4, 99);
    var credit = { year: s.year, title: r.title, kind: r.kind, part: r.part, studio: r.studio, review: review, genre: r.genre, director: r.director };
    if (sg) credit.saga = sg.id;
    if (r.costar) credit.costar = r.costar;
    if (r.streaming) credit.streaming = 1;
    if (r.kind !== 'commercial') shiftCraft(x, GENRE_CRAFT[r.genre], 0.4);
    if (tc && GENRE_CRAFT[r.genre] && GENRE_CRAFT[r.genre] !== tc && review >= 80 && /Lead/.test(r.part)) E.log('🎭 "' + r.title + '" proved I\'m more than ' + E.an(typeName(tc).toLowerCase()) + '. Critics are calling it a revelation.', 'good');
    if (r.director && again >= 2 && review >= 85 && x.muse !== r.director) { x.muse = r.director; E.log('🎬 ' + r.director + ' calls me their muse. Expect more of their scripts.', 'good'); }
    var lead = /Lead/.test(r.part) || r.part === 'Voice role', msg, cls = '', after = null, after0 = null;
    // Every credit builds my name; good reviews and leading parts build it faster, flops can cost me.
    var dr = r.rep * U.clamp(0.5 + (review - 50) / 40, 0.15, 1.8) * (lead ? 1.2 : 1);
    if (r.streaming) {
      // Streaming movies report households, not box office.
      var views = Math.max(1, Math.round((x.rep / 100 * 50 + review / 3) * U.randf(0.6, 1.4)));
      credit.views = views;
      dr += views >= 60 ? 1.5 : views < 20 ? -1 : 0;
      msg = '📺 "' + r.title + '" (' + r.genre + ')' + (r.costar ? ', co-starring ' + r.costar + ',' : '') + ' premiered on ' + r.studio + ' and was watched by ' + views + ' million households in its first month, with ' + rt(review) + '.' + (views >= 60 ? ' It was the #1 movie on ' + r.studio + '. 🍿' : '');
      cls = views >= 60 || review >= 85 ? 'good' : '';
    } else if (k.film && k.gross) {
      var bud = budget(r, prev && sg), base = U.randf(k.gross[0], k.gross[1]) * (0.4 + review / 100) * (1 + x.rep / 200) * (r.franchise ? 1.6 : 1);
      // A sequel opens to the fans the last film made, minus franchise fatigue;
      // a legacy sequel decades later rides on nostalgia.
      if (prev) base = Math.max(base * 0.6, (prev.base || prev.gross) * U.randf(0.75, 1.3) * (0.55 + review / 110)) * (r.legacy ? 1.3 : Math.pow(0.9, Math.max(0, sg.films.length - 2)));
      // The pandemic emptied theaters in 2020; 2021 was half a recovery.
      var covid = s.year === 2020 ? 0.2 : s.year === 2021 ? 0.65 : 1; base *= covid;
      // Dollars in the money of the day: a 1985 smash didn't make a billion.
      var pl = Math.min(1, TL.history ? TL.history.priceLevel(s.year) : 1), gross = Math.max(1, Math.round(base * pl)), ratio = base / bud;
      var verdict = ratio < 1.2 ? 'bomb' : ratio < 2.2 ? 'flop' : ratio < 3 ? 'even' : ratio < 5 ? 'hit' : 'smash';
      credit.gross = gross; credit.budget = Math.max(1, Math.round(bud * pl)); credit.verdict = verdict; credit.base = Math.round(base);
      if (gross >= 1000) { E.achieve('box_office'); dr += 4; }
      // Back-end points: my share of the gross (after the studio's creative accounting).
      if (r.points) { var cut0 = Math.round(base * 1e6 * r.points / 100 * 0.45); if (cut0 > 0) { pay(cut0); after0 = '💰 My ' + r.points + ' back-end points on "' + r.title + '" paid ' + E.fmt(E.$(cut0)) + (cut0 > r.pay ? '. Betting on myself paid off.' : '. I should have taken the fee.'); } }
      if (r.produced) {
        var cut = Math.round(base * 1e6 * (r.kind === 'indie' ? 0.2 : 0.25)), net = cut - r.budget;
        E.addMoney(E.$(cut));
        E.log('🎬 As producer, my share of "' + r.title + '" came to ' + E.fmt(E.$(cut)) + (net >= 0 ? ', a ' + E.fmt(E.$(net)) + ' profit on my ' + E.fmt(E.$(r.budget)) + ' investment.' : '. I lost ' + E.fmt(E.$(-net)) + ' of my ' + E.fmt(E.$(r.budget)) + ' investment.'), net >= 0 ? 'good' : 'bad');
        x.produced = (x.produced || 0) + 1;
      }
      // Leads carry a film's box office; a bomb sticks to them.
      dr += { bomb: -3, flop: -1, even: 0, hit: 0.7, smash: 1.5 }[verdict] * (lead ? 1 : 0.5) * (covid < 1 && /bomb|flop/.test(verdict) ? 0 : 1); // nobody blames you for an empty theater in 2020
      msg = k.icon + ' "' + r.title + '" (' + r.genre + (prev ? (r.legacy ? ', legacy sequel' : ', film ' + (sg.films.length + 1) + ' of the franchise') : '') + ') opened to ' + big(gross * 1e6 * U.randf(0.14, 0.3)) + ' and grossed ' + big(gross * 1e6) + ' worldwide on a ' + big(credit.budget * 1e6) + ' budget, with ' + rt(review) + '. ' + (verdict === 'smash' && gross >= 1000 ? 'A billion-dollar smash! 🍿' : VERDICT[verdict]);
      cls = verdict === 'smash' || verdict === 'hit' ? 'good' : (verdict === 'bomb' || verdict === 'flop') && lead ? 'bad' : '';
      if (r.costar) msg = msg.replace('" (' + r.genre + ')', '" (' + r.genre + ', with ' + r.costar + ')');
      if (s.year < 1928) msg = msg.replace('" (' + r.genre, '" (a silent ' + r.genre);
      if (covid < 1) msg += s.year === 2020 ? ' Theaters were mostly closed by the pandemic.' : ' Audiences were only starting to come back to theaters.';
      msg += critic(review, s.year);
      if (r.kind !== 'student') after = function () { if (sg) sagaFilm(x, sg, r, credit); else maybeSequel(x, r, credit); };
    } else if (r.kind === 'commercial') {
      msg = (s.year < 1949 ? '📻 My radio ad for ' : '📺 My commercial for ') + (r.brand || 'a soda brand') + ' aired nationwide.'; dr = 0.6;
    } else {
      msg = k.icon + ' ' + (k.stage ? 'My show "' + r.title + '" opened' : '"' + r.title + '" premiered') + ' to ' + (review >= 85 ? 'rave reviews' : review >= 60 ? 'good reviews' : review >= 40 ? 'mixed reviews' : 'terrible reviews') + ' (' + rt(review) + ').';
    }
    x.rep = U.clamp(x.rep + (dr + 0.5 > 0 ? (dr + 0.5) * rise(x) : dr + 0.5), 0, 100);
    if (review >= 85 && cls !== 'bad') cls = 'good';
    E.log(msg, cls);
    if (after0) E.log(after0, 'money');
    if (after) after();
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
    var win = 0.18 + (best.review - 84) / 45 + x.rep / 600 - x.wins * 0.05;
    // Film awards are won in campaigns as much as performances.
    if (k.film && S().year >= 1940) E.queue('ac_campaign', { award: aw, cat: cat, win: win, year: S().year });
    else E.queue('award', { award: aw, cat: cat, win: win });
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
      var sdr = KINDS.series.parts[sr.part][3] * (q - 55) / 50 + 0.3;
      x.rep = U.clamp(x.rep + (sdr > 0 ? sdr * rise(x) : sdr), 0, 100);
      E.fame(Math.max(0, q / 25 - 1));
      E.log('📺 Season ' + sr.seasons + ' of "' + sr.title + '" aired on ' + sr.network + ' (' + rt(q) + ').', q >= 85 ? 'good' : '');
      results.push({ credit: { year: s.year, title: sr.title, kind: 'series', part: sr.part, review: q }, review: q, lead: /lead/.test(sr.part) });
      if (U.chance(q >= 75 ? 0.08 : q >= 55 ? 0.25 : 0.6) || sr.seasons >= 9) {
        E.log('📺 ' + sr.network + (sr.seasons >= 9 ? ' wrapped "' + sr.title + '" after ' + sr.seasons + ' seasons. What a run.' : ' canceled "' + sr.title + '" after ' + U.plural(sr.seasons, 'season') + '.'), sr.seasons >= 5 ? '' : 'bad');
        x.series = null;
      }
    }
    // Out of sight, out of mind.
    // Stars fade unless they keep landing hits; out of sight, out of mind.
    // Working actors only fade slowly; a year with nothing on screen hurts.
    x.rep = Math.max(0, x.rep - (results.length || x.series ? x.rep / 45 : 0.3 + x.rep / 32));
    if (!results.length && !x.series && !x.retired) x.rep = Math.max(0, x.rep - U.rand(1, 3));
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
    sagaTick(x);
    // The 2023 actors' strike shut Hollywood down for months.
    if (s.year === 2023 && !x.retired && (results.length || x.series)) { x.earn = Math.round(x.earn * 0.6); E.log('🪧 The SAG-AFTRA strike shut down film and TV for months. I walked the picket line.', 'bad'); E.karma(1); }
    // Hollywood's studio system: a seven-year contract means a steady check and the studio picks my roles.
    if (x.contract) {
      if (s.year > x.contract.until || x.retired) { E.log('📜 My contract with ' + x.contract.studio + ' ended. I\'m a free agent now.', ''); x.contract = null; }
      else {
        x.earn += Math.round(E.$(x.contract.pay) * (x.agent ? 0.9 : 1));
        if (busy(x) < 2) { var part = x.rep >= 45 ? 'Lead' : 'Supporting', kp = KINDS.studio.parts[part]; x.slate.push({ kind: 'studio', part: part, title: U.pick(W1) + ' ' + U.pick(W2), studio: x.contract.studio, genre: U.pick(GENRES), director: pickDirector(), costar: pickCostar(), pay: 0, diff: kp[2], rep: kp[3], assigned: true }); E.log('🎬 ' + x.contract.studio + ' cast me in "' + x.slate[x.slate.length - 1].title + '". I didn\'t get a say.', ''); }
      }
    } else if (!x.retired && !s.prison && s.year >= 1930 && s.year <= 1959 && x.rep >= 15 && me().age >= 16 && U.chance(0.25)) s.pending.push({ id: 'ac_contract', data: { year: s.year } });
    var earned = x.earn; x.earn = 0;
    if (j && j.acting) { j.salary = earned; j.title = title(); j.perf = U.clamp(Math.round(x.rep), 0, 100); }
    if (x.rep >= 74) E.achieve('famous');
    // Lifetime honors.
    if (!x.walk && x.rep >= 70 && x.credits.length >= 25) { x.walk = s.year; E.log('⭐ I got a star on the Hollywood Walk of Fame!', 'good'); E.fame(5); E.achieve('walk_of_fame'); }
    if (!x.honorary && me().age >= 60 && x.credits.length >= 30 && x.best >= 85 && (x.wins >= 1 || x.noms >= 3) && U.chance(0.15)) {
      x.honorary = s.year; (s.awards = s.awards || []).push({ award: 'Honorary Academy Award', cat: 'lifetime achievement', year: s.year }); E.log('🏆 The Academy gave me an Honorary Oscar for my lifetime of work.', 'good'); E.fame(8);
    }
    return earned;
  }
  // Child actors and actors with day jobs still release their projects.
  function yearly() {
    var s = S();
    if (!s || s.dead || !s.acting || hasJob()) return;
    var x = st();
    if (!x.slate.length && !x.series) { sagaTick(x); if (x.rep > 0 && U.chance(0.5)) x.rep = Math.max(0, x.rep - 1); return; }
    var earned = year();
    if (earned) { E.addMoney(Math.round(earned * 0.75)); E.log('🎬 Acting income: ' + E.fmt(Math.round(earned * 0.75)), 'money'); }
  }

  def('ac_franchise', { build: function () {
    var x = st(), fee = Math.round(U.rand(4, 12) * (1 + x.rep / 100)) * 1e6, hero = U.pick(['a superhero', 'a space captain', 'a vampire hunter', 'a secret agent', me().gender === 'F' ? 'a fantasy queen' : 'a fantasy king', 'a dragon rider']), studio = pickStudio('blockbuster');
    return { icon: '🦸', title: 'Franchise offer', text: studio + ' wants me to play ' + hero + ' in a three-picture franchise. ' + E.fmt(E.$(fee)) + ' for the first film.', choices: [
      { label: 'Sign the deal', run: function () { x.franchise = true; var t = U.pick(W1) + ' ' + U.pick(W2), g = newSaga(x, { name: t, studio: studio, genre: U.pick(['action', 'sci-fi']), kind: 'blockbuster', part: 'Lead', role: hero.replace(/^an? /, 'the '), fee: fee, contract: 2, director: pickDirector() }); x.slate.push({ kind: 'blockbuster', part: 'Lead', title: t, studio: studio, genre: g.genre, director: g.director, pay: fee, rep: 12, franchise: true, saga: g.id }); pay(fee); E.achieve('big_break'); E.stat('happy', 12); return good('I\'m the new face of the "' + t + '" franchise, signed for three films! 🦸'); } },
      { label: 'Pass. I want serious roles.', run: function () { x.skill = Math.min(100, x.skill + 1); return 'I turned down the franchise. My agent cried a little.'; } }
    ] };
  } });
  def('ac_contract', { build: function (d) {
    var x = S().acting; if (!x || !d || d.year !== S().year || x.contract) return null;
    var studio = U.pick(['MGM', 'Paramount', 'Warner Bros.', '20th Century Studios', 'Columbia Pictures', 'Universal', 'RKO Pictures'].map(function (n) { return eraName(n); }).filter(Boolean)), pay = Math.round((20000 + x.rep * 1500) / 1000) * 1000;
    return { icon: '📜', title: 'A studio contract', text: studio + ' offered me a seven-year contract: ' + E.fmt(E.$(pay)) + ' a year, a picture every year, and the studio decides what I play. That\'s how Hollywood works.', choices: [
      { label: 'Sign with ' + studio, run: function () { x.contract = { studio: studio, until: S().year + 7, pay: pay }; E.stat('happy', 8); E.fame(2); return good('I\'m a contract player at ' + studio + ' now. 🎬'); } },
      { label: 'Stay independent', run: function () { x.skill = Math.min(100, x.skill + 0.5); return 'I turned the studio down. Nobody tells me what to play.'; } }
    ] };
  } });
  def('ac_set', { build: function (d) {
    var x = S().acting, r = x && d && d.year === S().year && x.slate.filter(function (q) { return q.title === d.title; })[0];
    if (!r) return null;
    var dir = r.director || 'the director', kinds = ['clash', 'reshoot', 'costar', 'accident'];
    var k = U.pick(r.costar ? kinds : kinds.filter(function (q) { return q !== 'costar'; }).concat(['feud']));
    if (k === 'clash') return { icon: '🎬', title: 'Trouble on set', text: dir + ' and I disagree about my character on "' + r.title + '". It\'s getting tense.', choices: [
      { label: 'Trust ' + dir.split(' ').pop(), run: function () { r.set = 1; return 'I did it ' + dir.split(' ').pop() + '\'s way. The dailies look great.'; } },
      { label: 'Fight for my version', run: function () { if (U.chance(0.5)) { r.set = 3; return good('I fought for my take and it\'s the best scene in the movie.'); } r.set = -4; x.rep = Math.max(0, x.rep - 1); return bad('Word got out that I\'m "difficult." The final cut uses the other take anyway.'); } },
      { label: 'Walk off set for a day', run: function () { r.set = -3; E.fame(1); return bad('The tabloids loved it. The studio did not.'); } }] };
    if (k === 'reshoot') return { icon: '🎞️', title: 'Reshoots', text: 'Test audiences hated the ending of "' + r.title + '". The studio wants six weeks of reshoots.', choices: [
      { label: 'Do the reshoots', run: function () { r.set = 2; E.stat('happy', -3); return 'Six more weeks. The new ending is better.'; } },
      { label: 'Refuse, I\'ve got other plans', run: function () { r.set = -4; return 'They reshot around me with a body double. It shows.'; } }] };
    if (k === 'costar') return { icon: '🤝', title: 'Chemistry', text: 'Working with ' + r.costar + ' on "' + r.title + '" is a dream. We keep cracking each other up between takes.', choices: [
      { label: 'Learn everything I can from ' + r.costar.split(' ')[0], run: function () { r.set = 1; grow(x, 1); return good(r.costar + ' taught me more in a month than any acting class.'); } },
      { label: 'Keep it professional', run: function () { r.set = 1; return 'We kept it professional. The chemistry still shows.'; } }] };
    if (k === 'feud') { var nm = E.randomName(U.pick(['M', 'F'])); return { icon: '😤', title: 'On-set feud', text: 'My co-star ' + nm.first + ' ' + nm.last + ' and I can\'t stand each other. We barely speak between takes on "' + r.title + '".', choices: [
      { label: 'Make peace', run: function () { r.set = 1; E.karma(1); return 'We talked it out over dinner. Not friends, but colleagues.'; } },
      { label: 'Let it play out in the press', run: function () { r.set = -2; E.fame(3); return 'Our feud is all over the gossip sites. Somehow it\'s selling tickets.'; } }] }; }
    return { icon: '🚑', title: 'Accident on set', text: 'A piece of the set collapsed during filming of "' + r.title + '". I\'m bruised but okay.', choices: [
      { label: 'Get back to work', run: function () { E.stat('health', -6); r.set = 1; return 'I finished the scene with a bandage under my costume.'; } },
      { label: 'Take a week off', run: function () { E.stat('health', 2); return 'I took a week to recover. Production waited.'; } }] };
  } });
  def('ac_campaign', { build: function (d) {
    if (!d || !d.award || d.year !== S().year) return null;
    var big0 = E.$(Math.round(150000 + st().rep * 4000)), small = Math.round(big0 / 4);
    var fin = function (w, txt) { E.queue('award', { award: d.award, cat: d.cat, win: U.clamp(w, 0.03, 0.9) }); return txt; };
    return { icon: '🗳️', title: 'Awards season', text: 'I\'m in the race for the ' + d.award + ' (' + d.cat + '). The studio asks how hard I want to campaign.', choices: [
      { label: 'Full campaign: ads, screenings, every dinner (' + E.fmt(big0) + ')', run: function () { E.addMoney(-big0); E.stat('happy', -3); return fin(d.win + 0.12, 'I shook every voter\'s hand in Los Angeles. The ads ran for weeks.'); } },
      { label: 'A modest campaign (' + E.fmt(small) + ')', run: function () { E.addMoney(-small); return fin(d.win + 0.05, 'I did a few Q&As and screenings.'); } },
      { label: 'Let the work speak for itself', run: function () { E.karma(1); return fin(d.win, 'No campaign. If they vote for me, it\'s for the performance.'); } }] };
  } });
  def('ac_passion', { build: function () {
    var x = st(), dir = U.pick(['an acclaimed auteur', 'a festival-darling director', 'a legendary filmmaker']);
    return { icon: '🎞️', title: 'A passion project', text: dir.charAt(0).toUpperCase() + dir.slice(1) + ' offered me the lead in a small, daring film. The pay is tiny, but the script is incredible.', choices: [
      { label: 'Do it for the art', run: function () { if (st().slate.length >= 2) return 'My schedule was too full. I had to say no.'; x.slate.push({ kind: 'indie', part: 'Lead', title: U.pick(W1) + ' ' + U.pick(W2), studio: pickStudio('indie'), genre: U.pick(['drama', 'period drama', 'thriller']), pay: 30000, rep: 8, passion: true }); pay(30000); return good('I signed on to the passion project. This one could be special. 🎞️'); } },
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

  def('ac_sequel', { build: function (d) {
    var x = S().acting, g = x && d && saga(x, d.id);
    if (!g || d.year !== S().year || x.retired) return null;
    var fee = sequelFee(x, g), last = g.films[g.films.length - 1], t = sequelTitle(g, d.legacy), bound = g.contract > 0 && !d.legacy;
    if (d.legacy) fee = Math.round(fee * 1.3 / 1000) * 1000;
    // Too busy: the studio waits a year (a legacy sequel moves on without me).
    if (busy(x) >= 2 && !bound) { if (d.legacy) g.legacy = false; else g.due = S().year + 1; return null; }
    var text = d.legacy ? 'It\'s been ' + (S().year - last.year) + ' years since "' + last.title + '". ' + g.studio + ' wants me back as ' + g.role + ', older and grayer, in "' + t + '", passing the torch to a new cast.'
      : g.studio + ' is making "' + t + '", film ' + (g.films.length + 1) + ' of the "' + g.name + '" franchise, and wants me back as ' + g.role + '. ' + (last ? 'The last one ' + (last.verdict === 'smash' ? 'was a smash' : last.verdict === 'hit' ? 'was a hit' : last.verdict === 'even' ? 'broke even' : 'lost money') + '.' : '') + (bound ? ' I\'m under contract for ' + U.plural(g.contract, 'more film') + '.' : '');
    return { icon: '🍿', title: d.legacy ? 'Legacy sequel' : 'Sequel offer', text: text + ' The offer: ' + E.fmt(E.$(fee)) + '.', choices: [
      { label: 'Sign on', run: function () { shootSequel(x, g, fee, d.legacy, t); return good('I\'m back as ' + g.role + ' in "' + t + '". 🍿'); } },
      { label: 'Hold out for more money', run: function () {
        var p = U.clamp(0.35 + ({ smash: 0.3, hit: 0.15, even: 0, flop: -0.15, bomb: -0.3 }[last ? last.verdict : 'even'] || 0) + x.rep / 250 - (bound ? 0.25 : 0), 0.05, 0.9);
        if (U.chance(p)) { var more = Math.round(fee * U.randf(1.4, 2) / 1000) * 1000; shootSequel(x, g, more, d.legacy, t); E.stat('happy', 4); return good('The studio blinked. I\'m getting ' + E.fmt(E.$(more)) + ' to play ' + g.role + ' again. 💰'); }
        if (bound) { shootSequel(x, g, fee, d.legacy, t); x.rep = Math.max(0, x.rep - 1); return bad('My contract says I\'m doing it anyway. The studio leaked that I was "difficult".'); }
        if (d.legacy) { g.status = 'ended'; return bad('The studio said no and wrote my character out of the script.'); }
        g.status = 'recast'; g.due = S().year + 1;
        return bad('The studio said no and recast ' + g.role + '. Someone else is wearing my costume now.');
      } },
      { label: bound ? 'Break my contract' : d.legacy ? 'Pass' : 'Walk away from the franchise', run: function () {
        if (d.legacy) return 'I passed. Some characters should stay retired.';
        g.status = 'recast'; g.due = S().year + 1;
        if (bound) { var hit = E.$(Math.round(fee * 0.5)); E.addMoney(-hit); x.rep = Math.max(0, x.rep - 3); g.contract = 0; return bad('I walked out on my contract. The studio sued, and I settled for ' + E.fmt(hit) + '.'); }
        x.skill = Math.min(100, x.skill + 0.5);
        return 'I hung up ' + g.role + '\'s costume for good. Time for something new.';
      } }
    ] };
  } });
  def('ac_spinoff', { build: function (d) {
    var x = S().acting, g = x && d && saga(x, d.id);
    if (!g || d.year !== S().year || x.retired) return null;
    var fee = Math.round(KINDS.studio.parts.Lead[0] * U.randf(1, 2) * (1 + x.rep / 150) / 1000) * 1000, t = g.role.replace(/^the /, '').replace(/\b\w/g, function (ch) { return ch.toUpperCase(); });
    return { icon: '🌟', title: 'Spin-off', text: 'Fans can\'t get enough of ' + g.role + '. ' + g.studio + ' wants to give my character their own movie, "' + t + '", with me as the lead. ' + E.fmt(E.$(fee)) + ' to start.', choices: [
      { label: 'Lead the spin-off', run: function () { var n = newSaga(x, { name: t, studio: g.studio, genre: g.genre, kind: 'studio', part: 'Lead', role: g.role, fee: fee }); x.slate.push({ kind: 'studio', part: 'Lead', title: t, studio: g.studio, genre: g.genre, director: pickDirector(), pay: fee, rep: 10, saga: n.id }); pay(fee); E.stat('happy', 10); return good('"' + t + '" is happening, and I\'m the star. 🌟'); } },
      { label: 'Stay a scene-stealer', run: function () { return 'I passed. Some characters work best in small doses.'; } }
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
