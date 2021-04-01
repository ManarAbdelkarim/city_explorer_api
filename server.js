'use strict';

require('dotenv').config();

// Dependencies
const express = require('express');
const pg = require('pg');
const superAgent = require('superagent');
const cors = require('cors');


// Setup
const PORT = process.env.PORT || 3001;
const ENV = process.env.ENV || 'DEP';
const DATABASE_URL = process.env.DATABASE_URL;
const app = express();
app.use(cors());

///// database connection setup
let client = '';
if (ENV === 'DEP') {
  client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} else {
  client = new pg.Client({
    connectionString: DATABASE_URL,
  });
}


// Handle Functions

let city;
const locationRoute = (req, res) => {
  city = req.query.city;
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
  client.query(sqlQuery)
    .then(data => {
      if (data.rows.length === 0) {
        superAgent.get(url).query(query)
          .then(location => {
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





const weatherRoute = (req, res) => {
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
};


const parksRoute = (req, res) => {
  const key = process.env.PARK_CODE_API_KEY;
  const url = 'https://developer.nps.gov/api/v1/parks';
  const query = {
    q:city,
    parkCode: req.query.parkCode,
    api_key:key,
    limit :10
  }
  superAgent.get(url).query(query).then(parkData => {
    let parkArr = parkData.body.data.map(val => new Park(val));
    res.send(parkArr);
  }).catch(() => {
    handleErrors('there is no parks here ya boy', req, res);
  });
};

const moviesRoute = (req, res) => {
  const key = process.env.MOVIE_API_KEY;
  const url = 'https://api.themoviedb.org/3/search/multi';
  const query = {
    api_key : key,
    language: 'en-US',
    query: city ,
    include_adult : false,
    page :1,
    sort_by: 'popularity.desc'
  }
  superAgent.get(url).query(query).then(movie =>{
    const moviesArr =movie.body.results.map(val => new Movie(val));
    res.send(moviesArr);
    req.status(200).send(moviesArr);
  })
    .catch(() => {
      handleErrors('there is no movies here ya boy', req, res);
    })

};



let yelpPreviousQuery = '';
let offset = -5;
function yelpRoute (req, res) {
  const searchQuery = req.query.search_query;
  if (searchQuery !== yelpPreviousQuery) {
    yelpPreviousQuery = searchQuery;
    offset = 0;
  } else {
    offset += 5;
  }
  const pageQ = req.query.page;
  const key = process.env.YELP_API_KEY;
  const myQuery = {
    location : city,
    page : pageQ,
    term : 'restaurants',
    limit:5,
    offset :offset
  }
  const url = 'https://api.yelp.com/v3/businesses/search'

  if (!searchQuery) { //for empty request
    res.status(404).send('no search query was provided');
  }

  superAgent.get(url).query(myQuery).set(`Authorization`, `Bearer ${key}`).then(data => {
    const yelpData = data.body.businesses.map(business => {
      return new Yelp(business);
    });
    res.status(200).send(yelpData);
  }).catch(() => {
    handleErrors('there is no Yelp here ya boy ', req, res)
  });
}




// Constructors
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



function Yelp(data) {
  this.name = data.name;
  this.image_url = data.image_url;
  this.price = data.price;
  this.rating = data.rating;
  this.url = data.url;
}

//////


function handleErrorNotFound(req, res) {
  res.status(404).send('Sorry, something went wrong');
}




// Endpoints
app.get('/location', locationRoute);
app.get('/weather',weatherRoute);
app.get('/movies', moviesRoute);
app.get('/parks', parksRoute);
app.get('/yelp', yelpRoute);
app.use('*', handleErrorNotFound);

// ERROR HANDLER
function handleErrors(error, req, res) {
  const errObj = {
    status: '500',
    responseText: error
  }
  res.status(500).send(errObj);
}
client.connect().then(() => {
  app.listen(PORT, () => {
    console.log('connected to db', client.connectionParameters.database); //show what database we are connected to
    console.log(`Listening to Port ${PORT}`);
  });
}).catch(error => {
  console.log('error', error);
});
