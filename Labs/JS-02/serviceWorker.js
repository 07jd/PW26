const CACHE_NAME = "my-app-cache-v1";
const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./script.js",
    "./style.css"
];

self.addEventListener("install", event => {
    event.waitUntil(
    caches.open (CACHE_NAME)
        .then(cache => cache.addAll(FILES_TO_CACHE))
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => {
                return caches.match("/index.html");
            });
        })
    );
});

self.addEventListener("activate", event => {
    const cacheWhiteList = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (!cacheWhiteList.includes(cacheName))
                    {
                        return caches.delete(cacheName);
                    }
                })
            )
        })
    )
})