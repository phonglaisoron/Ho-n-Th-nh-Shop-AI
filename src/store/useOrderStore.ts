import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from './useCartStore';

export type PaymentStatus = 'PENDING' | 'PAID' | 'PROCESSING';

export interface ShippingAddress {
    id: string;
    recipientName: string;
    phone: string;
    address: string;
    tag: 'Nhà riêng' | 'Văn phòng' | 'Khác';
    isDefault?: boolean;
}

export interface BankPaymentInfo {
    bankName: string;
    bankShortName: string;
    accountNumber: string;
    accountName: string;
    transferContent: string;
    amount: number;
    qrData?: string;
    bin?: string;
    verified: boolean;
}

export interface OrderRecord {
    id: string;
    items: CartItem[];
    subtotal: number;
    shippingFee: number;
    discount: number;
    voucherCode?: string;
    total: number;
    paymentMethod: 'COD' | 'VIETQR' | 'SPAYLATER' | 'CARD';
    payLaterTerm?: string;
    shippingAddress: ShippingAddress;
    deliveryDate: string;
    shippingOption: string;
    bankInfo?: BankPaymentInfo;
    note?: string;
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