import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RootDrawerNavigator from '@navigation/RootDrawerNavigator';
import CheckoutScreen from '@screens/CheckoutScreen';
import OrderDetailScreen from '@screens/OrderDetailScreen';
import SettingsScreen from '@screens/SettingsScreen';
import OrdersScreen from '@screens/OrdersScreen';
import { COLORS } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';

export type RootStackParamList = {
    RootDrawer: undefined;
    Checkout: undefined;
    OrderDetail: { orderId: string };
    Settings: undefined;
    Orders: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStackNavigator = () => {
    const { isDarkMode } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                headerStyle: {
                    backgroundColor: isDarkMode ? '#1E1E1E' : COLORS.surface,
                },
                headerTintColor: isDarkMode ? '#FFFFFF' : COLORS.primary,
                headerTitleStyle: {
                    color: isDarkMode ? '#FFFFFF' : COLORS.text,
                    fontWeight: '700',
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
        </Stack.Navigator>
    );
};

export default RootStackNavigator;