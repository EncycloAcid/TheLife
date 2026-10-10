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
  // The year's actions, read during the yearly update (ageUp has already reset yearActs).
  function lastCount(key) { var y = S().lastActs || {}; return y[key] || 0; }
  // Real Olympic years: Summer from 1896 (none in 1916, 1940, 1944; Tokyo in 2021),
  // Winter from 1924 (none in 1940, 1944; moved to the in-between years from 1994).
  function olympic(type, y) {
    if (type === 'winter') return y >= 1924 && y !== 1940 && y !== 1944 && (y <= 1992 ? y % 4 === 0 : (y - 1994) % 4 === 0 && y >= 1994);
    if (y === 2020) return false; if (y === 2021) return true;
    return y >= 1896 && y % 4 === 0 && [1916, 1940, 1944].indexOf(y) < 0;
  }
  function nextOlympics(type) { for (var y = yr(); y < yr() + 8; y++) if (olympic(type, y)) return y; return yr() + 4; }
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
      gain: 0.55, name: 'Chef', icon: '🧑‍🍳', minAge: 16, skillName: 'Cooking',
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
      gain: 0.85, name: 'Stand-up comedian', icon: '🎤', minAge: 16, skillName: 'Material', blurb: 'Open mics, clubs, late-night TV, your own special',
      power: function (x) { return x.skill * 0.6 + me().smarts * 0.25 + me().happy * 0.15; },
      ladder: [[0, 'Open Micer', 0], [20, 'Club Comic', 15000], [40, 'Headliner', 60000], [65, 'Arena Comic', 250000], [85, 'Comedy Legend', 900000]],
      agencies: function () { return yr() < 1963 ? ['a Catskills resort', 'a nightclub circuit'] : era([['The Improv', 1963], ['The Comedy Store', 1972], ['Laugh Factory', 1979], ['Comedy Cellar', 1982]]); },
      train: ['Write new material', 'I filled a notebook with new bits.'],
      gigs: function () { var tv = era([['a variety show', 1900], ['The Tonight Show', 1954], ['Late Night', 1982], ['The Late Show', 1993]]); return [[0, 'Open mic', 50, 4, 30], [15, 'Club set', 800, 5, 42], [35, 'Stand-up spot on ' + tv[tv.length - 1], 5000, 7, 56], [55, 'Theater tour', 80000, 7, 66]]; },
      big: ['📺', 'Record a comedy special', 60, 'contract', { brands: function () { return yr() < 1975 ? ['a TV network'] : era([['HBO', 1975], ['Showtime', 1976], ['Comedy Central', 1991], ['Netflix', 2016]]); }, pay: [200000, 2000000], years: 1, verb: 'special' }],
      honor: [70, 0.12, function () { return yr() >= 1959 ? 'Grammy for Best Comedy Album' : 'Comedian of the Year'; }]
    },
    designer: {
      gain: 0.65, name: 'Fashion designer', icon: '🧵', minAge: 18, skillName: 'Design', blurb: 'Boutiques, red carpets, Fashion Week, your own label',
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
      gain: 0.8, name: 'Magician', icon: '🎩', minAge: 10, skillName: 'Sleight of hand', blurb: 'Birthday parties, TV specials, a Vegas residency',
      power: function (x) { return x.skill * 0.7 + me().looks * 0.15 + me().smarts * 0.15; },
      ladder: [[0, 'Party Magician', 0], [20, 'Club Magician', 15000], [40, 'Headliner', 70000], [65, 'Star Illusionist', 250000], [85, 'Legendary Illusionist', 1000000]],
      agencies: function () { return ['a talent agency', 'a variety booking agent']; },
      train: ['Practice my tricks', 'I practiced until no one could see the move.'],
      gigs: function () { return [[0, 'Birthday party', 150, 4, 25], [15, 'Magic set at a club', 1000, 5, 42], [35, 'TV special', 30000, 7, 58], [55, 'Arena tour', 120000, 7, 68]]; },
      big: ['🎰', 'Las Vegas residency', 65, 'contract', { brands: function () { return yr() < 1946 ? ['a big-city theater'] : era([['the Flamingo', 1946], ['Caesars Palace', 1966], ['the Mirage', 1989], ['the MGM Grand', 1993], ['the Bellagio', 1998]]); }, pay: [500000, 2500000], years: 3, verb: 'residency' }],
      honor: [70, 0.12, function () { return yr() >= 1968 ? 'Magician of the Year' : 'Top billing honor'; }]
    },
    dj: {
      gain: 0.85, name: 'DJ', icon: '🎧', minAge: 16, minYear: 1975, skillName: 'Mixing', blurb: 'Clubs, festivals, hit singles, Vegas · 1975+',
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
      gain: 0.62, name: 'Chess player', icon: '♟️', minAge: 6, skillName: 'Calculation', blurb: 'Opens, norms, Grandmaster, a World Championship match · smart',
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
    },
    director: {
      gain: 0.6, name: 'Film director', icon: '🎬', minAge: 16, skillName: 'Directing', blurb: 'Short films, music videos, features, the Oscar',
      power: function (x) { return x.skill * 0.6 + me().smarts * 0.3 + me().happy * 0.1; },
      ladder: [[0, 'Film Student', 0], [20, 'Music Video Director', 20000], [40, 'Indie Director', 90000], [65, 'Studio Director', 400000], [85, 'Auteur', 1500000]],
      agencies: function () { return era([['William Morris', 1898], ['CAA', 1975], ['ICM', 1975], ['WME', 2009]]).concat(['a small production company']); },
      train: ['Study the masters', 'I watched and broke down a hundred classic films.'],
      gigs: function () { var mv = yr() >= 1981 ? 'Direct a music video' : 'Direct a commercial'; var fest = era([['Venice', 1932], ['Cannes', 1946], ['Sundance', 1985]]); return [[0, 'Shoot a short film', 0, 4, 30], [15, mv, 10000, 5, 44], [35, 'Premiere an indie at ' + fest[fest.length - 1], 80000, 7, 58], [55, 'Direct a studio film', 600000, 8, 68]]; },
      big: ['🏆', function () { return yr() >= 1929 ? 'Oscar race for Best Director' : 'A prestige picture'; }, 70, 'final', { rounds: ['the festival circuit', 'the nominations', 'the awards campaign', 'the envelope'], prize: [500000, 2000000], honor: 'Academy Award for Best Director', base: 0.32, minYear: 1929 }],
      honor: [65, 0.1, function () { return yr() >= 1955 ? 'Palme d\'Or' : 'Golden Lion'; }]
    },
    golfer: {
      gain: 0.45, name: 'Pro golfer', icon: '⛳', minAge: 12, maxStart: 24, skillName: 'Short game', blurb: 'Mini-tours, the PGA or LPGA Tour, the Masters · start by 24',
      need: function () { return me().athl < 35 ? 'I need a more athletic swing (35+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.65 + me().athl * 0.15 + me().smarts * 0.1 + me().happy * 0.1; },
      ladder: [[0, 'Amateur', 0], [20, 'Mini-Tour Pro', 15000], [40, 'Tour Pro', 250000], [65, 'Tour Winner', 800000], [85, 'Major Champion', 2500000]],
      agencies: function () { return [me().gender === 'F' ? (yr() >= 1950 ? 'the LPGA Tour' : 'the women\'s amateur circuit') : (yr() >= 1929 ? 'the PGA Tour' : 'the pro circuit')]; },
      train: ['Hit balls on the range', 'I hit a thousand balls and grinded on my short game.'],
      gigs: function () { var tour = me().gender === 'F' ? 'LPGA' : 'PGA Tour'; return [[0, 'Club tournament', 300, 4, 30], [20, 'Mini-tour event', 6000, 5, 46], [40, tour + ' event', 120000, 7, 60]]; },
      big: ['🟢', function () { return yr() >= 1934 ? (me().gender === 'F' ? 'A women\'s major' : 'The Masters') : 'The U.S. Open'; }, 60, 'final', { rounds: ['Thursday', 'Friday', 'Saturday', 'Sunday'], prize: [800000, 3600000], honor: 'Major champion', base: 0.33 }],
      honor: [72, 0.12, function () { return 'Player of the Year'; }],
      decline: 42
    },
    fighter: {
      gain: 0.9, name: 'Fighter', icon: '🥊', minAge: 16, maxStart: 26, skillName: 'Technique', blurb: 'Boxing, or MMA from 1993 · title fights · athletic',
      need: function () { return me().athl < 55 ? 'I need to be in fighting shape (55+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.55 + me().athl * 0.35 + me().health * 0.1; },
      ladder: [[0, 'Amateur', 0], [20, 'Prospect', 20000], [40, 'Contender', 200000], [65, 'Champion', 1000000], [85, 'All-Time Great', 3000000]],
      agencies: function () { return yr() >= 1993 ? era([['the UFC', 1993], ['Bellator', 2008], ['the PFL', 2018]]) : ['a boxing promoter']; },
      train: ['Train at the gym', 'I sparred and drilled until I could barely stand.'],
      gigs: function () { return [[0, 'Amateur bout', 0, 4, 30, 0, 1], [20, 'Regional card', 8000, 5, 46, 0, 1], [40, 'Televised fight', 150000, 7, 60, 0, 1]]; },
      big: ['🏆', function () { return 'Title fight'; }, 60, 'final', { rounds: ['round 1', 'round 2', 'round 3', 'the final round'], prize: [800000, 5000000], honor: 'World Champion', base: 0.38, risk: 1 }],
      honor: [70, 0.12, function () { return 'Fighter of the Year'; }],
      decline: 33
    },
    ballet: {
      name: 'Ballet dancer', icon: '🩰', minAge: 8, maxStart: 16, skillName: 'Technique', blurb: 'Corps, soloist, principal, world tours · start by 16',
      need: function () { return me().athl < 45 ? 'I need more strength and flexibility (45+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.6 + me().athl * 0.25 + me().looks * 0.15; },
      ladder: [[0, 'Ballet Student', 0], [20, 'Corps de Ballet', 30000], [40, 'Soloist', 60000], [65, 'Principal Dancer', 150000], [85, 'Ballet Legend', 500000]],
      agencies: function () { return era([['the Paris Opera Ballet', 1669], ['the Bolshoi Ballet', 1776], ['the Royal Ballet', 1931], ['American Ballet Theatre', 1939], ['New York City Ballet', 1948]]); },
      train: ['Take extra class', 'I took two classes a day and rehearsed every night.'],
      gigs: function () { return [[0, 'Student recital', 0, 4, 30], [20, 'Dance in the corps', 3000, 5, 44], [40, 'Dance a solo', 12000, 7, 58], [55, 'Lead in ' + U.pick(['Swan Lake', 'Giselle', 'The Nutcracker', 'Romeo and Juliet']), 40000, 8, 66, 0, 1]]; },
      big: ['🌍', 'Guest principal world tour', 70, 'contract', { brands: function () { return ['the Bolshoi', 'the Royal Ballet', 'the Paris Opera', 'La Scala']; }, pay: [200000, 800000], years: 2, verb: 'guest contract' }],
      honor: [70, 0.12, function () { return yr() >= 1992 ? 'Benois de la Danse' : 'Dance Magazine Award'; }],
      decline: 32
    },
    painter: {
      gain: 0.63, name: 'Painter', icon: '🎨', minAge: 12, skillName: 'Craft', blurb: 'Street fairs, galleries, museums, blue-chip dealers',
      power: function (x) { return x.skill * 0.7 + me().smarts * 0.15 + me().happy * 0.15; },
      ladder: [[0, 'Unknown Artist', 0], [20, 'Emerging Artist', 10000], [40, 'Gallery Artist', 60000], [65, 'Celebrated Artist', 250000], [85, 'Art Icon', 1000000]],
      agencies: function () { return ['my studio']; },
      train: ['Paint every day', 'I painted every day, filling canvas after canvas.'],
      gigs: function () { return [[0, 'Sell at a street fair', 200, 4, 30], [20, 'Group show', 3000, 5, 44], [40, 'Solo gallery show', 60000, 7, 60], [60, 'Museum acquisition', 120000, 8, 68]]; },
      big: ['🖼️', 'Sign with a blue-chip gallery', 60, 'contract', { brands: function () { return yr() < 1960 ? ['a Paris dealer'] : era([['Pace Gallery', 1960], ['Gagosian', 1980], ['David Zwirner', 1993], ['Hauser & Wirth', 1992]]); }, pay: [300000, 2500000], years: 3, verb: 'representation deal' }],
      honor: [72, 0.1, function () { return yr() >= 1984 && S().country === 'United Kingdom' ? 'Turner Prize' : yr() >= 1981 ? 'MacArthur Fellowship' : 'Venice Biennale prize'; }]
    },
    tattoo: {
      gain: 0.5, name: 'Tattoo artist', icon: '🖋️', minAge: 18, skillName: 'Linework', blurb: 'Apprenticeship, conventions, celebrity clients, your own shop',
      power: function (x) { return x.skill * 0.75 + me().smarts * 0.1 + me().happy * 0.15; },
      ladder: [[0, 'Apprentice', 12000], [20, 'Tattoo Artist', 35000], [40, 'In-Demand Artist', 90000], [65, 'Celebrity Tattoo Artist', 300000], [85, 'Tattoo Legend', 700000]],
      agencies: function () { return ['a street shop', 'a custom studio']; },
      train: ['Practice on fake skin', 'I practiced linework and shading for hours.'],
      gigs: function () { var tv = yr() >= 2012 ? 'Compete on Ink Master' : yr() >= 2005 ? 'Appear on Miami Ink' : 'Get featured in a tattoo magazine'; return [[0, 'Walk-in flash', 400, 4, 28], [15, 'Custom piece', 2500, 5, 42], [35, 'Work a tattoo convention', 10000, 6, 54], [50, tv, 30000, 7, 60], [65, 'Tattoo a celebrity', 50000, 8, 66]]; },
      big: ['🏪', 'Open my own shop', 35, 'venture', { cost: 60000, noun: 'shop', names: ['Black Anchor ', 'Iron Rose ', 'Sacred Ink ', 'Lucky Needle '] }],
      honor: [65, 0.15, function () { return 'Best of Show at a tattoo convention'; }]
    },
    surfer: {
      name: 'Pro surfer', icon: '🏄', minAge: 10, maxStart: 22, skillName: 'Wave riding', blurb: 'Local contests, the tour, Pipeline · start by 22',
      need: function () { return me().athl < 50 ? 'I need to be a stronger swimmer (50+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.6 + me().athl * 0.3 + me().happy * 0.1; },
      ladder: [[0, 'Local Ripper', 0], [20, 'Sponsored Surfer', 15000], [40, 'Tour Surfer', 120000], [65, 'Title Contender', 500000], [85, 'Surf Legend', 1500000]],
      agencies: function () { return yr() >= 1969 ? era([['O\'Neill', 1952], ['Quiksilver', 1969], ['Billabong', 1973], ['Rip Curl', 1969], ['Hurley', 1999]]) : ['a surf shop']; },
      train: ['Surf every swell', 'I surfed dawn to dusk every day the waves were good.'],
      gigs: function () { var tour = yr() >= 2015 ? 'WSL' : yr() >= 1983 ? 'ASP' : 'pro'; return [[0, 'Local contest', 200, 4, 30], [20, 'Qualifying Series event', 5000, 5, 46], [40, tour + ' Championship Tour event', 60000, 7, 60], [50, 'Surf a big-wave swell', 20000, 7, 64, 0, 1]]; },
      big: ['🌊', function () { return yr() >= 1971 ? 'Pipe Masters' : 'The Makaha International'; }, 60, 'final', { rounds: ['round 1', 'the quarterfinals', 'the semifinals', 'the final'], prize: [100000, 500000], honor: 'Pipe Masters champion', base: 0.35, risk: 1 }],
      honor: [72, 0.12, function () { return 'World surfing title'; }],
      decline: 34
    },
    photographer: {
      gain: 0.38, name: 'Photographer', icon: '📷', minAge: 14, skillName: 'Eye', blurb: 'Weddings, magazines, National Geographic, your own studio',
      power: function (x) { return x.skill * 0.7 + me().smarts * 0.2 + me().happy * 0.1; },
      ladder: [[0, 'Hobbyist', 0], [20, 'Freelancer', 25000], [40, 'Staff Photographer', 70000], [65, 'Renowned Photographer', 250000], [85, 'Master Photographer', 800000]],
      agencies: function () { return yr() >= 1947 ? ['Magnum Photos', 'a freelance agency'] : ['a newspaper photo desk']; },
      train: ['Shoot every day', 'I shot thousands of frames and studied every one.'],
      gigs: function () { return [[0, 'Shoot a wedding', 1500, 4, 30], [15, 'Magazine assignment', 5000, 5, 44], [35, yr() >= 1888 ? 'National Geographic assignment' : 'Expedition assignment', 25000, 7, 58], [55, 'Celebrity cover shoot', 60000, 7, 64]]; },
      big: ['🏢', 'Open my own studio', 40, 'venture', { cost: 80000, noun: 'studio', names: ['Studio ', 'Lightbox ', 'Frame & '] }],
      honor: [70, 0.1, function () { return yr() >= 1955 ? 'World Press Photo of the Year' : 'Photographer of the Year'; }]
    },
    skater: {
      gain: 0.85, name: 'Pro skateboarder', icon: '🛹', minAge: 8, maxStart: 20, minYear: 1975, skillName: 'Tricks', blurb: 'Skateparks, video parts, X Games, a signature shoe · 1975+',
      need: function () { return yr() < 1975 ? 'Pro skating isn\'t a thing yet.' : me().athl < 45 ? 'I need more balance and strength (45+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.65 + me().athl * 0.25 + me().happy * 0.1; },
      ladder: [[0, 'Park Rat', 0], [20, 'Flow Rider', 3000], [40, 'Sponsored Am', 30000], [65, 'Pro', 250000], [85, 'Skate Legend', 1000000]],
      agencies: function () { return era([['Powell Peralta', 1978], ['Zero', 1996], ['Girl', 1993], ['Element', 1992], ['Baker', 2000]]).concat(['a local skate shop']); },
      train: ['Skate the park all day', 'I skated until I landed the trick a hundred times.'],
      gigs: function () { var big = yr() >= 2010 ? 'Street League contest' : yr() >= 1995 ? 'X Games contest' : 'pro contest'; return [[0, 'Skatepark jam', 100, 4, 28, 0, 1], [20, 'Film a video part', 5000, 6, 46], [40, big, 50000, 7, 60, 0, 1]]; },
      big: ['👟', 'Signature shoe deal', 70, 'contract', { brands: function () { return era([['Vans', 1966], ['Etnies', 1986], ['DC Shoes', 1994], ['Nike SB', 2002], ['adidas Skateboarding', 2005]]); }, pay: [200000, 1500000], years: 3, verb: 'shoe deal' }],
      honor: [72, 0.12, function () { return yr() >= 1990 ? 'Thrasher Skater of the Year' : 'Skater of the Year'; }],
      decline: 32
    },
    opera: {
      gain: 0.6, name: 'Opera singer', icon: '🎼', minAge: 16, skillName: 'Voice', blurb: 'Chorus, supporting roles, the Met, recordings',
      power: function (x) { return x.skill * 0.7 + me().smarts * 0.15 + me().health * 0.15; },
      ladder: [[0, 'Chorus Member', 15000], [20, 'Young Artist', 30000], [40, 'Soloist', 80000], [65, 'Principal Singer', 300000], [85, 'Opera Star', 1000000]],
      agencies: function () { return era([['La Scala', 1778], ['the Royal Opera House', 1858], ['the Vienna State Opera', 1869], ['the Metropolitan Opera', 1883]]); },
      train: ['Work with my voice teacher', 'I worked on my breath and my high notes every day.'],
      gigs: function () { return [[0, 'Church recital', 300, 4, 30], [20, 'Supporting role', 6000, 5, 46], [40, 'Lead in ' + U.pick(['La Bohème', 'Carmen', 'La Traviata', 'Tosca', 'The Magic Flute']), 40000, 7, 60], [60, 'Concert tour', 150000, 7, 66]]; },
      big: ['💿', 'Recording contract', 65, 'contract', { brands: function () { return era([['Deutsche Grammophon', 1898], ['Decca', 1929], ['EMI Classics', 1931], ['Sony Classical', 1990]]); }, pay: [150000, 800000], years: 3, verb: 'recording contract' }],
      honor: [72, 0.1, function () { return yr() >= 1959 ? 'Grammy for Best Opera Recording' : 'Opera Singer of the Year'; }],
      decline: 55
    },
    host: {
      gain: 0.75, name: 'Talk show host', icon: '📺', minAge: 18, skillName: 'Timing', blurb: 'Radio, cable, late night, hosting the Oscars',
      power: function (x) { return x.skill * 0.55 + me().smarts * 0.25 + me().looks * 0.1 + me().happy * 0.1; },
      ladder: [[0, 'Radio Host', 25000], [20, 'Cable Host', 60000], [40, 'Daytime Host', 250000], [65, 'Late-Night Host', 900000], [85, 'Television Icon', 3500000]],
      agencies: function () { return yr() < 1940 ? ['a local radio station'] : ['a local station', 'a cable network']; },
      train: ['Work on my monologue', 'I rewrote my monologue until every joke landed.'],
      gigs: function () { var big = yr() >= 1954 ? 'Guest-host The Tonight Show' : 'Guest-host a network radio hour'; return [[0, 'Host a local radio show', 500, 4, 30], [20, 'Cable TV segment', 6000, 5, 46], [40, big, 60000, 7, 60]].concat(yr() >= 1953 ? [[60, 'Host the Oscars', 150000, 8, 70]] : []); },
      big: ['🌙', 'Get my own late-night show', 65, 'contract', { brands: function () { return yr() < 1954 ? ['a radio network'] : era([['NBC', 1954], ['CBS', 1993], ['ABC', 2003], ['Comedy Central', 1996], ['Netflix', 2018]]); }, pay: [800000, 6000000], years: 3, verb: 'show' }],
      honor: [72, 0.1, function () { return yr() >= 1949 ? 'Emmy for Outstanding Talk Series' : 'Peabody Award'; }]
    },
    stunt: {
      gain: 0.8, name: 'Stunt performer', icon: '🔥', minAge: 18, maxStart: 30, skillName: 'Stunt craft', blurb: 'Falls, fights, car hits, action franchises · athletic',
      need: function () { return me().athl < 55 ? 'I need to be in top shape for this (55+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.6 + me().athl * 0.3 + me().health * 0.1; },
      ladder: [[0, 'Stunt Trainee', 8000], [20, 'Stunt Performer', 45000], [40, 'Stunt Double', 110000], [65, 'Stunt Coordinator', 300000], [85, 'Action Legend', 900000]],
      agencies: function () { return ['a stunt team', 'a film studio stunt department']; },
      train: ['Train falls and fights', 'I trained high falls, fight choreography and car work.'],
      gigs: function () { return [[0, 'Commercial stunt', 1500, 4, 30, 0, 1], [20, 'TV show stunt', 8000, 5, 46, 0, 1], [40, 'Film stunt double', 40000, 7, 60, 0, 1], [60, 'Action franchise set piece', 120000, 8, 68, 0, 1]]; },
      big: ['🎬', 'Coordinate stunts on a blockbuster', 65, 'contract', { brands: function () { return era([['Universal', 1912], ['Warner Bros.', 1923], ['Paramount', 1912], ['Lucasfilm', 1971], ['Marvel Studios', 2008]]); }, pay: [300000, 1500000], years: 2, verb: 'coordinator deal' }],
      honor: [70, 0.12, function () { return yr() >= 2001 ? 'Taurus World Stunt Award' : 'Stunt of the Year'; }],
      decline: 40
    },
    rodeo: {
      gain: 0.8, name: 'Bull rider', icon: '🐂', minAge: 16, maxStart: 24, skillName: 'Balance', blurb: 'County rodeos, the pro tour, the world finals · athletic',
      need: function () { return me().athl < 50 ? 'Eight seconds on a bull takes a strong body (50+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.6 + me().athl * 0.3 + me().happy * 0.1; },
      ladder: [[0, 'Amateur Rider', 0], [20, 'Circuit Cowboy', 20000], [40, 'Pro Bull Rider', 120000], [65, 'Top Contender', 400000], [85, 'Rodeo Legend', 1000000]],
      agencies: function () { return yr() >= 1992 ? ['the PBR', 'the PRCA'] : yr() >= 1936 ? ['the rodeo circuit'] : ['traveling rodeos']; },
      train: ['Ride practice bulls', 'I rode practice bulls every morning.'],
      gigs: function () { return [[0, 'County rodeo', 300, 4, 30, 0, 1], [20, 'Pro rodeo', 5000, 5, 46, 0, 1], [40, yr() >= 1992 ? 'PBR event' : 'Big-city rodeo', 40000, 7, 60, 0, 1]]; },
      big: ['🏆', function () { return yr() >= 1994 ? 'PBR World Finals' : 'National Finals Rodeo'; }, 60, 'final', { rounds: ['round 1', 'round 2', 'the short go', 'the championship ride'], prize: [200000, 1000000], honor: 'World champion bull rider', base: 0.33, risk: 1, minYear: 1959 }],
      honor: [70, 0.12, function () { return 'Rider of the Year'; }],
      decline: 33
    },
    jockey: {
      gain: 0.6, name: 'Jockey', icon: '🏇', minAge: 16, maxStart: 25, skillName: 'Horsemanship', blurb: 'Claiming races to the Kentucky Derby',
      need: function () { return me().athl < 40 ? 'Jockeys need strength and balance (40+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.7 + me().athl * 0.2 + me().smarts * 0.1; },
      ladder: [[0, 'Apprentice Jockey', 10000], [20, 'Journeyman Jockey', 50000], [40, 'Stakes Jockey', 200000], [65, 'Leading Jockey', 800000], [85, 'Hall of Fame Jockey', 2000000]],
      agencies: function () { return ['a racing stable', 'a horse trainer\'s barn']; },
      train: ['Work horses at dawn', 'I worked horses at dawn every day.'],
      gigs: function () { return [[0, 'Claiming race', 400, 4, 30, 0, 1], [20, 'Allowance race', 3000, 5, 45, 0, 1], [40, 'Stakes race', 30000, 7, 58, 0, 1], [60, 'Grade 1 race', 100000, 8, 66, 0, 1]]; },
      big: ['🌹', function () { return 'The Kentucky Derby'; }, 60, 'final', { rounds: ['the break', 'the backstretch', 'the far turn', 'the stretch'], prize: [300000, 1800000], honor: 'Kentucky Derby winner', base: 0.3, risk: 1, minYear: 1875 }],
      honor: [70, 0.12, function () { return yr() >= 1971 ? 'Eclipse Award' : 'Leading jockey in the nation'; }],
      decline: 45
    },
    skating: {
      gain: 1.2, name: 'Figure skater', icon: '⛸️', minAge: 6, maxStart: 14, skillName: 'Jumps & artistry', blurb: 'Competitions, nationals, the Winter Olympics · start by 14',
      need: function () { return me().athl < 45 ? 'I need more strength and balance (45+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.6 + me().athl * 0.25 + me().looks * 0.15; },
      ladder: [[0, 'Novice', 0], [20, 'Junior Skater', 0], [40, 'National Team', 40000], [65, 'World Medalist', 150000], [85, 'Skating Legend', 600000]],
      agencies: function () { return ['a skating club', 'an elite training center']; },
      train: ['Train jumps on the ice', 'I landed the jump a hundred times in practice.'],
      gigs: function () { return [[0, 'Club competition', 0, 4, 30], [20, 'Regional championships', 1000, 5, 44], [40, 'National championships', 10000, 7, 58], [55, yr() >= 1995 ? 'Grand Prix event' : 'International competition', 30000, 7, 64], [60, 'Ice show tour', 80000, 4, 50]]; },
      big: ['🥇', function () { return 'Winter Olympics'; }, 55, 'final', { rounds: ['the short program', 'the free skate warm-up', 'the free skate', 'the final scores'], prize: [100000, 500000], honor: 'Olympic gold', base: 0.3, olympic: 'winter', medals: true }],
      honor: [72, 0.12, function () { return 'World Figure Skating Champion'; }],
      decline: 26
    },
    gymnast: {
      gain: 1.2, name: 'Gymnast', icon: '🤸', minAge: 6, maxStart: 14, skillName: 'Difficulty', blurb: 'Club meets, nationals, the Summer Olympics · start by 14',
      need: function () { return me().athl < 50 ? 'I need more strength and flexibility (50+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.6 + me().athl * 0.3 + me().happy * 0.1; },
      ladder: [[0, 'Club Gymnast', 0], [20, 'Junior Elite', 0], [40, 'Senior Elite', 30000], [65, 'World Medalist', 150000], [85, 'Gymnastics Legend', 700000]],
      agencies: function () { return ['a gymnastics club', 'a national training center']; },
      train: ['Train new skills', 'I trained a new skill until I could hit it in my sleep.'],
      gigs: function () { return [[0, 'Club meet', 0, 4, 30, 0, 1], [20, 'Regional meet', 500, 5, 44, 0, 1], [40, 'National championships', 10000, 7, 58, 0, 1], [55, 'World Cup event', 25000, 7, 64, 0, 1]]; },
      big: ['🥇', function () { return 'Summer Olympics'; }, 55, 'final', { rounds: ['qualifications', 'the team final', 'the all-around final', 'the event finals'], prize: [100000, 600000], honor: 'Olympic gold', base: 0.3, olympic: 'summer', medals: true }],
      honor: [72, 0.12, function () { return 'World Championships gold'; }],
      decline: 24
    },
    swimmer: {
      gain: 1.15, name: 'Swimmer', icon: '🏊', minAge: 8, maxStart: 18, skillName: 'Stroke', blurb: 'Club meets, nationals, the Summer Olympics · start by 18',
      need: function () { return me().athl < 45 ? 'I need a stronger engine (45+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.6 + me().athl * 0.35 + me().happy * 0.05; },
      ladder: [[0, 'Club Swimmer', 0], [20, 'Age-Group Star', 0], [40, 'National Team', 40000], [65, 'World Medalist', 200000], [85, 'Swimming Legend', 1000000]],
      agencies: function () { return ['a swim club', 'a university swim team']; },
      train: ['Swim doubles', 'I swam two practices a day, twelve thousand meters.'],
      gigs: function () { return [[0, 'Club meet', 0, 4, 30], [20, 'State championships', 0, 5, 44], [40, 'National championships', 10000, 7, 58], [55, yr() >= 2019 ? 'International Swimming League meet' : 'Major international meet', 30000, 7, 64]]; },
      big: ['🥇', function () { return 'Summer Olympics'; }, 55, 'final', { rounds: ['the heats', 'the semifinal', 'the final', 'the touch'], prize: [100000, 800000], honor: 'Olympic gold', base: 0.32, olympic: 'summer', medals: true }],
      honor: [72, 0.12, function () { return 'World record'; }],
      decline: 29
    },
    sprinter: {
      gain: 1.2, name: 'Sprinter', icon: '🏃', minAge: 12, maxStart: 20, skillName: 'Speed', blurb: 'School meets, nationals, the 100 meters at the Olympics',
      need: function () { return me().athl < 55 ? 'Sprinting takes elite athleticism (55+).' : null; },
      power: function (x) { return x.skill * 0.55 + me().athl * 0.4 + me().happy * 0.05; },
      ladder: [[0, 'School Sprinter', 0], [20, 'Collegiate Sprinter', 0], [40, 'National Finalist', 50000], [65, 'World Medalist', 300000], [85, 'Fastest Alive', 1500000]],
      agencies: function () { return ['a track club', 'a university track team']; },
      train: ['Run sprint drills', 'I ran block starts and flying 30s until my legs gave out.'],
      gigs: function () { return [[0, 'School meet', 0, 4, 30], [20, 'Collegiate meet', 0, 5, 44], [40, 'National championships', 15000, 7, 58], [55, yr() >= 2010 ? 'Diamond League meet' : 'International Grand Prix meet', 50000, 7, 64]]; },
      big: ['🥇', function () { return 'Summer Olympics'; }, 55, 'final', { rounds: ['the heats', 'the semifinal', 'the final', 'the photo finish'], prize: [150000, 1000000], honor: 'Olympic gold', base: 0.3, olympic: 'summer', medals: true }],
      honor: [72, 0.12, function () { return yr() >= 1983 ? 'World Championships gold' : 'World record'; }],
      decline: 30
    },
    climber: {
      gain: 0.6, name: 'Mountaineer', icon: '🏔️', minAge: 16, skillName: 'Climbing', blurb: 'Local peaks, the Alps, big walls, Everest · athletic',
      need: function () { return me().athl < 50 ? 'High altitude needs a strong body (50+ athleticism).' : null; },
      power: function (x) { return x.skill * 0.55 + me().athl * 0.3 + me().health * 0.15; },
      ladder: [[0, 'Weekend Climber', 0], [20, 'Alpine Climber', 15000], [40, 'Expedition Climber', 50000], [65, 'Himalayan Veteran', 150000], [85, 'Mountaineering Legend', 400000]],
      agencies: function () { return ['a guiding company', 'my own expeditions']; },
      train: ['Train at altitude', 'I hauled a heavy pack up and down the mountain every week.'],
      gigs: function () { return [[0, 'Climb a local peak', 0, 4, 30, 0, 1], [20, 'Guide clients in the Alps', 5000, 5, 44, 0, 1], [35, 'Climb a big wall', 10000, 7, 56, 0, 1], [50, 'Climb an 8,000-meter peak', 40000, 8, 66, 0, 1]]; },
      big: ['🏔️', function () { return 'Summit Everest'; }, 55, 'final', { rounds: ['base camp', 'the Khumbu Icefall', 'the death zone', 'the summit'], prize: [50000, 300000], honor: 'Everest summit', base: 0.38, risk: 1, minYear: 1953 }],
      honor: [72, 0.1, function () { return yr() >= 1991 ? 'Piolet d\'Or' : 'Explorer of the Year'; }],
      decline: 50
    },
    gamedev: {
      gain: 0.5, name: 'Game developer', icon: '🕹️', minAge: 10, minYear: 1977, skillName: 'Game design', blurb: 'Hobby games, indie hits, real studios, your own studio · 1977+',
      need: function () { return yr() < 1977 ? 'There\'s no home video game industry yet.' : null; },
      power: function (x) { return x.skill * 0.65 + me().smarts * 0.3 + me().happy * 0.05; },
      ladder: [[0, 'Hobbyist', 0], [20, 'Indie Developer', 20000], [40, 'Studio Developer', 90000], [65, 'Lead Designer', 250000], [85, 'Legendary Designer', 1000000]],
      agencies: function () { return yr() < 1990 ? ['a home computer software company'] : ['an indie collective', 'a game studio']; },
      train: ['Prototype new mechanics', 'I prototyped ten new mechanics and kept the best one.'],
      gigs: function () { var store = yr() >= 2003 ? 'Steam' : yr() >= 1990 ? 'shareware' : 'mail-order'; return [[0, 'Enter a game jam', 0, 4, 30], [20, 'Release a small game on ' + store, 8000, 5, 46], [40, 'Release a console game', 80000, 7, 60], [60, 'Ship a big indie hit', 300000, 8, 70]]; },
      big: ['🏢', 'Found my own game studio', 40, 'venture', { cost: 50000, noun: 'studio', names: ['Pixel ', 'Lantern ', 'Moonlight ', 'Brightside '] }],
      honor: [72, 0.1, function () { return yr() >= 2014 ? 'The Game Awards Game of the Year' : 'Game of the Year'; }]
    }
  };
  Object.keys(C).forEach(function (k) { C[k].id = k; });
  var GAMES = [['StarCraft', 1998], ['Counter-Strike', 2000], ['Halo 2', 2004], ['League of Legends', 2009], ['Dota 2', 2013], ['Fortnite', 2017], ['Valorant', 2020]];

  // Born talents (js/talents.js) that suit each career: a gift makes the work and the practice easier.
  var GIFT = { model: ['beauty', 'stage'], chef: ['palate', 'artist'], gamer: ['reflex', 'genius'], comic: ['stage', 'charm', 'acting'], designer: ['artist', 'beauty'], author: ['genius', 'artist'], poker: ['nerve', 'genius', 'charm'], racer: ['reflex', 'nerve', 'athlete'], magician: ['stage', 'charm', 'acting'], dj: ['music', 'stage'], lifter: ['athlete', 'iron'], chess: ['genius'], wrestler: ['athlete', 'stage', 'charm'],
    director: ['artist', 'acting'], golfer: ['nerve', 'athlete'], fighter: ['reflex', 'nerve', 'athlete', 'iron'], ballet: ['grace', 'stage', 'athlete'], painter: ['artist'], tattoo: ['artist'], surfer: ['grace', 'nerve', 'athlete'], photographer: ['artist'], skater: ['reflex', 'athlete'], opera: ['music', 'stage'],
    host: ['stage', 'charm', 'acting'], stunt: ['nerve', 'athlete', 'iron'], rodeo: ['nerve', 'athlete', 'iron'], jockey: ['reflex', 'athlete'], skating: ['grace', 'athlete', 'artist'], gymnast: ['grace', 'athlete'], swimmer: ['grace', 'athlete'], sprinter: ['reflex', 'athlete'], climber: ['nerve', 'iron', 'athlete'], gamedev: ['genius'] };
  // A matching gift is a real edge: more power on every gig, faster training, faster fame, and more stamina.
  var GIFT_POWER = 9, GIFT_TRAIN = 1.5, GIFT_REP = 1.3;
  function gift(id) { return TL.talents ? (GIFT[id] || []).filter(function (t) { return TL.talents.has(t); })[0] || null : null; }
  function giftKnown(id) { var g = gift(id); return g && (me().talents || []).some(function (t) { return t.id === g && t.known; }) ? g : null; }
  // What my gift does for this career, shown on its screen once I know about it.
  function giftLine(id) {
    var g = giftKnown(id), d = g && TL.talents.get(g);
    if (!d) { var any = (GIFT[id] || []).map(function (k) { var q = TL.talents && TL.talents.get(k); return q ? q.icon + ' ' + q.name : ''; }).filter(Boolean); return any.length ? '<p class="small muted">Gifts that help: ' + any.join(', ') + '</p>' : ''; }
    return '<p class="small">🎁 ' + d.icon + ' <b>' + d.name + '</b> suits this career: stronger on every gig, training ' + Math.round((GIFT_TRAIN - 1) * 100) + '% faster, fame ' + Math.round((GIFT_REP - 1) * 100) + '% faster, more stamina.</p>';
  }
  // Childhood lessons for a gift this career suits: a head start (js/events.js talent_nurture).
  function headStart(id, x) {
    var g = (GIFT[id] || []).filter(function (k) { return TL.talents && TL.talents.has(k) && TL.talents.nurtured(k); })[0];
    if (!g) return;
    x.skill = U.clamp(x.skill + 15, 0, 100); x.rep = U.clamp(x.rep + 5, 0, 100); x.nurtured = g;
    E.log('🎁 All those years of lessons are paying off. I\'m starting well ahead of everyone else.', 'good');
  }
  function powerOf(c, x) { return c.power(x) + (gift(c.id) ? GIFT_POWER : 0); }
  function bigName(c) { return typeof c.big[1] === 'function' ? c.big[1]() : c.big[1]; }
  function all() { return S().sp || (S().sp = {}); }
  function st(id) { return all()[id]; }
  function active() { var j = S().job; return j && j.special ? st(j.special) : null; }
  function cdef(id) { return C[id]; }
  function rung(id, rep) { var L = C[id].ladder, r = L[0]; L.forEach(function (q) { if (rep >= q[0]) r = q; }); return r; }
  function title(job) {
    var j = job || S().job, x = j && st(j.special);
    if (j && j.special === 'wrestler' && TL.wrestling && S().wr) return TL.wrestling.title();
    if (j && j.special === 'racer' && TL.racing && S().rc) return TL.racing.title();
    if (j && j.special === 'gamedev' && TL.gamedev) return TL.gamedev.title();
    if (!x) return 'Freelancer';
    var t = rung(j.special, x.rep)[1];
    return j.special === 'chef' && x.rest ? 'Chef-Owner' : j.special === 'model' && me().gender === 'M' && t === 'Supermodel' ? 'Supermodel' : t;
  }
  function summary(id) {
    if (id === 'wrestler' && TL.wrestling) return TL.wrestling.summary();
    if (id === 'racer' && TL.racing) return TL.racing.summary();
    if (id === 'gamedev' && TL.gamedev) return TL.gamedev.summary();
    var x = st(id);
    if (x && x.youth && !x.retired) return 'Junior · reputation ' + Math.round(x.rep) + (me().age >= 14 ? ' · ready to turn pro' : '');
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
    // Kids train and enter junior events; the job (going pro) waits until 14.
    if (m.age < 14) {
      if (!x) { x = all()[id] = { rep: 3, skill: U.rand(8, 18), since: s.year, peak: 3, honors: [], earnTotal: 0 }; headStart(id, x); if (id === 'gamer') { var gy = era(GAMES); x.game = gy[gy.length - 1] || 'Quake'; } }
      x.youth = true;
      E.log(c.icon + ' I started training to be ' + (/^[AEIOU]/.test(c.name) ? 'an ' : 'a ') + c.name.toLowerCase() + '. I can turn pro at 14.', 'good');
      ui().back(); return done(good('Training starts now. I can turn pro at 14.'));
    }
    if (!x) {
      if (id === 'model' && !U.chance(0.25 + (m.looks - 55) / 50)) { bump('spjoin'); return done(bad('The agency passed on me. Maybe next year.')); }
      x = all()[id] = { rep: 5, skill: U.rand(10, 25), since: s.year, peak: 5, honors: [], earnTotal: 0 };
      headStart(id, x);
      if (id === 'gamer') { var gs = era(GAMES); x.game = gs[gs.length - 1] || 'Quake'; }
    }
    x.retired = false; delete x.youth;
    var org = U.pick(c.agencies());
    s.job = { career: 'sp_' + id, special: id, fame: true, level: 0, perf: 60, years: 0, levelYears: 0, mult: 1, salary: 0, company: id === 'gamer' && x.rep < 40 ? 'Free agent' : org };
    if (id === 'gamer' && x.rep >= 40) x.team = org;
    E.log(C[id].icon + ' ' + (id === 'model' ? 'I signed with ' + org + '! I\'m officially a model.' : id === 'chef' ? 'I got a job as a line cook at ' + org + '.' : id === 'gamer' ? 'I\'m going pro in ' + x.game + '.' : 'I started my career as ' + (/^[AEIOU]/.test(c.name) ? 'an ' : 'a ') + c.name.toLowerCase() + ' with ' + org + '.'), 'good');
    ui().closeAll(); done({ text: id === 'model' ? 'Signed with ' + org + '!' : 'A new career begins.', cls: 'good', quiet: true }); // the log already says what happened
  }

  // ------------------------------------------------------------ the year's work
  function gig(id, g) {
    var x = st(id), c = C[id], key = 'spgig';
    if (count('spbreak')) return done(nope('I\'m taking this year off.'));
    if (count(key) >= 3) return done(nope('I\'ve taken on enough this year.'));
    var buy = g[5] ? E.$(g[5]) : 0;
    if (buy && S().money < buy) return done(nope('The buy-in is ' + E.fmt(buy) + '.'));
    bump(key);
    if (buy) E.addMoney(-buy);
    var ag = x.agent ? AGENTS[x.agent.kind] : null;
    var odds = U.clamp(0.25 + (powerOf(c, x) - g[4]) / 60 + (x.rep - g[0]) / 200 + (ag ? ag.odds : 0) - (x.burn || 0) * 0.04, 0.08, 0.92);
    if (U.chance(odds)) {
      var pay = E.$(Math.round(g[2] * U.randf(0.7, 1.3) * (1 + x.rep / 100) * (ag ? 1 + ag.pay : 1)));
      if (S().job && S().job.special === id) x.earn = (x.earn || 0) + pay; else E.addMoney(pay); // juniors get paid on the spot
      x.rep = U.clamp(x.rep + (g[3] * U.randf(0.7, 1.2) + Math.max(0, powerOf(c, x) - g[4]) / 20) * (112 - x.rep) / 60 * Math.max(0.8, c.gain || 1) * (gift(id) ? GIFT_REP : 1), 0, 100); // the top is crowded, but outclassing the gig gets noticed
      E.stat('happy', 3); E.fame(g[3] / 3);
      if (/^Cover of/.test(g[1])) x.covers = (x.covers || 0) + 1;
      if (/^Major|^LAN|^Online/.test(g[1]) && U.chance(0.3 + (powerOf(c, x) - g[4]) / 80)) {
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
    if (count('spbreak')) return done(nope('I\'m taking this year off.'));
    if (count('sptrain') >= 2) return done(nope('I\'ve trained as much as I can this year.'));
    bump('sptrain');
    var gain = Math.max(1, Math.round((100 - x.skill) / 12 * U.randf(0.6, 1.2) * (gift(id) ? GIFT_TRAIN : 1)));
    x.skill = U.clamp(x.skill + gain, 0, 100);
    // Practice is visible: a little reputation every time, a bit more once I'm really good.
    x.rep = U.clamp(x.rep + 0.5 + x.skill / 100, 0, 100);
    if (id === 'gamer') { E.stat('health', -1); E.stat('happy', -1); }
    done(good(c.train[1] + ' (+' + gain + ' ' + c.skillName.toLowerCase() + ')' + (giftKnown(id) ? ' It comes naturally to me.' : '')));
  }
  // Signature moves: a luxury contract, my own restaurant, the World Championship.
  function bigMove(id) {
    var x = st(id), s = S();
    if (count('spbreak')) return done(nope('I\'m taking this year off.'));
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
    while (r < 4 && U.chance(U.clamp(0.35 + (powerOf(C.gamer, x) - 75) / 90, 0.12, 0.72))) r++;
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
      x.contract = { brand: U.pick(o.brands()), years: o.years, pay: pay, verb: o.verb };
      E.fame(6); E.stat('happy', 10);
      return done(good(b[0] + ' I signed a ' + o.years + '-year ' + o.verb + ' at ' + x.contract.brand + ': ' + E.fmt(pay) + ' a year!'));
    }
    if (b[3] === 'venture') {
      if (x.rest) return done(nope('I already run ' + x.rest.name + '.'));
      var cost = E.$(o.cost);
      if (s.money < cost) return done(nope('That takes about ' + E.fmt(cost) + '.'));
      E.addMoney(-cost);
      x.rest = { name: U.pick(o.names) + me().last, since: s.year, q: Math.round(powerOf(c, x)), stars: 0, noun: o.noun };
      E.stat('happy', 12);
      return done(good(b[0] + ' I launched my own ' + o.noun + ', ' + x.rest.name + '!'));
    }
    // 'final': once a year, won round by round.
    if (o.minYear && yr() < o.minYear) return done(nope(label + ' doesn\'t exist yet.'));
    if (o.olympic && !olympic(o.olympic, yr())) return done(nope('The next ' + (o.olympic === 'winter' ? 'Winter' : 'Summer') + ' Olympics are in ' + nextOlympics(o.olympic) + '.'));
    if (count('spbig')) return done(nope(label + ' only comes once a year.'));
    var buy = o.buyIn ? E.$(o.buyIn) : 0;
    if (buy && s.money < buy) return done(nope('The buy-in is ' + E.fmt(buy) + '.'));
    bump('spbig'); if (buy) E.addMoney(-buy);
    var r = 0;
    while (r < 4 && U.chance(U.clamp(o.base + (powerOf(c, x) - 75) / 90, 0.12, 0.78))) r++;
    if (r === 4) {
      var prize = Math.round(E.$(U.rand(o.prize[0], o.prize[1])));
      x.earn = (x.earn || 0) + prize; x.rep = Math.min(100, x.rep + 8); x.wins = (x.wins || 0) + 1;
      x.honors.push(o.honor + ' ' + s.year); E.fame(8); E.stat('happy', 15);
      if (o.medals) return done(good('🥇 OLYMPIC GOLD! I\'m an Olympic champion. (+' + E.fmt(prize) + ')'));
      var nm = label.replace(/^Main event /, '').replace(/^A /, 'a ');
      if (/^(WSOP|Indianapolis|World)/.test(nm)) nm = 'the ' + nm;
      return done(good('🏆 I won ' + nm + '! (+' + E.fmt(prize) + ')'));
    }
    if (o.medals && r >= 2) {
      var med = r === 3 ? 'silver' : 'bronze', mp = Math.round(E.$(o.prize[0] * (r === 3 ? 0.4 : 0.2)));
      x.earn = (x.earn || 0) + mp; x.rep = Math.min(100, x.rep + (r === 3 ? 5 : 3)); x.honors.push('Olympic ' + med + ' ' + s.year); E.fame(r === 3 ? 4 : 3); E.stat('happy', 8);
      return done(good((r === 3 ? '🥈' : '🥉') + ' Olympic ' + med + '! I made it to ' + o.rounds[r - 1] + ' and stood on the podium.'));
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
    x.retired = S().year; x.contract = null; x.agent = null;
    legacy(id, x);
    if (x.rest) { E.addMoney(E.$(Math.round(150000 + x.rest.stars * 400000 + Math.max(0, x.rest.q - 60) * 5000))); E.log((x.rest.noun ? '🏷️ ' : '🍽️ ') + 'I sold ' + x.rest.name + '.'); x.rest = null; }
    E.quitJob(true);
    ui().closeAll(); done('I stepped away from my career as ' + C[id].name.toLowerCase() + '.');
  }

  // ------------------------------------------------------------ yearly
  function year() {
    var s = S(), j = s.job, id = j.special, x = st(id), c = C[id], m = me();
    if (id === 'wrestler' && TL.wrestling && s.wr && !s.wr.retired) return TL.wrestling.year();
    if (id === 'racer' && TL.racing && s.rc && !s.rc.retired) return TL.racing.season();
    if (id === 'gamedev' && TL.gamedev) return TL.gamedev.year();
    if (!x) return 0;
    var r = rung(id, x.rep), earn = E.$(r[2]) + (x.earn || 0); x.earn = 0;
    // Workload: three gigs, two trainings and a big swing every year wears anyone down.
    var load = lastCount('spgig') + lastCount('sptrain') + lastCount('spbig') + lastCount('spduel'), rested = lastCount('spbreak');
    if (rested) { x.burn = 0; E.stat('happy', 8); E.stat('health', 4); x.rep = Math.max(0, x.rep - 1); earn = Math.round(earn * 0.5); }
    else if (load >= (gift(id) ? 9 : 8)) x.burn = (x.burn || 0) + 1; // a gift means more stamina for the grind
    else if (load <= 4) x.burn = Math.max(0, (x.burn || 0) - 1);
    if ((x.burn || 0) >= 3) { E.stat('happy', -3); E.stat('health', -2); if (x.burn === 3) E.log('😮‍💨 I\'m burning out. I need to slow down.', 'bad'); }
    // Age catches up with models and gamers.
    if (c.decline && m.age > c.decline) { var d = (m.age - c.decline) * (x.rep >= 85 ? 0.25 : 0.5); x.rep = Math.max(0, x.rep - d); if (id === 'gamer') x.skill = Math.max(0, x.skill - 1); }
    // Out of sight, out of mind; working steadily keeps you relevant.
    x.rep = Math.max(0, x.rep - (lastCount('spgig') || rested ? 0.3 + x.rep * 0.012 : 2.5 + x.rep * 0.03)); // fame fades slowly while I work, fast if I disappear
    if (id === 'chef') if (x.rep < 60) x.rep = Math.min(60, x.rep + 0.3 + x.skill / 150); // a good kitchen builds a name slowly, but fame takes more
    if (x.contract) {
      earn += x.contract.pay; x.contract.years--;
      if (x.contract.years <= 0) { E.log((id === 'model' ? '💎 My contract with ' : '📝 My deal with ') + x.contract.brand + ' ended.'); x.contract = null; }
    }
    if (id === 'chef' && x.rest) {
      var R = x.rest;
      R.q = U.clamp(Math.round(R.q * 0.6 + powerOf(c, x) * 0.4 + U.rand(-8, 8)), 0, 100);
      var profit = E.$(Math.round((R.q - 55) * 8000 + R.stars * 150000));
      earn += profit;
      var guide = yr() >= 1926 ? 'Michelin' : null;
      var stars = R.q >= 94 ? 3 : R.q >= 89 ? 2 : R.q >= 82 ? 1 : 0;
      if (guide && stars !== R.stars) { E.log(stars > R.stars ? '⭐ ' + R.name + ' earned ' + (stars === 1 ? 'a Michelin star' : stars + ' Michelin stars') + '!' : '📉 ' + R.name + ' lost a Michelin star.', stars > R.stars ? 'good' : 'bad'); if (stars > R.stars) { x.honors.push(stars + ' Michelin star' + (stars > 1 ? 's' : '') + ' ' + s.year); E.fame(stars * 3); x.rep = Math.min(100, x.rep + 3 * (stars - R.stars)); } R.stars = stars; }
      if (profit < 0 && R.q < 35 && U.chance(0.4)) { E.log('🍽️ ' + R.name + ' closed after a bad year.', 'bad'); x.rest = null; E.stat('happy', -10); }
    }
    if (id !== 'chef' && x.rest) {
      var V = x.rest;
      V.q = U.clamp(Math.round(V.q * 0.6 + powerOf(c, x) * 0.4 + U.rand(-8, 8)), 0, 100);
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
    if (x.agent && earn > 0) earn -= Math.round(earn * x.agent.cut); // my agent's commission
    rivalYear(x, c);
    (x.hist = x.hist || []).push({ y: s.year, age: m.age, title: title(j), rep: Math.round(x.rep), earn: earn, note: rested ? 'took the year off' : x.burn >= 3 ? 'burned out' : '' });
    if (x.hist.length > 70) x.hist.shift();
    // Something happens most years.
    if (!rested && U.chance(0.55) && !s.pending.some(function (q) { return q.id === 'sp_event'; })) { var k = pickEvent(x, id); if (k) s.pending.push({ id: 'sp_event', data: { id: id, k: k } }); }
    x.earnTotal = (x.earnTotal || 0) + earn; j.salary = earn;
    return earn;
  }

  // ------------------------------------------------------------ depth: agents, rivals, burnout, events
  var AGENTS = { big: { name: 'a big talent agency', cut: 0.2, odds: 0.06, pay: 0.35 }, small: { name: 'a boutique manager', cut: 0.1, odds: 0.03, pay: 0.15 } };
  function hireAgent(kind) {
    var x = active(); if (!x) return;
    if (x.agent) return done(nope('I already have representation.'));
    if (kind === 'big' && x.rep < 45) return done(nope('The big agencies only sign established names (reputation 45+).'));
    x.agent = { kind: kind, name: AGENTS[kind].name, cut: AGENTS[kind].cut, since: yr() };
    done(good('🤝 I signed with ' + AGENTS[kind].name + '. They take ' + Math.round(AGENTS[kind].cut * 100) + '% but open a lot of doors.'));
  }
  function fireAgent() { var x = active(); if (!x || !x.agent) return; x.agent = null; done('I parted ways with my representation.'); }
  function rivalName() { var n = E.randomName(U.chance(0.5) ? 'M' : 'F'); return n.first + ' ' + n.last; }
  // A named rival in my field: they rise and fall, and we can go head to head.
  function rivalYear(x, c) {
    if (!x.rival && x.rep >= 20 && U.chance(0.5)) {
      x.rival = { name: rivalName(), rep: Math.round(U.clamp(x.rep + U.rand(-5, 12), 10, 95)), w: 0, l: 0 };
      E.log('😤 ' + x.rival.name + ' is making a name in my field. Everyone compares us.');
      return;
    }
    var r = x.rival; if (!r) return;
    r.rep = U.clamp(r.rep + U.rand(-4, 5) + (r.rep < x.rep ? 1 : -1), 0, 100);
    if (r.rep > x.rep + 15 && U.chance(0.5)) { E.log('😤 ' + r.name + ' is overshadowing me right now.', 'bad'); E.stat('happy', -2); }
    if (x.rep > r.rep + 20) { E.log('👑 I\'ve left ' + r.name + ' behind. Nobody compares us anymore.', 'good'); (x.pastRivals = x.pastRivals || []).push({ name: r.name, w: r.w, l: r.l }); x.rival = null; x.beaten = (x.beaten || 0) + 1; }
  }
  function duel() {
    var x = active(), j = S().job, c = C[j.special], r = x && x.rival;
    if (!r) return;
    if (count('spduel')) return done(nope('We already went at it this year.'));
    bump('spduel');
    var p = U.clamp(0.5 + (powerOf(c, x) - r.rep) / 60 + (x.rep - r.rep) / 150, 0.1, 0.9);
    if (U.chance(p)) { r.w++; x.rep = U.clamp(x.rep + 2.5, 0, 100); r.rep = Math.max(0, r.rep - 4); E.fame(2); E.stat('happy', 5); return done(good('⚔️ I beat ' + r.name + ' head to head. (' + r.w + '-' + r.l + ' all time)')); }
    r.l++; x.rep = Math.max(0, x.rep - 3); r.rep = Math.min(100, r.rep + 3); E.stat('happy', -4);
    done(bad('⚔️ ' + r.name + ' got the better of me this time. (' + r.w + '-' + r.l + ' all time)'));
  }
  function takeBreak() {
    if (count('spgig') || count('spbig')) return done(nope('I\'ve already committed to work this year.'));
    bump('spbreak');
    done(good('🌴 I\'m taking the rest of the year off to recharge.'));
  }
  var HOF = { comic: 'a Kennedy Center Mark Twain Prize', poker: 'the Poker Hall of Fame', racer: 'the Motorsports Hall of Fame', wrestler: 'the WWE Hall of Fame', golfer: 'the World Golf Hall of Fame', fighter: 'the International Boxing Hall of Fame', chess: 'the World Chess Hall of Fame', surfer: 'the Surfers\' Hall of Fame', skater: 'the Skateboarding Hall of Fame', gamer: 'the Esports Hall of Fame', model: 'a lifetime achievement award from the fashion world', chef: 'a James Beard Lifetime Achievement Award', director: 'an honorary Oscar', host: 'the Television Academy Hall of Fame', rodeo: 'the ProRodeo Hall of Fame', jockey: 'the Racing Hall of Fame', skating: 'the World Figure Skating Hall of Fame', gymnast: 'the International Gymnastics Hall of Fame', swimmer: 'the International Swimming Hall of Fame', sprinter: 'the USATF Hall of Fame', gamedev: 'the AIAS Hall of Fame', climber: 'a Piolet d\'Or Lifetime Achievement award' };
  function legacy(id, x) {
    if (x.hof || (x.peak || 0) < 85) return;
    x.hof = yr(); var h = HOF[id] || 'a lifetime achievement award';
    x.honors.push((/^(a|an) /.test(h) ? U.cap(h.replace(/^an? /, '')) : 'Inducted into ' + h) + ' ' + yr());
    E.log('🏛️ ' + (/^(a|an) /.test(h) ? 'I received ' + h + '.' : 'I was inducted into ' + h + '.'), 'good'); E.fame(5);
  }
  function history(id) {
    ui().menu('Career history', function () {
      var x = st(id), H = x.hist || [], best = H.reduce(function (b, q) { return !b || q.earn > b.earn ? q : b; }, null), items = [];
      items.push({ info: true, html: '<div class="kv"><b>' + U.esc(C[id].name) + '</b> since ' + x.since + '<br>Peak reputation ' + Math.round(x.peak || 0) + ' · career earnings ' + E.fmt(x.earnTotal || 0) +
        (best ? '<br>Best year: ' + best.y + ' (' + E.fmt(best.earn) + ')' : '') + (x.beaten ? '<br>Rivals left behind: ' + x.beaten : '') + (x.rival ? '<br>Current rival: ' + U.esc(x.rival.name) + ' (' + x.rival.w + '-' + x.rival.l + ')' : '') + '</div>' });
      if (x.honors.length) { items.push({ section: 'Honors' }); x.honors.slice().reverse().forEach(function (h) { items.push({ icon: '🏅', label: h }); }); }
      if (H.length) { items.push({ section: 'Year by year' }); H.slice().reverse().forEach(function (q) { items.push({ icon: C[id].icon, label: q.y + ' · ' + q.title, sub: 'Age ' + q.age + ' · reputation ' + q.rep + (q.note ? ' · ' + q.note : ''), right: E.fmt(q.earn) }); }); }
      return items;
    });
  }

  // Yearly career events: shared ones plus two for each career. Effects use a small
  // vocabulary: rep, skill, happy, health, fame, karma, pay (scaled by reputation),
  // cost (paid now), rv (rival's reputation), reset ('burn'), p/pw (chance, power-adjusted) with ok/no.
  var GEN = [
    { cond: function (x) { return (x.burn || 0) >= 3; }, t: 'I\'m exhausted. I\'ve been working nonstop for too long.', c: [['Push through', { happy: -6, health: -5, rep: 1, say: 'I kept going. Something has to give eventually.' }], ['Take a few months off', { rep: -3, happy: 8, health: 5, reset: 'burn', say: 'I disappeared for a while and came back recharged.' }], ['See a therapist', { cost: 2000, happy: 6, reset: 'burn', say: 'Talking it through helped a lot.' }]] },
    { cond: function (x) { return !!x.rival; }, t: '{rival} took shots at me in an interview.', c: [['Clap back', { p: 0.5, ok: { rep: 3, fame: 2, rv: -3, say: 'My response went viral. Round to me.' }, no: { rep: -3, rv: 2, say: 'It came off as petty. {rival} won that one.' } }], ['Take the high road', { karma: 2, say: 'I said I wished them well. Classy.' }], ['Challenge them to settle it', { p: 0.45, pw: 1, ok: { rep: 5, rv: -5, say: 'We settled it, and I won.' }, no: { rep: -4, rv: 4, say: '{rival} beat me, and everyone saw it.' } }]] },
    { cond: function (x) { return x.rep >= 40; }, t: 'A tabloid dug up an embarrassing story about me.', c: [['Apologize', { rep: -2, karma: 1, say: 'I owned it. It blew over.' }], ['Deny everything', { p: 0.6, ok: { say: 'Nobody could prove it. It blew over.' }, no: { rep: -7, say: 'More evidence came out. It got worse.' } }], ['Ignore it', { rep: -3, say: 'It faded, slowly.' }]] },
    { cond: function (x) { return x.rep < 50; }, t: 'A legend in my field offered to mentor me.', c: [['Accept', { skill: 5, rep: 2, happy: 2, say: 'I learned more in a year than in the last five.' }], ['Politely decline', { say: 'I want to find my own way.' }]] },
    { cond: function (x) { return x.rep >= 30; }, t: 'A brand wants me in an ad campaign.', c: [['Take the money', { pay: 8000, rep: -1, say: 'Easy money, though some fans called it a sellout move.' }], ['Only if I believe in it', { p: 0.5, ok: { pay: 5000, rep: 2, say: 'It was a perfect fit. Fans loved it.' }, no: { say: 'It wasn\'t a fit. I passed.' } }], ['Turn it down', { karma: 1, say: 'I passed.' }]] },
    { cond: function (x) { return x.rep >= 30; }, t: 'I was asked to headline a charity event.', c: [['Do it for free', { karma: 3, rep: 2, happy: 3, say: 'We raised a lot of money. It felt great.' }], ['Ask for a fee', { pay: 4000, karma: -2, say: 'They paid, but people talked.' }], ['Decline', { say: 'I didn\'t have time.' }]] },
    { cond: function (x) { return !x.agent && x.rep >= 25; }, t: 'A talent agency wants to represent me.', c: [['Sign with them', { agent: 'small', say: 'I signed. They take 10%, but the gigs are better.' }], ['Stay independent', { say: 'I\'ll keep doing it myself.' }]] },
    { cond: function (x) { return x.rep >= 50; }, t: 'A young fan told me I\'m the reason they started.', c: [['Spend time with them', { happy: 5, karma: 2, say: 'We talked for an hour. That kid is going places.' }], ['Sign something and move on', { happy: 1, say: 'I signed their poster.' }]] }
  ];
  var EV = {
    model: [{ t: 'A photographer is pressuring me into a shoot I\'m not comfortable with.', c: [['Walk out', { rep: -2, karma: 2, happy: 2, say: 'I walked out. My agency backed me.' }], ['Go along with it', { pay: 3000, happy: -8, say: 'I did it and felt awful afterward.' }], ['Report him', { p: 0.6, ok: { rep: 3, karma: 3, say: 'Other models came forward too. He was blacklisted.' }, no: { rep: -4, say: 'Nobody believed me, and some clients stopped calling.' } }]] },
      { t: 'A designer wants me to lose weight before their show.', c: [['Refuse', { rep: -2, health: 2, say: 'I refused. There will be other shows.' }], ['Crash diet', { health: -10, rep: 4, say: 'I made the show, but I felt terrible.' }], ['Speak out publicly', { p: 0.5, ok: { rep: 4, fame: 3, karma: 3, say: 'My post went viral and the brand apologized.' }, no: { rep: -3, say: 'Some designers quietly stopped booking me.' } }]] }],
    chef: [{ t: 'A famous food critic is in the dining room tonight.', c: [['Cook the classics perfectly', { p: 0.55, pw: 1, ok: { rep: 5, say: 'A glowing review!' }, no: { rep: -3, say: '"Competent but forgettable," the review said.' } }], ['Send out a bold new dish', { p: 0.4, pw: 1, ok: { rep: 9, fame: 2, say: 'The critic called it the dish of the year.' }, no: { rep: -6, say: 'The critic hated it. The review was brutal.' } }]] },
      { t: 'A line cook walked out in the middle of Saturday service.', c: [['Jump on the line myself', { health: -3, rep: 2, say: 'I worked two stations. We didn\'t miss a plate.' }], ['Comp the delayed tables', { cost: 2000, rep: 1, say: 'Free desserts kept everyone happy.' }], ['Yell at the staff', { rep: -2, karma: -2, say: 'Service survived, but the kitchen hates me now.' }]] }],
    gamer: [{ t: 'A rival team offered me more money mid-season.', c: [['Stay loyal', { rep: 2, karma: 1, say: 'The fans loved that I stayed.' }], ['Take the offer', { pay: 30000, rep: -1, say: 'I switched teams. Some fans called me a sellout.' }]] },
      { t: 'My wrists ache after months of grinding.', c: [['See a physio', { cost: 1500, health: 4, say: 'Physio and rest fixed it.' }], ['Play through it', { health: -6, skill: 2, say: 'I kept grinding. The pain is getting worse.' }]] }],
    comic: [{ t: 'A heckler won\'t stop interrupting my set.', c: [['Roast them', { p: 0.6, pw: 1, ok: { rep: 4, fame: 2, say: 'The clip of me destroying the heckler went viral.' }, no: { rep: -2, say: 'I lost the room.' } }], ['Ignore it', { say: 'I powered through. The set was fine.' }], ['Have them thrown out', { rep: -1, say: 'Security removed them, but the energy was gone.' }]] },
      { t: 'One of my jokes got clipped out of context online.', c: [['Apologize', { rep: -2, karma: 1, say: 'I apologized. It blew over.' }], ['Double down', { p: 0.4, ok: { rep: 5, fame: 3, say: 'My fans rallied. The tour sold out.' }, no: { rep: -8, say: 'Venues started canceling my shows.' } }], ['Write a bit about it', { p: 0.55, pw: 1, ok: { rep: 6, say: 'The new bit about the controversy killed.' }, no: { rep: -3, say: 'Nobody found it funny.' } }]] }],
    designer: [{ t: 'A fast-fashion brand copied my design.', c: [['Sue them', { cost: 15000, p: 0.5, ok: { pay: 40000, rep: 3, say: 'I won the lawsuit.' }, no: { rep: -1, say: 'I lost the case and the legal fees.' } }], ['Call them out online', { p: 0.6, ok: { rep: 4, fame: 2, say: 'People rallied behind me.' }, no: { say: 'Nobody cared.' } }], ['Let it go', { happy: -3, say: 'I let it go. It still stings.' }]] },
      { t: 'A celebrity wants to wear my design to a huge gala.', c: [['Make something daring', { p: 0.5, pw: 1, ok: { rep: 8, fame: 4, say: 'My look topped every best-dressed list.' }, no: { rep: -4, say: 'The look landed on the worst-dressed lists.' } }], ['Play it safe', { rep: 3, say: 'Elegant and safe. Solid reviews.' }]] }],
    author: [{ t: 'My editor wants me to cut 100 pages.', c: [['Make the cuts', { skill: 2, rep: 1, say: 'The book is tighter now.' }], ['Fight for my vision', { p: 0.45, pw: 1, ok: { rep: 5, say: 'Critics praised the ambition.' }, no: { rep: -3, say: 'Reviewers called it bloated.' } }]] },
      { t: 'I have writer\'s block.', c: [['Push through', { happy: -4, skill: 1, say: 'I forced out a few chapters.' }], ['Travel for inspiration', { cost: 5000, happy: 5, skill: 2, say: 'The trip gave me a whole new idea.' }], ['Take a break', { happy: 4, rep: -2, say: 'I rested. The words came back.' }]] }],
    poker: [{ t: 'I\'m on a brutal downswing.', c: [['Move down in stakes', { rep: -2, happy: 2, say: 'I rebuilt my bankroll at smaller games.' }], ['Keep playing high', { p: 0.45, pw: 1, ok: { pay: 20000, rep: 3, say: 'I ran good and won it all back.' }, no: { cost: 20000, happy: -6, say: 'I lost even more.' } }]] },
      { t: 'A wealthy amateur invited me to a private game.', c: [['Play', { p: 0.6, pw: 1, ok: { pay: 30000, say: 'I won a fortune.' }, no: { cost: 10000, say: 'They were better than they looked.' } }], ['Decline', { say: 'I passed.' }]] }],
    racer: [{ t: 'My team asked me to let my teammate win.', c: [['Follow orders', { rep: -1, karma: 1, say: 'I let my teammate by. The team appreciated it.' }], ['Race for the win', { p: 0.5, ok: { rep: 5, fame: 2, say: 'I won. The fans loved it, even if the team didn\'t.' }, no: { rep: -3, say: 'We collided. The team is furious.' } }]] },
      { t: 'The car feels unsafe in practice.', c: [['Refuse to race', { rep: -2, say: 'I sat it out. Better safe.' }], ['Race anyway', { p: 0.6, ok: { rep: 3, say: 'It held together.' }, no: { health: -15, rep: -1, say: 'The car failed and I crashed hard.' } }]] }],
    magician: [{ t: 'Someone posted an exposé of my signature trick.', c: [['Invent a new one', { skill: 3, rep: 2, happy: -2, say: 'My new illusion is even better.' }], ['Sue', { cost: 10000, p: 0.5, ok: { rep: 2, say: 'The video came down.' }, no: { rep: -1, say: 'The video stayed up.' } }]] },
      { t: 'A stunt went wrong on stage.', c: [['Keep going like it was planned', { p: 0.5, pw: 1, ok: { rep: 5, fame: 2, say: 'The audience thought it was part of the act.' }, no: { health: -8, rep: -3, say: 'I got hurt and the show stopped.' } }], ['Stop the show', { rep: -2, say: 'I stopped the show safely.' }]] }],
    dj: [{ t: 'The sound system died in the middle of my set.', c: [['Hype the crowd until it\'s fixed', { p: 0.6, pw: 1, ok: { rep: 4, say: 'The crowd chanted my name.' }, no: { rep: -3, say: 'Half the crowd left.' } }], ['Wait it out', { rep: -1, say: 'We waited. It was awkward.' }]] },
      { t: 'A producer offered me a track to release as my own.', c: [['Release it', { p: 0.5, ok: { rep: 5, pay: 20000, say: 'It became a hit.' }, no: { rep: -8, karma: -3, say: 'Everyone found out it was ghost-produced.' } }], ['Release it as a collab', { rep: 2, karma: 2, say: 'We released it together.' }], ['Decline', { say: 'I passed.' }]] }],
    lifter: [{ t: 'Someone at the gym offered me steroids.', c: [['Say no', { karma: 2, say: 'I stayed natural.' }], ['Take them', { p: 0.6, ok: { rep: 5, health: -8, say: 'I got huge, but my health is suffering.' }, no: { rep: -10, health: -8, say: 'I failed a drug test.' } }]] },
      { t: 'My shoulder is screaming before a show.', c: [['Compete anyway', { p: 0.5, ok: { rep: 3, say: 'I pushed through and placed well.' }, no: { health: -10, rep: -2, say: 'I tore something.' } }], ['Skip the show', { rep: -1, say: 'I rested up.' }]] }],
    chess: [{ t: 'My opponent accused me of cheating.', c: [['Demand an investigation', { p: 0.75, ok: { rep: 3, say: 'I was cleared, and my opponent apologized.' }, no: { rep: -6, say: 'The suspicion still hangs over me.' } }], ['Ignore it', { rep: -2, say: 'The rumors linger.' }]] },
      { t: 'I was offered the chance to coach a rising prodigy.', c: [['Coach them', { pay: 15000, skill: 1, karma: 2, say: 'Teaching sharpened my own game.' }], ['Decline', { say: 'I focused on my own chess.' }]] }],
    wrestler: [{ t: 'Creative wants me to turn heel.', c: [['Embrace it', { p: 0.55, pw: 1, ok: { rep: 6, fame: 3, say: 'The crowd loves to hate me.' }, no: { rep: -3, say: 'The turn fell flat.' } }], ['Refuse', { rep: -2, say: 'Creative buried me in the midcard.' }]] },
      { t: 'A botched move left my neck hurting.', c: [['See a doctor and sit out', { rep: -2, health: 4, say: 'I took time off to heal.' }], ['Work through it', { p: 0.6, ok: { rep: 2, say: 'I got through it.' }, no: { health: -15, say: 'It got much worse.' } }]] }],
    director: [{ t: 'The studio wants to recut my film.', c: [['Fight them', { p: 0.4, ok: { rep: 6, say: 'My cut was released and critics loved it.' }, no: { rep: -3, say: 'They recut it anyway and it flopped.' } }], ['Let them', { rep: -1, pay: 20000, say: 'It\'s not my film anymore, but the check cleared.' }]] },
      { t: 'My lead actor walked off set.', c: [['Rewrite around them', { p: 0.5, pw: 1, ok: { rep: 3, say: 'The rewrite made the film better.' }, no: { rep: -3, say: 'The film is a mess.' } }], ['Recast', { cost: 30000, say: 'We reshot with a new lead.' }]] }],
    golfer: [{ t: 'I\'m tied for the lead on the final hole.', c: [['Go for the green', { p: 0.45, pw: 1, ok: { rep: 6, pay: 30000, say: 'Birdie! I won.' }, no: { rep: -2, say: 'Water. I lost.' } }], ['Lay up', { p: 0.6, ok: { rep: 3, pay: 15000, say: 'A par was enough in the playoff.' }, no: { say: 'I lost in a playoff.' } }]] },
      { t: 'I\'ve got the yips with my putter.', c: [['Switch putters', { skill: 1, say: 'It helped a little.' }], ['See a sports psychologist', { cost: 5000, happy: 3, skill: 2, say: 'My head cleared.' }]] }],
    fighter: [{ t: 'My opponent trash-talked my family at the press conference.', c: [['Fire back', { fame: 3, rep: 2, say: 'The fight sold huge.' }], ['Stay composed', { karma: 2, say: 'I kept it professional.' }]] },
      { t: 'I\'m cutting too much weight.', c: [['Make weight anyway', { health: -8, rep: 2, say: 'I made weight, but I felt drained.' }], ['Move up a weight class', { rep: -2, health: 3, say: 'I moved up a division.' }]] }],
    ballet: [{ t: 'The director gave the role I wanted to my rival.', c: [['Train harder', { skill: 3, happy: -2, say: 'I\'ll be ready next time.' }], ['Ask why', { p: 0.5, ok: { rep: 3, say: 'They gave me the second cast.' }, no: { rep: -2, say: 'The director didn\'t appreciate it.' } }]] },
      { t: 'My feet are bleeding after weeks of rehearsals.', c: [['Dance through it', { health: -6, rep: 2, say: 'The show must go on.' }], ['Rest', { rep: -1, health: 4, say: 'I rested and healed.' }]] }],
    painter: [{ t: 'A collector wants to buy my whole show at a discount.', c: [['Accept', { pay: 30000, rep: -1, say: 'Sold out, at a discount.' }], ['Hold my prices', { p: 0.5, ok: { pay: 50000, rep: 3, say: 'The work sold at full price.' }, no: { rep: -1, say: 'Half the work didn\'t sell.' } }]] },
      { t: 'Someone painted over my mural.', c: [['Make peace', { karma: 2, say: 'We collaborated on a new wall.' }], ['Paint something bigger', { p: 0.5, pw: 1, ok: { rep: 5, fame: 2, say: 'The new mural became a landmark.' }, no: { rep: -1, say: 'It got covered again.' } }]] }],
    tattoo: [{ t: 'A client wants their ex\'s name tattooed.', c: [['Talk them out of it', { karma: 2, say: 'They thanked me later.' }], ['Do it', { pay: 500, say: 'Their call.' }]] },
      { t: 'A client\'s tattoo got infected because they ignored aftercare.', c: [['Help them anyway', { cost: 500, karma: 2, rep: 1, say: 'They left a glowing review.' }], ['Blame the client', { rep: -2, say: 'They posted a one-star review.' }]] }],
    surfer: [{ t: 'A massive swell is coming.', c: [['Paddle out', { p: 0.55, pw: 1, ok: { rep: 6, fame: 2, say: 'I caught the wave of my life.' }, no: { health: -12, say: 'I got held under and hurt.' } }], ['Watch from the beach', { say: 'Better to live to surf another day.' }]] },
      { t: 'A sponsor wants me on a reality show.', c: [['Do it', { pay: 20000, fame: 3, rep: -1, say: 'It was fun, if a little cringey.' }], ['Decline', { say: 'I just want to surf.' }]] }],
    photographer: [{ t: 'I captured a breaking news moment.', c: [['Sell to the highest bidder', { pay: 15000, rep: 2, say: 'It ran on every front page.' }], ['Give it to a newspaper for the credit', { rep: 5, say: 'My byline ran everywhere.' }]] },
      { t: 'A celebrity smashed my camera.', c: [['Press charges', { p: 0.6, ok: { pay: 10000, say: 'I won a settlement.' }, no: { say: 'The case went nowhere.' } }], ['Sell the photos of it', { pay: 20000, rep: -1, karma: -1, say: 'The photos sold for a fortune.' }]] }],
    skater: [{ t: 'A rival skater challenged me to a game of S.K.A.T.E.', c: [['Accept', { p: 0.5, pw: 1, ok: { rep: 4, say: 'I won.' }, no: { rep: -2, say: 'I lost on camera.' } }], ['Pass', { say: 'Not today.' }]] },
      { t: 'I want to try a huge gap for my video part.', c: [['Go for it', { p: 0.45, pw: 1, ok: { rep: 7, fame: 3, say: 'I landed it. The clip went viral.' }, no: { health: -12, say: 'I slammed hard.' } }], ['Film something safer', { rep: 1, say: 'Solid footage.' }]] }],
    opera: [{ t: 'I have a cold on opening night.', c: [['Sing anyway', { p: 0.5, pw: 1, ok: { rep: 5, say: 'I nailed it anyway.' }, no: { rep: -4, say: 'My voice cracked on the high note.' } }], ['Let the understudy go on', { rep: -1, say: 'The understudy got great reviews.' }]] },
      { t: 'A conductor wants me for a famously difficult role.', c: [['Take it', { p: 0.45, pw: 1, ok: { rep: 7, say: 'A triumph!' }, no: { rep: -4, say: 'It was beyond me.' } }], ['Decline', { say: 'I know my voice.' }]] }],
    host: [{ t: 'A guest storms off my show live on air.', c: [['Make a joke of it', { p: 0.55, pw: 1, ok: { rep: 5, fame: 2, say: 'The clip went viral. Ratings jumped.' }, no: { rep: -3, say: 'It came off as cruel.' } }], ['Apologize on air', { karma: 2, rep: 1, say: 'Viewers respected it.' }]] },
      { t: 'The network wants me to soften my political jokes.', c: [['Tone it down', { rep: -1, say: 'The network is happy. Some fans aren\'t.' }], ['Keep going', { p: 0.5, ok: { rep: 5, say: 'My ratings went up.' }, no: { rep: -5, say: 'Advertisers pulled out.' } }]] }],
    stunt: [{ t: 'The director wants a stunt done without enough safety prep.', c: [['Refuse until it\'s safe', { rep: -1, karma: 2, say: 'We did it right the next day.' }], ['Do it anyway', { p: 0.6, pw: 1, ok: { rep: 5, say: 'It looked incredible on screen.' }, no: { health: -15, say: 'I got badly hurt.' } }]] },
      { t: 'An A-list star wants me as their permanent double.', c: [['Accept', { pay: 30000, rep: 3, say: 'I\'m their double on every film now.' }], ['Stay freelance', { say: 'I want to build my own name.' }]] }],
    rodeo: [{ t: 'I drew the meanest bull on the circuit.', c: [['Ride him', { p: 0.45, pw: 1, ok: { rep: 7, fame: 2, say: 'Eight seconds! The crowd went wild.' }, no: { health: -12, say: 'He threw me and stepped on me.' } }], ['Take a re-ride', { rep: -1, say: 'I took the re-ride on an easier bull.' }]] },
      { t: 'My ribs are cracked before a big rodeo.', c: [['Tape them and ride', { p: 0.5, ok: { rep: 4, say: 'I rode through the pain.' }, no: { health: -10, say: 'It got worse.' } }], ['Sit it out', { rep: -1, say: 'I healed up.' }]] }],
    jockey: [{ t: 'A trainer hints that I should hold my horse back.', c: [['Refuse and report it', { karma: 3, rep: 2, say: 'The stewards investigated. My name stayed clean.' }], ['Go along with it', { p: 0.7, ok: { pay: 10000, karma: -4, say: 'Nobody noticed. The envelope was thick.' }, no: { rep: -10, karma: -4, say: 'I was suspended for the season.' } }]] },
      { t: 'I\'m struggling to make weight.', c: [['Sweat it off in the sauna', { health: -6, rep: 1, say: 'I made weight, barely.' }], ['Skip the race', { rep: -2, say: 'Another jockey took the mount.' }]] }],
    skating: [{ t: 'I fell on my opening jump in front of the judges.', c: [['Fight back through the program', { p: 0.55, pw: 1, ok: { rep: 4, say: 'I skated the rest clean. The crowd stood up.' }, no: { rep: -3, say: 'It never recovered.' } }], ['Play it safe the rest of the way', { rep: -1, say: 'I stayed on my feet but lost points.' }]] },
      { t: 'My coach wants me to add a quad jump.', c: [['Learn it', { p: 0.45, pw: 1, ok: { skill: 5, rep: 4, say: 'I landed the quad!' }, no: { health: -8, say: 'I hurt my ankle trying.' } }], ['Focus on artistry', { skill: 2, say: 'My programs are beautiful.' }]] }],
    gymnast: [{ t: 'I\'m too scared to throw a new skill.', c: [['Work through it with a coach', { skill: 3, happy: -2, say: 'Slowly, the fear went away.' }], ['Talk to a sports psychologist', { cost: 2000, happy: 4, skill: 2, say: 'Talking it out helped a lot.' }]] },
      { t: 'I\'m pressured to compete through an injury.', c: [['Speak up', { karma: 2, health: 3, rep: -1, say: 'I put my health first.' }], ['Compete', { p: 0.5, ok: { rep: 4, say: 'I hit my routine.' }, no: { health: -12, say: 'It made the injury worse.' } }]] }],
    swimmer: [{ t: 'A new high-tech swimsuit is legal this year.', c: [['Buy one', { cost: 1000, skill: 2, say: 'I feel faster already.' }], ['Stick with my old suit', { say: 'It\'s about the swimmer, not the suit.' }]] },
      { t: 'A rival accuses me of doping after I break a record.', c: [['Demand an extra test', { p: 0.9, ok: { rep: 4, say: 'The test was clean. I was cleared.' }, no: { rep: -6, say: 'The rumors stuck anyway.' } }], ['Ignore it', { rep: -1, say: 'The rumors linger.' }]] }],
    sprinter: [{ t: 'I false-started in a big final.', c: [['Protest', { p: 0.3, ok: { rep: 2, say: 'The protest worked. I was reinstated.' }, no: { rep: -2, say: 'I was disqualified.' } }], ['Accept it', { karma: 1, rep: -1, say: 'There\'s always the next race.' }]] },
      { t: 'A shoe company wants to sign me.', c: [['Sign', { pay: 20000, rep: 2, say: 'I have my first shoe deal!' }], ['Wait for a bigger offer', { p: 0.5, ok: { pay: 40000, say: 'A bigger offer came.' }, no: { say: 'No bigger offer came.' } }]] }],
    climber: [{ t: 'A storm is rolling in near the summit.', c: [['Turn back', { rep: -1, karma: 1, say: 'The mountain will be there next year.' }], ['Push for the top', { p: 0.5, pw: 1, ok: { rep: 7, fame: 2, say: 'I summited just before the storm hit.' }, no: { health: -18, say: 'I got frostbite and barely made it down.' } }]] },
      { t: 'A climber I don\'t know is stranded on the ridge.', c: [['Help them down', { karma: 4, rep: 2, health: -4, say: 'We both made it down alive.' }], ['Keep climbing', { karma: -4, rep: 2, say: 'I summited. I can\'t stop thinking about them.' }]] }],
    gamedev: [{ t: 'My game is buggy and the release date is next week.', c: [['Delay it', { rep: 1, cost: 5000, say: 'The delay was worth it. It launched polished.' }], ['Ship it anyway', { p: 0.4, ok: { pay: 20000, say: 'Players didn\'t mind.' }, no: { rep: -6, say: 'Reviews tore it apart.' } }]] },
      { t: 'A big publisher wants to buy my game\'s rights.', c: [['Sell', { pay: 60000, rep: -1, say: 'A big check, but it\'s not my game anymore.' }], ['Stay independent', { rep: 2, say: 'I kept creative control.' }]] }]
  };
  function fill(t, x) { return String(t).replace(/\{rival\}/g, x.rival ? x.rival.name : 'My rival'); }
  function apply(x, c, e) {
    if (e.p != null) {
      var p = U.clamp(e.p + (e.pw ? (powerOf(c, x) - 60) / 100 : 0), 0.05, 0.95);
      if (e.cost) { var pre = E.$(e.cost); if (S().money < pre) return bad('I couldn\'t afford it.'); E.addMoney(-pre); }
      return apply(x, c, U.chance(p) ? e.ok : e.no);
    }
    var gain = 0;
    if (e.cost) { var cc = E.$(e.cost); if (S().money < cc) return bad('I couldn\'t afford it.'); E.addMoney(-cc); }
    if (e.rep) { x.rep = U.clamp(x.rep + e.rep, 0, 100); gain += e.rep; }
    if (e.skill) x.skill = U.clamp(x.skill + e.skill, 0, 100);
    if (e.happy) E.stat('happy', e.happy);
    if (e.health) E.stat('health', e.health);
    if (e.fame) E.fame(e.fame);
    if (e.karma) E.karma(e.karma);
    if (e.pay) { var pay = Math.round(E.$(e.pay) * (1 + x.rep / 25)); x.earn = (x.earn || 0) + pay; gain += 1; }
    if (e.rv && x.rival) x.rival.rep = U.clamp(x.rival.rep + e.rv, 0, 100);
    if (e.reset === 'burn') x.burn = 0;
    if (e.agent && !x.agent) x.agent = { kind: e.agent, name: AGENTS[e.agent].name, cut: AGENTS[e.agent].cut, since: yr() };
    var t = fill(e.say || 'OK.', x) + (e.pay ? ' (+' + E.fmt(Math.round(E.$(e.pay) * (1 + x.rep / 25))) + ')' : '');
    return gain > 0 ? good(t) : (e.rep < 0 || e.health < 0) ? bad(t) : t;
  }
  function pickEvent(x, id) {
    var pool = [];
    GEN.forEach(function (ev, i) { if (ev.cond(x)) pool.push('g' + i); });
    (EV[id] || []).forEach(function (ev, i) { pool.push('c' + i); pool.push('c' + i); }); // career events come up more often
    return pool.length ? U.pick(pool) : null;
  }
  TL.events.defs.sp_event = { id: 'sp_event', scripted: true, build: function (d) {
    var j = S().job, id = j && j.special, x = id && st(id), c = id && C[id];
    if (!x || x.retired) return null;
    var k = d && d.k && d.id === id ? d.k : pickEvent(x, id); if (!k) return null;
    var ev = k[0] === 'g' ? GEN[+k.slice(1)] : (EV[id] || [])[+k.slice(1)];
    if (!ev) return null;
    return { icon: c.icon, title: c.name, text: fill(ev.t, x), choices: ev.c.map(function (ch) { return { label: fill(ch[0], x), run: function () { return apply(x, c, ch[1]); } }; }) };
  } };

  // ------------------------------------------------------------ menus
  function menu(id) {
    if (id === 'wrestler' && TL.wrestling) return TL.wrestling.menu(); // pro wrestling has its own module (js/wrestling.js)
    if (id === 'racer' && TL.racing) return TL.racing.menu(); // so does racing (js/racing.js)
    if (id === 'gamedev' && TL.gamedev) return TL.gamedev.menu(); // and game development (js/gamedev.js)
    ui().menu(C[id].icon + ' ' + C[id].name, function () {
      var x = st(id), c = C[id], j = S().job, on = j && j.special === id, items = [];
      if (!x || !on) {
        if (x && x.youth && !x.retired) {
          items.push({ info: true, html: '<div class="kv"><b>Junior ' + U.esc(c.name.toLowerCase()) + '</b><br>Reputation ' + Math.round(x.rep) + ' · ' + c.skillName + ' ' + x.skill + '<br>' + (me().age < 14 ? 'I can turn pro at 14.' : 'I\'m old enough to turn pro.') + '</div>' });
          items.push({ icon: '💪', label: c.train[0], sub: c.skillName + ' ' + x.skill, onClick: function () { train(id); } });
          var jg = c.gigs().filter(function (g) { return g[0] === 0; })[0];
          if (jg) items.push({ icon: '📅', label: 'Junior: ' + jg[1].charAt(0).toLowerCase() + jg[1].slice(1), sub: 'Small stakes, real experience', disabled: count('spgig') >= 3, onClick: function () { gig(id, [0, jg[1], Math.round(jg[2] / 4), Math.max(2, jg[3] - 1), jg[4] - 5, 0, jg[6]]); } });
          if (me().age >= 14) items.push({ icon: c.icon, label: 'Turn pro', sub: 'Make it my job', onClick: function () { start(id); } });
          return items;
        }
        items.push({ info: true, html: '<p class="muted">' + summary(id) + '</p>' + giftLine(id) });
        // Say why it's closed up front instead of after a tap.
        var age = me().age, why = age < c.minAge ? 'Age ' + c.minAge + '+' : !x && c.maxStart && age > c.maxStart ? 'Too late: everyone starts by ' + c.maxStart : c.need ? c.need() : null;
        items.push({ icon: c.icon, label: x ? 'Make a comeback' : 'Start my career', sub: x ? summary(id) : why || 'Age ' + c.minAge + '+' + (c.maxStart ? ', start by ' + c.maxStart : ''), disabled: !!why && age >= c.minAge, onClick: function () { start(id); } });
        return items;
      }
      var r = rung(id, x.rep), nxt = c.ladder.filter(function (q) { return q[0] > x.rep; })[0];
      items.push({ info: true, html: '<div class="kv"><b>' + U.esc(title(j)) + '</b> · ' + U.esc(j.company) + '<br>Reputation ' + Math.round(x.rep) + (nxt ? ' (' + nxt[1] + ' at ' + nxt[0] + ')' : '') + ' · ' + c.skillName + ' ' + x.skill +
        (x.game ? '<br>Main game: ' + U.esc(x.game) : '') + (x.contract ? '<br>' + (id === 'model' ? '💎 Face of ' : '📝 ' + U.cap(x.contract.verb || 'deal') + ' with ') + U.esc(x.contract.brand) + ' · ' + U.plural(x.contract.years, 'year') + ' left' : '') +
        (x.rest ? '<br>' + (x.rest.noun ? '🏷️ ' : '🍽️ ') + U.esc(x.rest.name) + ' · quality ' + x.rest.q + (x.rest.stars ? ' · ' + '⭐'.repeat(x.rest.stars) : '') : '') +
        (x.subs ? '<br>📺 ' + x.subs.toLocaleString() + ' followers' : '') + (x.covers ? '<br>📰 ' + U.plural(x.covers, 'magazine cover') : '') + (x.titles ? '<br>🏆 ' + U.plural(x.titles, 'tournament win') : '') + (x.wins ? '<br>🏆 ' + U.plural(x.wins, 'title') : '') +
        (x.honors.length ? '<br>🏅 ' + U.esc(x.honors.slice(-3).join(' · ')) : '') +
        (x.agent ? '<br>🤝 Represented by ' + x.agent.name + ' (' + Math.round(x.agent.cut * 100) + '%)' : '') +
        (x.rival ? '<br>😤 Rival: ' + U.esc(x.rival.name) + ' · reputation ' + Math.round(x.rival.rep) + ' · ' + x.rival.w + '-' + x.rival.l : '') +
        ((x.burn || 0) >= 3 ? '<br>😮‍💨 Burning out' : '') + '</div>' + giftLine(id)});
      items.push({ section: 'Work' });
      items.push({ icon: '💪', label: c.train[0], sub: c.skillName + ' ' + x.skill, onClick: function () { train(id); } });
      c.gigs().forEach(function (g) {
        if (x.rep + 10 < g[0] || g[0] + 40 < x.rep) return; // nothing out of reach, nothing beneath me
        items.push({ icon: '📅', label: g[1], sub: (g[2] ? 'Pays about ' + E.fmt(E.$(g[2])) : 'Unpaid') + (g[5] ? ' · buy-in ' + E.fmt(E.$(g[5])) : '') + (g[6] ? ' · risky' : '') + (x.rep < g[0] ? ' · a long shot' : ''), disabled: count('spgig') >= 3, onClick: function () { gig(id, g); } });
      });
      var b = c.big;
      if (x.rep >= b[2] - 10) items.push({ icon: b[0], label: bigName(c), sub: x.rep < b[2] ? 'Needs reputation ' + b[2] : id === 'chef' ? 'About ' + E.fmt(E.$(250000)) : b[3] === 'venture' ? 'About ' + E.fmt(E.$(b[4].cost)) : b[3] === 'final' ? (b[4].olympic ? (olympic(b[4].olympic, yr()) ? 'This is an Olympic year!' : 'Next Olympics: ' + nextOlympics(b[4].olympic)) : 'Once a year') + (b[4].buyIn ? ' · buy-in ' + E.fmt(E.$(b[4].buyIn)) : '') : '', disabled: x.rep < b[2], onClick: function () { bigMove(id); } });
      if (id === 'gamer') {
        if (!x.team) items.push({ icon: '🤝', label: 'Try out for a team', sub: 'Reputation 30+', disabled: x.rep < 30, onClick: joinTeam });
        items.push({ icon: '📺', label: 'Stream', sub: yr() >= 2011 ? 'Twitch' : 'YouTube videos', onClick: stream });
      }
      if (x.rival) items.push({ icon: '⚔️', label: 'Go head to head with ' + x.rival.name, sub: 'Reputation ' + Math.round(x.rival.rep) + ' · ' + x.rival.w + '-' + x.rival.l + ' so far', disabled: count('spduel') > 0, onClick: duel });
      items.push({ icon: '🌴', label: 'Take the year off', sub: (x.burn || 0) >= 3 ? 'I really need it' : 'Recharge; costs some reputation and half my pay', disabled: count('spbreak') > 0 || count('spgig') > 0 || count('spbig') > 0, onClick: takeBreak });
      items.push({ section: 'Career' });
      if (!x.agent) {
        items.push({ icon: '🤝', label: 'Sign with a big agency', sub: '20% cut · much better gigs · reputation 45+', disabled: x.rep < 45, onClick: function () { hireAgent('big'); } });
        items.push({ icon: '🤝', label: 'Hire a boutique manager', sub: '10% cut · better gigs', onClick: function () { hireAgent('small'); } });
      } else items.push({ icon: '🤝', label: 'Part ways with ' + x.agent.name, sub: 'Keep 100% of my pay', onClick: fireAgent });
      items.push({ icon: '📜', label: 'Career history', sub: U.plural((x.hist || []).length, 'season') + ' · ' + U.plural(x.honors.length, 'honor'), onClick: function () { history(id); } });
      items.push({ icon: '🚪', label: 'Retire', danger: true, onClick: function () { ui().confirm('Retire?', 'Step away from your career as ' + c.name.toLowerCase() + '?', function () { retire(id); }); } });
      return items;
    });
  }
  function fameItems() {
    return Object.keys(C).map(function (id) {
      var c = C[id];
      return { icon: c.icon, label: c.name, sub: summary(id) + (giftKnown(id) ? ' · 🎁 suits my gift' : ''), disabled: me().age < c.minAge, onClick: function () { menu(id); } };
    });
  }
  function aboutRow() {
    var j = S().job; if (!j || !j.special || !st(j.special)) return null;
    return [C[j.special].icon, C[j.special].name, title(j) + ' · reputation ' + Math.round(st(j.special).rep)];
  }
  return { C: C, GIFT: GIFT, gift: gift, year: year, title: title, menu: menu, fameItems: fameItems, summary: summary, active: active, aboutRow: aboutRow, start: start, st: st };
})();
