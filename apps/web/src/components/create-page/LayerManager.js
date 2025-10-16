import React, { useMemo } from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, ArrowUpCircle } from 'lucide-react'; // Thêm ArrowUpCircle
import { toast } from 'react-toastify';
import eventController from '../../utils/EventUtils';

const LayerManager = ({
                          pageData,
                          selectedIds = [],
                          onSelectElement,
                          onToggleVisibility,
                          onToggleLock,
                          onDeleteElement,
                          onDeleteChild,
                          viewMode = 'desktop',
                      }) => {
    const layers = useMemo(() => {
        return pageData.elements
            .filter(el => el.type === 'section' || el.type === 'popup' || el.isSection)
            .sort((a, b) => (a.position?.desktop?.y || 0) - (b.position?.desktop?.y || 0));
    }, [pageData.elements]);

    const selectLayer = (layer, e) => {
        e?.stopPropagation();
        onSelectElement?.([layer.id]);
        if (layer.type === 'popup') {
            if (layer.visible === false) {
                onToggleVisibility?.(layer.id, null);
                toast.info(`Bật hiển thị popup "${layer.componentData?.title || layer.id}"`);
            }
            eventController.dispatch('popup-open', { popupId: layer.id, isCanvas: true });
            const popupElement = document.querySelector(`[data-element-id="${layer.id}"]`);
            if (popupElement && layer.position?.[viewMode]?.y) {
                popupElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            toast.info(`Mở popup "${layer.componentData?.title || layer.id}"`);
        } else {
            if (layer.visible === false) {
                toast.warn(`Section "${layer.componentData?.title || layer.id}" đang ẩn!`);
                return;
            }
            const sectionElement = document.querySelector(`[data-element-id="${layer.id}"]`);
            if (!sectionElement) {
                toast.error(`Không tìm thấy section "${layer.id}"!`);
                return;
            }
            sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            toast.info(`Cuộn đến ${layer.componentData?.title || layer.id}`);
        }
    };

    const toggleVisibility = (layerId, childId, e) => {
        e?.stopPropagation();
        onToggleVisibility?.(layerId, childId);
    };

    const toggleLock = (layerId, childId, e) => {
        e?.stopPropagation();
        onToggleLock?.(layerId, childId);
    };

    const deleteLayer = (layerId, childId, e) => {
        e?.stopPropagation();
        if (!window.confirm('Bạn có chắc muốn xóa layer này?')) return;

        if (childId) {
            onDeleteChild?.(layerId, childId);
        } else {
            onDeleteElement?.(layerId);
        }
    };

    const getLayerName = (layer, index) => {
        const type = layer.type === 'popup' ? 'Popup' : 'Section';
        const name = layer.type === 'popup'
            ? layer.componentData?.title
            : layer.componentData?.name;

        return name && name !== 'Section' && name !== 'Popup'
            ? `${index + 1}. ${name}`
            : `${index + 1}. ${type}`;
    };

    return (
        <div className="layer-toolbar">
            <div className="layer-scroll">
                <div className="layer-tabs">
                    {layers.length > 0 ? (
                        layers.map((layer, idx) => {
                            const isActive = selectedIds.includes(layer.id);
                            const isHidden = layer.visible === false;
                            const name = getLayerName(layer, idx);

                            return (
                                <div
                                    key={layer.id}
                                    className={`layer-tab ${isActive ? 'active' : ''} ${isHidden ? 'hidden' : ''}`}
                                    onClick={(e) => selectLayer(layer, e)}
                                    title={name}
                                >
                                    <div className="layer-info">
                                        <span className="layer-num">{idx + 1}</span>
                                        <span className="layer-name">{name}</span>
                                    </div>

                                    <div className="layer-actions">
                                        <button
                                            onClick={(e) => toggleVisibility(layer.id, null, e)}
                                            title={isHidden ? 'Hiện' : 'Ẩn'}
                                        >
                                            {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                        <button
                                            onClick={(e) => toggleLock(layer.id, null, e)}
                                            title={layer.locked ? 'Mở khóa' : 'Khóa'}
                                        >
                                            {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
                                        </button>
                                        {layer.type === 'popup' && (
                                            <button
                                                className="popup-open"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (layer.visible === false) {
                                                        onToggleVisibility?.(layer.id, null);
                                                        toast.info(`Bật hiển thị popup "${layer.componentData?.title || layer.id}"`);
                                                    }
                                                    eventController.dispatch('popup-open', { popupId: layer.id, isCanvas: true });
                                                    toast.info(`Mở popup "${layer.componentData?.title || layer.id}"`);
                                                }}
                                                title="Mở Popup"
                                            >
                                                <ArrowUpCircle size={14} />
                                            </button>
                                        )}
                                        <button
                                            className="delete"
                                            onClick={(e) => deleteLayer(layer.id, null, e)}
                                            title="Xóa"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="empty">Chưa có layer</div>
                    )}
                </div>
            </div>

            <style>{`
                .layer-toolbar {
                    position: fixed;
                    bottom: 0;
                    width: 100%;
                    height: 56px;
                    z-index: 999;
                    background: linear-gradient(to top, #ffffff 0%, #fafbfc 100%);
                    border-top: 1px solid #e5e7eb;
                    box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.04);
                    display: flex;
                    align-items: center;
                }

                .layer-scroll {
                    width: 100%;
                    height: 100%;
                    overflow-x: auto;
                    overflow-y: hidden;
                    padding: 8px 16px;
                    display: flex;
                    align-items: center;
                }

                .layer-scroll::-webkit-scrollbar {
                    height: 4px;
                }

                .layer-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }

                .layer-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 2px;
                }

                .layer-scroll::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                .layer-tabs {
                    display: inline-flex;
                    gap: 6px;
                    padding: 6px 8px;
                    background: linear-gradient(135deg, #fefefe 0%, #f9fafb 100%);
                    border-radius: 12px;
                    box-shadow: 
                        0 2px 12px rgba(0, 0, 0, 0.05), 
                        0 0 0 1px rgba(0, 0, 0, 0.03),
                        inset 0 1px 0 rgba(255, 255, 255, 0.8);
                    min-width: min-content;
                }

                .layer-tab {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 6px 10px;
                    background: linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    white-space: nowrap;
                    border: 1px solid rgba(99, 102, 241, 0.1);
                }

                .layer-tab:hover {
                    background: linear-gradient(135deg, #dfe6ff 0%, #d4ddff 100%);
                    transform: translateY(-1px);
                    border-color: rgba(99, 102, 241, 0.2);
                    box-shadow: 0 3px 10px rgba(99, 102, 241, 0.15);
                }

                .layer-tab.active {
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    box-shadow: 
                        0 3px 12px rgba(99, 102, 241, 0.35), 
                        0 0 0 2px rgba(255, 255, 255, 0.5),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    border-color: transparent;
                }

                .layer-tab.hidden {
                    opacity: 0.5;
                }

                .layer-info {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .layer-num {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 22px;
                    height: 22px;
                    background: linear-gradient(135deg, #c7d2fe 0%, #a5b4fc 100%);
                    border-radius: 6px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #4338ca;
                    box-shadow: 0 2px 4px rgba(99, 102, 241, 0.15);
                }

                .layer-tab.active .layer-num {
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.2));
                    color: white;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                }

                .layer-name {
                    font-size: 13px;
                    font-weight: 600;
                    color: #4338ca;
                    max-width: 120px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .layer-tab.active .layer-name {
                    color: white;
                }

                .layer-tab.hidden .layer-name {
                    text-decoration: line-through;
                }

                .layer-actions {
                    display: flex;
                    gap: 3px;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .layer-tab:hover .layer-actions,
                .layer-tab.active .layer-actions {
                    opacity: 1;
                }

                .layer-actions button {
                    width: 26px;
                    height: 26px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: none;
                    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
                    border-radius: 7px;
                    cursor: pointer;
                    color: #6366f1;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                    box-shadow: 0 2px 4px rgba(99, 102, 241, 0.1);
                }

                .layer-actions button:hover {
                    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
                    color: white;
                    transform: scale(1.15) rotate(5deg);
                    box-shadow: 0 4px 8px rgba(99, 102, 241, 0.3);
                }

                .layer-actions button.popup-open:hover {
                    background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
                    box-shadow: 0 4px 8px rgba(16, 185, 129, 0.3);
                }

                .layer-actions button.delete:hover {
                    background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
                    box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3);
                }

                .layer-tab.active .layer-actions button {
                    background: rgba(255, 255, 255, 0.25);
                    color: white;
                    backdrop-filter: blur(10px);
                }

                .empty {
                    padding: 10px 16px;
                    color: #a5b4fc;
                    font-size: 13px;
                    font-weight: 500;
                }

                @media (max-width: 1400px) {
                    .layer-toolbar {
                        left: 60px;
                        right: 60px;
                    }
                }

                @media (max-width: 768px) {
                    .layer-toolbar {
                        height: 52px;
                        left: 0;
                        right: 0;
                    }

                    .layer-scroll {
                        padding: 8px 12px;
                    }

                    .layer-tabs {
                        gap: 5px;
                        padding: 5px 7px;
                    }

                    .layer-tab {
                        padding: 5px 9px;
                        gap: 6px;
                    }

                    .layer-num {
                        width: 20px;
                        height: 20px;
                        font-size: 10px;
                    }

                    .layer-name {
                        font-size: 12px;
                        max-width: 90px;
                    }

                    .layer-actions button {
                        width: 24px;
                        height: 24px;
                    }

                    .layer-actions button svg {
                        width: 13px;
                        height: 13px;
                    }
                }
            `}</style>
        </div>
    );
};

export default LayerManager;