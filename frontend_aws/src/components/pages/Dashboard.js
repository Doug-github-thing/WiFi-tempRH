import React, { useContext } from 'react';
import { useEffect, useState } from 'react';
import { AuthContext } from '../../context/Auth.context.js';
import API from "../../api/API.js";


const Dashboard = ({ selectedSensor }) => {
    const { state, logout } = useContext(AuthContext);
    const [data, setData] = useState(null);
    

    // Fetch the new data when new sensor is selected
    useEffect(() => {
        if (selectedSensor?.sensor_id != null)
            API.getData(0,selectedSensor.sensor_id).then(json => setData(json));
    }, [selectedSensor]);


    return (<>

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


    </>);
}

export default Dashboard;
