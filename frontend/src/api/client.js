import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Origen del backend sin el sufijo /api, para construir URLs de archivos
// servidos de forma estática (ej. /uploads/avatars/...).
export const apiOrigin = API_URL.replace(/\/api\/?$/, '');

// Convierte una ruta relativa devuelta por el backend (ej. "/uploads/avatars/x.jpg")
// en una URL absoluta que el navegador pueda cargar.
export const resolveFileUrl = (relativePath) => {
    if (!relativePath) return null;
    if (/^https?:\/\//.test(relativePath)) return relativePath;
    return `${apiOrigin}${relativePath}`;
};

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default api;
