/* Offline cache for the web/PWA build. */
var CACHE = 'thelife-v71';
var FILES = ['./', './index.html', './css/style.css', './js/util.js', './js/data.js', './js/realdata.js', './js/logofiles.js', './js/logos.js', './js/engine.js', './js/events.js', './js/actions.js', './js/features.js', './js/extras.js', './js/world.js', './js/hoops.js', './js/nba.js', './js/hoopsocial.js', './js/phone.js', './js/mind.js', './js/military.js', './js/sports.js', './js/creator.js', './js/acting.js', './js/music.js', './js/prosports.js', './js/politics.js', './js/work.js', './js/business.js', './js/health.js', './js/market.js', './js/history.js', './js/ancient.js', './js/medieval.js', './js/viking.js', './js/eras.js', './js/mapdata.js', './js/maps.js', './js/recap.js', './js/icons.js', './js/motion.js', './js/ui.js', './fonts/Inter.woff2', './manifest.json', './icon.svg'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })); });
// Network first; logos are cached as they're seen so they work offline too.
self.addEventListener('fetch', function (e) {
  e.respondWith(fetch(e.request).then(function (r) {
    if (r.ok && e.request.url.indexOf('/img/logos/') >= 0) { var copy = r.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
    return r;
  }).catch(function () { return caches.match(e.request); }));
});
