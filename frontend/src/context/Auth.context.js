import React from 'react';
import { useSetState } from 'react-use';
import API from "../api/API.js";

/**
 * AuthContext tracks login details for the client's current state.
 * Tracks client login details:
 *   isLoggedIn
 *   isLoginPending
 *   loginError
 * Tracks currently logged in user data:
 *   username
 *   useremail
 *   userid 
 *   sensorList 
 */
export const AuthContext = React.createContext(null);


const initialState = {
    isLoggedIn: false,
    isLoginPending: false,
    loginError: null,
    username: null,
    useremail: null,
    userid: null,
    sensorList: null
}

export const ContextProvider = props => {
    const [state, setState] = useSetState(initialState);

    const setLoginPending = (isLoginPending) => setState({isLoginPending});
    const setLoginSuccess = (isLoggedIn) => setState({isLoggedIn});
    const setLoginError = (loginError) => setState({loginError});
    const setUserName = (username) => setState({username});
    const setUserEmail = (useremail) => setState({useremail});
    const setUserID = (userid) => setState({userid});
    const setSensorList = (sensorList) => setState({sensorList});

    /**
     * Sends the provided Google ID Token to the backend to complete the login handshake
     * @param {String} googleIdToken 
     */
    const loginWithGoogleIdToken = async (googleIdToken) => {
        setLoginPending(true);
        setLoginSuccess(false);
        setLoginError(null);
        setSensorList(null);

        try {
            const raw_payload = await API.sendGoogleIDToBackend(googleIdToken);
            const payload = raw_payload.payload;
            setLoginPending(false);
            setUserName(payload.given_name);
            setUserEmail(payload.email);
            setUserID(payload.sub);
            setLoginSuccess(true);
            API.getSensors(0).then(json => setSensorList(json));
        } catch (error) {
            setLoginError(error);
        }
    }

    const logout = () => {
        setLoginPending(false);
        setLoginSuccess(false);
        setLoginError(null);
        setUserName(null);
        setUserEmail(null);
        setUserID(null);
        setSensorList(null);
    }

    return (
        <AuthContext.Provider
        value={{
            state,
            loginWithGoogleIdToken,
            logout,
        }}
        >
            {props.children}
        </AuthContext.Provider>
    );
};
