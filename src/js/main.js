import DBHelper from './dbhelper';

let restaurants,
  neighborhoods,
  cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
  fetchNeighborhoods();
  fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
let fetchNeighborhoods = () => {
  return DBHelper.fetchNeighborhoods().then(neighborhoods => {
      fillNeighborhoodsHTML(neighborhoods);
  });
}

/**
 * Set neighborhoods HTML.
 */
let fillNeighborhoodsHTML = (neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
let fetchCuisines = () => {
  return DBHelper.fetchCuisines().then(cuisines => {
      fillCuisinesHTML(cuisines)
    }).catch
      (err => { 
        console.log('fetchCuisines:', err); 
      });
};

/**
 * Set cuisines HTML.
 */
let fillCuisinesHTML = (cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  mapToggle();
  updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
let updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  return DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood).then(restaurants => {
    resetRestaurants(restaurants);
    fillRestaurantsHTML(restaurants);
  }).catch((err) => { console.log('fetchRestaurantByCuisineAndNeighborhood:', err)});
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
let resetRestaurants = (rstrnts) => {
  // Remove all restaurants
  restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  markers.forEach(m => m.setMap(null));
  markers = [];
  restaurants = rstrnts;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
let fillRestaurantsHTML = (restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap(restaurants);
}

/**
 * Create restaurant HTML.
 */
let createRestaurantHTML = (restaurant) => {
  
  // lazy loading images
  const observer = new IntersectionObserver( entries => {
    entries.forEach( entry => {
      if(entry.isIntersecting === true) {
        // Add Picture tag, to hold webp images.
        source.setAttribute('srcset', DBHelper.webpUrlForRestaurant(restaurant));
        source.setAttribute('type', 'image/webp');

        image.src = DBHelper.imageUrlForRestaurant(restaurant);     
      };
    });
  })

  const li = document.createElement('li');

  const picture = document.createElement('picture');
  const source = document.createElement('source');
  picture.append(source);

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.alt = restaurant.name;
  // image inserted into picture element, and picture tag inserted into li element.
  picture.append(image);
  li.append(picture);

  // Add functionality to favorite or unfavorite a restaurant.
  const star = document.createElement('p');
  star.style.cursor = 'pointer';
  star.setAttribute('role', 'button');
  star.setAttribute('label', 'Mark Favorite');
  star.setAttribute('tabindex', 0);
  star.classList = 'star-right star';
  star.innerHTML = '☆'
  let clicked = false;

  if(restaurant.is_favorite === 'true') {
    star.innerHTML = '★';
    star.setAttribute('label', 'Unmark Favorite');
    clicked = true;
  }

  star.addEventListener('click', function() {
    if(clicked === false) {
      // change to a full star if restaurant is favorited.
      clicked = !clicked;
      markFavorite(restaurant.id, this);
    } else {
      // change to an empty star if restaurant is unfavorited.
      clicked = !clicked;
      unmarkFavorite(restaurant.id, this);
    };
  });
  
  li.append(star);

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  li.append(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('role', 'button');
  // more.setAttribute('tabindex', '4');
  li.append(more)

  observer.observe(li);
  return li;
}

// Mark a restaurant Favorite
let markFavorite = (restaurantID, favButton) => {
  fetch(DBHelper.RESTAURANTS_URL + '/' + restaurantID + '/?is_favorite=true', {
    method: 'PUT'
  }); 
  favButton.innerHTML = '★';
  favButton.setAttribute('label', 'Unmark Favorite');
}

// Unmark a restaurant from Favorites
let unmarkFavorite = (restaurantID, favButton) => {
  fetch(DBHelper.RESTAURANTS_URL + '/' + restaurantID + '/?is_favorite=false', {
    method: 'PUT'
  });
  favButton.innerHTML = '☆';
  favButton.setAttribute('label', 'Mark Favorite');
}

/**
 * Add markers for current restaurants to the map.
 */
let addMarkersToMap = (restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, map);
    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    markers.push(marker);
  });
}

/**
 * Add a 'Skip to content' button right after body tag
 */
(() => {
  let button = document.createElement('a');
  button.classList += 'skip-content';
  button.innerHTML = 'Skip to Content';
  button.href = "#restaurants-list";
  button.setAttribute('role', 'button');
  // button.setAttribute('tabindex', '1');

  let body = document.querySelector('body');
  document.body.insertBefore(button, document.body.firstChild);
}) ();

/**
 * Map toggle
 */
let mapToggle = () => {
  const button = document.querySelector('.map-toggle');
  const mapArea = document.getElementById('map');
  let clicked = false;

  button.setAttribute('role', 'button');
  // button.setAttribute('tabindex', '3')

  mapArea.style.display = 'none';
  mapArea.style.transition = '0.5s ease-in-out';

  button.addEventListener('click', () => {
    let loc = {
      lat: 40.722216,
      lng: -73.987501
    };
    map = new google.maps.Map(document.getElementById('map'), {
      zoom: 12,
      center: loc,
      scrollwheel: false
    });
    if(clicked === false) {
      mapArea.style.display = '';
      clicked = !clicked;
      button.innerHTML = 'Hide Map';
    } else {
      mapArea.style.display = 'none';
      clicked = !clicked;
      button.innerHTML = 'View Map';
    }
    updateRestaurants();
  })
}