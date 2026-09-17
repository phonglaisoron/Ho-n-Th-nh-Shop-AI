import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import MainTabNavigator from "@navigation/MainTabNavigator";
import ProfileScreen from "@screens/ProfileScreen";
import { COLORS } from "@constants/theme";
import { useTheme } from "@contexts/ThemeContext";

export type RootDrawerParamList = {
    ShopAI: undefined;
    Profile: undefined;
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();

const RootDrawerNavigator = () => {
    const { isDarkMode } = useTheme();

    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: false,
                headerStyle: {
                    backgroundColor: isDarkMode ? '#1E1E1E' : COLORS.surface,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                headerTintColor: isDarkMode ? '#FFFFFF' : COLORS.text,
                headerTitleStyle: {
                    fontWeight: '700',
                },
                drawerStyle: {
                    backgroundColor: isDarkMode ? '#1E1E1E' : COLORS.surface,
                },
                drawerActiveTintColor: COLORS.primary,
                drawerInactiveTintColor: isDarkMode ? '#BBBBBB' : COLORS.text,
            }}
        >
            <Drawer.Screen
                name="ShopAI"
                component={MainTabNavigator}
                options={{
                    title: "ShopAI",
                    drawerIcon: ({ color, size }) => (
                        <Icon name="storefront-outline" color={color} size={size} />
                    ),
                }}
            />
            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: "Hồ sơ của tôi",
                    headerShown: true,
                    headerTitle: "Hồ sơ",
                    drawerIcon: ({ color, size }) => (
                        <Icon name="account-outline" color={color} size={size} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
};

export default RootDrawerNavigator;
