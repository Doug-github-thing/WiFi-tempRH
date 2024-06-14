import React, { useContext, useState } from "react";
import { AuthContext } from '../context/Auth.context.js';
import SensorSelect from "./SensorSelect.js";

const HeaderBar = ({ select, selectedSensor }) => {
    const { state, logout } = useContext(AuthContext);


    const onLogout = (e) => {
        e.preventDefault();
        logout();
    };

    const getTitleText = () => {
        return !selectedSensor ? "Title" : selectedSensor?.name;
    };

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
        <div id="left">{state.isLoggedIn && <SensorSelect select={select}/>}</div>
        <div id="title">{getTitleText()}</div>
        <div id="right">{getLoginStatusText()}</div>
    </>);
}

export default HeaderBar;
