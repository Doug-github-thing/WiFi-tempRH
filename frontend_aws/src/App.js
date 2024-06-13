import React, { useContext} from "react";
import { AuthContext } from './context/Auth.context.js';
import HeaderBar from "./components/HeaderBar.js";
import Login from './components/pages/Login.js';
import Dashboard from './components/pages/Dashboard';
import "./index.css";

const App = () => {
      
      const { state } = useContext(AuthContext);

      const getPage = () => {
            if (!state.isLoggedIn)
                  return <Login />;
            else
                  return <Dashboard />;
      };

      return (<>
            <div className="App-header">
                  <HeaderBar />
            </div>

            <div className="App-body">
                  {getPage()}
            </div>
      </>);
}

export default App;


// import React from 'react';
// import './App.css';
// // // For Current temp/rh reading
// // import { CurrentReadout } from './components/CurrentReadout.js';
// // // For historical data visualization
// // import { HistoricalDataPlot } from './components/HistoricalDataPlot.js';
// // import snowflake from './snowflaketime.svg'; // Snowflake icon

// const App = () => {
//       // Define overall app skeleton
//       return (
//             <div className="App">
//                   <header className="App-header">
//                         <CurrentReadout />
//                         <img src={snowflake} className="App-logo" alt="SMOW" />
//                         <HistoricalDataPlot title={"Past 24 hours:"}></HistoricalDataPlot>
//               </header>
//         </div>
//       );
// }

// export default App;
