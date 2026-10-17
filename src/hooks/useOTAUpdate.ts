import { useEffect, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Updates from 'expo-updates';
import { getCrashlytics as crashlytics } from '@react-native-firebase/crashlytics';
import { ENABLE_OTA_UPDATE, APP_ENV } from '@constants/env';

export interface OTAUpdateState {
    isChecking: boolean;
    isDownloading: boolean;
    isUpdateAvailable: boolean;
    updateId: string | null;
    error: string | null;
}

/**
 * Hook quản lý cập nhật xuyên không (OTA - Over The Air) qua EAS Update
 * Tự động tắt ở môi trường Development nhờ cờ ENABLE_OTA_UPDATE.
 */
export function useOTAUpdate() {
    const [state, setState] = useState<OTAUpdateState>({
        isChecking: false,
        isDownloading: false,
        isUpdateAvailable: false,
        updateId: null,
        error: null,
    });

    const checkForUpdate = useCallback(async (isManual = false) => {
        // Tránh chạy OTA khi đang phát triển (Metro bundler)
        if (!ENABLE_OTA_UPDATE || !Updates.isEnabled) {
            if (isManual) {
                Alert.alert(
                    'Chế độ Phát triển',
                    `OTA Update đang tắt ở môi trường ${APP_ENV}. Tính năng này chỉ hoạt động ở bản Build Release/Production.`
                );
            }
            return;
        }

        try {
            setState(prev => ({ ...prev, isChecking: true, error: null }));
            crashlytics().log('OTA: Bắt đầu kiểm tra bản cập nhật mới...');

            const update = await Updates.checkForUpdateAsync();

            if (update.isAvailable) {
                const newUpdateId = update.manifest?.id || 'unknown';
                crashlytics().log(`OTA: Phát hiện bản cập nhật mới (ID: ${newUpdateId})`);

                setState(prev => ({
                    ...prev,
                    isChecking: false,
                    isDownloading: true,
                    isUpdateAvailable: true,
                    updateId: newUpdateId,
                }));

                // Tải bản bundle mới về bộ nhớ đệm ngầm
                await Updates.fetchUpdateAsync();
                crashlytics().log(`OTA: Đã tải xong bản cập nhật (ID: ${newUpdateId})`);

                setState(prev => ({ ...prev, isDownloading: false }));

                // Thông báo người dùng khởi động lại để áp dụng bản cập nhật
                Alert.alert(
                    'Đã có bản cập nhật mới! 🚀',
                    'ShopAI vừa tải về bản vá lỗi mới nhất. Bạn có muốn khởi động lại ngay để áp dụng không?',
                    [
                        { text: 'Để sau', style: 'cancel' },
                        {
                            text: 'Khởi động lại ngay',
                            onPress: async () => {
                                crashlytics().log('OTA: Người dùng xác nhận nạp lại bundle mới.');
                                await Updates.reloadAsync();
                            },
                        },
                    ]
                );
            } else {
                setState(prev => ({ ...prev, isChecking: false, isUpdateAvailable: false }));
                if (isManual) {
                    Alert.alert('Phiên bản mới nhất', 'Ứng dụng của bạn đang ở phiên bản mới nhất!');
                }
            }
        } catch (error: any) {
            const err = error instanceof Error ? error : new Error(String(error));
            crashlytics().log(`OTA: Kiểm tra cập nhật thất bại - ${err.message}`);
            crashlytics().recordError(err, 'OTAUpdateCheckFailed');

            setState(prev => ({
                ...prev,
                isChecking: false,
                isDownloading: false,
                error: err.message,
            }));

            if (isManual) {
                Alert.alert('Lỗi kiểm tra cập nhật', err.message);
            }
        }
    }, []);

    // Tự động kiểm tra bản cập nhật mới khi mở App (nếu bật OTA)
    useEffect(() => {
        if (ENABLE_OTA_UPDATE && Updates.isEnabled) {
            checkForUpdate(false);
        }
    }, [checkForUpdate]);

    return {
        ...state,
        checkForUpdate: () => checkForUpdate(true),
        updateId: Updates.updateId,
        channel: Updates.channel,
        runtimeVersion: Updates.runtimeVersion,
        isEmbeddedLaunch: Updates.isEmbeddedLaunch,
    };
}
