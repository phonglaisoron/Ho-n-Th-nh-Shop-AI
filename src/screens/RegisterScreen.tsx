import React, { useState } from "react";
import { Text, StyleSheet, Pressable, ScrollView, Alert } from "react-native";
import ShopButton from "@components/ShopButton";
import ShopInput from "@components/ui/ShopInput";
import { COLORS, SIZES } from "@constants/theme";

import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@store/useAuthStore";

const RegisterScreen = () => {
    const navigation = useNavigation<any>();
    const login = useAuthStore((state) => state.login);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [errors, setErrors] = useState<{
        name?: string;
        email?: string;
        password?: string;
        confirm?: string;
    }>({});
    const [loading, setLoading] = useState(false);

    const validate = () => {
        const next: typeof errors = {};
        if (name.trim().length < 2) next.name = "Họ tên tối thiểu 2 ký tự";
        if (!email.includes("@")) next.email = "Email không hợp lệ (phải chứa @)";
        if (password.length < 6) next.password = "Mật khẩu phải có ít nhất 6 ký tự";
        if (confirm !== password) next.confirm = "Xác nhận mật khẩu không khớp";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleRegister = () => {
        if (!validate()) return;
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            Alert.alert(
                "Đăng ký thành công!",
                `Chúc mừng ${name.trim()}! Tài khoản "${email.trim()}" đã sẵn sàng.`,
                [
                    {
                        text: "Vào ứng dụng ngay",
                        onPress: () => login("mock_token_123", { name: name.trim(), email: email.trim() }),
                    },
                ],
                { cancelable: false }
            );
        }, 800);
    };

    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.title}>Tạo tài khoản</Text>
            <Text style={styles.subtitle}>Đăng ký để mua sắm trên ShopAI</Text>

            <ShopInput
                label="Họ tên"
                placeholder="Nguyễn Văn A"
                value={name}
                onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={errors.name}
            />
            <ShopInput
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
                autoCapitalize="none"
                keyboardType="email-address"
            />
            <ShopInput
                label="Mật khẩu"
                placeholder="Ít nhất 6 ký tự"
                value={password}
                onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                secureTextEntry
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
                secureTextEntry
            />

            <ShopButton
                title="Đăng ký ngay"
                onPress={handleRegister}
                isLoading={loading}
                style={styles.submitBtn}
            />

            <ShopButton
                title="⚡ Điền nhanh thông tin mẫu"
                onPress={() => {
                    setName("Nguyễn Văn A");
                    setEmail("test@gmail.com");
                    setPassword("123456");
                    setConfirm("123456");
                    setErrors({});
                }}
                style={styles.quickFillBtn}
                textStyle={{ color: COLORS.primary }}
            />

            <Pressable onPress={() => navigation.navigate("Login")} style={styles.loginLink}>
                <Text style={styles.loginLinkText}>
                    Đã có tài khoản? <Text style={styles.loginLinkBold}>Đăng nhập</Text>
                </Text>
            </Pressable>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: COLORS.background,
        justifyContent: "center",
        padding: SIZES.padding,
    },
    title: {
        fontSize: 32,
        fontWeight: "900",
        color: COLORS.primary,
        textAlign: "center",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: SIZES.body1,
        color: COLORS.textLight,
        textAlign: "center",
        marginBottom: 32,
    },
    submitBtn: { marginTop: 8 },
    quickFillBtn: {
        marginTop: 10,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.primary,
        shadowOpacity: 0,
        elevation: 0,
    },
    loginLink: { marginTop: 20, alignItems: "center" },
    loginLinkText: { fontSize: SIZES.body2, color: COLORS.textLight },
    loginLinkBold: { color: COLORS.primary, fontWeight: "700" },
});

export default RegisterScreen;