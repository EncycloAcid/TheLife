/* TheLife — inline SVG line icons shared by the UI. */
TL.icons = (function () {
  var P = {"back": "<path d=\"M15 18l-6-6 6-6\"/>", "close": "<path d=\"M6 6l12 12M18 6 6 18\"/>", "chev": "<path d=\"M9 6l6 6-6 6\"/>", "check": "<path d=\"M5 12.5l4.5 4.5L19 7.5\"/>"};
  return function (name, cls) { return '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" aria-hidden="true">' + P[name] + '</svg>'; };
})();
