import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { toast } from 'react-toastify';
import {
    Layers, Box, Square, FileText, Wrench,
    FileEdit, Image, File, Type,
    ChevronLeft, ChevronRight, Search, X,
    MousePointer2, Hand, Menu,
    Star, Heart, ArrowRight, Play, User,
    // Thêm các icon khác nếu cần
} from 'lucide-react';
import { EXTENDED_LIBRARY } from '../../constants/ExtendedLibrary';
import '../../styles/ComponentLibrary.css';

const ItemTypes = {
    ELEMENT: 'element',
};

// Ánh xạ Lucide Icons cho các tab
const TAB_ICONS = {
    sections: Layers,
    elements: Box,
    popups: Square,
    templates: FileText,
    advancedElements: Star,
    utilities: Wrench,
    content: FileEdit,
    media: Image,
    documents: File,
    fonts: Type,
};

// Hàm tạo section chuẩn với cấu trúc ladi-section và responsive sizing
const createStandardSection = (sectionData, yPosition = 0) => {
    return {
        id: `SECTION${Date.now()}`,
        type: 'section',
        componentData: {
            ...sectionData.json.componentData,
            className: 'ladi-section',
            structure: 'ladi-standard',
            title: sectionData.json.componentData?.title || sectionData.name,
        },
        position: {
            desktop: { x: 0, y: yPosition, z: 1 },
            tablet: { x: 0, y: yPosition, z: 1 },
            mobile: { x: 0, y: yPosition, z: 1 },
        },
        size: {
            width: 1200, // Desktop width
            height: sectionData.json.size?.height || 574,
        },
        mobileSize: {
            width: 375,
            height: sectionData.json.size?.height || 574,
        },
        tabletSize: {
            width: 768,
            height: sectionData.json.size?.height || 574,
        },
        styles: {
            width: '100%',
            maxWidth: '1200px',
            height: `${sectionData.json.size?.height || 574}px`,
            margin: '0 auto',
            position: 'relative',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
            ...sectionData.json.styles,
        },
        children: sectionData.json.children || [],
        isSection: true,
    };
};

// Hàm tính toán vị trí Y cho section mới
const calculateNextSectionPosition = (existingElements) => {
    const sections = existingElements.filter((el) => el.isSection || el.type === 'section');
    if (sections.length === 0) return 0;

    const lastSection = sections.reduce((latest, section) => {
        const sectionY = section.position?.desktop?.y || 0;
        const latestY = latest.position?.desktop?.y || 0;
        return sectionY > latestY ? section : latest;
    }, sections[0]);

    return (lastSection.position?.desktop?.y || 0) + (lastSection.size?.height || 574) + 20;
};

