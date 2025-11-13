import React, { useState } from 'react';
import { generateAIContent } from '../../services/aiService';
import './AIContentModal.css';

/**
 * AI Content Generator Modal
 * Allows users to generate AI content for text elements
 */
const AIContentModal = ({ isOpen, onClose, onInsert, elementType = 'paragraph', selectedText = '' }) => {
    const [context, setContext] = useState(selectedText || '');
    const [tone, setTone] = useState('professional');
    const [length, setLength] = useState('medium');
    const [style, setStyle] = useState('modern');
    const [language, setLanguage] = useState('vietnamese'); // Language selection
    const [generatedContent, setGeneratedContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiSource, setAiSource] = useState(''); // Track AI source (groq, cache, etc.)

    // Update context when selectedText changes
    React.useEffect(() => {
        if (selectedText) {
            setContext(selectedText);
        }
    }, [selectedText]);

    const handleGenerate = async () => {
        if (!context.trim()) {
            alert('Vui lòng nhập chủ đề hoặc nội dung bạn muốn tạo');
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/ai/generate-content`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    context,
                    type: elementType,
                    options: { tone, length, style, language }
                })
            });

            const data = await response.json();

            if (data.success) {
                setGeneratedContent(data.content);
                setAiSource(data.source);
            } else {
                throw new Error('Failed to generate content');
            }
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
                    <div>
                        <h3>Trợ Lý Tạo Nội Dung</h3>
                        <p className="ai-modal-subtitle">Tạo nội dung chuyên nghiệp chỉ trong vài giây</p>
                    </div>
                    <button className="ai-modal-close" onClick={handleClose}>×</button>
                </div>

                <div className="ai-modal-body">
                    {/* Context Input */}
                    <div className="ai-form-group">
                        <label>
                            Bạn muốn viết gì?
                            {selectedText && <span className="ai-label-hint">Đã chọn text</span>}
                        </label>
                        <input
                            type="text"
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
                            placeholder="VD: Giới thiệu khóa học marketing online, sản phẩm công nghệ..."
                            className="ai-input"
                        />
                        <small className="ai-input-hint">
                            Mẹo: Mô tả càng rõ ràng, nội dung tạo ra càng chính xác
                        </small>
                    </div>

                    {/* Options */}
                    <div className="ai-options-grid">
                        <div className="ai-form-group">
                            <label>Ngôn ngữ</label>
                            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="ai-select">
                                <option value="vietnamese">Tiếng Việt</option>
                                <option value="english">English</option>
                            </select>
                        </div>

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
                                <option value="short">Ngắn (1-2 câu)</option>
                                <option value="medium">Trung bình (3-5 câu)</option>
                                <option value="long">Dài (6-10 câu)</option>
                                <option value="very-long">Rất dài (10+ câu)</option>
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
                                Đang tạo nội dung...
                            </>
                        ) : (
                            <>Tạo Nội Dung</>
                        )}
                    </button>

                    {/* Generated Content */}
                    {generatedContent && (
                        <div className="ai-result">
                            <label>Nội dung đã tạo</label>
                            <textarea
                                value={generatedContent}
                                onChange={(e) => setGeneratedContent(e.target.value)}
                                className="ai-result-textarea"
                                rows="6"
                            />
                            <p className="ai-hint">
                                Bạn có thể chỉnh sửa nội dung trước khi chèn vào trang
                            </p>
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
