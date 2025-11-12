import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FormData.css';

/**
 * FormData Page - Form Submissions Dashboard
 * Similar to LadiPage form management interface
 * Displays all form submissions across all pages with filtering, export, and management
 */
const FormData = () => {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        new: 0,
        read: 0,
        replied: 0,
        archived: 0,
        spam: 0
    });
    const [filters, setFilters] = useState({
        status: '',
        pageId: '',
        search: '',
        dateFrom: '',
        dateTo: ''
    });
    const [selectedSubmissions, setSelectedSubmissions] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(20);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
    const [expandedSubmission, setExpandedSubmission] = useState(null);

    // Fetch submissions
    useEffect(() => {
        fetchSubmissions();
    }, [currentPage, filters]);

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const params = {
                limit: itemsPerPage,
                offset: (currentPage - 1) * itemsPerPage,
                sort: '-submitted_at'
            };

            if (filters.status) params.status = filters.status;

            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/forms/submissions`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params
                }
            );

            setSubmissions(response.data.submissions);

            // Calculate total pages
            const total = response.data.pagination.total;
            setTotalPages(Math.ceil(total / itemsPerPage));

            // Calculate stats from data
            const newSubmissions = response.data.submissions || [];
            const calculatedStats = {
                total: total,
                new: newSubmissions.filter(s => s.status === 'new').length,
                read: newSubmissions.filter(s => s.status === 'read').length,
                replied: newSubmissions.filter(s => s.status === 'replied').length,
                archived: newSubmissions.filter(s => s.status === 'archived').length,
                spam: newSubmissions.filter(s => s.status === 'spam').length
            };
            setStats(calculatedStats);

        } catch (error) {
            console.error('Error fetching submissions:', error);
            if (error.response?.status === 401) {
                navigate('/auth');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle status update
    const handleStatusUpdate = async (submissionId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `${process.env.REACT_APP_API_URL}/api/forms/submission/${submissionId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local state
            setSubmissions(prev =>
                prev.map(sub =>
                    sub._id === submissionId ? { ...sub, status: newStatus } : sub
                )
            );

            // Refresh to update stats
            fetchSubmissions();

        } catch (error) {
            console.error('Error updating status:', error);
            alert('Không thể cập nhật trạng thái. Vui lòng thử lại.');
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedSubmissions.length === 0) {
            alert('Vui lòng chọn ít nhất một submission để xóa');
            return;
        }

        if (!window.confirm(`Bạn có chắc muốn xóa ${selectedSubmissions.length} submissions?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${process.env.REACT_APP_API_URL}/api/forms/submissions`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { ids: selectedSubmissions }
                }
            );

            setSelectedSubmissions([]);
            fetchSubmissions();

        } catch (error) {
            console.error('Error deleting submissions:', error);
            alert('Không thể xóa submissions. Vui lòng thử lại.');
        }
    };

    // Handle export to CSV
    const handleExport = async (pageId = null) => {
        try {
            const token = localStorage.getItem('token');

            if (!pageId && submissions.length > 0) {
                // Export from first submission's page if no page specified
                pageId = submissions[0].page_id._id || submissions[0].page_id;
            }

            if (!pageId) {
                alert('Không có dữ liệu để export');
                return;
            }

            const url = `${process.env.REACT_APP_API_URL}/api/forms/export/${pageId}?format=csv${filters.status ? `&status=${filters.status}` : ''}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            // Download file
            const downloadUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', `form-submissions-${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

        } catch (error) {
            console.error('Error exporting submissions:', error);
            alert('Không thể export dữ liệu. Vui lòng thử lại.');
        }
    };

    // Toggle selection
    const toggleSelection = (submissionId) => {
        setSelectedSubmissions(prev =>
            prev.includes(submissionId)
                ? prev.filter(id => id !== submissionId)
                : [...prev, submissionId]
        );
    };

    // Select all
    const toggleSelectAll = () => {
        if (selectedSubmissions.length === submissions.length) {
            setSelectedSubmissions([]);
        } else {
            setSelectedSubmissions(submissions.map(sub => sub._id));
        }
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Get status color
    const getStatusColor = (status) => {
        const colors = {
            new: '#10b981',
            read: '#3b82f6',
            replied: '#8b5cf6',
            archived: '#6b7280',
            spam: '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    // Get status label
    const getStatusLabel = (status) => {
        const labels = {
            new: 'Mới',
            read: 'Đã đọc',
            replied: 'Đã trả lời',
            archived: 'Lưu trữ',
            spam: 'Spam'
        };
        return labels[status] || status;
    };

    return (
        <div className="formdata-container">
            {/* Header */}
            <div className="formdata-header">
                <div className="formdata-header-left">
                    <h1>Quản lý Form Submissions</h1>
                    <p className="formdata-subtitle">
                        Theo dõi và quản lý tất cả dữ liệu từ landing pages của bạn
                    </p>
                </div>
                <div className="formdata-header-actions">
                    <button className="btn-export" onClick={() => handleExport()}>
                        <span>📥</span> Export CSV
                    </button>
                    <button className="btn-refresh" onClick={fetchSubmissions}>
                        <span>🔄</span> Làm mới
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="formdata-stats">
                <div className="stat-card stat-total">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Tổng submissions</div>
                    </div>
                </div>
                <div
                    className="stat-card stat-new"
                    onClick={() => setFilters({ ...filters, status: filters.status === 'new' ? '' : 'new' })}
                >
                    <div className="stat-icon">✨</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.new}</div>
                        <div className="stat-label">Mới</div>
                    </div>
                </div>
                <div
                    className="stat-card stat-read"
                    onClick={() => setFilters({ ...filters, status: filters.status === 'read' ? '' : 'read' })}
                >
                    <div className="stat-icon">👁️</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.read}</div>
                        <div className="stat-label">Đã đọc</div>
                    </div>
                </div>
                <div
                    className="stat-card stat-replied"
                    onClick={() => setFilters({ ...filters, status: filters.status === 'replied' ? '' : 'replied' })}
                >
                    <div className="stat-icon">💬</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.replied}</div>
                        <div className="stat-label">Đã trả lời</div>
                    </div>
                </div>
            </div>

            {/* Filters and Actions Bar */}
            <div className="formdata-toolbar">
                <div className="toolbar-left">
                    {selectedSubmissions.length > 0 && (
                        <>
                            <button className="btn-bulk-action" onClick={handleBulkDelete}>
                                🗑️ Xóa ({selectedSubmissions.length})
                            </button>
                            <button
                                className="btn-bulk-action"
                                onClick={() => {
                                    selectedSubmissions.forEach(id => handleStatusUpdate(id, 'archived'));
                                    setSelectedSubmissions([]);
                                }}
                            >
                                📦 Lưu trữ ({selectedSubmissions.length})
                            </button>
                        </>
                    )}
                </div>
                <div className="toolbar-right">
                    <select
                        className="filter-select"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="new">Mới</option>
                        <option value="read">Đã đọc</option>
                        <option value="replied">Đã trả lời</option>
                        <option value="archived">Lưu trữ</option>
                        <option value="spam">Spam</option>
                    </select>
                    <div className="view-mode-toggle">
                        <button
                            className={viewMode === 'table' ? 'active' : ''}
                            onClick={() => setViewMode('table')}
                        >
                            📋
                        </button>
                        <button
                            className={viewMode === 'cards' ? 'active' : ''}
                            onClick={() => setViewMode('cards')}
                        >
                            🎴
                        </button>
                    </div>
                </div>
            </div>

            {/* Submissions List */}
            {loading ? (
                <div className="formdata-loading">
                    <div className="spinner"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : submissions.length === 0 ? (
                <div className="formdata-empty">
                    <div className="empty-icon">📝</div>
                    <h3>Chưa có submissions nào</h3>
                    <p>Khi người dùng gửi form từ landing pages, dữ liệu sẽ hiển thị ở đây</p>
                </div>
            ) : viewMode === 'table' ? (
                <div className="submissions-table-wrapper">
                    <table className="submissions-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedSubmissions.length === submissions.length}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>Thời gian</th>
                                <th>Landing Page</th>
                                <th>Dữ liệu</th>
                                <th>Thiết bị</th>
                                <th>Trạng thái</th>
                                <th style={{ width: '100px' }}>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {submissions.map((submission) => (
                                <tr key={submission._id} className={selectedSubmissions.includes(submission._id) ? 'selected' : ''}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedSubmissions.includes(submission._id)}
                                            onChange={() => toggleSelection(submission._id)}
                                        />
                                    </td>
                                    <td className="td-date">
                                        {formatDate(submission.submitted_at)}
                                        {submission.isRecent && <span className="badge-recent">Mới</span>}
                                    </td>
                                    <td className="td-page">
                                        {submission.page_id?.name || 'Unknown Page'}
                                    </td>
                                    <td className="td-data">
                                        <div className="submission-data-preview">
                                            {Object.entries(submission.form_data || {}).slice(0, 2).map(([key, value]) => (
                                                <div key={key} className="data-field">
                                                    <strong>{key}:</strong> {String(value).substring(0, 50)}
                                                    {String(value).length > 50 && '...'}
                                                </div>
                                            ))}
                                            {Object.keys(submission.form_data || {}).length > 2 && (
                                                <div className="data-more">
                                                    +{Object.keys(submission.form_data).length - 2} fields
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="td-device">
                                        <span className="device-badge">
                                            {submission.metadata?.device_type === 'mobile' && '📱'}
                                            {submission.metadata?.device_type === 'tablet' && '📲'}
                                            {submission.metadata?.device_type === 'desktop' && '💻'}
                                            {submission.metadata?.device_type || '❓'}
                                        </span>
                                    </td>
                                    <td>
                                        <select
                                            className="status-select"
                                            value={submission.status}
                                            onChange={(e) => handleStatusUpdate(submission._id, e.target.value)}
                                            style={{
                                                backgroundColor: getStatusColor(submission.status),
                                                color: 'white'
                                            }}
                                        >
                                            <option value="new">Mới</option>
                                            <option value="read">Đã đọc</option>
                                            <option value="replied">Đã trả lời</option>
                                            <option value="archived">Lưu trữ</option>
                                            <option value="spam">Spam</option>
                                        </select>
                                    </td>
                                    <td className="td-actions">
                                        <button
                                            className="btn-view-details"
                                            onClick={() => setExpandedSubmission(
                                                expandedSubmission === submission._id ? null : submission._id
                                            )}
                                        >
                                            {expandedSubmission === submission._id ? '👁️ Đóng' : '👁️ Xem'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="submissions-cards">
                    {submissions.map((submission) => (
                        <div key={submission._id} className="submission-card">
                            <div className="submission-card-header">
                                <input
                                    type="checkbox"
                                    checked={selectedSubmissions.includes(submission._id)}
                                    onChange={() => toggleSelection(submission._id)}
                                />
                                <span
                                    className="submission-status-badge"
                                    style={{ backgroundColor: getStatusColor(submission.status) }}
                                >
                                    {getStatusLabel(submission.status)}
                                </span>
                                <span className="submission-date">
                                    {formatDate(submission.submitted_at)}
                                </span>
                            </div>
                            <div className="submission-card-body">
                                <h4>{submission.page_id?.name || 'Unknown Page'}</h4>
                                {Object.entries(submission.form_data || {}).map(([key, value]) => (
                                    <div key={key} className="submission-field">
                                        <strong>{key}:</strong> {String(value)}
                                    </div>
                                ))}
                            </div>
                            <div className="submission-card-footer">
                                <span className="device-info">
                                    {submission.metadata?.device_type || 'unknown'}
                                </span>
                                <button onClick={() => setExpandedSubmission(submission._id)}>
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="formdata-pagination">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        ← Trước
                    </button>
                    <span>
                        Trang {currentPage} / {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Sau →
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            {expandedSubmission && (
                <div className="submission-detail-modal" onClick={() => setExpandedSubmission(null)}>
                    <div className="submission-detail-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chi tiết Submission</h3>
                            <button className="btn-close" onClick={() => setExpandedSubmission(null)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            {(() => {
                                const sub = submissions.find(s => s._id === expandedSubmission);
                                if (!sub) return null;

                                return (
                                    <>
                                        <div className="detail-section">
                                            <h4>Thông tin chung</h4>
                                            <p><strong>Landing Page:</strong> {sub.page_id?.name || 'Unknown'}</p>
                                            <p><strong>Thời gian:</strong> {formatDate(sub.submitted_at)}</p>
                                            <p><strong>Trạng thái:</strong> {getStatusLabel(sub.status)}</p>
                                        </div>

                                        <div className="detail-section">
                                            <h4>Dữ liệu Form</h4>
                                            {Object.entries(sub.form_data || {}).map(([key, value]) => (
                                                <p key={key}>
                                                    <strong>{key}:</strong> {String(value)}
                                                </p>
                                            ))}
                                        </div>

                                        <div className="detail-section">
                                            <h4>Metadata</h4>
                                            <p><strong>IP Address:</strong> {sub.metadata?.ip_address || 'N/A'}</p>
                                            <p><strong>Device:</strong> {sub.metadata?.device_type || 'N/A'}</p>
                                            <p><strong>User Agent:</strong> {sub.metadata?.user_agent || 'N/A'}</p>
                                            {sub.metadata?.utm_source && (
                                                <p><strong>UTM Source:</strong> {sub.metadata.utm_source}</p>
                                            )}
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FormData;
