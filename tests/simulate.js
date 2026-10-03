/* Headless fuzz test: plays many complete lives, randomly opening menus,
 * tapping items and picking dialog choices. Fails on any exception or on
 * corrupt state (NaN stats/money). Each family gets its own seed, so a
 * failure prints the seed that replays it exactly.
 * Run: node tests/simulate.js [families] [seed] */
var fs = require('fs'), path = require('path'), vm = require('vm');
// Seeded random numbers (mulberry32) for the game and the fuzzer alike.
var rng = 1;
function seed(x) { rng = x >>> 0; }
function rand() { rng = (rng + 0x6D2B79F5) >>> 0; var t = rng; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
var SMath = Object.create(Math); SMath.random = rand;
// In-memory storage, wiped before each family so a failing seed replays exactly on its own.
var mem = {};
var storage = { getItem: function (k) { return k in mem ? mem[k] : null; }, setItem: function (k, v) { mem[k] = String(v); }, removeItem: function (k) { delete mem[k]; } };
var ctx = { console: console, Math: SMath, Date: Date, JSON: JSON, localStorage: storage };
ctx.globalThis = ctx;
vm.createContext(ctx);
['util', 'data', 'realdata', 'logofiles', 'logos', 'engine', 'events', 'actions', 'features', 'extras', 'world', 'hoops', 'nba', 'hoopsocial', 'phone', 'military', 'sports', 'creator', 'acting', 'music', 'prosports', 'politics', 'work', 'business', 'health', 'market', 'history', 'ancient', 'medieval', 'viking', 'eras', 'mapdata', 'maps', 'recap'].forEach(function (f) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../game/js/' + f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
});
var TL = ctx.TL;

// Stub UI that records menus/dialogs so the fuzzer can "tap" them.
var menus = [], dialogs = [];
TL.ui = {
  menu: function (t, build) { menus.push({ t: t, build: build }); },
  back: function () { menus.pop(); }, closeAll: function () { menus = []; }, refresh: function () {},
  alert: function (t, text, c, cb) { dialogs.push({ buttons: [{ fn: cb }] }); },
  choose: function (t, text, opts) { dialogs.push({ buttons: opts.map(function (o) { return { fn: o.fn }; }).concat([{ fn: null }]) }); },
  confirm: function (t, text, yes) { dialogs.push({ buttons: [{ fn: yes }, { fn: null }] }); },
  prompt: function (t, text, def, cb) { dialogs.push({ buttons: [{ fn: function () { cb('Test Co'); } }] }); },
  toast: function () {},
  // Time travel swaps TL.S for a restored copy, so the loop below always reads TL.S.
  timeMachine: function () { var ages = TL.engine.tmAges(); if (ages.length) TL.engine.timeTravel(1 + Math.floor(rand() * ages.length)); },
  runPending: function () {}
};
function pick(a) { return a[Math.floor(rand() * a.length)]; }
function drainDialogs() {
  var guard = 0;
  while (dialogs.length && guard++ < 50) { var d = dialogs.shift(); var b = pick(d.buttons); if (b.fn) b.fn(); }
}
function runPending() {
  var S = TL.S, guard = 0;
  while (S.pending.length && guard++ < 20) {
    var ev = TL.events.build(S.pending[0]);
    if (!ev) { S.pending.shift(); continue; }
    TL.events.resolve(Math.floor(rand() * ev.choices.length));
    drainDialogs();
    tapAround(2);
  }
}
var tops = ['occupationMenu', 'assetsMenu', 'relationshipsMenu', 'activitiesMenu'];
function tapAround(depth) {
  for (var i = 0; i < depth && menus.length; i++) {
    var m = menus[menus.length - 1];
    var items = m.build().filter(function (it) { return it.onClick && !it.disabled; });
    if (!items.length) { menus.pop(); continue; }
    pick(items).onClick();
    drainDialogs();
  }
  menus = [];
}
function check(S) {
  var m = S.me;
  ['happy', 'health', 'smarts', 'looks', 'athl'].forEach(function (k) {
    if (typeof m[k] !== 'number' || isNaN(m[k]) || m[k] < 0 || m[k] > 100) throw new Error('bad stat ' + k + '=' + m[k] + ' age ' + m.age);
  });
  if (isNaN(S.money)) throw new Error('money NaN at age ' + m.age);
  S.assets.forEach(function (a) { if (isNaN(a.value)) throw new Error('asset NaN ' + a.name); });
  S.people.forEach(function (p) { if (isNaN(p.rel)) throw new Error('rel NaN ' + p.first + ' ' + p.role); });
}

var N = +process.argv[2] || 200, ages = [], gens = 0, rich = 0, jailed = 0, married = 0, deg = 0;
var base = process.argv[3] != null ? +process.argv[3] : Math.floor(Math.random() * 1e9);
for (var n = 0; n < N; n++) {
  seed(base + n);
  try { playFamily(); } catch (e) {
    console.error('FAILED on family ' + n + ' — replay with: node tests/simulate.js 1 ' + (base + n));
    console.error(e && e.stack || e);
    process.exit(1);
  }
}
function playFamily() {
  mem = {}; menus = []; dialogs = [];
  // Half of families start somewhere in history (js/history.js, js/ancient.js, js/medieval.js, js/viking.js).
  var era = rand();
  if (era < 0.13) TL.engine.newLife({ country: 'Roman Empire', year: 40 + Math.floor(rand() * 120), royal: rand() < 0.25 }); // js/ancient.js
  else if (era < 0.26) TL.engine.newLife({ country: 'Kingdom of England', year: 1150 + Math.floor(rand() * 270), royal: rand() < 0.25 }); // js/medieval.js
  else if (era < 0.39) TL.engine.newLife({ country: 'Viking Norway', year: 770 + Math.floor(rand() * 260), royal: rand() < 0.25 }); // js/viking.js
  else TL.engine.newLife({ royal: rand() < 0.3, year: era < 0.55 ? 1900 + Math.floor(rand() * 120) : undefined });
  var lives = 0;
  while (true) {
    var years = 0;
    while (!TL.S.dead && years++ < 400) {
      for (var a = 0; a < 3; a++) { TL.actions[pick(tops)](); tapAround(3); }
      runPending();
      TL.engine.ageUp();
      runPending();
      check(TL.S);
    }
    var S = TL.S;
    if (!S.dead) throw new Error('never died (age ' + S.me.age + ')');
    // The death screen's life recap must render for every kind of life.
    var rc = TL.recap.html();
    if (!rc || /undefined|NaN/.test(rc)) throw new Error('bad life recap: ' + rc.slice(0, 300));
    ages.push(S.me.age);
    if (TL.engine.netWorth() > TL.engine.$(1e6)) rich++;
    if (S.record.length) jailed++;
    if (S.ach.indexOf('married') >= 0) married++;
    if (TL.engine.hasDegree('bachelor')) deg++;
    TL.engine.save();
    var heirs = TL.engine.heirs();
    if (heirs.length && lives++ < 2) { TL.engine.continueAs(heirs[0].id); gens++; continue; }
    break;
  }
}
ages.sort(function (a, b) { return a - b; });
console.log('OK', N, 'families,', ages.length, 'lives,', gens, 'legacy continuations');
console.log('age at death: median', ages[ages.length >> 1], 'min', ages[0], 'max', ages[ages.length - 1]);
console.log('millionaires', rich, '| criminals', jailed, '| married', married, '| graduates', deg);
