import React from 'react';
import { useSetState } from 'react-use';
import API from "../api/API.js";

/**
 * AuthContext tracks login details for the client's current state.
 * Tracks client login details:
 *   isLoggedIn
 *   isLoginPending
 *   loginError
 *   sessionToken
 * Tracks currently logged in user data:
 *   username
 *   useremail
 *   usernode
 *   sensorList 
 */
export const AuthContext = React.createContext(null);


const initialState = {
    isLoggedIn: false,
    isLoginPending: false,
    loginError: null,
    sessionToken: null,
    username: null,
    useremail: null,
    userNode: null,
    sensorList: null
}

export const ContextProvider = props => {
    const [state, setState] = useSetState(initialState);

    const setLoginPending = (isLoginPending) => setState({isLoginPending});
    const setLoginSuccess = (isLoggedIn) => setState({isLoggedIn});
    const setLoginError = (loginError) => setState({loginError});
    const setUserName = (username) => setState({username});
    const setUserEmail = (useremail) => setState({useremail});
    const setUserNode = (userNode) => setState({userNode});
    const setSessionToken = (sessionToken) => setState({sessionToken});
    const setSensorList = (sensorList) => setState({sensorList});

    /**
     * Sends the provided Google ID Token to the backend to complete the login handshake
     * @param {String} googleIdToken 
     */
    const loginWithGoogleIdToken = async (googleIdToken) => {
        setLoginPending(true);
        setLoginSuccess(false);
        setLoginError(null);
        setUserEmail(null);
        setUserName(null);
        setSessionToken(null);
        setSensorList(null);

        try {
            const body_data = await API.sendGoogleIDToBackend(googleIdToken);
            // Default the node of people without designated nodes to node 1
            let my_node = 1;
            try {
                // Take just the first node from the comma delimited list
                my_node = parseInt(body_data.valid_nodes.split(",")[0]);
            } catch (error) {
            }
            
            setLoginPending(false);
            setUserName(body_data.name);
            setUserEmail(body_data.email);
            setSessionToken(body_data.session_token);
            setUserNode(my_node);
            setLoginSuccess(true);
            API.getSensors(my_node).then(json => setSensorList(json));
        } catch (error) {
            console.log("Error in Auth.context.js::loginWithGoogleIdToken():",error);
            setLoginError(error);
        }
    }

    const logout = () => {
        setLoginPending(false);
        setLoginSuccess(false);
        setLoginError(null);
        setUserName(null);
        setUserEmail(null);
        setSessionToken(null);
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
