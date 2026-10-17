// src/constants/env.ts
export type AppEnv = 'development' | 'staging' | 'production';

// __DEV__ là biến toàn cục của React Native: true khi chạy qua Metro, false ở bản build Release.
// Nhờ nó, chỉ một dòng này đã tự phân biệt được máy dev với máy người dùng thật.
export const APP_ENV: AppEnv = __DEV__ ? 'development' : 'production';

// Bảng địa chỉ Server cho từng môi trường — thay cho việc hardcode IP LAN ở Chương 9
const API_URLS: Record<AppEnv, string> = {
  // Đổi IP LAN này khi bạn đổi mạng Wifi (xem lại bẫy Localhost ở Chương 9, Phần 9.4)
  // Lưu ý: IP Wi-Fi hiện tại của máy tính bạn là 192.168.1.78
  development: 'http://192.168.1.78:3000',
  staging: 'https://staging-api.shopai.com',
  production: 'https://api.shopai.com',
};

export const API_BASE_URL = API_URLS[APP_ENV];

// Cờ bật/tắt tính năng theo môi trường — tránh làm nhiễu dữ liệu thật bằng log lúc đang code
export const ENABLE_CRASHLYTICS = APP_ENV !== 'development';
export const ENABLE_OTA_UPDATE = APP_ENV !== 'development';

// Hiển thị ở màn hình Giới thiệu / góc dưới HomeScreen (xem Phần 10.10)
export const APP_VERSION = '1.0.0';
