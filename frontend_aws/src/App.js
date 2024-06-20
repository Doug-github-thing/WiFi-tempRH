import React, { useContext, useState} from "react";
import { AuthContext } from './context/Auth.context.js';
import HeaderBar from "./components/HeaderBar.js";
import Login from './components/pages/Login.js';
import Dashboard from './components/pages/Dashboard';
import "./index.css";

const App = () => {
      
      const [selectedSensor, setSelectedSensor] = useState(null);
      const { state } = useContext(AuthContext);

      const getPage = () => {
            if (!state.isLoggedIn)
                  return <Login />;
            else
                  return <Dashboard selectedSensor={selectedSensor}/>;
      };

      return (<>
            <div className="App-header">
                  <HeaderBar select={setSelectedSensor}
                        selectedSensor={selectedSensor}/>
            </div>

            <div className="App-body">
                  {getPage()}
            </div>
      </>);
}

export default App;
