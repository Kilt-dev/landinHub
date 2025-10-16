import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import { X, Upload, Trash2, Search, Grid, List, Image as ImageIcon, Loader, Check } from 'lucide-react';
import { uploadImage, getPageImages, getUserImages, deleteImage, validateImageFile, compressImage } from '../../utils/imageService';

const ImageManagerModal = ({ isOpen, onClose, onSelectImage, pageId }) => {
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({});
    const [viewMode, setViewMode] = useState('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedImages, setSelectedImages] = useState([]);
    const [filterMode, setFilterMode] = useState('all');
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            loadImages();
        }
    }, [isOpen, filterMode, pageId]);

    const loadImages = async () => {
        setLoading(true);
        try {
            const response = filterMode === 'page' && pageId
                ? await getPageImages(pageId)
                : await getUserImages();
            setImages(response.data || []);
        } catch (error) {
            console.error('Error loading images:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            toast.error(
                error.message.includes('404')
                    ? 'Không tìm thấy endpoint ảnh. Kiểm tra server tại http://localhost:5000/api/images.'
                    : `Lỗi tải ảnh: ${error.message}`,
                { position: 'bottom-right' }
            );
            setImages([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploading(true);

        for (const file of files) {
            try {
                const validation = validateImageFile(file);
                if (!validation.valid) {
                    toast.warn(`${file.name}: ${validation.error}`, { position: 'bottom-right' });
                    continue;
                }

                const compressedFile = await compressImage(file);
                const response = await uploadImage(compressedFile, pageId, (progress) => {
                    setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
                });

                if (response.success) {
                    setImages(prev => [response.data, ...prev]);
                    toast.success(`Tải lên ${file.name} thành công`, { position: 'bottom-right' });
                }
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                toast.error(
                    error.message.includes('404')
                        ? 'Endpoint upload không tồn tại. Kiểm tra server tại http://localhost:5000/api/images/upload.'
                        : `Lỗi tải lên ${file.name}: ${error.message}`,
                    { position: 'bottom-right' }
                );
            }
        }

        setUploading(false);
        setUploadProgress({});
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDeleteImage = async (imageKey) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) return;

        try {
            const response = await deleteImage(imageKey);
            if (response.success) {
                setImages(prev => prev.filter(img => img.key !== imageKey));
                setSelectedImages(prev => prev.filter(key => key !== imageKey));
                toast.success('Xóa ảnh thành công', { position: 'bottom-right' });
            }
        } catch (error) {
            console.error('Error deleting image:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            toast.error(
                error.message.includes('404')
                    ? 'Endpoint xóa ảnh không tồn tại. Kiểm tra server tại http://localhost:5000/api/images.'
                    : `Lỗi xóa ảnh: ${error.message}`,
                { position: 'bottom-right' }
            );
        }
    };

    const handleSelectImage = (image) => {
        onSelectImage(image);
        onClose();
    };

    const toggleSelectImage = (imageKey) => {
        setSelectedImages(prev =>
            prev.includes(imageKey)
                ? prev.filter(key => key !== imageKey)
                : [...prev, imageKey]
        );
    };

    const handleDeleteSelected = async () => {
        if (selectedImages.length === 0) return;
        if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedImages.length} ảnh đã chọn?`)) return;

        for (const imageKey of selectedImages) {
            try {
                await deleteImage(imageKey);
                setImages(prev => prev.filter(img => img.key !== imageKey));
            } catch (error) {
                console.error(`Error deleting ${imageKey}:`, {
                    message: error.message,
                    response: error.response?.data,
                    status: error.response?.status
                });
                toast.error(`Lỗi xóa ảnh ${imageKey}: ${error.message}`, { position: 'bottom-right' });
            }
        }
        setSelectedImages([]);
        toast.success(`Đã xóa ${selectedImages.length} ảnh`, { position: 'bottom-right' });
    };

    const filteredImages = images.filter(img =>
        searchQuery === '' ||
        img.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '1200px',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>
                            Quản lý hình ảnh
                        </h2>
                        <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                            {filteredImages.length} ảnh
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                        <X size={24} color="#6b7280" />
                    </button>
                </div>

                {/* Toolbar */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: uploading ? '#9ca3af' : '#3b82f6',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {uploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
                        {uploading ? 'Đang tải lên...' : 'Tải ảnh lên'}
                    </button>

                    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
                        <button
                            onClick={() => setFilterMode('all')}
                            style={{
                                padding: '6px 12px',
                                backgroundColor: filterMode === 'all' ? '#ffffff' : 'transparent',
                                color: filterMode === 'all' ? '#111827' : '#6b7280',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '500',
                                boxShadow: filterMode === 'all' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            Tất cả
                        </button>
                        {pageId && (
                            <button
                                onClick={() => setFilterMode('page')}
                                style={{
                                    padding: '6px 12px',
                                    backgroundColor: filterMode === 'page' ? '#ffffff' : 'transparent',
                                    color: filterMode === 'page' ? '#111827' : '#6b7280',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    boxShadow: filterMode === 'page' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                }}
                            >
                                Trang này
                            </button>
                        )}
                    </div>

                    <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
                        <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm ảnh..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px 8px 36px',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{
                                padding: '6px',
                                backgroundColor: viewMode === 'grid' ? '#ffffff' : 'transparent',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            <Grid size={16} color={viewMode === 'grid' ? '#111827' : '#6b7280'} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{
                                padding: '6px',
                                backgroundColor: viewMode === 'list' ? '#ffffff' : 'transparent',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                            }}
                        >
                            <List size={16} color={viewMode === 'list' ? '#111827' : '#6b7280'} />
                        </button>
                    </div>

                    {selectedImages.length > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: '#ef4444',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Trash2 size={16} />
                            Xóa ({selectedImages.length})
                        </button>
                    )}
                </div>

                <div style={{
                    flex: 1,
                    overflow: 'auto',
                    padding: '24px'
                }}>
                    {loading ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '12px' }}>
                            <Loader size={32} className="animate-spin" color="#3b82f6" />
                            <p style={{ margin: 0, color: '#6b7280' }}>Đang tải ảnh...</p>
                        </div>
                    ) : filteredImages.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', flexDirection: 'column', gap: '12px' }}>
                            <ImageIcon size={48} color="#d1d5db" />
                            <p style={{ margin: 0, color: '#6b7280', fontSize: '16px' }}>
                                {searchQuery ? 'Không tìm thấy ảnh nào' : 'Chưa có ảnh nào'}
                            </p>
                            {!searchQuery && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        marginTop: '12px',
                                        padding: '10px 20px',
                                        backgroundColor: '#3b82f6',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Tải ảnh đầu tiên
                                </button>
                            )}
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                            gap: '16px'
                        }}>
                            {filteredImages.map(image => (
                                <div
                                    key={image.key}
                                    style={{
                                        position: 'relative',
                                        aspectRatio: '1',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        border: selectedImages.includes(image.key) ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        backgroundColor: '#f9fafb'
                                    }}
                                    onClick={() => handleSelectImage(image)}
                                >
                                    <img
                                        src={image.url}
                                        alt={image.name}
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover'
                                        }}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
                                        }}
                                    />
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelectImage(image.key);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            left: '8px',
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '6px',
                                            backgroundColor: selectedImages.includes(image.key) ? '#3b82f6' : '#ffffff',
                                            border: selectedImages.includes(image.key) ? 'none' : '2px solid #d1d5db',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {selectedImages.includes(image.key) && <Check size={14} color="#ffffff" />}
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteImage(image.key);
                                        }}
                                        style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                            backdropFilter: 'blur(4px)',
                                            border: 'none',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            opacity: 0,
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                    >
                                        <Trash2 size={14} color="#ffffff" />
                                    </button>
                                    <div style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        left: 0,
                                        right: 0,
                                        background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                                        padding: '8px',
                                        color: '#ffffff',
                                        fontSize: '11px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {image.name}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredImages.map(image => (
                                <div
                                    key={image.key}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '16px',
                                        padding: '12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e5e7eb',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        backgroundColor: selectedImages.includes(image.key) ? '#eff6ff' : '#ffffff'
                                    }}
                                    onClick={() => handleSelectImage(image)}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = selectedImages.includes(image.key) ? '#eff6ff' : '#f9fafb'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = selectedImages.includes(image.key) ? '#eff6ff' : '#ffffff'}
                                >
                                    <div
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelectImage(image.key);
                                        }}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '4px',
                                            backgroundColor: selectedImages.includes(image.key) ? '#3b82f6' : '#ffffff',
                                            border: selectedImages.includes(image.key) ? 'none' : '2px solid #d1d5db',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}
                                    >
                                        {selectedImages.includes(image.key) && <Check size={12} color="#ffffff" />}
                                    </div>
                                    <img
                                        src={image.url}
                                        alt={image.name}
                                        style={{
                                            width: '60px',
                                            height: '60px',
                                            objectFit: 'cover',
                                            borderRadius: '6px',
                                            flexShrink: 0
                                        }}
                                        onError={(e) => {
                                            e.target.src = 'https://via.placeholder.com/60?text=Image+Error';
                                        }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {image.name}
                                        </p>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                                            {(image.size / 1024).toFixed(2)} KB • {new Date(image.lastModified).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteImage(image.key);
                                        }}
                                        style={{
                                            padding: '8px',
                                            backgroundColor: 'transparent',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <Trash2 size={16} color="#ef4444" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {Object.keys(uploadProgress).length > 0 && (
                    <div style={{
                        padding: '16px 24px',
                        borderTop: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb'
                    }}>
                        {Object.entries(uploadProgress).map(([fileName, progress]) => (
                            <div key={fileName} style={{ marginBottom: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontSize: '13px', color: '#374151' }}>{fileName}</span>
                                    <span style={{ fontSize: '13px', color: '#6b7280' }}>{progress}%</span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '6px',
                                    backgroundColor: '#e5e7eb',
                                    borderRadius: '3px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${progress}%`,
                                        height: '100%',
                                        backgroundColor: '#3b82f6',
                                        transition: 'width 0.3s ease'
                                    }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>
                {`
                    @keyframes spin {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    .animate-spin {
                        animation: spin 1s linear infinite;
                    }
                    div:hover button {
                        opacity: 1 !important;
                    }
                `}
            </style>
        </div>
    );
};
export default ImageManagerModal;