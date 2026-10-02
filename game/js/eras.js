/* TheLife — v1.26: lives before the modern world. Each era in TL.eras
 * (js/ancient.js for Rome, js/medieval.js for medieval England) has the same
 * shape; TL.ancient routes the engine's hooks to the era of the current life,
 * and jobs to the era their career belongs to. */
TL.ancient = (function () {
  var E = TL.engine, D = TL.data;
  function era() { var id = TL.S && E.ancient(); return id ? TL.eras[id] : null; }
  function on() { return !!era(); }
  function all() { return Object.keys(TL.eras).map(function (k) { return TL.eras[k]; }); }
  function byCareer(id) { return all().filter(function (e) { return e.career(id); })[0] || null; }
  function byOption(v) { return all().filter(function (e) { return e.birthOptions().some(function (o) { return o[0] === v; }); })[0] || null; }
  var api = {
    on: on, era: era, all: all, byOption: byOption,
    career: function (id) { var e = byCareer(id); return e ? e.career(id) : null; },
    setup: function (st, opts) {
      var par = E.people(['mother', 'father']), was = par.map(function (p) { return p.job; });
      TL.eras[D.country(st.country).ancient].setup(st, opts);
      // The birth log already introduced my parents with modern jobs: use the era's.
      par.forEach(function (p, i) {
        if (p.job === was[i]) return;
        st.log.forEach(function (y) { y.entries.forEach(function (e) { if (e.t.indexOf(' is ' + E.fullName(p) + ', ') > 0) e.t = e.t.replace(', ' + E.jobPhrase(was[i]) + ' (', ', ' + E.jobPhrase(p.job) + ' ('); }); });
      });
    },
    birthOptions: function () { return all().reduce(function (a, e) { return a.concat(e.birthOptions()); }, []); }
  };
  ['heir', 'housed'].forEach(function (n) { api[n] = function () { var e = era(); return e[n].apply(e, arguments); }; });
  ['jobYear', 'salary', 'title'].forEach(function (n) { api[n] = function (j) { return (byCareer(j.career) || era())[n](j); }; });
  ['st', 'yearly', 'npcJob', 'homeLabel', 'occupationMenu', 'assetsMenu', 'activitiesMenu', 'acts', 'aboutRows', 'recapRow', 'illName', 'txt'].forEach(function (n) {
    api[n] = function () { var e = era(); return e[n].apply(e, arguments); };
  });
  ['WEDDINGS', 'TOPICS', 'KID_TOPICS', 'ACH'].forEach(function (n) { Object.defineProperty(api, n, { get: function () { return era()[n]; } }); });
  return api;
})();
