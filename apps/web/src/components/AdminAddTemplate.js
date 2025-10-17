import { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { jwtDecode } from "jwt-decode"
import api from "@landinghub/api"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import DogLoader from "../components/Loader"
import { toast } from "react-toastify"
import {
    Upload,
    Camera,
    Search,
    Eye,
    Edit,
    Trash2,
    Star,
    Crown,
    ImageIcon,
    X,
    Save,
    Loader,
    BarChart3,
    TrendingUp,
    Package,
    Zap,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import "../styles/AdminTemplate.css"

const Templates = () => {
    const navigate = useNavigate()
    const [userRole, setUserRole] = useState(null)
    const [templates, setTemplates] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState(null)
    const [previewHtml, setPreviewHtml] = useState("")
    const [searchQuery, setSearchQuery] = useState("")
    const [filterCategory, setFilterCategory] = useState("all")
    const [filterPremium, setFilterPremium] = useState("all")
    const [stats, setStats] = useState(null)

    const [uploadForm, setUploadForm] = useState({
        file: null,
        name: "",
        description: "",
        category: "Thương mại điện tử",
        price: 0,
        tags: "",
        is_premium: false,
        is_featured: false,
    })

    const [editForm, setEditForm] = useState({
        name: "",
        description: "",
        category: "",
        price: 0,
        tags: "",
        is_premium: false,
        is_featured: false,
        status: "ACTIVE",
    })

    const categories = [
        "Thương mại điện tử",
        "Landing Page",
        "Blog",
        "Portfolio",
        "Doanh nghiệp",
        "Giáo dục",
        "Sự kiện",
        "Bất động sản",
        "Khác",
    ]

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            toast.error("Vui lòng đăng nhập để tiếp tục")
            navigate("/auth")
            return
        }

        let decoded
        try {
            decoded = jwtDecode(token)
            if (decoded.role !== "admin") {
                toast.error("Bạn không có quyền truy cập trang này")
                navigate("/pages")
                return
            }
            setUserRole(decoded.role)
            const currentTime = Math.floor(Date.now() / 1000)
            if (decoded.exp && decoded.exp < currentTime) {
                localStorage.removeItem("token")
                toast.error("Phiên đăng nhập đã hết hạn")
                navigate("/auth")
                return
            }

            api.defaults.headers.common["Authorization"] = `Bearer ${token}`
        } catch (err) {
            console.error("Error decoding token:", err)
            toast.error("Phiên đăng nhập không hợp lệ")
            navigate("/auth")
        }
    }, [navigate])

    const fetchTemplates = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await api.get("/api/templates")
            if (response.data.success) {
                setTemplates(response.data.templates)
            }
        } catch (error) {
            console.error("Error fetching templates:", error)
            toast.error("Lỗi khi tải danh sách template: " + (error.response?.data?.error || error.message))
        } finally {
            setIsLoading(false)
        }
    }, [])

    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get("/api/templates/admin/stats")
            if (response.data.success) {
                setStats(response.data.stats)
            }
        } catch (error) {
            console.error("Error fetching stats:", error)
        }
    }, [])

    useEffect(() => {
        fetchTemplates()
        fetchStats()
    }, [fetchTemplates, fetchStats])

    const filteredTemplates = useMemo(() => {
        return templates.filter((template) => {
            const matchesSearch =
                template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                template.description?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = filterCategory === "all" || template.category === filterCategory
            const matchesPremium =
                filterPremium === "all" || (filterPremium === "premium" ? template.is_premium : !template.is_premium)
            return matchesSearch && matchesCategory && matchesPremium
        })
    }, [templates, searchQuery, filterCategory, filterPremium])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file && file.type === "text/html") {
            setUploadForm({ ...uploadForm, file })
        } else {
            toast.error("Vui lòng chọn file HTML hợp lệ")
        }
    }

    const handleUploadSubmit = async (e) => {
        e.preventDefault()
        if (!uploadForm.file || !uploadForm.name) {
            toast.error("Vui lòng nhập đầy đủ thông tin")
            return
        }

        setIsSaving(true)
        try {
            const fileContent = await uploadForm.file.text()
            if (!fileContent.includes("lpb-page-data")) {
                toast.error("File HTML phải chứa thẻ lpb-page-data để sử dụng được.")
                return
            }

            const urlResponse = await api.get("/api/templates/admin/presigned-url")
            if (!urlResponse.data.success) {
                throw new Error("Không thể lấy URL upload")
            }

            const { templateId, uploadUrl, s3Path } = urlResponse.data

            await fetch(uploadUrl, {
                method: "PUT",
                body: fileContent,
                headers: {
                    "Content-Type": "text/html",
                },
            })

            const tagsArray = uploadForm.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0)

            const metadataResponse = await api.post("/api/templates/admin/metadata", {
                templateId,
                name: uploadForm.name,
                description: uploadForm.description,
                category: uploadForm.category,
                price: Number.parseFloat(uploadForm.price) || 0,
                s3Path,
                tags: tagsArray,
                is_premium: uploadForm.is_premium,
                is_featured: uploadForm.is_featured,
            })

            if (metadataResponse.data.success) {
                toast.success("Upload template thành công! Đang tạo screenshot...")
                setShowUploadModal(false)
                setUploadForm({
                    file: null,
                    name: "",
                    description: "",
                    category: "Thương mại điện tử",
                    price: 0,
                    tags: "",
                    is_premium: false,
                    is_featured: false,
                })
                fetchTemplates()
                fetchStats()
            }
        } catch (error) {
            console.error("Error uploading template:", error)
            toast.error("Lỗi khi upload template: " + (error.response?.data?.error || error.message))
        } finally {
            setIsSaving(false)
        }
    }

    const handlePreview = async (template) => {
        setIsLoading(true)
        try {
            const response = await api.get(`/api/templates/${template.id}/preview`)
            if (response.data.success) {
                setPreviewHtml(response.data.html)
                setSelectedTemplate(template)
                setShowPreviewModal(true)
            }
        } catch (error) {
            console.error("Error previewing template:", error)
            toast.error("Lỗi khi xem trước template: " + (error.response?.data?.error || error.message))
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (template) => {
        setSelectedTemplate(template)
        setEditForm({
            name: template.name,
            description: template.description,
            category: template.category,
            price: template.price,
            tags: template.tags?.join(", ") || "",
            is_premium: template.is_premium,
            is_featured: template.is_featured,
            status: template.status || "ACTIVE",
        })
        setShowEditModal(true)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        if (!selectedTemplate) return

        setIsSaving(true)
        try {
            const tagsArray = editForm.tags
                .split(",")
                .map((tag) => tag.trim())
                .filter((tag) => tag.length > 0)

            const response = await api.put(`/api/templates/${selectedTemplate.id}`, {
                name: editForm.name,
                description: editForm.description,
                category: editForm.category,
                price: Number.parseFloat(editForm.price) || 0,
                tags: tagsArray,
                is_premium: editForm.is_premium,
                is_featured: editForm.is_featured,
                status: editForm.status,
            })

            if (response.data.success) {
                toast.success("Cập nhật template thành công!")
                setShowEditModal(false)
                fetchTemplates()
                fetchStats()
            }
        } catch (error) {
            console.error("Error updating template:", error)
            toast.error("Lỗi khi cập nhật template: " + (error.response?.data?.error || error.message))
        } finally {
            setIsSaving(false)
        }
    }

    const handleRegenerateScreenshot = async (templateId) => {
        setIsSaving(true)
        try {
            const response = await api.post(`/api/templates/${templateId}/regenerate-screenshot`)
            if (response.data.success) {
                toast.success("Tạo lại screenshot thành công!")
                fetchTemplates()
            }
        } catch (error) {
            console.error("Error regenerating screenshot:", error)
            toast.error("Lỗi khi tạo screenshot: " + (error.response?.data?.error || error.message))
        } finally {
            setIsSaving(false)
        }
    }

    const handleBatchRegenerate = async () => {
        if (
            !window.confirm("Bạn có chắc muốn tạo lại screenshot cho tất cả templates? Quá trình này có thể mất vài phút.")
        ) {
            return
        }

        setIsSaving(true)
        try {
            const response = await api.post("/api/templates/admin/batch-regenerate-screenshots")
            if (response.data.success) {
                toast.success(response.data.message)
                fetchTemplates()
            }
        } catch (error) {
            console.error("Error batch regenerating:", error)
            toast.error("Lỗi: " + (error.response?.data?.error || error.message))
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (templateId) => {
        if (!window.confirm("Bạn có chắc muốn xóa template này? Hành động này không thể hoàn tác.")) {
            return
        }

        setIsSaving(true)
        try {
            const response = await api.delete(`/api/templates/${templateId}`)
            if (response.data.success) {
                toast.success("Xóa template thành công!")
                fetchTemplates()
                fetchStats()
            }
        } catch (error) {
            console.error("Error deleting template:", error)
            toast.error("Lỗi khi xóa template: " + (error.response?.data?.error || error.message))
        } finally {
            setIsSaving(false)
        }
    }

    const categoryStats = useMemo(() => {
        if (!templates.length) return []
        const grouped = {}
        templates.forEach((t) => {
            grouped[t.category] = (grouped[t.category] || 0) + 1
        })
        return Object.entries(grouped).map(([name, value]) => ({ name, value }))
    }, [templates])

    const usageData = useMemo(() => {
        if (!templates.length) return []
        return templates
            .sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
            .slice(0, 5)
            .map((t) => ({ name: t.name.substring(0, 15), usage: t.usage_count || 0 }))
    }, [templates])

    const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

    if (isLoading && templates.length === 0) {
        return (
            <div className="templates-page">
                <div className="templates-main">
                    <DogLoader />
                </div>
            </div>
        )
    }

    return (
        <div className="templates-page">
            <div className="templates-main">
                {/* Header */}
                <Sidebar role={userRole} />
                <Header />

                {/* Stats Cards with Charts */}
                {stats && (
                    <div className="stats-section">
                        <div className="stats-grid">
                            <div className="stats-card stats-card--total">
                                <div className="stats-card__label">
                                    <Package size={16} style={{ display: "inline" }} /> Tổng Templates
                                </div>
                                <div className="stats-card__value">{stats.total}</div>
                            </div>
                            <div className="stats-card stats-card--free">
                                <div className="stats-card__label">
                                    <Zap size={16} style={{ display: "inline" }} /> Miễn phí
                                </div>
                                <div className="stats-card__value">{stats.free}</div>
                            </div>
                            <div className="stats-card stats-card--premium">
                                <div className="stats-card__label">
                                    <Crown size={16} style={{ display: "inline" }} /> Premium
                                </div>
                                <div className="stats-card__value">{stats.premium}</div>
                            </div>
                            <div className="stats-card stats-card--featured">
                                <div className="stats-card__label">
                                    <Star size={16} style={{ display: "inline" }} /> Nổi bật
                                </div>
                                <div className="stats-card__value">{stats.featured}</div>
                            </div>
                            <div className="stats-card stats-card--usage">
                                <div className="stats-card__label">
                                    <TrendingUp size={16} style={{ display: "inline" }} /> Lượt sử dụng
                                </div>
                                <div className="stats-card__value">{stats.totalUsage}</div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                                gap: "1.5rem",
                                marginTop: "2rem",
                            }}
                        >
                            {/* Category Distribution */}
                            {categoryStats.length > 0 && (
                                <div
                                    style={{
                                        background: "white",
                                        borderRadius: "12px",
                                        padding: "1.5rem",
                                        boxShadow: "var(--card-shadow)",
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: "600",
                                            color: "#1e293b",
                                            marginBottom: "1rem",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        <BarChart3 size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                                        Phân bố theo danh mục
                                    </h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={categoryStats}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={({ name, value }) => `${name}: ${value}`}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {categoryStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {/* Top Usage */}
                            {usageData.length > 0 && (
                                <div
                                    style={{
                                        background: "white",
                                        borderRadius: "12px",
                                        padding: "1.5rem",
                                        boxShadow: "var(--card-shadow)",
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: "0.875rem",
                                            fontWeight: "600",
                                            color: "#1e293b",
                                            marginBottom: "1rem",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        <TrendingUp size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                                        Top 5 Templates được sử dụng
                                    </h3>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={usageData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="name" stroke="#94a3b8" />
                                            <YAxis stroke="#94a3b8" />
                                            <Tooltip
                                                contentStyle={{ background: "#1e293b", border: "none", borderRadius: "8px", color: "#fff" }}
                                            />
                                            <Bar dataKey="usage" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <div className="controls-section">
                    <div className="controls-grid">
                        <button onClick={() => setShowUploadModal(true)} className="btn btn--upload">
                            <Upload size={18} />
                            Upload Template
                        </button>

                        <button onClick={handleBatchRegenerate} className="btn btn--regenerate">
                            <Camera size={18} />
                            Tạo lại tất cả Screenshots
                        </button>

                        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                            <Search
                                size={18}
                                style={{
                                    position: "absolute",
                                    left: "0.75rem",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#94a3b8",
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Tìm kiếm template..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                                style={{ paddingLeft: "2.5rem" }}
                            />
                        </div>

                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="filter-select"
                        >
                            <option value="all">Tất cả danh mục</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>

                        <select value={filterPremium} onChange={(e) => setFilterPremium(e.target.value)} className="filter-select">
                            <option value="all">Tất cả loại</option>
                            <option value="free">Miễn phí</option>
                            <option value="premium">Premium</option>
                        </select>
                    </div>
                </div>

                {/* Templates Grid */}
                <div className="templates-content">
                    {filteredTemplates.length === 0 ? (
                        <div className="end-message">
                            <ImageIcon size={48} />
                            <p>Không tìm thấy template nào</p>
                        </div>
                    ) : (
                        <div className="templates-grid">
                            {filteredTemplates.map((template) => (
                                <div key={template.id} className="template-card">
                                    {/* Thumbnail */}
                                    <div className="card-media">
                                        {template.thumbnail_url ? (
                                            <img
                                                src={template.thumbnail_url || "/placeholder.svg"}
                                                alt={template.name}
                                                className="template-image"
                                            />
                                        ) : (
                                            <div className="image-placeholder">
                                                <ImageIcon size={48} />
                                            </div>
                                        )}

                                        {/* Badges */}
                                        <div className="badge-container">
                                            {template.is_featured && (
                                                <span className="badge badge--featured">
                          <Star size={14} />
                          Nổi bật
                        </span>
                                            )}
                                            {template.is_premium && (
                                                <span className="badge badge--premium">
                          <Crown size={14} />
                          Premium
                        </span>
                                            )}
                                        </div>

                                        {/* Quick Actions Overlay */}
                                        <div className="card-overlay">
                                            <button
                                                onClick={() => handlePreview(template)}
                                                className="btn btn--secondary"
                                                title="Xem trước"
                                                aria-label="Xem trước template"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(template)}
                                                className="btn btn--primary"
                                                title="Chỉnh sửa"
                                                aria-label="Chỉnh sửa template"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleRegenerateScreenshot(template.id)}
                                                className="btn btn--regenerate"
                                                title="Tạo lại screenshot"
                                                aria-label="Tạo lại screenshot"
                                            >
                                                <Camera size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="card-content">
                                        <h3 className="card-title">{template.name}</h3>
                                        <p className="card-description">{template.description}</p>

                                        <div className="card-meta">
                                            <span className="category">{template.category}</span>
                                            <span className="price">{template.formatted_price}</span>
                                        </div>

                                        <div className="card-meta">
                      <span className="usage">
                        <Eye size={14} style={{ display: "inline", marginRight: "0.25rem" }} />
                          {template.usage_count} lượt dùng
                      </span>
                                            <span className="created">{template.created_at}</span>
                                        </div>

                                        {/* Tags */}
                                        {template.tags && template.tags.length > 0 && (
                                            <div className="card-tags">
                                                {template.tags.slice(0, 3).map((tag, index) => (
                                                    <span key={index} className="card-tags__tag">
                            {tag}
                          </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="card-actions">
                                            <button onClick={() => handleEdit(template)} className="btn btn--edit">
                                                <Edit size={14} />
                                                Sửa
                                            </button>
                                            <button onClick={() => handleDelete(template.id)} className="btn btn--delete">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2 className="modal-title">
                                    <Upload size={20} />
                                    Upload Template Mới
                                </h2>
                                <button onClick={() => setShowUploadModal(false)} className="modal-close">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleUploadSubmit} className="modal-form">
                                {/* File Upload */}
                                <div>
                                    <label className="modal-form__label">
                                        <ImageIcon size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                                        File HTML *
                                    </label>
                                    <input type="file" accept=".html" onChange={handleFileChange} required className="modal-form__file" />
                                    <p className="modal-form__hint">Upload file HTML có chứa lpb-page-data để tự động extract pageData</p>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="modal-form__label">Tên Template *</label>
                                    <input
                                        type="text"
                                        value={uploadForm.name}
                                        onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                                        required
                                        className="modal-form__input"
                                        placeholder="Ví dụ: Landing Page Bất Động Sản Modern"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="modal-form__label">Mô tả</label>
                                    <textarea
                                        value={uploadForm.description}
                                        onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                        rows={3}
                                        className="modal-form__textarea"
                                        placeholder="Mô tả ngắn gọn về template"
                                    />
                                </div>

                                <div className="modal-form__grid">
                                    {/* Category */}
                                    <div>
                                        <label className="modal-form__label">Danh mục</label>
                                        <select
                                            value={uploadForm.category}
                                            onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                                            className="modal-form__select"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Price */}
                                    <div>
                                        <label className="modal-form__label">Giá (VNĐ)</label>
                                        <input
                                            type="number"
                                            value={uploadForm.price}
                                            onChange={(e) => setUploadForm({ ...uploadForm, price: e.target.value })}
                                            min="0"
                                            className="modal-form__input"
                                            placeholder="0 = Miễn phí"
                                        />
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="modal-form__label">Tags</label>
                                    <input
                                        type="text"
                                        value={uploadForm.tags}
                                        onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                                        className="modal-form__input"
                                        placeholder="modern, minimal, responsive (phân cách bằng dấu phẩy)"
                                    />
                                </div>

                                {/* Checkboxes */}
                                <div className="modal-form__checkbox-group">
                                    <label className="modal-form__checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={uploadForm.is_featured}
                                            onChange={(e) => setUploadForm({ ...uploadForm, is_featured: e.target.checked })}
                                            className="modal-form__checkbox"
                                        />
                                        <span className="modal-form__checkbox-text">
                      <Star size={14} />
                      Nổi bật
                    </span>
                                    </label>
                                </div>

                                {/* Submit */}
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn--cancel">
                                        Hủy
                                    </button>
                                    <button type="submit" disabled={isSaving} className="btn btn--submit">
                                        {isSaving ? (
                                            <>
                                                <Loader size={16} className="animate-spin" />
                                                Đang upload...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={16} />
                                                Upload Template
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {showEditModal && selectedTemplate && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h2 className="modal-title">
                                    <Edit size={20} />
                                    Chỉnh sửa Template
                                </h2>
                                <button onClick={() => setShowEditModal(false)} className="modal-close">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleEditSubmit} className="modal-form">
                                {/* Name */}
                                <div>
                                    <label className="modal-form__label">Tên Template *</label>
                                    <input
                                        type="text"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                        required
                                        className="modal-form__input"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="modal-form__label">Mô tả</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        rows={3}
                                        className="modal-form__textarea"
                                    />
                                </div>

                                <div className="modal-form__grid">
                                    {/* Category */}
                                    <div>
                                        <label className="modal-form__label">Danh mục</label>
                                        <select
                                            value={editForm.category}
                                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            className="modal-form__select"
                                        >
                                            {categories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Price */}
                                    <div>
                                        <label className="modal-form__label">Giá (VNĐ)</label>
                                        <input
                                            type="number"
                                            value={editForm.price}
                                            onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                            min="0"
                                            className="modal-form__input"
                                        />
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <label className="modal-form__label">Tags</label>
                                    <input
                                        type="text"
                                        value={editForm.tags}
                                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                                        className="modal-form__input"
                                        placeholder="modern, minimal, responsive (phân cách bằng dấu phẩy)"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="modal-form__label">Trạng thái</label>
                                    <select
                                        value={editForm.status}
                                        onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                        className="modal-form__select"
                                    >
                                        <option value="ACTIVE">Hoạt động</option>
                                        <option value="INACTIVE">Tạm ẩn</option>
                                        <option value="DRAFT">Nháp</option>
                                    </select>
                                </div>

                                {/* Checkboxes */}
                                <div className="modal-form__checkbox-group">
                                    <label className="modal-form__checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={editForm.is_premium}
                                            onChange={(e) => setEditForm({ ...editForm, is_premium: e.target.checked })}
                                            className="modal-form__checkbox"
                                        />
                                        <span className="modal-form__checkbox-text">
                      <Crown size={14} />
                      Premium
                    </span>
                                    </label>

                                    <label className="modal-form__checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={editForm.is_featured}
                                            onChange={(e) => setEditForm({ ...editForm, is_featured: e.target.checked })}
                                            className="modal-form__checkbox"
                                        />
                                        <span className="modal-form__checkbox-text">
                      <Star size={14} />
                      Nổi bật
                    </span>
                                    </label>
                                </div>

                                {/* Submit */}
                                <div className="modal-footer">
                                    <button type="button" onClick={() => setShowEditModal(false)} className="btn btn--cancel">
                                        Hủy
                                    </button>
                                    <button type="submit" disabled={isSaving} className="btn btn--submit">
                                        {isSaving ? (
                                            <>
                                                <Loader size={16} className="animate-spin" />
                                                Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={16} />
                                                Lưu thay đổi
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Preview Modal */}
                {showPreviewModal && (
                    <div className="modal-overlay modal-overlay--preview">
                        <div className="modal-content modal-content--preview">
                            <div className="modal-header modal-header--preview">
                                <div>
                                    <h2 className="modal-title">
                                        <Eye size={20} />
                                        Xem trước: {selectedTemplate?.name}
                                    </h2>
                                    <p style={{ margin: "0.5rem 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>
                                        {selectedTemplate?.category}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowPreviewModal(false)
                                        setPreviewHtml("")
                                    }}
                                    className="btn btn--close"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="modal-body">
                                <iframe
                                    srcDoc={previewHtml}
                                    className="modal-iframe"
                                    title="Template Preview"
                                    sandbox="allow-scripts allow-same-origin"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {(isSaving || isLoading) && (
                    <div className="loading-overlay">
                        <DogLoader />
                    </div>
                )}
            </div>
        </div>
    )
}

export default Templates
