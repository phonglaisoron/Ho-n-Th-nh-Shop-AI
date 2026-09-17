import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SIZES } from '@constants/theme';
import ShopButton from './ShopButton';
import { Product } from '../types/product.schema'; // Đổi nguồn Type sang Zod Schema
import { useCartStore } from '@store/useCartStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - (SIZES.padding * 1.5);

interface Props {
    product: Product;
}

const ProductCard = ({ product }: Props) => {
    const addItem = useCartStore((state) => state.addItem); // Lấy hàm bắn lên Đám mây Giỏ hàng

    return (
        <View style={styles.card}>
            <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
            <View style={styles.infoContainer}>
                <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.price}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                </Text>

                <ShopButton
                    title="Mua ngay"
                    onPress={() => addItem(product)} // Bắn thẳng sản phẩm lên Giỏ hàng!
                    style={styles.button}
                    textStyle={{ fontSize: 12 }}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginHorizontal: SIZES.padding / 4,
        marginBottom: SIZES.padding,
        borderRadius: SIZES.radius,
        overflow: 'hidden',
        backgroundColor: COLORS.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    image: {
        width: '100%',
        height: CARD_WIDTH,
    },
    infoContainer: {
        padding: 10,
    },
    name: {
        fontSize: SIZES.body2,
        fontWeight: '500',
        color: COLORS.text,
        height: 40,
    },
    price: {
        fontSize: SIZES.body1,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginVertical: 8,
    },
    button: {
        height: 36,
    },
});

export default memo(ProductCard);