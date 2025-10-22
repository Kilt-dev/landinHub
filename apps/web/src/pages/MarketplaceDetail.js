"use client"

import { useState, useEffect, useContext } from "react"
import { UserContext } from "../context/UserContext"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"
import { jwtDecode } from "jwt-decode"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import AOS from "aos"
import "aos/dist/aos.css"
import "../styles/MarketplaceDetail.css"
import DogLoader from "../components/Loader"
import { toast } from "react-toastify"
import {
    FiEye,
    FiShoppingCart,
    FiStar,
    FiUser,
    FiHeart,
    FiExternalLink,
    FiDownload,
    FiCheckCircle,
    FiShield,
    FiZap,
    FiSmartphone,
    FiSliders,
    FiFileText,
    FiPackage,
    FiTag,
    FiCreditCard,
    FiLayers,
} from "react-icons/fi"

const MarketplaceDetail = () => {
    const { user } = useContext(UserContext)
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [userRole, setUserRole] = useState(null)
    const [page, setPage] = useState(null)
    const [error, setError] = useState("")
    const [purchasing, setPurchasing] = useState(false)
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("SANDBOX")
    const [isLiked, setIsLiked] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [hasPurchased, setHasPurchased] = useState(false)
    const [isSeller, setIsSeller] = useState(false)
    const [downloading, setDownloading] = useState(false)

    const navigate = useNavigate()
    const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000"

    const paymentMethods = [
        { value: "SANDBOX", label: "Sandbox (Test)", description: "Môi trường test thanh toán an toàn." },
        { value: "MOMO", label: "Ví điện tử MOMO", description: "Thanh toán nhanh chóng qua ví MOMO." },
        { value: "VNPAY", label: "Cổng thanh toán VNPay", description: "Hỗ trợ nhiều ngân hàng và thẻ quốc tế." },
    ]

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem("token")
            if (!token) {
                navigate("/auth")
                setLoading(false)
                return
            }
            try {
                const decodedToken = jwtDecode(token)
                setUserRole(decodedToken.role)
            } catch (err) {
                console.error("Lỗi giải mã token:", err)
                navigate("/auth")
            }
        }
        if (user?.role) setUserRole(user.role)
        else initializeAuth()
    }, [user, navigate])

    useEffect(() => {
        AOS.init({ duration: 600, once: true })
        if (id) loadPageDetail()
    }, [id])

    const loadPageDetail = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")
            const response = await axios.get(`${API_BASE_URL}/api/marketplace/${id}`)
            setPage(response.data.data)

            if (token) {
                const decoded = jwtDecode(token)
                const userId = decoded.userId
                setIsLiked(response.data.data.liked_by?.includes(userId))
                setIsSeller(response.data.data.seller_id?._id === userId)
                await checkPurchaseStatus()
            }
        } catch (err) {
            setError("Không thể tải chi tiết: " + (err.response?.data?.message || err.message))
        } finally {
            setLoading(false)
        }
    }

    const checkPurchaseStatus = async () => {
        try {
            const token = localStorage.getItem("token")
            if (!token) return
            const response = await axios.get(`${API_BASE_URL}/api/payment/check-purchase/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            setHasPurchased(response.data.hasPurchased || false)
        } catch (err) {
            setHasPurchased(false)
        }
    }

    const handlePurchase = async () => {
        try {
            setPurchasing(true)
            const token = localStorage.getItem("token")
            if (!token) {
                toast.error("Vui lòng đăng nhập để mua hàng")
                navigate("/auth")
                return
            }
            const response = await axios.post(
                `${API_BASE_URL}/api/payment/create-transaction`,
                { marketplace_page_id: id, payment_method: selectedPaymentMethod },
                { headers: { Authorization: `Bearer ${token}` } },
            )
            if (response.data.success) {
                const { payment_url, transaction_id } = response.data.data
                if (selectedPaymentMethod === "SANDBOX") {
                    navigate(`/payment/sandbox?transaction_id=${transaction_id}`)
                } else {
                    window.location.href = payment_url
                }
            } else {
                toast.error(response.data.message)
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Không thể tạo giao dịch")
        } finally {
            setPurchasing(false)
        }
    }

    const handleLike = async () => {
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                toast.error("Vui lòng đăng nhập để thích sản phẩm")
                navigate("/auth")
                return
            }
            const response = await axios.post(
                `${API_BASE_URL}/api/marketplace/${id}/like`,
                {},
                { headers: { Authorization: `Bearer ${token}` } },
            )
            if (response.data.success) {
                setIsLiked(response.data.data.liked)
                setPage((prev) => ({ ...prev, likes: response.data.data.likes }))
                toast.success(response.data.data.liked ? "Đã thêm vào yêu thích!" : "Đã bỏ yêu thích.")
            }
        } catch (err) {
            toast.error("Không thể cập nhật trạng thái")
        }
    }

    const handleDownload = async (format) => {
        try {
            setDownloading(true)
            const token = localStorage.getItem("token")
            const endpoint = `${API_BASE_URL}/api/marketplace/${id}/download/${format}`
            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: "blob",
            })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", `${page.title}.${format === "html" ? "zip" : "iuhpage"}`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
            toast.success(`Đã tải xuống định dạng ${format.toUpperCase()}`)
        } catch (err) {
            toast.error("Không thể tải xuống file")
        } finally {
            setDownloading(false)
        }
    }

    const formatPrice = (price) =>
        price === 0 ? "Miễn phí" : new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price)
    const calculateDiscount = (price, originalPrice) =>
        !originalPrice || originalPrice <= price ? 0 : Math.round(((originalPrice - price) / originalPrice) * 100)

    if (loading) return <DogLoader />
    if (error)
        return (
            <div className="marketplace-detail-container1">
                <Header />
                <div className="marketplace-detail-main">
                    <Sidebar userRole={userRole} />
                    <div className="error-container">
                        <h2>Có lỗi xảy ra</h2>
                        <p>{error}</p>
                        <button onClick={() => navigate("/marketplace")}>Quay lại</button>
                    </div>
                </div>
            </div>
        )
    if (!page) return null

    const discount = calculateDiscount(page.price, page.original_price)

    return (
        <div className="marketplace-detail-container">
            <Sidebar userRole={userRole} />
            <div className="marketplace-detail-main">
                <Header />
                <div className="marketplace-detail-content">
                    <div className="breadcrumb" data-aos="fade-down">
                        <span onClick={() => navigate("/marketplace")}>Marketplace</span>
                        <span className="separator">/</span>
                        <span className="current">{page.title}</span>
                    </div>

                    <div className="detail-grid">
                        <div className="detail-left" data-aos="fade-right">
                            <div className="main-image">
                                <img
                                    src={
                                        (page.screenshots && page.screenshots[currentImageIndex]) ||
                                        page.main_screenshot ||
                                        "/placeholder.png"
                                    }
                                    alt={page.title}
                                />
                            </div>
                            {page.screenshots && page.screenshots.length > 1 && (
                                <div className="thumbnail-gallery">
                                    {page.screenshots.map((ss, i) => (
                                        <div
                                            key={i}
                                            className={`thumbnail ${i === currentImageIndex ? "active" : ""}`}
                                            onClick={() => setCurrentImageIndex(i)}
                                        >
                                            <img src={ss || "/placeholder.svg"} alt={`Thumbnail ${i + 1}`} />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="info-section description-section">
                                <h3>
                                    <FiFileText /> Mô tả chi tiết
                                </h3>
                                <p>{page.description}</p>
                            </div>
                        </div>

                        <div className="detail-right" data-aos="fade-left">
                            <div className="detail-header">
                                <div className="category-badge">{page.category}</div>
                                <h1>{page.title}</h1>
                                <div className="meta-info">
                  <span>
                    <FiEye /> {page.views}
                  </span>
                                    <span>
                    <FiShoppingCart /> {page.sold_count}
                  </span>
                                    <span>
                    <FiStar /> {page.rating.toFixed(1)}
                  </span>
                                </div>
                                <div className="seller-info">
                  <span>
                    <FiUser /> Bán bởi: <strong>{page.seller_id?.name || "Anonymous"}</strong>
                  </span>
                                </div>
                            </div>
                            <div className="price-section">
                                <div className="price-box">
                                    <div className="current-price">{formatPrice(page.price)}</div>
                                    {page.original_price > page.price && (
                                        <div className="original-price">{formatPrice(page.original_price)}</div>
                                    )}
                                </div>
                                {discount > 0 && <div className="discount-badge">-{discount}%</div>}
                            </div>
                            <div className="action-buttons-secondary">
                                {page.demo_url && (
                                    <a href={page.demo_url} target="_blank" rel="noopener noreferrer" className="demo-btn action-btn">
                                        <FiExternalLink /> Xem Demo
                                    </a>
                                )}
                                <button className={`like-btn action-btn ${isLiked ? "liked" : ""}`} onClick={handleLike}>
                                    <FiHeart style={{ fill: isLiked ? "#ff4d4f" : "none" }} />
                                    <span>{page.likes}</span>
                                </button>
                            </div>
                            {page.tags?.length > 0 && (
                                <div className="info-section tags-section">
                                    <h3>
                                        <FiTag /> Tags
                                    </h3>
                                    <div className="tags">
                                        {page.tags.map((tag, i) => (
                                            <span key={i} className="tag">
                        {tag}
                      </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {(hasPurchased || isSeller) && (
                                <div className="download-section">
                                    <h3>
                                        <FiDownload /> Tải xuống
                                    </h3>
                                    <p className="download-info">{isSeller ? "Bạn là người bán." : "Cảm ơn bạn đã mua sản phẩm!"}</p>
                                    <div className="download-options">
                                        <button onClick={() => handleDownload("html")} disabled={downloading} className="download-btn">
                                            <FiPackage /> Tải .ZIP
                                        </button>
                                        <button onClick={() => handleDownload("iuhpage")} disabled={downloading} className="download-btn">
                                            <FiFileText /> Tải .iuhpage
                                        </button>
                                    </div>
                                </div>
                            )}
                            {!(hasPurchased || isSeller) && page.price > 0 && (
                                <div className="purchase-flow-section">
                                    <div className="payment-section">
                                        <h3>
                                            <FiCreditCard /> Chọn phương thức thanh toán
                                        </h3>
                                        {paymentMethods.map((m) => (
                                            <div
                                                key={m.value}
                                                className={`payment-method ${selectedPaymentMethod === m.value ? "selected" : ""}`}
                                                onClick={() => setSelectedPaymentMethod(m.value)}
                                            >
                                                <div className="method-label">{m.label}</div>
                                                <div className="method-description">{m.description}</div>
                                                <div className="radio-select">{selectedPaymentMethod === m.value && <FiCheckCircle />}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="action-buttons">
                                        <button className="purchase-btn action-btn" onClick={handlePurchase} disabled={purchasing}>
                                            <FiShoppingCart /> {purchasing ? "Đang xử lý..." : "Thanh toán ngay"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="info-section features-section" data-aos="fade-up">
                        <h3>
                            <FiLayers /> Tính năng nổi bật
                        </h3>
                        <div className="features-grid">
                            {page.responsive && (
                                <div className="feature-item">
                                    <FiSmartphone />
                                    <span>Responsive</span>
                                </div>
                            )}
                            {page.customizable && (
                                <div className="feature-item">
                                    <FiSliders />
                                    <span>Tùy chỉnh</span>
                                </div>
                            )}
                            <div className="feature-item">
                                <FiZap />
                                <span>Tốc độ cao</span>
                            </div>
                            <div className="feature-item">
                                <FiShield />
                                <span>Bảo mật</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MarketplaceDetail
