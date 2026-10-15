import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HomeStackNavigator from '@navigation/HomeStackNavigator';
import CartScreen from '@screens/CartScreen';
import OrdersScreen from '@screens/OrdersScreen';
import ProfileScreen from '@screens/ProfileScreen';
import ReduxCartDemoScreen from '@screens/ReduxCartDemoScreen';
import { useCartStore } from '@store/useCartStore';
import { COLORS, IOS26_COLORS } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';

export type MainTabParamList = {
    HomeTab: undefined;
    Cart: undefined;
    Orders: undefined;
    ProfileTab: undefined;
    RTKDemo: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator = () => {
    const totalQuantity = useCartStore((state) => state.totalQuantity());
    const { isDarkMode } = useTheme();

    const activeColor = isDarkMode ? IOS26_COLORS.quantumCyan : '#0284C7';
    const inactiveColor = isDarkMode ? '#64748B' : '#94A3B8';

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: activeColor,
                tabBarInactiveTintColor: inactiveColor,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '800',
                    letterSpacing: 0.4,
                    marginBottom: Platform.OS === 'ios' ? 0 : 4,
                },
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 16,
                    left: 14,
                    right: 14,
                    height: 68,
                    borderRadius: 34,
                    backgroundColor: isDarkMode
                        ? 'rgba(8, 12, 32, 0.92)'
                        : 'rgba(255, 255, 255, 0.92)',
                    borderWidth: 1.4,
                    borderTopColor: isDarkMode
                        ? 'rgba(0, 245, 212, 0.45)'
                        : 'rgba(255, 255, 255, 0.95)',
                    borderLeftColor: isDarkMode
                        ? 'rgba(0, 245, 212, 0.35)'
                        : 'rgba(255, 255, 255, 0.70)',
                    borderRightColor: isDarkMode
                        ? 'rgba(147, 51, 234, 0.40)'
                        : 'rgba(0, 245, 212, 0.25)',
                    borderBottomColor: isDarkMode
                        ? 'rgba(255, 0, 122, 0.25)'
                        : 'rgba(255, 255, 255, 0.35)',
                    shadowColor: isDarkMode ? IOS26_COLORS.quantumCyan : '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: isDarkMode ? 0.35 : 0.12,
                    shadowRadius: 22,
                    elevation: 12,
                    paddingBottom: 8,
                    paddingTop: 8,
                },
                tabBarBadgeStyle: {
                    backgroundColor: isDarkMode ? '#00F5D4' : '#0284C7',
                    color: isDarkMode ? '#050716' : '#FFFFFF',
                    fontSize: 10,
                    fontWeight: '900',
                    borderWidth: 1,
                    borderColor: isDarkMode ? '#050716' : '#FFFFFF',
                },
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStackNavigator}
                options={{
                    title: 'Trang chủ',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && (isDarkMode ? styles.activeIconGlowDark : styles.activeIconGlowLight)]}>
                            <Icon
                                name={focused ? 'home' : 'home-outline'}
                                color={color}
                                size={22}
                            />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="Cart"
                component={CartScreen}
                options={{
                    title: 'Giỏ hàng',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && (isDarkMode ? styles.activeIconGlowDark : styles.activeIconGlowLight)]}>
                            <Icon
                                name={focused ? 'cart' : 'cart-outline'}
                                color={color}
                                size={22}
                            />
                        </View>
                    ),
                    tabBarBadge: totalQuantity > 0 ? totalQuantity : undefined,
                }}
            />
            <Tab.Screen
                name="Orders"
                component={OrdersScreen}
                options={{
                    title: 'Đơn hàng',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && (isDarkMode ? styles.activeIconGlowDark : styles.activeIconGlowLight)]}>
                            <Icon
                                name={focused ? 'clipboard-text' : 'clipboard-text-outline'}
                                color={color}
                                size={22}
                            />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileScreen}
                options={{
                    title: 'Hồ sơ',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && (isDarkMode ? styles.activeIconGlowDark : styles.activeIconGlowLight)]}>
                            <Icon
                                name={focused ? 'account' : 'account-outline'}
                                color={color}
                                size={22}
                            />
                        </View>
                    ),
                }}
            />
            <Tab.Screen
                name="RTKDemo"
                component={ReduxCartDemoScreen}
                options={{
                    title: 'Thử nghiệm',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && (isDarkMode ? styles.activeIconGlowDark : styles.activeIconGlowLight)]}>
                            <Icon name={focused ? 'flask' : 'flask-outline'} color={color} size={22} />
                        </View>
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    iconWrapper: {
        width: 40,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeIconGlowDark: {
        backgroundColor: 'rgba(0, 245, 212, 0.20)',
        borderWidth: 1.2,
        borderColor: 'rgba(0, 245, 212, 0.65)',
        shadowColor: '#00F5D4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
    },
    activeIconGlowLight: {
        backgroundColor: 'rgba(2, 132, 199, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(2, 132, 199, 0.35)',
    },
});

export default MainTabNavigator;