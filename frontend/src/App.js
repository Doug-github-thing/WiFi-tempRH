import React, { useContext, useState} from "react";
import { AuthContext } from './context/Auth.context.js';
import HeaderBar from "./components/HeaderBar.js";
import Login from './components/pages/Login.js';
import MainPage from './components/pages/MainPage';
import "./index.css";

const App = () => {
      
      const [selectedSensor, setSelectedSensor] = useState(null);
      const [dashboardActive, setDashboardActive] = useState(true);
      const { state } = useContext(AuthContext);

      const getPage = () => {
            if (!state.isLoggedIn)
                  return <Login />;
            else
                  return <MainPage selectedSensor={selectedSensor} isDashboard={dashboardActive}/>;
      };


      const toggleDashboardStatus = () => {
            setDashboardActive(true);
      };


      return (<>
            <div className="App-header">
                  <HeaderBar select={setSelectedSensor}
                        selectedSensor={selectedSensor}
                        dashboardActive={dashboardActive}
                        setDashboardActive={setDashboardActive}
                        />
            </div>
            <div className="App-sub-header">
                  <div className="title" onClick={toggleDashboardStatus}>view dashboard</div>
            </div>

            <div className="App-body">
                  {getPage()}
            </div>
      </>);
}

export default App;
