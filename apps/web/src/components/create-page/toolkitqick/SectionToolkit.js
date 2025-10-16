import React, { useState, useCallback } from 'react';
import { Settings, Save, ArrowUp, ArrowDown, Eye, EyeOff, Copy, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';

const SectionToolkit = ({
                            element,
                            position,
                            onOpenProperties, // Hàm mở Properties Panel
                            onSaveTemplate,
                            onMoveUp,
                            onMoveDown,
                            onToggleVisibility,
                            onDelete,
                        }) => {
    const { id, visible = true } = element;

    const handleSettingsClick = useCallback(() => {
        if (typeof onOpenProperties === 'function') {
            onOpenProperties(element);
        } else {
            toast.error('Không thể mở properties');
        }
    }, [element, onOpenProperties]);

    const handleSaveTemplate = useCallback(() => {
        if (typeof onSaveTemplate === 'function') {
            onSaveTemplate(id);
            toast.success('Đã lưu section thành template!');
        }
    }, [id, onSaveTemplate]);

    const handleDelete = useCallback(() => {
        if (window.confirm('Bạn có chắc muốn xóa section này?')) {
            if (typeof onDelete === 'function') {
                onDelete(id);
                toast.success('Đã xóa section!');
            }
        }
    }, [id, onDelete]);

    const handleToggleVisibility = useCallback(() => {
        if (typeof onToggleVisibility === 'function') {
            onToggleVisibility(id);
            toast.success(visible ? 'Đã ẩn section!' : 'Đã hiện section!');
        }
    }, [id, visible, onToggleVisibility]);

    const handleMoveUp = useCallback(() => {
        if (typeof onMoveUp === 'function') {
            onMoveUp(id);
        }
    }, [id, onMoveUp]);

    const handleMoveDown = useCallback(() => {
        if (typeof onMoveDown === 'function') {
            onMoveDown(id);
        }
    }, [id, onMoveDown]);



    return (
        <>
            <div
                className="section-toolkit-wrapper"
                style={{
                    position: 'absolute',
                    top: position.y,
                    left: position.x - 52,
                    zIndex: 1002,
                }}
            >
                <div className="section-toolkit">
                    <button
                        onClick={handleSettingsClick}
                        className="toolkit-btn"
                        title="Properties"
                    >
                        <Settings size={18} />
                    </button>

                    <button
                        onClick={handleMoveUp}
                        className="toolkit-btn"
                        title="Di chuyển lên"
                    >
                        <ArrowUp size={18} />
                    </button>

                    <button
                        onClick={handleMoveDown}
                        className="toolkit-btn"
                        title="Di chuyển xuống"
                    >
                        <ArrowDown size={18} />
                    </button>

                    <div className="toolkit-divider" />

                    <button
                        onClick={handleToggleVisibility}
                        className="toolkit-btn"
                        title={visible ? 'Ẩn Section' : 'Hiện Section'}
                    >
                        {visible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>



                    <button
                        onClick={handleSaveTemplate}
                        className="toolkit-btn"
                        title="Lưu Template"
                    >
                        <Save size={18} />
                    </button>

                    <div className="toolkit-divider" />

                    <button
                        onClick={handleDelete}
                        className="toolkit-btn toolkit-btn-delete"
                        title="Xóa Section"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <style>{`
                .section-toolkit-wrapper {
                    pointer-events: none;
                }
                
                .section-toolkit {
                    pointer-events: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 8px;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.95) 100%);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border-radius: 14px;
                    box-shadow: 
                        0 4px 20px rgba(0, 0, 0, 0.08),
                        0 0 0 1px rgba(0, 0, 0, 0.05),
                        inset 0 1px 0 rgba(255, 255, 255, 0.8);
                    animation: toolkitFadeIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                
                .toolkit-btn {
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: transparent;
                    border: none;
                    border-radius: 10px;
                    cursor: pointer;
                    color: #475569;
                    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
                    position: relative;
                    overflow: hidden;
                }
                
                .toolkit-btn::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .toolkit-btn:hover {
                    background: rgba(59, 130, 246, 0.08);
                    color: #3b82f6;
                    transform: scale(1.1);
                }
                
                .toolkit-btn:hover::before {
                    opacity: 1;
                }
                
                .toolkit-btn:active {
                    transform: scale(0.95);
                    transition: all 0.1s ease;
                }
                
                .toolkit-btn-delete {
                    color: #64748b;
                }
                
                .toolkit-btn-delete:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                }
                
                .toolkit-btn-delete:hover::before {
                    background: radial-gradient(circle at center, rgba(239, 68, 68, 0.15) 0%, transparent 70%);
                }
                
                .toolkit-divider {
                    height: 1px;
                    background: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.08) 50%, transparent 100%);
                    margin: 4px 0;
                }
                
                @keyframes toolkitFadeIn {
                    from {
                        opacity: 0;
                        transform: translateX(-12px) scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0) scale(1);
                    }
                }
                
                .section-toolkit:hover {
                    box-shadow: 
                        0 8px 30px rgba(0, 0, 0, 0.12),
                        0 0 0 1px rgba(59, 130, 246, 0.15),
                        inset 0 1px 0 rgba(255, 255, 255, 0.9);
                }
            `}</style>
        </>
    );
};

export default SectionToolkit;