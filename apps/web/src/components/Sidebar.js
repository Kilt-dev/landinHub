import React, {useEffect, useState} from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/doashboard-sidebar.css'

const Sidebar = ({ role }) => {
    const [isCompact, setIsCompact] = useState(false);
    const location = useLocation();
    useEffect(() => {
        const saved = localStorage.getItem("sidebarCompact");
        if (saved === "true") {
            setIsCompact(true);
        }
    }, []);

    useEffect(() => {
        if (location.pathname === "/pages") {
            setIsCompact(true);
            localStorage.setItem("sidebarCompact", "true");
        } else {
            setIsCompact(false);
            localStorage.setItem("sidebarCompact", "false");
        }
    }, [location.pathname]);
    const userMenu = [
        { name: 'Tổng quan Hệ thống', path: '/dashboard', icon: (
                <svg className="sidebar-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )},
        { name: 'Landing Page', path: '/pages', icon: (
                <svg className="sidebar-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            )},
        { name: 'Kho template', path: '/templates', icon: (
                <svg className="sidebar-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )},
        { name: 'Form Data', path: '/setting-form', icon: (
                <svg className="sidebar-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )},
        { name: 'Market landing', path: '/market', icon: (
                <svg className="sidebar-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )},
        { name: 'Thanh toán', path: '/payments', icon: (
                <svg className="sidebar-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            )}
    ];

    const adminMenu = [
        { name: 'Tổng quan Hệ thống', path: '/dashboard', icon: (
                <svg className="sidebar-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )},
        { name: 'Quản lý Tài khoản', path: '/users', icon: (
                <svg className="sidebar-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            )},
        { name: 'Kiểm tra Thanh toán', path: '/payments', icon: (
                <svg className="sidebar-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            )},
        { name: 'Template Inconic', path: '/qltemplates', icon: (
                <svg className="sidebar-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            )},
        { name: 'Báo cáo Hệ thống', path: '/reports', icon: (
                <svg className="sidebar-svg-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )},
    ];

    const menu = role === 'admin' ? adminMenu : userMenu;

    return (
        <aside className={`sidebar ${isCompact ? 'compact' : ''}`}>
            {/* Background pattern */}
            <div className="sidebar-bg-pattern"></div>

            {/* Header */}
            <div className="sidebar-header">
                {!isCompact && (
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">
                            <svg fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                            </svg>
                        </div>
                        <span className="sidebar-brand-text">Dashboard</span>
                    </div>
                )}
                <button className="sidebar-toggle" onClick={() => setIsCompact(!isCompact)}>
                    <svg className={`sidebar-toggle-icon ${isCompact ? 'rotated' : ''}`}
                         fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>

            {/* Menu Items */}
            <nav className="sidebar-nav">
                {menu.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.name}
                            to={item.path}
                            className={`sidebar-item ${isActive ? 'active' : ''} ${isCompact ? 'compact' : ''}`}
                            title={isCompact ? item.name : ''}
                            onClick={() => {
                                if (item.path === "/pages") {
                                    setIsCompact(true);
                                    localStorage.setItem("sidebarCompact", "true");

                                }
                            }}
                        >
                            {isActive && <div className="sidebar-item-indicator"></div>}

                            <div className="sidebar-icon">
                                {item.icon}
                            </div>

                            {!isCompact && (
                                <span className="sidebar-text">{item.name}</span>
                            )}

                            <div className="sidebar-item-glow"></div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            {!isCompact && (
                <div className="sidebar-footer">
                    <div className="sidebar-status">
                        <div className="sidebar-status-icon">
                            <div className="sidebar-status-dot"></div>
                        </div>
                        <span className="sidebar-status-text">System Online</span>
                    </div>
                </div>
            )}
        </aside>
    );
};

export default React.memo(Sidebar);