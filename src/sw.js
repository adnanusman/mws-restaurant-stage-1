// Give the cache a name and version
const cacheName = 'rr-v6'

// Installing Service Worker and adding files to browser cache
self.addEventListener('install', (event) => { 
  event.waitUntil(
    caches.open(cacheName).then( (cache) => {
      return cache.addAll([
        '/',
        'restaurant.html',
        'js/dbhelper.js',
        'js/main.js',
        'js/restaurant_info.js',
        'data/restaurants.json',
        'data/manifest.json',
        'css/styles.css',
        'img/1.jpg',
        'img/2.jpg',
        'img/3.jpg',
        'img/4.jpg',
        'img/5.jpg',
        'img/6.jpg',
        'img/7.jpg',
        'img/8.jpg',
        'img/9.jpg',
        'img/10.jpg'
      ]);
    })
  );
});

// Fetching data from cache when it exists otherwise fetching it from the network
self.addEventListener('fetch', (event) => {
    event.respondWith(
      networkFetch(event.request)
    );
});

// If a new service worker is activated, delete the old cache(s)
self.addEventListener('activate', (event) => {
  caches.keys().then( (response) => {
    if(response) {
      response.filter( (cache) => {
        if(cache !== cacheName) {
          caches.delete(cache);
        };
      })
    };
  })
});

// Checks for any updates, adds to cache and then responds with network request
// Got this from: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers 
// (Converted it to ES6)
networkFetch = (request) => {
  return caches.match(request).then( (response) => {
    return response || fetch(request).then( (response) => {
      return caches.open(cacheName).then( (cache) => {
        cache.put(request, response.clone());
        return response;
      })
    })
  });
};