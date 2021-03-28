'use strict';


require('dotenv').config();

const express = require('express');
const cors = require('cors');


const PORT = process.env.PORT || 5001;

const app = express();
app.use(cors());


app.get('/location', handelLocationRequest);
app.get('/weather', handelWeatherRequest);
function handelLocationRequest(req, res) {

  let searchQuery = req.query;
  searchQuery = Object.values(searchQuery);
  console.log(searchQuery);

  const locationsRawData = require('./data/location.json');
  const location = new Location(locationsRawData[0])
  if (searchQuery[0].includes(location.search_query)) {

    res.send(location);

  }
  else{
    res.status(500).send('Status 500: Sorry, something went wrong');
  }


}


function handelWeatherRequest(req, res) {
  const weatherRawData = require('./data/weather.json');
  const weatherData = [];

  weatherRawData.data.forEach(weather => {
    weatherData.push(new Weather(weather));
  });

  res.send(weatherData);

}



function Location(data) {
  this.search_query = data.display_name.split(',')[0].toLowerCase();
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
