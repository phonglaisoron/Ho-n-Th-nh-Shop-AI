import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeStackNavigator from '@navigation/HomeStackNavigator';
import CartScreen from '@screens/CartScreen';
import OrdersScreen from '@screens/OrdersScreen';
import ReduxCartDemoScreen from '@screens/ReduxCartDemoScreen';
import { useCartStore } from '@store/useCartStore';
import { COLORS } from '@constants/theme';

export type MainTabParamList = {
    HomeTab: undefined;
    Cart: undefined;
    Orders: undefined;
    RTKDemo: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
    const totalQuantity = useCartStore((state) => state.totalQuantity());

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textLight,
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStackNavigator}
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="home-variant-outline" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Cart"
                component={CartScreen}
                options={{
                    title: 'Giỏ hàng',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="cart-outline" color={color} size={size} />
                    ),
                    tabBarBadge: totalQuantity > 0 ? totalQuantity : undefined,
                }}
            />
            <Tab.Screen
                name="Orders"
                component={OrdersScreen}
                options={{
                    title: 'Đơn hàng',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="clipboard-text-outline" color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="RTKDemo"
                component={ReduxCartDemoScreen}
                options={{
                    title: 'RTK Demo',
                    tabBarIcon: ({ color, size }) => (
                        <Icon name="atom" color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

export default MainTabNavigator;