import React, { useState } from "react";
import { Eye, X, Monitor, Smartphone } from "lucide-react";
import "../styles/PreviewModal.css";

const PreviewModal = ({ selectedTemplate, setShowPreviewModal, setPreviewHtml, previewHtml }) => {
    const [viewMode, setViewMode] = useState("desktop");

    const handleClose = (e) => {
        e.stopPropagation();
        setShowPreviewModal(false);
        setPreviewHtml("");
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
                                        />
                                    </div>
                                ) : (
                                    // MOBILE VIEW
                                    <div className="mobile-preview">
                                        <div className="mobile-frame">
                                            <iframe
                                                srcDoc={previewHtml}
                                                className="modal1-iframe"
                                                title="Mobile Preview"
                                                sandbox="allow-scripts allow-same-origin allow-popups"
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