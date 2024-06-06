require('dotenv').config();
const express = require('express');
const http = require('http');
const app = express();
const body_parser = require('body-parser');
app.use(body_parser.json());

// const pg_client = process.env.MY_ELEPHANTSQL_URL;
// const db = new pg.Client(pg_client);

const port = 55555;


// Start listening for any incoming traffic.
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


/**
 * Display index.html as landing page to show the app is running.
 */
app.get('/', (req, res) => {
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
 * 
 * Replies to the request with the current time as plain text of the form:
 * "Success:HH:MM:SS"
 * Where HH is the current hour
 * MM is the current minute
 * SS is the current amount of seconds
 */
app.post('/data', (req, res) => {
    console.log("got:");
    console.log(req.body);
    // Parses values from incoming data from sensor module, 
    // and current timestamp to send to the database
    const timestamp = getTimestamp();
    const data = req.body;

    // Passes SQL query to the database
    console.log(`parsed data. ${timestamp}, ${data.temp}, ${data.rh}`);


    // http://temprh-backend.duckdns.org:3333/data/0 --header "Content-Type: application/json" --data '{"sensor_id":0,"temp":12.3,"rh":45.6}'
        const json_data = JSON.stringify({
            sensor_id: data.id,
            timestamp: timestamp,
            temp: data.temp,
            rh: data.rh
        });
        const options = {
            hostname: 'temprh-backend.duckdns.org',
            port: 3333,
            path: `/data/0`,
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(json_data)
            }
        };
        const post = http.request(options, (res) => {
            let responseBody = '';
          
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                responseBody += chunk;
            });
          
            res.on('end', () => {
                console.log('Response:', responseBody);
            });
        });
          
        post.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
        });
          
        // Write data to request body
        post.write(json_data);
        post.end();


    
    res.status(200).send(`Success:${getHHMMSS()}`);
});


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
        + "temp decimal(4,1),"
        + "rh decimal(4,1)"
        + ");";

    // Runs query to create table
    db.query(my_query, (err, result) => {
        if(err)
            console.error(`Error creating TempRH table: ${err}`);
    });
}


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
 * Gets the current time formatted as HH:MM:SS to send to the sensor board.
 */
function getHHMMSS() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}
