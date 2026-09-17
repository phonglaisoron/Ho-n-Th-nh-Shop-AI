import React, { memo } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import { COLORS, SIZES } from '@constants/theme';
import ShopButton from './ShopButton';
import { Product } from '../types/product.schema';
import { useCartStore } from '@store/useCartStore';
import { useTheme } from '@contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - (SIZES.padding * 1.5);

interface Props {
    product: Product;
}

const ProductCard = ({ product }: Props) => {
    const addItem = useCartStore((state) => state.addItem);
    const { isDarkMode } = useTheme();

    const dynamicCardBg = isDarkMode ? '#1E1E1E' : COLORS.surface;
    const dynamicText = isDarkMode ? '#FFFFFF' : COLORS.text;
    const dynamicBorder = isDarkMode ? '#2E2E2E' : '#E8E8E8';

    return (
        <View style={[styles.card, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
            <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
            <View style={styles.infoContainer}>
                <Text style={[styles.name, { color: dynamicText }]} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.price}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                </Text>

                <ShopButton
                    title="Mua ngay"
                    onPress={() => addItem(product)}
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
        borderWidth: 1,
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