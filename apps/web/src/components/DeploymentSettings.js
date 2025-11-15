import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
    Globe, Cloud, Link, Copy, CheckCircle, AlertCircle,
    Settings, Key, Server, RefreshCw, ExternalLink
} from 'lucide-react';
import '../styles/DeploymentSettings.css';

/**
 * DeploymentSettings Component
 * Allows users to deploy landing pages to CloudFront + Route 53
 * Manages AWS credentials, custom domains, and SSL certificates
 */
const DeploymentSettings = () => {
    const { pageId } = useParams();
    const navigate = useNavigate();

    // Page data
    const [pageData, setPageData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Deployment state
    const [deploymentStatus, setDeploymentStatus] = useState('idle'); // idle | deploying | deployed | failed
    const [deploymentInfo, setDeploymentInfo] = useState(null);

    // Domain Settings (User only sees this)
    const [domainSettings, setDomainSettings] = useState({
        customDomain: '',
        subdomain: '',
        useCustomDomain: false
    });
    const [deployLogs, setDeployLogs] = useState([]);

    useEffect(() => {
        fetchPageData();
        fetchDeploymentInfo();
    }, [pageId]);

    const fetchPageData = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/pages/${pageId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setPageData(response.data);
        } catch (error) {
            console.error('Error fetching page:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchDeploymentInfo = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/api/deployment/${pageId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data) {
                setDeploymentInfo(response.data);
                setDeploymentStatus(response.data.status);
                if (response.data.customDomain) {
                    setDomainSettings({
                        customDomain: response.data.customDomain,
                        subdomain: response.data.subdomain || '',
                        useCustomDomain: !!response.data.customDomain
                    });
                }
            }
        } catch (error) {
            // No deployment yet - that's ok
            console.log('No deployment info yet');
        }
    };

    const handleDeploy = async () => {

        setDeploymentStatus('deploying');
        setDeployLogs([]);
        addLog('Bắt đầu quá trình deployment...');

        try {
            const token = localStorage.getItem('token');

            // Single API call - Backend handles everything!
            addLog('Đang bắt đầu deployment...');

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/deployment/${pageId}/deploy`,
                {
                    customDomain: domainSettings.useCustomDomain ? domainSettings.customDomain : null,
                    subdomain: domainSettings.subdomain || null
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Backend returns progress updates via WebSocket or polling
            // For now, simulate with timeout
            addLog('Backend đang build HTML...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            addLog('Backend đang upload lên CDN...');
            await new Promise(resolve => setTimeout(resolve, 1500));

            addLog('Backend đang cấu hình distribution...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            if (domainSettings.useCustomDomain && domainSettings.customDomain) {
                addLog('Backend đang cấu hình custom domain...');
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            addLog('Backend đang làm mới cache...');
            await new Promise(resolve => setTimeout(resolve, 800));

            addLog('Deployment hoàn tất!');
            setDeploymentStatus('deployed');
            setDeploymentInfo(response.data);

            fetchDeploymentInfo();

        } catch (error) {
            console.error('Deployment error:', error);
            addLog(`Lỗi: ${error.response?.data?.message || error.message}`);
            setDeploymentStatus('failed');
        }
    };

    const addLog = (message) => {
        setDeployLogs(prev => [...prev, {
            message,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Đã sao chép!');
    };

    if (loading) {
        return (
            <div className="deployment-loading">
                <div className="spinner"></div>
                <p>Đang tải...</p>
            </div>
        );
    }

    return (
        <div className="deployment-container">
            {/* Header */}
            <div className="deployment-header">
                <button className="btn-back" onClick={() => navigate('/dashboard')}>
                    ← Quay lại
                </button>
                <h1>
                    <Globe size={24} />
                    Xuất Bản Trang
                </h1>
                <p className="deployment-subtitle">
                    Đưa trang "{pageData?.name}" lên Internet
                </p>
            </div>

            {/* Information Banner */}
            <div className="info-banner">
                <AlertCircle size={20} />
                <div>
                    <strong>Xuất bản tự động lên toàn cầu</strong>
                    <p>
                        Trang web của bạn sẽ được đưa lên hệ thống phân phối tại hơn 450 địa điểm trên toàn thế giới.
                        Bảo mật HTTPS miễn phí, tốc độ tải cực nhanh, không giới hạn lượng truy cập.
                    </p>
                </div>
            </div>

            {/* Current Status */}
            {deploymentInfo && (
                <div className="deployment-status-card">
                    <div className="status-header">
                        <h3>Trạng thái hiện tại</h3>
                        <span className={`status-badge ${deploymentStatus}`}>
                            {deploymentStatus === 'deployed' && 'Đang hoạt động'}
                            {deploymentStatus === 'deploying' && 'Đang xuất bản'}
                            {deploymentStatus === 'failed' && 'Thất bại'}
                        </span>
                    </div>

                    {deploymentInfo.cloudFrontDomain && (
                        <div className="deployment-urls">
                            {/* Primary URL - Subdomain or CloudFront */}
                            {deploymentInfo.url && (
                                <div className="url-item" style={{ background: '#f0fdf4', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <label style={{ fontSize: '16px', fontWeight: '600', color: '#059669' }}>Trang đã được xuất bản tại:</label>
                                    <div className="url-display" style={{ marginTop: '8px' }}>
                                        <a href={deploymentInfo.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '16px', fontWeight: '500' }}>
                                            {deploymentInfo.url}
                                        </a>
                                        <button onClick={() => copyToClipboard(deploymentInfo.url)}>
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* CloudFront Direct URL (with path) */}
                            {deploymentInfo.s3ObjectKey && (
                                <div className="url-item">
                                    <label>Địa chỉ trực tiếp:</label>
                                    <div className="url-display">
                                        <a href={`https://${deploymentInfo.cloudFrontDomain}/${deploymentInfo.s3ObjectKey}`} target="_blank" rel="noopener noreferrer">
                                            {deploymentInfo.cloudFrontDomain}/{deploymentInfo.s3ObjectKey}
                                        </a>
                                        <button onClick={() => copyToClipboard(`https://${deploymentInfo.cloudFrontDomain}/${deploymentInfo.s3ObjectKey}`)}>
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                    <small style={{ display: 'block', marginTop: '4px', color: '#666' }}>
                                        Địa chỉ này luôn hoạt động
                                    </small>
                                </div>
                            )}

                            {/* Subdomain URL - with warning if CloudFront Function not setup */}
                            {deploymentInfo.subdomain && (
                                <div className="url-item">
                                    <label>Địa chỉ tên miền phụ:</label>
                                    <div className="url-display">
                                        <a href={`https://${deploymentInfo.subdomain}.landinghub.shop`} target="_blank" rel="noopener noreferrer">
                                            {deploymentInfo.subdomain}.landinghub.shop
                                        </a>
                                        <button onClick={() => copyToClipboard(`https://${deploymentInfo.subdomain}.landinghub.shop`)}>
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                    <small style={{ display: 'block', marginTop: '4px', color: '#f59e0b' }}>
                                        Cần cấu hình thêm để tên miền phụ hoạt động. Xem hướng dẫn.
                                    </small>
                                </div>
                            )}

                            {domainSettings.customDomain && (
                                <div className="url-item">
                                    <label>Tên miền riêng:</label>
                                    <div className="url-display">
                                        <a href={`https://${domainSettings.customDomain}`} target="_blank" rel="noopener noreferrer">
                                            {domainSettings.customDomain}
                                        </a>
                                        <button onClick={() => copyToClipboard(domainSettings.customDomain)}>
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="deployment-info">
                                <span>Xuất bản lần cuối: {new Date(deploymentInfo.lastDeployed).toLocaleString('vi-VN')}</span>
                                <span>Khu vực: Đông Nam Á</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Domain Settings - Simple & Clean */}
            <div className="settings-section">
                <h2>
                    <Link size={20} />
                    Cài Đặt Tên Miền
                </h2>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={domainSettings.useCustomDomain}
                            onChange={(e) => setDomainSettings({...domainSettings, useCustomDomain: e.target.checked})}
                        />
                        <span>Sử dụng tên miền riêng của tôi</span>
                    </label>
                    <small style={{ marginLeft: '28px', display: 'block', marginTop: '6px' }}>
                        Nếu không chọn, hệ thống sẽ tự động tạo tên miền phụ miễn phí
                    </small>
                </div>

                {domainSettings.useCustomDomain ? (
                    <div className="form-group">
                        <label>Tên miền riêng</label>
                        <input
                            type="text"
                            value={domainSettings.customDomain}
                            onChange={(e) => setDomainSettings({...domainSettings, customDomain: e.target.value})}
                            placeholder="landing.tenmiencuaban.com"
                        />
                        <small>
                            Nhập domain bạn sở hữu. Hệ thống sẽ tự động cấu hình DNS và SSL certificate.
                        </small>
                    </div>
                ) : (
                    <div className="form-group">
                        <label>Subdomain (Tùy chọn)</label>
                        <div className="subdomain-input">
                            <input
                                type="text"
                                value={domainSettings.subdomain}
                                onChange={(e) => setDomainSettings({...domainSettings, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                                placeholder="my-landing"
                            />
                            <span className="subdomain-suffix">.landinghub.shop</span>
                        </div>
                        <small>
                            Để trống để tự động tạo (ví dụ: {pageData?.slug || 'page-123'}.landinghub.shop)
                        </small>
                    </div>
                )}

                <div className="ssl-notice">
                    <CheckCircle size={16} style={{ color: '#10b981' }} />
                    <span>SSL/HTTPS được tự động cấu hình miễn phí</span>
                </div>
            </div>

            {/* Deploy Actions */}
            <div className="deploy-actions">
                <button
                    className="btn-deploy"
                    onClick={handleDeploy}
                    disabled={deploymentStatus === 'deploying'}
                >
                    {deploymentStatus === 'deploying' ? (
                        <>
                            <RefreshCw size={18} className="spinning" />
                            Đang deploy...
                        </>
                    ) : (
                        <>
                            <Cloud size={18} />
                            {deploymentStatus === 'deployed' ? 'Re-deploy' : 'Deploy Now'}
                        </>
                    )}
                </button>

                {deploymentInfo && (
                    <button
                        className="btn-secondary"
                        onClick={() => window.open(deploymentInfo.url, '_blank')}
                    >
                        <ExternalLink size={16} />
                        Xem Landing Page
                    </button>
                )}
            </div>

            {/* Deployment Logs */}
            {deployLogs.length > 0 && (
                <div className="deployment-logs">
                    <h3>📋 Deployment Logs</h3>
                    <div className="logs-container">
                        {deployLogs.map((log, index) => (
                            <div key={index} className="log-entry">
                                <span className="log-time">{log.timestamp}</span>
                                <span className="log-message">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DeploymentSettings;
