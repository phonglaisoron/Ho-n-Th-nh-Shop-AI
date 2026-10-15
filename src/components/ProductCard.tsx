import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SIZES, IOS26_COLORS, COSMIC_THEME } from '@constants/theme';
import { Product } from '../types/product.schema';
import { useCartStore } from '@store/useCartStore';
import { useTheme } from '@contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { hapticLight } from '@utils/haptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width / 2 - SIZES.padding * 1.35;

interface Props {
    product: Product;
    onPress?: () => void;
}

const ProductCard = ({ product, onPress }: Props) => {
    const navigation = useNavigation<any>();
    const addItem = useCartStore((state) => state.addItem);
    const { isDarkMode } = useTheme();

    const dynamicText = isDarkMode ? '#F8FAFC' : '#1E293B';
    const dynamicCardBg = isDarkMode ? 'rgba(12, 17, 44, 0.90)' : '#FFFFFF';
    const dynamicBorder = isDarkMode ? 'rgba(0, 245, 212, 0.28)' : 'rgba(0, 0, 0, 0.08)';
    const dynamicPriceColor = isDarkMode ? COSMIC_THEME.neonCyan : '#0284C7';

    const handlePressCard = useCallback(() => {
        hapticLight();
        if (onPress) {
            onPress();
        } else {
            navigation.navigate('ProductDetail', { productId: product.id });
        }
    }, [navigation, onPress, product.id]);

    const handleAddToCart = useCallback(() => {
        addItem(product);
        hapticLight();
    }, [addItem, product]);

    const formattedPrice = useMemo(() => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(product.price);
    }, [product.price]);

    return (
        <Pressable
            onPress={handlePressCard}
            style={[
                styles.card,
                {
                    backgroundColor: dynamicCardBg,
                    borderColor: dynamicBorder,
                },
                isDarkMode && styles.cardGlowDark,
            ]}
        >
            {/* Image Container with Floating Badges */}
            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: product.image }}
                    style={styles.image}
                    resizeMode="cover"
                    fadeDuration={0}
                />

                {/* Cyber HUD Corner Marker */}
                {isDarkMode && <View style={styles.hudCornerDot} />}

                {/* Floating Badge: Shop Tag */}
                <View style={[
                    styles.ratingBadge,
                    !isDarkMode && {
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        borderColor: 'rgba(16, 185, 129, 0.40)',
                    }
                ]}>
                    <Icon name="check-decagram" size={11} color={isDarkMode ? COSMIC_THEME.neonCyan : '#10B981'} />
                    <Text style={[styles.ratingText, !isDarkMode && { color: '#059669' }]}>CHÍNH HÃNG</Text>
                </View>

                {/* Floating Wishlist Button */}
                <Pressable
                    style={[
                        styles.wishlistBtn,
                        isDarkMode && {
                            backgroundColor: 'rgba(8, 12, 32, 0.85)',
                            borderColor: 'rgba(0, 245, 212, 0.35)',
                            borderWidth: 1,
                        },
                    ]}
                    onPress={() => hapticLight()}
                    hitSlop={6}
                >
                    <Icon
                        name="heart-outline"
                        size={15}
                        color={isDarkMode ? COSMIC_THEME.neonCyan : '#64748B'}
                    />
                </Pressable>

                {/* Floating QR Code Preview Button */}
                <Pressable
                    style={[
                        styles.qrCodeBadgeBtn,
                        isDarkMode && {
                            backgroundColor: 'rgba(8, 12, 32, 0.85)',
                            borderColor: 'rgba(0, 245, 212, 0.35)',
                            borderWidth: 1,
                        },
                    ]}
                    onPress={() => {
                        hapticLight();
                        navigation.navigate('ProductDetail', { productId: product.id, autoOpenQr: true });
                    }}
                    hitSlop={6}
                >
                    <Icon
                        name="qrcode"
                        size={15}
                        color={isDarkMode ? COSMIC_THEME.neonCyan : '#0284C7'}
                    />
                </Pressable>
            </View>

            {/* Content Section */}
            <View style={styles.infoContainer}>
                <Text
                    style={[styles.name, { color: dynamicText }]}
                    numberOfLines={2}
                >
                    {product.name}
                </Text>

                <View style={styles.subtextRow}>
                    <Icon
                        name="truck-fast-outline"
                        size={12}
                        color={isDarkMode ? '#FACC15' : '#059669'}
                    />
                    <Text style={styles.subtext}>Giao siêu tốc 2H · Trả góp 0%</Text>
                </View>

                {/* Price and Add-to-Cart Row */}
                <View style={styles.bottomRow}>
                    <View style={{ flex: 1, marginRight: 6 }}>
                        <Text
                            style={[
                                styles.price,
                                { color: dynamicPriceColor },
                                isDarkMode && styles.priceGlow,
                            ]}
                            numberOfLines={1}
                        >
                            {formattedPrice}
                        </Text>
                    </View>

                    {/* Add-to-Cart Action Button */}
                    <Pressable
                        onPress={handleAddToCart}
                        style={[styles.addBtn, isDarkMode ? styles.addBtnCosmic : styles.addBtnDefault]}
                        android_ripple={{ color: 'rgba(255, 255, 255, 0.3)' }}
                    >
                        <Icon
                            name="cart-plus"
                            size={14}
                            color={isDarkMode ? '#050716' : '#FFFFFF'}
                        />
                        <Text
                            style={[
                                styles.addBtnText,
                                { color: isDarkMode ? '#050716' : '#FFFFFF' },
                            ]}
                        >
                            + Mua
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginHorizontal: SIZES.padding / 4,
        marginBottom: SIZES.padding,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1.2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 14,
        elevation: 5,
    },
    cardGlowDark: {
        borderTopColor: 'rgba(0, 245, 212, 0.50)',
        borderLeftColor: 'rgba(0, 245, 212, 0.35)',
        borderRightColor: 'rgba(147, 51, 234, 0.35)',
        borderBottomColor: 'rgba(255, 0, 122, 0.25)',
        shadowColor: '#00F5D4',
        shadowOpacity: 0.18,
    },
    imageContainer: {
        width: '100%',
        height: CARD_WIDTH * 0.95,
        position: 'relative',
        backgroundColor: '#0F172A',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    hudCornerDot: {
        position: 'absolute',
        bottom: 6,
        left: 6,
        width: 12,
        height: 2,
        backgroundColor: '#00F5D4',
        borderRadius: 1,
        opacity: 0.8,
    },
    ratingBadge: {
        position: 'absolute',
        top: 8,
        left: 8,
        backgroundColor: 'rgba(6, 10, 28, 0.80)',
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 10,
        borderWidth: 0.8,
        borderColor: 'rgba(0, 245, 212, 0.40)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingText: {
        color: '#00F5D4',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    wishlistBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    qrCodeBadgeBtn: {
        position: 'absolute',
        top: 42,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255, 255, 255, 0.88)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    infoContainer: {
        padding: 12,
    },
    name: {
        fontSize: 13,
        fontWeight: '700',
        height: 36,
        lineHeight: 18,
        letterSpacing: -0.1,
    },
    subtextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        marginTop: 2,
        marginBottom: 8,
    },
    subtext: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '500',
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    price: {
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    priceGlow: {
        textShadowColor: 'rgba(0, 245, 212, 0.45)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    addBtn: {
        height: 30,
        paddingHorizontal: 12,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        elevation: 3,
    },
    addBtnCosmic: {
        backgroundColor: '#00F5D4',
        shadowColor: '#00F5D4',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 6,
    },
    addBtnDefault: {
        backgroundColor: '#0284C7',
        shadowColor: '#0284C7',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    addBtnText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.3,
    },
});

export default memo(ProductCard);