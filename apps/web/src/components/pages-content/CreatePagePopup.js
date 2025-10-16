import React, { useState } from 'react';
import api from '@landinghub/api';
import { toast } from 'react-toastify';
import '../../styles/CreatePagePopup.css';

const CreatePagePopup = ({ isOpen, onClose, onCreateSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmedName = formData.name.trim();
        if (!trimmedName) {
            toast.error('Tên landing page là bắt buộc');
            return;
        }

        setLoading(true);
        try {
            console.log('Sending POST request to /api/pages with payload:', {
                name: trimmedName,
                description: formData.description.trim(),
            });
            const response = await api.post('/api/pages', {
                name: trimmedName,
                description: formData.description.trim(),
            });
            console.log('Response from /api/pages:', response);
            if (response.data.success && response.data.page && (response.data.page.id || response.data.page._id)) {
                toast.success('Tạo landing page thành công!');
                onCreateSuccess(response.data.page);
                onClose();
            } else {
                console.error('Invalid response format:', response.data);
                toast.error('Tạo landing page thất bại: ' + (response.data.error || 'Dữ liệu trả về không hợp lệ'));
            }
        } catch (error) {
            console.error('Lỗi khi tạo landing page:', error);
            toast.error('Lỗi khi tạo landing page: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="popup-overlay">
            <div className="popup-content">
                <h2>Tạo Landing Page Mới</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="name">Tên Landing Page <span>*</span></label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nhập tên landing page"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Mô tả</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            placeholder="Nhập mô tả (tùy chọn)"
                        />
                    </div>
                    <div className="form-buttons">
                        <button type="button" onClick={onClose} disabled={loading}>
                            Hủy
                        </button>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Đang tạo...' : 'Tạo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreatePagePopup;