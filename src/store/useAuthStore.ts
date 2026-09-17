import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    user: UserInfo | null;
    login: (newToken: string, userInfo?: Partial<UserInfo>) => void;
    setUser: (userInfo: UserInfo) => void;
    updateProfile: (data: Partial<UserInfo>) => void;
    addPoints: (amount: number) => void;
    addAddress: (address: Omit<AddressItem, 'id'>) => void;
    setDefaultAddress: (id: string) => void;
    deleteAddress: (id: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            token: null,
            user: null,
            login: (newToken, userInfo) => {
                set({
                    token: newToken,
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
            logout: () => set({ token: null, user: null }),
        }),
        {
            name: 'shopai-auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);