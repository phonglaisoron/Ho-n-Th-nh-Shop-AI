import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '@store/useCartStore';
import ShopButton from '@components/ShopButton';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const CartScreen = ({ navigation }: any) => {
    const items = useCartStore((state) => state.items);
    const removeItem = useCartStore((state) => state.removeItem);
    const totalPrice = useCartStore((state) => state.totalPrice());
    const { isDarkMode } = useTheme();

    const dynamicBg = isDarkMode ? '#121212' : COLORS.background;
    const dynamicCardBg = isDarkMode ? '#1E1E1E' : COLORS.surface;
    const dynamicText = isDarkMode ? '#FFFFFF' : COLORS.text;
    const dynamicSubText = isDarkMode ? '#A0A0A0' : COLORS.textLight;
    const dynamicBorder = isDarkMode ? '#2E2E2E' : '#EEEEEE';

    if (items.length === 0) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>🛒</Text>
                    <Text style={[styles.emptyText, { color: dynamicSubText }]}>Giỏ hàng của bạn đang trống trơn!</Text>
                    <ShopButton
                        title="Quay về mua sắm"
                        onPress={() => navigation.goBack()}
                        style={{ marginTop: 20 }}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]}>
            <View style={[styles.header, { backgroundColor: dynamicCardBg }]}>
                <Text style={[styles.headerTitle, { color: dynamicText }]}>Giỏ hàng của bạn</Text>
            </View>

            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ padding: SIZES.padding }}
                renderItem={({ item }) => (
                    <View style={[styles.cartItem, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.itemName, { color: dynamicText }]} numberOfLines={1}>{item.name}</Text>
                            <Text style={styles.itemPrice}>{formatCurrency(item.price)} x {item.quantity}</Text>
                        </View>
                        <ShopButton
                            title="Xóa"
                            onPress={() => removeItem(item.id)}
                            style={{ width: 70, height: 32, backgroundColor: COLORS.error }}
                            textStyle={{ fontSize: 12 }}
                        />
                    </View>
                )}
            />

            <View style={[styles.footer, { backgroundColor: dynamicCardBg, borderTopColor: dynamicBorder }]}>
                <Text style={[styles.totalLabel, { color: dynamicText }]}>
                    Tổng cộng: <Text style={styles.totalValue}>{formatCurrency(totalPrice)}</Text>
                </Text>
                <ShopButton
                    title="Thanh toán"
                    onPress={() => navigation.navigate('Checkout')}
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.padding },
    emptyIcon: { fontSize: 60, marginBottom: 10 },
    emptyText: { fontSize: SIZES.body1, textAlign: 'center' },
    header: { paddingHorizontal: SIZES.padding, paddingVertical: 15 },
    headerTitle: { fontSize: SIZES.h1, fontWeight: 'bold' },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: SIZES.radius,
        borderWidth: 1,
        padding: 12,
        marginBottom: 10,
    },
    itemName: { fontSize: SIZES.body2, fontWeight: '500' },
    itemPrice: { fontSize: SIZES.body2, color: COLORS.primary, marginTop: 4 },
    footer: {
        padding: SIZES.padding,
        borderTopWidth: 1,
    },
    totalLabel: { fontSize: SIZES.body1, marginBottom: 10 },
    totalValue: { fontWeight: 'bold', color: COLORS.primary },
});

export default CartScreen;