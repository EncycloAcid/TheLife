/* TheLife — DOM rendering: screens, the life log, stat bars, bottom-sheet menus
 * and modal dialogs. */
TL.ui = (function () {
  var U = TL.util, D = TL.data, E = TL.engine;
  var $ = function (sel) { return document.querySelector(sel); };
  var sheets = [];          // stack of {title, build}
  var dialogQueue = [];     // pending dialogs
  var dialogOpen = false;
  var screen = 'home';

  function S() { return TL.S; }

  // ---------------------------------------------------------------- screens
  function show(name) {
    screen = name;
    ['home', 'create', 'game', 'death', 'list'].forEach(function (n) {
      var el = $('#screen-' + n);
      if (el) el.classList.toggle('active', n === name);
    });
    closeAll();
    var t = $('#toast');
    if (t) t.classList.remove('show');
  }

  function home() {
    var saves = E.listSaves();
    var alive = saves.filter(function (x) { return !x.dead; });
    var el = $('#home-actions');
    el.innerHTML = '';
    if (alive.length) {
      var c = addBtn(el, '', 'primary continue', function () { if (E.load(alive[0].id)) startGame(); });
      var initials = alive[0].name.split(' ').map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase();
      c.innerHTML = '<span class="c-play">' + U.esc(initials) + '</span><span class="c-text"><b>Continue</b><small>' + U.esc(alive[0].name) + ' · age ' + alive[0].age + ' · ' + D.country(alive[0].country).flag + '</small></span><span class="c-go">' + TL.icons('chev') + '</span>';
    }
    var row = document.createElement('div'); row.className = 'row2'; el.appendChild(row);
    addBtn(row, '＋ New Life', alive.length ? '' : 'primary', function () { createScreen(); });
    addBtn(row, '🎲 Random', '', function () { E.newLife({}); E.save(); startGame(); });
    var g = E.loadGlobal();
    var tiles = document.createElement('div'); tiles.className = 'tiles'; el.appendChild(tiles);
    [['📂', 'Saved lives', U.plural(saves.length, 'life').replace('lifes', 'lives'), savesScreen, !saves.length],
     ['🪦', 'Graveyard', U.plural(g.history.length, 'grave'), graveyard],
     ['🏆', 'Trophies', g.ach.length + ' of ' + D.ACHIEVEMENTS.length, function () { listScreen('Achievements', D.ACHIEVEMENTS.map(function (a) { var got = g.ach.indexOf(a.id) >= 0; return { icon: got ? a.icon : '🔒', label: a.name, sub: a.desc, check: got }; })); }],
     ['💾', 'Backup', '', backupMenu], ['⚙️', 'Settings', '', settingsMenu]].forEach(function (t) {
      if (t[4]) return;
      var b = document.createElement('button');
      b.className = 'tile';
      b.innerHTML = '<span class="t-ico">' + t[0] + '</span><span class="t-text"><span class="t-label">' + t[1] + '</span>' + (t[2] !== '' ? '<small>' + t[2] + '</small>' : '') + '</span>';
      b.onclick = t[3];
      tiles.appendChild(b);
    });
    show('home');
  }
  function addBtn(parent, label, cls, fn) {
    var b = document.createElement('button');
    b.className = 'btn ' + (cls || '');
    b.textContent = label;
    b.onclick = fn;
    parent.appendChild(b);
    return b;
  }
  function listScreen(title, items, back) {
    $('#list-title').textContent = title;
    var body = $('#list-body');
    body.innerHTML = '';
    if (!items.length) body.innerHTML = '<p class="muted center">Nothing here yet.</p>';
    items.forEach(function (it) { body.appendChild(menuItem(it)); });
    $('#list-back').onclick = back || home;
    show('list');
  }
  function savesScreen() {
    var saves = E.listSaves();
    listScreen('Saved Lives', saves.map(function (sv) {
      return { icon: sv.dead ? '🪦' : '🙂', label: sv.name + (sv.gen > 1 ? ' (Gen ' + sv.gen + ')' : ''), sub: 'Age ' + sv.age + ' · ' + sv.country + ' · ' + new Date(sv.updated).toLocaleDateString(), onClick: function () {
        choose(sv.name, 'What do you want to do with this life?', [
          { label: sv.dead ? 'View' : 'Play', fn: function () { if (E.load(sv.id)) { if (S().dead) { startGame(); deathScreen(); } else startGame(); } } },
          { label: 'Delete', fn: function () { E.deleteSave(sv.id); savesScreen(); } },
          { label: 'Cancel', fn: function () { } }
        ]);
      } };
    }));
  }
  function graveyard() {
    var h = E.loadGlobal().history;
    listScreen('Graveyard', h.map(function (x) {
      return { icon: '🪦', label: x.name + ' (' + x.age + ')', sub: x.ribbon + ' · ' + x.cause + ' · ' + x.worth + ' · ' + x.country + (x.gen > 1 ? ' · Gen ' + x.gen : '') };
    }));
  }

  function backupMenu() {
    choose('Backup & Restore', 'Copy a backup code to keep your lives safe, or paste one to restore them on this or another device.', [
      { label: 'Create backup code', fn: function () {
        var code = E.exportAll();
        showDialog({ title: 'Backup code', text: 'Copy this code and keep it somewhere safe.', area: code, buttons: [
          { label: 'Copy', cls: 'primary', fn: function (v) { copyText(code); alert('', 'Backup code copied to clipboard.', 'good'); } },
          { label: 'Close', cls: 'ghost' }
        ] });
      } },
      { label: 'Restore from code', fn: function () {
        showDialog({ title: 'Restore', text: 'Paste your backup code below.', area: '', buttons: [
          { label: 'Restore', cls: 'primary', fn: function (v) { var r = E.importAll(v || ''); alert('', r.msg, r.ok ? 'good' : 'bad', home); } },
          { label: 'Cancel', cls: 'ghost' }
        ] });
      } }
    ]);
  }
  var TEXT_SIZES = [['Small', 14], ['Normal', 16], ['Large', 18], ['Extra large', 20]];
  var THEMES = [['system', 'Match my phone', '📱'], ['dark', 'Dark', '🌙'], ['light', 'Light', '☀️']];
  function applySettings() {
    var st = E.loadGlobal().settings || {};
    document.documentElement.style.fontSize = (st.textSize || 16) + 'px';
    if (st.theme && st.theme !== 'system') document.documentElement.setAttribute('data-theme', st.theme);
    else document.documentElement.removeAttribute('data-theme');
    syncSystemBars();
  }
  // Tell the Android wrapper which color and icon style to use for the
  // status/navigation bar areas so they blend with the current theme.
  function syncSystemBars() {
    try {
      var bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta && bg) meta.setAttribute('content', bg);
      var dark = document.documentElement.getAttribute('data-theme') === 'dark' ||
        (!document.documentElement.getAttribute('data-theme') && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
      if (window.TheLifeAndroid && TheLifeAndroid.setSystemBars) TheLifeAndroid.setSystemBars(bg, !!dark);
    } catch (e) { }
  }
  function settingsMenu() {
    menu('Settings', function () {
      var g = E.loadGlobal(), st = g.settings || {}, size = st.textSize || 16, theme = st.theme || 'system';
      function set(key, val) { g.settings = g.settings || {}; g.settings[key] = val; E.saveGlobal(g); applySettings(); renderSheet(); }
      return [{ section: 'Theme' }].concat(THEMES.map(function (t) {
        return { icon: t[2], label: t[1], radio: t[0] === theme, onClick: function () { set('theme', t[0]); } };
      }), [{ section: 'Text size' }], TEXT_SIZES.map(function (t) {
        return { icon: '<b style="font-size:' + (t[1] - 3) + 'px">Aa</b>', label: t[0], radio: t[1] === size, onClick: function () { set('textSize', t[1]); } };
      }), [{ section: 'Feel' }, { icon: '📳', label: 'Haptics', sub: 'A light buzz when you age up and choose', toggle: st.haptics !== false, onClick: function () { set('haptics', st.haptics === false); haptic(); } }], [{ section: 'Data' }, { icon: '🗑️', label: 'Delete all data', sub: 'Lives, achievements and the graveyard', danger: true, onClick: function () {
        confirm('Delete everything?', 'All saved lives, achievements and the graveyard will be permanently erased. Make a backup first if you want to keep them.', function () {
          closeAll(); E.wipeAll(); home(); alert('', 'All data deleted.', '');
        });
      } }]);
    });
  }
  function copyText(t) {
    try { if (navigator.clipboard) { navigator.clipboard.writeText(t); return; } } catch (e) { }
    var a = $('#d-area'); a.style.display = ''; a.value = t; a.select();
    try { document.execCommand('copy'); } catch (e) { }
  }
  function createScreen() {
    var sel = $('#c-country');
    if (!sel.options.length) {
      D.COUNTRIES.forEach(function (c) { var o = document.createElement('option'); o.value = c.name; o.textContent = c.flag + ' ' + c.name; sel.appendChild(o); });
    }
    sel.value = U.pick(D.COUNTRIES).name;
    $('#c-gender').value = U.chance(0.5) ? 'M' : 'F';
    randomName();
    rerollStats();
    show('create');
  }
  function randomName() {
    var c = D.country($('#c-country').value);
    var g = $('#c-gender').value;
    $('#c-first').value = U.pick(g === 'M' ? c.male : c.female);
    $('#c-last').value = U.pick(c.last);
  }
  var STAT_ROWS = [['happy', '😊 Happiness'], ['health', '❤️ Health'], ['smarts', '🧠 Smarts'], ['looks', '✨ Looks']];
  function rerollStats() {
    var box = $('#c-stats');
    box.innerHTML = STAT_ROWS.map(function (r) {
      var v = r[0] === 'happy' ? U.rand(60, 100) : r[0] === 'health' ? U.rand(70, 100) : U.rand(5, 100);
      return '<div class="slider"><span>' + r[1] + '</span><input type="range" min="0" max="100" value="' + v + '" data-k="' + r[0] + '"><b>' + v + '</b></div>';
    }).join('');
    Array.prototype.forEach.call(box.querySelectorAll('input'), function (inp) {
      inp.oninput = function () { inp.nextElementSibling.textContent = inp.value; };
    });
  }
  function createLife() {
    var g = $('#c-gender').value;
    var interest = $('#c-interest').value;
    if (interest === 'auto') interest = g === 'M' ? 'F' : 'M';
    E.newLife({ first: $('#c-first').value.trim().slice(0, 20) || undefined, last: $('#c-last').value.trim().slice(0, 24) || undefined, gender: g, country: $('#c-country').value, interest: interest, royal: $('#c-royal').checked, wealth: $('#c-wealth').value || undefined, stats: readStats() });
    E.save();
    startGame();
  }

  function startGame() {
    show('game');
    refresh();
    scrollLog();
    runPending();
  }

  // ---------------------------------------------------------------- game screen
  function readStats() {
    var o = {};
    Array.prototype.forEach.call(document.querySelectorAll('#c-stats input'), function (inp) { o[inp.getAttribute('data-k')] = +inp.value; });
    return o;
  }
  // Net worth and happiness across a life, as an inline SVG.
  function lifeChart(hist) {
    if (!hist || hist.length < 3) return '<p class="muted">Not enough history to chart yet.</p>';
    var W = 320, H = 120, P = 6;
    var ws = hist.map(function (h) { return h[1]; });
    var lo = Math.min(0, Math.min.apply(null, ws)), hi = Math.max(1, Math.max.apply(null, ws));
    var a0 = hist[0][0], a1 = hist[hist.length - 1][0] || a0 + 1;
    function x(a) { return P + (a - a0) / Math.max(1, a1 - a0) * (W - 2 * P); }
    function pts(fn) { return hist.map(function (h) { return x(h[0]).toFixed(1) + ',' + fn(h).toFixed(1); }).join(' '); }
    var money = pts(function (h) { return H - P - (h[1] - lo) / (hi - lo) * (H - 2 * P); });
    var happy = pts(function (h) { return H - P - h[2] / 100 * (H - 2 * P); });
    var zero = H - P - (0 - lo) / (hi - lo) * (H - 2 * P);
    return '<div class="chart"><svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Net worth and happiness over my life">' +
      '<line x1="' + P + '" x2="' + (W - P) + '" y1="' + zero.toFixed(1) + '" y2="' + zero.toFixed(1) + '" stroke="var(--line)" stroke-width="1"/>' +
      '<polyline points="' + happy + '" fill="none" stroke="var(--mid)" stroke-width="1.6" stroke-linejoin="round" opacity=".8"/>' +
      '<polyline points="' + money + '" fill="none" stroke="var(--money)" stroke-width="2.4" stroke-linejoin="round"/></svg>' +
      '<div class="legend"><span class="lg-money">Net worth</span><span class="lg-happy">Happiness</span><em>Peak ' + E.fmt(hi) + ' · age ' + a0 + '–' + a1 + '</em></div></div>';
  }
  function obituary() {
    var s = S(), m = s.me, they = m.gender === 'M' ? 'He' : 'She', their = m.gender === 'M' ? 'his' : 'her';
    var parts = [];
    var rt = TL.features.royalTitle();
    parts.push((rt ? rt + ' ' : '') + m.first + ' ' + m.last + ' died at the age of ' + m.age + ' from ' + s.cause + ' in ' + E.countryName(s.country) + '.');
    var careers = s.jobHistory.map(function (h) { return h.title; }).concat(s.job ? [E.jobTitle(s.job)] : []);
    if (careers.length) parts.push(they + ' worked as ' + (careers.length > 1 ? E.an(careers[careers.length - 2]) + ' and later ' : '') + E.an(careers[careers.length - 1]) + '.');
    var deg = E.highestDegree();
    if (deg && deg.type !== 'hs') parts.push(they + ' held a ' + E.degreeName(deg) + '.');
    if (s.awards && s.awards.length) parts.push(they + ' won the ' + s.awards.map(function (a) { return a.award; }).filter(function (v, i, arr) { return arr.indexOf(v) === i; }).join(' and the ') + '.');
    if (s.books && s.books.length) parts.push(they + ' wrote ' + U.plural(s.books.length, 'book') + ', including "' + s.books[0].title + '".');
    if (s.record.length) parts.push(they + ' was convicted of ' + s.record.map(function (r) { return r.crime.toLowerCase(); }).slice(0, 3).join(', ') + '.');
    var sp = E.people('spouse')[0], kids = E.people('child'), gk = E.people('grandchild');
    var surv = [];
    if (sp) surv.push(their + ' ' + (sp.gender === 'M' ? 'husband' : 'wife') + ' ' + sp.first);
    if (kids.length) surv.push(U.plural(kids.length, 'child').replace('childs', 'children'));
    if (gk.length) surv.push(U.plural(gk.length, 'grandchild').replace('grandchilds', 'grandchildren'));
    parts.push(surv.length ? they + ' is survived by ' + surv.join(', ').replace(/, ([^,]*)$/, ' and $1') + '.' : they + ' left no surviving family.');
    return parts.join(' ');
  }
  function avatar(m) {
    if (!m) m = S().me;
    if (S().dead) return '💀';
    if (m.age < 3) return '👶';
    if (m.age < 13) return m.gender === 'M' ? '👦' : '👧';
    if (m.age >= 65) return m.gender === 'M' ? '👴' : '👵';
    return m.gender === 'M' ? '👨' : '👩';
  }
  function statusLine() {
    var s = S();
    if (s.dead) return 'Deceased';
    if (s.prison) return '⛓️ Inmate at ' + s.prison.name;
    var parts = [];
    var rt = TL.features.royalTitle();
    if (rt) parts.push('👑 ' + rt);
    if (s.job) parts.push(E.jobTitle(s.job));
    if (s.edu) parts.push(s.edu.stage === 'uni' ? s.edu.major + ' student' : s.edu.stage === 'grad' ? 'Grad student' : s.edu.school);
    if (parts.length === (rt ? 1 : 0)) parts.push(s.me.age < 5 ? 'Baby' : s.retired ? 'Retired' : s.me.age < 18 ? 'Kid' : 'Unemployed');
    return parts.join(' · ');
  }
  function renderHeader() {
    var s = S(), m = s.me, c = E.country();
    $('#h-avatar').textContent = avatar();
    $('#h-name').textContent = m.first + ' ' + m.last;
    $('#h-sub').textContent = c.flag + ' ' + statusLine();
    var cash = E.fmt(s.money);
    $('#h-money').textContent = cash;
    $('#h-money').className = 'money' + (s.money < 0 ? ' neg' : '') + (cash.length > 9 ? ' long' : '');
    $('#h-age').textContent = 'Age ' + m.age;
    $('#ageup-label').textContent = m.age < 1 ? 'Age' : 'Age';
  }
  // Four ring gauges. Built once, then updated in place so changes animate.
  var RING_R = 20, RING_C = 2 * Math.PI * RING_R;
  var STAT_DEFS = [['happy', '😊', 'Happy', 'var(--orange)'], ['health', '❤️', 'Health', 'var(--pink)'], ['smarts', '🧠', 'Smarts', 'var(--tint)'], ['looks', '✨', 'Looks', 'var(--purple)']];
  function renderStats() {
    var m = S().me, box = $('#stats');
    if (!box.querySelector('.ring')) {
      box.innerHTML = STAT_DEFS.map(function (d) {
        return '<div class="stat" data-k="' + d[0] + '" style="--c:' + d[3] + '"><div class="ring"><svg viewBox="0 0 50 50"><circle class="rb" cx="25" cy="25" r="' + RING_R + '"/><circle class="rf" cx="25" cy="25" r="' + RING_R + '" stroke-dasharray="' + RING_C.toFixed(1) + '" stroke-dashoffset="' + RING_C.toFixed(1) + '"/></svg><span class="ring-ico">' + d[1] + '</span></div><div class="stat-lbl">' + d[2] + ' <b></b></div></div>';
      }).join('');
    }
    STAT_DEFS.forEach(function (d) {
      var v = m[d[0]], el = box.querySelector('[data-k="' + d[0] + '"]');
      el.querySelector('.rf').setAttribute('stroke-dashoffset', (RING_C * (1 - v / 100)).toFixed(1));
      el.querySelector('b').textContent = v;
      el.classList.toggle('low', v < 25);
    });
  }
  function cls(v) { return v >= 66 ? 'hi' : v >= 33 ? 'mid' : 'lo'; }
  // A leading emoji becomes the entry's icon bubble; otherwise a small dot.
  // Built at runtime so an old WebView without Unicode property escapes falls
  // back to a surrogate-pair pattern instead of failing to parse this file.
  var LEAD_EMOJI;
  try {
    LEAD_EMOJI = new RegExp('^((?:\\p{Extended_Pictographic}|\\p{Regional_Indicator})(?:\\uFE0F|\\u200D(?:\\p{Extended_Pictographic}|\\p{Emoji_Modifier})|\\p{Emoji_Modifier}|\\p{Regional_Indicator})*)\\s*', 'u');
  } catch (e) {
    LEAD_EMOJI = /^((?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF])(?:\uFE0F|\u200D(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF])|[\uD800-\uDBFF][\uDC00-\uDFFF])*)\s*/;
  }
  var freshYear = false;
  function entryHtml(e) {
    var t = e.t == null ? '' : String(e.t);
    var m = t.match(LEAD_EMOJI), ico = m ? m[1] : null, txt = m ? t.slice(m[0].length) : t;
    return '<div class="entry ' + (e.c || '') + '"><span class="e-ico">' + (ico || '<span class="e-dot"></span>') + '</span><span class="e-txt">' + U.esc(txt) + (e.n > 1 ? '<span class="times">×' + e.n + '</span>' : '') + '</span></div>';
  }
  function renderLog() {
    var s = S(), el = $('#log');
    var years = s.log.slice(-60);
    var html = '';
    years.forEach(function (y, i) {
      var last = i === years.length - 1;
      html += '<div class="year' + (last ? ' latest' + (freshYear ? ' fresh' : '') : '') + '"><div class="year-h"><b>Age ' + y.age + '</b><span>' + y.year + '</span></div><div class="ycard">';
      if (!y.entries.length) html += entryHtml({ t: 'Nothing much happened.', c: 'quiet' });
      y.entries.forEach(function (e) { html += entryHtml(e); });
      html += '</div></div>';
    });
    el.innerHTML = html;
    freshYear = false;
  }
  function scrollLog() { var el = $('#log'); el.scrollTop = el.scrollHeight; }
  function refresh() {
    if (!S() || screen !== 'game') return;
    renderHeader(); renderStats(); renderLog();
    var dead = S().dead;
    $('#btn-ageup').disabled = dead;
    if (sheets.length) renderSheet();
    scrollLog();
  }
  function moreStats() {
    var s = S(), m = s.me, deg = E.highestDegree();
    var rows = [
      ['🏃 Athleticism', m.athl + '%'], ['🙏 Karma', karmaWord(s.karma)], ['⭐ Fame', s.fame + '%'],
      ['📱 Followers', s.followers.toLocaleString()], ['💰 Net worth', E.fmt(E.netWorth())],
      ['🎓 Education', E.degreeName(deg)], ['🎂 Birthday', D.MONTHS[m.month - 1] + ' ' + m.day + ' (' + m.zodiac + ')'],
      ['🌍 Country', E.country().flag + ' ' + s.country], ['🏡 Home', E.homeLabel()], ['📝 Bucket list', TL.features.bucketCount()], ['👑 Generation', s.gen], ['🦹 Criminal record', s.record.length ? s.record.map(function (r) { return r.crime; }).join(', ') : 'Clean'],
      ['🩺 Conditions', s.conditions.length ? s.conditions.join(', ') : 'None'], ['🏅 Achievements', s.ach.length]
    ];
    if (s.royal) rows.splice(3, 0, ['👑 Royalty', TL.features.royalTitle() + ' · ' + s.royal.house + ' · popularity ' + s.royal.popularity + '%']);
    if (s.mob) rows.push(['🕴️ Crime family', TL.features.mobTitle()]);
    rows = rows.concat(TL.extras.aboutRows());
    var sk = TL.features.SKILLS.filter(function (x) { return (s.skills || {})[x.id]; });
    if (sk.length) rows.push(['🎯 Skills', sk.map(function (x) { return x.name + ' ' + s.skills[x.id]; }).join(', ')]);
    if (s.books && s.books.length) rows.push(['📚 Books published', s.books.length]);
    if (s.awards && s.awards.length) rows.push(['🏆 Awards', s.awards.map(function (x) { return x.award + ' (' + x.year + ')'; }).join(', ')]);
    menu('About me', function () {
      return [{ info: true, html: lifeChart(s.hist) }, { info: true, html: '<table class="kvt">' + rows.map(function (r) { return '<tr><td>' + r[0] + '</td><td>' + U.esc(String(r[1])) + '</td></tr>'; }).join('') + '</table>' }];
    });
  }
  // Go back 1-5 years; also undoes a death.
  function timeMachine() {
    var ages = E.tmAges();
    if (!ages.length) return;
    choose('⏳ Time Machine', 'How far back do you want to go? Everything after that point will be undone.', ages.map(function (age, i) {
      return { label: 'Back ' + U.plural(i + 1, 'year') + ' (age ' + age + ')', fn: function () {
        if (!E.timeTravel(i + 1)) return;
        E.save();
        closeAll();
        if (screen !== 'game') show('game');
        refresh();
        scrollLog();
        toast('⏳ Welcome back to age ' + S().me.age + '.', 'good');
      } };
    }));
  }
  function moneyDelta(d) {
    var el = $('#h-delta');
    if (!el || !d) return;
    el.textContent = (d > 0 ? '+' : '−') + E.fmt(Math.abs(d));
    el.className = 'delta ' + (d > 0 ? 'up' : 'down');
    void el.offsetWidth;
    el.classList.add('show');
  }
  var toastTimer = null;
  // Brief, non-blocking result message (used for everyday actions).
  function toast(text, c) {
    var el = $('#toast');
    el.textContent = text;
    el.className = 'toast ' + (c || '');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, Math.min(5000, 1800 + text.length * 35));
  }
  function karmaWord(k) { return k >= 85 ? 'Saintly' : k >= 65 ? 'Good' : k >= 40 ? 'Neutral' : k >= 20 ? 'Shady' : 'Wicked'; }

  function ageUp() {
    var s = S();
    if (!s || s.dead) return;
    if (dialogOpen || s.pending.length) { runPending(); return; }
    closeAll();
    var before = s.money;
    freshYear = true;
    haptic();
    E.ageUp();
    E.save();
    refresh();
    moneyDelta(s.money - before);
    scrollLog();
    var btn = $('#btn-ageup');
    btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
    if (s.dead) { s.pending = []; setTimeout(deathScreen, 350); return; }
    runPending();
  }

  // ---------------------------------------------------------------- events
  function runPending() {
    var s = S();
    if (!s || dialogOpen) return;
    if (s.dead) {
      // Died during an event or action rather than at a birthday.
      s.pending = [];
      if (screen === 'game') { E.save(); setTimeout(deathScreen, 350); }
      return;
    }
    while (s.pending.length) {
      var p = s.pending[0], ev = null;
      // A broken event must never block aging up: drop it and move on.
      try { ev = TL.events.build(p); } catch (err) { if (window.console) console.error(err); }
      if (!ev) { s.pending.shift(); continue; }
      showDialog({
        icon: ev.icon, title: ev.title, text: ev.text,
        buttons: ev.choices.map(function (c, i) {
          return { label: c.label, fn: function () {
            var res = null;
            try { res = TL.events.resolve(i); } catch (err) { if (window.console) console.error(err); }
            E.checkAchievements();
            E.save();
            refresh();
            if (res) alert('', res.text, res.cls, function () { runPending(); });
            else runPending();
          } };
        })
      });
      return;
    }
    E.save();
  }

  // ---------------------------------------------------------------- dialogs
  function showDialog(cfg) {
    dialogQueue.push(cfg);
    if (!dialogOpen) nextDialog();
  }
  function nextDialog() {
    var cfg = dialogQueue.shift();
    var ov = $('#dialog');
    if (!cfg) { dialogOpen = false; ov.classList.remove('open'); return; }
    dialogOpen = true;
    // A title that starts with an emoji shows it in the icon bubble instead.
    var icon = cfg.icon || '', title = cfg.title || '', lead = !icon && title.match(LEAD_EMOJI);
    if (lead && lead[0].length < title.length) { icon = lead[1]; title = title.slice(lead[0].length); }
    $('#d-icon').textContent = icon;
    $('#d-icon').style.display = icon ? '' : 'none';
    $('#d-title').textContent = title;
    $('#d-title').style.display = title ? '' : 'none';
    var t = $('#d-text');
    t.textContent = cfg.text || '';
    t.className = 'd-text ' + (cfg.cls || '');
    var area = $('#d-area');
    area.style.display = cfg.area != null ? '' : 'none';
    if (cfg.area != null) { area.value = cfg.area; area.readOnly = !!cfg.area; }
    var inp = $('#d-input');
    inp.style.display = cfg.input != null ? '' : 'none';
    if (cfg.input != null) inp.value = cfg.input;
    var bx = $('#d-buttons');
    bx.innerHTML = '';
    cfg.buttons.forEach(function (b) {
      var btn = document.createElement('button');
      btn.className = 'btn ' + (b.cls || '');
      btn.textContent = b.label;
      btn.onclick = function () {
        if (cfg.buttons.length > 1) haptic();
        var val = cfg.area != null ? area.value : inp.value;
        dialogOpen = false;
        ov.classList.remove('open');
        if (b.fn) b.fn(val);
        if (!dialogOpen) nextDialog();
      };
      bx.appendChild(btn);
    });
    ov.classList.add('open');
  }
  function alert(title, text, c, cb) {
    showDialog({ title: title, text: text, cls: c, buttons: [{ label: 'OK', cls: 'primary', fn: cb }] });
  }
  function choose(title, text, options) {
    showDialog({ title: title, text: text, buttons: options.map(function (o) { return { label: o.label, fn: o.fn }; }).concat(options.length > 1 && !options.some(function (o) { return /^(cancel|not now)$/i.test(o.label); }) ? [{ label: 'Cancel', cls: 'ghost' }] : []) });
  }
  function confirm(title, text, yes) {
    showDialog({ title: title, text: text, buttons: [{ label: 'Yes', cls: 'danger', fn: yes }, { label: 'No', cls: 'ghost' }] });
  }
  function prompt(title, text, def, cb) {
    showDialog({ title: title, text: text, input: def || '', buttons: [{ label: 'OK', cls: 'primary', fn: function (v) { cb((v || '').trim()); } }, { label: 'Cancel', cls: 'ghost' }] });
  }

  // ---------------------------------------------------------------- sheets (menus)
  function menu(title, build) {
    sheets.push({ title: title, build: build });
    renderSheet();
    $('#sheet').classList.add('open');
    var body = $('#sheet-body');
    body.scrollTop = 0;
    body.classList.remove('enter'); void body.offsetWidth; body.classList.add('enter');
    clearTimeout(menu.t);
    menu.t = setTimeout(function () { body.classList.remove('enter'); }, 450);
  }
  function setActiveNav(id) {
    ['nav-occ', 'nav-assets', 'nav-rel', 'nav-act'].forEach(function (n) { var b = $('#' + n); if (b) b.classList.toggle('active', n === id); });
  }
  function renderSheet() {
    var top = sheets[sheets.length - 1];
    if (!top) return;
    $('#sheet-title').textContent = top.title;
    var sb = $('#sheet-back');
    sb.innerHTML = sheets.length > 1 ? TL.icons('back') + '<span>Back</span>' : '<span>Done</span>';
    sb.classList.toggle('done', sheets.length <= 1);
    sb.parentNode.classList.toggle('root', sheets.length <= 1);
    sb.setAttribute('aria-label', sheets.length > 1 ? 'Back' : 'Done');
    var body = $('#sheet-body'), st = body.scrollTop;
    body.innerHTML = '';
    var items = top.build(), group = null;
    // Consecutive tappable rows share one rounded card, like native settings lists.
    items.forEach(function (it) {
      var el = menuItem(it);
      if (it.section || it.info) { group = null; body.appendChild(el); return; }
      if (!group) { group = document.createElement('div'); group.className = 'group'; body.appendChild(group); }
      group.appendChild(el);
    });
    body.scrollTop = st;
  }
  function menuItem(it) {
    var el;
    if (it.section) { el = document.createElement('div'); el.className = 'section'; el.textContent = it.section; return el; }
    if (it.info) { el = document.createElement('div'); el.className = 'info'; el.innerHTML = it.html; return el; }
    el = document.createElement('button');
    el.className = 'item' + (it.disabled ? ' disabled' : '') + (it.danger ? ' danger' : '');
    var html = '<span class="i-ico" style="--h:' + hue(it.label) + '">' + (it.icon || '•') + '</span><span class="i-main"><span class="i-label">' + U.esc(it.label) + '</span>';
    if (it.sub) html += '<span class="i-sub">' + U.esc(it.sub) + '</span>';
    if (it.bar != null) html += '<span class="track small"><span class="fill ' + cls(it.bar) + '" style="width:' + it.bar + '%"></span></span>';
    html += '</span>';
    var check = it.check != null ? it.check : it.right === '✔' ? true : null;
    if (it.toggle != null) html += '<span class="i-switch' + (it.toggle ? ' on' : '') + '" role="switch" aria-checked="' + !!it.toggle + '"></span>';
    else if (it.radio != null) html += '<span class="i-tick">' + (it.radio ? TL.icons('check') : '') + '</span>';
    else if (check != null) html += '<span class="i-check' + (check ? ' on' : '') + '">' + (check ? TL.icons('check') : '') + '</span>';
    else if (it.right) html += '<span class="i-right">' + U.esc(it.right) + '</span>';
    else if (it.onClick && !it.disabled) html += '<span class="i-chev">' + TL.icons('chev') + '</span>';
    el.innerHTML = html;
    if (it.onClick && !it.disabled) el.onclick = function () { it.onClick(); };
    else if (!it.onClick) el.classList.add('static');
    return el;
  }
  // Stable pastel hue per label for icon bubbles.
  // A light tap of the vibration motor, like iOS haptics (Settings > Haptics).
  function haptic() {
    try { if ((E.loadGlobal().settings || {}).haptics !== false && navigator.vibrate) navigator.vibrate(8); } catch (e) { }
  }
  function hue(label) {
    var h = 0, s = String(label || '');
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }
  function back() {
    sheets.pop();
    if (!sheets.length) { $('#sheet').classList.remove('open'); setActiveNav(null); return; }
    renderSheet();
  }
  function closeAll() {
    sheets = [];
    var sh = $('#sheet');
    if (sh) sh.classList.remove('open');
    setActiveNav(null);
  }

  // ---------------------------------------------------------------- death
  function deathScreen() {
    var s = S(), m = s.me, rb = E.ribbon(), deg = E.highestDegree();
    $('#death-name').textContent = m.first + ' ' + m.last;
    $('#death-sub').textContent = 'Died at age ' + m.age + ' from ' + s.cause + ' (' + s.year + ')';
    $('#death-ribbon').innerHTML = '<div class="ribbon-ico">' + rb[0] + '</div><div><b>' + rb[1] + '</b><br><span class="muted">' + rb[2] + '</span></div>';
    var spouse = E.people('spouse')[0];
    var kids = E.people('child', true);
    var last = s.jobHistory.length ? s.jobHistory[s.jobHistory.length - 1].title : null;
    var rows = [
      ['Net worth', E.fmt(E.netWorth())], ['Education', E.degreeName(deg)], ['Career', s.job ? E.jobTitle(s.job) : last || 'None'],
      ['Spouse', spouse ? spouse.first + ' ' + spouse.last : 'None'], ['Children', kids.length], ['Exes', s.counts.exes],
      ['Fame', s.fame + '%'], ['Awards', (s.awards || []).length], ['Crimes', s.record.length ? s.record.length + ' convictions' : 'None'], ['Achievements', s.ach.length]
    ];
    $('#death-obit').textContent = obituary();
    $('#death-chart').innerHTML = lifeChart(s.hist);
    $('#death-stats').innerHTML = rows.map(function (r) { return '<div class="dstat"><small>' + r[0] + '</small><b>' + U.esc(String(r[1])) + '</b></div>'; }).join('');
    var box = $('#death-actions');
    box.innerHTML = '';
    var heirs = E.heirs();
    heirs.forEach(function (c) {
      addBtn(box, '👑 Continue as ' + c.first + ' (' + c.age + ')', 'primary', function () { E.continueAs(c.id); E.save(); startGame(); });
    });
    if (E.tmAges().length) addBtn(box, '⏳ Time Machine: go back up to ' + U.plural(E.tmAges().length, 'year'), heirs.length ? '' : 'primary', timeMachine);
    addBtn(box, '＋ New Life', heirs.length || E.tmAges().length ? '' : 'primary', createScreen);
    addBtn(box, '📜 Read my life story', '', function () { show('game'); refresh(); });
    addBtn(box, '🏠 Main Menu', 'ghost', home);
    show('death');
  }

  // ---------------------------------------------------------------- back button
  // Returns true if the back press was handled (used by the Android wrapper).
  function handleBack() {
    if (dialogOpen) return true; // dialogs require a choice
    if (sheets.length) { back(); return true; }
    if (screen === 'game') {
      if (S() && S().dead) { deathScreen(); return true; }
      home(); return true;
    }
    if (screen !== 'home') { home(); return true; }
    return false;
  }

  function init() {
    $('#btn-ageup').onclick = ageUp;
    [['nav-occ', 'occupationMenu'], ['nav-assets', 'assetsMenu'], ['nav-rel', 'relationshipsMenu'], ['nav-act', 'activitiesMenu']].forEach(function (n) {
      $('#' + n[0]).onclick = function () { closeAll(); if (!S().dead) { TL.actions[n[1]](); if (sheets.length) setActiveNav(n[0]); } };
    });
    $('#sheet-back').onclick = back;
    $('#sheet-scrim').onclick = closeAll;
    $('#stats').onclick = moreStats;
    $('#h-menu').onclick = function () { E.save(); home(); };
    $('#c-random').onclick = randomName;
    $('#c-country').onchange = randomName;
    $('#c-gender').onchange = randomName;
    $('#c-start').onclick = createLife;
    $('#c-reroll').onclick = rerollStats;
    $('#c-back').onclick = home;
    applySettings();
    // Swipe a sheet down to dismiss it, like an iOS page sheet.
    (function () {
      var panel = document.querySelector('.sheet-panel'), body = $('#sheet-body'), y0 = null, dy = 0;
      panel.addEventListener('touchstart', function (e) {
        y0 = body.contains(e.target) && body.scrollTop > 0 ? null : e.touches[0].clientY; dy = 0;
      }, { passive: true });
      panel.addEventListener('touchmove', function (e) {
        if (y0 == null) return;
        dy = e.touches[0].clientY - y0;
        if (dy < -6) { y0 = null; panel.style.transform = ''; return; }
        if (dy > 0) { panel.classList.add('dragging'); panel.style.transform = 'translateY(' + dy + 'px)'; }
      }, { passive: true });
      function end() {
        if (y0 == null) return;
        y0 = null; panel.classList.remove('dragging'); panel.style.transform = '';
        if (dy > 110) closeAll();
      }
      panel.addEventListener('touchend', end); panel.addEventListener('touchcancel', end);
    })();
    if (window.matchMedia) {
      var mq = matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', syncSystemBars); else if (mq.addListener) mq.addListener(syncSystemBars);
    }
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') handleBack(); });
    home();
  }

  return {
    init: init, menu: menu, back: back, closeAll: closeAll, refresh: refresh, alert: alert, choose: choose,
    confirm: confirm, prompt: prompt, toast: toast, timeMachine: timeMachine, runPending: runPending, handleBack: handleBack, home: home, ageUp: ageUp
  };
})();
