/* שומר את האפליקציה בטלפון כדי שתעבוד גם בלי קליטה. להעלות את המספר בכל עדכון */
const VERSION = 'cr-v5';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png', './icons/icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // תחזית: תמיד מהרשת. אם אין קליטה, האפליקציה משתמשת בתחזית האחרונה ששמרה
  if (url.hostname === 'api.open-meteo.com') return;
  // הדף עצמו: קודם מהרשת כדי לקבל עדכונים, ואם אין קליטה – מהזיכרון
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return r; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // שאר הקבצים (אייקונים, גופנים): מהזיכרון, ואם אין – מהרשת ושומרים
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok || r.type === 'opaque') { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
