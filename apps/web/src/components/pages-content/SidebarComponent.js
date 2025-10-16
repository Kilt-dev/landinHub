import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const SidebarComponent = ({ activeItem }) => {
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUserRole(decoded.role || 'user');
            } catch (err) {
                console.error('Error decoding token:', err);
            }
        }
    }, []);

    const sidebarItems = [
        { icon: '', label: 'Pages', path: '/pages' },
        { icon: '', label: 'Thư viện mẫu', path: '/templates' },
        { icon: '', label: 'Tên miền', path: '/domains' },
        ...(userRole === 'admin' ? [{ icon: '', label: 'Thêm Template', path: '/admin/add-template' }] : []),
    ];

    return (
        <div className="sidebar1">
            <div className="sidebar-header">
                <h3>Landing Pages</h3>
            </div>
            <nav className="sidebar-nav">
                {sidebarItems.map((item, index) => (
                    <Link
                        key={index}
                        to={item.path}
                        className={`nav-item ${item.label === activeItem ? 'active' : ''}`}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
};

export default SidebarComponent;