/* offline service worker cache for tride-local (dbms1_tride 6-table edition) */

const TRIDE_CACHE_NAME = "tride-local-v31";
const PRECACHE_URLS = [
    "./",
    "./index.html",
    "./admin.html",
    "./manifest.webmanifest",
    "./components/styleNext.css",
    "./components/responsive-experimental.css",
    "./components/distortion-wave.css",
    "./components/distortion-wave.js",
    "./components/components.js",
    "./assets/fonts/SegoeIcons.ttf",
    "./assets/icons/Tride.svg",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png",
    "./js/local_schema.js",
    "./js/local_database.js",
    "./js/local_api_controller.js",
    "./js/api_client.js",
    "./js/schema_bridge.js",
    "./js/nav_router.js",
    "./js/ui_helpers.js",
    "./js/autofill_helper.js",
    "./js/member_app.js",
    "./js/admin_app.js",
    "./pages/auth_page.js",
    "./pages/home_page.js",
    "./pages/todas_page.js",
    "./pages/members_page.js",
    "./pages/units_page.js",
    "./pages/notifications_page.js",
    "./pages/export_page.js"
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
            const keyCount = keys.length;
            for (let i = 0; i < keyCount; i += 1) {
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
        fetch(req).then(function (res) {
            if (res && res.status === 200 && res.type === "basic") {
                const copy = res.clone();
                caches.open(TRIDE_CACHE_NAME).then(function (cache) {
                    cache.put(req, copy);
                });
            }
            return res;
        }).catch(function () {
            return caches.match(req);
        })
    );
});
