import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import MainTabNavigator from "@navigation/MainTabNavigator";
import ProfileScreen from "@screens/ProfileScreen";
import CustomDrawerContent from "@components/CustomDrawerContent";
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
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{
                headerShown: false,
                drawerType: "front",
                drawerStyle: {
                    width: "82%",
                    backgroundColor: isDarkMode ? "#0A0E23" : "#FFFFFF",
                },
                overlayColor: isDarkMode ? "rgba(0, 0, 0, 0.7)" : "rgba(0, 0, 0, 0.4)",
            }}
        >
            <Drawer.Screen
                name="ShopAI"
                component={MainTabNavigator}
                options={{
                    title: "Cửa hàng ShopAI",
                }}
            />
            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    title: "Hồ sơ của tôi",
                    headerShown: true,
                    headerTitle: "Hồ sơ cá nhân",
                    headerStyle: {
                        backgroundColor: isDarkMode ? "#131625" : "#FFFFFF",
                    },
                    headerTintColor: isDarkMode ? "#FFFFFF" : COLORS.text,
                    headerTitleStyle: {
                        fontWeight: "700",
                    },
                }}
            />
        </Drawer.Navigator>
    );
};

export default RootDrawerNavigator;
