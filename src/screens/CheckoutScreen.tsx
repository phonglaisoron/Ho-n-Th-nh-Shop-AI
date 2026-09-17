import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import ShopButton from '@components/ShopButton';
import { useCartStore, CartItem } from '@store/useCartStore';
import { useOrderStore } from '@store/useOrderStore';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

interface CreateOrderPayload {
    items: CartItem[];
    totalPrice: number;
}

interface CreateOrderResponse {
    orderId: string;
    status: 'PENDING';
}

const createOrderLocal = async (_payload: CreateOrderPayload): Promise<CreateOrderResponse> => {
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1200));
    return { orderId: `ORD-${Date.now()}`, status: 'PENDING' };
};

const CheckoutScreen = () => {
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const items = useCartStore((state) => state.items);
    const totalQuantity = useCartStore((state) => state.totalQuantity());
    const totalPrice = useCartStore((state) => state.totalPrice());
    const clearCart = useCartStore((state) => state.clearCart);
    const addOrder = useOrderStore((s) => s.addOrder);
    const { isDarkMode } = useTheme();

    const dynamicBg = isDarkMode ? '#121212' : COLORS.background;
    const dynamicCardBg = isDarkMode ? '#1E1E1E' : COLORS.surface;
    const dynamicText = isDarkMode ? '#FFFFFF' : COLORS.text;
    const dynamicSubText = isDarkMode ? '#A0A0A0' : COLORS.textLight;
    const dynamicBorder = isDarkMode ? '#2E2E2E' : COLORS.border;

    const { mutate, isPending, isError, isSuccess, data } = useMutation({
        mutationFn: createOrderLocal,
        onSuccess: (res) => {
            addOrder({
                id: res.orderId,
                items: [...items],
                total: totalPrice,
                status: 'PENDING',
                createdAt: new Date().toISOString(),
            });
            clearCart();
            queryClient.invalidateQueries({ queryKey: ['productsInfinite'] });
            setTimeout(() => navigation.goBack(), 1500);
        },
        onError: (err) => console.error('❌ Đặt hàng thất bại:', err),
    });

    const handleConfirm = () => {
        mutate({ items, totalPrice });
    };

    if (isSuccess) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]}>
                <View style={styles.center}>
                    <Text style={styles.successIcon}>✅</Text>
                    <Text style={styles.successText}>Đặt hàng thành công!</Text>
                    <Text style={[styles.orderDetailText, { color: dynamicText }]}>Mã đơn: {data?.orderId}</Text>
                    <Text style={[styles.orderDetailText, { color: dynamicSubText }]}>Trạng thái: PENDING (chờ thanh toán)</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]}>
            <View style={[styles.container, { backgroundColor: dynamicCardBg, borderRadius: SIZES.radius, borderWidth: 1, borderColor: dynamicBorder, margin: SIZES.padding }]}>
                <Text style={[styles.title, { color: dynamicText }]}>Xác nhận đơn hàng</Text>

                <View style={[styles.summaryRow, { borderBottomColor: dynamicBorder }]}>
                    <Text style={[styles.label, { color: dynamicSubText }]}>Số lượng sản phẩm</Text>
                    <Text style={[styles.value, { color: dynamicText }]}>{totalQuantity}</Text>
                </View>
                <View style={[styles.summaryRow, { borderBottomColor: dynamicBorder }]}>
                    <Text style={[styles.label, { color: dynamicSubText }]}>Tổng cộng</Text>
                    <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
                </View>

                {isError && (
                    <Text style={styles.errorText}>Đặt hàng thất bại — vui lòng kiểm tra mạng và bấm thử lại!</Text>
                )}

                {isPending ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 24 }} />
                ) : (
                    <ShopButton
                        title="Xác nhận đặt hàng"
                        onPress={handleConfirm}
                        disabled={totalQuantity === 0}
                        style={styles.confirmBtn}
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    container: { padding: SIZES.padding },
    title: { fontSize: SIZES.h2, fontWeight: 'bold', marginBottom: 20 },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    label: { fontSize: SIZES.body1 },
    value: { fontSize: SIZES.body1, fontWeight: '600' },
    totalValue: { fontSize: SIZES.h2, color: COLORS.primary, fontWeight: 'bold' },
    confirmBtn: { marginTop: 32 },
    errorText: { color: COLORS.error, textAlign: 'center', marginTop: 16 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    successIcon: { fontSize: 60, marginBottom: 12 },
    successText: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.success, marginBottom: 8 },
    orderDetailText: { fontSize: SIZES.body2, marginTop: 4 },
});

export default CheckoutScreen;
