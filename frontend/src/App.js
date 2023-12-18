import React from 'react';
import './App.css';
import snowflake from './snowflaketime.svg'; // Snowflake icon

// For Current temp/rh reading
import { CurrentReadout } from './components/CurrentReadout.js';
// For historical data visualization
import { HistoricalDataPlot } from './components/HistoricalDataPlot.js';

const App = () => {

  // Define overall app skeleton
  return (
    <div className="App">
      <header className="App-header">
        
        <CurrentReadout />
        
        <img src={snowflake} className="App-logo" alt="SMOW" />
        
        <HistoricalDataPlot title={"Past 24 hours:"}></HistoricalDataPlot>

      </header>
    </div>
  );
}

export default App;
