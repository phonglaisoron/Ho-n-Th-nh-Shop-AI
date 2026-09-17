import React from 'react';
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
import { useAuthStore } from '@store/useAuthStore';

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

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <Provider store={reduxStore}>
          {/* ThemeProvider giữ nguyên từ Sprint 3 (Chương 3) — không đụng vào */}
          <ThemeProvider>
            <NavigationContainer>
              {token == null ? (
                // GIỮ AuthStack Login + Register từ Chương 5 — chỉ bỏ Prop onLogin (đổi sang Zustand)
                <AuthStack.Navigator screenOptions={{ headerShown: false }}>
                  <AuthStack.Screen name="Login" component={LoginScreen} />
                  <AuthStack.Screen name="Register" component={RegisterScreen} />
                </AuthStack.Navigator>
              ) : (
                // RootStackNavigator bọc MainTabNavigator + Modal Checkout
                <RootStackNavigator />
              )}
            </NavigationContainer>
          </ThemeProvider>
        </Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

export default App;