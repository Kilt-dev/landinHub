import React, { useState, useEffect } from "react";
import { Eye, X, Monitor, Smartphone } from "lucide-react";
import "../styles/PreviewModal.css";

const MarketplacePreviewModal = ({ page, onClose }) => {
    const [viewMode, setViewMode] = useState("desktop");
    const [previewHtml, setPreviewHtml] = useState("");
    const [loading, setLoading] = useState(true);
    const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

    useEffect(() => {
        if (page) {
            loadPreview();
        }
    }, [page]);

    const loadPreview = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(
                `${API_BASE_URL}/api/marketplace/${page._id}/preview`,
                {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                }
            );

            if (response.ok) {
                const html = await response.text();
                setPreviewHtml(html);
            } else {
                // Fallback: Nếu không có API preview, hiển thị screenshot
                setPreviewHtml("");
            }
        } catch (error) {
            console.error("Error loading preview:", error);
            setPreviewHtml("");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = (e) => {
        e?.stopPropagation();
        onClose();
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose(e);
        }
    };

    if (!page) return null;

    return (
        <div className="modal1-overlay modal1-overlay--preview" onClick={handleOverlayClick}>
            <div className="modal1-content modal1-content--preview">
                <div className="modal1-body">
                    {/* TABS */}
                    <div className="preview-tabs">
                        <button
                            className={`preview-tab ${viewMode === "desktop" ? "active" : ""}`}
                            onClick={() => setViewMode("desktop")}
                        >
                            <Monitor size={16} style={{ marginRight: "6px" }} />
                            Desktop
                        </button>
                        <button
                            className={`preview-tab ${viewMode === "mobile" ? "active" : ""}`}
                            onClick={() => setViewMode("mobile")}
                        >
                            <Smartphone size={16} style={{ marginRight: "6px" }} />
                            Mobile
                        </button>
                        <button
                            onClick={handleClose}
                            className="btn-close"
                            aria-label="Đóng modal"
                            title="Đóng (Esc)"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* PREVIEW CONTAINER */}
                    <div className={`preview-container ${viewMode}`}>
                        <div className="preview-frame">
                            {loading ? (
                                <div className="preview-placeholder">
                                    <Eye size={48} style={{ color: "#cbd5e1", marginBottom: "16px" }} />
                                    <p>Đang tải preview...</p>
                                </div>
                            ) : previewHtml ? (
                                viewMode === "desktop" ? (
                                    // DESKTOP VIEW
                                    <div className="desktop-preview">
                                        <div className="desktop-header">
                                            <span className="control-btn red"></span>
                                            <span className="control-btn yellow"></span>
                                            <span className="control-btn green"></span>
                                            <p className="modal1-title" style={{
                                                margin: "6px 0 0 0",
                                                color: "#64748b",
                                                fontSize: "0.875rem",
                                                fontWeight: "500",
                                            }}>
                                                {page.title || "Marketplace Preview"}
                                            </p>
                                        </div>
                                        <iframe
                                            srcDoc={previewHtml}
                                            className="modal1-iframe"
                                            title="Desktop Preview"
                                            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                border: "none",
                                                overflow: "auto",
                                                scrollBehavior: "smooth",
                                            }}
                                        />
                                    </div>
                                ) : (
                                    // MOBILE VIEW
                                    <div className="mobile-preview">
                                        <div className="mobile-frame">
                                            <iframe
                                                srcDoc={previewHtml}
                                                className="modal1-iframe mobile-iframe"
                                                title="Mobile Preview"
                                                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                                style={{
                                                    width: "375px",
                                                    height: "667px",
                                                    border: "none",
                                                    transformOrigin: "top center",
                                                    overflowY: "auto",
                                                    overflowX: "hidden",
                                                    scrollBehavior: "smooth",
                                                    WebkitOverflowScrolling: "touch",
                                                }}
                                                onLoad={(e) => {
                                                    try {
                                                        const iframeDoc = e.target.contentDocument || e.target.contentWindow.document;
                                                        if (!iframeDoc) return;

                                                        // Inject viewport meta tag
                                                        if (!iframeDoc.querySelector('meta[name="viewport"]')) {
                                                            const viewport = iframeDoc.createElement('meta');
                                                            viewport.name = 'viewport';
                                                            viewport.content = 'width=375, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                                                            iframeDoc.head.appendChild(viewport);
                                                        }

                                                        // Inject mobile-specific CSS
                                                        const mobileStyles = iframeDoc.createElement('style');
                                                        mobileStyles.id = 'mobile-preview-styles';
                                                        mobileStyles.textContent = `
                                                            html, body {
                                                                width: 375px !important;
                                                                max-width: 375px !important;
                                                                overflow-x: hidden !important;
                                                            }
                                                            #lpb-canvas {
                                                                width: 375px !important;
                                                                max-width: 375px !important;
                                                            }
                                                            .lpb-section {
                                                                position: absolute !important;
                                                                width: 100% !important;
                                                                max-width: 375px !important;
                                                                left: 0 !important;
                                                                right: 0 !important;
                                                            }
                                                        `;

                                                        if (!iframeDoc.getElementById('mobile-preview-styles')) {
                                                            iframeDoc.head.appendChild(mobileStyles);
                                                        }
                                                    } catch (error) {
                                                        console.warn('Could not inject mobile styles:', error);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="mobile-home-button"></div>
                                    </div>
                                )
                            ) : (
                                // FALLBACK: Show screenshot if no HTML available
                                <div className="screenshot-preview">
                                    {page.main_screenshot ? (
                                        <img
                                            src={page.main_screenshot}
                                            alt={page.title}
                                            style={{
                                                width: "100%",
                                                height: "auto",
                                                objectFit: "contain",
                                                borderRadius: "8px"
                                            }}
                                        />
                                    ) : (
                                        <div className="preview-placeholder">
                                            <Eye size={48} style={{ color: "#cbd5e1", marginBottom: "16px" }} />
                                            <p>Không có nội dung preview.</p>
                                            <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginTop: "8px" }}>
                                                Vui lòng kiểm tra lại marketplace page.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarketplacePreviewModal;
