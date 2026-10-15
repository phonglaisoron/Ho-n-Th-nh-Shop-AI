import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { addItem, removeItem } from '@store/redux/cartSlice';
import type { ReduxRootState } from '@store/redux/store';
import ShopButton from '@components/ShopButton';
import LiquidBackground from '@components/ui/LiquidBackground';
import LiquidGlassView from '@components/ui/LiquidGlassView';
import { COLORS, SIZES, IOS26_COLORS, COSMIC_THEME } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { hapticLight } from '@utils/haptics';

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const SAMPLE_TECH_PRODUCTS = [
    {
        name: 'Tai nghe Apple AirPods 3 Magsafe',
        price: 3890000,
        image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80',
    },
    {
        name: 'Chuột không dây Logitech MX Master 3S',
        price: 2190000,
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80',
    },
    {
        name: 'Loa Bluetooth Marshall Emberton II',
        price: 3950000,
        image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&q=80',
    },
];

const ReduxCartDemoScreen = () => {
    const items = useSelector((state: ReduxRootState) => state.cartRedux.items);
    const dispatch = useDispatch();
    const { isDarkMode } = useTheme();

    const dynamicText = isDarkMode ? '#F8FAFC' : '#0F172A';
    const dynamicSubText = isDarkMode ? '#94A3B8' : '#64748B';

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleAddSample = (index: number) => {
        hapticLight();
        const sample = SAMPLE_TECH_PRODUCTS[index % SAMPLE_TECH_PRODUCTS.length];
        dispatch(
            addItem({
                id: `rtk_prod_${index}`,
                name: sample.name,
                price: sample.price,
                image: sample.image,
            }),
        );
    };

    return (
        <LiquidBackground>
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
                                name="flask-outline"
                                size={22}
                                color={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                            />
                            <View>
                                <Text style={[styles.headerTitle, { color: dynamicText }]}>
                                    Thử nghiệm Redux
                                </Text>
                                <Text style={[styles.headerSubTitle, { color: dynamicSubText }]}>
                                    Quản lý State với Redux Toolkit
                                </Text>
                            </View>
                        </View>
                        <View style={styles.coreBadge}>
                            <Text style={styles.coreBadgeText}>RTK CORE</Text>
                        </View>
                    </LiquidGlassView>
                </View>

                {/* Quick Add Controls Pod */}
                <View style={styles.actionPodWrapper}>
                    <LiquidGlassView
                        intensity="medium"
                        borderRadius={SIZES.radiusLg}
                        bordered={true}
                        sheen={true}
                        style={styles.actionPod}
                    >
                        <Text style={[styles.actionPodLabel, { color: dynamicSubText }]}>
                            Thêm nhanh sản phẩm mẫu vào giỏ hàng Redux:
                        </Text>
                        <View style={styles.sampleButtonsRow}>
                            {SAMPLE_TECH_PRODUCTS.map((prod, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        styles.sampleChip,
                                        {
                                            backgroundColor: isDarkMode
                                                ? 'rgba(0, 245, 212, 0.12)'
                                                : 'rgba(2, 132, 199, 0.08)',
                                            borderColor: isDarkMode
                                                ? 'rgba(0, 245, 212, 0.35)'
                                                : 'rgba(2, 132, 199, 0.25)',
                                        },
                                    ]}
                                    onPress={() => handleAddSample(idx)}
                                >
                                    <Icon
                                        name="plus"
                                        size={12}
                                        color={isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary}
                                    />
                                    <Text
                                        style={[
                                            styles.sampleChipText,
                                            { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary },
                                        ]}
                                        numberOfLines={1}
                                    >
                                        {idx === 0 ? 'AirPods 3' : idx === 1 ? 'MX Master' : 'Emberton II'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </LiquidGlassView>
                </View>

                {/* Danh sách sản phẩm Redux Cart */}
                {items.length === 0 ? (
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
                                    name="atom"
                                    size={44}
                                    color={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                                />
                            </View>
                            <Text style={[styles.emptyTitle, { color: dynamicText }]}>
                                Giỏ hàng Redux đang trống
                            </Text>
                            <Text style={[styles.emptySubTitle, { color: dynamicSubText }]}>
                                Hãy bấm chọn một trong các nút sản phẩm mẫu phía trên để thử nghiệm tính năng Redux Toolkit.
                            </Text>
                            <ShopButton
                                title="+ Thêm AirPods 3 mẫu"
                                onPress={() => handleAddSample(0)}
                                variant="liquid-primary"
                                icon={<Icon name="plus-circle-outline" size={16} color="#FFF" />}
                                style={{ marginTop: 20 }}
                            />
                        </LiquidGlassView>
                    </View>
                ) : (
                    <>
                        <FlatList
                            data={items}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={{ padding: SIZES.padding, paddingBottom: 170 }}
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
                                        <Text
                                            style={[styles.itemName, { color: dynamicText }]}
                                            numberOfLines={1}
                                        >
                                            {item.name}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.itemPrice,
                                                { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary },
                                            ]}
                                        >
                                            {formatCurrency(item.price)} × {item.quantity}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => {
                                            hapticLight();
                                            dispatch(removeItem(item.id));
                                        }}
                                        style={styles.deleteIconBtn}
                                    >
                                        <Icon name="trash-can-outline" size={18} color={COLORS.error} />
                                    </TouchableOpacity>
                                </LiquidGlassView>
                            )}
                        />

                        {/* Floating Summary Bar */}
                        <View style={styles.floatingSummaryWrapper}>
                            <LiquidGlassView
                                intensity="prominent"
                                borderRadius={SIZES.radiusXl}
                                bordered={true}
                                sheen={true}
                                glow={true}
                                glowColor={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                                style={styles.summaryBar}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View>
                                        <Text style={[styles.summaryLabel, { color: dynamicSubText }]}>
                                            Tổng ({totalQuantity} món)
                                        </Text>
                                        <Text
                                            style={[
                                                styles.summaryTotal,
                                                { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary },
                                            ]}
                                        >
                                            {formatCurrency(totalPrice)}
                                        </Text>
                                    </View>
                                    <ShopButton
                                        title="+ Thêm thêm"
                                        onPress={() => handleAddSample(items.length)}
                                        variant="liquid-primary"
                                        style={{ minWidth: 120 }}
                                    />
                                </View>
                            </LiquidGlassView>
                        </View>
                    </>
                )}
            </SafeAreaView>
        </LiquidBackground>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
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
        fontSize: 17,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    headerSubTitle: {
        fontSize: 11,
        marginTop: 1,
    },
    coreBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: SIZES.radiusPill,
        backgroundColor: 'rgba(139, 92, 246, 0.20)',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.40)',
    },
    coreBadgeText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#A78BFA',
        letterSpacing: 0.5,
    },
    actionPodWrapper: {
        paddingHorizontal: SIZES.padding,
        marginVertical: 8,
    },
    actionPod: {
        padding: 12,
    },
    actionPodLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 8,
    },
    sampleButtonsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    sampleChip: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 12,
        borderWidth: 1,
    },
    sampleChipText: {
        fontSize: 11,
        fontWeight: '700',
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginBottom: 10,
    },
    itemImage: {
        width: 52,
        height: 52,
        borderRadius: 10,
        backgroundColor: '#0F172A',
    },
    itemName: {
        fontSize: 13,
        fontWeight: '700',
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: '800',
        marginTop: 2,
    },
    deleteIconBtn: {
        padding: 8,
    },
    floatingSummaryWrapper: {
        position: 'absolute',
        bottom: 84,
        left: 14,
        right: 14,
    },
    summaryBar: {
        padding: 14,
    },
    summaryLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    summaryTotal: {
        fontSize: 18,
        fontWeight: '900',
        marginTop: 2,
    },
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
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 6,
    },
    emptySubTitle: {
        fontSize: SIZES.body2,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default ReduxCartDemoScreen;
