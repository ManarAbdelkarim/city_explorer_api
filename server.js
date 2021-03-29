'use strict';


require('dotenv').config();

const express = require('express');
const cors = require('cors');
const superAgent = require('superagent');
const PORT = process.env.PORT || 5001;
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY ;
const WEATHER_CODE_API_KEY = process.env.WEATHER_CODE_API_KEY;
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));

let urlGEO;
let latLonData;
app.get('/location', handelLocationRequest);
app.get('/weather', handelWeatherRequest);
function handelLocationRequest(req, res) {

  const city = req.query.city;
  urlGEO = `https://us1.locationiq.com/v1/search.php?key=${GEO_CODE_API_KEY}&city=${city}&format=json`;

  if (!city) {

    res.status(500).send('Status 500: Sorry, something went wrong');

  }
  // searchQuery = Object.values(searchQuery);
  console.log(city);

  // const locationsRawData = require('./data/location.json');
  superAgent.get(urlGEO).end(resData =>{

    const location = new Location( city , resData.bode[0]);
    latLonData = {
      lat : resData.bode[0].lat ,
      lon : resData.bode[0].lon
    }
    console.log(latLonData);
    res.status(200).send(location);
    // console.log('this is the location search_query' , location.search_query);


    // res.send(location);

  }).catch((error) => {
    console.log('ERROR', error);
    res.status(500).send('Sorry, something went wrong');
  });



}




function handelWeatherRequest(req, res) {
  // const weatherRawData = require('./data/weather.json');
  const url = `https://api.weatherbit.io/v2.0/current?lat=${latLonData[0].lat}&lon=${latLonData[0].lon}&key=${WEATHER_CODE_API_KEY}&include=minutely`;

  const weatherData = [];
  superAgent.get(url).end(reqData => {
    const myWeatherData = reqData.body.map(weather => {
      weatherData.push(new Weather(weather));
    });

    res.send( myWeatherData);
  }).catch((error) => {
    console.error('ERROR',error);
    req.status(500).send('no weather ya boy');
  });


}

function Location(data ,searchQuery) {
  // this.search_query = data.display_name.split(',')[0].toLowerCase();
  this.search_query = searchQuery.city;
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
