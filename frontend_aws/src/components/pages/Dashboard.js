import React, { useContext } from 'react';
import { useEffect, useState } from 'react';
import API from "../../api/API.js";

import { AuthContext } from '../../context/Auth.context.js';

const Dashboard = () => {
    const { state, logout } = useContext(AuthContext);
    const [data, setData] = useState(null);
    

    // Fetch the new data on mount
    useEffect(() => {
        API.getData(0,4).then(json => setData(json));
    }, []);
    

    return (<>

        {/* If no current data, don't display. If there is current data, display it! */}
        {!data ? "Connecting..." :
            <div className="dataWrapper">
                {data.map((data) => (
                  <li className="ListItem" key={data.timestamp}>
                    <div>{data.temp}°F {data.rh}%RH</div>
                  </li>
                  )
                  )}
            </div>
        }

    </>);
}

export default Dashboard;
