'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');

// Application Setup
// const PORT = process.env.PORT;
const app = express();
app.use(cors());

// routes
app.get('/location', handelLocationRequest);
app.get('/restaurants', handelRestaurantRequest);
const PORT = process.env.PORT || 3000;



function handelLocationRequest(req, res) {

  const searchQuery = req.query;
  console.log(searchQuery);

  const locationsRawData = require('./public/starter-code/data/location.json');
  const location = new Location(locationsRawData[0])
  res.send(location);
}
function handelRestaurantRequest(req, res) {
  const restaurantsRawData = require('./data/restaurants.json');
  const restaurantsData = [];

  restaurantsRawData.nearby_restaurants.forEach(restaurant => {
    restaurantsData.push(new Restaurant(restaurant));
  });

  res.send(restaurantsData);

}

// constructors

function Location(data) {
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Restaurant(data) {
  this.restaurant = data.restaurant.name;
  this.cuisines = data.restaurant.cuisines;
  this.locality = data.restaurant.location.locality;
}

app.use('*', (req, res) => {
  res.send('all good nothing to see here!');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));
