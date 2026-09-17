import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useOrderStore } from '@store/useOrderStore';
import { COLORS, SIZES } from '@constants/theme';

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const OrdersScreen = () => {
    const navigation = useNavigation<any>();
    const orders = useOrderStore((s) => s.orders);

    return (
        <SafeAreaView style={styles.safe} edges={['top']}>
            <Text style={styles.title}>Đơn hàng của tôi</Text>
            {orders.length === 0 ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>Chưa có đơn nào. Hãy đặt hàng từ Giỏ.</Text>
                </View>
            ) : (
                <FlatList
                    data={orders}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ padding: SIZES.padding }}
                    renderItem={({ item }) => (
                        <Pressable
                            style={styles.card}
                            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
                        >
                            <Text style={styles.orderId}>{item.id}</Text>
                            <Text style={styles.meta}>
                                {formatCurrency(item.total)} · {item.status}
                            </Text>
                            <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('vi-VN')}</Text>
                        </Pressable>
                    )}
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: COLORS.background },
    title: {
        fontSize: SIZES.h2,
        fontWeight: '800',
        color: COLORS.primary,
        padding: SIZES.padding,
    },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    emptyText: { color: COLORS.textLight, textAlign: 'center' },
    card: {
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    orderId: { fontWeight: '700', fontSize: SIZES.body1, color: COLORS.text },
    meta: { marginTop: 4, color: COLORS.primary, fontWeight: '600' },
    date: { marginTop: 4, color: COLORS.textLight, fontSize: SIZES.body2 },
});

export default OrdersScreen;