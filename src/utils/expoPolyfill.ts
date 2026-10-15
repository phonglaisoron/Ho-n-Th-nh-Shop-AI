import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

class SimpleEventEmitter {
    private listeners = new Map<string, Set<Function>>();

    addListener(event: string, listener: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(listener);
        return {
            remove: () => {
                this.listeners.get(event)?.delete(listener);
            },
        };
    }

    removeListener(event: string, listener: Function) {
        this.listeners.get(event)?.delete(listener);
    }

    removeAllListeners(event?: string) {
        if (event) {
            this.listeners.delete(event);
        } else {
            this.listeners.clear();
        }
    }

    emit(event: string, ...args: any[]) {
        this.listeners.get(event)?.forEach((fn) => fn(...args));
    }

    listenerCount(event: string) {
        return this.listeners.get(event)?.size || 0;
    }
}

class SimpleNativeModule {}
class SimpleSharedObject {}
class SimpleSharedRef {}

const SECURE_STORE_PREFIX = '@ShopAI_SecureStore:';

const MockExpoSecureStore = {
    AFTER_FIRST_UNLOCK: 0,
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
    ALWAYS: 2,
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 3,
    ALWAYS_THIS_DEVICE_ONLY: 4,
    WHEN_UNLOCKED: 5,
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,

    async getValueWithKeyAsync(key: string) {
        try {
            return await AsyncStorage.getItem(SECURE_STORE_PREFIX + key);
        } catch {
            return null;
        }
    },

    async setValueWithKeyAsync(value: string, key: string) {
        try {
            await AsyncStorage.setItem(SECURE_STORE_PREFIX + key, value);
        } catch (e) {
            console.warn('[SecureStore Polyfill] Error saving key:', e);
        }
    },

    async deleteValueWithKeyAsync(key: string) {
        try {
            await AsyncStorage.removeItem(SECURE_STORE_PREFIX + key);
        } catch (e) {
            console.warn('[SecureStore Polyfill] Error deleting key:', e);
        }
    },

    getValueWithKeySync(key: string) {
        return null;
    },

    setValueWithKeySync(value: string, key: string) {
        AsyncStorage.setItem(SECURE_STORE_PREFIX + key, value);
    },

    canUseBiometricAuthentication() {
        return true;
    },
};

const MockExpoLocalAuthentication = {
    async hasHardwareAsync() {
        return true;
    },
    async isEnrolledAsync() {
        return true;
    },
    async supportedAuthenticationTypesAsync() {
        // 1: FINGERPRINT, 2: FACIAL_RECOGNITION
        return [1];
    },
    async getEnrolledLevelAsync() {
        return 1;
    },
    async authenticateAsync(options: { promptMessage?: string; cancelLabel?: string }) {
        return new Promise((resolve) => {
            Alert.alert(
                options?.promptMessage || 'Xác thực sinh trắc học',
                'Quét vân tay để tiếp tục vào ShopAI',
                [
                    {
                        text: options?.cancelLabel || 'Huỷ',
                        style: 'cancel',
                        onPress: () => resolve({ success: false, error: 'user_cancel' }),
                    },
                    {
                        text: 'Mở khoá',
                        onPress: () => resolve({ success: true }),
                    },
                ],
                { cancelable: false }
            );
        });
    },
    async cancelAuthenticate() {},
};

const g = globalThis as any;

if (!g.expo) {
    g.expo = {
        EventEmitter: SimpleEventEmitter,
        NativeModule: SimpleNativeModule,
        SharedObject: SimpleSharedObject,
        SharedRef: SimpleSharedRef,
        modules: {
            ExpoSecureStore: MockExpoSecureStore,
            ExpoLocalAuthentication: MockExpoLocalAuthentication,
        },
        uuidv4: () =>
            'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                const r = (Math.random() * 16) | 0;
                return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
            }),
        uuidv5: () => '',
        getViewConfig: () => null,
        reloadAppAsync: async () => {},
    };
} else {
    if (!g.expo.EventEmitter) {
        g.expo.EventEmitter = SimpleEventEmitter;
    }
    if (!g.expo.modules) {
        g.expo.modules = {};
    }
    if (!g.expo.modules.ExpoSecureStore) {
        g.expo.modules.ExpoSecureStore = MockExpoSecureStore;
    }
    if (!g.expo.modules.ExpoLocalAuthentication) {
        g.expo.modules.ExpoLocalAuthentication = MockExpoLocalAuthentication;
    }
}
