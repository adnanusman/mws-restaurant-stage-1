// import DBHelper from './js/dbhelper';

// Give the cache a name and version
const cacheName = 'rr-v6';

// Installing Service Worker and adding files to browser cache
self.addEventListener('install', (event) => { 
  event.waitUntil(
    caches.open(cacheName).then( (cache) => {
      return cache.addAll([
        '/',
        'restaurant.html',
        'js/main.js',
        'js/restaurant_info.js',
        'data/restaurants.json',
        'data/manifest.json',
        'css/styles.css',
        'img/1.webp',
        'img/2.webp',
        'img/3.webp',
        'img/4.webp',
        'img/5.webp',
        'img/6.webp',
        'img/7.webp',
        'img/8.webp',
        'img/9.webp',
        'img/10.webp'
      ]);
    })
  );
});

// Fetching data from cache when it exists otherwise fetching it from the network
self.addEventListener('fetch', (event) => {
  if(event.request.method === 'POST') return;

  event.respondWith(
    checkCache(event.request)
  );
});

// Tried to apply Background Sync but it was way too buggy.
// // Listen for review submission event
// self.addEventListener('sync', function(event) {
//   if (event.tag == 'reviewSubmission') {
//     event.waitUntil(submitReview());
//   }
// });

// function submitReview() {
//   // get data from IDB
//   return DBHelper.dbPromise.then(db => {
//     return db.transaction('temp-reviews')
//       .objectStore('temp-reviews').getAll();
//   }).then(reviews => {
//     reviews.forEach(review => {
//       // Use fetch to POST data to the API
//       fetch(DBHelper.REVIEWS_URL, {
//         method: "POST",
//         headers: {
//           'Accept': 'application/json',
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//           "restaurant_id": review.restaurant_id,
//           "name": review.name,
//           "rating": review.rating,
//           "comments": review.comments
//         })
//       })
//       .then(response => response.json())
//       .then(review => {
//         console.log(review);
//         console.log('Review Posted');
//         return DBHelper.dbPromise.then(db => {
//           return db.transaction('temp-reviews', 'readwrite')
//             .objectStore('temp-reviews').delete(review.restaurant_id);
//         }).then( () => console.log('Review deleted from IDB Database'));
//       });     
//     })
//   });
// }

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

// Checks Cache for response if no response, fetches network response
let checkCache = (request) => {
  return caches.match(request).then( (response) => {
    return response || networkFetch(request);
  }).catch(err => {
    console.log(`Error checking cache ${err}`);
  })
};

// gets response from network and adds to cache, then serves network response to browser
let networkFetch = (request) => {
  if(request.mode === 'no-cors') {
    return fetch(request, { mode: 'no-cors' }).then( (response) => {
      return caches.open(cacheName).then( (cache) => {
        cache.put(request, response.clone());
        return response;
      }).catch( (err) => { console.log(`Error fetching from Network ${err}`); })
    })  
  } else {
    return fetch(request).then( (response) => {
      return caches.open(cacheName).then( (cache) => {
        cache.put(request, response.clone());
        return response;
      }).catch( (err) => { console.log(`Error fetching from Network ${err}`); })
    })
  }
}