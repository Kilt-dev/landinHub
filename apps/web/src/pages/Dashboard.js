import React, { Suspense, useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import { jwtDecode } from 'jwt-decode';
import '../styles/Dashboard.css';
import { useLocation } from 'react-router-dom';
import DogLoader from "../components/Loader";

const UserDashboard = React.lazy(() => import('../components/UserDashboard'));
const AdminDashboard = React.lazy(() => import('../components/AdminDashboard'));
const Dashboard = () => {
    const { user } = useContext(UserContext);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const location = useLocation();

    useEffect(() => {
        if (user?.role) {
            setUserRole(user.role);
        } else if (localStorage.getItem('token')) {
            try {
                const { jwtDecode } = require('jwt-decode');
                const decodedToken = jwtDecode(localStorage.getItem('token'));
                setUserRole(decodedToken.role);
            } catch (err) {
                console.error('Error decoding token:', err);
            }
        }
        setLoading(false);
    }, [user]);

    const renderDashboard = () => {
        if (loading) return <DogLoader />;

        switch (userRole) {
            case 'admin':
                return (
                    <Suspense>
                        <AdminDashboard />
                    </Suspense>
                );
            case 'user':
                return (
                    <Suspense >
                        <UserDashboard />
                    </Suspense>
                );
            default:
                return <div>Role không hợp lệ hoặc chưa đăng nhập</div>;
        }
    };

    const isCompact = location.pathname !== '/dashboard';

    return (
        <div className="dashboard-container">
            <Header role={userRole} />
            <div className="dashboard-main">
                <Sidebar role={userRole} isCompact={isCompact} />
                <div className="dashboard-content">{renderDashboard()}</div>
            </div>
        </div>
    );
};

export default React.memo(Dashboard);