import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export interface AddressItem {
    id: string;
    title: string;
    receiver: string;
    phone: string;
    detail: string;
    isDefault: boolean;
}

export interface UserInfo {
    name: string;
    email: string;
    phone?: string;
    avatar?: string;
    points?: number;
    tier?: string;
    addresses?: AddressItem[];
}

const DEFAULT_ADDRESSES: AddressItem[] = [
    {
        id: 'addr_1',
        title: '🏠 Nhà riêng',
        receiver: 'Phong Nguyễn',
        phone: '0987 654 321',
        detail: '123 Đường Nguyễn Trãi, Phường 2, Quận 5, TP. Hồ Chí Minh',
        isDefault: true,
    },
    {
        id: 'addr_2',
        title: '🏢 Văn phòng',
        receiver: 'Phong Nguyễn',
        phone: '0987 654 321',
        detail: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, Quận Bình Thạnh, TP. HCM',
        isDefault: false,
    },
];

interface AuthState {
    token: string | null;
    isLoading: boolean; // Trạng thái đang kiểm tra ổ cứng Keystore
    isUnlocked: boolean; // Trạng thái mở khoá sinh trắc học
    user: UserInfo | null;
    login: (newToken: string, userInfo?: Partial<UserInfo>) => Promise<void>;
    logout: () => Promise<void>;
    checkLocalToken: () => Promise<void>;
    setIsUnlocked: (unlocked: boolean) => void;
    setUser: (userInfo: UserInfo) => void;
    updateProfile: (data: Partial<UserInfo>) => void;
    addPoints: (amount: number) => void;
    addAddress: (address: Omit<AddressItem, 'id'>) => void;
    setDefaultAddress: (id: string) => void;
    deleteAddress: (id: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            isLoading: true,
            isUnlocked: false,
            user: null,

            login: async (newToken, userInfo) => {
                try {
                    await SecureStore.setItemAsync('SHOP_ACCESS_TOKEN', newToken);
                } catch (e) {
                    console.log('[SecureStore] Lỗi lưu token:', e);
                }
                set({
                    token: newToken,
                    isUnlocked: true, // Vừa đăng nhập bằng mật khẩu -> mở cổng sinh trắc luôn
                    user: {
                        name: userInfo?.name || 'Người dùng ShopAI',
                        email: userInfo?.email || 'user@shopai.com',
                        phone: userInfo?.phone || '0987 654 321',
                        points: userInfo?.points ?? 1250,
                        tier: userInfo?.tier || 'Hạng Vàng 👑',
                        addresses: userInfo?.addresses || DEFAULT_ADDRESSES,
                    },
                });
            },

            logout: async () => {
                try {
                    await SecureStore.deleteItemAsync('SHOP_ACCESS_TOKEN');
                } catch (e) {
                    console.log('[SecureStore] Lỗi xoá token:', e);
                }
                set({ token: null, user: null, isUnlocked: false });
            },

            checkLocalToken: async () => {
                try {
                    const storedToken = await SecureStore.getItemAsync('SHOP_ACCESS_TOKEN');
                    if (storedToken) {
                        set({ token: storedToken, isUnlocked: false });
                    } else {
                        set({ token: null, isUnlocked: false });
                    }
                } catch (e) {
                    console.log('[SecureStore] Lỗi đọc Keystore:', e);
                    set({ token: null, isUnlocked: false });
                } finally {
                    set({ isLoading: false });
                }
            },

            setIsUnlocked: (unlocked: boolean) => set({ isUnlocked: unlocked }),
            setUser: (userInfo) => set({ user: userInfo }),
            updateProfile: (data) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...data } : null,
                })),
            addPoints: (amount) =>
                set((state) => ({
                    user: state.user
                        ? { ...state.user, points: (state.user.points || 0) + amount }
                        : null,
                })),
            addAddress: (address) =>
                set((state) => {
                    if (!state.user) return {};
                    const currentAddresses = state.user.addresses || [];
                    const newAddr: AddressItem = {
                        ...address,
                        id: `addr_${Date.now()}`,
                        isDefault: currentAddresses.length === 0 ? true : address.isDefault,
                    };
                    const updatedAddresses = address.isDefault
                        ? currentAddresses.map((a) => ({ ...a, isDefault: false })).concat(newAddr)
                        : currentAddresses.concat(newAddr);
                    return {
                        user: { ...state.user, addresses: updatedAddresses },
                    };
                }),
            setDefaultAddress: (id) =>
                set((state) => {
                    if (!state.user) return {};
                    return {
                        user: {
                            ...state.user,
                            addresses: (state.user.addresses || []).map((a) => ({
                                ...a,
                                isDefault: a.id === id,
                            })),
                        },
                    };
                }),
            deleteAddress: (id) =>
                set((state) => {
                    if (!state.user) return {};
                    return {
                        user: {
                            ...state.user,
                            addresses: (state.user.addresses || []).filter((a) => a.id !== id),
                        },
                    };
                }),
        }),
        {
            name: 'shopai-auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // CHỈ lưu thông tin người dùng vào AsyncStorage, TUYỆT ĐỐI KHÔNG lưu token vào AsyncStorage (Chống M9)
            partialize: (state) => ({
                user: state.user,
            }),
        }
    )
);