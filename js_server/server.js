const express = require('express');
const pg = require('pg');

const app = express();
const port = 3000;

// removed url to push to git, because I don't know how to push passwords safely in NodeJS yet
const conString = "MY_ELEPHANTSQL_URL";
const client = new pg.Client(conString);

///////////////////////////////////////////////////////////////////////////////////

app.use(express.json());

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

// listen for incoming POST requests from Board
app.post('/data', (req, res) => {
    let today = new Date();
    let paddedMonth   = (today.getMonth()+1).toLocaleString(undefined, {minimumIntegerDigits: 2});
    let paddedDay     = today.getDate().toLocaleString(undefined, {minimumIntegerDigits: 2});
    let paddedHours   = today.getHours().toLocaleString(undefined, {minimumIntegerDigits: 2});
    let paddedMinutes = today.getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2});
    let paddedSeconds = today.getSeconds().toLocaleString(undefined, {minimumIntegerDigits: 2});
    let date = today.getFullYear() + "-" + paddedMonth + "-" + paddedDay;
    let time = paddedHours + ":" + paddedMinutes + ":" + paddedSeconds;

    const data = req.body;


    let my_query = `INSERT INTO temprh (date, time, temp, rh) VALUES ('${date}', '${time}', '${data.temp}', '${data.rh}')`;
    console.log("Attempting to run " + my_query);
    
    client.connect(function(err) {
      if(err) {
        return console.error('could not connect to postgres', err);
      }
      client.query(my_query, function(err, result) {
        if(err) {
          return console.error('error running query', err);
        }
        console.log("sent!");
        client.end();
      });
    });
    
    res.status(200).send("Done");
  });