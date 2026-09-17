import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Giữ đúng nguồn import — không lấy từ 'react-native'
import { useSelector, useDispatch } from 'react-redux';
import { addItem, removeItem } from '@store/redux/cartSlice';
import type { ReduxRootState } from '@store/redux/store';
import ShopButton from '@components/ShopButton';

const ReduxCartDemoScreen = () => {
  const items = useSelector((state: ReduxRootState) => state.cartRedux.items);
  const dispatch = useDispatch();

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12 }}>
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
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>
          Chưa có sản phẩm trong Redux Cart. Bấm nút phía trên để thêm thử!
        </Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: 12, backgroundColor: '#fff', borderRadius: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600' }}>{item.name}</Text>
                <Text style={{ color: '#666', marginTop: 4 }}>
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)} × {item.quantity}
                </Text>
              </View>
              <ShopButton title="Xóa" onPress={() => dispatch(removeItem(item.id))} style={{ width: 70, height: 32, backgroundColor: '#FF4D4F' }} textStyle={{ fontSize: 12 }} />
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default ReduxCartDemoScreen;
