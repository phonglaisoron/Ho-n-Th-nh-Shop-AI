import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ShopButton from '@components/ShopButton';
import { useCartStore } from '@store/useCartStore';
import { Product, ProductSchema } from '../types/product.schema';
import { API_BASE_URL } from '@constants/api';
import { MOCK_PRODUCTS } from '@data/mockProducts';
import { getProductQrUrl } from '@utils/qrHelper';
import { COLORS, SIZES, COSMIC_THEME } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import type { HomeStackParamList } from '@navigation/HomeStackNavigator';

type ProductDetailRouteProp = RouteProp<HomeStackParamList, 'ProductDetail'>;

interface ProductPage {
  items: Product[];
  nextPage: number | null;
}

const fetchProductById = async (id: string): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/api/products/${id}`);

  // Bắt đúng mã 404 mà NestJS ném ra ở Bước 7c — hai đầu ăn khớp nhau
  if (response.status === 404) {
    throw new Error('Sản phẩm này không còn tồn tại trên hệ thống');
  }
  if (!response.ok) {
    throw new Error('Lỗi mạng khi tải chi tiết sản phẩm');
  }

  const raw = await response.json();
  const result = ProductSchema.safeParse(raw); // Vẫn giữ trạm kiểm soát Zod từ Chương 6
  if (!result.success) {
    throw new Error('Dữ liệu chi tiết sản phẩm không hợp lệ (Zod)');
  }
  return result.data;
};

const ProductDetailScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<ProductDetailRouteProp>();
  const { productId, autoOpenQr } = route.params;
  const queryClient = useQueryClient();
  const addItem = useCartStore((state) => state.addItem);
  const { isDarkMode } = useTheme();
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (autoOpenQr) {
      setShowQrModal(true);
    }
  }, [autoOpenQr]);

  const dynamicBg = isDarkMode ? '#0B0F28' : COLORS.background;
  const dynamicCardBg = isDarkMode ? 'rgba(18, 24, 58, 0.85)' : '#FFFFFF';
  const dynamicText = isDarkMode ? '#FFFFFF' : COLORS.text;
  const dynamicSubText = isDarkMode ? '#94A3B8' : COLORS.textLight;
  const dynamicBorder = isDarkMode ? 'rgba(0, 245, 212, 0.3)' : 'rgba(0, 0, 0, 0.08)';

  // Tìm sản phẩm từ Server thật với placeholderData từ cache danh sách
  const { data: serverProduct } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProductById(productId),
    placeholderData: () => {
      const cachedData = queryClient.getQueryData<{ pages: ProductPage[] }>(['productsInfinite']);
      const cachedProducts = cachedData?.pages?.flatMap((page) => page.items) ?? [];
      return cachedProducts.find((p) => p.id === productId) || MOCK_PRODUCTS.find((p) => p.id === productId);
    },
  });

  const cachedData = queryClient.getQueryData<{ pages: ProductPage[] }>(['productsInfinite']);
  const cachedProducts = cachedData?.pages?.flatMap((page) => page.items) ?? [];
  const product =
    serverProduct ||
    cachedProducts.find((p) => p.id === productId) ||
    MOCK_PRODUCTS.find((p) => p.id === productId) ||
    MOCK_PRODUCTS.find((p) => p.id.toLowerCase() === (productId || '').toLowerCase());

  const handleGoBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('RootDrawer', { screen: 'ShopAI' });
    }
  };

  if (!product) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]}>
        <View style={styles.center}>
          <Icon name="alert-circle-outline" size={54} color={COLORS.error} />
          <Text style={styles.notFound}>Không tìm thấy thông tin sản phẩm</Text>
          <Text style={[styles.hint, { color: dynamicSubText }]}>
            Mã sản phẩm #{productId} không tồn tại hoặc đã bị gỡ. Vui lòng quay lại Trang chủ.
          </Text>
          <ShopButton
            title="Quay lại Trang chủ"
            onPress={handleGoBack}
            style={{ marginTop: 20 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  const qrImageUrl = getProductQrUrl(product.id, 280);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]} edges={['top', 'bottom']}>
      {/* Top Bar với nút Back và nút xem QR */}
      <View style={[styles.topBar, { borderBottomColor: dynamicBorder }]}>
        <TouchableOpacity
          style={[styles.circleActionBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
          onPress={handleGoBack}
        >
          <Icon name="arrow-left" size={22} color={dynamicText} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: dynamicText }]} numberOfLines={1}>
          Chi tiết sản phẩm
        </Text>
        <TouchableOpacity
          style={[styles.circleActionBtn, { backgroundColor: isDarkMode ? 'rgba(0, 245, 212, 0.15)' : 'rgba(2, 132, 199, 0.1)' }]}
          onPress={() => {
            hapticLight();
            setShowQrModal(true);
          }}
        >
          <Icon name="qrcode" size={22} color={isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Ảnh sản phẩm */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image }} style={styles.image} resizeMode="cover" />
          <View style={styles.genuineBadge}>
            <Icon name="check-decagram" size={13} color="#FFFFFF" />
            <Text style={styles.genuineText}>CHÍNH HÃNG 100%</Text>
          </View>
        </View>

        <Text style={[styles.name, { color: dynamicText }]}>{product.name}</Text>
        <Text style={[styles.price, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>
          {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
        </Text>

        <View style={styles.skuRow}>
          <Text style={[styles.idNote, { color: dynamicSubText }]}>
            Mã SKU: <Text style={{ fontWeight: '700', color: dynamicText }}>{product.id}</Text>
          </Text>
          <TouchableOpacity
            style={styles.copySkuBtn}
            onPress={() => {
              hapticSuccess();
              Alert.alert('Đã sao chép SKU', `Mã sản phẩm: ${product.id}`);
            }}
          >
            <Icon name="content-copy" size={13} color={isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary} />
            <Text style={[styles.copySkuText, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>Chép</Text>
          </TouchableOpacity>
        </View>

        {/* THẺ MÃ QR ĐỊNH DANH SẢN PHẨM RIÊNG BIỆT */}
        <View style={[styles.qrSectionCard, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
          <View style={styles.qrHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.qrIconBadge, { backgroundColor: isDarkMode ? 'rgba(0, 245, 212, 0.2)' : 'rgba(2, 132, 199, 0.12)' }]}>
                <Icon name="qrcode-scan" size={18} color={isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary} />
              </View>
              <View>
                <Text style={[styles.qrCardTitle, { color: dynamicText }]}>
                  Mã QR Riêng Của Sản Phẩm
                </Text>
                <Text style={[styles.qrCardSubtitle, { color: dynamicSubText }]}>
                  Mỗi sản phẩm có 1 mã QR code riêng độc nhất
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.qrBodyRow}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.qrImageFrame}
              onPress={() => {
                hapticLight();
                setShowQrModal(true);
              }}
            >
              <Image source={{ uri: qrImageUrl }} style={styles.qrImage} resizeMode="contain" />
              <View style={styles.expandTag}>
                <Icon name="arrow-expand" size={11} color="#FFFFFF" />
                <Text style={styles.expandTagText}>Phóng to</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.qrInstructions}>
              <View style={styles.instructionItem}>
                <Icon name="camera-iris" size={16} color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                <Text style={[styles.instructionText, { color: dynamicText }]}>
                  Quét bằng nút <Text style={{ fontWeight: '700' }}>Camera</Text> trên đầu trang chủ ShopAI để truy cập tức thì
                </Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="shield-check" size={16} color="#10B981" />
                <Text style={[styles.instructionText, { color: dynamicText }]}>
                  Xác thực nguồn gốc & bảo hành điện tử chính hãng
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.zoomQrBtn, { backgroundColor: isDarkMode ? 'rgba(0, 245, 212, 0.15)' : '#E0F2FE' }]}
                onPress={() => {
                  hapticLight();
                  setShowQrModal(true);
                }}
              >
                <Icon name="qrcode" size={15} color={isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary} />
                <Text style={[styles.zoomQrBtnText, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>
                  Mở toàn màn hình QR
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Thẻ cam kết chính hãng */}
        <View style={[styles.policyBox, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
          <Text style={[styles.policyItem, { color: dynamicText }]}>✓ Cam kết chính hãng 100%</Text>
          <Text style={[styles.policyItem, { color: dynamicText }]}>✓ Bảo hành 12 tháng chính hãng</Text>
          <Text style={[styles.policyItem, { color: dynamicText }]}>✓ Miễn phí giao hàng & đổi trả 7 ngày</Text>
        </View>

        {product.description && (
          <View style={styles.descSection}>
            <Text style={[styles.descTitle, { color: dynamicText }]}>Đặc điểm nổi bật</Text>
            <Text style={[styles.descText, { color: dynamicSubText }]}>{product.description}</Text>
          </View>
        )}

        <ShopButton
          title="Thêm vào giỏ hàng"
          onPress={() => {
            addItem(product);
            hapticSuccess();
            Alert.alert('Thành công', `Đã thêm ${product.name} vào giỏ hàng!`);
          }}
          style={styles.buyBtn}
        />
      </ScrollView>

      {/* Modal phóng to mã QR sản phẩm cực to & nét (In-tree Fullscreen Overlay - Không bị delay/lag của Android Dialog) */}
      {showQrModal && (
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowQrModal(false)}
          />
          <View
            style={[
              styles.modalCard,
              {
                backgroundColor: dynamicCardBg,
                borderColor: dynamicBorder,
              },
            ]}
          >
            {/* Header Modal */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={[
                    styles.modalIconBox,
                    { backgroundColor: isDarkMode ? 'rgba(0, 245, 212, 0.15)' : 'rgba(2, 132, 199, 0.1)' },
                  ]}
                >
                  <Icon
                    name="qrcode-scan"
                    size={20}
                    color={isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary}
                  />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: dynamicText }]}>Mã QR Sản Phẩm</Text>
                  <Text style={[styles.modalSubTitle, { color: dynamicSubText }]}>Định danh SKU độc nhất</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  hapticLight();
                  setShowQrModal(false);
                }}
                hitSlop={12}
              >
                <Icon name="close" size={22} color={dynamicSubText} />
              </TouchableOpacity>
            </View>

            {/* Thông tin vắn tắt sản phẩm */}
            <View style={[styles.modalProdInfo, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC', borderColor: dynamicBorder }]}>
              <Image source={{ uri: product.image }} style={styles.modalThumb} resizeMode="cover" />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.modalProdName, { color: dynamicText }]} numberOfLines={1}>
                  {product.name}
                </Text>
                <Text style={[styles.modalProdPrice, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}
                </Text>
                <Text style={[styles.modalProdSku, { color: dynamicSubText }]}>
                  SKU: <Text style={{ color: dynamicText, fontWeight: '700' }}>{product.id}</Text>
                </Text>
              </View>
            </View>

            {/* Khung mã QR phóng to cực to và rõ nét */}
            <View style={styles.modalQrWrapper}>
              <View style={styles.modalQrWhiteFrame}>
                <Image
                  source={{ uri: getProductQrUrl(product.id, 500) }}
                  style={{ width: 230, height: 230 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.modalQrHint, { color: dynamicSubText }]}>
                Dùng chức năng Quét Camera ở đầu trang chủ để tra cứu tức thì
              </Text>
            </View>

            {/* Các nút thao tác nhanh */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={[
                  styles.modalActionBtn,
                  {
                    borderColor: dynamicBorder,
                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                  },
                ]}
                onPress={() => {
                  hapticSuccess();
                  Alert.alert('Đã sao chép SKU', `Mã sản phẩm: ${product.id}`);
                }}
              >
                <Icon name="content-copy" size={16} color={dynamicText} />
                <Text style={[styles.modalActionBtnText, { color: dynamicText }]}>Chép SKU</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalActionBtn,
                  {
                    backgroundColor: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary,
                    borderColor: 'transparent',
                  },
                ]}
                onPress={() => {
                  hapticLight();
                  setShowQrModal(false);
                }}
              >
                <Icon name="check" size={16} color={isDarkMode ? '#050716' : '#FFFFFF'} />
                <Text
                  style={[
                    styles.modalActionBtnText,
                    { color: isDarkMode ? '#050716' : '#FFFFFF', fontWeight: '800' },
                  ]}
                >
                  Xong
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.padding,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  circleActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  container: { padding: SIZES.padding, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.padding },
  imageContainer: {
    width: '100%',
    height: 320,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: SIZES.padding,
  },
  image: { width: '100%', height: '100%' },
  genuineBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  genuineText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  name: { fontSize: SIZES.h2, fontWeight: 'bold', marginBottom: 8 },
  price: { fontSize: SIZES.h1, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  skuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  idNote: { fontSize: SIZES.body2 },
  copySkuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 245, 212, 0.1)',
  },
  copySkuText: {
    fontSize: 11,
    fontWeight: '700',
  },
  qrSectionCard: {
    borderRadius: SIZES.radiusLg,
    borderWidth: 1.5,
    padding: 14,
    marginBottom: 16,
  },
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qrIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  qrCardSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  qrBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  qrImageFrame: {
    width: 110,
    height: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  qrImage: {
    width: 98,
    height: 98,
  },
  expandTag: {
    position: 'absolute',
    bottom: 3,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expandTagText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  qrInstructions: {
    flex: 1,
    gap: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  instructionText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  zoomQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 2,
  },
  zoomQrBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  policyBox: {
    padding: 12,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    marginBottom: 16,
    gap: 6,
  },
  policyItem: {
    fontSize: 13,
    fontWeight: '600',
  },
  descSection: {
    marginBottom: 20,
  },
  descTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
  },
  buyBtn: { marginTop: 8 },
  notFound: { fontSize: SIZES.body1, color: COLORS.error, textAlign: 'center', marginBottom: 8, marginTop: 12 },
  hint: { fontSize: SIZES.body2, textAlign: 'center', marginTop: 4 },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
    elevation: 999,
    padding: SIZES.padding,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  modalSubTitle: {
    fontSize: 12,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalProdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  modalThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  modalProdName: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalProdPrice: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  modalProdSku: {
    fontSize: 11,
    marginTop: 2,
  },
  modalQrWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalQrWhiteFrame: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  modalQrHint: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  modalActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

export default ProductDetailScreen;