const ComponentLibrary = ({ isCollapsed, onToggle, onAddElement, onAddChild, pageData, onSelectElement }) => {
    const validTabs = [
        'sections',
        'elements',
        'advancedElements',
        'popups',
        'templates',
        'utilities',
        'content',
        'media',
        'documents',
        'fonts',
    ];

    const [activeTab, setActiveTab] = useState(() => {
        const firstValidTab = validTabs.find(tab => EXTENDED_LIBRARY[tab]?.subCategories?.length > 0);
        return firstValidTab || 'sections';
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState(null);
    const [activeSubcategory, setActiveSubcategory] = useState(null);

    const categories = useMemo(() => {
        return {
            sections: EXTENDED_LIBRARY.sections?.subCategories || [],
            elements: EXTENDED_LIBRARY.elements?.subCategories || [],
            advancedElements: EXTENDED_LIBRARY.advancedElements?.subCategories || [],
            popups: EXTENDED_LIBRARY.popups?.subCategories || [],
            templates: EXTENDED_LIBRARY.templates?.subCategories || [],
            utilities: EXTENDED_LIBRARY.utilities?.subCategories || [],
            content: EXTENDED_LIBRARY.content?.subCategories || [],
            media: EXTENDED_LIBRARY.media?.subCategories || [],
            documents: EXTENDED_LIBRARY.documents?.subCategories || [],
            fonts: EXTENDED_LIBRARY.fonts?.subCategories || [],
        };
    }, []);

    // Thiết lập activeCategory mặc định khi activeTab thay đổi
    useEffect(() => {
        const currentCategories = categories[activeTab] || [];
        if (currentCategories.length > 0 && !activeCategory) {
            setActiveCategory(currentCategories[0].id); // Chọn danh mục đầu tiên
        }
    }, [activeTab, categories, activeCategory]);

    const filteredItems = useMemo(() => {
        const currentCategory = categories[activeTab] || [];
        let items = [];

        if (searchTerm) {
            // Khi có tìm kiếm, hiển thị tất cả template phù hợp trong tab
            items = currentCategory.flatMap((cat) => cat.templates || []).filter((item) =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        } else if (activeSubcategory) {
            // Hiển thị template của subcategory được chọn
            const subcategory = currentCategory.find((cat) => cat.id === activeSubcategory);
            items = subcategory ? subcategory.templates || [] : [];
        } else if (activeCategory) {
            // Hiển thị template của category được chọn
            const category = currentCategory.find((cat) => cat.id === activeCategory);
            items = category ? category.templates || [] : [];
        } else {
            // Mặc định hiển thị template của danh mục đầu tiên
            const firstCategory = currentCategory[0];
            items = firstCategory ? firstCategory.templates || [] : [];
        }

        return items;
    }, [activeTab, activeCategory, activeSubcategory, searchTerm, categories]);

    // Component cho Elements (có thể kéo thả)
    const DraggableComponentItem = ({ item }) => {
        const [{ isDragging }, drag, preview] = useDrag(() => ({
            type: ItemTypes.ELEMENT,
            item: {
                id: item.id,
                isNew: true,
                json: {
                    type: item.json.type,
                    componentData: { ...item.json.componentData, title: item.json.componentData?.title || item.name },
                    size: item.json.size || { width: 200, height: 50 },
                    styles: item.json.styles || {},
                    children: item.json.children || [],
                },
            },
            end: (draggedItem, monitor) => {
                const dropResult = monitor.getDropResult();
                // Removed toast notification for cleaner UX
            },
            collect: (monitor) => ({
                isDragging: monitor.isDragging(),
            }),
        }));

        useEffect(() => {
            preview(document.createElement('div'), { captureDraggingState: true });
        }, [preview]);

        // Sử dụng dynamic import cho Lucide icons
        const getLucideIcon = (iconName) => {
            const iconMap = {
                Star,
                Heart,
                ArrowRight,
                Play,
                User,
                Square,
                Box,
                // Thêm các icon khác vào đây
            };
            return iconMap[iconName] || Box;
        };

        const IconComponent = typeof item.lucideIcon === 'string'
            ? getLucideIcon(item.lucideIcon)
            : (item.lucideIcon || Box);

        return (
            <div
                ref={drag}
                className={`lpb-template-item lpb-draggable-item ${isDragging ? 'lpb-template-item-dragging' : ''}`}
                style={{
                    opacity: isDragging ? 0.5 : 1,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    transform: isDragging ? 'rotate(2deg) scale(0.96)' : 'none',
                    transition: isDragging ? 'none' : 'all 0.2s ease',
                }}
            >
                {item.previewImage ? (
                    <img src={item.previewImage} alt={item.name} className="lpb-template-preview" />
                ) : (
                    <IconComponent className="lucide" />
                )}
                <span>{item.name}</span>
            </div>
        );
    };

    // Component cho Sections, Popups và Templates (chỉ click)
    const ClickableComponentItem = ({ item }) => {
        const [isClicking, setIsClicking] = useState(false);

        const handleClick = useCallback(async () => {
            setIsClicking(true);
            try {
                if (activeTab === 'sections') {
                    const nextYPosition = calculateNextSectionPosition(pageData?.elements || []);
                    const newSection = createStandardSection(item, nextYPosition);
                    await onAddElement(newSection);
                } else if (activeTab === 'popups' || item.json.type === 'popup') {
                    const newPopup = {
                        id: `POPUP-${Date.now()}`,
                        type: 'popup',
                        componentData: {
                            ...item.json.componentData,
                            title: item.json.componentData?.title || item.name,
                        },
                        position: {
                            desktop: { x: 100, y: 100, z: 1001 },
                            tablet: { x: 100, y: 100, z: 1001 },
                            mobile: { x: 50, y: 50, z: 1001 },
                        },
                        size: item.json.size || { width: 600, height: 400 },
                        mobileSize: { width: 340, height: 400 },
                        tabletSize: { width: 600, height: 400 },
                        styles: {
                            backgroundColor: item.json.styles?.backgroundColor || 'rgba(255, 255, 255, 0.95)',
                            borderRadius: item.json.styles?.borderRadius || '12px',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
                            padding: item.json.styles?.padding || '24px',
                            zIndex: 10000,
                            ...item.json.styles,
                        },
                        children: item.json.children || [],
                        visible: true,
                        locked: false,
                        isPopup: true,
                    };
                    await onAddElement(newPopup);
                    onSelectElement([newPopup.id]);
                } else {
                    await onAddChild(null, {
                        id: `${item.id}-${Date.now()}`,
                        type: item.json.type,
                        componentData: { ...item.json.componentData, title: item.json.componentData?.title || item.name },
                        position: {
                            desktop: { x: 20, y: 20, z: 1 },
                            tablet: { x: 20, y: 20, z: 1 },
                            mobile: { x: 10, y: 10, z: 1 },
                        },
                        size: item.json.size || { width: 200, height: 50 },
                        styles: item.json.styles || {},
                        children: item.json.children || [],
                    });
                }
            } catch (error) {
                toast.error(`Lỗi: ${error.message}`, { autoClose: 2000 });
            } finally {
                setTimeout(() => setIsClicking(false), 200);
            }
        }, [item, activeTab, pageData, onAddElement, onAddChild, onSelectElement]);

        const IconComponent = item.lucideIcon || Box;

        return (
            <div
                className={`lpb-template-item lpb-template-item-clickable ${isClicking ? 'lpb-clicking' : ''}`}
                onClick={handleClick}
                style={{
                    transform: isClicking ? 'scale(0.95)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                }}
            >
                {item.previewImage ? (
                    <img src={item.previewImage} alt={item.name} className="lpb-template-preview" />
                ) : (
                    <IconComponent className="lucide" />
                )}
                <span>{item.name}</span>
            </div>
        );
    };

    const ComponentItem = ({ item }) => {
        const isClickOnly = activeTab === 'sections' || activeTab === 'popups' || activeTab === 'documents' || activeTab === 'templates';
        // Advanced elements can be draggable
        return isClickOnly ? <ClickableComponentItem item={item} /> : <DraggableComponentItem item={item} />;
    };

    const handleTabClick = useCallback((tab) => {
        if (categories[tab]?.length > 0) {
            setActiveTab(tab);
            setActiveCategory(categories[tab][0]?.id || null); // Chọn danh mục đầu tiên của tab mới
            setActiveSubcategory(null);
            setSearchTerm('');
            if (isCollapsed) {
                onToggle();
            }
        } else {
            console.warn(`Tab ${tab} không có danh mục hợp lệ trong EXTENDED_LIBRARY`);
            const firstValidTab = validTabs.find(t => categories[t]?.length > 0) || validTabs[0];
            setActiveTab(firstValidTab);
            setActiveCategory(categories[firstValidTab][0]?.id || null); // Chọn danh mục đầu tiên của tab hợp lệ
        }
    }, [isCollapsed, onToggle, categories, validTabs]);

    const handleCategoryClick = useCallback((categoryId) => {
        setActiveCategory(activeCategory === categoryId ? null : categoryId);
        setActiveSubcategory(null);
        setSearchTerm(''); // Reset tìm kiếm khi chọn danh mục
    }, [activeCategory]);

    const handleSubcategoryClick = useCallback((subcategoryId) => {
        setActiveSubcategory(activeSubcategory === subcategoryId ? null : subcategoryId);
        setSearchTerm(''); // Reset tìm kiếm khi chọn tiểu danh mục
    }, [activeSubcategory]);

    return (
        <div className={`lpb-sidebar-left ${isCollapsed ? 'lpb-sidebar-collapsed' : ''}`}>
            <div className="lpb-component-library-header">
                <h2 className="lpb-component-library-title">
                    {isCollapsed ? '' : 'Thư viện thành phần'}
                </h2>
                <button onClick={onToggle} className="lpb-component-library-toggle">
                    {isCollapsed ? <ChevronRight className="lucide" /> : <ChevronLeft className="lucide" />}
                </button>
            </div>
            <div className="lpb-component-library">
                <div className="lpb-component-library-tabs">
                    {validTabs.map((tab) => {
                        const IconComponent = TAB_ICONS[tab] || Box;
                        const tabName = {
                            sections: 'Phần',
                            elements: 'Thành phần',
                            popups: 'Popup',
                            templates: 'Mẫu',
                            advancedElements: 'Nâng cao',
                            utilities: 'Tiện ích',
                            content: 'Nội dung',
                            media: 'Media',
                            documents: 'Tài liệu',
                            fonts: 'Phông chữ',
                        }[tab] || tab.charAt(0).toUpperCase() + tab.slice(1);
                        return (
                            <button
                                key={tab}
                                className={`lpb-component-library-tab ${activeTab === tab ? 'active' : ''} ${isCollapsed ? 'icon-only' : ''}`}
                                onClick={() => handleTabClick(tab)}
                                title={isCollapsed ? tabName : ''}
                                disabled={!categories[tab]?.length}
                            >
                                {isCollapsed ? (
                                    <IconComponent className="lucide" />
                                ) : (
                                    <>
                                        <IconComponent className="lucide" />
                                        {tabName}
                                    </>
                                )}
                            </button>
                        );
                    })}
                </div>
                {!isCollapsed && (
                    <div className="lpb-component-library-wrapper">
                        <div>
                            {Array.isArray(categories[activeTab]) && categories[activeTab].length > 0 ? (
                                categories[activeTab].map((category) => {
                                    const CategoryIcon = category.lucideIcon || TAB_ICONS[activeTab] || Box;
                                    return (
                                        <div key={category.id} className="lpb-component-library-category-nav">
                                            <button
                                                className={`lpb-component-library-category-btn ${activeCategory === category.id ? 'lpb-component-library-category-btn-active' : ''}`}
                                                onClick={() => handleCategoryClick(category.id)}
                                            >
                                                <CategoryIcon className="lucide lpb-category-icon" />
                                                {category.name}
                                                <span className="lpb-template-count">({category.templates?.length || 0})</span>
                                            </button>
                                            {activeCategory === category.id && Array.isArray(category.subCategories) && category.subCategories.length > 0 && (
                                                <div className="lpb-component-library-subcategory-nav">
                                                    {category.subCategories.map((subcategory) => (
                                                        <button
                                                            key={subcategory.id}
                                                            className={`lpb-component-library-subcategory-btn ${activeSubcategory === subcategory.id ? 'lpb-component-library-subcategory-btn-active' : ''}`}
                                                            onClick={() => handleSubcategoryClick(subcategory.id)}
                                                        >
                                                            <subcategory.lucideIcon className="lucide lpb-subcategory-icon" />
                                                            {subcategory.name}
                                                            <span className="lpb-template-count">({subcategory.templates?.length || 0})</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="lpb-no-results">
                                    <Search className="lucide" style={{ width: 48, height: 48 }} />
                                    <p>Không có danh mục nào</p>
                                    <small>Vui lòng kiểm tra cấu hình thư viện</small>
                                </div>
                            )}
                        </div>
                        <div className="lpb-component-library-template-column">
                            <div className="lpb-component-library-search">
                                <div className="lpb-search-wrapper">
                                    <Search className="lucide lpb-search-icon" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm thành phần..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                    {searchTerm && (
                                        <button
                                            className="lpb-clear-search"
                                            onClick={() => setSearchTerm('')}
                                        >
                                            <X className="lucide" style={{ width: 14, height: 14 }} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="lpb-interaction-hint">
                                {activeTab === 'sections' || activeTab === 'popups' || activeTab === 'documents' || activeTab === 'templates' ? (
                                    <>
                                        <MousePointer2 className="lucide" />
                                        <span>Click để thêm vào trang</span>
                                    </>
                                ) : (
                                    <>
                                        <Hand className="lucide" />
                                        <span>Kéo thả vào vị trí mong muốn hoặc section</span>
                                    </>
                                )}
                            </div>
                            <div className="lpb-component-library-template-list">
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item) => (
                                        <ComponentItem key={item.id} item={item} />
                                    ))
                                ) : (
                                    <div className="lpb-no-results">
                                        <Search className="lucide" style={{ width: 48, height: 48 }} />
                                        <p>Không tìm thấy thành phần nào</p>
                                        <small>Thử từ khóa khác hoặc chọn danh mục khác</small>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComponentLibrary;