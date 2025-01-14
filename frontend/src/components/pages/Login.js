import React, {useContext} from 'react';
import { useSetState } from 'react-use';
import { AuthContext } from '../../context/Auth.context.js';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import "./Login.css";


const LoginForm = () => {
    
    const { state: ContextState, loginWithGoogleIdToken } = useContext(AuthContext);
    const { isLoginPending, isLoggedIn, loginError } = ContextState;


    // Sign in with Google is successful on the frontend
    const handleSuccess = async (credentialResponse) => {
        const googleIdToken = credentialResponse.credential;
        await loginWithGoogleIdToken(googleIdToken); // Call login function from AuthContext
    };
    
    
    const handleError = () => {
        // Handle login errors here
        console.log("Google login failed");
    };
    
    
    return (
        <GoogleOAuthProvider clientId={ process.env.REACT_APP_OAUTH_CLIENT_ID }>
            <div className='login-with-google-button'>
                <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
            </div>
        </GoogleOAuthProvider>
    );
}


export default LoginForm;
