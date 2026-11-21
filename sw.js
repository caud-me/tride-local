const TRIDE_CACHE_NAME = "tride-local-v2";
const PRECACHE_URLS = [
    "./",
    "./index.html",
    "./admin.html",
    "./manifest.webmanifest",
    "./app.js",
    "./admin.js",
    "./api.js",
    "./router.js",
    "./helpers.js",
    "./components/style.css",
    "./components/responsive-experimental.css",
    "./components/distortion-wave.css",
    "./components/distortion-wave.js",
    "./components/components.js",
    "./pages/auth.js",
    "./pages/home.js",
    "./pages/members.js",
    "./pages/notifications.js",
    "./pages/todas.js",
    "./pages/units.js",
    "./assets/fonts/SegoeIcons.ttf",
    "./assets/icons/Tride.svg",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png"
];

self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(TRIDE_CACHE_NAME).then(function (cache) {
            return cache.addAll(PRECACHE_URLS);
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (keys) {
            const removals = [];
            for (let i = 0; i < keys.length; i += 1) {
                if (keys[i] !== TRIDE_CACHE_NAME) {
                    removals.push(caches.delete(keys[i]));
                }
            }
            return Promise.all(removals);
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener("fetch", function (event) {
    const req = event.request;
    if (req.method !== "GET") {
        return;
    }

    if (req.mode === "navigate") {
        event.respondWith(
            fetch(req).then(function (res) {
                const copy = res.clone();
                caches.open(TRIDE_CACHE_NAME).then(function (cache) {
                    cache.put(req, copy);
                });
                return res;
            }).catch(function () {
                return caches.match(req).then(function (cached) {
                    return cached || caches.match("./index.html");
                });
            })
        );
        return;
    }

    event.respondWith(
        caches.match(req).then(function (cached) {
            if (cached) {
                return cached;
            }
            return fetch(req).then(function (res) {
                if (res && res.status === 200 && res.type === "basic") {
                    const copy = res.clone();
                    caches.open(TRIDE_CACHE_NAME).then(function (cache) {
                        cache.put(req, copy);
                    });
                }
                return res;
            });
        })
    );
});
