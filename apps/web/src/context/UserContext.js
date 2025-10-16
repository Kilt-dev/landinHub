import React, { createContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';  // ← Thêm useLocation
import { jwtDecode } from 'jwt-decode';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();  // ← Thêm dòng này

    useEffect(() => {
        const token = localStorage.getItem('token');
        console.log('UserProvider token:', token); // Debug

        if (token) {
            try {
                const decoded = jwtDecode(token);
                console.log('UserProvider decoded:', decoded); // Debug

                if (decoded.userId && decoded.exp * 1000 > Date.now()) {
                    setUser({ userId: decoded.userId, role: decoded.role, subscription: decoded.subscription });
                } else {
                    console.error('Invalid or expired token');
                    localStorage.removeItem('token');
                    // ← Thay đổi: Chỉ redirect nếu KHÔNG phải public route
                    if (!location.pathname.startsWith('/public')) {
                        navigate('/auth');
                    }
                }
            } catch (err) {
                console.error('UserProvider token error:', err);
                localStorage.removeItem('token');
                // ← Thay đổi: Chỉ redirect nếu KHÔNG phải public route
                if (!location.pathname.startsWith('/public')) {
                    navigate('/auth');
                }
            }
        } else {
            console.log('No token found');
            // ← Thay đổi: Chỉ redirect nếu KHÔNG phải public route
            if (!location.pathname.startsWith('/public')) {
                navigate('/auth');
            }
        }
    }, [navigate, location.pathname]);  // ← Thêm location.pathname vào deps

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    );
};