import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';

import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Pages from './pages/Pages';
import Leads from './pages/Leads';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Marketing from './pages/Marketing';
import Chatbot from './pages/Chatbot';
import Users from './pages/Users';
import Templates from './pages/Templates';
import CreateLandingPage from "./components/CreateLanding";
import Background from "./components/Background";

import ErrorBoundary from './components/ErrorBoundary';
import { UserProvider } from './context/UserContext';

// 🧭 Các trang public (ai cũng xem được)
import GioiThieu from "./pages/public/GioiThieu";
import BaiViet from "./pages/public/BaiViet";
import LienHe from "./pages/public/LienHe";
import PublicPages from "./pages/public/PublicPages"; // ví dụ trang "Pages" công khai

function App() {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <ErrorBoundary>
                <Router>
                    <UserProvider>
                        <Routes>
                            {/* 🌐 Các trang PUBLIC — không cần đăng nhập */}
                            <Route  path="/gioithieu" element={
                                    <Background>
                                        <GioiThieu />
                                    </Background>
                                }
                            />
                            <Route
                                path="/baiviet"
                                element={
                                    <Background>
                                        <BaiViet />
                                    </Background>
                                }
                            />
                            <Route
                                path="/lienhe"
                                element={
                                    <Background>
                                        <LienHe />
                                    </Background>
                                }
                            />
                            <Route
                                path="/pages/public"
                                element={
                                    <Background>
                                        <PublicPages />
                                    </Background>
                                }
                            />

                            {/* 🔐 Các trang PRIVATE — cần đăng nhập */}
                            <Route path="/auth" element={<AuthPage />} />
                            <Route path="/" element={<AuthPage />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/pages" element={<Pages />} />
                            <Route path="/leads" element={<Leads />} />
                            <Route path="/payments" element={<Payments />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/marketing" element={<Marketing />} />
                            <Route path="/chatbot" element={<Chatbot />} />
                            <Route path="/users" element={<Users />} />
                            <Route path="/templates" element={<Templates />} />
                            <Route path="/pages/create" element={<CreateLandingPage />} />
                            <Route path="/create-landing" element={<Navigate to="/pages/create" replace />} />

                            {/* ❌ Nếu không khớp route nào → quay lại /auth */}
                            <Route path="*" element={<Navigate to="/auth" replace />} />
                        </Routes>
                    </UserProvider>
                </Router>
            </ErrorBoundary>
        </GoogleOAuthProvider>
    );
}

export default App;
