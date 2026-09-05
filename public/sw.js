/* Ploder service worker: app-shell caching with user data always fresh. */

const CACHE = "ploder-v2";
const APP_FALLBACK = "/app";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.add(APP_FALLBACK).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isStaticAsset(url) {
  return (
    /\.(js|css|png|jpg|jpeg|svg|webp|ico|woff2?|webmanifest)$/.test(
      url.pathname,
    ) || url.pathname.startsWith("/assets/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  // Vite source modules are mutable. A cached stylesheet or dependency breaks HMR.
  if (
    ["/src/", "/node_modules/", "/@vite/", "/@id/", "/@fs/"].some((prefix) =>
      url.pathname.startsWith(prefix),
    )
  ) {
    return;
  }

  // Never cache API responses — training data must always be fresh.
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached ?? caches.match(APP_FALLBACK)),
        ),
    );
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        });
        return cached ?? network;
      }),
    );
  }
});
