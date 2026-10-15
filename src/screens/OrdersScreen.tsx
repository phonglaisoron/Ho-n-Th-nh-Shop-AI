import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axiosClient from '@api/axiosClient';
import LiquidBackground from '@components/ui/LiquidBackground';
import LiquidGlassView from '@components/ui/LiquidGlassView';
import ShopButton from '@components/ShopButton';
import { COLORS, SIZES, IOS26_COLORS, COSMIC_THEME } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { hapticLight } from '@utils/haptics';

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

type FilterType = 'ALL' | 'PENDING' | 'PAID';

export interface BackendOrderItem {
    id?: number | string;
    productId?: string;
    name?: string;
    quantity: number;
    price: number;
    product?: {
        id: string;
        name: string;
        price: number;
        image?: string;
    };
}

export interface BackendOrder {
    id: string;
    total: number;
    status: string;
    createdAt: string;
    items?: BackendOrderItem[];
}

const OrdersScreen = () => {
    const navigation = useNavigation<any>();
    const { isDarkMode } = useTheme();
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');

    const {
        data: orders = [],
        isLoading,
        isRefetching,
        refetch,
    } = useQuery<BackendOrder[]>({
        queryKey: ['orders'],
        queryFn: async () => {
            const res = await axiosClient.get('/api/orders');
            return res.data;
        },
    });

    const dynamicText = isDarkMode ? '#F8FAFC' : '#0F172A';
    const dynamicSubText = isDarkMode ? '#94A3B8' : '#64748B';
    const dynamicBorder = isDarkMode ? 'rgba(0, 245, 212, 0.25)' : 'rgba(0, 0, 0, 0.08)';

    const filteredOrders = orders.filter((order) => {
        if (selectedFilter === 'PENDING') return order.status === 'PENDING';
        if (selectedFilter === 'PAID') return order.status === 'PAID';
        return true;
    });

    const filterTabs: { key: FilterType; label: string; count: number }[] = [
        { key: 'ALL', label: 'Tất cả', count: orders.length },
        {
            key: 'PENDING',
            label: 'Chờ thanh toán',
            count: orders.filter((o) => o.status === 'PENDING').length,
        },
        {
            key: 'PAID',
            label: 'Đã thanh toán',
            count: orders.filter((o) => o.status === 'PAID').length,
        },
    ];

    const renderOrderItem = ({ item }: { item: BackendOrder }) => {
        const isPaid = item.status === 'PAID';
        const totalItems = item.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    hapticLight();
                    navigation.navigate('OrderDetail', { orderId: item.id });
                }}
            >
                <LiquidGlassView
                    intensity="medium"
                    borderRadius={SIZES.radiusLg}
                    bordered={true}
                    sheen={true}
                    style={styles.orderCard}
                >
                    {/* Header đơn hàng */}
                    <View style={styles.cardHeader}>
                        <View style={styles.orderIdContainer}>
                            <View
                                style={[
                                    styles.orderIconCircle,
                                    {
                                        backgroundColor: isDarkMode
                                            ? 'rgba(0, 245, 212, 0.15)'
                                            : 'rgba(2, 132, 199, 0.10)',
                                    },
                                ]}
                            >
                                <Icon
                                    name="receipt"
                                    size={16}
                                    color={isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary}
                                />
                            </View>
                            <Text style={[styles.orderId, { color: dynamicText }]}>
                                #{item.id}
                            </Text>
                        </View>

                        {/* Status badge */}
                        <View
                            style={[
                                styles.statusBadge,
                                {
                                    backgroundColor: isPaid
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : 'rgba(245, 158, 11, 0.15)',
                                    borderColor: isPaid ? '#10B981' : '#F59E0B',
                                    borderWidth: 0.8,
                                },
                            ]}
                        >
                            <Icon
                                name={isPaid ? 'check-circle' : 'clock-outline'}
                                size={12}
                                color={isPaid ? '#10B981' : '#F59E0B'}
                                style={{ marginRight: 4 }}
                            />
                            <Text
                                style={[
                                    styles.statusText,
                                    { color: isPaid ? '#10B981' : '#F59E0B' },
                                ]}
                            >
                                {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                            </Text>
                        </View>
                    </View>

                    {/* Danh sách tóm tắt sản phẩm */}
                    <View style={styles.cardBody}>
                        {item.items && item.items.slice(0, 2).map((it, idx) => (
                            <Text
                                key={idx}
                                style={[styles.itemSummaryLine, { color: dynamicSubText }]}
                                numberOfLines={1}
                            >
                                • {it.product?.name || it.name || ('Sản phẩm #' + (it.productId || idx + 1))} ({it.quantity}x)
                            </Text>
                        ))}
                        {item.items && item.items.length > 2 && (
                            <Text style={[styles.itemMoreText, { color: dynamicSubText }]}>
                                + {item.items.length - 2} sản phẩm khác...
                            </Text>
                        )}
                    </View>

                    <View style={[styles.cardDivider, { backgroundColor: dynamicBorder }]} />

                    {/* Footer đơn hàng: Tổng tiền & Ngày đặt */}
                    <View style={styles.cardFooter}>
                        <View>
                            <Text style={[styles.dateText, { color: dynamicSubText }]}>
                                🕒 {new Date(item.createdAt).toLocaleDateString('vi-VN')} · {totalItems} món
                            </Text>
                            <Text
                                style={[
                                    styles.totalAmount,
                                    { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary },
                                ]}
                            >
                                {formatCurrency(item.total)}
                            </Text>
                        </View>

                        <View style={styles.actionBtnRow}>
                            <Text style={[styles.detailActionText, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                Chi tiết
                            </Text>
                            <Icon
                                name="chevron-right"
                                size={18}
                                color={isDarkMode ? '#00F5D4' : COLORS.primary}
                            />
                        </View>
                    </View>
                </LiquidGlassView>
            </TouchableOpacity>
        );
    };

    return (
        <LiquidBackground>
            <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
                                name="clipboard-text-clock-outline"
                                size={22}
                                color={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                            />
                            <Text style={[styles.headerTitle, { color: dynamicText }]}>
                                Đơn hàng của tôi
                            </Text>
                        </View>
                        <View style={styles.orderCountBadge}>
                            <Text style={styles.orderCountText}>{orders.length} đơn</Text>
                        </View>
                    </LiquidGlassView>
                </View>

                {/* Filter Chip Tabs */}
                <View style={styles.filterWrapper}>
                    {filterTabs.map((tab) => {
                        const active = selectedFilter === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                activeOpacity={0.7}
                                onPress={() => {
                                    hapticLight();
                                    setSelectedFilter(tab.key);
                                }}
                                style={[
                                    styles.filterChip,
                                    active
                                        ? isDarkMode
                                            ? styles.filterChipActiveDark
                                            : styles.filterChipActiveLight
                                        : isDarkMode
                                            ? styles.filterChipInactiveDark
                                            : styles.filterChipInactiveLight,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterChipText,
                                        active
                                            ? isDarkMode
                                                ? styles.filterChipTextActiveDark
                                                : styles.filterChipTextActiveLight
                                            : isDarkMode
                                                ? styles.filterChipTextInactiveDark
                                                : styles.filterChipTextInactiveLight,
                                    ]}
                                >
                                    {tab.label} ({tab.count})
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Danh sách đơn hàng */}
                {isLoading && orders.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                        <Text style={[styles.loadingText, { color: dynamicSubText }]}>Đang tải danh sách đơn hàng...</Text>
                    </View>
                ) : filteredOrders.length === 0 ? (
                    <ScrollView
                        contentContainerStyle={styles.emptyContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefetching}
                                onRefresh={() => {
                                    refetch();
                                }}
                                tintColor={isDarkMode ? '#00F5D4' : COLORS.primary}
                            />
                        }
                    >
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
                                    name="package-variant-closed"
                                    size={44}
                                    color={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                                />
                            </View>
                            <Text style={[styles.emptyTitle, { color: dynamicText }]}>
                                Không tìm thấy đơn hàng
                            </Text>
                            <Text style={[styles.emptySubTitle, { color: dynamicSubText }]}>
                                {selectedFilter === 'ALL'
                                    ? 'Bạn chưa có đơn hàng nào. Hãy khám phá và mua sắm ngay!'
                                    : 'Không có đơn hàng nào thuộc trạng thái này.'}
                            </Text>
                            <ShopButton
                                title="Khám phá sản phẩm"
                                onPress={() => {
                                    if (navigation.canGoBack()) {
                                        navigation.goBack();
                                    } else {
                                        navigation.navigate('ShopAI', { screen: 'HomeTab' });
                                    }
                                }}
                                variant="liquid-primary"
                                icon={<Icon name="shopping" size={16} color="#FFF" />}
                                style={{ marginTop: 20 }}
                            />
                        </LiquidGlassView>
                    </ScrollView>
                ) : (
                    <FlatList
                        data={filteredOrders}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ padding: SIZES.padding, paddingBottom: 120 }}
                        showsVerticalScrollIndicator={false}
                        renderItem={renderOrderItem}
                        refreshing={isRefetching}
                        onRefresh={() => {
                            refetch();
                        }}
                    />
                )}
            </SafeAreaView>
        </LiquidBackground>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
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
    orderCountBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: SIZES.radiusPill,
        backgroundColor: 'rgba(0, 245, 212, 0.15)',
    },
    orderCountText: {
        fontSize: 11,
        fontWeight: '800',
        color: IOS26_COLORS.quantumCyan,
    },
    filterWrapper: {
        flexDirection: 'row',
        paddingHorizontal: SIZES.padding,
        marginVertical: 8,
        gap: 8,
    },
    filterChip: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    filterChipActiveDark: {
        backgroundColor: 'rgba(0, 245, 212, 0.20)',
        borderColor: '#00F5D4',
        shadowColor: '#00F5D4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
    },
    filterChipActiveLight: {
        backgroundColor: '#0284C7',
        borderColor: '#0284C7',
    },
    filterChipInactiveDark: {
        backgroundColor: 'rgba(10, 16, 42, 0.70)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    filterChipInactiveLight: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    filterChipText: {
        fontSize: 11,
        fontWeight: '700',
    },
    filterChipTextActiveDark: {
        color: '#00F5D4',
    },
    filterChipTextActiveLight: {
        color: '#FFFFFF',
    },
    filterChipTextInactiveDark: {
        color: '#94A3B8',
    },
    filterChipTextInactiveLight: {
        color: '#64748B',
    },
    orderCard: {
        padding: 14,
        marginBottom: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    orderIconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    orderId: {
        fontWeight: '800',
        fontSize: 14,
        letterSpacing: 0.3,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    cardBody: {
        marginTop: 8,
        marginBottom: 6,
    },
    itemSummaryLine: {
        fontSize: 12,
        lineHeight: 18,
    },
    itemMoreText: {
        fontSize: 11,
        fontStyle: 'italic',
        marginTop: 2,
    },
    cardDivider: {
        height: 1,
        marginVertical: 10,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 11,
        marginBottom: 2,
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: '900',
    },
    actionBtnRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    detailActionText: {
        fontSize: 12,
        fontWeight: '700',
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
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    loadingText: {
        marginTop: 12,
        fontSize: SIZES.body2,
    },
});

export default OrdersScreen;