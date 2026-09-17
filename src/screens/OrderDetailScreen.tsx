import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ShopButton from '@components/ShopButton';
import { useOrderStore } from '@store/useOrderStore';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { RootStackParamList } from '@navigation/RootStackNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const OrderDetailScreen = ({ route }: Props) => {
    const { orderId } = route.params;
    const order = useOrderStore((s) => s.getById(orderId));
    const markPaid = useOrderStore((s) => s.markPaid);
    const { isDarkMode } = useTheme();

    const dynamicBg = isDarkMode ? '#121212' : COLORS.background;
    const dynamicCardBg = isDarkMode ? '#1E1E1E' : COLORS.surface;
    const dynamicText = isDarkMode ? '#FFFFFF' : COLORS.text;
    const dynamicSubText = isDarkMode ? '#A0A0A0' : COLORS.textLight;
    const dynamicBorder = isDarkMode ? '#2E2E2E' : '#EEEEEE';

    if (!order) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: dynamicBg }]}>
                <Text style={[styles.missing, { color: dynamicSubText }]}>Không tìm thấy đơn {orderId}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: dynamicBg }]} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.container}>
                <View style={[styles.card, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                    <Text style={[styles.heading, { color: COLORS.primary }]}>Thông tin đơn hàng</Text>
                    <Text style={[styles.row, { color: dynamicText }]}>Mã đơn: <Text style={{ fontWeight: '700' }}>{order.id}</Text></Text>
                    <Text style={[styles.row, { color: dynamicText }]}>Trạng thái: <Text style={{ color: order.status === 'PAID' ? COLORS.success : '#FAAD14', fontWeight: '700' }}>{order.status === 'PAID' ? 'Đã thanh toán' : 'Chờ thanh toán'}</Text></Text>
                    <Text style={[styles.row, { color: dynamicSubText }]}>Ngày đặt: {new Date(order.createdAt).toLocaleString('vi-VN')}</Text>
                </View>

                <View style={[styles.card, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder, marginTop: 16 }]}>
                    <Text style={[styles.heading, { color: COLORS.primary }]}>Danh sách sản phẩm</Text>
                    {order.items.map((it) => (
                        <View key={it.id} style={[styles.itemRow, { borderBottomColor: dynamicBorder }]}>
                            <Text style={[{ flex: 1, color: dynamicText }]}>{it.name} × {it.quantity}</Text>
                            <Text style={[{ color: dynamicText, fontWeight: '600' }]}>{formatCurrency(it.price * it.quantity)}</Text>
                        </View>
                    ))}

                    <Text style={[styles.total, { color: dynamicText }]}>Tổng tiền: <Text style={{ color: COLORS.primary }}>{formatCurrency(order.total)}</Text></Text>
                </View>

                {order.status === 'PENDING' ? (
                    <ShopButton
                        title="Thanh toán ngay (→ PAID)"
                        onPress={() => markPaid(order.id)}
                        style={{ marginTop: 24 }}
                    />
                ) : (
                    <Text style={styles.paidNote}>Đã thanh toán thành công ✓</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { padding: SIZES.padding },
    card: {
        borderRadius: SIZES.radius,
        borderWidth: 1,
        padding: 16,
    },
    heading: { fontSize: SIZES.h3, fontWeight: '800', marginBottom: 12 },
    row: { marginBottom: 6, fontSize: 14 },
    itemRow: {
        flexDirection: 'row',
        paddingVertical: 10,
        borderBottomWidth: 1,
    },
    total: { marginTop: 16, fontSize: SIZES.h3, fontWeight: '800' },
    paidNote: { marginTop: 24, color: COLORS.success, fontWeight: '700', fontSize: 16, textAlign: 'center' },
    missing: { padding: 24, textAlign: 'center' },
});

export default OrderDetailScreen;