import React from 'react';
import '../styles/Background.css';
import logo from '../assets/logo.png'
import { Link } from "react-router-dom";

const Background = ({ children, fullWidth = false }) => {
    return (
        <div className="background-container">
            {/* Clean 3D shapes matching the reference image */}
            <div className="background-shapes">
                {/* Yellow circle - top left (like in image) */}
                <div className="shape-yellow-circle"></div>

                {/* Large blue shape - left side with curved organic form */}
                <div className="shape-blue-large"></div>

                {/* Purple overlay layer inside blue (like in image) */}
                <div className="shape-purple-overlay"></div>

                {/* Pink shape - bottom right */}
                <div className="shape-pink-bottom"></div>
            </div>

            {/* Clean Menu Bar */}
            <nav className="navbar">
                <div className="navbar-container">
                    {/* Logo */}
                    <div className="logo-section">
                        <img
                            src={logo}
                            alt="Logo"
                            className="logo-image"
                        />
                    </div>

                    {/* Menu Items */}
                    <div className="menu-items">
                        <Link to="/public/gioithieu" className="menu-link">Giới thiệu</Link>
                        <Link to="/public/bai-viet" className="menu-link">Bài viết</Link>
                        <Link to="/public/pages" className="menu-link">Pages</Link>
                        <Link to="/public/lienhe" className="menu-link">Liên hệ</Link>
                    </div>
                    {/* Language selector */}
                    <select className="language-selector">
                        <option>Tiếng việt</option>
                        <option>English</option>
                    </select>
                </div>
            </nav>

            {/* Main Content Area */}
            {fullWidth ? (
                // Cho trang giới thiệu - full width
                <div style={{ position: 'relative', zIndex: 10 }}>
                    {children}
                </div>
            ) : (
                // Cho form đăng nhập/đăng ký - centered
                <div className="main-content-lo">
                    <div className="content-wrapper">
                        <div className="form-container">
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Background;