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

    // AWS Settings
    const [awsSettings, setAwsSettings] = useState({
        accessKeyId: '',
        secretAccessKey: '',
        region: 'ap-southeast-1', // Singapore
        s3Bucket: '',
        cloudFrontDistribution: '',
        route53HostedZone: ''
    });

    // Domain Settings
    const [domainSettings, setDomainSettings] = useState({
        customDomain: '',
        useSSL: true,
        certificateArn: ''
    });

    const [showAwsKeys, setShowAwsKeys] = useState(false);
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
                setAwsSettings(response.data.awsSettings || awsSettings);
                setDomainSettings(response.data.domainSettings || domainSettings);
            }
        } catch (error) {
            // No deployment yet - that's ok
            console.log('No deployment info yet');
        }
    };

    const handleSaveAwsSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/deployment/${pageId}/aws-settings`,
                { awsSettings, domainSettings },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('AWS settings đã được lưu!');
        } catch (error) {
            console.error('Error saving AWS settings:', error);
            alert('Không thể lưu settings. Vui lòng thử lại.');
        }
    };

    const handleDeploy = async () => {
        if (!awsSettings.accessKeyId || !awsSettings.secretAccessKey) {
            alert('Vui lòng cấu hình AWS credentials trước khi deploy!');
            return;
        }

        setDeploymentStatus('deploying');
        setDeployLogs([]);
        addLog('🚀 Bắt đầu quá trình deployment...');

        try {
            const token = localStorage.getItem('token');

            // Step 1: Build static HTML
            addLog('📦 Đang build static HTML...');
            const buildResponse = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/deployment/${pageId}/build`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            addLog('✅ Build HTML thành công!');

            // Step 2: Upload to S3
            addLog('☁️ Đang upload lên S3...');
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/deployment/${pageId}/upload-s3`,
                {
                    awsSettings,
                    htmlContent: buildResponse.data.html
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            addLog('✅ Upload S3 thành công!');

            // Step 3: Create/Update CloudFront Distribution
            addLog('🌐 Đang cấu hình CloudFront...');
            const cfResponse = await axios.post(
                `${process.env.REACT_APP_API_URL}/api/deployment/${pageId}/cloudfront`,
                { awsSettings, domainSettings },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            addLog('✅ CloudFront distribution đã được tạo!');

            // Step 4: Configure Route 53 (if custom domain)
            if (domainSettings.customDomain) {
                addLog('🔗 Đang cấu hình Route 53...');
                await axios.post(
                    `${process.env.REACT_APP_API_URL}/api/deployment/${pageId}/route53`,
                    {
                        awsSettings,
                        domainSettings,
                        distributionDomain: cfResponse.data.domain
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                addLog('✅ Route 53 đã được cấu hình!');
            }

            // Step 5: Invalidate CloudFront Cache
            addLog('🔄 Đang làm mới CloudFront cache...');
            await axios.post(
                `${process.env.REACT_APP_API_URL}/api/deployment/${pageId}/invalidate`,
                { distributionId: cfResponse.data.distributionId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            addLog('✅ Cache đã được invalidate!');

            addLog('🎉 Deployment hoàn tất!');
            setDeploymentStatus('deployed');
            setDeploymentInfo(cfResponse.data);

            fetchDeploymentInfo();

        } catch (error) {
            console.error('Deployment error:', error);
            addLog(`❌ Lỗi: ${error.response?.data?.message || error.message}`);
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
        alert('Đã copy vào clipboard!');
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
                    Deploy Landing Page
                </h1>
                <p className="deployment-subtitle">
                    Deploy "{pageData?.name}" lên AWS CloudFront + Route 53
                </p>
            </div>

            {/* AWS Documentation Banner */}
            <div className="info-banner">
                <AlertCircle size={20} />
                <div>
                    <strong>Cần trợ giúp với AWS?</strong>
                    <p>
                        Xem hướng dẫn chi tiết về cách lấy AWS Access Keys và cấu hình CloudFront + Route 53
                        <a href="/docs/aws-setup" target="_blank"> tại đây</a>
                    </p>
                </div>
            </div>

            {/* Current Status */}
            {deploymentInfo && (
                <div className="deployment-status-card">
                    <div className="status-header">
                        <h3>Trạng thái hiện tại</h3>
                        <span className={`status-badge ${deploymentStatus}`}>
                            {deploymentStatus === 'deployed' && '🟢 Đang hoạt động'}
                            {deploymentStatus === 'deploying' && '🟡 Đang deploy'}
                            {deploymentStatus === 'failed' && '🔴 Thất bại'}
                        </span>
                    </div>

                    {deploymentInfo.cloudFrontDomain && (
                        <div className="deployment-urls">
                            <div className="url-item">
                                <label>CloudFront URL:</label>
                                <div className="url-display">
                                    <a href={`https://${deploymentInfo.cloudFrontDomain}`} target="_blank" rel="noopener noreferrer">
                                        {deploymentInfo.cloudFrontDomain}
                                    </a>
                                    <button onClick={() => copyToClipboard(deploymentInfo.cloudFrontDomain)}>
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>

                            {domainSettings.customDomain && (
                                <div className="url-item">
                                    <label>Custom Domain:</label>
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
                                <span>📅 Deploy lần cuối: {new Date(deploymentInfo.lastDeployed).toLocaleString('vi-VN')}</span>
                                <span>🌍 Region: {awsSettings.region}</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* AWS Settings */}
            <div className="settings-section">
                <h2>
                    <Key size={20} />
                    AWS Credentials
                </h2>

                <div className="form-group">
                    <label>AWS Access Key ID *</label>
                    <div className="input-with-icon">
                        <input
                            type={showAwsKeys ? "text" : "password"}
                            value={awsSettings.accessKeyId}
                            onChange={(e) => setAwsSettings({...awsSettings, accessKeyId: e.target.value})}
                            placeholder="AKIA..."
                        />
                        <button
                            className="toggle-visibility"
                            onClick={() => setShowAwsKeys(!showAwsKeys)}
                        >
                            {showAwsKeys ? '🙈' : '👁️'}
                        </button>
                    </div>
                </div>

                <div className="form-group">
                    <label>AWS Secret Access Key *</label>
                    <input
                        type={showAwsKeys ? "text" : "password"}
                        value={awsSettings.secretAccessKey}
                        onChange={(e) => setAwsSettings({...awsSettings, secretAccessKey: e.target.value})}
                        placeholder="wJalrXUtnFEMI/K7MDENG..."
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>AWS Region</label>
                        <select
                            value={awsSettings.region}
                            onChange={(e) => setAwsSettings({...awsSettings, region: e.target.value})}
                        >
                            <option value="ap-southeast-1">Singapore (ap-southeast-1)</option>
                            <option value="us-east-1">N. Virginia (us-east-1)</option>
                            <option value="us-west-2">Oregon (us-west-2)</option>
                            <option value="eu-west-1">Ireland (eu-west-1)</option>
                            <option value="ap-northeast-1">Tokyo (ap-northeast-1)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>S3 Bucket Name (Tùy chọn)</label>
                        <input
                            type="text"
                            value={awsSettings.s3Bucket}
                            onChange={(e) => setAwsSettings({...awsSettings, s3Bucket: e.target.value})}
                            placeholder="my-landing-pages-bucket"
                        />
                        <small>Để trống để tự động tạo bucket mới</small>
                    </div>
                </div>

                <button className="btn-save" onClick={handleSaveAwsSettings}>
                    <CheckCircle size={16} />
                    Lưu AWS Settings
                </button>
            </div>

            {/* Domain Settings */}
            <div className="settings-section">
                <h2>
                    <Link size={20} />
                    Domain Configuration
                </h2>

                <div className="form-group">
                    <label>Custom Domain (Tùy chọn)</label>
                    <input
                        type="text"
                        value={domainSettings.customDomain}
                        onChange={(e) => setDomainSettings({...domainSettings, customDomain: e.target.value})}
                        placeholder="landing.yourdomain.com"
                    />
                    <small>Để trống để sử dụng CloudFront domain mặc định</small>
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            checked={domainSettings.useSSL}
                            onChange={(e) => setDomainSettings({...domainSettings, useSSL: e.target.checked})}
                        />
                        <span>Sử dụng SSL/TLS (HTTPS) - Khuyến nghị</span>
                    </label>
                </div>

                {domainSettings.customDomain && (
                    <div className="form-group">
                        <label>ACM Certificate ARN (Tùy chọn)</label>
                        <input
                            type="text"
                            value={domainSettings.certificateArn}
                            onChange={(e) => setDomainSettings({...domainSettings, certificateArn: e.target.value})}
                            placeholder="arn:aws:acm:us-east-1:123456789012:certificate/..."
                        />
                        <small>Để trống để tự động tạo certificate mới qua ACM</small>
                    </div>
                )}
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

                <a
                    href="/docs/aws-setup"
                    target="_blank"
                    className="btn-docs"
                >
                    <ExternalLink size={16} />
                    Hướng dẫn AWS Setup
                </a>
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
