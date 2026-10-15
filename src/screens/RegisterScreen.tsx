import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Alert,
    KeyboardAvoidingView,
    Platform,
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

const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const login = useAuthStore((state) => state.login);
    const { isDarkMode } = useTheme();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        confirm?: string;
    }>({});
    const [loading, setLoading] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const validate = () => {
        const next: typeof errors = {};
        if (name.trim().length < 2) next.name = 'Họ tên tối thiểu 2 ký tự';
        if (!email.includes('@')) next.email = 'Email không hợp lệ (phải chứa @)';
        if (password.length < 6) next.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        if (confirm !== password) next.confirm = 'Xác nhận mật khẩu không khớp';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleRegister = async () => {
        if (!validate()) return;
        setLoading(true);
        setServerError(null);

        try {
            const response = await axiosClient.post('/api/auth/register', {
                email,
                password,
                name: name.trim(),
            });
            login(response.data.accessToken, response.data.user);
        } catch (error: any) {
            const msg = error?.response?.data?.message;
            setServerError(Array.isArray(msg) ? msg.join(', ') : msg ?? 'Đăng ký thất bại');
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
                    {/* Header: iOS 26 Capsule */}
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
                                    name="account-plus-outline"
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
                                    ĐĂNG KÝ THÀNH VIÊN · SHOPAI
                                </Text>
                            </View>
                        </LiquidGlassView>

                        <Text style={[styles.brandTitle, { color: textPrimaryColor }]}>
                            Gia nhập <Text style={{ color: isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary }}>ShopAI</Text>
                        </Text>
                        <Text style={[styles.brandSubtitle, { color: textSecondaryColor }]}>
                            Tạo tài khoản để nhận ngập tràn ưu đãi & bảo hành chính hãng
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
                        <ShopInput
                            label="Họ và tên"
                            placeholder="Nguyễn Văn A"
                            value={name}
                            onChangeText={(text) => {
                                setName(text);
                                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                            }}
                            error={errors.name}
                            leftIcon={
                                <Icon
                                    name="account-outline"
                                    size={20}
                                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                                />
                            }
                        />

                        <ShopInput
                            label="Địa chỉ Email"
                            placeholder="ban@example.com"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
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
                            onChangeText={(text) => {
                                setPassword(text);
                                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
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

                        <ShopInput
                            label="Xác nhận mật khẩu"
                            placeholder="Nhập lại mật khẩu"
                            value={confirm}
                            onChangeText={(text) => {
                                setConfirm(text);
                                if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: undefined }));
                            }}
                            error={errors.confirm}
                            secureTextEntry={!showConfirm}
                            leftIcon={
                                <Icon
                                    name="shield-check-outline"
                                    size={20}
                                    color={isDarkMode ? '#94A3B8' : '#64748B'}
                                />
                            }
                            rightIcon={
                                <Pressable
                                    onPress={() => setShowConfirm((prev) => !prev)}
                                    hitSlop={8}
                                >
                                    <Icon
                                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                                        size={20}
                                        color={isDarkMode ? '#94A3B8' : '#64748B'}
                                    />
                                </Pressable>
                            }
                        />

                        {serverError && <Text style={styles.errorText}>⚠️ {serverError}</Text>}

                        <ShopButton
                            title="Tạo tài khoản ngay"
                            onPress={handleRegister}
                            isLoading={loading}
                            variant="liquid-primary"
                            icon={<Icon name="check-circle-outline" size={18} color="#FFF" />}
                            style={styles.submitBtn}
                        />

                        <ShopButton
                            title="⚡ Điền nhanh thông tin mẫu"
                            onPress={() => {
                                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                                setName('Nguyễn Văn B');
                                setEmail(`user${randomSuffix}@shopai.com`);
                                setPassword('123456');
                                setConfirm('123456');
                                setErrors({});
                                setServerError(null);
                            }}
                            variant="liquid-glass"
                            style={styles.quickFillBtn}
                            textStyle={{ fontSize: 13, fontWeight: '600' }}
                        />
                    </LiquidGlassView>

                    {/* Bottom Link Capsule */}
                    <View style={styles.footerContainer}>
                        <LiquidGlassView
                            intensity="subtle"
                            borderRadius={SIZES.radiusPill}
                            sheen={false}
                            style={styles.loginPill}
                        >
                            <Pressable
                                onPress={() => navigation.navigate('Login')}
                                style={styles.loginTouch}
                            >
                                <Text style={[styles.loginText, { color: textSecondaryColor }]}>
                                    Đã có tài khoản?{' '}
                                    <Text
                                        style={[
                                            styles.loginBold,
                                            {
                                                color: isDarkMode
                                                    ? IOS26_COLORS.quantumCyan
                                                    : COLORS.primary,
                                            },
                                        ]}
                                    >
                                        Đăng nhập ngay
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
        marginBottom: 24,
    },
    badgePill: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        marginBottom: 14,
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
        fontSize: 34,
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
    submitBtn: {
        marginTop: 6,
    },
    quickFillBtn: {
        marginTop: 12,
    },
    footerContainer: {
        marginTop: 22,
        alignItems: 'center',
    },
    loginPill: {
        paddingHorizontal: 20,
        paddingVertical: 12,
    },
    loginTouch: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    loginText: {
        fontSize: 14,
    },
    loginBold: {
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

export default RegisterScreen;