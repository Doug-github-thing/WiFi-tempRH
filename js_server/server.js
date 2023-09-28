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
    let dateTime = date + ' ' + time;

    const data = req.body;

    console.log(dateTime + ":");
    console.log(data);
    // console.log(data.temp);
    // console.log(data.humidity);
    res.status(200).send("mubtime");
  });

// app.put('/data/:param1', (req, res) => {
//     console.log(req.params);
//     res.status(420).send("Eggy bow");
//   });
