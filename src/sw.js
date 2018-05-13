// Give the cache a name and version
const cacheName = 'rr-v2'

// Installing Service Worker and adding files to browser cache
self.addEventListener('install', (event) => { 
  event.waitUntil(
    caches.open(cacheName).then( (cache) => {
      return cache.addAll([
        '/',
        'js/dbhelper.js',
        'js/main.js',
        'js/restaurant_info.js',
        'data/restaurants.json',
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
  const requestUrl = new URL(event.request.url);

  // If the request is for something on the local domain
  if(requestUrl.origin === location.origin) {
    event.respondWith(
      caches.match(event.request).then( (response) => {
        return response || networkFetch(event.request);
      })
    );
  } else {
    // otherwise fetch requests from other origins directly
    event.respondWith(
      fetch(event.request)
    );
  };
});

// If a new service worker is activated, delete the old cache(s)
self.addEventListener('activate', (event) => {
  event.respondWith(
    caches.keys().then( (response) => {
      if(response) {
        response.filter( (cache) => {
          if(cache !== cacheName) {
			      caches.delete(cache);
          }
		    })
      }
    })
  )
})

// Checks for any updates, adds to cache and then responds with network request
function networkFetch(request) {
  caches.open(cacheName).then( (cache) => {
    return fetch(request).then( (response) => {
      cache.put(request, response.clone());
      return response;
    })
  });
};