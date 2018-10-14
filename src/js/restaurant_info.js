import DBHelper from './dbhelper';

let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  fetchRestaurantFromURL().then(restaurant => {  
    if (!restaurant) { // Got an error!
      throw new Error('Restaurant not found');
    } else {
      map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb(restaurant);
      DBHelper.mapMarkerForRestaurant(restaurant, map);
      // adding a listener to a button to mark or unmark favorites
      markFavoriteButton(restaurant.id, restaurant.is_favorite);
      // if user is online, check if there are any reviews pending submission. If so, push them through.
      if(navigator.onLine) {
        transferReviewsFromIDBtoAPI();
      };
    }
  })
}

/**
 * Get current restaurant from page URL.
 */
let fetchRestaurantFromURL = () => {
  return new Promise((resolve, reject) => {
    if (restaurant) { // restaurant already fetched!
      resolve(restaurant);
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
      throw new Error('No restaurant id in URL');
    } else {
      DBHelper.fetchRestaurantById(id).then(restaurant => {
        if (!restaurant) {
          throw new Error('No restaurant in database');
          reject();
        }
        fillRestaurantHTML(restaurant);
        resolve(restaurant);
      });
    }
  })
}

/**
 * Create restaurant HTML and add it to the webpage
 */
let fillRestaurantHTML = (restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  // Adding webp image to source element 
  const source = document.querySelector('source');
  source.setAttribute('srcset', DBHelper.webpUrlForRestaurant(restaurant));
  source.setAttribute('type', 'image/webp');
  
  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = restaurant.name;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML(restaurant.operating_hours);
  }
  // fetch and fill reviews 
  DBHelper.fetchRestaurantReviews(restaurant.id)
    .then(reviews => fillReviewsHTML(reviews, restaurant.id));
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
let fillRestaurantHoursHTML = (operatingHours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
let fillReviewsHTML = (reviews, restaurantID) => {
  const container = document.getElementById('reviews-container');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  container.appendChild(title);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.getElementById('reviews-list');
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);

  createReviewForm(container, restaurantID);
}

/**
 * Create review submission form
 */
let createReviewForm = (container, restaurantID) => {
  const formContainer = document.createElement('div');
  formContainer.classList = 'review-form-container';

  const formDiv = document.createElement('div');
  formDiv.classList = 'review-form';
  formContainer.appendChild(formDiv);

  const heading = document.createElement('h3');
  heading.innerHTML = 'Write a review';
  formDiv.appendChild(heading);

  const idInput = document.createElement('input');
  idInput.setAttribute('type', 'hidden');
  idInput.setAttribute('name', 'restaurant_id');
  idInput.setAttribute('value', restaurantID);
  idInput.setAttribute('aria-label', 'Restaurant ID');
  formDiv.appendChild(idInput);

  const nameInput = document.createElement('input');
  nameInput.setAttribute('type', 'text');
  nameInput.setAttribute('name', 'name');
  nameInput.setAttribute('placeholder', 'Enter Name');
  nameInput.setAttribute('aria-label', 'Enter Name');
  formDiv.appendChild(nameInput);

  const ratingLabel = document.createElement('label');
  ratingLabel.classList = 'rating-label';
  ratingLabel.innerHTML = 'Choose Rating:';

  const ratingInput = document.createElement('select');
  ratingInput.setAttribute('role', 'checkbox');
  ratingInput.setAttribute('name', 'rating');
  ratingInput.setAttribute('aria-label', 'Choose Rating');
  ratingInput.classList = 'rating-input';
  
  ratingLabel.appendChild(ratingInput);
  formDiv.appendChild(ratingLabel);

  let ratings = [
    {id: 1, caption: 'Really Bad!'},
    {id: 2, caption: 'Not impressed.'},
    {id: 3, caption: 'Okay'},
    {id: 4, caption: 'Great!'},
    {id: 5, caption: 'Awesome!'}
  ];

  ratings.forEach(rating => {
    let option = document.createElement('option');
    option.innerHTML = `${rating.id} - ${rating.caption}`;
    option.setAttribute('value', rating.id);
    if (rating.id === 5) {
      option.setAttribute('selected', 'selected');
    }
    ratingInput.appendChild(option);
  });

  const reviewInput = document.createElement('textarea');
  reviewInput.setAttribute('name', 'comments');
  reviewInput.setAttribute('placeholder', 'Write Review Here');
  reviewInput.setAttribute('aria-label', 'Write Review Here');
  formDiv.appendChild(reviewInput);

  const submitButton = document.createElement('button');
  submitButton.innerHTML = 'Submit Review';
  submitButton.addEventListener('click', updateReviews);
  formDiv.appendChild(submitButton);
  
  container.appendChild(formContainer);
}

/**
 * Update reviews API and then update the DOM
 */
