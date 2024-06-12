import React from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import Login from './components/pages/Login.js';
import App from './App.js';

const Router = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Login />} path='/' />
                <Route element={<Login />} path='/login' />
                <Route element={<App />} path='/bread' />
            </Routes>
        </BrowserRouter>
        );
};

export default Router; 
