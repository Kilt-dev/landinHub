import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Pages from './pages/Pages';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Templates from './pages/Templates';
import Marketplace from './pages/Marketplace';
import FormData from './pages/FormData';
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './components/ErrorBoundary';
import { UserProvider } from './context/UserContext';
import CreateLandingPage from './components/CreateLanding';
import GioiThieu from './components/about_public/GioiThieu';
import Contact from './components/about_public/Contact';
import PageAbout from './components/about_public/Pages ';
import Blog from './components/about_public/Blog';
import AdminAddTemplate from './components/AdminAddTemplate'; // Thêm component cho admin

function App() {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
    return (
        <GoogleOAuthProvider clientId={clientId}>
            <ErrorBoundary>
                <Router>
                    <UserProvider>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/public">
                                <Route index element={<Navigate to="/public/gioithieu" replace />} />
                                <Route path="gioithieu" element={<GioiThieu />} />
                                <Route path="lienhe" element={<Contact />} />
                                <Route path="pages" element={<PageAbout />} />
                                <Route path="bai-viet" element={<Blog />} />
                            </Route>
                            {/* Auth routes */}
                            <Route path="/auth" element={<AuthPage />} />
                            <Route path="/" element={<Navigate to="/auth" replace />} />
                            {/* Protected routes */}
                            <Route path="/pages" element={<Pages />} />
                            <Route path="/pages/create" element={<CreateLandingPage />} />
                            <Route path="/create-landing" element={<Navigate to="/pages/create" replace />} />
                            <Route path="/templates" element={<Templates />} />
                            <Route path="/market" element={<Marketplace />} />
                            <Route path="/setting-form" element={<FormData />} />

                            <Route path="/payments" element={<Payments />} />
                            {/* Admin route */}
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/qltemplates" element={<AdminAddTemplate />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="/users" element={<Users />} />
                            {/* Catch-all route */}
                            <Route path="*" element={<Navigate to="/auth" replace />} />
                        </Routes>
                    </UserProvider>
                </Router>
            </ErrorBoundary>
        </GoogleOAuthProvider>
    );
}

export default App;