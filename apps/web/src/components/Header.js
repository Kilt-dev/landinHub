import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import UserProfile from './UserProfile';
import api from '@landinghub/api';
import logo from '../assets/logo.png'
import '../styles/header.css'
const Header = () => {
    const [userData, setUserData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/api/user/info');
                setUserData(res.data);
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Không thể tải dữ liệu người dùng.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.href = '/auth';
    };

    const displayName = userData.name || (localStorage.getItem('token') ? `User ${jwtDecode(localStorage.getItem('token')).userId}` : 'Khách');

    const [showProfile, setShowProfile] = useState(false);

    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div className="header-container">

            <nav className="navbar">
                <div className="navbar-container">
                    <img
                        src={logo}
                        alt="Logo"
                        className="logo-image"
                    />
                    <div className="user-info">
                        {localStorage.getItem('token') ? (
                            <>
                                <span>Chào, {displayName}</span>
                                <div
                                    className="user-avatar cursor-pointer flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200"
                                    onClick={() => setShowProfile(!showProfile)}
                                    style={{ width: "34px", height: "34px" }}
                                >
                                    {userData.avatar ? (
                                        <img
                                            src={userData.avatar}
                                            alt="User Avatar"
                                            className="w-full h-full rounded-full object-cover"
                                        />
                                    ) : (
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="w-5 h-5 text-gray-600"
                                        >
                                            <circle cx="12" cy="8" r="4" />
                                            <path d="M4 20c0-3.5 4-5.5 8-5.5s8 2 8 5.5" />
                                        </svg>
                                    )}
                                </div>
                                <button onClick={handleLogout}>Đăng xuất</button>
                                {showProfile && (
                                    <div className="profile-popup">
                                        <UserProfile />
                                        <button onClick={() => setShowProfile(false)}>Đóng</button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <button onClick={() => navigate('/auth')}>Đăng nhập</button>
                        )}
                    </div>
                </div>


            </nav>

        </div>
    )

};

export default React.memo(Header);