import React, { useState } from "react";
import { Eye, X, Monitor, Smartphone } from "lucide-react";
import "../styles/PreviewModal.css";

const PreviewModal = ({ selectedTemplate, setShowPreviewModal, setPreviewHtml, previewHtml, pageData }) => {
    const [viewMode, setViewMode] = useState("desktop");
    const [popupStates, setPopupStates] = useState({});

    // Extract popups from pageData
    const popups = pageData?.elements?.filter(el => el.type === 'popup') || [];

    const handleClose = (e) => {
        e.stopPropagation();
        setShowPreviewModal(false);
        setPreviewHtml("");
        setPopupStates({});
    };

    // Toggle popup in preview iframe
    const handleTogglePopup = (popupId) => {
        try {
            const iframe = document.querySelector('.modal1-iframe');
            if (iframe && iframe.contentWindow) {
                const win = iframe.contentWindow;
                if (win.LPB && win.LPB.popups) {
                    if (popupStates[popupId]) {
                        win.LPB.popups.close(popupId);
                        setPopupStates(prev => ({ ...prev, [popupId]: false }));
                    } else {
                        win.LPB.popups.open(popupId);
                        setPopupStates(prev => ({ ...prev, [popupId]: true }));
                    }
                }
            }
        } catch (error) {
            console.error('Error toggling popup:', error);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose(e);
        }
    };

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

                    {/* POPUP CONTROLS */}
                    {popups.length > 0 && (
                        <div style={{
                            padding: "8px 20px",
                            background: "#f9fafb",
                            borderBottom: "1px solid #e5e7eb",
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                            flexWrap: "wrap"
                        }}>
                            <span style={{ fontSize: "13px", color: "#6b7280", fontWeight: 500 }}>
                                Preview Popups:
                            </span>
                            {popups.map(popup => (
                                <button
                                    key={popup.id}
                                    onClick={() => handleTogglePopup(popup.id)}
                                    style={{
                                        padding: "4px 12px",
                                        fontSize: "12px",
                                        borderRadius: "6px",
                                        border: popupStates[popup.id] ? "1px solid #3b82f6" : "1px solid #d1d5db",
                                        background: popupStates[popup.id] ? "#eff6ff" : "#ffffff",
                                        color: popupStates[popup.id] ? "#3b82f6" : "#6b7280",
                                        cursor: "pointer",
                                        fontWeight: 500,
                                        transition: "all 0.2s ease"
                                    }}
                                >
                                    {popup.componentData?.title || popup.id}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* PREVIEW CONTAINER */}
                    <div className={`preview-container ${viewMode}`}>
                        <div className="preview-frame">
                            {previewHtml ? (
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
                                            {selectedTemplate?.name || "Template Preview"}
                                            </p>
                                        </div>
                                        <iframe
                                            srcDoc={previewHtml}
                                            className="modal1-iframe"
                                            title="Desktop Preview"
                                            sandbox="allow-scripts allow-same-origin allow-popups"
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
                                                    // Ensure mobile viewport after iframe loads
                                                    try {
                                                        const iframeDoc = e.target.contentDocument || e.target.contentWindow.document;
                                                        if (iframeDoc && !iframeDoc.querySelector('meta[name="viewport"]')) {
                                                            const viewport = iframeDoc.createElement('meta');
                                                            viewport.name = 'viewport';
                                                            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
                                                            iframeDoc.head.appendChild(viewport);
                                                        }
                                                    } catch (e) {
                                                        console.warn('Could not inject viewport meta tag:', e);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <div className="mobile-home-button"></div>
                                    </div>
                                )
                            ) : (
                                // PLACEHOLDER
                                <div className="preview-placeholder">
                                    <Eye size={48} style={{ color: "#cbd5e1", marginBottom: "16px" }} />
                                    <p>Không có nội dung để hiển thị.</p>
                                    <p style={{ fontSize: "0.875rem", color: "#9ca3af", marginTop: "8px" }}>
                                        Vui lòng kiểm tra file HTML hoặc API.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreviewModal;