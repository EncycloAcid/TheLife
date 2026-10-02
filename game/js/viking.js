/* TheLife — v1.35: the Viking Age. A whole life in Norway between AD 770
 * and 1030 on the same engine as every other life. Jarls and chieftains
 * rule, free farmers (karls) work their land and take ship in summer, and
 * thralls belong to their masters. Go raiding from Lindisfarne to Paris and
 * Seville, captain your own longship and become a sea-king, swear to a
 * jarl's hird, compose drápur as a skald, see the future as a völva, trade
 * silver from Baghdad at Hedeby, settle Iceland and Greenland, sail to
 * Vinland, choose between the old gods and the White Christ, settle feuds
 * at the Thing or by holmgang, die with a sword in hand and go to Valhalla,
 * or seize the crown of Norway. Real kings and moments, Norse patronymics
 * (a child of Bjorn is Bjornsson or Bjornsdottir).
 * State lives in S.anc (shared with js/ancient.js and js/medieval.js). */
TL.eras = TL.eras || {};
TL.eras.viking = (function () {
  var U = TL.util, E = TL.engine, D = TL.data;
  function S() { return TL.S; }
  function me() { return S().me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function done(r) { return TL.actions.done(r); }
  function nope(t) { return TL.actions.nope(t); }
  function count(key) { var y = S().yearActs || (S().yearActs = {}); return y[key] || 0; }
  function bump(key) { var y = S().yearActs || (S().yearActs = {}); y[key] = (y[key] || 0) + 1; }
  // Amounts below are written in pieces of silver; sil() turns them into game money.
  function sil(x) { return E.$(x * 50); }
  function on() { return !!(TL.S && E.ancient() === 'viking'); }
  function st() {
    var s = S();
    return s.anc || (s.anc = { cls: 'karl', edu: null, inv: [], raids: [], faith: 'old', voyages: [] });
  }
  function y() { return S().year; }
  function male() { return me().gender === 'M'; }
  function thrall() { return st().cls === 'thrall'; }
  function great() { var c = st().cls; return c === 'jarl' || c === 'hersir'; }
  function money() { return Math.max(0, S().money); }
  function christian() { return st().faith === 'christian'; }
  var CLASS_NAME = { jarl: 'A jarl\'s family', hersir: 'A chieftain\'s family (hersir)', karl: 'Karl (free farmer)', thrall: 'Thrall (enslaved)', freed: 'Freed thrall' };
  // A Norse patronymic: Bjorn's son is Bjornsson, his daughter Bjornsdottir.
  function patronym(father, gender) { return father + (gender === 'F' ? 'sdottir' : 'sson'); }
  function stem(last) { return String(last).replace(/(sson|sdottir)$/, ''); }

  // ------------------------------------------------------------ places
  var REGIONS = ['Vestfold', 'Trøndelag', 'Rogaland', 'Hordaland', 'Sogn', 'Agder', 'Hålogaland', 'Møre', 'Oppland', 'Lofoten'];
  var TOWNS = ['Kaupang', 'Hedeby', 'Birka', 'Ribe', 'Dublin', 'Jorvik'];
  function place() { var s = S(); return 'in ' + s.city; }
  function abroad() { return ['Iceland', 'Greenland', 'Dublin', 'Jorvik'].indexOf(S().city) >= 0; }

  // ------------------------------------------------------------ history
  // [from year, name, title]. Before Harald Fairhair, Norway had no single king.
  var KINGS = [[700, '', ''], [872, 'Harald Fairhair', 'King'], [932, 'Eric Bloodaxe', 'King'], [934, 'Haakon the Good', 'King'], [961, 'Harald Greycloak', 'King'], [970, 'Haakon', 'Jarl'],
    [995, 'Olaf Tryggvason', 'King'], [1000, 'Eirik', 'Jarl'], [1015, 'Olaf Haraldsson', 'King'], [1028, 'Cnut the Great', 'King'], [1035, 'Magnus the Good', 'King'], [1047, 'Harald Hardrada', 'King'],
    [1066, 'Olaf Kyrre', 'King'], [1093, 'Magnus Barefoot', 'King'], [1103, 'Sigurd the Crusader', 'King'], [1130, 'Magnus the Blind', 'King']];
  // The ruler as people say it: "King Harald Fairhair", "Haakon Jarl", or the petty kings.
  function king(yr) {
    if (TL.S && on() && S().anc && S().anc.rule) return (male() ? 'King ' : 'Queen ') + me().first + ' ' + me().last;
    var dn = TL.S && on() && TL.dynasty && TL.dynasty.reigning();
    if (dn) return (dn.gender === 'M' ? 'King ' : 'Queen ') + dn.name;
    var k = KINGS[0]; KINGS.forEach(function (x) { if (yr >= x[0]) k = x; });
    return !k[1] ? 'the petty kings and jarls' : k[2] === 'Jarl' ? k[1] + ' Jarl' : 'King ' + k[1];
  }
  // [year, icon, what happened, short label, only in these places]
  var MOMENTS = [
    [793, '⛵', 'Northmen sailed to the holy island of Lindisfarne in England, killed the monks and took the church silver. Everyone is talking about it.', 'The raid on Lindisfarne'],
    [795, '⛵', 'Ships from the North raided the monasteries of Iona and Ireland.', 'The first raids on Ireland'],
    [834, '⚱️', 'A great queen was buried at Oseberg in a ship full of treasure.', 'The Oseberg ship burial', ['Vestfold']],
    [841, '🏘️', 'Norsemen built a winter camp on the Liffey in Ireland. They call it Dublin.', 'The founding of Dublin'],
    [845, '🔥', 'Ragnar and his men sailed up the Seine and sacked Paris. The Frankish king paid them 7,000 pounds of silver to leave.', 'The sack of Paris'],
    [860, '⛵', 'The Rus attacked Constantinople, the great city they call Miklagard.', 'The Rus at Miklagard'],
    [865, '⚔️', 'The Great Heathen Army, led by the sons of Ragnar, landed in England.', 'The Great Heathen Army'],
    [866, '🏰', 'The Great Army captured York. Norsemen call it Jorvik now.', 'The taking of Jorvik'],
    [872, '👑', 'Harald Fairhair won the sea battle at Hafrsfjord and made himself king of all Norway.', 'Harald Fairhair, first king of Norway'],
    [874, '🌋', 'Ingolf Arnarson settled a new island to the west, full of fire and ice. They call it Iceland.', 'The settlement of Iceland'],
    [878, '⚔️', 'King Alfred of Wessex defeated Guthrum at Edington. England was split, and the Danes keep the Danelaw.', 'The Danelaw'],
    [911, '🗺️', 'The Frankish king gave Rollo and his men land at the mouth of the Seine. It will be called Normandy.', 'The founding of Normandy'],
    [930, '⚖️', 'The Icelanders held their first Althing at Thingvellir, an assembly for the whole island.', 'The first Althing'],
    [934, '🌋', 'The earth split open in Iceland and fire poured out for years.', 'The Eldgjá eruption', ['Iceland']],
    [954, '🗡️', 'Eric Bloodaxe was killed at Stainmore. The Norse kingdom of Jorvik was lost.', 'The death of Eric Bloodaxe'],
    [965, '✝️', 'King Harald Bluetooth of Denmark was baptized and raised a great runestone at Jelling.', 'Harald Bluetooth\'s baptism'],
    [982, '🌨️', 'Erik the Red was outlawed from Iceland for killing and sailed west to explore a new land.', 'Erik the Red\'s exile'],
    [985, '🧊', 'Erik the Red led twenty-five ships to the new land. He calls it Greenland so people will want to go.', 'The settlement of Greenland'],
    [991, '💰', 'At Maldon in England, Norse raiders beat the English. King Æthelred began paying Danegeld to make them go away.', 'The Battle of Maldon'],
    [995, '✝️', 'Olaf Tryggvason became king and ordered everyone in Norway to be baptized.', 'Olaf Tryggvason'],
    [1000, '🌲', 'Leif Erikson sailed west from Greenland and found a land of grapes and timber. He calls it Vinland.', 'Vinland'],
    [1000, '⛵', 'King Olaf Tryggvason was killed at the sea battle of Svolder. He leapt into the sea in his armor.', 'The Battle of Svolder'],
    [1013, '👑', 'Sweyn Forkbeard of Denmark conquered all of England.', 'Sweyn Forkbeard takes England'],
    [1016, '👑', 'Cnut the Great became king of England. He will rule an empire of the North Sea.', 'Cnut the Great'],
    [1030, '⚔️', 'King Olaf Haraldsson was killed by his own farmers at Stiklestad. Now they say he works miracles. Saint Olaf.', 'The Battle of Stiklestad'],
    [1066, '⚔️', 'Harald Hardrada, the last great Viking king, was killed at Stamford Bridge in England. Three weeks later the Normans won at Hastings.', 'The end of the Viking Age']
  ];
  // Moments that only happen if the real kings of Norway are on the throne.
  var RULER_MOMENTS = ['Harald Fairhair, first king of Norway', 'Olaf Tryggvason', 'The Battle of Svolder', 'The Battle of Stiklestad', 'The end of the Viking Age'];
  var TARGETS = [[790, 'the monasteries of Northumbria'], [795, 'the coasts of Ireland'], [800, 'the islands of Scotland'], [820, 'the rivers of Frankia'], [840, 'the rivers of Frankia'], [844, 'Seville in al-Andalus'],
    [850, 'the kingdoms of England'], [859, 'the Mediterranean'], [865, 'the kingdoms of England'], [880, 'Frankia'], [900, 'the Baltic coast'], [930, 'the Baltic coast'], [980, 'the coasts of England'], [991, 'England, for Danegeld'], [1017, 'the Baltic coast']];
  function target(yr) {
    var opts = TARGETS.filter(function (t) { return yr >= t[0] && yr <= t[0] + 30; }).map(function (t) { return t[1]; });
    return U.pick(opts.length ? opts : ['the Baltic coast']);
  }
  function see(title, icon) { var s = S(), h = s.era || (s.era = { seen: [], served: [] }); if (h.seen.length < 40) h.seen.push({ year: s.year, age: me().age, icon: icon, title: title }); }

  // ------------------------------------------------------------ careers
  function notThrall() { return thrall() ? 'Thralls belong to their master' : null; }
  var CAREERS = [
    { id: 'v_farm', icon: '🌾', name: 'Farming', stat: 'athl', min: 12, need: notThrall, levels: [['Farmhand', 250], ['Farmer', 500], ['Wealthy Landowner', 1200]] },
    { id: 'v_fish', icon: '🎣', name: 'Fishing', stat: 'athl', min: 12, need: notThrall, levels: [['Fisherman', 280], ['Boat Owner', 600]] },
    { id: 'v_smith', icon: '⚒️', name: 'Smithing', stat: 'athl', min: 13, need: notThrall, levels: [['Smith\'s Apprentice', 120], ['Blacksmith', 480], ['Master Swordsmith', 1500]] },
    { id: 'v_ship', icon: '🪵', name: 'Shipbuilding', stat: 'smarts', min: 14, need: notThrall, levels: [['Apprentice Shipwright', 150], ['Shipwright', 550], ['Master Shipbuilder', 1800]] },
    { id: 'v_weave', icon: '🧵', name: 'Weaving', stat: 'smarts', min: 12, need: notThrall, levels: [['Weaver', 220], ['Sail Weaver', 450], ['Mistress of the Looms', 900]] },
    { id: 'v_hunt', icon: '🦌', name: 'Hunting', stat: 'athl', min: 14, need: notThrall, levels: [['Trapper', 260], ['Fur Hunter', 550], ['Walrus Ivory Hunter', 1300]] },
    { id: 'v_trade', icon: '⚖️', name: 'Trade', stat: 'smarts', min: 16, need: notThrall, levels: [['Peddler', 300], ['Trader', 800], ['Rich Merchant of Hedeby', 3000]] },
    { id: 'v_heal', icon: '🌿', name: 'Healing', stat: 'smarts', min: 16, need: notThrall, levels: [['Herb Gatherer', 150], ['Healer', 500]] },
    { id: 'v_skald', icon: '🎶', name: 'Poetry', stat: 'smarts', min: 15, need: function () { return notThrall() || (me().smarts < 50 ? 'Not enough smarts' : null); }, levels: [['Apprentice Skald', 150], ['Skald', 600], ['Court Skald', 2400]] }
  ];
  var SPECIAL = {
    v_thrall: { id: 'v_thrall', icon: '⛓️', name: 'Servitude', levels: [['Thrall', 30], ['Trusted Thrall', 100]] },
    v_raid: { id: 'v_raid', icon: '⛵', name: 'Going viking', levels: [['Raider', 200], ['Seasoned Raider', 300], ['Ship Captain', 500], ['Sea-King', 800]] },
    v_hird: { id: 'v_hird', icon: '🛡️', name: 'The hird', levels: [['Housecarl', 700], ['Hirdman', 1200], ['Marshal of the Hird', 3600]] },
    v_volva: { id: 'v_volva', icon: '🔮', name: 'Seeress', levels: [['Völva', 300]] },
    v_king: { id: 'v_king', icon: '👑', name: 'The crown', levels: [['King of Norway', 80000]] }
  };
  var FEMALE = { 'King of Norway': 'Queen of Norway' };
  function career(id) { return CAREERS.filter(function (c) { return c.id === id; })[0] || SPECIAL[id] || null; }
  function lvlName(c, l) { var n = c.levels[Math.min(l, c.levels.length - 1)][0]; return !male() && FEMALE[n] ? FEMALE[n] : n; }
  function salary(j) {
    var c = career(j.career); if (!c) return 0;
    return Math.round(sil(c.levels[Math.min(j.level, c.levels.length - 1)][1]) * (j.mult || 1));
  }
  function title(j) { var c = career(j.career); return c ? lvlName(c, j.level) : 'Worker'; }
  var NPC_JOBS = ['Farmer', 'Fisherman', 'Blacksmith', 'Shipwright', 'Weaver', 'Trader', 'Hunter', 'Raider', 'Shepherd', 'Housecarl', 'Brewer', 'Homemaker', 'Woodcarver', 'Silversmith'];
  function npcJob(age) { return age < 13 ? 'Child' : age >= 60 && U.chance(0.6) ? 'Elder' : U.pick(NPC_JOBS); }

  // ------------------------------------------------------------ birth
  function setup(s, opts) {
    var a = st(), w = s.flags.wealth, c = D.country(s.country);
    a.cls = opts.royal ? 'jarl' : opts.cls || (w === 'rich' ? 'jarl' : w === 'upper' ? 'hersir' : w === 'poor' && U.chance(0.4) ? 'thrall' : 'karl');
    if (TOWNS.indexOf(s.city) < 0 || U.chance(0.7)) s.city = U.pick(REGIONS);
    var mom = E.people('mother')[0], dad = E.people('father')[0];
    var par = { jarl: ['Jarl', 'Lady of the Hall'], hersir: ['Chieftain', 'Lady of the Farm'], karl: [U.pick(['Farmer', 'Fisherman', 'Blacksmith', 'Shipwright', 'Trader']), U.pick(['Homemaker', 'Weaver', 'Brewer', 'Dairymaid'])], thrall: ['Thrall', 'Thrall'] }[a.cls];
    if (dad) dad.job = par[0]; if (mom) mom.job = par[1];
    // Norse patronymics: my surname is my father's name; my mother keeps her own father's.
    var was = me().first + ' ' + me().last;
    if (dad) {
      if (stem(me().last) !== me().last && c.male.indexOf(stem(me().last)) >= 0) dad.first = stem(me().last);
      me().last = patronym(dad.first, me().gender);
      dad.last = patronym(U.pick(c.male), 'M');
      E.people('sibling').forEach(function (p) { p.last = patronym(dad.first, p.gender); });
    }
    if (mom) mom.last = patronym(U.pick(c.male), 'F');
    s.log.forEach(function (yy) { yy.entries.forEach(function (e) { e.t = e.t.replace(was, me().first + ' ' + me().last); }); });
    fixParentLines(s, mom, dad);
    if (opts.royal && TL.dynasty.born(s, royalCfg())) { a.king = king(s.year); return; }
    if (a.cls === 'thrall') {
      a.master = U.pick(c.male) + ' ' + patronym(U.pick(c.male), 'M');
      [mom, dad].forEach(function (p) { if (p) p.money = 0; });
      s.money = 0;
      E.log('⛓️ I was born a thrall on the farm of ' + a.master + '. My parents are his property, and so am I.', 'bad');
    } else E.log({ jarl: '🛡️ My father is a jarl. Warriors and farmers across ' + s.city + ' owe him loyalty.', hersir: '🪓 My father is a hersir, a chieftain who leads the local men to war.', karl: '🌾 My family are karls, free farmers who own their land and carry their own weapons.' }[a.cls], great() ? 'good' : '');
    a.king = king(s.year);
    E.log(a.king.indexOf('petty') >= 0 ? '🪓 Norway has no single king. Petty kings and jarls rule each fjord and valley.' : '👑 ' + a.king + ' rules Norway.');
  }
  // The birth log named my parents before their Norse names were settled.
  function fixParentLines(s, mom, dad) {
    s.log.forEach(function (yy) { yy.entries.forEach(function (e) {
      if (mom && /^My mother is /.test(e.t)) e.t = e.t.replace(/^My mother is [^,]+,/, 'My mother is ' + E.fullName(mom) + ',');
      if (dad && /^My father is /.test(e.t)) e.t = e.t.replace(/^My father is [^,]+,/, 'My father is ' + E.fullName(dad) + ',');
    }); });
  }

  // ------------------------------------------------------------ the year
  function yearly() {
    var s = S(), a = st(), age = me().age, yr = s.year, j = s.job;
    TL.dynasty.yearly(); // my family's throne (js/eras.js)
    if (s.dead) return;
    j = s.job;
    var k = king(yr);
    if (k !== a.king) { a.king = k; if (age >= 5 && k.indexOf('petty') < 0 && !a.rule) E.log('👑 ' + k + ' now rules Norway.'); }
    MOMENTS.forEach(function (mo) {
      if (mo[0] !== yr || age < 5 || (mo[4] && mo[4].indexOf(s.city) < 0)) return;
      if (TL.dynasty.altered() && RULER_MOMENTS.indexOf(mo[3]) >= 0) return; // my family rules Norway now: history went another way
      E.log(mo[1] + ' ' + mo[2]); see(mo[3], mo[1]);
    });
    if (a.plot) { TL.coup.yearly(coupCfg(a.plot.kind)); if (s.dead) return; }
    if (a.rule && !(j && j.career === 'v_king')) TL.coup.lostThrone();
    // Big battles for the men of the hird.
    if (j && j.career === 'v_hird' && [872, 1000, 1016, 1030].indexOf(yr) >= 0) {
      var bt = { 872: 'Hafrsfjord', 1000: 'Svolder', 1016: 'Nesjar', 1030: 'Stiklestad' }[yr];
      if (U.chance(0.15)) return valhalla('the Battle of ' + bt);
      E.fame(3); E.log('⚔️ I fought in the shield wall at ' + bt + ' and lived to tell of it.', 'good'); see('Fought at ' + bt, '⚔️');
    }
    if (yr === 1066 && male() && age >= 16 && age <= 55 && j && (j.career === 'v_raid' || j.career === 'v_hird')) s.pending.push({ id: 'v_hardrada' });
    // Olaf Tryggvason hunted down seeresses and sorcerers (995-1000).
    if (j && j.career === 'v_volva' && yr >= 995 && yr <= 1000 && U.chance(0.3)) s.pending.push({ id: 'v_sorcery' });
    if (s.dead) return;
    if (age === 12 && male() && !thrall()) E.log('🪓 My father gave me my first axe. A free man is never without his weapons.');
    // Thralls: work, a little savings, and a chance to be freed.
    if (a.cls === 'thrall') {
      if (age >= 10 && !j && !s.prison) hire('v_thrall');
      if (age >= 12) E.addMoney(sil(U.rand(1, 6)));
      if (age >= 25 && U.chance(0.03)) s.pending.push({ id: 'v_freedom' });
    }
    // Children take their father's name.
    s.people.forEach(function (p) {
      if (p.role !== 'child' || p.pat || !p.alive) return;
      var dad = male() ? me() : (E.partner() && E.partner().gender === 'M' ? E.partner() : null);
      if (dad) p.last = patronym(dad.first, p.gender);
      p.pat = true;
    });
    // Investments: farms, trade voyages and loans.
    a.inv = (a.inv || []).filter(function (v) {
      if (v.kind === 'farm') { var inc = Math.round(v.value * U.randf(0.04, 0.09)); if (U.chance(0.12)) { inc = 0; E.log('❄️ A long winter killed the cattle on my farm. It earned nothing this year.', 'bad'); } E.addMoney(inc); return true; }
      if (yr < v.due) return true;
      if (v.kind === 'loan') {
        if (U.chance(0.85)) { var back = Math.round(v.amt * 1.2); E.addMoney(back); E.log('🪙 ' + v.who + ' paid back my silver with interest: ' + E.fmt(back) + '.', 'good'); }
        else E.log('🪙 ' + v.who + ' went raiding and never came back. My silver went with him.', 'bad');
      } else if (v.kind === 'voyage') {
        var r = U.rand(1, 100), got;
        if (r <= 15) E.log('🌊 My trading ship went down in a storm. Everything was lost.', 'bad');
        else if (r <= 40) { got = Math.round(v.amt * U.randf(0.85, 1.15)); E.addMoney(got); E.log('⛵ My traders came back from ' + v.to + '. It roughly broke even: ' + E.fmt(got) + '.'); }
        else { got = Math.round(v.amt * U.randf(1.4, 2.4)); E.addMoney(got); E.log('⛵ My traders came home from ' + v.to + ' with ' + U.pick(['Arab silver coins', 'silk from Miklagard', 'furs and walrus ivory', 'Frankish wine and glass']) + '. I made ' + E.fmt(got) + '!', 'good'); }
      }
      return false;
    });
  }
  // A warrior's death: the Valkyries carry me to Odin's hall.
  function valhalla(where) {
    st().valhalla = true; E.achieve('valhalla');
    E.die('wounds in battle at ' + where);
    return true;
  }

  // A year at work (called from engine.progressJob). Returns earnings.
  function jobYear(j) {
    var c = career(j.career);
    if (!c) return 0;
    if (j.career === 'v_raid') return raidYear(j, c);
    if (j.career === 'v_king') return TL.coup.reignYear(coupCfg('throne'));
    if (j.career === 'v_volva') return volvaYear(j);
    var stv = j.career === 'v_thrall' ? me().athl : E.statValue(c.stat || 'smarts');
    j.perf = U.clamp(Math.round((j.perf || 50) + U.rand(-9, 8) + (stv - 50) / 15 + (j.workHard || 0) * 4 - (me().happy < 20 ? 6 : 0)), 0, 100);
    j.workHard = 0;
    if (j.career === 'v_hird' && U.chance(0.1)) {
      if (U.chance(0.15)) { valhalla(U.pick(['a feud between jarls', 'a sea battle off the coast', 'a raid on a rival\'s hall'])); return 0; }
      E.stat('health', -U.rand(5, 18)); E.fame(1); E.log('🛡️ I stood in my lord\'s shield wall in a fight with ' + U.pick(['a rival jarl', 'Danish raiders', 'rebel farmers']) + '. I took a wound but held my place.');
    }
    if (j.level < c.levels.length - 1 && j.perf >= 70 && j.levelYears >= 3 && U.chance(0.3 + (j.perf - 70) / 60)) {
      j.level++; j.levelYears = 0; j.perf = Math.max(45, j.perf - 20);
      E.log('📈 I became ' + E.an(title(j)) + '! ' + (salary(j) ? 'New pay: ' + E.fmt(salary(j)) + ' a year.' : ''), 'good'); E.stat('happy', 10);
    } else if (j.perf < 15 && j.career !== 'v_thrall' && U.chance(0.5)) { E.fire('My work was terrible.'); }
    return salary(j);
  }
  function raidYear(j, c) {
    var s = S(), a = st(), where = target(y()), own = s.assets.some(function (x) { return x.anc && x.type === 'Longship'; });
    j.perf = U.clamp(Math.round((j.perf || 50) + U.rand(-8, 9) + (me().athl - 50) / 12 + (j.workHard || 0) * 4), 0, 100); j.workHard = 0;
    if (U.chance(0.25)) { E.log('⛵ The summer was spent at home. No ship went out from our fjord this year.'); return sil(60); }
    if (a.raids.indexOf(where) < 0) { a.raids.push(where); see('Raided ' + where, '⛵'); }
    var r = U.rand(1, 1000), death = 34 - Math.round((me().athl - 50) / 4);
    if (r <= death) { valhalla(where); return 0; }
    if (r <= death * 4) { E.stat('health', -U.rand(10, 28)); E.log('🩸 We raided ' + where + ', but I took a spear in the side.', 'bad'); return sil(40); }
    var share = U.rand(60, 400) * (1 + j.level) * (j.level >= 2 && own ? 2 : 1) * (/Danegeld/.test(where) ? 3 : 1);
    var g = sil(share); E.addMoney(g); E.fame(j.level >= 2 ? 3 : 1); j.perf = Math.min(100, j.perf + 5); a.plunder = (a.plunder || 0) + g;
    E.log('⛵ We raided ' + where + '. ' + U.pick(['We took church silver and slaves.', 'We came at dawn and were gone by noon.', 'The locals paid us to leave.', 'We fought our way in and out again.']) + ' My share was ' + E.fmt(g) + '.', 'good');
    if (j.level === 0 && j.years >= 2) { j.level = 1; j.levelYears = 0; E.log('⛵ The older men respect me now. I am a seasoned raider.', 'good'); }
    if (j.level === 2 && j.levelYears >= 3 && s.fame >= 35 && U.chance(0.25)) { j.level = 3; j.levelYears = 0; E.achieve('sea_king'); E.fame(8); see('Became a sea-king', '⛵'); E.log('👑 Men from three fjords follow my ships now. The skalds call me a sea-king.', 'good'); }
    return 0;
  }
  function volvaYear(j) {
    E.fame(1); E.karma(1);
    j.clients = (j.clients || 0) + U.rand(2, 8);
    if (U.chance(0.15)) E.log('🔮 ' + U.pick(['A jarl asked me whether his summer raid would prosper.', 'A farmer\'s wife asked if her child would live. I saw that it would.', 'I sat on the high seat at a feast and told everyone their fates.', 'A young warrior asked how he would die. I did not tell him.']));
    return sil(U.rand(100, 300) + Math.min(800, S().fame * 10));
  }
  function hire(id) {
    var c = career(id);
    S().job = { career: id, ancient: true, level: 0, perf: 55, years: 0, levelYears: 0, mult: 1, company: place() };
    S().counts.jobs++;
    return c;
  }
  function freeMe(how) {
    var a = st(), j = S().job;
    a.cls = 'freed'; a.freedHow = how;
    if (j && j.career === 'v_thrall') E.quitJob(true);
    E.log('🕊️ I am free! At my freedom-ale my former master gave me a cloak and a knife, the marks of a free person.', 'good');
    E.stat('happy', 25); see('Won my freedom', '🕊️');
  }

  // ------------------------------------------------------------ occupation
  function occupationMenu() {
    ui().menu('Occupation', function () {
      var s = S(), a = st(), j = s.job, age = me().age, items = [];
      items.push({ info: true, html: card() });
      if (age < 7) { items.push({ info: true, html: '<p class="muted">I\'m too young to work. Childhood comes first.</p>' }); return items; }
      if (j && j.career === 'v_king') { items.push({ section: 'The realm' }); return items.concat(TL.coup.reignItems(coupCfg('throne'))); }
      items = items.concat(TL.dynasty.items());
      if (thrall()) {
        items.push({ section: 'Servitude' });
        if (j) items.push({ icon: '💪', label: 'Work hard for my master', sub: 'Trust leads to an easier life', onClick: function () { if (count('v_work')) return done(nope('I already worked myself ragged this year.')); bump('v_work'); j.workHard = (j.workHard || 0) + 1; E.stat('health', -1); done('I cut peat and hauled water from before dawn until after dark.'); } });
        var price = sil(1200);
        items.push({ icon: '🕊️', label: 'Buy my freedom', sub: 'A thrall may buy freedom with savings', right: E.fmt(price), onClick: function () { if (s.money < price) return done(nope('I need ' + E.fmt(price) + ' to buy my freedom.')); E.addMoney(-price); freeMe('silver'); ui().back(); done(good('I paid ' + a.master + ' and drank my freedom-ale.')); } });
        items.push({ icon: '🏃', label: 'Run away to the forest', sub: 'Runaway thralls may be killed on sight', danger: true, onClick: runaway });
        if (age >= 16) items.push({ icon: '🔥', label: a.plot ? 'The uprising' : 'Plan a thrall uprising', sub: a.plot ? 'Strength ' + Math.round(a.plot.power) + ' · suspicion ' + Math.round(a.plot.heat) : 'Burn the hall and take our freedom', danger: true, onClick: function () { TL.coup.menu(coupCfg('revolt')); } });
        return items;
      }
      if (j) {
        items.push({ section: 'My work' });
        if (j.career === 'v_raid') {
          var own = s.assets.some(function (x) { return x.anc && x.type === 'Longship'; });
          items.push({ icon: '🏋️', label: 'Train with axe and shield', onClick: function () { if (count('v_train')) return done(nope('My arms ache. Enough for this year.')); bump('v_train'); me().athl = Math.min(100, me().athl + U.rand(2, 5)); j.perf = Math.min(100, (j.perf || 50) + 4); done('I sparred with the other men until my shield was splinters. 🪓'); } });
          if (j.level === 1) items.push({ icon: '⛵', label: 'Captain my own ship', sub: own ? 'Lead my own crew and keep a bigger share' : 'I need my own longship first (Assets)', disabled: !own, onClick: function () { if (S().fame < 10) return done(nope('No crew will follow me yet. I need more of a name.')); j.level = 2; j.levelYears = 0; E.fame(3); done(good('Forty men swore to row and fight under me. I am a ship captain now! ⛵')); } });
          if (age >= 16) items.push({ icon: '🔥', label: 'Go berserk', sub: 'Fight in a frenzy next raid, no armor, no fear', danger: true, onClick: function () { if (count('v_berserk')) return done(nope('The rage only comes once a year.')); bump('v_berserk'); j.perf = Math.min(100, (j.perf || 50) + 12); E.fame(2); if (U.chance(0.15)) { E.stat('health', -U.rand(10, 25)); return done(bad('I howled, bit my shield and charged alone. I woke up covered in wounds.')); } done('I howled like a wolf and charged. Even my own crew stepped back from me.'); } });
        } else if (j.career === 'v_volva') {
          items.push({ icon: '🔮', label: 'Sit on the high seat and prophesy', sub: 'For a farmer, a jarl, or a king', onClick: function () { if (count('v_seid')) return done(nope('The spirits have spoken enough this year.')); bump('v_seid'); E.fame(3); var g = sil(U.rand(20, 120)); E.addMoney(g); done('The women sang the warding songs, and I saw ' + U.pick(['a good harvest and a bad winter', 'a ship coming home heavy with silver', 'a feud that would end in fire', 'a child who would become a great skald']) + '. They paid me ' + E.fmt(g) + '.'); } });
        } else if (j.career === 'v_skald') {
          items.push({ icon: '🎶', label: 'Compose a drápa', sub: 'A praise poem for a great man', onClick: function () { if (count('v_poem')) return done(nope('The mead of poetry has run dry for this year.')); bump('v_poem'); var q = U.rand(1, 100) + (me().smarts - 50) / 2 + j.level * 8; if (q > 75) { E.fame(5); var g = sil(U.rand(100, 600)); E.addMoney(g); if (!a.saga) { a.saga = true; E.achieve('skald'); see('Composed a famous drápa', '🎶'); } return done(good('I recited my drápa in the hall. The ' + (j.level >= 2 ? 'king' : 'jarl') + ' took a gold ring from his arm and gave it to me, worth ' + E.fmt(g) + '. 🎶')); } done('I recited my poem. A few men nodded. One fell asleep.'); } });
        }
        if (/v_(farm|fish|smith|ship|weave|hunt|trade|heal|skald|hird|thrall)/.test(j.career)) items.push({ icon: '💪', label: 'Work harder', onClick: function () { if (count('v_work') >= 2) return done(nope('I\'m exhausted.')); bump('v_work'); j.workHard = (j.workHard || 0) + 1; j.perf = Math.min(100, (j.perf || 50) + 5); E.stat('happy', -1); done('I put in extra effort.'); } });
        items.push({ icon: '🚪', label: 'Quit', danger: true, onClick: function () { E.quitJob(); done('I left my work.'); } });
      }
      // The ruler's family doesn't hire out as farmhands (js/eras.js, TL.dynasty).
      if (!TL.dynasty.royal()) items.push({ section: 'Find work' });
      CAREERS.forEach(function (c) {
        if ((j && j.career === c.id) || TL.dynasty.royal()) return;
        var why = age < c.min ? 'Must be ' + c.min + '+' : c.need ? c.need() : null;
        items.push({ icon: c.icon, label: c.levels[0][0], sub: c.name + ' · ' + E.fmt(sil(c.levels[0][1])) + '/yr' + (why ? ' · ' + why : ''), disabled: !!why, onClick: function () { apply(c); } });
      });
      items.push({ section: 'Paths to glory' });
      items.push({ icon: '⛵', label: 'Go viking', sub: age < 15 ? 'Ages 15 and up' : 'Raid across the sea every summer', disabled: age < 15 || (j && j.career === 'v_raid'), onClick: function () { E.quitJob(true); hire('v_raid'); S().job.company = 'a ship from ' + S().city; done(good('I took an oar on a longship. When the ice melts, we sail. ⛵')); } });
      items.push({ icon: '🛡️', label: 'Join a jarl\'s hird', sub: age < 17 ? 'Ages 17 and up' : me().athl < 50 ? 'Only strong fighters are taken' : 'Feast in the hall, fight in the shield wall', disabled: age < 17 || me().athl < 50 || (j && j.career === 'v_hird'), onClick: function () { E.quitJob(true); hire('v_hird'); S().job.company = 'the hird of ' + (king(y()).indexOf('petty') >= 0 ? 'the jarl' : king(y())); done(good('I knelt, put my hands on the hilt of my lord\'s sword, and swore to serve him. 🛡️')); } });
      var canSee = !male() && me().smarts >= 50 && age >= 20;
      items.push({ icon: '🔮', label: 'Become a völva', sub: male() ? 'Seeresses are women' : !canSee ? 'Needs to be 20+ with a sharp mind' : christian() ? 'The Church calls it witchcraft' : 'Travel from hall to hall seeing the future', disabled: !canSee || (j && j.career === 'v_volva'), onClick: function () { E.quitJob(true); hire('v_volva'); S().job.company = 'the halls of ' + S().city; done(good('I took a staff, a cloak of black lamb and a hood of white cat fur. People will come to me now to learn their fate. 🔮')); } });
      var canThrone = (age >= 21 && (great() || S().fame >= 40 || (j && ((j.career === 'v_hird' && j.level >= 1) || (j.career === 'v_raid' && j.level >= 3))))) || (age >= 16 && TL.dynasty.royal() && !(a.dyn && a.dyn.regent));
      var pre = y() < 872;
      items.push({ icon: '👑', label: a.plot ? 'The rebellion' : pre ? 'Make myself king of all Norway' : 'Seize the crown of Norway', sub: a.plot ? 'Strength ' + Math.round(a.plot.power) + ' · suspicion ' + Math.round(a.plot.heat) : canThrone ? 'Win the jarls, then strike' : 'Needs to be 21+ and a jarl\'s family, a hirdman, a sea-king or famous', danger: true, disabled: !canThrone && !a.plot, onClick: function () { TL.coup.menu(coupCfg(a.plot ? a.plot.kind : 'throne')); } });
      // The lawful road: the free farmers at the Thing choose their king, as they chose Haakon the Good in 934.
      var canThing = age >= 25 && !a.plot && !TL.dynasty.royal() && !pre && (great() || S().fame >= 45 || (j && ((j.career === 'v_hird' && j.level >= 2) || (j.career === 'v_raid' && j.level >= 3))));
      items.push({ icon: '⚖️', label: 'Ask the Thing to make me ' + (male() ? 'king' : 'queen'), sub: pre ? 'Norway has no single king yet' : canThing ? 'The farmers choose their king · about ' + Math.round(thingOdds(0) * 100) + '% chance' : 'Needs to be 25+ and a jarl\'s family, a famous warrior or a sea-king', disabled: !canThing, onClick: thingClaim });
      if (j && j.years >= 15 && age >= 55) items.push({ section: ' ' }, { icon: '🏡', label: 'Retire', onClick: function () { var r = E.retire(); done(r.msg); } });
      return items;
    });
  }
  function card() {
    var s = S(), a = st(), j = s.job;
    var line = j ? E.jobTitle(j) + (j.company && j.career !== 'v_king' ? ' · ' + j.company : '') : s.retired ? 'Retired' : 'Not working';
    var extra = j && j.career === 'v_raid' && a.raids.length ? 'Raided ' + a.raids.slice(-3).join(', ') : j && E.jobSalary(j) ? 'Pay ' + E.fmt(E.jobSalary(j)) + '/yr' : '';
    return '<div class="kv"><b>' + U.esc(line) + '</b>' + (extra ? '<br><span class="muted">' + U.esc(extra) + '</span>' : '') + '<br><span class="muted">' + CLASS_NAME[a.cls] + ' · ' + U.esc(U.cap(king(s.year))) + '</span></div>';
  }
  function apply(c) {
    var sv = E.statValue(c.stat || 'smarts'), p = 0.5 + (sv - 50) / 120 + (great() ? 0.1 : 0);
    if (!U.chance(p)) return done(bad('They didn\'t need anyone.'));
    E.quitJob(true); hire(c.id);
    done(good('I found work as ' + E.an(c.levels[0][0].toLowerCase()) + ' ' + S().job.company + '.'));
  }
  function runaway() {
    var a = st();
    if (a.watch > y()) return done(nope('I\'m being watched too closely to try again yet.'));
    a.watch = y() + 3;
    if (U.chance(0.15)) { freeMe('escape'); S().city = U.pick(['Iceland', 'Dublin', 'Jorvik']); return done(good('I hid in the forest, then slipped onto a ship. In ' + S().city + ' nobody knows I was ever a thrall.')); }
    E.stat('health', -20); E.stat('happy', -15);
    done(bad('My master\'s men tracked me down with dogs. They beat me and put an iron collar on my neck.'));
  }

  // ------------------------------------------------------------ assets
  var HOMES = { bench: ['A bench in someone else\'s longhouse', 30, -2], turf: ['A turf house', 80, 0], farm: ['A large farmhouse', 300, 3] };
  function homeLabel(h) {
    var a = st();
    if (h.type === 'parents') return a.cls === 'thrall' ? 'The farm of ' + a.master : a.cls === 'jarl' ? 'My family\'s great hall' : me().age < 18 ? 'My family\'s longhouse' : 'Living with my family';
    if (h.type === 'palace') return 'The royal hall';
    if (h.type === 'homeless') return 'Sleeping in the open';
    if (h.type === 'owned') { var o = E.ownedHome(); return o ? 'My ' + o.type.toLowerCase() + ' ' + (o.where || '') : 'My house'; }
    return (HOMES[h.anc] || HOMES.turf)[0];
  }
  var BUY = [['🛖', 'Turf house', 'Walls of turf, a roof of grass', 1500, true], ['🏠', 'Longhouse', 'A great hall for a whole household', 10000, true], ['⛵', 'Longship', 'Needed to captain your own raids', 8000],
    ['🐎', 'Horse', 'A sturdy Norse horse', 300], ['⚔️', 'Ulfberht sword', 'The finest steel in the North', 3000], ['💍', 'Silver arm-rings', 'Wealth you can wear', 1000]];
  function assetsMenu() {
    ui().menu('Property & wealth', function () {
      var s = S(), a = st(), items = [], props = s.assets.filter(function (x) { return x.anc; });
      var worth = props.reduce(function (t, x) { return t + x.value; }, 0) + (a.inv || []).reduce(function (t, v) { return t + (v.value || v.amt || 0); }, 0);
      items.push({ info: true, html: '<div class="nw"><small>Wealth</small><div class="nw-big' + (s.money + worth < 0 ? ' neg' : '') + '">' + E.fmt(s.money + worth) + '</div><div class="nw-grid"><div><small>Silver</small><b>' + E.fmt(s.money) + '</b></div><div><small>Property & ventures</small><b>' + E.fmt(worth) + '</b></div></div><div class="bz-cap">Wealth is counted in pieces of silver, weighed on a merchant\'s scales. A farmhand earns about ' + E.fmt(sil(250)) + ' a year.</div></div>' });
      var stuck = me().age < 16 || thrall();
      var fixed = stuck || s.home.type === 'palace';
      items.push({ icon: '🏠', label: E.homeLabel(), sub: fixed ? 'Where I live' : 'Tap to move', disabled: fixed, onClick: moveMenu });
      if (props.length || (a.inv || []).length) {
        items.push({ section: 'What I own' });
        props.forEach(function (p) { items.push({ icon: p.icon, label: p.type, sub: p.where || '', right: E.fmt(p.value), onClick: function () { ui().choose(p.type, 'Sell it for ' + E.fmt(Math.round(p.value * 0.9)) + '?', [{ label: 'Sell', fn: function () { E.addMoney(Math.round(p.value * 0.9)); s.assets = s.assets.filter(function (x) { return x !== p; }); if (s.home.type === 'owned' && s.home.id === p.id) s.home = JSON.parse(JSON.stringify(TXT.rentHome)); done('I sold my ' + p.type.toLowerCase() + '.'); } }]); } }); });
        (a.inv || []).forEach(function (v) { items.push({ icon: v.kind === 'farm' ? '🐄' : v.kind === 'loan' ? '🪙' : '⛵', label: v.kind === 'farm' ? 'Farm with livestock' : v.kind === 'loan' ? 'Silver lent to ' + v.who : 'Trading voyage to ' + v.to, sub: v.kind === 'farm' ? 'Earns every year' : 'Due in ' + E.yearLabel(v.due), right: E.fmt(v.value || v.amt) }); });
      }
      if (stuck) { if (thrall()) items.push({ info: true, html: '<p class="muted">Thralls own nothing but what their master allows.</p>' }); return items; }
      items.push({ section: 'Buy' });
      BUY.forEach(function (b) {
        var cost = sil(b[3]);
        items.push({ icon: b[0], label: b[1], sub: b[2], right: E.fmt(cost), onClick: function () {
          if (s.money < cost) return done(nope('I can\'t afford that.'));
          E.addMoney(-cost);
          var asset = { id: U.uid(), kind: b[4] ? 'house' : 'item', anc: true, icon: b[0], type: b[1], name: b[1], where: b[4] ? 'in ' + s.city : '', value: cost, price: cost, cond: 100, upkeep: 0.01 };
          s.assets.push(asset);
          if (b[4]) { s.home = { type: 'owned', id: asset.id }; E.achieve('homeowner'); }
          if (b[1] === 'Ulfberht sword') me().athl = Math.min(100, me().athl + 2);
          done(good('I bought ' + E.an(b[1].toLowerCase()) + '! ' + b[0]));
        } });
      });
      items.push({ section: 'Invest' });
      items.push({ icon: '🐄', label: 'Buy a farm with livestock', sub: 'Cattle and sheep earn every year, unless winter kills them', right: E.fmt(sil(6000)), onClick: function () { var c = sil(6000); if (s.money < c) return done(nope('I can\'t afford a farm.')); E.addMoney(-c); a.inv.push({ kind: 'farm', value: c }); done('I bought a farm with cattle, sheep and good hay meadows. 🐄'); } });
      items.push({ icon: '⛵', label: 'Send traders east or west', sub: 'Hedeby, Dublin, or down the rivers to Miklagard', onClick: function () { invest('voyage'); } });
      items.push({ icon: '🪙', label: 'Lend silver', sub: '20% interest, if they come back', onClick: function () { invest('loan'); } });
      return items;
    });
  }
  function invest(kind) {
    var s = S();
    ui().choose(kind === 'voyage' ? 'Trading voyage' : 'Lend silver', 'How much of my ' + E.fmt(s.money) + ' should I put in?', [0.1, 0.25, 0.5].map(function (f) {
      return { label: Math.round(f * 100) + '% (' + E.fmt(Math.round(money() * f)) + ')', fn: function () {
        var amt = Math.round(money() * f);
        if (amt < sil(100)) return done(nope('That\'s not enough to bother with.'));
        E.addMoney(-amt);
        var v = { kind: kind, amt: amt, due: y() + 1 };
        if (kind === 'voyage') { v.to = U.pick(['Hedeby', 'Birka', 'Dublin', 'Novgorod', 'Miklagard', 'the Volga markets']); done('My traders set out for ' + v.to + ' with furs, amber and walrus ivory. ⛵'); }
        else { var c = D.country(s.country); v.who = U.pick(c.male) + ' ' + U.pick(c.last); done('I lent ' + E.fmt(amt) + ' to ' + v.who + '.'); }
        st().inv.push(v);
      } };
    }));
  }
  function moveMenu() {
    var s = S();
    ui().choose('Where should I live?', 'Rent is paid every year.', [['parents', 'Live with my family'], ['bench', HOMES.bench[0] + ' (' + E.fmt(sil(HOMES.bench[1])) + '/yr)'], ['turf', HOMES.turf[0] + ' (' + E.fmt(sil(HOMES.turf[1])) + '/yr)'], ['farm', HOMES.farm[0] + ' (' + E.fmt(sil(HOMES.farm[1])) + '/yr)']].map(function (h) {
      return { label: h[1], fn: function () {
        if (h[0] === 'parents') { if (!E.parentsAround().length) return done(nope('My parents are gone.')); s.home = { type: 'parents' }; return done('I moved back in with my family.'); }
        var tier = { bench: 0, turf: 1, farm: 2 }[h[0]];
        s.home = { type: 'rent', tier: tier, anc: h[0], mult: HOMES[h[0]][1] * 50 / E.RENT_TIERS[tier][1] };
        done('I moved into ' + HOMES[h[0]][0].toLowerCase() + '.');
      } };
    }));
  }

  // ------------------------------------------------------------ activities
  var GODS = [['👁️', 'Odin', 'wisdom and war'], ['🔨', 'Thor', 'strength and storms'], ['🌾', 'Freyr', 'harvest and plenty'], ['💛', 'Freyja', 'love and beauty'], ['🌊', 'Njord', 'the sea']];
  function activitiesMenu() {
    ui().menu('Activities', function () {
      var s = S(), a = st(), age = me().age, items = [], free = !thrall();
      items.push({ section: 'Mind & Body' });
      if (age >= 8) items.push({ icon: '🤼', label: 'Wrestle (glíma)', onClick: function () { var f = 1 / (1 + count('v_glima')); bump('v_glima'); me().athl = Math.min(100, me().athl + Math.round(4 * f)); E.stat('health', 2 * f); done(U.chance(0.5) ? 'I threw my opponent with a hip toss. The crowd cheered. 🤼' : 'I ended up flat on my back in the mud.'); } });
      if (age >= 6) items.push({ icon: '🏊', label: 'Swim in the fjord', sub: 'The water is freezing', onClick: function () { var f = 1 / (1 + count('v_swim')); bump('v_swim'); E.stat('health', 3 * f); me().athl = Math.min(100, me().athl + Math.round(2 * f)); done('I swam out to the skerry and back. My skin turned blue. 🥶'); } });
      if (age >= 7) items.push({ icon: '♟️', label: 'Play hnefatafl', sub: 'The king\'s table game', onClick: function () { var f = 1 / (1 + count('v_tafl')); bump('v_tafl'); E.stat('smarts', 3 * f); done(U.chance(0.5) ? 'My king escaped to the corner. I won!' : 'My king was surrounded and captured.'); } });
      items.push({ section: 'Learning' });
      if (age >= 8 && !a.edu) items.push({ icon: 'ᚱ', label: 'Learn runes from a rune-master', sub: 'Carving letters, charms and memorials', right: E.fmt(sil(20)), onClick: function () { if (count('v_runes')) return done(nope('I already had my lessons this year.')); bump('v_runes'); var c = sil(20); if (s.money < c && !great()) return done(nope('The rune-master wants ' + E.fmt(c) + '.')); if (!great()) E.addMoney(-c); E.stat('smarts', U.rand(3, 6)); if (U.chance(0.45)) { a.edu = 'runes'; return done(good('I can carve and read the runes now! ᚱ')); } done('I carved my first runes into a bone. Most of them backwards.'); } });
      if (age >= 6) items.push({ icon: '📜', label: 'Learn the sagas and laws', sub: 'Everything is remembered, nothing written', onClick: function () { var f = 1 / (1 + count('v_saga')); bump('v_saga'); E.stat('smarts', 3 * f); done('An old man taught me ' + U.pick(['the tale of Sigurd the dragon-slayer', 'the laws of the Thing, word for word', 'the deeds of my grandfather', 'how the world will end at Ragnarök']) + '.'); } });
      if (a.edu) items.push({ info: true, html: '<p class="muted">I can carve and read the runes.</p>' });
      items.push({ section: 'Health' });
      items.push({ icon: '🌿', label: 'See a healer', sub: s.conditions.length ? s.conditions.map(illName).join(', ') : 'Herbs, charms and runes', onClick: physician });
      items.push({ section: 'Fun & Social' });
      if (age >= 14) items.push({ icon: '🍺', label: 'Feast in the longhouse', sub: 'Mead, boasting and songs', onClick: function () { var f = 1 / (1 + count('v_feast')); bump('v_feast'); E.stat('happy', 7 * f); if (U.chance(0.1)) { E.stat('health', -5); return done(bad('A boasting contest became a brawl. Someone threw a bench at me.')); } done(U.pick(['I drank from a horn passed around the hall and boasted of my deeds.', 'A skald recited the deeds of our ancestors while we feasted.', 'We drank to Odin, to Thor and to the dead.'])); } });
      if (age >= 8) items.push({ icon: '🐎', label: 'Go to a horse fight', sub: 'Stallions fight while the crowd bets', onClick: function () { var f = 1 / (1 + count('v_horse')); bump('v_horse'); E.stat('happy', 6 * f); done(U.pick(['The two stallions reared and bit until one fled. The crowd roared.', 'Two owners started fighting each other after the horse fight. Very entertaining.', 'My uncle\'s stallion won! He was impossible all week.'])); } });
      if (age >= 12) items.push({ icon: '🎲', label: 'Gamble at dice', onClick: dice });
      if (age >= 15 && free) items.push({ icon: '⚖️', label: 'Speak at the Thing', sub: 'The assembly of free men and women', onClick: function () { if (count('v_thing')) return done(nope('The Thing only meets once a year.')); bump('v_thing'); var ok = U.chance(0.35 + me().smarts / 250 + (great() ? 0.15 : 0)); if (ok) { E.fame(3); E.karma(1); return done(good('I spoke about ' + U.pick(['a boundary dispute', 'the price of wergild', 'whether to raid in the west', 'the old law of inheritance']) + '. The assembly clashed their weapons in agreement.')); } done('I spoke at the Thing. Someone shouted me down.'); } });
      items.push({ section: 'The Gods' });
      if (!christian()) items.push({ icon: '🔥', label: 'Make a blót', sub: 'A sacrifice to the gods', onClick: function () { ui().choose('Which god?', 'Choose whom to honor.', GODS.map(function (g) { return { label: g[0] + ' ' + g[1] + ', god' + (g[1] === 'Freyja' ? 'dess' : '') + ' of ' + g[2], fn: function () { blot(g); } }; })); } });
      if (!christian() && age >= 12) items.push({ icon: '🔮', label: 'Ask a völva about my fate', right: E.fmt(sil(10)), onClick: function () { if (count('v_fate')) return done(nope('One fate a year is enough to bear.')); bump('v_fate'); E.addMoney(-Math.min(money(), sil(10))); done(U.pick(['"You will cross the sea and come home richer," she said.', '"Beware a man with red hair," she said, and would say no more.', '"You will die old, in your bed," she said. I didn\'t know whether to be glad.', '"Your name will be remembered," she said.'])); } });
      if (christian() || y() >= 965) items.push({ icon: '⛪', label: christian() ? 'Go to church' : 'Visit the priest of the White Christ', onClick: function () { var f = 1 / (1 + count('v_church')); bump('v_church'); E.karma(Math.round(2 * f)); done(christian() ? 'The priest sang in Latin. I prayed for the souls of my ancestors, who never knew Christ.' : 'The priest told me of a god who died on a tree, like Odin. I\'m thinking about it.'); } });
      if (!christian() && y() >= 965 && age >= 12) items.push({ icon: '✝️', label: 'Be baptized', sub: 'Follow the White Christ', onClick: function () { a.faith = 'christian'; E.karma(3); done('I was dunked three times in the river. I wear a little cross now, though I still have Thor\'s hammer in my pouch.'); } });
      if (age >= 10 && !a.rule) {
        items.push({ section: 'Crime' });
        [['🐑', 'Steal sheep', 0.6, 10, 60, 12], ['🪙', 'Rob a traveler', 0.5, 20, 300, 14], ['⚱️', 'Rob a grave mound', 0.45, 50, 2000, 16], ['🔥', 'Burn a rival\'s hall', 0.4, 100, 1500, 18]].forEach(function (c) {
          items.push({ icon: c[0], label: c[1], disabled: age < c[5], onClick: function () { crime(c); } });
        });
      }
      items.push({ section: 'Life' });
      if (age >= 16 && free && !a.rule) items.push({ icon: '🧭', label: 'Sail west to new lands', sub: 'Iceland, Greenland, or beyond', onClick: westward });
      if (age >= 18 && free && !a.rule) items.push({ icon: '🧭', label: 'Move somewhere else', onClick: function () { ui().choose('Move where?', 'A new start somewhere else in the North.', U.shuffle(REGIONS.concat(TOWNS).filter(function (x) { return x !== s.city; })).slice(0, 5).map(function (city) { return { label: city, fn: function () { s.city = city; E.log('🧭 I moved to ' + city + '.'); done('I loaded my things on a boat and moved to ' + city + '.'); } }; })); } });
      if (TL.maps) items.push({ icon: '🗺️', label: 'Map of the North', sub: a.rule ? 'My kingdom and my wars' : 'Who holds what in ' + E.yearLabel(y()), onClick: TL.maps.menu });
      items.push({ icon: '⏳', label: 'Time Machine', sub: E.tmAges().length ? 'Go back up to ' + U.plural(E.tmAges().length, 'year') : 'Age up to charge it', disabled: !E.tmAges().length, onClick: function () { ui().timeMachine(); } });
      items.push({ icon: '🏆', label: 'Achievements', onClick: TL.actions.achievementsMenu });
      return items;
    });
  }
  function physician() {
    var s = S();
    ui().menu('Healer', function () {
      var items = [{ info: true, html: '<p class="muted">Norse healing: herbs, hot stones, healing runes and charms. Some of it even works.</p>' }];
      items.push({ icon: '🩺', label: 'Get looked over', right: E.fmt(sil(8)), onClick: function () { if (count('v_doc')) return done(nope('The healer has seen enough of me this year.')); bump('v_doc'); E.addMoney(-sil(8)); E.stat('health', 2); done('The healer ' + U.pick(['gave me a broth of onions and sniffed the wound', 'carved healing runes on a bone and tied it to my arm', 'made me sweat in a hot stone bath', 'gave me yarrow and angelica']) + '.'); } });
      s.conditions.forEach(function (n) {
        var ill = D.illness(n) || { cure: 0.4 };
        if (ill.incurable || !ill.cure) {
          items.push({ icon: '🌿', label: 'Ease ' + illName(n).toLowerCase(), sub: 'No cure, but herbs help', right: E.fmt(sil(15)), onClick: function () {
            if (count('v_treat' + n)) return done(nope('That has to wait until next year.'));
            bump('v_treat' + n); E.addMoney(-sil(15)); E.stat('health', U.rand(3, 7));
            done('The healer\'s herbs eased my ' + illName(n).toLowerCase().replace(/^(an?|the) /, '') + ' for a while.');
          } });
          return;
        }
        items.push({ icon: '🌿', label: 'Treat ' + illName(n).toLowerCase(), sub: Math.round(ill.cure * 50) + '% chance it works', right: E.fmt(sil(25)), onClick: function () {
          if (count('v_treat' + n)) return done(nope('That has to wait until next year.'));
          bump('v_treat' + n); E.addMoney(-sil(25));
          if (U.chance(ill.cure * 0.5)) { E.removeCondition(n); E.stat('health', 6); return done(good('The healing worked. I\'m over my ' + illName(n).toLowerCase().replace(/^(an?|the) /, '') + '.')); }
          done(bad('The remedy did nothing.'));
        } });
      });
      return items;
    });
  }
  function dice() {
    var s = S(), bet = sil(4);
    bump('v_dice');
    if (s.money < bet) return done(nope('I don\'t even have ' + E.fmt(bet) + ' to bet.'));
    if (U.chance(0.45)) { E.addMoney(bet); return done('I threw two sixes! I won ' + E.fmt(bet) + '. 🎲'); }
    E.addMoney(-bet); done('I lost ' + E.fmt(bet) + ' at dice.');
  }
  function blot(g) {
    var s = S();
    if (count('v_blot')) return done(nope('I\'ve already made my sacrifice this year.'));
    bump('v_blot'); E.addMoney(-Math.min(money(), sil(5))); E.karma(1);
    var lucky = U.chance(0.35);
    if (g[1] === 'Odin' && lucky) { E.stat('smarts', 3); return done(good('I hung an offering in the sacred grove. That night Odin\'s ravens seemed to watch me. I feel wiser. 👁️')); }
    if (g[1] === 'Thor' && lucky) { me().athl = Math.min(100, me().athl + 3); return done(good('Thunder rolled as I poured the blood on the stones. Thor gave me strength. 🔨')); }
    if (g[1] === 'Freyr' && lucky) { var c = sil(U.rand(20, 100)); E.addMoney(c); return done(good('Freyr blessed my fields. The harvest was rich: ' + E.fmt(c) + '. 🌾')); }
    if (g[1] === 'Freyja' && lucky) { E.stat('looks', 3); E.stat('happy', 5); return done(good('Freyja smiled on me. I feel beautiful. 💛')); }
    if (g[1] === 'Njord' && lucky) { st().njord = y(); return done(good('Njord accepted my offering. The sea will be kind to me this year. 🌊')); }
    E.stat('happy', 3);
    done('I sacrificed ' + U.pick(['a goat', 'a horse', 'mead and bread', 'a boar']) + ' to ' + g[1] + ' and shared the meat at the feast.');
  }
  function westward() {
    var s = S(), a = st(), yr = y(), opts = [];
    if (yr >= 874 && s.city !== 'Iceland') opts.push({ label: '🌋 Settle in Iceland (' + E.fmt(sil(300)) + ' passage)', fn: function () { settle('Iceland', 300); } });
    if (yr >= 985 && s.city !== 'Greenland') opts.push({ label: '🧊 Settle in Greenland (' + E.fmt(sil(400)) + ' passage)', fn: function () { settle('Greenland', 400); } });
    if (yr >= 1000) opts.push({ label: '🌲 Sail to Vinland (' + E.fmt(sil(600)) + ')', fn: vinland });
    if (!opts.length) return done(nope('Nobody has found land to the west yet. ' + (yr < 874 ? 'Sailors talk of an island of fire and ice somewhere out there.' : '')));
    ui().choose('Sail west', 'The open ocean is dangerous. Many ships never arrive.', opts);
  }
  function settle(where, cost) {
    var s = S(), a = st(), c = sil(cost);
    if (s.money < c) return done(nope('The passage costs ' + E.fmt(c) + '.'));
    if (count('v_west')) return done(nope('One voyage a year is enough.'));
    bump('v_west'); E.addMoney(-c);
    if (U.chance(st().njord === y() ? 0.02 : 0.06)) { E.die('drowning in the western ocean'); return done(bad('Our ship was lost in a storm on the way to ' + where + '.')); }
    s.city = where; a.voyages.push(where);
    var farm = { id: U.uid(), kind: 'house', anc: true, icon: '🛖', type: 'Land-take farm', name: 'Land-take farm', where: 'in ' + where, value: sil(2000), price: 0, cond: 100, upkeep: 0.01 };
    s.assets.push(farm); s.home = { type: 'owned', id: farm.id };
    E.achieve('settler'); see('Settled in ' + where, where === 'Iceland' ? '🌋' : '🧊');
    done(good('I threw my high-seat pillars overboard near the coast of ' + where + ' and built my farm where they washed ashore. All the land I could walk around in a day is mine.'));
  }
  function vinland() {
    var s = S(), a = st(), c = sil(600);
    if (s.money < c) return done(nope('An expedition to Vinland costs ' + E.fmt(c) + '.'));
    if (count('v_west')) return done(nope('One voyage a year is enough.'));
    bump('v_west'); E.addMoney(-c);
    var r = U.rand(1, 100);
    if (r <= 12) { E.die(U.pick(['skraeling arrows in Vinland', 'drowning in the western ocean'])); return done(bad('We never came back from Vinland.')); }
    a.voyages.push('Vinland'); E.achieve('vinland'); see('Sailed to Vinland', '🌲'); E.fame(5);
    if (r <= 35) { E.stat('health', -U.rand(8, 20)); return done('We reached Vinland, but the skraelings came in their skin boats and drove us off. We came home with nothing but stories.'); }
    var g = sil(U.rand(800, 3000)); E.addMoney(g);
    done(good('We reached Vinland: forests to the sky and wild grapes everywhere. We came home with a ship full of timber worth ' + E.fmt(g) + '. 🌲'));
  }
  function crime(c) {
    var s = S();
    bump('v_crime'); s.counts.crimes++; E.karma(c[0] === '🔥' ? -10 : -3);
    if (U.chance(c[2] + me().athl / 400)) { var g = sil(U.rand(c[3], c[4])); E.addMoney(g); return done(c[0] === '⚱️' ? 'I dug into the old mound at night and came out with ' + E.fmt(g) + ' in grave goods. I hope the dead man doesn\'t come for them. 🤫' : 'I got away with ' + E.fmt(g) + '. 🤫'); }
    s.record.push({ crime: c[1], year: s.year });
    if (c[4] >= 1000 && U.chance(0.5)) { s.pending.push({ id: 'v_trial', data: { crime: c[1] } }); return done(bad('I was caught. My accusers will bring the case to the Thing.')); }
    if (U.chance(0.4)) { E.stat('health', -U.rand(10, 20)); return done(bad('I was caught red-handed and beaten half to death by the owner and his sons.')); }
    var fine = Math.min(money(), sil(U.rand(20, 200))); E.addMoney(-fine);
    done(bad('I was caught and had to pay ' + E.fmt(fine) + ' in compensation.'));
  }

  // ---- relationships: things to do together, and weddings
  var ACTS = [['🍺', 'Share mead in the longhouse', 50, ['Outgoing', 'Funny'], ['Shy'], 'shared mead with', 10], ['🐎', 'Watch a horse fight', 0, ['Athletic', 'Outgoing'], ['Kind'], 'watched a horse fight with', 8],
    ['♟️', 'Play hnefatafl', 0, ['Smart', 'Stubborn'], [], 'played hnefatafl with', 8], ['🎣', 'Fish in the fjord', 0, ['Cheerful'], [], 'went fishing with', 6],
    ['🔥', 'Hear the sagas by the fire', 0, ['Artsy', 'Romantic'], [], 'listened to the sagas with', 10], ['🏊', 'Swim in the fjord', 0, ['Athletic'], ['Moody'], 'swam in the fjord with', 6],
    ['🎲', 'Play dice', 0, ['Greedy', 'Funny'], ['Shy'], 'played dice with', 12], ['🔥', 'Dance at the midsummer bonfire', 0, ['Romantic', 'Cheerful'], ['Shy'], 'danced at the midsummer bonfire with', 8]];
  var KID_ACTS = [['🛷', 'Go sledding', 0, ['Athletic'], [], 'went sledding with'], ['⚔️', 'Play with wooden swords', 0, [], [], 'played with wooden swords with'], ['🐕', 'Play with the dog', 0, [], [], 'played with the dog with']];
  var OLD_ACTS = [['🔥', 'Tell tales by the fire', 0, ['Loyal', 'Kind'], [], 'told tales by the fire with'], ['♟️', 'Play hnefatafl', 0, ['Smart', 'Stubborn'], [], 'played hnefatafl with'], ['🌊', 'Walk along the shore', 0, ['Cheerful'], [], 'walked along the shore with']];
  function acts(kind) { return kind === 'kid' ? KID_ACTS : kind === 'old' ? OLD_ACTS : ACTS; }
  var WEDDINGS = [['🔥', 'Simple vows by the hearth', 100], ['🍺', 'A wedding feast with plenty of mead', 3000], ['🛡️', 'A great feast in the jarl\'s hall', 30000], ['👑', 'A royal wedding', 150000]];

  // ------------------------------------------------------------ events
  function def(id, o) { o.id = id; o.ancient = 'viking'; o.w = o.w || 10; TL.events.defs[id] = o; }
  function sdef(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  def('v_feud', { min: 16, w: 5, build: function () {
    var c = D.country(S().country), foe = U.pick(c.male) + ' ' + patronym(U.pick(c.male), 'M');
    return { icon: '🩸', title: 'A blood feud', text: foe + '\'s kinsmen killed a cousin of mine in a quarrel over a boundary stone. My family expects vengeance.', choices: [
      { label: 'Take revenge', run: function () { E.karma(-5); E.fame(2); if (U.chance(0.25)) { E.stat('health', -U.rand(10, 25)); return bad('I killed one of them, but took a deep wound. The feud goes on.'); } return 'I killed one of his kinsmen and announced it openly, as the law requires. Honor is satisfied, for now.'; } },
      { label: 'Ask the Thing for wergild', run: function () { E.karma(3); var g = sil(U.rand(50, 300)); E.addMoney(g); return good('The Thing ordered ' + foe + ' to pay my family ' + E.fmt(g) + ' in wergild. The feud is over.'); } },
      { label: 'Let it go', run: function () { E.people(['mother', 'father', 'sibling']).forEach(function (p) { E.rel(p, -8); }); E.stat('happy', -4); return 'My family says I have no honor.'; } }
    ] };
  } });
  def('v_holmgang', { notRuler: true, min: 17, max: 50, w: 4, cond: function () { return male() && !thrall(); }, build: function () {
    return { icon: '⚔️', title: 'Holmgang!', text: 'A berserker challenged me to a duel on a small island. If I refuse, everyone will call me a coward. If I lose, he takes everything I own.', choices: [
      { label: 'Fight him', run: function () { var p = 0.4 + (me().athl - 50) / 150; if (U.chance(p)) { var g = sil(U.rand(100, 600)); E.addMoney(g); E.fame(4); return good('Three shields broke, but I cut him down. His goods are mine: ' + E.fmt(g) + '.'); } if (U.chance(0.3)) { valhalla('a holmgang'); return bad('His axe came down and the world went dark.'); } E.addMoney(-Math.round(money() * 0.5)); E.stat('health', -U.rand(15, 30)); return bad('I fell bleeding before the third shield broke. He took half of what I own.'); } },
      { label: 'Refuse', run: function () { E.fame(-3); E.stat('happy', -6); return 'Men call me "níðingr", a coward, behind my back.'; } }
    ] };
  } });
  def('v_winter', { min: 3, w: 4, build: function () {
    return { icon: '❄️', title: 'Fimbulwinter', text: 'The snow came early and stayed until summer. The animals are starving in their stalls.', choices: [
      { label: 'Slaughter the cattle', run: function () { E.addMoney(-Math.min(money(), sil(U.rand(20, 80)))); return 'We ate the cattle to survive. Next year will be hard.'; } },
      { label: 'Ration everything', run: function () { E.stat('health', -U.rand(4, 12)); return 'We lived on dried fish and bark bread until the thaw.'; } }
    ] };
  } });
  def('v_bear', { min: 10, w: 2, build: function () {
    return { icon: '🐻', title: 'A bear!', text: 'A great brown bear came out of the forest onto the path in front of me.', choices: [
      { label: 'Stand and fight', run: function () { if (U.chance(0.3 + me().athl / 300)) { E.fame(4); E.addMoney(sil(U.rand(40, 120))); return good('I killed it with my spear. I\'ll wear its skin, and everyone will hear about it.'); } E.stat('health', -U.rand(15, 35)); return bad('It mauled me before it lumbered off.'); } },
      { label: 'Back away slowly', run: function () { return 'It watched me go. My heart did not slow down until I got home.'; } }
    ] };
  } });
  def('v_trader', { min: 14, w: 4, build: function () {
    return { icon: '🪙', title: 'A trader from the east', text: 'A trader just back from the Volga is selling ' + U.pick(['Arab silver coins', 'silk from Serkland', 'glass beads from Miklagard', 'a sword of Frankish steel']) + '.', choices: [
      { label: 'Buy something fine', run: function () { var c = Math.min(money(), sil(U.rand(30, 120))); E.addMoney(-c); E.stat('happy', 5); E.stat('looks', 1); return 'I paid ' + E.fmt(c) + '. Everyone at the next feast asked about it.'; } },
      { label: 'Just listen to his stories', run: function () { E.stat('smarts', 1); return 'He told me of a city with a golden gate and a caliph in Baghdad who has more silver than all of Norway.'; } }
    ] };
  } });
  def('v_mead', { min: 15, w: 4, build: function () {
    return { icon: '🍺', title: 'A drinking contest', text: 'A visiting jarl\'s champion boasts that nobody in our hall can out-drink him.', choices: [
      { label: 'Take him on', run: function () { if (U.chance(0.45)) { E.fame(2); E.stat('happy', 6); return good('He slid under the table first. The hall chanted my name.'); } E.stat('health', -4); return 'I woke up in the hay with the pigs. He was still drinking.'; } },
      { label: 'Watch and laugh', run: function () { E.stat('happy', 3); return 'Three men tried. All three ended up under the table.'; } }
    ] };
  } });
  def('v_storm', { min: 15, w: 3, cond: function () { return S().job && S().job.career === 'v_raid'; }, build: function () {
    return { icon: '🌊', title: 'Storm at sea', text: 'A storm caught our ship in open water. Waves are crashing over the side.', choices: [
      { label: 'Bail and pray to Njord', run: function () { if (U.chance(st().njord === y() ? 0.97 : 0.88)) return 'We bailed all night with our helmets. At dawn the sea calmed.'; E.die('drowning in a storm at sea'); return bad('The ship broke apart.'); } },
      { label: 'Throw the plunder overboard', run: function () { E.addMoney(-Math.round(money() * 0.15)); return 'We lightened the ship and rode out the storm, poorer but alive.'; } }
    ] };
  } });
  def('v_marriage', { notRuler: true, min: 15, max: 35, w: 7, cond: function () { return !E.partner() && !thrall(); }, build: function () {
    var c = D.country(S().country), g = me().interest === 'A' ? (U.chance(0.5) ? 'M' : 'F') : me().interest, first = U.pick(g === 'M' ? c.male : c.female), last = patronym(U.pick(c.male), g);
    return { icon: '💍', title: 'A marriage offer', text: 'My family has agreed a match with ' + first + ' ' + last + (great() ? ', who brings land and silver as a dowry.' : ', from a good farm.'), choices: [
      { label: 'Agree', run: function () { var p = E.addPerson({ role: 'spouse', gender: g, age: me().age + U.rand(-3, 8), rel: U.rand(40, 75) }); p.first = first; p.last = last; E.achieve('married'); E.stat('happy', 8); return good('We were married at a feast that went on for days. 💍'); } },
      { label: 'Refuse', run: function () { E.people(['mother', 'father']).forEach(function (p) { E.rel(p, -15); }); return 'My family is furious with me.'; } }
    ] };
  } });
  def('v_seeress', { min: 6, w: 3, cond: function () { return !christian(); }, build: function () {
    return { icon: '🔮', title: 'The wandering völva', text: 'A seeress came to our farm. She sat on the high seat and offered to tell everyone their fate.', choices: [
      { label: 'Ask about my future', run: function () { var r = U.rand(1, 3); if (r === 1) { E.stat('happy', 6); return good('"You will be famous across the North," she said.'); } if (r === 2) { E.stat('happy', -4); return '"Beware the sea," she said. I\'ve been nervous on boats ever since.'; } return '"Your fate is woven, but the thread is long," she said. Whatever that means.'; } },
      { label: 'Stay away from her', run: function () { return 'Some things are better not known.'; } }
    ] };
  } });
  def('v_baptism', { notRuler: true, min: 12, w: 6, cond: function () { var yr = y(); return !christian() && yr >= 960 && yr <= 1035; }, build: function () {
    var forced = (y() >= 995 && y() <= 1000) || (y() >= 1016 && y() <= 1030);
    return { icon: '✝️', title: forced ? 'Baptism or death' : 'The White Christ', text: forced ? 'The king\'s men are going farm to farm. Everyone must be baptized. Those who refuse are killed or maimed.' : 'A priest from England is preaching about the White Christ. Many of our neighbors have been baptized.', choices: [
      { label: 'Be baptized', run: function () { st().faith = 'christian'; E.karma(2); return 'I was baptized. I wear a cross now, though I still keep a little Thor\'s hammer.'; } },
      { label: 'Stay true to the old gods', run: function () { if (forced && U.chance(0.25)) { if (U.chance(0.4)) { E.die('the king\'s men, for refusing baptism'); return bad('They killed me at my own door.'); } E.stat('health', -25); return bad('They burned my farm and cut off my ear.'); } E.fame(1); return 'I will not abandon the gods of my fathers.'; } }
    ] };
  } });
  def('v_whale', { min: 10, w: 3, build: function () {
    return { icon: '🐋', title: 'A whale on the beach', text: 'A great whale washed up on the shore near our farm. By law it belongs to the landowner, but half the district is already there with knives.', choices: [
      { label: 'Claim my share', run: function () { var g = sil(U.rand(20, 120)); E.addMoney(g); return 'Meat, oil and bone for the whole winter. My share was worth ' + E.fmt(g) + '.'; } },
      { label: 'Help everyone fairly', run: function () { E.karma(4); E.fame(1); return 'I helped cut it up and share it out by the old law. People will remember that.'; } }
    ] };
  } });
  sdef('v_hardrada', { build: function () {
    return { icon: '⚔️', title: 'Harald Hardrada goes to England', text: 'King Harald Hardrada is sailing with 300 ships to conquer England. Every fighting man is called.', choices: [
      { label: 'Sail with the king', run: function () { see('Sailed with Harald Hardrada', '⚔️'); if (U.chance(0.6)) { valhalla('Stamford Bridge'); return bad('At Stamford Bridge the English surprised us without our armor. The king fell, and so did I.'); } E.fame(5); return 'At Stamford Bridge the English caught us without our mail. The king died. I was one of the few who made it back to the ships.'; } },
      { label: 'Stay home', run: function () { return 'Of 300 ships, they say only 24 came home.'; } }
    ] };
  } });
  sdef('v_sorcery', { build: function () {
    return { icon: '🔥', title: 'The king hunts sorcerers', text: 'King Olaf Tryggvason is rounding up seeresses and sorcerers. He has tied some to rocks at low tide and let the sea take them.', choices: [
      { label: 'Flee to Iceland', run: function () { S().city = 'Iceland'; E.quitJob(true); return 'I took the first ship west and gave up the staff.'; } },
      { label: 'Hide and keep practicing', run: function () { if (U.chance(0.35)) { E.die('drowning at the hands of King Olaf\'s men'); return bad('They found me.'); } return 'I hid in the mountains. The hunt passed me by.'; } }
    ] };
  } });
  sdef('v_freedom', { build: function () {
    return { icon: '🕊️', title: 'Freedom', text: st().master + ' called me in. "You have worked well. Brew your freedom-ale."', choices: [{ label: 'Drink my freedom-ale', run: function () { freeMe('master'); return good('I brewed the ale and drank it with my former master. I am free.'); } }] };
  } });
  sdef('v_trial', { build: function (d) {
    var crime = d && d.crime ? d.crime.toLowerCase() : 'a crime';
    return { icon: '⚖️', title: 'Before the Thing', text: 'I am accused of trying to ' + crime + '. The assembly will decide.', choices: [
      { label: 'Pay compensation', run: function () { var f = Math.round(money() * 0.4) + sil(100); E.addMoney(-f); return 'I paid ' + E.fmt(f) + ' to the injured family. The case is closed.'; } },
      { label: 'Challenge my accuser to holmgang', run: function () { if (U.chance(0.4 + (me().athl - 50) / 150)) { E.fame(3); return good('I won the duel, and with it the case.'); } if (U.chance(0.4)) { valhalla('a holmgang'); return bad('I lost the duel, and my life.'); } E.stat('health', -20); E.addMoney(-Math.round(money() * 0.5)); return bad('I lost. I paid double and limped home.'); } },
      { label: 'Accept outlawry', run: function () { var s = S(); E.addMoney(-Math.round(money() * 0.7)); s.assets = s.assets.filter(function (x) { return !x.anc || x.kind !== 'house'; }); if (s.home.type === 'owned') s.home = JSON.parse(JSON.stringify(TXT.rentHome)); s.city = U.pick(['Iceland', 'Dublin', 'Jorvik', 'Hedeby']); E.karma(-4); return 'I was declared an outlaw. Anyone may kill me in Norway, so I fled to ' + s.city + ' with almost nothing.'; } }
    ] };
  } });

  // ------------------------------------------------------------ the Thing chooses a king
  function thingOdds(bonus) {
    var k = king(y());
    return U.clamp(0.06 + S().fame / 300 + (great() ? 0.06 : 0) + (S().karma - 50) / 400 + (/Jarl$|Cnut/.test(k) ? 0.08 : 0) + (bonus || 0), 0.03, 0.6);
  }
  function thingClaim() {
    if (count('v_thing')) return done(nope('The Thing meets once a year, and it has heard me already.'));
    var old = king(y()), gold = sil(3000), j = S().job, boast = (S().fame >= 60 ? 0.06 : 0.02) + (j && j.career === 'v_raid' && j.level >= 3 ? 0.08 : 0) + me().athl / 1000;
    ui().choose('The Thing', 'The free farmers of every district have gathered. ' + U.cap(old) + ' rules today. How will I win them?', [
      { label: 'Swear to keep the old laws (' + Math.round(thingOdds(0) * 100) + '%)', fn: function () { claim(thingOdds(0)); } },
      { label: 'Give silver to every chieftain, ' + E.fmt(gold) + ' (' + Math.round(thingOdds(0.12) * 100) + '%)', fn: function () { if (S().money < gold) return done(nope('I need ' + E.fmt(gold) + ' in silver.')); E.addMoney(-gold); claim(thingOdds(0.12)); } },
      { label: 'Boast of my deeds (' + Math.round(thingOdds(boast) * 100) + '%)', fn: function () { claim(thingOdds(boast)); } }
    ]);
    function claim(odds) {
      var a = st();
      bump('v_thing');
      if (U.chance(odds)) {
        TL.coup.crown(coupCfg('throne')); a.ruled = a.rule; a.king = king(y()); see('Chosen king at the Thing', '⚖️');
        E.log('👑 The Thing took me as ' + (male() ? 'king' : 'queen') + ' of Norway.', 'good');
        ui().closeAll && ui().closeAll();
        return done(good('The farmers clashed their weapons on their shields. They took me as their ' + (male() ? 'king' : 'queen') + ', and ' + old + ' fled across the sea. 👑'));
      }
      if (U.chance(0.12)) { E.die('the king\'s men, after I claimed his crown at the Thing'); return done(bad('The farmers would not have me, and ' + old + ' did not forgive me. His men caught me on the road home.')); }
      if (U.chance(0.3)) { E.addMoney(-Math.round(Math.max(0, S().money) * 0.4)); E.quitJob(true); S().city = U.pick(['Iceland', 'Orkney', 'Dublin']); E.fame(3); return done(bad('The farmers would not have me, and ' + old + ' had me outlawed. I fled to ' + S().city + ' with what I could carry.')); }
      E.fame(-2);
      done(bad('The farmers listened politely and went home. Not this year.'));
    }
  }
  // Born to the king (js/eras.js, TL.dynasty): the words of a royal heir's life.
  function royalCfg() {
    return { ruler: ['King', 'Queen'], consort: ['King Consort', 'Queen'], heir: ['King\'s son', 'King\'s daughter'], deposed: ['Deposed King', 'Deposed Queen'], retired: ['Old King', 'Old Queen'],
      usurper: function (first) { return first + ' ' + patronym(U.pick(D.country('Viking Norway').male), 'M'); },
      allowance: sil(5000), treasury: 'the king\'s hoard', edu: 'runes',
      cls: 'jarl', city: 'Vestfold', realm: 'Norway', section: 'Heir to the crown', greatName: 'The jarls', peopleName: 'The farmers', regent: 'the jarls of the royal hall',
      born: '👑 I was born in the royal hall, the firstborn of {ruler}. One day all Norway will be mine.',
      succeed: '👑 {ruler}, my {kin}, is dead. At the Thing the farmers clashed their weapons on their shields and took me as their {titlel}.',
      deaths: ['battle', 'a storm at sea', 'a fever', 'a blood feud', 'an ambush in the mountains'],
      killed: 'battle', depose: null,
      learn: ['ᚱ', 'Sit beside the king at the Thing', 'Learn the law and how to speak to free men', ['I sat beside the king while the lawspeaker recited the law. I learned it by heart.', 'I watched the king settle a blood feud with silver instead of axes.', 'The king\'s steward taught me who owes what, and who hates whom.']],
      show: ['🍖', 'Feast the farmers of the district', 'Free men choose their kings', sil(1500), ['Oxen roasted all night. The farmers drank to my health.', 'I judged a quarrel between two farmers fairly. Word spread up and down the fjords.', 'I gave a midwinter feast. Nobody went home hungry or sober.']],
      great: ['💍', 'Give gold rings to the jarls', 'The men who will have to bend the knee', sil(1200), ['The jarl of Lade put my ring on his arm and swore to follow me.', 'Two jarls drank from my horn and called me their future king.', 'I gave a famous warrior a sword with a gold hilt. He will remember it.']],
      command: ['⛵', 'Lead the king\'s ships on a raid', 'Warriors follow kings who fought beside them', ['We came home with three ships heavy with silver. The skalds made a verse about me.', 'We beat a Danish fleet off Jutland. The warriors already call me ring-giver.'],
        ['The raid went badly and good men died. Some blame the king\'s young pup.', 'Storms drove us home with nothing. The warriors grumble.'], 'a spear on a raid'],
      step: ['👑', 'Ask my father for the crown', 'Old kings sometimes stepped aside', 'My {kin} gave me the crown before the Thing and sailed south on pilgrimage to Rome.',
        ['My {kin} laughed and said the crown would come with the funeral ale.', 'My {kin} asked if I wanted to fight for it. I said no. Not yet.', '"Patience," my {kin} said. "Wolves who wait eat best."']],
      news: ['⛵ {ruler} came home from a raid with ships full of silver.', '⚖️ {ruler} spoke at the Thing, and the farmers agreed.', '🔥 {ruler} burned the hall of a rebel jarl.', '🍖 {ruler} held a great midwinter feast.', 'ᚱ {ruler} raised a runestone for our forefathers.', '🌊 {ruler} lost two ships in a storm.'] };
  }

  // ------------------------------------------------------------ plots, revolts and reigns (js/eras.js)
  function coupCfg(kind) {
    var j = S().job, fem = !male(), a = st();
    var exile = function () { S().city = U.pick(['Iceland', 'Orkney', 'Dublin']); };
    if (kind === 'revolt') return { kind: 'revolt', title: 'Uprising', men: 'thrall', begin: 'I started talking about rising up with the other thralls.', exile: exile,
      intro: 'Thralls who rose against their masters were hunted down. But a farm is only as strong as its watchmen, and a hall burns easily at night.',
      recruit: ['⛓️', 'Win over other thralls', 'Each one has nothing to lose', '{n} more thralls swore to rise with us.'], bribe: null, army: null,
      strike: ['🔥', 'Burn the hall and run'],
      win: function () { freeMe('revolt'); E.fame(15); S().city = U.pick(['Iceland', 'Dublin', 'Jorvik']); see('Led a thrall uprising', '🔥'); return 'We set the hall alight and fled with the master\'s silver and a boat. We are free men and women in ' + S().city + ' now. 🔥'; },
      lose: { cause: 'the master\'s men, after a failed uprising', text: 'The master\'s men were waiting for us.', death: 'They killed every one of us.', spared: 'They beat me and put me in irons.' },
      caught: { cause: 'the master\'s men, for plotting an uprising', text: 'Someone told the master.', death: 'He had me killed as a warning.', spared: 'I was beaten and chained in the byre.' } };
    var old = king(y()), pre = old.indexOf('petty') >= 0;
    return { kind: 'throne', title: pre ? 'Uniting Norway' : 'Rebellion', men: 'jarl', begin: pre ? 'I set out to make myself king of all Norway.' : 'I began plotting to take the crown from ' + old + '.', exile: exile,
      intro: (pre ? 'No man has ever ruled all of Norway. The petty kings and jarls of every fjord would have to bow, or die. ' : 'Kings of Norway rarely die in bed. Win the jarls and the hird, and you might take the crown. ' + (a.rule ? '' : U.cap(old) + ' rules today.')),
      recruit: ['🤝', 'Win over the jarls', 'More strength, and a harder secret to keep', '{n} more jarls took my gold rings and swore to follow me.'],
      bribe: ['💰', 'Hire warriors', 'Danes, Swedes and anyone with an axe', sil(4000), 'Ship crews from across the North took my silver.'],
      army: j && ((j.career === 'v_hird' && j.level >= 1) || (j.career === 'v_raid' && j.level >= 2)) ? ['⛵', 'Call my ships and men', 'Crews sworn to me personally', 'My own crews sharpened their axes and waited for my word.'] : null,
      strike: ['⚔️', pre ? 'Make war on the petty kings' : 'Raise my banner against the king'],
      win: function () { TL.coup.crown(coupCfg('throne')); a.ruled = a.rule; a.king = king(y()); see('Took the crown of Norway', '👑'); E.log('👑 I am ' + (fem ? 'Queen' : 'King') + ' of Norway.', 'good'); return pre ? 'One by one the petty kings bent the knee or died. I am the first ' + (fem ? 'queen' : 'king') + ' of all Norway! 👑' : 'We met the king\'s ships and swept them from the sea. ' + U.cap(old) + ' is dead, and I am ' + (fem ? 'Queen' : 'King') + ' of Norway! 👑'; },
      lose: { cause: 'the king\'s axe, after a failed rebellion', text: 'My men broke and ran.', death: 'I was killed on the beach where we fought.', spared: 'I escaped with my life and a single ship, and was outlawed.' },
      caught: { cause: 'the king\'s men, for treason', text: 'One of my jarls betrayed me to the king.', death: 'The king\'s men burned my hall with me in it.', spared: 'I was outlawed and fled across the sea.' },
      rule: { career: 'v_king', cls: 'jarl', seat: 'the royal hall', popName: 'The farmers', guardName: 'The hird', realm: 'Norway', spy: sil(3000), taxcut: sil(8000),
        neighbors: ['the king of Denmark', 'the Swedes', 'the jarls of Orkney', 'the king of England', 'the Rus of Novgorod'],
        brides: ['a Danish princess', 'a daughter of the Swedish king', 'a princess of Kiev'], grooms: ['a Danish prince', 'a son of the Swedish king', 'a prince of Kiev'],
        disaster: ['🌊', 'The fleet is lost', 'A storm caught half my fleet at anchor and smashed the ships against the rocks.'],
        laws: [
          { id: 'thing', label: 'Make one law for all the Things', text: 'One law for all of Norway, proclaimed at every Thing.', fx: { guard: 8, fame: 4 } },
          { id: 'thralls', label: 'Free the thralls', text: 'No Norseman may own another. The jarls grumbled; the thralls wept.', fx: { pop: 8, guard: -10, karma: 10 } },
          { id: 'cross', label: 'Order all Norway baptized', text: 'Every farm must take the cross. The old temples are burning.', fx: { pop: -12, fame: 4 }, run: function () { a.faith = 'christian'; } },
          { id: 'gods', label: 'Protect the old gods', text: 'The temples will stand, and the blóts will go on as our fathers did them.', fx: { pop: 8, karma: 2 } },
          { id: 'town', label: 'Found a market town', text: 'A new market town on the fjord. Traders are already coming.', fx: { money: sil(10000), fame: 3 } },
          { id: 'leidang', label: 'Order every district to build a warship', text: 'Each district must build and crew a longship for the king.', fx: { guard: 10, pop: -6 } }],
        acts: [
        { id: 'rings', icon: '💍', label: 'Give gold rings to the hird', sub: 'A generous lord is a safe one', cost: sil(6000), fx: { guard: 22 }, text: 'I gave out gold arm-rings in the hall. The skalds will call me "ring-giver".' },
        { id: 'feast', icon: '🍖', label: 'Hold a great midwinter feast', sub: 'For the farmers of every district', cost: sil(5000), fx: { pop: 16, happy: 4 }, text: 'Oxen roasted for three days. Nobody went home sober.' },
        { id: 'stone', icon: 'ᚱ', label: 'Raise a great runestone', sub: 'Be remembered forever', cost: sil(10000), fx: { fame: 8 }, see: ['Raised a great runestone', 'ᚱ'], text: 'My runestone says that I made the Norse one people. It will stand for a thousand years.' },
        { id: 'purge', icon: '🪓', label: 'Kill a rival jarl', sub: 'Fear works, for a while', danger: true, fx: { guard: 12, pop: -8, karma: -12 }, text: 'My rival\'s hall burned with him inside. The other jarls are very polite to me now.' },
        { id: 'war', icon: '⛵', label: 'Lead a great raid', sub: 'Silver and glory, or disaster', cost: sil(8000), war: true, win: 'We came home with so much silver that the ships rode low in the water.', lose: 'The raid went badly. Many good men did not come home.', death: 'an arrow on a great raid' }],
        threat: { icon: '⚔️', title: 'A rival claims the crown', text: 'A rival with a fleet of longships has landed and claims the throne.', fight: 'Meet him at sea', won: 'We cleared his ships from the sea. His head is on a pole outside my hall.', cause: 'battle against a rival for the crown', died: 'I fell fighting at the prow of my ship.', flee: 'Flee to Orkney', fled: 'I fled across the sea. Someone else sits in the royal hall now.', caught: 'His ships caught mine before I reached open water.' } } };
  }

  // ------------------------------------------------------------ about & recap
  function aboutRows() { return [['🪓 Class', CLASS_NAME[st().cls]], ['👑 Ruler', U.cap(king(S().year))], ['🔥 Faith', christian() ? 'The White Christ' : 'The old gods']]; }
  function recapRow() {
    var a = st(), s = S(), out = [], hist = (s.jobHistory || []).concat(s.job ? [{ career: s.job.career }] : []);
    var had = function (id) { return hist.some(function (h) { return h.career === id; }); };
    var lg = TL.coup.legacy('Norway');
    if (lg) out.push(['👑', (male() ? 'King ' : 'Queen ') + lg.name, lg.text]);
    if (a.raids.length) out.push(['⛵', 'Viking', 'Raided ' + a.raids.slice(0, 3).join(', ') + (a.raids.length > 3 ? ' and more' : '')]);
    if (a.voyages.length) out.push(['🧭', 'Explorer', 'Sailed to ' + a.voyages.filter(function (v, i, arr) { return arr.indexOf(v) === i; }).join(', ')]);
    if (had('v_volva')) out.push(['🔮', 'Völva', 'Saw the fates of many']);
    if (a.saga) out.push(['🎶', 'Skald', 'Composed a drápa the North remembered']);
    if (a.valhalla) out.push(['⚔️', 'Valhalla', 'Died in battle and was carried to Odin\'s hall']);
    if (a.cls === 'freed') out.push(['🕊️', 'Freedom', a.freedHow === 'revolt' ? 'Won freedom by rising up' : 'Born a thrall, died free']);
    return out;
  }
  var TOPICS = [['raids and plunder', ['Athletic', 'Ambitious']], ['the old sagas', ['Artsy', 'Nerdy']], ['horses and horse fights', ['Athletic', 'Outgoing']], ['poetry', ['Artsy']],
    ['silver and trade', ['Greedy', 'Ambitious']], ['their dreams and goals', ['Ambitious', 'Romantic']], ['love and marriage', ['Romantic', 'Jealous']],
    ['jokes and gossip', ['Funny', 'Cheerful']], ['helping neighbors', ['Kind', 'Generous']], ['old memories', ['Loyal', 'Kind']],
    ['other people\'s scandals', ['Jealous', 'Mean']], ['how they\'re really feeling', ['Moody', 'Shy']], ['the jarls and the king', [], true], ['the old gods and the new', [], true], ['the weather', []]];
  var KID_TOPICS = [['trolls and giants', []], ['games in the snow', ['Lazy']], ['animals', ['Kind']], ['runes', ['Nerdy']], ['Thor and his hammer', ['Athletic']], ['their carvings', ['Artsy']]];
  var ACH = ['centenarian', 'millionaire', 'married', 'divorced', 'parent', 'bigfamily', 'homeowner', 'mogul', 'famous', 'petlover', 'saint', 'villain', 'gymrat', 'genius', 'heartbreaker', 'dynasty', 'survivor', 'retired', 'timetraveler', 'history_buff',
    'valhalla', 'vinland', 'sea_king', 'skald', 'settler', 'usurper', 'rebel', 'long_reign', 'conqueror', 'royal'];
  var ILL = { 'Common Cold': 'A Chill', 'Flu': 'A Fever', 'Ear Infection': 'An Earache', 'Chickenpox': 'The Pox', 'Strep Throat': 'A Sore Throat', 'Asthma': 'Short Breath',
    'Acne': 'Spots', 'Migraine': 'Head Pains', 'PTSD': 'Battle Dread', 'Depression': 'A Heavy Mood', 'Anxiety': 'A Troubled Mind', 'Insomnia': 'Sleeplessness',
    'Food Poisoning': 'Bad-Meat Sickness', 'Kidney Stones': 'The Stone', 'Pneumonia': 'The Lung Sickness', 'High Blood Pressure': 'Hot Blood',
    'Type 2 Diabetes': 'The Wasting Thirst', 'Arthritis': 'Stiff Joints', 'Heart Disease': 'A Weak Heart', 'Cancer': 'A Wasting Lump', 'Dementia': 'Dotage',
    'Osteoporosis': 'Brittle Bones', 'Chlamydia': 'A Shameful Sickness', 'Herpes': 'Sores', 'Broken Arm': 'A Broken Arm', 'Broken Leg': 'A Broken Leg',
    'Concussion': 'A Blow to the Head', 'Alcoholism': 'Too Much Mead', 'Gambling Addiction': 'A Love of Dice', 'Nicotine Addiction': 'A Bad Habit' };
  function illName(n) { return ILL[n] || n; }
  function birthOptions() { return [['viking', '🪓 The Viking Age · AD 770–1030']]; }
  var TXT = {
    matchSub: 'Families arrange most marriages', matchEvent: 'v_marriage',
    pranks: ['put a frog in their mead horn', 'hid their boots in the hay', 'tied their cloak to the bench', 'swapped their mead for seawater'],
    argue: ['money', 'chores', 'their attitude', 'the old gods and the new', 'a blood feud', 'who is the better skald', 'something they said years ago'],
    bored: 'They kept yawning the whole time.', partySick: 'We drank so much mead that I was sick for days.',
    dates: ['a feast in the longhouse', 'a horse fight', 'the Thing', 'a walk along the fjord', 'the midsummer bonfire', 'the market at Kaupang', 'a sleigh ride on the frozen lake'],
    gifts: [['🍯', 'A jar of honey', 100], ['🌸', 'A wreath of flowers', 150], ['🧣', 'A finely woven shawl', 600], ['📿', 'A string of glass beads', 1500], ['💍', 'A silver arm-ring', 20000], ['🐎', 'A horse', 150000]],
    pray: ['🙏 Make a blót to Freyja', 'I\'ve already made an offering to Freyja this year.', 'Freyja heard us!', 'We sacrificed to Freyja, goddess of love.'],
    adoptIcon: '🤲', adoptFee: ' in gifts to the child\'s kin.', lawyer: 'Lawspeaker\'s fee ',
    parentsGone: 'With my parents gone, I built a turf house of my own.', moveOut: 'a turf house', rentHome: { type: 'rent', tier: 1, anc: 'turf', mult: HOMES.turf[1] * 50 / 12000 },
    youngDeaths: ['a fever', 'drowning in the fjord', 'a fall from a cliff', 'a festering wound', 'a bear'],
    npcDeaths: { old: ['old age', 'a fever', 'a stroke', 'a wasting sickness'], young: ['a fever', 'the pox', 'drowning', 'an accident'], adult: ['a fever', 'drowning at sea', 'a feud', 'a festering wound', 'a raid'] },
    child: 'Child'
  };
  function txt(k) { return TXT[k]; }
  // Jarls and chieftains keep the family hall; thralls stay on their master's farm.
  function housed() { var c = st().cls; return c === 'jarl' || c === 'hersir' || c === 'thrall'; }
  // Continuing as my heir: the family keeps its standing (engine.continueAs).
  function heir(old, prev) {
    var a = st(), o = old || {};
    a.cls = o.cls === 'freed' ? 'karl' : o.cls || 'karl';
    if (a.cls === 'thrall') a.master = o.master;
    a.faith = o.faith || 'old';
    if (o.rule && TL.coup.inherits(o.rule)) { a.cls = 'jarl'; TL.coup.crown(coupCfg('throne')); a.ruled = a.rule; a.king = king(y()); E.log('👑 I inherited the crown. I am ' + (male() ? 'King' : 'Queen') + ' of Norway.', 'good'); return; }
    if (TL.dynasty.inherit(o, prev)) { a.king = king(y()); return; }
    a.king = king(y());
    if (great() && me().age >= 12) a.edu = 'runes';
    E.log(a.cls === 'thrall' ? '⛓️ Like my parent, I am a thrall on the farm of ' + a.master + '.' : '🪓 I am ' + E.an(CLASS_NAME[a.cls].toLowerCase()) + ', like my family before me.', a.cls === 'thrall' ? 'bad' : '');
  }

  return { on: on, st: st, setup: setup, yearly: yearly, jobYear: jobYear, salary: salary, title: title, career: career, npcJob: npcJob, homeLabel: homeLabel,
    occupationMenu: occupationMenu, assetsMenu: assetsMenu, activitiesMenu: activitiesMenu, acts: acts, WEDDINGS: WEDDINGS, aboutRows: aboutRows, recapRow: recapRow,
    king: king, birthOptions: birthOptions, illName: illName, txt: txt, heir: heir, housed: housed, coupCfg: coupCfg, royalCfg: royalCfg, CLASS_NAME: CLASS_NAME, TOPICS: TOPICS, KID_TOPICS: KID_TOPICS, ACH: ACH,
    id: 'viking', land: 'Viking Norway', years: [770, 1030], royalYears: [872, 1030], gentile: false, ad: true };
})();
