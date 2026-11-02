/* PfotenClan service worker – works offline and brings updates. Version: 30-20261102105444 */
const CACHE = 'pfotenclan-30-20261102105444';
const CORE = [
  "./",
  "index.html",
  "styles.css?v=30-20261102105444",
  "app.js?v=30-20261102105444",
  "quiz-engine.js?v=30-20261102105444",
  "content.json?v=30-20261102105444",
  "photo-focus.json?v=30-20261102105444",
  "manifest.webmanifest",
  "logo.png",
  "pawmoon.png",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
  "impressum.html",
  "datenschutz.html",
  "fonts/barlow-condensed-latin-700-normal.woff2",
  "fonts/barlow-condensed-latin-800-normal.woff2",
  "fonts/barlow-condensed-latin-900-normal.woff2",
  "img/bibliothek-alleinbleiben.jpg",
  "img/bibliothek-clickertraining.jpg",
  "img/bibliothek-cooperative-care.jpg",
  "img/bibliothek-ernaehrung.jpg",
  "img/bibliothek-gesundheit-pflege.jpg",
  "img/bibliothek-grunderziehung.jpg",
  "img/bibliothek-guter-halter.jpg",
  "img/bibliothek-herkunft.jpg",
  "img/bibliothek-hitze-qualzucht.jpg",
  "img/bibliothek-kind-und-hund.jpg",
  "img/bibliothek-kommunikation.jpg",
  "img/bibliothek-kosten-pflichten.jpg",
  "img/bibliothek-leinen-halsband.jpg",
  "img/bibliothek-ruede-oder-huendin.jpg",
  "img/bibliothek-ruhe-auslastung.jpg",
  "img/bibliothek-tierschutzhund.jpg",
  "img/bibliothek-welpenerziehung.jpg",
  "img/extra-berner.jpg",
  "img/heiko-loki.jpg",
  "img/lifestyle-aktive-begleiter.jpg",
  "img/lifestyle-allergikerfreundlich.jpg",
  "img/lifestyle-anfaengerhunde.jpg",
  "img/lifestyle-familienhunde.jpg",
  "img/lifestyle-ruhige-begleiter.jpg",
  "img/lifestyle-schutz-strassenhunde.jpg",
  "img/lifestyle-wohnungshunde.jpg",
  "img/rasse-dackel.jpg",
  "img/rasse-gesellschaftshunde.jpg",
  "img/rasse-herdenschutz.jpg",
  "img/rasse-huetehunde.jpg",
  "img/rasse-laufhunde.jpg",
  "img/rasse-molosser.jpg",
  "img/rasse-pinscher-schnauzer.jpg",
  "img/rasse-retriever.jpg",
  "img/rasse-spitze.jpg",
  "img/rasse-terrier.jpg",
  "img/rasse-vorstehhunde.jpg",
  "img/rasse-wasserhunde.jpg",
  "img/rasse-windhunde.jpg",
  "img/training-impulskontrolle.jpg",
  "img/training-leinenfuehrigkeit.jpg",
  "img/training-stubenreinheit.jpg",
  "img/wolf-hero.jpg"
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('pfotenclan-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // pages: try the network first, so a fresh index.html arrives; offline: use the cached copy
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  // files: cached first (they carry the version in their name), otherwise from the network
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
