import React, {useContext} from 'react';
import { useSetState } from 'react-use';
import { AuthContext } from '../../context/Auth.context.js';
import "./Login.css";

const initialState = {
    email: '',
    password: ''
}


const LoginForm = () => {
    const { state: ContextState, login } = useContext(AuthContext);
    const { isLoginPending, isLoggedIn, loginError } = ContextState;
    const [state, setState] = useSetState(initialState);

    
    const onSubmit = (e) => {
        e.preventDefault();
        const { email, password } = state;
        login(email, password);
        setState({
            email: '',
            password: ''
        });
    }

        
    return (
        <form name="loginForm" onSubmit={onSubmit}>

            <div>Please sign in</div>

            <div className="form">
                <div><label htmlFor="username">Username</label></div>
                <input 
                    type="text" 
                    name="username" 
                    onChange={e => setState({email: e.target.value})} 
                    value={state.email} 
                    placeholder="admin" 
                />
                <div><label htmlFor="password">Password</label></div>
                <input 
                    type="password" 
                    name="password" 
                    onChange={e => setState({password: e.target.value})} 
                    value={state.password} 
                />
                <div><input className="primary" type="submit" value="Login" /></div>                
            </div>

        { isLoginPending && <div>Please wait...</div> }
        { isLoggedIn && <div>Success.</div> }
        { loginError && <div>{loginError.message}</div> }
        </form>
    )
}


export default LoginForm;
