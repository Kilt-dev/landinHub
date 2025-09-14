import React, { useState } from 'react';
import api from '@landinghub/api';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import '../styles/login.css';
import LoadingDog from '../components/DogLoader';

const Login = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [redirecting, setRedirecting] = useState(false); // 👈 loader khi chuyển trang
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    // Login bằng Email/Password
    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await api.post('/api/auth/login', form);
            const token = res.data.token;
            localStorage.setItem('token', token);

            const decodedToken = jwtDecode(token);
            const role = decodedToken.role;

            setRedirecting(true); // 👈 bật loader trước khi redirect
            setTimeout(() => redirectBasedOnRole(role), 1200); // delay nhẹ cho thấy animation
        } catch (err) {
            setError(err.response?.data?.msg || 'Đăng nhập thất bại');
            setLoading(false);
        }
    };

    // Login bằng Google
    const handleGoogleLogin = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            try {
                if (!tokenResponse.access_token) {
                    throw new Error('access_token is missing in tokenResponse');
                }
                const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });

                const res = await api.post('/api/auth/google/callback', {
                    email: userInfo.data.email,
                    name: userInfo.data.name,
                });

                const token = res.data.token;
                localStorage.setItem('token', token);

                const decodedToken = jwtDecode(token);
                const role = decodedToken.role;

                setRedirecting(true);
                setTimeout(() => redirectBasedOnRole(role), 1200);
            } catch (err) {
                setError(err.response?.data?.msg || 'Google login thất bại');
            }
        },
        onError: () => {
            setError('Google login thất bại');
        },
        flow: 'implicit',
        scope: 'openid email profile',
    });

    const redirectBasedOnRole = (role) => {
        switch (role) {
            case 'admin':
                navigate('/dashboard');
                break;
            case 'user':
            default:
                navigate('/dashboard');
                break;
        }
    };

    // 👇 Nếu đang redirect → hiện loader full màn hình
    if (redirecting) {
        return <LoadingDog />;
    }

    return (
        <div className="login-container">
            <form className="form" onSubmit={handleLogin}>
                <h2 style={{ textAlign: 'center', marginBottom: 20 }}>Đăng Nhập</h2>

                {error && (
                    <div style={{ color: 'red', marginBottom: 12, textAlign: 'center' }}>
                        {error}
                    </div>
                )}

                <div className="flex-column">
                    <label>Email</label>
                    <div className="inputForm">
                        <input
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="Enter your Email"
                            className="input"
                            required
                        />
                    </div>
                </div>

                <div className="flex-column">
                    <label>Password</label>
                    <div className="inputForm">
                        <input
                            type="password"
                            name="password"
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter your Password"
                            className="input"
                            required
                            autoComplete="current-password"
                        />
                    </div>
                </div>

                <button type="submit" className="button-submit" disabled={loading}>
                    {loading ? 'Đang đăng nhập...' : 'Sign In'}
                </button>

                <p className="p line">Or With</p>

                <div className="flex-row" style={{ justifyContent: 'center' }}>
                    <button type="button" className="btn google" onClick={() => handleGoogleLogin()}>
                        Google
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;
