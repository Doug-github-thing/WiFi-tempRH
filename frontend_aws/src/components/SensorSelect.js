import React, { useEffect, useState } from 'react';
import API from "../api/API.js";
import "./SensorSelect.css";

const SensorSelect = ({ onClick }) => {
    const [dropdownClicked, setDropdownClicked] = useState(false);
    const [sensorList, setSensorList] = useState(null);
    
    // Fetch the new data on mount
    useEffect(() => {
        API.getSensors(0).then(json => setSensorList(json));
    }, []);

    const clicked = (e) => {
        setDropdownClicked(dropdownClicked ? false : true);
    };

    return (<>
        <div onClick={clicked}>
            Sensor select
        </div>

        {/* dropdown list */}
        <div id="dropdown">
            {dropdownClicked && <>
                {sensorList.map((sensor) => (
                    <li className="dropdown-item" key={sensor.sensor_id}>
                        {sensor.name}
                    </li>
                ))}
            </>}
        </div> {/* end dropdown list */}
    </>);
}

export default SensorSelect;
