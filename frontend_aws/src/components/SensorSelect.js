import React, { useEffect, useState } from 'react';
import API from "../api/API.js";
import "./SensorSelect.css";

const SensorSelect = ({ select, setDashboardActive }) => {
    const [dropdownClicked, setDropdownClicked] = useState(false);
    const [sensorList, setSensorList] = useState(null);

    
    // Fetch sensor names from database on mount
    useEffect(() => {
        API.getSensors(0).then(json => setSensorList(json));
    }, []);


    const toggleClicked = (e) => {
        setDropdownClicked(dropdownClicked ? false : true);
    };

    
    // When a sensor is selected from the dropdown menu
    const sensorClicked = (sensor) => {
        setDropdownClicked(dropdownClicked ? false : true);
        setDashboardActive(false);
        select(sensor);
    };


    return (<>
        <div onClick={toggleClicked}>
            Sensor select
        </div>

        {/* dropdown list */}
        <div id="dropdown">
            {dropdownClicked && <>
                {sensorList?.map((sensor) => (
                    <li className="dropdown-item" 
                        key={sensor.sensor_id} 
                        onClick={()=>sensorClicked(sensor)}>
                            {sensor.name}
                    </li>
                ))}
            </>}
        </div> {/* end dropdown list */}
    </>);
}

export default SensorSelect;
