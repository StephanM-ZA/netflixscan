/* netflixscan offline cache - version 015373f85935
   Built by 'netflixscan.py publish'. Do not edit by hand; republishing
   regenerates it with a new version, which is what evicts the old copy. */
const VERSION = "015373f85935";
const CACHE = "netflixscan-" + VERSION;
const SHELL = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg",
               "./icon-180.png", "./icon-192.png", "./icon-512.png",
               "./icon-maskable-512.png", "./favicon-32.png", "./favicon.ico"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;

  // Posters live on another origin. Never cache them - an opaque response would
  // fill the cache with unreadable blobs. Offline they just fail and the card
  // falls back to showing the title.
  if (new URL(req.url).origin !== self.location.origin) return;

  // The page itself: try the network so a republish is picked up straight away,
  // fall back to the cached copy when there is no signal.
  if (req.mode === "navigate" || req.destination === "document"){
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put("./index.html", copy));
        return res;
      }).catch(() => caches.match("./index.html").then(r => r || caches.match("./")))
    );
    return;
  }

  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