let updateReviews = (e) => {
  const inputs = e.target.parentNode.children;
  const restaurantID = parseInt(inputs.restaurant_id.value);
  let name = inputs.name.value;
  let comments = inputs.comments.value;
  let rating = parseInt(inputs[3].children.rating.value);
  const reviewForm = e.target.parentNode;

  // Make sure that none of the inputs are empty
  if(name === '' || comments === '') {
    const p = document.createElement('p');
    p.innerHTML = '* Please make sure you filled out the name and review';
    p.style.color = 'red';

    reviewForm.appendChild(p);
    return;
  } else {
    // in either case, if user is online or offline, save submitted review to IDB
    // this is a fail safe, in case the user has a dodgy connection, they should not have to submit the review again.

    // submit review to IDB
    DBHelper.addReviewsIDB(
      {
        'restaurant_id': restaurantID,
        'rating': rating,
        'name': name,
        'comments': comments
      }, restaurantID);    

    // if user is online -- Transfer data from IDB and then delete it.
    if(navigator.onLine) {
      // get data from IDB
      console.log('online');
      transferReviewsFromIDBtoAPI();
    } else {
      console.log('offline');
      console.log(e);
      const offlineMessage = document.createElement('p');
      offlineMessage.innerHTML = 'You currently seem to be offline, but your review will be posted once you are online. Please check your connection.'
      offlineMessage.style.color = 'red';
      reviewForm.appendChild(offlineMessage);


      // if user is offline and somehow comes online while on the same page transfer data to IDB.
      e.view.window.addEventListener('online', function() {
        console.log('just came online');
        transferReviewsFromIDBtoAPI();
      });
    };

  // add review to page
  const ul = document.getElementById('reviews-list');
  let date = new Date();
  let timestamp = date.getTime();
  ul.appendChild(createReviewHTML({'restaurant_id': restaurantID, 'rating': rating, 'name': name, 'comments': comments, 'createdAt': timestamp}));
  
  // clear form
  inputs.name.value = '';
  inputs.comments.value = '';
  };

}

let transferReviewsFromIDBtoAPI = () => {
  return DBHelper.dbPromise.then(db => {
    return db.transaction('temp-reviews')
      .objectStore('temp-reviews').getAll();
  }).then(reviews => {
    reviews.forEach(review => {
      // Use fetch to POST data to the API
      fetch(DBHelper.REVIEWS_URL, {
        method: "POST",
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "restaurant_id": review.restaurant_id,
          "name": review.name,
          "rating": review.rating,
          "comments": review.comments
        })
      })
      .catch(err => console.log('IDB ObjectStore empty or problem fetching data', err))
      .then(response => response.json())
      .then(review => {
        // Delete review from IDB Database
        return DBHelper.dbPromise.then(db => {
          return db.transaction('temp-reviews', 'readwrite')
            .objectStore('temp-reviews').delete(review.restaurant_id);
        }).then( () => {        
          // tell user that an offline review was posted in the background
          const reviewSubmissionMessage = document.createElement('p');
          reviewSubmissionMessage.innerHTML = 'Offline review submitted successfully';
          reviewSubmissionMessage.classList = 'review-message';
          
          const body = document.body;
          body.append(reviewSubmissionMessage);
          
          setTimeout(function() {
            reviewSubmissionMessage.style.display = 'none';
          }, 5000);
        });
      });     
    })
  });
}

let markFavoriteButton = (restaurantID, restaurantFavStatus) => {
  const favButton = document.querySelector('.mark-fav');
  let clicked = false;
  
  // if the restaurant is already favorited in the database, mark favorite.
  if(restaurantFavStatus === 'true') {
    clicked = !clicked;
    markFavorite(restaurantID, favButton);
  };

  // otherwise if the user clicks, just toggle the favorite status.
  favButton.addEventListener('click', function() {
    if(clicked === false) {
      clicked = !clicked;
      markFavorite(restaurantID, this);
    } else {
      clicked = !clicked;
      unmarkFavorite(restaurantID, this);
    };
  });
}

// Mark a restaurant Favorite
let markFavorite = (restaurantID, favButton) => {
  fetch(DBHelper.RESTAURANTS_URL + '/' + restaurantID + '/?is_favorite=true', {
    method: 'PUT'
  });
  favButton.classList += ' marked-fav';
  favButton.innerHTML = 'Unmark Favorite';
}

// Unmark a restaurant from Favorites
let unmarkFavorite = (restaurantID, favButton) => {
  fetch(DBHelper.RESTAURANTS_URL + '/' + restaurantID + '/?is_favorite=false', {
    method: 'PUT'
  });
  favButton.classList = 'mark-fav';
  favButton.innerHTML = 'Mark Favorite';
}

/**
 * Create review HTML and add it to the webpage.
 */
let createReviewHTML = (review) => {
  const li = document.createElement('li');
  const name = document.createElement('p');
  name.innerHTML = review.name;
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.createdAt).toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
let fillBreadcrumb = (restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
let getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}