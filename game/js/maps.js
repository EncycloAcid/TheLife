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
  // provs: [id, name, x, y, tribute per year (era coins), defense 1-5, label side]
  // links: [a, b, sea?]. base(year) gives each province's historical owner.
  var MAPS = {
    rome: {
      title: 'The Roman world', w: 360, h: 252, blob: 22, unit: 100, war: 30000, capital: 'italia', realmWord: 'empire',
      factions: { realm: ['The Roman Empire', '#AF52DE'], parthia: ['Parthia', '#FF9500'], germani: ['Germanic tribes', '#34C759'], caledonii: ['Caledonians', '#30B0C7'], hiberni: ['Irish kings', '#64D2FF'],
        britons: ['Britons', '#5856D6'], dacians: ['Dacians', '#A2845E'], goths: ['Goths', '#8E8E93'], sarmatians: ['Sarmatians', '#FFCC00'], armenia: ['Armenia', '#FF2D55'], nabataea: ['Nabataeans', '#C69C6D'],
        garamantes: ['Garamantes', '#B5A48A'], moors: ['Kingdom of Mauretania', '#E0B072'], gallic: ['Gallic Empire', '#FF3B30'], palmyra: ['Palmyra', '#FF6482'] },
      provs: [['caledonia', 'Caledonia', 43, 17, 200, 4], ['hibernia', 'Hibernia', 21, 45, 250, 3], ['britannia', 'Britannia', 57, 52, 900, 3], ['germania', 'Germania', 120, 59, 400, 5], ['gallia', 'Gallia', 79, 90, 2000, 3],
        ['hispania', 'Hispania', 43, 136, 1800, 3], ['mauretania', 'Mauretania', 37, 178, 600, 2], ['africa', 'Africa', 120, 164, 1800, 2], ['garamantes', 'Garamantes', 142, 227, 250, 3], ['italia', 'Italia', 134, 118, 3000, 5],
        ['pannonia', 'Pannonia', 164, 90, 700, 3, 't'], ['dacia', 'Dacia', 197, 94, 900, 4, 't'], ['sarmatia', 'Sarmatia', 241, 78, 300, 4, 't'], ['dalmatia', 'Dalmatia', 161, 112, 600, 2], ['macedonia', 'Macedonia', 186, 129, 700, 2, 'r'],
        ['thracia', 'Thracia', 216, 114, 600, 3, 't'], ['achaea', 'Achaea', 189, 150, 1000, 2], ['asia', 'Asia', 219, 144, 2200, 2], ['galatia', 'Galatia', 249, 140, 800, 2], ['armenia', 'Armenia', 304, 136, 600, 3],
        ['syria', 'Syria', 264, 171, 1800, 3, 'r'], ['judaea', 'Judaea', 253, 196, 700, 4, 'l'], ['arabia', 'Arabia', 275, 220, 600, 3], ['aegyptus', 'Aegyptus', 231, 227, 3000, 2], ['cyrenaica', 'Cyrenaica', 186, 192, 500, 2],
        ['mesopotamia', 'Mesopotamia', 298, 178, 1200, 4], ['parthia', 'Persia', 335, 185, 2500, 5]],
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
      title: 'Medieval Western Europe', w: 360, h: 392, blob: 25, unit: 50, war: 20000, capital: 'england', realmWord: 'kingdom',
      factions: { realm: ['The Kingdom of England', '#FF3B30'], france: ['France', '#007AFF'], scotland: ['Scotland', '#5856D6'], welsh: ['Welsh princes', '#34C759'], irish: ['Irish kings', '#30B0C7'],
        brittany: ['Brittany', '#A2845E'], burgundy: ['Burgundy', '#AF52DE'], toulouse: ['Toulouse', '#FF9500'], castile: ['Castile', '#FFCC00'], aragon: ['Aragon', '#FF2D55'], spain: ['Spain', '#FFCC00'],
        portugal: ['Portugal', '#00C7BE'], moors: ['Granada', '#E0B072'], hre: ['Holy Roman Empire', '#8E8E93'] },
      provs: [['highlands', 'Highlands', 93, 36, 1500, 5], ['lowlands', 'Lowlands', 106, 63, 4000, 4, 'l'], ['north', 'Northumbria', 126, 89, 8000, 4, 'r'], ['england', 'England', 137, 127, 20000, 5], ['wales', 'Wales', 103, 119, 3000, 4],
        ['irelandE', 'Leinster', 70, 103, 3000, 3, 't'], ['irelandW', 'Connacht', 37, 111, 1500, 4], ['brittany', 'Brittany', 112, 186, 4000, 3], ['normandy', 'Normandy', 152, 169, 9000, 3, 't'], ['anjou', 'Anjou', 143, 198, 6000, 3],
        ['paris', 'Île-de-France', 180, 175, 15000, 5, 'r'], ['flanders', 'Flanders', 191, 140, 12000, 3, 'r'], ['burgundy', 'Burgundy', 211, 201, 9000, 4, 'r'], ['aquitaine', 'Aquitaine', 156, 228, 8000, 3, 'r'], ['gascony', 'Gascony', 143, 252, 9000, 3, 'l'],
        ['languedoc', 'Languedoc', 193, 260, 7000, 3], ['castile', 'Castile', 100, 300, 10000, 4], ['aragon', 'Aragon', 138, 290, 8000, 4], ['portugal', 'Portugal', 50, 324, 5000, 3], ['granada', 'Granada', 105, 361, 7000, 5], ['hre', 'Germany', 262, 148, 15000, 5]],
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
      title: 'The Viking world', w: 360, h: 262, blob: 20, unit: 50, war: 8000, capital: 'vestfold', realmWord: 'kingdom',
      factions: { realm: ['The Kingdom of Norway', '#007AFF'], petty: ['Petty kings of Norway', '#8E8E93'], denmark: ['Denmark', '#FF3B30'], svear: ['The Svear', '#FFCC00'], icelanders: ['Icelanders', '#30B0C7'],
        greenlanders: ['Greenlanders', '#64D2FF'], empty: ['Unsettled', '#C7C7CC'], orkney: ['Earls of Orkney', '#AF52DE'], alba: ['Scots and Picts', '#5856D6'], irish: ['Irish kings', '#34C759'], dublin: ['Norse Dublin', '#FF9500'],
        english: ['The English', '#FF2D55'], jorvik: ['Norse Jorvik', '#FF9F0A'], franks: ['The Franks', '#A2845E'], normans: ['The Normans', '#D4A373'], germans: ['The Germans', '#636366'], slavs: ['Slavs', '#00C7BE'], rus: ['The Rus', '#E9C46A'] },
      provs: [['greenland', 'Greenland', 30, 30, 100, 1], ['iceland', 'Iceland', 84, 40, 300, 2], ['orkney', 'Orkney', 146, 56, 300, 2, 'r'], ['hebrides', 'The Isles', 112, 92, 250, 2, 'l'], ['alba', 'Alba', 150, 104, 500, 4, 'l'],
        ['dublin', 'Dublin', 96, 132, 700, 3, 'l'], ['ireland', 'Ireland', 60, 158, 500, 3], ['northumbria', 'Northumbria', 150, 140, 900, 3, 'r'], ['danelaw', 'Danelaw', 164, 172, 1200, 3, 'r'], ['wessex', 'Wessex', 126, 188, 1500, 4, 'l'],
        ['normandy', 'Normandy', 150, 224, 1000, 3, 'l'], ['frankia', 'Frankia', 200, 240, 2500, 5, 'r'], ['frisia', 'Frisia', 212, 194, 700, 2, 'r'], ['saxony', 'Saxony', 252, 214, 1200, 4, 'r'], ['jutland', 'Jutland', 232, 152, 900, 4, 'l'],
        ['scania', 'Scania', 270, 158, 800, 4], ['gotaland', 'Götaland', 282, 126, 600, 3, 'l'], ['svealand', 'Svealand', 300, 90, 900, 4, 't'], ['vestfold', 'Vestfold', 240, 108, 800, 3, 'l'], ['vestlandet', 'Vestlandet', 210, 74, 700, 3, 'l'],
        ['trondelag', 'Trøndelag', 244, 46, 700, 4, 'r'], ['halogaland', 'Hålogaland', 268, 16, 400, 3, 'r'], ['novgorod', 'Novgorod', 334, 112, 800, 3], ['kiev', 'Kiev', 330, 200, 1200, 4]],
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
        'Sogn': 'vestlandet', 'Agder': 'vestlandet', 'Møre': 'vestlandet', 'Hedeby': 'jutland', 'Ribe': 'jutland', 'Birka': 'svealand', 'Dublin': 'dublin', 'Jorvik': 'northumbria', 'Iceland': 'iceland', 'Greenland': 'greenland', 'Orkney': 'orkney' }
    }
  };
  // The modern world: every country in the game, drawn with its flag.
  var WORLD = { w: 360, h: 190,
    places: { 'United States': [48, 62], 'Canada': [45, 30], 'Mexico': [42, 90], 'Jamaica': [78, 96], 'Brazil': [110, 140], 'United Kingdom': [160, 36], 'France': [168, 56], 'Spain': [150, 70], 'Germany': [188, 42], 'Italy': [192, 64],
      'Nigeria': [183, 108], 'South Africa': [197, 160], 'India': [262, 92], 'South Korea': [314, 66], 'Japan': [338, 58], 'Philippines': [312, 102], 'Australia': [326, 158] },
    land: [[55, 60, 50, 42], [110, 138, 26, 40], [176, 52, 32, 24], [190, 122, 30, 46], [272, 64, 74, 42], [326, 158, 24, 15]] };

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

  // ------------------------------------------------------------ drawing
  function esc(t) { return U.esc(String(t)); }
  function label(p, small) {
    var side = p[6] || 'b', x = p[2], yy = p[3], dx = 0, dy = 18, anchor = 'middle';
    if (side === 't') dy = -12; else if (side === 'l') { dx = -12; dy = 3.5; anchor = 'end'; } else if (side === 'r') { dx = 12; dy = 3.5; anchor = 'start'; }
    return '<text class="map-lbl' + (small ? ' sm' : '') + '" x="' + (x + dx) + '" y="' + (yy + dy) + '" text-anchor="' + anchor + '">' + esc(p[1]) + '</text>';
  }
  function svg(d, o, opts) {
    var h = ['<svg class="map" viewBox="0 0 ' + d.w + ' ' + d.h + '" role="img" aria-label="' + esc(d.title) + '">', '<rect class="map-sea" width="' + d.w + '" height="' + d.h + '" rx="10"/>'];
    d.provs.forEach(function (p) { h.push('<circle class="map-land" cx="' + p[2] + '" cy="' + p[3] + '" r="' + d.blob + '"/>'); });
    d.links.forEach(function (l) { var a = P(d, l[0]), b = P(d, l[1]); h.push('<line class="map-link' + (l[2] ? ' sea' : '') + '" x1="' + a[2] + '" y1="' + a[3] + '" x2="' + b[2] + '" y2="' + b[3] + '"/>'); });
    d.provs.forEach(function (p) {
      var f = o[p[0]], col = (d.factions[f] || ['', '#8E8E93'])[1];
      if (opts.wars && opts.wars[f]) h.push('<circle class="map-war" cx="' + p[2] + '" cy="' + p[3] + '" r="12"/>');
      h.push('<circle class="map-node' + (f === 'realm' && opts.mine ? ' mine' : '') + '" cx="' + p[2] + '" cy="' + p[3] + '" r="8" fill="' + col + '"/>');
      if (p[0] === opts.here) h.push('<circle class="map-you" cx="' + p[2] + '" cy="' + p[3] + '" r="13"/>');
    });
    d.provs.forEach(function (p) { h.push(label(p)); });
    h.push('</svg>');
    return h.join('');
  }
  function legend(d, o) {
    var n = {}; Object.keys(o).forEach(function (k) { n[o[k]] = (n[o[k]] || 0) + 1; });
    var keys = Object.keys(n).sort(function (a, b) { return (b === 'realm') - (a === 'realm') || n[b] - n[a]; });
    return '<div class="map-legend">' + keys.map(function (f) { return '<span><i style="background:' + d.factions[f][1] + '"></i>' + esc(fname(d, f)) + ' · ' + n[f] + '</span>'; }).join('') + '<span><i class="you"></i>I am here</span></div>';
  }
  function worldSvg(opts) {
    var w = WORLD, h = ['<svg class="map" viewBox="0 0 ' + w.w + ' ' + w.h + '" role="img" aria-label="World map">', '<rect class="map-sea" width="' + w.w + '" height="' + w.h + '" rx="10"/>'];
    w.land.forEach(function (l) { h.push('<ellipse class="map-land" cx="' + l[0] + '" cy="' + l[1] + '" rx="' + l[2] + '" ry="' + l[3] + '"/>'); });
    D.COUNTRIES.forEach(function (c) {
      var p = w.places[c.name]; if (!p) return;
      var cls = c.name === opts.home ? ' home' : opts.lived.indexOf(c.name) >= 0 ? ' lived' : opts.war.indexOf(c.name) >= 0 ? ' war' : '';
      h.push('<circle class="map-flag' + cls + '" cx="' + p[0] + '" cy="' + p[1] + '" r="10.5"/>');
      h.push('<text class="map-emoji" x="' + p[0] + '" y="' + (p[1] + 4.5) + '" text-anchor="middle">' + c.flag + '</text>');
    });
    h.push('</svg>');
    return h.join('');
  }

  // ------------------------------------------------------------ the menu
  function menu() {
    if (!era()) return worldMenu();
    var d = def(); if (!d) return;
    ui().menu(ruling() ? 'The map and my wars' : d.title, function () {
      var o = owners(d), m = state(), r = ruling() && st().rule, items = [], hp = here(d);
      endWars(d, o);
      items.push({ info: true, html: '<div class="map-box">' + svg(d, o, { here: hp, mine: !!r, wars: r ? m.wars : null }) + legend(d, o) + '</div>' });
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
    ui().menu('World map', function () {
      var s = S(), lived = (s.lived || []).filter(function (c) { return c !== s.country; }), war = [], wars = TL.history && TL.history.wars ? TL.history.wars(s.year) : [];
      wars.forEach(function (w) { Object.keys(w.draft).forEach(function (c) { if (s.year >= w.draft[c] && war.indexOf(c) < 0) war.push(c); }); });
      var items = [{ info: true, html: '<div class="map-box">' + worldSvg({ home: s.country, lived: lived, war: war }) + '<div class="map-legend"><span><i class="you"></i>Home</span>' + (lived.length ? '<span><i class="lived"></i>Lived</span>' : '') + (war.length ? '<span><i class="war"></i>At war</span>' : '') + '</div></div>' }];
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

  return { menu: menu, freeze: freeze, tribute: tribute, summary: summary, reignYear: reignYear, MAPS: MAPS, owners: owners };
})();
