/* TheLife — v2.16: more special careers. Fashion model, chef and esports pro,
 * built on one shared ladder: reputation (0-100) sets your title and the gigs
 * you're offered, a career skill grows with practice, and each career has its
 * own signature system (brand contracts, your own restaurant with Michelin
 * stars, a streaming channel) and its own yearly honors.
 * State: S().sp[id]. The job has job.special = id and the year's pay in
 * job.salary. */
TL.specials = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function count(key) { var y = S().yearActs || (S().yearActs = {}); return y[key] || 0; }
  function bump(key) { var y = S().yearActs || (S().yearActs = {}); y[key] = (y[key] || 0) + 1; }
  function yr() { return S().year; }
  function era(list) { return list.filter(function (q) { return yr() >= q[1] && (!q[2] || yr() <= q[2]); }).map(function (q) { return q[0]; }); }

  // ------------------------------------------------------------ careers
  // ladder: [min rep, title, base yearly retainer]; gigs: [min rep, name, base pay, rep gain, difficulty]
  var C = {
    model: {
      name: 'Fashion model', icon: '📸', minAge: 14, maxStart: 30, skillName: 'Runway & posing',
      need: function () { return me().looks >= 55 ? null : 'Agencies want striking looks (55+ looks).'; },
      power: function (x) { return me().looks * 0.6 + x.skill * 0.4; },
      ladder: [[0, 'New Face', 4000], [25, 'Working Model', 25000], [50, 'In-Demand Model', 90000], [70, 'Top Model', 300000], [85, 'Supermodel', 1200000]],
      agencies: function () { return yr() < 1946 ? ['a local modeling agency', 'a department-store catalog studio'] : era([['Ford Models', 1946], ['Wilhelmina Models', 1967], ['Elite Model Management', 1972], ['IMG Models', 1987], ['Next Management', 1989]]); },
      train: ['Practice my runway walk', 'I practiced my walk and my angles.'],
      gigs: function () {
        return [[0, 'Catalog shoot', 2500, 4, 30], [0, 'Local fashion show', 1500, 4, 35], [25, 'Magazine editorial', 12000, 6, 50], [25, 'TV commercial', 20000, 5, 48],
          [50, 'Walk at ' + U.pick(['New York', 'Paris', 'Milan', 'London']) + ' Fashion Week', 40000, 8, 62],
          [70, 'Cover of ' + U.pick(era([['Vogue', 1892], ["Harper's Bazaar", 1867], ['Elle', 1945], ['Cosmopolitan', 1965], ['Sports Illustrated Swimsuit', 1964]])), 60000, 10, 70]];
      },
      big: ['💎', 'Luxury brand contract', 85, function () { return U.pick(yr() < 1920 ? ['a Paris couture house'] : era([['Chanel', 1920], ['Dior', 1947], ['Louis Vuitton', 1960], ['Calvin Klein', 1968], ['Versace', 1978], ['Victoria\'s Secret', 1995, 2018], ['Prada', 1985], ['Gucci', 1960]])); }],
      decline: 30
    },
    chef: {
      name: 'Chef', icon: '🧑‍🍳', minAge: 16, skillName: 'Cooking',
      need: function () { return null; },
      power: function (x) { return x.skill * 0.6 + me().smarts * 0.15 + me().happy * 0.1 + x.rep * 0.1; },
      ladder: [[0, 'Line Cook', 28000], [20, 'Sous Chef', 48000], [40, 'Head Chef', 72000], [60, 'Executive Chef', 110000], [80, 'Celebrity Chef', 300000]],
      agencies: function () { return ['a busy downtown restaurant', 'a hotel kitchen', 'a French bistro', 'a steakhouse', 'an Italian trattoria']; },
      train: ['Practice new recipes', 'I spent my nights off perfecting new recipes.'],
      gigs: function () {
        var tv = era([['a local cooking contest', 1900], ['Iron Chef', 1993], ['Iron Chef America', 2005], ['Top Chef', 2006], ['Chopped', 2009], ['MasterChef', 2010]]);
        return [[0, 'Cater a private party', 1500, 2, 30], [20, 'Cook at a food festival', 4000, 3, 45], [30, 'Compete on ' + tv[tv.length - 1], 10000, 6, 60],
          [50, 'Write a cookbook', 40000, 5, 55], [70, yr() >= 1993 ? 'Host a Food Network special' : 'Host a TV cooking special', 120000, 6, 65]];
      },
      big: ['🍽️', 'Open my own restaurant', 40, null]
    },
    gamer: {
      name: 'Esports pro', icon: '🎮', minAge: 13, maxStart: 26, minYear: 1997, skillName: 'Mechanics',
      need: function () { return yr() < 1997 ? 'There\'s no esports scene yet.' : null; },
      power: function (x) { return x.skill * 0.7 + me().smarts * 0.2 + (me().age <= 26 ? 10 : Math.max(0, 10 - (me().age - 26) * 3)); },
      ladder: [[0, 'Amateur', 0], [20, 'Semi-Pro', 6000], [40, 'Pro Player', 60000], [65, 'Star Player', 250000], [85, 'Esports Legend', 900000]],
      agencies: function () { return era([['Evil Geniuses', 1999], ['Team Liquid', 2000], ['Fnatic', 2004], ['SK Telecom T1', 2012], ['TSM', 2009], ['FaZe Clan', 2010], ['Cloud9', 2013], ['100 Thieves', 2017]]); },
      train: ['Grind ranked', 'I grinded ranked until 4 a.m.'],
      gigs: function () {
        return [[0, 'Online tournament', 500, 4, 35], [20, 'LAN tournament', 5000, 6, 48], [40, 'Major tournament', 50000, 9, 64]];
      },
      big: ['🏆', 'World Championship', 50, null],
      decline: 27
    },
    // ---- generic careers. big: [icon, label, min rep, kind, options], where kind is
    // 'contract' (pays every year), 'venture' (my own business) or 'final' (won round by round).
    // honor: [min rep, yearly chance, name]. Gigs may add [.., buy-in, injury risk].
    comic: {
      name: 'Stand-up comedian', icon: '🎤', minAge: 16, skillName: 'Material', blurb: 'Open mics, clubs, late-night TV, your own special',
      power: function (x) { return x.skill * 0.6 + me().smarts * 0.25 + me().happy * 0.15; },
      ladder: [[0, 'Open Micer', 0], [20, 'Club Comic', 15000], [40, 'Headliner', 60000], [65, 'Arena Comic', 250000], [85, 'Comedy Legend', 900000]],
      agencies: function () { return yr() < 1963 ? ['a Catskills resort', 'a nightclub circuit'] : era([['The Improv', 1963], ['The Comedy Store', 1972], ['Laugh Factory', 1979], ['Comedy Cellar', 1982]]); },
      train: ['Write new material', 'I filled a notebook with new bits.'],
      gigs: function () { var tv = era([['a variety show', 1900], ['The Tonight Show', 1954], ['Late Night', 1982], ['The Late Show', 1993]]); return [[0, 'Open mic', 50, 4, 30], [15, 'Club set', 800, 5, 42], [35, 'Stand-up spot on ' + tv[tv.length - 1], 5000, 7, 56], [55, 'Theater tour', 80000, 7, 66]]; },
      big: ['📺', 'Record a comedy special', 60, 'contract', { brands: function () { return yr() < 1975 ? ['a TV network'] : era([['HBO', 1975], ['Showtime', 1976], ['Comedy Central', 1991], ['Netflix', 2016]]); }, pay: [200000, 2000000], years: 1, verb: 'special' }],
      honor: [70, 0.12, function () { return yr() >= 1959 ? 'Grammy for Best Comedy Album' : 'Comedian of the Year'; }]
    },
    designer: {
      name: 'Fashion designer', icon: '🧵', minAge: 18, skillName: 'Design', blurb: 'Boutiques, red carpets, Fashion Week, your own label',
      power: function (x) { return x.skill * 0.6 + me().smarts * 0.2 + me().looks * 0.2; },
      ladder: [[0, 'Design Assistant', 26000], [20, 'Junior Designer', 45000], [40, 'Lead Designer', 90000], [60, 'Creative Director', 250000], [85, 'Fashion Icon', 700000]],
      agencies: function () { return era([['Chanel', 1910], ['Ralph Lauren', 1967], ['Calvin Klein', 1968], ['Donna Karan', 1984], ['Marc Jacobs', 1984], ['Alexander McQueen', 1992]]).concat(['an independent atelier']); },
      train: ['Sketch new designs', 'I sketched a whole collection.'],
      gigs: function () { return [[0, 'Design for a local boutique', 1500, 4, 30], [20, 'Dress a celebrity for the red carpet', 8000, 6, 48], [40, 'Show a collection at Fashion Week', 30000, 8, 62], [60, 'Design a collaboration for ' + (yr() >= 2004 ? 'H&M' : 'a department store'), 150000, 7, 66]]; },
      big: ['🏷️', 'Launch my own label', 40, 'venture', { cost: 150000, noun: 'label', names: ['Atelier ', 'House of ', 'Maison ', 'Studio '] }],
      honor: [70, 0.12, function () { return yr() >= 1981 ? 'CFDA Award' : 'Designer of the Year'; }]
    },
    author: {
      name: 'Novelist', icon: '📚', minAge: 14, skillName: 'Writing', blurb: 'Short stories, novels, book tours, movie deals',
      power: function (x) { return x.skill * 0.6 + me().smarts * 0.4; },
      ladder: [[0, 'Aspiring Writer', 0], [20, 'Published Author', 8000], [40, 'Bestselling Author', 120000], [65, 'Acclaimed Novelist', 200000], [85, 'Literary Legend', 700000]],
      agencies: function () { return era([['Scribner', 1846], ['Simon & Schuster', 1924], ['Random House', 1927], ['Penguin', 1935], ['Knopf', 1915], ['HarperCollins', 1989]]); },
      train: ['Write every morning', 'I wrote every single morning.'],
      gigs: function () { return [[0, 'Submit a short story to a magazine', 300, 4, 32], [15, 'Publish a novel', 15000, 6, 46], [35, 'Go on a book tour', 10000, 5, 44], [55, 'Write a bestseller', 100000, 7, 72]]; },
      big: ['🎞️', 'Sell the movie rights', 50, 'contract', { brands: function () { return era([['Paramount', 1912], ['Universal', 1912], ['Warner Bros.', 1923], ['HBO', 1972], ['A24', 2012], ['Netflix', 2015]]); }, pay: [200000, 2000000], years: 1, verb: 'rights' }],
      honor: [72, 0.08, function () { return S().country === 'United States' && yr() >= 1918 ? 'Pulitzer Prize for Fiction' : yr() >= 1969 ? 'Booker Prize' : 'National Book Award'; }]
    },
    poker: {
      name: 'Poker pro', icon: '🃏', minAge: 21, skillName: 'Reads & odds', blurb: 'Buy-ins, casinos, the World Series of Poker · 21+',
      power: function (x) { return x.skill * 0.5 + me().smarts * 0.5; },
      ladder: [[0, 'Grinder', 0], [20, 'Semi-Pro', 10000], [40, 'Pro', 50000], [65, 'High Roller', 200000], [85, 'Poker Legend', 600000]],
      agencies: function () { return era([['the card rooms of Las Vegas', 1931], ['Atlantic City casinos', 1978], ['online poker sites', 2001]]).concat(['the local card room']); },
      train: ['Study hands', 'I studied thousands of hands.'],
      gigs: function () { return [[0, 'Home game', 400, 3, 30, 100], [15, 'Casino tournament', 6000, 5, 46, 800], [40, 'High-roller tournament', 180000, 6, 66, 25000]]; },
      big: ['💰', function () { return yr() >= 1970 ? 'WSOP Main Event' : 'A legendary high-stakes game'; }, 50, 'final', { rounds: ['Day 1', 'Day 2', 'the final table', 'heads-up'], prize: [1000000, 8000000], honor: 'WSOP Main Event champion', base: 0.25, buyIn: 10000 }],
      honor: [60, 0.15, function () { return yr() >= 1970 ? 'WSOP bracelet' : 'Big tournament win'; }]
    },
    racer: {
      name: 'Race car driver', icon: '🏎️', minAge: 12, maxStart: 22, skillName: 'Racecraft', blurb: 'Karts, pro races, the Indy 500 · start by 22',
      need: function () { return me().athl < 40 ? 'I need to be fitter to handle the car (40+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.6 + me().athl * 0.25 + me().smarts * 0.15; },
      ladder: [[0, 'Karting', 0], [20, 'Club Racer', 15000], [40, 'Pro Driver', 250000], [65, 'Star Driver', 600000], [85, 'Racing Legend', 2500000]],
      agencies: function () { return era([['Ferrari', 1929], ['McLaren', 1963], ['Penske', 1966], ['Hendrick Motorsports', 1984], ['Andretti', 2003], ['Red Bull Racing', 2005], ['Mercedes', 2010]]).concat(['a privateer team']); },
      train: ['Practice laps', 'I ran practice laps until dark.'],
      gigs: function () { return [[0, 'Kart race', 300, 4, 30, 0, 1], [15, 'Regional race', 3000, 5, 45, 0, 1], [35, 'Pro race', 40000, 6, 66, 0, 1]]; },
      big: ['🏁', function () { return yr() >= 1911 ? 'Indianapolis 500' : 'A grand prix'; }, 55, 'final', { rounds: ['qualifying', 'the first 100 laps', 'the last 50 laps', 'the final lap'], prize: [1000000, 3500000], honor: 'Indy 500 winner', base: 0.3, risk: 1 }],
      honor: [70, 0.12, function () { return 'Driver of the Year'; }],
      decline: 38
    },
    magician: {
      name: 'Magician', icon: '🎩', minAge: 10, skillName: 'Sleight of hand', blurb: 'Birthday parties, TV specials, a Vegas residency',
      power: function (x) { return x.skill * 0.7 + me().looks * 0.15 + me().smarts * 0.15; },
      ladder: [[0, 'Party Magician', 0], [20, 'Club Magician', 15000], [40, 'Headliner', 70000], [65, 'Star Illusionist', 250000], [85, 'Legendary Illusionist', 1000000]],
      agencies: function () { return ['a talent agency', 'a variety booking agent']; },
      train: ['Practice my tricks', 'I practiced until no one could see the move.'],
      gigs: function () { return [[0, 'Birthday party', 150, 4, 25], [15, 'Magic set at a club', 1000, 5, 42], [35, 'TV special', 30000, 7, 58], [55, 'Arena tour', 120000, 7, 68]]; },
      big: ['🎰', 'Las Vegas residency', 65, 'contract', { brands: function () { return yr() < 1946 ? ['a big-city theater'] : era([['the Flamingo', 1946], ['Caesars Palace', 1966], ['the Mirage', 1989], ['the MGM Grand', 1993], ['the Bellagio', 1998]]); }, pay: [500000, 2500000], years: 3, verb: 'residency' }],
      honor: [70, 0.12, function () { return yr() >= 1968 ? 'Magician of the Year' : 'Top billing honor'; }]
    },
    dj: {
      name: 'DJ', icon: '🎧', minAge: 16, minYear: 1975, skillName: 'Mixing', blurb: 'Clubs, festivals, hit singles, Vegas · 1975+',
      need: function () { return yr() < 1975 ? 'Club DJs aren\'t a thing yet.' : null; },
      power: function (x) { return x.skill * 0.7 + me().happy * 0.15 + me().looks * 0.15; },
      ladder: [[0, 'Bedroom DJ', 0], [20, 'Club DJ', 20000], [40, 'Touring DJ', 120000], [65, 'Headliner', 400000], [85, 'Superstar DJ', 2000000]],
      agencies: function () { return ['a local club', 'a booking agency']; },
      train: ['Practice my sets', 'I practiced transitions all night.'],
      gigs: function () { var f = era([['a warehouse rave', 1975], ['EDC', 1997], ['Coachella', 1999], ['Ultra', 1999], ['Tomorrowland', 2005]]); return [[0, 'Club night', 300, 4, 30], [20, 'Warehouse party', 1500, 5, 42], [40, 'Play ' + f[f.length - 1], 40000, 7, 58], [60, 'Release a hit single', 100000, 7, 66]]; },
      big: ['🎰', 'Las Vegas residency', 65, 'contract', { brands: function () { return yr() < 2008 ? ['Studio 54-style superclub'] : era([['XS', 2008], ['Marquee', 2010], ['Hakkasan', 2013], ['Omnia', 2015]]); }, pay: [500000, 3000000], years: 2, verb: 'residency' }],
      honor: [75, 0.1, function () { return yr() >= 1997 ? 'DJ Mag #1 DJ in the world' : 'DJ of the Year'; }]
    },
    lifter: {
      name: 'Bodybuilder', icon: '🏋️', minAge: 16, maxStart: 30, skillName: 'Physique', blurb: 'Local shows, pro cards, Mr./Ms. Olympia · athletic',
      need: function () { return me().athl < 50 ? 'I need a strong athletic base first (50+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.5 + me().athl * 0.35 + me().looks * 0.15; },
      ladder: [[0, 'Gym Rat', 0], [20, 'Amateur Competitor', 5000], [40, 'IFBB Pro', 40000], [65, 'Champion', 200000], [85, 'Olympia Legend', 800000]],
      agencies: function () { return era([["Gold's Gym", 1965], ['World Gym', 1977]]).concat(['a local gym']); },
      train: ['Train like a maniac', 'I trained twice a day and ate seven meals.'],
      gigs: function () { return [[0, 'Local show', 300, 4, 30], [20, 'National qualifier', 2000, 6, 46], [40, 'Pro show', 15000, 9, 60], [55, 'Supplement sponsorship shoot', 60000, 5, 55]]; },
      big: ['🏆', function () { return me().gender === 'F' ? 'Ms. Olympia' : 'Mr. Olympia'; }, 55, 'final', { rounds: ['prejudging', 'the first callout', 'the posedown', 'the final callout'], prize: [100000, 600000], honor: 'Olympia champion', base: 0.33, minYear: 1965 }],
      honor: [70, 0.12, function () { return yr() >= 1989 ? 'Arnold Classic' : 'Bodybuilder of the Year'; }],
      decline: 40
    },
    chess: {
      name: 'Chess player', icon: '♟️', minAge: 6, skillName: 'Calculation', blurb: 'Opens, norms, Grandmaster, a World Championship match · smart',
      need: function () { return me().smarts < 60 ? 'I need sharper calculation first (60+ smarts).' : null; },
      power: function (x) { return x.skill * 0.6 + me().smarts * 0.4; },
      ladder: [[0, 'Club Player', 0], [20, 'FIDE Master', 6000], [40, 'International Master', 25000], [60, 'Grandmaster', 120000], [80, 'Elite Grandmaster', 600000]],
      agencies: function () { return ['the local chess club', 'a national chess federation']; },
      train: ['Study openings', 'I studied openings and endgames for hours.'],
      gigs: function () { return [[0, 'Weekend open', 100, 4, 30], [20, 'International open', 2000, 6, 48], [40, 'Elite invitational', 30000, 9, 62]].concat(yr() >= 2016 ? [[30, 'Stream on Twitch', 20000, 3, 40]] : []); },
      big: ['👑', 'World Championship match', 70, 'final', { rounds: ['the Candidates Tournament', 'the first half of the match', 'the second half', 'the tiebreaks'], prize: [500000, 2000000], honor: 'World Chess Champion', base: 0.3 }],
      honor: [65, 0.12, function () { return 'National champion'; }],
      decline: 45
    },
    wrestler: {
      name: 'Pro wrestler', icon: '🤼', minAge: 18, maxStart: 30, skillName: 'In-ring work', blurb: 'Indie shows, TV, pay-per-views, WrestleMania · athletic',
      need: function () { return me().athl < 45 ? 'I need to be in much better shape (45+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.5 + me().athl * 0.3 + me().looks * 0.2; },
      ladder: [[0, 'Indie Wrestler', 4000], [20, 'Developmental Talent', 50000], [40, 'Midcarder', 250000], [65, 'Main Eventer', 700000], [85, 'Hall of Famer', 2000000]],
      agencies: function () { return era([['NWA', 1948], ['WWF', 1979, 2001], ['WCW', 1988, 2001], ['WWE', 2002], ['AEW', 2019]]).concat(['a territory promotion']); },
      train: ['Work on my moves', 'I drilled moves in the ring all week.'],
      gigs: function () { return [[0, 'Indie show', 200, 4, 30, 0, 1], [20, 'TV taping', 5000, 5, 46, 0, 1], [40, 'Pay-per-view match', 50000, 7, 60, 0, 1], [50, 'Cut a promo that goes viral', 10000, 6, 55]]; },
      big: ['🏆', function () { return yr() >= 1985 ? 'Main event WrestleMania' : 'Main event a supercard'; }, 65, 'final', { rounds: ['the feud', 'the build-up', 'the match', 'the finish'], prize: [500000, 3000000], honor: 'World Champion', base: 0.38, risk: 1 }],
      honor: [70, 0.12, function () { return 'Wrestler of the Year'; }],
      decline: 38
    }
  };
  var GAMES = [['StarCraft', 1998], ['Counter-Strike', 2000], ['Halo 2', 2004], ['League of Legends', 2009], ['Dota 2', 2013], ['Fortnite', 2017], ['Valorant', 2020]];

  function bigName(c) { return typeof c.big[1] === 'function' ? c.big[1]() : c.big[1]; }
  function all() { return S().sp || (S().sp = {}); }
  function st(id) { return all()[id]; }
  function active() { var j = S().job; return j && j.special ? st(j.special) : null; }
  function cdef(id) { return C[id]; }
  function rung(id, rep) { var L = C[id].ladder, r = L[0]; L.forEach(function (q) { if (rep >= q[0]) r = q; }); return r; }
  function title(job) {
    var j = job || S().job, x = j && st(j.special);
    if (!x) return 'Freelancer';
    var t = rung(j.special, x.rep)[1];
    return j.special === 'chef' && x.rest ? 'Chef-Owner' : j.special === 'model' && me().gender === 'M' && t === 'Supermodel' ? 'Supermodel' : t;
  }
  function summary(id) {
    var x = st(id);
    if (!x) return C[id].blurb || { model: 'Agencies, castings, Fashion Week · looks 55+', chef: 'Kitchens, cookbooks, your own restaurant', gamer: 'Tournaments, teams, streaming · 1997+' }[id];
    return (x.retired ? 'Retired ' + C[id].name.toLowerCase() : rung(id, x.rep)[1]) + ' · reputation ' + Math.round(x.rep);
  }

  // ------------------------------------------------------------ joining
  function start(id) {
    var c = C[id], m = me(), s = S();
    if (m.age < c.minAge) return done(nope('I\'m too young. Come back at ' + c.minAge + '.'));
    if (c.maxStart && m.age > c.maxStart && !st(id)) return done(nope('That ship has sailed. Nobody starts out after ' + c.maxStart + '.'));
    var why = c.need ? c.need() : null; if (why) return done(nope(why));
    if (s.prison) return done(nope('Not from in here.'));
    if (s.job && s.job.special === id) return done(nope('I\'m already doing it.'));
    if (s.job) return done(nope('I\'d have to quit my current job first.'));
    var x = st(id);
    if (!x) {
      if (id === 'model' && !U.chance(0.25 + (m.looks - 55) / 50)) { bump('spjoin'); return done(bad('The agency passed on me. Maybe next year.')); }
      x = all()[id] = { rep: 5, skill: U.rand(10, 25), since: s.year, peak: 5, honors: [], earnTotal: 0 };
      if (id === 'gamer') { var gs = era(GAMES); x.game = gs[gs.length - 1] || 'Quake'; }
    }
    x.retired = false;
    var org = U.pick(c.agencies());
    s.job = { career: 'sp_' + id, special: id, fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, salary: 0, company: id === 'gamer' && x.rep < 40 ? 'Free agent' : org };
    if (id === 'gamer' && x.rep >= 40) x.team = org;
    E.log(C[id].icon + ' ' + (id === 'model' ? 'I signed with ' + org + '! I\'m officially a model.' : id === 'chef' ? 'I got a job as a line cook at ' + org + '.' : id === 'gamer' ? 'I\'m going pro in ' + x.game + '.' : 'I started my career as ' + (/^[AEIOU]/.test(c.name) ? 'an ' : 'a ') + c.name.toLowerCase() + ' with ' + org + '.'), 'good');
    ui().closeAll(); done(good(id === 'model' ? 'Signed with ' + org + '!' : 'A new career begins.'));
  }

  // ------------------------------------------------------------ the year's work
  function gig(id, g) {
    var x = st(id), c = C[id], key = 'spgig';
    if (count(key) >= 3) return done(nope('I\'ve taken on enough this year.'));
    var buy = g[5] ? E.$(g[5]) : 0;
    if (buy && S().money < buy) return done(nope('The buy-in is ' + E.fmt(buy) + '.'));
    bump(key);
    if (buy) E.addMoney(-buy);
    var odds = U.clamp(0.25 + (c.power(x) - g[4]) / 60 + (x.rep - g[0]) / 200, 0.08, 0.92);
    if (U.chance(odds)) {
      var pay = E.$(Math.round(g[2] * U.randf(0.7, 1.3) * (1 + x.rep / 100)));
      x.earn = (x.earn || 0) + pay; x.rep = U.clamp(x.rep + g[3] * U.randf(0.6, 1.2) * (108 - x.rep) / 75, 0, 100); // the top is crowded
      E.stat('happy', 3); E.fame(g[3] / 3);
      if (/^Cover of/.test(g[1])) x.covers = (x.covers || 0) + 1;
      if (/^Major|^LAN|^Online/.test(g[1]) && U.chance(0.3 + (c.power(x) - g[4]) / 80)) {
        x.titles = (x.titles || 0) + 1; x.earn += pay; // the winner's share doubles the payout
        return done(good('🏆 I won the ' + g[1].toLowerCase() + '! (+' + E.fmt(pay * 2) + ')'));
      }
      return done(good(g[1] + ': it went great. (+' + E.fmt(pay) + ')'));
    }
    x.rep = Math.max(0, x.rep - 1); E.stat('happy', -2);
    if (g[6] && U.chance(0.25)) { E.stat('health', -U.rand(8, 20)); return done(bad(g[1] + ': ' + (id === 'racer' ? 'I crashed and got banged up.' : 'I got hurt in the ring.'))); }
    done(bad(g[1] + ': ' + (buy ? 'I lost my ' + E.fmt(buy) + ' buy-in.' : U.pick(FAILS[id] || ['It just didn\'t go my way.']))));
  }
  function train(id) {
    var x = st(id), c = C[id];
    if (count('sptrain') >= 2) return done(nope('I\'ve trained as much as I can this year.'));
    bump('sptrain');
    var gain = Math.max(1, Math.round((100 - x.skill) / 12 * U.randf(0.6, 1.2)));
    x.skill = U.clamp(x.skill + gain, 0, 100);
    if (id === 'gamer') { E.stat('health', -1); E.stat('happy', -1); }
    done(good(c.train[1] + ' (+' + gain + ' ' + c.skillName.toLowerCase() + ')'));
  }
  // Signature moves: a luxury contract, my own restaurant, the World Championship.
  function bigMove(id) {
    var x = st(id), s = S();
    if (id === 'model') {
      if (x.contract) return done(nope('I already have a contract with ' + x.contract.brand + '.'));
      if (count('spbig')) return done(nope('My agent is still negotiating. Try next year.'));
      bump('spbig');
      if (!U.chance(0.35 + (x.rep - 85) / 30)) return done(bad('The brand went with another face this season.'));
      x.contract = { brand: C.model.big[3](), years: 3, pay: Math.round(E.$(U.rand(800000, 3000000))) };
      E.fame(6); E.stat('happy', 10);
      return done(good('💎 I\'m the new face of ' + x.contract.brand + ': ' + E.fmt(x.contract.pay) + ' a year for 3 years!'));
    }
    if (id === 'chef') {
      if (x.rest) return done(nope('I already run ' + x.rest.name + '.'));
      var cost = E.$(250000);
      if (s.money < cost) return done(nope('Opening a restaurant takes about ' + E.fmt(cost) + '.'));
      E.addMoney(-cost);
      x.rest = { name: U.pick(['Ember', 'Juniper', 'The Larder', 'Salt & Vine', 'Marrow', 'Atelier', 'Saffron', 'Harbor House']) + (U.chance(0.3) ? ' by ' + me().first : ''), since: s.year, q: Math.round(C.chef.power(x)), stars: 0 };
      E.stat('happy', 12);
      return done(good('🍽️ I opened my own restaurant, ' + x.rest.name + '!'));
    }
    if (id !== 'gamer') return genericBig(id);
    // Esports: the World Championship, played round by round.
    if (!x.team) return done(nope('Only signed teams get invited. I need to join a team first.'));
    if (count('spbig')) return done(nope('Worlds only comes once a year.'));
    bump('spbig');
    var rounds = ['the group stage', 'the quarterfinals', 'the semifinals', 'the final'], r = 0;
    while (r < 4 && U.chance(U.clamp(0.35 + (C.gamer.power(x) - 75) / 90, 0.12, 0.72))) r++;
    if (r === 4) { x.worlds = (x.worlds || 0) + 1; var prize = E.$(U.rand(500000, 2000000)); x.earn = (x.earn || 0) + prize; x.rep = Math.min(100, x.rep + 10); E.fame(8); E.stat('happy', 15); x.honors.push('World Champion ' + s.year); return done(good('🏆 WE WON WORLDS! ' + x.team + ' are world champions. (+' + E.fmt(prize) + ')')); }
    x.rep = U.clamp(x.rep + r * 2 - 1, 0, 100);
    done(r ? 'We made it to ' + rounds[r] + ' at Worlds before losing.' : bad('We went out in the group stage at Worlds.'));
  }
  // The other careers' signature moves, by kind.
  function genericBig(id) {
    var x = st(id), c = C[id], b = c.big, o = b[4], s = S(), label = bigName(c);
    if (b[3] === 'contract') {
      if (x.contract) return done(nope('I already have a deal with ' + x.contract.brand + '.'));
      if (count('spbig')) return done(nope('Nothing came of it this year. Try again next year.'));
      bump('spbig');
      if (!U.chance(U.clamp(0.3 + (x.rep - b[2]) / 40, 0.1, 0.85))) return done(bad('They passed for now.'));
      var pay = Math.round(E.$(U.rand(o.pay[0], o.pay[1])) * (0.6 + x.rep / 100));
      if (o.years <= 1) { x.earn = (x.earn || 0) + pay; E.fame(5); E.stat('happy', 10); return done(good(b[0] + ' ' + (o.verb === 'rights' ? 'I sold the movie rights to ' + U.pick(o.brands()) : 'I recorded a special for ' + U.pick(o.brands())) + ' for ' + E.fmt(pay) + '!')); }
      x.contract = { brand: U.pick(o.brands()), years: o.years, pay: pay };
      E.fame(6); E.stat('happy', 10);
      return done(good(b[0] + ' I signed a ' + o.years + '-year ' + o.verb + ' at ' + x.contract.brand + ': ' + E.fmt(pay) + ' a year!'));
    }
    if (b[3] === 'venture') {
      if (x.rest) return done(nope('I already run ' + x.rest.name + '.'));
      var cost = E.$(o.cost);
      if (s.money < cost) return done(nope('That takes about ' + E.fmt(cost) + '.'));
      E.addMoney(-cost);
      x.rest = { name: U.pick(o.names) + me().last, since: s.year, q: Math.round(c.power(x)), stars: 0, noun: o.noun };
      E.stat('happy', 12);
      return done(good(b[0] + ' I launched my own ' + o.noun + ', ' + x.rest.name + '!'));
    }
    // 'final': once a year, won round by round.
    if (o.minYear && yr() < o.minYear) return done(nope(label + ' doesn\'t exist yet.'));
    if (count('spbig')) return done(nope(label + ' only comes once a year.'));
    var buy = o.buyIn ? E.$(o.buyIn) : 0;
    if (buy && s.money < buy) return done(nope('The buy-in is ' + E.fmt(buy) + '.'));
    bump('spbig'); if (buy) E.addMoney(-buy);
    var r = 0;
    while (r < 4 && U.chance(U.clamp(o.base + (c.power(x) - 75) / 90, 0.12, 0.78))) r++;
    if (r === 4) {
      var prize = Math.round(E.$(U.rand(o.prize[0], o.prize[1])));
      x.earn = (x.earn || 0) + prize; x.rep = Math.min(100, x.rep + 8); x.wins = (x.wins || 0) + 1;
      x.honors.push(o.honor + ' ' + s.year); E.fame(8); E.stat('happy', 15);
      var nm = label.replace(/^Main event /, '').replace(/^A /, 'a ');
      if (/^(WSOP|Indianapolis|World)/.test(nm)) nm = 'the ' + nm;
      return done(good('🏆 I won ' + nm + '! (+' + E.fmt(prize) + ')'));
    }
    x.rep = U.clamp(x.rep + r * 2 - 1, 0, 100);
    if (o.risk && U.chance(0.2)) { E.stat('health', -U.rand(8, 20)); return done(bad(label + ': I went out in ' + o.rounds[r] + ' and got hurt.')); }
    done(r ? label + ': I made it through ' + o.rounds[r - 1] + ' but fell short in ' + o.rounds[r] + '.' : bad(label + ': I went out in ' + o.rounds[0] + '.'));
  }
  var FAILS = {
    model: ['They went with someone else.', 'The client wanted a different look.'], chef: ['It didn\'t come together.', 'A critic panned it.'],
    gamer: ['We got knocked out early.', 'I choked in the deciding round.'], comic: ['The crowd sat in silence.', 'I bombed.'],
    designer: ['The critics tore it apart.', 'Nobody bought it.'], author: ['It got rejected.', 'Sales were disappointing.'],
    poker: ['I busted out.'], racer: ['I finished at the back of the pack.', 'My car broke down.'], magician: ['Someone spotted the trick.', 'The trick went wrong.'],
    dj: ['The dance floor emptied.', 'The crowd wasn\'t feeling it.'], lifter: ['I placed outside the top five.', 'The judges preferred someone else.'],
    chess: ['I blundered in a winning position.', 'I lost in the final round.'], wrestler: ['The crowd didn\'t react.', 'The match was a mess.']
  };
  function honorLine(hn) {
    if (/of the Year|champion|#1/i.test(hn)) return 'I was named ' + hn.replace(/^National/, 'national');
    if (/^Big tournament/.test(hn)) return 'I scored a big tournament win';
    return 'I won ' + (/^(Grammy|CFDA|WSOP)/.test(hn) ? 'a ' : 'the ') + hn;
  }
  function joinTeam() {
    var x = st('gamer');
    if (x.team) return done(nope('I already play for ' + x.team + '.'));
    if (x.rep < 30) return done(nope('No team will sign me yet. I need a bigger reputation (30+).'));
    if (count('spteam')) return done(nope('No offers this year.'));
    bump('spteam');
    if (!U.chance(0.3 + x.rep / 120)) return done(bad('Tryouts didn\'t go my way.'));
    x.team = U.pick(C.gamer.agencies()); S().job.company = x.team;
    done(good('🎮 I signed with ' + x.team + '!'));
  }
  function stream() {
    var x = st('gamer'), s = S();
    if (count('spstream')) return done(nope('I already streamed a ton this year.'));
    bump('spstream');
    var site = yr() >= 2011 ? 'Twitch' : 'YouTube';
    var gain = Math.round(U.rand(200, 2000) * (1 + x.rep / 15) * (yr() >= 2011 ? 1 : 0.3));
    x.subs = (x.subs || 0) + gain; E.fame(gain > 20000 ? 2 : 0.5);
    done(good('I streamed on ' + site + ' all year (+' + gain.toLocaleString() + ' followers).'));
  }
  function retire(id) {
    var x = st(id);
    x.retired = S().year; x.contract = null;
    if (x.rest) { E.addMoney(E.$(Math.round(150000 + x.rest.stars * 400000 + Math.max(0, x.rest.q - 60) * 5000))); E.log((x.rest.noun ? '🏷️ ' : '🍽️ ') + 'I sold ' + x.rest.name + '.'); x.rest = null; }
    E.quitJob(true);
    ui().closeAll(); done('I stepped away from my career as ' + C[id].name.toLowerCase() + '.');
  }

  // ------------------------------------------------------------ yearly
  function year() {
    var s = S(), j = s.job, id = j.special, x = st(id), c = C[id], m = me();
    if (!x) return 0;
    var r = rung(id, x.rep), earn = E.$(r[2]) + (x.earn || 0); x.earn = 0;
    // Age catches up with models and gamers.
    if (c.decline && m.age > c.decline) { var d = (m.age - c.decline) * (x.rep >= 85 ? 0.25 : 0.5); x.rep = Math.max(0, x.rep - d); if (id === 'gamer') x.skill = Math.max(0, x.skill - 1); }
    // Out of sight, out of mind; working steadily keeps you relevant.
    x.rep = Math.max(0, x.rep - (count('spgig') ? 0.5 : 2.5) - x.rep * 0.02); // fame fades unless I keep earning it
    if (id === 'chef') if (x.rep < 60) x.rep = Math.min(60, x.rep + 0.5 + x.skill / 100); // a good kitchen builds a name slowly, but fame takes more
    if (x.contract) {
      earn += x.contract.pay; x.contract.years--;
      if (x.contract.years <= 0) { E.log((id === 'model' ? '💎 My contract with ' : '📝 My deal with ') + x.contract.brand + ' ended.'); x.contract = null; }
    }
    if (id === 'chef' && x.rest) {
      var R = x.rest;
      R.q = U.clamp(Math.round(R.q * 0.6 + c.power(x) * 0.4 + U.rand(-8, 8)), 0, 100);
      var profit = E.$(Math.round((R.q - 55) * 8000 + R.stars * 150000));
      earn += profit;
      var guide = yr() >= 1926 ? 'Michelin' : null;
      var stars = R.q >= 94 ? 3 : R.q >= 89 ? 2 : R.q >= 82 ? 1 : 0;
      if (guide && stars !== R.stars) { E.log(stars > R.stars ? '⭐ ' + R.name + ' earned ' + (stars === 1 ? 'a Michelin star' : stars + ' Michelin stars') + '!' : '📉 ' + R.name + ' lost a Michelin star.', stars > R.stars ? 'good' : 'bad'); if (stars > R.stars) { x.honors.push(stars + ' Michelin star' + (stars > 1 ? 's' : '') + ' ' + s.year); E.fame(stars * 3); x.rep = Math.min(100, x.rep + 3 * (stars - R.stars)); } R.stars = stars; }
      if (profit < 0 && R.q < 35 && U.chance(0.4)) { E.log('🍽️ ' + R.name + ' closed after a bad year.', 'bad'); x.rest = null; E.stat('happy', -10); }
    }
    if (id !== 'chef' && x.rest) {
      var V = x.rest;
      V.q = U.clamp(Math.round(V.q * 0.6 + c.power(x) * 0.4 + U.rand(-8, 8)), 0, 100);
      var vp = E.$(Math.round((V.q - 55) * 9000));
      earn += vp;
      if (V.q >= 85 && U.chance(0.2)) { E.log('🏷️ ' + V.name + ' had a breakout year.', 'good'); x.rep = Math.min(100, x.rep + 3); }
      if (vp < 0 && V.q < 35 && U.chance(0.4)) { E.log('🏷️ ' + V.name + ' went out of business.', 'bad'); x.rest = null; E.stat('happy', -10); }
    }
    if (c.honor && x.rep >= c.honor[0] && U.chance(c.honor[1])) { var hn = c.honor[2](); x.honors.push(hn + ' ' + s.year); E.log('🏅 ' + honorLine(hn) + '!', 'good'); E.fame(4); }
    if (id === 'gamer' && x.subs) earn += E.$(Math.round(x.subs * (yr() >= 2011 ? 1.5 : 0.3)));
    // Honors.
    if (id === 'chef' && x.rep >= 75 && U.chance(0.12) && yr() >= 1991) { x.honors.push('James Beard Award ' + s.year); E.log('🏅 I won a James Beard Award!', 'good'); E.fame(4); }
    if (id === 'model' && x.rep >= 80 && U.chance(0.15)) { x.honors.push('Model of the Year ' + s.year); E.log('🏅 I was named Model of the Year!', 'good'); E.fame(4); }
    if (id === 'gamer' && x.rep >= 70 && U.chance(0.15)) { x.honors.push('Esports Player of the Year ' + s.year); E.log('🏅 I was named Esports Player of the Year!', 'good'); E.fame(4); }
    var r2 = rung(id, x.rep);
    if (r2[0] > r[0]) E.log(c.icon + ' I\'m now a' + (/^[AEIOU]/.test(r2[1]) ? 'n ' : ' ') + r2[1] + '.', 'good');
    x.peak = Math.max(x.peak || 0, x.rep);
    earn = Math.max(0, Math.round(earn));
    x.earnTotal = (x.earnTotal || 0) + earn; j.salary = earn;
    return earn;
  }

  // ------------------------------------------------------------ menus
  function menu(id) {
    ui().menu(C[id].icon + ' ' + C[id].name, function () {
      var x = st(id), c = C[id], j = S().job, on = j && j.special === id, items = [];
      if (!x || !on) {
        items.push({ info: true, html: '<p class="muted">' + summary(id) + '</p>' });
        items.push({ icon: c.icon, label: x ? 'Make a comeback' : 'Start my career', sub: x ? summary(id) : 'Age ' + c.minAge + '+', onClick: function () { start(id); } });
        return items;
      }
      var r = rung(id, x.rep), nxt = c.ladder.filter(function (q) { return q[0] > x.rep; })[0];
      items.push({ info: true, html: '<div class="kv"><b>' + U.esc(title(j)) + '</b> · ' + U.esc(j.company) + '<br>Reputation ' + Math.round(x.rep) + (nxt ? ' (' + nxt[1] + ' at ' + nxt[0] + ')' : '') + ' · ' + c.skillName + ' ' + x.skill +
        (x.game ? '<br>Main game: ' + U.esc(x.game) : '') + (x.contract ? '<br>' + (id === 'model' ? '💎 Face of ' : '🎰 Residency at ') + U.esc(x.contract.brand) + ' · ' + U.plural(x.contract.years, 'year') + ' left' : '') +
        (x.rest ? '<br>' + (x.rest.noun ? '🏷️ ' : '🍽️ ') + U.esc(x.rest.name) + ' · quality ' + x.rest.q + (x.rest.stars ? ' · ' + '⭐'.repeat(x.rest.stars) : '') : '') +
        (x.subs ? '<br>📺 ' + x.subs.toLocaleString() + ' followers' : '') + (x.covers ? '<br>📰 ' + U.plural(x.covers, 'magazine cover') : '') + (x.titles ? '<br>🏆 ' + U.plural(x.titles, 'tournament win') : '') + (x.wins ? '<br>🏆 ' + U.plural(x.wins, 'title') : '') +
        (x.honors.length ? '<br>🏅 ' + U.esc(x.honors.slice(-3).join(' · ')) : '') + '</div>' });
      items.push({ section: 'Work' });
      items.push({ icon: '💪', label: c.train[0], sub: c.skillName + ' ' + x.skill, onClick: function () { train(id); } });
      c.gigs().forEach(function (g) {
        if (x.rep + 10 < g[0]) return;
        items.push({ icon: '📅', label: g[1], sub: 'Pays about ' + E.fmt(E.$(g[2])) + (g[5] ? ' · buy-in ' + E.fmt(E.$(g[5])) : '') + (g[6] ? ' · risky' : '') + (x.rep < g[0] ? ' · a long shot' : ''), disabled: count('spgig') >= 3, onClick: function () { gig(id, g); } });
      });
      var b = c.big;
      if (x.rep >= b[2] - 10) items.push({ icon: b[0], label: bigName(c), sub: x.rep < b[2] ? 'Needs reputation ' + b[2] : id === 'chef' ? 'About ' + E.fmt(E.$(250000)) : b[3] === 'venture' ? 'About ' + E.fmt(E.$(b[4].cost)) : b[3] === 'final' ? 'Once a year' + (b[4].buyIn ? ' · buy-in ' + E.fmt(E.$(b[4].buyIn)) : '') : '', disabled: x.rep < b[2], onClick: function () { bigMove(id); } });
      if (id === 'gamer') {
        if (!x.team) items.push({ icon: '🤝', label: 'Try out for a team', sub: 'Reputation 30+', disabled: x.rep < 30, onClick: joinTeam });
        items.push({ icon: '📺', label: 'Stream', sub: yr() >= 2011 ? 'Twitch' : 'YouTube videos', onClick: stream });
      }
      items.push({ section: 'Career' });
      items.push({ icon: '🚪', label: 'Retire', danger: true, onClick: function () { ui().confirm('Retire?', 'Step away from your career as ' + c.name.toLowerCase() + '?', function () { retire(id); }); } });
      return items;
    });
  }
  function fameItems() {
    return Object.keys(C).map(function (id) {
      var c = C[id];
      return { icon: c.icon, label: c.name, sub: summary(id), disabled: me().age < c.minAge, onClick: function () { menu(id); } };
    });
  }
  function aboutRow() {
    var j = S().job; if (!j || !j.special || !st(j.special)) return null;
    return [C[j.special].icon, C[j.special].name, title(j) + ' · reputation ' + Math.round(st(j.special).rep)];
  }
  return { C: C, year: year, title: title, menu: menu, fameItems: fameItems, summary: summary, active: active, aboutRow: aboutRow, start: start, st: st };
})();
