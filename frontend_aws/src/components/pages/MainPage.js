import React, { useContext } from 'react';
import { useEffect, useState } from 'react';
import { AuthContext } from '../../context/Auth.context.js';
import API from "../../api/API.js";
import "./MainPage.css";


const MainPage = ({ isDashboard, selectedSensor }) => {
    const { state, logout } = useContext(AuthContext);
    const [data, setData] = useState(null);
    const [currentList, setCurrentList] = useState([]);
    

    // Fetch the new data when new sensor is selected
    useEffect(() => {
        if (selectedSensor?.sensor_id != null)
            API.getData(0,selectedSensor.sensor_id).then(json => setData(json));
    }, [selectedSensor]);
    
    
    // Whenever the dashboard is reloaded, hit the backend again the get current values
    useEffect(() => {
        setCurrentList(API.getCurrent(0).then(json =>setCurrentList(json)));
    }, [isDashboard]);
    
    
    // Also do it on load
    useEffect(() => {
        setCurrentList(API.getCurrent(0).then(json => setCurrentList(json)));
    }, [state.sensorList]);
    
    
    const getDashboard = () => {
        return <>
            <div>{state.sensorList?.map((sensor) => (
                <li className="sensorCard" key={sensor.sensor_id}>
                    <div>{sensor.name}</div>
                    {
                        currentList[sensor.sensor_id-1] !== null 
                            ?
                        <div>{currentList[sensor.sensor_id-1]?.temp}°F {currentList[sensor.sensor_id-1]?.rh}%RH</div>
                            :
                        <div>Loading current data...</div>
                    }
                </li>
            ))}</div>
        </>
    };


    const getSensorView = () => {
        return <>
            {/* If there's not currently selected sensor, do not attempt to load one: */}
            {!selectedSensor ? "Select a sensor to view data..." :
        
            // If no current data, don't display. If there is current data, display it!
            !data ? "Connecting..." :
                <div className="dataWrapper">
                    {data.map((data) => (
                        <li className="ListItem" key={data.timestamp}>
                            <div>{data.temp}°F {data.rh}%RH</div>
                        </li>
                    ))}
                </div>
            }
        </>;
    };


    return (<div className="mainPage">
        {isDashboard ?
            getDashboard()
                :
            getSensorView()
        }
    </div>);
}

export default MainPage;
