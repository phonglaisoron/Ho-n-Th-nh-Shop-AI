import { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Linking,
    NativeModules,
    PermissionsAndroid,
    Platform,
    TurboModuleRegistry,
} from 'react-native';

export type Coords = { latitude: number; longitude: number };

type LocationState = {
    coords: Coords | null;
    loading: boolean;
    error: string | null;
};

/**
 * Kiểm tra an toàn xem Native Module Geolocation đã được biên dịch vào file APK/Binary hay chưa.
 * - Tránh hoàn toàn lỗi Red Screen khi người dùng chưa build lại app (chưa chạy `npm run android`).
 */
const isGeolocationLinked = (): boolean => {
    try {
        if (TurboModuleRegistry && typeof TurboModuleRegistry.get === 'function') {
            const turboMod = TurboModuleRegistry.get('RNCGeolocation');
            if (turboMod != null) return true;
        }
        if (NativeModules && NativeModules.RNCGeolocation != null) {
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

/**
 * Lấy instance Geolocation một cách an toàn
 */
const getGeolocationSafe = () => {
    if (!isGeolocationLinked()) {
        return null;
    }
    try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const Geolocation = require('@react-native-community/geolocation').default;
        return Geolocation;
    } catch {
        return null;
    }
};

/**
 * Xin quyền vị trí
 */
const requestLocationPermission = async (): Promise<boolean> => {
    const Geolocation = getGeolocationSafe();
    if (Platform.OS === 'ios') {
        if (Geolocation?.requestAuthorization) {
            Geolocation.requestAuthorization();
        }
        return true;
    }

    const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
            title: 'ShopAI cần quyền vị trí',
            message: 'Cho phép ShopAI biết vị trí để tính chính xác phí giao hàng tới nhà bạn.',
            buttonPositive: 'Cho phép',
            buttonNegative: 'Để sau',
        },
    );

    if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        Alert.alert(
            'Quyền vị trí đã bị chặn',
            'Bạn đã chọn "Không hỏi lại". Hãy vào Cài đặt > ShopAI > Quyền > Vị trí để bật lại.',
            [
                { text: 'Để sau', style: 'cancel' },
                { text: 'Mở Cài đặt', onPress: () => Linking.openSettings() },
            ],
        );
        return false;
    }

    return granted === PermissionsAndroid.RESULTS.GRANTED;
};

export const useCurrentLocation = () => {
    const [state, setState] = useState<LocationState>({
        coords: null,
        loading: true,
        error: null,
    });

    const fetchLocation = useCallback(async () => {
        setState((s) => ({ ...s, loading: true, error: null }));

        // 1. Kiểm tra liên kết Native
        if (!isGeolocationLinked()) {
            setState({
                coords: null,
                loading: false,
                error: 'Cần build lại app Native (npm run android)',
            });
            return;
        }

        const Geolocation = getGeolocationSafe();
        if (!Geolocation) {
            setState({
                coords: null,
                loading: false,
                error: 'Chưa khởi tạo được Geolocation',
            });
            return;
        }

        // 2. Xin quyền vị trí
        const ok = await requestLocationPermission();
        if (!ok) {
            setState({ coords: null, loading: false, error: 'Chưa được cấp quyền vị trí' });
            return;
        }

        // 3. Lấy toạ độ GPS
        try {
            Geolocation.getCurrentPosition(
                (position: any) => {
                    setState({
                        coords: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        },
                        loading: false,
                        error: null,
                    });
                },
                (err: any) => {
                    const messages: Record<number, string> = {
                        1: 'Bạn đã từ chối quyền vị trí',
                        2: 'Không bắt được tín hiệu GPS',
                        3: 'Quá thời gian chờ GPS (thử ra ngoài trời)',
                    };
                    setState({
                        coords: null,
                        loading: false,
                        error: messages[err.code] ?? 'Không lấy được vị trí',
                    });
                },
                {
                    enableHighAccuracy: false,
                    timeout: 15000,
                    maximumAge: 60000,
                },
            );
        } catch (err: any) {
            setState({
                coords: null,
                loading: false,
                error: err?.message ?? 'Lỗi kết nối Geolocation',
            });
        }
    }, []);

    useEffect(() => {
        fetchLocation();
    }, [fetchLocation]);

    return { ...state, refresh: fetchLocation };
};