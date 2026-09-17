import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import ShopButton from '@components/ShopButton';
import { useCartStore } from '@store/useCartStore';
import { Product } from '../types/product.schema';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';

type ProductDetailRouteProp = RouteProp<HomeStackParamList, 'ProductDetail'>;

interface ProductPage {
  items: Product[];
  nextPage: number | null;
}

const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailRouteProp>();
  const { productId } = route.params;
  const queryClient = useQueryClient();
  const addItem = useCartStore((state) => state.addItem);
  const { isDarkMode } = useTheme();

  const dynamicBg = isDarkMode ? '#121212' : COLORS.background;
  const dynamicText = isDarkMode ? '#FFFFFF' : COLORS.text;
  const dynamicSubText = isDarkMode ? '#A0A0A0' : COLORS.textLight;

  const cachedData = queryClient.getQueryData<{ pages: ProductPage[] }>(['productsInfinite']);
  const cachedProducts = cachedData?.pages.flatMap((page) => page.items) ?? [];
  const product = cachedProducts.find((p) => p.id === productId);

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]}>
        <View style={styles.center}>
          <Text style={styles.notFound}>Đang tải từ cloud... (Mã sản phẩm: {productId})</Text>
          <Text style={[styles.hint, { color: dynamicSubText }]}>
            Hãy quay lại Trang chủ để danh sách được tải vào Cache trước khi mở lại link này.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
        <Text style={[styles.name, { color: dynamicText }]}>{product.name}</Text>
        <Text style={styles.price}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
        </Text>
        <Text style={[styles.idNote, { color: dynamicSubText }]}>Mã sản phẩm: {product.id}</Text>
        <ShopButton title="Thêm vào giỏ hàng" onPress={() => addItem(product)} style={styles.buyBtn} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: SIZES.padding },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.padding },
  image: { width: '100%', height: 320, borderRadius: SIZES.radius, marginBottom: SIZES.padding },
  name: { fontSize: SIZES.h2, fontWeight: 'bold', marginBottom: 8 },
  price: { fontSize: SIZES.h1, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  idNote: { fontSize: SIZES.body2, marginBottom: 24 },
  buyBtn: { marginTop: 8 },
  notFound: { fontSize: SIZES.body1, color: COLORS.error, textAlign: 'center', marginBottom: 8 },
  hint: { fontSize: SIZES.body2, textAlign: 'center' },
});

export default ProductDetailScreen;