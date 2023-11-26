import React, { useState, useEffect } from 'react';
import './App.css';
import snowflake from './snowflaketime.svg'; // Snowflake icon
import API from './api/API.js'; // Backend request routes
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Legend } from 'recharts'; // Historical data visualization

function App() {

  const [current, setCurrent] = useState(null);
  const [data, setData] = useState(null);

  // Reset displayed data on screen on load
  useEffect(() => {
    // Gets data from a backend request, then sets 'data' to the result
    API.getCurrent().then(json => setCurrent(json));
    API.getHour().then(json => setData(json));
  }, []);

  // Returns an array of the form [lower, upper] (ie [32, 80] for graph range)
  // for the specified key, either "temp" or "rh"
  function getYAxisRange (key) {
    if (!data)
      return [0,0];

    let dataMap;
    // Isolates temp data
    if (key === "temp")
      dataMap = data.map(dataPoint => Number(dataPoint.temp));
    else if (key === "rh")
      dataMap = data.map(dataPoint => Number(dataPoint.rh));

    // Looks for the lowest and highest values in the data map
    let min = Infinity, max = -Infinity;
    let value = 0;
    for (value of dataMap) {
      if (value<min) min = Number(value);
      if (max<value) max = Number(value);
    }
    
    // Round the boundaries and return
    return [Math.floor(min) - 3, Math.ceil(max) + 3];
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={snowflake} className="App-logo" alt="SMOW" />
        
        {/* If no current data, display "Loading". If there is current data, display it! */}
        {!current ? "Loading..." :
          <div className="dataWrapper">
            <p>Temp: {current.temp}&deg;F</p>
            <p>RH: {current.rh}%</p>
          </div>
        }

        {!data ? "Loading" :
          <>
            <div style={{color: "#BADBED"}}>Past hour data:</div>
            <LineChart width={800} height={400} data={data}>
              <Line yAxisId="left" dataKey="temp" stroke="#61dafb" dot={false} />
              <YAxis yAxisId="left" stroke="#61dafb" domain={getYAxisRange("temp")} /> 
              <Line yAxisId="right" stroke="#BADBED" type="monotone" dataKey="rh" dot={false} />
              <YAxis yAxisId="right" stroke="#BADBED" domain={getYAxisRange("rh")} orientation={"right"} /> 
              <XAxis dataKey="timestamp" stroke="#BADBED" />
              <Legend />
            </LineChart>
          </>
        }

      </header>
    </div>
  );

}

export default App;