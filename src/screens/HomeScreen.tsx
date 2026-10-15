import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useInfiniteQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DrawerActions, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ProductCard from '@components/ProductCard';
import ShopButton from '@components/ShopButton';
import LocationBadge from '@components/LocationBadge';
import LiquidBackground from '@components/ui/LiquidBackground';
import { COLORS, SIZES, IOS26_COLORS, COSMIC_THEME } from '@constants/theme';
import { useAuthStore } from '@store/useAuthStore';
import { useCartStore } from '@store/useCartStore';
import { useTheme } from '@contexts/ThemeContext';
import { MOCK_PRODUCTS } from '@data/mockProducts';
import { API_BASE_URL } from '@constants/api';
import { Product, ProductListSchema } from '../types/product.schema';
import { parseScannedProductCode } from '@utils/qrHelper';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';
import type { MainTabParamList } from '@navigation/MainTabNavigator';
import type { RootStackParamList } from '@navigation/RootStackNavigator';

type Props = CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, 'Home'>,
    CompositeScreenProps<
        BottomTabScreenProps<MainTabParamList>,
        NativeStackScreenProps<RootStackParamList>
    >
>;

const PAGE_SIZE = 10;
const TOTAL_MOCK_PRODUCTS = MOCK_PRODUCTS.length;

const SHOP_CATEGORIES = [
    { id: 'all', name: '⚡ Tất cả' },
    { id: 'phone', name: '📱 Điện thoại' },
    { id: 'laptop', name: '💻 Laptop & PC' },
    { id: 'audio', name: '🎧 Tai nghe & Loa' },
    { id: 'watch', name: '⌚ Đồng hồ' },
    { id: 'accessories', name: '🔌 Phụ kiện' },
];

interface ProductPage {
    items: Product[];
    nextPage: number | null;
}

class ZodValidationError extends Error { }
class NetworkError extends Error { }

const API_URL = `${API_BASE_URL}/api/products`;

const fetchProductsAPI = async (): Promise<Product[]> => {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new NetworkError('Lỗi mạng từ Server NestJS');
    }
    const rawData = await response.json(); // Dữ liệu thô — chưa hề được tin tưởng

    // TRẠM KIỂM SOÁT ZOD: không vì Server là "hàng nhà mình" mà bỏ qua bước kiểm duyệt này
    const result = ProductListSchema.safeParse(rawData);
    if (!result.success) {
        console.error('❌ Zod chặn dữ liệu bẩn từ Server NestJS:', result.error.format());
        throw new ZodValidationError('Dữ liệu sản phẩm từ Server không hợp lệ (Zod validation failed)!');
    }

    return result.data;
};

const fetchProductsPage = async ({ pageParam }: { pageParam: number }): Promise<ProductPage> => {
    const all = await fetchProductsAPI();
    const start = (pageParam - 1) * PAGE_SIZE;
    const items = all.slice(start, start + PAGE_SIZE);
    const hasMore = start + PAGE_SIZE < all.length;
    return { items, nextPage: hasMore ? pageParam + 1 : null };
};

