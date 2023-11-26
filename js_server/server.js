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


// Establish connection to ElephantSQL database
db.connect(function(err) {
  if(err) {
    return console.error('could not connect to postgres', err);
  }
  console.log("Connected to database!");

  // Creates the TempRH table if it does not exist
  const my_query = "CREATE TABLE IF NOT EXISTS "
                  + "TempRH ("
                  + "ID SERIAL PRIMARY KEY,"
                  + "timestamp timestamp,"
                  + "temp decimal(5,2),"
                  + "rh decimal(5,2)"
                  + ");";

  // Runs query to create table
  db.query(my_query, function(err, result) {
    if(err)
      return console.error('error creating TempRH table', err);
  });

});


// display index.html as landing page
app.get('/',function(req, res) {
    console.log("get was called");
    res.sendFile('index.html', { root: __dirname + '/web/'});
});


// Get the most recent datapoint and return it to the frontend
app.get('/current', (req, res) => {

  // Build SQL query
  const my_query = "SELECT * FROM TempRH ORDER BY id DESC LIMIT 1;";

  db.query(my_query, function(err, result) {
    if(err) {
      res.status(418).send("Error querying for newest data");
      return console.error('error running query', err);
    }
    res.status(200).send(result.rows[0]);
  });

});

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


// listen for incoming POST traffic from Board with new data to push the the database.
app.post('/data', (req, res) => {
    
    // Parses values from incoming data from Board, 
    // and current timestamp to send to the database
    const timestamp = getTimestamp();
    const data = req.body;

    // Builds SQL query
    const my_query = "INSERT INTO TempRH (timestamp, temp, rh) VALUES ("
                    + `'${timestamp}',`
                    + `'${data.temp}',`
                    + `'${data.rh}');`;
    console.log("Attempting to run: " + my_query);

    // Passes SQL query to ElephantSQL connection
    db.query(my_query, function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      console.log("Query sent successfully");
    });
    
    res.status(200).send("Done");
  });


// // returns an Object containing 'date' and 'time'
// // of the form {date:"YYYY-MM-DD", time:"hh:mm:ss"}
// function getDateTime() {
//   let today = new Date();
//   let paddedMonth   = (today.getMonth()+1).toLocaleString(undefined, {minimumIntegerDigits: 2});
//   let paddedDay     = today.getDate().toLocaleString(undefined, {minimumIntegerDigits: 2});
//   let paddedHours   = today.getHours().toLocaleString(undefined, {minimumIntegerDigits: 2});
//   let paddedMinutes = today.getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2});
//   let paddedSeconds = today.getSeconds().toLocaleString(undefined, {minimumIntegerDigits: 2});
//   let date = today.getFullYear() + "-" + paddedMonth + "-" + paddedDay;
//   let time = paddedHours + ":" + paddedMinutes + ":" + paddedSeconds;
  
//   return {date:date, time:time};
// }


// Gets the current timestamp in the proper format to use as a SQL timestamp
function getTimestamp() {
  const now = new Date();
  // Format the date as a string in the 'YYYY-MM-DD HH:mm:ss' format
  //  1.  now.toISOString() generates a string representation of the date in the ISO format: 'YYYY-MM-DDTHH:mm:ss.sssZ'.
  //  2.  .replace('T', ' ') replaces the 'T' character with a space.
  //  3.  .replace(/\.\d{3}Z$/, '') removes the milliseconds and the 'Z' character at the end.
  return now.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');  
}
