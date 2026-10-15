import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { reduxStore } from '@store/redux/store';
import { ThemeProvider } from '@contexts/ThemeContext';
import LoginScreen from '@screens/LoginScreen';
import RegisterScreen from '@screens/RegisterScreen';
import RootStackNavigator from '@navigation/RootStackNavigator';
import BiometricGateScreen from '@screens/BiometricGateScreen';
import { useAuthStore } from '@store/useAuthStore';
import { useAppLock } from '@hooks/useAppLock';
import { COLORS } from '@constants/theme';

const AuthStack = createNativeStackNavigator();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // Dữ liệu còn "Tươi" trong 5 phút
            retry: 2,
        },
    },
});

function App(): React.JSX.Element {
    const token = useAuthStore(state => state.token);
    const isLoading = useAuthStore(state => state.isLoading);
    const checkLocalToken = useAuthStore(state => state.checkLocalToken);
    const isUnlocked = useAuthStore(state => state.isUnlocked);
    const setIsUnlocked = useAuthStore(state => state.setIsUnlocked);

    useEffect(() => {
        checkLocalToken(); // Khôi phục Token từ SecureStore ngay khi App vừa khởi chạy
    }, [checkLocalToken]);

    // Canh gác App Lock: tự động khoá lại nếu App ở chế độ nền quá lâu (2 phút)
    useAppLock({ isUnlocked, setIsUnlocked });

    return (
        <SafeAreaProvider>
            <QueryClientProvider client={queryClient}>
                <Provider store={reduxStore}>
                    <ThemeProvider>
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={COLORS.primary} />
                            </View>
                        ) : token != null && !isUnlocked ? (
                            <BiometricGateScreen onUnlock={() => setIsUnlocked(true)} />
                        ) : (
                            <NavigationContainer>
                                {token == null ? (
                                    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                                        <AuthStack.Screen name="Login" component={LoginScreen} />
                                        <AuthStack.Screen name="Register" component={RegisterScreen} />
                                    </AuthStack.Navigator>
                                ) : (
                                    <RootStackNavigator />
                                )}
                            </NavigationContainer>
                        )}
                    </ThemeProvider>
                </Provider>
            </QueryClientProvider>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F172A',
    },
});

export default App;