import React, { useState, useEffect } from 'react';
import './App.css';
import snowflake from './snowflaketime.svg'; // Snowflake icon
import API from './api/API.js'; // Backend request routes

// For data visualization
import { HistoricalDataPlot } from './components/HistoricalDataPlot.js';

const App = () => {

  const [current, setCurrent] = useState(null); // tracks most recent data
  const [data, setData] = useState(null);       // tracks all data for selected sensor in specified range

  // Reset displayed data on screen on load
  useEffect(() => {
    // Gets data from a backend request, then sets 'data' to the result
    API.getCurrent().then(json => setCurrent(json));
    API.getData().then(json => setData(json));
  }, []);


  // Define overall app skeleton
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

        <HistoricalDataPlot title={"Past 24 hours"} data={data}></HistoricalDataPlot>

      </header>
    </div>
  );
}

export default App;
