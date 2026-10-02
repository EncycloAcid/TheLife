/* TheLife — v1.26: Medieval England. A whole life in England between 1150
 * and 1420 on the same engine as every other life. Birth decides almost
 * everything: serfs (villeins) are bound to their lord's manor, free
 * peasants farm their own strips, townsfolk join the guilds, and the
 * gentry and nobles send their sons to be pages, squires and knights.
 * The Church is a way up for anyone with a sharp mind. History happens:
 * kings come and go, Magna Carta is sealed, the Great Famine and the Black
 * Death sweep the land, the peasants revolt, the longbowmen win at Crécy
 * and Agincourt, and the Wars of the Roses tear the kingdom apart.
 * State lives in S.anc (shared with js/ancient.js); the land is in D.ANCIENT. */
TL.eras = TL.eras || {};
TL.eras.medieval = (function () {
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
  // Amounts below are written in silver pennies; pen() turns them into game money.
  function pen(x) { return E.$(x * 50); }
  function on() { return !!(TL.S && E.ancient() === 'medieval'); }
  function st() {
    var s = S();
    return s.anc || (s.anc = { cls: 'free', edu: null, uni: 0, inv: [], tourney: 0, tourneyLost: 0, campaigns: [], pilgrimages: [], ransoms: 0 });
  }
  function y() { return S().year; }
  function male() { return me().gender === 'M'; }
  function serf() { var a = st(); return a.cls === 'villein' && !a.fled; }
  function gentle() { var c = st().cls; return c === 'noble' || c === 'gentry'; }
  function money() { return Math.max(0, S().money); }
  var CLASS_NAME = { noble: 'Noble', gentry: 'Gentry (a knightly family)', burgher: 'Townsfolk', free: 'Free peasant', villein: 'Serf (villein)' };

  // ------------------------------------------------------------ places
  var TOWNS = ['London', 'York', 'Norwich', 'Bristol', 'Winchester', 'Lincoln', 'Canterbury', 'Oxford', 'Coventry', 'Exeter', 'Chester', 'Durham', 'Southampton'];
  var VILLAGES = ['Ashby', 'Thornbury', 'Little Wickham', 'Elmstead', 'Oakley', 'Brightwell', 'Hawkridge', 'Barton', 'Kingsmead', 'Wolverton', 'Stoke Ferry', 'Middlecombe'];
  function town() { return TOWNS.indexOf(S().city) >= 0; }
  function place() { var s = S(); return serf() && st().lord ? 'on the manor of ' + st().lord : 'in ' + s.city; }

  // ------------------------------------------------------------ history
  var KINGS = [[1154, 'Henry II'], [1189, 'Richard the Lionheart'], [1199, 'John'], [1216, 'Henry III'], [1272, 'Edward I'], [1307, 'Edward II'], [1327, 'Edward III'], [1377, 'Richard II'],
    [1399, 'Henry IV'], [1413, 'Henry V'], [1422, 'Henry VI'], [1461, 'Edward IV'], [1470, 'Henry VI'], [1471, 'Edward IV'], [1483, 'Richard III'], [1485, 'Henry VII'], [1509, 'Henry VIII'], [1547, 'Edward VI']];
  function king(yr) { var k = KINGS[0][1]; KINGS.forEach(function (x) { if (yr >= x[0]) k = x[1]; }); return k; }
  // [year, icon, what happened, short label, only in these towns]
  var MOMENTS = [
    [1170, '🗡️', 'Four knights murdered Archbishop Thomas Becket in Canterbury Cathedral.', 'The murder of Becket'],
    [1173, '😇', 'The Pope made Thomas Becket a saint. Pilgrims began walking to Canterbury.', 'Saint Thomas of Canterbury'],
    [1187, '⚔️', 'Saladin captured Jerusalem. The Pope called for a new crusade.', 'The fall of Jerusalem'],
    [1189, '👑', 'Richard the Lionheart was crowned and set off on the Third Crusade.', 'The Third Crusade'],
    [1192, '⛓️', 'King Richard was captured in Austria on his way home from the Holy Land.', 'The captive king'],
    [1194, '💰', 'England paid a huge ransom to free King Richard. Everyone gave a quarter of their goods.', 'The king\'s ransom'],
    [1199, '🏹', 'King Richard was killed by a crossbow bolt at a siege in France.', 'The death of the Lionheart'],
    [1204, '🗺️', 'King John lost Normandy to the King of France.', 'The loss of Normandy'],
    [1208, '⛔', 'The Pope placed England under an interdict. Church doors were shut and the bells fell silent.', 'The Interdict'],
    [1215, '📜', 'At Runnymede the barons forced King John to seal Magna Carta. Even the king is under the law.', 'Magna Carta'],
    [1216, '🌊', 'King John lost the crown jewels in the Wash, then died of dysentery.', 'The death of King John'],
    [1220, '⛪', 'Work began on the new cathedral at Salisbury.', 'Salisbury Cathedral'],
    [1265, '🏛️', 'Simon de Montfort called the first parliament with knights and townsmen. He died at Evesham that summer.', 'The first parliament'],
    [1297, '🏴', 'William Wallace defeated the English at Stirling Bridge.', 'Stirling Bridge'],
    [1305, '⚖️', 'William Wallace was hanged, drawn and quartered at Smithfield.', 'The death of Wallace', ['London']],
    [1314, '🏴', 'Robert the Bruce crushed the English army at Bannockburn.', 'Bannockburn'],
    [1315, '🌧️', 'Rain fell all summer and the harvest rotted in the fields. The Great Famine began.', 'The Great Famine'],
    [1327, '👑', 'King Edward II was forced to give up the throne. He died in Berkeley Castle soon after.', 'The fall of Edward II'],
    [1337, '⚔️', 'King Edward III claimed the throne of France. The Hundred Years\' War began.', 'The Hundred Years\' War'],
    [1346, '🏹', 'English longbowmen destroyed the French knights at Crécy.', 'The Battle of Crécy'],
    [1348, '💀', 'A great pestilence arrived from across the sea. People are calling it the Black Death.', 'The Black Death'],
    [1351, '📜', 'With so many dead, workers demanded higher wages. Parliament tried to forbid it.', 'The Statute of Labourers'],
    [1361, '💀', 'The pestilence returned. This time it took many children.', 'The second pestilence'],
    [1376, '⚔️', 'Edward the Black Prince, the great warrior, died before he could be king.', 'The Black Prince'],
    [1377, '👑', 'Richard II was crowned king at ten years old.', 'The boy king'],
    [1381, '🔥', 'The peasants rose up against the poll tax and marched on London.', 'The Peasants\' Revolt'],
    [1387, '📖', 'Geoffrey Chaucer began writing the Canterbury Tales, in English.', 'The Canterbury Tales'],
    [1399, '👑', 'Henry Bolingbroke took the crown from King Richard II.', 'Richard II deposed'],
    [1415, '🏹', 'King Henry V\'s outnumbered army won a famous victory at Agincourt.', 'The Battle of Agincourt'],
    [1422, '👑', 'King Henry V died in France. His son became king at nine months old.', 'The baby king'],
    [1429, '⚔️', 'A French peasant girl called Joan of Arc broke the English siege of Orléans.', 'Joan of Arc'],
    [1431, '🔥', 'Joan of Arc was burned at Rouen.', 'The death of Joan of Arc'],
    [1450, '🔥', 'Jack Cade\'s rebels stormed London.', 'Jack Cade\'s rebellion', ['London']],
    [1453, '🏳️', 'England lost Bordeaux. The Hundred Years\' War was over. Far away, Constantinople fell to the Turks.', 'The end of the Hundred Years\' War'],
    [1455, '🌹', 'The houses of York and Lancaster went to war at St Albans. The Wars of the Roses began.', 'The Wars of the Roses'],
    [1461, '❄️', 'At Towton, in a snowstorm, York won the bloodiest battle ever fought on English soil.', 'The Battle of Towton'],
    [1476, '🖨️', 'William Caxton set up the first printing press in England, at Westminster.', 'The printing press'],
    [1483, '🏰', 'The two young princes in the Tower of London disappeared.', 'The Princes in the Tower'],
    [1485, '👑', 'King Richard III was killed at Bosworth. Henry Tudor took the crown.', 'The Battle of Bosworth'],
    [1492, '⛵', 'Sailors say Christopher Columbus has found new lands across the ocean.', 'Columbus'],
    [1509, '👑', 'Henry VIII was crowned king at seventeen.', 'Henry VIII'],
    [1517, '📜', 'In Germany, a monk named Martin Luther challenged the Pope.', 'The Reformation'],
    [1534, '⛪', 'King Henry broke with the Pope and made himself head of the Church in England.', 'The break with Rome']
  ];
  var COMETS = [1222, 1301, 1378, 1456, 1531];
  var CAMPAIGNS = [[1173, 1174, 'the Great Revolt'], [1189, 1192, 'the Holy Land, on the Third Crusade'], [1194, 1199, 'Normandy'], [1202, 1204, 'Normandy'], [1214, 1214, 'France'],
    [1215, 1217, 'the Barons\' War'], [1242, 1243, 'Poitou'], [1264, 1265, 'the Second Barons\' War'], [1270, 1272, 'the Holy Land, with Lord Edward'], [1277, 1283, 'Wales'], [1294, 1295, 'Wales'],
    [1296, 1307, 'Scotland'], [1314, 1314, 'Scotland'], [1322, 1323, 'Scotland'], [1333, 1336, 'Scotland'], [1337, 1360, 'France'], [1369, 1389, 'France'], [1403, 1408, 'Wales, against Owain Glyndŵr'],
    [1415, 1422, 'France'], [1428, 1453, 'France'], [1455, 1471, 'the Wars of the Roses'], [1483, 1487, 'the Wars of the Roses'], [1513, 1513, 'France'], [1542, 1546, 'Scotland and France']];
  function campaign(yr) { var c = CAMPAIGNS.filter(function (x) { return yr >= x[0] && yr <= x[1]; })[0]; return c ? c[2] : null; }
  // Who held the crown after each turn of the Wars of the Roses.
  var ROSES = { 1461: 'york', 1470: 'lancaster', 1471: 'york', 1485: 'lancaster' };
  var PLAGUES = [1361, 1369, 1375, 1390, 1407, 1438, 1471, 1479, 1499, 1513];
  function see(title, icon) { var s = S(), h = s.era || (s.era = { seen: [], served: [] }); if (h.seen.length < 40) h.seen.push({ year: s.year, age: me().age, icon: icon, title: title }); }

  // ------------------------------------------------------------ careers
  // levels: [title, yearly pay in pennies]. need(): why I can't, or null.
  function notSerf() { return serf() ? 'Serfs are bound to the manor' : null; }
  function letters() { return !st().edu ? 'Needs letters' : null; }
  function university() { return st().edu !== 'university' ? 'Needs a university degree' : null; }
  function guild(id, icon, trade, stat, pay) {
    return { id: id, icon: icon, name: trade + ' (guild)', stat: stat, min: 12, guild: true, need: notSerf,
      levels: [['Apprentice ' + trade, Math.round(pay * 0.1)], ['Journeyman ' + trade, pay], ['Master ' + trade, Math.round(pay * 2.4)], ['Warden of the ' + trade + 's\' Guild', Math.round(pay * 4)]] };
  }
  var CAREERS = [
    { id: 'm_farm', icon: '🌾', name: 'Farming', stat: 'athl', min: 12, need: notSerf, levels: [['Farmhand', 300], ['Smallholder', 520], ['Yeoman Farmer', 1000]] },
    guild('m_smith', '⚒️', 'Smith', 'athl', 420),
    guild('m_baker', '🍞', 'Baker', 'smarts', 360),
    guild('m_weaver', '🧶', 'Weaver', 'smarts', 380),
    guild('m_carpenter', '🪚', 'Carpenter', 'athl', 400),
    guild('m_mason', '🧱', 'Mason', 'athl', 460),
    guild('m_brewer', '🍺', 'Brewer', 'smarts', 360),
    guild('m_tailor', '🧵', 'Tailor', 'looks', 380),
    guild('m_barber', '✂️', 'Barber-Surgeon', 'smarts', 440),
    { id: 'm_midwife', icon: '🤱', name: 'Midwifery', stat: 'smarts', min: 16, need: function () { return male() ? 'Midwives are women' : null; }, levels: [['Midwife\'s Helper', 150], ['Midwife', 450], ['Midwife to the Queen', 3000]] },
    { id: 'm_servant', icon: '🧹', name: 'Service', stat: 'smarts', min: 10, levels: [['Kitchen Servant', 150], ['Household Servant', 300], ['Steward of the Household', 1200]] },
    { id: 'm_inn', icon: '🍻', name: 'Inns', stat: 'looks', min: 14, need: notSerf, levels: [['Tavern Servant', 200], ['Innkeeper', 700]] },
    { id: 'm_minstrel', icon: '🎵', name: 'Music', stat: 'looks', min: 14, need: notSerf, levels: [['Wandering Minstrel', 200], ['Minstrel of a Great House', 600], ['King\'s Minstrel', 2000]] },
    { id: 'm_merchant', icon: '⚖️', name: 'Trade', stat: 'smarts', min: 16, need: notSerf, levels: [['Peddler', 350], ['Shopkeeper', 800], ['Merchant', 2400], ['Merchant of the Staple', 8000]] },
    { id: 'm_clerk', icon: '📜', name: 'Clerks', stat: 'smarts', min: 14, need: function () { return notSerf() || letters(); }, levels: [['Copyist', 300], ['Clerk', 600], ['Clerk of the King\'s Exchequer', 1600]] },
    { id: 'm_lawyer', icon: '⚖️', name: 'Law', stat: 'smarts', min: 20, need: function () { return notSerf() || university(); }, levels: [['Clerk of the Court', 800], ['Serjeant-at-Law', 3000], ['King\'s Justice', 9000]] },
    { id: 'm_physician', icon: '⚕️', name: 'Medicine', stat: 'smarts', min: 22, need: function () { return notSerf() || university() || (me().smarts < 60 ? 'Not enough smarts' : null); }, levels: [['Physician', 2400], ['Royal Physician', 8000]] }
  ];
  var SPECIAL = {
    m_villein: { id: 'm_villein', icon: '🌾', name: 'The manor', levels: [['Cottar', 150], ['Villein', 260], ['Reeve of the Manor', 420]] },
    m_knight: { id: 'm_knight', icon: '🛡️', name: 'Knighthood', levels: [['Page', 0], ['Squire', 60], ['Knight', 2400], ['Knight Banneret', 6000]] },
    m_archer: { id: 'm_archer', icon: '🏹', name: 'The king\'s archers', levels: [['Archer', 900], ['Vintenar', 1300], ['Centenar', 2400]] },
    m_monk: { id: 'm_monk', icon: '📿', name: 'The cloister', levels: [['Novice', 0], ['Monk', 0], ['Prior', 0], ['Abbot', 2400]] },
    m_priest: { id: 'm_priest', icon: '⛪', name: 'The Church', levels: [['Parish Clerk', 200], ['Parish Priest', 600], ['Archdeacon', 2500], ['Bishop', 15000]] },
    m_anchor: { id: 'm_anchor', icon: '🕯️', name: 'The anchorhold', levels: [['Anchorite', 0]] },
    m_court: { id: 'm_court', icon: '👑', name: 'The royal court', levels: [['Courtier', 500], ['Royal Councillor', 3000], ['Lord Chancellor', 12000]] }
  };
  var FEMALE = { Anchorite: 'Anchoress', Monk: 'Nun', Prior: 'Prioress', Abbot: 'Abbess', Courtier: 'Lady-in-Waiting', 'Royal Councillor': 'Lady of the Bedchamber', 'Lord Chancellor': 'Mistress of the Queen\'s Household' };
  function career(id) { return CAREERS.filter(function (c) { return c.id === id; })[0] || SPECIAL[id] || null; }
  function lvlName(c, l) { var n = c.levels[Math.min(l, c.levels.length - 1)][0]; return !male() && FEMALE[n] ? FEMALE[n] : n; }
  // After the Black Death, laborers were scarce and wages rose.
  function wageBoost(id) { return y() >= 1350 && /m_(farm|villein|servant|mason|carpenter)/.test(id) ? 1.4 : 1; }
  function salary(j) {
    var c = career(j.career); if (!c) return 0;
    var base = c.levels[Math.min(j.level, c.levels.length - 1)][1];
    // Archers are paid by the day on campaign; in peacetime only a retainer.
    if (j.career === 'm_archer' && !campaign(y())) base = Math.round(base / 3);
    return Math.round(pen(base) * wageBoost(j.career) * (j.mult || 1));
  }
  function title(j) {
    var c = career(j.career); if (!c) return 'Worker';
    if (j.career === 'm_knight' && j.level >= 2) return (j.level === 3 ? 'Knight Banneret' : 'Knight') + (j.rose ? ' of ' + (j.rose === 'york' ? 'York' : 'Lancaster') : '');
    return lvlName(c, j.level);
  }
  var NPC_JOBS = ['Farmer', 'Plowman', 'Shepherd', 'Miller', 'Baker', 'Blacksmith', 'Weaver', 'Carpenter', 'Brewer', 'Alewife', 'Thatcher', 'Cooper', 'Tanner', 'Merchant', 'Swineherd', 'Midwife', 'Homemaker'];
  function npcJob(age) { return age < 14 ? 'Child' : age >= 60 && U.chance(0.6) ? 'Elder' : U.pick(NPC_JOBS); }

  // ------------------------------------------------------------ birth
  function setup(s, opts) {
    var a = st(), w = s.flags.wealth, c = D.country(s.country);
    a.cls = opts.cls || (w === 'rich' ? 'noble' : w === 'upper' ? 'gentry' : w === 'poor' ? (U.chance(0.65) ? 'villein' : 'free') : (U.chance(0.5) ? 'burgher' : 'free'));
    if (a.cls === 'villein' || a.cls === 'free') s.city = U.pick(VILLAGES);
    else if (a.cls === 'burgher' && TOWNS.indexOf(s.city) < 0) s.city = U.pick(TOWNS);
    var mom = E.people('mother')[0], dad = E.people('father')[0];
    var par = { noble: ['Baron', 'Baroness'], gentry: ['Knight', 'Lady of the Manor'], burgher: [U.pick(['Master Weaver', 'Merchant', 'Master Baker', 'Master Smith', 'Innkeeper']), U.pick(['Alewife', 'Silkwoman', 'Homemaker', 'Shopkeeper'])],
      free: ['Yeoman Farmer', U.pick(['Farmwife', 'Alewife', 'Spinster'])], villein: ['Villein', 'Villein'] }[a.cls];
    if (dad) dad.job = par[0]; if (mom) mom.job = par[1];
    if (a.cls === 'villein') {
      a.lord = 'Sir ' + U.pick(c.male) + ' of ' + s.city;
      E.log('🌾 I was born a serf on the manor of ' + a.lord + '. My family works his land and may not leave without his leave.', 'bad');
    } else E.log({ noble: '🏰 My family are great lords with castles and estates across England.', gentry: '🛡️ My father is a knight. We hold a manor and its lands.', burgher: '🏘️ My family are townsfolk in ' + s.city + '.', free: '🌾 My family are free peasants who farm their own strips of land.' }[a.cls], gentle() ? 'good' : '');
    a.king = king(s.year);
    E.log('👑 ' + royal(a.king) + ' rules England.');
  }
  function royal(k) { return 'King ' + k; }

  // ------------------------------------------------------------ the year
  function yearly() {
    var s = S(), a = st(), age = me().age, yr = s.year, j = s.job;
    var k = king(yr);
    // Left the cloister some other way (fired, retired): find a roof.
    if (s.home.type === 'cloister' && !(j && (j.career === 'm_monk' || j.career === 'm_anchor'))) s.home = JSON.parse(JSON.stringify(TXT.rentHome));
    if (k !== a.king) { a.king = k; if (age >= 5) E.log('👑 ' + royal(k) + ' was crowned.'); }
    MOMENTS.forEach(function (mo) {
      if (mo[0] !== yr || age < 5 || (mo[4] && mo[4].indexOf(s.city) < 0)) return;
      E.log(mo[1] + ' ' + mo[2]); see(mo[3], mo[1]);
    });
    if (COMETS.indexOf(yr) >= 0 && age >= 5) E.log('☄️ A comet with a fiery tail hung in the sky for weeks. Everyone says it is an omen.');
    // King Richard's ransom.
    if (yr === 1194 && age >= 16 && !serf()) E.addMoney(-Math.round(money() * 0.25));
    // The Great Famine (1315-1317) fell hardest on the poor.
    if (yr >= 1315 && yr <= 1317 && !gentle()) {
      E.stat('health', -U.rand(4, 14)); E.stat('happy', -6);
      E.log('🥖 There was no bread. We ate ' + U.pick(['acorns and nettles', 'our seed corn', 'the plow horse', 'bark and grass']) + ' to survive.', 'bad');
      if (me().health < 15 && U.chance(0.4)) return E.die('hunger in the Great Famine');
    }
    // The Black Death (1348-1349): it killed a third or more of England.
    if ((yr === 1348 || yr === 1349) && !a.bd) { a.bd = true; s.pending.push({ id: 'm_blackdeath' }); }
    if (yr === 1348 || yr === 1349) plague(0.2, 'the Black Death');
    if (PLAGUES.indexOf(yr) >= 0) {
      plague(0.06, 'the plague');
      if (age >= 1 && U.chance(0.07)) { E.stat('health', -U.rand(15, 35)); E.log('💀 The pestilence came back and I caught it. Black swellings rose under my arms.', 'bad'); if (me().health < 25 && U.chance(0.5)) return E.die('the plague'); }
    }
    // The sweating sickness (1485-1528) struck fast and killed within a day.
    if ([1485, 1508, 1517, 1528].indexOf(yr) >= 0 && age >= 10 && U.chance(0.05)) { E.stat('health', -U.rand(10, 30)); E.log('🥵 I caught the sweating sickness. Many were dead by nightfall, but I lived.', 'bad'); }
    if (yr === 1381 && age >= 14 && !gentle() && !a.revolt) { a.revolt = true; s.pending.push({ id: 'm_revolt' }); }
    // Henry VIII closed the monasteries (1536-1540).
    if (yr >= 1536 && j && j.career === 'm_monk') { E.log('🏚️ The king\'s men closed my abbey and sold its lands. I was given a small pension and sent out into the world.', 'bad'); s.pension = pen(j.level >= 3 ? 1200 : 120); E.quitJob(true); s.home = JSON.parse(JSON.stringify(TXT.rentHome)); }
    // The Wars of the Roses: whoever wins, the other side pays.
    if (ROSES[yr] && a.rose) roseTurn(ROSES[yr]);
    if (s.dead) return;
    if (age === 14 && male() && !serf()) E.log('🏹 By law, every man must practice with the longbow on Sundays. I got my first bow.');
    // Serfs: work the lord's land; freedom becomes easier after the Black Death.
    if (a.cls === 'villein') {
      if (a.fled) {
        if (yr >= a.fled + 1 && town()) { freeMe('town'); }
        else if (U.chance(0.3)) { a.fled = null; a.watch = yr + 3; s.city = a.village || U.pick(VILLAGES); E.stat('health', -12); E.stat('happy', -15); E.log('⛓️ My lord\'s men found me in ' + (a.fledTo || 'the town') + ' and dragged me back to the manor.', 'bad'); }
      } else {
        if (age >= 12 && !j && !s.prison) hire('m_villein');
        var odds = yr >= 1450 ? 0.15 : yr >= 1350 ? 0.03 : 0.004;
        if (age >= 18 && U.chance(odds)) s.pending.push({ id: 'm_freedom' });
      }
    }
    // Clergy take a vow of celibacy.
    if (j && /m_(monk|priest|anchor)/.test(j.career) && E.partner() && E.partner().role === 'spouse') { E.log('💔 I broke my vows by marrying. The Church cast me out.', 'bad'); E.quitJob(true); if (s.home.type === 'cloister') s.home = JSON.parse(JSON.stringify(TXT.rentHome)); }
    // Court life is dangerous.
    if (j && j.career === 'm_court' && U.chance([1399, 1460, 1461, 1470, 1471, 1483, 1484, 1485].indexOf(yr) >= 0 || yr >= 1530 ? 0.12 : 0.02)) s.pending.push({ id: 'm_tower' });
    if (j && j.career === 'm_merchant' && j.level >= 2 && s.city === 'London' && !a.mayor && U.chance(0.03)) s.pending.push({ id: 'm_mayor' });
    // Investments: land, wool shipments and loans.
    a.inv = (a.inv || []).filter(function (v) {
      if (v.kind === 'land') { var inc = Math.round(v.value * U.randf(0.04, 0.08)); if (U.chance(0.12)) { inc = 0; E.log('🐑 Murrain killed the sheep on my land. My tenants paid nothing this year.', 'bad'); } E.addMoney(inc); return true; }
      if (yr < v.due) return true;
      if (v.kind === 'loan') {
        if (U.chance(0.85)) { var back = Math.round(v.amt * 1.2); E.addMoney(back); E.log('🪙 ' + v.who + ' repaid my loan with interest: ' + E.fmt(back) + '.', 'good'); }
        else E.log('🪙 ' + v.who + ' died owing me ' + E.fmt(v.amt) + '. His family had nothing.', 'bad');
      } else if (v.kind === 'wool') {
        var r = U.rand(1, 100), got;
        if (r <= 15) E.log('🏴‍☠️ Pirates in the Channel took my wool shipment. Everything was lost.', 'bad');
        else if (r <= 40) { got = Math.round(v.amt * U.randf(0.85, 1.15)); E.addMoney(got); E.log('🐑 My wool sold in ' + v.to + ' for about what I paid: ' + E.fmt(got) + '.'); }
        else { got = Math.round(v.amt * U.randf(1.35, 2.2)); E.addMoney(got); E.log('🐑 English wool sold for a fortune in ' + v.to + '. I made ' + E.fmt(got) + '!', 'good'); }
      }
      return false;
    });
    // The owner of a manor house collects rents.
    s.assets.forEach(function (x) { if (x.anc && x.rents) E.addMoney(x.rents); });
  }
  // A pestilence year: some of the people in my life die.
  function plague(p, cause) {
    S().people.forEach(function (q) { if (q.alive && q.age > 0 && U.chance(p * (q.age > 60 || q.age < 5 ? 1.5 : 1))) E.npcDies(q, cause); });
  }
  function roseTurn(win) {
    var a = st(), j = S().job;
    if (!j || (j.career !== 'm_knight' && j.career !== 'm_court')) return;
    if (a.rose === win) { E.fame(5); E.addMoney(pen(U.rand(500, 3000))); E.log('🌹 My side won. The new king rewarded the men who stood by him with lands and gold.', 'good'); return; }
    var lost = Math.round(money() * 0.5); E.addMoney(-lost);
    E.log('🌹 My side lost. Parliament seized half of everything I owned.', 'bad');
    if (j.career === 'm_court') E.quitJob(true);
  }

  // A year at work (called from engine.progressJob). Returns earnings.
  function jobYear(j) {
    var c = career(j.career);
    if (!c) return 0;
    if (j.career === 'm_knight') return knightYear(j, c);
    if (j.career === 'm_archer') return archerYear(j, c);
    if (j.career === 'm_monk' || j.career === 'm_priest') return churchYear(j, c);
    if (j.career === 'm_anchor') return anchorYear(j);
    if (j.career === 'm_midwife') midwifeYear(j);
    var stv = j.career === 'm_villein' ? me().athl : E.statValue(c.stat || 'smarts');
    j.perf = U.clamp(Math.round((j.perf || 50) + U.rand(-9, 8) + (stv - 50) / 15 + (j.workHard || 0) * 4 - (me().happy < 20 ? 6 : 0)), 0, 100);
    j.workHard = 0;
    if (c.guild) return guildYear(j, c);
    var need = j.career === 'm_villein' ? 3 : 2;
    if (j.level < c.levels.length - 1 && j.perf >= 70 && j.levelYears >= need && U.chance(0.3 + (j.perf - 70) / 60) && (j.career !== 'm_midwife' || j.level < 1) && (j.career !== 'm_court' || (S().fame >= 25 * j.level && j.levelYears >= 3 * (j.level + 1)))) {
      j.level++; j.levelYears = 0; j.perf = Math.max(45, j.perf - 20);
      E.log(j.career === 'm_villein' && j.level === 2 ? '🌾 My neighbors chose me as reeve. I answer to the lord for the whole village.' : '📈 I rose to ' + title(j) + '! New pay: ' + E.fmt(salary(j)) + ' a year.', 'good'); E.stat('happy', 10);
    } else if (j.perf < 15 && j.career !== 'm_villein' && U.chance(0.5)) { E.fire('My work was terrible.'); }
    return salary(j);
  }
  function guildYear(j, c) {
    var a = st();
    if (j.level === 0 && j.years >= 5 && j.perf >= 35) { j.level = 1; j.levelYears = 0; E.log('🎓 I finished my apprenticeship. As a journeyman ' + c.levels[1][0].replace(/^Journeyman /, '').toLowerCase() + ' I can work for wages anywhere.', 'good'); E.stat('happy', 8); }
    else if (j.level === 2 && j.perf >= 80 && j.levelYears >= 5 && U.chance(0.25)) { j.level = 3; j.levelYears = 0; E.fame(2); E.log('🏛️ The guild elected me its warden.', 'good'); E.stat('happy', 8); }
    else if (j.perf < 12 && U.chance(0.4)) { E.fire(j.level === 0 ? 'My master sent me away.' : 'The guild threw me out for shoddy work.'); return 0; }
    if (j.level >= 2 && a.apprentices) E.addMoney(pen(a.apprentices * 40));
    return salary(j);
  }
  function knightYear(j, c) {
    var a = st(), age = me().age, war = campaign(y());
    j.perf = U.clamp(Math.round((j.perf || 50) + U.rand(-8, 9) + (me().athl - 50) / 12 + (j.workHard || 0) * 4), 0, 100); j.workHard = 0;
    if (j.level === 0 && age >= 14) { j.level = 1; j.levelYears = 0; E.log('🛡️ I became a squire. I carry my knight\'s shield, look after his horses and follow him into battle.', 'good'); }
    if (j.level === 1 && age >= 21 && j.perf >= 45 && !j.asked) { j.asked = true; S().pending.push({ id: 'm_dubbing' }); }
    if (j.level >= 1 && age >= 16 && war) { if (!warYear(j, war, j.level >= 2 ? 22 : 28)) return 0; }
    if (j.level === 2 && j.perf >= 80 && S().fame >= 20 && j.levelYears >= 4 && U.chance(0.3)) { j.level = 3; j.levelYears = 0; E.log('🚩 For my deeds the king made me a knight banneret. I lead men under my own square banner.', 'good'); E.fame(5); }
    return salary(j);
  }
  function archerYear(j, c) {
    var war = campaign(y());
    j.perf = U.clamp(Math.round((j.perf || 50) + U.rand(-8, 9) + (me().athl - 50) / 12 + (j.workHard || 0) * 4), 0, 100); j.workHard = 0;
    if (war) { if (!warYear(j, war, 30)) return 0; }
    else if (U.chance(0.5)) E.log('🏹 There was no war this year. I went home and practiced at the butts.');
    if (j.level < c.levels.length - 1 && j.perf >= 72 && j.levelYears >= 3 && U.chance(0.3)) { j.level++; j.levelYears = 0; E.log('📈 I was made ' + title(j) + ', in command of ' + (j.level === 1 ? 'twenty' : 'a hundred') + ' archers.', 'good'); }
    return salary(j);
  }
  // A campaign year for knights, squires and archers. Returns false if I died.
  function warYear(j, war, death) {
    var a = st(), knight = j.career === 'm_knight';
    if (a.campaigns.indexOf(war) < 0) { a.campaigns.push(war); E.log('⚔️ I went to war in ' + war + '.'); see('Fought in ' + war, '⚔️'); }
    if (y() === 1415 && !a.agincourt) { a.agincourt = true; E.achieve('agincourt'); E.log('🏹 I fought at Agincourt. We were few, and wet, and starving, and we won.', 'good'); E.fame(3); }
    if (U.chance(0.5)) return true; // sieges, marches and waiting
    var r = U.rand(1, 1000);
    if (r <= death) { E.die('wounds suffered in battle in ' + war); return false; }
    if (r <= death * 4) { E.stat('health', -U.rand(10, 28)); E.log('🩸 I was wounded in battle in ' + war + '.', 'bad'); return true; }
    if (knight && j.level >= 2 && U.chance(0.12)) { var paid = Math.min(money(), pen(U.rand(1000, 6000))); E.addMoney(-paid); E.log('⛓️ I was captured in ' + war + '. My family paid ' + E.fmt(paid) + ' to ransom me.', 'bad'); return true; }
    if (U.chance(0.3)) {
      var g = pen(knight && j.level >= 2 ? U.rand(600, 8000) : U.rand(40, 600)); E.addMoney(g); j.perf = Math.min(100, j.perf + 8); E.fame(1);
      if (knight && j.level >= 2) { a.ransoms++; E.log('💰 I captured ' + foe(war) + ' in ' + war + ' and his family paid ' + E.fmt(g) + ' for his release.', 'good'); }
      else E.log('💰 We ' + (/Barons|Roses|Revolt/.test(war) ? 'looted a rebel castle' : 'sacked a town') + ' in ' + war + '. My share of the plunder was ' + E.fmt(g) + '.', 'good');
    }
    return true;
  }
  function foe(war) { return /France|Normandy|Poitou/.test(war) ? 'a French lord' : /Scotland/.test(war) ? 'a Scottish lord' : /Wales/.test(war) ? 'a Welsh lord' : /Holy Land/.test(war) ? 'a Saracen emir' : 'a rebel lord'; }
  function churchYear(j, c) {
    var monk = j.career === 'm_monk', s = S();
    j.perf = U.clamp(Math.round((j.perf || 50) + U.rand(-7, 8) + (me().smarts - 50) / 18 + (s.karma - 50) / 20 + (j.workHard || 0) * 4), 0, 100); j.workHard = 0;
    if (monk) { E.stat('health', 1); if (me().happy < 40) E.stat('happy', 2); }
    if (monk && j.level === 0 && j.years >= 1) { j.level = 1; j.levelYears = 0; E.log('📿 I took my final vows of poverty, chastity and obedience. I am ' + E.an(title(j).toLowerCase()) + ' now.', 'good'); return salary(j); }
    var gate = j.level >= 2 && (monk ? !st().edu : (st().edu !== 'university' && !(gentle() && st().edu))) ? 'blocked' : null;
    if (!gate && j.level < c.levels.length - 1 && j.perf >= 72 && j.levelYears >= (j.level >= 2 ? 6 : 4) && U.chance(0.25 + (gentle() ? 0.1 : 0))) {
      j.level++; j.levelYears = 0; j.perf = Math.max(45, j.perf - 20); E.stat('happy', 10); E.fame(j.level >= 3 ? 8 : 2);
      E.log(monk ? '📿 The ' + (male() ? 'brothers' : 'sisters') + ' chose me as ' + title(j).toLowerCase() + '.' : '⛪ I was made ' + title(j).toLowerCase() + '.', 'good');
      if (j.level === 3) { E.achieve('abbot'); see(monk ? 'Led ' + (male() ? 'an abbey' : 'a convent') : 'Became a bishop', monk ? '📿' : '⛪'); }
    }
    return salary(j);
  }
  // Anchorites were walled into a cell beside a church for life, to pray and give counsel.
  function anchorYear(j) {
    var a = st(), an = a.anchor || (a.anchor = { visions: 0, counsel: 0 });
    E.karma(2); E.fame(1); if (me().happy < 35) E.stat('happy', 3);
    if (U.chance(0.3)) { an.counsel++; E.log('🕯️ ' + U.pick(['A grieving widow', 'A merchant afraid for his soul', 'A young woman torn between two suitors', 'A knight haunted by the war', 'A famous pilgrim from Lynn']) + ' came to my window for counsel.'); }
    return pen(U.rand(30, 90) + Math.min(400, S().fame * 6)); // alms
  }
  function midwifeYear(j) {
    if (j.level >= 1 && U.chance(0.12)) {
      if (U.chance(0.75)) { E.karma(2); j.perf = Math.min(100, (j.perf || 50) + 6); E.log('🤱 A breech birth that everyone feared would kill mother and child. I turned the baby, and both lived.', 'good'); }
      else { E.stat('happy', -6); E.log('🕯️ I lost a mother and her baby in a long, hard birth. The family blamed me.', 'bad'); }
    }
    if (j.level === 1 && S().fame >= 15 && j.perf >= 80 && j.levelYears >= 6 && U.chance(0.15)) { j.level = 2; j.levelYears = 0; E.fame(6); E.log('👑 I was summoned to deliver the queen\'s child. The royal household keeps me now.', 'good'); }
  }
  function enclose() {
    var s = S(), ch = U.pick(['St Julian\'s', 'St Mary\'s', 'St Edmund\'s', 'All Saints\'', 'St Botolph\'s']) + ' Church';
    ui().choose('Become ' + (male() ? 'an anchorite' : 'an anchoress'), 'The bishop will wall me into a small cell beside ' + ch + ' for the rest of my life. I will pray, counsel those who come to my window, and live on alms. There is no way back.', [
      { label: 'Be enclosed', fn: function () { E.quitJob(true); hire('m_anchor'); s.job.company = ch + ', ' + s.city; s.home = { type: 'cloister' }; done(good('The bishop said the prayers for the dead over me and the door was walled up. A small window looks into the church, another out onto the street. 🕯️')); } },
      { label: 'Not yet', fn: function () { done('I\'m not ready to leave the world.'); } }
    ]);
  }
  function hire(id) {
    var c = career(id);
    S().job = { career: id, ancient: true, level: 0, perf: 55, years: 0, levelYears: 0, mult: 1, company: place() };
    S().counts.jobs++;
    return c;
  }
  function freeMe(how) {
    var a = st(), j = S().job;
    a.cls = 'free'; a.fled = null; a.freed = how; a.freedAge = me().age;
    if (j && j.career === 'm_villein') E.quitJob(true);
    if (how === 'town') { E.log('🕊️ I have lived in ' + S().city + ' for a year and a day. Town air makes you free: I am no longer a serf!', 'good'); E.achieve('town_air'); }
    else E.log('🕊️ I am free! No lord owns my labor any longer.', 'good');
    E.stat('happy', 25); see('Won my freedom', '🕊️');
  }

  // ------------------------------------------------------------ occupation
  function occupationMenu() {
    ui().menu('Occupation', function () {
      var s = S(), a = st(), j = s.job, age = me().age, items = [];
      items.push({ info: true, html: card() });
      if (age < 7) { items.push({ info: true, html: '<p class="muted">I\'m too young to work. Childhood comes first.</p>' }); return items; }
      if (j) {
        items.push({ section: 'My work' });
        var c = career(j.career);
        if (j.career === 'm_knight') {
          items.push({ icon: '🗡️', label: 'Train at arms', sub: 'Sword, lance and horse', onClick: function () { if (count('m_train')) return done(nope('My arms ache. Enough for this year.')); bump('m_train'); me().athl = Math.min(100, me().athl + U.rand(2, 5)); j.perf = Math.min(100, (j.perf || 50) + 4); done('I rode at the quintain until I could hit it every time. 🐎'); } });
          if (j.level >= 1) items.push({ icon: '🐎', label: 'Joust in a tournament', sub: (a.tourney || a.tourneyLost ? a.tourney + ' won, ' + a.tourneyLost + ' lost · ' : '') + 'Win the loser\'s horse and armor', right: E.fmt(pen(60)), onClick: joust });
        } else if (j.career === 'm_monk') {
          items.push({ icon: '🙏', label: 'Pray the hours', sub: 'Eight services a day, from Matins to Compline', onClick: function () { if (count('m_pray')) return done(nope('I already kept every service this year.')); bump('m_pray'); E.karma(3); E.stat('happy', 3); j.perf = Math.min(100, (j.perf || 50) + 4); done('I rose in the dark for Matins and sang the psalms until Compline.'); } });
          if (a.edu) items.push({ icon: '🖋️', label: 'Work in the scriptorium', sub: 'Copy and illuminate books', onClick: function () { if (count('m_copy')) return done(nope('My eyes need rest.')); bump('m_copy'); E.stat('smarts', 2); j.perf = Math.min(100, (j.perf || 50) + 5); done('I copied ' + U.pick(['a book of psalms', 'the Gospels', 'a bestiary full of strange beasts', 'a chronicle of the kings']) + ' and painted the letters in gold leaf. 🖋️'); } });
          items.push({ icon: '🌿', label: 'Tend the herb garden', onClick: function () { if (count('m_herb')) return done(nope('The garden is in good order.')); bump('m_herb'); E.stat('health', 3); E.stat('happy', 2); done('I tended the sage, rue and feverfew in the infirmary garden.'); } });
        } else if (j.career === 'm_priest') {
          items.push({ icon: '🗣️', label: 'Preach a sermon', onClick: function () { if (count('m_preach')) return done(nope('My flock has heard enough sermons.')); bump('m_preach'); var ok = U.chance(0.4 + me().smarts / 200); if (ok) { E.fame(1); E.karma(2); j.perf = Math.min(100, (j.perf || 50) + 6); return done(good('My sermon on ' + U.pick(['the fires of Hell', 'the Good Samaritan', 'the sin of greed', 'the Last Judgment']) + ' had the whole parish in tears.')); } done('Half the parish slept through my sermon.'); } });
          items.push({ icon: '🌾', label: 'Collect the tithe strictly', sub: 'A tenth of every harvest belongs to the Church', onClick: function () { if (count('m_tithe')) return done(nope('I already collected the tithe.')); bump('m_tithe'); var g = pen(U.rand(40, 200) * (j.level + 1)); E.addMoney(g); E.karma(-3); j.perf = Math.min(100, (j.perf || 50) + 3); done('I took every tenth sheaf and every tenth lamb. ' + E.fmt(g) + ' for the Church, and a little for me.'); } });
        } else if (c.guild && j.level === 1) {
          var fee = pen(240), ready = j.levelYears >= 3;
          items.push({ icon: '🏆', label: 'Submit a masterpiece to the guild', sub: ready ? 'The guild judges it; masters may run their own shop' : 'After 3 years as a journeyman', right: E.fmt(fee), disabled: !ready || count('m_master') > 0, onClick: function () { masterpiece(j, c, fee); } });
        } else if (c.guild && j.level >= 2) {
          items.push({ icon: '🧑‍🔧', label: 'Take on an apprentice', sub: (a.apprentices || 0) + ' now · cheap labor, more profit', onClick: function () { if ((a.apprentices || 0) >= 3) return done(nope('Guild rules allow three apprentices at most.')); if (count('m_appr')) return done(nope('One new apprentice a year.')); bump('m_appr'); a.apprentices = (a.apprentices || 0) + 1; done('A boy\'s family paid me to teach him the trade. He swore to obey me for seven years.'); } });
          items.push({ icon: '💪', label: 'Work harder', onClick: workHarder });
        } else if (j.career === 'm_court') {
          items.push({ icon: '🎁', label: 'Win the king\'s favor', sub: 'Gifts, flattery and hunting', right: E.fmt(pen(400)), onClick: function () { var cost = pen(400); if (s.money < cost) return done(nope('Favor at court is expensive.')); if (count('m_favor')) return done(nope('Too much flattery looks suspicious.')); bump('m_favor'); E.addMoney(-cost); j.perf = Math.min(100, (j.perf || 50) + 10); E.fame(2); done('I gave the king a fine ' + U.pick(['falcon', 'hound', 'gilded cup', 'horse']) + '. He smiled at me in front of the whole court.'); } });
        } else if (j.career === 'm_anchor') {
          var an = a.anchor || (a.anchor = { visions: 0, counsel: 0 });
          items.push({ icon: '🙏', label: 'Pray through the night', onClick: function () { if (count('m_vigil')) return done(nope('I already kept vigil this year.')); bump('m_vigil'); E.karma(3); E.stat('happy', 3); E.stat('health', -1); done('I prayed from Compline to dawn on the cold stone floor.'); } });
          items.push({ icon: '🪟', label: 'Counsel those at my window', sub: an.counsel + ' counseled so far', onClick: function () { if (count('m_counsel')) return done(nope('I\'ve seen everyone who came this year.')); bump('m_counsel'); an.counsel += U.rand(1, 4); E.fame(2); E.karma(2); done(U.pick(['"All shall be well, and all shall be well, and all manner of thing shall be well," I told them.', 'I listened through the curtain and gave what comfort I could.', 'A woman wept at my window all afternoon. She left lighter.'])); } });
          items.push({ icon: '✍️', label: 'Write down my visions', sub: an.visions ? U.plural(an.visions, 'chapter') + ' written' : 'Showings of divine love', onClick: function () { if (count('m_vision')) return done(nope('No new visions have come this year.')); bump('m_vision'); an.visions++; E.stat('smarts', 1); if (an.visions >= 5 && !an.book) { an.book = true; E.achieve('mystic'); E.fame(10); see('Wrote a book of revelations', '✍️'); return done(good('I finished my book of revelations. Monks are copying it, and people travel from far away to speak with me. ✍️')); } done('I wrote down what I saw in my sickness: ' + U.pick(['a hazelnut in the palm of my hand, holding all that is made', 'Christ\'s face, bleeding and kind', 'the whole world held in love', 'a great lord and his servant who fell']) + '.'); } });
        } else if (j.career === 'm_minstrel') {
          items.push({ icon: '🎶', label: 'Compose a ballad', onClick: function () { if (count('m_ballad')) return done(nope('The muse has left me for this year.')); bump('m_ballad'); var q = U.rand(1, 100) + (me().smarts - 50) / 3; if (q > 70) { E.fame(4); E.addMoney(pen(U.rand(20, 120))); return done(good('My ballad of ' + U.pick(['Robin Hood', 'King Arthur', 'a lost love', 'the Battle of Crécy']) + ' is being sung in every tavern. 🎶')); } done('I wrote a ballad. Nobody asked to hear it twice.'); } });
        } else if (j.career !== 'm_villein') items.push({ icon: '💪', label: 'Work harder', onClick: workHarder });
        else items.push({ icon: '💪', label: 'Work the lord\'s fields', sub: 'Three days a week are owed to him', onClick: workHarder });
        if (j.career === 'm_anchor') items.push({ info: true, html: '<p class="muted">My enclosure is for life.</p>' });
        else if (j.career !== 'm_villein') items.push({ icon: '🚪', label: j.career === 'm_monk' || j.career === 'm_priest' ? 'Leave the Church' : j.career === 'm_knight' ? 'Give up knighthood' : 'Quit', danger: true, onClick: function () { E.quitJob(); if (s.home.type === 'cloister') s.home = JSON.parse(JSON.stringify(TXT.rentHome)); done('I left my work.'); } });
      }
      if (j && j.career === 'm_anchor') return items;
      if (serf()) {
        items.push({ section: 'Serfdom' });
        var price = pen(1500);
        items.push({ icon: '🕊️', label: 'Buy my freedom', sub: 'My lord will sell me a charter of freedom', right: E.fmt(price), onClick: function () { if (s.money < price) return done(nope('I need ' + E.fmt(price) + ' to buy my freedom.')); E.addMoney(-price); freeMe('money'); ui().back(); done(good('I paid ' + a.lord + ' and he sealed my charter of freedom.')); } });
        if (age >= 16) items.push({ icon: '🏃', label: 'Flee to a town', sub: a.watch > y() ? 'The bailiff watches me until ' + a.watch : 'A year and a day in a town makes a serf free', danger: true, disabled: a.watch > y(), onClick: flee });
      }
      items.push({ section: 'Find work' });
      CAREERS.forEach(function (c) {
        if (j && j.career === c.id) return;
        var why = age < c.min ? 'Must be ' + c.min + '+' : c.need ? c.need() : null;
        items.push({ icon: c.icon, label: c.levels[0][0], sub: c.name + ' · ' + E.fmt(Math.round(pen(c.levels[0][1]) * wageBoost(c.id))) + '/yr' + (why ? ' · ' + why : ''), disabled: !!why, onClick: function () { apply(c); } });
      });
      items.push({ section: 'Paths to glory' });
      var kn = j && j.career === 'm_knight', page = gentle() && age <= 13, squire = !serf() && age >= 14 && age <= 24;
      items.push({ icon: '🛡️', label: page ? 'Be sent to a great house as a page' : 'Become a squire', sub: !male() ? 'Only men are knighted' : page ? 'Learn to ride, fight and serve. Knighthood at 21.' : !squire ? 'Ages 14 to 24, and not a serf' : gentle() ? 'Serve a knight, then be knighted' : 'Horse and harness cost ' + E.fmt(pen(5000)), disabled: !male() || kn || (!page && !squire), onClick: function () { squireUp(page); } });
      items.push({ icon: '🏹', label: 'Join the king\'s archers', sub: !male() ? 'Only men are recruited' : age < 16 || age > 40 ? 'Ages 16 to 40' : 'Good pay in wartime, plunder, and danger', disabled: !male() || age < 16 || age > 40 || (j && j.career === 'm_archer'), onClick: function () { if (me().athl < 30 && U.chance(0.5)) return done(bad('I couldn\'t even draw the bow. The captain sent me home.')); E.quitJob(true); hire('m_archer'); S().job.company = 'the king\'s army'; done(good('I joined the king\'s archers. Six pence a day on campaign! 🏹')); } });
      var single = !E.partner() || E.partner().role !== 'spouse';
      items.push({ icon: '📿', label: male() ? 'Become a monk' : 'Become a nun', sub: !single ? 'Not while I\'m married' : serf() ? 'Serfs need their lord\'s leave' : y() >= 1536 ? 'The king has closed the monasteries' : 'A life of prayer behind abbey walls', disabled: !single || serf() || y() >= 1536 || age < 14 || (j && j.career === 'm_monk'), onClick: function () { E.quitJob(true); hire('m_monk'); S().job.company = U.pick(male() ? ['Westminster Abbey', 'Fountains Abbey', 'Glastonbury Abbey', 'St Albans Abbey', 'Rievaulx Abbey'] : ['Barking Abbey', 'Shaftesbury Abbey', 'Lacock Abbey', 'Romsey Abbey']); S().home = { type: 'cloister' }; done(good('I entered ' + S().job.company + ' as a novice. I left the world behind. 📿')); } });
      items.push({ icon: '⛪', label: 'Become a priest', sub: !male() ? 'Only men are ordained' : !single ? 'Priests may not marry' : serf() ? 'Serfs need their lord\'s leave' : !a.edu ? 'Needs letters' : 'Parish clerk first; bishops need a degree', disabled: !male() || !single || serf() || !a.edu || age < 16 || (j && j.career === 'm_priest'), onClick: function () { E.quitJob(true); hire('m_priest'); done(good('I took minor orders and became the parish clerk.')); } });
      var anch = j && j.career === 'm_anchor';
      items.push({ icon: '🕯️', label: male() ? 'Become an anchorite' : 'Become an anchoress', sub: !single ? 'Not while I\'m married' : serf() ? 'Serfs need their lord\'s leave' : age < 25 ? 'The bishop only encloses those 25 or older' : S().karma < 50 ? 'The bishop doubts my holiness' : 'Walled into a cell for life, to pray and counsel', disabled: anch || !single || serf() || age < 25 || S().karma < 50, onClick: enclose });
      var canCourt = gentle() && a.edu && age >= 17;
      items.push({ icon: '👑', label: 'Seek a place at court', sub: canCourt ? 'Power, riches and danger' : 'Needs a noble or knightly family and letters', disabled: !canCourt || (j && j.career === 'm_court'), onClick: function () { if (!U.chance(0.4 + S().fame / 100 + (a.cls === 'noble' ? 0.3 : 0))) return done(bad('Nobody at court would see me. Perhaps with more friends in high places.')); E.quitJob(true); hire('m_court'); S().job.company = 'the court of ' + royal(king(y())); done(good('I was given a place at ' + S().job.company + '. 👑')); } });
      if (j && j.years >= 15 && age >= 55 && j.career !== 'm_villein' && j.career !== 'm_anchor') items.push({ section: ' ' }, { icon: '🏡', label: 'Retire', onClick: function () { var r = E.retire(); done(r.msg); } });
      return items;
    });
  }
  function workHarder() {
    var j = S().job;
    if (count('m_work') >= 2) return done(nope('I\'m exhausted.'));
    bump('m_work'); j.workHard = (j.workHard || 0) + 1; j.perf = Math.min(100, (j.perf || 50) + 5); E.stat('happy', -1);
    done(j.career === 'm_villein' ? 'I plowed and reaped on the lord\'s land from dawn to dusk.' : 'I put in extra effort.');
  }
  function card() {
    var s = S(), a = st(), j = s.job;
    var line = j ? E.jobTitle(j) + (j.company && !/m_(knight|archer)/.test(j.career) ? ' · ' + j.company : '') : s.retired ? 'Retired' : 'Not working';
    var extra = j && j.career === 'm_knight' && (a.tourney || a.tourneyLost) ? 'Tournaments: ' + a.tourney + ' won, ' + a.tourneyLost + ' lost' : j && (j.career === 'm_archer' || j.career === 'm_knight') && a.campaigns.length ? 'Campaigns: ' + a.campaigns.join(', ') : j && !/m_(monk)/.test(j.career) && E.jobSalary(j) ? 'Pay ' + E.fmt(E.jobSalary(j)) + '/yr' : '';
    return '<div class="kv"><b>' + U.esc(line) + '</b>' + (extra ? '<br><span class="muted">' + U.esc(extra) + '</span>' : '') + '<br><span class="muted">' + CLASS_NAME[a.cls] + ' · ' + royal(king(s.year)) + '</span></div>';
  }
  function apply(c) {
    var sv = E.statValue(c.stat || 'smarts'), p = 0.5 + (sv - 50) / 120 + (gentle() ? 0.1 : 0) + (c.guild && me().age <= 16 ? 0.15 : 0);
    if (!U.chance(p)) return done(bad(c.guild ? 'No master would take me on.' : 'They turned me away.'));
    E.quitJob(true); hire(c.id);
    done(good(c.guild ? 'A master ' + c.levels[2][0].replace(/^Master /, '').toLowerCase() + ' took me on. I swore to serve him for seven years.' : 'I found work as ' + E.an(c.levels[0][0].toLowerCase()) + ' ' + S().job.company + '.'));
  }
  function masterpiece(j, c, fee) {
    var s = S();
    if (s.money < fee) return done(nope('The guild charges ' + E.fmt(fee) + ' to judge a masterpiece.'));
    bump('m_master'); E.addMoney(-fee);
    var p = 0.3 + (j.perf - 50) / 120 + (E.statValue(c.stat) - 50) / 150;
    if (!U.chance(p)) { E.stat('happy', -6); return done(bad('The masters found faults in every corner of my work. I\'ll try again next year.')); }
    j.level = 2; j.levelYears = 0; E.achieve('master_craftsman'); E.stat('happy', 15); E.fame(2); see('Became a master ' + c.levels[2][0].replace(/^Master /, '').toLowerCase(), '🏆');
    done(good('The guild accepted my masterpiece. I am a master ' + c.levels[2][0].replace(/^Master /, '').toLowerCase() + ' and may open my own shop! 🏆'));
  }
  function squireUp(page) {
    var cost = gentle() ? 0 : pen(5000);
    if (S().money < cost) return done(nope('A horse, harness and a knight\'s good will cost ' + E.fmt(cost) + '.'));
    E.addMoney(-cost); E.quitJob(true); hire('m_knight');
    var j = S().job, c = D.country(S().country);
    j.company = 'the household of Sir ' + U.pick(c.male) + ' ' + U.pick(['de Clare', 'de Vere', 'Percy', 'Neville', 'Mortimer', 'Beauchamp', 'Fitzalan', 'Courtenay']);
    if (!page) j.level = 1;
    done(good(page ? 'I was sent to ' + j.company + ' as a page. I learn to ride, serve at table and fight with a wooden sword.' : 'I became a squire in ' + j.company + '. 🛡️'));
  }
  function joust() {
    var s = S(), a = st(), j = s.job, fee = pen(60);
    if (count('m_joust')) return done(nope('One tournament a year is enough for my horse.'));
    if (s.money < fee) return done(nope('The entry and the heralds cost ' + E.fmt(fee) + '.'));
    bump('m_joust'); E.addMoney(-fee);
    var p = 0.3 + (me().athl - 50) / 200 + Math.min(0.08, a.tourney * 0.01) + (j.level >= 2 ? 0.04 : 0);
    if (U.chance(p)) {
      var prize = pen(U.rand(300, 1600)); a.tourney++; E.addMoney(prize); E.fame(U.rand(1, 3)); E.stat('happy', 8);
      if (a.tourney >= 5) E.achieve('tourney_champ');
      return done(good('I broke three lances and unhorsed ' + U.pick(['a French count', 'the Earl\'s champion', 'a famous knight from Burgundy', 'the defending champion']) + '. His horse and armor are mine: ' + E.fmt(prize) + '. 🏆'));
    }
    a.tourneyLost++;
    if (U.chance(0.015)) { E.die('a lance through the visor in a tournament'); return done(bad('A splintered lance found the slit in my helmet.')); }
    var loss = Math.min(money(), pen(U.rand(150, 600))); E.addMoney(-loss); E.stat('health', -U.rand(4, 16));
    done(bad('I was knocked from the saddle. Buying back my horse and armor cost ' + E.fmt(loss) + '.'));
  }
  function flee() {
    var s = S(), a = st();
    if (a.watch > y()) return done(nope('I\'m being watched too closely to try again yet.'));
    if (U.chance(0.4)) { a.watch = y() + 3; E.stat('health', -15); E.stat('happy', -10); return done(bad('The bailiff caught me on the road. I was beaten and fined in the manor court.')); }
    a.village = s.city; a.fled = y(); a.fledTo = U.pick(TOWNS); s.city = a.fledTo;
    if (s.job && s.job.career === 'm_villein') E.quitJob(true);
    s.home = { type: 'rent', tier: 0, anc: 'hovel', mult: HOMES.hovel[1] * 50 / E.RENT_TIERS[0][1] };
    E.log('🏃 I ran away from the manor to ' + a.fledTo + '.');
    done(good('I slipped away before dawn and walked to ' + a.fledTo + '. If I can stay hidden for a year and a day, I\'ll be free.'));
  }

  // ------------------------------------------------------------ assets
  var HOMES = { hovel: ['A one-room hovel', 40, -2], cottage: ['A thatched cottage', 100, 0], town: ['A timber townhouse', 400, 3] };
  function homeLabel(h) {
    var a = st();
    if (h.type === 'parents') return serf() ? (me().age < 18 ? 'My family\'s cottage on the manor' : 'A cottage on the manor') : a.cls === 'noble' ? 'My family\'s castle' : a.cls === 'gentry' ? 'My family\'s manor house' : me().age < 18 ? 'My family\'s home' : 'Living with my family';
    if (h.type === 'cloister') return S().job && S().job.career === 'm_anchor' ? 'My anchorhold at ' + S().job.company : S().job && S().job.company ? S().job.company : 'The cloister';
    if (h.type === 'homeless') return 'Sleeping rough';
    if (h.type === 'owned') { var o = E.ownedHome(); return o ? 'My ' + o.type.toLowerCase() + ' ' + (o.where || '') : 'My house'; }
    return (HOMES[h.anc] || HOMES.cottage)[0];
  }
  var BUY = [['🛖', 'Cottage', 'Wattle, daub and thatch', 2000, true], ['🏘️', 'Townhouse', 'A timber house with a shop below', 12000, true], ['🏡', 'Manor house', 'Comes with tenants who pay rent', 60000, true, 2400],
    ['🏰', 'Castle', 'Stone walls, a great hall and a moat', 400000, true, 9000], ['🐴', 'Horse', 'A sturdy rouncey for the road', 300], ['🐎', 'Warhorse', 'A trained destrier, worth a fortune', 8000], ['📖', 'Book of hours', 'A prayer book painted in gold leaf', 2000]];
  function assetsMenu() {
    ui().menu('Property & wealth', function () {
      var s = S(), a = st(), items = [], props = s.assets.filter(function (x) { return x.anc; });
      var worth = props.reduce(function (t, x) { return t + x.value; }, 0) + (a.inv || []).reduce(function (t, v) { return t + (v.value || v.amt || 0); }, 0);
      items.push({ info: true, html: '<div class="nw"><small>Wealth</small><div class="nw-big' + (s.money + worth < 0 ? ' neg' : '') + '">' + E.fmt(s.money + worth) + '</div><div class="nw-grid"><div><small>Coin</small><b>' + E.fmt(s.money) + '</b></div><div><small>Property & ventures</small><b>' + E.fmt(worth) + '</b></div></div><div class="bz-cap">Money is counted in silver pennies. A laborer earns about ' + E.fmt(pen(300)) + ' a year.</div></div>' });
      var stuck = me().age < 16 || serf() || s.home.type === 'cloister';
      items.push({ icon: '🏠', label: E.homeLabel(), sub: stuck ? 'Where I live' : 'Tap to move', disabled: stuck, onClick: moveMenu });
      if (props.length || (a.inv || []).length) {
        items.push({ section: 'What I own' });
        props.forEach(function (p) { items.push({ icon: p.icon, label: p.type, sub: p.rents ? 'Tenants pay ' + E.fmt(p.rents) + '/yr' : p.where || '', right: E.fmt(p.value), onClick: function () { ui().choose(p.type, 'Sell it for ' + E.fmt(Math.round(p.value * 0.9)) + '?', [{ label: 'Sell', fn: function () { E.addMoney(Math.round(p.value * 0.9)); s.assets = s.assets.filter(function (x) { return x !== p; }); if (s.home.type === 'owned' && s.home.id === p.id) s.home = JSON.parse(JSON.stringify(TXT.rentHome)); done('I sold my ' + p.type.toLowerCase() + '.'); } }]); } }); });
        (a.inv || []).forEach(function (v) { items.push({ icon: v.kind === 'land' ? '🐑' : v.kind === 'loan' ? '🪙' : '⛵', label: v.kind === 'land' ? 'Land let to tenants' : v.kind === 'loan' ? 'Loan to ' + v.who : 'Wool shipment to ' + v.to, sub: v.kind === 'land' ? 'Rents every year' : 'Due in ' + v.due, right: E.fmt(v.value || v.amt) }); });
      }
      if (me().age < 16 || serf()) { if (serf()) items.push({ info: true, html: '<p class="muted">Serfs own nothing but what their lord allows.</p>' }); return items; }
      items.push({ section: 'Buy' });
      BUY.forEach(function (b) {
        var cost = pen(b[3]);
        items.push({ icon: b[0], label: b[1], sub: b[2], right: E.fmt(cost), onClick: function () {
          if (s.money < cost) return done(nope('I can\'t afford that.'));
          E.addMoney(-cost);
          var asset = { id: U.uid(), kind: b[4] ? 'house' : 'car', anc: true, icon: b[0], type: b[1], name: b[1], where: b[4] ? 'in ' + s.city : '', value: cost, price: cost, cond: 100, upkeep: 0.01 };
          if (b[5]) asset.rents = pen(b[5]);
          if (!b[4] && b[1] === 'Book of hours') { asset.kind = 'item'; E.karma(2); }
          s.assets.push(asset);
          if (b[4] && s.home.type !== 'cloister') { s.home = { type: 'owned', id: asset.id }; E.achieve('homeowner'); }
          if (b[1] === 'Castle') E.fame(10);
          done(good('I bought ' + E.an(b[1].toLowerCase()) + '! ' + b[0]));
        } });
      });
      items.push({ section: 'Invest' });
      items.push({ icon: '🐑', label: 'Buy land to let to tenants', sub: 'Rents every year, unless the sheep die', right: E.fmt(pen(5000)), onClick: function () { var c = pen(5000); if (s.money < c) return done(nope('I can\'t afford the land.')); E.addMoney(-c); a.inv.push({ kind: 'land', value: c }); done('I bought land and let it to tenant farmers. 🐑'); } });
      items.push({ icon: '⛵', label: 'Ship wool to Flanders', sub: 'Big profits, or pirates', onClick: function () { invest('wool'); } });
      items.push({ icon: '🪙', label: 'Lend money', sub: 'The Church calls interest the sin of usury', onClick: function () { invest('loan'); } });
      return items;
    });
  }
  function invest(kind) {
    var s = S();
    ui().choose(kind === 'wool' ? 'Wool shipment' : 'Lend money', 'How much of my ' + E.fmt(s.money) + ' should I put in?', [0.1, 0.25, 0.5].map(function (f) {
      return { label: Math.round(f * 100) + '% (' + E.fmt(Math.round(money() * f)) + ')', fn: function () {
        var amt = Math.round(money() * f);
        if (amt < pen(100)) return done(nope('That\'s not enough to bother with.'));
        E.addMoney(-amt);
        var v = { kind: kind, amt: amt, due: y() + 1 };
        if (kind === 'wool') { v.to = U.pick(['Bruges', 'Ghent', 'Antwerp', 'Calais', 'Ypres', 'Florence']); done('I sent bales of English wool to ' + v.to + '. 🐑'); }
        else { var c = D.country(s.country); v.who = U.pick(c.male) + ' ' + U.pick(c.last); E.karma(-2); done('I lent ' + E.fmt(amt) + ' to ' + v.who + ', quietly.'); }
        st().inv.push(v);
      } };
    }));
  }
  function moveMenu() {
    var s = S();
    ui().choose('Where should I live?', 'Rent is due every year.', [['parents', 'Live with my family'], ['hovel', HOMES.hovel[0] + ' (' + E.fmt(pen(HOMES.hovel[1])) + '/yr)'], ['cottage', HOMES.cottage[0] + ' (' + E.fmt(pen(HOMES.cottage[1])) + '/yr)'], ['town', HOMES.town[0] + ' (' + E.fmt(pen(HOMES.town[1])) + '/yr)']].map(function (h) {
      return { label: h[1], fn: function () {
        if (h[0] === 'parents') { if (!E.parentsAround().length) return done(nope('My parents are gone.')); s.home = { type: 'parents' }; return done('I moved back in with my family.'); }
        var tier = { hovel: 0, cottage: 1, town: 2 }[h[0]];
        s.home = { type: 'rent', tier: tier, anc: h[0], mult: HOMES[h[0]][1] * 50 / E.RENT_TIERS[tier][1] };
        done('I moved into ' + HOMES[h[0]][0].toLowerCase() + '.');
      } };
    }));
  }

  // ------------------------------------------------------------ activities
  var SHRINES = [['Canterbury', 'the shrine of Saint Thomas Becket', 80, 0.02, 1173], ['Walsingham', 'the shrine of Our Lady of Walsingham', 60, 0.02, 1150], ['Santiago de Compostela', 'the tomb of Saint James in Spain', 900, 0.06, 1150],
    ['Rome', 'the tombs of Saint Peter and Saint Paul', 1600, 0.08, 1150], ['Jerusalem', 'the Holy Sepulchre', 4000, 0.15, 1150]];
  function activitiesMenu() {
    ui().menu('Activities', function () {
      var s = S(), a = st(), age = me().age, items = [], free = !serf();
      items.push({ section: 'Mind & Body' });
      if (age >= 10) items.push({ icon: '🏹', label: 'Practice archery at the butts', onClick: function () { var f = 1 / (1 + count('m_bow')); bump('m_bow'); me().athl = Math.min(100, me().athl + Math.round(4 * f)); E.stat('health', 2 * f); done(U.pick(['I hit the mark three times running. 🏹', 'I loosed arrows until my fingers bled.', 'My arrow split a wand at a hundred paces. The old men were impressed.'])); } });
      if (age >= 8) items.push({ icon: '🤼', label: 'Wrestle on the village green', onClick: function () { var f = 1 / (1 + count('m_wrestle')); bump('m_wrestle'); me().athl = Math.min(100, me().athl + Math.round(3 * f)); E.stat('happy', 3 * f); done(U.chance(0.5) ? 'I threw the miller\'s son and won a ram! 🐏' : 'I ended up face down in the mud.'); } });
      if (age >= 8 && a.edu) items.push({ icon: '📖', label: 'Read a book', onClick: function () { var f = 1 / (1 + count('m_read')); bump('m_read'); E.stat('smarts', 4 * f); done('I read ' + U.pick(['the tales of King Arthur', 'a bestiary', 'the Psalms', 'Bede\'s history of England', y() >= 1400 ? 'Chaucer\'s Canterbury Tales' : 'the Romance of the Rose']) + '. 📖'); } });
      items.push({ section: 'Education' });
      if (age >= 6 && age <= 13 && !a.edu) items.push({ icon: '🧑‍🏫', label: gentle() ? 'Study with a tutor' : 'Learn letters from the parish priest', sub: 'Reading, writing and a little Latin', right: E.fmt(pen(gentle() ? 0 : 30)), onClick: function () { if (count('m_school')) return done(nope('I already had my lessons this year.')); bump('m_school'); var c = gentle() ? 0 : pen(30); if (s.money < c) return done(nope('The priest wants ' + E.fmt(c) + '.')); E.addMoney(-c); E.stat('smarts', U.rand(3, 7)); if (U.chance(0.4)) { a.edu = 'letters'; return done(good('I can read and write now! ✍️')); } done('I learned some letters, with a few raps on the knuckles.'); } });
      if (age >= 14 && age <= 24 && a.edu && a.edu !== 'university') {
        var uc = pen(240);
        items.push({ icon: '🎓', label: 'Study at ' + (y() >= 1209 && U.chance(0.5) ? 'Cambridge' : 'Oxford'), sub: !male() ? 'Universities admit only men' : serf() ? 'Serfs need their lord\'s leave' : 'Year ' + ((a.uni || 0) + 1) + ' of 3 · Latin, logic and theology', right: E.fmt(uc), disabled: !male() || serf() || count('m_uni') > 0, onClick: function () { if (s.money < uc && a.cls !== 'noble') return done(nope('A year at university costs ' + E.fmt(uc) + '.')); bump('m_uni'); if (a.cls !== 'noble') E.addMoney(-uc); E.stat('smarts', U.rand(3, 6)); a.uni = (a.uni || 0) + 1; if (a.uni >= 3) { a.edu = 'university'; see('Graduated from university', '🎓'); return done(good('I became a Bachelor of Arts! 🎓')); } done(U.pick(['I argued about how many angels can dance on a pin.', 'Students and townsmen brawled in the streets again.', 'I read Aristotle in Latin by candlelight.'])); } });
      }
      if (age >= 6 && !a.edu && !(age <= 13)) items.push({ info: true, html: '<p class="muted">Most people can\'t read. Lessons are for children from 6 to 13.</p>' });
      else if (a.edu && !(age >= 14 && age <= 24 && a.edu !== 'university')) items.push({ info: true, html: '<p class="muted">' + (a.edu === 'university' ? 'I hold a university degree.' : 'I can read and write.') + '</p>' });
      else if (age < 6) items.push({ info: true, html: '<p class="muted">Lessons start at 6.</p>' });
      items.push({ section: 'Health' });
      items.push({ icon: '⚕️', label: 'See a physician', sub: s.conditions.length ? s.conditions.map(illName).join(', ') : 'Herbs, leeches and the stars', onClick: physician });
      items.push({ section: 'Fun & Social' });
      if (age >= 14) items.push({ icon: '🍺', label: 'Drink at the alehouse', right: E.fmt(pen(1)), onClick: function () { var f = 1 / (1 + count('m_ale')); bump('m_ale'); E.addMoney(-pen(1)); E.stat('happy', 6 * f); if (U.chance(0.08)) { E.stat('health', -5); return done(bad('A brawl broke out over a game of dice. I took a stool to the head.')); } done('I drank ale and sang with the whole village. 🍺'); } });
      if (age >= 5) items.push({ icon: '🎪', label: 'Go to the fair', onClick: function () { var f = 1 / (1 + count('m_fair')); bump('m_fair'); E.stat('happy', 6 * f); done(U.pick(['I watched a dancing bear and ate a hot pie. 🥧', 'A juggler swallowed a sword in front of me!', 'I bought ' + U.pick(['a ribbon', 'a tin pilgrim badge', 'some gingerbread', 'a wooden whistle']) + ' at the fair.'])); } });
      if (age >= 6) items.push({ icon: '🎭', label: 'Watch a mystery play', onClick: function () { var f = 1 / (1 + count('m_play')); bump('m_play'); E.stat('happy', 5 * f); E.karma(1); done('The ' + U.pick(['shipwrights', 'bakers', 'butchers', 'goldsmiths']) + '\' guild performed ' + U.pick(['Noah\'s Flood', 'the Harrowing of Hell', 'the Creation', 'the Last Judgment']) + ' on a wagon in the street. 🎭'); } });
      if (age >= 6 && !(s.job && s.job.career === 'm_knight' && s.job.level >= 1)) items.push({ icon: '🐎', label: 'Watch a tournament', onClick: function () { var f = 1 / (1 + count('m_tourn')); bump('m_tourn'); E.stat('happy', 7 * f); done(U.pick(['Lances shattered and knights crashed into the mud. The crowd roared.', 'A knight wore a lady\'s sleeve on his helmet and won every joust.', 'The melee became so wild the heralds had to stop it.'])); } });
      if (age >= 18 && free) items.push({ icon: '🍗', label: 'Hold a feast', sub: 'Impress friends and neighbors', right: E.fmt(pen(gentle() ? 400 : 80)), onClick: feast });
      if (age >= 16 && gentle()) items.push({ icon: '🦅', label: 'Go hawking', sub: 'The sport of lords', onClick: function () { var f = 1 / (1 + count('m_hawk')); bump('m_hawk'); E.stat('happy', 6 * f); E.stat('health', 2 * f); done('My falcon stooped on a heron and brought it down. 🦅'); } });
      if (age >= 12) items.push({ icon: '🎲', label: 'Play at hazard', sub: 'Dice in the alehouse', onClick: dice });
      items.push({ section: 'Faith' });
      items.push({ icon: '⛪', label: 'Go to Mass', onClick: function () { var f = 1 / (1 + count('m_mass')); bump('m_mass'); E.karma(Math.round(2 * f)); E.stat('happy', 2 * f); done(U.pick(['The priest said Mass in Latin. I didn\'t understand a word, but the singing was beautiful.', 'I stood in the nave and watched the light through the painted windows.', 'I gossiped with the neighbors through the whole sermon.'])); } });
      if (age >= 7) items.push({ icon: '🙏', label: 'Confess my sins', onClick: function () { if (count('m_conf')) return done(nope('I already confessed this year.')); bump('m_conf'); var k = S().karma; E.karma(k < 50 ? 6 : 2); done(k < 40 ? 'I confessed everything. The priest gave me a long penance and a longer look.' : 'I confessed my small sins and said my penance.'); } });
      if (age >= 14 && free) items.push({ icon: '🚶', label: 'Go on pilgrimage', sub: 'Canterbury, Walsingham, or far beyond', onClick: pilgrimage });
      if (age >= 14 && free) items.push({ icon: '📜', label: 'Buy an indulgence', sub: 'Pay to shorten my time in Purgatory', right: E.fmt(pen(100)), onClick: function () { var c = pen(100); if (s.money < c) return done(nope('The pardoner wants ' + E.fmt(c) + '.')); if (count('m_indul')) return done(nope('One pardon a year.')); bump('m_indul'); E.addMoney(-c); E.karma(4); done('The pardoner sealed a letter forgiving my sins. He looked very pleased with himself.'); } });
      if (age >= 10 && s.money > 0) items.push({ icon: '🤲', label: 'Give alms to the poor', onClick: function () { if (count('m_alms')) return done(nope('I already gave alms this year.')); bump('m_alms'); var g = Math.max(pen(1), Math.round(money() * 0.02)); E.addMoney(-g); E.karma(5); E.stat('happy', 3); done('I gave ' + E.fmt(g) + ' to the beggars at the church door.'); } });
      if (age >= 10) {
        items.push({ section: 'Crime' });
        [['🦌', 'Poach the king\'s deer', 0.6, 20, 80, 12], ['👛', 'Cut purses at the fair', 0.62, 2, 60, 10], ['🗡️', 'Rob travelers on the highway', 0.45, 60, 1200, 16], ['🕯️', 'Steal the church silver', 0.35, 300, 3000, 18]].forEach(function (c) {
          items.push({ icon: c[0], label: c[1], disabled: age < c[5], onClick: function () { crime(c); } });
        });
      }
      items.push({ section: 'Life' });
      if (age >= 18 && free && s.home.type !== 'cloister') items.push({ icon: '🧭', label: 'Move to another town', onClick: function () { ui().choose('Move where?', 'A fresh start somewhere else in England.', U.shuffle(TOWNS.filter(function (x) { return x !== s.city; })).slice(0, 5).map(function (city) { return { label: city, fn: function () { s.city = city; E.log('🧭 I moved to ' + city + '.'); done('I packed my things on a cart and moved to ' + city + '.'); } }; })); } });
      items.push({ icon: '⏳', label: 'Time Machine', sub: E.tmAges().length ? 'Go back up to ' + U.plural(E.tmAges().length, 'year') : 'Age up to charge it', disabled: !E.tmAges().length, onClick: function () { ui().timeMachine(); } });
      items.push({ icon: '🏆', label: 'Achievements', onClick: TL.actions.achievementsMenu });
      return items;
    });
  }
  function physician() {
    var s = S();
    ui().menu('Physician', function () {
      var items = [{ info: true, html: '<p class="muted">Medieval medicine: the four humors, the stars and a great deal of prayer. Cheap, and uncertain.</p>' }];
      items.push({ icon: '🩺', label: 'Get a checkup', right: E.fmt(pen(12)), onClick: function () { if (count('m_doc')) return done(nope('The physician has seen enough of me this year.')); bump('m_doc'); E.addMoney(-pen(12)); E.stat('health', 2); done('The physician held my urine up to the light, consulted his almanac of the stars and prescribed ' + U.pick(['a poultice of mustard', 'powdered unicorn horn (it was a narwhal)', 'a diet of boiled capon', 'garlic and wine']) + '.'); } });
      items.push({ icon: '🪱', label: 'Be bled with leeches', sub: 'Balance the four humors', onClick: function () { if (count('m_leech')) return done(nope('I\'ve been bled enough for one year.')); bump('m_leech'); E.stat('health', -U.rand(2, 8)); E.stat('happy', 2); done('The barber put leeches on my arms. I felt faint but strangely better.'); } });
      s.conditions.forEach(function (n) {
        var ill = D.illness(n) || { cure: 0.4 };
        if (ill.incurable || !ill.cure) {
          items.push({ icon: '🌿', label: 'Ease ' + illName(n).toLowerCase(), sub: 'No cure, but remedies help', right: E.fmt(pen(20)), onClick: function () {
            if (count('m_treat' + n)) return done(nope('That has to wait until next year.'));
            bump('m_treat' + n); E.addMoney(-pen(20)); E.stat('health', U.rand(3, 7));
            done('Herbs and prayers eased my ' + illName(n).toLowerCase().replace(/^(an?|the) /, '') + ' for a while.');
          } });
          return;
        }
        items.push({ icon: '🌿', label: 'Treat ' + illName(n).toLowerCase(), sub: Math.round(ill.cure * 50) + '% chance it works', right: E.fmt(pen(30)), onClick: function () {
          if (count('m_treat' + n)) return done(nope('That has to wait until next year.'));
          bump('m_treat' + n); E.addMoney(-pen(30));
          if (U.chance(ill.cure * 0.5)) { E.removeCondition(n); E.stat('health', 6); return done(good('The remedy worked. I\'m over my ' + illName(n).toLowerCase().replace(/^(an?|the) /, '') + '.')); }
          done(bad('The remedy did nothing.'));
        } });
      });
      return items;
    });
  }
  function feast() {
    var s = S(), c = pen(gentle() ? 400 : 80);
    if (s.money < c) return done(nope('A proper feast costs ' + E.fmt(c) + '.'));
    if (count('m_feast')) return done(nope('One feast a year is plenty.'));
    bump('m_feast'); E.addMoney(-c); E.stat('happy', 8); E.fame(1);
    s.people.filter(function (p) { return p.alive && /friend|spouse|partner/.test(p.role); }).forEach(function (p) { E.rel(p, U.rand(4, 10)); });
    done(good(gentle() ? 'I served a roast swan, a peacock in its feathers and a pie with live blackbirds inside. 🍗' : 'I roasted a pig and opened a barrel of ale for the whole street. 🍗'));
  }
  function dice() {
    var s = S(), bet = pen(4);
    bump('m_dice');
    if (s.money < bet) return done(nope('I don\'t even have ' + E.fmt(bet) + ' to bet.'));
    if (U.chance(0.45)) { E.addMoney(bet); return done('I threw a seven! I won ' + E.fmt(bet) + '. 🎲'); }
    E.addMoney(-bet); done('I threw crabs. I lost ' + E.fmt(bet) + '.');
  }
  function pilgrimage() {
    var s = S(), a = st();
    ui().choose('Go on pilgrimage', 'Where shall I go?', SHRINES.filter(function (x) { return y() >= x[4]; }).map(function (sh) {
      return { label: sh[0] + ' (' + E.fmt(pen(sh[2])) + ')', fn: function () {
        var c = pen(sh[2]);
        if (count('m_pilgrim')) return done(nope('One pilgrimage a year is all I can manage.'));
        if (s.money < c) return done(nope('The journey to ' + sh[0] + ' costs ' + E.fmt(c) + '.'));
        bump('m_pilgrim'); E.addMoney(-c); E.karma(sh[2] >= 900 ? 10 : 5); E.stat('happy', 6);
        if (a.pilgrimages.indexOf(sh[0]) < 0) { a.pilgrimages.push(sh[0]); see('Pilgrimage to ' + sh[0], '🐚'); }
        if (U.chance(sh[3])) { if (sh[2] >= 900 && U.chance(0.4)) { E.die('a fever on the road to ' + sh[0]); return done(bad('I never came home.')); } E.stat('health', -U.rand(8, 20)); return done(bad('Bandits robbed us on the road to ' + sh[0] + ' and beat me badly.')); }
        if (s.conditions.length && U.chance(0.15)) { var n = s.conditions[0]; E.removeCondition(n); return done(good('I prayed at ' + sh[1] + '. When I rose, my ' + illName(n).toLowerCase().replace(/^(an?|the) /, '') + ' was gone. A miracle!')); }
        done('I walked to ' + sh[1] + ' with a band of pilgrims, telling tales the whole way. I came home with a badge on my hat. 🐚');
      } };
    }));
  }
  function crime(c) {
    var s = S();
    bump('m_crime'); s.counts.crimes++; E.karma(c[0] === '🕯️' ? -10 : -3);
    if (U.chance(c[2] + me().athl / 400)) { var g = pen(U.rand(c[3], c[4])); E.addMoney(g); return done(c[0] === '🦌' ? 'I brought home a deer under cover of night. We ate well, and sold the rest for ' + E.fmt(g) + '. 🤫' : 'I got away with ' + E.fmt(g) + '. 🤫'); }
    s.record.push({ crime: c[1], year: s.year });
    var r = U.rand(1, 100);
    if (c[4] >= 1000 && r <= 25) { s.pending.push({ id: 'm_trial', data: { crime: c[1] } }); return done(bad('I was caught and thrown in the county gaol to wait for the king\'s judges.')); }
    if (r <= 45) { E.stat('happy', -10); E.fame(1); return done(bad('I was caught and put in the stocks. The whole town threw rotten cabbages at me.')); }
    var fine = Math.min(money(), pen(U.rand(20, 300))); E.addMoney(-fine);
    done(bad('I was caught and fined ' + E.fmt(fine) + ' in the ' + (serf() ? 'manor court' : 'hundred court') + '.'));
  }

  // ---- relationships: things to do together, and weddings
  var ACTS = [['🍺', 'Share ale at the alehouse', 50, ['Outgoing', 'Funny'], ['Shy'], 'shared ale with', 10], ['⛪', 'Walk to church together', 0, ['Kind', 'Loyal'], [], 'walked to church with', 6],
    ['🎪', 'Go to the fair', 100, ['Outgoing', 'Cheerful'], [], 'went to the fair with', 8], ['🏹', 'Shoot at the butts', 0, ['Athletic', 'Stubborn'], [], 'practiced archery with', 8],
    ['🎭', 'Watch a mystery play', 0, ['Artsy', 'Romantic'], [], 'watched a mystery play with', 10], ['🐎', 'Watch a tournament', 100, ['Athletic', 'Ambitious'], ['Kind'], 'watched a tournament with', 8],
    ['🎲', 'Play dice', 0, ['Greedy', 'Funny'], ['Shy'], 'played dice with', 12], ['💃', 'Dance around the maypole', 0, ['Romantic', 'Cheerful'], ['Shy'], 'danced around the maypole with', 8]];
  var KID_ACTS = [['🏑', 'Play stoolball', 0, ['Athletic'], [], 'played stoolball with'], ['🙈', 'Play hoodman blind', 0, [], [], 'played hoodman blind with'], ['🐕', 'Play with the dog', 0, [], [], 'played with the dog with']];
  var OLD_ACTS = [['🔥', 'Tell tales by the fire', 0, ['Loyal', 'Kind'], [], 'told tales by the fire with'], ['♟️', 'Play chess', 0, ['Smart', 'Stubborn'], [], 'played chess with'], ['🌳', 'Walk in the orchard', 0, ['Cheerful'], [], 'walked in the orchard with']];
  function acts(kind) { return kind === 'kid' ? KID_ACTS : kind === 'old' ? OLD_ACTS : ACTS; }
  var WEDDINGS = [['⛪', 'Vows at the church door', 100], ['🍺', 'A church wedding and a village feast', 3000], ['🏰', 'A great feast in the hall', 30000], ['👑', 'A wedding fit for a royal court', 150000]];

  // ------------------------------------------------------------ events
  function def(id, o) { o.id = id; o.ancient = 'medieval'; o.w = o.w || 10; TL.events.defs[id] = o; }
  function sdef(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  def('m_harvest', { min: 10, w: 5, cond: function () { return !gentle(); }, build: function () {
    return { icon: '🌧️', title: 'A bad harvest', text: 'Rain flattened the wheat and the barley rotted. Winter will be hungry.', choices: [
      { label: 'Tighten our belts', run: function () { E.stat('health', -U.rand(3, 9)); E.stat('happy', -4); return 'We ate pottage of beans and nettles until spring.'; } },
      { label: 'Buy grain at any price', run: function () { E.addMoney(-Math.min(money(), pen(U.rand(40, 120)))); return 'The grain merchants doubled their prices, but we ate.'; } }
    ] };
  } });
  def('m_tithe', { min: 18, w: 4, cond: function () { return S().money > 0 && !(S().job && /m_(monk|priest)/.test(S().job.career)); }, build: function () {
    var amt = Math.max(pen(5), Math.round(money() * 0.1));
    return { icon: '🌾', title: 'The tithe', text: 'The priest\'s man has come for the tithe: a tenth of everything, ' + E.fmt(amt) + '.', choices: [
      { label: 'Pay it', run: function () { E.addMoney(-amt); E.karma(2); return 'I paid. God\'s tenth.'; } },
      { label: 'Hide the best sheaves', run: function () { E.addMoney(-Math.round(amt / 3)); E.karma(-4); if (U.chance(0.25)) { E.stat('happy', -8); return bad('The priest found out and named me from the pulpit. The whole parish stared.'); } return 'I paid him in my worst sheaves.'; } }
    ] };
  } });
  def('m_boon', { min: 14, w: 6, cond: function () { return serf(); }, build: function () {
    return { icon: '🌾', title: 'Boon work', text: 'Harvest time. The bailiff orders every serf to reap the lord\'s fields first, while our own grain waits.', choices: [
      { label: 'Reap the lord\'s fields', run: function () { E.stat('health', -2); E.stat('happy', -3); return 'We worked the lord\'s harvest. Ours half-rotted in the rain.'; } },
      { label: 'Bring in my own harvest first', run: function () { if (U.chance(0.5)) { E.addMoney(-Math.min(money(), pen(U.rand(10, 60)))); return bad('The manor court fined me for shirking.'); } E.addMoney(pen(U.rand(10, 40))); return good('Nobody noticed. My family has a good store for winter.'); } }
    ] };
  } });
  def('m_pardoner', { min: 12, w: 3, build: function () {
    var relic = U.pick(['a feather from the Archangel Gabriel', 'a toe of Saint Peter', 'a piece of Noah\'s Ark', 'a jar of the Virgin\'s tears']);
    return { icon: '🦴', title: 'The pardoner', text: 'A traveling pardoner offers to sell me ' + relic + ' for ' + E.fmt(pen(40)) + '.', choices: [
      { label: 'Buy the relic', run: function () { var c = Math.min(money(), pen(40)); E.addMoney(-c); E.stat('happy', 4); return 'I keep it by my bed. It looks a lot like a pig bone.'; } },
      { label: 'Call him a fraud', run: function () { E.stat('smarts', 1); return U.chance(0.5) ? 'The crowd laughed him out of the village.' : 'The crowd sided with the pardoner and called me a heretic.'; } }
    ] };
  } });
  def('m_cunning', { min: 14, w: 3, build: function () {
    return { icon: '🌿', title: 'The cunning woman', text: 'An old woman at the edge of the village sells charms and potions. She says she can help me.', choices: [
      { label: 'Buy a healing charm', run: function () { E.addMoney(-Math.min(money(), pen(6))); if (U.chance(0.4)) { E.stat('health', 5); return good('Her herbs actually worked. I felt better within days.'); } return 'I wore the charm for a month. Nothing happened.'; } },
      { label: 'Buy a love potion', run: function () { E.addMoney(-Math.min(money(), pen(10))); E.stat('looks', U.chance(0.3) ? 2 : 0); return 'It tasted of onions and regret.'; } },
      { label: 'Keep away from her', run: function () { return 'Some say she\'s a witch. I didn\'t want to find out.'; } }
    ] };
  } });
  def('m_thatch', { min: 10, w: 3, cond: function () { return S().home.type !== 'cloister'; }, build: function () {
    return { icon: '🔥', title: 'Fire in the thatch', text: 'A spark from the hearth caught the thatch. The roof is burning!', choices: [
      { label: 'Save what we can', run: function () { E.addMoney(-Math.round(money() * 0.1)); E.stat('health', -U.rand(0, 6)); return 'We dragged out the bedding and the pots. The roof is gone.'; } },
      { label: 'Call the neighbors with buckets', run: function () { E.karma(2); if (U.chance(0.6)) return good('The whole street formed a line to the well. We saved the house.'); E.addMoney(-Math.round(money() * 0.15)); return bad('Too late. The fire spread to the barn.'); } }
    ] };
  } });
  def('m_outlaws', { min: 14, w: 3, build: function () {
    return { icon: '🌲', title: 'Outlaws in the greenwood', text: 'On the forest road, men in green stepped out from the trees with bows drawn.', choices: [
      { label: 'Hand over my purse', run: function () { E.addMoney(-Math.min(money(), pen(U.rand(5, 60)))); return 'They took my purse and melted back into the forest.'; } },
      { label: 'Tell them I\'m poor', run: function () { if (money() < pen(200) || U.chance(0.3)) { E.stat('happy', 4); return good('Their leader laughed and let me go. "We only rob the rich," he said.'); } E.addMoney(-Math.min(money(), pen(U.rand(30, 120)))); E.stat('health', -6); return bad('They searched me, found my coins and gave me a thrashing for lying.'); } }
    ] };
  } });
  def('m_minstrel', { min: 4, w: 4, build: function () {
    return { icon: '🎶', title: 'A minstrel comes to town', text: 'A wandering minstrel is singing of ' + U.pick(['Robin Hood', 'King Arthur and the Green Knight', 'the Lionheart', 'a fair maid and a false knight']) + ' in the square.', choices: [
      { label: 'Toss him a penny', run: function () { E.addMoney(-Math.min(money(), pen(1))); E.stat('happy', 5); E.karma(1); return 'He bowed and sang one more verse just for me.'; } },
      { label: 'Just listen', run: function () { E.stat('happy', 3); return 'I hummed his tune all week.'; } }
    ] };
  } });
  def('m_winter', { min: 3, w: 3, build: function () {
    return { icon: '❄️', title: 'A hard winter', text: 'The rivers froze and snow buried the roads for weeks.', choices: [{ label: 'Huddle by the fire', run: function () { E.stat('health', -U.rand(2, 8)); return U.pick(['We burned our furniture to stay warm.', 'We slept with the animals for the warmth.', 'Frost fairs were held on the frozen river. I slid on the ice.']); } }] };
  } });
  def('m_crusade', { min: 16, max: 45, w: 8, cond: function () { var yr = y(); return male() && !serf() && !st().crusader && ((yr >= 1188 && yr <= 1191) || (yr >= 1217 && yr <= 1220) || (yr >= 1248 && yr <= 1250) || (yr >= 1270 && yr <= 1271)); }, build: function () {
    return { icon: '✝️', title: 'Take the cross', text: 'A friar is preaching a crusade to the Holy Land. All who go will have their sins forgiven.', choices: [
      { label: 'Take the cross', run: function () {
        var a = st(); a.crusader = true; E.karma(10); see('Went on crusade', '✝️');
        var r = U.rand(1, 100);
        if (r <= 22) { E.die(U.pick(['the bloody flux on crusade', 'a Saracen arrow at Acre', 'thirst in the desert on crusade'])); return bad('I never saw England again.'); }
        E.achieve('crusader');
        if (r <= 50) { E.stat('health', -U.rand(10, 25)); return 'I came home years later, thin and scarred, with a palm leaf from Jerusalem.'; }
        var g = pen(U.rand(200, 3000)); E.addMoney(g); E.fame(4); return good('I fought in the Holy Land and came home with glory and plunder worth ' + E.fmt(g) + '.');
      } },
      { label: 'Stay home', run: function () { return 'Someone has to mind the fields.'; } }
    ] };
  } });
  def('m_marriage', { min: 15, max: 35, w: 7, cond: function () { return !E.partner() && !(S().job && /m_(monk|priest|anchor)/.test(S().job.career)); }, build: function () {
    if (S().job && /m_(monk|priest|anchor)/.test(S().job.career)) return null;
    var c = D.country(S().country), g = me().interest === 'A' ? (U.chance(0.5) ? 'M' : 'F') : me().interest, nm = U.pick(g === 'M' ? c.male : c.female) + ' ' + U.pick(c.last);
    var fee = serf() ? Math.min(money(), pen(20)) : 0;
    return { icon: '💍', title: 'An arranged match', text: 'My family has arranged a marriage to ' + nm + (gentle() ? ', whose family brings good land with them.' : ', from a respectable family.') + (fee ? ' The lord demands his merchet fee of ' + E.fmt(fee) + ' first.' : ''), choices: [
      { label: 'Agree to the marriage', run: function () { if (fee) E.addMoney(-fee); var p = E.addPerson({ role: 'spouse', gender: g, age: me().age + U.rand(-3, 8), rel: U.rand(40, 75) }); p.first = nm.split(' ')[0]; p.last = nm.split(' ').slice(1).join(' '); E.achieve('married'); E.stat('happy', 8); return good('We were married at the church door. 💍'); } },
      { label: 'Refuse', run: function () { E.people(['mother', 'father']).forEach(function (p) { E.rel(p, -15); }); return 'My family is furious with me.'; } }
    ] };
  } });
  def('m_roses_side', { min: 18, w: 30, cond: function () { var j = S().job; return y() >= 1455 && y() <= 1484 && !st().rose && j && (j.career === 'm_court' || (j.career === 'm_knight' && j.level >= 2)); }, build: function () {
    return { icon: '🌹', title: 'York or Lancaster?', text: 'The great lords are choosing sides. Everyone at court and every knight must choose too.', choices: [
      { label: '🤍 The white rose of York', run: function () { st().rose = 'york'; if (S().job) S().job.rose = 'york'; return 'I wear the white rose now.'; } },
      { label: '❤️ The red rose of Lancaster', run: function () { st().rose = 'lancaster'; if (S().job) S().job.rose = 'lancaster'; return 'I wear the red rose now.'; } }
    ] };
  } });
  sdef('m_blackdeath', { build: function () {
    return { icon: '💀', title: 'The Black Death', text: 'The pestilence is here. People wake up healthy and are dead by evening, black swellings under their arms. The priests say it is God\'s judgment.', choices: [
      { label: 'Flee to the countryside', run: function () { return survive(0.16, 'I fled with what I could carry and stayed away from everyone until it passed.'); } },
      { label: 'Stay and care for the sick', run: function () { E.karma(12); return survive(0.38, 'I nursed my neighbors and buried the dead. Somehow, God spared me.'); } },
      { label: 'Bolt the door and pray', run: function () { E.karma(2); return survive(0.26, 'We sealed the house and prayed day and night. We lived.'); } }
    ] };
  } });
  function survive(p, text) {
    p *= 1.5 - me().health / 100;
    if (U.chance(p)) { E.die('the Black Death'); return bad('The swellings came, then the fever. I did not recover.'); }
    E.achieve('black_death'); see('Survived the Black Death', '💀'); E.stat('happy', -10);
    return good(text);
  }
  sdef('m_revolt', { build: function () {
    return { icon: '🔥', title: 'The Peasants\' Revolt', text: 'Wat Tyler and the preacher John Ball are leading thousands of commoners to London. "When Adam delved and Eve span, who was then the gentleman?"', choices: [
      { label: 'March on London', run: function () {
        see('Marched with Wat Tyler', '🔥');
        var r = U.rand(1, 100);
        if (r <= 8) { E.die('the hangman, after the Peasants\' Revolt'); return bad('After the revolt failed, the king\'s men hunted down the leaders. I was hanged.'); }
        if (r <= 35) { E.stat('health', -U.rand(10, 20)); return bad('The young king promised us freedom, then broke his word. Soldiers beat us all the way home.'); }
        E.stat('happy', 6); return 'We burned the Savoy Palace and met the boy king at Smithfield. Wat Tyler was killed, and the promises were broken. But we were heard.';
      } },
      { label: 'Keep my head down', run: function () { return 'I stayed home and kept out of trouble.'; } }
    ] };
  } });
  sdef('m_dubbing', { build: function () {
    var cost = pen(2000);
    return { icon: '🗡️', title: 'Arise, Sir Knight', text: 'My lord says I am ready to be knighted. The ceremony, the feast and the harness will cost ' + E.fmt(cost) + '.', choices: [
      { label: 'Keep the vigil and be dubbed', run: function () {
        var j = S().job; if (!j || j.career !== 'm_knight') return 'The moment passed.';
        if (S().money < cost && !gentle()) { j.asked = false; return 'I couldn\'t afford it. I\'ll stay a squire for now.'; }
        E.addMoney(-Math.min(money(), cost)); j.level = 2; j.levelYears = 0; E.achieve('knighted'); E.fame(4); E.stat('happy', 15); see('Was knighted', '🗡️');
        return good('I prayed all night before the altar. At dawn my lord struck my shoulder with his sword. I am Sir ' + me().first + ' now! 🗡️');
      } },
      { label: 'Stay a squire', run: function () { var j = S().job; if (j) j.asked = false; return 'Knighthood is expensive. Many squires never take it.'; } }
    ] };
  } });
  sdef('m_trial', { build: function (d) {
    var a = st(), crime = d && d.crime ? d.crime.toLowerCase() : 'my crime', ordeal = y() < 1215, choices = [];
    if (a.edu && !a.clergy) choices.push({ label: 'Plead benefit of clergy (read the neck verse)', run: function () { a.clergy = true; E.achieve('neck_verse'); E.stat('health', -4); return good('I read Psalm 51 in Latin. The court ruled I was a clerk and handed me to the Church. They branded my thumb, and I walked free.'); } });
    if (ordeal) choices.push({ label: 'Trial by ordeal: carry the hot iron', run: function () { E.stat('health', -U.rand(5, 12)); if (U.chance(0.35 + S().karma / 300)) return good('I carried the glowing iron nine paces. Three days later the burn was clean. God declared me innocent.'); return hang('The burn festered. God had judged me guilty.'); } });
    else choices.push({ label: 'Trust the jury', run: function () { if (U.chance(0.45)) return good('The jury were my neighbors. They found me not guilty.'); return hang('The jury found me guilty.'); } });
    choices.push({ label: 'Flee into sanctuary', run: function () { var s = S(); E.addMoney(-Math.round(money() * 0.6)); s.assets = s.assets.filter(function (x) { return !x.anc || x.kind !== 'house'; }); if (s.home.type === 'owned') s.home = JSON.parse(JSON.stringify(TXT.rentHome)); s.city = U.pick(TOWNS.filter(function (t) { return t !== s.city; })); E.karma(-4); return 'I broke free and clung to the church altar. After forty days I swore to leave, and lost nearly everything. I started over in ' + s.city + '.'; } });
    return { icon: '⚖️', title: 'Before the king\'s judges', text: 'I stand accused of ' + crime + '. The punishment is death by hanging.', choices: choices };
  } });
  function hang(why) { if (U.chance(0.4)) { E.die('the gallows'); return bad(why + ' I was hanged.'); } E.addMoney(-Math.round(money() * 0.5)); E.stat('happy', -15); return bad(why + ' The king pardoned me for a heavy fine.'); }
  sdef('m_freedom', { build: function () {
    var a = st(), price = pen(y() >= 1450 ? 300 : 900);
    return { icon: '🕊️', title: 'A charter of freedom', text: a.lord + ' needs money' + (y() >= 1350 ? ' and can\'t find workers since the pestilence' : '') + '. He offers to sell me my freedom for ' + E.fmt(price) + '.', choices: [
      { label: 'Pay for my freedom', run: function () { if (S().money < price) return 'I didn\'t have enough saved.'; E.addMoney(-price); freeMe('charter'); return good('He sealed the charter. My children will be born free.'); } },
      { label: 'Not now', run: function () { return 'I stayed on the manor.'; } }
    ] };
  } });
  sdef('m_tower', { build: function () {
    var k = king(y());
    return { icon: '🏰', title: 'The Tower', text: royal(k) + ' suspects me of treason. Guards have taken me to the Tower of London.', choices: [
      { label: 'Beg the king for mercy', run: function () { if (U.chance(0.55)) { var f = Math.round(money() * 0.4); E.addMoney(-f); E.quitJob(true); return 'The king spared my life for ' + E.fmt(f) + ' and banished me from court.'; } E.die('the headsman on Tower Hill'); return bad('I was beheaded on Tower Hill.'); } },
      { label: 'Bribe a guard and escape', run: function () { if (U.chance(0.4)) { E.addMoney(-Math.round(money() * 0.3)); E.quitJob(true); S().city = U.pick(TOWNS); return good('I slipped out by the river gate and hid in the country.'); } E.die('the headsman on Tower Hill'); return bad('The guard took my money and betrayed me.'); } }
    ] };
  } });
  sdef('m_mayor', { build: function () {
    return { icon: '🏛️', title: 'Lord Mayor of London', text: 'The city\'s aldermen want me to be Lord Mayor of London.', choices: [
      { label: 'Accept the chain of office', run: function () { st().mayor = true; E.fame(15); E.stat('happy', 12); see('Lord Mayor of London', '🏛️'); return good('I rode through the streets in scarlet. Turn again, Lord Mayor of London!'); } },
      { label: 'Decline', run: function () { return 'I prefer counting my money to counting other people\'s.'; } }
    ] };
  } });

  // ------------------------------------------------------------ about & recap
  function aboutRows() { return [['🏰 Class', CLASS_NAME[st().cls]], ['👑 King', royal(king(S().year))]]; }
  function recapRow() {
    var a = st(), s = S(), out = [], hist = (s.jobHistory || []).concat(s.job ? [{ career: s.job.career, title: E.jobTitle(s.job) }] : []);
    var had = function (id) { return hist.some(function (h) { return h.career === id; }); };
    if (s.ach.indexOf('knighted') >= 0 || a.tourney) out.push(['🛡️', 'Knighthood', (s.ach.indexOf('knighted') >= 0 ? 'Knighted' : 'Squire') + (a.tourney ? ', ' + U.plural(a.tourney, 'tournament') + ' won' : '') + (a.ransoms ? ', ' + U.plural(a.ransoms, 'prisoner') + ' ransomed' : '')]);
    if (a.campaigns.length) out.push(['⚔️', 'At war', a.campaigns.slice(0, 3).join(', ') + (a.campaigns.length > 3 ? ' and more' : '')]);
    if (a.crusader) out.push(['✝️', 'Crusader', 'Took the cross']);
    var court = hist.filter(function (h) { return h.career === 'm_court'; });
    if (court.length) out.push(['👑', 'At court', court.map(function (h) { return h.title; }).filter(Boolean).pop() || 'Served the king']);
    if (a.mayor) out.push(['🏛️', 'Lord Mayor', 'Lord Mayor of London']);
    if (had('m_monk') || had('m_priest')) out.push(['⛪', 'The Church', s.ach.indexOf('abbot') >= 0 ? 'Rose to the top of the Church' : 'Served the Church']);
    if (a.anchor) out.push(['🕯️', male() ? 'Anchorite' : 'Anchoress', 'Counseled ' + U.plural(a.anchor.counsel, 'soul') + (a.anchor.book ? ', wrote a book of revelations' : '')]);
    if (had('m_midwife')) out.push(['🤱', 'Midwife', 'Brought the village\'s children into the world']);
    if (s.ach.indexOf('master_craftsman') >= 0) out.push(['🏆', 'Guild master', 'Made a masterpiece']);
    if (a.pilgrimages.length) out.push(['🐚', 'Pilgrim', a.pilgrimages.join(', ')]);
    if (a.freed) out.push(['🕊️', 'Freedom', 'Born a serf, died free']);
    if (s.ach.indexOf('black_death') >= 0) out.push(['💀', 'The Black Death', 'Survived it']);
    return out;
  }
  var TOPICS = [['the last tournament', ['Athletic', 'Outgoing']], ['the harvest', ['Stubborn']], ['the saints and their miracles', ['Kind']], ['ballads and songs', ['Artsy']],
    ['the price of wool', ['Greedy', 'Ambitious']], ['their dreams and goals', ['Ambitious', 'Romantic']], ['love and marriage', ['Romantic', 'Jealous']],
    ['jokes and gossip', ['Funny', 'Cheerful']], ['charity for the poor', ['Kind', 'Generous']], ['old memories', ['Loyal', 'Kind']],
    ['other people\'s scandals', ['Jealous', 'Mean']], ['how they\'re really feeling', ['Moody', 'Shy']], ['the king and his barons', [], true], ['God and the Church', [], true], ['the weather', []]];
  var KID_TOPICS = [['dragons and giants', []], ['games of hoodman blind', ['Lazy']], ['animals', ['Kind']], ['their lessons', ['Nerdy']], ['knights and their deeds', ['Athletic']], ['their drawings', ['Artsy']]];
  var ACH = ['centenarian', 'millionaire', 'married', 'divorced', 'parent', 'bigfamily', 'homeowner', 'mogul', 'famous', 'ceo', 'petlover', 'saint', 'villain', 'gymrat', 'genius', 'heartbreaker', 'dynasty', 'survivor', 'retired', 'timetraveler', 'history_buff',
    'knighted', 'crusader', 'black_death', 'master_craftsman', 'abbot', 'town_air', 'tourney_champ', 'neck_verse', 'agincourt', 'mystic'];
  // What medieval English people called each condition (the game still tracks the modern one).
  var ILL = { 'Common Cold': 'A Rheum', 'Flu': 'A Fever', 'Ear Infection': 'An Earache', 'Chickenpox': 'The Pox', 'Strep Throat': 'A Quinsy', 'Asthma': 'Tightness of the Chest',
    'Acne': 'Pimples', 'Migraine': 'The Megrim', 'PTSD': 'Battle Terrors', 'Depression': 'Melancholy', 'Anxiety': 'Troubled Spirits', 'Insomnia': 'Sleeplessness',
    'Food Poisoning': 'The Flux', 'Kidney Stones': 'The Stone', 'Pneumonia': 'A Pleurisy', 'High Blood Pressure': 'Too Much Blood',
    'Type 2 Diabetes': 'The Wasting Thirst', 'Arthritis': 'Aching Joints', 'Heart Disease': 'A Weak Heart', 'Cancer': 'A Canker', 'Dementia': 'Dotage',
    'Osteoporosis': 'Brittle Bones', 'Chlamydia': 'The Burning', 'Herpes': 'Sores', 'Broken Arm': 'A Broken Arm', 'Broken Leg': 'A Broken Leg',
    'Concussion': 'A Blow to the Head', 'Alcoholism': 'Drunkenness', 'Gambling Addiction': 'A Love of Dice', 'Nicotine Addiction': 'A Bad Habit' };
  function illName(n) { return ILL[n] || n; }
  // Continuing as my heir: the family keeps its standing (engine.continueAs).
  // Lords and knights keep the family seat when their parents die; serfs hold their cottage from the lord.
  function housed() { return gentle() || serf(); }
  function heir(old) {
    var a = st(), o = old || {};
    a.cls = o.cls || 'free';
    if (a.cls === 'villein') { a.lord = o.lord; if (o.fled) { a.fled = o.fled; a.village = o.village; a.fledTo = o.fledTo; } }
    a.king = king(y());
    if ((a.cls === 'noble' || a.cls === 'gentry') && me().age >= 14) a.edu = 'letters'; // tutored at home
    var lines = { noble: '🏰 I am heir to my family\'s lands and titles.', gentry: '🛡️ The family manor passes to my generation.', burgher: '🏘️ I carry on my family\'s place among the townsfolk.', free: '🌾 Like my parents, I am a free peasant.', villein: '🌾 Like my parents, I am a serf on the manor of ' + a.lord + '.' };
    E.log(lines[a.cls], a.cls === 'villein' ? 'bad' : '');
  }
  function birthOptions() { return [['medieval', '🏰 Medieval England · 1150–1420']]; }
  var TXT = {
    matchSub: 'Most marriages are arranged', matchEvent: 'm_marriage',
    pranks: ['put a frog in their ale', 'sewed their sleeves shut while they slept', 'hid their shoes in the thatch', 'swapped their ale for vinegar'],
    argue: ['money', 'chores', 'their attitude', 'the king', 'the harvest', 'which saint to pray to', 'something they said years ago'],
    bored: 'They kept yawning the whole time.', partySick: 'We drank so much ale that I was sick for days.',
    dates: ['a feast at the alehouse', 'the summer fair', 'a mystery play', 'a walk by the river', 'the May Day dance', 'a tournament', 'a picnic in the meadow'],
    gifts: [['🍯', 'A pot of honey', 100], ['🌸', 'A garland of flowers', 150], ['🎀', 'A silk ribbon', 600], ['📿', 'A string of amber beads', 1500], ['💍', 'A gold ring', 20000], ['🐎', 'A palfrey', 150000]],
    pray: ['🙏 Pray to Saint Margaret', 'I\'ve already prayed to Saint Margaret this year.', 'Saint Margaret heard our prayers!', 'We lit candles before Saint Margaret, patron of childbirth.'],
    adoptIcon: '🤲', adoptFee: ' in gifts to the Church and to the child\'s family.', lawyer: 'Serjeant\'s fee ',
    parentsGone: 'With my parents gone, I rented a cottage of my own.', moveOut: 'a thatched cottage', rentHome: { type: 'rent', tier: 1, anc: 'cottage', mult: HOMES.cottage[1] * 50 / 12000 },
    youngDeaths: ['a fever', 'a fall from a horse', 'drowning in the millpond', 'a festering wound', 'the bloody flux'],
    npcDeaths: { old: ['old age', 'a fever', 'a stroke', 'dropsy'], young: ['a fever', 'the pox', 'the bloody flux', 'an accident'], adult: ['a fever', 'an accident in the fields', 'a festering wound', 'the bloody flux', 'a pleurisy'] },
    child: 'Child'
  };
  function txt(k) { return TXT[k]; }

  return { on: on, st: st, setup: setup, yearly: yearly, jobYear: jobYear, salary: salary, title: title, career: career, npcJob: npcJob, homeLabel: homeLabel,
    occupationMenu: occupationMenu, assetsMenu: assetsMenu, activitiesMenu: activitiesMenu, acts: acts, WEDDINGS: WEDDINGS, aboutRows: aboutRows, recapRow: recapRow,
    king: king, birthOptions: birthOptions, illName: illName, txt: txt, heir: heir, housed: housed, CLASS_NAME: CLASS_NAME, TOPICS: TOPICS, KID_TOPICS: KID_TOPICS, ACH: ACH,
    id: 'medieval', land: 'Kingdom of England', years: [1150, 1420], gentile: false };
})();
