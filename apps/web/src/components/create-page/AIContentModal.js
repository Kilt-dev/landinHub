import React, { useState } from 'react';
import { generateAIContent } from '../../services/aiService';
import './AIContentModal.css';

/**
 * AI Content Generator Modal
 * Allows users to generate AI content for text elements
 */
const AIContentModal = ({ isOpen, onClose, onInsert, elementType = 'paragraph' }) => {
    const [context, setContext] = useState('');
    const [tone, setTone] = useState('professional');
    const [length, setLength] = useState('medium');
    const [style, setStyle] = useState('modern');
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!context.trim()) {
            alert('Vui lòng nhập chủ đề hoặc context');
            return;
        }

        setIsGenerating(true);
        try {
            const content = await generateAIContent(context, elementType, { tone, length, style });
            setGeneratedContent(content);
        } catch (error) {
            alert('Không thể tạo nội dung. Vui lòng thử lại.');
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleInsert = () => {
        if (generatedContent) {
            onInsert(generatedContent);
            handleClose();
        }
    };

    const handleClose = () => {
        setContext('');
        setGeneratedContent('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="ai-content-modal-overlay" onClick={handleClose}>
            <div className="ai-content-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ai-modal-header">
                    <h3>🤖 AI Content Generator</h3>
                    <button className="ai-modal-close" onClick={handleClose}>✕</button>
                </div>

                <div className="ai-modal-body">
                    {/* Context Input */}
                    <div className="ai-form-group">
                        <label>Chủ đề / Nội dung bạn muốn tạo</label>
                        <input
                            type="text"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="VD: Giới thiệu khóa học marketing online"
                            className="ai-input"
                        />
                    </div>

                    {/* Options */}
                    <div className="ai-options-grid">
                        <div className="ai-form-group">
                            <label>Giọng điệu</label>
                            <select value={tone} onChange={(e) => setTone(e.target.value)} className="ai-select">
                                <option value="professional">Chuyên nghiệp</option>
                                <option value="friendly">Thân thiện</option>
                                <option value="casual">Tự nhiên</option>
                                <option value="formal">Trang trọng</option>
                                <option value="enthusiastic">Nhiệt tình</option>
                            </select>
                        </div>

                        <div className="ai-form-group">
                            <label>Độ dài</label>
                            <select value={length} onChange={(e) => setLength(e.target.value)} className="ai-select">
                                <option value="short">Ngắn</option>
                                <option value="medium">Vừa</option>
                                <option value="long">Dài</option>
                            </select>
                        </div>

                        <div className="ai-form-group">
                            <label>Phong cách</label>
                            <select value={style} onChange={(e) => setStyle(e.target.value)} className="ai-select">
                                <option value="modern">Hiện đại</option>
                                <option value="classic">Cổ điển</option>
                                <option value="minimalist">Tối giản</option>
                                <option value="creative">Sáng tạo</option>
                            </select>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="ai-generate-btn"
                    >
                        {isGenerating ? (
                            <>
                                <div className="ai-spinner"></div>
                                Đang tạo...
                            </>
                        ) : (
                            <>✨ Tạo nội dung với AI</>
                        )}
                    </button>

                    {/* Generated Content */}
                    {generatedContent && (
                        <div className="ai-result">
                            <label>Nội dung được tạo:</label>
                            <textarea
                                value={generatedContent}
                                onChange={(e) => setGeneratedContent(e.target.value)}
                                className="ai-result-textarea"
                                rows="6"
                            />
                            <p className="ai-hint">💡 Bạn có thể chỉnh sửa nội dung trước khi chèn vào trang</p>
                        </div>
                    )}
                </div>

                <div className="ai-modal-footer">
                    <button onClick={handleClose} className="ai-btn-cancel">
                        Hủy
                    </button>
                    <button
                        onClick={handleInsert}
                        disabled={!generatedContent}
                        className="ai-btn-insert"
                    >
                        Chèn vào trang
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIContentModal;
