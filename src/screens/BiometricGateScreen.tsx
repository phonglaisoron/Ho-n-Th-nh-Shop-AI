import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import ShopButton from '@components/ShopButton';
import LiquidBackground from '@components/ui/LiquidBackground';
import LiquidGlassView from '@components/ui/LiquidGlassView';
import { COLORS, SIZES, IOS26_COLORS } from '@constants/theme';
import { useAuthStore } from '@store/useAuthStore';
import { useTheme } from '@contexts/ThemeContext';

type Props = {
    /** Gọi khi user đã vượt qua cổng (hoặc máy không hỗ trợ sinh trắc học). */
    onUnlock: () => void;
};

const BiometricGateScreen = ({ onUnlock }: Props) => {
    const [checking, setChecking] = useState(true);
    const [failed, setFailed] = useState(false);
    const [label, setLabel] = useState('sinh trắc học'); // "Face ID" hoặc "vân tay"
    const logout = useAuthStore((state) => state.logout);
    const { isDarkMode } = useTheme();

    const authenticate = useCallback(async () => {
        setChecking(true);
        setFailed(false);
        try {
            // 1. Máy có cảm biến sinh trắc không?
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            // 2. User đã đăng ký khuôn mặt / vân tay trong Cài đặt máy chưa?
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            // Thiếu một trong hai -> KHÔNG chặn user, cho vào luôn.
            // Chặn ở đây là lỗi UX nghiêm trọng: máy không hỗ trợ sẽ không bao giờ vào được app.
            if (!hasHardware || !isEnrolled) {
                onUnlock();
                return;
            }

            // 3. Hiển thị đúng tên loại sinh trắc học để câu chữ thân thiện hơn
            const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
            if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                setLabel('Face ID');
            } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
                setLabel('vân tay');
            }

            // 4. Bung giao diện quét của HỆ ĐIỀU HÀNH
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: 'Xác thực để mở ShopAI',
                cancelLabel: 'Huỷ',
                disableDeviceFallback: false, // false = vẫn cho user nhập mã PIN máy nếu quét hỏng
            });

            if (result.success) {
                onUnlock();
            } else {
                setFailed(true);
            }
        } catch (e) {
            console.log('[biometric] Lỗi xác thực:', e);
            setFailed(true);
        } finally {
            setChecking(false);
        }
    }, [onUnlock]);

    // Tự động bung Pop-up quét ngay khi màn hình vừa hiện lên
    useEffect(() => {
        authenticate();
    }, [authenticate]);

    const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
    const subTextColor = isDarkMode ? '#94A3B8' : '#475569';

    if (checking) {
        return (
            <LiquidBackground>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={IOS26_COLORS.quantumCyan} />
                    <Text style={[styles.hint, { color: subTextColor, marginTop: 16 }]}>
                        Đang xác thực bảo mật...
                    </Text>
                </View>
            </LiquidBackground>
        );
    }

    return (
        <LiquidBackground>
            <View style={styles.centerContainer}>
                <LiquidGlassView
                    intensity="prominent"
                    style={[
                        styles.card,
                        {
                            backgroundColor: isDarkMode
                                ? 'rgba(12, 18, 38, 0.85)'
                                : 'rgba(255, 255, 255, 0.90)',
                            borderColor: isDarkMode
                                ? 'rgba(0, 245, 212, 0.35)'
                                : 'rgba(255, 255, 255, 0.80)',
                        },
                    ]}
                >
                    <Text style={styles.icon}>🔒</Text>
                    <Text style={[styles.title, { color: textColor }]}>ShopAI đang khoá</Text>
                    <Text style={[styles.hint, { color: subTextColor }]}>
                        {failed
                            ? `Xác thực ${label} chưa thành công. Bạn có thể thử lại hoặc đăng nhập lại bằng mật khẩu.`
                            : `Hãy xác thực bằng ${label} để tiếp tục.`}
                    </Text>

                    <ShopButton
                        title="Thử lại"
                        onPress={authenticate}
                        variant="liquid-cyan"
                        style={{ width: '100%', marginBottom: 12 }}
                    />

                    {/* LỐI THOÁT BẮT BUỘC: user luôn phải quay về được màn hình Login bằng mật khẩu */}
                    <ShopButton
                        title="Đăng nhập bằng mật khẩu"
                        onPress={logout}
                        variant="secondary"
                        style={{ width: '100%' }}
                    />
                </LiquidGlassView>
            </View>
        </LiquidBackground>
    );
};

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding * 1.5,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 24,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1.2,
        shadowColor: '#00F5D4',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
    },
    icon: {
        fontSize: 54,
        marginBottom: 16,
    },
    title: {
        fontSize: SIZES.h2,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    hint: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 26,
        lineHeight: 22,
    },
});

export default BiometricGateScreen;
