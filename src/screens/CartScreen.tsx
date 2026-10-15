import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCartStore } from '@store/useCartStore';
import ShopButton from '@components/ShopButton';
import LiquidGlassView from '@components/ui/LiquidGlassView';
import LiquidBackground from '@components/ui/LiquidBackground';
import { COLORS, SIZES, IOS26_COLORS, COSMIC_THEME } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { hapticLight } from '@utils/haptics';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

const CartScreen = ({ navigation }: any) => {
    const items = useCartStore((state) => state.items);
    const removeItem = useCartStore((state) => state.removeItem);
    const addItem = useCartStore((state) => state.addItem);
    const totalPrice = useCartStore((state) => state.totalPrice());
    const totalQuantity = useCartStore((state) => state.totalQuantity());
    const { isDarkMode } = useTheme();

    const dynamicText = isDarkMode ? '#F8FAFC' : '#0F172A';
    const dynamicSubText = isDarkMode ? '#94A3B8' : '#64748B';

    if (items.length === 0) {
        return (
            <LiquidBackground>
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.emptyContainer}>
                        <LiquidGlassView
                            intensity="prominent"
                            borderRadius={SIZES.radiusXl}
                            bordered={true}
                            sheen={true}
                            glow={true}
                            glowColor={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                            style={styles.emptyCard}
                        >
                            <View style={styles.emptyIconCircle}>
                                <Icon
                                    name="cart-off"
                                    size={44}
                                    color={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                                />
                            </View>
                            <Text style={[styles.emptyTitle, { color: dynamicText }]}>
                                Giỏ hàng trống
                            </Text>
                            <Text style={[styles.emptyText, { color: dynamicSubText }]}>
                                Giỏ hàng của bạn đang trống. Hãy chọn thêm sản phẩm yêu thích nhé!
                            </Text>
                            <ShopButton
                                title="Mua sắm ngay"
                                onPress={() => navigation.navigate('HomeTab')}
                                variant="liquid-primary"
                                icon={<Icon name="shopping" size={16} color="#FFF" />}
                                style={{ marginTop: 20 }}
                            />
                        </LiquidGlassView>
                    </View>
                </SafeAreaView>
            </LiquidBackground>
        );
    }

    return (
        <LiquidBackground>
            <SafeAreaView style={styles.safeArea}>
                {/* Floating Glass Header */}
                <View style={styles.headerWrapper}>
                    <LiquidGlassView
                        intensity="prominent"
                        borderRadius={SIZES.radiusLg}
                        sheen={true}
                        bordered={true}
                        style={styles.headerBar}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <Icon
                                name="cart"
                                size={22}
                                color={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                            />
                            <Text style={[styles.headerTitle, { color: dynamicText }]}>
                                Giỏ hàng của bạn
                            </Text>
                        </View>
                        <View style={styles.itemCountBadge}>
                            <Text style={styles.itemCountText}>{totalQuantity} sản phẩm</Text>
                        </View>
                    </LiquidGlassView>
                </View>

                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: SIZES.padding, paddingBottom: 180 }}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <LiquidGlassView
                            intensity="medium"
                            borderRadius={SIZES.radiusLg}
                            bordered={true}
                            sheen={true}
                            style={styles.cartItem}
                        >
                            <Image
                                source={{ uri: item.image }}
                                style={styles.itemImage}
                                resizeMode="cover"
                            />
                            <View style={{ flex: 1, marginHorizontal: 12 }}>
                                <Text style={[styles.itemName, { color: dynamicText }]} numberOfLines={1}>
                                    {item.name}
                                </Text>
                                <Text
                                    style={[
                                        styles.itemPrice,
                                        { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary },
                                    ]}
                                >
                                    {formatCurrency(item.price)}
                                </Text>

                                {/* Quantity Control Row */}
                                <View style={styles.qtyRow}>
                                    <TouchableOpacity
                                        style={[
                                            styles.qtyBtn,
                                            {
                                                backgroundColor: isDarkMode
                                                    ? 'rgba(255, 255, 255, 0.08)'
                                                    : '#E2E8F0',
                                            },
                                        ]}
                                        onPress={() => {
                                            hapticLight();
                                            removeItem(item.id);
                                        }}
                                    >
                                        <Icon name="minus" size={14} color={dynamicText} />
                                    </TouchableOpacity>
                                    <Text style={[styles.qtyText, { color: dynamicText }]}>
                                        {item.quantity}
                                    </Text>
                                    <TouchableOpacity
                                        style={[
                                            styles.qtyBtn,
                                            {
                                                backgroundColor: isDarkMode
                                                    ? 'rgba(255, 255, 255, 0.08)'
                                                    : '#E2E8F0',
                                            },
                                        ]}
                                        onPress={() => {
                                            hapticLight();
                                            addItem(item);
                                        }}
                                    >
                                        <Icon name="plus" size={14} color={dynamicText} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => {
                                    hapticLight();
                                    removeItem(item.id);
                                }}
                                style={styles.deleteIconBtn}
                            >
                                <Icon name="trash-can-outline" size={18} color={COLORS.error} />
                            </TouchableOpacity>
                        </LiquidGlassView>
                    )}
                />

                {/* Floating Liquid Checkout Pod */}
                <View style={styles.floatingCheckoutWrapper}>
                    <LiquidGlassView
                        intensity="prominent"
                        borderRadius={SIZES.radiusXl}
                        bordered={true}
                        sheen={true}
                        glow={true}
                        glowColor={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                        style={styles.checkoutBar}
                    >
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <Text style={[styles.totalLabel, { color: dynamicSubText }]}>Tổng thanh toán</Text>
                            <Text
                                style={[
                                    styles.totalValue,
                                    { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary },
                                ]}
                            >
                                {formatCurrency(totalPrice)}
                            </Text>
                        </View>
                        <ShopButton
                            title="Tiến hành thanh toán"
                            onPress={() => navigation.navigate('Checkout')}
                            variant="liquid-primary"
                            icon={<Icon name="credit-card-check-outline" size={18} color="#FFF" />}
                        />
                    </LiquidGlassView>
                </View>
            </SafeAreaView>
        </LiquidBackground>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding,
    },
    emptyCard: {
        width: '100%',
        padding: 32,
        alignItems: 'center',
    },
    emptyIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(0, 245, 212, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: SIZES.body2,
        textAlign: 'center',
        lineHeight: 20,
    },
    headerWrapper: {
        paddingHorizontal: SIZES.padding,
        paddingTop: 8,
        paddingBottom: 6,
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    itemCountBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: SIZES.radiusPill,
        backgroundColor: 'rgba(0, 245, 212, 0.15)',
    },
    itemCountText: {
        fontSize: 11,
        fontWeight: '800',
        color: IOS26_COLORS.quantumCyan,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 12,
    },
    itemImage: {
        width: 68,
        height: 68,
        borderRadius: 12,
        backgroundColor: '#0F172A',
    },
    itemName: {
        fontSize: 14,
        fontWeight: '700',
    },
    itemPrice: {
        fontSize: 14,
        fontWeight: '800',
        marginTop: 2,
    },
    qtyRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 6,
    },
    qtyBtn: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyText: {
        fontSize: 13,
        fontWeight: '700',
        minWidth: 16,
        textAlign: 'center',
    },
    deleteIconBtn: {
        padding: 8,
    },
    floatingCheckoutWrapper: {
        position: 'absolute',
        bottom: 84,
        left: 14,
        right: 14,
    },
    checkoutBar: {
        padding: 16,
    },
    totalLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    totalValue: {
        fontSize: 20,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
});

export default CartScreen;