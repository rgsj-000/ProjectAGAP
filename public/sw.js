const CACHE = "agap-shell-v1";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(["/", "/household"]))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("agap-shell-") && k !== CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_ASSETS") return;
  const urls = event.data.urls.filter((u) => {
    const url = new URL(u, self.location.origin);
    return (
      url.origin === self.location.origin &&
      url.pathname.startsWith("/_next/static/")
    );
  });
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(urls.map((u) => cache.add(u)))),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  )
    return;
  const shell =
    event.request.mode === "navigate" &&
    ["/", "/household"].includes(url.pathname);
  const asset =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/images/");
  if (!shell && !asset) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(event.request);
        if (response.ok)
          await cache.put(
            shell ? url.pathname : event.request,
            response.clone(),
          );
        return response;
      } catch {
        const cached = await cache.match(shell ? url.pathname : event.request);
        return cached || Response.error();
      }
    })(),
  );
});
