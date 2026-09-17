import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // BẮT BUỘC lấy từ safe-area-context, KHÔNG lấy từ 'react-native'
import { useInfiniteQuery } from '@tanstack/react-query'; // Import vũ khí hạng nặng — có Pagination sẵn (Phần 6.8)
// Danh sách vẫn nên dùng FlashList như Chương 4/5 (hiệu năng tốt hơn FlatList khi danh sách dài);
// nếu dự án của bạn chưa cài @shopify/flash-list, có thể tạm giữ FlatList tương đương.
import { FlashList } from '@shopify/flash-list';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DrawerActions, type CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ProductCard from '@components/ProductCard';
import ShopButton from '@components/ShopButton';
import { COLORS, SIZES } from '@constants/theme';
import { useAuthStore } from '@store/useAuthStore';
import { useCartStore } from '@store/useCartStore';
import { useTheme } from '@contexts/ThemeContext';
import { Product, ProductListSchema } from '../types/product.schema';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';
import type { MainTabParamList } from '@navigation/MainTabNavigator';

// Vì Bước 5 đã đổi Stack.Screen("Home") sang dùng component=, HomeScreen giờ nhận
// thẳng navigation/route qua Props chuẩn của React Navigation. Dùng CompositeScreenProps
// (thay vì "any") vì HomeScreen cần navigate() cả trong Home Stack (ProductDetail) VÀ
// nhảy sang Tab cha (Cart) — TypeScript sẽ bắt lỗi ngay nếu gọi sai tên/sai tham số ở 1 trong 2 tầng
type Props = CompositeScreenProps<
    NativeStackScreenProps<HomeStackParamList, 'Home'>,
    BottomTabScreenProps<MainTabParamList>
>;

const PAGE_SIZE = 10;
const TOTAL_MOCK_PRODUCTS = 47; // Giả lập Server có 47 sản phẩm — đủ nhiều trang để thấy rõ Pagination

// Khuôn 1 "trang" dữ liệu trả về từ Server — đúng format REST phân trang thật (Chương 9 sẽ dùng lại y hệt)
interface ProductPage {
    items: Product[];
    nextPage: number | null;
}

// 2 lớp lỗi riêng biệt để UI phân biệt rạch ròi "lỗi mạng" và "lỗi dữ liệu bẩn (Zod)"
class ZodValidationError extends Error { }
class NetworkError extends Error { }

// Hàm giả lập gọi API PHÂN TRANG — mỗi lần chỉ trả về đúng PAGE_SIZE sản phẩm, không tải hết 1 lượt
const fetchProductsPage = async ({ pageParam }: { pageParam: number }): Promise<ProductPage> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Giả lập ngẫu nhiên ~10% khả năng mất mạng — để thấy rõ nhánh lỗi Mạng khác nhánh lỗi Zod
            if (Math.random() < 0.1) {
                reject(new NetworkError('Mất kết nối mạng, vui lòng thử lại!'));
                return;
            }

            const start = (pageParam - 1) * PAGE_SIZE;
            const rawItems = Array.from({ length: PAGE_SIZE })
                .map((_, i) => {
                    const index = start + i;
                    if (index >= TOTAL_MOCK_PRODUCTS) return null; // Hết dữ liệu giả lập
                    return {
                        id: `api_prod_${index}`,
                        name: `Sản phẩm từ Cloud ${index}`,
                        price: 500000 + index * 5000,
                        image: `https://picsum.photos/seed/shopai_prod_${index}/400/400`,
                    };
                })
                .filter((item) => item !== null);

            // TRẠM KIỂM SOÁT ZOD: Kiểm tra riêng TỪNG TRANG trước khi cho phép đi tiếp
            const result = ProductListSchema.safeParse(rawItems);
            if (!result.success) {
                console.error('❌ Zod chặn dữ liệu bẩn từ API:', result.error.format());
                reject(new ZodValidationError('Dữ liệu sản phẩm không hợp lệ (Zod validation failed)!'));
                return;
            }

            const hasMore = start + PAGE_SIZE < TOTAL_MOCK_PRODUCTS;
            resolve({ items: result.data, nextPage: hasMore ? pageParam + 1 : null });
        }, 1200);
    });
};

