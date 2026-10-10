/* TheLife — v1.35: world maps for every era, and wars for those who rule.
 * Each early era has a map of its known world, drawn as provinces joined by
 * land and sea routes; who holds each province follows real history for the
 * year (Rome takes Britannia in 43 and Dacia in 106, England loses Normandy
 * in 1204, Norsemen settle Iceland in 874...). Modern lives get a world map
 * of the countries in the game, with home, places lived and wars of the year.
 * Rulers (js/eras.js, TL.coup) can declare war on a neighbor, invade border
 * provinces (send a general, lead the army, or raise a huge host), take land
 * that pays tribute every year, make peace, and must hold their borders
 * against invasions and revolts. When you take the throne, history stops
 * moving the borders: from then on only wars do.
 * State: S.anc.map = { own: {province: faction}, wars: {faction: since}, won, lost, prev }. */
TL.maps = (function () {
  var U = TL.util, E = TL.engine, D = TL.data;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function count(k) { var y = S().yearActs || (S().yearActs = {}); return y[k] || 0; }
  function bump(k) { var y = S().yearActs || (S().yearActs = {}); y[k] = (y[k] || 0) + 1; }
  function y() { return S().year; }
  function st() { return TL.ancient.st(); }
  function era() { return E.ancient && E.ancient(); }
  function ruling() { return !!(era() && TL.ancient.on() && st().rule); }
  function see(title, icon) { var s = S(), h = s.era || (s.era = { seen: [], served: [] }); if (h.seen.length < 40) h.seen.push({ year: s.year, age: me().age, icon: icon, title: title }); }

  // ------------------------------------------------------------ the maps
  // Real coastlines come from js/mapdata.js (Natural Earth). Each province is a
  // territory: the land nearest to its anchor points (Voronoi cells) clipped to
  // the coast. provs: [id, name, lon, lat (label), tribute per year, defense 1-5].
  // seeds: more anchors per province, so territories follow the real shape.
  // wild: anchors for lands outside the game (left unclaimed on the map).
  // links: [a, b, sea?] which provinces border each other (for wars).
  // base(year) gives each province's historical owner.
  var MAPS = {
    rome: {
      title: 'The Roman world', label: 8, unit: 100, war: 30000, capital: 'italia', realmWord: 'empire',
      factions: { realm: ['The Roman Empire', '#AF52DE'], parthia: ['Parthia', '#FF9500'], germani: ['Germanic tribes', '#34C759'], caledonii: ['Caledonians', '#5856D6'], hiberni: ['Irish kings', '#2E9E6B'],
        britons: ['Britons', '#FF6482'], dacians: ['Dacians', '#A2845E'], goths: ['Goths', '#8E8E93'], sarmatians: ['Sarmatians', '#FFCC00'], armenia: ['Armenia', '#FF2D55'], nabataea: ['Nabataeans', '#C69C6D'],
        garamantes: ['Garamantes', '#B5A48A'], moors: ['Kingdom of Mauretania', '#E0B072'], gallic: ['Gallic Empire', '#FF3B30'], palmyra: ['Palmyra', '#E86A92'] },
      provs: [['caledonia', 'Caledonia', -4.3, 57.2, 200, 4], ['hibernia', 'Hibernia', -8, 53.2, 250, 3], ['britannia', 'Britannia', -1.6, 52.4, 900, 3], ['germania', 'Germania', 10.5, 51.6, 400, 5], ['gallia', 'Gallia', 2.4, 46.8, 2000, 3],
        ['hispania', 'Hispania', -4, 40, 1800, 3], ['mauretania', 'Mauretania', -4.5, 33.8, 600, 2], ['africa', 'Africa', 9.6, 34.6, 1800, 2], ['garamantes', 'Garamantes', 13.5, 26.6, 250, 3], ['italia', 'Italia', 12.8, 42.4, 3000, 5],
        ['pannonia', 'Pannonia', 17.6, 46.9, 700, 3], ['dacia', 'Dacia', 24.3, 46.3, 900, 4], ['sarmatia', 'Sarmatia', 33, 48.5, 300, 4], ['dalmatia', 'Dalmatia', 18.2, 43.9, 600, 2], ['macedonia', 'Macedonia', 21.8, 40.7, 700, 2],
        ['thracia', 'Thracia', 25.6, 42.6, 600, 3], ['achaea', 'Achaea', 22.3, 37.6, 1000, 2], ['asia', 'Asia', 28.8, 38.6, 2200, 2], ['galatia', 'Galatia', 34, 39.4, 800, 2], ['armenia', 'Armenia', 44, 40, 600, 3],
        ['syria', 'Syria', 37.6, 35.2, 1800, 3, [-5, 0]], ['judaea', 'Judaea', 35.1, 31.6, 700, 4, [-12, 0]], ['arabia', 'Arabia', 36.6, 29.4, 600, 3, [6, 4]], ['aegyptus', 'Aegyptus', 31.2, 27.8, 3000, 2], ['cyrenaica', 'Cyrenaica', 22, 31.4, 500, 2],
        ['mesopotamia', 'Mesopotamia', 43.4, 34.6, 1200, 4, [6, 3]], ['parthia', 'Persia', 50.4, 32.4, 2500, 5]],
      seeds: { caledonia: [[-3.6, 56.3], [-5, 58.2]], hibernia: [[-8.6, 52.3], [-7, 54.6]], britannia: [[0.3, 51.6], [-1.8, 54.2], [-3.7, 52.2], [-4.2, 50.6], [-2.8, 55]],
        germania: [[9.3, 55.8], [13.6, 52.9], [8, 52.9], [12, 50.1], [17.5, 52.7], [15.5, 50.5]], gallia: [[3, 49.8], [0, 47.8], [-2.8, 48.1], [0.4, 44.5], [4.4, 43.8], [7.5, 48.5], [5.5, 46]],
        hispania: [[-7.8, 42.5], [-8.2, 39.3], [-5.5, 37.6], [0.4, 41.5], [-1, 38.4], [-3.5, 42.6]], mauretania: [[-1, 35], [3, 36.2], [-7.5, 32], [6, 36.4]], africa: [[8, 36.5], [11, 33.3], [14.2, 32.2], [10.2, 36.7]],
        garamantes: [[10.5, 28.6]], cyrenaica: [[24, 31], [18.6, 30.6], [20.3, 32.2]], aegyptus: [[31, 30.4], [31.5, 26.4], [32.8, 24.4], [30.4, 29.2]], arabia: [[35.8, 30.4], [37.6, 28.4], [34, 29.7], [36.4, 31.9]],
        judaea: [[35.3, 32.6]], syria: [[36.3, 33.8], [36.6, 36.4], [38.9, 35.9], [35.9, 34.9]], mesopotamia: [[44.4, 33.2], [40.2, 36.8], [46.2, 31.4], [42.2, 36.4]], parthia: [[48.6, 35.6], [52.5, 29.6], [48.7, 31.3], [52, 36.3]],
        armenia: [[41.4, 39.9], [46, 39.4], [43.2, 41]], galatia: [[36.2, 40.4], [35.6, 38.4], [38.6, 38.6], [33.4, 37.2], [32.6, 41.3]], asia: [[29.8, 40.3], [27.4, 37.6], [30.4, 36.9]],
        thracia: [[24.6, 43.6], [27.7, 43.3], [26.4, 41.3], [21.5, 43.6]], macedonia: [[20.3, 39.8], [21.2, 41.6], [23.6, 40.8]], achaea: [[23.6, 38.4], [21.6, 38.8], [24.9, 35.2]],
        dalmatia: [[16, 44.8], [19.4, 42.6], [20.5, 44.2]], pannonia: [[16.5, 47.6], [19.5, 45.4], [14, 47.3], [11, 47.8]], dacia: [[25.6, 45.6], [22.5, 45.2], [24.6, 47.3], [27.3, 47.2]],
        sarmatia: [[30.5, 47], [27.5, 49.6], [37.5, 47.5], [33.8, 45.2], [40.6, 46.6], [36, 50.4]],
        italia: [[9.5, 45.4], [11.5, 44.3], [14.3, 41], [16.3, 40.5], [16.3, 38.8], [14, 37.5], [9, 40.1], [9.1, 42.1], [7.5, 45]] },
      wild: [[14, 58.6], [9, 58.8], [17.5, 57.8], [-6, 27.5], [2, 28.6], [8, 30.6], [20.5, 27], [26, 26.2], [32, 22.6], [40.2, 29.6], [43, 26], [47.5, 26.5], [45, 47.5], [48, 44], [44.6, 42.6], [53, 41.2],
        [21, 54.4], [26, 54], [35, 54], [-1, 31], [5, 32.5]],
      links: [['caledonia', 'britannia'], ['hibernia', 'britannia', 1], ['britannia', 'gallia', 1], ['gallia', 'germania'], ['gallia', 'hispania'], ['gallia', 'italia'], ['germania', 'pannonia'], ['germania', 'sarmatia'],
        ['italia', 'pannonia'], ['italia', 'dalmatia', 1], ['pannonia', 'dalmatia'], ['pannonia', 'dacia'], ['dalmatia', 'macedonia'], ['macedonia', 'thracia'], ['macedonia', 'achaea'], ['thracia', 'dacia'], ['dacia', 'sarmatia'],
        ['thracia', 'sarmatia'], ['thracia', 'asia', 1], ['achaea', 'asia', 1], ['asia', 'galatia'], ['galatia', 'armenia'], ['galatia', 'syria'], ['armenia', 'mesopotamia'], ['syria', 'mesopotamia'], ['syria', 'judaea'],
        ['judaea', 'arabia'], ['judaea', 'aegyptus'], ['aegyptus', 'cyrenaica'], ['cyrenaica', 'africa'], ['africa', 'mauretania'], ['mauretania', 'hispania', 1], ['africa', 'italia', 1], ['italia', 'achaea', 1],
        ['cyrenaica', 'garamantes'], ['africa', 'garamantes'], ['mesopotamia', 'parthia'], ['armenia', 'parthia'], ['hispania', 'italia', 1]],
      base: function (yr) {
        var o = {}; MAPS.rome.provs.forEach(function (p) { o[p[0]] = 'realm'; });
        o.caledonia = 'caledonii'; o.hibernia = 'hiberni'; o.germania = 'germani'; o.sarmatia = 'sarmatians'; o.garamantes = 'garamantes'; o.parthia = 'parthia';
        if (yr < 43) o.britannia = 'britons';
        if (yr < 44) o.mauretania = 'moors';
        if (!(yr >= 114 && yr <= 117)) o.armenia = 'armenia';
        if (!((yr >= 116 && yr <= 117) || yr >= 198)) o.mesopotamia = 'parthia';
        o.dacia = yr < 106 ? 'dacians' : yr <= 271 ? 'realm' : 'goths';
        if (yr < 106) o.arabia = 'nabataea';
        if (yr >= 260 && yr < 274) ['gallia', 'britannia', 'hispania'].forEach(function (p) { if (o[p] === 'realm') o[p] = 'gallic'; });
        if (yr >= 270 && yr < 273) ['syria', 'aegyptus', 'arabia', 'judaea'].forEach(function (p) { if (o[p] === 'realm') o[p] = 'palmyra'; });
        return o;
      },
      name: function (f, yr) { return f === 'parthia' && yr >= 224 ? 'Sasanian Persia' : null; },
      here: { Londinium: 'britannia', Lugdunum: 'gallia', Carthage: 'africa', Alexandria: 'aegyptus', Antioch: 'syria', Athens: 'achaea', Corinth: 'achaea', Ephesus: 'asia', Corsica: 'italia', Sardinia: 'italia', Pandateria: 'italia' }
    },
    medieval: {
      title: 'Medieval Western Europe', label: 8.6, unit: 50, war: 20000, capital: 'england', realmWord: 'kingdom',
      factions: { realm: ['The Kingdom of England', '#FF3B30'], france: ['France', '#3F6FD8'], scotland: ['Scotland', '#7E57C2'], welsh: ['Welsh princes', '#2E9E6B'], irish: ['Irish kings', '#7CB518'],
        brittany: ['Brittany', '#A2845E'], burgundy: ['Burgundy', '#AF52DE'], toulouse: ['Toulouse', '#FF9500'], castile: ['Castile', '#FFCC00'], aragon: ['Aragon', '#FF2D55'], spain: ['Spain', '#FFCC00'],
        portugal: ['Portugal', '#55A630'], moors: ['Granada', '#E0B072'], hre: ['Holy Roman Empire', '#8E8E93'] },
      provs: [['highlands', 'Highlands', -4.6, 57.4, 1500, 5], ['lowlands', 'Lowlands', -3.4, 55.7, 4000, 4], ['north', 'Northumbria', -1.8, 54.4, 8000, 4], ['england', 'England', -1, 52.1, 20000, 5], ['wales', 'Wales', -3.7, 52.3, 3000, 4],
        ['irelandE', 'Leinster', -6.6, 53.1, 3000, 3], ['irelandW', 'Connacht', -8.6, 53.6, 1500, 4], ['brittany', 'Brittany', -3.1, 48.1, 4000, 3], ['normandy', 'Normandy', 0, 49.1, 9000, 3, [-6, -2]], ['anjou', 'Anjou', -0.3, 47.5, 6000, 3],
        ['paris', 'Île-de-France', 2.6, 48.6, 15000, 5, [6, 3]], ['flanders', 'Flanders', 3.2, 50.8, 12000, 3], ['burgundy', 'Burgundy', 5, 47, 9000, 4], ['aquitaine', 'Aquitaine', 0.9, 45.8, 8000, 3], ['gascony', 'Gascony', -0.5, 44.2, 9000, 3],
        ['languedoc', 'Languedoc', 2.6, 43.8, 7000, 3], ['castile', 'Castile', -4.2, 40.6, 10000, 4], ['aragon', 'Aragon', -0.6, 41.3, 8000, 4], ['portugal', 'Portugal', -8, 39.8, 5000, 3], ['granada', 'Granada', -3.7, 37.2, 7000, 5], ['hre', 'Germany', 9.8, 50.6, 15000, 5]],
      seeds: { highlands: [[-4, 58.3], [-5.3, 56.6]], lowlands: [[-2.6, 56.4], [-4.5, 55.2]], north: [[-2.8, 54.6], [-1.2, 53.7]], england: [[0.9, 52.4], [-3.4, 50.7], [-2.2, 51.4], [-1.6, 53], [0.6, 51.2]],
        wales: [[-3.7, 51.7], [-3.8, 53]], irelandE: [[-6.8, 52.5]], irelandW: [[-8.7, 52.2], [-7.3, 54.6]], brittany: [[-4, 48.3]], normandy: [[-1.2, 49], [1, 49.6]], anjou: [[0.4, 48.2]],
        paris: [[2.3, 47.3], [4.2, 48.6], [2.8, 49.6]], flanders: [[2.4, 50.4]], burgundy: [[5.9, 46.9], [4.6, 46.3]], aquitaine: [[0.4, 46.4], [1, 45.2], [2.6, 45.4]], gascony: [[-0.6, 44.8], [-0.4, 43.6]],
        languedoc: [[1.8, 43.6], [3.6, 43.7], [3, 44.6]], castile: [[-4.7, 41.8], [-6.5, 42.6], [-8, 42.8], [-3, 39.2], [-6, 37.5], [-4.2, 43.1]], aragon: [[1.8, 41.8], [-0.5, 39.5], [-1.6, 42.7]],
        portugal: [[-8.3, 41.2], [-8, 37.6]], granada: [[-4.6, 36.8]],
        hre: [[10.5, 52.6], [8.5, 49.3], [11.5, 48.6], [13.5, 50.7], [8, 47.1], [5.5, 51.8], [6, 43.9], [9.5, 45.6], [7.3, 45.2], [14.5, 47.5], [15.5, 49.5], [12.5, 46.5]] },
      wild: [[12.5, 42.5], [15, 40.8], [16.3, 38.9], [14, 37.6], [9, 40], [9.1, 42.2], [11.2, 43.6], [-5.5, 34.5], [-1, 35.2], [3, 36.4], [9.5, 36.2], [9.3, 56], [11.8, 55.5], [10, 58.8], [13.5, 56.5], [16.5, 52.5], [16, 54.5]],
      links: [['highlands', 'lowlands'], ['lowlands', 'north'], ['north', 'england'], ['england', 'wales'], ['north', 'wales'], ['irelandE', 'irelandW'], ['irelandE', 'wales', 1], ['england', 'normandy', 1], ['england', 'flanders', 1],
        ['england', 'gascony', 1], ['normandy', 'brittany'], ['normandy', 'paris'], ['normandy', 'anjou'], ['brittany', 'anjou'], ['anjou', 'paris'], ['anjou', 'aquitaine'], ['paris', 'flanders'], ['paris', 'burgundy'], ['paris', 'aquitaine'],
        ['flanders', 'hre'], ['burgundy', 'hre'], ['burgundy', 'languedoc'], ['aquitaine', 'gascony'], ['aquitaine', 'languedoc'], ['gascony', 'languedoc'], ['gascony', 'castile'], ['languedoc', 'aragon'], ['castile', 'aragon'],
        ['castile', 'portugal'], ['castile', 'granada'], ['lowlands', 'irelandE', 1]],
      base: function (yr) {
        var o = { england: 'realm', north: 'realm', highlands: 'scotland', lowlands: 'scotland', irelandW: 'irish', hre: 'hre', portugal: 'portugal' };
        o.wales = yr < 1283 ? 'welsh' : 'realm';
        o.irelandE = yr < 1171 ? 'irish' : 'realm';
        o.normandy = yr < 1204 || (yr >= 1417 && yr < 1450) ? 'realm' : 'france';
        o.anjou = yr < 1204 ? 'realm' : 'france';
        o.brittany = yr < 1532 ? 'brittany' : 'france';
        o.paris = yr >= 1420 && yr < 1436 ? 'realm' : 'france';
        o.aquitaine = (yr >= 1154 && yr < 1224) || (yr >= 1360 && yr < 1372) ? 'realm' : 'france';
        o.gascony = yr >= 1154 && yr < 1453 ? 'realm' : 'france';
        o.flanders = yr < 1384 ? 'france' : yr < 1482 ? 'burgundy' : 'hre';
        o.burgundy = yr >= 1363 && yr < 1477 ? 'burgundy' : 'france';
        o.languedoc = yr < 1271 ? 'toulouse' : 'france';
        o.castile = yr < 1479 ? 'castile' : 'spain';
        o.aragon = yr < 1479 ? 'aragon' : 'spain';
        o.granada = yr < 1492 ? 'moors' : 'spain';
        return o;
      },
      here: { York: 'north', Durham: 'north' }
    },
    viking: {
      title: 'The Viking world', label: 7.6, unit: 50, war: 8000, capital: 'vestfold', realmWord: 'kingdom', inset: 'greenland',
      factions: { realm: ['The Kingdom of Norway', '#E4572E'], petty: ['Petty kings of Norway', '#9A8C98'], denmark: ['Denmark', '#7B2CBF'], svear: ['The Svear', '#FFC300'], icelanders: ['Icelanders', '#52B788'],
        greenlanders: ['Greenlanders', '#95D5B2'], empty: ['Unsettled', '#C7C7CC'], orkney: ['Earls of Orkney', '#C77DFF'], alba: ['Scots and Picts', '#B07D62'], irish: ['Irish kings', '#2D6A4F'], dublin: ['Norse Dublin', '#F8961E'],
        english: ['The English', '#90BE6D'], jorvik: ['Norse Jorvik', '#F3722C'], franks: ['The Franks', '#A2845E'], normans: ['The Normans', '#D4A373'], germans: ['The Germans', '#6C757D'], slavs: ['Slavs', '#B08968'], rus: ['The Rus', '#E9C46A'] },
      provs: [['greenland', 'Greenland', -45.5, 61.6, 100, 1], ['iceland', 'Iceland', -18.6, 64.9, 300, 2], ['orkney', 'Orkney', -2.6, 59.4, 300, 2], ['hebrides', 'The Isles', -7, 57.6, 250, 2, [-8, -3]], ['alba', 'Alba', -4.1, 56.9, 500, 4, [4, 3]],
        ['dublin', 'Dublin', -6.4, 53.2, 700, 3, [0, 8]], ['ireland', 'Ireland', -8.4, 53, 500, 3, [-8, -6]], ['northumbria', 'Northumbria', -1.8, 54.4, 900, 3], ['danelaw', 'Danelaw', -0.4, 52.8, 1200, 3], ['wessex', 'Wessex', -2.2, 51.2, 1500, 4],
        ['normandy', 'Normandy', 0, 49, 1000, 3, [-8, 0]], ['frankia', 'Frankia', 3.2, 48.6, 2500, 5, [10, -6]], ['frisia', 'Frisia', 5.8, 52.6, 700, 2], ['saxony', 'Saxony', 10.4, 51.8, 1200, 4], ['jutland', 'Jutland', 9.2, 56.1, 900, 4, [-8, 0]],
        ['scania', 'Scania', 13.2, 55.8, 800, 4, [6, 3]], ['gotaland', 'Götaland', 14.3, 57.8, 600, 3], ['svealand', 'Svealand', 16.4, 60.2, 900, 4, [8, -4]], ['vestfold', 'Vestfold', 10.3, 60, 800, 3, [2, 6]], ['vestlandet', 'Vestlandet', 6.6, 60.8, 700, 3, [-14, -4]],
        ['trondelag', 'Trøndelag', 11.2, 63.6, 700, 4], ['halogaland', 'Hålogaland', 15.6, 67.6, 400, 3], ['novgorod', 'Novgorod', 32, 58.6, 800, 3], ['kiev', 'Kiev', 30.8, 50.4, 1200, 4]],
      seeds: { iceland: [[-16, 65.4], [-21.5, 64]], orkney: [[-1.3, 60.3], [-3.4, 58.5]], hebrides: [[-6.3, 56.5], [-4.5, 54.2]], alba: [[-3.2, 57.4], [-3.9, 56], [-5, 57.8]], dublin: [[-6.5, 52.6]],
        ireland: [[-8.7, 52.2], [-7.3, 54.6]], northumbria: [[-2.6, 54.7], [-1.2, 53.8], [-2.7, 55.4]], danelaw: [[0.9, 52.5], [-1.2, 52.3], [0, 53.5]], wessex: [[-3.4, 50.7], [0.4, 51.2], [-2.4, 52.3]],
        normandy: [[-1.2, 49.1]], frankia: [[4.5, 49.3], [1, 47.9], [2.4, 48.9]], frisia: [[4.5, 51.8], [7.2, 53.3]], saxony: [[9, 53.5], [11.8, 51.3], [8.5, 50.7], [11.5, 48.6], [9, 48.5]],
        jutland: [[9.3, 55.1], [9.8, 57.2]], scania: [[13.6, 55.8], [10.4, 55.3], [12, 55.5]], gotaland: [[15.6, 57.4], [12.3, 58.3], [15.6, 58.4]], svealand: [[17.3, 59.7], [15, 60.3], [14.5, 61.4]],
        vestfold: [[10.6, 60.6], [11.3, 59.2], [8, 58.4], [10.2, 59.4], [9, 60.6]], vestlandet: [[5.8, 59], [6.6, 61.4], [7.4, 62.6], [6, 60.4]], trondelag: [[12.5, 64.5], [9, 62.8], [11.5, 62.5], [10.6, 63.4]],
        halogaland: [[13.2, 65.8], [16.8, 68.6], [19, 69.6], [14.8, 67.3]], novgorod: [[32.5, 60], [28.5, 57.6], [35, 57.5]], kiev: [[32.5, 51.5], [28.5, 50], [35, 50]] },
      wild: [[-3.7, 52.3], [-3, 48.1], [25, 61.5], [27, 63.5], [25.5, 66], [17.5, 63.5], [20.5, 65.8], [25, 69.5], [21, 67.5], [25.5, 58.6], [24.5, 57], [23.5, 55.3], [21, 55], [14.5, 53.3], [18, 52.5], [21, 52], [17, 50.5],
        [14.5, 50], [40, 56.5], [38.5, 53], [41, 60.5], [38, 63], [34, 64.5], [33, 63], [35, 67.5], [37, 48.5], [-24, 66.5]],
      links: [['greenland', 'iceland', 1], ['iceland', 'orkney', 1], ['iceland', 'vestlandet', 1], ['orkney', 'vestlandet', 1], ['orkney', 'hebrides'], ['orkney', 'alba'], ['hebrides', 'dublin', 1], ['hebrides', 'alba'],
        ['dublin', 'ireland'], ['dublin', 'northumbria', 1], ['alba', 'northumbria'], ['northumbria', 'danelaw'], ['danelaw', 'wessex'], ['wessex', 'normandy', 1], ['danelaw', 'frisia', 1], ['frisia', 'jutland'], ['frisia', 'saxony'],
        ['frisia', 'frankia'], ['normandy', 'frankia'], ['saxony', 'jutland'], ['saxony', 'frankia'], ['jutland', 'scania', 1], ['jutland', 'vestfold', 1], ['vestfold', 'vestlandet'], ['vestlandet', 'trondelag'], ['trondelag', 'halogaland'],
        ['vestfold', 'gotaland'], ['gotaland', 'scania'], ['gotaland', 'svealand'], ['svealand', 'trondelag'], ['svealand', 'novgorod', 1], ['novgorod', 'kiev'], ['kiev', 'saxony']],
      base: function (yr) {
        var o = { jutland: 'denmark', scania: 'denmark', gotaland: 'svear', svealand: 'svear', alba: 'alba', ireland: 'irish', frankia: 'franks' };
        var nor = yr < 872 ? 'petty' : yr >= 1028 && yr < 1035 ? 'denmark' : 'realm';
        ['vestfold', 'vestlandet', 'trondelag', 'halogaland'].forEach(function (p) { o[p] = nor; });
        o.iceland = yr < 874 ? 'empty' : yr < 1262 ? 'icelanders' : 'realm';
        o.greenland = yr < 985 ? 'empty' : yr < 1261 ? 'greenlanders' : 'realm';
        o.orkney = yr < 875 ? 'alba' : 'orkney';
        o.hebrides = yr < 850 ? 'alba' : 'orkney';
        o.dublin = yr < 841 ? 'irish' : yr < 1171 ? 'dublin' : 'normans';
        var cnut = yr >= 1016 && yr < 1042, norman = yr >= 1066;
        o.northumbria = norman ? 'normans' : cnut ? 'denmark' : yr >= 866 && yr < 954 ? 'jorvik' : 'english';
        o.danelaw = norman ? 'normans' : cnut || (yr >= 878 && yr < 918) ? 'denmark' : 'english';
        o.wessex = norman ? 'normans' : cnut ? 'denmark' : 'english';
        o.normandy = yr < 911 ? 'franks' : 'normans';
        o.frisia = yr < 919 ? 'franks' : 'germans';
        o.saxony = yr < 919 ? 'franks' : 'germans';
        o.novgorod = yr < 862 ? 'slavs' : 'rus';
        o.kiev = yr < 882 ? 'slavs' : 'rus';
        return o;
      },
      // A crowned ruler of Norway holds all of Norway, whatever history said.
      crown: ['vestfold', 'vestlandet', 'trondelag', 'halogaland'],
      here: { 'Vestfold': 'vestfold', 'Oppland': 'vestfold', 'Kaupang': 'vestfold', 'Trøndelag': 'trondelag', 'Hålogaland': 'halogaland', 'Lofoten': 'halogaland', 'Rogaland': 'vestlandet', 'Hordaland': 'vestlandet',
        'Sogn': 'vestlandet', 'Agder': 'vestfold', 'Møre': 'vestlandet', 'Hedeby': 'jutland', 'Ribe': 'jutland', 'Birka': 'svealand', 'Dublin': 'dublin', 'Jorvik': 'northumbria', 'Iceland': 'iceland', 'Greenland': 'greenland', 'Orkney': 'orkney' }
    }
  };

  function def() { return MAPS[era()] || null; }
  function P(d, id) { return d.provs.filter(function (p) { return p[0] === id; })[0]; }
  function coins(d, x) { return E.$(x * d.unit); }
  function state() { var a = st(); return a.map || (a.map = { own: {}, wars: {}, won: 0, lost: 0, prev: {} }); }
  function owners(d) { var b = d.base(y()), m = era() && TL.ancient.on() ? state().own : {}, o = {}; d.provs.forEach(function (p) { o[p[0]] = m[p[0]] || b[p[0]]; }); return o; }
  function fname(d, f) { if (f === 'realm' && ruling()) return 'My ' + d.realmWord; return (d.name && d.name(f, y())) || d.factions[f][0]; }
  function adj(d, id) { var out = []; d.links.forEach(function (l) { if (l[0] === id) out.push(l[1]); else if (l[1] === id) out.push(l[0]); }); return out; }
  function here(d) { var c = S().city; if (d.here && d.here[c]) return d.here[c]; var hit = d.provs.filter(function (p) { return p[1] === c; })[0]; return hit ? hit[0] : d.capital; }

  // When a ruler is crowned, the map stops following history: only wars move borders now.
  function freeze() {
    var d = def(); if (!d) return;
    var m = state();
    if (m.frozen) return;
    var o = owners(d);
    if (d.crown) d.crown.forEach(function (p) { o[p] = 'realm'; });
    o[d.capital] = 'realm';
    m.own = o; m.frozen = true; m.start = JSON.parse(JSON.stringify(o));
  }

  // ------------------------------------------------------------ geometry
  function geo(id) { return TL.mapdata && TL.mapdata[id]; }
  function proj(g, lon, lat) { return [(lon - g.lon0) * g.kx, (g.lat1 - lat) * g.ky]; }
  function r1(v) { return Math.round(v * 10) / 10; }
  // Clip a convex polygon (as edges [a, b, neighbor]) to the half-plane f(p) <= 0;
  // the new edge along the cut is labeled with the neighbor j that made it.
  function clipEdges(edges, f, j) {
    var out = [], exitPt = null, entryPt = null, exitAt = -1;
    edges.forEach(function (ed) {
      var a = ed[0], b = ed[1], fa = f(a), fb = f(b);
      if (fa <= 0 && fb <= 0) out.push(ed);
      else if (fa <= 0) { var t = fa / (fa - fb), I = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; out.push([a, I, ed[2]]); exitPt = I; exitAt = out.length; }
      else if (fb <= 0) { var t2 = fa / (fa - fb), J = [a[0] + (b[0] - a[0]) * t2, a[1] + (b[1] - a[1]) * t2]; out.push([J, b, ed[2]]); entryPt = J; }
    });
    if (exitPt && entryPt) out.splice(exitAt, 0, [exitPt, entryPt, j]);
    return out;
  }
  // Voronoi cells of the anchor points, each cell knowing its neighbors (cached per map).
  var cellCache = {};
  function cells(id, d) {
    if (cellCache[id]) return cellCache[id];
    var g = geo(id), W = g.w, H = g.h, pts = [];
    d.provs.forEach(function (p) {
      if (p[0] === d.inset) return;
      [[p[2], p[3]]].concat((d.seeds && d.seeds[p[0]]) || []).forEach(function (q) { var xy = proj(g, q[0], q[1]); pts.push({ x: xy[0], y: xy[1], p: p[0] }); });
    });
    (d.wild || []).forEach(function (q) { var xy = proj(g, q[0], q[1]); pts.push({ x: xy[0], y: xy[1], p: null }); });
    var out = pts.map(function (si, i) {
      var e = [[[-40, -40], [W + 40, -40], -1], [[W + 40, -40], [W + 40, H + 40], -1], [[W + 40, H + 40], [-40, H + 40], -1], [[-40, H + 40], [-40, -40], -1]];
      for (var j = 0; j < pts.length && e.length; j++) {
        if (j === i) continue;
        var sj = pts[j], nx = sj.x - si.x, ny = sj.y - si.y, mx = (si.x + sj.x) / 2, my = (si.y + sj.y) / 2;
        e = clipEdges(e, function (q) { return (q[0] - mx) * nx + (q[1] - my) * ny; }, j);
      }
      return { p: si.p, edges: e };
    });
    cellCache[id] = out;
    return out;
  }
  function polyPath(edges) { return edges.length ? 'M' + edges.map(function (e) { return r1(e[0][0]) + ' ' + r1(e[0][1]); }).join('L') + 'Z' : ''; }

  // ------------------------------------------------------------ drawing
  function esc(t) { return U.esc(String(t)); }
  function color(d, f) { return (d.factions[f] || ['', '#8E8E93'])[1]; }
  function svg(id, d, o, opts) {
    var g = geo(id), cs = cells(id, d), clip = 'tlmap-' + id, mine = opts.mine;
    var h = ['<svg class="map real" viewBox="0 0 ' + g.w + ' ' + g.h + '" role="img" aria-label="' + esc(d.title) + '" onclick="TL.maps.tap(event)">',
      '<defs><clipPath id="' + clip + '"><path d="' + g.land + '"/></clipPath></defs>',
      '<rect class="map-sea" width="' + g.w + '" height="' + g.h + '" rx="10"/>', '<path class="map-land" d="' + g.land + '"/>', '<g clip-path="url(#' + clip + ')">'];
    // Territories, one path per province.
    var byProv = {};
    cs.forEach(function (c) { if (c.p) (byProv[c.p] = byProv[c.p] || []).push(polyPath(c.edges)); });
    Object.keys(byProv).forEach(function (p) {
      var f = o[p];
      h.push('<path class="map-cell' + (f === 'realm' && mine ? ' mine' : '') + (opts.wars && opts.wars[f] ? ' war' : '') + '" data-p="' + p + '" fill="' + color(d, f) + '" d="' + byProv[p].join('') + '"/>');
    });
    // Borders: between provinces of one owner (thin), between owners (bold), around my realm (gold).
    var thin = [], bold = [], gold = [];
    cs.forEach(function (c, i) {
      c.edges.forEach(function (e) {
        var j = e[2]; if (j < 0 || j < i) return;
        var other = cs[j]; if (c.p === other.p) return;
        var seg = 'M' + r1(e[0][0]) + ' ' + r1(e[0][1]) + 'L' + r1(e[1][0]) + ' ' + r1(e[1][1]);
        var fa = c.p ? o[c.p] : null, fb = other.p ? o[other.p] : null;
        if (fa === fb) thin.push(seg); else bold.push(seg);
        if (mine && (fa === 'realm') !== (fb === 'realm')) gold.push(seg);
      });
    });
    h.push('<path class="map-pb" d="' + thin.join('') + '"/><path class="map-ob" d="' + bold.join('') + '"/>');
    if (gold.length) h.push('<path class="map-rb" d="' + gold.join('') + '"/>');
    h.push('</g><path class="map-coast" d="' + g.land + '"/>');
    // Greenland and other far-off lands in an inset.
    if (d.inset && g.inset) {
      var gi = g.inset, f = o[d.inset], ip = P(d, d.inset);
      h.push('<g class="map-inset" transform="translate(' + gi.x + ' ' + gi.y + ')"><rect class="map-sea" width="' + gi.w + '" height="' + gi.h + '"/>',
        '<path class="map-land" d="' + gi.land + '"/><path class="map-cell' + (f === 'realm' && mine ? ' mine' : '') + (opts.wars && opts.wars[f] ? ' war' : '') + '" data-p="' + d.inset + '" fill="' + color(d, f) + '" d="' + gi.land + '"/>',
        '<path class="map-coast" d="' + gi.land + '"/><rect class="map-frame" width="' + gi.w + '" height="' + gi.h + '"/></g>');
    }
    // Markers and labels.
    d.provs.forEach(function (p) {
      var xy = p[0] === d.inset && g.inset ? proj(g.inset, p[2], p[3]) : proj(g, p[2], p[3]), off = p[6] || [0, 0], x = r1(xy[0] + off[0]), yy = r1(xy[1] + off[1]), f = o[p[0]];
      if (p[0] === opts.here) h.push('<circle class="map-here" cx="' + x + '" cy="' + r1(yy - 7.5) + '" r="2.8"/>');
      else if (mine && p[0] === d.capital) h.push('<text class="map-mark" x="' + x + '" y="' + r1(yy - 5) + '" text-anchor="middle">👑</text>');
      if (opts.wars && opts.wars[f] && p[0] !== opts.here) h.push('<text class="map-mark" x="' + x + '" y="' + r1(yy - 5) + '" text-anchor="middle">⚔️</text>');
      h.push('<text class="map-lbl" x="' + x + '" y="' + r1(yy + 3) + '" text-anchor="middle" data-p="' + p[0] + '"' + (d.label ? ' style="font-size:' + d.label + 'px"' : '') + '>' + esc(p[1]) + '</text>');
    });
    h.push('</svg>');
    return h.join('');
  }
  function legend(d, o) {
    var n = {}; Object.keys(o).forEach(function (k) { n[o[k]] = (n[o[k]] || 0) + 1; });
    var keys = Object.keys(n).sort(function (a, b) { return (b === 'realm') - (a === 'realm') || n[b] - n[a]; });
    return '<div class="map-legend">' + keys.map(function (f) { return '<span><i style="background:' + d.factions[f][1] + '"></i>' + esc(fname(d, f)) + ' · ' + n[f] + '</span>'; }).join('') + '<span><i class="you"></i>I am here</span><span class="hint">Tap a province</span></div>';
  }
  function worldSvg(opts) {
    var g = geo('world'), h = ['<svg class="map real" viewBox="0 0 ' + g.w + ' ' + g.h + '" role="img" aria-label="World map" onclick="TL.maps.tap(event)">', '<rect class="map-sea" width="' + g.w + '" height="' + g.h + '" rx="8"/>',
      '<path class="map-land map-countries" d="' + g.land + '"/>'];
    D.COUNTRIES.forEach(function (c) {
      var k = g.countries[c.name]; if (!k) return;
      var cls = c.name === opts.home ? ' home' : opts.lived.indexOf(c.name) >= 0 ? ' lived' : opts.war.indexOf(c.name) >= 0 ? ' war' : '';
      h.push('<path class="map-country' + cls + '" data-c="' + esc(c.name) + '" d="' + k.d + '"/>');
    });
    D.COUNTRIES.forEach(function (c) {
      var k = g.countries[c.name]; if (!k) return;
      // A ring behind the flag, so home and past homes show even when the country is tiny (the UK, Jamaica).
      var ring = c.name === opts.home ? 'home' : opts.lived.indexOf(c.name) >= 0 ? 'lived' : '';
      if (ring) h.push('<circle class="map-ring ' + ring + '" cx="' + k.at[0] + '" cy="' + r1(k.at[1] + 0.6) + '" r="6.2" data-c="' + esc(c.name) + '"/>');
      h.push('<text class="map-emoji" x="' + k.at[0] + '" y="' + r1(k.at[1] + 3) + '" text-anchor="middle" data-c="' + esc(c.name) + '">' + c.flag + '</text>');
    });
    h.push('</svg>');
    return h.join('');
  }
  // Tapping the map: a province (early eras) or a country (the modern world).
  function tap(ev) {
    var t = ev && ev.target, p = t && t.getAttribute && t.getAttribute('data-p'), c = t && t.getAttribute && t.getAttribute('data-c');
    if (p) return province(p);
    if (c) return country(c);
  }
  function province(id) {
    var d = def(); if (!d) return;
    var p = P(d, id); if (!p) return;
    ui().menu(p[1], function () {
      var o = owners(d), f = o[id], m = state(), r = ruling() && st().rule, items = [];
      var stars = '★★★★★'.slice(0, p[5]) + '☆☆☆☆☆'.slice(0, 5 - p[5]);
      items.push({ info: true, html: '<div class="kv"><b><i class="map-dot" style="background:' + color(d, f) + '"></i> ' + esc(fname(d, f)) + '</b><br><span class="muted">Defense ' + stars + ' · worth ' + E.fmt(coins(d, p[4])) + ' a year' + (id === here(d) ? ' · I live here' : '') + (r && m.wars[f] ? ' · at war with me' : '') + (r && m.prev[id] && f === 'realm' ? ' · conquered from ' + esc(fname(d, m.prev[id])) : '') + '</span></div>' });
      var nb = adj(d, id).map(function (q) { return P(d, q)[1] + ' (' + fname(d, o[q]) + ')'; });
      if (nb.length) items.push({ info: true, html: '<p class="muted">Borders ' + esc(nb.join(', ')) + '.</p>' });
      if (r && f !== 'realm') {
        var border = adj(d, id).some(function (q) { return o[q] === 'realm'; });
        items.push({ icon: f === 'empty' ? '🏕️' : '🗡️', label: (f === 'empty' ? 'Settle ' : 'Invade ') + p[1], sub: border ? (count('map_campaign') ? 'My armies have already marched this year' : 'Send an army across the border') : 'It doesn\'t border my ' + d.realmWord, disabled: !border || count('map_campaign') > 0, onClick: function () { campaign(d, p, f); } });
      } else if (!r) items.push({ info: true, html: '<p class="muted">Take the throne to make war and move borders yourself.</p>' });
      return items;
    });
  }
  function country(name) {
    var c = D.country(name), s = S(), lived = (s.lived || []).indexOf(name) >= 0;
    ui().choose(c.flag + ' ' + c.name, (name === s.country ? 'I live here. ' : lived ? 'I used to live here. ' : '') + 'Life expectancy ' + c.life + ' · income tax ' + Math.round(c.tax * 100) + '% · money: ' + c.cur + '.', [{ label: 'Close', fn: function () { } }]);
  }

  // ------------------------------------------------------------ the menu
  function menu() {
    if (!era()) return worldMenu();
    var d = def(), id = era(); if (!d || !geo(id)) return;
    ui().menu(ruling() ? 'The map and my wars' : d.title, function () {
      var o = owners(d), m = state(), r = ruling() && st().rule, items = [], hp = here(d);
      endWars(d, o);
      items.push({ info: true, html: '<div class="map-box">' + svg(id, d, o, { here: hp, mine: !!r, wars: r ? m.wars : null }) + legend(d, o) + '</div>' });
      var mineCount = Object.keys(o).filter(function (k) { return o[k] === 'realm'; }).length;
      if (!r) {
        items.push({ info: true, html: '<p>I live in ' + esc(P(d, hp)[1]) + ', held by ' + esc(fname(d, o[hp])) + '. ' + (o[hp] === 'realm' || mineCount ? esc(fname(d, 'realm')) + ' holds ' + U.plural(mineCount, 'province') + '.' : '') + '</p><p class="muted" style="margin-top:6px">Borders move with history. Take the throne to make war and move them yourself.</p>' });
        return items;
      }
      var t = tribute();
      items.push({ info: true, html: '<p><b>My ' + esc(d.realmWord) + ': ' + U.plural(mineCount, 'province') + '</b>' + (m.won ? ' · ' + U.plural(m.won, 'conquest') : '') + '</p><p class="muted" style="margin-top:4px">' + (t ? (t > 0 ? 'Conquered land pays ' + E.fmt(t) + ' a year in tribute.' : 'Lost land costs me ' + E.fmt(-t) + ' a year.') : 'Conquered provinces pay tribute every year.') + ' One campaign a year. Each war makes the people a little more tired of war.</p>' });
      // Wars I'm fighting.
      var wars = Object.keys(m.wars);
      if (wars.length) {
        items.push({ section: 'At war' });
        wars.forEach(function (f) {
          items.push({ icon: '⚔️', label: 'War with ' + fname(d, f), sub: 'Since ' + E.yearLabel(m.wars[f]) + ' · they hold ' + U.plural(Object.keys(o).filter(function (k) { return o[k] === f; }).length, 'province'), onClick: function () {
            ui().choose('Make peace with ' + fname(d, f) + '?', 'A treaty ends the war. The people will be glad; the warriors less so.', [
              { label: 'Make peace', fn: function () { delete m.wars[f]; r.pop = U.clamp(r.pop + 6, 0, 100); r.guard = U.clamp(r.guard - 3, 0, 100); E.log('🕊️ I made peace with ' + fname(d, f) + '.'); done('We swore peace with ' + fname(d, f) + '. The war is over.'); } },
              { label: 'Keep fighting', fn: function () { done('The war goes on.'); } }
            ]);
          } });
        });
      }
      // Land I could take: enemy provinces on my borders.
      var targets = d.provs.filter(function (p) { return o[p[0]] !== 'realm' && adj(d, p[0]).some(function (q) { return o[q] === 'realm'; }); });
      items.push({ section: 'Borders' });
      if (!targets.length) items.push({ info: true, html: '<p class="muted">No enemies border my ' + esc(d.realmWord) + '.</p>' });
      targets.forEach(function (p) {
        var f = o[p[0]], atWar = !!m.wars[f], stars = '★★★★★'.slice(0, p[5]) + '☆☆☆☆☆'.slice(0, 5 - p[5]);
        items.push({ icon: f === 'empty' ? '🏕️' : '🗡️', label: (f === 'empty' ? 'Settle ' : 'Invade ') + p[1], sub: fname(d, f) + ' · defense ' + stars + ' · tribute ' + E.fmt(coins(d, p[4])) + '/yr' + (atWar ? ' · at war' : ''), disabled: count('map_campaign') > 0, onClick: function () { campaign(d, p, f); } });
      });
      if (count('map_campaign')) items.push({ info: true, html: '<p class="muted">My armies have already marched this year.</p>' });
      // Land I hold.
      items.push({ section: 'My provinces' });
      d.provs.filter(function (p) { return o[p[0]] === 'realm'; }).forEach(function (p) {
        items.push({ icon: p[0] === d.capital ? '👑' : m.prev[p[0]] ? '🚩' : '🏰', label: p[1], sub: p[0] === d.capital ? 'My capital' : m.prev[p[0]] ? 'Conquered from ' + fname(d, m.prev[p[0]]) : 'Part of the ' + d.realmWord, right: E.fmt(coins(d, p[4])) });
      });
      return items;
    });
  }
  function worldMenu() {
    if (!geo('world')) return;
    ui().menu('World map', function () {
      var s = S(), lived = (s.lived || []).filter(function (c) { return c !== s.country; }), war = [], wars = TL.history && TL.history.wars ? TL.history.wars(s.year) : [];
      wars.forEach(function (w) { Object.keys(w.draft).forEach(function (c) { if (s.year >= w.draft[c] && war.indexOf(c) < 0) war.push(c); }); });
      var items = [{ info: true, html: '<div class="map-box">' + worldSvg({ home: s.country, lived: lived, war: war }) + '<div class="map-legend"><span><i class="home"></i>Home</span>' + (lived.length ? '<span><i class="lived"></i>Lived</span>' : '') + (war.length ? '<span><i class="war"></i>At war</span>' : '') + '<span><i class="game"></i>Countries in the game</span><span class="hint">Tap a country</span></div></div>' }];
      var c = D.country(s.country);
      items.push({ info: true, html: '<p>' + c.flag + ' I live in ' + esc((s.city ? s.city + ', ' : '') + E.countryName(c.name)) + '.</p>' + (lived.length ? '<p class="muted" style="margin-top:6px">I\'ve also lived in ' + esc(lived.join(', ')) + '.</p>' : '') + (wars.length ? '<p class="muted" style="margin-top:6px">' + esc(wars.map(function (w) { return U.cap(w.name); }).join(' and ')) + ' ' + (wars.length > 1 ? 'are' : 'is') + ' being fought this year.</p>' : '') });
      D.COUNTRIES.forEach(function (k) { if (k.name === s.country) return; items.push({ icon: k.flag, label: k.name, sub: (lived.indexOf(k.name) >= 0 ? 'I lived here · ' : '') + (war.indexOf(k.name) >= 0 ? 'At war · ' : '') + 'Life expectancy ' + k.life }); });
      return items;
    });
  }

  // ------------------------------------------------------------ war
  function campaign(d, p, f) {
    var m = state(), r = st().rule, base = coins(d, d.war) * (0.6 + p[5] * 0.2);
    var go = function () {
      ui().choose((f === 'empty' ? 'Settle ' : 'Invade ') + p[1], 'Defense ' + p[5] + ' of 5. How will we go to war?', [
        { label: '🎖️ Send my best general (' + E.fmt(Math.round(base)) + ')', fn: function () { fight(d, p, f, 'general', Math.round(base)); } },
        { label: '⚔️ Lead the army myself (' + E.fmt(Math.round(base)) + ')', fn: function () { fight(d, p, f, 'lead', Math.round(base)); } },
        { label: '🛡️ Raise a huge army (' + E.fmt(Math.round(base * 2.5)) + ')', fn: function () { fight(d, p, f, 'host', Math.round(base * 2.5)); } }
      ]);
    };
    if (f === 'empty' || m.wars[f]) return go();
    ui().choose('Declare war on ' + fname(d, f) + '?', 'Invading ' + p[1] + ' means war with ' + fname(d, f) + '. They will fight back, and may invade my lands.', [
      { label: 'Declare war', fn: function () { m.wars[f] = y(); r.pop = U.clamp(r.pop + 3, 0, 100); E.log('⚔️ I declared war on ' + fname(d, f) + '.'); see('Declared war on ' + fname(d, f), '⚔️'); go(); } },
      { label: 'Not now', fn: function () { done('Not this year.'); } }
    ]);
  }
  function odds(p, mode) {
    var r = st().rule;
    return U.clamp(0.3 + r.guard / 250 + S().fame / 500 + (mode === 'lead' ? 0.12 : mode === 'host' ? 0.2 : 0) - p[5] * 0.07, 0.08, 0.88);
  }
  function fight(d, p, f, mode, cost) {
    var m = state(), r = st().rule, s = S();
    if (count('map_campaign')) return done(nope('My armies have already marched this year.'));
    if (s.money < cost) return done(nope('The treasury can\'t pay for that army: it needs ' + E.fmt(cost) + '.'));
    bump('map_campaign'); E.addMoney(-cost);
    if (f === 'empty') { take(d, p, f); return done(good('My settlers sailed to ' + p[1] + ' and claimed it for my ' + d.realmWord + '. 🏕️')); }
    if (U.chance(odds(p, mode))) {
      take(d, p, f);
      var loot = Math.round(cost * U.randf(0.3, 1.1) * (era() === 'viking' ? 1.5 : 1)); E.addMoney(loot);
      var msg = 'We took ' + p[1] + ' from ' + fname(d, f) + '! It will pay ' + E.fmt(coins(d, p[4])) + ' a year in tribute, and the plunder came to ' + E.fmt(loot) + '. 🚩';
      if (mode === 'general' && U.chance(0.12)) { r.guard = U.clamp(r.guard - 10, 0, 100); msg += ' But my general is now more popular than I am.'; }
      return done(good(msg));
    }
    r.pop = U.clamp(r.pop - 10, 0, 100); r.guard = U.clamp(r.guard - 6, 0, 100); E.fame(-2);
    var text = 'The invasion of ' + p[1] + ' failed. ' + U.pick(['We were ambushed in the hills.', 'Disease ran through the camp before the battle.', 'Their army was bigger than my spies said.', 'Our lines broke on the second day.']);
    if (mode === 'lead') {
      if (U.chance(0.1)) { fallInBattle(p[1]); return done(bad(text + ' I fell at the head of my army.')); }
      if (U.chance(0.25)) { E.stat('health', -U.rand(12, 25)); text += ' I was wounded in the retreat.'; }
    }
    // They may strike back at once.
    if (U.chance(0.3)) { var mine = adj(d, p[0]).filter(function (q) { return owners(d)[q] === 'realm' && q !== d.capital; }); if (mine.length) { var q = U.pick(mine); loseProv(d, P(d, q), f); text += ' Then ' + fname(d, f) + ' counterattacked and took ' + P(d, q)[1] + '.'; } }
    done(bad(text));
  }
  function fallInBattle(where) {
    if (era() === 'viking') { st().valhalla = true; E.achieve('valhalla'); }
    E.die('falling in battle in ' + where);
  }
  function take(d, p, f) {
    var m = state(), r = st().rule;
    if (!m.prev[p[0]]) m.prev[p[0]] = f;
    m.own[p[0]] = 'realm'; m.won++;
    r.pop = U.clamp(r.pop + 8, 0, 100); r.guard = U.clamp(r.guard + 4, 0, 100); E.fame(2 + p[5]);
    E.log('🚩 ' + (f === 'empty' ? 'I claimed ' + p[1] + ' for my ' + d.realmWord + '.' : 'My armies conquered ' + p[1] + ' from ' + fname(d, f) + '.'), 'good');
    see((f === 'empty' ? 'Settled ' : 'Conquered ') + p[1], '🚩');
    if (m.won >= 5) E.achieve('conqueror');
    // Nobody left to fight in that war? It's over.
    if (f !== 'empty' && !Object.keys(owners(d)).some(function (k) { return owners(d)[k] === f; })) { delete m.wars[f]; E.log('⚔️ ' + fname(d, f) + ' has been wiped from the map.', 'good'); }
  }
  function loseProv(d, p, f) {
    var m = state(), r = st().rule;
    m.own[p[0]] = f; m.lost++;
    if (m.prev[p[0]] === f) delete m.prev[p[0]];
    if (r) { r.pop = U.clamp(r.pop - 8, 0, 100); }
    E.log('🏳️ ' + fname(d, f) + ' took ' + p[1] + ' from me.', 'bad');
    if (p[0] === d.capital) capitalFalls(d, f);
  }
  function capitalFalls(d, f) {
    E.log('🔥 ' + fname(d, f) + ' captured my capital. My reign is over.', 'bad');
    if (U.chance(0.4)) { E.die('the fall of my capital to ' + fname(d, f)); return; }
    E.addMoney(-Math.round(Math.max(0, S().money) * 0.6)); E.stat('happy', -25);
    TL.coup.endRule();
    E.log('I escaped with my life and a fraction of my treasure.');
  }
  // Tribute from conquered land, minus what lost land used to pay.
  function tribute() {
    var d = def(); if (!d || !ruling()) return 0;
    var o = owners(d), b = state().start || d.base(y()), t = 0;
    d.provs.forEach(function (p) { if (o[p[0]] === 'realm' && b[p[0]] !== 'realm') t += p[4]; else if (o[p[0]] !== 'realm' && b[p[0]] === 'realm') t -= p[4]; });
    return coins(d, t);
  }
  // A war is over when the enemy has no land left.
  function endWars(d, o) { var m = state(); Object.keys(m.wars).forEach(function (f) { if (!Object.keys(o).some(function (k) { return o[k] === f; })) delete m.wars[f]; }); }
  function summary() {
    var d = def(); if (!d) return '';
    var o = owners(d); endWars(d, o); var n = Object.keys(o).filter(function (k) { return o[k] === 'realm'; }).length, w = Object.keys(state().wars);
    return U.plural(n, 'province') + (w.length ? ' · at war with ' + w.map(function (f) { return fname(d, f); }).join(', ') : ' · at peace');
  }
  // Each year of a reign: the enemy moves, conquered land may rebel, war wearies the people.
  function reignYear() {
    var d = def(); if (!d || !ruling()) return;
    var m = state(), r = st().rule, o = owners(d);
    Object.keys(m.wars).forEach(function () { r.pop = U.clamp(r.pop - 2, 0, 100); });
    // Enemies on my borders.
    var border = d.provs.filter(function (p) { return o[p[0]] === 'realm'; }).map(function (p) { return { p: p, foes: adj(d, p[0]).map(function (q) { return o[q]; }).filter(function (f) { return f !== 'realm' && f !== 'empty'; }) }; }).filter(function (x) { return x.foes.length; });
    var hostile = border.filter(function (x) { return x.foes.some(function (f) { return m.wars[f]; }); });
    var pick = null;
    if (hostile.length && U.chance(0.3)) { var hx = U.pick(hostile); pick = { prov: hx.p[0], f: U.pick(hx.foes.filter(function (f) { return m.wars[f]; })) }; }
    else if (border.length && U.chance(0.05)) { var bx = U.pick(border); pick = { prov: bx.p[0], f: U.pick(bx.foes) }; m.wars[pick.f] = y(); E.log('⚔️ ' + fname(d, pick.f) + ' declared war on me.', 'bad'); }
    if (pick) S().pending.push({ id: 'map_invasion', data: pick });
    // Conquered provinces rebel when the people are unhappy.
    var conquered = Object.keys(m.prev).filter(function (k) { return o[k] === 'realm'; });
    if (r.pop < 30 && conquered.length && U.chance(0.15)) {
      var k = U.pick(conquered), back = m.prev[k];
      m.own[k] = back; delete m.prev[k];
      E.log('🔥 ' + P(d, k)[1] + ' rose in revolt and threw off my rule. ' + fname(d, back) + ' holds it again.', 'bad');
    }
  }
  TL.events.defs.map_invasion = { id: 'map_invasion', scripted: true, build: function (dd) {
    // (data.prov, not data.pid: events.build treats pid as a person id.)
    var d = def(); if (!d || !ruling() || !dd || !dd.prov) return null;
    var p = P(d, dd.prov), f = dd.f, r = st().rule, pay = Math.round(coins(d, d.war) * 0.5);
    if (owners(d)[p[0]] !== 'realm') return null;
    var cap = p[0] === d.capital, choices;
    choices = [
      { label: cap ? 'Defend the capital' : 'Fight them off', run: function () { if (U.chance(U.clamp(0.35 + r.guard / 250 + S().fame / 600 + (cap ? 0.3 : 0), 0.1, 0.95))) { r.pop = U.clamp(r.pop + 4, 0, 100); E.fame(2); return good('We threw them back across the border. ' + p[1] + ' is safe.'); } loseProv(d, p, f); return bad('My army was beaten. ' + p[1] + ' is lost.'); } },
      { label: 'Pay them to leave (' + E.fmt(pay) + ')', run: function () { if (S().money < pay) { loseProv(d, p, f); return bad('I couldn\'t pay. They took ' + p[1] + '.'); } E.addMoney(-pay); r.pop = U.clamp(r.pop - 5, 0, 100); r.guard = U.clamp(r.guard - 3, 0, 100); return 'They took the silver and went home. They\'ll be back.'; } },
      { label: 'Give up ' + p[1], run: function () { loseProv(d, p, f); return 'I let ' + p[1] + ' go without a fight.'; } }
    ];
    if (cap) choices.pop(); // nobody hands over their own capital
    return { icon: '⚔️', title: fname(d, f) + ' invade ' + p[1], text: 'An army from ' + fname(d, f) + ' has crossed into ' + p[1] + (cap ? ', my capital! The walls are manned and the people are arming.' : '.'), choices: choices };
  } };

  return { menu: menu, tap: tap, freeze: freeze, tribute: tribute, summary: summary, reignYear: reignYear, MAPS: MAPS, owners: owners, cells: cells };
})();
