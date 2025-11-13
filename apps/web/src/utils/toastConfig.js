/**
 * Toast Notification Configuration
 * Control which toast messages are shown to reduce UI noise
 */

// User preferences for toast notifications
const toastSettings = {
    showSuccess: false,      // Hide success messages (updates, saves, etc.)
    showInfo: false,         // Hide info messages (mode changes, etc.)
    showWarning: true,       // Show warning messages
    showError: true,         // Show error messages (always important)
};

/**
 * Controlled toast wrapper
 * Only shows toasts based on user settings
 */
export const smartToast = {
    success: (message) => {
        if (toastSettings.showSuccess) {
            // Only import toast when needed
            import('react-toastify').then(({ toast }) => {
                toast.success(message);
            });
        }
    },

    info: (message) => {
        if (toastSettings.showInfo) {
            import('react-toastify').then(({ toast }) => {
                toast.info(message);
            });
        }
    },

    warning: (message) => {
        if (toastSettings.showWarning) {
            import('react-toastify').then(({ toast }) => {
                toast.warning(message);
            });
        }
    },

    error: (message) => {
        if (toastSettings.showError) {
            import('react-toastify').then(({ toast }) => {
                toast.error(message);
            });
        }
    }
};

/**
 * Update toast settings
 * @param {Object} newSettings - New settings to apply
 */
export const updateToastSettings = (newSettings) => {
    Object.assign(toastSettings, newSettings);
    localStorage.setItem('toastSettings', JSON.stringify(toastSettings));
};

/**
 * Load toast settings from localStorage
 */
export const loadToastSettings = () => {
    try {
        const saved = localStorage.getItem('toastSettings');
        if (saved) {
            Object.assign(toastSettings, JSON.parse(saved));
        }
    } catch (error) {
        console.error('Failed to load toast settings:', error);
    }
};

/**
 * Get current toast settings
 */
export const getToastSettings = () => ({ ...toastSettings });

// Load settings on module import
loadToastSettings();
