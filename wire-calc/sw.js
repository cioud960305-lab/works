/* Wire Wise 서비스 워커: 화면과 엑셀 라이브러리를 폰에 저장해 오프라인에서도 열리게 함 */
const VER = "wirewise-v3";
const SHELL = [
  "wire-calc.html",
  "manifest.webmanifest",
  "vendor/exceljs.min.js",
  "icons/icon-180.png",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VER).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VER).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === "navigate" || req.destination === "document";
  if (isPage) {
    /* 화면은 최신본을 먼저 받고, 오프라인이면 저장된 것을 사용 */
    e.respondWith(
      fetch(req)
        .then(res => { const copy = res.clone(); caches.open(VER).then(c => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then(r => r || caches.match("wire-calc.html")))
    );
  } else {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone(); caches.open(VER).then(c => c.put(req, copy)); return res;
      }))
    );
  }
});
