/* Offline cache for the web/PWA build. */
var CACHE = 'thelife-v21';
var FILES = ['./', './index.html', './css/style.css', './js/util.js', './js/data.js', './js/realdata.js', './js/engine.js', './js/events.js', './js/actions.js', './js/features.js', './js/extras.js', './js/world.js', './js/hoops.js', './js/military.js', './js/sports.js', './js/creator.js', './js/acting.js', './js/music.js', './js/prosports.js', './js/work.js', './js/recap.js', './js/icons.js', './js/motion.js', './js/ui.js', './fonts/Inter.woff2', './manifest.json', './icon.svg'];
self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(FILES); })); self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); })); });
self.addEventListener('fetch', function (e) { e.respondWith(fetch(e.request).catch(function () { return caches.match(e.request); })); });
