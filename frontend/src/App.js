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
  const [inListView, setInListView] = useState(false); // tracks if graph is in list view


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


  const toggleListView = () => {
    inListView ? setInListView(false) : setInListView(true);
  }

  // Converts a unix timestamp to a human readable M/D/Y HH:MM
  const convertUnixTimestampFull = (unix_timestamp) => {
    const date = new Date(unix_timestamp * 1000);
    const day = date.getDay();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${month}/${day}/${year} ${hours}:${minutes}`;
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

        {!data ? "" : // If there's data, render it!
          <>
            <div>
              <div style={{float:"left"}}>Past 24 hours:      </div>
              <button onClick={toggleListView}>{inListView ? "Show Graph" : "Show List"}</button>
            </div>

            {!inListView ?
              // If we're not in list view
              <ResponsiveContainer className={"GraphView"} width="100%" aspect={ 2 }>
                <LineChart data={ data }
                  margin={{ top: 10, right: 10, left: 10, bottom: 50 }}>      
                  <Line yAxisId="left" dataKey="temp" stroke="#61dafb" dot={ false } />
                  <YAxis yAxisId="left" stroke="#61dafb" domain={ getYAxisRange("temp") } /> 
                  <Line yAxisId="right" stroke="#BADBED" type="monotone" dataKey="rh" dot={ false } />
                  <YAxis yAxisId="right" stroke="#BADBED" domain={ getYAxisRange("rh") } orientation={ "right" } /> 
                  <XAxis dataKey="timestamp" stroke="#BADBED" angle={ -30 } textAnchor="end" />
                  <Tooltip content={ <CustomTooltip /> } cursor={{ fill: "transparent" }} />
                  <Legend layout="horizontal" verticalAlign="top" align="center" />
                </LineChart>
              </ResponsiveContainer>
              :
              // If we're in list view
              <ul className='ListView'>
                {data.map((data) => (
                  <li className='ListItem' key={data.timestamp}>
                    <div>{convertUnixTimestampFull(data.unix_timestamp)}:</div>
                    <div>{data.temp}°F {data.rh}%RH</div>
                  </li>
                  )
                  )}
              </ul>
            }


          </>
        }

      </header>
    </div>
  );
}


export default App;
