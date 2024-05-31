require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
app.use(express.json());
// import mysql from 'mysql2/promise';

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
        database: 'temprhdb'
    });
}
// Executes a defined query on a given connection, and sends response.
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
});
/** 
 * Gets all data for given sensor in a given node.
 * GET '/node/:node'
*/
app.get('/node/:node/:sensor', async (req, res) => {
    const connection = await getConnection();
    const node = parseInt(req.params.node);
    const sensor = parseInt(req.params.sensor);
    const my_query = `SELECT * FROM node_${node} WHERE sensor_id=${sensor}`;
    executeQuery(connection, my_query, req, res);
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
    }
    catch (err) {
        res.status(500).send(err.stack);
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