const HomeScreen = ({ navigation }: Props) => {
    const logout = useAuthStore(state => state.logout); // Gọi Hàm thoát từ Đám mây
    const totalQuantity = useCartStore(state => state.totalQuantity()); // Số lượng hàng trong giỏ
    const { isDarkMode, toggleTheme } = useTheme(); // Bắt sóng chuyển đổi Sáng/Tối từ ThemeContext

    const dynamicBg = isDarkMode ? '#121212' : COLORS.background;
    const dynamicSurface = isDarkMode ? '#1E1E1E' : COLORS.surface;
    const dynamicText = isDarkMode ? '#FFFFFF' : COLORS.text;

    // BÙM! useInfiniteQuery = toàn bộ sức mạnh Cache/StaleTime (Phần 6.5) CỘNG THÊM Pagination tự động (Phần 6.8)
    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isRefetching,
        fetchNextPage,     // Gọi hàm này để tải thêm trang kế tiếp
        hasNextPage,       // Server còn trang để tải hay không
        isFetchingNextPage, // Đang tải trang kế tiếp (khác isLoading — đã có data cũ hiển thị)
    } = useInfiniteQuery({
        queryKey: ['productsInfinite'], // Mã định danh Cache — đổi tên so với 'productsList' vì cấu trúc data đã khác (nhiều trang)
        queryFn: fetchProductsPage,
        initialPageParam: 1,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    });

    // data.pages là mảng CÁC TRANG — "làm phẳng" (flatten) lại thành 1 mảng sản phẩm duy nhất cho FlashList
    const allProducts = data?.pages.flatMap((page) => page.items) ?? [];

    // Phân biệt rõ 2 thông báo lỗi khác nhau bằng instanceof — đúng yêu cầu UX (không gộp chung 1 câu mơ hồ)
    const errorMessage =
        error instanceof ZodValidationError
            ? '⚠️ Dữ liệu sản phẩm không hợp lệ (lỗi kiểm tra Zod) — báo kỹ thuật viên!'
            : '📡 Lỗi mạng — vui lòng kiểm tra kết nối và kéo xuống thử lại!';

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]}>
            <View style={[styles.container, { backgroundColor: dynamicBg }]}>
                <View style={[styles.header, { backgroundColor: dynamicSurface }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Pressable
                            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                            style={{ padding: 4 }}
                        >
                            <Icon name="menu" size={28} color={dynamicText} />
                        </Pressable>
                        <Text style={[styles.headerTitle, { color: dynamicText }]}>ShopAI</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <Pressable
                            onPress={toggleTheme}
                            style={{
                                paddingHorizontal: 8,
                                paddingVertical: 6,
                                borderRadius: 8,
                                backgroundColor: isDarkMode ? '#333333' : '#EEEEEE',
                            }}
                        >
                            <Text style={{ fontSize: 13, color: dynamicText }}>{isDarkMode ? '☀️' : '🌙'}</Text>
                        </Pressable>
                        <ShopButton
                            title={`Giỏ (${totalQuantity})`}
                            onPress={() => navigation.navigate('Cart')}
                            style={{ width: 85, height: 32, backgroundColor: COLORS.secondary }}
                            textStyle={{ fontSize: 11 }}
                        />
                        <ShopButton title="Thoát" onPress={logout} style={{ width: 65, height: 32 }} textStyle={{ fontSize: 11 }} />
                    </View>
                </View>

                {/* Xử lý UI 3 trạng thái cực thanh lịch */}
                {isLoading && <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />}

                {/* Lỗi Zod và lỗi Mạng dùng CHUNG 1 cờ isError nhưng hiện 2 THÔNG ĐIỆP khác nhau (errorMessage ở trên) */}
                {isError && <Text style={{ textAlign: 'center', marginTop: 50, color: 'red' }}>{errorMessage}</Text>}

                {allProducts.length > 0 && (
                    <FlashList
                        data={allProducts}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            // Bọc Pressable để bấm vào Card mở ProductDetail — chỉ gửi productId (Route Params),
                            // KHÔNG gửi nguyên Object sản phẩm (đúng nguyên tắc Chương 5, Phần 5.3).
                            // Nút "Mua ngay" nằm bên TRONG ProductCard (Bước 7) vẫn hoạt động độc lập —
                            // nó tự bắt Touch trước, không bị Pressable ngoài này "cướp" sự kiện.
                            <Pressable onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}>
                                <ProductCard product={item} />
                            </Pressable>
                        )}
                        numColumns={2}
                        contentContainerStyle={{ padding: SIZES.padding }}
                        refreshing={isRefetching} // Không cần tự quản lý useState nữa — React Query có sẵn cờ này
                        onRefresh={refetch}       // Kéo tay xuống -> gọi lại trang 1, tự động cập nhật Cache
                        // PHÂN TRANG THẬT: cuộn gần tới cuối danh sách -> tự động tải thêm trang kế tiếp
                        onEndReached={() => {
                            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
                        }}
                        onEndReachedThreshold={0.5} // Kích hoạt khi còn cách đáy 50% chiều cao màn hình
                        ListFooterComponent={
                            isFetchingNextPage ? (
                                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 16 }} />
                            ) : null
                        }
                    />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: SIZES.padding,
        paddingVertical: 15,
        backgroundColor: COLORS.surface,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: SIZES.h2,
        fontWeight: 'bold',
        color: COLORS.text,
    },
});

export default HomeScreen;