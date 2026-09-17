import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import ShopButton from '@components/ShopButton';
import { useCartStore } from '@store/useCartStore';
import { Product } from '../types/product.schema';
import { COLORS, SIZES } from '@constants/theme';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';

type ProductDetailRouteProp = RouteProp<HomeStackParamList, 'ProductDetail'>;

// Khớp đúng khuôn 1 "trang" dữ liệu mà HomeScreen (Bước 8) đã dùng cho useInfiniteQuery
interface ProductPage {
  items: Product[];
  nextPage: number | null;
}

const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const { productId } = route.params; // Chỉ nhận đúng 1 chuỗi ID, KHÔNG nhận Object
  const queryClient = useQueryClient();
  const addItem = useCartStore((state) => state.addItem);

  // Móc thẳng vào Cache mà HomeScreen đã lưu với queryKey ['productsInfinite'] —
  // KHÔNG gọi lại API, tận dụng đúng cơ chế Cache của TanStack Query.
  // Cache của useInfiniteQuery có dạng { pages: ProductPage[], pageParams: number[] } —
  // phải flatMap tất cả các trang đã tải thành 1 mảng phẳng trước khi tìm theo id.
  const cachedData = queryClient.getQueryData<{ pages: ProductPage[] }>(['productsInfinite']);
  const cachedProducts = cachedData?.pages.flatMap((page) => page.items) ?? [];
  const product = cachedProducts.find((p) => p.id === productId);

  // Trường hợp Cache trống (VD: mở thẳng bằng Deep Link trước khi HomeScreen kịp Fetch)
  if (!product) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.notFound}>Đang tải từ cloud... (Mã sản phẩm: {productId})</Text>
          <Text style={styles.hint}>
            Hãy quay lại Trang chủ để danh sách được tải vào Cache trước khi mở lại link này.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
        </Text>
        <Text style={styles.idNote}>Mã sản phẩm: {product.id}</Text>
        <ShopButton title="Thêm vào giỏ hàng" onPress={() => addItem(product)} style={styles.buyBtn} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: SIZES.padding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.padding },
  image: { width: '100%', height: 320, borderRadius: SIZES.radius, marginBottom: SIZES.padding },
  name: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.text, marginBottom: 8 },
  price: { fontSize: SIZES.h1, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  idNote: { fontSize: SIZES.body2, color: COLORS.textLight, marginBottom: 24 },
  buyBtn: { marginTop: 8 },
  notFound: { fontSize: SIZES.body1, color: COLORS.error, textAlign: 'center', marginBottom: 8 },
  hint: { fontSize: SIZES.body2, color: COLORS.textLight, textAlign: 'center' },
});

export default ProductDetailScreen;