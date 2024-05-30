require('dotenv').config();
const express = require('express');
const mysql = require('mysql');
const app = express();
app.use(express.json());

const conString = process.env.MY_SQL_URL;
const port = 3333;

///////////////////////////////////////////////////////////////////////////////////
// For allowing the frontend through CORS for during development
const cors = require('cors');
app.use(cors());

///////////////////////////////////////////////////////////////////////////////////


// Generic connect to the database and read all in dummy table
const databaseConnect = async () => {
	const connection = mysql.createConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PWD,
        host: process.env.DB_ENDPOINT,
	    database: 'temprhdb'
  	});

	const my_query = "SELECT * FROM bwa;";

	connection.connect(function(err) {
		if (err) throw err;
		console.log("Connemct");
	});

	connection.query(my_query, function (err, result) {
    	if (err) throw err;	
		console.log(JSON.stringify(result));
  });
}


app.listen(port, () => {
	  console.log(`Server is listening on port ${port}`);
});


app.get('/all', async (req, res) => {

    const connection = mysql.createConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PWD,
        host: process.env.DB_ENDPOINT,
        database: 'temprhdb'
    });
 
    const my_query = "SELECT * FROM bwa;";
 
    connection.connect(function(err) {
        if (err) throw err;
        console.log("Connemct");
    });
 
    connection.query(my_query, function (err, result) {
        if (err) throw err;
        const str_result = JSON.stringify(result);
        console.log("Requested all. Result:");
        console.log(str_result);
        res.status(200).send(result);
    });
}); 


/**
 * Crashes the whole app if unable to connect to the database.
*/
// function databaseConnect() {
  //   console.log("Attempting to connect to the database");
  
  //   db.connect(function(err) {
    //     if(err) {
      //       console.error(`Could not connect to postgres: ${err}`);
      //       console.log("Aborting execution due to postgres connection failure");
      //       process.exit(1);
      //     }
//   });
// }


// Display index.html as landing page to show the app is running.
app.get('/',function(req, res) {
    res.sendFile('index.html', { root: __dirname });
});


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
    const my_query = "SELECT EXTRACT(epoch FROM timestamp) AS unix_timestamp, id, temp, rh " 
                   + "FROM TempRH_1 ORDER BY id DESC LIMIT 1;";

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
    const my_query = "SELECT EXTRACT(epoch FROM timestamp) AS unix_timestamp, timestamp, temp, rh "
                   + "FROM TempRH_1 WHERE timestamp >= NOW() - INTERVAL '1 hour';";

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
    const my_query = "SELECT EXTRACT(epoch FROM timestamp) AS unix_timestamp, timestamp, temp, rh "
                   + "FROM TempRH_1 WHERE timestamp >= NOW() - INTERVAL '1 day';";

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
    const my_query = "SELECT EXTRACT(epoch FROM timestamp) AS unix_timestamp, temp, rh "
                   + "FROM TempRH_1 WHERE timestamp >= NOW() - INTERVAL '1 day';";

    db.query(my_query, function(err, result) {
        if(err) {
            res.status(418).send("Error querying for recent data");
            return console.error('error running query', err);
        }
        res.status(200).send(result.rows);
    });
});
