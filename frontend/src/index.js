import React from "react";
import ReactDOM from 'react-dom/client';
import App from './App';
import "./index.css";
import { ContextProvider } from './context/Auth.context.js';


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ContextProvider value={500}>              
        <App />
    </ContextProvider>
);
