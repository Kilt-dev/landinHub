import React, { useState, useEffect } from 'react';
import api from '@landinghub/api';
import '../styles/UserProfile.css';
import Loading from '../components/FaceLoader';

const UserProfile = () => {
    const [userData, setUserData] = useState({});
    const [form, setForm] = useState({ name: '' });
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false); // tách riêng state update form
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/api/user/info');
                setUserData(res.data);
                setForm({ name: res.data.name || '' });
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Không thể tải dữ liệu người dùng.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setForm({ name: e.target.value });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError(null);
        setUpdating(true);
        try {
            const res = await api.put('/api/user/update', { name: form.name });
            const newToken = res.data.token;
            localStorage.setItem('token', newToken);
            setUserData({ ...userData, name: form.name });
            console.log('Thông tin người dùng được cập nhật thành công');
        } catch (err) {
            setError(err.response?.data?.msg || 'Cập nhật thất bại');
        } finally {
            setUpdating(false);
        }
    };

    if (error && loading) return <div style={{ color: 'red' }}>{error}</div>;
    // if (loading) return <Loading />; // chỉ khi load dữ liệu lần đầu

    return (
        <div className="user-profile">
            <h2>Thông tin người dùng</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}

            <form onSubmit={handleUpdate} className="user-form">
                <div className="form-group">
                    <label>Tên</label>
                    <input
                        type="text"
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        disabled={updating}
                    />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="text" value={userData.email || 'Chưa có thông tin'} disabled />
                </div>
                <div className="form-group">
                    <label>Vai trò</label>
                    <input type="text" value={userData.role || 'Chưa có thông tin'} disabled />
                </div>
                <div className="form-group">
                    <label>Đăng ký</label>
                    <input type="text" value={userData.subscription || 'Chưa có thông tin'} disabled />
                </div>
                <div className="form-group">
                    <label>Ngày tạo</label>
                    <input
                        type="text"
                        value={userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Chưa có thông tin'}
                        disabled
                    />
                </div>

                {/* Loader chỉ hiển thị trong form khi cập nhật */}
                {updating ? (
                    <div className="form-loader">
                        <Loading />
                        <span>Đang cập nhật...</span>
                    </div>
                ) : (
                    <button type="submit">Cập nhật</button>
                )}
            </form>
        </div>
    );
};

export default UserProfile;
