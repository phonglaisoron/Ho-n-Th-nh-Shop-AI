import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { COLORS, SIZES } from "@constants/theme";
import { useAuthStore } from "@store/useAuthStore";

const ProfileScreen = () => {
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Thông tin người dùng (Header) */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Icon name="account" size={48} color={COLORS.primary} />
                    </View>
                    <Text style={styles.userName}>{user?.name || "Người dùng ShopAI"}</Text>
                    <Text style={styles.userEmail}>{user?.email || "user@shopai.com"}</Text>
                </View>

                {/* Danh sách mục cài đặt / đơn hàng */}
                <View style={styles.menuContainer}>
                    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                        <Icon
                            name="package-variant-closed"
                            size={22}
                            color={COLORS.text}
                            style={styles.menuIcon}
                        />
                        <Text style={styles.menuText}>Đơn hàng của tôi</Text>
                        <Icon name="chevron-right" size={22} color={COLORS.textLight} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7}>
                        <Icon
                            name="cog-outline"
                            size={22}
                            color={COLORS.text}
                            style={styles.menuIcon}
                        />
                        <Text style={styles.menuText}>Cài đặt</Text>
                        <Icon name="chevron-right" size={22} color={COLORS.textLight} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, styles.logoutItem]}
                        onPress={logout}
                        activeOpacity={0.7}
                    >
                        <Icon
                            name="logout"
                            size={22}
                            color={COLORS.error}
                            style={styles.menuIcon}
                        />
                        <Text style={[styles.menuText, { color: COLORS.error }]}>
                            Đăng xuất
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        padding: SIZES.padding,
    },
    profileHeader: {
        alignItems: "center",
        paddingVertical: 24,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        marginBottom: SIZES.padding,
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.background,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 12,
    },
    userName: {
        fontSize: SIZES.h2,
        fontWeight: "bold",
        color: COLORS.text,
    },
    userEmail: {
        fontSize: SIZES.body2,
        color: COLORS.textLight,
        marginTop: 4,
    },
    menuContainer: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.radius,
        overflow: "hidden",
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: SIZES.padding,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    logoutItem: {
        borderBottomWidth: 0,
    },
    menuIcon: {
        marginRight: 14,
    },
    menuText: {
        flex: 1,
        fontSize: SIZES.body1,
        color: COLORS.text,
        fontWeight: "500",
    },
});

export default ProfileScreen;