import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from './useCartStore';

export type PaymentStatus = 'PENDING' | 'PAID';

export interface OrderRecord {
    id: string;
    items: CartItem[];
    total: number;
    status: PaymentStatus;
    createdAt: string; // ISO
}

interface OrderState {
    orders: OrderRecord[];
    addOrder: (order: OrderRecord) => void;
    markPaid: (orderId: string) => void;
    getById: (orderId: string) => OrderRecord | undefined;
}

export const useOrderStore = create<OrderState>()(
    persist(
        (set, get) => ({
            orders: [],
            addOrder: (order) => set((s) => ({ orders: [order, ...s.orders] })),
            markPaid: (orderId) =>
                set((s) => ({
                    orders: s.orders.map((o) =>
                        o.id === orderId ? { ...o, status: 'PAID' as const } : o,
                    ),
                })),
            getById: (orderId) => get().orders.find((o) => o.id === orderId),
        }),
        {
            name: 'shopai-orders',
            storage: createJSONStorage(() => AsyncStorage),
        },
    ),
);