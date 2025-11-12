import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'react-toastify';
import Canvas from '../components/create-page/Canvas';
import ComponentLibrary from '../components/create-page/ComponentLibrary';
import PropertiesPanel from '../components/create-page/PropertiesPanel';
import ElementPropertiesPanel from '../components/create-page/properties/ElementPropertiesPanel';
import ButtonPropertiesPanel from './create-page/properties/ButtonPropertiesPanel';
import IconPropertiesPanel from './create-page/properties/IconPropertiesPanel';
import ImagePropertiesPanel from './create-page/properties/ImagePropertiesPanel';
import Toolbar from './create-page/Toolbar';
import ResponsiveToolbar from './create-page/ResponsiveToolbar';
import SectionPopup from '../components/create-page/SectionPopup';
import LayerManager from './create-page/LayerManager';
import api from '@landinghub/api';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { parseHTMLToPageData, renderStaticHTML } from '../utils/pageUtils';
import { syncElementBetweenModes } from '../utils/responsiveSync';
import { ErrorBoundary } from './create-page/ErrorBoundary';
import DogLoader from './Loader';
import PreviewModal from '../components/PreviewModal';

// Import custom hooks
import { usePageHistory } from '../hooks/usePageHistory';
import { useEditorShortcuts } from '../hooks/useEditorShortcuts';
import { useClipboard } from '../hooks/useClipboard';

// Import transitions
import { canvasZoomTransition, responsiveModeTransition, TRANSITION_STYLES } from '../utils/transitions';

import '../styles/CreateLanding.css';

// Constants
const DEFAULT_CANVAS_WIDTH = 1200;
const DEFAULT_CANVAS_BACKGROUND = '#ffffff';

// Auth hook
const useAuth = (navigate) => {
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Vui lòng đăng nhập để tiếp tục');
            navigate('/auth');
            return;
        }
        try {
            const decoded = jwtDecode(token);
            const currentTime = Math.floor(Date.now() / 1000);
            if (decoded.exp && decoded.exp < currentTime) {
                localStorage.removeItem('token');
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                navigate('/auth');
                return;
            }
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } catch (err) {
            console.error('Error decoding token:', err);
            toast.error('Phiên đăng nhập không hợp lệ');
            navigate('/auth');
        }
    }, [navigate]);
};

