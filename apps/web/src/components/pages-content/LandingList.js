import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@landinghub/api';
import { toast } from 'react-toastify';
import '../../styles/LandingList.css';

const LandingList = ({
                         landingPages,
                         filteredPages,
                         menuOpen,
                         setMenuOpen,
                         handlePreviewPage,
                         handleEditPage,
                         handlePublishPage,
                         handleDeletePage, // ✅ DÙNG CÓ SẴN
                         formatDate,
                         onRefreshPages,
                     }) => {
    const navigate = useNavigate();
    const [copiedLink, setCopiedLink] = useState(null);
    const [regenerating, setRegenerating] = useState({});

    const handlePageClick = (page) => {
        navigate(`/pages/create?id=${page.id || page._id}`);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'ĐÃ XUẤT BẢN':
                return { color: '#10b981', bg: '#d1fae5', text: 'Đã xuất bản' };
            case 'CHƯA XUẤT BẢN':
                return { color: '#6b7280', bg: '#f3f4f6', text: 'Chưa xuất bản' };
            case 'ARCHIVED':
                return { color: '#3b82f6', bg: '#dbeafe', text: 'Đã lưu trữ' };
            default:
                return { color: '#ef4444', bg: '#fee2e2', text: 'Lỗi' };
        }
    };

    const getS3HttpUrl = (filePath, pageId) => {
        if (!filePath) return '#';
        if (filePath.startsWith('https://')) return filePath;
        const bucket = process.env.REACT_APP_AWS_S3_BUCKET || 'landinghub-iconic';
        const region = process.env.REACT_APP_AWS_REGION || 'ap-southeast-1';
        const s3Key = filePath.replace(`s3://${bucket}/`, '');
        return `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}/index.html`;
    };

    const handleCopyS3Link = (link, pageId) => {
        const url = getS3HttpUrl(link, pageId);
        navigator.clipboard.writeText(url).then(() => {
            setCopiedLink(pageId);
            toast.success('Đã sao chép liên kết!');
            setTimeout(() => setCopiedLink(null), 2000);
        }).catch((err) => {
            console.error('Error copying link:', err);
            toast.error('Không thể sao chép liên kết');
        });
    };

    const handleRegenerateScreenshot = async (pageId) => {
        setRegenerating((prev) => ({ ...prev, [pageId]: true }));
        try {
            const response = await api.get(`/api/pages/${pageId}/regenerate-screenshot`);
            if (response.data.success) {
                toast.success('Đã tạo lại ảnh chụp màn hình!');
                if (onRefreshPages) {
                    await onRefreshPages();
                }
            } else {
                throw new Error(response.data.error || 'Không thể tạo ảnh chụp màn hình');
            }
        } catch (err) {
            console.error(`Error regenerating screenshot for page ${pageId}:`, err);
            toast.error('Lỗi khi tạo lại ảnh chụp màn hình: ' + (err.response?.data?.error || err.message));
        } finally {
            setRegenerating((prev) => ({ ...prev, [pageId]: false }));
        }
    };

    return (
        <div className="landing-list">
            {filteredPages.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">📄</div>
                    <h3>Chưa có landing page nào</h3>
                    <p>Tạo landing page đầu tiên của bạn để bắt đầu</p>
                </div>
            ) : (
                filteredPages.map((page) => {
                    const statusInfo = getStatusInfo(page.status);
                    const s3Link = page.url || page.file_path || '#';
                    const pageId = page.id || page._id;

                    return (
                        <div
                            key={pageId}
                            className="page-card"
                            onClick={() => handlePageClick(page)}
                        >
                            {/* ✅ NÚT X GÓC TRÁI */}
                            <button
                                className="delete-btn"
                                onClick={(e) => {
                                    e.stopPropagation(); // NGAN CLICK VÀO CARD
                                    handleDeletePage(pageId); // ✅ DÙNG CÓ SẴN
                                }}
                                title="Xóa trang"
                            >
                                ✕
                            </button>

                            <div className="page-thumbnail">
                                {page.screenshot_url && (
                                    <img
                                        src={`${page.screenshot_url}?t=${new Date().getTime()}`}
                                        alt={page.name}
                                        loading="lazy"
                                        style={{ display: 'block' }}
                                        onError={(e) => {
                                            console.error(`Failed to load image for ${page.name}: ${page.screenshot_url}`);
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                        onLoad={(e) => {
                                            e.target.style.display = 'block';
                                            e.target.nextSibling.style.display = 'none';
                                        }}
                                    />
                                )}
                                <div
                                    className="thumbnail-placeholder"
                                    style={{ display: page.screenshot_url ? 'none' : 'flex' }}
                                >
                                    <div className="placeholder-icon">🎨</div>
                                    <span>Đang tạo preview...</span>
                                    {page.file_path && (
                                        <button
                                            className="action-btn regenerate-btn"
                                            style={{
                                                position: 'absolute',
                                                bottom: '10px',
                                                right: '10px',
                                                background: '#667eea',
                                                color: '#ffffff',
                                                borderRadius: '8px',
                                                padding: '6px 12px',
                                                fontSize: '12px',
                                                cursor: regenerating[pageId] ? 'not-allowed' : 'pointer',
                                                opacity: regenerating[pageId] ? 0.7 : 1,
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRegenerateScreenshot(pageId);
                                            }}
                                            disabled={regenerating[pageId]}
                                            title="Tạo lại ảnh chụp màn hình"
                                        >
                                            {regenerating[pageId] ? (
                                                <span className="spinner">⏳</span>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                                                    <path d="M3 12a9 9 0 0118 0 9 9 0 01-18 0zm9-9a9 9 0 019 9" />
                                                    <path d="M12 3v3M3 12h3m15 0h-3m0 9v-3" />
                                                </svg>
                                            )}
                                            <span style={{ marginLeft: '4px' }}>Tạo lại</span>
                                        </button>
                                    )}
                                </div>

                                <div
                                    className="status-badge"
                                    style={{
                                        backgroundColor: statusInfo.bg,
                                        color: statusInfo.color,
                                    }}
                                >
                                    <span
                                        className="status-dot"
                                        style={{ backgroundColor: statusInfo.color }}
                                    ></span>
                                    {statusInfo.text}
                                </div>

                                <button
                                    className="action-btn s3-link-btn"
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: '#ffffff',
                                        borderRadius: '50%',
                                        padding: '8px',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                        cursor: 'pointer',
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyS3Link(s3Link, pageId);
                                    }}
                                    title={copiedLink === pageId ? 'Đã sao chép!' : 'Sao chép liên kết S3'}
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke={copiedLink === pageId ? '#10b981' : '#6b7280'}
                                        strokeWidth="2"
                                    >
                                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                                    </svg>
                                </button>
                            </div>

                            <div className="page-content">
                                <div className="page-header">
                                    <h3 className="page-title" title={page.name}>
                                        {page.name}
                                    </h3>
                                    <div className="page-meta">
                                        <span className="meta-item">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                            </svg>
                                            Tạo: {formatDate(page.created_at)}
                                        </span>
                                        <span className="meta-item">
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7H5v2h4v1H3v14h18V7h-6V6h4V4zM7 19V9h10v10H7z" />
                                            </svg>
                                            Cập nhật: {formatDate(page.updated_at)}
                                        </span>
                                        <span className="meta-item">
                                            Doanh thu: {typeof page.revenue === 'number' ? `${page.revenue}đ` : page.revenue}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};

export default LandingList;