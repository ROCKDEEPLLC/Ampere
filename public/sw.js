/**
 * AMPÈRE — Service Worker
 *
 * Handles offline schedule caching and push notification display.
 * Registered by the client when the user opts in.
 */

const CACHE_NAME = "ampere-v1";
const SCHEDULE_CACHE = "ampere-schedules-v1";

// Assets to cache for offline use
const PRECACHE_URLS = [
  "/prototype",
  "/assets/boot/power_on.mp4",
];

// ============================================
// Install — precache essential assets
// ============================================
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Non-critical — continue even if some assets fail
      });
    })
  );
  self.skipWaiting();
});

// ============================================
// Activate — clean old caches
// ============================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME && name !== SCHEDULE_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ============================================
// Fetch — network-first with cache fallback
// ============================================
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Cache schedule API responses for offline use
  if (url.pathname.startsWith("/api/sports")) {
    event.respondWith(
      caches.open(SCHEDULE_CACHE).then(async (cache) => {
        try {
          const response = await fetch(event.request);
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch {
          // Offline — return cached version
          const cached = await cache.match(event.request);
          if (cached) return cached;
          return new Response(
            JSON.stringify({ error: "Offline", fromCache: true }),
            { headers: { "Content-Type": "application/json" } }
          );
        }
      })
    );
    return;
  }

  // For other requests, try network first, fall back to cache
  if (event.request.method === "GET") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || new Response("Offline", { status: 503 });
        });
      })
    );
  }
});

// ============================================
// Push — display notification
// ============================================
self.addEventListener("push", (event) => {
  let data = { title: "AMPÈRE", body: "New update available", icon: "/assets/services/ampere-mark.png" };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    // Use defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/assets/services/ampere-mark.png",
      badge: "/assets/services/ampere-mark.png",
      vibrate: [100, 50, 100],
      data: data,
      actions: [
        { action: "open", title: "Open AMPÈRE" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

// ============================================
// Notification click — open app
// ============================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        // Focus existing window if open
        for (const client of clients) {
          if (client.url.includes("/prototype") && "focus" in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        return self.clients.openWindow("/prototype");
      })
  );
});

// ============================================
// Periodic sync — refresh schedule cache
// ============================================
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "refresh-schedules") {
    event.waitUntil(refreshScheduleCache());
  }
});

async function refreshScheduleCache() {
  const leagues = ["nfl", "nba", "mlb", "nhl", "premier-league"];
  const cache = await caches.open(SCHEDULE_CACHE);

  for (const league of leagues) {
    try {
      const resp = await fetch(`/api/sports?league=${league}&type=schedule`);
      if (resp.ok) {
        await cache.put(
          new Request(`/api/sports?league=${league}&type=schedule`),
          resp.clone()
        );
      }
    } catch {
      // Skip failed leagues
    }
  }
}
