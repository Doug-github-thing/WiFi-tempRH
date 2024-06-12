import React, {useContext} from "react";

import { AuthContext } from './context/Auth.context.js';
import Login from './components/pages/Login.js';
import Dashboard from './components/pages/Dashboard';

import "./index.css";

const App = () => {
      const { state, logout } = useContext(AuthContext);
      const onLogout = (e) => {
            e.preventDefault();
            logout();
      }

      const getPage = () => {
            if (!state.isLoggedIn)
                  return <Login />;
            else
                  return <Dashboard />;
      };

      const getLoginStatusText = () => {
            if (!state.isLoggedIn)
                  return <></>;
            else
                  return (<>
                        <div>Hello, {state.username}</div>
                        <a href="#" onClick={onLogout}>sign out</a>
                  </>);
      };

      return (<>
            <div className="App-header">
                  <div id="left"></div>
                  <div id="title">Dog Monitor App</div>
                  <div id="right">{getLoginStatusText()}</div>
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
