import axios from 'axios';
import { useAuthStore } from '@store/useAuthStore';

const axiosClient = axios.create({
  baseURL: 'https://api.shopai.com', // Domain gốc — chỉ sửa 1 nơi duy nhất
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// REQUEST INTERCEPTOR: tự động lấy Token từ Zustand và gắn vào Header mọi Request
axiosClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// RESPONSE INTERCEPTOR: bắt lỗi 401 (Token hết hạn) tập trung một chỗ
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('⚠️ Token hết hạn hoặc không hợp lệ — tự động đăng xuất!');
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
