// Minimal service worker for the /mobile PWA demo.
// Scope is set to /mobile/ at registration time (see main.jsx), so this never
// touches the rest of the site.
// Bumped from v2: that version cached every GET, including Supabase data, so
// the app kept showing its first-ever copy of businesses, hours and content.
// Activating this version deletes those caches.
const CACHE = "maidenhead-mobile-v3";

// Web Push delivery. The payload is set by supabase/functions/send-push.
self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data?.json() ?? {}; } catch { data = { body: event.data?.text() }; }
  const title = data.title || "Maidenhead";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body,
      icon: "/mobile-icons/icon-192.png",
      badge: "/mobile-icons/icon-192.png",
      data: { url: data.url || "/mobile/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/mobile/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
const APP_SHELL = ["/mobile/", "/manifest.json", "/logo-mark.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigations (always get fresh content when online),
// falling back to the cached shell when offline. Cache-first only for this
// site's own fingerprinted build files and images. Everything else — Supabase
// data, APIs, other hosts — goes straight to the network and is never cached,
// so admin's changes show as soon as the app asks for them.
function isCacheableAsset(url) {
  if (url.origin !== self.location.origin) return false;
  return url.pathname.startsWith("/assets/")
    || /\.(png|jpe?g|webp|gif|svg|ico|woff2?)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((res) => res || caches.match("/mobile/")))
    );
    return;
  }

  if (!isCacheableAsset(url)) return; // let the browser fetch it normally

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
    )
  );
});
