'use strict';
require('dotenv').config();
// Dependencies
const express = require('express');
const cors = require('cors');
const superAgent = require('superagent');
// const { response } = require('express');

// Setup
const PORT = process.env.PORT || 3001;
const GEO_CODE_API_KEY = process.env.GEO_CODE_API_KEY ;
const WEATHER_CODE_API_KEY = process.env.WEATHER_CODE_API_KEY || 'e31b607f78b54ff1beb1b740fe25d00b' ;
const PARK_CODE_API_KEY = process.env.PARK_CODE_API_KEY;
const app = express();
app.use(cors());



// app.use(express.json());
// app.use(express.urlencoded({
//   extended: true
// }));



app.get('/location', handelLocationRequest);
const handelLocationRequest = (req, res) => {
  let city = req.query.city;
  let url = `https://eu1.locationiq.com/v1/search.php?key=${GEO_CODE_API_KEY}&q=${city}&format=json`;
  superAgent.get(url).then(data => {
    res.send(new Location( city , data.body[0]));
  }).catch((error) => {
    console.error('ERROR',error);
    req.status(500).send('no Location ya boy');
  });
};




app.get('/weather', handelWeatherRequest);
const handelWeatherRequest = (req, res) => {
  let city = req.query.search_query;
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&key=${WEATHER_CODE_API_KEY}`;
  // console.lon(url);
  superAgent.get(url).then(weatherData =>{
    let weatherArr = weatherData.body.data.map(weather => {
      weatherArr.push(new Weather(weather));
    });
    res.send(weatherArr);
  }).catch((error) => {
    console.error('ERROR',error);
    req.status(500).send('no weather ya boy');
  });

};

app.get('/parks', HandleParkRequest);
const HandleParkRequest = (req, res) => {
  // console.log(req.query);
  let code = req.query.latitude + ',' + req.query.longitude;
  // const url = `https://developer.nps.gov/api/v1/parks?q=${city.formatted_query}&limit=10&api_key=${key}`;
  const url = `https://developer.nps.gov/api/v1/parks?parkCode=${code}&api_key=${PARK_CODE_API_KEY}`;
  // console.log('url', url);
  superAgent.get(url).then(parksData=>{
    let resArr = parksData.body.data.map(park => {
      return new Park (park.fullName,park.addresses[0].city,park.entranceFees[0].cost,park.description,park.url);
    });
    res.send(resArr);
  }).catch((error) => {
    console.error('ERROR',error);
    req.status(500).send('no parks ya boy');
  });
};



function Location(city , data ) {
  this.search_query = city;
  this.formatted_query = data.display_name;
  this.latitude = data.lat;
  this.longitude = data.lon;
}

function Weather(data) {
  this.forecast = data.weather.description;
  this.time = new Date(data.valid_date).toDateString().slice(0, 15);
}


function Park (data){
  this.name = data.name;
  this.address = `"${data.addresses[0].line1}" "${data.addresses[0].city}" "${data.addresses[0].stateCode}" "${data.addresses[0].postalCode}"`;
  this.fee = data.entranceFees[0].cost;
  this.description = data.description;
  this.url = data.url;
}


app.use('*', (req, res) => {
  res.send('all good nothing to see here!');
});

app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));
