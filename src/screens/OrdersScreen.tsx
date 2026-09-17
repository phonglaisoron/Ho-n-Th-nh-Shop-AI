import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useOrderStore, OrderRecord } from '@store/useOrderStore';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

type FilterType = 'ALL' | 'PENDING' | 'PAID';

const OrdersScreen = () => {
    const navigation = useNavigation<any>();
    const orders = useOrderStore((s) => s.orders);
    const { isDarkMode } = useTheme();
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');

    const dynamicBg = isDarkMode ? '#121212' : COLORS.background;
    const dynamicCardBg = isDarkMode ? '#1E1E1E' : COLORS.surface;
    const dynamicText = isDarkMode ? '#FFFFFF' : COLORS.text;
    const dynamicSubText = isDarkMode ? '#A0A0A0' : COLORS.textLight;
    const dynamicBorder = isDarkMode ? '#2E2E2E' : COLORS.border;

    const filteredOrders = orders.filter((order) => {
        if (selectedFilter === 'PENDING') return order.status === 'PENDING';
        if (selectedFilter === 'PAID') return order.status === 'PAID';
        return true;
    });

    const renderOrderItem = ({ item }: { item: OrderRecord }) => {
        const isPaid = item.status === 'PAID';
        const totalItems = item.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0;

        return (
            <TouchableOpacity
                style={[
                    styles.card,
                    {
                        backgroundColor: dynamicCardBg,
                        borderColor: dynamicBorder,
                    },
                ]}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
            >
                <View style={styles.cardHeader}>
                    <View style={styles.orderIdContainer}>
                        <Icon name="receipt" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                        <Text style={[styles.orderId, { color: dynamicText }]}>Đơn #{item.id}</Text>
                    </View>
                    <View
                        style={[
                            styles.statusBadge,
                            {
                                backgroundColor: isPaid ? 'rgba(82, 196, 26, 0.15)' : 'rgba(250, 173, 20, 0.15)',
                            },
                        ]}
                    >
                        <Icon
                            name={isPaid ? 'check-circle' : 'clock-outline'}
                            size={14}
                            color={isPaid ? COLORS.success : '#FAAD14'}
                            style={{ marginRight: 4 }}
                        />
                        <Text
                            style={[
                                styles.statusText,
                                { color: isPaid ? COLORS.success : '#D48806' },
                            ]}
                        >
                            {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                        </Text>
                    </View>
                </View>

                <View style={[styles.cardDivider, { backgroundColor: dynamicBorder }]} />

                <View style={styles.cardBody}>
                    <View style={styles.itemSummary}>
                        <Text style={[styles.itemCountText, { color: dynamicSubText }]}>
                            {totalItems} sản phẩm
                        </Text>
                        <Text style={[styles.totalAmount, { color: COLORS.primary }]}>
                            {formatCurrency(item.total)}
                        </Text>
                    </View>
                    <View style={styles.dateRow}>
                        <Icon name="calendar-clock" size={14} color={dynamicSubText} style={{ marginRight: 4 }} />
                        <Text style={[styles.dateText, { color: dynamicSubText }]}>
                            {new Date(item.createdAt).toLocaleString('vi-VN')}
                        </Text>
                    </View>
                </View>

                <View style={[styles.cardFooter, { borderTopColor: dynamicBorder }]}>
                    <Text style={[styles.detailActionText, { color: COLORS.secondary }]}>
                        Xem chi tiết hóa đơn
                    </Text>
                    <Icon name="chevron-right" size={18} color={COLORS.secondary} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: dynamicBg }]} edges={['bottom']}>
            {/* Bộ lọc trạng thái đơn */}
            <View style={[styles.filterBar, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                {(['ALL', 'PENDING', 'PAID'] as FilterType[]).map((filter) => {
                    const isActive = selectedFilter === filter;
                    const label =
                        filter === 'ALL'
                            ? `Tất cả (${orders.length})`
                            : filter === 'PENDING'
                            ? `Chờ thanh toán (${orders.filter((o) => o.status === 'PENDING').length})`
                            : `Đã thanh toán (${orders.filter((o) => o.status === 'PAID').length})`;

                    return (
                        <TouchableOpacity
                            key={filter}
                            style={[
                                styles.filterTab,
                                isActive && [styles.activeFilterTab, { borderBottomColor: COLORS.primary }],
                            ]}
                            onPress={() => setSelectedFilter(filter)}
                        >
                            <Text
                                style={[
                                    styles.filterTabText,
                                    { color: isActive ? COLORS.primary : dynamicSubText },
                                    isActive && styles.activeFilterTabText,
                                ]}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Danh sách đơn hàng */}
            {filteredOrders.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <View style={[styles.emptyIconBg, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFF2F0' }]}>
                        <Icon name="package-variant" size={64} color={COLORS.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: dynamicText }]}>Không tìm thấy đơn hàng</Text>
                    <Text style={[styles.emptySubTitle, { color: dynamicSubText }]}>
                        {selectedFilter === 'ALL'
                            ? 'Bạn chưa có đơn hàng nào. Hãy khám phá và mua sắm ngay!'
                            : 'Không có đơn hàng nào thuộc trạng thái này.'}
                    </Text>
                    <TouchableOpacity
                        style={styles.shopNowBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                            if (navigation.canGoBack()) {
                                navigation.goBack();
                            } else {
                                navigation.navigate('ShopAI', { screen: 'HomeTab' });
                            }
                        }}
                    >
                        <Icon name="shopping-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.shopNowBtnText}>Khám phá sản phẩm</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: SIZES.padding }}
                    showsVerticalScrollIndicator={false}
                    renderItem={renderOrderItem}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: {
        flex: 1,
    },
    filterBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        paddingHorizontal: 8,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeFilterTab: {
        borderBottomWidth: 2,
    },
    filterTabText: {
        fontSize: 13,
        fontWeight: '500',
    },
    activeFilterTabText: {
        fontWeight: '700',
    },
    card: {
        borderRadius: SIZES.radius,
        borderWidth: 1,
        marginBottom: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
    },
    orderIdContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    orderId: {
        fontWeight: '700',
        fontSize: 15,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cardDivider: {
        height: 1,
        marginHorizontal: 14,
    },
    cardBody: {
        padding: 14,
    },
    itemSummary: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    itemCountText: {
        fontSize: 14,
    },
    totalAmount: {
        fontSize: 16,
        fontWeight: '800',
    },
    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 12,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderTopWidth: 1,
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    detailActionText: {
        fontSize: 13,
        fontWeight: '600',
        marginRight: 4,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    emptyIconBg: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 18,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
    },
    emptySubTitle: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
    },
    shopNowBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: SIZES.radius,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    shopNowBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 15,
    },
});

export default OrdersScreen;