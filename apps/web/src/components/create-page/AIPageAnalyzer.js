import React, { useState } from 'react';
import { analyzePageWithAI } from '../../services/aiService';
import './AIPageAnalyzer.css';

/**
 * AI Page Analyzer
 * Analyzes the entire landing page and provides scores, strengths, weaknesses, and suggestions
 */
const AIPageAnalyzer = ({ isOpen, onClose, pageData }) => {
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzePageWithAI(pageData);
            setAnalysis(result);
        } catch (error) {
            alert('Không thể phân tích trang. Vui lòng thử lại.');
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleClose = () => {
        setAnalysis(null);
        onClose();
    };

    const getScoreColor = (score) => {
        if (score >= 8) return '#10b981';
        if (score >= 6) return '#f59e0b';
        return '#ef4444';
    };

    const getScoreLabel = (score) => {
        if (score >= 8) return 'Tuyệt vời';
        if (score >= 6) return 'Khá tốt';
        if (score >= 4) return 'Trung bình';
        return 'Cần cải thiện';
    };

    if (!isOpen) return null;

    return (
        <div className="ai-analyzer-overlay" onClick={handleClose}>
            <div className="ai-analyzer-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ai-analyzer-header">
                    <h3>🎯 AI Page Analyzer</h3>
                    <button className="ai-analyzer-close" onClick={handleClose}>✕</button>
                </div>

                <div className="ai-analyzer-body">
                    {!analysis && !isAnalyzing && (
                        <div className="ai-analyzer-intro">
                            <div className="ai-analyzer-icon">🤖</div>
                            <h4>Đánh giá Landing Page của bạn</h4>
                            <p>AI sẽ phân tích toàn bộ trang và đưa ra:</p>
                            <ul>
                                <li>✅ Điểm số chi tiết (Cấu trúc, Nội dung, Thiết kế, Chuyển đổi)</li>
                                <li>💪 Điểm mạnh của trang</li>
                                <li>⚠️ Điểm cần cải thiện</li>
                                <li>💡 Gợi ý cụ thể để tối ưu</li>
                            </ul>
                            <button onClick={handleAnalyze} className="ai-analyzer-btn-start">
                                Bắt đầu phân tích
                            </button>
                        </div>
                    )}

                    {isAnalyzing && (
                        <div className="ai-analyzer-loading">
                            <div className="ai-analyzer-spinner"></div>
                            <h4>Đang phân tích trang...</h4>
                            <p>AI đang đánh giá cấu trúc, nội dung và thiết kế của bạn</p>
                        </div>
                    )}

                    {analysis && (
                        <div className="ai-analyzer-results">
                            {/* Overall Score */}
                            <div className="ai-overall-score">
                                <div className="ai-score-circle">
                                    <svg width="120" height="120" viewBox="0 0 120 120">
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="54"
                                            fill="none"
                                            stroke="#f3f4f6"
                                            strokeWidth="8"
                                        />
                                        <circle
                                            cx="60"
                                            cy="60"
                                            r="54"
                                            fill="none"
                                            stroke={getScoreColor(analysis.overall_score / 10)}
                                            strokeWidth="8"
                                            strokeDasharray={`${(analysis.overall_score / 100) * 339.292} 339.292`}
                                            strokeLinecap="round"
                                            transform="rotate(-90 60 60)"
                                        />
                                    </svg>
                                    <div className="ai-score-text">
                                        <span className="ai-score-number">{analysis.overall_score}</span>
                                        <span className="ai-score-label">/100</span>
                                    </div>
                                </div>
                                <div className="ai-score-info">
                                    <h3>Tổng điểm Landing Page</h3>
                                    <p className="ai-score-status" style={{ color: getScoreColor(analysis.overall_score / 10) }}>
                                        {getScoreLabel(analysis.overall_score / 10)}
                                    </p>
                                </div>
                            </div>

                            {/* Detailed Scores */}
                            <div className="ai-detailed-scores">
                                <h4>Điểm chi tiết</h4>
                                <div className="ai-scores-grid">
                                    {Object.entries(analysis.scores).map(([key, score]) => {
                                        const labels = {
                                            structure: '🏗️ Cấu trúc',
                                            content: '📝 Nội dung',
                                            design: '🎨 Thiết kế',
                                            conversion: '🎯 Chuyển đổi'
                                        };
                                        return (
                                            <div key={key} className="ai-score-card">
                                                <div className="ai-score-card-header">
                                                    <span>{labels[key] || key}</span>
                                                    <strong style={{ color: getScoreColor(score) }}>
                                                        {score}/10
                                                    </strong>
                                                </div>
                                                <div className="ai-score-bar">
                                                    <div
                                                        className="ai-score-bar-fill"
                                                        style={{
                                                            width: `${(score / 10) * 100}%`,
                                                            backgroundColor: getScoreColor(score)
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Strengths */}
                            {analysis.strengths && analysis.strengths.length > 0 && (
                                <div className="ai-analysis-section ai-strengths">
                                    <h4>💪 Điểm mạnh</h4>
                                    <ul>
                                        {analysis.strengths.map((strength, index) => (
                                            <li key={index}>{strength}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Weaknesses */}
                            {analysis.weaknesses && analysis.weaknesses.length > 0 && (
                                <div className="ai-analysis-section ai-weaknesses">
                                    <h4>⚠️ Cần cải thiện</h4>
                                    <ul>
                                        {analysis.weaknesses.map((weakness, index) => (
                                            <li key={index}>{weakness}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Suggestions */}
                            {analysis.suggestions && analysis.suggestions.length > 0 && (
                                <div className="ai-analysis-section ai-suggestions">
                                    <h4>💡 Gợi ý cải thiện</h4>
                                    <div className="ai-suggestions-list">
                                        {analysis.suggestions.map((suggestion, index) => (
                                            <div
                                                key={index}
                                                className={`ai-suggestion-card ${suggestion.type}`}
                                            >
                                                <div className="ai-suggestion-badge">
                                                    {suggestion.type === 'critical' ? '🔴' : '🟡'}
                                                    {suggestion.type === 'critical' ? 'Quan trọng' : 'Cải thiện'}
                                                </div>
                                                <h5>{suggestion.title}</h5>
                                                <p>{suggestion.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button onClick={handleAnalyze} className="ai-analyzer-btn-reanalyze">
                                🔄 Phân tích lại
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AIPageAnalyzer;
