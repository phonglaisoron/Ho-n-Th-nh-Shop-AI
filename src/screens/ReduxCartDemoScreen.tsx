import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { addItem, removeItem } from '@store/redux/cartSlice';
import type { ReduxRootState } from '@store/redux/store';
import ShopButton from '@components/ShopButton';
import { useTheme } from '@contexts/ThemeContext';
import { COLORS } from '@constants/theme';

const ReduxCartDemoScreen = () => {
  const items = useSelector((state: ReduxRootState) => state.cartRedux.items);
  const dispatch = useDispatch();
  const { isDarkMode } = useTheme();

  const dynamicBg = isDarkMode ? '#121212' : COLORS.background;
  const dynamicCardBg = isDarkMode ? '#1E1E1E' : COLORS.surface;
  const dynamicText = isDarkMode ? '#FFFFFF' : COLORS.text;
  const dynamicSubText = isDarkMode ? '#A0A0A0' : COLORS.textLight;
  const dynamicBorder = isDarkMode ? '#2E2E2E' : '#EEEEEE';

  return (
    <SafeAreaView style={{ flex: 1, padding: 16, backgroundColor: dynamicBg }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: dynamicText }}>
        [Demo Bắt Buộc Đề Cương] Redux Toolkit Cart
      </Text>
      <ShopButton
        title="+ Thêm sản phẩm mẫu (Redux)"
        onPress={() =>
          dispatch(
            addItem({
              id: `rtk_prod_${Date.now()}`,
              name: 'Tai nghe Bluetooth RTK',
              price: 299000,
              image: 'https://picsum.photos/400/400',
            }),
          )
        }
        style={{ marginBottom: 16 }}
      />
      {items.length === 0 ? (
        <Text style={{ color: dynamicSubText, textAlign: 'center', marginTop: 20 }}>
          Chưa có sản phẩm trong Redux Cart. Bấm nút phía trên để thêm thử!
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
                padding: 12,
                backgroundColor: dynamicCardBg,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: dynamicBorder,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', color: dynamicText }}>{item.name}</Text>
                <Text style={{ color: dynamicSubText, marginTop: 4 }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)} × {item.quantity}
                </Text>
              </View>
              <ShopButton
                title="Xóa"
                onPress={() => dispatch(removeItem(item.id))}
                style={{ width: 70, height: 32, backgroundColor: '#FF4D4F' }}
                textStyle={{ fontSize: 12 }}
              />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default ReduxCartDemoScreen;
