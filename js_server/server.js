require('dotenv').config();
const express = require('express');
const pg = require('pg');
const app = express();
app.use(express.json());

// removed url to push to git, because I don't know how to
// properly separate passwords from source code safely in NodeJS yet
const conString = process.env.MY_ELEPHANTSQL_URL;
const client = new pg.Client(conString);

const port = 3000;

///////////////////////////////////////////////////////////////////////////////////

// start listening for any incoming traffic
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });


// Establish connection to ElephantSQL database
client.connect(function(err) {
    if(err) {
      return console.error('could not connect to postgres', err);
    }
    console.log("Connected to database!");
  });

// display index.html as landing page
app.get('/',function(req, res) {
    res.sendFile('index.html', { root: __dirname + '/web/'});
});

// listen for incoming POST requests from Board
app.post('/data', (req, res) => {
    
    // parses values from incoming data from Board, 
    // and current timestamp to send to the database
    dateTime = getDateTime();
    const data = req.body;

    // builds SQL query
    let my_query = "INSERT INTO temprh (date, time, temp, rh) VALUES ("
                    + `'${dateTime.date}',`
                    + `'${dateTime.time}',`
                    + `'${data.temp}',`
                    + `'${data.rh}')`;
    console.log("Attempting to run " + my_query);

    // passes SQL query to ElephantSQL connection
    client.query(my_query, function(err, result) {
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
