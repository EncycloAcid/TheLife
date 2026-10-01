/* TheLife — v1.2 systems: royalty, organized crime, skills & creative work,
 * and wills. The engine calls the hooks at the bottom (yearly, onDeath,
 * inherit, makeRoyal, skillBonus, willShare). */
TL.features = (function () {
  var U = TL.util, D = TL.data, E = TL.engine;
  function S() {
    var s = TL.S;
    // Older saves predate these fields.
    if (!s.skills) s.skills = {};
    if (!s.books) s.books = [];
    return s;
  }
  function me() { return TL.S.me; }
  function ui() { return TL.ui; }
  function done(res, title) { TL.actions.done(res, title); }
  function good(t) { return { text: t, cls: 'good' }; }
  function bad(t) { return { text: t, cls: 'bad' }; }
  function use(key) { var y = S().yearActs, n = y[key] || 0; y[key] = n + 1; return n; }
  function used(key) { return S().yearActs[key] || 0; }
  function diminish(key) { return 1 / (1 + use(key)); }

  // ====================================================================
  // SKILLS & CREATIVE WORK
  // ====================================================================
  var SKILLS = [
    { id: 'coding', name: 'Coding', icon: '💻', min: 10, careers: ['software', 'engineer', 'scientist'] },
    { id: 'writing', name: 'Writing', icon: '✍️', min: 8, careers: ['journalist', 'professor', 'lawyer'] },
    { id: 'singing', name: 'Singing', icon: '🎤', min: 5, careers: ['musician'] },
    { id: 'painting', name: 'Painting', icon: '🎨', min: 5, careers: ['design', 'architect'] },
    { id: 'cooking', name: 'Cooking', icon: '🍳', min: 10, careers: ['chef', 'fastfood'] },
    { id: 'comedy', name: 'Comedy', icon: '😂', min: 12, careers: ['actor'] },
    { id: 'chess', name: 'Chess', icon: '♟️', min: 6, careers: ['finance', 'scientist'] },
    { id: 'fitness', name: 'Fitness', icon: '🏃', min: 10, careers: ['athlete', 'military', 'police', 'firefighter'] }
  ];
  function skill(id) { return S().skills[id] || 0; }
  function skillBonus(careerId) {
    var b = 0;
    SKILLS.forEach(function (sk) { if (sk.careers.indexOf(careerId) >= 0) b = Math.max(b, skill(sk.id)); });
    return b / 300; // up to +0.33 chance
  }
  function skillsMenu() {
    ui().menu('Hobbies & Skills', function () {
      var m = me(), items = [];
      items.push({ info: true, html: '<p class="muted">Practice builds skills. Skills boost related careers and unlock creative work.</p>' });
      SKILLS.forEach(function (sk) {
        if (m.age < sk.min) return;
        var v = skill(sk.id);
        items.push({ icon: sk.icon, label: 'Practice ' + sk.name.toLowerCase(), sub: 'Skill ' + v + '/100', bar: v, onClick: function () { practice(sk); } });
      });
      items.push({ section: 'Put your skills to work' });
      if (m.age >= 14) items.push({ icon: '📖', label: 'Write a book', sub: skill('writing') < 20 ? 'Needs writing 20+' : 'Takes a year to write', disabled: skill('writing') < 20 || used('book') > 0, onClick: writeBook });
      if (m.age >= 8) items.push({ icon: '🖼️', label: 'Sell a painting', sub: skill('painting') < 20 ? 'Needs painting 20+' : '', disabled: skill('painting') < 20 || used('paint') > 0, onClick: sellPainting });
      if (m.age >= 14) items.push({ icon: '📱', label: 'Build an app', sub: skill('coding') < 40 ? 'Needs coding 40+' : 'Could make millions', disabled: skill('coding') < 40 || used('app') > 0, onClick: buildApp });
      if (m.age >= 16) items.push({ icon: '🎙️', label: 'Open mic night', sub: 'Sing or do stand-up', disabled: (skill('singing') < 20 && skill('comedy') < 20) || used('openmic') > 1, onClick: openMic });
      if (m.age >= 12) items.push({ icon: '🏆', label: 'Cooking competition', sub: skill('cooking') < 30 ? 'Needs cooking 30+' : '', disabled: skill('cooking') < 30 || used('cookoff') > 0, onClick: function () { contest('cookoff', 'cooking', 'the ' + U.pick(['regional bake-off', 'chili cook-off', 'televised cooking show', 'pie contest'])); } });
      if (m.age >= 8) items.push({ icon: '♟️', label: 'Chess tournament', sub: skill('chess') < 30 ? 'Needs chess 30+' : '', disabled: skill('chess') < 30 || used('chesst') > 0, onClick: function () { contest('chesst', 'chess', 'a ' + U.pick(['local', 'national', 'international']) + ' chess tournament'); } });
      var books = S().books;
      if (books.length) {
        items.push({ section: 'My books' });
        books.forEach(function (b) { items.push({ icon: b.quality >= 85 ? '📕' : '📘', label: '"' + b.title + '"', sub: b.genre + ' · ' + b.year + ' · ' + b.sales.toLocaleString() + ' copies sold' + (b.quality >= 85 ? ' · Bestseller' : '') }); });
      }
      return items;
    });
  }
  function practice(sk) {
    var s = S(), f = diminish('skill' + sk.id);
    if (f < 0.2) return done(TL.actions.nope('I\'ve practiced ' + sk.name.toLowerCase() + ' enough this year.'));
    var gain = Math.max(1, Math.round(U.rand(2, 6) * f * (me().smarts / 150 + 0.7) * (skill(sk.id) > 80 ? 0.5 : 1)));
    s.skills[sk.id] = Math.min(100, skill(sk.id) + gain);
    E.stat('happy', 1);
    if (sk.id === 'fitness') { me().athl = U.clamp(me().athl + 1, 0, 100); E.stat('health', 1); }
    if (sk.id === 'singing') s.flags.music = (s.flags.music || 0) + f;
    if (sk.id === 'comedy') s.flags.acting = (s.flags.acting || 0) + f / 2;
    var high = SKILLS.filter(function (x) { return skill(x.id) >= 80; }).length;
    if (high >= 3) E.achieve('polymath');
    done('I practiced ' + sk.name.toLowerCase() + '. ' + sk.icon + ' (' + s.skills[sk.id] + '/100)');
  }
  var GENRES = ['Mystery', 'Romance', 'Sci-Fi', 'Fantasy', 'Thriller', 'Memoir', 'Self-Help', 'Horror', 'Children\'s', 'Poetry'];
  function writeBook() {
    ui().choose('Write a book', 'What genre?', GENRES.slice(0, 6).map(function (g) {
      return { label: g, fn: function () {
        ui().prompt('Title', 'What is your ' + g.toLowerCase() + ' book called?', U.pick(['The Last', 'Midnight', 'A Song of', 'Beneath the', 'Whispers of', 'The Secret']) + ' ' + U.pick(['Harbor', 'Garden', 'Stars', 'Lies', 'Winter', 'River', 'Crown']), function (title) {
          if (!title) return;
          use('book');
          var s = S(), q = U.clamp(skill('writing') + U.rand(-18, 15) + (me().smarts - 50) / 10, 1, 100);
          if (q < 30 && U.chance(0.6)) return done(bad('Every publisher rejected "' + title + '". Maybe practice more.'));
          var sales = Math.round(Math.pow(q, 2.2) * U.randf(2, 12) * (1 + s.fame / 50));
          var advance = E.$(Math.round(sales * 1.2));
          E.addMoney(advance);
          s.books.push({ title: title.slice(0, 40), genre: g, quality: Math.round(q), year: s.year, sales: sales });
          E.fame(q >= 85 ? U.rand(6, 12) : 1);
          if (q >= 85) E.achieve('author');
          done(q >= 85 ? good('📚 "' + title + '" became a BESTSELLER! ' + sales.toLocaleString() + ' copies sold. Advance: ' + E.fmt(advance) + '.') : '"' + title + '" was published and sold ' + sales.toLocaleString() + ' copies. I earned ' + E.fmt(advance) + '.');
        });
      } };
    }));
  }
  function sellPainting() {
    use('paint');
    var q = skill('painting') + U.rand(-10, 10);
    if (U.chance(0.02 + q / 2000)) { var big = E.$(U.rand(200000, 3000000)); E.addMoney(big); E.fame(8); return done(good('🖼️ A famous collector called my painting a masterpiece and paid ' + E.fmt(big) + '!')); }
    var price = E.$(Math.round(Math.pow(Math.max(5, q), 2) * U.randf(0.5, 4)));
    E.addMoney(price);
    done('I sold a ' + U.pick(['landscape', 'portrait', 'abstract piece', 'still life', 'mural sketch']) + ' for ' + E.fmt(price) + '.');
  }
  function buildApp() {
    use('app');
    var c = skill('coding'), r = Math.random();
    if (r < 0.03 + c / 2500) { var hit = E.$(U.rand(1000000, 20000000)); E.addMoney(hit); E.fame(10); return done(good('📱 My app went viral and a tech giant bought it for ' + E.fmt(hit) + '!')); }
    if (r < 0.35 + c / 300) { var earn = E.$(Math.round(c * U.rand(50, 800))); E.addMoney(earn); return done('My app earned ' + E.fmt(earn) + ' in the app store.'); }
    done(bad('My app got 12 downloads. Eleven were from my mom.'));
  }
  function openMic() {
    use('openmic');
    var sing = skill('singing') >= skill('comedy'), v = sing ? skill('singing') : skill('comedy');
    if (U.chance(v / 110)) {
      E.fame(U.rand(1, 4)); E.stat('happy', 8);
      if (S().social.platform) S().followers += U.rand(50, 3000) * Math.ceil(v / 20);
      return done(good(sing ? 'The crowd sang along! Someone filmed it and it\'s getting shared.' : 'I killed it! People were crying laughing.'));
    }
    E.stat('happy', -4);
    done(bad(sing ? 'My voice cracked on the high note.' : 'Crickets. Not a single laugh.'));
  }
  function contest(key, sk, name) {
    use(key);
    var v = skill(sk);
    if (U.chance(v / 160)) { S().flags.contestWin = true; var prize = E.$(U.pick([500, 2000, 10000, 50000])); E.addMoney(prize); E.stat('happy', 10); E.fame(2); return done(good('🏆 I won ' + name + '! Prize: ' + E.fmt(prize) + '.')); }
    if (U.chance(0.4)) return done('I placed in the top ten at ' + name + '.');
    done(bad('I was eliminated early in ' + name + '.'));
  }
  function yearlyCreative() {
    var s = S(), royalties = 0;
    s.books.forEach(function (b) {
      var age = s.year - b.year;
      if (age < 1) return;
      var sold = Math.round(b.sales * 0.4 / Math.pow(age, 1.3));
      b.sales += sold;
      royalties += E.$(Math.round(sold * 1.5));
    });
    if (royalties > 0) { E.addMoney(royalties); E.log('📚 Book royalties: ' + E.fmt(royalties), 'money'); }
    // Unpracticed skills fade slowly.
    Object.keys(s.skills).forEach(function (k) { if (U.chance(0.4)) s.skills[k] = Math.max(0, s.skills[k] - 1); });
  }

  // ====================================================================
  // ROYALTY
  // ====================================================================
  function makeRoyal(st) {
    var dad = E.people('father')[0], mom = E.people('mother')[0];
    var monarch = U.chance(0.6) ? dad : mom;
    [dad, mom].forEach(function (p) { p.married = true; p.last = st.me.last; p.money = E.$(U.rand(200, 900) * 1000000); });
    monarch.job = monarch.gender === 'M' ? 'King' : 'Queen';
    var consort = monarch === dad ? mom : dad;
    consort.job = consort.gender === 'M' ? 'Prince Consort' : 'Queen Consort';
    E.people('sibling').forEach(function (p) { p.job = p.age < 18 ? (p.gender === 'M' ? 'Prince' : 'Princess') : 'Royal'; p.last = st.me.last; });
    st.royal = { house: 'House of ' + st.me.last, monarchId: monarch.id, monarch: false, popularity: U.rand(50, 75) };
    st.flags.wealth = 'rich';
    st.home = { type: 'palace' };
    st.fame = 45;
  }
  function royalBirthLog() {
    var monarch = E.person(S().royal.monarchId);
    E.log('👑 I was born into the royal family, the ' + S().royal.house + '!', 'good');
    E.log('My ' + (monarch.role === 'father' ? 'father' : 'mother') + ' is ' + monarch.job + ' ' + monarch.first + '. I am ' + lineText() + '.');
  }
  function lineOf() {
    var s = S();
    if (!s.royal || s.royal.monarch || s.royal.distant) return 0;
    // Older siblings (other than a sibling already on the throne) come first.
    var ahead = E.people('sibling').filter(function (p) { return p.age > me().age && p.id !== s.royal.monarchId; }).length;
    return ahead + 1;
  }
  function title() {
    var s = S();
    if (!s || !s.royal) return null;
    var f = me().gender === 'F';
    if (s.royal.monarch) return f ? 'Queen' : 'King';
    if (s.royal.distant) return f ? 'Lady' : 'Lord';
    return (lineOf() === 1 ? 'Crown ' : '') + (f ? 'Princess' : 'Prince');
  }
  function lineText() {
    var n = lineOf();
    return n ? U.ordinal(n) + ' in line to the throne' : 'the ' + title();
  }
  function crown() {
    var s = S();
    s.royal.monarch = true; s.royal.monarchId = null;
    s.royal.popularity = U.clamp(s.royal.popularity + 15, 0, 100);
    E.fame(25);
    E.stat('happy', 20);
    E.achieve('royal');
    E.log('👑 I was crowned ' + title() + ' ' + me().first + '! Long live the ' + title() + '!', 'good');
  }
  function onDeath(p) {
    var s = S();
    if (!s.royal || s.royal.monarch || p.id !== s.royal.monarchId) return;
    // Succession passes to the eldest living royal sibling, else to me.
    var older = E.people('sibling').filter(function (x) { return x.age > me().age; }).sort(function (a, b) { return b.age - a.age; });
    if (older.length) {
      var heir = older[0];
      heir.job = heir.gender === 'M' ? 'King' : 'Queen';
      s.royal.monarchId = heir.id;
      E.log('👑 My ' + (heir.gender === 'M' ? 'brother' : 'sister') + ' ' + heir.first + ' was crowned. I am now ' + lineText() + '.');
    } else crown();
  }
  function yearlyRoyal() {
    var s = S(), r = s.royal;
    if (!r || s.dead) return;
    var n = lineOf();
    var allowance = E.$(r.monarch ? 5000000 : r.distant ? 150000 : n === 1 ? 1500000 : 400000);
    if (me().age < 18) allowance = Math.round(allowance / 10);
    E.addMoney(allowance);
    E.log('🏰 Royal allowance: ' + E.fmt(allowance), 'money');
    r.popularity = U.clamp(Math.round(r.popularity + U.rand(-5, 3) + (s.karma - 50) / 15 + (s.record.length ? -5 : 0)), 0, 100);
    if (r.monarch) E.fame(Math.max(0, 70 - s.fame) / 5);
    if (r.monarch && r.popularity < 12 && U.chance(0.4)) {
      E.log('🔥 A revolution overthrew the monarchy! I fled into exile with half my fortune.', 'bad');
      s.royal = null; s.money = Math.round(s.money / 2); s.flags.exiled = true;
      E.stat('happy', -30);
    }
  }
  function royalMenu() {
    ui().menu('Royal duties 👑', function () {
      var s = S(), r = s.royal, items = [];
      items.push({ info: true, html: '<div class="kv"><b>' + title() + ' ' + U.esc(me().first) + '</b> of the ' + U.esc(r.house) + '<br>' + (r.monarch ? 'Reigning monarch' : lineOf() ? U.ordinal(lineOf()) + ' in line to the throne' : 'Minor royal') + '<div class="minibar"><span>Popularity</span><div class="track"><div class="fill ' + (r.popularity >= 66 ? 'hi' : r.popularity >= 33 ? 'mid' : 'lo') + '" style="width:' + r.popularity + '%"></div></div></div></div>' });
      function duty(icon, label, key, fn) { items.push({ icon: icon, label: label, disabled: used(key) > 1, onClick: function () { use(key); fn(); } }); }
      duty('🎗️', 'Attend a charity gala', 'gala', function () { r.popularity = Math.min(100, r.popularity + U.rand(2, 6)); E.karma(2); done('I attended a charity gala for ' + U.pick(['children\'s hospitals', 'veterans', 'wildlife conservation', 'literacy', 'clean water']) + '.'); });
      duty('✈️', 'Go on a royal tour', 'tour', function () { r.popularity = Math.min(100, r.popularity + U.rand(3, 8)); E.stat('health', -2); E.fame(2); done('I toured ' + U.pick(['the provinces', 'the Commonwealth', 'Asia', 'South America', 'Africa', 'Europe']) + ' and was greeted by cheering crowds.'); });
      duty('🎩', 'Host a garden party', 'garden', function () { E.people(['friend', 'best friend', 'sibling']).forEach(function (p) { E.rel(p, 6); }); r.popularity = Math.min(100, r.popularity + 2); done('I hosted a garden party at the palace. 🫖'); });
      if (r.monarch) {
        duty('📜', 'Issue a royal decree', 'decree', function () {
          var d = U.pick(['a national holiday', 'a tax on luxury yachts', 'free museum entry', 'a ban on pineapple pizza', 'a new national anthem']);
          if (U.chance(0.55 + s.karma / 300)) { r.popularity = Math.min(100, r.popularity + U.rand(5, 12)); done(good('I decreed ' + d + '. The people love it!')); }
          else { r.popularity = Math.max(0, r.popularity - U.rand(5, 12)); done(bad('I decreed ' + d + '. There were protests in the streets.')); }
        });
        duty('⚔️', 'Knight a friend', 'knight', function () { var f = E.people(['friend', 'best friend'])[0]; if (!f) return done('I don\'t have any friends to knight.'); E.rel(f, 25); done(good('I knighted ' + f.first + '. Arise, ' + (f.gender === 'M' ? 'Sir ' : 'Dame ') + f.first + '!')); });
        duty('🎙️', 'Address the nation', 'address', function () { if (U.chance(0.4 + me().smarts / 200)) { r.popularity = Math.min(100, r.popularity + 8); done(good('My address to the nation was moving and widely praised.')); } else { r.popularity = Math.max(0, r.popularity - 4); done(bad('My speech was called "out of touch".')); } });
      }
      duty('🍾', 'Party with celebrities', 'royalparty', function () { E.stat('happy', 8); E.fame(3); if (U.chance(0.35)) { r.popularity = Math.max(0, r.popularity - U.rand(5, 12)); return done(bad('Tabloids got photos of me partying. Scandal!')); } done('I partied at an exclusive club with celebrities.'); });
      items.push({ icon: '🚪', label: r.monarch ? 'Abdicate the throne' : 'Renounce my title', danger: true, onClick: function () {
        ui().confirm(r.monarch ? 'Abdicate?' : 'Renounce your title?', 'You will lose your royal allowance forever.', function () {
          var was = title();
          s.royal = null; E.fame(-10);
          ui().back();
          done('I gave up my title as ' + was + '. I\'m a commoner now.');
        });
      } });
      return items;
    });
  }
  function inheritRoyal(prev, c, st, heirs) {
    var r = prev.royal;
    if (!r) return;
    var kids = c.role === 'child' ? heirs.slice().sort(function (a, b) { return b.age - a.age; }) : [];
    st.royal = { house: r.house, popularity: U.clamp(r.popularity + U.rand(-10, 10), 20, 90), monarch: false, monarchId: null };
    if (r.monarch && c.role === 'child' && kids.length && kids[0].id === c.id) {
      TL.S = st; crown();
    } else if (r.monarch && kids.length && c.role === 'child') {
      var sib = st.people.filter(function (p) { return p.id === kids[0].id; })[0];
      if (sib) { sib.job = sib.gender === 'M' ? 'King' : 'Queen'; st.royal.monarchId = sib.id; }
      E.log('👑 My ' + (sib && sib.gender === 'M' ? 'brother' : 'sister') + ' ' + (sib ? sib.first : '') + ' inherited the throne.');
    } else {
      st.royal.distant = true;
    }
    st.fame = Math.max(st.fame, 40);
    st.home = { type: 'palace' };
  }

  // ====================================================================
  // ORGANIZED CRIME
  // ====================================================================
  var FAMILIES = ['Moretti', 'Castellano', 'Volkov', 'Kurosawa', 'Ortega', 'Callahan', 'Bianchi', 'Dragunov'];
  var RANKS = ['Associate', 'Soldier', 'Capo', 'Underboss', 'Boss'];
  var MOB_JOBS = [
    { id: 'protect', name: 'Collect protection money', icon: '💼', p: 0.8, reward: [2000, 15000], respect: [3, 6], heat: 3 },
    { id: 'smuggle', name: 'Run a smuggling operation', icon: '🚢', p: 0.65, reward: [10000, 80000], respect: [5, 10], heat: 6 },
    { id: 'hijack', name: 'Hijack a cargo truck', icon: '🚚', p: 0.55, reward: [20000, 150000], respect: [6, 12], heat: 8 },
    { id: 'rig', name: 'Rig a boxing match', icon: '🥊', p: 0.6, reward: [15000, 100000], respect: [4, 8], heat: 4 },
    { id: 'rival', name: 'Sabotage a rival family', icon: '🔥', p: 0.45, reward: [0, 20000], respect: [10, 18], heat: 10, risky: true }
  ];
  function mobTitle() { var m = S().mob; return m ? RANKS[m.rank] + ' of the ' + m.family + ' family' : null; }
  function mobMenu() {
    var s = S();
    ui().menu('Organized crime 🕴️', function () {
      var mob = s.mob, items = [];
      if (!mob) {
        items.push({ info: true, html: '<p class="muted">Crime families reward loyalty with money and power, but the feds are always watching.</p>' });
        FAMILIES.slice(0, 5).forEach(function (f) {
          items.push({ icon: '🕴️', label: 'Approach the ' + f + ' family', disabled: me().age < 18 || used('mobjoin') > 0, sub: me().age < 18 ? 'Age 18+' : '', onClick: function () { joinMob(f); } });
        });
        return items;
      }
      items.push({ info: true, html: '<div class="kv"><b>' + RANKS[mob.rank] + '</b> · ' + mob.family + ' crime family<br>' + U.plural(mob.years, 'year') + ' in the family' +
        bar('Respect', mob.respect) + bar('Police heat', mob.heat, true) + '</div>' });
      items.push({ section: 'Jobs (' + Math.max(0, 3 - used('mobjob')) + ' left this year)' });
      MOB_JOBS.forEach(function (j) { items.push({ icon: j.icon, label: j.name, disabled: used('mobjob') >= 3, onClick: function () { mobJob(j); } }); });
      items.push({ section: 'Business' });
      var bribe = E.$(20000 * (mob.rank + 1));
      items.push({ icon: '👮', label: 'Bribe a detective', right: E.fmt(bribe), disabled: used('mobbribe') > 0, onClick: function () {
        use('mobbribe');
        if (s.money < bribe) return done(bad('I can\'t afford the bribe.'));
        E.addMoney(-bribe);
        if (U.chance(0.12)) { mob.heat = Math.min(100, mob.heat + 20); return done(bad('The detective was honest and reported the bribe!')); }
        mob.heat = Math.max(0, mob.heat - 25); done('The detective will look the other way. Heat reduced.');
      } });
      items.push({ icon: '🕶️', label: 'Lay low', onClick: function () { var f = diminish('laylow'); mob.heat = Math.max(0, Math.round(mob.heat - 10 * f)); mob.respect = Math.max(0, mob.respect - 2); done('I kept my head down for a while.'); } });
      if (mob.rank < RANKS.length - 1) items.push({ icon: '⬆️', label: 'Ask to move up', sub: 'Needs respect ' + (70 + mob.rank * 5) + '+', disabled: used('mobpromo') > 0, onClick: function () {
        use('mobpromo');
        if (mob.respect >= 70 + mob.rank * 5 && U.chance(0.6)) {
          mob.rank++; mob.respect = 40;
          if (mob.rank === RANKS.length - 1) E.achieve('godfather');
          return done(good('I was made ' + RANKS[mob.rank] + ' of the ' + mob.family + ' family. 🕴️'));
        }
        mob.respect = Math.max(0, mob.respect - 5);
        done(bad('The ' + (mob.rank >= 2 ? 'Boss' : 'Capo') + ' said I haven\'t earned it yet.'));
      } });
      items.push({ section: 'Get out' });
      items.push({ icon: '🚪', label: 'Leave the family', danger: true, onClick: function () {
        ui().confirm('Leave the family?', 'Nobody just walks away...', function () {
          s.mob = null;
          if (U.chance(0.35)) { E.stat('health', -U.rand(20, 40)); return done(bad('I left, but they sent a message first. I ended up in the hospital.')); }
          done('The family let me go. I\'m out.');
        });
      } });
      items.push({ icon: '🐀', label: 'Become an FBI informant', danger: true, onClick: function () {
        ui().confirm('Flip?', 'The feds will protect you... probably.', function () {
          s.mob = null; E.karma(10); s.flags.witness = true;
          if (U.chance(0.25)) { E.stat('health', -U.rand(30, 50)); return done(bad('The family found out I was a rat. I barely survived the attack.')); }
          E.addMoney(E.$(50000));
          done(good('My testimony brought down the ' + mob.family + ' family. I entered witness protection.'));
        });
      } });
      return items;
    });
  }
  function bar(label, v, invert) {
    var c = invert ? (v >= 66 ? 'lo' : v >= 33 ? 'mid' : 'hi') : (v >= 66 ? 'hi' : v >= 33 ? 'mid' : 'lo');
    return '<div class="minibar"><span>' + label + '</span><div class="track"><div class="fill ' + c + '" style="width:' + v + '%"></div></div></div>';
  }
  function joinMob(family) {
    var s = S();
    use('mobjoin');
    if (s.job && ['police', 'detective', 'judge'].indexOf(s.job.career) >= 0) return done(bad('They don\'t trust anyone who works for the law.'));
    if (s.royal) return done(bad('They laughed. "A royal? Too much attention."'));
    var p = 0.2 + s.record.length * 0.15 + (100 - s.karma) / 300 + me().athl / 400;
    if (!U.chance(U.clamp(p, 0.1, 0.85))) return done(bad('The ' + family + ' family said they don\'t know what I\'m talking about.'));
    s.mob = { family: family, rank: 0, respect: 20, heat: 10, years: 0 };
    E.karma(-5);
    done(good('After a test job, the ' + family + ' family took me in as an Associate. 🕴️'));
  }
  function mobJob(j) {
    var s = S(), mob = s.mob;
    use('mobjob');
    E.karma(-3);
    var p = j.p + (me().athl - 50) / 400 + (me().smarts - 50) / 400 + mob.rank * 0.03;
    if (U.chance(U.clamp(p, 0.1, 0.92))) {
      var take = j.reward[1] ? E.$(U.rand(j.reward[0], j.reward[1]) * (1 + mob.rank * 0.5)) : 0;
      E.addMoney(take);
      mob.respect = Math.min(100, mob.respect + U.rand(j.respect[0], j.respect[1]));
      mob.heat = Math.min(100, mob.heat + j.heat);
      return done(good('The job went smoothly.' + (take ? ' My cut: ' + E.fmt(take) + '.' : '') + ' The family is pleased.'));
    }
    mob.heat = Math.min(100, mob.heat + j.heat * 2);
    mob.respect = Math.max(0, mob.respect - 5);
    if (j.risky && U.chance(0.5)) { E.stat('health', -U.rand(15, 35)); return done(bad('The rival family was waiting for us. I was badly hurt.')); }
    if (U.chance(mob.heat / 180)) {
      E.queue('crime_caught', { crime: 'Racketeering', years: U.rand(3, 12) });
      return done(bad('🚨 The feds were waiting. I was arrested.'));
    }
    done(bad('The job went sideways, but I got away.'));
  }
  function yearlyMob() {
    var s = S(), mob = s.mob;
    if (!mob || s.dead) return;
    mob.years++;
    mob.heat = Math.max(0, mob.heat - 8);
    if (!s.prison) {
      var tribute = E.$(Math.round((10000 + mob.rank * mob.rank * 60000) * U.randf(0.7, 1.3)));
      E.addMoney(tribute);
      E.log('🕴️ My share from the family: ' + E.fmt(tribute), 'money');
    }
    if (!s.prison && mob.heat >= 60 && U.chance(mob.heat / 250)) {
      E.log('🚔 The FBI raided the ' + mob.family + ' family!', 'bad');
      E.jail(U.rand(5, 20), 'Racketeering');
      mob.heat = 20;
      return;
    }
    if (U.chance(0.06 + mob.rank * 0.02)) {
      E.stat('health', -U.rand(10, 30));
      E.log('💥 A rival family came after me. I survived, barely.', 'bad');
    }
  }

  // ====================================================================
  // WILL
  // ====================================================================
  function willMenu() {
    ui().menu('My will', function () {
      var s = S(), heirs = E.heirs();
      var items = [{ info: true, html: '<p class="muted">Name a main heir to receive most of your estate (70%). Everyone else splits the rest.</p>' }];
      if (!heirs.length) items.push({ info: true, html: '<p>I have no children or grandchildren to leave my estate to.</p>' });
      heirs.forEach(function (h) {
        items.push({ icon: TL.actions.personIcon(h), label: E.fullName(h), sub: TL.actions.roleLabel(h) + ' · age ' + h.age, right: s.will === h.id ? '✔ Main heir' : '', onClick: function () { s.will = h.id; done('I updated my will. ' + h.first + ' is my main heir.'); } });
      });
      if (s.will) items.push({ icon: '🗑️', label: 'Split my estate equally', onClick: function () { s.will = null; done('My estate will be split equally.'); } });
      return items;
    });
  }
  function willShare(c, heirs) {
    var s = S();
    if (heirs.length <= 1) return 1;
    var named = s.will && heirs.some(function (h) { return h.id === s.will; });
    if (!named) return 1 / heirs.length;
    return c.id === s.will ? 0.7 : 0.3 / (heirs.length - 1);
  }

  // ====================================================================
  // AWARDS (v1.3)
  // ====================================================================
  var FIELDS = { Physics: 'Physics', Chemistry: 'Chemistry', Biology: 'Medicine', Economics: 'Economics', English: 'Literature', Mathematics: 'Physics' };
  function nominate() {
    var s = S(), j = s.job, nom = null;
    if (s.prison) return;
    if (j && j.fame && j.level >= (j.career === 'athlete' ? 2 : 3)) {
      var p = 0.01 + s.fame / 900 + j.perf / 2500;
      var aw = { actor: ['Academy Award', me().gender === 'F' ? 'Best Actress' : 'Best Actor'], musician: ['Grammy Award', 'Album of the Year'], athlete: ['MVP Award', 'Most Valuable Player'] }[j.career];
      if (aw && U.chance(p)) nom = { award: aw[0], cat: aw[1], win: 0.08 + s.fame / 700 + j.perf / 1200 };
    }
    var fresh = s.books.filter(function (b) { return b.year === s.year - 1 && b.quality >= 80; })[0];
    if (!nom && fresh && U.chance((fresh.quality - 70) / 60)) nom = { award: 'Pulitzer Prize', cat: 'Fiction, for "' + fresh.title + '"', win: (fresh.quality - 60) / 60 };
    if (!nom && j && j.career === 'journalist' && j.level >= 2 && U.chance(0.04 + j.perf / 1500)) nom = { award: 'Pulitzer Prize', cat: 'Investigative Reporting', win: 0.35 + j.perf / 400 };
    if (!nom && j && (j.career === 'scientist' || j.career === 'professor') && j.level >= 2 && U.chance(0.005 + j.perf / 3000)) {
      var deg = s.degrees.filter(function (d) { return d.type === 'phd'; })[0];
      nom = { award: 'Nobel Prize', cat: FIELDS[deg && deg.major] || 'Physics', win: 0.3 + me().smarts / 300, nobel: true };
    }
    if (!nom && j && ['surgeon', 'doctor'].indexOf(j.career) >= 0 && j.level >= 2 && U.chance(0.003)) nom = { award: 'Nobel Prize', cat: 'Medicine', win: 0.35, nobel: true };
    if (nom) { nom.win -= (s.awards || []).length * 0.1; E.queue('award', nom); }
  }
  TL.events.defs.award = { id: 'award', scripted: true, w: 0, build: function (d) {
    function win(absent) {
      var s = S();
      s.awards = s.awards || [];
      s.awards.push({ award: d.award, cat: d.cat, year: s.year });
      E.fame(d.nobel ? 15 : 10); E.stat('happy', 20);
      if (d.nobel) { E.addMoney(E.$(1000000)); E.achieve('nobel'); }
      if (s.job && s.job.fame) s.job.mult = (s.job.mult || 1) * 1.2;
      E.achieve('award');
      return good('🏆 I won the ' + d.award + ' for ' + d.cat + '!' + (absent ? ' Someone accepted it on my behalf.' : '') + (d.nobel ? ' The prize includes ' + E.fmt(E.$(1000000)) + '.' : ''));
    }
    return { icon: '🏆', title: d.award, text: 'I\'ve been nominated for the ' + d.award + ' for ' + d.cat + '!', choices: [
      { label: 'Attend the ceremony', run: function () {
        if (U.chance(U.clamp(d.win, 0.05, 0.85))) return win(false);
        return U.pick(['I lost, but smiled and clapped for the winner.', 'I lost. The camera caught my face at the worst moment.', 'Another nominee won. I\'ll get it next time.']);
      } },
      { label: 'Give a speech if I win... about politics', run: function () {
        if (U.chance(U.clamp(d.win, 0.05, 0.85))) { var r = win(false); E.fame(3); r.text += ' My fiery speech went viral.'; return r; }
        return 'I lost, so nobody heard my speech.';
      } },
      { label: 'Skip the ceremony', run: function () { if (U.chance(U.clamp(d.win - 0.05, 0.05, 0.8))) return win(true); return 'I skipped it and didn\'t win anyway.'; } }
    ] };
  } };

  // ====================================================================
  // STUDENT LIFE (v1.3)
  // ====================================================================
  function schoolItems(e) {
    var s = S(), m = me(), items = [];
    if (e.stage === 'high' && m.age >= 15) {
      items.push({ icon: '📝', label: 'Take the SAT', sub: s.sat ? 'Best score: ' + s.sat : 'Boosts scholarship chances', disabled: used('sat') > 0, onClick: function () {
        use('sat');
        var score = U.clamp(Math.round((400 + m.smarts * 8 + e.grade * 3 + U.rand(-120, 120)) / 10) * 10, 400, 1600);
        s.sat = Math.max(s.sat || 0, score);
        done(score >= 1400 ? good('I scored ' + score + ' on the SAT! 🎉') : score < 900 ? bad('I scored ' + score + ' on the SAT.') : 'I scored ' + score + ' on the SAT.');
      } });
    }
    if (e.stage === 'high' || e.stage === 'uni') {
      items.push({ icon: '🗳️', label: 'Run for class president', disabled: used('council') > 0 || e.president, sub: e.president ? 'I\'m class president' : '', onClick: function () {
        use('council');
        if (U.chance(0.15 + (e.popularity || 30) / 150 + m.looks / 400)) { e.president = true; e.popularity = Math.min(100, (e.popularity || 30) + 15); return done(good('I was elected class president! 🎉')); }
        done(bad('I lost the election by ' + U.rand(2, 60) + ' votes.'));
      } });
    }
    if (e.stage !== 'uni') return items;
    if (!e.greek) items.push({ icon: '🏛️', label: 'Rush a ' + (m.gender === 'M' ? 'fraternity' : 'sorority'), disabled: used('rush') > 0, onClick: function () {
      use('rush');
      var name = U.pick(['Alpha', 'Beta', 'Delta', 'Gamma', 'Kappa', 'Sigma', 'Omega', 'Theta', 'Zeta']) + ' ' + U.pick(['Chi', 'Pi', 'Tau', 'Phi', 'Nu', 'Rho', 'Psi']);
      if (!U.chance(0.35 + m.looks / 250 + (e.popularity || 30) / 300)) return done(bad(name + ' didn\'t offer me a bid.'));
      if (U.chance(0.15)) E.stat('health', -U.rand(5, 15));
      e.greek = name; e.popularity = Math.min(100, (e.popularity || 30) + 20); E.stat('happy', 10);
      E.addPerson({ role: 'friend', age: m.age, rel: U.rand(55, 80), gender: m.gender });
      done(good('I joined ' + name + '! I made a lifelong friend during pledging.'));
    } });
    items.push({ icon: '🎉', label: 'Go to a campus party', onClick: function () {
      var f = diminish('campusparty');
      E.stat('happy', 6 * f); e.grade = Math.max(0, e.grade - 1);
      if (U.chance(0.12 * f) && !E.partner()) { var c = E.addPerson({ role: 'partner', age: m.age + U.rand(-2, 2), gender: m.interest === 'A' ? undefined : m.interest, rel: 55 }); return done(good('I hit it off with ' + c.first + ' at the party. We\'re dating!')); }
      if (U.chance(0.1)) { E.stat('health', -6); return done(bad('I woke up with the worst hangover of my life.')); }
      done('I partied at ' + (e.greek ? 'the ' + e.greek + ' house' : 'a dorm') + ' until sunrise.');
    } });
    if (e.year >= 2) items.push({ icon: '🧑‍💼', label: 'Apply for an internship', sub: s.internships ? U.plural(s.internships, 'internship') + ' so far' : 'Helps land a job later', disabled: used('intern') > 0, onClick: function () {
      use('intern');
      if (!U.chance(0.2 + e.grade / 150 + m.smarts / 400)) return done(bad('Every company rejected my internship applications.'));
      s.internships = (s.internships || 0) + 1;
      var pay = E.$(U.rand(2000, 9000)); E.addMoney(pay);
      done(good('I landed a summer internship at ' + U.pick(['Apex', 'Summit', 'Nova', 'Atlas', 'Pioneer', 'Vertex']) + ' ' + U.pick(['Labs', 'Group', 'Capital', 'Media', 'Health']) + ' and earned ' + E.fmt(pay) + '.'));
    } });
    if (!e.abroad) {
      var cost = E.$(15000);
      items.push({ icon: '🌍', label: 'Study abroad for a semester', right: E.fmt(cost), onClick: function () {
        var place = U.pick(['Florence', 'Barcelona', 'Tokyo', 'Seoul', 'Paris', 'Cape Town', 'Buenos Aires', 'Prague', 'Sydney', 'Edinburgh']);
        if (S().money >= cost) E.addMoney(-cost); else S().studentDebt += cost;
        e.abroad = place; E.stat('happy', 12); E.stat('smarts', 4); S().counts.vacations++;
        if (U.chance(0.25) && !E.partner()) { var c = E.addPerson({ role: 'partner', age: m.age + U.rand(-2, 3), gender: m.interest === 'A' ? undefined : m.interest, rel: 65, country: U.pick(D.COUNTRIES).name }); return done(good('I studied abroad in ' + place + ' and fell for ' + c.first + '! 💕')); }
        done(good('I spent an unforgettable semester studying in ' + place + '. 🌍'));
      } });
    }
    return items;
  }

  // ====================================================================
  // LANDLORD (v1.3)
  // ====================================================================
  function yearlyTenants() {
    var s = S(), rented = s.assets.filter(function (a) { return a.kind === 'house' && a.rented; });
    if (rented.length >= 3) E.achieve('landlord');
    var pick = rented.filter(function () { return U.chance(0.18); })[0];
    if (pick) E.queue('tenant', { aid: pick.id, kind: U.pick(['late', 'damage', 'buy', 'party']) });
  }
  TL.events.defs.tenant = { id: 'tenant', scripted: true, w: 0, build: function (d) {
    var h = S().assets.filter(function (a) { return a.id === d.aid && a.rented; })[0];
    if (!h) return null;
    var t = E.makePerson({ age: U.rand(22, 70) }), rent = h.rentIncome || Math.round(h.value * 0.055);
    if (d.kind === 'late') return { icon: '🏚️', title: 'Tenant trouble', text: 'My tenant ' + t.first + ' at ' + h.name + ' is 3 months behind on rent.', choices: [
      { label: 'Evict them', run: function () { E.addMoney(-Math.round(rent / 4)); E.karma(-2); return 'I evicted ' + t.first + '. The legal fees ate into my rent.'; } },
      { label: 'Offer a payment plan', run: function () { E.karma(3); if (U.chance(0.7)) return good(t.first + ' caught up on the rent. Crisis averted.'); E.addMoney(-Math.round(rent / 3)); return bad(t.first + ' skipped town without paying.'); } },
      { label: 'Forgive the debt', run: function () { E.karma(6); E.addMoney(-Math.round(rent / 4)); return good(t.first + ' cried and thanked me. It felt good to help.'); } }
    ] };
    if (d.kind === 'damage') return { icon: '🔨', title: 'Property damage', text: 'My tenants at ' + h.name + ' ' + U.pick(['flooded the bathroom', 'let their dog chew the floors', 'punched holes in the walls', 'painted every room black']) + '.', choices: [
      { label: 'Keep their deposit', run: function () { h.cond = Math.max(0, h.cond - 8); return 'Their deposit covered most of the repairs.'; } },
      { label: 'Sue them', run: function () { if (U.chance(0.55)) { E.addMoney(Math.round(rent / 3)); return good('I won in small claims court.'); } E.addMoney(-E.$(2000)); h.cond = Math.max(0, h.cond - 15); return bad('I lost the case and paid for the repairs myself.'); } },
      { label: 'Fix it myself', run: function () { E.addMoney(-Math.round(h.value * 0.02)); h.cond = Math.min(100, h.cond + 5); return 'I spent a weekend repairing ' + h.name + '.'; } }
    ] };
    if (d.kind === 'buy') { var offer = Math.round(h.value * U.randf(1.02, 1.2)); return { icon: '🤝', title: 'Purchase offer', text: 'My tenant ' + t.first + ' loves ' + h.name + ' and offers to buy it for ' + E.fmt(offer) + '.', choices: [
      { label: 'Sell it', run: function () { E.addMoney(offer - (h.loan || 0)); S().assets = S().assets.filter(function (a) { return a !== h; }); return good('I sold ' + h.name + ' to ' + t.first + ' for ' + E.fmt(offer) + '.'); } },
      { label: 'Keep renting', run: function () { return 'I politely declined.'; } }
    ] }; }
    return { icon: '🎶', title: 'Noise complaints', text: 'Neighbors say my tenants at ' + h.name + ' throw loud parties every weekend.', choices: [
      { label: 'Warn the tenants', run: function () { return U.chance(0.7) ? 'The parties stopped.' : bad('They ignored me. The HOA fined me ' + E.fmt(E.$(500)) + '.'); } },
      { label: 'Ignore it', run: function () { h.value = Math.round(h.value * 0.99); return 'The neighbors aren\'t happy with me.'; } }
    ] };
  } };

  // ====================================================================
  // BUCKET LIST (v1.4)
  // ====================================================================
  var BUCKET = [
    { id: 'married', icon: '💍', text: 'Get married', check: function (s) { return s.ach.indexOf('married') >= 0; } },
    { id: 'parent', icon: '👶', text: 'Have a child', check: function (s) { return E.people('child', true).length > 0; } },
    { id: 'home', icon: '🏠', text: 'Buy a home', check: function (s) { return s.ach.indexOf('homeowner') >= 0; } },
    { id: 'degree', icon: '🎓', text: 'Earn a college degree', check: function () { return E.hasDegree('bachelor'); } },
    { id: 'million', icon: '💰', text: 'Become a millionaire', check: function () { return E.netWorth() >= E.$(1000000); } },
    { id: 'travel', icon: '✈️', text: 'Take 3 vacations', check: function (s) { return s.counts.vacations >= 3; } },
    { id: 'aurora', icon: '🌌', text: 'See the Northern Lights', check: function (s) { return !!s.flags.aurora; } },
    { id: 'skydive', icon: '🪂', text: 'Go skydiving', check: function (s) { return !!s.flags.skydive; } },
    { id: 'marathon', icon: '🏃', text: 'Run a marathon', check: function (s) { return !!s.flags.marathon; } },
    { id: 'book', icon: '📖', text: 'Write a book', check: function (s) { return s.books.length > 0; } },
    { id: 'skill', icon: '🎯', text: 'Master a skill (60+)', check: function (s) { return SKILLS.some(function (k) { return (s.skills[k.id] || 0) >= 60; }); } },
    { id: 'followers', icon: '📱', text: 'Reach 10,000 followers', check: function (s) { return s.followers >= 10000; } },
    { id: 'pet', icon: '🐾', text: 'Adopt a pet', check: function (s) { return !!s.flags.hadPet || s.pets.length > 0; } },
    { id: 'top', icon: '🏆', text: 'Reach the top of a career', check: function (s) { return s.ach.indexOf('ceo') >= 0; } },
    { id: 'ninety', icon: '🎂', text: 'Live to 90', check: function () { return me().age >= 90; } },
    { id: 'contest', icon: '🥇', text: 'Win a competition', check: function (s) { return !!s.flags.contestWin; } },
    { id: 'celeb', icon: '🤩', text: 'Meet a celebrity', check: function (s) { return !!s.flags.metCeleb; } },
    { id: 'bff', icon: '🤝', text: 'Have a best friend', check: function (s) { return s.people.some(function (p) { return p.role === 'best friend'; }); } },
    { id: 'famous', icon: '⭐', text: 'Become famous', check: function (s) { return s.fame >= 50; } },
    { id: 'business', icon: '📈', text: 'Start a business', check: function (s) { return s.ach.indexOf('entrepreneur') >= 0; } },
    { id: 'volunteer', icon: '🙏', text: 'Volunteer 3 times', check: function (s) { return (s.flags.volunteered || 0) >= 3; } },
    { id: 'retire', icon: '🌅', text: 'Retire from a career', check: function (s) { return s.ach.indexOf('retired') >= 0; } }
  ];
  function bucket() {
    var s = S();
    if (!s.bucket) s.bucket = U.shuffle(BUCKET).slice(0, 5).map(function (b) { return { id: b.id, done: false }; });
    return s.bucket;
  }
  function bucketDef(id) { return BUCKET.filter(function (b) { return b.id === id; })[0]; }
  function checkBucket() {
    var s = S(), list = bucket(), newly = 0;
    list.forEach(function (b) {
      var d = bucketDef(b.id);
      if (!b.done && d && d.check(s)) {
        b.done = true; b.age = me().age; newly++;
        E.log('✅ Bucket list: ' + d.text + '!', 'good');
        E.stat('happy', 8);
      }
    });
    if (newly && list.every(function (b) { return b.done; })) {
      E.log('📝 I checked off everything on my bucket list!', 'good');
      E.achieve('bucketlist');
    }
  }
  function bucketMenu() {
    ui().menu('Bucket list 📝', function () {
      var list = bucket(), n = list.filter(function (b) { return b.done; }).length;
      return [{ info: true, html: '<p class="muted">' + n + ' of ' + list.length + ' done. Every life gets its own list.</p>' }].concat(list.map(function (b) {
        var d = bucketDef(b.id) || { icon: '•', text: b.id };
        return { icon: d.icon, label: d.text, sub: b.done ? 'Done at age ' + b.age : 'Not yet', check: !!b.done };
      }));
    });
  }
  function bucketCount() { var l = bucket(); return l.filter(function (b) { return b.done; }).length + '/' + l.length; }

  // ====================================================================
  // hooks
  // ====================================================================
  function yearly() {
    yearlyCreative();
    yearlyRoyal();
    yearlyMob();
    yearlyTenants();
    nominate();
    if (TL.extras) TL.extras.yearly();
    if (TL.sports) TL.sports.yearly();
    if (TL.hoops) TL.hoops.yearly();
    if (TL.military) TL.military.yearly();
    if (TL.creator) TL.creator.yearly();
  }
  // Called by continueAs after the heir's new life exists.
  function inherit(prev, c, st, heirs) {
    inheritRoyal(prev, c, st, heirs);
  }

  return {
    SKILLS: SKILLS, skill: skill, skillBonus: skillBonus, skillsMenu: skillsMenu,
    makeRoyal: makeRoyal, royalBirthLog: royalBirthLog, royalTitle: title, royalMenu: royalMenu, onDeath: onDeath, lineOf: lineOf,
    schoolItems: schoolItems, bucketMenu: bucketMenu, checkBucket: checkBucket, bucketCount: bucketCount, bucket: bucket,
    mobMenu: mobMenu, mobTitle: mobTitle, willMenu: willMenu, willShare: willShare,
    yearly: yearly, inherit: inherit
  };
})();
