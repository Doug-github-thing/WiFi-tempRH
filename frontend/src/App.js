import snowflake from './snowflaketime.svg';
import React, { useState, useEffect } from 'react';
import './App.css';
import API from './api/API.js';

function App() {

  const [data, setData] = useState(null);

  // Reset displayed data on screen on load
  useEffect(() => {
    // Gets data from a backend request, then sets 'data' to the result
    API.getCurrent().then(json => setData(json));
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={snowflake} className="App-logo" alt="SMOW" />
        
        {/* If no data, display "Loading". If there is data, display it! */}
        {!data ? 'Loading...' :
          <div className="dataWrapper">
            <p>Temp: {data.temp}&deg;F</p>
            <p>RH: {data.rh}%</p>
          </div>
        }

      </header>
    </div>
  );

}

export default App;