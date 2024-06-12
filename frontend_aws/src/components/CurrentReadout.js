import React, { useEffect, useState } from 'react';
import API from '../api/API';

// formats and displays the current temp and humidity values
export const CurrentReadout = () => {

    // Tracks a snapshot of the most recent temp/rh data point taken
    const [data, setData] = useState(null); // tracks most recent data

    // Fetch the new data on mount
    useEffect(() => {
        API.getCurrent().then(json => setData(json));
    }, []);

    return (
        <>
            {/* If no current data, don't display. If there is current data, display it! */}
            {!data ? "Connecting..." :
            <div className="dataWrapper">
                <p>Temp: {data.temp}&deg;F</p>
                <p>RH: {data.rh}%</p>
            </div>
            }
        </>
    );
};