import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Copy, RefreshCw, Wand2, Languages, CheckCheck } from 'lucide-react';
import './TextContextMenu.css';

/**
 * Context Menu cho Text Elements
 * Cho phép tạo nội dung nhanh với AI khi right-click vào text
 */
const TextContextMenu = ({ x, y, element, onClose, onUpdate, onGenerate }) => {
    const [loading, setLoading] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    const handleAction = async (action) => {
        setSelectedAction(action);
        setLoading(true);

        try {
            let prompt = '';
            const currentText = element.componentData?.text || element.content || '';

            switch (action) {
                case 'improve':
                    prompt = `Cải thiện và làm cho đoạn văn sau hấp dẫn hơn, giữ nguyên ý nghĩa:\n\n${currentText}`;
                    break;
                case 'shorter':
                    prompt = `Viết lại đoạn văn sau ngắn gọn hơn nhưng vẫn giữ đầy đủ ý nghĩa:\n\n${currentText}`;
                    break;
                case 'longer':
                    prompt = `Mở rộng và làm chi tiết hơn đoạn văn sau:\n\n${currentText}`;
                    break;
                case 'professional':
                    prompt = `Viết lại đoạn văn sau theo phong cách chuyên nghiệp, trang trọng:\n\n${currentText}`;
                    break;
                case 'casual':
                    prompt = `Viết lại đoạn văn sau theo phong cách thân thiện, gần gũi:\n\n${currentText}`;
                    break;
                case 'translate_en':
                    prompt = `Translate the following text to English:\n\n${currentText}`;
                    break;
                case 'translate_vi':
                    prompt = `Dịch đoạn văn sau sang tiếng Việt:\n\n${currentText}`;
                    break;
                case 'fix_grammar':
                    prompt = `Sửa lỗi chính tả và ngữ pháp trong đoạn văn sau:\n\n${currentText}`;
                    break;
                default:
                    break;
            }

            if (onGenerate) {
                await onGenerate(prompt, element);
            }

            onClose();
        } catch (error) {
            console.error('Error generating content:', error);
            alert('Có lỗi xảy ra khi tạo nội dung. Vui lòng thử lại.');
        } finally {
            setLoading(false);
            setSelectedAction(null);
        }
    };

    const menuItems = [
        {
            id: 'improve',
            icon: <Wand2 size={16} />,
            label: 'Cải thiện nội dung',
            description: 'Làm cho văn bản hấp dẫn hơn'
        },
        {
            id: 'shorter',
            icon: <RefreshCw size={16} />,
            label: 'Rút ngắn',
            description: 'Viết lại ngắn gọn hơn'
        },
        {
            id: 'longer',
            icon: <RefreshCw size={16} />,
            label: 'Mở rộng',
            description: 'Thêm chi tiết'
        },
        { divider: true },
        {
            id: 'professional',
            icon: <Sparkles size={16} />,
            label: 'Phong cách chuyên nghiệp',
            description: 'Trang trọng, nghiêm túc'
        },
        {
            id: 'casual',
            icon: <Sparkles size={16} />,
            label: 'Phong cách thân thiện',
            description: 'Gần gũi, dễ hiểu'
        },
        { divider: true },
        {
            id: 'translate_en',
            icon: <Languages size={16} />,
            label: 'Dịch sang tiếng Anh',
            description: 'Translate to English'
        },
        {
            id: 'translate_vi',
            icon: <Languages size={16} />,
            label: 'Dịch sang tiếng Việt',
            description: 'Translate to Vietnamese'
        },
        { divider: true },
        {
            id: 'fix_grammar',
            icon: <CheckCheck size={16} />,
            label: 'Sửa lỗi chính tả',
            description: 'Kiểm tra và sửa lỗi'
        }
    ];

    return (
        <div
            ref={menuRef}
            className="text-context-menu"
            style={{
                position: 'fixed',
                left: `${x}px`,
                top: `${y}px`,
                zIndex: 10000
            }}
        >
            <div className="text-context-menu-header">
                <Sparkles size={16} style={{ color: '#3b82f6' }} />
                <span>AI Content Assistant</span>
            </div>

            <div className="text-context-menu-items">
                {menuItems.map((item, index) => {
                    if (item.divider) {
                        return <div key={`divider-${index}`} className="text-context-menu-divider" />;
                    }

                    const isLoading = loading && selectedAction === item.id;

                    return (
                        <button
                            key={item.id}
                            className={`text-context-menu-item ${isLoading ? 'loading' : ''}`}
                            onClick={() => handleAction(item.id)}
                            disabled={loading}
                        >
                            <div className="text-context-menu-item-icon">
                                {item.icon}
                            </div>
                            <div className="text-context-menu-item-content">
                                <div className="text-context-menu-item-label">
                                    {item.label}
                                </div>
                                <div className="text-context-menu-item-description">
                                    {item.description}
                                </div>
                            </div>
                            {isLoading && (
                                <div className="text-context-menu-item-spinner">
                                    <div className="spinner" />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="text-context-menu-footer">
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                    Powered by AI • Nhấn ESC để đóng
                </span>
            </div>
        </div>
    );
};

export default TextContextMenu;
