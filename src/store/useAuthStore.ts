import { create } from 'zustand';

export interface UserInfo {
    name: string;
    email: string;
}

interface AuthState {
    token: string | null;
    user: UserInfo | null;
    login: (newToken: string, userInfo?: UserInfo) => void;
    setUser: (userInfo: UserInfo) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    token: null, // Khởi tạo chưa đăng nhập
    user: null,  // Thông tin người dùng đăng nhập
    login: (newToken, userInfo) => {
        set({
            token: newToken,
            user: userInfo || { name: 'Người dùng ShopAI', email: 'user@shopai.com' },
        });
    },
    setUser: (userInfo) => set({ user: userInfo }),
    logout: () => set({ token: null, user: null }),
}));