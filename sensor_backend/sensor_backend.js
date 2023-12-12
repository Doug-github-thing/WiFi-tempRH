require('dotenv').config();
const express = require('express');
const pg = require('pg');
const app = express();
const bodyParser = require('body-parser');
app.use(bodyParser.json());
// app.use(express.json());

const conString = process.env.MY_ELEPHANTSQL_URL;
const db = new pg.Client(conString);

const port = 3333;

// Start listening for any incoming traffic.
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


/**
 * Display index.html as landing page to show the app is running.
 */
app.get('/',function(req, res) {
    res.sendFile('index.html', { root: __dirname });
});
  
  
// Connect to the database.
databaseConnect();


/**
 * Crashes the whole app if unable to connect to the database.
 * App daemon would be restarted by pm2 to ensure uptime.
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
 * Display index.html as landing page to show the app is running.
 */
app.get('/',function(req, res) {
    res.sendFile('index.html', { root: __dirname });
});


/**
 * Listen for incoming POST traffic from the sensor module with new data to push the the database.
 * Expects a POST in the form: 
 * POST '/data'
 * Content-type: application/JSON
 * Body:
 * {
 *  "id": <sensor_module_id>, // Unique identifier for the sensor module
 *  "temp": <temperature_value>, // in F since rounding makes F a more precise value
 *  "rh": <%rh_value>
 * }
 */
app.post('/data', (req, res) => {

    // Parses values from incoming data from sensor module, 
    // and current timestamp to send to the database
    const timestamp = getTimestamp();
    const data = req.body;

    // Makes sure the table exists before attempting to add data to it
    createTable(data.id);

    // Builds SQL query
    const my_query = `INSERT INTO TempRH_${data.id} (timestamp, temp, rh) VALUES (`
                    + `'${timestamp}',`
                    + `'${data.temp}',`
                    + `'${data.rh}');`;
    console.log("Attempting to run: " + my_query);

    // Passes SQL query to ElephantSQL connection
    db.query(my_query, function(err, result) {
      if(err) {
        return console.error(`Error running query: ${err}`);
      }
      res.status(200).send(`Successfully added (${data.temp}, ${data.rh}) to TempRH_${data.id}`);
    });
});

/**
 * Gets the current timestamp in the proper format to use as a SQL timestamp
 */
function getTimestamp() {
    const now = new Date();
    // Format the date as a string in the 'YYYY-MM-DD HH:mm:ss' format
    //  1.  now.toISOString() generates a string representation of the date in the ISO format: 'YYYY-MM-DDTHH:mm:ss.sssZ'.
    //  2.  .replace('T', ' ') replaces the 'T' character with a space.
    //  3.  .replace(/\.\d{3}Z$/, '') removes the milliseconds and the 'Z' character at the end.
    return now.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');  
}
  

/**
 * @param id The ID of the sensor module
 * 
 * Creates if not exists a table called "TempRH_<id>"
 */
function createTable(id) {
    // Creates the TempRH table if it does not exist
    const my_query = "CREATE TABLE IF NOT EXISTS "
        + `TempRH_${id} (`
        + "ID SERIAL PRIMARY KEY,"
        + "timestamp timestamp,"
        + "temp decimal(5,2),"
        + "rh decimal(5,2)"
        + ");";

    // Runs query to create table
    db.query(my_query, function(err, result) {
        if(err)
            console.error(`Error creating TempRH table: ${err}`);
    });
}
