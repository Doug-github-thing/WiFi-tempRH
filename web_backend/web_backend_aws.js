require('dotenv').config();
const express = require('express');
const app = express();
const mysql = require('mysql2/promise');
// app.use(express.json());
const body_parser = require('body-parser');
app.use(body_parser.json());

const port = 3333;

///////////////////////////////////////////////////////////////////////////////////
// For allowing the frontend through CORS for during development
const cors = require('cors');
app.use(cors());

///////////////////////////////////////////////////////////////////////////////////


// Connect to database
const getConnection = async () => {
    return await mysql.createConnection({
        user: process.env.DB_USER,
        password: process.env.DB_PWD,
        host: process.env.DB_ENDPOINT,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME
    });
}
/**
 * Executes a defined query on a given connection, and sends response.
 */
const executeQuery = async (connection, query, req, res) => {
    try {
        const [results, fields] = await connection.query(query);
        console.log(results); // results contains rows returned by server
        console.log(fields);  // fields contains extra meta data about results, if available
        res.status(200).send(results);
    }
    catch (err) {
        res.status(500).send(err.stack);
        throw err;
    }
}
/**
 * Executes a defined query on a given connection, and sends response.
 * Uses the Query with Placeholders syntax from https://sidorares.github.io/node-mysql2/docs
 */
const executeQueryPlaceholders = async (connection, query, placeholders, req, res) => {
    try {
        const [results, fields] = await connection.query(query, placeholders);
        console.log(results); // results contains rows returned by server
        console.log(fields);  // fields contains extra meta data about results, if available
        res.status(200).send(results);
    }
    catch (err) {
        res.status(500).send(err.stack);
        throw err;
    }
}



// Initializes webserver app, and tells stdout
app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
});


/** 
 * Gets all tables from the database.
 * GET '/tables'
 */
app.get('/tables', async (req, res) => {
    const connection = await getConnection();
    executeQuery(connection, "SHOW TABLES;", req, res);
    connection.end();
});

/** 
 * Gets the ids and names of each sensor in a given node.
 * GET '/node/:node'
 */
app.get('/node/:node', async (req, res) => {
    const connection = await getConnection();
    const node = parseInt(req.params.node);
    const my_query = `SELECT * FROM node_${node}_sensors`;
    executeQuery(connection, my_query, req, res);
    connection.end();
});

/** 
 * Gets all data for given sensor in a given node.
 * GET '/node/:node/:sensor'
*/
app.get('/node/:node/:sensor', async (req, res) => {
    const connection = await getConnection();
    const node = parseInt(req.params.node);
    const sensor = parseInt(req.params.sensor);
    const my_query = `SELECT * FROM node_${node} WHERE sensor_id=${sensor}`;
    executeQuery(connection, my_query, req, res);
    connection.end();
});


/**
 * Listen for incoming POST traffic to push to the database.
 * Expects a POST in the form: 
 * POST '/data/:node'
 * Content-type: application/JSON
 * Body:
 * {
 *  "sensor_id": <sensor_id>,    // Unique identifier for the sensor module
 *  "temp": <temperature_value>, // in F since rounding makes F a more precise value
 *  "rh": <%rh_value>
 * }
 */
app.post('/data/:node', async (req, res) => {

    // Parses values from incoming data from sensor module, 
    // and current timestamp to send to the database
    const timestamp = getTimestamp();
    const data = req.body;

    // Establish connection to the database
    const connection = await getConnection();
    // Parse which node this request belongs to
    const node = parseInt(req.params.node);

    // Craft query and push to the database
    const my_query = `INSERT INTO node_${node} VALUES (0, ?, ?, ?, ?);`;
    executeQueryPlaceholders(
        connection, my_query, [data.sensor_id, timestamp, data.temp, data.rh], req, res);
    connection.end();
});


/** 
 * Creates a new node representation in the database.
 *  TODO: Make it look through the number of nodes that exists and picks the next number.
 *  For now it just recreates Node0
 * POST '/new/node'
 */
app.post('/new/node', async (req, res) => {

    const id = 0; // A placeholder for the number of the node to add

    const connection = await getConnection();

    // Build query
    const create_data_table = "CREATE TABLE IF NOT EXISTS "
        + `node_${id} (`
        + "id SERIAL PRIMARY KEY,"
        + "sensor_id INT,"
        + "timestamp TIMESTAMP,"
        + "temp DECIMAL(4,1),"
        + "rh DECIMAL(4,1)"
        + ");";
        
    const create_sensors_table = "CREATE TABLE IF NOT EXISTS "
        + `node_${id}_sensors (`
        + "sensor_id SERIAL PRIMARY KEY,"
        + "name VARCHAR(50)"
        + ");";

    try {
        const [results, fields] = await connection.query(create_data_table);
        const [sensors_results, sensors_fields] = await connection.query(create_sensors_table);
        console.log(results); // results contains rows returned by server
        console.log(fields);  // fields contains extra meta data about results, if available
        res.status(200).send(results, sensors_results);
        connection.end();
    }
    catch (err) {
        res.status(500).send(err.stack);
        connection.end();
        throw err;
    }
});


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
    // TODO Build SQL query
    const my_query = "SELECT EXTRACT(epoch FROM timestamp) AS unix_timestamp, id, temp, rh " 
                   + "FROM TempRH_1 ORDER BY id DESC LIMIT 1;";
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

    // TODO Build SQL query
    const my_query = "SELECT EXTRACT(epoch FROM timestamp) AS unix_timestamp, timestamp, temp, rh "
                   + "FROM TempRH_1 WHERE timestamp >= NOW() - INTERVAL '1 hour';";

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

    // TODO Build SQL query
    const my_query = "SELECT EXTRACT(epoch FROM timestamp) AS unix_timestamp, timestamp, temp, rh "
                   + "FROM TempRH_1 WHERE timestamp >= NOW() - INTERVAL '1 day';";

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

    // TODO Build SQL query
    const my_query = "SELECT EXTRACT(epoch FROM timestamp) AS unix_timestamp, temp, rh "
                   + "FROM TempRH_1 WHERE timestamp >= NOW() - INTERVAL '1 day';";
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
