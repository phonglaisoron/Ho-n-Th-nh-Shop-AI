import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../types/product.schema';

// Một dòng trong Giỏ hàng = Sản phẩm gốc + số lượng đang chọn
export interface CartItem extends Product {
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    totalQuantity: () => number;
    totalPrice: () => number;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            // Nếu sản phẩm đã có trong giỏ -> Chỉ tăng quantity. Chưa có -> Thêm dòng mới.
            addItem: (product) => {
                set((state) => {
                    const existing = state.items.find((item) => item.id === product.id);
                    if (existing) {
                        return {
                            items: state.items.map((item) =>
                                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                            ),
                        };
                    }
                    return { items: [...state.items, { ...product, quantity: 1 }] };
                });
            },

            removeItem: (productId) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== productId),
                }));
            },

            // Dùng get() để tính toán "on-demand" thay vì lưu sẵn một State thừa dễ lệch dữ liệu
            totalQuantity: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),

            clearCart: () => set({ items: [] }),
        }),
        {
            name: 'shopai-cart-storage', // "Chìa khóa" lưu trong AsyncStorage
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ items: state.items }) as CartState,
        }
    )
);
