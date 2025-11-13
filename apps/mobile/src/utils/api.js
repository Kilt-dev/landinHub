import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000', // Điều chỉnh nếu backend khác cổng
    headers: { 'Content-Type': 'application/json' },
});

export default api;