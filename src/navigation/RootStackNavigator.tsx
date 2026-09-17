import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RootDrawerNavigator from '@navigation/RootDrawerNavigator';
import CheckoutScreen from '@screens/CheckoutScreen';
import OrderDetailScreen from '@screens/OrderDetailScreen';

export type RootStackParamList = {
    RootDrawer: undefined;
    Checkout: undefined;
    OrderDetail: { orderId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStackNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
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
        </Stack.Navigator>
    );
};

export default RootStackNavigator;