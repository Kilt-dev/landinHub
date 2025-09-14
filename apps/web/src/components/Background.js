import React from 'react';
import '../styles/Background.css';
import logo from '../assets/logo.png'
const Background = ({ children }) => {
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
                        <a href="#" className="menu-link">Giới thiệu</a>
                        <a href="#" className="menu-link">Bài viết</a>
                        <a href="#" className="menu-link">Pages</a>
                        <a href="#" className="menu-link">Liên hệ</a>
                    </div>

                    {/* Language selector */}
                    <select className="language-selector">
                        <option>Tiếng việt</option>
                        <option>English</option>
                    </select>
                </div>
            </nav>

            {/* Main Content Area */}
            <div className="main-content">
                <div className="content-wrapper">
                    {/* Clean form container */}
                    <div className="form-container">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Background;