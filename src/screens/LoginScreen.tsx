import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ShopButton from '@components/ShopButton';
import ShopInput from '@components/ui/ShopInput';
import LiquidBackground from '@components/ui/LiquidBackground';
import LiquidGlassView from '@components/ui/LiquidGlassView';
import axiosClient from '@api/axiosClient';
import { COLORS, SIZES, IOS26_COLORS } from '@constants/theme';
import { useAuthStore } from '@store/useAuthStore';
import { useTheme } from '@contexts/ThemeContext';

const LoginScreen = () => {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const { isDarkMode } = useTheme();

    const login = useAuthStore((state) => state.login);

    const validate = () => {
        const next: { email?: string; password?: string } = {};
        if (!email.includes('@')) next.email = 'Email không hợp lệ (phải chứa @)';
        if (password.length < 6) next.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleLogin = async () => {
        if (!validate()) return;
        setLoading(true);
        setServerError(null);

        try {
            const response = await axiosClient.post('/api/auth/login', { email, password });
            login(response.data.accessToken, response.data.user);
        } catch (error: any) {
            setServerError(error?.response?.data?.message ?? 'Đăng nhập thất bại, vui lòng thử lại');
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = async () => {
        setEmail('demo@shopai.com');
        setPassword('123456');
        setLoading(true);
        setServerError(null);
        try {
            const response = await axiosClient.post('/api/auth/login', {
                email: 'demo@shopai.com',
                password: '123456',
            });
            login(response.data.accessToken, response.data.user);
        } catch (error: any) {
            setServerError(error?.response?.data?.message ?? 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    const textPrimaryColor = isDarkMode ? '#F8FAFC' : '#0F172A';
    const textSecondaryColor = isDarkMode ? '#94A3B8' : '#475569';

    return (
        <LiquidBackground>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.keyboardContainer}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header: iOS 26 Liquid Crystal Island */}
                    <View style={styles.headerPod}>
                        <LiquidGlassView
                            intensity="prominent"
                            borderRadius={SIZES.radiusPill}
                            style={styles.badgePill}
                            glow={true}
                            glowColor={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                        >
                            <View style={styles.badgeContent}>
                                <Icon
                                    name="storefront-check"
                                    size={18}
                                    color={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                                />
                                <Text
                                    style={[
                                        styles.badgeText,
                                        {
                                            color: isDarkMode
                                                ? IOS26_COLORS.quantumCyan
                                                : COLORS.primary,
                                        },
                                    ]}
                                >
                                    CÔNG NGHỆ CHÍNH HÃNG · SHOPAI
                                </Text>
                            </View>
                        </LiquidGlassView>

                        <Text style={[styles.brandTitle, { color: textPrimaryColor }]}>
                            Shop<Text style={{ color: isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary }}>AI</Text>
                        </Text>
                        <Text style={[styles.brandSubtitle, { color: textSecondaryColor }]}>
                            Mua sắm thiết bị công nghệ & phụ kiện cao cấp
                        </Text>
                    </View>

                    {/* Central Monolithic Glass Pod */}
                    <LiquidGlassView
                        intensity="prominent"
                        borderRadius={SIZES.radiusXl}
                        bordered={true}
                        sheen={true}
                        glow={true}
                        style={styles.formCard}
                    >
                        <Text style={[styles.formHeader, { color: textPrimaryColor }]}>
                            Đăng nhập tài khoản
                        </Text>

                        <ShopInput
                            label="Địa chỉ Email"
                            placeholder="ban@example.com"
                            value={email}
                            onChangeText={(val) => {
                                setEmail(val);
                                if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                            }}
                            error={errors.email}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            leftIcon={
                                <Icon
                                    name="email-outline"
                                    size={20}
                                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                                />
                            }
                        />

                        <ShopInput
                            label="Mật khẩu"
                            placeholder="Tối thiểu 6 ký tự"
                            value={password}
                            onChangeText={(val) => {
                                setPassword(val);
                                if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                            }}
                            error={errors.password}
                            secureTextEntry={!showPassword}
                            leftIcon={
                                <Icon
                                    name="lock-outline"
                                    size={20}
                                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                                />
                            }
                            rightIcon={
                                <Pressable
                                    onPress={() => setShowPassword((prev) => !prev)}
                                    hitSlop={8}
                                >
                                    <Icon
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color={isDarkMode ? '#94A3B8' : '#64748B'}
                                    />
                                </Pressable>
                            }
                        />

                        {serverError && <Text style={styles.errorText}>⚠️ {serverError}</Text>}

                        {/* Primary Liquid Button */}
                        <ShopButton
                            title="Đăng nhập ngay"
                            onPress={handleLogin}
                            isLoading={loading}
                            variant="liquid-primary"
                            icon={<Icon name="arrow-right-circle" size={18} color="#FFF" />}
                            style={styles.submitBtn}
                        />

                        {/* Quick Login Glass Capsule */}
                        <ShopButton
                            title="⚡ Đăng nhập nhanh (Tài khoản mẫu)"
                            onPress={handleQuickLogin}
                            variant="liquid-glass"
                            style={styles.quickLoginBtn}
                            textStyle={{ fontSize: 13, fontWeight: '600' }}
                        />
                    </LiquidGlassView>

                    {/* Bottom Registration Glass Capsule */}
                    <View style={styles.footerContainer}>
                        <LiquidGlassView
                            intensity="subtle"
                            borderRadius={SIZES.radiusPill}
                            sheen={false}
                            style={styles.registerPill}
                        >
                            <Pressable
                                onPress={() => navigation.navigate('Register')}
                                style={styles.registerTouch}
                            >
                                <Text style={[styles.registerText, { color: textSecondaryColor }]}>
                                    Chưa có tài khoản?{' '}
                                    <Text
                                        style={[
                                            styles.registerBold,
                                            {
                                                color: isDarkMode
                                                    ? IOS26_COLORS.quantumCyan
                                                    : COLORS.primary,
                                            },
                                        ]}
                                    >
                                        Đăng ký tài khoản
                                    </Text>
                                </Text>
                            </Pressable>
                        </LiquidGlassView>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LiquidBackground>
    );
};

const styles = StyleSheet.create({
    keyboardContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding * 2,
    },
    headerPod: {
        alignItems: 'center',
        marginBottom: 28,
    },
    badgePill: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        marginBottom: 16,
    },
    badgeContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    brandTitle: {
        fontSize: 42,
        fontWeight: '900',
        letterSpacing: -0.5,
        marginBottom: 6,
    },
    brandSubtitle: {
        fontSize: 14,
        textAlign: 'center',
        letterSpacing: 0.2,
    },
    formCard: {
        padding: 24,
        width: '100%',
    },
    formHeader: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 20,
        letterSpacing: -0.3,
    },
    submitBtn: {
        marginTop: 8,
    },
    quickLoginBtn: {
        marginTop: 12,
    },
    footerContainer: {
        marginTop: 24,
        alignItems: 'center',
    },
    registerPill: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    registerTouch: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    registerText: {
        fontSize: 14,
    },
    registerBold: {
        fontWeight: '700',
    },
    errorText: {
        marginTop: 12,
        marginBottom: 8,
        color: COLORS.error,
        fontSize: SIZES.body2,
        textAlign: 'center',
    },
});

export default LoginScreen;