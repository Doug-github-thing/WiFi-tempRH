import React, { useContext, useState } from "react";
import { AuthContext } from '../context/Auth.context.js';
import SensorSelect from "./SensorSelect.js";

const HeaderBar = () => {
    const { state, logout } = useContext(AuthContext);
    const onLogout = (e) => {
        e.preventDefault();
        logout();
    }

    // const toggleClicked = (e) => {
    //     setDropdownClicked(dropdownClicked ? false: true);
    //     console.log(dropdownClicked);
    // }

    const getLoginStatusText = () => {
        if (state.isLoggedIn)
            return (<>
                <div>Hello, {state.username}</div>
                <a href="#" onClick={onLogout}>sign out</a>
            </>);
        else
            return <></>;
    };

    return (<>
        <div id="left"><SensorSelect onClick={null}/></div>
        <div id="title">Dog Monitor App</div>
        <div id="right">{getLoginStatusText()}</div>
    </>);
}

export default HeaderBar;
