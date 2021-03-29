'use strict';

// Application Dependencies
const express = require('express');
//CORS = Cross Origin Resource Sharing
const cors = require('cors');
//DOTENV (read our enviroment variable)
require('dotenv').config();
const superAgent = require('superagent');


//Application Setup
const PORT = process.env.PORT || 3030;
const app = express();
app.use(cors());


app.get('/location', locationRoute);
function locationRoute(req, res) {
  // const locData = require('./data/location.json');
  const cityName = req.query.city;
  let key = process.env.GEO_CODE_API_KEY;
  let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
  superAgent.get(url)
    .then(location => {
      const locObj = new Location(cityName, location.body[0]);
      res.send(locObj);
    }).catch((error) => {
      console.error('ERROR',error);
      req.status(500).send('no Location ya boy');
    })
}

app.get('/weather', weatherRoute);
function weatherRoute(req, res) {
  let city = req.query.search_query;
  let key = process.env.WEATHER_CODE_API_KEY;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${key}`;
  superAgent.get(url)
    .then(weather => {
      let weatherArr = weather.body.data.map(val => new Weather(val));
      res.send(weatherArr);
    })
    .catch((error) => {
      console.error('ERROR',error);
      req.status(500).send('no weather ya boy');
    })
}


app.get('/parks', parksRoute);
function parksRoute(req, res) {
  console.log(req.query);
  let code = req.query.latitude + ',' + req.query.longitude;
  let key = process.env.PARK_CODE_API_KEY;
  let url = `https://developer.nps.gov/api/v1/parks?parkCode=${code}&api_key=${key}`;
  superAgent.get(url).then(parkData => {
    let parkArr = parkData.body.data.map(val => new Park(val));
    res.send(parkArr);
  }).catch((error) => {
    console.error('ERROR',error);
    req.status(500).send('no parks ya boy');
  })
}




function Location(city, data) {
  this.search_query = city;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Weather(data) {
  this.forecast = data.weather.description;
  this.time = new Date(data.valid_date).toString().slice(0, 15);
}

function Park(data) {
  this.name = data.name;
  this.address = `"${data.addresses[0].line1}" "${data.addresses[0].city}" "${data.addresses[0].stateCode}" "${data.addresses[0].postalCode}"`;
  this.fee = '5.00';
  this.description = data.description;
  this.url = data.url;
}


app.use('*', (req, res) => {
  res.send('all good nothing to see here!');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));
