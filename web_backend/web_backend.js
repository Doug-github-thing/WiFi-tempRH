require('dotenv').config();
const express = require('express');
const pg = require('pg');
const app = express();
app.use(express.json());

const conString = process.env.MY_ELEPHANTSQL_URL;
const db = new pg.Client(conString);

const port = 3333;


///////////////////////////////////////////////////////////////////////////////////
// For allowing the frontend through CORS for during development
const cors = require('cors');
app.use(cors());

///////////////////////////////////////////////////////////////////////////////////


// start listening for any incoming traffic
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


// Display index.html as landing page to show the app is running.
app.get('/',function(req, res) {
  res.sendFile('index.html', { root: __dirname });
});


// Connect to the database.
databaseConnect();


/**
 * Crashes the whole app if unable to connect to the database.
 */
function databaseConnect() {
  console.log("Attempting to connect to the database");

  db.connect(function(err) {
      if(err) {
          console.error(`Could not connect to postgres: ${err}`);
          console.log("Aborting execution due to postgres connection failure");
          process.exit(1);
      }
  });
}


/** 
 * Gets the most recent datapoint for a specified sensor module.
 * GET '/current'
 * Content-type: application/JSON
 * Body:
 * {
 *  "id": <sensor_module_id> // Unique identifier for the sensor module
 * }
 */
app.get('/current', (req, res) => {

  // Build SQL query
  const my_query = "SELECT * FROM TempRH_Porch ORDER BY id DESC LIMIT 1;";

  db.query(my_query, function(err, result) {
    if(err) {
      res.status(418).send("Error querying for newest data");
      return console.error('error running query', err);
    }
    res.status(200).send(result.rows[0]);
  });

});


/** 
 * Gets all entries from the last hour for a specified sensor module.
 * GET '/hour'
 * Content-type: application/JSON
 * Body:
 * {
 *  "id": <sensor_module_id> // Unique identifier for the sensor module
 * }
 */
app.get('/hour', function(req, res) {

  // Build SQL query
  const my_query = "SELECT * FROM TempRH WHERE timestamp >= NOW() - INTERVAL '1 hour';";

  db.query(my_query, function(err, result) {
    if(err) {
      res.status(418).send("Error querying for recent data");
      return console.error('error running query', err);
    }
    res.status(200).send(result.rows);
  });
});


/** 
 * Gets all entries from the last 24 hours for a specified sensor module.
 * GET '/day'
 * Content-type: application/JSON
 * Body:
 * {
 *  "id": <sensor_module_id> // Unique identifier for the sensor module
 * }
 */
app.get('/day', function(req, res) {

  // Build SQL query
  const my_query = "SELECT * FROM TempRH WHERE timestamp >= NOW() - INTERVAL '1 day';";

  db.query(my_query, function(err, result) {
    if(err) {
      res.status(418).send("Error querying for recent data");
      return console.error('error running query', err);
    }
    res.status(200).send(result.rows);
  });
});


/** 
 * Gets all entries for a given sensor ID between two specified unix_times (given as long integers)
 * GET '/interval'
 * Content-type: application/JSON
 * Body:
 * {
 *  "id": <sensor_module_id>, // Unique identifier for the sensor module
 *  "start": <start_timestamp>, // Given as a long integrer unix_timestamp
 *  "end": <end_timestamp> // Given as a long integrer unix_timestamp
 * }
 */
app.get('/interval', function(req, res) {

  // Build SQL query
  const my_query = "SELECT * FROM TempRH WHERE timestamp >= NOW() - INTERVAL '1 day';";

  db.query(my_query, function(err, result) {
    if(err) {
      res.status(418).send("Error querying for recent data");
      return console.error('error running query', err);
    }
    res.status(200).send(result.rows);
  });
});
