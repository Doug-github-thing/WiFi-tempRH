const express = require('express');

const app = express();
const port = 3000;

app.use(express.json());

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

// listen for incoming POST requests from Board
app.post('/data', (req, res) => {
    let today = new Date();
    let date = (today.getMonth()+1) + "/" + today.getDate() + "/" + today.getFullYear();
    let paddedMinutes = today.getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2});
    let paddedSeconds = today.getSeconds().toLocaleString(undefined, {minimumIntegerDigits: 2});
    let time = today.getHours() + ":" + paddedMinutes + ":" + paddedSeconds;
    let timestamp = date + ' ' + time;

    const data = req.body;

    console.log(`INSERT INTO temprh (date, time, temp, rh) VALUES (${date}, ${time}, ${data.temp}, ${data.rh})`);
    res.status(200).send("Done");
  });

// app.put('/data/:param1', (req, res) => {
//     console.log(req.params);
//     res.status(420).send("Eggy bow");
//   });