// Page content hook
const usePageContent = (pageId, navigate, resetHistory, setIsLoading) => {
    const [pageData, setPageData] = useState({
        canvas: { width: DEFAULT_CANVAS_WIDTH, height: 'auto', background: DEFAULT_CANVAS_BACKGROUND },
        elements: [],
        meta: { created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    });

    useEffect(() => {
        if (!pageId || !pageId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            toast.error('ID trang không hợp lệ. Vui lòng kiểm tra lại.');
            navigate('/pages');
            return;
        }

        const fetchPageContent = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(`/api/pages/${pageId}/content`);
                if (response.data.success) {
                    const { pageData: backendPageData, html } = response.data;
                    let finalPageData = backendPageData || (html ? parseHTMLToPageData(html) : {
                        canvas: { width: DEFAULT_CANVAS_WIDTH, height: 'auto', background: DEFAULT_CANVAS_BACKGROUND },
                        elements: [],
                        meta: { created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
                    });
                    setPageData(finalPageData);
                    resetHistory(finalPageData);
                    toast.success('Tải trang thành công!');
                } else {
                    throw new Error(response.data.error || 'Không thể tải trang');
                }
            } catch (error) {
                console.error('Lỗi khi lấy nội dung trang:', error);
                toast.error('Lỗi khi lấy nội dung trang: ' + (error.response?.data?.error || error.message));
                if (error.response?.status === 401) {
                    localStorage.removeItem('token');
                    navigate('/auth');
                } else {
                    navigate('/pages');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchPageContent();
    }, [pageId, navigate, resetHistory, setIsLoading]);

    return [pageData, setPageData];
};

const CreateLandingOptimized = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const pageId = searchParams.get('id');

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedChildId, setSelectedChildId] = useState(null);
    const [viewMode, setViewMode] = useState('desktop');
    const [zoomLevel, setZoomLevel] = useState(100);
    const [gridSize, setGridSize] = useState(10);
    const [showGrid, setShowGrid] = useState(true);
    const [isLibraryCollapsed, setIsLibraryCollapsed] = useState(false);
    const [isPropertiesCollapsed, setIsPropertiesCollapsed] = useState(false);
    const [showPopup, setShowPopup] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [guideLine, setGuideLine] = useState({ show: true, y: 0 });
    const [previewHtml, setPreviewHtml] = useState('');

    // Custom hooks
    const {
        addToHistory,
        undo,
        redo,
        resetHistory,
        getCurrentState,
        canUndo,
        canRedo,
        historySize
    } = usePageHistory({
        canvas: { width: DEFAULT_CANVAS_WIDTH, height: 'auto', background: DEFAULT_CANVAS_BACKGROUND },
        elements: [],
        meta: { created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    });

    const [pageData, setPageDataInternal] = usePageContent(pageId, navigate, resetHistory, setIsLoading);

    // Wrapper to update pageData and history
    const setPageData = useCallback((newData) => {
        if (typeof newData === 'function') {
            setPageDataInternal(prev => {
                const updated = newData(prev);
                addToHistory(updated);
                return updated;
            });
        } else {
            setPageDataInternal(newData);
            addToHistory(newData);
        }
    }, [addToHistory]);

    // Clipboard hook
    const {
        copyElements,
        pasteElements,
        duplicateElements
    } = useClipboard(pageData, (newElements) => {
        setPageData(prev => ({
            ...prev,
            elements: [...prev.elements, ...newElements],
            meta: { ...prev.meta, updated_at: new Date().toISOString() }
        }));
    });

    // Undo/Redo handlers
    const handleUndo = useCallback(() => {
        const prevState = undo();
        if (prevState) {
            setPageDataInternal(prevState);
        }
    }, [undo]);

    const handleRedo = useCallback(() => {
        const nextState = redo();
        if (nextState) {
            setPageDataInternal(nextState);
        }
    }, [redo]);

    // Delete handler
    const handleDeleteElements = useCallback((ids) => {
        setPageData(prev => {
            const idsToDelete = Array.isArray(ids) ? ids : [ids];
            return {
                ...prev,
                elements: prev.elements.filter(el => !idsToDelete.includes(el.id)),
                meta: { ...prev.meta, updated_at: new Date().toISOString() }
            };
        });
        setSelectedIds([]);
        setSelectedChildId(null);
    }, [setPageData]);

    // Select all handler
    const handleSelectAll = useCallback((allIds) => {
        setSelectedIds(allIds);
    }, []);

    // Deselect handler
    const handleDeselect = useCallback(() => {
        setSelectedIds([]);
        setSelectedChildId(null);
    }, []);

    // Keyboard shortcuts
    useEditorShortcuts({
        selectedIds,
        pageData,
        onUndo: handleUndo,
        onRedo: handleRedo,
        onSave: () => handleSave(),
        onCopy: copyElements,
        onPaste: () => pasteElements(viewMode),
        onDuplicate: () => duplicateElements(selectedIds, viewMode),
        onDelete: handleDeleteElements,
        onSelectAll: handleSelectAll,
        onDeselect: handleDeselect,
        canUndo,
        canRedo,
        disabled: isLoading || isSaving
    });

    // Auth
    useAuth(navigate);

    // Toggle handlers
    const handleToggleLibrary = useCallback(() => setIsLibraryCollapsed(prev => !prev), []);

    const handleShowAddSectionPopup = useCallback((e) => {
        if (e) e.stopPropagation();
        setShowPopup(true);
        setGuideLine(prev => ({ ...prev, show: false }));
    }, []);

    // Add section handler with smooth animation
    const handleAddSection = useCallback((section) => {
        const lastSectionY = pageData.elements
            .filter(el => el.type === 'section')
            .reduce((maxY, el) => Math.max(maxY, (el.position?.[viewMode]?.y || 0) + (el.size?.height || 400)), 0);

        const newElement = {
            id: `${section.id}-${Date.now()}`,
            type: section.json.type,
            componentData: JSON.parse(JSON.stringify(section.json.componentData || {})),
            position: {
                [viewMode]: { x: section.json.type === 'popup' ? 100 : 0, y: section.json.type === 'popup' ? 100 : lastSectionY },
                desktop: { x: section.json.type === 'popup' ? 100 : 0, y: section.json.type === 'popup' ? 100 : lastSectionY },
                tablet: { x: section.json.type === 'popup' ? 100 : 0, y: section.json.type === 'popup' ? 100 : lastSectionY },
                mobile: { x: section.json.type === 'popup' ? 100 : 0, y: section.json.type === 'popup' ? 100 : lastSectionY },
            },
            size: { ...section.json.size, width: viewMode === 'mobile' ? 375 : section.json.type === 'popup' ? 600 : 1200 },
            styles: JSON.parse(JSON.stringify(section.json.styles || {})),
            children: JSON.parse(JSON.stringify(section.json.children || [])),
            visible: true,
            locked: false
        };

        setPageData(prev => {
            const newElements = [...prev.elements, newElement];
            const newCanvasHeight = section.json.type === 'section' ? lastSectionY + (section.json.size?.height || 400) : prev.canvas.height;
            return {
                ...prev,
                elements: newElements,
                canvas: { ...prev.canvas, height: Math.max(prev.canvas.height || 0, newCanvasHeight) },
                meta: { ...prev.meta, updated_at: new Date().toISOString() }
            };
        });

        if (section.json.type === 'section') {
            setGuideLine({ show: true, y: lastSectionY + (section.json.size?.height || 400) });
        }
        toast.success(`✨ Đã thêm ${section.json.type} mới!`);
        setShowPopup(false);
    }, [pageData.elements, viewMode, setPageData]);

    // View mode change with smooth transition
    const handleViewModeChange = useCallback((mode) => {
        setViewMode(mode);

        setPageData(prev => {
            const canvasWidth = mode === 'desktop' ? 1200 : mode === 'tablet' ? 768 : 375;

            const syncedElements = prev.elements.map(element => {
                if (!element.position?.mobile || !element.position?.tablet) {
                    return syncElementBetweenModes(element, 'desktop');
                }
                return element;
            });

            return {
                ...prev,
                canvas: { ...prev.canvas, width: canvasWidth },
                elements: syncedElements,
                meta: { ...prev.meta, updated_at: new Date().toISOString() }
            };
        });

        const modeLabel = mode === 'desktop' ? 'Desktop' : mode === 'tablet' ? 'Tablet' : 'Mobile';
        toast.info(`📱 ${modeLabel}`, { autoClose: 1000 });
    }, [setPageData]);

    // Save handler
    const handleSave = useCallback(async () => {
        if (!pageId) {
            toast.error('Không tìm thấy ID trang.');
            return;
        }
        setIsSaving(true);
        try {
            const htmlContent = renderStaticHTML(pageData);
            const response = await api.put(`/api/pages/${pageId}`, { html: htmlContent, pageData });
            if (response.data.success) {
                toast.success(`💾 Lưu thành công! (${pageData.elements.length} phần tử)`, { autoClose: 2000 });
                navigate('/pages');
            }
        } catch (error) {
            console.error('Lỗi khi lưu trang:', error);
            toast.error('❌ Lỗi khi lưu trang: ' + (error.response?.data?.error || error.message));
            if (error.response?.status === 401) {
                localStorage.removeItem('token');
                navigate('/auth');
            }
        } finally {
            setIsSaving(false);
        }
    }, [pageId, navigate, pageData]);

    // Preview handler
    const handlePreview = useCallback(() => {
        const htmlContent = renderStaticHTML(pageData);
        setPreviewHtml(htmlContent);
        setShowPreview(true);
    }, [pageData]);

    // Publish handler
    const handleGenerateCode = useCallback(async () => {
        if (!pageId) {
            toast.error('Không tìm thấy ID trang để triển khai.');
            return;
        }
        setIsSaving(true);
        try {
            const htmlContent = renderStaticHTML(pageData);
            await api.put(`/api/pages/${pageId}`, { html: htmlContent });
            const response = await api.post(`/api/pages/${pageId}/publish`);
            if (response.data.success && response.data.page?.url) {
                toast.success(`🚀 Triển khai thành công! ${response.data.page.url}`, { autoClose: 3000 });
                navigate('/pages');
            } else {
                toast.error('Triển khai thất bại: ' + (response.data.error || 'Lỗi không xác định'));
            }
        } catch (error) {
            console.error('Lỗi khi triển khai:', error);
            toast.error('Lỗi khi triển khai trang: ' + (error.response?.data?.error || error.message));
        } finally {
            setIsSaving(false);
        }
    }, [pageId, navigate, pageData]);

    // Loading state
    if (isLoading || isSaving) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gray-100">
                <DogLoader />
                {isSaving && <p className="mt-4 text-gray-600">Đang lưu...</p>}
            </div>
        );
    }

    // Get selected element
    const selectedElement = useMemo(() => {
        if (selectedChildId) {
            const parent = pageData.elements.find(el => el.id === selectedIds[0]);
            const child = parent?.children?.find(child => child.id === selectedChildId);
            return child ? { json: child, isChild: true } : null;
        }
        const element = pageData.elements.find(el => el.id === selectedIds[0]);
        return element ? { json: element, isChild: false } : null;
    }, [selectedIds, selectedChildId, pageData.elements]);

    // Render properties panel (same as original, but using memoized selectedElement)
    const renderPropertiesPanel = () => {
        if (!selectedElement) {
            return (
                <PropertiesPanel
                    selectedElement={null}
                    onUpdateElement={() => {}}
                    onUpdateCanvas={() => {}}
                    isCollapsed={isPropertiesCollapsed}
                    onToggle={() => setIsPropertiesCollapsed(!isPropertiesCollapsed)}
                    pageData={pageData}
                    className="w-80 bg-white shadow-lg p-4"
                />
            );
        }

        const { type } = selectedElement.json;

        const commonProps = {
            selectedElement,
            isCollapsed: isPropertiesCollapsed,
            onToggle: () => setIsPropertiesCollapsed(!isPropertiesCollapsed),
            pageId
        };

        if (type === 'section' || type === 'popup') {
            return <PropertiesPanel {...commonProps} pageData={pageData} />;
        }
        if (type === 'heading' || type === 'paragraph' || type === 'gallery') {
            return <ElementPropertiesPanel {...commonProps} />;
        }
        if (type === 'button') {
            return <ButtonPropertiesPanel {...commonProps} allElements={pageData.elements} />;
        }
        if (type === 'icon') {
            return <IconPropertiesPanel {...commonProps} />;
        }
        if (type === 'image') {
            return <ImagePropertiesPanel {...commonProps} />;
        }

        return <PropertiesPanel {...commonProps} pageData={pageData} />;
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex h-screen bg-gray-100">
                <ErrorBoundary>
                    <ComponentLibrary
                        isCollapsed={isLibraryCollapsed}
                        onToggle={handleToggleLibrary}
                        onAddElement={handleAddSection}
                        pageData={pageData}
                        className="w-64 bg-white shadow-lg"
                    />
                </ErrorBoundary>

                <div className="flex-1 flex flex-col">
                    <ErrorBoundary>
                        <Toolbar
                            onSave={handleSave}
                            onPreview={handlePreview}
                            onGenerateCode={handleGenerateCode}
                            onUndo={handleUndo}
                            onRedo={handleRedo}
                            canUndo={canUndo}
                            canRedo={canRedo}
                            viewMode={viewMode}
                            onViewModeChange={handleViewModeChange}
                            onShowAddSectionGuide={handleShowAddSectionPopup}
                            pageData={pageData}
                            selectedIds={selectedIds}
                            className="bg-white p-4 shadow-sm"
                        />
                    </ErrorBoundary>

                    <ErrorBoundary>
                        <ResponsiveToolbar
                            viewMode={viewMode}
                            onViewModeChange={handleViewModeChange}
                            pageData={pageData}
                        />
                    </ErrorBoundary>

                    <ErrorBoundary>
                        <Canvas
                            pageData={pageData}
                            selectedIds={selectedIds}
                            onSelectElement={setSelectedIds}
                            onDeleteElement={handleDeleteElements}
                            onAddElement={handleAddSection}
                            viewMode={viewMode}
                            zoomLevel={zoomLevel}
                            gridSize={gridSize}
                            showGrid={showGrid}
                            guideLine={guideLine}
                            onShowAddSectionPopup={handleShowAddSectionPopup}
                            style={{ transition: canvasZoomTransition }}
                            className="flex-1 bg-gray-200"
                        />
                    </ErrorBoundary>

                    {showPreview && (
                        <PreviewModal
                            selectedTemplate={{ name: 'Page Preview' }}
                            setShowPreviewModal={setShowPreview}
                            setPreviewHtml={setPreviewHtml}
                            previewHtml={previewHtml}
                            fullScreen={false}
                        />
                    )}
                </div>

                <ErrorBoundary>
                    {renderPropertiesPanel()}
                </ErrorBoundary>

                <SectionPopup
                    showPopup={showPopup}
                    setShowPopup={setShowPopup}
                    viewMode={viewMode}
                    handleAddSection={handleAddSection}
                    className="z-50"
                />

                <LayerManager
                    pageData={pageData}
                    selectedIds={selectedIds}
                    onSelectElement={setSelectedIds}
                    onDeleteElement={handleDeleteElements}
                    viewMode={viewMode}
                    className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg"
                />

                {/* History size indicator (for debugging) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="fixed bottom-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                        History: {historySize}/50
                    </div>
                )}
            </div>
        </DndProvider>
    );
};

export default CreateLandingOptimized;