const HomeScreen = ({ navigation, route }: Props) => {
    const scannedCode = route?.params?.scannedCode;
    const logout = useAuthStore(state => state.logout);
    const totalQuantity = useCartStore(state => state.totalQuantity());
    const { isDarkMode, toggleTheme } = useTheme();
    const [selectedCategory, setSelectedCategory] = useState('all');

    const dynamicText = isDarkMode ? '#F8FAFC' : '#0F172A';

    // Tự động điều hướng đến chi tiết sản phẩm nếu nhận mã quét từ camera
    useEffect(() => {
        if (scannedCode) {
            const pid = parseScannedProductCode(scannedCode);
            if (pid) {
                navigation.navigate('ProductDetail', { productId: pid });
            }
        }
    }, [scannedCode, navigation]);

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isRefetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['productsInfinite'],
        queryFn: fetchProductsPage,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    });

    const allProducts = data?.pages.flatMap((page) => page.items) ?? [];
    const displayedProducts = selectedCategory === 'all'
        ? allProducts
        : allProducts.filter((item) => item.category === selectedCategory);

    const errorMessage =
        error instanceof ZodValidationError
            ? '⚠️ Dữ liệu sản phẩm không đúng định dạng!'
            : '📡 Không thể kết nối máy chủ — vui lòng kéo xuống để thử lại!';

    const renderProductItem = useCallback(
        ({ item }: { item: Product }) => (
            <ProductCard
                product={item}
                onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
            />
        ),
        [navigation]
    );

    const keyExtractor = useCallback((item: Product) => item.id, []);

    return (
        <LiquidBackground>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.container}>
                    {/* Sci-Fi Space Station Header */}
                    <View style={styles.headerWrapper}>
                        <View
                            style={[
                                styles.headerBar,
                                {
                                    backgroundColor: isDarkMode
                                        ? 'rgba(10, 16, 42, 0.88)'
                                        : 'rgba(255, 255, 255, 0.90)',
                                    borderColor: isDarkMode
                                        ? 'rgba(0, 245, 212, 0.35)'
                                        : 'rgba(255, 255, 255, 0.90)',
                                },
                            ]}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <Pressable
                                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                                    style={[
                                        styles.glassActionBtn,
                                        {
                                            backgroundColor: isDarkMode
                                                ? 'rgba(0, 245, 212, 0.12)'
                                                : 'rgba(0, 0, 0, 0.04)',
                                            borderColor: isDarkMode ? 'rgba(0, 245, 212, 0.30)' : 'transparent',
                                            borderWidth: 1,
                                        },
                                    ]}
                                >
                                    <Icon
                                        name="menu"
                                        size={20}
                                        color={isDarkMode ? COSMIC_THEME.neonCyan : dynamicText}
                                    />
                                </Pressable>
                                <View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={[styles.headerTitle, { color: dynamicText }]}>
                                            Shop<Text style={{ color: COSMIC_THEME.neonCyan }}>AI</Text>
                                        </Text>
                                        <View style={styles.stationBadge}>
                                            <Text style={styles.stationText}>CHÍNH HÃNG</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                {/* Tư vấn AI Gemini */}
                                <Pressable
                                    onPress={() => navigation.navigate('AIChat')}
                                    style={[
                                        styles.glassActionBtn,
                                        {
                                            backgroundColor: isDarkMode
                                                ? 'rgba(0, 245, 212, 0.20)'
                                                : 'rgba(2, 132, 199, 0.10)',
                                            borderColor: isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary,
                                            borderWidth: 1.2,
                                        },
                                    ]}
                                >
                                    <Icon
                                        name="robot-outline"
                                        size={19}
                                        color={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                                    />
                                </Pressable>

                                {/* Quét mã vạch / QR sản phẩm */}
                                <Pressable
                                    onPress={() => navigation.navigate('Scanner')}
                                    style={[
                                        styles.glassActionBtn,
                                        {
                                            backgroundColor: isDarkMode
                                                ? 'rgba(0, 245, 212, 0.15)'
                                                : 'rgba(0, 0, 0, 0.04)',
                                            borderColor: isDarkMode ? 'rgba(0, 245, 212, 0.40)' : 'transparent',
                                            borderWidth: 1,
                                        },
                                    ]}
                                >
                                    <Icon
                                        name="barcode-scan"
                                        size={19}
                                        color={isDarkMode ? COSMIC_THEME.neonCyan : '#0284C7'}
                                    />
                                </Pressable>

                                {/* Chuyển giao diện Sáng / Tối */}
                                <Pressable
                                    onPress={toggleTheme}
                                    style={[
                                        styles.glassActionBtn,
                                        {
                                            backgroundColor: isDarkMode
                                                ? 'rgba(147, 51, 234, 0.20)'
                                                : 'rgba(0, 0, 0, 0.04)',
                                            borderColor: isDarkMode ? 'rgba(147, 51, 234, 0.40)' : 'transparent',
                                            borderWidth: 1,
                                        },
                                    ]}
                                >
                                    <Text style={{ fontSize: 14 }}>{isDarkMode ? '☀️' : '🌙'}</Text>
                                </Pressable>

                                {/* Nút Giỏ hàng với số lượng */}
                                <Pressable
                                    onPress={() => navigation.navigate('Cart')}
                                    style={[
                                        styles.glassActionBtn,
                                        {
                                            backgroundColor: isDarkMode
                                                ? 'rgba(0, 245, 212, 0.15)'
                                                : 'rgba(2, 132, 199, 0.08)',
                                            borderColor: isDarkMode ? 'rgba(0, 245, 212, 0.40)' : 'transparent',
                                            borderWidth: 1,
                                        },
                                    ]}
                                >
                                    <Icon
                                        name="cart-outline"
                                        size={20}
                                        color={isDarkMode ? COSMIC_THEME.neonCyan : '#0284C7'}
                                    />
                                    {totalQuantity > 0 && (
                                        <View
                                            style={[
                                                styles.cartBadge,
                                                { backgroundColor: isDarkMode ? '#00F5D4' : '#0284C7' },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.cartBadgeText,
                                                    { color: isDarkMode ? '#050716' : '#FFFFFF' },
                                                ]}
                                            >
                                                {totalQuantity > 99 ? '99+' : totalQuantity}
                                            </Text>
                                        </View>
                                    )}
                                </Pressable>

                                {/* Nút Đăng xuất */}
                                <Pressable
                                    onPress={logout}
                                    style={[
                                        styles.glassActionBtn,
                                        {
                                            backgroundColor: isDarkMode
                                                ? 'rgba(239, 68, 68, 0.15)'
                                                : 'rgba(239, 68, 68, 0.08)',
                                            borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.40)' : 'transparent',
                                            borderWidth: 1,
                                        },
                                    ]}
                                >
                                    <Icon
                                        name="logout-variant"
                                        size={18}
                                        color={isDarkMode ? '#F87171' : '#EF4444'}
                                    />
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    {/* Thẻ vị trí giao hàng */}
                    <LocationBadge />

                    {/* Banner Tư vấn AI Gemini 2026 */}
                    <Pressable
                        onPress={() => navigation.navigate('AIChat')}
                        style={[
                            styles.aiBanner,
                            {
                                backgroundColor: isDarkMode
                                    ? 'rgba(0, 245, 212, 0.10)'
                                    : 'rgba(2, 132, 199, 0.08)',
                                borderColor: isDarkMode
                                    ? 'rgba(0, 245, 212, 0.35)'
                                    : 'rgba(2, 132, 199, 0.25)',
                            },
                        ]}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <Text style={{ fontSize: 24 }}>🤖</Text>
                            <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[styles.aiBannerTitle, { color: dynamicText }]}>
                                        Trợ lý tư vấn AI Gemini
                                    </Text>
                                    <View style={styles.aiNewBadge}>
                                        <Text style={styles.aiNewBadgeText}>AI 2026</Text>
                                    </View>
                                </View>
                                <Text
                                    style={[
                                        styles.aiBannerSubtitle,
                                        { color: isDarkMode ? '#94A3B8' : '#64748B' },
                                    ]}
                                    numberOfLines={1}
                                >
                                    Hỏi giá, so sánh cấu hình & giải đáp ngay
                                </Text>
                            </View>
                        </View>
                        <View
                            style={[
                                styles.aiBannerBtn,
                                {
                                    backgroundColor: isDarkMode
                                        ? IOS26_COLORS.quantumCyan
                                        : COLORS.primary,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.aiBannerBtnText,
                                    { color: isDarkMode ? '#050716' : '#FFFFFF' },
                                ]}
                            >
                                Hỏi ngay
                            </Text>
                        </View>
                    </Pressable>

                    {/* Thanh danh mục sản phẩm */}
                    <View style={styles.categoriesWrapper}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.categoriesList}
                        >
                            {SHOP_CATEGORIES.map((cat) => {
                                const active = selectedCategory === cat.id;
                                return (
                                    <Pressable
                                        key={cat.id}
                                        onPress={() => setSelectedCategory(cat.id)}
                                        style={[
                                            styles.catChip,
                                            active
                                                ? isDarkMode
                                                    ? styles.catChipActiveDark
                                                    : styles.catChipActiveLight
                                                : isDarkMode
                                                    ? styles.catChipInactiveDark
                                                    : styles.catChipInactiveLight,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.catChipText,
                                                active
                                                    ? isDarkMode
                                                        ? styles.catChipTextActiveDark
                                                        : styles.catChipTextActiveLight
                                                    : isDarkMode
                                                        ? styles.catChipTextInactiveDark
                                                        : styles.catChipTextInactiveLight,
                                            ]}
                                        >
                                            {cat.name}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Báo cáo nếu quét mã vạch thành công */}
                    {scannedCode && (
                        <View style={styles.scannedBanner}>
                            <Text style={styles.scannedText}>📦 Đã quét mã sản phẩm: {scannedCode}</Text>
                        </View>
                    )}

                    {/* UI Loading */}
                    {isLoading && (
                        <ActivityIndicator
                            size="large"
                            color={isDarkMode ? COSMIC_THEME.neonCyan : '#0284C7'}
                            style={{ marginTop: 50 }}
                        />
                    )}

                    {/* Lỗi */}
                    {isError && (
                        <Text style={{ textAlign: 'center', marginTop: 50, color: COLORS.error, paddingHorizontal: 20 }}>
                            {errorMessage}
                        </Text>
                    )}

                    {/* Danh sách sản phẩm */}
                    {displayedProducts.length > 0 && (
                        <FlashList
                            data={displayedProducts}
                            keyExtractor={keyExtractor}
                            renderItem={renderProductItem}
                            numColumns={2}
                            contentContainerStyle={{ padding: SIZES.padding, paddingBottom: 110 }}
                            refreshing={isRefetching}
                            onRefresh={refetch}
                            onEndReached={() => {
                                if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                            }}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={
                                isFetchingNextPage ? (
                                    <ActivityIndicator
                                        size="small"
                                        color={isDarkMode ? COSMIC_THEME.neonCyan : '#0284C7'}
                                        style={{ marginVertical: 16 }}
                                    />
                                ) : null
                            }
                        />
                    )}
                </View>
            </SafeAreaView>
        </LiquidBackground>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    headerWrapper: {
        paddingHorizontal: SIZES.padding,
        paddingTop: 8,
        paddingBottom: 4,
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: SIZES.radiusLg,
        borderWidth: 1.4,
        shadowColor: '#00F5D4',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 8,
    },
    headerTitle: {
        fontSize: SIZES.h2,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    stationBadge: {
        backgroundColor: 'rgba(0, 245, 212, 0.18)',
        borderColor: 'rgba(0, 245, 212, 0.45)',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 5,
        paddingVertical: 1,
    },
    stationText: {
        color: '#00F5D4',
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 0.6,
    },
    glassActionBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    cartBadge: {
        position: 'absolute',
        top: -3,
        right: -3,
        backgroundColor: '#0284C7',
        minWidth: 16,
        height: 16,
        borderRadius: 8,
        paddingHorizontal: 3,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
    },
    cartBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
    },
    categoriesWrapper: {
        marginVertical: 6,
    },
    categoriesList: {
        paddingHorizontal: SIZES.padding,
        gap: 8,
    },
    catChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 16,
        borderWidth: 1,
    },
    catChipActiveDark: {
        backgroundColor: 'rgba(0, 245, 212, 0.20)',
        borderColor: '#00F5D4',
        shadowColor: '#00F5D4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
    },
    catChipActiveLight: {
        backgroundColor: '#0284C7',
        borderColor: '#0284C7',
    },
    catChipInactiveDark: {
        backgroundColor: 'rgba(10, 16, 42, 0.70)',
        borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    catChipInactiveLight: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderColor: 'rgba(0, 0, 0, 0.08)',
    },
    catChipText: {
        fontSize: 11,
        fontWeight: '700',
    },
    catChipTextActiveDark: {
        color: '#00F5D4',
    },
    catChipTextActiveLight: {
        color: '#FFFFFF',
    },
    catChipTextInactiveDark: {
        color: '#94A3B8',
    },
    catChipTextInactiveLight: {
        color: '#64748B',
    },
    scannedBanner: {
        backgroundColor: 'rgba(0, 245, 212, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(0, 245, 212, 0.40)',
        borderRadius: SIZES.radius,
        marginHorizontal: SIZES.padding,
        padding: 10,
        alignItems: 'center',
        marginVertical: 6,
    },
    scannedText: {
        fontWeight: 'bold',
        color: '#00F5D4',
    },
    aiBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 16,
        marginTop: 6,
        marginBottom: 8,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1.2,
    },
    aiBannerTitle: {
        fontSize: 13,
        fontWeight: '800',
    },
    aiBannerSubtitle: {
        fontSize: 11,
        marginTop: 2,
    },
    aiNewBadge: {
        backgroundColor: 'rgba(0, 245, 212, 0.20)',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 6,
    },
    aiNewBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#00F5D4',
    },
    aiBannerBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginLeft: 8,
    },
    aiBannerBtnText: {
        fontSize: 11,
        fontWeight: '800',
    },
});

export default HomeScreen;