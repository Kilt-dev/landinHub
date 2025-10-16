import { toast } from "react-toastify";

class EventUtils {
    constructor() {
        this.subscribers = {}; // { eventName: [callbacks] }
        this.cache = new Map(); // Dự phòng cho cache API trong tương lai
    }

    // Đăng ký lắng nghe sự kiện
    subscribe(eventName, callback) {
        if (!this.subscribers[eventName]) {
            this.subscribers[eventName] = [];
        }
        this.subscribers[eventName].push(callback);
        return () => this.unsubscribe(eventName, callback); // Trả về hàm hủy đăng ký
    }

    // Hủy đăng ký sự kiện
    unsubscribe(eventName, callback) {
        if (this.subscribers[eventName]) {
            this.subscribers[eventName] = this.subscribers[eventName].filter(
                (cb) => cb !== callback
            );
        }
    }

    // Phát sự kiện với dữ liệu kèm theo
    dispatch(eventName, payload = {}) {
        if (this.subscribers[eventName]) {
            this.subscribers[eventName].forEach((callback) => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error(`Lỗi trong callback ${eventName}:`, error);
                    toast.error(`Lỗi xử lý ${eventName}: ${error.message}`, {
                        position: "bottom-right",
                        autoClose: 2000,
                    });
                }
            });
        }
    }

    // Xử lý các sự kiện từ ButtonPropertiesPanel
    handleEvent(config, elementId, isCanvas = false) {
        const { type, popupId, url, newTab, sectionId, smooth, apiUrl, method } = config;
        switch (type) {
            case "openPopup":
                if (!popupId) {
                    toast.error("Không tìm thấy ID của popup!");
                    return;
                }
                this.dispatch("popup-open", { popupId, elementId });
                if (isCanvas) toast.info(`Mô phỏng: Mở popup "${popupId}"`);
                break;
            case "closePopup":
                const targetPopupId = popupId || elementId;
                if (!targetPopupId) {
                    toast.error("Không tìm thấy ID của popup để đóng!");
                    return;
                }
                this.dispatch("popup-close", { popupId: targetPopupId, elementId });
                if (isCanvas) toast.info(`Mô phỏng: Đóng popup "${targetPopupId}"`);
                break;
            case "navigate":
                if (!url) {
                    toast.error("Không tìm thấy URL để điều hướng!");
                    return;
                }
                if (isCanvas) {
                    toast.info(`Mô phỏng: Điều hướng đến ${url}`);
                } else {
                    window.open(url, newTab ? "_blank" : "_self");
                }
                break;
            case "scrollToSection":
                if (!sectionId) {
                    toast.error("Không tìm thấy ID của section!");
                    return;
                }
                const sectionElement = document.querySelector(`[data-element-id="${sectionId}"]`);
                if (sectionElement) {
                    sectionElement.scrollIntoView({ behavior: smooth !== false ? "smooth" : "auto", block: "start" });
                    if (isCanvas) toast.info(`Mô phỏng: Cuộn đến section "${sectionId}"`);
                } else {
                    toast.error("Không tìm thấy section!");
                }
                break;
            case "submitForm":
            case "triggerApi":
                if (!apiUrl) {
                    toast.error("Không tìm thấy URL API!");
                    return;
                }
                if (isCanvas) {
                    toast.info(`Mô phỏng: ${type === "submitForm" ? "Gửi form" : "Gọi API"} đến ${apiUrl} (${method || "POST"})`);
                } else {
                    toast.info(`Gọi API đến ${apiUrl} chưa được triển khai.`);
                }
                break;
            case "none":
                break;
            default:
                toast.warn(`Loại sự kiện "${type}" không được hỗ trợ.`);
                break;
        }
    }

    // Tải trước nội dung (dự phòng cho tương lai)
    prefetch(config) {
        if (config.type === "openPopup" && config.popupId) {
            console.log(`Tải trước nội dung popup: ${config.popupId}`);
            this.dispatch("popup-prefetch", { popupId: config.popupId });
        } else if (config.type === "triggerApi" && config.apiUrl) {
            console.log(`Tải trước dữ liệu API: ${config.apiUrl}`);
        }
    }
}

// Singleton instance
const eventController = new EventUtils();
export default eventController;