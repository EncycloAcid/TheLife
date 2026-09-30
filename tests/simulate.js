/* Headless fuzz test: plays many complete lives, randomly opening menus,
 * tapping items and picking dialog choices. Fails on any exception or on
 * corrupt state (NaN stats/money). Run: node tests/simulate.js [lives] */
var fs = require('fs'), path = require('path'), vm = require('vm');
var ctx = { console: console, Math: Math, Date: Date, JSON: JSON };
ctx.globalThis = ctx;
vm.createContext(ctx);
['util', 'data', 'engine', 'events', 'actions', 'features'].forEach(function (f) {
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
  runPending: function () {}
};
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function drainDialogs() {
  var guard = 0;
  while (dialogs.length && guard++ < 50) { var d = dialogs.shift(); var b = pick(d.buttons); if (b.fn) b.fn(); }
}
function runPending() {
  var S = TL.S, guard = 0;
  while (S.pending.length && guard++ < 20) {
    var ev = TL.events.build(S.pending[0]);
    if (!ev) { S.pending.shift(); continue; }
    TL.events.resolve(Math.floor(Math.random() * ev.choices.length));
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
for (var n = 0; n < N; n++) {
  TL.engine.newLife({ royal: Math.random() < 0.3 });
  var lives = 0;
  while (true) {
    var S = TL.S, years = 0;
    while (!S.dead && years++ < 140) {
      for (var a = 0; a < 3; a++) { TL.actions[pick(tops)](); tapAround(3); }
      runPending();
      TL.engine.ageUp();
      runPending();
      check(S);
    }
    if (!S.dead) throw new Error('never died (age ' + S.me.age + ')');
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
