import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '@screens/HomeScreen';
import ProductDetailScreen from '@screens/ProductDetailScreen';
import ScannerScreen from '@screens/ScannerScreen';
import { useTheme } from '@contexts/ThemeContext';
import { COLORS } from '@constants/theme';

export type HomeStackParamList = {
    Home: { scannedCode?: string } | undefined;
    ProductDetail: { productId: string; autoOpenQr?: boolean };
    Scanner: undefined;
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackNavigator = () => {
    const { isDarkMode } = useTheme();

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: isDarkMode ? '#1E1E1E' : COLORS.surface,
                },
                headerTintColor: isDarkMode ? '#FFFFFF' : COLORS.text,
                headerTitleStyle: {
                    color: isDarkMode ? '#FFFFFF' : COLORS.text,
                    fontWeight: '700',
                },
            }}
        >
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen
                name="ProductDetail"
                component={ProductDetailScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Scanner"
                component={ScannerScreen}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

export default HomeStackNavigator;