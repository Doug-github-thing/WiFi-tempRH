import React from 'react';
import { useSetState } from 'react-use';

export const AuthContext = React.createContext(null);

const initialState = {
    isLoggedIn: false,
    isLoginPending: false,
    loginError: null,
    username: null
}

export const ContextProvider = props => {
    const [state, setState] = useSetState(initialState);

    const setLoginPending = (isLoginPending) => setState({isLoginPending});
    const setLoginSuccess = (isLoggedIn) => setState({isLoggedIn});
    const setLoginError = (loginError) => setState({loginError});
    const setUsername = (username) => setState({username});

    const login = (email, password) => {
        setLoginPending(true);
        setLoginSuccess(false);
        setLoginError(null);

        fetchLogin( email, password, error => {
        setLoginPending(false);

        if (!error) {
            setUsername(email);
            setLoginSuccess(true);
        } else {
            setLoginError(error);
        }
        })
    }

    const logout = () => {
        setLoginPending(false);
        setLoginSuccess(false);
        setLoginError(null);
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
        if (email === 'egg' && password === 'Carina') {
            return callback(null);
        } 
        if (email === 'bwee' && password === 'Carina') {
            return callback(null);
        } 
        else {
            return callback(new Error('Invalid email and password'));
        }
    }, 1000);
