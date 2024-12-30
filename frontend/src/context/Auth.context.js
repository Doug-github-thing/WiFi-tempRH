import React from 'react';
import { useSetState } from 'react-use';
import API from "../api/API.js";

export const AuthContext = React.createContext(null);

const initialState = {
    isLoggedIn: false,
    isLoginPending: false,
    loginError: null,
    username: null,
    sensorList: null
}

export const ContextProvider = props => {
    const [state, setState] = useSetState(initialState);

    const setLoginPending = (isLoginPending) => setState({isLoginPending});
    const setLoginSuccess = (isLoggedIn) => setState({isLoggedIn});
    const setLoginError = (loginError) => setState({loginError});
    const setUsername = (username) => setState({username});
    const setSensorList = (sensorList) => setState({sensorList});

    const login = (email, password) => {
        setLoginPending(true);
        setLoginSuccess(false);
        setLoginError(null);
        setSensorList(null);

        fetchLogin( email, password, error => {
            setLoginPending(false);

            if (!error) {
                setUsername(email);
                setLoginSuccess(true);
                API.getSensors(0).then(json => setSensorList(json));
            } else {
                setLoginError(error);
            }
        })
    }

    const logout = () => {
        setLoginPending(false);
        setLoginSuccess(false);
        setLoginError(null);
        setSensorList(null);
    }

    return (
        <AuthContext.Provider
        value={{
            state,
            login,
            logout,
        }}
        >
            {props.children}
        </AuthContext.Provider>
    );
};

// fake login
const fetchLogin = (email, password, callback) => 
    setTimeout(() => {
        if (email === 'egg' && password === '') {
            return callback(null);
        } 
        if (email === 'bwee' && password === '') {
            return callback(null);
        } 
        else {
            return callback(new Error('Invalid email and password'));
        }
    }, 1000);
