/* TheLife — v1.24: Ancient Rome. A whole life in the Roman Empire (born AD
 * 40–160) using the same engine: family, health, aging and death work as
 * always, while careers, homes, money (denarii), activities and events are
 * Roman. Social class matters: patricians can climb the cursus honorum to
 * consul, plebeians work trades or join the legions, and people born into
 * slavery can earn and buy their freedom. Gladiators and charioteers chase
 * fame in the arena and the circus. History happens: emperors come and go,
 * Rome burns, Vesuvius erupts, the Colosseum opens, the Antonine Plague
 * spreads. State lives in S.anc; ancient lands live in D.ANCIENT. */
TL.eras = TL.eras || {};
TL.eras.rome = (function () {
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
  // Amounts below are written in denarii; den() turns them into game money.
  function den(x) { return E.$(x * 100); }
  function on() { return !!(TL.S && E.ancient() === 'rome'); }
  function st() {
    var s = S();
    return s.anc || (s.anc = { cls: 'plebeian', edu: null, inv: [], offices: [], wins: 0, losses: 0, races: 0, raceWins: 0, decorations: 0 });
  }
  function y() { return S().year; }
  function citizen() { return st().cls !== 'slave'; }
  var CLASS_NAME = { patrician: 'Patrician', equestrian: 'Equestrian', plebeian: 'Plebeian', freed: 'Freedperson', slave: 'Enslaved' };

  // ------------------------------------------------------------ history
  var EMPERORS = [[14, 'Tiberius'], [37, 'Caligula'], [41, 'Claudius'], [54, 'Nero'], [68, 'Galba'], [69, 'Vespasian'], [79, 'Titus'], [81, 'Domitian'], [96, 'Nerva'], [98, 'Trajan'],
    [117, 'Hadrian'], [138, 'Antoninus Pius'], [161, 'Marcus Aurelius'], [180, 'Commodus'], [193, 'Septimius Severus'], [211, 'Caracalla'], [217, 'Macrinus'], [218, 'Elagabalus'],
    [222, 'Severus Alexander'], [235, 'Maximinus Thrax'], [238, 'Gordian III'], [244, 'Philip the Arab'], [249, 'Decius'], [253, 'Valerian'], [260, 'Gallienus'], [268, 'Claudius Gothicus'],
    [270, 'Aurelian'], [275, 'Tacitus'], [276, 'Probus'], [282, 'Carus'], [284, 'Diocletian'], [305, 'Constantius'], [306, 'Constantine']];
  function emperor(yr) { if (TL.S && on() && S().anc && S().anc.rule) return me().first + ' ' + me().last; var dn = TL.S && on() && TL.dynasty && TL.dynasty.reigning(); if (dn) return dn.name; var e = EMPERORS[0][1]; EMPERORS.forEach(function (x) { if (yr >= x[0]) e = x[1]; }); return e; }
  // [year, icon, what happened, short label, only in these cities]
  var MOMENTS = [
    [43, '⛵', 'Emperor Claudius invaded Britannia.', 'The conquest of Britain'],
    [60, '🔥', 'Queen Boudica rose up and burned Londinium.', 'Boudica\'s revolt', ['Londinium']],
    [64, '🔥', 'The Great Fire of Rome burned for six days. People say Nero played the lyre while it burned.', 'The Great Fire of Rome'],
    [68, '🗡️', 'Emperor Nero took his own life. The Senate had declared him an enemy of the state.', 'The fall of Nero'],
    [69, '👑', 'Four emperors in one year: Galba, Otho, Vitellius and finally Vespasian.', 'The Year of the Four Emperors'],
    [70, '🏛️', 'The legions destroyed the Temple in Jerusalem.', 'The siege of Jerusalem'],
    [80, '🏟️', 'Emperor Titus opened the Flavian Amphitheater, the Colosseum, with 100 days of games.', 'The Colosseum opened'],
    [96, '🗡️', 'Emperor Domitian was assassinated in his palace.', 'Domitian\'s assassination'],
    [106, '🦅', 'Trajan conquered Dacia. Gold flowed into Rome and the games lasted 123 days.', 'The conquest of Dacia'],
    [113, '🏛️', 'Trajan\'s Column was dedicated in the new forum.', 'Trajan\'s Column'],
    [117, '🗺️', 'The empire reached its greatest size, from Britain to Mesopotamia.', 'The empire at its height'],
    [122, '🧱', 'Emperor Hadrian ordered a wall built across northern Britannia.', 'Hadrian\'s Wall'],
    [126, '🏛️', 'The rebuilt Pantheon was completed, with the largest dome in the world.', 'The Pantheon'],
    [165, '🦠', 'A terrible plague came back with the legions from the east. The Antonine Plague spread everywhere.', 'The Antonine Plague'],
    [180, '📜', 'Emperor Marcus Aurelius, the philosopher, died on campaign.', 'The death of Marcus Aurelius'],
    [192, '🗡️', 'Emperor Commodus, who fought as a gladiator, was strangled by a wrestler.', 'The fall of Commodus'],
    [193, '👑', 'The Praetorian Guard auctioned the empire to the highest bidder.', 'The Year of the Five Emperors'],
    [212, '📜', 'Caracalla made every free person in the empire a Roman citizen.', 'Citizenship for all'],
    [235, '⚔️', 'Emperor Severus Alexander was murdered by his troops. The empire fell into crisis.', 'The Crisis of the Third Century'],
    [248, '🎉', 'Rome celebrated its 1,000th birthday with great games.', 'Rome\'s 1,000th birthday']
  ];
  // Moments that only happen if the real emperors are on the throne.
  var RULER_MOMENTS = ['The conquest of Britain', 'The Great Fire of Rome', 'The fall of Nero', 'The Year of the Four Emperors', 'The Colosseum opened', 'Domitian\'s assassination', 'The conquest of Dacia', 'Trajan\'s Column',
    'The empire at its height', 'Hadrian\'s Wall', 'The death of Marcus Aurelius', 'The fall of Commodus', 'The Year of the Five Emperors', 'Citizenship for all', 'The Crisis of the Third Century'];
  var CAMPAIGNS = [[43, 60, 'Britannia'], [60, 61, 'Britannia, against Boudica'], [66, 73, 'Judaea'], [69, 69, 'the civil war'], [83, 89, 'Germania'], [101, 106, 'Dacia'], [114, 117, 'Parthia'],
    [132, 135, 'Judaea'], [161, 166, 'Parthia'], [166, 180, 'the Danube frontier'], [193, 197, 'the civil wars'], [197, 199, 'Parthia'], [208, 211, 'Caledonia'], [230, 235, 'Persia'], [250, 251, 'the Goths'], [260, 274, 'the Gallic Empire']];
  function campaign(yr) { var c = CAMPAIGNS.filter(function (x) { return yr >= x[0] && yr <= x[1]; })[0]; return c ? c[2] : null; }
  function see(title, icon) { var s = S(), h = s.era || (s.era = { seen: [], served: [] }); if (h.seen.length < 40) h.seen.push({ year: s.year, age: me().age, icon: icon, title: title }); }

  // ------------------------------------------------------------ careers
  // levels: [title, yearly pay in denarii]. need(): why I can't, or null.
  var CAREERS = [
    { id: 'r_farm', icon: '🌾', name: 'Farming', stat: 'athl', min: 14, levels: [['Farmhand', 150], ['Tenant Farmer', 260], ['Farmer', 420], ['Estate Overseer', 800]] },
    { id: 'r_build', icon: '🧱', name: 'Building', stat: 'athl', min: 15, levels: [['Laborer', 200], ['Stonemason', 320], ['Master Builder', 650], ['Architect', 1600]] },
    { id: 'r_baker', icon: '🍞', name: 'Baking', stat: 'smarts', min: 14, levels: [['Baker\'s Apprentice', 150], ['Baker', 300], ['Master Baker', 700]] },
    { id: 'r_smith', icon: '⚒️', name: 'Smithing', stat: 'athl', min: 14, levels: [['Smith\'s Apprentice', 150], ['Blacksmith', 360], ['Master Smith', 750]] },
    { id: 'r_fish', icon: '🎣', name: 'Fishing', stat: 'athl', min: 14, levels: [['Fisherman', 180], ['Boat Owner', 400]] },
    { id: 'r_tavern', icon: '🍷', name: 'Taverns', stat: 'looks', min: 16, levels: [['Tavern Server', 160], ['Innkeeper', 450], ['Owner of Three Inns', 1200]] },
    { id: 'r_merchant', icon: '⚖️', name: 'Trade', stat: 'smarts', min: 16, levels: [['Market Stall Keeper', 250], ['Merchant', 650], ['Wealthy Trader', 2000], ['Shipping Magnate', 6000]] },
    { id: 'r_scribe', icon: '📜', name: 'Scribes', stat: 'smarts', min: 15, need: function () { return st().edu ? null : 'Needs schooling (letters)'; }, levels: [['Copyist', 280], ['Scribe', 450], ['Public Scribe', 900]] },
    { id: 'r_teacher', icon: '🧑‍🏫', name: 'Teaching', stat: 'smarts', min: 18, need: function () { return !st().edu ? 'Needs schooling (letters)' : me().smarts < 55 ? 'Not enough smarts' : null; }, levels: [['Teacher of Letters', 300], ['Grammaticus', 650], ['Rhetor', 1500]] },
    { id: 'r_medic', icon: '⚕️', name: 'Medicine', stat: 'smarts', min: 18, need: function () { return !st().edu ? 'Needs schooling (letters)' : me().smarts < 62 ? 'Not enough smarts' : null; }, levels: [['Physician\'s Assistant', 260], ['Medicus', 950], ['Imperial Physician', 4500]] },
    { id: 'r_law', icon: '🏛️', name: 'Law', stat: 'smarts', min: 20, need: function () { return st().edu !== 'rhetoric' ? 'Needs rhetoric school' : null; }, levels: [['Junior Advocate', 500], ['Advocate', 1600], ['Famous Orator', 5500]] },
    { id: 'r_priest', icon: '🔥', name: 'Priesthood', stat: 'smarts', min: 18, need: function () { return st().cls === 'slave' ? 'Not open to slaves' : null; }, levels: [['Temple Attendant', 200], ['Priest', 600], ['Pontifex', 2500]] }
  ];
  var SPECIAL = {
    r_legion: { id: 'r_legion', icon: '🦅', name: 'The Legions', levels: [['Legionary', 225], ['Immunis', 300], ['Optio', 450], ['Centurion', 3750], ['Primus Pilus', 15000]] },
    r_gladiator: { id: 'r_gladiator', icon: '⚔️', name: 'Gladiator', levels: [['Tiro (Novice Gladiator)', 0], ['Gladiator', 0], ['Champion of the Arena', 0]] },
    r_charioteer: { id: 'r_charioteer', icon: '🐎', name: 'Chariot Racing', levels: [['Charioteer', 0]] },
    r_cursus: { id: 'r_cursus', icon: '🏛️', name: 'Politics', levels: [['Senator', 0]] },
    r_philo: { id: 'r_philo', icon: '🦉', name: 'Philosophy', levels: [['Student of Philosophy', 0], ['Philosopher', 150], ['Teacher of Philosophy', 600], ['Head of the School', 2500]] },
    r_emperor: { id: 'r_emperor', icon: '👑', name: 'The throne', levels: [['Emperor', 60000]] },
    r_vestal: { id: 'r_vestal', icon: '🔥', name: 'The Vestals', levels: [['Novice Vestal', 0], ['Vestal Virgin', 900], ['Vestalis Maxima', 3000]] },
    r_servus: { id: 'r_servus', icon: '⛓️', name: 'Servitude', levels: [['Household Slave', 40], ['Trusted Steward', 120]] }
  };
  function career(id) { return CAREERS.filter(function (c) { return c.id === id; })[0] || SPECIAL[id] || null; }
  function lvlName(c, l) { return c.levels[Math.min(l, c.levels.length - 1)][0]; }
  var OFFICES = [['Quaestor', 30], ['Aedile', 36], ['Praetor', 39], ['Consul', 42]];
  function salary(j) {
    var c = career(j.career); if (!c) return 0;
    if (j.career === 'r_cursus') return j.governor ? den(9000) : 0;
    if (j.career === 'r_gladiator' || j.career === 'r_charioteer') return 0; // they earn prize money
    if (j.career === 'r_philo') return den((c.levels[Math.min(j.level, c.levels.length - 1)][1] + (st().philo && st().philo.pupils || 0) * 15) * (j.tutor ? 2 : 1));
    return Math.round(den(c.levels[Math.min(j.level, c.levels.length - 1)][1]) * (j.mult || 1));
  }
  function title(j) {
    var c = career(j.career); if (!c) return 'Worker';
    if (j.career === 'r_cursus') return j.office ? j.office : j.governor ? 'Provincial Governor' : 'Senator';
    if (j.career === 'r_gladiator') return (j.style || 'Gladiator') + (j.level ? ' (' + lvlName(c, j.level).replace(/ \(.*\)/, '') + ')' : '');
    if (j.career === 'r_charioteer') return 'Charioteer of the ' + (j.faction || 'Greens');
    if (j.career === 'r_emperor') return me().gender === 'F' ? 'Empress' : 'Emperor';
    if (j.career === 'r_philo') return j.tutor ? 'Imperial Tutor' : (st().philo ? SCHOOLS[st().philo.school][0] + ' ' : '') + lvlName(c, j.level);
    return lvlName(c, j.level);
  }
  var NPC_JOBS = ['Farmer', 'Laborer', 'Baker', 'Blacksmith', 'Merchant', 'Fisherman', 'Innkeeper', 'Potter', 'Weaver', 'Scribe', 'Legionary', 'Shopkeeper', 'Fuller', 'Homemaker', 'Shepherd'];
  function npcJob(age) { return age < 15 ? 'Child' : age >= 62 && U.chance(0.6) ? 'Elder' : U.pick(NPC_JOBS); }
  var STREETS = ['in the Subura', 'on the Via Sacra', 'near the Forum', 'on the Aventine', 'across the Tiber', 'by the Circus Maximus', 'on the Esquiline'];
  function place() { var c = S().city; return c === 'Rome' ? U.pick(STREETS) : 'in ' + c; }

  // ------------------------------------------------------------ birth
  function setup(s, opts) {
    var a = st(), w = s.flags.wealth;
    a.cls = opts.royal ? 'patrician' : opts.cls || (w === 'rich' ? 'patrician' : w === 'upper' ? 'equestrian' : w === 'poor' && U.chance(0.35) ? 'slave' : 'plebeian');
    var mom = E.people('mother')[0], dad = E.people('father')[0];
    var par = { patrician: ['Senator', 'Matrona'], equestrian: ['Merchant', 'Matrona'], plebeian: [U.pick(NPC_JOBS.slice(0, 12)), U.pick(['Homemaker', 'Weaver', 'Shopkeeper', 'Midwife'])], slave: ['Enslaved Servant', 'Enslaved Servant'] }[a.cls];
    if (dad) dad.job = par[0]; if (mom) mom.job = par[1];
    if (a.cls === 'slave') {
      var m = D.country(s.country);
      a.master = U.pick(m.male) + ' ' + D.gentile(U.pick(m.last), 'M');
      [mom, dad].forEach(function (p) { if (p) p.money = 0; });
      s.money = 0;
      E.log('⛓️ I was born into slavery in the household of ' + a.master + '.', 'bad');
    } else if (opts.royal && TL.dynasty.born(s, royalCfg())) { a.emp = emperor(s.year); return; }
    else E.log({ patrician: '🏛️ My family are patricians, one of Rome\'s oldest and noblest houses.', equestrian: '🐎 My family are equestrians, wealthy and well connected.', plebeian: 'My family are plebeians, ordinary Roman citizens.' }[a.cls], a.cls === 'patrician' ? 'good' : '');
    a.emp = emperor(s.year);
    E.log('👑 ' + a.emp + ' rules the empire.');
  }

  // ------------------------------------------------------------ the year
  function yearly() {
    var s = S(), a = st(), age = me().age, yr = s.year;
    TL.dynasty.yearly(); // my family's throne (js/eras.js)
    if (s.dead) return;
    var em = emperor(yr);
    if (em !== a.emp) { a.emp = em; if (age >= 5 && !a.rule) E.log('👑 ' + em + ' became emperor.'); }
    MOMENTS.forEach(function (mo) {
      if (mo[0] !== yr || age < 5 || (mo[4] && mo[4].indexOf(s.city) < 0)) return;
      if (TL.dynasty.altered() && RULER_MOMENTS.indexOf(mo[3]) >= 0) return; // my family rules now: history went another way
      E.log(mo[1] + ' ' + mo[2]); see(mo[3], mo[1]);
    });
    if (yr === 79 && /Pompeii|Herculaneum|Neapolis/.test(s.city)) s.pending.push({ id: 'r_vesuvius' });
    if (yr === 64 && s.city === 'Rome' && U.chance(0.3)) { E.addMoney(-Math.round(Math.max(0, s.money) * 0.3)); E.log('🔥 The fire destroyed our neighborhood. We lost much of what we owned.', 'bad'); }
    // The Antonine Plague (165-180).
    if (yr >= 165 && yr <= 180 && U.chance(0.06)) {
      E.stat('health', -U.rand(15, 35)); E.log('🦠 I caught the plague. Fever and sores covered my body.', 'bad');
      if (me().health < 20 && U.chance(0.5)) E.die('the Antonine Plague');
    }
    if (s.dead) return;
    if (a.plot) { TL.coup.yearly(coupCfg(a.plot.kind)); if (s.dead) return; }
    if (a.rule && !(s.job && s.job.career === 'r_emperor')) TL.coup.lostThrone();
    if (s.home.type === 'cloister' && !(s.job && s.job.career === 'r_vestal')) s.home = JSON.parse(JSON.stringify(TXT.rentHome));
    // Coming of age: the toga of manhood, or marriage age for girls.
    if (age === 16 && me().gender === 'M' && citizen()) E.log('🎽 I put on the toga virilis. I am a Roman man now.');
    // The grain dole for citizens of Rome.
    if (age >= 14 && s.city === 'Rome' && citizen() && a.cls !== 'patrician' && U.chance(0.5)) E.addMoney(den(U.rand(8, 20)));
    // Enslaved: a small peculium (savings) and a chance of manumission.
    if (a.cls === 'slave' && age >= 10 && !s.job && !s.prison) hire('r_servus');
    if (a.cls === 'slave' && age >= 12) {
      E.addMoney(den(U.rand(5, 25)));
      if (age >= 25 && U.chance(0.04)) s.pending.push({ id: 'r_manumission' });
    }
    // Investments: loans, voyages and farmland.
    a.inv = (a.inv || []).filter(function (v) {
      if (v.kind === 'farm') { var inc = Math.round(v.value * U.randf(0.03, 0.09)); if (U.chance(0.12)) { inc = 0; E.log('🌾 A drought ruined the harvest on my farmland.', 'bad'); } E.addMoney(inc); return true; }
      if (yr < v.due) return true;
      if (v.kind === 'loan') {
        if (U.chance(0.85)) { var back = Math.round(v.amt * 1.15); E.addMoney(back); E.log('🪙 ' + v.who + ' repaid my loan with interest: ' + E.fmt(back) + '.', 'good'); }
        else E.log('🪙 ' + v.who + ' fled the city without repaying my loan of ' + E.fmt(v.amt) + '.', 'bad');
      } else if (v.kind === 'voyage') {
        var r = U.rand(1, 100), got;
        if (r <= 15) { E.log('🌊 My trading ship sank in a storm. The whole cargo was lost.', 'bad'); }
        else if (r <= 40) { got = Math.round(v.amt * U.randf(0.85, 1.15)); E.addMoney(got); E.log('⛵ My trade voyage came home. It roughly broke even: ' + E.fmt(got) + '.'); }
        else { got = Math.round(v.amt * U.randf(1.4, 2.4)); E.addMoney(got); E.log('⛵ My ship returned from ' + v.to + ' loaded with goods. I made ' + E.fmt(got) + '!', 'good'); }
      }
      return false;
    });
  }

  // A year at work (called from engine.progressJob). Returns earnings.
  function jobYear(j) {
    var s = S(), c = career(j.career), a = st(), earned = salary(j);
    if (!c) return 0;
    if (j.career === 'r_legion') return legionYear(j, c, earned);
    if (j.career === 'r_gladiator') return gladiatorYear(j, c);
    if (j.career === 'r_charioteer') return charioteerYear(j);
    if (j.career === 'r_cursus') return cursusYear(j);
    if (j.career === 'r_philo') return philoYear(j, c);
    if (j.career === 'r_vestal') return vestalYear(j);
    if (j.career === 'r_emperor') return TL.coup.reignYear(coupCfg('throne'));
    var sv = j.career === 'r_servus' ? me().smarts : E.statValue(c.stat || 'smarts');
    j.perf = U.clamp(Math.round((j.perf || 50) + U.rand(-9, 8) + (sv - 50) / 15 + (j.workHard || 0) * 4 - (me().happy < 20 ? 6 : 0)), 0, 100);
    j.workHard = 0;
    if (j.level < c.levels.length - 1 && j.perf >= 70 && j.levelYears >= 2 && U.chance(0.35 + (j.perf - 70) / 60)) {
      j.level++; j.levelYears = 0; j.perf = Math.max(45, j.perf - 20);
      E.log('📈 I was promoted to ' + title(j) + '! New pay: ' + E.fmt(salary(j)) + ' a year.', 'good'); E.stat('happy', 10);
    } else if (j.perf < 15 && j.career !== 'r_servus' && U.chance(0.5)) { E.fire('My work was terrible.'); }
    return earned;
  }
  function legionYear(j, c, earned) {
    var war = campaign(y());
    j.perf = U.clamp(Math.round((j.perf || 50) + U.rand(-8, 9) + (me().athl - 50) / 12 + (j.workHard || 0) * 4), 0, 100); j.workHard = 0;
    if (war) {
      if (!j.lastWar || j.lastWar !== war) { j.lastWar = war; E.log('🦅 My legion marched to war in ' + war + '.'); see('Fought in ' + war, '🦅'); }
      var r = U.rand(1, 1000), death = j.level >= 3 ? 45 : 32;
      if (r <= death) { E.die('wounds suffered in battle in ' + war); return earned; }
      if (r <= death * 4) { E.stat('health', -U.rand(12, 30)); E.log('🩸 I was wounded in battle in ' + war + '.', 'bad'); }
      else if (U.chance(0.25)) { st().decorations++; j.perf = Math.min(100, j.perf + 10); E.fame(1); E.log('🏅 I was decorated for bravery in ' + war + '.', 'good'); }
    }
    if (j.level < c.levels.length - 1 && j.perf >= 70 && j.levelYears >= 3 && U.chance(0.3 + (j.perf - 70) / 80)) {
      j.level++; j.levelYears = 0; j.perf = Math.max(45, j.perf - 20);
      E.log('📈 I was promoted to ' + title(j) + '. Pay: ' + E.fmt(salary(j)) + ' a year.', 'good'); E.stat('happy', 10);
      if (j.level === 3) E.achieve('centurion');
    }
    if (j.years >= 25) {
      var bonus = den(j.level >= 3 ? 12000 : 3000);
      E.addMoney(bonus); E.log('🎖️ After 25 years I received my honorable discharge and a veteran\'s bonus of ' + E.fmt(bonus) + '.', 'good');
      st().veteran = true; E.quitJob(true); S().flags.veteran = true;
    }
    return earned;
  }
  function bout(j) {
    var p = 0.48 + (me().athl - 50) / 110 + Math.min(0.15, (st().wins || 0) * 0.01) + (j.level * 0.04);
    if (U.chance(p)) {
      var prize = den(U.rand(50, 300) * (j.level + 1)); st().wins++; E.addMoney(prize); E.fame(U.rand(1, 3));
      return { win: true, text: 'I won my fight in the arena' + (U.chance(0.3) ? ' to a roaring crowd' : '') + ' and took home ' + E.fmt(prize) + '.' };
    }
    st().losses++;
    // Most losers were spared (missio); a famous fighter even more often.
    var mercy = 0.86 + Math.min(0.1, S().fame / 300);
    if (U.chance(mercy)) { E.stat('health', -U.rand(8, 22)); return { win: false, text: 'I lost my fight, but the crowd shouted "Mitte!" and the editor spared me.' }; }
    E.die('the sword of a gladiator in the arena');
    return { win: false, dead: true, text: 'I lost, and the crowd turned their thumbs.' };
  }
  function gladiatorYear(j, c) {
    if (y() >= 200 && me().gender === 'F') { E.log('⚔️ Emperor Septimius Severus banned women from fighting in the arena. My fighting days are over.'); E.quitJob(true); return 0; }
    var n = U.rand(2, 3);
    for (var i = 0; i < n && !S().dead; i++) { var b = bout(j); E.log((b.win ? '⚔️ ' : '🩸 ') + b.text, b.win ? 'good' : 'bad'); }
    if (S().dead) return 0;
    var w = st().wins;
    if (j.level === 0 && w >= 3) { j.level = 1; E.log('⚔️ I\'m no longer a novice. The crowds know my name.', 'good'); }
    if (j.level === 1 && w >= 12) { j.level = 2; E.log('🏆 I\'m a champion of the arena!', 'good'); E.fame(10); }
    if (w >= 15 || (j.years >= 5 && U.chance(0.25))) s_rudis(j);
    return 0;
  }
  function s_rudis(j) {
    E.log('🗡️ The emperor himself awarded me the rudis, the wooden sword of freedom. I retired from the arena.', 'good');
    E.achieve('rudis'); E.stat('happy', 20);
    if (st().cls === 'slave') freeMe('the arena');
    E.quitJob(true);
  }
  function charioteerYear(j) {
    var races = U.rand(12, 30), wins = 0, skill = (me().athl * 0.5 + (j.skill || 20)) / 100;
    for (var i = 0; i < races; i++) if (U.chance(Math.min(0.55, 0.1 + skill * 0.4))) wins++;
    j.skill = Math.min(100, (j.skill || 20) + U.rand(2, 6));
    var a = st(); a.races += races; a.raceWins += wins;
    var pay = den(wins * U.rand(60, 160)); E.addMoney(pay); E.fame(Math.round(wins / 4));
    E.log('🐎 I raced ' + races + ' times for the ' + j.faction + ' and won ' + wins + '. Prize money: ' + E.fmt(pay) + '.', wins ? 'good' : '');
    if (a.raceWins >= 100 && !S().ach.includes('charioteer_champ')) E.achieve('charioteer_champ');
    if (U.chance(0.06)) {
      if (U.chance(0.2)) { E.die('a crash at the Circus Maximus'); return 0; }
      E.stat('health', -U.rand(15, 35)); E.log('💥 My chariot shattered on the turn at the meta. I was dragged by the reins.', 'bad');
    }
    return 0;
  }
  function cursusYear(j) {
    var earned = salary(j);
    if (j.office) {
      E.log('🏛️ I completed my year as ' + j.office + '.', 'good');
      if (j.office === 'Praetor' || j.office === 'Consul') { j.governor = U.pick(['Africa', 'Asia', 'Hispania', 'Gallia Narbonensis', 'Syria', 'Macedonia', 'Achaea']); E.log('🗺️ The Senate sent me to govern ' + j.governor + '.'); s_pending('r_governor'); }
      j.office = null;
    } else if (j.governor) { E.log('🗺️ My governorship of ' + j.governor + ' ended.'); j.governor = null; }
    E.fame(1);
    return earned;
  }
  // The six Vestal Virgins kept Vesta's sacred fire for thirty years: ten learning, ten serving, ten teaching.
  function vestalYear(j) {
    var s = S();
    j.perf = U.clamp(Math.round((j.perf || 55) + U.rand(-6, 7) + (s.karma - 50) / 15 + (j.workHard || 0) * 4), 0, 100); j.workHard = 0;
    E.fame(1);
    if (j.level === 0 && j.years >= 10) { j.level = 1; E.log('🔥 My ten years of learning are over. I now keep the sacred fire of Vesta myself.', 'good'); E.stat('happy', 6); }
    else if (j.level === 1 && j.years >= 20 && j.perf >= 70 && U.chance(0.25)) { j.level = 2; E.fame(8); E.log('🔥 I was made Vestalis Maxima, chief of the Vestals. Even consuls lower their fasces when I pass.', 'good'); }
    if (E.partner() && U.chance(0.35)) s.pending.push({ id: 'r_incestum' });
    if (j.years >= 30) {
      var g = den(j.level >= 2 ? 20000 : 8000); E.addMoney(g);
      E.log('🔥 My thirty years of service are complete. I left the House of the Vestals with honor and a dowry of ' + E.fmt(g) + '. I may marry if I wish.', 'good');
      E.achieve('vestal'); see('Kept the flame of Vesta for 30 years', '🔥'); E.quitJob(true); s.home = { type: 'rent', tier: 2, anc: 'fine', mult: HOMES.fine[1] * 100 / E.RENT_TIERS[2][1] };
      return 0;
    }
    return salary(j);
  }
  function s_pending(id, data) { S().pending.push({ id: id, data: data || {} }); }
  function freeMe(how) {
    var a = st(); a.cls = 'freed'; a.freedHow = how;
    if (a.master) me().last = D.gentile(a.master.split(' ')[1], me().gender);
    if (S().job && S().job.career === 'r_servus') E.quitJob(true);
    E.log('🕊️ I am free! As a freedperson I took my former master\'s family name: ' + me().first + ' ' + me().last + '.', 'good');
    E.achieve('freedom'); E.stat('happy', 30); see('Won my freedom', '🕊️');
  }

  // ------------------------------------------------------------ philosophy
  // [adjective, founder, what it teaches]
  var SCHOOLS = {
    stoic: ['Stoic', 'Zeno', 'Virtue is the only good. Accept what you cannot change.'],
    epicurean: ['Epicurean', 'Epicurus', 'Seek quiet pleasures, friendship and freedom from fear.'],
    cynic: ['Cynic', 'Diogenes', 'Reject wealth and convention. Live simply, like a dog.'],
    platonist: ['Platonist', 'Plato', 'True reality is the world of ideas, beyond the senses.']
  };
  var WORK_TOPICS = ['Anger', 'Providence', 'the Happy Life', 'Friendship', 'Death', 'the Gods', 'Virtue', 'the Tranquility of the Mind', 'Duty', 'Nature', 'Pleasure', 'the Soul', 'Fate', 'the Shortness of Life', 'Clemency', 'Grief', 'Wealth', 'the Good Life'];
  function ph() { var a = st(); return a.philo || (a.philo = { school: 'stoic', wisdom: 0, works: [], pupils: 0 }); }
  function philoYear(j, c) {
    var p = ph(), sc = p.school, s = S();
    p.wisdom = Math.min(100, p.wisdom + U.rand(2, 5) + Math.round((me().smarts - 50) / 25) + (j.workHard || 0) * 2); j.workHard = 0;
    // Each school shapes a life.
    if (sc === 'stoic' && me().happy < 45) E.stat('happy', 5);
    if (sc === 'epicurean') E.stat('happy', 3);
    if (sc === 'platonist') E.stat('smarts', 1);
    if (sc === 'cynic') { E.fame(1); if (s.money > den(100)) { E.addMoney(-Math.round(s.money * 0.2)); E.log('🛢️ True to my Cynic teaching, I gave away much of what I owned.'); } }
    var need = [0, 20, 45, 75][j.level + 1];
    if (j.level < c.levels.length - 1 && p.wisdom >= need && (j.level < 2 || p.works.length >= 3) && U.chance(0.6)) {
      j.level++; E.log('🦉 I am now ' + E.an(title(j)) + '.', 'good'); E.stat('happy', 8); E.fame(3);
      if (j.level === 3) { E.achieve('sage'); see('Led a school of philosophy', '🦉'); }
    }
    // Pupils drift away; how many a teacher can keep depends on rank.
    p.pupils = U.clamp(p.pupils - (U.chance(0.4) ? 1 : 0), 0, 3 + j.level * 6);
    // Domitian banished philosophers from Rome (AD 89 and 93-95).
    if ((y() === 89 || y() === 93) && s.city === 'Rome' && !j.tutor) s.pending.push({ id: 'r_expelled' });
    // Famous teachers get asked to tutor the emperor's heir.
    if (!j.tutor && !p.askedTutor && j.level >= 3 && s.fame >= 40 && me().age >= 30 && U.chance(0.025)) { p.askedTutor = true; s.pending.push({ id: 'r_tutor' }); }
    // Nero turned on his old tutor Seneca in AD 65.
    if (j.tutor && emperor(y()) === 'Nero' && y() >= 62 && U.chance(0.35)) s.pending.push({ id: 'r_nero' });
    return salary(j);
  }
  function becomePhilosopher() {
    ui().choose('Choose a school', 'Which philosophy will guide my life?', Object.keys(SCHOOLS).map(function (k) {
      var x = SCHOOLS[k];
      return { label: x[0] + ' (' + x[1] + ')', fn: function () {
        E.quitJob(true); hire('r_philo'); S().job.company = k === 'stoic' ? 'the Stoa' : k === 'platonist' ? 'the Academy' : k === 'epicurean' ? 'the Garden' : 'the streets';
        var p = ph(); p.school = k; if (p.wisdom >= 20) S().job.level = 1;
        done(good('I became a student of ' + x[0] + ' philosophy. "' + x[2] + '" 🦉'));
      } };
    }));
  }
  function writeTreatise() {
    var p = ph(), j = S().job;
    if (count('r_write')) return done(nope('One treatise a year is all the muses allow.'));
    bump('r_write');
    var t = 'On ' + U.pick(WORK_TOPICS.filter(function (w) { return p.works.every(function (x) { return x.title !== 'On ' + w; }); }).concat(['Virtue']));
    var q = U.clamp(Math.round(p.wisdom * 0.6 + me().smarts * 0.3 + U.rand(-15, 20)), 1, 100);
    p.works.push({ title: t, year: y(), q: q });
    if (p.works.length >= 5) E.achieve('magnum_opus');
    if (q >= 75) { E.fame(6); var g = den(U.rand(40, 200)); E.addMoney(g); see('Wrote "' + t + '"', '📜'); return done(good('My treatise "' + t + '" is being copied all over the empire. A patron sent me ' + E.fmt(g) + '. 📜')); }
    if (q >= 45) { E.fame(2); return done('I finished "' + t + '". A few scholars admired it.'); }
    done(bad('I finished "' + t + '". Even my pupils fell asleep reading it.'));
  }
  function debate() {
    var p = ph();
    if (count('r_debate')) return done(nope('I\'ve argued enough for one year.'));
    bump('r_debate');
    var foe = U.pick(['a famous Sophist', 'an arrogant Epicurean', 'a Stoic from Athens', 'a Cynic who barked at me', 'a senator who thinks philosophy is useless']);
    if (U.chance(0.35 + p.wisdom / 200 + (me().smarts - 50) / 200)) { E.fame(4); p.pupils += U.rand(1, 3); return done(good('I debated ' + foe + ' in the Forum and won the crowd. New pupils followed me home.')); }
    E.stat('happy', -5); done(bad('I debated ' + foe + ' and was humiliated in front of everyone.'));
  }
  function teach() {
    var p = ph();
    if (count('r_teach')) return done(nope('My pupils need time to think.'));
    bump('r_teach');
    p.pupils += U.rand(0, 2); p.wisdom = Math.min(100, p.wisdom + 1);
    done('I taught ' + U.plural(Math.max(1, p.pupils), 'pupil') + ' under the colonnade. Teaching made my own thinking clearer.');
  }
  function meditate() {
    var p = ph(), sc = p.school;
    if (count('r_med')) return done(nope('I already spent a long time in thought this year.'));
    bump('r_med'); p.wisdom = Math.min(100, p.wisdom + 2); E.stat('happy', 4); E.stat('health', 1);
    done({ stoic: 'I wrote in my journal at dawn: "You have power over your mind, not outside events."', epicurean: 'I shared bread, olives and conversation with friends in my garden. Nothing more is needed.', cynic: 'I sat in the sun and asked passersby what they really needed. Most had no answer.', platonist: 'I contemplated the Forms until the shadows on the wall seemed less real.' }[sc]);
  }

  // ------------------------------------------------------------ menus
  function hire(id) {
    var c = career(id);
    S().job = { career: id, ancient: true, level: 0, perf: 55, years: 0, levelYears: 0, mult: 1, company: place() };
    S().counts.jobs++;
    return c;
  }
  function occupationMenu() {
    ui().menu('Occupation', function () {
      var s = S(), a = st(), j = s.job, age = me().age, items = [];
      items.push({ info: true, html: card() });
      if (age < 6) { items.push({ info: true, html: '<p class="muted">I\'m too young to work. Childhood comes first.</p>' }); return items; }
      if (a.cls === 'slave') {
        items.push({ section: 'Servitude' });
        if (j) items.push({ icon: '💪', label: 'Work hard for my master', sub: 'Trust leads to responsibility', onClick: function () { if (count('r_work')) return done(nope('I already worked myself ragged this year.')); bump('r_work'); j.workHard = (j.workHard || 0) + 1; E.stat('health', -1); done('I worked from dawn to dusk.'); } });
        var price = den(1500);
        items.push({ icon: '🕊️', label: 'Buy my freedom', sub: 'My savings (peculium) can buy my manumission', right: E.fmt(price), onClick: function () { if (s.money < price) return done(nope('I need ' + E.fmt(price) + ' saved to buy my freedom.')); E.addMoney(-price); freeMe('my savings'); ui().back(); done(good('I paid ' + a.master + ' and walked out a free person.')); } });
        if (age >= 14 && me().smarts >= 45) items.push({ icon: '🦉', label: 'Listen to the philosophers', sub: 'Epictetus was born a slave too', onClick: function () { if (count('r_listen')) return done(nope('I can only slip away once a year.')); bump('r_listen'); var p = ph(); p.wisdom = Math.min(100, p.wisdom + U.rand(3, 6)); E.stat('smarts', 2); done('While running errands I lingered by a philosopher teaching in the street. "Some things are up to us, and some are not." (wisdom ' + p.wisdom + ')'); } });
        items.push({ icon: '🏃', label: 'Run away', sub: 'Runaways are hunted and branded', danger: true, onClick: runaway });
        if (age >= 16) items.push({ icon: '🔥', label: a.plot ? 'The revolt' : 'Plan a slave revolt', sub: a.plot ? 'Strength ' + Math.round(a.plot.power) + ' · suspicion ' + Math.round(a.plot.heat) : 'Like Spartacus', danger: true, onClick: function () { TL.coup.menu(coupCfg('revolt')); } });
        return items;
      }
      if (j && j.career === 'r_emperor') { items.push({ section: 'The empire' }); return items.concat(TL.coup.reignItems(coupCfg('throne'))); }
      items = items.concat(TL.dynasty.items());
      if (j) {
        items.push({ section: 'My work' });
        if (j.career === 'r_cursus') {
          var next = nextOffice();
          if (next && !j.office) items.push({ icon: '🗳️', label: 'Stand for election as ' + next[0], sub: age < next[1] ? 'Minimum age ' + next[1] : 'Costs a fortune in bribes and games', right: E.fmt(den(campaignCost(next))), disabled: age < next[1] || count('r_elect') > 0, onClick: function () { election(next); } });
          else if (!next) items.push({ info: true, html: '<p class="muted">I have held every office of the cursus honorum.</p>' });
        } else if (j.career === 'r_gladiator') {
          items.push({ icon: '🏋️', label: 'Train at the ludus', sub: 'Get stronger and faster', onClick: function () { if (count('r_train')) return done(nope('I already trained hard this year.')); bump('r_train'); me().athl = Math.min(100, me().athl + U.rand(2, 5)); done('I trained with the doctores until I could barely stand. 💪'); } });
        } else if (j.career === 'r_philo') {
          var p = ph();
          items.push({ info: true, html: '<p class="muted">' + U.esc(SCHOOLS[p.school][0]) + ' · wisdom ' + p.wisdom + '/100 · ' + U.plural(p.works.length, 'treatise') + ' · ' + U.plural(p.pupils, 'pupil') + '</p>' });
          items.push({ icon: '📜', label: 'Write a treatise', sub: p.works.length ? 'Latest: "' + p.works[p.works.length - 1].title + '"' : 'Put my ideas on papyrus', onClick: writeTreatise });
          items.push({ icon: '🗣️', label: 'Debate in the Forum', sub: 'Win fame and pupils, or be humiliated', onClick: debate });
          items.push({ icon: '🏛️', label: 'Teach my pupils', onClick: teach });
          items.push({ icon: '🧘', label: { stoic: 'Morning reflection', epicurean: 'Dine with friends in the garden', cynic: 'Live in a barrel like Diogenes', platonist: 'Contemplate the Forms' }[p.school], onClick: meditate });
        } else if (j.career === 'r_vestal') {
          items.push({ info: true, html: '<p class="muted">Year ' + j.years + ' of 30 · ' + (j.years < 10 ? 'learning the rites' : j.years < 20 ? 'serving the goddess' : 'teaching the novices') + '</p>' });
          items.push({ icon: '🔥', label: 'Tend the sacred fire', sub: 'If it ever goes out, Rome is in danger', onClick: function () { if (count('r_flame')) return done(nope('I kept my watches this year.')); bump('r_flame'); j.workHard = (j.workHard || 0) + 1; if (U.chance(0.04)) { E.stat('health', -12); E.stat('happy', -10); return done(bad('I dozed on my night watch and the fire went out. The Pontifex Maximus had me scourged in the dark.')); } E.karma(2); done('I fed the fire with sacred wood through the night. It never flickered.'); } });
          items.push({ icon: '⛓️', label: 'Pardon a condemned prisoner', sub: 'A Vestal who meets the condemned by chance can free them', onClick: function () { if (count('r_pardon')) return done(nope('I met no condemned prisoner this year.')); bump('r_pardon'); if (!U.chance(0.5)) return done('I walked the streets, but chance brought me no prisoner this year.'); E.karma(8); E.fame(3); done(good('A man was being led to his execution as my lictor cleared the way. I touched his chains, and by ancient law he walked free.')); } });
          items.push({ icon: '📜', label: 'Guard the wills of the powerful', sub: 'Senators and emperors leave their wills with us', onClick: function () { if (count('r_wills')) return done(nope('The wills are safe.')); bump('r_wills'); E.stat('smarts', 1); E.fame(1); done('A ' + U.pick(['senator', 'general', 'rich widow', 'member of the imperial family']) + ' entrusted me with their will. Nobody would dare tamper with it here.'); } });
        } else if (j.career === 'r_charioteer') {
          items.push({ icon: '🐎', label: 'Train with my horses', onClick: function () { if (count('r_train')) return done(nope('My horses need rest.')); bump('r_train'); j.skill = Math.min(100, (j.skill || 20) + 4); done('I drove practice laps until the horses and I moved as one.'); } });
        } else {
          items.push({ icon: '💪', label: 'Work harder', onClick: function () { if (count('r_work') >= 2) return done(nope('I\'m exhausted.')); bump('r_work'); j.workHard = (j.workHard || 0) + 1; j.perf = Math.min(100, (j.perf || 50) + 5); E.stat('happy', -1); done('I put in extra effort.'); } });
        }
        if (j.career === 'r_vestal') items.push({ info: true, html: '<p class="muted">A Vestal serves for thirty years. There is no leaving early.</p>' });
        else items.push({ icon: '🚪', label: j.career === 'r_legion' ? 'Desert the legion' : 'Quit', danger: true, onClick: function () {
          if (j.career === 'r_legion' && U.chance(0.4)) { E.stat('health', -25); E.karma(-10); E.quitJob(true); return done(bad('I deserted and was caught. They beat me nearly to death before throwing me out.')); }
          E.quitJob(); done('I left my work.');
        } });
      }
      if (j && j.career === 'r_vestal') return items;
      // The ruler's family doesn't hire out as farmhands (js/eras.js, TL.dynasty).
      if (!TL.dynasty.royal()) items.push({ section: 'Find work' });
      CAREERS.forEach(function (c) {
        if ((j && j.career === c.id) || TL.dynasty.royal()) return;
        var why = age < c.min ? 'Must be ' + c.min + '+' : c.need ? c.need() : null;
        items.push({ icon: c.icon, label: c.levels[0][0], sub: c.name + ' · ' + E.fmt(den(c.levels[0][1])) + '/yr' + (why ? ' · ' + why : ''), disabled: !!why, onClick: function () { apply(c); } });
      });
      items.push({ section: 'Paths to glory' });
      var male = me().gender === 'M';
      items.push({ icon: '🦅', label: 'Join the legions', sub: !male ? 'Only men may serve' : age < 17 || age > 35 ? 'Ages 17 to 35' : '25 years of service · pay ' + E.fmt(den(225)) + '/yr', disabled: !male || age < 17 || age > 35 || (j && j.career === 'r_legion'), onClick: enlist });
      items.push({ icon: '⚔️', label: 'Become a gladiator', sub: 'Glory, prize money, and death', disabled: age < 17 || (j && j.career === 'r_gladiator') || (y() >= 200 && !male), onClick: function () { pickStyle(); } });
      items.push({ icon: '🐎', label: 'Race chariots', sub: 'The Greens, the Blues, the Reds or the Whites', disabled: age < 15 || (j && j.career === 'r_charioteer'), onClick: pickFaction });
      var canVest = !male && age >= 6 && age <= 10 && (a.cls === 'patrician' || a.cls === 'equestrian' || a.cls === 'plebeian') && E.parentsAround().length > 0;
      items.push({ icon: '🔥', label: 'Become a Vestal Virgin', sub: male ? 'Only girls are chosen' : age < 6 || age > 10 ? 'Girls are chosen between 6 and 10' : a.cls === 'slave' || a.cls === 'freed' ? 'Only freeborn daughters of citizens' : !E.parentsAround().length ? 'Both parents must be living' : 'Thirty years keeping Vesta\'s fire', disabled: !canVest || (j && j.career === 'r_vestal'), onClick: function () { if (!U.chance(a.cls === 'patrician' ? 0.6 : 0.3)) return done(bad('The Pontifex Maximus chose another girl this time.')); E.quitJob(true); hire('r_vestal'); S().job.company = 'the Temple of Vesta'; S().home = { type: 'cloister' }; done(good('The Pontifex Maximus took my hand and said, "I take you, beloved." My hair was cut and I entered the House of the Vestals. 🔥')); } });
      var canPhil = (a.edu || (a.philo && a.philo.wisdom >= 15)) && me().smarts >= 50;
      items.push({ icon: '🦉', label: 'Become a philosopher', sub: canPhil ? 'Stoic, Epicurean, Cynic or Platonist' : 'Needs schooling and a sharp mind', disabled: !canPhil || age < 16 || (j && j.career === 'r_philo'), onClick: becomePhilosopher });
      var canPol = (a.cls === 'patrician' || a.cls === 'equestrian') && a.edu === 'rhetoric';
      items.push({ icon: '🏛️', label: 'Enter politics', sub: canPol ? 'The cursus honorum, from quaestor to consul' : 'Needs a patrician or equestrian family and rhetoric school', disabled: !canPol || age < 28 || (j && j.career === 'r_cursus'), onClick: function () { E.quitJob(true); hire('r_cursus'); done(good('I entered public life. My first goal: quaestor at 30.')); } });
      var canPlot = (age >= 25 && (a.cls === 'patrician' || S().fame >= 40 || (j && (j.career === 'r_cursus' || (j.career === 'r_legion' && j.level >= 3))))) || (age >= 16 && TL.dynasty.royal() && !(a.dyn && a.dyn.regent));
      items.push({ icon: '🗡️', label: a.plot ? 'The conspiracy' : 'Plot against the emperor', sub: a.plot ? 'Strength ' + Math.round(a.plot.power) + ' · suspicion ' + Math.round(a.plot.heat) : canPlot ? 'Seize the throne, or die trying' : 'Needs to be 25+ and a patrician, senator, centurion or famous', danger: true, disabled: !canPlot && !a.plot, onClick: function () { TL.coup.menu(coupCfg(a.plot ? a.plot.kind : 'throne')); } });
      if (j && j.years >= 15 && age >= 50) items.push({ section: ' ' }, { icon: '🏖️', label: 'Retire', onClick: function () { var r = E.retire(); done(r.msg); } });
      return items;
    });
  }
  function card() {
    var s = S(), a = st(), j = s.job;
    var line = j ? E.jobTitle(j) + (j.company && !/r_(cursus|gladiator|charioteer|legion)/.test(j.career) ? ' · ' + j.company : '') : s.retired ? 'Retired' : 'Not working';
    var extra = j && j.career === 'r_gladiator' ? a.wins + ' wins · ' + a.losses + ' losses' : j && j.career === 'r_charioteer' ? a.raceWins + ' wins in ' + a.races + ' races' : j && j.career === 'r_legion' ? U.plural(j.years, 'year') + ' served' + (a.decorations ? ' · ' + U.plural(a.decorations, 'decoration') : '') : j && j.career === 'r_cursus' ? (a.offices.length ? 'Held: ' + a.offices.join(', ') : 'No offices yet') : j && j.career === 'r_philo' ? 'Wisdom ' + ph().wisdom + ' · ' + U.plural(ph().works.length, 'treatise') + ' · ' + U.plural(ph().pupils, 'pupil') : j ? 'Pay ' + E.fmt(E.jobSalary(j)) + '/yr' : '';
    return '<div class="kv"><b>' + U.esc(line) + '</b>' + (extra ? '<br><span class="muted">' + U.esc(extra) + '</span>' : '') + '<br><span class="muted">' + CLASS_NAME[a.cls] + ' · Emperor ' + emperor(s.year) + '</span></div>';
  }
  function apply(c) {
    var sv = E.statValue(c.stat || 'smarts'), p = 0.5 + (sv - 50) / 120 + (st().cls === 'patrician' ? 0.1 : 0);
    if (!U.chance(p)) return done(bad('They turned me away.'));
    E.quitJob(true); hire(c.id);
    done(good('I found work as ' + E.an(c.levels[0][0]) + ' ' + S().job.company + '.'));
  }
  function enlist() {
    if (me().athl < 30 && U.chance(0.5)) return done(bad('The recruiter took one look at me and laughed.'));
    E.quitJob(true); hire('r_legion'); S().job.company = 'Legio ' + U.pick(['II Augusta', 'IX Hispana', 'X Fretensis', 'XX Valeria Victrix', 'III Augusta', 'VI Victrix', 'XIV Gemina', 'I Minervia']);
    done(good('I swore the sacramentum and joined ' + S().job.company + '. 🦅'));
  }
  function pickStyle() {
    ui().choose('Choose your fighting style', 'Every gladiator fights in a style.', [['Murmillo', 'heavy sword and shield'], ['Retiarius', 'net and trident'], ['Thraex', 'curved sword'], ['Secutor', 'the net-fighter\'s hunter']].map(function (g) {
      return { label: g[0] + ' · ' + g[1], fn: function () { E.quitJob(true); hire('r_gladiator'); S().job.style = g[0]; S().job.company = 'the Ludus Magnus'; E.karma(-2); done('I swore the gladiator\'s oath: to be burned, bound, beaten and killed by the sword. I fight as a ' + g[0] + '. ⚔️'); } };
    }));
  }
  function pickFaction() {
    ui().choose('Pick a racing faction', 'All of Rome takes sides.', ['Greens', 'Blues', 'Reds', 'Whites'].map(function (f) {
      return { label: { Greens: '🟢', Blues: '🔵', Reds: '🔴', Whites: '⚪' }[f] + ' The ' + f, fn: function () { E.quitJob(true); hire('r_charioteer'); S().job.faction = f; S().job.company = 'the Circus Maximus'; done('I signed with the ' + f + '. 🐎'); } };
    }));
  }
  function nextOffice() { var a = st(); return OFFICES.filter(function (o) { return a.offices.indexOf(o[0]) < 0; })[0]; }
  function campaignCost(o) { return { Quaestor: 2000, Aedile: 6000, Praetor: 12000, Consul: 30000 }[o[0]]; }
  function election(o) {
    var s = S(), a = st(), cost = den(campaignCost(o));
    if (s.money < cost) return done(nope('An election campaign costs ' + E.fmt(cost) + ' in games, banquets and bribes.'));
    bump('r_elect'); E.addMoney(-cost);
    var p = 0.35 + s.fame / 150 + (s.karma - 50) / 300 + (a.cls === 'patrician' ? 0.15 : 0) + (me().smarts - 50) / 200;
    if (U.chance(p)) {
      a.offices.push(o[0]); s.job.office = o[0]; E.fame(o[0] === 'Consul' ? 15 : 5); E.stat('happy', 15);
      if (o[0] === 'Consul') { E.achieve('consul'); see('Served as consul', '🏛️'); }
      return done(good('The people elected me ' + o[0] + '! 🏛️'));
    }
    done(bad('I lost the election. My rival spent even more.'));
  }
  function runaway() {
    if (count('r_run')) return done(nope('I\'m being watched too closely to try again this year.'));
    bump('r_run');
    if (U.chance(0.12)) { E.log('🏃 I escaped in the night and made a new life far away.', 'good'); freeMe('escape'); return done(good('I made it. Nobody followed.')); }
    E.stat('health', -20); E.stat('happy', -15);
    done(bad('Slave catchers found me within days. I was beaten and dragged back.'));
  }

  // ---- assets
  var HOMES = { insula: ['A room in an insula', 120, -2], apt: ['An insula apartment', 300, 0], fine: ['A fine apartment on the first floor', 900, 3] };
  function homeLabel(h) {
    var a = st();
    if (h.type === 'parents') return a.cls === 'slave' ? 'The household of ' + a.master : !E.parentsAround().length ? 'The family domus' : me().age < 18 ? 'My family\'s home' : 'Living with my family';
    if (h.type === 'cloister') return 'The House of the Vestals';
    if (h.type === 'palace') return 'The imperial palace on the Palatine';
    if (h.type === 'homeless') return 'Sleeping in the streets';
    if (h.type === 'owned') { var o = E.ownedHome(); return o ? 'My ' + o.type.toLowerCase() + ' ' + (o.where || '') : 'My house'; }
    return (HOMES[h.anc] || HOMES.apt)[0];
  }
  function assetsMenu() {
    ui().menu('Property & wealth', function () {
      var s = S(), a = st(), items = [], props = s.assets.filter(function (x) { return x.anc; });
      var worth = props.reduce(function (t, x) { return t + x.value; }, 0) + (a.inv || []).reduce(function (t, v) { return t + (v.value || v.amt || 0); }, 0);
      items.push({ info: true, html: '<div class="nw"><small>Wealth</small><div class="nw-big' + (s.money + worth < 0 ? ' neg' : '') + '">' + E.fmt(s.money + worth) + '</div><div class="nw-grid"><div><small>Coin</small><b>' + E.fmt(s.money) + '</b></div><div><small>Property & ventures</small><b>' + E.fmt(worth) + '</b></div></div><div class="bz-cap">Money is counted in denarii. A laborer earns about ' + E.fmt(den(200)) + ' a year.</div></div>' });
      var stuck = me().age < 16 || a.cls === 'slave' || s.home.type === 'palace' || s.home.type === 'cloister';
      items.push({ icon: '🏠', label: E.homeLabel(), sub: stuck ? 'Where I live' : 'Tap to move', disabled: stuck, onClick: moveMenu });
      if (props.length || (a.inv || []).length) {
        items.push({ section: 'What I own' });
        props.forEach(function (p) { items.push({ icon: p.icon, label: p.type, sub: p.where || '', right: E.fmt(p.value), onClick: function () { ui().choose(p.type, 'Sell it for ' + E.fmt(Math.round(p.value * 0.9)) + '?', [{ label: 'Sell', fn: function () { E.addMoney(Math.round(p.value * 0.9)); s.assets = s.assets.filter(function (x) { return x !== p; }); if (s.home.type === 'owned' && s.home.id === p.id) s.home = { type: 'rent', anc: 'apt', tier: 1, mult: 2.5 }; done('I sold my ' + p.type.toLowerCase() + '.'); } }]); } }); });
        (a.inv || []).forEach(function (v) { items.push({ icon: v.kind === 'farm' ? '🌾' : v.kind === 'loan' ? '🪙' : '⛵', label: v.kind === 'farm' ? 'Farmland' : v.kind === 'loan' ? 'Loan to ' + v.who : 'Voyage to ' + v.to, sub: v.kind === 'farm' ? 'Earns from each harvest' : 'Due in ' + v.due, right: E.fmt(v.value || v.amt) }); });
      }
      if (me().age < 16 || a.cls === 'slave') return items;
      items.push({ section: 'Buy' });
      [['🏛️', 'Domus', 'A town house with an atrium', 40000, true], ['🌳', 'Villa', 'A country estate with vineyards', 120000, true], ['🐎', 'Horse', 'Get around like a nobleman', 1500], ['🛞', 'Chariot', 'Turn heads on the Via Appia', 6000]].forEach(function (b) {
        var cost = den(b[3]);
        items.push({ icon: b[0], label: b[1], sub: b[2], right: E.fmt(cost), onClick: function () {
          if (s.money < cost) return done(nope('I can\'t afford that.'));
          E.addMoney(-cost);
          var asset = { id: U.uid(), kind: b[4] ? 'house' : 'car', anc: true, icon: b[0], type: b[1], name: b[1], where: b[4] ? place() : '', value: cost, price: cost, cond: 100, upkeep: 0.01 };
          s.assets.push(asset);
          if (b[4]) { s.home = { type: 'owned', id: asset.id }; E.achieve('homeowner'); }
          done(good('I bought a ' + b[1].toLowerCase() + '! ' + b[0]));
        } });
      });
      items.push({ section: 'Invest' });
      items.push({ icon: '🌾', label: 'Buy farmland', sub: 'Harvests pay every year, droughts don\'t', right: E.fmt(den(5000)), onClick: function () { var c = den(5000); if (s.money < c) return done(nope('I can\'t afford farmland.')); E.addMoney(-c); a.inv.push({ kind: 'farm', value: c }); done('I bought farmland outside the city. 🌾'); } });
      items.push({ icon: '⛵', label: 'Finance a trade voyage', sub: 'Big profits, or a shipwreck', onClick: function () { invest('voyage'); } });
      items.push({ icon: '🪙', label: 'Lend money', sub: '15% interest, if they pay you back', onClick: function () { invest('loan'); } });
      return items;
    });
  }
  function invest(kind) {
    var s = S();
    ui().choose(kind === 'voyage' ? 'Trade voyage' : 'Lend money', 'How much of my ' + E.fmt(s.money) + ' should I put in?', [0.1, 0.25, 0.5].map(function (f) {
      return { label: Math.round(f * 100) + '% (' + E.fmt(Math.round(Math.max(0, s.money) * f)) + ')', fn: function () {
        var amt = Math.round(Math.max(0, s.money) * f);
        if (amt < den(50)) return done(nope('That\'s not enough to bother with.'));
        E.addMoney(-amt);
        var v = { kind: kind, amt: amt, due: y() + 1 };
        if (kind === 'voyage') { v.to = U.pick(['Alexandria', 'Carthage', 'Gades', 'Antioch', 'Massilia', 'Rhodes']); done('My ship set sail for ' + v.to + '. ⛵'); }
        else { var c = D.country(s.country); v.who = U.pick(c.male) + ' ' + U.pick(c.last); done('I lent ' + E.fmt(amt) + ' to ' + v.who + '.'); }
        st().inv.push(v);
      } };
    }));
  }
  function moveMenu() {
    var s = S();
    ui().choose('Where should I live?', 'Rent is due every year.', [['parents', 'Live with my family'], ['insula', HOMES.insula[0] + ' (' + E.fmt(den(HOMES.insula[1])) + '/yr)'], ['apt', HOMES.apt[0] + ' (' + E.fmt(den(HOMES.apt[1])) + '/yr)'], ['fine', HOMES.fine[0] + ' (' + E.fmt(den(HOMES.fine[1])) + '/yr)']].map(function (h) {
      return { label: h[1], fn: function () {
        if (h[0] === 'parents') { if (!E.parentsAround().length) return done(nope('My parents are gone.')); s.home = { type: 'parents' }; return done('I moved back in with my family.'); }
        s.home = { type: 'rent', tier: { insula: 0, apt: 1, fine: 2 }[h[0]], anc: h[0], mult: HOMES[h[0]][1] * 100 / E.RENT_TIERS[{ insula: 0, apt: 1, fine: 2 }[h[0]]][1] };
        done('I moved into ' + HOMES[h[0]][0].toLowerCase() + '.');
      } };
    }));
  }

  // ---- activities
  var GODS = [['⚡', 'Jupiter', 'king of the gods'], ['❤️', 'Venus', 'love'], ['⚔️', 'Mars', 'war'], ['🌾', 'Ceres', 'the harvest'], ['🎡', 'Fortuna', 'luck'], ['🐍', 'Asclepius', 'healing']];
  function activitiesMenu() {
    ui().menu('Activities', function () {
      var s = S(), a = st(), age = me().age, items = [];
      var free = a.cls !== 'slave';
      items.push({ section: 'Mind & Body' });
      if (age >= 6) items.push({ icon: '♨️', label: 'Go to the baths', sub: 'Hot rooms, cold plunges and gossip', right: E.fmt(den(1)), onClick: function () { var f = 1 / (1 + count('r_bath')); bump('r_bath'); E.addMoney(-den(1)); E.stat('happy', 6 * f); E.stat('health', 3 * f); done('I spent the afternoon at the baths. ♨️'); } });
      if (age >= 10) items.push({ icon: '🤼', label: 'Exercise at the palaestra', onClick: function () { var f = 1 / (1 + count('r_gym')); bump('r_gym'); me().athl = Math.min(100, me().athl + Math.round(4 * f)); E.stat('health', 2 * f); done('I wrestled and ran at the palaestra. 💪'); } });
      if (age >= 8 && (a.edu || age >= 14)) items.push({ icon: '📚', label: 'Read scrolls at a library', onClick: function () { var f = 1 / (1 + count('r_read')); bump('r_read'); E.stat('smarts', 4 * f); done('I read ' + U.pick(['Virgil\'s Aeneid', 'Homer', 'Cicero\'s speeches', 'Seneca\'s letters', 'Ovid\'s poems', 'Pliny\'s Natural History']) + '. 📜'); } });
      items.push({ section: 'Education' });
      if (age >= 6 && age <= 13 && free) items.push({ icon: '🧑‍🏫', label: a.edu ? 'Keep studying letters' : 'Go to school (a ludus)', sub: 'Reading, writing and arithmetic', right: E.fmt(den(20)), onClick: function () { if (count('r_school')) return done(nope('I already went to school this year.')); bump('r_school'); E.addMoney(-den(20)); E.stat('smarts', U.rand(3, 7)); if (!a.edu && U.chance(0.4)) { a.edu = 'letters'; return done(good('I can read and write now! ✍️')); } done('I learned my letters, with a few whacks from the teacher\'s cane.'); } });
      if (age >= 14 && age <= 20 && free && a.edu) items.push({ icon: '🎙️', label: a.edu === 'rhetoric' ? 'Practice oratory' : 'Study rhetoric', sub: 'Opens law and politics', right: E.fmt(den(150)), onClick: function () { var c = den(150); if (s.money < c && a.cls !== 'patrician') return done(nope('Rhetoric teachers cost ' + E.fmt(c) + '.')); if (count('r_rhet')) return done(nope('Enough speeches for one year.')); bump('r_rhet'); if (a.cls !== 'patrician') E.addMoney(-c); E.stat('smarts', 4); if (a.edu !== 'rhetoric' && U.chance(0.4)) { a.edu = 'rhetoric'; return done(good('My teacher says I\'m ready to speak in the Forum. 🎙️')); } done('I practiced speeches until my voice gave out.'); } });
      if (age < 6 || (!(age >= 6 && age <= 13 && free) && !(age >= 14 && age <= 20 && free && a.edu))) items.push({ info: true, html: '<p class="muted">' + (a.edu === 'rhetoric' ? 'Trained in rhetoric.' : a.edu ? 'I can read and write.' : free ? 'School is for children from 6 to 13.' : 'Enslaved children aren\'t sent to school.') + '</p>' });
      items.push({ section: 'Health' });
      items.push({ icon: '⚕️', label: 'Visit a physician', sub: s.conditions.length ? s.conditions.map(illName).join(', ') : 'Herbs, bloodletting and Greek medicine', onClick: physician });
      items.push({ section: 'Fun & Social' });
      if (age >= 6) items.push({ icon: '⚔️', label: y() >= 80 && s.city === 'Rome' ? 'Watch the games at the Colosseum' : 'Watch the gladiator games', onClick: function () { var f = 1 / (1 + count('r_games')); bump('r_games'); E.stat('happy', 7 * f); done(U.pick(['A retiarius netted his opponent and the crowd went wild.', 'There were lions, a mock sea battle and fifty pairs of gladiators.', 'My favorite gladiator won again! The crowd chanted his name.'])); } });
      if (age >= 8) items.push({ icon: '🐎', label: 'Go to the chariot races', sub: 'Bet on a faction', onClick: races });
      if (age >= 8) items.push({ icon: '🎭', label: 'See a play at the theater', onClick: function () { var f = 1 / (1 + count('r_play')); bump('r_play'); E.stat('happy', 5 * f); E.stat('smarts', 1); done('I watched ' + U.pick(['a comedy by Plautus', 'a pantomime dancer', 'a tragedy by Seneca', 'a farce that made everyone howl']) + '. 🎭'); } });
      if (age >= 18 && free) items.push({ icon: '🍷', label: 'Throw a banquet', sub: 'Impress friends and patrons', right: E.fmt(den(80)), onClick: banquet });
      if (age >= 12) items.push({ icon: '🎲', label: 'Gamble at dice', sub: 'Knucklebones in a taberna', onClick: dice });
      items.push({ section: 'The Gods' });
      items.push({ icon: '🔥', label: 'Make an offering at a temple', onClick: function () { ui().choose('Which god?', 'Choose a temple.', GODS.map(function (g) { return { label: g[0] + ' ' + g[1] + ', god' + (g[1] === 'Venus' || g[1] === 'Ceres' || g[1] === 'Fortuna' ? 'dess' : '') + ' of ' + g[2], fn: function () { offering(g); } }; })); } });
      if (age >= 14) items.push({ icon: '🐦', label: 'Consult an augur', sub: 'Read the will of the gods in the birds', right: E.fmt(den(5)), onClick: augur });
      if (age >= 10 && !a.rule) {
        items.push({ section: 'Crime' });
        [['👛', 'Pickpocket in the Forum', 0.65, 5, 60, 10], ['🍎', 'Steal from a market stall', 0.75, 1, 20, 8], ['🏛️', 'Burgle a rich man\'s domus', 0.45, 100, 1500, 14], ['📜', 'Forge a will', 0.35, 500, 5000, 18]].forEach(function (c) {
          items.push({ icon: c[0], label: c[1], disabled: age < c[5], onClick: function () { crime(c); } });
        });
      }
      items.push({ section: 'Life' });
      if (age >= 18 && free && !a.rule && s.home.type !== 'cloister') items.push({ icon: '🧭', label: 'Move to another city', onClick: function () { var c = D.country(s.country); ui().choose('Move where?', 'A new start somewhere else in the empire.', U.shuffle(c.cities.filter(function (x) { return x !== s.city; }).filter(function (x, i, arr) { return arr.indexOf(x) === i; })).slice(0, 5).map(function (city) { return { label: city, fn: function () { s.city = city; E.log('🧭 I moved to ' + city + '.'); done('I packed up and moved to ' + city + '.'); } }; })); } });
      if (TL.maps) items.push({ icon: '🗺️', label: 'Map of the Roman world', sub: a.rule ? 'My empire and my wars' : 'Who holds what in ' + E.yearLabel(y()), onClick: TL.maps.menu });
      items.push({ icon: '⏳', label: 'Time Machine', sub: E.tmAges().length ? 'Go back up to ' + U.plural(E.tmAges().length, 'year') : 'Age up to charge it', disabled: !E.tmAges().length, onClick: function () { ui().timeMachine(); } });
      items.push({ icon: '🏆', label: 'Achievements', onClick: TL.actions.achievementsMenu });
      return items;
    });
  }
  function physician() {
    var s = S();
    ui().menu('Physician', function () {
      var items = [{ info: true, html: '<p class="muted">Roman medicine is part science, part superstition. Treatments are cheap but uncertain.</p>' }];
      items.push({ icon: '🩺', label: 'Get a checkup', right: E.fmt(den(5)), onClick: function () { if (count('r_doc')) return done(nope('The physician has seen enough of me this year.')); bump('r_doc'); E.addMoney(-den(5)); E.stat('health', 2); done('The physician felt my pulse and prescribed ' + U.pick(['garlic and honey', 'cabbage leaves', 'a diet of figs', 'wine mixed with herbs']) + '.'); } });
      items.push({ icon: '🩸', label: 'Bloodletting', sub: 'Balance the four humors', onClick: function () { if (count('r_blood')) return done(nope('I\'ve been bled enough for one year.')); bump('r_blood'); E.stat('health', -U.rand(2, 8)); E.stat('happy', 2); done('They opened a vein and drained a cup of blood. I felt faint but strangely better.'); } });
      s.conditions.forEach(function (n) {
        var ill = D.illness(n) || { cure: 0.4 };
        if (ill.incurable || !ill.cure) {
          items.push({ icon: '🌿', label: 'Ease ' + illName(n).toLowerCase(), sub: 'No cure, but remedies help', right: E.fmt(den(10)), onClick: function () {
            if (count('r_treat' + n)) return done(nope('That has to wait until next year.'));
            bump('r_treat' + n); E.addMoney(-den(10)); E.stat('health', U.rand(3, 7));
            done('The physician\'s herbs and diet eased my ' + illName(n).toLowerCase().replace(/^(an?|the) /, '') + ' for a while.');
          } });
          return;
        }
        items.push({ icon: '🌿', label: 'Treat ' + illName(n).toLowerCase(), sub: Math.round(ill.cure * 55) + '% chance it works', right: E.fmt(den(15)), onClick: function () {
          if (count('r_treat' + n)) return done(nope('That has to wait until next year.'));
          bump('r_treat' + n); E.addMoney(-den(15));
          if (U.chance(ill.cure * 0.55)) { E.removeCondition(n); E.stat('health', 6); return done(good('The physician\'s remedy worked. I\'m over my ' + illName(n).toLowerCase().replace(/^(an?|the) /, '') + '.')); }
          done(bad('The remedy did nothing.'));
        } });
      });
      return items;
    });
  }
  function races() {
    var s = S();
    ui().choose('Circus Maximus', 'A quarter of a million people roar. Who will I bet on?', ['Greens', 'Blues', 'Reds', 'Whites'].map(function (f) {
      return { label: { Greens: '🟢', Blues: '🔵', Reds: '🔴', Whites: '⚪' }[f] + ' The ' + f + ' (bet ' + E.fmt(den(10)) + ')', fn: function () {
        bump('r_races'); E.stat('happy', 4);
        if (s.money < den(10)) return done('I couldn\'t afford a bet, but the races were thrilling anyway.');
        if (U.chance(0.25)) { E.addMoney(den(20)); return done(good('The ' + f + ' won by a nose! I tripled my money. 🐎')); }
        E.addMoney(-den(10)); done('The ' + f + ' lost. A chariot crashed on the last turn.');
      } };
    }));
  }
  function banquet() {
    var s = S(), c = den(80);
    if (s.money < c) return done(nope('A proper banquet costs ' + E.fmt(c) + '.'));
    if (count('r_feast')) return done(nope('One banquet a year is plenty.'));
    bump('r_feast'); E.addMoney(-c); E.stat('happy', 8); E.fame(1);
    s.people.filter(function (p) { return p.alive && /friend|spouse|partner/.test(p.role); }).forEach(function (p) { E.rel(p, U.rand(4, 10)); });
    done(good('I served ' + U.pick(['stuffed dormice', 'peacock and flamingo tongues', 'oysters from Brundisium', 'garum on everything']) + ' to my guests. They\'ll talk about it for weeks. 🍷'));
  }
  function dice() {
    var s = S(), bet = den(5);
    bump('r_dice');
    if (s.money < bet) return done(nope('I don\'t even have ' + E.fmt(bet) + ' to bet.'));
    if (U.chance(0.45)) { E.addMoney(bet); return done('I threw the Venus throw! I won ' + E.fmt(bet) + '. 🎲'); }
    E.addMoney(-bet); done('I threw the dog. I lost ' + E.fmt(bet) + '.');
  }
  function offering(g) {
    var s = S();
    if (count('r_god')) return done(nope('I\'ve already made my offering this year.'));
    bump('r_god'); E.addMoney(-den(2)); E.karma(2);
    var lucky = U.chance(0.35);
    if (g[1] === 'Asclepius' && lucky && s.conditions.length) { var n = s.conditions[0]; if (U.chance(0.3)) { E.removeCondition(n); return done(good('I slept in the temple of Asclepius and dreamed of a snake. When I woke, my ' + illName(n).toLowerCase().replace(/^(an?|the) /, '') + ' was gone.')); } }
    if (g[1] === 'Fortuna' && lucky) { E.addMoney(den(U.rand(10, 60))); return done(good('Fortuna smiled on me. I found a purse of coins on my way home. 🎡')); }
    if (g[1] === 'Venus' && lucky) { E.stat('looks', 3); E.stat('happy', 5); return done(good('Venus blessed me. I feel radiant. ❤️')); }
    if (g[1] === 'Mars' && lucky) { me().athl = Math.min(100, me().athl + 3); return done(good('Mars filled me with strength. ⚔️')); }
    E.stat('happy', 3);
    done('I offered ' + U.pick(['a white lamb', 'incense and wine', 'a honey cake', 'a small bronze statue']) + ' to ' + g[1] + '.');
  }
  function augur() {
    if (count('r_augur')) return done(nope('The augur says the birds have said enough.'));
    bump('r_augur'); E.addMoney(-den(5));
    done(U.pick(['The birds flew to the right. A favorable sign! The augur says fortune is coming.', 'The sacred chickens refused to eat. A terrible omen!', 'An eagle circled overhead. Great things await me, the augur says.', 'Crows on the left. The augur advised against any journeys this year.']));
  }
  function crime(c) {
    var s = S();
    bump('r_crime'); s.counts.crimes++; E.karma(-3);
    if (U.chance(c[2] + me().athl / 400)) { var g = den(U.rand(c[3], c[4])); E.addMoney(g); return done('I got away with ' + E.fmt(g) + '. 🤫'); }
    s.record.push({ crime: c[1], year: s.year });
    var r = U.rand(1, 100);
    if (c[4] >= 5000 && r <= 40) { s.pending.push({ id: 'r_condemned' }); return done(bad('I was caught and dragged before a magistrate.')); }
    if (r <= 50) { E.stat('health', -U.rand(10, 20)); return done(bad('I was caught and publicly flogged in the Forum.')); }
    var fine = Math.min(Math.max(0, s.money), den(U.rand(20, 200))); E.addMoney(-fine);
    done(bad('I was caught and fined ' + E.fmt(fine) + '.'));
  }

  // ---- relationships: things to do together, and weddings
  var ACTS = [['♨️', 'Go to the baths', 100, ['Outgoing', 'Cheerful'], [], 'went to the baths with', 6], ['🏛️', 'Stroll through the Forum', 0, ['Smart', 'Outgoing'], [], 'strolled through the Forum with', 8],
    ['🍷', 'Share wine at a taberna', 300, ['Outgoing', 'Funny'], ['Shy'], 'shared wine with', 16], ['🎭', 'Watch a play', 100, ['Artsy', 'Romantic'], [], 'watched a play with', 10],
    ['⚔️', 'Watch the gladiators', 200, ['Athletic', 'Outgoing'], ['Kind'], 'watched the gladiators with', 10], ['🐎', 'Cheer at the chariot races', 100, ['Athletic', 'Greedy'], [], 'cheered at the races with', 8],
    ['🎲', 'Play dice', 0, ['Greedy', 'Funny'], ['Shy'], 'played dice with', 12], ['🧺', 'Picnic in the countryside', 100, ['Romantic', 'Cheerful'], [], 'had a picnic with', 10]];
  var KID_ACTS = [['🦴', 'Play knucklebones', 0, [], [], 'played knucklebones with'], ['🏃', 'Play tag in the streets', 0, ['Athletic'], [], 'played tag with'], ['🐕', 'Play with the dog', 0, [], [], 'played with the dog with']];
  var OLD_ACTS = [['🔥', 'Tell stories by the hearth', 0, ['Loyal', 'Kind'], [], 'told stories by the hearth with'], ['♟️', 'Play latrunculi', 0, ['Smart', 'Stubborn'], [], 'played latrunculi with'], ['🌳', 'Walk in the gardens', 0, ['Cheerful'], [], 'walked in the gardens with']];
  function acts(kind) { return kind === 'kid' ? KID_ACTS : kind === 'old' ? OLD_ACTS : ACTS; }
  var WEDDINGS = [['🏠', 'Simple ceremony at home', 100], ['🌿', 'Traditional wedding and procession', 3000], ['🏛️', 'Grand wedding feast', 30000], ['🌳', 'Lavish wedding at a villa', 150000]];

  // ------------------------------------------------------------ events
  function def(id, o) { o.id = id; o.ancient = 'rome'; o.w = o.w || 10; TL.events.defs[id] = o; }
  function sdef(id, o) { o.id = id; o.scripted = true; TL.events.defs[id] = o; }
  def('r_insula_fire', { min: 16, w: 5, cond: function () { return S().home.type === 'rent'; }, build: function () {
    return { icon: '🔥', title: 'Fire!', text: 'Smoke is pouring up the stairwell of my insula. The building is old and made of wood.', choices: [
      { label: 'Grab my coins and run', run: function () { E.stat('health', -U.rand(0, 6)); return 'I escaped with my purse. The building burned to the ground.'; } },
      { label: 'Help the neighbors out', run: function () { E.karma(6); if (U.chance(0.3)) { E.stat('health', -U.rand(10, 25)); return bad('I carried a child out but breathed in too much smoke.'); } return good('I helped three families escape. The vigiles thanked me.'); } }
    ] };
  } });
  def('r_flood', { notRuler: true, min: 6, w: 3, cond: function () { return S().city === 'Rome'; }, build: function () {
    return { icon: '🌊', title: 'The Tiber floods', text: 'The Tiber burst its banks. Water is rising in the streets.', choices: [{ label: 'Move to higher ground', run: function () { E.addMoney(-Math.round(Math.max(0, S().money) * 0.05)); return 'We waited it out on the Aventine. The mud ruined some of our things.'; } }] };
  } });
  def('r_patron', { notRuler: true, min: 18, w: 6, cond: function () { return st().cls === 'plebeian' || st().cls === 'freed'; }, build: function () {
    var c = D.country(S().country), patron = U.pick(c.male) + ' ' + D.gentile(U.pick(c.last), 'M');
    return { icon: '🤝', title: 'A patron', text: 'The wealthy ' + patron + ' offers to become my patron. Clients greet their patron every morning and support him in public.', choices: [
      { label: 'Become his client', run: function () { st().patron = patron; E.addMoney(den(U.rand(20, 80))); return good('Every morning I join the crowd at his door. In return, he looks after me.'); } },
      { label: 'I\'ll make my own way', run: function () { E.stat('happy', 2); return 'I\'m nobody\'s client.'; } }
    ] };
  } });
  def('r_banquet_invite', { min: 18, w: 5, build: function () {
    return { icon: '🍇', title: 'An invitation', text: 'A senator invited me to a lavish banquet.', choices: [
      { label: 'Go and mingle', run: function () { E.fame(2); E.stat('happy', 5); if (U.chance(0.2)) { E.stat('health', -6); return 'I ate so much dormouse and drank so much wine that I was sick for days.'; } return good('I reclined next to powerful people. Useful connections!'); } },
      { label: 'Stay home', run: function () { return 'I stayed in.'; } }
    ] };
  } });
  def('r_fever', { min: 1, w: 5, build: function () {
    return { icon: '🦟', title: 'Marsh fever', text: 'A burning fever came back every few days. The physicians call it the tertian fever.', choices: [
      { label: 'Rest and drink herbs', run: function () { E.stat('health', -U.rand(5, 15)); return 'The fever broke after weeks in bed.'; } },
      { label: 'Pray to the goddess Febris', run: function () { E.stat('health', -U.rand(5, 20)); E.karma(1); return 'I left offerings at the temple of Febris. Eventually it passed.'; } }
    ] };
  } });
  def('r_saturnalia', { min: 3, w: 6, build: function () {
    var slave = st().cls === 'slave';
    return { icon: '🎁', title: 'Saturnalia', text: 'Io, Saturnalia! For a week the world is turned upside down. ' + (slave ? 'Masters serve their slaves at dinner.' : 'Everyone gambles, feasts and swaps gifts.'), choices: [
      { label: 'Celebrate', run: function () { E.stat('happy', 10); return slave ? good('My master served me dinner and I wore the felt cap of a free person for a day.') : good('I gave my friends candles and little clay figures, and lost some coins at dice.'); } }
    ] };
  } });
  def('r_tax', { notRuler: true, min: 18, w: 4, cond: function () { return st().cls !== 'slave' && S().money > 0; }, build: function () {
    var amt = Math.min(S().money, den(U.rand(20, 200)));
    return { icon: '🧾', title: 'The tax collector', text: 'A publicanus demands ' + E.fmt(amt) + ' in taxes, far more than I owe.', choices: [
      { label: 'Pay up', run: function () { E.addMoney(-amt); return 'I paid. The publicani always win.'; } },
      { label: 'Bribe him to go away', run: function () { E.addMoney(-Math.round(amt / 3)); E.karma(-3); return 'A smaller "gift" made the problem disappear.'; } },
      { label: 'Complain to the magistrate', run: function () { if (U.chance(0.35)) return good('The magistrate sided with me!'); E.addMoney(-amt); return bad('The magistrate was the collector\'s cousin. I paid anyway.'); } }
    ] };
  } });
  def('r_recruiter', { notRuler: true, min: 17, max: 30, w: 5, cond: function () { return me().gender === 'M' && st().cls !== 'slave' && !(S().job && S().job.career === 'r_legion'); }, build: function () {
    return { icon: '🦅', title: 'The legions are recruiting', text: 'A recruiting officer is signing up young men for the legions. Steady pay, a pension, and adventure.', choices: [
      { label: 'Enlist', run: function () { E.quitJob(true); hire('r_legion'); S().job.company = 'Legio ' + U.pick(['II Augusta', 'IX Hispana', 'X Fretensis', 'XX Valeria Victrix']); return good('I swore the sacramentum. I\'m a legionary now. 🦅'); } },
      { label: 'No thanks', run: function () { return 'I stayed a civilian.'; } }
    ] };
  } });
  def('r_marriage', { notRuler: true, min: 16, max: 35, w: 7, cond: function () { return !E.partner() && st().cls !== 'slave' && !(S().job && S().job.career === 'r_vestal'); }, build: function () {
    if (S().job && S().job.career === 'r_vestal') return null;
    var c = D.country(S().country), g = me().interest === 'A' ? (U.chance(0.5) ? 'M' : 'F') : me().interest, nm = (function () { for (var i = 0; i < 8; i++) { var f = U.pick(g === 'M' ? c.male : c.female), l = D.gentile(U.pick(c.last), g); if (f !== l) return f + ' ' + l; } return f + ' ' + l; })(); // never "Claudia Claudia"
    return { icon: '💍', title: 'An arranged match', text: 'My family has arranged a marriage to ' + nm + ', from a respectable family.', choices: [
      { label: 'Agree to the marriage', run: function () { var p = E.addPerson({ role: 'spouse', gender: g, age: me().age + U.rand(-3, 8), rel: U.rand(40, 75) }); p.first = nm.split(' ')[0]; p.last = nm.split(' ')[1]; E.achieve('married'); E.stat('happy', 8); return good('We were married in a ceremony at home. Feliciter! 💍'); } },
      { label: 'Refuse', run: function () { E.people(['mother', 'father']).forEach(function (p) { E.rel(p, -15); }); return 'My family is furious with me.'; } }
    ] };
  } });
  def('r_hoard', { notRuler: true, min: 8, w: 2, build: function () {
    return { icon: '🏺', title: 'Buried treasure', text: 'While digging, I struck a clay jar full of old coins.', choices: [
      { label: 'Keep it', run: function () { var g = den(U.rand(40, 400)); E.addMoney(g); return good('I kept the hoard: ' + E.fmt(g) + '. Nobody will ever know.'); } },
      { label: 'Report it', run: function () { E.karma(5); var g = den(U.rand(10, 80)); E.addMoney(g); return 'I reported it and was allowed to keep a share: ' + E.fmt(g) + '.'; } }
    ] };
  } });
  def('r_omen', { min: 8, w: 4, build: function () {
    return { icon: '⚡', title: 'An omen', text: 'Lightning struck a statue in the Forum. Everyone is arguing about what it means.', choices: [
      { label: 'Make a sacrifice to be safe', run: function () { E.addMoney(-den(5)); E.karma(2); return 'I offered a lamb. Better safe than sorry.'; } },
      { label: 'It\'s just weather', run: function () { E.stat('smarts', 1); return 'I\'m not superstitious. Mostly.'; } }
    ] };
  } });
  def('r_earthquake', { min: 4, w: 2, build: function () {
    return { icon: '🌋', title: 'Earthquake', text: 'The ground shook and walls cracked across the city.', choices: [{ label: 'Take cover', run: function () { if (U.chance(0.15)) { E.stat('health', -U.rand(10, 25)); return bad('A roof tile struck me on the head.'); } return 'We were shaken, but safe.'; } }] };
  } });
  def('r_street', { notRuler: true, min: 14, w: 4, build: function () {
    return { icon: '🗡️', title: 'Thieves at night', text: 'Rome\'s streets are dark at night. Two men stepped out of an alley.', choices: [
      { label: 'Hand over my purse', run: function () { E.addMoney(-Math.min(Math.max(0, S().money), den(U.rand(5, 40)))); return 'They took my purse and vanished.'; } },
      { label: 'Fight back', run: function () { if (U.chance(0.4 + me().athl / 250)) { E.stat('happy', 5); return good('I knocked one flat and the other ran.'); } E.stat('health', -U.rand(10, 25)); return bad('They beat me badly.'); } }
    ] };
  } });
  def('r_captator', { min: 55, w: 4, cond: function () { return S().money > den(20000) && st().cls !== 'slave'; }, build: function () {
    var c = D.country(S().country), who = U.pick(c.male) + ' ' + D.gentile(U.pick(c.last), 'M');
    return { icon: '🎁', title: 'A legacy hunter', text: who + ' has started sending me gifts, praising my health and visiting every day. Everyone knows what he wants: to be named in my will.', choices: [
      { label: 'Enjoy the gifts, promise nothing', run: function () { E.addMoney(den(U.rand(100, 600))); E.stat('happy', 4); return 'The wine he sends is excellent. My will is unchanged.'; } },
      { label: 'Send him away', run: function () { E.karma(2); return 'I told him I plan to live to a hundred. He looked genuinely upset.'; } }
    ] };
  } });
  def('r_triumph', { min: 6, w: 3, cond: function () { return S().city === 'Rome'; }, build: function () {
    return { icon: '🦅', title: 'A triumph', text: 'A victorious general is parading through Rome with his legions, captured kings in chains and wagons of treasure.', choices: [
      { label: 'Watch from the Via Sacra', run: function () { E.stat('happy', 6); return 'A slave rode behind the general in his chariot, whispering "Remember you are mortal." The crowd went wild.'; } },
      { label: 'Grab a coin thrown to the crowd', run: function () { if (U.chance(0.6)) { E.addMoney(den(U.rand(2, 15))); return good('I caught a handful of coins in the scramble!'); } E.stat('health', -5); return bad('I was trampled in the scramble and came away with nothing but bruises.'); } }
    ] };
  } });
  def('r_beast', { min: 6, w: 2, cond: function () { return S().city === 'Rome' || S().city === 'Capua'; }, build: function () {
    return { icon: '🦁', title: 'A lion in the street', text: 'A lion has escaped from the animal pens under the arena and is loose in the street.', choices: [
      { label: 'Climb onto a roof', run: function () { return 'I watched from a rooftop while the beast-hunters cornered it with nets.'; } },
      { label: 'Help the hunters with a spear', run: function () { if (U.chance(0.4 + me().athl / 300)) { E.fame(3); return good('I helped pin it with my spear. Even the hunters were impressed.'); } E.stat('health', -U.rand(15, 30)); return bad('The lion got a paw on me before the hunters got their nets on it.'); } }
    ] };
  } });
  // Emperors without sons adopted the best man they knew: Nerva chose Trajan, Trajan chose Hadrian.
  def('r_adoption', { notRuler: true, min: 25, max: 55, w: 3, cond: function () {
    var a = st(), j = S().job;
    return !a.dyn && !a.rule && !a.plot && (a.cls === 'patrician' || a.cls === 'equestrian') && S().fame >= 40 && S().karma >= 30
      && (S().fame >= 60 || a.offices.indexOf('Consul') >= 0 || !!(j && ((j.career === 'r_cursus' && j.governor) || (j.career === 'r_legion' && j.level >= 3))));
  }, build: function () {
    var old = emperor(y());
    return { icon: '👑', title: 'The emperor\'s choice', text: 'Emperor ' + old + ' has no son to follow him. He has watched my career for years, and today he asked me to become his son and heir.', choices: [
      { label: 'Accept, and become Caesar', run: function () { TL.dynasty.adopt(old); E.log('👑 Emperor ' + old + ' adopted me as his son. I am Caesar now, heir to the empire.', 'good'); return good('I knelt before the emperor in the Senate house, and he named me his son. When he dies, the empire is mine. 👑'); } },
      { label: 'Refuse the honor', run: function () { E.karma(4); E.fame(3); return 'I said Rome deserved a better man than me. Some called it modesty; the emperor called it wisdom.'; } }
    ] };
  } });
  def('r_crassus', { notRuler: true, min: 25, w: 2, cond: function () { return S().money > den(5000) && st().cls !== 'slave'; }, build: function () {
    var price = den(U.rand(800, 2000));
    return { icon: '🔥', title: 'A burning house', text: 'A neighbor\'s house is on fire. He is begging anyone to buy it before it burns down, for ' + E.fmt(price) + '. My own slaves could put the fire out.', choices: [
      { label: 'Buy it cheap and put out the fire', run: function () { E.addMoney(-price); E.karma(-4); var house = { id: U.uid(), kind: 'house', anc: true, icon: '🏠', type: 'Rental insula', name: 'Rental insula', where: place(), value: price * 4, price: price, cond: 70, upkeep: 0.01 }; S().assets.push(house); return 'I bought it for a fraction of its worth and saved it. Crassus got rich this way.'; } },
      { label: 'Just help him put it out', run: function () { E.karma(5); return 'We formed a bucket line and saved most of it. He thanked me with tears in his eyes.'; } }
    ] };
  } });
  def('r_graffiti', { min: 14, w: 3, build: function () {
    var c = D.country(S().country), who = U.pick(c.male);
    return { icon: '✍️', title: 'Graffiti', text: 'Someone wrote on the wall of the baths: "' + me().first + ' is ' + U.pick(['a cheapskate', 'a terrible poet', 'in love with ' + who, 'the worst singer in the city']) + '."', choices: [
      { label: 'Write a reply under it', run: function () { E.stat('happy', 3); E.fame(1); return 'I wrote back something cleverer. The whole street came to read it.'; } },
      { label: 'Ignore it', run: function () { return 'It was painted over within a month. Mostly.'; } }
    ] };
  } });
  def('r_aqueduct', { notRuler: true, min: 6, w: 2, build: function () {
    return { icon: '💧', title: 'The aqueduct is broken', text: 'The aqueduct that feeds our part of the city has cracked. The fountains are dry.', choices: [
      { label: 'Carry water from the river', run: function () { E.stat('health', -U.rand(2, 6)); return 'River water made half the street sick, but we got by until it was fixed.'; } },
      { label: 'Pay for a private water seller', run: function () { E.addMoney(-Math.min(Math.max(0, S().money), den(U.rand(5, 20)))); return 'Expensive, but clean.'; } }
    ] };
  } });
  sdef('r_vesuvius', { build: function () {
    return { icon: '🌋', title: 'The mountain', text: 'Vesuvius is roaring. A great cloud shaped like a pine tree rises into the sky, and ash is falling.', choices: [
      { label: 'Flee to the sea right now', run: function () { E.addMoney(-Math.round(Math.max(0, S().money) * 0.6)); S().assets = S().assets.filter(function (a) { return !a.anc || a.kind !== 'house'; }); S().city = 'Neapolis'; S().home = { type: 'rent', anc: 'insula', tier: 0 }; E.achieve('vesuvius'); see('Escaped Vesuvius', '🌋'); return good('I ran with only what I could carry. Behind me, the whole city vanished under the ash.'); } },
      { label: 'Shelter and wait for it to pass', run: function () { if (U.chance(0.85)) { E.die('the eruption of Vesuvius'); return bad('The ash buried everything.'); } E.achieve('vesuvius'); see('Survived Vesuvius', '🌋'); return good('Somehow, I survived the night.'); } }
    ] };
  } });
  sdef('r_manumission', { build: function () {
    return { icon: '🕊️', title: 'Freedom', text: st().master + ' called me in. "You have served me well."', choices: [{ label: 'Kneel before the magistrate', run: function () { freeMe('my master'); return good('The magistrate touched me with his rod. I am free.'); } }] };
  } });
  sdef('r_condemned', { build: function () {
    return { icon: '⚖️', title: 'Condemned', text: 'The magistrate sentenced me to fight in the arena.', choices: [{ label: 'Face the arena', run: function () { E.quitJob(true); hire('r_gladiator'); S().job.style = 'Murmillo'; S().job.company = 'the Ludus Magnus'; var b = bout(S().job); return b.dead ? bad(b.text) : b.win ? good('I survived my first fight. ' + b.text) : b.text; } }] };
  } });
  sdef('r_expelled', { build: function () {
    return { icon: '📜', title: 'Philosophers banished', text: 'Emperor Domitian has expelled all philosophers from Rome. They call us troublemakers.', choices: [
      { label: 'Move to Athens', run: function () { S().city = 'Athens'; ph().pupils = Math.max(0, ph().pupils - 2); return 'I sailed for Athens, where philosophy is still welcome. Some pupils followed me.'; } },
      { label: 'Keep teaching in secret', run: function () { if (U.chance(0.35)) { E.stat('health', -15); E.addMoney(-Math.round(Math.max(0, S().money) * 0.3)); return bad('I was caught teaching, beaten and fined.'); } E.fame(3); return good('I taught in back rooms and gardens. Forbidden ideas spread faster.'); } }
    ] };
  } });
  sdef('r_tutor', { build: function () {
    var em = emperor(y());
    return { icon: '👑', title: 'A summons to the palace', text: 'Emperor ' + em + ' wants me to tutor the imperial heir in philosophy.', choices: [
      { label: 'Accept', run: function () { var j = S().job; if (!j) return 'The offer was withdrawn.'; j.tutor = true; ph().tutor = true; E.fame(12); E.achieve('imperial_tutor'); see('Tutored the imperial heir', '👑'); return good('I moved into the palace on the Palatine Hill. The future of the empire is in my hands.'); } },
      { label: 'Decline politely', run: function () { E.karma(2); return 'A philosopher should keep his distance from power. Seneca learned that the hard way.'; } }
    ] };
  } });
  sdef('r_nero', { build: function () {
    return { icon: '🗡️', title: 'Nero\'s suspicion', text: 'Nero accuses me of plotting against him. Soldiers are at my door with an order to take my own life, as Seneca did.', choices: [
      { label: 'Face death calmly, like a philosopher', run: function () { E.die('the order of Emperor Nero'); return 'I spoke to my friends of the soul until the end.'; } },
      { label: 'Flee Rome in the night', run: function () { if (U.chance(0.5)) { var j = S().job; if (j) j.tutor = false; S().city = 'Athens'; return good('I escaped to Athens with nothing but my scrolls.'); } E.die('the soldiers of Emperor Nero'); return bad('They caught me at the city gate.'); } }
    ] };
  } });
  sdef('r_incestum', { build: function () {
    var p = E.partner(), j = S().job; if (!p || !j || j.career !== 'r_vestal') return null;
    return { icon: '⚖️', title: 'Accused', text: 'Someone saw me with ' + p.first + '. The pontiffs accuse me of breaking my vow of chastity. The punishment is to be buried alive.', choices: [
      { label: 'Swear by Vesta that I am innocent', run: function () { if (U.chance(0.45)) { p.role = 'ex'; E.rel(p, -30); return good('The pontiffs believed me. I never saw ' + p.first + ' again.'); } E.die('being buried alive for breaking my vows'); return bad('They led me to the Colline Gate and sealed me in an underground chamber with a lamp and a little bread.'); } },
      { label: 'End it and beg forgiveness', run: function () { p.role = 'ex'; E.rel(p, -40); E.stat('health', -15); E.stat('happy', -15); return 'I was scourged, but spared. ' + p.first + ' was flogged to death in the Forum.'; } }
    ] };
  } });
  sdef('r_governor', { build: function () {
    var j = S().job; if (!j || !j.governor) return null;
    return { icon: '🗺️', title: 'Governor of ' + j.governor, text: 'Governors grow rich. Some honestly, some by squeezing the provincials.', choices: [
      { label: 'Govern honestly', run: function () { E.karma(8); E.fame(3); return good('The provincials praised my fair rule.'); } },
      { label: 'Line my pockets', run: function () { var g = den(U.rand(10000, 60000)); E.addMoney(g); E.karma(-12); if (U.chance(0.25)) { var f = Math.round(g * 1.5); E.addMoney(-f); return bad('I was prosecuted for extortion when I returned and fined ' + E.fmt(f) + '.'); } return 'I came home ' + E.fmt(g) + ' richer.'; } }
    ] };
  } });

  // ------------------------------------------------------------ about & recap
  function aboutRows() {
    var a = st();
    return [['🏛️ Class', CLASS_NAME[a.cls]], ['👑 Emperor', emperor(S().year)]];
  }
  function recapRow() {
    var a = st(), j = S().job, h = S().jobHistory || [], out = [];
    if (a.offices.length) out.push(['🏛️', 'Public life', 'Held ' + a.offices.join(', ')]);
    if (a.wins || a.losses) out.push(['⚔️', 'Gladiator', a.wins + ' wins, ' + a.losses + ' losses']);
    if (a.races) out.push(['🐎', 'Charioteer', a.raceWins + ' wins in ' + a.races + ' races']);
    if (a.philo && (a.philo.works.length || (S().jobHistory || []).some(function (h) { return h.career === 'r_philo'; }) || (S().job && S().job.career === 'r_philo'))) {
      var best = a.philo.works.slice().sort(function (x, z) { return z.q - x.q; })[0];
      out.push(['🦉', SCHOOLS[a.philo.school][0] + ' philosopher', U.plural(a.philo.works.length, 'treatise') + (best ? ', best known for "' + best.title + '"' : '') + (a.philo.tutor ? ' · tutored the imperial heir' : '')]);
    }
    if (a.decorations || a.veteran) out.push(['🦅', 'Legions', (a.veteran ? 'Served 25 years' : 'Served') + (a.decorations ? ', ' + U.plural(a.decorations, 'decoration') : '')]);
    var lg = TL.coup.legacy('Rome');
    if (lg) out.push(['👑', (me().gender === 'F' ? 'Empress ' : 'Emperor ') + lg.name, lg.text]);
    if (a.cls === 'freed') out.push(['🕊️', 'Freedom', a.freedHow === 'revolt' ? 'Won freedom by leading a revolt' : 'Born into slavery, died free']);
    if ((S().jobHistory || []).concat(S().job ? [S().job] : []).some(function (h) { return h.career === 'r_vestal'; })) out.push(['🔥', 'Vestal Virgin', S().ach.indexOf('vestal') >= 0 ? 'Kept the sacred fire for thirty years' : 'Served the goddess Vesta']);
    return out;
  }
  // Conversation topics for Roman lives (actions.conversation).
  var TOPICS = [['the chariot races', ['Athletic', 'Outgoing']], ['the gladiator games', ['Athletic']], ['philosophy', ['Nerdy']], ['poetry and music', ['Artsy']],
    ['money and trade', ['Greedy', 'Ambitious']], ['their dreams and goals', ['Ambitious', 'Romantic']], ['love and marriage', ['Romantic', 'Jealous']],
    ['jokes and gossip', ['Funny', 'Cheerful']], ['charity for the poor', ['Kind', 'Generous']], ['old memories', ['Loyal', 'Kind']],
    ['other people\'s scandals', ['Jealous', 'Mean']], ['how they\'re really feeling', ['Moody', 'Shy']], ['politics in the Senate', [], true], ['the gods', [], true], ['the weather', []]];
  var KID_TOPICS = [['monsters and myths', []], ['games of knucklebones', ['Lazy']], ['animals', ['Kind']], ['their lessons', ['Nerdy']], ['heroes like Hercules', ['Athletic']], ['their drawings', ['Artsy']]];
  // Achievements that fit a Roman life.
  var ACH = ['centenarian', 'millionaire', 'married', 'divorced', 'parent', 'bigfamily', 'homeowner', 'mogul', 'famous', 'ceo', 'petlover', 'saint', 'villain', 'gymrat', 'genius', 'heartbreaker', 'dynasty', 'survivor', 'retired', 'timetraveler', 'history_buff', 'consul', 'centurion', 'rudis', 'charioteer_champ', 'freedom', 'vesuvius', 'sage', 'magnum_opus', 'imperial_tutor', 'vestal', 'usurper', 'rebel', 'long_reign', 'conqueror', 'royal'];
  // What a Roman would call each condition (the game still tracks the modern one).
  var ILL = { 'Common Cold': 'A Head Cold', 'Flu': 'A Fever', 'Ear Infection': 'An Earache', 'Chickenpox': 'The Pox', 'Strep Throat': 'A Sore Throat', 'Asthma': 'Breathlessness',
    'Acne': 'Spots', 'Migraine': 'Headaches', 'PTSD': 'War Terrors', 'Depression': 'Melancholia', 'Anxiety': 'Nervous Dread', 'Insomnia': 'Sleeplessness',
    'Food Poisoning': 'A Stomach Sickness', 'Kidney Stones': 'Bladder Stones', 'Pneumonia': 'A Lung Fever', 'High Blood Pressure': 'An Excess of Blood',
    'Type 2 Diabetes': 'The Wasting Thirst', 'Arthritis': 'Aching Joints', 'Heart Disease': 'A Weak Heart', 'Cancer': 'A Cancer', 'Dementia': 'Senility',
    'Osteoporosis': 'Brittle Bones', 'Chlamydia': 'A Shameful Disease', 'Herpes': 'Sores', 'Broken Arm': 'A Broken Arm', 'Broken Leg': 'A Broken Leg',
    'Concussion': 'A Blow to the Head', 'Alcoholism': 'Drunkenness', 'Gambling Addiction': 'A Gambling Habit', 'Nicotine Addiction': 'A Bad Habit' };
  function illName(n) { return ILL[n] || n; }
  // Plots, revolts and reigns (js/eras.js, TL.coup).
  function coupCfg(kind) {
    var j = S().job, fem = me().gender === 'F', a = st();
    var exile = function () { S().city = U.pick(['Corsica', 'Sardinia', 'Pandateria']); };
    if (kind === 'revolt') return { kind: 'revolt', title: 'Slave revolt', men: 'follower', begin: 'I began whispering about freedom with the other slaves.',
      intro: 'Spartacus and seventy gladiators once broke out of a school at Capua and beat Roman armies for two years. It ended with six thousand crosses along the Appian Way.',
      recruit: ['⛓️', 'Gather slaves and gladiators', 'Every one of them has nothing to lose', '{n} more slaves swore to rise with us.'], bribe: null,
      army: j && j.career === 'r_gladiator' ? ['⚔️', 'Arm the gladiators', 'Trained fighters change everything', 'The fighters of my school are with us. We have a key to the armory.'] : null,
      strike: ['🔥', 'Rise up'],
      win: function () { freeMe('revolt'); E.fame(20); see('Led a slave revolt', '🔥'); return 'We broke out at night and fought our way into the hills. The legion sent after us was routed. I am free, and the whole empire knows my name. 🔥'; },
      lose: { cause: 'crucifixion along the Appian Way', text: 'The legions crushed the revolt.', death: 'I was crucified along the Appian Way.', spared: 'My master claimed me back and had me flogged nearly to death.' },
      caught: { cause: 'crucifixion for plotting a revolt', text: 'Someone betrayed the plan to my master.', death: 'I was crucified as a warning to the others.', spared: 'I was flogged and branded on the forehead.' } };
    var old = emperor(y());
    return { kind: 'throne', title: 'Conspiracy', men: 'conspirator', begin: 'I began plotting against Emperor ' + old + '.', exile: exile,
      intro: 'Emperors are made by the Senate, the Praetorian Guard and the legions, and unmade by them too. ' + (a.rule ? '' : old + ' rules today.'),
      recruit: ['🤝', 'Recruit senators', 'More strength, and a harder secret to keep', '{n} more senators swore themselves to the plot over dinner.'],
      bribe: ['💰', 'Bribe the Praetorian Guard', 'They have made and unmade emperors before', den(5000), 'The Praetorian prefect weighed the purse in his hand and smiled.'],
      army: j && ((j.career === 'r_legion' && j.level >= 3) || (j.career === 'r_cursus' && j.governor)) ? ['🦅', 'Win over the legions', 'My soldiers would follow me anywhere', 'My legions swore to follow me, all the way to Rome.'] : null,
      strike: ['🗡️', 'Strike at the emperor'],
      win: function () { TL.coup.crown(coupCfg('throne')); a.ruled = a.rule; a.emp = emperor(y()); see('Seized the throne', '👑'); E.log('👑 ' + old + ' is dead. The Senate proclaimed me ' + (fem ? 'Empress' : 'Emperor') + '.', 'good'); return 'We struck on the Ides. ' + old + ' is dead, and the Senate has proclaimed me ' + (fem ? 'Empress' : 'Emperor') + ' of Rome! 👑'; },
      lose: { cause: 'execution for treason', text: 'The guard stayed loyal and the plot collapsed.', death: 'I was executed for treason.', spared: 'The emperor spared my life, took most of my fortune and banished me to an island.' },
      caught: { cause: 'an order to open my veins', text: 'The emperor\'s spies uncovered our plot.', death: 'Soldiers brought an order to open my veins.', spared: 'I was stripped of my fortune and exiled to an island.' },
      rule: { career: 'r_emperor', cls: 'patrician', seat: 'the Palatine Hill', popName: 'The people', guardName: 'The Praetorians', realm: 'the empire', spy: den(4000), taxcut: den(12000),
        neighbors: ['Parthia', 'the Germanic tribes', 'the Dacians', 'the kingdom of Armenia', 'the Garamantes'],
        brides: ['a princess of Armenia', 'the daughter of a great senatorial house', 'a princess of Commagene'], grooms: ['a prince of Armenia', 'the son of a great senatorial house', 'a famous general'],
        disaster: ['🔥', 'Rome is burning', 'A fire started near the Circus Maximus and spread across half the city.'],
        laws: [
          { id: 'citizens', label: 'Make every free man a citizen', text: 'Every free man in the empire is now a Roman citizen. The provinces rejoiced; the old families sulked.', fx: { pop: 10, fame: 5 } },
          { id: 'dole', label: 'Double the grain dole', text: 'The poor of Rome eat for free, twice over.', fx: { pop: 12, money: -den(10000) } },
          { id: 'arena', label: 'Ban fights to the death in the arena', text: 'Gladiators fight with blunt swords now. The crowd booed for a month.', fx: { karma: 8, pop: -8 } },
          { id: 'christ', label: 'Tolerate the Christians', text: 'No more persecutions. Christians may worship their god in peace.', fx: { karma: 6, pop: 2 } },
          { id: 'coin', label: 'Debase the silver coinage', text: 'Less silver in every denarius. The treasury is full; prices are rising.', fx: { money: den(30000), pop: -10 } },
          { id: 'slaves', label: 'Protect slaves from cruel masters', text: 'Masters may no longer kill their slaves at will.', fx: { karma: 8, guard: -4 } }] ,
        acts: [
        { id: 'games', icon: '🏟️', label: 'Give games for the people', sub: 'Bread and circuses', cost: den(20000), fx: { pop: 16, happy: 4, fame: 2 }, text: 'A hundred days of games! The crowd chanted my name.' },
        { id: 'donative', icon: '💰', label: 'Pay the Praetorians a donative', sub: 'Loyalty is bought', cost: den(15000), fx: { guard: 22 }, text: 'Every guardsman got a purse of gold. They cheered louder than the crowd at the games.' },
        { id: 'build', icon: '🏛️', label: 'Build a great monument', sub: 'Be remembered forever', cost: den(60000), fx: { fame: 10, pop: 6 }, see: ['Built a monument in Rome', '🏛️'], text: U.pick(['A triumphal arch now stands in the Forum with my name on it.', 'My new baths are the largest Rome has ever seen.', 'A column carved with my victories rises over the city.']) },
        { id: 'purge', icon: '🗡️', label: 'Purge my enemies in the Senate', sub: 'Fear works, for a while', danger: true, fx: { guard: 12, pop: -10, karma: -15 }, text: 'Senators I suspected were found dead in their baths. The rest are very polite to me now.' },
        { id: 'war', icon: '🦅', label: 'Lead a campaign', sub: 'Glory and plunder, or disaster', cost: den(30000), war: true, win: 'My legions crushed the barbarians. Rome gave me a triumph through the streets!', lose: 'The campaign was a disaster. Whole legions were lost in the forests.', death: 'a barbarian spear on campaign' }],
        threat: { icon: '🗡️', title: 'Assassins!', text: 'Men with daggers are waiting in a dark corridor of the palace.', fight: 'Call the guard and fight', won: 'My guards cut them down. Their patrons were executed by morning.', cause: 'assassination in the palace', died: 'There were too many of them.', flee: 'Flee the palace', fled: 'I escaped Rome in disguise. Someone else wears the purple now.', caught: 'They caught me at the city gate.' } } };
  }
  // Born to the emperor (js/eras.js, TL.dynasty): the words of a Roman heir's life.
  function royalCfg() {
    return { ruler: ['Emperor', 'Empress'], consort: ['Imperial Consort', 'Empress'], heir: ['Caesar', 'Caesar'], deposed: ['Deposed Emperor', 'Deposed Empress'], retired: ['Retired Emperor', 'Retired Empress'],
      usurper: function (first) { return first + ' ' + D.gentile(U.pick(D.country('Roman Empire').last), 'M'); },
      allowance: den(6000), treasury: 'the imperial treasury', edu: 'letters',
      cls: 'patrician', city: 'Rome', realm: 'the empire', section: 'Heir to the empire', greatName: 'The Senate', peopleName: 'The people', regent: 'the Praetorian prefect',
      born: '👑 I was born in the imperial palace on the Palatine. My {kin} is {ruler}, and one day the empire will be mine.',
      succeed: '👑 {ruler}, my {kin}, is dead. The Senate proclaimed me {title} the same day.',
      adoptedTake: '👑 Emperor {old} is dead. As his adopted son, I was proclaimed {title} by the Senate and the Praetorians.',
      deaths: ['a fever', 'a sudden illness after dinner (poison, people whispered)', 'a fall from a horse', 'a fever on campaign', 'a stroke at the games'],
      killed: 'a dagger in the palace', depose: null,
      learn: ['📜', 'Sit in on the imperial council', 'Learn how an empire is run', ['The emperor\'s advisers argued about grain ships and frontier forts while I listened.', 'I learned to read a governor\'s report, and to tell when it lies.', 'I watched a case judged in the Senate house and wrote down every argument.', 'The old freedman who keeps the imperial accounts showed me where the money really goes.']],
      show: ['🏟️', 'Pay for games in my own name', 'Let the crowd learn to love me', den(2500), ['The crowd chanted my name between the races.', 'Thirty pairs of gladiators fought in my name. The people loved it.', 'I paid for a day of beast hunts in the arena. Rome cheered for me.']],
      great: ['🍷', 'Dine with the senators', 'The men who will have to accept me', den(1500), ['Senators who never looked at me before now laugh at my jokes.', 'Over dinner an old consul promised me his support "when the time comes".', 'I gave a famous senator a fine Greek statue. He will remember it.']],
      command: ['🦅', 'Command a legion on the frontier', 'Soldiers follow emperors who fought beside them', ['My legion threw the Germans back across the Rhine. The soldiers hailed me on the field.', 'I held the Danube frontier through a hard winter. The legions trust me now.', 'We stormed a Dacian hill fort. The soldiers carried me on their shields.'],
        ['A German ambush cost us an eagle. The soldiers grumble about the pampered heir.', 'The campaign went nowhere. Rome laughed at the heir who came home with nothing.'], 'a Germanic spear on the frontier'],
      step: ['🏛️', 'Ask to be made co-emperor', 'An old emperor may share the burden', 'My {kin} made me co-emperor and left the empire to me, then retired to the gardens at Tibur.',
        ['My {kin} laughed. "When I am dead, not before."', 'My {kin} went pale and asked who had put the idea in my head.', '"Patience," my {kin} said. "Rome was not built in a day, and neither is an emperor."']],
      news: ['🏛️ {ruler} dedicated a new temple in the Forum.', '🦅 The legions of {ruler} won a victory on the Danube.', '🏟️ {ruler} gave a hundred days of games.', '🌾 {ruler} doubled the grain dole after a bad harvest.', '🗡️ A plot against {ruler} was uncovered. The senators involved were executed.', '🛁 {ruler} built new baths for the people of Rome.'] };
  }
  // Continuing as my heir: the family keeps its standing (engine.continueAs).
  // Who keeps a roof without parents: the enslaved live in their master's house, patricians in the family domus.
  function housed() { var c = st().cls; return c === 'slave' || c === 'patrician'; }
  function heir(old, prev) {
    var a = st(), o = old || {};
    a.cls = o.cls === 'freed' ? 'plebeian' : o.cls || 'plebeian'; // a freedperson's children are born free
    if (a.cls === 'slave') a.master = o.master;
    a.emp = emperor(y());
    var was = me().first + ' ' + me().last;
    me().last = D.gentile(me().last, me().gender);
    S().log[0].entries.forEach(function (e) { e.t = e.t.replace(was, me().first + ' ' + me().last); });
    if (o.patron) a.patron = o.patron;
    if (o.rule && TL.coup.inherits(o.rule)) { TL.coup.crown(coupCfg('throne')); a.ruled = a.rule; a.emp = emperor(y()); E.log('👑 I inherited the throne. I am ' + (me().gender === 'F' ? 'Empress' : 'Emperor') + ' of Rome.', 'good'); return; }
    if (TL.dynasty.inherit(o, prev)) { a.emp = emperor(y()); return; }
    if ((a.cls === 'patrician' || a.cls === 'equestrian') && me().age >= 14) a.edu = 'letters'; // tutored at home
    if (a.cls === 'slave') E.log('⛓️ Like my parent, I belong to the household of ' + a.master + '.', 'bad');
    else E.log('🏛️ I am ' + E.an(CLASS_NAME[a.cls].toLowerCase()) + ', like my family before me.');
  }
  function birthOptions() { return [['rome', '🏛️ Ancient Rome · AD 40–160']]; }
  // Era-specific wording for shared menus (actions.js, engine.js).
  var TXT = {
    matchSub: 'Most Roman marriages are arranged', matchEvent: 'r_marriage',
    pranks: ['put salt in their wine', 'hid a frog in their sandal', 'painted a rude drawing on their door', 'swapped their honey for garum'],
    argue: ['money', 'chores', 'their attitude', 'politics', 'the chariot races', 'which gods to honor', 'something they said years ago'],
    bored: 'They kept yawning the whole time.', partySick: 'We drank so much unwatered wine that I was sick for days.',
    dates: ['a feast at a taberna', 'the theater', 'the gardens of Maecenas', 'a picnic by the Tiber', 'the chariot races', 'the baths', 'the seashore at sunset'],
    gifts: [['🍯', 'A pot of honey', 100], ['🌸', 'A garland of flowers', 200], ['📜', 'A scroll of poetry', 800], ['🏺', 'A jar of fine wine', 1500], ['💍', 'A gold ring', 20000], ['🐎', 'A horse', 150000]],
    pray: ['🙏 Pray to Juno Lucina', 'I\'ve already prayed to Juno this year.', 'Juno heard our prayers!', 'We left offerings at the temple of Juno Lucina.'],
    adoptIcon: '🏛️', adoptFee: ' in legal fees and gifts to the birth family.', lawyer: 'Advocate fee ',
    parentsGone: 'With my parents gone, I rented an apartment in an insula.', moveOut: 'an insula apartment', rentHome: { type: 'rent', tier: 1, anc: 'apt', mult: 2.5 },
    youngDeaths: ['a fever', 'a fall from a roof', 'drowning', 'a festering wound'],
    npcDeaths: { old: ['old age', 'a fever', 'a stroke', 'a wasting sickness'], young: ['a fever', 'an accident', 'the pox', 'a stomach sickness'], adult: ['a fever', 'an accident at work', 'a festering wound', 'a lung fever'] },
    child: 'Child'
  };
  function txt(k) { return TXT[k]; }

  return { on: on, st: st, setup: setup, yearly: yearly, jobYear: jobYear, salary: salary, title: title, career: career, npcJob: npcJob, homeLabel: homeLabel,
    occupationMenu: occupationMenu, assetsMenu: assetsMenu, activitiesMenu: activitiesMenu, acts: acts, WEDDINGS: WEDDINGS, aboutRows: aboutRows, recapRow: recapRow,
    emperor: emperor, birthOptions: birthOptions, txt: txt, heir: heir, housed: housed, coupCfg: coupCfg, royalCfg: royalCfg, id: 'rome', land: 'Roman Empire', years: [40, 160], gentile: true, ad: true, illName: illName, CLASS_NAME: CLASS_NAME, TOPICS: TOPICS, KID_TOPICS: KID_TOPICS, ACH: ACH };
})();
