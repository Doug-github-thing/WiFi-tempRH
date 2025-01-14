// require('dotenv').config();
const express = require('express');
const app = express();
const mysql = require('mysql2/promise');
const body_parser = require('body-parser');
// For parsing JSON and URL-encoded data
app.use(body_parser.json());
app.use(body_parser.urlencoded({ extended: true }));
const fs = require('fs');
// For google oauth2 GoogleIDToken verification 
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client();

const port = 4001;

///////////////////////////////////////////////////////////////////////////////////
// For allowing communication to the dedicated frontend location
const cors = require('cors');
app.use(cors());
///////////////////////////////////////////////////////////////////////////////////


// Connect to database
const getConnection = async () => {
    const dbPassword = fs.readFileSync(process.env.DB_PASSWORD_FILE, 'utf8').trim();
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: dbPassword
    });
}


/**
 * Verifies the ID of a frontend user by making a call to Google's Oauth2 API.
 * @param {string} googleIdToken String representing JWT of a frontend user's login info. 
 * @returns the Payload resulting from a successful google login, or error.
 */
async function googleVerify(googleIdToken) {
    const ticket = await client.verifyIdToken({
        idToken: googleIdToken,
    });
    const payload = ticket.getPayload();
    return payload;
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
app.listen(port, async () => {
    // Create a connection, then close it again. 
    // Verifies connection is possible.
    const connection = await getConnection();
    connection.end();

    console.log(`Monitor project's Web Backend server is listening.`);
});


/**
 * Passes a GoogleIDToken JWT from a frontend client on to Google to verify the id token. 
 * Upon identification of a valid user login, returns the user's id details in json format. 
 * POST '/auth/google'
 * Content-type: application/JSON
 * Body:
 * {
 *   "idToken": <id_token>    // GoogleIDToken JWT
 * }
 * https://developers.google.com/identity/gsi/web/guides/verify-google-id-token#node.js
 */
// Google OAuth token exchange route
app.post('/auth/google', async (req, res) => {
    const { idToken } = req.body; // Access idToken from the request body
    console.log("The received Google ID Token is: ", idToken);
    if (!idToken)
        return res.status(400).json({ error: 'Google ID token is required' });
    try {
        // Call my verify function with parsed idToken
        const payload = await googleVerify(idToken);
        res.status(200).json({ payload });
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ error: 'Failed to verify token' });
    }
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
    const my_query = "SELECT * FROM node_?_sensors";
    executeQueryPlaceholders(connection, my_query, [node], req, res);
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
    const my_query = `SELECT * FROM node_? WHERE sensor_id=?`;
    executeQueryPlaceholders(connection, my_query, [node, sensor], req, res);
    connection.end();
});

/** 
 * TODO: Make this work to get the most recent data point for all sensor modules in a given node.
 * GET '/node/:node'
 */
app.get('/current/:node', async (req, res) => {
    const connection = await getConnection();
    const node = parseInt(req.params.node);
    const my_query = 
        `SELECT * FROM node_?_sensors ns JOIN node_? n ON ns.sensor_id = n.sensor_id 
        WHERE n.timestamp = (SELECT MAX(n1.timestamp) FROM node_? n1 WHERE n1.sensor_id = ns.sensor_id)
        ORDER BY ns.sensor_id ASC;`;   
    executeQueryPlaceholders(connection, my_query, [node, node, node], req, res);
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
    const my_query = `INSERT INTO node_? VALUES (0, ?, ?, ?, ?);`;
    executeQueryPlaceholders(
        connection, my_query, [node, data.sensor_id, timestamp, data.temp, data.rh], req, res);
    connection.end();
});


/** 
 * Creates a new node representation in the database.
 * Expects a POST in the form: 
 * POST '/new/node'
 * Content-type: application/JSON
 * Body:
 * {
 *  "owner": <owner_id_int>,    // Int unique identifier for the user_id of this node's owner
 *  "name": <node_name_string>, // String name for this node
 * }
 */
app.post('/new/node/', async (req, res) => {

    const new_node_owner = req.body.owner;
    const new_node_name = req.body.name;

    const connection = await getConnection();

    
    try {
        // 1. insert new node into nodes table, get the # of this new node
        const insert_node_query = "INSERT INTO monitorDB.nodes VALUES (NULL, ?, ?);";
        const [results, fields] = await connection.query(insert_node_query, [new_node_owner, new_node_name]);
        const new_node_id = results.insertId;
        
        // 2. Create node_#_sensors
        const new_node_sensors_query = 
        `CREATE TABLE IF NOT EXISTS monitorDB.node_?_sensors (`
        + "sensor_id INT PRIMARY KEY, name VARCHAR(50));";
        const [sensors_results, sensors_fields] = await connection.query(new_node_sensors_query, new_node_id);
        
        
        // 3. Create node_#
        const new_node_query = 
        `CREATE TABLE IF NOT EXISTS monitorDB.node_? ( `
            + "id INT AUTO_INCREMENT PRIMARY KEY,"
            + "sensor_id INT,"
            + "timestamp TIMESTAMP,"
            + "temp DECIMAL(4,1),"
            + "rh DECIMAL(4,1)"
        + ");"
        const [node_results, node_fields] = await connection.query(new_node_query, new_node_id);
                
        console.log(`Added new node with number ${new_node_id}`);
        res.status(200).send(results);
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
    const isoString = new Date().toISOString();

    // Create a new Date object from the ISO string
    const date = new Date(isoString);

    // Convert to Eastern Time (US & Canada)
    const options = {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    };

    const localDateString = date.toLocaleString("en-US", options);

    // Extract and format date components
    const [month, day, year] = localDateString.split(",")[0].split("/");
    const time = localDateString.split(",")[1].trim();

    // Format the string as "YYYY-MM-DD HH:mm:ss"
    const formattedString = `${year}-${month}-${day} ${time}`;

    return formattedString;
    // Format the date as a string in the 'YYYY-MM-DD HH:mm:ss' format
    //  1.  now.toISOString() generates a string representation of the date in the ISO format: 'YYYY-MM-DDTHH:mm:ss.sssZ'.
    //  2.  .replace('T', ' ') replaces the 'T' character with a space.
    //  3.  .replace(/\.\d{3}Z$/, '') removes the milliseconds and the 'Z' character at the end.
    // return now.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');  
} 
