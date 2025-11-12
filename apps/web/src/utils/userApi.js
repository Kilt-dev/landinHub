import api from '@landinghub/api'; // Base URL đã được config trong @landinghub/api

export const userApi = {
    getAll: async () => {
        try {
            return await api.get('/api/admin/users'); // Gọi đúng path backend
        } catch (err) {
            console.error('userApi.getAll error:', err.response || err);
            throw err; // Đẩy lỗi ra component
        }
    },
    create: async (data) => {
        try {
            return await api.post('/api/admin/users', data);
        } catch (err) {
            console.error('userApi.create error:', err.response || err);
            throw err;
        }
    },
    update: async (id, data) => {
        try {
            return await api.put(`/api/admin/users/${id}`, data);
        } catch (err) {
            console.error('userApi.update error:', err.response || err);
            throw err;
        }
    },
    remove: async (id) => {
        try {
            return await api.delete(`/api/admin/users/${id}`);
        } catch (err) {
            console.error('userApi.remove error:', err.response || err);
            throw err;
        }
    },
};
