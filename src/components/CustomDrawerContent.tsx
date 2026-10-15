import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
} from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '@store/useAuthStore';
import { useCartStore } from '@store/useCartStore';
import { useOrderStore } from '@store/useOrderStore';
import { useTheme } from '@contexts/ThemeContext';
import { COLORS, SIZES, IOS26_COLORS, COSMIC_THEME } from '@constants/theme';
import { hapticLight } from '@utils/haptics';

interface MenuItemProps {
    icon: string;
    label: string;
    badge?: string | number;
    badgeColor?: string;
    onPress: () => void;
    active?: boolean;
    isDarkMode: boolean;
}

const DrawerMenuItem: React.FC<MenuItemProps> = ({
    icon,
    label,
    badge,
    badgeColor,
    onPress,
    active,
    isDarkMode,
}) => {
    const activeBg = isDarkMode ? 'rgba(0, 245, 212, 0.14)' : 'rgba(2, 132, 199, 0.08)';
    const activeBorder = isDarkMode ? 'rgba(0, 245, 212, 0.40)' : 'rgba(2, 132, 199, 0.25)';
    const iconColor = active
        ? isDarkMode
            ? COSMIC_THEME.neonCyan
            : '#0284C7'
        : isDarkMode
            ? '#94A3B8'
            : '#475569';
    const textColor = active
        ? isDarkMode
            ? '#FFFFFF'
            : '#0284C7'
        : isDarkMode
            ? '#E2E8F0'
            : '#1E293B';

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            style={[
                styles.menuItem,
                active && {
                    backgroundColor: activeBg,
                    borderColor: activeBorder,
                    borderWidth: 1,
                },
            ]}
            onPress={() => {
                hapticLight();
                onPress();
            }}
        >
            <View style={styles.menuItemLeft}>
                <View
                    style={[
                        styles.menuIconBox,
                        {
                            backgroundColor: active
                                ? isDarkMode
                                    ? 'rgba(0, 245, 212, 0.20)'
                                    : 'rgba(2, 132, 199, 0.12)'
                                : isDarkMode
                                    ? 'rgba(255, 255, 255, 0.05)'
                                    : '#F1F5F9',
                        },
                    ]}
                >
                    <Icon name={icon} size={20} color={iconColor} />
                </View>
                <Text
                    style={[
                        styles.menuItemLabel,
                        { color: textColor, fontWeight: active ? '700' : '500' },
                    ]}
                >
                    {label}
                </Text>
            </View>

            {badge !== undefined && (
                <View
                    style={[
                        styles.badge,
                        { backgroundColor: badgeColor || (isDarkMode ? '#00F5D4' : '#0284C7') },
                    ]}
                >
                    <Text style={styles.badgeText}>{badge}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

export const CustomDrawerContent: React.FC<DrawerContentComponentProps> = ({
    navigation,
    state,
}) => {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const totalQuantity = useCartStore((s) => s.totalQuantity());
    const orders = useOrderStore((s) => s.orders);
    const { isDarkMode, toggleTheme } = useTheme();

    const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;
    const points = user?.points ?? 1250;

    const dynamicBg = isDarkMode ? '#0A0E23' : '#FFFFFF';
    const dynamicCardBg = isDarkMode ? 'rgba(16, 24, 58, 0.85)' : '#F8FAFC';
    const dynamicBorder = isDarkMode ? 'rgba(0, 245, 212, 0.25)' : '#E2E8F0';
    const dynamicText = isDarkMode ? '#F8FAFC' : '#0F172A';
    const dynamicSubText = isDarkMode ? '#94A3B8' : '#64748B';
    const sectionTitleColor = isDarkMode ? COSMIC_THEME.neonCyan : '#0284C7';

    // Active route detection
    const currentRoute = state.routes[state.index]?.name;

    const handleLogout = () => {
        Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất tài khoản không?', [
            { text: 'Hủy', style: 'cancel' },
            {
                text: 'Đăng xuất',
                style: 'destructive',
                onPress: () => {
                    navigation.closeDrawer();
                    logout();
                },
            },
        ]);
    };

    return (
        <View style={[styles.container, { backgroundColor: dynamicBg }]}>
            {/* 1. Header Profile Banner */}
            <View
                style={[
                    styles.profileHeader,
                    {
                        backgroundColor: dynamicCardBg,
                        borderColor: dynamicBorder,
                    },
                ]}
            >
                <View style={styles.headerTop}>
                    <View
                        style={[
                            styles.avatarWrapper,
                            {
                                borderColor: isDarkMode ? COSMIC_THEME.neonCyan : '#0284C7',
                                backgroundColor: isDarkMode ? '#172554' : '#E0F2FE',
                            },
                        ]}
                    >
                        <Icon
                            name="account"
                            size={38}
                            color={isDarkMode ? COSMIC_THEME.neonCyan : '#0284C7'}
                        />
                        <View style={styles.onlineDot} />
                    </View>

                    <View style={styles.headerInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.userName, { color: dynamicText }]} numberOfLines={1}>
                                {user?.name || 'Khách hàng'}
                            </Text>
                            <View
                                style={[
                                    styles.vipBadge,
                                    {
                                        backgroundColor: isDarkMode
                                            ? 'rgba(250, 204, 21, 0.20)'
                                            : 'rgba(245, 158, 11, 0.15)',
                                        borderColor: '#F59E0B',
                                    },
                                ]}
                            >
                                <Icon name="crown" size={10} color="#F59E0B" />
                                <Text style={styles.vipText}>VIP GOLD</Text>
                            </View>
                        </View>
                        <Text style={[styles.userEmail, { color: dynamicSubText }]} numberOfLines={1}>
                            {user?.email || 'member@shopai.vn'}
                        </Text>
                    </View>
                </View>

                {/* Quick Wallet & Loyalty Strip */}
                <View
                    style={[
                        styles.loyaltyStrip,
                        {
                            backgroundColor: isDarkMode
                                ? 'rgba(8, 12, 34, 0.70)'
                                : '#FFFFFF',
                            borderColor: dynamicBorder,
                        },
                    ]}
                >
                    <TouchableOpacity
                        style={styles.loyaltyItem}
                        onPress={() => {
                            navigation.closeDrawer();
                            navigation.navigate('ShopAI', { screen: 'ProfileTab' });
                        }}
                    >
                        <Text style={[styles.loyaltyValue, { color: '#F59E0B' }]}>
                            {points.toLocaleString('vi-VN')}
                        </Text>
                        <Text style={[styles.loyaltyLabel, { color: dynamicSubText }]}>Shop Xu</Text>
                    </TouchableOpacity>

                    <View style={[styles.stripDivider, { backgroundColor: dynamicBorder }]} />

                    <TouchableOpacity
                        style={styles.loyaltyItem}
                        onPress={() => {
                            navigation.closeDrawer();
                            navigation.navigate('ShopAI', { screen: 'ProfileTab' });
                        }}
                    >
                        <Text
                            style={[
                                styles.loyaltyValue,
                                { color: isDarkMode ? COSMIC_THEME.neonCyan : '#0284C7' },
                            ]}
                        >
                            5
                        </Text>
                        <Text style={[styles.loyaltyLabel, { color: dynamicSubText }]}>Voucher</Text>
                    </TouchableOpacity>

                    <View style={[styles.stripDivider, { backgroundColor: dynamicBorder }]} />

                    <TouchableOpacity
                        style={styles.loyaltyItem}
                        onPress={() => {
                            navigation.closeDrawer();
                            navigation.navigate('ShopAI', { screen: 'Orders' });
                        }}
                    >
                        <Text style={[styles.loyaltyValue, { color: '#10B981' }]}>
                            {orders.length}
                        </Text>
                        <Text style={[styles.loyaltyLabel, { color: dynamicSubText }]}>Đơn mua</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* 2. Menu Navigation List */}
            <ScrollView
                style={styles.menuScroll}
                contentContainerStyle={styles.menuScrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* SECTION 1: MUA SẮM & ĐƠN HÀNG */}
                <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
                    MUA SẮM & ĐƠN HÀNG
                </Text>

                <DrawerMenuItem
                    icon="storefront-outline"
                    label="Trang chủ ShopAI"
                    active={currentRoute === 'ShopAI'}
                    isDarkMode={isDarkMode}
                    onPress={() => {
                        navigation.closeDrawer();
                        navigation.navigate('ShopAI', { screen: 'HomeTab' });
                    }}
                />

                <DrawerMenuItem
                    icon="cart-outline"
                    label="Giỏ hàng của tôi"
                    badge={totalQuantity > 0 ? totalQuantity : undefined}
                    badgeColor={isDarkMode ? '#00F5D4' : '#0284C7'}
                    isDarkMode={isDarkMode}
                    onPress={() => {
                        navigation.closeDrawer();
                        navigation.navigate('ShopAI', { screen: 'Cart' });
                    }}
                />

                <DrawerMenuItem
                    icon="clipboard-text-clock-outline"
                    label="Lịch sử đơn hàng"
                    badge={pendingOrdersCount > 0 ? `${pendingOrdersCount} chờ` : undefined}
                    badgeColor="#F59E0B"
                    isDarkMode={isDarkMode}
                    onPress={() => {
                        navigation.closeDrawer();
                        navigation.navigate('ShopAI', { screen: 'Orders' });
                    }}
                />

                <DrawerMenuItem
                    icon="ticket-percent-outline"
                    label="Kho Voucher & Giảm giá"
                    badge="3 Mới"
                    badgeColor="#10B981"
                    isDarkMode={isDarkMode}
                    onPress={() => {
                        navigation.closeDrawer();
                        navigation.navigate('ShopAI', { screen: 'ProfileTab' });
                    }}
                />

                <View style={[styles.menuDivider, { backgroundColor: dynamicBorder }]} />

                {/* SECTION 2: TÀI KHOẢN & TIỆN ÍCH */}
                <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
                    TÀI KHOẢN & TIỆN ÍCH
                </Text>

                <DrawerMenuItem
                    icon="account-circle-outline"
                    label="Hồ sơ & Tài khoản"
                    active={currentRoute === 'Profile'}
                    isDarkMode={isDarkMode}
                    onPress={() => {
                        navigation.closeDrawer();
                        navigation.navigate('Profile');
                    }}
                />

                <DrawerMenuItem
                    icon="map-marker-radius-outline"
                    label="Sổ địa chỉ nhận hàng"
                    isDarkMode={isDarkMode}
                    onPress={() => {
                        navigation.closeDrawer();
                        navigation.navigate('Profile');
                    }}
                />

                <DrawerMenuItem
                    icon="barcode-scan"
                    label="Quét mã QR / Barcode"
                    isDarkMode={isDarkMode}
                    onPress={() => {
                        navigation.closeDrawer();
                        navigation.navigate('Scanner');
                    }}
                />

                <DrawerMenuItem
                    icon="credit-card-outline"
                    label="Phương thức thanh toán"
                    isDarkMode={isDarkMode}
                    onPress={() => {
                        Alert.alert(
                            'Phương thức thanh toán',
                            'ShopAI hỗ trợ đa dạng thanh toán:\n• Thẻ Visa / Master / JCB\n• Ví MoMo & ZaloPay\n• Thanh toán tiền mặt khi nhận hàng (COD)',
                        );
                    }}
                />

                <View style={[styles.menuDivider, { backgroundColor: dynamicBorder }]} />

                {/* SECTION 3: HỆ THỐNG & TRỢ GIÚP */}
                <Text style={[styles.sectionHeader, { color: sectionTitleColor }]}>
                    HỆ THỐNG & TRỢ GIÚP
                </Text>

                <DrawerMenuItem
                    icon="flask-outline"
                    label="Thử nghiệm Redux Toolkit"
                    badge="Demo"
                    badgeColor="#0284C7"
                    isDarkMode={isDarkMode}
                    onPress={() => {
                        navigation.closeDrawer();
                        navigation.navigate('ShopAI', { screen: 'RTKDemo' });
                    }}
                />

                <DrawerMenuItem
                    icon="cog-outline"
                    label="Cài đặt hệ thống"
                    isDarkMode={isDarkMode}
                    onPress={() => {
                        navigation.closeDrawer();
                        navigation.navigate('Settings');
                    }}
                />

                <DrawerMenuItem
                    icon="headphones"
                    label="Chăm sóc khách hàng 24/7"
                    isDarkMode={isDarkMode}
                    onPress={() => {
                        Alert.alert(
                            'Tổng đài hỗ trợ ShopAI',
                            'Hotline miễn cước: 1900 8888\nEmail: cskh@shopai.vn\nPhục vụ: 24/7 kể cả ngày lễ',
                        );
                    }}
                />
            </ScrollView>

            {/* 3. Footer with Theme Switch & Logout */}
            <View
                style={[
                    styles.footer,
                    {
                        backgroundColor: dynamicCardBg,
                        borderColor: dynamicBorder,
                    },
                ]}
            >
                {/* Theme Toggle Bar */}
                <View style={styles.themeToggleRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Icon
                            name={isDarkMode ? 'weather-night' : 'white-balance-sunny'}
                            size={18}
                            color={isDarkMode ? COSMIC_THEME.neonCyan : '#F59E0B'}
                        />
                        <Text style={[styles.themeLabel, { color: dynamicText }]}>
                            {isDarkMode ? 'Giao diện Tối' : 'Giao diện Sáng'}
                        </Text>
                    </View>
                    <Switch
                        value={isDarkMode}
                        onValueChange={toggleTheme}
                        trackColor={{
                            false: '#CBD5E1',
                            true: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary,
                        }}
                        thumbColor="#FFFFFF"
                    />
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    activeOpacity={0.8}
                    onPress={handleLogout}
                >
                    <Icon name="logout-variant" size={18} color="#EF4444" style={{ marginRight: 6 }} />
                    <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
                </TouchableOpacity>

                {/* App Version Tag */}
                <Text style={[styles.versionText, { color: dynamicSubText }]}>
                    ShopAI v2.4.0 · Cửa hàng công nghệ chính hãng
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    profileHeader: {
        paddingTop: 52,
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 14,
    },
    avatarWrapper: {
        width: 52,
        height: 52,
        borderRadius: 26,
        borderWidth: 2,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        marginRight: 12,
    },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    headerInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    vipBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
        borderWidth: 0.8,
    },
    vipText: {
        fontSize: 9,
        fontWeight: '900',
        color: '#F59E0B',
        letterSpacing: 0.4,
    },
    userEmail: {
        fontSize: 12,
        marginTop: 2,
    },
    loyaltyStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    loyaltyItem: {
        alignItems: 'center',
        flex: 1,
    },
    loyaltyValue: {
        fontSize: 14,
        fontWeight: '800',
    },
    loyaltyLabel: {
        fontSize: 10,
        marginTop: 2,
        fontWeight: '500',
    },
    stripDivider: {
        width: 1,
        height: 24,
    },
    menuScroll: {
        flex: 1,
    },
    menuScrollContent: {
        paddingVertical: 12,
        paddingHorizontal: 12,
    },
    sectionHeader: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.8,
        marginTop: 10,
        marginBottom: 8,
        paddingHorizontal: 8,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 9,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginBottom: 4,
    },
    menuItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    menuIconBox: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    menuItemLabel: {
        fontSize: 13,
        flex: 1,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
        minWidth: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    menuDivider: {
        height: 1,
        marginVertical: 10,
        marginHorizontal: 6,
    },
    footer: {
        borderTopWidth: 1,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
    },
    themeToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingVertical: 4,
    },
    themeLabel: {
        fontSize: 13,
        fontWeight: '600',
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.10)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.25)',
        paddingVertical: 10,
        borderRadius: 12,
        marginBottom: 10,
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 13,
        fontWeight: '700',
    },
    versionText: {
        fontSize: 10,
        textAlign: 'center',
    },
});

export default CustomDrawerContent;
