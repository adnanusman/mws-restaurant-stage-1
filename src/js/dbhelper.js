import idb from 'idb';

/**
 * Common database helper functions.
 */
export default class DBHelper {  
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get RESTAURANTS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  static get REVIEWS_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/reviews`;
  }

  // Create IDB Database in browser
  static get dbPromise() {
    return idb.open('rr-store', 3, upgradeDB => {
      switch(upgradeDB.oldVersion) {
        case 0:
          upgradeDB.createObjectStore('restaurants');
        case 1:
          upgradeDB.createObjectStore('reviews');
        case 2:
          upgradeDB.createObjectStore('temp-reviews');
      }
    })
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants() {
    // Using fetch instead of XHR
    return fetch(DBHelper.RESTAURANTS_URL)
      .then( response => {
        if(response.ok) {
          return response.json();
        }
      })
      .catch( () => { return DBHelper.fetchRestaurantsIDB() } )
      .then( restaurants => {
        restaurants.forEach( restaurant => {
          // Add Restaurants to IDB Database
          DBHelper.dbPromise.then(db => {
            const tx = db.transaction('restaurants', 'readwrite');
            tx.objectStore('restaurants').put(restaurant, restaurant.id);
            return tx.complete;
          })
        });
        return restaurants; 
      })
      .catch( err => console.log(`Error fetching restaurants data from API ${err}`) )
  }

  static fetchRestaurantReviews(restaurantID) {
    // Using fetch instead of XHR
    return fetch(DBHelper.REVIEWS_URL + '/?restaurant_id=' + restaurantID)
      .then( response => {
        if(response.ok) {
          return response.json();
        }
      })
      .catch( () => { return DBHelper.fetchReviewsIDB(restaurantID) })
      .then( reviews => {
        DBHelper.dbPromise.then(db => {
          const tx = db.transaction('reviews', 'readwrite');
          tx.objectStore('reviews').put(reviews, restaurantID);
          return tx.complete;
        })
        return reviews; 
      })
      .catch( err => console.log(`Error fetching reviews data from API ${err}`) )
  }

  // fetch the restaurants from the IDB Database
  static fetchRestaurantsIDB() {
    return DBHelper.dbPromise.then(db => {
      return db.transaction('restaurants')
        .objectStore('restaurants').getAll();
    }).then(restaurants => restaurants);
  }

    // return new Promise((resolve, reject) => {
    //   let xhr = new XMLHttpRequest();
    //   xhr.open('GET', DBHelper.RESTAURANTS_URL);
    //   xhr.onload = () => {
    //     if (xhr.status === 200) { // Got a success response from server!
    //       const restaurants = JSON.parse(xhr.responseText);
    //       resolve(restaurants);
    //     } else { // Oops!. Got an error from server.
    //       const error = (`Request failed. Returned status of ${xhr.status}`);
    //       reject();
    //     }
    //   };
    //   xhr.send();
    // })

  // fetch the reviews from the IDB Database
  static fetchReviewsIDB(restaurantID) {
    return DBHelper.dbPromise.then(db => {
      return db.transaction('reviews')
        .objectStore('reviews').get(restaurantID);
    }).then(reviews => {
      console.log(reviews);
      return reviews;
    });
  }

  /**
   * Add review to IDB temporarily
   */
  static addReviewsIDB(reviewData, restaurantID) {
    DBHelper.dbPromise.then(db => {
      const tx = db.transaction('temp-reviews', 'readwrite');
      tx.objectStore('temp-reviews').put(reviewData, restaurantID);
      return tx.complete;
    }).catch(err => { console.log('error adding to idb', err); })
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    return DBHelper.fetchRestaurants().then(restaurants => {
      if (!restaurants) {
        throw new Error('Restaurant does not exist in the database');
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          return restaurant;
        } else { // Restaurant does not exist in the database
          throw new Error('Restaurant does not exist in the database');
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine) {
    // Fetch all restaurants  with proper error handling
    return DBHelper.fetchRestaurants().then(restaurants => {
      if (!restaurants) {
        throw new Error('No Restaurants Found');
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        return results;
      }
    })
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      if (!retaurants) {
        throw new Error('No Restaurants Found');
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        return results;
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood) {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      if (!restaurants) {
        throw new Error('No Restaurants Found');
      } else {
        let results = restaurants;
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        return results;
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      if (!restaurants) {
        throw new Error('No Restaurants Found');
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        return uniqueNeighborhoods;
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines() {
    // Fetch all restaurants
    return DBHelper.fetchRestaurants().then(restaurants => {
      if (!restaurants) {
        throw new Error('No Restaurants Found');
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        return uniqueCuisines;
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if(!restaurant.photograph) {
      restaurant.photograph = 10;
    }
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Restaurant WebP URL.
   */
  static webpUrlForRestaurant(restaurant) {
    if(!restaurant.photograph) {
      restaurant.photograph = 10;
    }
    return (`/img/${restaurant.photograph}.webp`);
  }

  /**
   * Restaurant image ALT.
   */
  static imageAltForRestaurant(restaurant) {
    return (`${restaurant.name}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  }
}

/**
 * Add Service Worker to the application.
 */
if('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
  .then( (reg) => {
    console.log('Registration successful');
  }).catch( (error) => {
    console.log('Registration failed', error);
  });
}