/* TheLife — everything the player can do between birthdays. Menus are built as
 * functions so they re-render after each action. */
TL.actions = (function () {
  var U = TL.util, D = TL.data, E = TL.engine;
  function S() { return TL.S; }
  function me() { return TL.S.me; }
  function ui() { return TL.ui; }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  // A message that changed nothing (limits, can't afford it): shown briefly, never logged.
  function nope(t) { return { text: t, cls: '', quiet: true }; }

  // Log + show an action result, then save and refresh.
  // Self-care shows what it did: "(+4 smarts, +2 health)".
  var gainFrom = null, STATN = { happy: 'happiness', health: 'health', smarts: 'smarts', looks: 'looks', athl: 'athleticism' };
  function snap() { var m = me(); return { happy: m.happy, health: m.health, smarts: m.smarts, looks: m.looks, athl: m.athl, at: Date.now() }; }
  function gains(b) { var m = me(), out = []; Object.keys(STATN).forEach(function (k) { var d = Math.round(m[k] - b[k]); if (d) out.push((d > 0 ? '+' : '') + d + ' ' + STATN[k]); }); return out.length ? ' (' + out.join(', ') + ')' : ''; }
  function done(res, title) {
    if (res == null) { ui().refresh(); return; }
    if (typeof res === 'string') res = { text: res, cls: '' };
    if (gainFrom && Date.now() - gainFrom.at < 30000) res = { text: res.text + gains(gainFrom), cls: res.cls, quiet: res.quiet };
    gainFrom = null;
    if (!res.quiet) E.log(res.text, res.cls);
    E.checkAchievements();
    E.save();
    ui().refresh();
    // Everyday results show as a toast so the player can keep tapping; long
    // or titled messages still get a dialog.
    if (ui().toast && !title && res.text.length < 160) { ui().toast(res.text, res.cls); ui().runPending(); }
    else ui().alert(title || '', res.text, res.cls, function () { ui().runPending(); });
  }
  // Per-year usage counter; returns previous count.
  function use(key) {
    var y = S().yearActs;
    var n = y[key] || 0;
    y[key] = n + 1;
    return n;
  }
  function used(key) { return S().yearActs[key] || 0; }
  function diminish(key) { return 1 / (1 + use(key)); }
  // Everyday self-care tires out more gently: the 2nd session still gives 2/3, the 3rd half.
  function ease(key) { return 1 / (1 + use(key) * 0.5); }
  function afford(cost) { return S().money >= cost; }
  function noMoney(cost) { return { text: 'I can\'t afford that. It costs ' + E.fmt(cost) + ' and I have ' + E.fmt(S().money) + '.', cls: 'bad', quiet: true }; }
  function adult() { return me().age >= 18; }

  // ======================================================================
  // RELATIONSHIPS
  // ======================================================================
  var ROLE_ORDER = ['spouse', 'fiance', 'partner', 'mother', 'father', 'stepmother', 'stepfather', 'grandparent', 'sibling', 'child', 'in-law', 'grandchild', 'friend', 'best friend', 'classmate', 'coworker', 'ex', 'former classmate', 'former coworker'];
  var ROLE_ICON = { spouse: '💍', fiance: '💎', partner: '❤️', mother: '👩', father: '👨', grandparent: '👴', sibling: '🧒', child: '👶', grandchild: '👶', 'in-law': '🧑', friend: '🙂', 'best friend': '🤝', classmate: '🎒', coworker: '💼', ex: '💔', 'former classmate': '🎒', 'former coworker': '💼' };
  function roleLabel(p) {
    return U.cap(E.relWord(p));
  }
  function personIcon(p) {
    if (!p.alive) return '🪦';
    if (p.age < 4) return '👶';
    if (p.age < 13) return p.gender === 'M' ? '👦' : '👧';
    if (p.age >= 65) return p.gender === 'M' ? '👴' : '👵';
    return p.gender === 'M' ? '👨' : '👩';
  }
  function relationshipsMenu() {
    ui().menu('Relationships', function () {
      var items = [];
      var ps = S().people.filter(function (p) { return p.alive || ['mother', 'father', 'spouse', 'child', 'sibling', 'grandparent', 'grandchild'].indexOf(p.role) >= 0; });
      ps.sort(function (a, b) { return ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role); });
      var lastGroup = null;
      items.push({ icon: '🌳', label: 'Family tree', sub: S().gen > 1 ? 'Generation ' + S().gen : 'See your whole family', onClick: TL.extras.treeMenu });
      var row = function (p) { return { icon: personIcon(p), label: E.fullName(p), sub: roleLabel(p) + (p.alive ? ' · ' + p.age + ' · ' + p.job : ' · died ' + (p.died || '')), bar: p.alive ? p.rel : null, onClick: function () { personMenu(p); } }; };
      var others = ps.filter(function (p) { return groupOf(p.role) === 'Others'; });
      ps.forEach(function (p) {
        var g = groupOf(p.role);
        if (g === 'Others' && others.length > 3) return;
        if (g !== lastGroup) { items.push({ section: g }); lastGroup = g; }
        items.push(row(p));
      });
      // Old classmates, coworkers and exes fold into one row once there are a few.
      if (others.length > 3) {
        items.push({ section: 'Others' });
        items.push({ icon: '🗂️', label: 'Old classmates, coworkers & exes', sub: U.plural(others.length, 'person').replace('persons', 'people'), onClick: function () { ui().menu('Others', function () { return others.filter(function (p) { return S().people.indexOf(p) >= 0; }).map(row); }); } });
      }
      if (S().pets.length) {
        items.push({ section: 'Pets' });
        S().pets.forEach(function (pet) {
          items.push({ icon: petIcon(pet.species), label: pet.name, sub: pet.breed + (new RegExp(pet.species + '$', 'i').test(pet.breed) ? '' : ' ' + pet.species) + ' · ' + pet.age + ' yrs', bar: pet.rel, onClick: function () { petMenu(pet); } });
        });
      }
      // Meeting people comes before school, work and old contacts.
      var meet = [{ section: 'Meet people' }];
      if (me().age >= 5) meet.push({ icon: '🤝', label: 'Make a new friend', sub: 'Put yourself out there', onClick: makeFriend });
      if (TL.ancient && TL.ancient.on() && me().age >= 15 && !E.partner() && TL.ancient.st().cls !== 'slave') meet.push({ icon: '💍', label: 'Ask my family to find a match', sub: TL.ancient.txt('matchSub'), onClick: function () { if (S().yearActs.r_match) return done(nope('My family is still searching.')); S().yearActs.r_match = 1; if (!U.chance(0.6)) return done('My family couldn\'t find a suitable match this year.'); S().pending.push({ id: TL.ancient.txt('matchEvent'), data: {} }); ui().runPending(); } });
      if (me().age >= 16 && !S().prison && (!TL.history || TL.history.exists('dating'))) meet.push({ icon: '💘', label: 'Dating app', sub: 'Find someone special', onClick: datingApp });
      if (me().age >= 18 && !S().prison && TL.celebs && TL.celebs.available()) meet.push({ icon: '⭐', label: 'Celebrity dating', sub: TL.celebs.unlocked() ? 'Movie stars, pop stars, athletes, models' : TL.celebs.lockReason(), disabled: !TL.celebs.unlocked(), onClick: TL.celebs.menu });
      var at = -1;
      items.forEach(function (it, k) { if (at < 0 && it.section && ['School & Work', 'Others', 'Pets'].indexOf(it.section) >= 0) at = k; });
      if (meet.length > 1) Array.prototype.splice.apply(items, [at < 0 ? items.length : at, 0].concat(meet));
      return items;
    });
  }
  function groupOf(role) {
    if (['spouse', 'fiance', 'partner'].indexOf(role) >= 0) return 'Love';
    if (['mother', 'father', 'grandparent', 'sibling', 'stepmother', 'stepfather'].indexOf(role) >= 0) return 'Family';
    if (role === 'child' || role === 'grandchild' || role === 'in-law') return 'Children';
    if (['friend', 'best friend'].indexOf(role) >= 0) return 'Friends';
    if (['classmate', 'coworker'].indexOf(role) >= 0) return 'School & Work';
    return 'Others';
  }

  function personMenu(p) {
    ui().menu(p.first + ' ' + p.last, function () { var its = personItems(p); return TL.mind ? TL.mind.wrap(p, its) : its; });
  }
  function personItems(p) {
    return (function () {
      var items = [{ info: true, html: personCard(p) }];
      if (!p.alive) {
        items.push({ icon: '💐', label: 'Visit grave', onClick: function () { E.stat('happy', 3); done('I laid flowers at ' + p.first + '\'s grave and shared some memories.'); } });
        return items;
      }
      if (S().prison) {
        items.push({ icon: '📞', label: 'Call from prison', onClick: function () { var f = diminish('call' + p.id); E.rel(p, 6 * f); done('I called ' + p.first + ' from the prison payphone.'); } });
        return items;
      }
      var r = p.role, kid = p.age < 13;
      items.push({ icon: '⏳', label: 'Spend time', onClick: function () { spendTime(p); } });
      if (me().age >= 3) items.push({ icon: '💬', label: 'Have a conversation', onClick: function () { conversation(p); } });
      if (me().age >= 4) items.push({ icon: '🌟', label: 'Compliment', onClick: function () { compliment(p); } });
      items.push({ icon: '🤗', label: 'Hug', onClick: function () { hug(p); } });
      if (me().age >= 6 && S().money > 0) items.push({ icon: '🎁', label: 'Give a gift', onClick: function () { giftMenu(p); } });
      if (me().age >= 5 && ['mother', 'father', 'grandparent', 'spouse', 'sibling', 'child', 'friend', 'best friend'].indexOf(r) >= 0 && p.age >= 18)
        items.push({ icon: '💸', label: 'Ask for money', onClick: function () { askMoney(p); } });
      if (me().age >= 18 && p.age >= 3 && S().money > 0 && ['mother', 'father', 'sibling', 'child', 'friend', 'grandparent', 'best friend', 'grandchild'].indexOf(r) >= 0)
        items.push({ icon: '💵', label: 'Give money', onClick: function () { giveMoney(p); } });
      if (me().age >= 5) items.push({ icon: '😜', label: 'Prank', onClick: function () { prank(p); } });
      if (me().age >= 4) items.push({ icon: '😠', label: 'Argue', onClick: function () { argue(p); } });
      if (me().age >= 6) items.push({ icon: '🤬', label: 'Insult', onClick: function () { insult(p); } });
      if (me().age >= 18 && p.age >= 18) items.push({ icon: '⚖️', label: 'Sue', sub: (TL.ancient && TL.ancient.on() ? TL.ancient.txt('lawyer') : 'Lawyer fee ') + E.fmt(E.$(5000)), onClick: function () { TL.world.sue(p); } });

      if (['partner', 'fiance', 'spouse'].indexOf(r) >= 0) {
        items.push({ section: 'Romance' });
        items.push({ icon: '🍷', label: 'Date night', onClick: function () { dateNight(p); } });
        if (me().age >= 18 && p.rel < 75 && !(TL.ancient && TL.ancient.on())) items.push({ icon: '🛋️', label: 'Couples counseling', sub: (used('counsel' + p.id) ? 'Done this year' : 'Work through things together') + ' · ' + E.fmt(E.$(1800)), disabled: !!used('counsel' + p.id), onClick: function () { counseling(p); } });
        if (me().age >= 16) items.push({ icon: '👶', label: 'Try for a baby', onClick: function () { tryBaby(p); } });
        if (me().age >= 21) items.push({ icon: TL.ancient && TL.ancient.on() ? '🙏' : '🧬', label: 'Fertility options', sub: TL.ancient && TL.ancient.on() ? 'Prayers, remedies, adoption' : 'IVF, surrogacy, adoption', onClick: function () { fertility(p); } });
        if (r === 'partner' && me().age >= 18) items.push({ icon: '💍', label: 'Propose', onClick: function () { propose(p); } });
        if (r === 'fiance') items.push({ icon: '💒', label: 'Plan the wedding', onClick: function () { wedding(p); } });
        if (r === 'spouse') items.push({ icon: '🧾', label: 'Divorce', danger: true, onClick: function () { ui().confirm('Divorce ' + p.first + '?', 'You may lose half your money and property.', function () { done(divorce(p)); }); } });
        else items.push({ icon: '💔', label: 'Break up', danger: true, onClick: function () { p.role = 'ex'; S().counts.exes++; E.stat('happy', -5); done('I broke up with ' + p.first + '.'); } });
      }
      if (['classmate', 'coworker', 'former classmate', 'former coworker'].indexOf(r) >= 0) {
        items.push({ section: 'Social' });
        items.push({ icon: '🤝', label: 'Befriend', onClick: function () { befriend(p); } });
        if (canDate(p)) items.push({ icon: '💘', label: 'Ask out', onClick: function () { askOut(p); } });
      }
      if (['friend', 'best friend'].indexOf(r) >= 0) {
        items.push({ section: 'Friendship' });
        if (me().age >= 14) items.push({ icon: '🎉', label: 'Go out partying', onClick: function () { party(p); } });
        if (r === 'friend' && p.rel >= 85) items.push({ icon: '🤞', label: 'Make best friend', onClick: function () { p.role = 'best friend'; done(good(p.first + ' is officially my best friend!')); } });
        if (canDate(p)) items.push({ icon: '💘', label: 'Ask out', onClick: function () { askOut(p); } });
        items.push({ icon: '🚪', label: 'End friendship', danger: true, onClick: function () { p.role = 'former friend'; done('I ended my friendship with ' + p.first + '.'); } });
      }
      if (r === 'ex' && canDate(p)) items.push({ icon: '🔥', label: 'Try to rekindle', onClick: function () { askOut(p, true); } });
      if (r === 'child' && p.age < 12) items.push({ icon: '📖', label: 'Read a bedtime story', onClick: function () { var f = diminish('story' + p.id); E.rel(p, 10 * f); p.smarts = U.clamp(p.smarts + 2, 0, 100); done('I read ' + p.first + ' a bedtime story. 📚'); } });
      if (r === 'child' && p.age >= 5 && p.age < 18) items.push({ icon: '✏️', label: 'Help with homework', onClick: function () { var f = diminish('hw' + p.id); E.rel(p, 6 * f); p.smarts = U.clamp(p.smarts + Math.round(4 * f), 0, 100); done('I helped ' + p.first + ' with homework.'); } });
      if ((r === 'mother' || r === 'father') && me().age >= 16 && me().age < 25 && p.money > E.$(40000) && !S().assets.some(function (a) { return a.kind === 'car'; }))
        if (!(TL.ancient && TL.ancient.on())) items.push({ icon: '🚗', label: 'Ask for a car', onClick: function () { askCar(p); } });
      return items;
    })();
  }
  function personCard(p) {
    var bars = [['Relationship', p.rel], ['Happiness', p.happy], ['Health', p.health], ['Smarts', p.smarts], ['Looks', p.looks]];
    var html = '<div class="pcard"><div class="pcard-top"><div class="pcard-emoji">' + personIcon(p) + '</div><div><div class="pcard-name">' + U.esc(E.fullName(p)) + '</div><div class="pcard-sub">' + roleLabel(p) + ' · Age ' + p.age + (p.alive ? '' : ' (deceased)') + '</div><div class="pcard-sub">' + U.esc(p.job || '') + (p.traits && p.traits.length ? ' · ' + p.traits.join(', ') : '') + '</div></div></div>';
    bars.forEach(function (b) { html += '<div class="minibar"><span>' + b[0] + '</span><div class="track"><div class="fill ' + barClass(b[1]) + '" style="width:' + b[1] + '%"></div></div></div>'; });
    return html + (TL.mind ? TL.mind.card(p) : '') + '</div>';
  }
  function barClass(v) { return v >= 66 ? 'hi' : v >= 33 ? 'mid' : 'lo'; }

  // Shared time and conversations play to (or against) the other person's
  // traits, shown on their card.
  function likeScore(p, likes, dislikes) {
    var t = p.traits || [], sc = 0;
    (likes || []).forEach(function (x) { if (t.indexOf(x) >= 0) sc++; });
    (dislikes || []).forEach(function (x) { if (t.indexOf(x) >= 0) sc--; });
    return sc;
  }
  var ACTS = [
    ['🎬', 'See a movie', 15, ['Romantic', 'Artsy', 'Shy'], [], 'saw a movie with', 8],
    ['🍝', 'Go out to dinner', 60, ['Romantic', 'Outgoing', 'Greedy'], ['Shy'], 'went out to dinner with', 16],
    ['🥾', 'Go for a hike', 0, ['Athletic', 'Cheerful'], ['Lazy'], 'went on a hike with', 10],
    ['🎮', 'Play video games', 0, ['Nerdy', 'Funny', 'Lazy'], ['Athletic'], 'played video games with', 8],
    ['🎲', 'Play a board game', 0, ['Nerdy', 'Funny'], ['Moody', 'Stubborn'], 'played a board game with', 6],
    ['🏀', 'Shoot some hoops', 0, ['Athletic', 'Outgoing'], ['Lazy', 'Nerdy'], 'shot hoops with', 8],
    ['🖼️', 'Visit a museum', 20, ['Artsy', 'Nerdy'], ['Athletic', 'Lazy'], 'went to a museum with', 12],
    ['🍳', 'Cook together', 20, ['Kind', 'Generous', 'Cheerful'], [], 'cooked dinner with', 14],
    ['🎉', 'Go to a party', 0, ['Outgoing', 'Funny'], ['Shy', 'Moody'], 'went to a party with', 15],
    ['☕', 'Grab coffee and talk', 8, ['Kind', 'Loyal', 'Shy'], [], 'grabbed coffee with', 14],
    ['🛍️', 'Go shopping', 50, ['Greedy', 'Artsy'], ['Stubborn'], 'went shopping with', 13],
    ['🏖️', 'Spend a day at the beach', 30, ['Cheerful', 'Athletic', 'Romantic'], ['Moody'], 'spent a day at the beach with', 6]
  ];
  var KID_ACTS = [['🧸', 'Play pretend', 0, [], [], 'played pretend with'], ['🛝', 'Go to the playground', 0, ['Athletic'], [], 'went to the playground with'], ['🍦', 'Get ice cream', 5, [], [], 'got ice cream with'], ['📺', 'Watch cartoons', 0, ['Lazy'], [], 'watched cartoons with'], ['🏰', 'Build a pillow fort', 0, ['Artsy'], [], 'built a pillow fort with']];
  var OLD_ACTS = [['🃏', 'Play cards', 0, ['Stubborn', 'Funny'], [], 'played cards with'], ['📷', 'Look at old photos', 0, ['Loyal', 'Kind'], [], 'looked at old photos with'], ['🌳', 'Walk in the park', 0, ['Cheerful'], [], 'walked in the park with'], ['🧩', 'Do a crossword', 0, ['Nerdy'], [], 'did a crossword with'], ['🍰', 'Bake together', 10, ['Kind', 'Generous'], [], 'baked a cake with']];
  function spendTime(p) {
    var anc = TL.ancient && TL.ancient.on(), A = anc ? TL.ancient.acts() : ACTS, K = anc ? TL.ancient.acts('kid') : KID_ACTS, O = anc ? TL.ancient.acts('old') : OLD_ACTS;
    var a = me().age, pool = p.age < 10 || a < 10 ? K : p.age >= 70 ? O : A.filter(function (x) { return a >= (x[6] || 6) && p.age >= (x[6] || 6); });
    var picks = U.shuffle(pool.slice()).slice(0, 4);
    ui().choose('⏳ Time with ' + p.first, (p.traits && p.traits.length ? p.first + ' is ' + p.traits.join(' and ').toLowerCase() + '. ' : '') + 'What should we do?', picks.map(function (x) {
      var cost = E.$(x[2]);
      return { label: x[0] + ' ' + x[1] + (x[2] ? ' (' + E.fmt(cost) + ')' : ''), fn: function () {
        if (cost && !afford(cost)) return done(noMoney(cost));
        if (cost) E.addMoney(-cost);
        var f = diminish('time' + p.id), sc = likeScore(p, x[3], x[4]);
        var gain = Math.round((U.rand(4, 9) + sc * 6) * f);
        E.rel(p, Math.max(sc < 0 ? -2 : 1, gain)); E.stat('happy', Math.max(1, 3 + sc) * f);
        if (sc > 0) return done(good('I ' + x[5] + ' ' + p.first + '. ' + U.pick(['They loved it!', 'It was exactly their kind of thing.', 'We had the best time.'])));
        if (sc < 0) return done(p.first + ' wasn\'t into it when we ' + x[5].replace(/ with$/, '') + '. ' + U.pick([TL.ancient && TL.ancient.on() ? TL.ancient.txt('bored') : 'They checked their phone the whole time.', 'They were clearly bored.', 'Not their thing at all.']));
        return done('I ' + x[5] + ' ' + p.first + '.');
      } };
    }));
  }
  var TOPICS = [
    ['sports', ['Athletic', 'Outgoing']], ['video games', ['Nerdy', 'Lazy']], ['science and space', ['Nerdy']], ['art and music', ['Artsy']],
    ['money and investing', ['Greedy', 'Ambitious']], ['their dreams and goals', ['Ambitious', 'Romantic']], ['love and dating', ['Romantic', 'Jealous']],
    ['funny videos', ['Funny', 'Cheerful']], ['volunteering and causes', ['Kind', 'Generous']], ['old memories', ['Loyal', 'Kind']],
    ['other people\'s drama', ['Jealous', 'Mean']], ['how they\'re really feeling', ['Moody', 'Shy']], ['politics', [], true], ['religion', [], true], ['the weather', []]
  ];
  var KID_TOPICS = [['dinosaurs', []], ['cartoons', ['Lazy']], ['animals', ['Kind']], ['school', ['Nerdy']], ['superheroes', ['Athletic']], ['their drawings', ['Artsy']]];
  function conversation(p) {
    var anc = TL.ancient && TL.ancient.on(), T = anc ? TL.ancient.TOPICS : TOPICS, KT = anc ? TL.ancient.KID_TOPICS : KID_TOPICS;
    var kid = p.age < 10 || me().age < 10, picks = U.shuffle((kid ? KT : T).slice()).slice(0, 4);
    var topicOpts = picks.map(function (t) {
      return { label: U.cap(t[0]), fn: function () {
        var f = diminish('talk' + p.id), sc = likeScore(p, t[1]), risky = !!t[2], stub = (p.traits || []).indexOf('Stubborn') >= 0;
        var chance = risky ? (stub ? 0.25 : 0.45) : sc > 0 ? 0.92 : t[0] === 'the weather' ? 0.95 : 0.7;
        if (U.chance(chance)) {
          var gain = Math.round((sc > 0 ? U.rand(7, 12) : risky ? U.rand(6, 10) : t[0] === 'the weather' ? U.rand(1, 3) : U.rand(3, 6)) * f);
          E.rel(p, gain);
          return done(sc > 0 ? good(p.first + ' lit up talking about ' + t[0] + '. We talked for hours.') : risky ? good('We talked about ' + t[0] + ' and actually agreed on most of it.') : 'I chatted with ' + p.first + ' about ' + t[0] + '.');
        }
        E.rel(p, -U.rand(risky ? 4 : 2, risky ? 9 : 5));
        return done(bad(risky ? 'Talking about ' + t[0] + ' with ' + p.first + ' turned into a shouting match.' : p.first + ' seemed bored when I brought up ' + t[0] + '.'));
      } };
    });
    // Past childhood, people talk back (js/mind.js).
    if (!kid && TL.mind) return TL.mind.talk(p, topicOpts);
    ui().choose('💬 Talk to ' + p.first, (p.traits && p.traits.length ? p.first + ' is ' + p.traits.join(' and ').toLowerCase() + '. ' : '') + 'What do we talk about?', topicOpts);
  }
  function compliment(p) {
    var f = diminish('comp' + p.id);
    var c = U.pick(['their smile', 'their style', 'their cooking', 'their intelligence', 'their sense of humor', 'their hair', 'their kindness']);
    if (U.chance(0.85)) { E.rel(p, U.rand(2, 7) * f); E.karma(1); done('I complimented ' + p.first + ' on ' + c + '. They blushed.'); }
    else done(p.first + ' thought my compliment was sarcastic.');
  }
  function hug(p) {
    var f = diminish('hug' + p.id);
    if (p.rel < 20 && U.chance(0.5)) return done(bad(p.first + ' pushed me away.'));
    E.rel(p, U.rand(2, 6) * f); E.stat('happy', 2);
    done('I gave ' + p.first + ' a big hug. 🤗');
  }
  function giftMenu(p) {
    var gifts = TL.ancient && TL.ancient.on() ? TL.ancient.txt('gifts') : [['🍫', 'Box of chocolates', 20], ['💐', 'Flowers', 40], ['📚', 'A book', 25], ['🧸', 'Stuffed animal', 30], ['🎮', 'Video game', 60], ['👜', 'Designer handbag', 1500], ['⌚', 'Luxury watch', 8000], ['🚗', 'A new car', 35000]];
    ui().menu('Gift for ' + p.first, function () {
      return gifts.map(function (g) {
        var cost = E.$(g[2]);
        return { icon: g[0], label: g[1], right: E.fmt(cost), disabled: !afford(cost), onClick: function () {
          if (!afford(cost)) return done(noMoney(cost));
          E.addMoney(-cost);
          var f = diminish('gift' + p.id);
          var gain = Math.round((6 + Math.log10(g[2]) * 5) * f * (p.traits.indexOf('Greedy') >= 0 ? 1.4 : 1));
          E.rel(p, gain); E.karma(1);
          ui().back();
          done(U.chance(0.9) ? good(p.first + ' loved the ' + g[1].toLowerCase().replace(/^an? /, '') + '!') : p.first + ' said they\'d "treasure it"... sarcastically.');
        } };
      });
    });
  }
  function askMoney(p) {
    var n = use('askmoney' + p.id);
    if (n >= 2) return done(bad(p.first + ' told me to stop asking for money.'));
    var generous = p.traits.indexOf('Generous') >= 0 ? 0.2 : p.traits.indexOf('Greedy') >= 0 ? -0.25 : 0;
    var chance = p.rel / 140 + generous + (p.role === 'grandparent' ? 0.15 : 0) - n * 0.3;
    if (p.money > E.$(200) && U.chance(chance)) {
      var amt = Math.min(p.money, Math.round(p.money * U.randf(0.005, 0.04)) + E.$(U.rand(10, 200)));
      if (me().age < 18) amt = Math.min(amt, E.$(me().age * 20));
      p.money -= amt; E.addMoney(amt);
      done(good(p.first + ' gave me ' + E.fmt(amt) + '.'));
    } else { E.rel(p, -4); done(p.first + ' said no.'); }
  }
  function giveMoney(p) {
    var opts = [100, 1000, 10000, 100000, 1000000].map(function (x) { return E.$(x); }).filter(function (x) { return x <= S().money; });
    if (!opts.length) return done(nope('I don\'t have enough money to give.'));
    ui().choose('Give money to ' + p.first, 'How much?', opts.map(function (amt) {
      return { label: E.fmt(amt), fn: function () {
        E.addMoney(-amt); p.money += amt;
        E.rel(p, Math.min(40, 5 + Math.log10(amt / E.k() + 1) * 5)); E.karma(2);
        done(good('I gave ' + p.first + ' ' + E.fmt(amt) + '. They were thrilled.'));
      } };
    }));
  }
  function prank(p) {
    var anc = TL.ancient && TL.ancient.on();
    var pr = U.pick(anc ? TL.ancient.txt('pranks') : ['put salt in their coffee', 'hid a whoopee cushion on their chair', 'filled their room with balloons', 'swapped their shampoo with mayo', 'changed their phone language to Klingon']);
    if (U.chance(0.55)) { E.rel(p, 4); E.stat('happy', 4); done('I ' + pr + '. ' + p.first + ' laughed it off! 😂'); }
    else { E.rel(p, -10); done(bad('I ' + pr + '. ' + p.first + ' was NOT amused.')); }
  }
  function argue(p) {
    var topic = U.pick(TL.ancient && TL.ancient.on() ? TL.ancient.txt('argue') : ['money', 'chores', 'their attitude', 'politics', 'a TV show', 'who ate the last slice of pizza', 'something they said years ago']);
    if (U.chance(me().smarts / 200)) { E.rel(p, -3); done('I argued with ' + p.first + ' about ' + topic + ' and won the argument.'); }
    else { E.rel(p, -U.rand(6, 14)); E.stat('happy', -3); done(bad('I got into a big fight with ' + p.first + ' about ' + topic + '.')); }
  }
  function insult(p) {
    var ins = U.pick(['called them a potato', 'mocked their haircut', 'said they have the personality of a wet sock', 'told them they smell funny', 'laughed at their shoes']);
    E.rel(p, -U.rand(10, 20)); E.karma(-2);
    if (U.chance(0.2) && p.age >= 12) { E.stat('health', -5); return done(bad('I ' + ins + '. ' + p.first + ' slapped me!')); }
    done(bad('I ' + ins + '. ' + p.first + ' is hurt.'));
  }
  function askCar(p) {
    if (used('askcar')) return done(p.first + ' said to stop asking.');
    use('askcar');
    if (U.chance(p.rel / 140)) {
      var t = U.pick(D.CARS.slice(0, 5)); var price = E.$(U.rand(t.min, t.max));
      p.money -= price;
      var model = TL.real ? TL.real.carModel(t.type) : t.type;
      S().assets.push({ id: U.uid(), kind: 'car', type: t.type, name: U.pick(D.CAR_COLORS) + ' ' + model, value: price, price: price, cond: U.rand(60, 100), loan: 0 });
      E.rel(p, 5);
      done(good(p.first + ' bought me a ' + model + '! 🚗'));
    } else done(p.first + ' said I need to earn my own car.');
  }
  function canDate(p) {
    var m = me();
    if (m.age < 13 || p.age < 13) return false;
    if (Math.abs(p.age - m.age) > Math.max(4, m.age / 2 - 3)) return false;
    if (m.age >= 18 && p.age < 18) return false;
    if (m.age < 18 && Math.abs(p.age - m.age) > 2) return false; // minors date people their own age
    if (m.interest !== 'A' && p.gender !== m.interest) return false;
    return !E.partner() || ['partner'].indexOf(E.partner().role) < 0;
  }
  function befriend(p) {
    if (U.chance(p.rel / 100 + 0.25)) { p.role = 'friend'; E.rel(p, 10); done(good(p.first + ' and I are friends now!')); }
    else { E.rel(p, -5); done(p.first + ' wasn\'t interested in being friends.'); }
  }
  function askOut(p, rekindle) {
    var pt = E.partner();
    var chance = p.rel / 180 + me().looks / 250 + (rekindle ? -0.1 : 0.05);
    if (U.chance(chance)) {
      if (pt && pt.role !== 'partner') {
        E.karma(-5);
        if (U.chance(0.35)) { E.rel(pt, -40); return done(bad(pt.first + ' caught me cheating with ' + p.first + '!')); }
        E.stat('happy', 5); return done('I\'m secretly seeing ' + p.first + '. 🤫');
      }
      p.role = 'partner'; E.rel(p, 15); S().counts.dates++; E.stat('happy', 10);
      done(good(p.first + ' said yes! We\'re dating now. 💕'));
    } else { E.rel(p, -8); E.stat('happy', -4); done(bad(p.first + ' turned me down.')); }
  }
  function party(p) {
    var f = diminish('party');
    E.rel(p, 8 * f); E.stat('happy', 6 * f);
    if (U.chance(0.1)) { E.stat('health', -8); return done(bad(TL.ancient && TL.ancient.on() ? TL.ancient.txt('partySick') : 'We partied so hard I ended up in the ER.')); }
    done('I went out partying with ' + p.first + '. 🎉');
  }
  // Couples counseling: works best with a willing partner, early, and before
  // grudges harden. A breakthrough clears old hurts; a bad session can end things.
  function counseling(p) {
    var cost = E.$(1800);
    if (!afford(cost)) return done(noMoney(cost));
    use('counsel' + p.id); E.addMoney(-cost);
    var tr = p.traits || [], has = function (t) { return tr.indexOf(t) >= 0; };
    var hurts = (p.mem || []).filter(function (m) { return m[1] < 0 && !m[3] && !m[4]; });
    var pain = hurts.reduce(function (t, m) { return t - m[1]; }, 0);
    var ch = 0.45 + (has('Kind') ? 0.12 : 0) + (has('Loyal') ? 0.1 : 0) + (has('Romantic') ? 0.08 : 0) - (has('Stubborn') ? 0.15 : 0) - (has('Jealous') ? 0.08 : 0) - (has('Moody') ? 0.06 : 0) - (has('Mean') ? 0.1 : 0)
      - Math.min(0.2, pain / 150) - (p.counsel || 0) * 0.07 + (p.rel < 30 ? -0.1 : 0);
    ch = U.clamp(ch, 0.12, 0.85); p.counsel = (p.counsel || 0) + 1;
    var who = p.first, they = p.gender === 'F' ? 'she' : 'he';
    if (U.chance(ch)) {
      hurts.forEach(function (m) { m[3] = 1; }); // forgiven
      E.rel(p, U.rand(15, 25)); E.stat('happy', 6);
      return done(good('🛋️ Counseling broke through. ' + who + ' and I finally talked about ' + (hurts.length ? 'the things that hurt' : 'what we each need') + ', and ' + they + ' forgave me. We feel like a team again.'));
    }
    if (U.chance(0.6)) { E.rel(p, U.rand(4, 9)); E.stat('happy', 2); return done('🛋️ Slow going. ' + who + ' and I learned some tools for fighting fair' + (has('Stubborn') ? ', though ' + they + ' wouldn\'t budge on much' : '') + '.'); }
    E.rel(p, -U.rand(3, 7)); E.stat('happy', -4);
    if (p.rel < 20 && p.role === 'spouse' && U.chance(0.4)) { divorce(p, true); return done(bad('🛋️ In our last session, ' + who + ' said ' + they + ' wants a divorce. It\'s over.')); }
    return done(bad('🛋️ The session turned into a fight. ' + who + ' stormed out halfway through.'));
  }
  function dateNight(p) {
    var f = diminish('date' + p.id);
    var cost = E.$(U.rand(50, 250));
    E.addMoney(-cost);
    var place = U.pick(TL.ancient && TL.ancient.on() ? TL.ancient.txt('dates') : ['a fancy restaurant', 'the movies', 'a rooftop bar', 'a picnic in the park', 'a comedy club', 'a cooking class', 'the beach at sunset']);
    E.rel(p, U.rand(6, 14) * f); E.stat('happy', 5 * f);
    done('I took ' + p.first + ' to ' + place + '. 🌹');
  }
  function tryBaby(p) {
    var m = me();
    if (S().flags.pregnant) return done(nope('We\'re already expecting!'));
    if (m.gender === p.gender && TL.ancient && TL.ancient.on()) return done(nope('We\'ll need to adopt. See "Fertility options".'));
    if (m.gender === p.gender && m.gender === 'M') return done(nope('We\'ll need a surrogate or adoption. See "Fertility options".'));
    if (m.gender === p.gender) return done(nope('We\'ll need IVF, a surrogate or adoption. See "Fertility options".'));
    if (used('baby')) return done(nope('We should wait until next year to try again.'));
    use('baby');
    var mom = m.gender === 'F' ? m : (p.gender === 'F' ? p : null);
    var dad = mom === m ? p : m;
    if (mom.age > 47 || mom.age < 14 || dad.age > 70) return done(bad('We weren\'t able to conceive.'));
    var chance = (mom.age < 35 ? 0.55 : mom.age < 40 ? 0.35 : 0.12) * (dad.age > 55 ? 0.5 : 1);
    E.rel(p, 5);
    if (U.chance(chance)) {
      if (p.role === 'spouse') { S().flags.pregnant = { with: p.id }; return done(good((m.gender === 'F' ? 'I\'m' : p.first + ' is') + ' pregnant! 🤰 The baby is due next year.')); }
      E.queue('pregnancy', { pid: p.id });
      return done('We had a romantic evening... ' + (m.gender === 'F' ? 'and I\'m late.' : 'and ' + p.first + ' has news.'));
    }
    done('We had a romantic evening, but no baby news yet.');
  }
  function fertility(p) {
    var m = me(), s = S();
    if (s.flags.pregnant) return done(nope('We\'re already expecting!'));
    var mom = m.gender === 'F' ? m : (p.gender === 'F' ? p : null);
    var ivf = E.$(15000), surro = E.$(80000), opts = [];
    // Ancient and medieval lives: prayers and remedies instead of clinics.
    if (TL.ancient && TL.ancient.on()) {
      var pray = TL.ancient.txt('pray');
      if (mom) opts.push({ label: pray[0], fn: function () { if (used('ivf')) return done(nope(pray[1])); use('ivf'); E.addMoney(-E.$(500)); if (U.chance(mom.age < 35 ? 0.25 : 0.08)) { S().flags.pregnant = { with: p.id }; return done(good(pray[2] + ' ' + (mom === m ? 'I\'m' : p.first + ' is') + ' pregnant! 🤰')); } done(pray[3]); } });
      if (mom) opts.push({ label: '🌿 Fertility remedies', fn: function () { if (used('remedy')) return done(nope('Enough remedies for one year.')); use('remedy'); E.addMoney(-E.$(300)); E.stat('health', -U.rand(0, 4)); if (U.chance(0.1)) { S().flags.pregnant = { with: p.id }; return done(good('The midwife\'s remedy worked! A baby is on the way. 🤰')); } done('The midwife\'s potions tasted awful and did nothing.'); } });
      opts.push({ label: TL.ancient.txt('adoptIcon') + ' Adopt a child', fn: adopt });
      return ui().choose('Fertility options', 'How do we want to grow our family with ' + p.first + '?', opts);
    }
    if (mom) opts.push({ label: '🧪 IVF (' + E.fmt(ivf) + ')', fn: function () {
      if (used('ivf')) return done(nope('The clinic says we need to wait until next year for another round.'));
      if (mom.age > 50) return done(nope('The clinic won\'t do IVF past 50. A surrogate or adoption could still work.'));
      if (!afford(ivf)) return done(noMoney(ivf));
      use('ivf'); E.addMoney(-ivf);
      var ch = mom.age < 35 ? 0.5 : mom.age < 40 ? 0.35 : mom.age < 45 ? 0.15 : 0.05;
      if (U.chance(ch)) { S().flags.pregnant = { with: p.id }; E.rel(p, 8); return done(good('The IVF worked! ' + (mom === m ? 'I\'m' : p.first + ' is') + ' pregnant! 🤰')); }
      E.stat('happy', -6); done(bad('This round of IVF didn\'t work.'));
    } });
    opts.push({ label: '🤱 Surrogate (' + E.fmt(surro) + ')', fn: function () {
      if (m.age > 60) return done(nope('Surrogacy agencies won\'t work with intended parents over 60.'));
      if (!afford(surro)) return done(noMoney(surro));
      E.addMoney(-surro);
      if (U.chance(0.85)) { S().flags.pregnant = { with: p.id, surrogate: true }; E.rel(p, 10); return done(good('Our surrogate is pregnant! The baby is due next year. 🍼')); }
      done(bad('The surrogacy didn\'t result in a pregnancy.'));
    } });
    opts.push({ label: '🏠 Adoption agency', fn: adopt });
    ui().choose('Fertility options', 'How do we want to grow our family with ' + p.first + '?', opts);
  }
  function propose(p) {
    var rings = S().assets.filter(function (a) { return a.kind === 'jewelry' && a.ring; });
    var ringBonus = rings.length ? (rings[0].price > E.$(20000) ? 0.25 : 0.1) : -0.15;
    if (U.chance(p.rel / 110 + ringBonus)) {
      if (rings.length) S().assets = S().assets.filter(function (a) { return a !== rings[0]; });
      p.role = 'fiance'; E.stat('happy', 15);
      done(good(p.first + ' said YES! We\'re engaged! 💍'));
    } else { E.rel(p, -20); done(bad(p.first + ' said no. 💔' + (rings.length ? '' : ' (Maybe buy a ring first.)'))); }
  }
  function wedding(p) {
    var tiers = TL.ancient && TL.ancient.on() ? TL.ancient.WEDDINGS : [['⚖️', 'Courthouse wedding', 150], ['🌳', 'Small backyard wedding', 8000], ['⛪', 'Big traditional wedding', 35000], ['🏰', 'Lavish destination wedding', 200000]];
    ui().menu('Plan the wedding', function () {
      var items = tiers.map(function (t, i) {
        var cost = E.$(t[2]);
        return { icon: t[0], label: t[1], right: E.fmt(cost), disabled: !afford(cost), onClick: function () {
          if (!afford(cost)) return done(noMoney(cost));
          ui().choose('Prenup?', 'Do you want ' + p.first + ' to sign a prenuptial agreement?', [
            { label: 'Yes, ask for a prenup', fn: function () { if (U.chance(0.6)) { p.prenup = true; marry(p, cost, i); } else { E.rel(p, -25); ui().back(); done(bad(p.first + ' was offended and called off the wedding for now.')); } } },
            { label: 'No prenup', fn: function () { marry(p, cost, i); } }
          ]);
        } };
      });
      items.push({ icon: '🏃', label: 'Elope tonight', right: 'Free', onClick: function () { marry(p, 0, 0); } });
      return items;
    });
  }
  function marry(p, cost, tier) {
    E.addMoney(-cost);
    p.role = 'spouse'; E.rel(p, 15 + tier * 5); E.stat('happy', 15 + tier * 3);
    E.achieve('married');
    ui().back();
    done(good('💒 I married ' + p.first + '! ' + ['It was a simple, sweet ceremony.', 'It was intimate and beautiful.', 'Everyone we know was there.', 'It was the event of the year!'][tier]));
  }
  function divorce(p, silent) {
    var s = S(), msg = 'I divorced ' + p.first + '.';
    if (!p.prenup) {
      var lost = Math.max(0, Math.round(s.money / 2));
      s.money -= lost;
      var houses = s.assets.filter(function (a) { return a.kind === 'house'; });
      if (houses.length > 1) { var h = houses[houses.length - 1]; s.assets = s.assets.filter(function (a) { return a !== h; }); msg += ' ' + p.first + ' got the ' + h.name + '.'; E.validateHome(); }
      if (lost > 0) msg += ' I lost ' + E.fmt(lost) + ' in the settlement.';
    } else msg += ' Thanks to the prenup, I kept everything.';
    p.role = 'ex'; p.rel = Math.min(p.rel, 25);
    s.counts.exes++;
    E.stat('happy', -15);
    E.achieve('divorced');
    if (silent) E.log(msg, 'bad');
    return bad(msg);
  }
  function makeFriend() {
    if (used('newfriend') >= 2) return done(nope('I\'ve already tried to make friends a lot this year.'));
    use('newfriend');
    if (U.chance(0.45 + me().looks / 400 + me().happy / 400)) {
      var f = E.addPerson({ role: 'friend', age: Math.max(5, me().age + U.rand(-3, 3)), rel: U.rand(45, 70) });
      done(good('I met ' + E.fullName(f) + ' at ' + U.pick(me().age < 18 ? ['school', 'the park', 'summer camp', 'soccer practice'] : ['a coffee shop', 'the gym', 'a book club', 'a concert', 'a volunteering event']) + '. We\'re friends now!'));
    } else done('I tried to strike up conversations, but nobody clicked.');
  }
  function datingApp() {
    if (E.partner() && E.partner().role !== 'partner') { /* allowed, but cheating */ }
    var m = me();
    var cands = S().yearActs.dating;
    if (!cands) {
      cands = [];
      for (var i = 0; i < 4; i++) {
        var g = m.interest === 'A' ? undefined : m.interest;
        var age = U.clamp(m.age + U.rand(-5, 5), 18, 99);
        if (m.age < 18) age = U.clamp(m.age + U.rand(-1, 1), 16, 17);
        cands.push(E.makePerson({ gender: g, age: age, role: 'partner' }));
      }
      S().yearActs.dating = cands;
    }
    ui().menu('Dating app 💘', function () {
      var items = [{ info: true, html: '<p class="muted">Swipe right on someone you like. Your looks affect your chances.</p>' }];
      S().yearActs.dating.forEach(function (c) {
        items.push({ icon: personIcon(c), label: c.first + ', ' + c.age, sub: c.job + ' · Looks ' + c.looks + '% · ' + c.traits.join(', '), right: c.swiped ? (c.matched ? '💕' : '✖') : '👉', disabled: !!c.swiped, onClick: function () {
          c.swiped = true;
          var p = 0.25 + (m.looks - c.looks) / 150 + (S().fame / 200) + (S().money > E.$(1e6) ? 0.1 : 0);
          if (U.chance(U.clamp(p, 0.05, 0.9))) {
            c.matched = true; c.rel = U.rand(50, 70); c.id = U.uid();
            ui().choose('It\'s a match! 💕', c.first + ' matched with me.', [
              { label: 'Go on a date', fn: function () {
                if (U.chance(0.65)) { var pt = E.partner(); c.role = pt ? 'friend' : 'partner'; S().people.push(c); S().counts.dates++; E.stat('happy', 8); done(good(pt ? 'We had fun, but I\'m already taken. ' + c.first + ' and I will stay friends.' : 'The date went great! ' + c.first + ' and I are dating now.')); }
                else done(c.first + ' and I had zero chemistry.');
              } },
              { label: 'Hook up', fn: function () {
                E.stat('happy', 6);
                if (U.chance(0.08)) { E.addCondition(U.pick(['Chlamydia', 'Herpes'])); return done(bad('I had a fun night with ' + c.first + '... and caught an STD.')); }
                var pt = E.partner();
                if (pt) { E.karma(-5); if (U.chance(0.3)) { E.rel(pt, -40); return done(bad(pt.first + ' found out I cheated!')); } }
                if (me().gender !== c.gender && (me().gender === 'F' ? me() : c).age <= 47 && (me().gender === 'M' ? me() : c).age <= 70 && U.chance(0.04)) { S().people.push(c); c.role = 'ex'; E.queue('pregnancy', { pid: c.id }); }
                done('I had a fun night with ' + c.first + '. 😏');
              } },
              { label: 'Unmatch', fn: function () { done('I unmatched.'); } }
            ]);
          } else done(c.first + ' didn\'t swipe back.');
        } });
      });
      return items;
    });
  }

  // ---------- pets ----------
  function petIcon(sp) { return { Dog: '🐕', Cat: '🐈', Rabbit: '🐇', Parrot: '🦜', Hamster: '🐹', Snake: '🐍', Horse: '🐎', Tortoise: '🐢' }[sp] || '🐾'; }
  function addPet(species, breed, age) {
    var sp = D.PETS.filter(function (x) { return x.species === species; })[0];
    var pet = { id: U.uid(), name: U.pick(D.PET_NAMES), species: species, breed: breed || U.pick(sp.breeds), age: age || 0, life: sp.life + U.rand(-2, 3), rel: U.rand(60, 90) };
    S().pets.push(pet);
    S().flags.hadPet = true;
    E.checkAchievements();
    return pet;
  }
  function petMenu(pet) {
    ui().menu(pet.name, function () {
      return [
        { info: true, html: '<p>' + petIcon(pet.species) + ' <b>' + U.esc(pet.name) + '</b> — ' + pet.breed + (new RegExp(pet.species + '$', 'i').test(pet.breed) ? '' : ' ' + pet.species.toLowerCase()) + ', ' + pet.age + ' years old.</p>' },
        { icon: '🎾', label: 'Play', onClick: function () { var f = diminish('pet' + pet.id); pet.rel = U.clamp(pet.rel + 10 * f, 0, 100); E.stat('happy', 4 * f); done('I played with ' + pet.name + '.'); } },
        { icon: '🦮', label: 'Go for a walk', onClick: function () { var f = diminish('walkpet' + pet.id); pet.rel = U.clamp(pet.rel + 8 * f, 0, 100); E.stat('health', 3 * f); done('I took ' + pet.name + ' for a walk.'); } },
        { icon: '🏥', label: 'Take to the vet', right: E.fmt(E.$(200)), onClick: function () { E.addMoney(-E.$(200)); pet.life += U.chance(0.5) ? 1 : 0; done(pet.name + ' got a clean bill of health.'); } },
        { icon: '✏️', label: 'Rename', onClick: function () { ui().prompt('Rename', 'New name for ' + pet.name + ':', pet.name, function (v) { if (v) { pet.name = v.slice(0, 20); done('I renamed my pet ' + pet.name + '.'); } }); } },
        { icon: '🏠', label: 'Rehome', danger: true, onClick: function () { S().pets = S().pets.filter(function (x) { return x !== pet; }); E.stat('happy', -5); ui().back(); done('I gave ' + pet.name + ' to a new family.'); } }
      ];
    });
  }
  function petStore() {
    ui().menu('Adopt a pet', function () {
      return D.PETS.map(function (sp) {
        var cost = E.$(sp.price);
        return { icon: petIcon(sp.species), label: sp.species, sub: 'Lifespan ~' + sp.life + ' yrs', right: E.fmt(cost), onClick: function () {
          if (me().age < 18 && U.chance(0.5)) return done('My parents said no pets.');
          if (!afford(cost)) return done(noMoney(cost));
          E.addMoney(-cost);
          var p = addPet(sp.species);
          done(good('I adopted ' + (/^[AEIOU]/.test(p.breed) ? 'an ' : 'a ') + p.breed + (new RegExp(sp.species + '$', 'i').test(p.breed) ? '' : ' ' + sp.species.toLowerCase()) + ' named ' + p.name + '!'));
        } };
      });
    });
  }

  // ======================================================================
  // OCCUPATION: school + jobs
  // ======================================================================
  function occupationMenu() {
    if (TL.ancient && TL.ancient.on()) return TL.ancient.occupationMenu();
    ui().menu('Occupation', function () {
      var s = S(), m = me(), items = [];
      if (s.prison) return [{ info: true, html: '<p>I\'m in prison. My career is on hold.</p>' }];
      if (m.age < 5) return [{ info: true, html: '<p>I\'m too young for school or work. Enjoy being a baby! 🍼</p>' }];
      // School
      if (s.edu) {
        var e = s.edu;
        items.push({ section: 'School' });
        items.push({ info: true, html: '<div class="kv"><b>' + U.esc(e.school) + '</b><br>' + (e.major ? 'Major: ' + e.major + '<br>' : '') + 'Year ' + Math.min(e.year, E.eduYears(e.stage, e.grad)) + ' of ' + E.eduYears(e.stage, e.grad) + ' · Grades: <b>' + E.gradeLetter(e.grade) + '</b> (' + e.grade + '%)' + (e.popularity != null && e.stage !== 'grad' ? ' · Popularity ' + Math.round(e.popularity) + '%' : '') + (e.team ? '<br>Team: ' + e.team : '') + (e.greek ? '<br>Greek life: ' + e.greek : '') + (e.president ? '<br>🗳️ Class president' : '') + (e.stage === 'high' && S().sat ? '<br>SAT: ' + S().sat : '') + (e.clubs.length ? '<br>Clubs: ' + e.clubs.join(', ') : '') + '</div>' });
        items.push({ icon: '📚', label: 'Study harder', onClick: studyHarder });
        items.push({ icon: '🍎', label: 'Talk to a teacher', onClick: function () { var f = diminish('teacher'); e.grade = U.clamp(e.grade + Math.round(3 * f), 0, 100); done('My teacher gave me some great advice.'); } });
        if (e.stage === 'middle' || e.stage === 'high' || e.stage === 'uni') items.push({ icon: '🏅', label: 'Sports', sub: TL.sports.summary(), onClick: TL.sports.menu });
        if (e.stage !== 'elementary' && e.stage !== 'grad' && e.stage !== 'trade') items.push({ icon: '🎭', label: 'Join a club', onClick: clubMenu });
        TL.features.schoolItems(e).forEach(function (it) { items.push(it); });
        if (e.stage === 'high' || e.stage === 'middle') items.push({ icon: '😎', label: 'Hang out with the popular kids', onClick: function () { var f = diminish('popular'); if (U.chance(me().looks / 120 + 0.1)) { e.popularity = U.clamp(e.popularity + 10 * f, 0, 100); done(good('They let me sit at their table!')); } else { e.popularity = U.clamp(e.popularity - 5, 0, 100); done(bad('They laughed me away.')); } } });
        if (m.age >= 8) items.push({ icon: '🏃', label: 'Skip school', onClick: function () { E.stat('happy', 4); e.grade = Math.max(0, e.grade - 4); if (U.chance(0.3)) { E.people(['mother', 'father']).forEach(function (p) { E.rel(p, -8); }); return done(bad('I got caught skipping school. My parents are furious.')); } done('I skipped school and hung out at the mall.'); } });
        if ((e.stage === 'high' && m.age >= 16) || e.stage === 'uni' || e.stage === 'grad' || e.stage === 'trade') items.push({ icon: '🚪', label: 'Drop out', danger: true, onClick: function () { ui().confirm('Drop out?', 'Are you sure you want to drop out of ' + e.school + '?', function () { E.dropOut(); done(bad('I dropped out.')); }); } });
      } else if (m.age >= 16) {
        items.push({ section: 'Education' });
        var hs = E.hasDegree('hs');
        if (!hs) items.push({ icon: '📝', label: 'Get a GED', sub: 'Earn a high-school equivalency', onClick: function () { if (U.chance(me().smarts / 110 + 0.1)) { S().degrees.push({ type: 'hs' }); S().lastGrade = 60; done(good('I passed the GED exam! 🎓')); } else done(bad('I failed the GED exam. I can try again next year.')); use('ged'); }, disabled: used('ged') > 0 });
        if (hs) items.push({ icon: '🏛️', label: 'University', sub: 'Earn a bachelor\'s degree', onClick: openUniversity });
        if (hs) items.push({ icon: '🔧', label: 'Trade school', sub: 'Electrician, plumber, welder, HVAC · 2 years', onClick: tradeMenu });
        if (E.hasDegree('bachelor')) items.push({ icon: '🎓', label: 'Graduate school', sub: 'Law, Medicine, Vet, Dental, MBA, PhD', onClick: gradMenu });
      }
      // Job
      items.push({ section: 'Career' });
      if (s.hoops) items.push({ icon: '🏀', label: 'Basketball', sub: TL.hoops.summary(), onClick: TL.hoops.menu });
      if (s.mil) items.push({ icon: '🎖️', label: 'Military', sub: TL.military.summary(), onClick: TL.military.menu });
      if ((s.acting || (s.job && s.job.career === 'actor')) && m.age >= 8) items.push({ icon: '🎬', label: 'Acting', sub: TL.acting.summary(), onClick: TL.acting.menu });
      if (s.pro || (s.job && s.job.career === 'athlete' && !s.job.hoops)) items.push({ icon: '🏆', label: 'Pro sports', sub: TL.pro.summary(), onClick: TL.pro.menu });
      if ((s.music || (s.job && s.job.career === 'musician')) && m.age >= 10) items.push({ icon: '🎵', label: 'Music', sub: TL.music.summary(), onClick: TL.music.menu });
      var serving = s.mil && s.mil.active;
      if (s.job) {
        var j = s.job;
        items.push({ info: true, html: '<div class="kv">' + (TL.logos && j.company ? '<div class="job-head">' + TL.logos.badge(j.company, { size: 'md' }) + '<div><b>' + U.esc(E.jobTitle(j)) + '</b><br><span class="muted">' + U.esc(String(j.company).replace(/^the /, '')) + '</span></div></div>' : '<b>' + U.esc(E.jobTitle(j)) + '</b> at ' + U.esc(j.company) + '<br>') + 'Salary: ' + E.fmt(E.jobSalary(j)) + '/yr · ' + U.plural(j.years, 'year') + (j.politics ? ' · ' + U.plural(j.term, 'year') + ' until election' : '') + '<div class="minibar"><span>' + (j.politics ? 'Approval' : 'Performance') + '</span><div class="track"><div class="fill ' + barClass(j.perf) + '" style="width:' + j.perf + '%"></div></div></div>' + (TL.work ? TL.work.card(j) : '') + (j.fame ? '<div class="minibar"><span>Fame</span><div class="track"><div class="fill hi" style="width:' + s.fame + '%"></div></div></div>' : '') + '</div>' });
        if (!j.hoops && !j.mil && !j.acting && !j.music && !j.pro) items.push({ icon: '💪', label: j.fame ? ({ actor: 'Practice acting', musician: 'Write & record music', athlete: 'Train hard' }[j.career]) : 'Work harder', onClick: workHarder });
        if (j.politics) (TL.politics ? TL.politics.items(j) : politicsItems(j)).forEach(function (it) { items.push(it); });
        if (TL.work && TL.work.regular(j)) TL.work.items(j).forEach(function (it) { items.push(it); });
        else if (!j.partTime && !j.fame && !j.politics && !j.mil) items.push({ icon: '💰', label: 'Ask for a raise', onClick: askRaise });
        if (j.fame && !j.hoops && !j.acting && !j.music && !j.pro) items.push({ icon: '🎬', label: { actor: 'Audition for a big role', musician: 'Release an album', athlete: 'Negotiate new contract' }[j.career], onClick: fameGig });
        if (!j.partTime && !j.fame && !j.politics && !j.mil) items.push({ icon: '☕', label: 'Chat with coworkers', onClick: function () { var cw = E.people('coworker'); if (!cw.length) return done('No one is around.'); var c = U.pick(cw); E.rel(c, 8); done('I chatted with ' + c.first + ' by the water cooler.'); } });
        if (me().age >= 55 && !j.partTime && !j.mil && !j.acting && !j.music && !j.pro) items.push({ icon: '🌅', label: 'Retire', onClick: function () { ui().confirm('Retire?', 'Retire and collect a pension?', function () { var r = E.retire(); done(r.ok ? good(r.msg) : nope(r.msg)); }); } });
        if (!j.mil && !j.pro) items.push({ icon: '🚪', label: j.hoops ? 'Retire from basketball' : 'Quit job', danger: true, onClick: function () { ui().confirm(j.hoops ? 'Retire?' : 'Quit?', j.hoops ? 'Hang up my sneakers for good?' : 'Quit your job as ' + E.jobTitle(j) + '?', function () { if (j.hoops) return done(TL.hoops.retire()); E.quitJob(); done('I quit my job.'); }); } });
      } else if (s.retired) items.push({ info: true, html: '<p>I\'m retired' + (s.pension ? ' with a pension of ' + E.fmt(s.pension) + '/yr' : '') + '.</p>' });
      if (s.job || s.retired || s.hoops || s.mil || s.acting || s.music || s.pro) items.push({ section: 'Other paths' });
      if (!serving && m.age >= 18 && !(s.edu && (s.edu.stage === 'high'))) items.push({ icon: '🔎', label: 'Find a full-time job', sub: 'Browse openings', onClick: jobBoard });
      if (!serving && m.age >= 12) items.push({ icon: '⏰', label: 'Part-time jobs', sub: 'Flexible work', onClick: partTimeBoard });
      if (!serving && m.age >= 17 && m.age <= 39) items.push({ icon: '🎖️', label: 'Join the military', sub: 'Talk to a recruiter', onClick: TL.military.recruiter });
      items.push({ icon: '⭐', label: 'Special careers', sub: 'Acting · Music · Basketball · Pro Sports', onClick: fameMenu });
      if (m.age >= D.POLITICS.minAge && !(s.job && s.job.politics)) items.push({ icon: '🗳️', label: 'Run for office', sub: 'Start a political career', onClick: function () { if (TL.politics) TL.politics.campaign(0); else campaignMenu(0); } });
      if (TL.politics) TL.politics.formerItems().forEach(function (it) { items.push(it); });
      if (m.age >= 8 && m.age < 18) items.push({ icon: '🧃', label: 'Odd jobs', sub: 'Lemonade stands, mowing lawns', onClick: oddJobs });
      if (m.age >= 18) items.push({ icon: '📈', label: 'Start a business', onClick: businessMenu });
      if (s.jobHistory.length) items.push({ icon: '🗂️', label: 'Job history', onClick: function () { ui().menu('Job history', function () { return s.jobHistory.slice().reverse().map(function (h) { return { icon: h.company && TL.logos ? TL.logos.badge(h.company) : h.fired ? '🔥' : '💼', label: h.title, sub: (h.company || '') + ' · ' + U.plural(h.years, 'year') + (h.fired ? ' · fired' : '') }; }); }); } });
      return items;
    });
  }
  function studyHarder() {
    var e = S().edu, f = diminish('study');
    if (f < 0.25) return done(nope('I\'m burnt out from studying so much this year.'));
    e.study = Math.min(3, e.study + 1);
    e.grade = U.clamp(e.grade + Math.round(4 * f), 0, 100);
    E.stat('smarts', Math.round(2 * f)); E.stat('happy', -1);
    done('I hit the books hard. 📖');
  }
  function clubMenu() {
    var e = S().edu;
    ui().menu('Clubs & teams', function () {
      // Sports teams have their own menu (TL.sports).
      var list = D.CLUBS.map(function (c) { return { name: c, sport: false }; });
      return list.map(function (c) {
        var inIt = e.clubs.indexOf(c.name) >= 0 || e.team === c.name;
        return { icon: c.sport ? '🏅' : '🎭', label: c.name, right: inIt ? '✔' : '', onClick: function () {
          if (inIt) return done(nope('I\'m already a member.'));
          if (c.sport) {
            if (U.chance(me().athl / 100 + 0.15)) { e.team = c.name; me().athl = U.clamp(me().athl + 5, 0, 100); if (me().athl > 80 && me().age >= 15) S().flags.athleteScholar = true; return done(good('I made the ' + c.name + '!')); }
            return done(bad('I didn\'t make the ' + c.name + '.'));
          }
          e.clubs.push(c.name); E.stat('smarts', 2); E.stat('happy', 3);
          if (c.name === 'Drama Club') S().flags.acting = (S().flags.acting || 0) + 1;
          if (c.name === 'Band' || c.name === 'Choir') S().flags.music = (S().flags.music || 0) + 1;
          var cm = E.addPerson({ role: 'classmate', age: me().age, rel: U.rand(40, 70) });
          done(good('I joined the ' + c.name + ' and met ' + cm.first + '.'));
        } };
      });
    });
  }
  function openUniversity() {
    var s = S();
    if (s.edu) return done(nope('I\'m already enrolled in school.'));
    if (!E.hasDegree('hs')) return done('I need a high school diploma first.');
    ui().menu('Choose a major', function () {
      return D.MAJORS.map(function (mj) {
        var had = E.hasDegree('bachelor', [mj]);
        return { icon: '📘', label: mj, right: had ? '✔' : '', disabled: had, onClick: function () { collegeMenu(mj); } };
      });
    });
  }
  // Real universities in my country: admission odds depend on grades, SAT and sports.
  function collegeMenu(major) {
    ui().menu('Universities', function () {
      var s = S(), items = [{ info: true, html: '<p>Studying <b>' + U.esc(major) + '</b>. My grades: <b>' + E.gradeLetter(s.lastGrade || 60) + '</b>' + (s.sat ? ' · SAT ' + s.sat : '') + '. A big-name degree helps when job hunting.</p>' }];
      [3, 2, 1].forEach(function (tier) {
        items.push({ section: TL.real.TIER_LABEL[tier] });
        TL.real.universities(s.country).filter(function (u) { return u.tier === tier; }).forEach(function (u) {
          var pct = Math.round(TL.real.admitChance(u.tier, s.lastGrade || 60, s.sat, s.flags.athleteScholar) * 100);
          var tried = s.flags['applied_' + u.name] === s.year;
          items.push({ icon: tier === 3 ? '🏛️' : tier === 2 ? '🎓' : '🏫', label: u.name, sub: (tried ? 'Already applied this year' : pct + '% chance') + ' · ' + E.fmt(E.$(TL.real.tuition(s.country, u.tier))) + '/yr', disabled: tried, onClick: function () { applyCollege(major, u); } });
        });
      });
      return items;
    });
  }
  function applyCollege(major, u) {
    var s = S();
    s.flags['applied_' + u.name] = s.year;
    if (!U.chance(TL.real.admitChance(u.tier, s.lastGrade || 60, s.sat, s.flags.athleteScholar))) return done(bad(u.name + ' rejected my application. 📭'));
    var cost = E.$(TL.real.tuition(s.country, u.tier)) * 4;
    ui().choose('Accepted! 🎉', u.name + ' accepted me to study ' + major + '! Four years of tuition is ' + E.fmt(cost) + '. How will I pay?', [
      { label: 'Ask my parents', fn: function () { finishEnroll(E.enrollUni(major, 'parents', u)); } },
      { label: 'Apply for a scholarship', fn: function () { finishEnroll(E.enrollUni(major, 'scholarship', u)); } },
      { label: 'Student loans', fn: function () { finishEnroll(E.enrollUni(major, 'loans', u)); } },
      { label: 'Pay with savings', fn: function () { finishEnroll(E.enrollUni(major, 'savings', u)); } }
    ].concat(TL.military && TL.military.veteran() ? [{ label: '🎖️ Use the GI Bill', fn: function () { finishEnroll(E.enrollUni(major, 'gibill', u)); } }] : []));
  }
  function fundingMenu(major) {
    var cost = E.$(28000) * 4;
    ui().choose('Pay for university', 'Tuition for 4 years is ' + E.fmt(cost) + '. How will I pay?', [
      { label: 'Ask my parents', fn: function () { finishEnroll(E.enrollUni(major, 'parents')); } },
      { label: 'Apply for a scholarship', fn: function () { finishEnroll(E.enrollUni(major, 'scholarship')); } },
      { label: 'Student loans', fn: function () { finishEnroll(E.enrollUni(major, 'loans')); } },
      { label: 'Pay with savings', fn: function () { finishEnroll(E.enrollUni(major, 'savings')); } }
    ]);
  }
  function finishEnroll(r) {
    if (r.ok) { ui().closeAll(); done(good(r.msg)); }
    else done(bad(r.msg));
  }
  function gradMenu() {
    ui().menu('Graduate school', function () {
      return D.GRAD_SCHOOLS.map(function (g) {
        var cost = E.$(g.cost) * g.years;
        return { icon: { law: '⚖️', med: '🩺', mba: '📊', phd: '🔬', vet: '🐾', dental: '🦷' }[g.id], label: g.name, sub: g.years + ' years · ' + (cost ? E.fmt(cost) : 'Funded') + (g.majors ? ' · pre-med major' : ''), right: E.hasDegree(g.id) ? '✔' : '', onClick: function () {
          if (!cost) return finishEnroll(E.enrollGrad(g.id, 'loans'));
          ui().choose(g.name, 'It costs ' + E.fmt(cost) + '. How will I pay?', [
            { label: 'Student loans', fn: function () { finishEnroll(E.enrollGrad(g.id, 'loans')); } },
            { label: 'Pay with savings', fn: function () { finishEnroll(E.enrollGrad(g.id, 'savings')); } }
          ]);
        } };
      });
    });
  }
  function tradeMenu() {
    if (S().edu) return done(nope('I\'m already enrolled in school.'));
    var cost = E.$(7000) * 2;
    ui().menu('Trade school', function () {
      return [{ info: true, html: '<p class="muted">Two years of hands-on training. Tuition is ' + E.fmt(cost) + '. Graduates start as apprentices with solid pay.</p>' }].concat(D.TRADES.map(function (t) {
        var had = E.hasDegree('trade', [t[0]]);
        return { icon: t[1], label: t[0], right: had ? '✔' : '', disabled: had, onClick: function () {
          ui().choose(t[0] + ' training', 'How will I pay ' + E.fmt(cost) + '?', [
            { label: 'Student loans', fn: function () { finishEnroll(E.enrollTrade(t[0], 'loans')); } },
            { label: 'Pay with savings', fn: function () { finishEnroll(E.enrollTrade(t[0], 'savings')); } }
          ]);
        } };
      }));
    });
  }
  function jobBoard() {
    var s = S();
    if (!s.yearActs.jobs) {
      // A mix of openings, weighted towards jobs I qualify for.
      // The military is joined through a recruiter, not the job board.
      var ok = D.CAREERS.filter(function (c) { return c.id !== 'military' && !E.eligible(c).length; });
      var no = D.CAREERS.filter(function (c) { return c.id !== 'military' && E.eligible(c).length; });
      s.yearActs.jobs = U.shuffle(ok).slice(0, 9).concat(U.shuffle(no).slice(0, 5)).map(function (c) { return c.id; });
    }
    ui().menu('Job openings', function () {
      var items = [{ info: true, html: '<p class="muted">New listings appear every year. Requirements are shown for jobs you don\'t qualify for.</p>' }];
      s.yearActs.jobs.forEach(function (id) {
        var c = D.career(id), why = E.eligible(c);
        items.push({ icon: why.length ? '🔒' : '💼', label: c.levels[0][0], sub: c.name + ' · ' + E.fmt(E.$(c.levels[0][1])) + '/yr' + (why.length ? ' · ' + why.join('; ') : ''), disabled: !!why.length || used('apply' + id) > 0, onClick: function () {
          use('apply' + id); // one interview per opening per year, even if I walk out
          interview(c, function (bonus, reaction) {
            var r = E.applyJob(id, bonus);
            if (r.ok) ui().back();
            done(r.ok ? good(reaction + ' ' + r.msg) : bad(reaction + ' ' + r.msg));
          });
        } });
      });
      return items;
    });
  }
  // ---------- job interviews ----------
  // An answer is a fixed modifier to the hire chance, 'wild' (a gamble), or a
  // stat name (scales with that stat).
  var INTERVIEW = [
    { q: 'Why do you want to work here?', a: [['I\'ve followed this company for years and have ideas to help it grow.', 0.15], ['I\'m passionate about this field.', 0.08], ['Honestly? I need the money.', -0.08], ['My mom said I had to get a job.', 'wild']] },
    { q: 'What is your greatest weakness?', a: [['I struggle to delegate, but I\'m working on it.', 0.12], ['I work too hard.', 0], ['Kryptonite.', 'wild'], ['I don\'t have any weaknesses.', -0.12]] },
    { q: 'Where do you see yourself in five years?', a: [['Growing into a leadership role here.', 0.12], ['Sitting in your chair.', 'wild'], ['Running my own company.', -0.03], ['No idea, honestly.', -0.08]] },
    { q: 'Tell me about a time you handled a conflict.', a: [['I listened to both sides and found a compromise.', 0.12], ['I let my boss handle it.', -0.03], ['I challenged them to a dance-off.', 'wild'], ['I don\'t really get along with people.', -0.15]] },
    { q: 'Why should we hire you over the other candidates?', a: [['I learn fast and I deliver results.', 0.1], ['Because I\'m the best. Obviously.', 'wild'], ['I can start tomorrow.', 0.03], ['You probably shouldn\'t.', -0.2]] },
    { q: 'How do you handle stress?', a: [['I prioritize, make a plan and take breaks.', 0.1], ['I thrive under pressure.', 0.04], ['Stress baking.', 'wild'], ['I usually just quit.', -0.2]] },
    { q: 'Do you have any questions for us?', a: [['What does success look like in the first 90 days?', 0.12], ['How much vacation do I get?', -0.04], ['Is there free food?', 'wild'], ['No.', -0.06]] },
    { stat: 'smarts', q: 'Brain teaser: a bat and a ball cost $1.10. The bat costs $1 more than the ball. How much is the ball?', a: [['5 cents.', 0.15], ['10 cents.', -0.08], ['Let me work it out on the whiteboard…', 'smarts'], ['Can I phone a friend?', -0.05]] },
    { stat: 'athl', q: 'This job is physical. Can you show us you can keep up?', a: [['Drop and do 50 push-ups.', 'athl'], ['Carry the water cooler across the room.', 'athl'], ['Describe my gym routine.', 0.02], ['I\'d rather not.', -0.12]] },
    { stat: 'looks', q: 'Our customers come first. How would you win over an angry customer?', a: [['Flash my best smile and really listen.', 'looks'], ['Offer them a discount.', 0.03], ['Kill them with kindness.', 0.08], ['Tell them to shop elsewhere.', -0.15]] }
  ];
  function interview(c, cb) {
    var pool = INTERVIEW.filter(function (q) { return !q.stat; });
    var special = INTERVIEW.filter(function (q) { return q.stat === c.stat; })[0];
    var q = special && U.chance(0.5) ? special : U.pick(pool);
    ui().choose('💼 Interview: ' + c.levels[0][0], q.q, U.shuffle(q.a).map(function (a) {
      return { label: a[0], fn: function () {
        var v = a[1], bonus, wild = v === 'wild';
        if (typeof v === 'number') bonus = v;
        else if (wild) bonus = U.randf(-0.15, 0.2);
        else bonus = (E.statValue(v) - 50) / 250;
        var reaction = wild ? (bonus > 0.03 ? 'The interviewer burst out laughing.' : 'There was a long, awkward silence.')
          : bonus >= 0.1 ? 'The interviewer nodded, impressed.' : bonus > 0.02 ? 'The interviewer smiled.' : bonus > -0.03 ? 'The interviewer wrote something down.' : 'The interviewer frowned.';
        cb(bonus, reaction);
      } };
    }));
  }
  function partTimeBoard() {
    ui().menu('Part-time jobs', function () {
      return D.PART_TIME.map(function (pt) {
        var dis = me().age < pt.minAge || used('apply' + pt.id) > 0;
        return { icon: '⏰', label: pt.name, sub: '~' + E.fmt(E.$(pt.salary)) + '/yr · age ' + pt.minAge + '+', disabled: dis, onClick: function () {
          use('apply' + pt.id);
          var r = E.applyPartTime(pt.id);
          if (r.ok) ui().back();
          done(r.ok ? good(r.msg) : bad(r.msg));
        } };
      });
    });
  }
  function fameMenu() {
    ui().menu('Special careers', function () {
      var hb = S().hoops, pro = hb && hb.stage === 'pro';
      return [{ icon: '🎬', label: 'Acting', sub: S().acting ? TL.acting.summary() : 'Casting calls, agents, classes · age 8+', disabled: me().age < 8, onClick: TL.acting.menu }, { icon: '🎵', label: 'Music', sub: S().music ? TL.music.summary() : 'Write songs, play shows, get signed · age 10+', disabled: me().age < 10, onClick: TL.music.menu }, { icon: '🏆', label: 'Pro Sports', sub: TL.pro.active() ? TL.pro.summary() : 'Football, soccer, baseball, hockey, tennis · tryouts 17–32', onClick: TL.pro.tryoutMenu }, { icon: '🏀', label: 'Basketball', sub: pro ? 'Already a pro' : me().age < 18 ? 'Make your high school team to get recruited' : 'Open tryouts · age 18–30', disabled: pro || me().age < 18 || me().age > 30, onClick: TL.hoops.tryout }].concat(D.FAME_CAREERS.filter(function (c) { return c.id !== 'actor' && c.id !== 'musician' && c.id !== 'athlete'; }).map(function (c) {
        var bonus = c.id === 'actor' ? (S().flags.acting || 0) : c.id === 'musician' ? (S().flags.music || 0) : 0;
        var tip = c.id === 'athlete' ? 'Needs high athleticism' : 'Talent & practice matter';
        return { icon: { actor: '🎬', musician: '🎤', athlete: '🏆' }[c.id], label: c.name, sub: c.verb + ' · age ' + c.minAge + (c.maxAge ? '–' + c.maxAge : '+') + ' · ' + tip, disabled: used('fame' + c.id) > 0 || (S().job && S().job.career === c.id), onClick: function () {
          use('fame' + c.id);
          if (bonus) S().fame = Math.min(100, S().fame + bonus);
          var r = E.fameAudition(c.id);
          if (r.ok) ui().back();
          done(r.ok ? good(r.msg) : bad(r.msg));
        } };
      }));
    });
  }
  function politicsItems(j) {
    var items = [];
    items.push({ icon: '🎙️', label: 'Give a speech', onClick: function () {
      var f = diminish('speech');
      if (U.chance(0.35 + me().smarts / 250)) { j.perf = U.clamp(Math.round(j.perf + 7 * f), 0, 100); E.fame(1); return done(good('My speech on ' + U.pick(['the economy', 'healthcare', 'education', 'crime', 'the environment', 'taxes']) + ' was a hit.')); }
      j.perf = Math.max(0, j.perf - 4); done(bad('I stumbled over my words. The clip is going around online.'));
    } });
    items.push({ icon: '🤝', label: 'Meet voters', onClick: function () { var f = diminish('voters'); j.perf = U.clamp(Math.round(j.perf + U.rand(1, 5) * f), 0, 100); done('I shook hands and kissed babies at a ' + U.pick(['county fair', 'diner', 'town hall', 'farmers market']) + '.'); } });
    items.push({ icon: '📜', label: 'Propose a policy', onClick: function () {
      if (used('bill')) return done(nope('I already pushed a big policy this year.'));
      use('bill');
      var pol = U.pick(['a tax cut', 'free school lunches', 'a new public park', 'stricter pollution rules', 'a minimum wage increase', 'road repairs', 'a housing program']);
      if (U.chance(0.3 + j.perf / 200)) { j.perf = Math.min(100, j.perf + U.rand(8, 15)); E.karma(2); return done(good('My proposal for ' + pol + ' passed! Voters love it.')); }
      j.perf = Math.max(0, j.perf - 5); done(bad('My proposal for ' + pol + ' was voted down.'));
    } });
    items.push({ icon: '💼', label: 'Take a bribe', danger: true, onClick: function () {
      var amt = E.$(U.rand(10000, 80000) * (j.level + 1));
      E.addMoney(amt); E.karma(-8);
      if (U.chance(0.2)) { E.jail(U.rand(2, 8), 'Bribery'); return done(bad('The FBI was running a sting. I was arrested for taking ' + E.fmt(amt) + '.')); }
      done('I quietly accepted ' + E.fmt(amt) + ' from a lobbyist.');
    } });
    if (j.level < D.POLITICS.levels.length - 1) items.push({ icon: '🗳️', label: 'Run for ' + D.POLITICS.levels[j.level + 1][0], sub: j.levelYears < 2 ? 'Serve 2 years first' : 'Win to move up', disabled: j.levelYears < 2 || used('campaign') > 0, onClick: function () { campaignMenu(j.level + 1); } });
    return items;
  }
  function campaignMenu(level) {
    var office = D.POLITICS.levels[level][0];
    ui().menu('Campaign for ' + office, function () {
      return [{ info: true, html: '<p class="muted">Looks, smarts, karma and fame all sway voters. A bigger war chest helps. A criminal record hurts.</p>' }].concat(E.campaigns.map(function (c, i) {
        var cost = E.campaignCost(i, level);
        return { icon: ['🚪', '📣', '📺', '🚀'][i], label: c[0], sub: 'Win chance ~' + Math.round(E.electionChance(level, i) * 100) + '%', right: cost ? E.fmt(cost) : 'Free', disabled: used('campaign') > 0 || cost > S().money, onClick: function () {
          use('campaign');
          var r = E.runForOffice(level, i);
          if (r.ok) ui().closeAll();
          done(r.ok ? good(r.msg) : bad(r.msg));
        } };
      }));
    });
  }
  function fameGig() {
    var j = S().job, c = D.career(j.career);
    if (used('famegig')) return done(nope('I need to wait until next year for another big opportunity.'));
    use('famegig');
    var p = 0.25 + (E.statValue(c.stat) - 50) / 150 + S().fame / 250;
    if (U.chance(p)) {
      var pay = Math.round(E.jobSalary(j) * U.randf(0.2, 0.8));
      E.addMoney(pay); E.fame(U.rand(5, 12)); j.perf = Math.min(100, j.perf + 10);
      var what = { actor: 'I landed a role in a ' + U.pick(['blockbuster', 'indie darling', 'hit TV series', 'superhero movie', 'rom-com']) + '!', musician: 'My new album "' + U.pick(['Midnight', 'Neon', 'Echoes', 'Gold', 'Wildfire', 'Paper Hearts']) + ' ' + U.pick(['Dreams', 'City', 'Tapes', 'Summer', 'Hearts']) + '" was a hit!', athlete: 'I signed a lucrative contract extension!' }[j.career];
      done(good(what + ' (+' + E.fmt(pay) + ')'));
    } else {
      E.fame(-2);
      done(bad({ actor: 'I didn\'t get the part.', musician: 'The album flopped. Critics were brutal.', athlete: 'The team lowballed me. No deal.' }[j.career]));
    }
  }
  function workHarder() {
    var j = S().job, f = diminish('work');
    if (f < 0.25) return done(nope('I\'m exhausted. I can\'t work any harder this year.'));
    j.workHard = (j.workHard || 0) + 1;
    j.perf = U.clamp(Math.round(j.perf + 6 * f), 0, 100);
    E.stat('happy', -1);
    if (j.fame) E.fame(Math.round(2 * f));
    done('I put in extra effort at work.');
  }
  function askRaise() {
    var j = S().job;
    if (used('raise')) return done(nope('I already asked for a raise this year.'));
    use('raise');
    if (j.perf > 65 && U.chance(0.25 + (j.perf - 65) / 70)) {
      j.mult = (j.mult || 1) * U.randf(1.05, 1.15);
      done(good('My boss gave me a raise! New salary: ' + E.fmt(E.jobSalary(j)) + '.'));
    } else { j.perf = Math.max(0, j.perf - 5); done(bad('My boss denied my raise request.')); }
  }
  function oddJobs() {
    var jobs = [['🍋', 'Lemonade stand', 20, 8], ['🌱', 'Mow lawns', 40, 10], ['🚗', 'Wash cars', 30, 9], ['🍪', 'Sell cookies', 25, 8], ['❄️', 'Shovel snow', 35, 10], ['👶', 'Babysit', 50, 12]];
    ui().menu('Odd jobs', function () {
      return jobs.map(function (j) {
        return { icon: j[0], label: j[1], sub: 'Age ' + j[3] + '+', disabled: me().age < j[3], onClick: function () {
          var f = diminish('odd');
          if (f < 0.2) return done(nope('I\'m tired of odd jobs this year.'));
          var earned = Math.round(E.$(j[2] * U.randf(0.5, 2)) * f);
          E.addMoney(earned);
          done('I earned ' + E.fmt(earned) + ' from my ' + j[1].toLowerCase() + '.');
        } };
      });
    });
  }

  // ======================================================================
  // ASSETS
  // ======================================================================
  function assetsMenu() {
    if (TL.ancient && TL.ancient.on()) return TL.ancient.assetsMenu();
    ui().menu('Assets', function () {
      var s = S(), items = [];
      var prop = 0, owed = s.studentDebt || 0, inv = TL.creator ? TL.creator.cryptoValue() : 0;
      s.assets.forEach(function (a) { prop += a.value; owed += a.loan || 0; });
      Object.keys(s.stocks).forEach(function (k) { inv += s.stocks[k] * s.prices[k]; });
      var cell = function (l, v, neg) { return '<div><small>' + l + '</small><b' + (neg ? ' class="neg"' : '') + '>' + (neg ? '−' : '') + E.fmt(Math.abs(v)) + '</b></div>'; };
      items.push({ info: true, html: '<div class="nw"><small>Net worth</small><div class="nw-big' + (E.netWorth() < 0 ? ' neg' : '') + '">' + E.fmt(E.netWorth()) + '</div><div class="nw-grid">' + cell('Cash', s.money, s.money < 0) + cell('Property', prop) + cell('Investments', Math.round(inv)) + cell('Debt', owed, owed > 0) + '</div></div>' });
      var rc = E.rentCost();
      items.push({ icon: E.home().type === 'homeless' ? '⛺' : E.home().type === 'palace' ? '🏰' : '🏡', label: E.homeLabel(), sub: me().age < 18 ? 'Where I live' : (rc ? E.fmt(rc) + '/yr rent · ' : '') + 'Tap to move', onClick: livingMenu });
      if (s.assets.length) {
        items.push({ section: 'My stuff' });
        s.assets.forEach(function (a) {
          items.push({ icon: assetIcon(a), label: a.name, sub: a.kind === 'business' && TL.business ? a.type + ' · ' + TL.business.summary(a) : a.type + ' · worth ' + E.fmt(a.value) + (a.loan ? ' · owe ' + E.fmt(a.loan) : '') + (a.kind === 'house' ? (a.rented ? ' · rented out' : '') + ' · condition ' + a.cond + '%' : a.kind === 'car' ? ' · condition ' + a.cond + '%' : a.kind === 'business' ? ' · profit ' + E.fmt(a.lastProfit || 0) + '/yr' : ''), onClick: function () { assetMenu(a); } });
        });
      }
      var held = Object.keys(s.stocks).filter(function (k) { return s.stocks[k] > 0; });
      if (held.length) {
        items.push({ section: 'Portfolio' });
        held.forEach(function (k) {
          var x = D.STOCKS.filter(function (y) { return y.sym === k; })[0];
          if (TL.market && x) items.push({ icon: TL.logos && !/fund/i.test(x.name) ? TL.logos.badge(x.name) : '📊', label: x.name, sub: s.stocks[k].toLocaleString() + ' shares', right: E.fmt(Math.round(s.stocks[k] * s.prices[k])), onClick: function () { TL.market.detail(k); } });
          else items.push({ icon: '📊', label: k + ' × ' + s.stocks[k], sub: 'Worth ' + E.fmt(s.stocks[k] * s.prices[k]), onClick: stockMenu });
        });
      }
      if (s.prison) return items;
      items.push({ section: 'Shopping' });
      if (me().age >= 18) {
        items.push({ icon: '🏠', label: 'Real estate', sub: 'Buy a home', onClick: realEstate });
        items.push({ icon: '🚗', label: 'Vehicles', sub: 'Cars, bikes, jets & yachts', onClick: dealership });
        items.push({ icon: '💎', label: 'Jewelry & luxury', onClick: jewelryStore });
        items.push({ icon: '📈', label: 'Stock market', sub: TL.market && TL.market.held().length ? 'Portfolio ' + E.fmt(TL.market.portfolio()) : 'Stocks, index funds and bonds', onClick: TL.market ? TL.market.menu : stockMenu });
        if (!TL.history || TL.history.exists('crypto')) items.push({ icon: '🪙', label: 'Crypto', sub: TL.creator.cryptoValue() ? 'Wallet ' + E.fmt(TL.creator.cryptoValue()) : 'Bitcoin, Ethereum, Solana, Dogecoin', onClick: TL.creator.cryptoMenu });
        items.push({ icon: '🏢', label: 'Start a business', onClick: businessMenu });
      } else items.push({ info: true, html: '<p class="muted">I need to be 18 to buy property, vehicles, or stocks.</p>' });
      return items;
    });
  }
  function assetIcon(a) {
    if (a.kind === 'house') return a.type === 'Castle' ? '🏰' : a.type === 'Mansion' ? '🏛️' : a.type.indexOf('Apartment') >= 0 || a.type === 'Condo' || a.type === 'Penthouse' ? '🏢' : '🏠';
    if (a.kind === 'car') return a.type === 'Private Jet' ? '🛩️' : a.type === 'Superyacht' ? '🛥️' : a.type === 'Motorcycle' || a.type === 'Scooter' ? '🏍️' : '🚗';
    if (a.kind === 'business') return TL.business && TL.business.TYPES[a.type] ? TL.business.TYPES[a.type].icon : '🏢';
    return '💎';
  }
  function assetMenu(a) {
    ui().menu(a.name, function () {
      var s = S(), items = [];
      var saleValue = Math.round(a.value * (a.kind === 'house' ? (0.85 + a.cond / 700) : a.kind === 'jewelry' ? 0.7 : 0.95));
      if (a.kind === 'business' && TL.business) TL.business.items(a).forEach(function (it) { items.push(it); });
      else items.push({ info: true, html: '<div class="kv"><b>' + U.esc(a.name) + '</b><br>' + a.type + '<br>Value: ' + E.fmt(a.value) + (a.price ? ' · paid ' + E.fmt(a.price) : '') + (a.loan ? '<br>Loan balance: ' + E.fmt(a.loan) + ' (' + E.fmt(a.payment) + '/yr)' : '') + (a.cond != null && a.kind !== 'business' && a.kind !== 'jewelry' ? '<br>Condition: ' + a.cond + '%' : '') + (a.kind === 'business' ? '<br>Last year\'s profit: ' + E.fmt(a.lastProfit || 0) : '') + '</div>' });
      if (a.kind === 'house') {
        items.push({ icon: '🔨', label: 'Renovate', right: E.fmt(Math.round(a.value * 0.08)), onClick: function () { var c = Math.round(a.value * 0.08); if (!afford(c)) return done(noMoney(c)); E.addMoney(-c); a.cond = 100; a.value = Math.round(a.value * 1.06); done(good('I renovated ' + a.name + '. It looks amazing!')); } });
        items.push({ icon: a.rented ? '🔑' : '🧾', label: a.rented ? 'Stop renting it out' : 'Rent it out', sub: a.rented ? '' : 'Earn ~' + E.fmt(Math.round(a.value * 0.055)) + '/yr', onClick: function () { a.rented = !a.rented; E.validateHome(); done(a.rented ? 'I\'m renting out ' + a.name + '.' : 'I stopped renting out ' + a.name + '.'); } });
        items.push({ icon: '🎉', label: 'Throw a house party', onClick: function () { var f = diminish('houseparty'); E.stat('happy', 8 * f); E.people(['friend']).forEach(function (p) { E.rel(p, 5 * f); }); if (U.chance(0.15)) { a.cond = Math.max(0, a.cond - 15); return done(bad('The party got wild. Someone put a hole in the wall.')); } done(good('I threw an epic house party!')); } });
      }
      if (a.kind === 'car') {
        items.push({ icon: '🔧', label: 'Maintenance', right: E.fmt(Math.round(a.price * 0.05)), onClick: function () { var c = Math.round(a.price * 0.05); if (!afford(c)) return done(noMoney(c)); E.addMoney(-c); a.cond = Math.min(100, a.cond + 30); done('My ' + a.type + ' was serviced.'); } });
        items.push({ icon: '🛣️', label: 'Take it for a drive', onClick: function () { var f = diminish('drive'); E.stat('happy', 4 * f); if (U.chance(0.06 + (100 - a.cond) / 800)) { a.cond = Math.max(0, a.cond - 30); E.stat('health', -U.rand(5, 20)); return done(bad('I crashed! I\'m hurt and my ' + a.type + ' is damaged.')); } done('I went for a joyride. 😎'); } });
      }
      if (a.kind === 'business' && !TL.business) {
        items.push({ icon: '📣', label: 'Marketing campaign', right: E.fmt(Math.round(a.value * 0.05)), onClick: function () { var c = Math.round(a.value * 0.05); if (!afford(c)) return done(noMoney(c)); E.addMoney(-c); a.hype = (a.hype || 0) + U.rand(1, 5); done('I launched a marketing campaign for ' + a.name + '.'); } });
        items.push({ icon: '💵', label: 'Invest more', right: E.fmt(Math.round(a.value * 0.2)), onClick: function () { var c = Math.round(a.value * 0.2); if (!afford(c)) return done(noMoney(c)); E.addMoney(-c); a.value += Math.round(c * U.randf(0.7, 1.3)); done('I invested ' + E.fmt(c) + ' into ' + a.name + '.'); } });
      }
      if (a.kind === 'business') items.push({ section: 'Sell' });
      if (a.loan) items.push({ icon: '🏦', label: 'Pay off loan', right: E.fmt(a.loan), onClick: function () { if (!afford(a.loan)) return done(noMoney(a.loan)); E.addMoney(-a.loan); a.loan = 0; done(good('I paid off the loan on ' + a.name + '.')); } });
      items.push({ icon: '🏷️', label: 'Sell', right: E.fmt(saleValue - (a.loan || 0)), danger: true, onClick: function () {
        ui().confirm('Sell ' + a.name + '?', 'You\'ll receive ' + E.fmt(saleValue - (a.loan || 0)) + ' after paying off any loan.', function () {
          E.addMoney(saleValue - (a.loan || 0));
          S().assets = S().assets.filter(function (x) { return x !== a; });
          E.validateHome();
          ui().back();
          done('I sold ' + a.name + ' for ' + E.fmt(saleValue) + '.');
        });
      } });
      return items;
    });
  }
  function listings(key, gen) {
    var s = S();
    if (!s.yearActs[key]) s.yearActs[key] = gen();
    return s.yearActs[key];
  }
  function realEstate() {
    var ls = listings('houses', function () {
      return D.HOUSES.map(function (h) {
        var price = E.$(Math.round(U.randf(h.min, h.max) / 1000) * 1000);
        var num = U.rand(10, 9999);
        return { id: U.uid(), type: h.type, upkeep: h.upkeep, price: price, beds: h.beds, cond: U.rand(35, 100), year: S().year - U.rand(0, 120), addr: num + ' ' + U.pick(D.STREETS) + ' ' + U.pick(D.STREET_TYPES) + (S().city ? ', ' + S().city : '') };
      });
    });
    ui().menu('Real estate', function () {
      return [{ info: true, html: '<p class="muted">Mortgages need 20% down and a job (or plenty of savings).</p>' }].concat(ls.map(function (h) {
        return { icon: '🏠', label: h.type, sub: h.addr + ' · ' + (h.beds ? h.beds + ' bed' : 'Studio') + ' · built ' + h.year + ' · condition ' + h.cond + '%', right: E.fmt(h.price), disabled: h.sold, onClick: function () { buyHouse(h); } };
      }));
    });
  }
  function buyHouse(h) {
    var s = S(), down = Math.round(h.price * 0.2);
    var canMortgage = (s.job && !s.job.partTime && E.jobSalary(s.job) * 5 > h.price) || s.money > h.price * 0.5 || (s.fame > 50);
    ui().choose(h.type + ' — ' + E.fmt(h.price), h.addr, [
      { label: 'Pay cash (' + E.fmt(h.price) + ')', fn: function () {
        if (!afford(h.price)) return done(noMoney(h.price));
        E.addMoney(-h.price); addHouse(h, 0);
      } },
      { label: 'Mortgage (' + E.fmt(down) + ' down)', fn: function () {
        if (!afford(down)) return done(noMoney(down));
        if (!canMortgage) return done(bad('The bank rejected my mortgage application. I need a better income.'));
        E.addMoney(-down); addHouse(h, h.price - down);
      } }
    ]);
  }
  function addHouse(h, loan) {
    h.sold = true;
    S().assets.push({ id: U.uid(), kind: 'house', type: h.type, name: h.addr, value: h.price, price: h.price, cond: h.cond, upkeep: h.upkeep, loan: loan, payment: loan ? Math.round(loan / 30 * 1.6) : 0 });
    E.stat('happy', 10);
    E.achieve('homeowner');
    done(good('I bought a ' + h.type.toLowerCase() + ' at ' + h.addr + '! 🏡'));
    var house = S().assets[S().assets.length - 1];
    if (E.home().type !== 'owned') ui().choose('New house', 'What do I want to do with ' + h.addr + '?', [
      { label: '🏡 Move in', fn: function () { E.moveHome({ type: 'owned', id: house.id }); done(good('I moved into my new ' + h.type.toLowerCase() + '!')); } },
      { label: '🧾 Rent it out', fn: function () { house.rented = true; done('I\'m renting out ' + h.addr + '.'); } },
      { label: 'Keep it empty for now', fn: function () { } }
    ]);
  }
  // Where I live: parents, a rental, one of my houses, or the street.
  function livingMenu() {
    ui().menu('Where I live', function () {
      var s = S(), h = E.home(), items = [];
      items.push({ info: true, html: '<div class="kv"><b>' + U.esc(E.homeLabel()) + '</b>' + (E.rentCost() ? '<br>Rent: ' + E.fmt(E.rentCost()) + '/yr' : '') + '</div>' });
      if (me().age < 18) return items.concat([{ info: true, html: '<p class="muted">I can move out when I turn 18.</p>' }]);
      if (s.prison) return items.concat([{ info: true, html: '<p class="muted">I live in a prison cell for now.</p>' }]);
      if (h.type !== 'parents' && E.parentsAround().length) items.push({ icon: '👪', label: 'Move back in with my parents', sub: 'No rent, but less freedom', onClick: function () {
        var p = E.parentsAround().sort(function (a, b) { return b.rel - a.rel; })[0];
        if (!U.chance(p.rel / 100 + 0.25)) { E.rel(p, -3); return done(bad('My ' + E.relWord(p) + ' said there\'s no room for me.')); }
        done(E.moveHome({ type: 'parents' }, 'I moved back in with my parents.'));
      } });
      if (s.royal && h.type !== 'palace') items.push({ icon: '🏰', label: 'Move back into the palace', onClick: function () { done(E.moveHome({ type: 'palace' }, 'I moved back into the royal palace.')); } });
      items.push({ section: 'Rent a place' });
      E.RENT_TIERS.forEach(function (t, i) {
        var cost = E.$(t[1]), deposit = Math.round(cost / 6), current = h.type === 'rent' && h.tier === i;
        items.push({ icon: ['🛏️', '🏢', '🏙️', '🌆'][i], label: t[0], sub: E.fmt(cost) + '/yr' + (t[2] > 0 ? ' · happier' : t[2] < 0 ? ' · cramped' : ''), right: current ? '✔' : '', disabled: current, onClick: function () {
          if (S().money < deposit) return done(nope('I need ' + E.fmt(deposit) + ' for the deposit and first month.'));
          E.addMoney(-deposit);
          done(E.moveHome({ type: 'rent', tier: i }, 'I moved into a ' + t[0].toLowerCase() + '. 📦'));
        } });
      });
      var mine = s.assets.filter(function (a) { return a.kind === 'house' && !(h.type === 'owned' && h.id === a.id); });
      if (mine.length) {
        items.push({ section: 'My properties' });
        mine.forEach(function (a) {
          items.push({ icon: '🏠', label: 'Move into ' + a.name, sub: a.type + (a.rented ? ' · tenants will move out' : ''), onClick: function () {
            a.rented = false;
            done(E.moveHome({ type: 'owned', id: a.id }, 'I moved into my ' + a.type.toLowerCase() + ' at ' + a.name + '. 🏡'));
          } });
        });
      }
      return items;
    });
  }
  function dealership() {
    var ls = listings('cars', function () {
      return D.CARS.map(function (c) {
        var price = E.$(Math.round(U.randf(c.min, c.max) / 100) * 100);
        var used = c.type === 'Used Hatchback' || U.chance(0.3);
        return { id: U.uid(), type: c.type, model: TL.real ? TL.real.carModel(c.type) : c.type, price: used ? Math.round(price * 0.7) : price, cond: used ? U.rand(40, 85) : 100, color: U.pick(D.CAR_COLORS), used: used, year: S().year - (used ? U.rand(2, 15) : 0) };
      });
    });
    ui().menu('Vehicles', function () {
      return ls.map(function (c) {
        return { icon: assetIcon({ kind: 'car', type: c.type }), label: c.year + ' ' + (c.model || c.type), sub: c.type + ' · ' + c.color + ' · ' + (c.used ? 'Used, condition ' + c.cond + '%' : 'Brand new'), right: E.fmt(c.price), disabled: c.sold, onClick: function () {
          var s = S(), down = Math.round(c.price * 0.15);
          var opts = [{ label: 'Pay cash (' + E.fmt(c.price) + ')', fn: function () { if (!afford(c.price)) return done(noMoney(c.price)); E.addMoney(-c.price); addCar(c, 0); } }];
          if (c.price < E.$(500000)) opts.push({ label: 'Finance (' + E.fmt(down) + ' down)', fn: function () {
            if (!afford(down)) return done(noMoney(down));
            if (!(s.job && E.jobSalary(s.job) > c.price / 3)) return done(bad('My loan application was denied.'));
            E.addMoney(-down); addCar(c, c.price - down);
          } });
          ui().choose(c.type, 'Buy this ' + c.color.toLowerCase() + ' ' + c.type.toLowerCase() + '?', opts);
        } };
      });
    });
  }
  function addCar(c, loan) {
    c.sold = true;
    S().assets.push({ id: U.uid(), kind: 'car', type: c.type, name: c.color + ' ' + (c.model || c.type), value: c.price, price: c.price, cond: c.cond, loan: loan, payment: loan ? Math.round(loan / 5 * 1.15) : 0 });
    E.stat('happy', 6);
    done(good('I bought a ' + c.color.toLowerCase() + ' ' + (c.model || c.type) + '! 🚗'));
  }
  function jewelryStore() {
    ui().menu('Jewelry & luxury', function () {
      return D.JEWELRY.map(function (j) {
        var cost = E.$(j.price);
        return { icon: j.ring ? '💍' : j.type.indexOf('Painting') >= 0 ? '🖼️' : '💎', label: j.type, right: E.fmt(cost), onClick: function () {
          if (!afford(cost)) return done(noMoney(cost));
          E.addMoney(-cost);
          S().assets.push({ id: U.uid(), kind: 'jewelry', type: j.type, name: j.type, value: cost, price: cost, ring: !!j.ring });
          E.stat('happy', 3);
          done('I bought a ' + j.type.toLowerCase() + '.' + (j.ring ? ' Maybe it\'s time to propose...' : ''));
        } };
      });
    });
  }
  function stockMenu() {
    ui().menu('Stock market', function () {
      var s = S();
      return [{ info: true, html: '<p class="muted">Prices move once a year when you age up. Cash: <b>' + E.fmt(s.money) + '</b></p>' }].concat(D.STOCKS.map(function (st) {
        var held = s.stocks[st.sym] || 0, price = s.prices[st.sym];
        return { icon: '📈', label: st.sym + ' — ' + st.name, sub: 'Price ' + E.fmt(price * 100 / 100) + ' · Risk ' + (st.vol > 0.5 ? 'very high' : st.vol > 0.25 ? 'high' : 'moderate') + (held ? ' · Own ' + held + ' (' + E.fmt(held * price) + ')' : ''), onClick: function () {
          var opts = [0.1, 0.25, 0.5, 1].map(function (fr) {
            return { label: 'Buy with ' + Math.round(fr * 100) + '% of cash', fn: function () {
              var sh = price > 0 ? Math.floor(Math.max(0, s.money) * fr / price) : 0;
              if (!(sh >= 1) || !isFinite(sh)) return done(bad('I can\'t afford any shares.'));
              E.addMoney(-Math.round(sh * price)); s.stocks[st.sym] = held + sh;
              done('I bought ' + sh + ' shares of ' + st.sym + '.');
            } };
          });
          if (held) opts.push({ label: 'Sell all ' + held + ' shares', fn: function () { E.addMoney(Math.round(held * price)); delete s.stocks[st.sym]; done('I sold my ' + st.sym + ' shares for ' + E.fmt(held * price) + '.'); } });
          ui().choose(st.name, 'Current price: ' + E.fmt(price), opts);
        } };
      }));
    });
  }
  function businessMenu() {
    if (me().age < 18) return done(nope('I\'m too young to start a business.'));
    ui().menu('Start a business', function () {
      return D.BUSINESS_TYPES.map(function (b) {
        var cost = E.$(b.cost);
        var bt = TL.business && TL.business.TYPES[b.type];
        var sub = bt && bt.startup ? 'Burn cash, raise funding, aim for an exit' : bt ? U.plural(bt.staff, 'employee') + ' · ~' + E.fmt(E.$(Math.round(bt.rev / 1000) * 1000)) + ' revenue/yr' : b.volatile ? 'High risk, high reward' : 'Steady';
        return { icon: bt ? bt.icon : '🏢', label: b.type, sub: sub, right: E.fmt(cost), onClick: function () {
          if (!afford(cost)) return done(noMoney(cost));
          ui().prompt('Name your ' + b.type.toLowerCase(), 'What will you call it?', me().last + '\'s ' + b.type, function (name) {
            if (!name) return;
            E.addMoney(-cost);
            var biz = { id: U.uid(), kind: 'business', type: b.type, name: name.slice(0, 40), value: cost, price: cost, lastProfit: 0 };
            if (TL.business) TL.business.init(biz);
            S().assets.push(biz);
            E.achieve('entrepreneur');
            ui().back();
            done(good('I opened "' + name.slice(0, 40) + '"! 🎉'));
          });
        } };
      });
    });
  }

  // ======================================================================
  // ACTIVITIES
  // ======================================================================
  function activitiesMenu() {
    if (TL.ancient && TL.ancient.on()) return TL.ancient.activitiesMenu();
    if (S().prison) return prisonMenu();
    ui().menu('Activities', function () {
      var m = me(), a = m.age, items = [];
      if (a < 3) return [{ info: true, html: '<p>I\'m just a baby. 👶 Maybe cry for attention?</p>' }, { icon: '😭', label: 'Cry', onClick: function () { E.people(['mother', 'father']).forEach(function (p) { E.rel(p, -1); }); done('I cried until someone picked me up.'); } }, { icon: '🧸', label: 'Play with toys', onClick: function () { E.stat('happy', 3 * diminish('toys')); done('I played with my toys.'); } }];
      items.push({ section: 'Mind & Body' });
      items.push({ icon: '🏋️', label: 'Gym', disabled: a < 12, sub: a < 12 ? 'Age 12+' : '', onClick: function () { var f = ease('gym'); m.athl = U.clamp(m.athl + Math.round(U.rand(3, 6) * f), 0, 100); E.stat('health', 4 * f); E.stat('looks', 2 * f); if (U.chance(0.04)) { E.addCondition('Broken Arm'); return done(bad('I dropped a dumbbell and broke my arm!')); } done('I worked out at the gym. 💪'); } });
      items.push({ icon: '📚', label: 'Library', onClick: function () { var f = ease('lib'); E.stat('smarts', U.rand(2, 5) * f); done('I read ' + U.pick(['a mystery novel', 'a history book', 'a science book', 'a biography', 'a book of poetry', 'a self-help book', 'a comic book']) + ' at the library.'); } });
      items.push({ icon: '🧘', label: 'Meditate', disabled: a < 8, onClick: function () { var f = ease('med'); E.stat('happy', U.rand(5, 10) * f); E.stat('health', 1.5 * f); done('I meditated and feel at peace. 🧘'); } });
      items.push({ icon: '🚶', label: 'Go for a walk', onClick: function () { var f = ease('walk'); E.stat('health', 3 * f); E.stat('happy', 4 * f); if (U.chance(0.05)) { var amt = E.$(U.rand(5, 50)); E.addMoney(amt); return done(good('I went for a walk and found ' + E.fmt(amt) + ' on the ground!')); } done('I went for a walk around ' + U.pick(['the park', 'the neighborhood', 'the lake', 'downtown']) + '.'); } });
      if (a >= 6) items.push({ icon: '🥋', label: 'Martial arts', right: E.fmt(E.$(150)), onClick: function () { if (!afford(E.$(150))) return done(noMoney(E.$(150))); E.addMoney(-E.$(150)); var f = ease('karate'); m.athl = U.clamp(m.athl + Math.round(5 * f), 0, 100); E.stat('health', 3 * f); done('I trained ' + U.pick(['karate', 'jiu-jitsu', 'taekwondo', 'boxing', 'kung fu']) + '. 🥋'); } });
      if (a >= 12) items.push({ icon: '🥗', label: 'Go on a diet', onClick: function () { var f = ease('diet'); E.stat('health', 4 * f); E.stat('looks', 3 * f); E.stat('happy', -1); done('I started ' + U.pick(['a keto diet', 'a vegan diet', 'intermittent fasting', 'a Mediterranean diet', 'the "cabbage soup" diet']) + '.'); } });
      if (a >= 5) items.push({ icon: '🎹', label: 'Learn an instrument', onClick: function () { var f = ease('instr'); E.stat('smarts', 3 * f); S().flags.music = (S().flags.music || 0) + f; done('I practiced the ' + U.pick(['piano', 'guitar', 'violin', 'drums', 'saxophone', 'ukulele']) + '. 🎶'); } });
      if (a >= 5) items.push({ icon: '🎨', label: 'Acting lessons', right: E.fmt(E.$(100)), onClick: function () { if (!afford(E.$(100))) return done(noMoney(E.$(100))); E.addMoney(-E.$(100)); var f = diminish('actl'); S().flags.acting = (S().flags.acting || 0) + f; if (S().acting) S().acting.skill = Math.min(100, S().acting.skill + 1.5 * f); E.stat('looks', f); done('I took an acting class. 🎭'); } });

      // Mind & Body results say how much each stat moved.
      if (a >= 5) items.push({ icon: '🎯', label: 'Hobbies & skills', sub: 'Coding, writing, singing, painting…', onClick: TL.features.skillsMenu });
      if (S().royal && a >= 6) items.push({ icon: '👑', label: 'Royal duties', sub: TL.features.royalTitle() + ' · popularity ' + S().royal.popularity + '%', onClick: TL.features.royalMenu });

      items.push({ section: 'Health' });
      items.push({ icon: '🩺', label: 'Doctor', sub: TL.health ? TL.health.summary() : S().conditions.length ? S().conditions.join(', ') : 'No known conditions', onClick: TL.health ? TL.health.menu : doctorMenu });
      if (a >= 12) items.push({ icon: '🛋️', label: 'Therapist', right: E.fmt(E.$(200)), onClick: therapy });
      if (a >= 18) items.push({ icon: '💉', label: 'Plastic surgery', onClick: surgeryMenu });
      if (S().conditions.some(function (n) { var i = D.illness(n); return i && i.rehab; })) items.push({ icon: '🏥', label: 'Rehab', onClick: rehab });

      items.push({ section: 'Fun & Social' });
      if (a >= 13 && (!TL.history || TL.history.exists('social'))) items.push({ icon: '📱', label: 'Social media', sub: S().social.platform ? S().followers.toLocaleString() + ' followers' : 'Create an account', onClick: socialMenu });
      if (a >= 13 && (!TL.history || TL.history.exists('youtube') || TL.creator.summary() !== 'Start a channel')) items.push({ icon: '🎬', label: 'Content creator', sub: TL.creator.summary(), onClick: TL.creator.menu });
      if (a >= 18) items.push({ icon: '🪩', label: 'Nightclub', onClick: nightclub });
      if (a >= 18) items.push({ icon: '🧖', label: 'Spa day', right: E.fmt(E.$(250)), onClick: TL.world.spa });
      if (a >= 6) items.push({ icon: '🎣', label: 'Go fishing', onClick: TL.world.fishing });
      if (a >= 8) items.push({ icon: '🌻', label: 'Gardening', onClick: TL.world.gardening });
      if (a >= 13) items.push({ icon: '🛍️', label: 'Shopping', sub: 'Clothes and sneakers', onClick: TL.world.shoppingMenu });
      if (a >= 18) items.push({ icon: '🖋️', label: 'Tattoo parlor', sub: S().tattoos && S().tattoos.length ? U.plural(S().tattoos.length, 'tattoo') : 'Get inked', onClick: TL.extras.tattooMenu });
      if (a >= 18) items.push({ icon: '🪂', label: 'Go skydiving', right: E.fmt(E.$(300)), onClick: skydive });
      if (a >= 14) items.push({ icon: '🏃', label: 'Run a marathon', sub: 'Athleticism helps', disabled: used('marathon') > 0, onClick: marathon });
      if (a >= 18) items.push({ icon: '🎰', label: 'Casino', onClick: casinoMenu });
      if (a >= 18) items.push({ icon: '🎟️', label: 'Lottery', right: E.fmt(E.$(2)), onClick: lottery });
      if (a >= 18) items.push({ icon: '✈️', label: 'Vacation', onClick: vacationMenu });
      items.push({ icon: '🐾', label: 'Pets', onClick: petStore });
      if (a >= 16 && !S().flags.license) items.push({ icon: '🪪', label: 'Driving test', onClick: drivingTest });
      if (a >= 21) items.push({ icon: '👶', label: 'Adoption', sub: a > 55 ? 'Agencies won\'t place a child with me at my age' : undefined, disabled: a > 55, onClick: adopt });

      // Results say how much each stat moved (choices that open a dialog report when they finish).
      items.forEach(function (it) { if (it.onClick && /^(Gym|Library|Meditate|Go for a walk|Martial arts|Go on a diet|Learn an instrument|Acting lessons|Therapist|Nightclub|Spa day|Go fishing|Gardening|Go skydiving|Run a marathon)$/.test(it.label)) { var f0 = it.onClick; it.onClick = function () { gainFrom = snap(); return f0.apply(this, arguments); }; } });
      items.push({ section: 'Life' });
      if (TL.maps) items.push({ icon: '🗺️', label: 'World map', sub: 'Home, places I\'ve lived, wars of the day', onClick: TL.maps.menu });
      if (a >= 18) items.push({ icon: '🧳', label: 'Emigrate', onClick: emigrateMenu });
      if (a >= 18) items.push({ icon: '📜', label: 'Write a will', sub: S().will && E.person(S().will) ? 'Main heir: ' + E.person(S().will).first : 'Choose your heir', onClick: TL.features.willMenu });
      if (a >= 14 && (!TL.history || TL.history.exists('gig'))) items.push({ icon: '💼', label: 'Side hustles', sub: 'Uber, DoorDash, Fiverr, StockX…', onClick: TL.creator.hustleMenu });
      if (a >= 8) items.push({ icon: '🦹', label: 'Crime', onClick: crimeMenu });
      if (a >= 18) items.push({ icon: '🙏', label: 'Volunteer', onClick: function () { S().flags.volunteered = (S().flags.volunteered || 0) + 1; var f = diminish('vol'); E.karma(3 * f); E.stat('happy', 4 * f); if (U.chance(0.2 * f)) { var p = E.addPerson({ role: 'friend', age: a + U.rand(-8, 8), rel: 55 }); return done(good('I volunteered at ' + U.pick(['a soup kitchen', 'an animal shelter', 'a hospital', 'a food bank']) + ' and befriended ' + p.first + '.')); } done('I volunteered at ' + U.pick(['a soup kitchen', 'an animal shelter', 'a hospital', 'a food bank', 'a nursing home']) + '.'); } });
      if (a >= 18) items.push({ icon: '🧬', label: 'DNA test', sub: S().flags.dna ? 'Results in' : 'Discover your ancestry', right: S().flags.dna ? '' : E.fmt(E.$(99)), onClick: TL.world.dnaTest });
      items.push({ section: 'Progress' });
      items.push({ icon: '⭐', label: 'Challenges', sub: U.plural(TL.world.starCount(), 'star') + ' earned', onClick: TL.world.challengesMenu });
      items.push({ icon: '📝', label: 'Bucket list', sub: TL.features.bucketCount() + ' done', onClick: TL.features.bucketMenu });
      items.push({ icon: '⏳', label: 'Time Machine', sub: E.tmAges().length ? 'Go back up to ' + U.plural(E.tmAges().length, 'year') : 'Age up to charge it', disabled: !E.tmAges().length, onClick: function () { ui().timeMachine(); } });
      items.push({ icon: '🏆', label: 'Achievements', onClick: achievementsMenu });
      return items;
    });
  }
  function doctorMenu() {
    ui().menu('Doctor', function () {
      var s = S(), items = [];
      items.push({ icon: '🩺', label: 'General checkup', right: E.fmt(E.$(150)), onClick: function () {
        E.addMoney(-E.$(150));
        var f = diminish('checkup');
        E.stat('health', 3 * f);
        done('The doctor says my health is ' + (me().health > 80 ? 'excellent' : me().health > 50 ? 'decent' : me().health > 25 ? 'concerning' : 'critical') + '.' + (s.conditions.length ? ' I still have: ' + s.conditions.join(', ') + '.' : ''));
      } });
      s.conditions.forEach(function (n) {
        var ill = D.illness(n) || { cure: 0.5, cost: 200 };
        var cost = E.$(ill.cost);
        items.push({ section: n });
        items.push({ icon: '🏥', label: ill.incurable ? 'Manage ' + E.illLow(n) : 'Treat ' + E.illLow(n), sub: ill.incurable ? 'Incurable — treatment helps' : 'Hospital doctor', right: E.fmt(cost), onClick: function () {
          if (!afford(cost) && me().age >= 18) return done(noMoney(cost));
          if (me().age >= 18) E.addMoney(-cost);
          if (used('treat' + n) >= 2) return done(nope('The doctors say there\'s nothing more they can do this year.'));
          use('treat' + n);
          if (ill.incurable) { E.stat('health', U.rand(3, 8)); return done('The treatment helped me manage my ' + E.illLow(n) + '.'); }
          if (U.chance(ill.cure)) { E.removeCondition(n); E.stat('health', U.rand(4, 12)); if (n === 'Cancer') E.achieve('survivor'); return done(good('The treatment worked! I\'m cured of ' + E.illLow(n) + '.')); }
          done(bad('The treatment didn\'t work.'));
        } });
        if (!ill.incurable) items.push({ icon: '🌿', label: 'Try a herbalist', right: E.fmt(E.$(40)), onClick: function () {
          E.addMoney(-E.$(40));
          if (U.chance(ill.cure * 0.3)) { E.removeCondition(n); return done(good('Somehow, the herbs worked! My ' + E.illLow(n) + ' is gone.')); }
          if (U.chance(0.2)) { E.stat('health', -5); return done(bad('The herbal tea made me violently ill.')); }
          done('The herbs did nothing.');
        } });
      });
      return items;
    });
  }
  function therapy() {
    var c = E.$(200);
    if (me().age >= 18 && !afford(c)) return done(noMoney(c));
    if (me().age >= 18) E.addMoney(-c);
    var f = diminish('therapy');
    E.stat('happy', U.rand(4, 10) * f);
    var mental = S().conditions.filter(function (n) { var i = D.illness(n); return i && i.therapy; });
    if (mental.length && U.chance(0.3 * f)) { E.removeCondition(mental[0]); return done(good('Therapy helped me overcome my ' + E.illLow(mental[0]) + '.')); }
    done('I talked through my feelings with a therapist.');
  }
  function surgeryMenu() {
    var procs = [['👃', 'Nose job', 6000, 8], ['💋', 'Lip fillers', 1500, 4], ['🧖', 'Botox', 800, 3], ['🦷', 'Veneers', 15000, 7], ['🪞', 'Facelift', 12000, 10], ['🍑', 'Body contouring', 9000, 8], ['👁️', 'Eyelid surgery', 5000, 5], ['💇', 'Hair transplant', 10000, 6]];
    ui().menu('Plastic surgery', function () {
      return procs.map(function (p) {
        var cost = E.$(p[2]);
        return { icon: p[0], label: p[1], right: E.fmt(cost), onClick: function () {
          if (!afford(cost)) return done(noMoney(cost));
          E.addMoney(-cost);
          var n = use('surgery');
          if (U.chance(0.1 + n * 0.1)) { E.stat('looks', -U.rand(8, 20)); E.stat('happy', -15); return done(bad('The ' + p[1].toLowerCase() + ' was botched! I look worse. 😱')); }
          E.stat('looks', p[3]); E.stat('happy', 5);
          done(good('My ' + p[1].toLowerCase() + ' was a success! ✨'));
        } };
      });
    });
  }
  function rehab() {
    var add = S().conditions.filter(function (n) { var i = D.illness(n); return i && i.rehab; });
    var cost = E.$(15000);
    ui().choose('Rehab', 'A 90-day program costs ' + E.fmt(cost) + '.', [
      { label: 'Check in', fn: function () {
        if (!afford(cost)) return done(noMoney(cost));
        E.addMoney(-cost);
        var cured = add.filter(function (n) { return U.chance(D.illness(n).cure + 0.3); });
        cured.forEach(E.removeCondition);
        E.stat('health', 8);
        done(cured.length ? good('Rehab worked. I beat my ' + cured.join(' and ').toLowerCase() + '.') : bad('I relapsed right after leaving rehab.'));
      } },
      { label: 'Not now', fn: function () { } }
    ]);
  }
  function socialMenu() {
    if (TL.social) return TL.social.menu(); // the full version lives in js/social.js
    var s = S();
    ui().menu('Social media', function () {
      if (!s.social.platform) return [{ icon: '📲', label: 'Create an account', onClick: function () { s.social.platform = true; s.followers = U.rand(5, 60); done('I created a social media account! @' + (me().first + me().last).toLowerCase().replace(/[^a-z]/g, '') + U.rand(1, 99)); } }];
      var items = [{ info: true, html: '<div class="kv">@' + U.esc((me().first + me().last).toLowerCase().replace(/[^a-z]/g, '')) + '<br><b>' + s.followers.toLocaleString() + '</b> followers' + (s.followers >= 10000 ? '<br><span class="muted">Sponsored posts earn money each year.</span>' : '') + '</div>' }];
      var posts = [['📸', 'Post a selfie', 'looks'], ['😂', 'Post a meme', 'smarts'], ['🍔', 'Post a food pic', null], ['💪', 'Post a workout video', 'athl'], ['🗣️', 'Post a hot take', 'smarts'], ['🎥', 'Go live', null]];
      posts.forEach(function (p) {
        items.push({ icon: p[0], label: p[1], onClick: function () {
          var f = diminish('post');
          var q = p[2] ? E.statValue(p[2]) : 50;
          var base = Math.max(3, s.followers * U.randf(0.01, 0.08) + q * U.randf(0.2, 2) + s.fame * 30);
          if (U.chance(0.03 + q / 3000)) { var g = Math.round(base * U.rand(30, 200)); s.followers += g; E.fame(U.rand(2, 6)); return done(good('My post went VIRAL! +' + g.toLocaleString() + ' followers 🚀')); }
          if (p[1] === 'Post a hot take' && U.chance(0.25)) { var l = Math.round(s.followers * 0.1); s.followers -= l; return done(bad('I got canceled for my hot take. Lost ' + l.toLocaleString() + ' followers.')); }
          var gain = Math.round(base * f);
          s.followers += gain;
          done('My post got ' + Math.round(gain * U.randf(3, 12)).toLocaleString() + ' likes. +' + gain.toLocaleString() + ' followers.');
        } });
      });
      if (s.followers >= 10000) items.push({ icon: '🤑', label: 'Sponsored post', onClick: function () { if (used('sponsor')) return done(nope('I already did a sponsored post this year.')); use('sponsor'); var pay = E.$(Math.round(s.followers * U.randf(0.005, 0.02))); E.addMoney(pay); done(good('I earned ' + E.fmt(pay) + ' from a sponsored post.')); } });
      items.push({ icon: '🗑️', label: 'Delete account', danger: true, onClick: function () { s.social.platform = false; s.followers = 0; ui().back(); done('I deleted my social media account.'); } });
      return items;
    });
  }
  function nightclub() {
    var f = diminish('club');
    E.addMoney(-E.$(60)); E.stat('happy', 6 * f);
    var r = U.rand(1, 100);
    if (r <= 15 && !E.partner()) {
      var p = E.makePerson({ age: U.clamp(me().age + U.rand(-5, 5), 18, 90), gender: me().interest === 'A' ? undefined : me().interest, role: 'partner' });
      return ui().choose('Nightclub 🪩', 'I caught the eye of ' + p.first + ' (' + p.age + ') on the dance floor.', [
        { label: 'Dance with them', fn: function () { if (U.chance(0.5 + me().looks / 300)) { p.rel = 60; S().people.push(p); S().counts.dates++; done(good('We danced all night and exchanged numbers. We\'re dating now!')); } else done('They danced with someone else.'); } },
        { label: 'Buy them a drink', fn: function () { E.addMoney(-E.$(15)); if (U.chance(0.4)) { p.role = 'friend'; p.rel = 50; S().people.push(p); return done('We chatted for hours and became friends.'); } done('They took the drink and walked away. 🙃'); } },
        { label: 'Ignore them', fn: function () { done('I kept dancing on my own.'); } }
      ]);
    }
    if (r <= 25) { E.stat('health', -5); return done(bad('I drank way too much and woke up on a stranger\'s couch.')); }
    if (r <= 30) { return done(bad('I got into a fight with a bouncer and was thrown out.')); }
    done('I danced the night away at ' + U.pick(['Club Neon', 'The Velvet Room', 'Pulse', 'Eclipse', 'Moonlight Lounge']) + '. 🪩');
  }
  function skydive() {
    var c = E.$(300);
    if (!afford(c)) return done(noMoney(c));
    E.addMoney(-c);
    var r = U.rand(1, 100);
    if (r <= 3) { E.addCondition('Broken Leg'); E.stat('health', -15); S().flags.skydive = true; return done(bad('My parachute opened late. I landed hard and broke my leg! 🪂')); }
    if (r <= 10) { E.stat('happy', 4); return done('The jump was cancelled due to high winds. I got a refund... of half my money.'); }
    S().flags.skydive = true; E.stat('happy', 12);
    done(good('I jumped out of a plane at 13,000 feet! What a rush! 🪂'));
  }
  function marathon() {
    use('marathon');
    var m = me();
    if (U.chance(m.athl / 110 + (TL.features.skill('fitness') / 200) + 0.05)) {
      S().flags.marathon = true; m.athl = U.clamp(m.athl + 3, 0, 100); E.stat('happy', 10); E.stat('health', -2);
      var mins = Math.round(360 - m.athl * 2.2 + U.rand(-15, 15));
      return done(good('I finished the marathon in ' + Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm! 🏅'));
    }
    E.stat('health', -4);
    done(bad('I hit the wall at mile ' + U.rand(14, 23) + ' and had to drop out.'));
  }
  function casinoMenu() {
    ui().menu('Casino 🎰', function () {
      var bets = [10, 100, 1000, 10000, 100000].map(function (b) { return E.$(b); });
      var mk = function (game, fn) {
        return function () {
          ui().choose(game, 'Cash: ' + E.fmt(S().money) + '. Place your bet:', bets.filter(function (b) { return b <= S().money; }).map(function (b) { return { label: E.fmt(b), fn: function () { gambleHook(); fn(b); } }; }));
        };
      };
      return [
        { icon: '🃏', label: 'Blackjack', sub: 'Beat the dealer (≈45% to win, 2×)', onClick: mk('Blackjack', blackjack) },
        { icon: '🎰', label: 'Slot machines', sub: 'Pull the lever', onClick: mk('Slots', slots) },
        { icon: '🎡', label: 'Roulette', sub: 'Red/black or a single number', onClick: mk('Roulette', roulette) },
        { icon: '🏇', label: 'Horse racing', sub: 'Pick a horse', onClick: mk('Horse racing', horses) }
      ];
    });
  }
  function gambleHook() {
    var n = use('gamble');
    if (n > 4 && !E.hasCondition('Gambling Addiction') && U.chance(0.05)) { E.addCondition('Gambling Addiction'); E.log('I think I have a gambling problem...', 'bad'); }
  }
  function blackjack(b) {
    var you = U.rand(14, 23), dealer = U.rand(16, 25);
    var youBust = you > 21, dealerBust = dealer > 21;
    var txt = 'I had ' + you + ', the dealer had ' + dealer + '. ';
    if (you === 21 && U.chance(0.4)) { E.addMoney(Math.round(b * 1.5)); return done(good('Blackjack! 🃏 I won ' + E.fmt(Math.round(b * 1.5)) + '.')); }
    if (youBust || (!dealerBust && dealer > you)) { E.addMoney(-b); return done(bad(txt + (youBust ? 'I busted.' : 'Dealer wins.') + ' Lost ' + E.fmt(b) + '.')); }
    if (you === dealer) return done(txt + 'Push. I got my money back.');
    E.addMoney(b); done(good(txt + 'I won ' + E.fmt(b) + '!'));
  }
  function slots(b) {
    var sym = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
    var r = [U.pick(sym), U.pick(sym), U.pick(sym)];
    var line = r.join(' ');
    if (r[0] === r[1] && r[1] === r[2]) { var mult = r[0] === '7️⃣' ? 100 : r[0] === '💎' ? 50 : 15; E.addMoney(b * mult); return done(good(line + ' — JACKPOT! Won ' + E.fmt(b * mult) + '!')); }
    if (r[0] === r[1] || r[1] === r[2]) { E.addMoney(Math.round(b * 0.5)); return done(line + ' — Small win: ' + E.fmt(Math.round(b * 1.5)) + ' back.'); }
    E.addMoney(-b); done(bad(line + ' — Lost ' + E.fmt(b) + '.'));
  }
  function roulette(b) {
    ui().choose('Roulette', 'Where do I put ' + E.fmt(b) + '?', [
      { label: '🔴 Red', fn: function () { spin(b, 'red'); } },
      { label: '⚫ Black', fn: function () { spin(b, 'black'); } },
      { label: '🎯 Lucky number 7', fn: function () { spin(b, 7); } }
    ]);
  }
  function spin(b, pick) {
    var n = U.rand(0, 36);
    var color = n === 0 ? 'green' : (n % 2 ? 'red' : 'black');
    var txt = 'The ball landed on ' + n + ' ' + color + '. ';
    if (pick === n) { E.addMoney(b * 35); return done(good(txt + 'I hit my number! Won ' + E.fmt(b * 35) + '! 🎉')); }
    if (pick === color) { E.addMoney(b); return done(good(txt + 'I won ' + E.fmt(b) + '!')); }
    E.addMoney(-b); done(bad(txt + 'Lost ' + E.fmt(b) + '.'));
  }
  function horses(b) {
    var hs = ['Thunderbolt', 'Lucky Clover', 'Midnight Express', 'Glue Factory', 'Silver Bullet'];
    var odds = [3, 4, 6, 12, 5];
    ui().choose('Horse racing', 'Pick a horse:', hs.map(function (h, i) {
      return { label: h + ' (' + odds[i] + ':1)', fn: function () {
        var winner = U.weighted(hs.map(function (x, j) { return { w: 1 / odds[j], i: j }; })).i;
        if (winner === i) { E.addMoney(b * odds[i]); return done(good(h + ' won! I collected ' + E.fmt(b * odds[i]) + '! 🏇')); }
        E.addMoney(-b); done(bad(hs[winner] + ' won the race. I lost ' + E.fmt(b) + '.'));
      } };
    }));
  }
  function lottery() {
    var c = E.$(2);
    if (!afford(c)) return done(noMoney(c));
    E.addMoney(-c);
    var r = Math.random();
    if (r < 1 / 50000) { var jp = E.$(U.rand(5, 250) * 1000000); E.addMoney(jp); E.stat('happy', 40); E.achieve('lottery'); return done(good('🎉🎉 I WON THE LOTTERY JACKPOT: ' + E.fmt(jp) + '!!! 🎉🎉')); }
    if (r < 0.002) { var big = E.$(10000); E.addMoney(big); return done(good('I matched 5 numbers and won ' + E.fmt(big) + '!')); }
    if (r < 0.05) { var sm = E.$(U.pick([4, 10, 50, 100])); E.addMoney(sm); return done('I won ' + E.fmt(sm) + ' on a lottery ticket.'); }
    done('My lottery ticket was a dud.');
  }
  function vacationMenu() {
    ui().menu('Vacation ✈️', function () {
      return D.VACATIONS.map(function (v) {
        var cost = E.$(v.cost), kind = tripKind(v);
        return { icon: kind[0], label: v.name, sub: kind[1], right: E.fmt(cost), onClick: function () {
          gainFrom = snap();
          if (!afford(cost)) return done(noMoney(cost));
          if (used('vacation') >= 2) return done(nope('I\'ve already been on enough vacations this year.'));
          use('vacation');
          E.addMoney(-cost); S().counts.vacations++;
          if (v.aurora) S().flags.aurora = true;
          // Each kind of trip gives something different; pricier trips go deeper.
          E.stat('happy', U.rand(10, 18) + Math.min(10, Math.log10(Math.max(1, v.cost / 1000)) * 4) + (kind[2] === 'party' ? 6 : 0)); E.stat('health', 3);
          if (kind[2] === 'adventure') { me().athl = U.clamp(me().athl + U.rand(2, 4), 0, 100); E.stat('health', 3); }
          if (kind[2] === 'culture') E.stat('smarts', U.rand(2, 4));
          if (kind[2] === 'luxury') { E.stat('health', 4); E.stat('looks', 2); }
          if (kind[2] === 'party') E.stat('health', -4);
          var pt = E.partner(); if (pt) E.rel(pt, 10);
          var r = U.rand(1, 100);
          if (r <= 8) { E.addCondition('Food Poisoning'); E.stat('health', -8); E.stat('happy', -8); return done(bad('I went on a ' + v.name + ' but got food poisoning. 🤢')); }
          if (r <= 16 && !pt && me().age < 60) { var p = E.addPerson({ role: 'partner', age: U.clamp(me().age + U.rand(-4, 4), 18, 99), gender: me().interest === 'A' ? undefined : me().interest, rel: 65 }); return done(good('I had an amazing time on my ' + v.name + ' and fell for ' + p.first + '! Vacation romance! 💕')); }
          if (r <= 22) { S().social.platform && (S().followers += U.rand(50, 2000)); return done(good('My ' + v.name + ' photos blew up online!')); }
          done(good('I had an incredible time on my ' + v.name + '. 🌴'));
        } };
      });
    });
  }
  // What a destination is good for: [icon, menu blurb, kind].
  function tripKind(v) {
    var n = v.name;
    if (/Carnival|Rio/.test(n)) return ['🎉', 'Party · huge fun, rough on the body', 'party'];
    if (/Dubai|Maldives|Private Island|Bali|Santorini/.test(n)) return ['🏖️', 'Luxury · deep rest, health and looks', 'luxury'];
    if (/Trek|Safari|Antarctica|Northern Lights|Road Trip|Adventure/.test(n)) return ['🥾', 'Adventure · athleticism and health', 'adventure'];
    return ['🏛️', 'Culture · museums and history, smarts', 'culture'];
  }
  function drivingTest() {
    if (used('dmv')) return done(nope('I have to wait until next year to retake the test.'));
    use('dmv');
    if (U.chance(0.6 + me().smarts / 300)) { S().flags.license = true; done(good('I passed my driving test! 🚗')); }
    else done(bad('I failed my driving test.'));
  }
  function adopt() {
    var cost = E.$(25000);
    if (!afford(cost)) return done(noMoney(cost));
    ui().choose('Adoption', 'Adopting a child costs ' + E.fmt(cost) + (TL.ancient && TL.ancient.on() ? TL.ancient.txt('adoptFee') : ' in agency fees.'), [
      { label: 'Adopt a baby', fn: function () { doAdopt(0, cost); } },
      { label: 'Adopt a young child', fn: function () { doAdopt(U.rand(3, 10), cost); } },
      { label: 'Not now', fn: function () { } }
    ]);
  }
  function doAdopt(age, cost) {
    if (S().money < cost + E.$(10000) && U.chance(0.5)) return done(bad('The agency rejected my application due to my finances.'));
    E.addMoney(-cost);
    var pt = E.partner();
    var c = E.addPerson({ role: 'child', age: age, last: me().last, rel: 70, money: 0, job: age < 5 ? 'Toddler' : 'Student' });
    if (pt && pt.role === 'spouse') c.otherParent = pt.id;
    S().counts.kids++;
    E.achieve('parent');
    E.stat('happy', 12);
    done(good('I adopted ' + c.first + ' (age ' + age + ')! Welcome to the family. 💕'));
  }
  function emigrateMenu() {
    ui().menu('Emigrate', function () {
      return D.COUNTRIES.filter(function (c) { return c.name !== S().country; }).map(function (c) {
        return { icon: c.flag, label: c.name, sub: 'Life expectancy ' + c.life + ' · tax ' + Math.round(c.tax * 100) + '%', onClick: function () {
          var cost = E.$(3000);
          if (!afford(cost)) return done(noMoney(cost));
          if (S().record.length && U.chance(0.6)) return done(bad('My visa was denied because of my criminal record.'));
          if (!U.chance(0.7 + (E.eduRank() * 0.07))) return done(bad('My visa application to ' + c.name + ' was rejected.'));
          ui().confirm('Move to ' + c.name + '?', 'All of your money and property will be converted to the local currency.', function () {
            E.addMoney(-cost);
            var ratio = c.k / D.country(S().country).k;
            var s = S();
            s.money = Math.round(s.money * ratio);
            s.studentDebt = Math.round(s.studentDebt * ratio);
            s.assets.forEach(function (a) { a.value = Math.round(a.value * ratio); a.price = Math.round((a.price || 0) * ratio); a.loan = Math.round((a.loan || 0) * ratio); a.payment = Math.round((a.payment || 0) * ratio); });
            s.pension = Math.round(s.pension * ratio);
            Object.keys(s.prices).forEach(function (k) { s.prices[k] = Math.max(0.01, Math.round(s.prices[k] * ratio * 100) / 100); });
            if (TL.market) TL.market.convert(ratio);
            s.people.forEach(function (p) { p.money = Math.round(p.money * ratio); if (p.owe) p.owe.amt = Math.round(p.owe.amt * ratio); if (p.venture) p.venture.amt = Math.round(p.venture.amt * ratio); }); // loans and stakes from js/mind.js too
            if ((s.lived = s.lived || []).indexOf(s.country) < 0) s.lived.push(s.country); // js/maps.js world map
            s.country = c.name;
            s.city = TL.real ? TL.real.city(c.name) : null;
            if (s.job) E.quitJob(true);
            E.achieve('emigrant');
            ui().closeAll();
            done(good('I emigrated to ' + (s.city ? s.city + ', ' : '') + c.name + ' ' + c.flag + '!'));
          });
        } };
      });
    });
  }

  // ---------- crime ----------
  function crimeMenu() {
    ui().menu('Crime 🦹', function () {
      var items = [{ info: true, html: '<p class="muted">Crime pays... until it doesn\'t. Getting caught means a trial and possibly prison.</p>' }];
      if (me().age >= 16) items.push({ icon: '🕴️', label: 'Organized crime', sub: S().mob ? TL.features.mobTitle() : 'Join a crime family', onClick: TL.features.mobMenu });
      D.CRIMES.forEach(function (c) {
        var dis = me().age < c.minAge || (c.needsJob && !(S().job && !S().job.partTime && !S().job.fame));
        items.push({ icon: c.icon || '🦹', label: c.name, sub: c.desc + (me().age < c.minAge ? ' · age ' + c.minAge + '+' : c.needsJob && dis ? ' · needs a job' : ''), disabled: dis, onClick: function () { commitCrime(c); } });
      });
      return items;
    });
  }
  function commitCrime(c) {
    var s = S(), m = me();
    var n = use('crime');
    var p = c.p + (c.stat ? (E.statValue(c.stat) - 50) / 200 : (m.athl - 50) / 300) - n * 0.05 + (s.flags.gang ? 0.05 : 0);
    E.karma(c.karma);
    s.counts.crimes++;
    if (U.chance(U.clamp(p, 0.05, 0.9))) {
      var take = c.reward[1] ? E.$(U.rand(c.reward[0], c.reward[1])) : 0;
      if (c.id === 'embezzle') take = Math.round(E.jobSalary(s.job) * U.randf(0.1, 1.5));
      E.addMoney(take);
      E.stat('happy', 3);
      return done(take ? good('I got away with it! I made off with ' + E.fmt(take) + '. 💰') : 'I got away with it.');
    }
    if (U.chance(0.35)) return done('Something went wrong, but I escaped before the cops showed up.');
    var years = U.rand(c.jail[0], c.jail[1]);
    if (m.age < 18) years = Math.min(years, Math.max(0, 18 - m.age + 1));
    if (c.id === 'embezzle' && s.job) E.fire('The company discovered the embezzlement.');
    if (years === 0) { E.jail(0, c.name); return done(bad('I was caught (' + c.name.toLowerCase() + ') and let off with a fine.')); }
    E.queue('crime_caught', { crime: c.name, years: years });
    done(bad('🚨 I was caught by the police!'));
  }

  // ---------- prison ----------
  function prisonMenu() {
    ui().menu('Prison ⛓️', function () {
      var pr = S().prison;
      return [
        { info: true, html: '<div class="kv"><b>' + U.esc(pr.name) + '</b><br>Crime: ' + pr.crime + '<br>Sentence: ' + U.plural(pr.total, 'year') + ' · ' + U.plural(pr.remaining, 'year') + ' left</div>' },
        { icon: '⚖️', label: 'Appeal my sentence', sub: pr.appealed ? 'Already appealed' : 'Costs ' + E.fmt(E.$(10000)), disabled: pr.appealed, onClick: function () {
          pr.appealed = true;
          var cost = E.$(10000); E.addMoney(-cost);
          if (U.chance(0.2)) { S().prison = null; E.stat('happy', 25); ui().closeAll(); return done(good('My appeal succeeded! I\'m a free person! 🔓')); }
          done(bad('My appeal was denied.'));
        } },
        { icon: '🕳️', label: 'Attempt escape', onClick: function () {
          if (used('escape')) return done(nope('The guards are watching me too closely this year.'));
          use('escape');
          if (U.chance(0.12 + me().athl / 600 + me().smarts / 800)) { S().prison = null; S().flags.fugitive = true; E.achieve('escape'); E.stat('happy', 20); ui().closeAll(); return done(good('I escaped from prison! I\'m on the run! 🏃')); }
          pr.remaining += 2; pr.total += 2; E.stat('health', -10);
          done(bad('I was caught trying to escape. 2 years were added to my sentence.'));
        } },
        { icon: '🏋️', label: 'Work out in the yard', onClick: function () { var f = diminish('pgym'); me().athl = U.clamp(me().athl + Math.round(4 * f), 0, 100); E.stat('health', 2 * f); done('I pumped iron in the yard.'); } },
        { icon: '📖', label: 'Prison library', onClick: function () { var f = diminish('plib'); E.stat('smarts', 3 * f); done('I read in the prison library.'); } },
        { icon: '🎓', label: 'Earn a GED', disabled: E.hasDegree('hs') || used('pged'), onClick: function () { use('pged'); if (U.chance(me().smarts / 110 + 0.1)) { S().degrees.push({ type: 'hs' }); return done(good('I earned my GED in prison!')); } done('I failed the GED exam.'); } },
        { icon: '🙏', label: 'Good behavior', onClick: function () { var f = diminish('behave'); E.karma(1); if (U.chance(0.12 * f) && pr.remaining > 1) { pr.remaining--; return done(good('The parole board noticed my good behavior. A year was cut from my sentence!')); } done('I kept my head down and followed the rules.'); } },
        { icon: '🔥', label: 'Start a riot', danger: true, onClick: function () { E.karma(-3); if (U.chance(0.3)) { E.stat('happy', 10); return done('The riot was chaos. Nobody knew I started it. 😈'); } pr.remaining += 1; pr.total += 1; E.stat('health', -12); done(bad('The guards caught me. +1 year and solitary confinement.')); } },
        { icon: '🤝', label: 'Befriend an inmate', onClick: function () { if (used('inmate') > 1) return done(nope('Nobody else wants to talk.')); use('inmate'); var p = E.addPerson({ role: 'friend', age: me().age + U.rand(-10, 15), rel: 50, gender: me().gender, job: 'Inmate' }); done('I befriended ' + E.fullName(p) + ' in the cafeteria.'); } }
      ];
    });
  }

  function achievementsMenu() {
    ui().menu('Achievements', function () {
      var mine = S().ach, g = E.loadGlobal().ach;
      // Roman lives only list achievements that make sense there.
      var list = TL.ancient && TL.ancient.on() ? D.ACHIEVEMENTS.filter(function (a) { return TL.ancient.ACH.indexOf(a.id) >= 0; }) : D.ACHIEVEMENTS;
      return [{ info: true, html: '<p class="muted">' + mine.length + ' this life · ' + g.length + '/' + D.ACHIEVEMENTS.length + ' all-time</p>' }].concat(list.map(function (a) {
        var got = mine.indexOf(a.id) >= 0, ever = g.indexOf(a.id) >= 0;
        return { icon: got || ever ? a.icon : '🔒', label: a.name, sub: a.desc, right: got ? '✔' : ever ? '☆' : '' };
      }));
    });
  }

  return {
    relationshipsMenu: relationshipsMenu, occupationMenu: occupationMenu, assetsMenu: assetsMenu,
    activitiesMenu: activitiesMenu, openUniversity: openUniversity, tradeMenu: tradeMenu, divorce: divorce, addPet: addPet,
    achievementsMenu: achievementsMenu, socialMenu: socialMenu, personIcon: personIcon, roleLabel: roleLabel, done: done, nope: nope
  };
})();
