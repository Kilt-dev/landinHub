import React, { useState, useEffect } from 'react';
import { getToastSettings, updateToastSettings } from '../../utils/toastConfig';
import './ToastSettings.css';

/**
 * Toast Notification Settings Panel
 * Allows users to control which toast notifications they see
 */
const ToastSettings = ({ isOpen, onClose }) => {
    const [settings, setSettings] = useState(getToastSettings());

    useEffect(() => {
        setSettings(getToastSettings());
    }, [isOpen]);

    const handleToggle = (key) => {
        const newSettings = {
            ...settings,
            [key]: !settings[key]
        };
        setSettings(newSettings);
        updateToastSettings(newSettings);
    };

    if (!isOpen) return null;

    return (
        <div className="toast-settings-overlay" onClick={onClose}>
            <div className="toast-settings-panel" onClick={(e) => e.stopPropagation()}>
                <div className="toast-settings-header">
                    <h3>Cài Đặt Thông Báo</h3>
                    <button className="toast-settings-close" onClick={onClose}>×</button>
                </div>

                <div className="toast-settings-body">
                    <p className="toast-settings-desc">
                        Bật/tắt các loại thông báo hiển thị trên màn hình
                    </p>

                    <div className="toast-setting-item">
                        <div className="toast-setting-info">
                            <label>Thông báo thành công</label>
                            <small>Hiển thị khi cập nhật, thêm, xóa phần tử</small>
                        </div>
                        <label className="toast-toggle">
                            <input
                                type="checkbox"
                                checked={settings.showSuccess}
                                onChange={() => handleToggle('showSuccess')}
                            />
                            <span className="toast-toggle-slider"></span>
                        </label>
                    </div>

                    <div className="toast-setting-item">
                        <div className="toast-setting-info">
                            <label>Thông báo thông tin</label>
                            <small>Hiển thị khi chuyển chế độ xem, mở popup</small>
                        </div>
                        <label className="toast-toggle">
                            <input
                                type="checkbox"
                                checked={settings.showInfo}
                                onChange={() => handleToggle('showInfo')}
                            />
                            <span className="toast-toggle-slider"></span>
                        </label>
                    </div>

                    <div className="toast-setting-item">
                        <div className="toast-setting-info">
                            <label>Thông báo cảnh báo</label>
                            <small>Hiển thị khi có điều cần chú ý</small>
                        </div>
                        <label className="toast-toggle">
                            <input
                                type="checkbox"
                                checked={settings.showWarning}
                                onChange={() => handleToggle('showWarning')}
                            />
                            <span className="toast-toggle-slider"></span>
                        </label>
                    </div>

                    <div className="toast-setting-item">
                        <div className="toast-setting-info">
                            <label>Thông báo lỗi</label>
                            <small>Luôn hiển thị (quan trọng)</small>
                        </div>
                        <label className="toast-toggle">
                            <input
                                type="checkbox"
                                checked={true}
                                disabled={true}
                            />
                            <span className="toast-toggle-slider disabled"></span>
                        </label>
                    </div>
                </div>

                <div className="toast-settings-footer">
                    <button className="toast-settings-btn-close" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ToastSettings;
