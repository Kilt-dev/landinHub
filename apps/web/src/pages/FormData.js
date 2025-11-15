import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './FormData.css';

/**
 * FormData Page - Form Submissions Dashboard
 * Modern lead management interface with intelligent display
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
                pageId = submissions[0].page_id?._id || submissions[0].page_id;
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

    // Format relative time
    const formatRelativeTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Vừa xong';
        if (diffMins < 60) return `${diffMins} phút trước`;
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return formatDate(dateString);
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

    // Get device icon
    const getDeviceIcon = (deviceType) => {
        const icons = {
            mobile: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
            ),
            tablet: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                    <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
            ),
            desktop: (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                    <line x1="8" y1="21" x2="16" y2="21"/>
                    <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
            )
        };
        return icons[deviceType] || icons.desktop;
    };

    return (
        <div className="formdata-container">
            {/* Header */}
            <div className="formdata-header">
                <div className="formdata-header-left">
                    <h1>Quản lý Lead</h1>
                    <p className="formdata-subtitle">
                        Theo dõi và quản lý tất cả dữ liệu khách hàng tiềm năng từ landing pages
                    </p>
                </div>
                <div className="formdata-header-actions">
                    <button className="btn-export" onClick={() => handleExport()}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7 10 12 15 17 10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Export CSV
                    </button>
                    <button className="btn-refresh" onClick={fetchSubmissions}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 4 23 10 17 10"/>
                            <polyline points="1 20 1 14 7 14"/>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                        </svg>
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="formdata-stats">
                <div className="stat-card stat-total">
                    <div className="stat-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="20" x2="12" y2="10"/>
                            <line x1="18" y1="20" x2="18" y2="4"/>
                            <line x1="6" y1="20" x2="6" y2="16"/>
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Tổng submissions</div>
                    </div>
                </div>
                <div
                    className="stat-card stat-new"
                    onClick={() => setFilters({ ...filters, status: filters.status === 'new' ? '' : 'new' })}
                >
                    <div className="stat-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                            <path d="M2 17l10 5 10-5"/>
                            <path d="M2 12l10 5 10-5"/>
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.new}</div>
                        <div className="stat-label">Mới</div>
                    </div>
                </div>
                <div
                    className="stat-card stat-read"
                    onClick={() => setFilters({ ...filters, status: filters.status === 'read' ? '' : 'read' })}
                >
                    <div className="stat-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.read}</div>
                        <div className="stat-label">Đã đọc</div>
                    </div>
                </div>
                <div
                    className="stat-card stat-replied"
                    onClick={() => setFilters({ ...filters, status: filters.status === 'replied' ? '' : 'replied' })}
                >
                    <div className="stat-icon-wrapper">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                        </svg>
                    </div>
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
                            <button className="btn-bulk-action btn-delete" onClick={handleBulkDelete}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6"/>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                </svg>
                                Xóa ({selectedSubmissions.length})
                            </button>
                            <button
                                className="btn-bulk-action btn-archive"
                                onClick={() => {
                                    selectedSubmissions.forEach(id => handleStatusUpdate(id, 'archived'));
                                    setSelectedSubmissions([]);
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="21 8 21 21 3 21 3 8"/>
                                    <rect x="1" y="3" width="22" height="5"/>
                                    <line x1="10" y1="12" x2="14" y2="12"/>
                                </svg>
                                Lưu trữ ({selectedSubmissions.length})
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
                            title="Xem dạng bảng"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="8" y1="6" x2="21" y2="6"/>
                                <line x1="8" y1="12" x2="21" y2="12"/>
                                <line x1="8" y1="18" x2="21" y2="18"/>
                                <line x1="3" y1="6" x2="3.01" y2="6"/>
                                <line x1="3" y1="12" x2="3.01" y2="12"/>
                                <line x1="3" y1="18" x2="3.01" y2="18"/>
                            </svg>
                        </button>
                        <button
                            className={viewMode === 'cards' ? 'active' : ''}
                            onClick={() => setViewMode('cards')}
                            title="Xem dạng thẻ"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="3" width="7" height="7"/>
                                <rect x="14" y="3" width="7" height="7"/>
                                <rect x="14" y="14" width="7" height="7"/>
                                <rect x="3" y="14" width="7" height="7"/>
                            </svg>
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
                    <svg className="empty-icon" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                    </svg>
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
                                <th style={{ width: '120px' }}>Thao tác</th>
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
                                        <div className="date-display">
                                            <span className="relative-time">{formatRelativeTime(submission.submitted_at)}</span>
                                            <span className="absolute-time">{formatDate(submission.submitted_at)}</span>
                                        </div>
                                    </td>
                                    <td className="td-page">
                                        <div className="page-info">
                                            <div className="page-name">{submission.page_name || 'Unknown Page'}</div>
                                            {submission.page_published_url && (
                                                <a
                                                    href={submission.page_published_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="page-url"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                                        <polyline points="15 3 21 3 21 9"/>
                                                        <line x1="10" y1="14" x2="21" y2="3"/>
                                                    </svg>
                                                    {submission.page_url}
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="td-data">
                                        <div className="submission-data-preview">
                                            {Object.entries(submission.form_data || {}).slice(0, 2).map(([key, value]) => (
                                                <div key={key} className="data-field">
                                                    <span className="field-key">{key}:</span>
                                                    <span className="field-value">
                                                        {String(value).substring(0, 50)}
                                                        {String(value).length > 50 && '...'}
                                                    </span>
                                                </div>
                                            ))}
                                            {Object.keys(submission.form_data || {}).length > 2 && (
                                                <div className="data-more">
                                                    +{Object.keys(submission.form_data).length - 2} trường khác
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="td-device">
                                        <div className="device-badge" title={submission.metadata?.device_type || 'unknown'}>
                                            {getDeviceIcon(submission.metadata?.device_type)}
                                            <span>{submission.metadata?.device_type || 'unknown'}</span>
                                        </div>
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
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                <circle cx="12" cy="12" r="3"/>
                                            </svg>
                                            {expandedSubmission === submission._id ? 'Đóng' : 'Xem'}
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
                                    {formatRelativeTime(submission.submitted_at)}
                                </span>
                            </div>
                            <div className="submission-card-body">
                                <h4>{submission.page_name || 'Unknown Page'}</h4>
                                {submission.page_published_url && (
                                    <a
                                        href={submission.page_published_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="card-page-url"
                                    >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                                        </svg>
                                        {submission.page_url}
                                    </a>
                                )}
                                <div className="card-form-data">
                                    {Object.entries(submission.form_data || {}).map(([key, value]) => (
                                        <div key={key} className="submission-field">
                                            <span className="field-key">{key}:</span>
                                            <span className="field-value">{String(value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="submission-card-footer">
                                <div className="device-info">
                                    {getDeviceIcon(submission.metadata?.device_type)}
                                    <span>{submission.metadata?.device_type || 'unknown'}</span>
                                </div>
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
                        className="pagination-btn"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="15 18 9 12 15 6"/>
                        </svg>
                        Trước
                    </button>
                    <span className="pagination-info">
                        Trang {currentPage} / {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        className="pagination-btn"
                    >
                        Sau
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
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
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18"/>
                                    <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            {(() => {
                                const sub = submissions.find(s => s._id === expandedSubmission);
                                if (!sub) return null;

                                return (
                                    <>
                                        <div className="detail-section">
                                            <h4>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <circle cx="12" cy="12" r="10"/>
                                                    <line x1="12" y1="16" x2="12" y2="12"/>
                                                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                                                </svg>
                                                Thông tin Landing Page
                                            </h4>
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <span className="detail-label">Tên page:</span>
                                                    <span className="detail-value">{sub.page_name || 'Unknown'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">URL:</span>
                                                    <span className="detail-value">{sub.page_url || 'N/A'}</span>
                                                </div>
                                                {sub.page_published_url && (
                                                    <div className="detail-item full-width">
                                                        <span className="detail-label">Published URL:</span>
                                                        <a
                                                            href={sub.page_published_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="detail-link"
                                                        >
                                                            {sub.page_published_url}
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                                                                <polyline points="15 3 21 3 21 9"/>
                                                                <line x1="10" y1="14" x2="21" y2="3"/>
                                                            </svg>
                                                        </a>
                                                    </div>
                                                )}
                                                <div className="detail-item">
                                                    <span className="detail-label">Thời gian:</span>
                                                    <span className="detail-value">{formatDate(sub.submitted_at)}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">Trạng thái:</span>
                                                    <span className="status-badge" style={{ backgroundColor: getStatusColor(sub.status) }}>
                                                        {getStatusLabel(sub.status)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="detail-section">
                                            <h4>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                                                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                                                </svg>
                                                Dữ liệu Form
                                            </h4>
                                            <div className="form-data-grid">
                                                {Object.entries(sub.form_data || {}).map(([key, value]) => (
                                                    <div key={key} className="form-data-item">
                                                        <div className="form-data-key">{key}</div>
                                                        <div className="form-data-value">{String(value)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="detail-section">
                                            <h4>
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                                    <circle cx="12" cy="7" r="4"/>
                                                </svg>
                                                Thông tin Người dùng
                                            </h4>
                                            <div className="detail-grid">
                                                <div className="detail-item">
                                                    <span className="detail-label">IP Address:</span>
                                                    <span className="detail-value code">{sub.metadata?.ip_address || 'N/A'}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="detail-label">Thiết bị:</span>
                                                    <div className="device-badge-detail">
                                                        {getDeviceIcon(sub.metadata?.device_type)}
                                                        <span>{sub.metadata?.device_type || 'N/A'}</span>
                                                    </div>
                                                </div>
                                                {sub.metadata?.user_agent && (
                                                    <div className="detail-item full-width">
                                                        <span className="detail-label">User Agent:</span>
                                                        <span className="detail-value code small">{sub.metadata.user_agent}</span>
                                                    </div>
                                                )}
                                                {sub.metadata?.utm_source && (
                                                    <div className="detail-item">
                                                        <span className="detail-label">UTM Source:</span>
                                                        <span className="detail-value">{sub.metadata.utm_source}</span>
                                                    </div>
                                                )}
                                            </div>
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
