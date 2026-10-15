import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axiosClient from '@api/axiosClient';

import ShopButton from '@components/ShopButton';
import LiquidBackground from '@components/ui/LiquidBackground';
import LiquidGlassView from '@components/ui/LiquidGlassView';
import { COLORS, SIZES, IOS26_COLORS, COSMIC_THEME } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { RootStackParamList } from '@navigation/RootStackNavigator';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { getVietQrPaymentUrl } from '@utils/qrHelper';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const OrderDetailScreen = ({ route, navigation }: Props) => {
    const { orderId } = route.params;
    const { isDarkMode } = useTheme();
    const queryClient = useQueryClient();

    const { data: order, isLoading } = useQuery({
        queryKey: ['order', orderId],
        queryFn: async () => (await axiosClient.get(`/api/orders/${orderId}`)).data,
    });

    const payMutation = useMutation({
        mutationFn: async () => (await axiosClient.post(`/api/orders/${orderId}/pay`)).data,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['order', orderId] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            hapticSuccess();
            Alert.alert('Thành công', 'Đã ghi nhận thanh toán đơn hàng thành công!');
        },
        onError: (err: any) => {
            Alert.alert('Thất bại', err?.response?.data?.message ?? 'Lỗi khi thanh toán đơn hàng');
        },
    });

    const dynamicText = isDarkMode ? '#F8FAFC' : '#0F172A';
    const dynamicSubText = isDarkMode ? '#94A3B8' : '#64748B';
    const dynamicBorder = isDarkMode ? 'rgba(0, 245, 212, 0.25)' : 'rgba(0, 0, 0, 0.08)';

    if (isLoading && !order) {
        return (
            <LiquidBackground>
                <SafeAreaView style={styles.safe}>
                    <View style={styles.missingContainer}>
                        <ActivityIndicator size="large" color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                        <Text style={[styles.missingText, { color: dynamicSubText, marginTop: 12 }]}>
                            Đang tải chi tiết hóa đơn...
                        </Text>
                    </View>
                </SafeAreaView>
            </LiquidBackground>
        );
    }

    if (!order) {
        return (
            <LiquidBackground>
                <SafeAreaView style={styles.safe}>
                    <View style={styles.missingContainer}>
                        <LiquidGlassView
                            intensity="prominent"
                            borderRadius={SIZES.radiusXl}
                            bordered={true}
                            style={styles.missingCard}
                        >
                            <Icon name="alert-circle-outline" size={48} color={COLORS.error} />
                            <Text style={[styles.missingTitle, { color: dynamicText }]}>
                                Không tìm thấy hóa đơn
                            </Text>
                            <Text style={[styles.missingText, { color: dynamicSubText }]}>
                                Đơn hàng #{orderId} không tồn tại hoặc đã bị xóa.
                            </Text>
                            <ShopButton
                                title="Quay lại"
                                onPress={() => navigation.goBack()}
                                style={{ marginTop: 16 }}
                            />
                        </LiquidGlassView>
                    </View>
                </SafeAreaView>
            </LiquidBackground>
        );
    }

    const isPaid = order.status === 'PAID';


    return (
        <LiquidBackground>
            <SafeAreaView style={styles.safe} edges={['bottom']}>
                <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                    {/* Header Card: Mã đơn & Trạng thái */}
                    <LiquidGlassView
                        intensity="medium"
                        borderRadius={SIZES.radiusLg}
                        bordered={true}
                        sheen={true}
                        style={styles.card}
                    >
                        <View style={styles.orderHeaderRow}>
                            <View>
                                <Text style={[styles.orderIdText, { color: dynamicText }]}>
                                    Đơn hàng #{order.id}
                                </Text>
                                <Text style={[styles.orderDateText, { color: dynamicSubText }]}>
                                    🕒 Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.statusBadge,
                                    {
                                        backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                        borderColor: isPaid ? '#10B981' : '#F59E0B',
                                        borderWidth: 1,
                                    },
                                ]}
                            >
                                <Icon
                                    name={isPaid ? 'check-circle' : 'clock-outline'}
                                    size={14}
                                    color={isPaid ? '#10B981' : '#F59E0B'}
                                    style={{ marginRight: 4 }}
                                />
                                <Text style={[styles.statusBadgeText, { color: isPaid ? '#10B981' : '#F59E0B' }]}>
                                    {isPaid ? 'Đã thanh toán' : 'Chờ thanh toán'}
                                </Text>
                            </View>
                        </View>
                    </LiquidGlassView>

                    {/* Địa chỉ nhận hàng */}
                    {order.shippingAddress && (
                        <LiquidGlassView
                            intensity="medium"
                            borderRadius={SIZES.radiusLg}
                            bordered={true}
                            sheen={true}
                            style={styles.card}
                        >
                            <View style={styles.sectionHeader}>
                                <Icon name="map-marker" size={18} color="#EF4444" />
                                <Text style={[styles.sectionHeading, { color: dynamicText }]}>
                                    Địa chỉ nhận hàng
                                </Text>
                            </View>
                            <View style={{ marginTop: 6 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                    <Text style={[styles.recipientName, { color: dynamicText }]}>
                                        {order.shippingAddress.recipientName}
                                    </Text>
                                    <Text style={[styles.recipientPhone, { color: dynamicSubText }]}>
                                        {order.shippingAddress.phone}
                                    </Text>
                                    <View style={[styles.tagBadge, { backgroundColor: isDarkMode ? 'rgba(0, 245, 212, 0.15)' : '#E0F2FE' }]}>
                                        <Text style={[styles.tagBadgeText, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                            {order.shippingAddress.tag}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.addressDetail, { color: dynamicSubText }]}>
                                    {order.shippingAddress.address}
                                </Text>
                            </View>
                        </LiquidGlassView>
                    )}

                    {/* Vận chuyển & Ngày giao */}
                    <LiquidGlassView
                        intensity="medium"
                        borderRadius={SIZES.radiusLg}
                        bordered={true}
                        sheen={true}
                        style={styles.card}
                    >
                        <View style={styles.sectionHeader}>
                            <Icon name="truck-delivery-outline" size={18} color="#38BDF8" />
                            <Text style={[styles.sectionHeading, { color: dynamicText }]}>
                                Thông tin giao hàng
                            </Text>
                        </View>
                        <View style={{ marginTop: 6, gap: 4 }}>
                            <Text style={[styles.infoRow, { color: dynamicText }]}>
                                Gói vận chuyển: <Text style={{ fontWeight: '700' }}>{order.shippingOption || 'Giao hàng Nhanh'}</Text>
                            </Text>
                            <Text style={[styles.infoRow, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                🕒 Dự kiến nhận hàng: <Text style={{ fontWeight: '700' }}>{order.deliveryDate || '2 - 3 ngày tới'}</Text>
                            </Text>
                        </View>
                    </LiquidGlassView>

                    {/* Phương thức thanh toán & Thông tin Ngân hàng */}
                    <LiquidGlassView
                        intensity="medium"
                        borderRadius={SIZES.radiusLg}
                        bordered={true}
                        sheen={true}
                        style={styles.card}
                    >
                        <View style={styles.sectionHeader}>
                            <Icon name="credit-card-outline" size={18} color="#A855F7" />
                            <Text style={[styles.sectionHeading, { color: dynamicText }]}>
                                Phương thức thanh toán
                            </Text>
                        </View>
                        <View style={{ marginTop: 6, gap: 4 }}>
                            <Text style={[styles.infoRow, { color: dynamicText }]}>
                                Hình thức: <Text style={{ fontWeight: '700' }}>
                                    {order.paymentMethod === 'VIETQR'
                                        ? 'Quét mã QR Ngân hàng (VietQR / Napas 247)'
                                        : order.paymentMethod === 'COD'
                                            ? 'Thanh toán tiền mặt khi nhận hàng (COD)'
                                            : order.paymentMethod === 'SPAYLATER'
                                                ? `Ví Trả Sau SPayLater (${order.payLaterTerm || '3 tháng'})`
                                                : 'Thẻ Quốc tế / ATM'}
                                </Text>
                            </Text>

                            {order.paymentMethod === 'VIETQR' && (
                                <View style={[styles.orderVietQrBox, { backgroundColor: isDarkMode ? 'rgba(0, 245, 212, 0.06)' : '#F0FDF4', borderColor: isDarkMode ? 'rgba(0, 245, 212, 0.3)' : '#86EFAC' }]}>
                                    <View style={styles.orderQrHeader}>
                                        <Text style={[styles.orderQrTitle, { color: dynamicText }]}>
                                            {isPaid ? '✓ Đã thanh toán qua VietQR' : 'Mã QR Chuyển Khoản Thanh Toán'}
                                        </Text>
                                        <View style={[styles.orderQrBadge, { backgroundColor: isPaid ? '#10B981' : '#F59E0B' }]}>
                                            <Text style={styles.orderQrBadgeText}>
                                                {isPaid ? 'Đã thanh toán' : 'Chờ chuyển khoản'}
                                            </Text>
                                        </View>
                                    </View>

                                    {!isPaid && (
                                        <View style={styles.orderQrBody}>
                                            <View style={styles.orderQrWhiteFrame}>
                                                <Image
                                                    source={{
                                                        uri: getVietQrPaymentUrl({
                                                            bankCode: order.bankInfo?.bankShortName || 'vietcombank',
                                                            accountNumber: order.bankInfo?.accountNumber || '1039095165',
                                                            amount: order.total,
                                                            content: order.bankInfo?.transferContent || ('SHOPAI ' + order.id),
                                                            accountName: order.bankInfo?.accountName || 'HO THI HUE MAN',
                                                            template: 'compact2',
                                                        }),
                                                    }}
                                                    style={{ width: 160, height: 160 }}
                                                    resizeMode="contain"
                                                />
                                            </View>
                                            <Text style={[styles.orderQrHint, { color: dynamicSubText }]}>
                                                Mở ứng dụng ngân hàng để quét mã thanh toán {formatCurrency(order.total)}
                                            </Text>

                                            {order.bankInfo && (
                                                <View style={styles.bankFieldsMini}>
                                                    <Text style={[styles.bankFieldMiniItem, { color: dynamicText }]}>
                                                        Ngân hàng: <Text style={{ fontWeight: '700' }}>{order.bankInfo.bankName}</Text>
                                                    </Text>
                                                    <Text style={[styles.bankFieldMiniItem, { color: dynamicText }]}>
                                                        Chủ TK: <Text style={{ fontWeight: '700' }}>{order.bankInfo.accountName}</Text>
                                                    </Text>
                                                    <Text style={[styles.bankFieldMiniItem, { color: dynamicText }]}>
                                                        Số TK: <Text style={{ fontWeight: '800' }}>{order.bankInfo.accountNumber}</Text>
                                                    </Text>
                                                    <Text style={[styles.bankFieldMiniItem, { color: '#EF4444' }]}>
                                                        Nội dung CK: <Text style={{ fontWeight: '800' }}>{order.bankInfo.transferContent}</Text>
                                                    </Text>
                                                </View>
                                            )}

                                            <TouchableOpacity
                                                style={[styles.confirmPaidBtn, { backgroundColor: isDarkMode ? '#00F5D4' : COLORS.primary }]}
                                                disabled={payMutation.isPending}
                                                onPress={() => payMutation.mutate()}
                                            >
                                                {payMutation.isPending ? (
                                                    <ActivityIndicator size="small" color={isDarkMode ? '#060A1F' : '#FFFFFF'} />
                                                ) : (
                                                    <>
                                                        <Icon name="check-decagram" size={16} color={isDarkMode ? '#060A1F' : '#FFFFFF'} />
                                                        <Text style={[styles.confirmPaidBtnText, { color: isDarkMode ? '#060A1F' : '#FFFFFF' }]}>
                                                            Tôi đã chuyển khoản xong
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            )}
                        </View>
                    </LiquidGlassView>

                    {/* Danh sách sản phẩm */}
                    <LiquidGlassView
                        intensity="medium"
                        borderRadius={SIZES.radiusLg}
                        bordered={true}
                        sheen={true}
                        style={styles.card}
                    >
                        <View style={styles.sectionHeader}>
                            <Icon name="shopping-outline" size={18} color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                            <Text style={[styles.sectionHeading, { color: dynamicText }]}>
                                Danh sách sản phẩm ({order.items?.length || 0})
                            </Text>
                        </View>

                        {(order.items || []).map((it: any, idx: number) => {
                            const itemName = it.product?.name || it.name || ('Sản phẩm #' + (it.productId || idx + 1));
                            const itemPrice = it.product?.price ?? it.price ?? 0;
                            const itemImage = it.product?.image || it.image;
                            return (
                                <View
                                    key={it.id || idx}
                                    style={[
                                        styles.itemRow,
                                        idx < (order.items?.length || 0) - 1 && { borderBottomWidth: 1, borderBottomColor: dynamicBorder },
                                    ]}
                                >
                                    {itemImage && (
                                        <Image source={{ uri: itemImage }} style={styles.itemThumb} />
                                    )}
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <Text style={[styles.itemName, { color: dynamicText }]} numberOfLines={2}>
                                            {itemName}
                                        </Text>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                            <Text style={[styles.itemPrice, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>
                                                {formatCurrency(itemPrice)}
                                            </Text>
                                            <Text style={[styles.itemQty, { color: dynamicSubText }]}>x{it.quantity}</Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </LiquidGlassView>

                    {/* Chi tiết thanh toán / Tổng kết */}
                    <LiquidGlassView
                        intensity="medium"
                        borderRadius={SIZES.radiusLg}
                        bordered={true}
                        sheen={true}
                        style={styles.card}
                    >
                        <View style={styles.sectionHeader}>
                            <Icon name="receipt" size={18} color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                            <Text style={[styles.sectionHeading, { color: dynamicText }]}>
                                Chi tiết tiền thanh toán
                            </Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: dynamicSubText }]}>Tiền hàng</Text>
                            <Text style={[styles.summaryVal, { color: dynamicText }]}>
                                {formatCurrency(order.subtotal || order.total)}
                            </Text>
                        </View>

                        {order.shippingFee !== undefined && order.shippingFee > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: dynamicSubText }]}>Phí vận chuyển</Text>
                                <Text style={[styles.summaryVal, { color: dynamicText }]}>
                                    {formatCurrency(order.shippingFee)}
                                </Text>
                            </View>
                        )}

                        {order.discount !== undefined && order.discount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: '#10B981' }]}>
                                    Giảm giá {order.voucherCode ? `(${order.voucherCode})` : ''}
                                </Text>
                                <Text style={[styles.summaryVal, { color: '#10B981', fontWeight: '700' }]}>
                                    -{formatCurrency(order.discount)}
                                </Text>
                            </View>
                        )}

                        <View style={[styles.divider, { backgroundColor: dynamicBorder }]} />

                        <View style={styles.totalRow}>
                            <Text style={[styles.totalLabel, { color: dynamicText }]}>Tổng thanh toán:</Text>
                            <Text style={[styles.totalAmount, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>
                                {formatCurrency(order.total)}
                            </Text>
                        </View>
                    </LiquidGlassView>

                    {/* Action Button */}
                    {!isPaid ? (
                        <ShopButton
                            title="Xác nhận đã thanh toán"
                            onPress={() => payMutation.mutate()}
                            isLoading={payMutation.isPending}
                            variant="liquid-primary"
                            icon={<Icon name="check-decagram" size={18} color="#FFF" />}
                            style={{ marginTop: 8 }}
                        />
                    ) : (
                        <View style={styles.paidSuccessBanner}>
                            <Icon name="shield-check" size={20} color="#10B981" />
                            <Text style={styles.paidSuccessBannerText}>Đơn hàng đã thanh toán an toàn ✓</Text>
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </LiquidBackground>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { padding: SIZES.padding, gap: 12 },
    card: { padding: 14 },
    orderHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderIdText: {
        fontSize: 16,
        fontWeight: '800',
    },
    orderDateText: {
        fontSize: 12,
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    sectionHeading: {
        fontSize: 14,
        fontWeight: '800',
    },
    recipientName: {
        fontSize: 13,
        fontWeight: '700',
    },
    recipientPhone: {
        fontSize: 12,
    },
    tagBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    tagBadgeText: {
        fontSize: 9,
        fontWeight: '800',
    },
    addressDetail: {
        fontSize: 12,
        lineHeight: 16,
    },
    infoRow: {
        fontSize: 13,
    },
    bankDetailsSubBox: {
        marginTop: 6,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        gap: 2,
    },
    bankName: {
        fontSize: 13,
        fontWeight: '800',
    },
    bankSubText: {
        fontSize: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    itemThumb: {
        width: 48,
        height: 48,
        borderRadius: 8,
        backgroundColor: '#0F172A',
    },
    itemName: {
        fontSize: 13,
        fontWeight: '700',
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: '800',
    },
    itemQty: {
        fontSize: 12,
        fontWeight: '600',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    summaryLabel: {
        fontSize: 13,
    },
    summaryVal: {
        fontSize: 13,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 8,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    totalLabel: {
        fontSize: 15,
        fontWeight: '800',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '900',
    },
    paidSuccessBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#10B981',
    },
    paidSuccessBannerText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: '800',
    },
    missingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding,
    },
    missingCard: {
        width: '100%',
        padding: 24,
        alignItems: 'center',
    },
    missingTitle: {
        fontSize: 18,
        fontWeight: '800',
        marginTop: 12,
        marginBottom: 6,
    },
    missingText: {
        fontSize: 13,
        textAlign: 'center',
    },
    orderVietQrBox: {
        borderRadius: 14,
        borderWidth: 1.5,
        padding: 14,
        marginTop: 10,
    },
    orderQrHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderQrTitle: {
        fontSize: 13,
        fontWeight: '800',
    },
    orderQrBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    orderQrBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    orderQrBody: {
        alignItems: 'center',
    },
    orderQrWhiteFrame: {
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
        marginBottom: 10,
    },
    orderQrHint: {
        fontSize: 11,
        textAlign: 'center',
        marginBottom: 12,
        lineHeight: 16,
        paddingHorizontal: 8,
    },
    bankFieldsMini: {
        width: '100%',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: 10,
        gap: 4,
        marginBottom: 12,
    },
    bankFieldMiniItem: {
        fontSize: 12,
    },
    confirmPaidBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 44,
        borderRadius: 12,
        gap: 6,
    },
    confirmPaidBtnText: {
        fontSize: 13,
        fontWeight: '800',
    },
});

export default OrderDetailScreen;