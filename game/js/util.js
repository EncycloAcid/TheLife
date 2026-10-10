/* TheLife — shared helpers. Everything hangs off the global TL namespace so the
 * game runs from file://, inside the Android WebView, and under Node tests. */
var TL = (typeof globalThis !== 'undefined' ? globalThis : window).TL || {};
(typeof globalThis !== 'undefined' ? globalThis : window).TL = TL;

TL.util = (function () {
  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function randf(min, max) { return Math.random() * (max - min) + min; }
  function chance(p) { return Math.random() < p; }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  // items: [{w: weight, ...}] or [[weight, value]]
  function weighted(items) {
    var total = 0, i;
    for (i = 0; i < items.length; i++) total += items[i].w;
    var r = Math.random() * total;
    for (i = 0; i < items.length; i++) {
      r -= items[i].w;
      if (r <= 0) return items[i];
    }
    return items[items.length - 1];
  }
  // Normal-ish distribution, centred on mean.
  function gauss(mean, sd) {
    var u = 1 - Math.random(), v = Math.random();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  var idCounter = 0;
  function uid() { return Date.now().toString(36) + (idCounter++).toString(36) + Math.floor(Math.random() * 1e6).toString(36); }

  function money(n, sym) {
    sym = sym || '$';
    var neg = n < 0; n = Math.abs(Math.round(n));
    var s;
    if (n >= 1e9) s = (n / 1e9).toFixed(n >= 1e10 ? 1 : 2).replace(/\.0+$/, '') + 'B';
    else if (n >= 1e7) s = (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    else s = n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return (neg ? '-' : '') + sym + s;
  }
  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }
  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  return {
    rand: rand, randf: randf, chance: chance, pick: pick, clamp: clamp, shuffle: shuffle,
    weighted: weighted, gauss: gauss, uid: uid, money: money, plural: plural, cap: cap,
    esc: esc, ordinal: ordinal, deepClone: deepClone
  };
})();
