import React from 'react';
import { Plus, Info } from 'lucide-react';

const HeaderComponent = ({ onCreateClick, totalPages = 0 }) => {
    return (
        <div className="content-header">
            <div className="header-texts">
                <h1 className="header-title">Landing Pages</h1>
                <p className="header-subtitle">
                    Quản lý, chỉnh sửa và triển khai các landing page của bạn.
                    Bạn hiện có <strong>{totalPages}</strong> trang đang hoạt động.
                </p>
            </div>
            <button
                className="create-btn"
                onClick={onCreateClick}
                title="Tạo một landing page mới từ template hoặc từ đầu"
            >
                <Plus size={18} />
                <span>Tạo Landing Page</span>
            </button>
        </div>
    );
};

export default HeaderComponent;
