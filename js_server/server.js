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
  });


  // display index.html as landing page
app.get('/',function(req, res) {
    console.log("get was called");
    res.sendFile('index.html', { root: __dirname + '/web/'});
});


// Get the most recent datapoint and return it to the frontend
app.get("/current", (req, res) => {

  // Builds SQL query
  const my_query = "SELECT * FROM TempRH ORDER BY date || ' ' || time DESC LIMIT 1;";

  db.query(my_query, function(err, result) {
    if(err) {
      res.status(418).send("Error querying for newest data");
      return console.error('error running query', err);
    }
    res.status(200).send(result.rows[0]);
  });

});


// listen for incoming POST traffic from Board with new data to push the the database.
app.post('/data', (req, res) => {
    
    // parses values from incoming data from Board, 
    // and current timestamp to send to the database
    dateTime = getDateTime();
    const data = req.body;

    // builds SQL query
    const my_query = "INSERT INTO temprh (date, time, temp, rh) VALUES ("
                    + `'${dateTime.date}',`
                    + `'${dateTime.time}',`
                    + `'${data.temp}',`
                    + `'${data.rh}');`;
    console.log("Attempting to run " + my_query);

    // passes SQL query to ElephantSQL connection
    db.query(my_query, function(err, result) {
      if(err) {
        return console.error('error running query', err);
      }
      console.log("Query sent successfully");
    });
    
    res.status(200).send("Done");
  });


// returns an Object containing 'date' and 'time'
// of the form {date:"YYYY-MM-DD", time:"hh:mm:ss"}
function getDateTime() {
  let today = new Date();
  let paddedMonth   = (today.getMonth()+1).toLocaleString(undefined, {minimumIntegerDigits: 2});
  let paddedDay     = today.getDate().toLocaleString(undefined, {minimumIntegerDigits: 2});
  let paddedHours   = today.getHours().toLocaleString(undefined, {minimumIntegerDigits: 2});
  let paddedMinutes = today.getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2});
  let paddedSeconds = today.getSeconds().toLocaleString(undefined, {minimumIntegerDigits: 2});
  let date = today.getFullYear() + "-" + paddedMonth + "-" + paddedDay;
  let time = paddedHours + ":" + paddedMinutes + ":" + paddedSeconds;
  
  return {date:date, time:time};
}
