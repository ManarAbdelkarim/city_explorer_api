'use strict';
// Dependencies
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const superAgent = require('superagent');

//Application Setup
const PORT = process.env.PORT || 3002;
const app = express();
app.use(cors());
// DataBase connection
const DATABASE_URL = process.env.DATABASE_URL;

let client;
const pg  = require('pg');
client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})


let city;

const locationRoute = (req, res) => {
  // const locData = require('./data/location.json');
  city = req.query.city;
  // const url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
  const url = 'https://eu1.locationiq.com/v1/search.php';
  const query = {
    key : process.env.GEO_CODE_API_KEY,
    lat : req.query.latitude,
    lon: req.query.longitude,
    city: city,
    format: 'json'
  }
  if (!city) {
    res.status(500).send('Status 500 : sorry , something went wrong');
  }
  const sqlQuery = `SELECT * FROM locations WHERE search_query = '${city}';`;
  client.query(sqlQuery).then(data => {
    // console.log('the data from here', data);

    if (data.rows.length === 0) {
      superAgent.get(url).query(query).then(location => {
        let locObj = new Location(city, location.body[0]);
        const insertInto = `INSERT INTO locations
      (search_query, formatted_query, latitude, longitude)
      VALUES ($1,$2,$3,$4);`;
        let values = [city, locObj.formatted_query, locObj.latitude, locObj.longitude];

        client.query(insertInto, values)
          .then(() => {
            res.status(200).json(locObj);
          })
      }).catch(() => {
        handleErrors('there is no Location ya bo', req, res)

      });
    }
    else if (data.rows[0].search_query === city) {
    // get data from DB
      console.log('they are equal' ,data.rows[0]);
      res.status(200).json(data.rows[0]);
    }
  }).catch(() => {
    handleErrors('there is no weather ya boy', req, res);
  });

};
app.get('/location', locationRoute);




const moviesRoute = (req, res) => {
  const key = process.env.MOVIE_API_KEY;
  const url = 'https://api.themoviedb.org/3/search/multi';
  // const url = 'https://api.themoviedb.org/3/search';

  const query = {
    api_key : key,
    language: 'en-US',
    query: city ,
    include_adult : false,
    page :1,
    sort_by: 'popularity.desc'
  }

  // https://api.themoviedb.org/3/search/movie?api_key=${MOVIE_API_KEY}&query=${searchQuery}&page=1&sort_by=popularity.desc&include_adult=false
  superAgent.get(url).query(query).then(movie =>{
    const moviesArr =movie.body.results.map(val => new Movie(val));
    res.send(moviesArr);
    // console.log(moviesArr);
    req.status(200).send(moviesArr);

  })
    .catch(() => {
      handleErrors('there is no movies here ya boy', req, res);
    })

};

app.get('/movies' , moviesRoute);


function weatherRoute(req, res) {
  // let city = req.query.search_query;
  let key = process.env.WEATHER_CODE_API_KEY;
  let url = 'https://api.weatherbit.io/v2.0/forecast/daily';
  const query = {
    city :city,
    key :key
  }

  superAgent.get(url).query(query)
    .then(weather => {
      const weatherArr = weather.body.data.map(val => new Weather(val));
      res.send(weatherArr);
      // console.log(weatherArr);
    })
    .catch(() => {
      handleErrors('there is no weather here ya boy', req, res);
    })
}

app.get('/weather', weatherRoute);


function parksRoute(req, res) {
  // console.log(req.query);
  // const code = req.query.latitude + ',' + req.query.longitude;
  const key = process.env.PARK_CODE_API_KEY;
  const url = 'https://developer.nps.gov/api/v1/parks';
  const query = {
    q:city,
    parkCode: req.query.parkCode,
    api_key:key,
    limit :10
  }
  superAgent.get(url).query(query).then(parkData => {
    // console.log(parkData.body.data[0].entranceFees[0].cost);
    let parkArr = parkData.body.data.map(val => new Park(val));
    res.send(parkArr);
  }).catch(() => {
    handleErrors('there is no parks here ya boy', req, res);
  });
}

app.get('/parks', parksRoute);

// objects

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
  this.fee =data.fees[0] || '5.00';
  this.description = data.description;
  this.url = data.url;
}

let movieCount = 1;
function Movie(data) {
  this.title = `${movieCount} ${data.title}`;
  this.overview = data.overview;
  this.average_votes = data.vote_average;
  this.total_votes = data.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${data.poster_path}`;
  this.popularity = data.popularity;
  this.released_on = data.release_date;
  movieCount ++;
}


function handleErrors(error, req, res) {
  const errObj = {
    status: '500',
    responseText: error
  }
  res.status(500).send(errObj);
}

client.connect().then(() =>{
  console.log('my database is ', client.database);
  app.listen(PORT, () => console.log(`Listening to Port ${PORT}`));
});
