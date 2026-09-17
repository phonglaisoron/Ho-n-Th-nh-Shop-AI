import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ShopButton from '@components/ShopButton';
import ShopInput from '@components/ui/ShopInput';
import { COLORS, SIZES } from '@constants/theme';
import { useAuthStore } from '@store/useAuthStore';
import { useTheme } from '@contexts/ThemeContext';

const LoginScreen = () => {
    const navigation = useNavigation<any>();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [loading, setLoading] = useState(false);
    const { isDarkMode } = useTheme();

    const login = useAuthStore((state) => state.login);

    const dynamicBg = isDarkMode ? '#121212' : COLORS.background;
    const dynamicSubText = isDarkMode ? '#A0A0A0' : COLORS.textLight;

    const validate = () => {
        const next: { email?: string; password?: string } = {};
        if (!email.includes('@')) next.email = 'Email không hợp lệ (phải chứa @)';
        if (password.length < 6) next.password = 'Mật khẩu phải có ít nhất 6 ký tự';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleLogin = () => {
        if (!validate()) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            login('mock_token_123', {
                name: email.split('@')[0],
                email: email.trim(),
            });
        }, 600);
    };

    const handleQuickLogin = () => {
        login('mock_token_123', {
            name: 'Nguyễn Văn A',
            email: 'user@shopai.com',
        });
    };

    return (
        <View style={[styles.container, { backgroundColor: dynamicBg }]}>
            <Text style={styles.title}>ShopAI</Text>
            <Text style={[styles.subtitle, { color: dynamicSubText }]}>Vui lòng đăng nhập để tiếp tục</Text>

            <ShopInput
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <ShopInput
                label="Mật khẩu"
                placeholder="Ít nhất 6 ký tự"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry
            />

            <ShopButton
                title="Đăng nhập ngay"
                onPress={handleLogin}
                isLoading={loading}
                style={styles.loginBtn}
            />

            <ShopButton
                title="⚡ Đăng nhập nhanh (Tài khoản mẫu)"
                onPress={handleQuickLogin}
                style={[styles.quickLoginBtn, { backgroundColor: isDarkMode ? '#1E1E1E' : '#FFF0F0' }]}
                textStyle={{ color: COLORS.primary, fontSize: 13 }}
            />

            <Pressable onPress={() => navigation.navigate('Register')} style={styles.registerLink}>
                <Text style={[styles.registerLinkText, { color: dynamicSubText }]}>
                    Chưa có tài khoản? <Text style={styles.registerLinkBold}>Đăng ký</Text>
                </Text>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: SIZES.padding,
    },
    title: {
        fontSize: 40,
        fontWeight: '900',
        color: COLORS.primary,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: SIZES.body1,
        textAlign: 'center',
        marginBottom: 32,
    },
    loginBtn: { marginTop: 8 },
    quickLoginBtn: {
        marginTop: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
        shadowOpacity: 0,
        elevation: 0,
    },
    registerLink: { marginTop: 20, alignItems: 'center' },
    registerLinkText: { fontSize: SIZES.body2 },
    registerLinkBold: { color: COLORS.primary, fontWeight: '700' },
});

export default LoginScreen;