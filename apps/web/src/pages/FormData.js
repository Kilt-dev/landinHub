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
            alert('KhÙng th√ c≠p nh≠t tr°ng th·i. Vui lÚng thÌ l°i.');
        }
    };

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedSubmissions.length === 0) {
            alert('Vui lÚng chÕn Ìt nh•t mŸt submission √ xÛa');
            return;
        }

        if (!window.confirm(`B°n cÛ chØc mu—n xÛa ${selectedSubmissions.length} submissions?`)) {
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
            alert('KhÙng th√ xÛa submissions. Vui lÚng thÌ l°i.');
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
                alert('KhÙng cÛ dÔ li«u √ export');
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
            alert('KhÙng th√ export dÔ li«u. Vui lÚng thÌ l°i.');
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
            new: 'M€i',
            read: '„ Õc',
            replied: '„ tr£ l›i',
            archived: 'L∞u trÔ',
            spam: 'Spam'
        };
        return labels[status] || status;
    };

    return (
        <div className="formdata-container">
            {/* Header */}
            <div className="formdata-header">
                <div className="formdata-header-left">
                    <h1>Qu£n l˝ Form Submissions</h1>
                    <p className="formdata-subtitle">
                        Theo dıi v‡ qu£n l˝ t•t c£ dÔ li«u tÎ landing pages cÁa b°n
                    </p>
                </div>
                <div className="formdata-header-actions">
                    <button className="btn-export" onClick={() => handleExport()}>
                        <span>= </span> Export CSV
                    </button>
                    <button className="btn-refresh" onClick={fetchSubmissions}>
                        <span>=</span> L‡m m€i
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="formdata-stats">
                <div className="stat-card stat-total">
                    <div className="stat-icon">=Ï</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">T’ng submissions</div>
                    </div>
                </div>
                <div
                    className="stat-card stat-new"
                    onClick={() => setFilters({ ...filters, status: filters.status === 'new' ? '' : 'new' })}
                >
                    <div className="stat-icon">(</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.new}</div>
                        <div className="stat-label">M€i</div>
                    </div>
                </div>
                <div
                    className="stat-card stat-read"
                    onClick={() => setFilters({ ...filters, status: filters.status === 'read' ? '' : 'read' })}
                >
                    <div className="stat-icon">=A</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.read}</div>
                        <div className="stat-label">„ Õc</div>
                    </div>
                </div>
                <div
                    className="stat-card stat-replied"
                    onClick={() => setFilters({ ...filters, status: filters.status === 'replied' ? '' : 'replied' })}
                >
                    <div className="stat-icon">=¨</div>
                    <div className="stat-content">
                        <div className="stat-value">{stats.replied}</div>
                        <div className="stat-label">„ tr£ l›i</div>
                    </div>
                </div>
            </div>

            {/* Filters and Actions Bar */}
            <div className="formdata-toolbar">
                <div className="toolbar-left">
                    {selectedSubmissions.length > 0 && (
                        <>
                            <button className="btn-bulk-action" onClick={handleBulkDelete}>
                                =— XÛa ({selectedSubmissions.length})
                            </button>
                            <button
                                className="btn-bulk-action"
                                onClick={() => {
                                    selectedSubmissions.forEach(id => handleStatusUpdate(id, 'archived'));
                                    setSelectedSubmissions([]);
                                }}
                            >
                                =¡ L∞u trÔ ({selectedSubmissions.length})
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
                        <option value="">T•t c£ tr°ng th·i</option>
                        <option value="new">M€i</option>
                        <option value="read">„ Õc</option>
                        <option value="replied">„ tr£ l›i</option>
                        <option value="archived">L∞u trÔ</option>
                        <option value="spam">Spam</option>
                    </select>
                    <div className="view-mode-toggle">
                        <button
                            className={viewMode === 'table' ? 'active' : ''}
                            onClick={() => setViewMode('table')}
                        >
                            =À
                        </button>
                        <button
                            className={viewMode === 'cards' ? 'active' : ''}
                            onClick={() => setViewMode('cards')}
                        >
                            =«
                        </button>
                    </div>
                </div>
            </div>

            {/* Submissions List */}
            {loading ? (
                <div className="formdata-loading">
                    <div className="spinner"></div>
                    <p>ang t£i dÔ li«u...</p>
                </div>
            ) : submissions.length === 0 ? (
                <div className="formdata-empty">
                    <div className="empty-icon">=Ì</div>
                    <h3>Ch∞a cÛ submissions n‡o</h3>
                    <p>Khi ng∞›i d˘ng gÌi form tÎ landing pages, dÔ li«u sΩ hi√n thÀ ﬂ ‚y</p>
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
                                <th>Th›i gian</th>
                                <th>Landing Page</th>
                                <th>DÔ li«u</th>
                                <th>Thiøt bÀ</th>
                                <th>Tr°ng th·i</th>
                                <th style={{ width: '100px' }}>Thao t·c</th>
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
                                        {submission.isRecent && <span className="badge-recent">M€i</span>}
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
                                            {submission.metadata?.device_type === 'mobile' && '=Ò'}
                                            {submission.metadata?.device_type === 'tablet' && '=Ú'}
                                            {submission.metadata?.device_type === 'desktop' && '=ª'}
                                            {submission.metadata?.device_type || 'S'}
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
                                            <option value="new">M€i</option>
                                            <option value="read">„ Õc</option>
                                            <option value="replied">„ tr£ l›i</option>
                                            <option value="archived">L∞u trÔ</option>
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
                                            {expandedSubmission === submission._id ? '=A Ûng' : '=A Xem'}
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
                                    Xem chi tiøt
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
                        ê Tr∞€c
                    </button>
                    <span>
                        Trang {currentPage} / {totalPages}
                    </span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Sau í
                    </button>
                </div>
            )}

            {/* Detail Modal */}
            {expandedSubmission && (
                <div className="submission-detail-modal" onClick={() => setExpandedSubmission(null)}>
                    <div className="submission-detail-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chi tiøt Submission</h3>
                            <button className="btn-close" onClick={() => setExpandedSubmission(null)}>
                                
                            </button>
                        </div>
                        <div className="modal-body">
                            {(() => {
                                const sub = submissions.find(s => s._id === expandedSubmission);
                                if (!sub) return null;

                                return (
                                    <>
                                        <div className="detail-section">
                                            <h4>ThÙng tin chung</h4>
                                            <p><strong>Landing Page:</strong> {sub.page_id?.name || 'Unknown'}</p>
                                            <p><strong>Th›i gian:</strong> {formatDate(sub.submitted_at)}</p>
                                            <p><strong>Tr°ng th·i:</strong> {getStatusLabel(sub.status)}</p>
                                        </div>

                                        <div className="detail-section">
                                            <h4>DÔ li«u Form</h4>
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
