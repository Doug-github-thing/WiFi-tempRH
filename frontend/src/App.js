import snowflake from './snowflaketime.svg';
import React, { useState, useEffect } from 'react';
import './App.css';
import API from './api/API.js';

function App() {

  const [current, setCurrent] = useState(null);
  const [data, setData] = useState(null);

  // Reset displayed data on screen on load
  useEffect(() => {
    // Gets data from a backend request, then sets 'data' to the result
    API.getCurrent().then(json => setCurrent(json));
    API.getHour().then(json => setData(json));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={snowflake} className="App-logo" alt="SMOW" />
        
        {/* If no current data, display "Loading". If there is current data, display it! */}
        {!current ? 'Loading...' :
          <div className="dataWrapper">
            <p>Temp: {current.temp}&deg;F</p>
            <p>RH: {current.rh}%</p>
          </div>
        }

        {!data ? 'Loading...' :
          <div className="dataWrapper">
            <p>Timestamps: {data.map(dataPoint => dataPoint.timestamp)}</p>
            <p>Temps: {data.map(dataPoint => dataPoint.temp)}</p>
            <p>Humidities: {data.map(dataPoint => dataPoint.rh)}</p>
          </div>
        }

      </header>
    </div>
  );

}

export default App;