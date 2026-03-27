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
        fetch(event.request).then(response => {
            // Resposta da network, cache/update files, usar versao fornecida pelo fetch
            const Requestcopy = response.clone();
            caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, Requestcopy)
            });
            return response;
        })
        .catch(() => {
            // Fetch falhou, usar ficheiros cached
            return caches.match(event.request).then(cachedResponse => {
                return cachedResponse || caches.match("/index.html");
            })
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