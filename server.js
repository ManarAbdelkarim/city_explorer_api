'use strict';

// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');

// Application Setup
// const PORT = process.env.PORT;
const PORT = process.env.PORT || 3000;

const app = express();
app.use(cors());

// routes
app.get('/location', handelLocationRequest);
app.get('/weather', handelWeatherRequest);
function handelLocationRequest(req, res) {

  const searchQuery = req.query;
  console.log(searchQuery);

  const locationsRawData = require('./data/location.json');
  const location = new Location(locationsRawData[0])
  res.send(location);
}

function handelWeatherRequest(req, res) {
  const weatherRawData = require('./data/weather.json');
  const weatherData = [];

  weatherRawData.data.forEach(weather => {
    weatherData.push(new Weather(weather));
  });

  res.send(weatherData);

}




// constructors

function Location(data) {
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Weather(data) {
  this.forecast = data.weather.description;
  this.valid_date = data.valid_date;
}

app.use('*', (req, res) => {
  res.send('all good nothing to see here!');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));
