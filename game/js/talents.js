/* TheLife — v1.77: born talents. Some people come into the world with a gift:
 * a musical ear, a natural athlete's body, a gifted mind. Talents work from
 * birth (they raise the ceiling of a career or make a skill come easier) but
 * I only find out about them as a kid, when a teacher or coach notices.
 * Heirs can inherit a parent's gift.
 * State: S().me.talents = [{ id, known }]. */
TL.talents = (function () {
  var U = TL.util, E = TL.engine;
  function S() { return TL.S; }
  function me() { return S().me; }

  // id, icon, name, short description, age range when it shows, discovery lines
  var LIST = [
    { id: 'music', icon: '🎵', name: 'Musical ear', sub: 'Music comes naturally: a higher ceiling as a musician, and singing practice pays off faster.', at: [4, 9],
      found: ['My music teacher says I have perfect pitch.', 'I picked out a song on the piano by ear after hearing it once.', 'The choir director moved me to the front row. "That voice," she said.'] },
    { id: 'acting', icon: '🎭', name: 'Natural actor', sub: 'A higher ceiling as an actor; comedy practice pays off faster.', at: [6, 11],
      found: ['I stole the show in the school play, and I only had two lines.', 'My drama teacher told my parents I\'m a natural.', 'I can make anyone believe anything. My impressions are scary good.'] },
    { id: 'athlete', icon: '🏅', name: 'Born athlete', sub: 'More athletic from birth, with a higher ceiling in every sport.', at: [6, 11],
      found: ['The gym teacher timed my sprint twice because he thought the stopwatch was broken.', 'A coach pulled my parents aside after practice: "This kid is special."', 'I was faster than every kid in my grade, including the older ones.'] },
    { id: 'genius', icon: '🧠', name: 'Gifted mind', sub: 'Smarter from birth; coding, chess and writing come easier.', at: [5, 10],
      found: ['I tested into the gifted program. The school psychologist double-checked the score.', 'I taught myself to read before kindergarten.', 'My math teacher started giving me high school worksheets.'] },
    { id: 'beauty', icon: '✨', name: 'Striking looks', sub: 'Good looks from birth, the kind people stop and stare at.', at: [11, 15],
      found: ['A modeling scout stopped my parents at the mall.', 'People keep telling me I should be on TV.', 'I grew into my looks this year. Everyone noticed.'] },
    { id: 'artist', icon: '🎨', name: 'Artistic eye', sub: 'Painting and writing practice pay off faster.', at: [5, 10],
      found: ['My drawing won the district art contest.', 'My teacher framed one of my paintings for the classroom.', 'I filled three sketchbooks this year. They\'re actually good.'] },
    { id: 'charm', icon: '💬', name: 'Silver tongue', sub: 'Charming and quick: comedy practice pays off faster and my posts land better.', at: [8, 13],
      found: ['I talked my way out of detention. Twice.', 'Everyone wants to sit with me at lunch. I just know what to say.', 'I won the school debate without preparing.'] },
    // Career gifts: each one makes certain special careers (js/specials.js) much easier to master.
    { id: 'palate', icon: '👅', name: 'Golden palate', sub: 'Flavors make sense to me: chefs and food critics would kill for this tongue.', at: [6, 12], career: true,
      found: ['I named every spice in my grandmother\'s stew. She was stunned.', 'I fixed the soup at a family dinner with one pinch of something. Everyone asked for seconds.', 'I can tell which bakery a croissant came from with my eyes closed.'] },
    { id: 'nerve', icon: '🧊', name: 'Nerves of steel', sub: 'Calm under pressure: poker, stunts, climbing, surfing, rodeo, racing and fighting come easier.', at: [8, 13], career: true,
      found: ['I climbed to the top of the tallest tree in the park and waved. Mom nearly fainted.', 'Everyone else panicked during the fire drill. I calmly led my class out.', 'I bluffed my uncle out of his whole stack at family poker night. I was nine.'] },
    { id: 'reflex', icon: '⚡', name: 'Lightning reflexes', sub: 'Faster than everyone: esports, racing, fighting, skateboarding, sprinting and riding come easier.', at: [6, 11], career: true,
      found: ['I caught a falling glass before it hit the floor. Nobody even saw me move.', 'I beat my older cousin at every video game he owns. He stopped inviting me over.', 'The coach says he\'s never seen a kid react to the starting whistle that fast.'] },
    { id: 'stage', icon: '🎤', name: 'Stage presence', sub: 'Every room is mine: comedy, magic, DJing, hosting, opera, modeling and ballet come easier.', at: [7, 13], career: true,
      found: ['I walked onstage at the school assembly and the whole gym went quiet.', 'My magic trick at the talent show got a standing ovation. It wasn\'t even a good trick.', 'Strangers stop and watch when I tell a story. I don\'t know why.'] },
    { id: 'grace', icon: '🩰', name: 'Natural grace', sub: 'I move like water: ballet, figure skating, gymnastics, swimming and surfing come easier.', at: [5, 10], career: true,
      found: ['My dance teacher asked my parents how long I\'ve been training. It was my first class.', 'I did a perfect cartwheel on my first try, then a back walkover.', 'At the pool, the swim coach asked who taught me that stroke. Nobody did.'] },
    { id: 'iron', icon: '💪', name: 'Iron constitution', sub: 'Healthier from birth, and I get sick far less often.', at: [8, 14],
      found: ['I\'ve never missed a day of school for being sick.', 'The doctor said I\'m one of the healthiest kids she\'s seen.', 'The whole class got the flu. I didn\'t.'] }
  ];
  function get(id) { return LIST.filter(function (t) { return t.id === id; })[0]; }
  function mine() { var m = TL.S && TL.S.me; return (m && m.talents) || []; }
  function has(id) { return mine().some(function (t) { return t.id === id; }); }

  // Stat boosts that come with a gift, applied once when it's given.
  function apply(id, m) {
    if (id === 'athlete') m.athl = U.clamp((m.athl || 30) + U.rand(18, 30), 0, 100);
    if (id === 'genius') m.smarts = U.clamp(Math.max(m.smarts, 60) + U.rand(10, 25), 0, 100);
    if (id === 'beauty') m.looks = U.clamp(Math.max(m.looks, 60) + U.rand(10, 25), 0, 100);
    if (id === 'iron') m.health = U.clamp(m.health + U.rand(8, 15), 0, 100);
  }
  function give(id, known) {
    var m = me(); m.talents = m.talents || [];
    if (has(id) || !get(id)) return;
    m.talents.push({ id: id, known: !!known });
    apply(id, m);
  }
  // At birth: about 55% of people have a gift, 15% have two, 2% are prodigies with three.
  function roll(inherit, pick) {
    var m = me(); if (!m) return;
    m.talents = m.talents || [];
    // Chosen on the New Life screen: exactly that gift (or none at all).
    if (pick === 'none') return;
    if (pick && get(pick)) { give(pick, false); return; }
    (inherit || []).forEach(function (t) { if (U.chance(0.4)) give(t.id, false); });
    var n = U.weighted([{ w: 45, n: 0 }, { w: 38, n: 1 }, { w: 15, n: 2 }, { w: 2, n: 3 }]).n - m.talents.length;
    var pool = U.shuffle(LIST.map(function (t) { return t.id; }));
    for (var i = 0; i < pool.length && n > 0; i++) if (!has(pool[i])) { give(pool[i], false); n--; }
  }
  // Each year: a gift I haven't noticed yet may show itself.
  function yearly() {
    var s = S(); if (!s || s.dead) return;
    var a = me().age;
    mine().forEach(function (t) {
      var d = get(t.id); if (!d || t.known) return;
      if (a >= d.at[0] && (a >= d.at[1] || U.chance(0.35))) {
        t.known = true;
        E.log(d.icon + ' ' + U.pick(d.found) + ' I have a gift: ' + d.name.toLowerCase() + '.', 'good');
      }
    });
    // Musical kids end up on the talent-show stage (js/music.js).
    var musical = s.music || mine().some(function (t) { return t.id === 'music' && t.known; });
    if (musical && a >= 9 && a <= 17 && !s.prison && !E.ancient() && U.chance(0.3)) s.pending.push({ id: 'mu_talentshow', data: {} });
  }
  // Older lives (a legacy heir, an adult start) already know what they're good at.
  function revealAll() { mine().forEach(function (t) { t.known = true; }); }

  // ---- effects other modules ask about
  // How much faster a practiced skill grows (js/features.js).
  var SKILL = { singing: ['music', 1.6], comedy: [['acting', 1.5], ['charm', 1.4]], coding: ['genius', 1.5], chess: ['genius', 1.5], writing: [['genius', 1.4], ['artist', 1.5]], painting: ['artist', 1.7] };
  function skillMult(id) {
    var r = SKILL[id]; if (!r) return 1;
    var list = typeof r[0] === 'string' ? [r] : r, f = 1;
    list.forEach(function (p) { if (has(p[0])) f = Math.max(f, p[1]); });
    return f;
  }
  // Extra career ceiling (talent/potential points) for a field.
  function ceiling(field) { return { music: has('music') ? 22 : 0, acting: has('acting') ? 22 : 0, sports: has('athlete') ? 10 : 0, hoops: has('athlete') ? 6 : 0 }[field] || 0; }
  function sickMult() { return has('iron') ? 0.55 : 1; }

  function aboutRow() {
    var k = mine().filter(function (t) { return t.known; }).map(function (t) { var d = get(t.id); return d.icon + ' ' + d.name; });
    return k.length ? ['🌟 Talents', k.join(', ')] : null;
  }
  return { LIST: LIST, roll: roll, give: give, has: has, mine: mine, yearly: yearly, revealAll: revealAll, skillMult: skillMult, ceiling: ceiling, sickMult: sickMult, aboutRow: aboutRow, get: get };
})();
