import React, { useState, useEffect } from 'react';
import './App.css';
import snowflake from './snowflaketime.svg'; // Snowflake icon
import API from './api/API.js'; // Backend request routes
import { LineChart, ResponsiveContainer, Line, XAxis, YAxis, Legend, Tooltip } from 'recharts'; // Historical data visualization

// For displaying the mouse-over interactivity label on the historical data plot
import { CustomTooltip } from './components/CustomTooltip.js';

function App() {

  const [current, setCurrent] = useState(null); // tracks most recent data
  const [data, setData] = useState(null);       // tracks all data for selected sensor in specified range


  // Reset displayed data on screen on load
  useEffect(() => {
    // Gets data from a backend request, then sets 'data' to the result
    API.getCurrent().then(json => setCurrent(json));
    API.getData().then(json => setData(json));
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
        
        {/* If no current data, display "Loading". If there is current data, display it! */}
        {!current ? "Connecting..." :
          <div className="dataWrapper">
            <p>Temp: {current.temp}&deg;F</p>
            <p>RH: {current.rh}%</p>
          </div>
        }

        <img src={snowflake} className="App-logo" alt="SMOW" />

        {!data ? "" :
          <>
            <div style={{color: "#BADBED"}}>Past 24 hours:</div>
            <ResponsiveContainer width="100%" aspect={2}>
              <LineChart data={data}
                margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>      
                <Line yAxisId="left" dataKey="temp" stroke="#61dafb" dot={false} />
                <YAxis yAxisId="left" stroke="#61dafb" domain={getYAxisRange("temp")} /> 
                <Line yAxisId="right" stroke="#BADBED" type="monotone" dataKey="rh" dot={false} />
                <YAxis yAxisId="right" stroke="#BADBED" domain={getYAxisRange("rh")} orientation={"right"} /> 
                <XAxis dataKey="timestamp" stroke="#BADBED" angle={-30} textAnchor="end" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "transparent" }} />
                <Legend layout="horizontal" verticalAlign="top" align="center"  />
              </LineChart>
            </ResponsiveContainer>
          </>
        }

      </header>
    </div>
  );

}

export default App;
