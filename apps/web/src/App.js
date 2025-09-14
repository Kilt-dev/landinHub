import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './components/ErrorBoundary';
import { UserProvider } from './context/UserContext';

function App() {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <ErrorBoundary>
                <UserProvider>
                    <Router>
                        <Routes>
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
                        </Routes>
                    </Router>
                </UserProvider>
            </ErrorBoundary>
        </GoogleOAuthProvider>
    );
}

export default App;