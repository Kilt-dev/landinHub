// F:\landinghub-iconic\apps\web\src\context\UserContext.js
import React, { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // Đồng bộ user từ token nếu có
            const { jwtDecode } = require('jwt-decode');
            const decodedToken = jwtDecode(token);
            setUser({ userId: decodedToken.userId, role: decodedToken.role, subscription: decodedToken.subscription });
        }
    }, []);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};