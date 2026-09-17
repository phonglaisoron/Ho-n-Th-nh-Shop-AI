import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { useAuthStore } from '@store/useAuthStore';

const SettingsScreen = () => {
    const { isDarkMode, toggleTheme } = useTheme();
    const user = useAuthStore((state) => state.user);
    const setUser = useAuthStore((state) => state.setUser);
    const logout = useAuthStore((state) => state.logout);

    // Notification states
    const [promoNotif, setPromoNotif] = useState(true);
    const [orderNotif, setOrderNotif] = useState(true);
    const [soundNotif, setSoundNotif] = useState(false);

    // Security states
    const [biometricAuth, setBiometricAuth] = useState(false);

    // Storage state
    const [cacheSize, setCacheSize] = useState('18.6 MB');
    const [isClearingCache, setIsClearingCache] = useState(false);

    // Modal states
    const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
    const [editName, setEditName] = useState(user?.name || '');
    const [editEmail, setEditEmail] = useState(user?.email || '');

    const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isTermsModalVisible, setIsTermsModalVisible] = useState(false);

    // Dynamic colors based on dark mode
    const dynamicBg = isDarkMode ? '#121212' : COLORS.background;
    const dynamicCardBg = isDarkMode ? '#1E1E1E' : COLORS.surface;
    const dynamicText = isDarkMode ? '#FFFFFF' : COLORS.text;
    const dynamicSubText = isDarkMode ? '#A0A0A0' : COLORS.textLight;
    const dynamicBorder = isDarkMode ? '#2E2E2E' : COLORS.border;

    const handleSaveProfile = () => {
        if (!editName.trim() || !editEmail.trim()) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tên và email.');
            return;
        }
        setUser({
            name: editName.trim(),
            email: editEmail.trim(),
        });
        setIsProfileModalVisible(false);
        Alert.alert('Thành công', 'Thông tin tài khoản đã được cập nhật.');
    };

    const handleChangePassword = () => {
        if (!oldPassword || !newPassword || !confirmPassword) {
            Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ các trường mật khẩu.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp.');
            return;
        }
        setIsPasswordModalVisible(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        Alert.alert('Thành công', 'Mật khẩu của bạn đã được thay đổi thành công.');
    };

    const handleClearCache = () => {
        Alert.alert(
            'Xác nhận xóa bộ nhớ đệm',
            'Thao tác này sẽ giải phóng bộ nhớ tạm thời của ứng dụng. Bạn có muốn tiếp tục?',
            [
                { text: 'Hủy', style: 'cancel' },
                {
                    text: 'Xóa ngay',
                    style: 'destructive',
                    onPress: () => {
                        setIsClearingCache(true);
                        setTimeout(() => {
                            setCacheSize('0.0 MB');
                            setIsClearingCache(false);
                            Alert.alert('Hoàn tất', 'Đã xóa 18.6 MB bộ nhớ đệm thành công!');
                        }, 800);
                    },
                },
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?',
            [
                { text: 'Hủy', style: 'cancel' },
                { text: 'Đăng xuất', style: 'destructive', onPress: logout },
            ]
        );
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: dynamicBg }]} edges={['bottom']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* 1. Giao diện (Theme / Appearance) */}
                <Text style={[styles.sectionTitle, { color: dynamicSubText }]}>GIAO DIỆN & HIỂN THỊ</Text>
                <View style={[styles.card, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingIconWrapper}>
                            <Icon
                                name={isDarkMode ? 'weather-night' : 'white-balance-sunny'}
                                size={22}
                                color={COLORS.primary}
                            />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: dynamicText }]}>Chế độ tối (Dark Mode)</Text>
                            <Text style={[styles.settingSubLabel, { color: dynamicSubText }]}>
                                {isDarkMode ? 'Đang bật giao diện tối' : 'Đang bật giao diện sáng'}
                            </Text>
                        </View>
                        <Switch
                            value={isDarkMode}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#D9D9D9', true: COLORS.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* 2. Tài khoản cá nhân */}
                <Text style={[styles.sectionTitle, { color: dynamicSubText }]}>TÀI KHOẢN CỦA BẠN</Text>
                <View style={[styles.card, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                    <TouchableOpacity
                        style={styles.settingRow}
                        activeOpacity={0.7}
                        onPress={() => {
                            setEditName(user?.name || '');
                            setEditEmail(user?.email || '');
                            setIsProfileModalVisible(true);
                        }}
                    >
                        <View style={styles.settingIconWrapper}>
                            <Icon name="account-edit-outline" size={22} color={COLORS.secondary} />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: dynamicText }]}>Chỉnh sửa thông tin</Text>
                            <Text style={[styles.settingSubLabel, { color: dynamicSubText }]}>
                                {user?.name || 'Người dùng'} • {user?.email || 'Chưa cập nhật'}
                            </Text>
                        </View>
                        <Icon name="chevron-right" size={22} color={dynamicSubText} />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: dynamicBorder }]} />

                    <TouchableOpacity
                        style={styles.settingRow}
                        activeOpacity={0.7}
                        onPress={() => setIsPasswordModalVisible(true)}
                    >
                        <View style={styles.settingIconWrapper}>
                            <Icon name="lock-reset" size={22} color={COLORS.secondary} />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: dynamicText }]}>Đổi mật khẩu</Text>
                            <Text style={[styles.settingSubLabel, { color: dynamicSubText }]}>Cập nhật mật khẩu bảo mật</Text>
                        </View>
                        <Icon name="chevron-right" size={22} color={dynamicSubText} />
                    </TouchableOpacity>
                </View>

                {/* 3. Cài đặt thông báo */}
                <Text style={[styles.sectionTitle, { color: dynamicSubText }]}>THÔNG BÁO</Text>
                <View style={[styles.card, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingIconWrapper}>
                            <Icon name="tag-outline" size={22} color="#FAAD14" />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: dynamicText }]}>Ưu đãi & Khuyến mãi</Text>
                            <Text style={[styles.settingSubLabel, { color: dynamicSubText }]}>Nhận voucher và flash sale</Text>
                        </View>
                        <Switch
                            value={promoNotif}
                            onValueChange={setPromoNotif}
                            trackColor={{ false: '#D9D9D9', true: COLORS.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <View style={[styles.divider, { backgroundColor: dynamicBorder }]} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingIconWrapper}>
                            <Icon name="truck-delivery-outline" size={22} color="#52C41A" />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: dynamicText }]}>Trạng thái đơn hàng</Text>
                            <Text style={[styles.settingSubLabel, { color: dynamicSubText }]}>Cập nhật tiến trình giao nhận</Text>
                        </View>
                        <Switch
                            value={orderNotif}
                            onValueChange={setOrderNotif}
                            trackColor={{ false: '#D9D9D9', true: COLORS.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>

                    <View style={[styles.divider, { backgroundColor: dynamicBorder }]} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingIconWrapper}>
                            <Icon name="volume-high" size={22} color="#722ED1" />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: dynamicText }]}>Âm thanh thông báo</Text>
                            <Text style={[styles.settingSubLabel, { color: dynamicSubText }]}>Phát âm thanh khi có tin mới</Text>
                        </View>
                        <Switch
                            value={soundNotif}
                            onValueChange={setSoundNotif}
                            trackColor={{ false: '#D9D9D9', true: COLORS.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* 4. Bảo mật & Sinh trắc học */}
                <Text style={[styles.sectionTitle, { color: dynamicSubText }]}>BẢO MẬT</Text>
                <View style={[styles.card, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingIconWrapper}>
                            <Icon name="fingerprint" size={22} color="#13C2C2" />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: dynamicText }]}>Xác thực sinh trắc học</Text>
                            <Text style={[styles.settingSubLabel, { color: dynamicSubText }]}>Mở khóa bằng Vân tay / Face ID</Text>
                        </View>
                        <Switch
                            value={biometricAuth}
                            onValueChange={(val) => {
                                setBiometricAuth(val);
                                if (val) {
                                    Alert.alert('Đã kích hoạt', 'Xác thực sinh trắc học đã được bật cho các lần đăng nhập tiếp theo.');
                                }
                            }}
                            trackColor={{ false: '#D9D9D9', true: COLORS.primary }}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                {/* 5. Bộ nhớ & Dữ liệu */}
                <Text style={[styles.sectionTitle, { color: dynamicSubText }]}>BỘ NHỚ & DỮ LIỆU</Text>
                <View style={[styles.card, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                    <TouchableOpacity
                        style={styles.settingRow}
                        activeOpacity={0.7}
                        onPress={handleClearCache}
                        disabled={isClearingCache}
                    >
                        <View style={styles.settingIconWrapper}>
                            <Icon name="cached" size={22} color="#EB2F96" />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: dynamicText }]}>Xóa bộ nhớ đệm (Cache)</Text>
                            <Text style={[styles.settingSubLabel, { color: dynamicSubText }]}>
                                Giải phóng dung lượng tạm ({cacheSize})
                            </Text>
                        </View>
                        {isClearingCache ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Icon name="chevron-right" size={22} color={dynamicSubText} />
                        )}
                    </TouchableOpacity>
                </View>

                {/* 6. Ứng dụng & Hỗ trợ */}
                <Text style={[styles.sectionTitle, { color: dynamicSubText }]}>THÔNG TIN ỨNG DỤNG</Text>
                <View style={[styles.card, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                    <View style={styles.settingRow}>
                        <View style={styles.settingIconWrapper}>
                            <Icon name="translate" size={22} color="#1890FF" />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: dynamicText }]}>Ngôn ngữ</Text>
                            <Text style={[styles.settingSubLabel, { color: dynamicSubText }]}>Tiếng Việt (Mặc định)</Text>
                        </View>
                        <Text style={[styles.badgeText, { color: COLORS.secondary }]}>VN</Text>
                    </View>

                    <View style={[styles.divider, { backgroundColor: dynamicBorder }]} />

                    <TouchableOpacity
                        style={styles.settingRow}
                        activeOpacity={0.7}
                        onPress={() => setIsTermsModalVisible(true)}
                    >
                        <View style={styles.settingIconWrapper}>
                            <Icon name="shield-check-outline" size={22} color="#52C41A" />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: dynamicText }]}>Điều khoản & Chính sách</Text>
                            <Text style={[styles.settingSubLabel, { color: dynamicSubText }]}>Chính sách bảo mật dữ liệu</Text>
                        </View>
                        <Icon name="chevron-right" size={22} color={dynamicSubText} />
                    </TouchableOpacity>

                    <View style={[styles.divider, { backgroundColor: dynamicBorder }]} />

                    <View style={styles.settingRow}>
                        <View style={styles.settingIconWrapper}>
                            <Icon name="information-outline" size={22} color={COLORS.primary} />
                        </View>
                        <View style={styles.settingInfo}>
                            <Text style={[styles.settingLabel, { color: dynamicText }]}>Phiên bản ShopAI</Text>
                            <Text style={[styles.settingSubLabel, { color: dynamicSubText }]}>Build 2026.09 (v1.0.0)</Text>
                        </View>
                        <Text style={[styles.badgeText, { color: dynamicSubText }]}>v1.0.0</Text>
                    </View>
                </View>

                {/* 7. Đăng xuất */}
                <TouchableOpacity
                    style={[styles.logoutButton, { backgroundColor: isDarkMode ? '#2A1818' : '#FFF1F0' }]}
                    activeOpacity={0.7}
                    onPress={handleLogout}
                >
                    <Icon name="logout" size={20} color={COLORS.error} style={{ marginRight: 8 }} />
                    <Text style={styles.logoutButtonText}>Đăng xuất khỏi thiết bị</Text>
                </TouchableOpacity>

                <View style={{ height: 30 }} />
            </ScrollView>

            {/* Modal: Chỉnh sửa thông tin cá nhân */}
            <Modal
                visible={isProfileModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsProfileModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: dynamicCardBg }]}>
                        <Text style={[styles.modalTitle, { color: dynamicText }]}>Chỉnh sửa thông tin</Text>
                        <Text style={[styles.modalSubtitle, { color: dynamicSubText }]}>
                            Cập nhật họ tên và email hiển thị trên ứng dụng
                        </Text>

                        <Text style={[styles.inputLabel, { color: dynamicText }]}>Họ và tên</Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: isDarkMode ? '#2C2C2C' : '#F9F9F9',
                                    color: dynamicText,
                                    borderColor: dynamicBorder,
                                },
                            ]}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Nhập họ và tên..."
                            placeholderTextColor={dynamicSubText}
                        />

                        <Text style={[styles.inputLabel, { color: dynamicText, marginTop: 12 }]}>Email</Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: isDarkMode ? '#2C2C2C' : '#F9F9F9',
                                    color: dynamicText,
                                    borderColor: dynamicBorder,
                                },
                            ]}
                            value={editEmail}
                            onChangeText={setEditEmail}
                            placeholder="Nhập địa chỉ email..."
                            placeholderTextColor={dynamicSubText}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn, { borderColor: dynamicBorder }]}
                                onPress={() => setIsProfileModalVisible(false)}
                            >
                                <Text style={[styles.cancelBtnText, { color: dynamicText }]}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={handleSaveProfile}
                            >
                                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal: Đổi mật khẩu */}
            <Modal
                visible={isPasswordModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsPasswordModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: dynamicCardBg }]}>
                        <Text style={[styles.modalTitle, { color: dynamicText }]}>Đổi mật khẩu</Text>
                        <Text style={[styles.modalSubtitle, { color: dynamicSubText }]}>
                            Tạo mật khẩu mới có ít nhất 6 ký tự
                        </Text>

                        <Text style={[styles.inputLabel, { color: dynamicText }]}>Mật khẩu hiện tại</Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: isDarkMode ? '#2C2C2C' : '#F9F9F9',
                                    color: dynamicText,
                                    borderColor: dynamicBorder,
                                },
                            ]}
                            value={oldPassword}
                            onChangeText={setOldPassword}
                            placeholder="Nhập mật khẩu cũ..."
                            placeholderTextColor={dynamicSubText}
                            secureTextEntry
                        />

                        <Text style={[styles.inputLabel, { color: dynamicText, marginTop: 12 }]}>Mật khẩu mới</Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: isDarkMode ? '#2C2C2C' : '#F9F9F9',
                                    color: dynamicText,
                                    borderColor: dynamicBorder,
                                },
                            ]}
                            value={newPassword}
                            onChangeText={setNewPassword}
                            placeholder="Nhập mật khẩu mới..."
                            placeholderTextColor={dynamicSubText}
                            secureTextEntry
                        />

                        <Text style={[styles.inputLabel, { color: dynamicText, marginTop: 12 }]}>Xác nhận mật khẩu</Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: isDarkMode ? '#2C2C2C' : '#F9F9F9',
                                    color: dynamicText,
                                    borderColor: dynamicBorder,
                                },
                            ]}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            placeholder="Nhập lại mật khẩu mới..."
                            placeholderTextColor={dynamicSubText}
                            secureTextEntry
                        />

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn, { borderColor: dynamicBorder }]}
                                onPress={() => setIsPasswordModalVisible(false)}
                            >
                                <Text style={[styles.cancelBtnText, { color: dynamicText }]}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={handleChangePassword}
                            >
                                <Text style={styles.saveBtnText}>Đổi mật khẩu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal: Điều khoản & Chính sách */}
            <Modal
                visible={isTermsModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsTermsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContainer, { backgroundColor: dynamicCardBg, maxHeight: '80%' }]}>
                        <Text style={[styles.modalTitle, { color: dynamicText }]}>Điều khoản & Chính sách</Text>
                        <ScrollView style={{ marginVertical: 12 }}>
                            <Text style={[styles.termsText, { color: dynamicSubText }]}>
                                1. Bảo mật thông tin người dùng{'\n'}
                                ShopAI cam kết bảo vệ dữ liệu cá nhân của người dùng và tuân thủ các quy chuẩn an toàn thông tin.{'\n\n'}
                                2. Quy định đặt hàng & thanh toán{'\n'}
                                Khách hàng được quyền kiểm tra đơn hàng và hoàn tiền theo chính sách đổi trả trong vòng 7 ngày.{'\n\n'}
                                3. Trách nhiệm người dùng{'\n'}
                                Người dùng có trách nhiệm bảo mật thông tin tài khoản và thông báo kịp thời cho ShopAI nếu có dấu hiệu truy cập trái phép.
                            </Text>
                        </ScrollView>
                        <TouchableOpacity
                            style={[styles.modalBtn, styles.saveBtn, { alignSelf: 'stretch' }]}
                            onPress={() => setIsTermsModalVisible(false)}
                        >
                            <Text style={styles.saveBtnText}>Đã hiểu và đồng ý</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: SIZES.padding,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        marginTop: 18,
        marginBottom: 8,
        marginLeft: 4,
    },
    card: {
        borderRadius: SIZES.radius,
        borderWidth: 1,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    settingIconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.04)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    settingInfo: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    settingSubLabel: {
        fontSize: 13,
    },
    divider: {
        height: 1,
        marginLeft: 66,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '600',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 28,
        paddingVertical: 14,
        borderRadius: SIZES.radius,
        borderWidth: 1,
        borderColor: '#FFA39E',
    },
    logoutButtonText: {
        color: COLORS.error,
        fontWeight: '700',
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContainer: {
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 13,
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 6,
    },
    textInput: {
        height: 44,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
    },
    modalActionButtons: {
        flexDirection: 'row',
        marginTop: 20,
        gap: 12,
    },
    modalBtn: {
        flex: 1,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelBtn: {
        borderWidth: 1,
    },
    cancelBtnText: {
        fontWeight: '600',
        fontSize: 14,
    },
    saveBtn: {
        backgroundColor: COLORS.primary,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    },
    termsText: {
        fontSize: 14,
        lineHeight: 22,
    },
});

export default SettingsScreen;
