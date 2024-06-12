import React, { useContext } from 'react';

import { AuthContext } from '../../context/Auth.context.js';

const Dashboard = () => {
    const { state, logout } = useContext(AuthContext);
    
    return (<>

        <h1>
            Henmo muff!
        </h1>

    </>);
}

export default Dashboard;
