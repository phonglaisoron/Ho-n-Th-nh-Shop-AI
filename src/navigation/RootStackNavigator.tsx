import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RootDrawerNavigator from '@navigation/RootDrawerNavigator';
import CheckoutScreen from '@screens/CheckoutScreen';
import OrderDetailScreen from '@screens/OrderDetailScreen';
import SettingsScreen from '@screens/SettingsScreen';
import OrdersScreen from '@screens/OrdersScreen';
import ScannerScreen from '@screens/ScannerScreen';
import ProductDetailScreen from '@screens/ProductDetailScreen';
import AIChatScreen from '@screens/AIChatScreen';
import { COLORS } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';

export type RootStackParamList = {
    RootDrawer: undefined;
    Checkout: undefined;
    OrderDetail: { orderId: string };
    Settings: undefined;
    Orders: undefined;
    Scanner: undefined;
    ProductDetail: { productId: string; autoOpenQr?: boolean };
    AIChat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStackNavigator = () => {
    const { isDarkMode } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                headerStyle: {
                    backgroundColor: isDarkMode ? '#131625' : '#FFFFFF',
                },
                headerTintColor: isDarkMode ? '#00F5D4' : COLORS.primary,
                headerTitleStyle: {
                    color: isDarkMode ? '#F8FAFC' : COLORS.text,
                    fontWeight: '800',
                },
            }}
        >
            <Stack.Screen name="RootDrawer" component={RootDrawerNavigator} />
            <Stack.Screen
                name="Checkout"
                component={CheckoutScreen}
                options={{
                    presentation: 'modal',
                    headerShown: true,
                    title: 'Thanh toán',
                }}
            />
            <Stack.Screen
                name="OrderDetail"
                component={OrderDetailScreen}
                options={{
                    headerShown: true,
                    title: 'Chi tiết hóa đơn',
                }}
            />
            <Stack.Screen
                name="Orders"
                component={OrdersScreen}
                options={{
                    headerShown: true,
                    title: 'Đơn hàng của tôi',
                }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    headerShown: true,
                    title: 'Cài đặt',
                }}
            />
            <Stack.Screen
                name="Scanner"
                component={ScannerScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="ProductDetail"
                component={ProductDetailScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="AIChat"
                component={AIChatScreen}
                options={{
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
};

export default RootStackNavigator;