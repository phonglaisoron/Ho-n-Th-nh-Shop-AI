import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import ShopButton from '@components/ShopButton';
import { useOrderStore } from '@store/useOrderStore';
import { COLORS, SIZES } from '@constants/theme';
import { RootStackParamList } from '@navigation/RootStackNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const OrderDetailScreen = ({ route }: Props) => {
    const { orderId } = route.params;
    const order = useOrderStore((s) => s.getById(orderId));
    const markPaid = useOrderStore((s) => s.markPaid);

    if (!order) {
        return (
            <SafeAreaView style={styles.safe}>
                <Text style={styles.missing}>Không tìm thấy đơn {orderId}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safe} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text style={styles.heading}>Hóa đơn</Text>
                <Text style={styles.row}>Mã: {order.id}</Text>
                <Text style={styles.row}>Trạng thái: {order.status}</Text>
                <Text style={styles.row}>Ngày: {new Date(order.createdAt).toLocaleString('vi-VN')}</Text>

                <Text style={[styles.heading, { marginTop: 20 }]}>Chi tiết</Text>
                {order.items.map((it) => (
                    <View key={it.id} style={styles.itemRow}>
                        <Text style={{ flex: 1 }}>{it.name} × {it.quantity}</Text>
                        <Text>{formatCurrency(it.price * it.quantity)}</Text>
                    </View>
                ))}

                <Text style={styles.total}>Tổng: {formatCurrency(order.total)}</Text>

                {order.status === 'PENDING' ? (
                    <ShopButton
                        title="Thanh toán giả lập (→ PAID)"
                        onPress={() => markPaid(order.id)}
                        style={{ marginTop: 24 }}
                    />
                ) : (
                    <Text style={styles.paidNote}>Đã thanh toán ✓</Text>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background },
    container: { padding: SIZES.padding },
    heading: { fontSize: SIZES.h3, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
    row: { marginBottom: 4, color: COLORS.text },
    itemRow: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
    },
    total: { marginTop: 16, fontSize: SIZES.h3, fontWeight: '800', color: COLORS.text },
    paidNote: { marginTop: 24, color: 'green', fontWeight: '700', textAlign: 'center' },
    missing: { padding: 24, color: COLORS.textLight },
});

export default OrderDetailScreen;