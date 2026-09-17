import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES } from '@constants/theme';
import { useAuthStore, AddressItem } from '@store/useAuthStore';
import { useOrderStore } from '@store/useOrderStore';
import { useTheme } from '@contexts/ThemeContext';

const formatCurrency = (v: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

const ProfileScreen = () => {
    const navigation = useNavigation<any>();
    const user = useAuthStore((state) => state.user);
    const updateProfile = useAuthStore((state) => state.updateProfile);
    const addPoints = useAuthStore((state) => state.addPoints);
    const addAddress = useAuthStore((state) => state.addAddress);
    const setDefaultAddress = useAuthStore((state) => state.setDefaultAddress);
    const deleteAddress = useAuthStore((state) => state.deleteAddress);
    const logout = useAuthStore((state) => state.logout);
    const orders = useOrderStore((state) => state.orders);
    const { isDarkMode } = useTheme();

    // Modals
    const [isAddressModalVisible, setIsAddressModalVisible] = useState(false);
    const [isAddAddressFormVisible, setIsAddAddressFormVisible] = useState(false);
    const [isVoucherModalVisible, setIsVoucherModalVisible] = useState(false);
    const [isCheckinModalVisible, setIsCheckinModalVisible] = useState(false);
    const [isEditProfileVisible, setIsEditProfileVisible] = useState(false);

    // Form states for new address
    const [newTitle, setNewTitle] = useState('🏠 Nhà riêng');
    const [newReceiver, setNewReceiver] = useState(user?.name || '');
    const [newPhone, setNewPhone] = useState(user?.phone || '0987 654 321');
    const [newDetail, setNewDetail] = useState('');
    const [newIsDefault, setNewIsDefault] = useState(false);

    // Form states for profile edit
    const [editName, setEditName] = useState(user?.name || '');
    const [editPhone, setEditPhone] = useState(user?.phone || '0987 654 321');

    // Checked in state
    const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

    // Dynamic colors
    const dynamicBg = isDarkMode ? '#121212' : COLORS.background;
    const dynamicCardBg = isDarkMode ? '#1E1E1E' : COLORS.surface;
    const dynamicText = isDarkMode ? '#FFFFFF' : COLORS.text;
    const dynamicSubText = isDarkMode ? '#A0A0A0' : COLORS.textLight;
    const dynamicBorder = isDarkMode ? '#2E2E2E' : '#EEEEEE';

    const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;
    const points = user?.points ?? 1250;
    const addresses = user?.addresses || [];
    const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0];

    const vouchers = [
        { id: 'VOUCHER_50K', code: 'SHOPAI50K', title: 'Giảm 50.000 ₫', desc: 'Đơn từ 300.000 ₫', exp: 'HSD: 30/10/2026', type: 'cash' },
        { id: 'VOUCHER_FREESHIP', code: 'FREESHIP0D', title: 'Miễn phí vận chuyển', desc: 'Tối đa 30.000 ₫', exp: 'HSD: 15/11/2026', type: 'ship' },
        { id: 'VOUCHER_VIP20', code: 'VIPGOLD20', title: 'Giảm 20% đơn hàng', desc: 'Dành riêng cho Hạng Vàng', exp: 'HSD: 31/12/2026', type: 'vip' },
    ];

    const handleCheckIn = () => {
        if (hasCheckedInToday) {
            Alert.alert('Thông báo', 'Bạn đã nhận 50 Xu điểm danh hôm nay rồi. Hãy quay lại vào ngày mai nhé!');
            return;
        }
        addPoints(50);
        setHasCheckedInToday(true);
        setIsCheckinModalVisible(false);
        Alert.alert('🎉 Điểm danh thành công!', '+50 Xu ShopAI đã được cộng vào tài khoản của bạn.');
    };

    const handleSaveNewAddress = () => {
        if (!newReceiver.trim() || !newPhone.trim() || !newDetail.trim()) {
            Alert.alert('Lỗi', 'Vui lòng điền đầy đủ người nhận, số điện thoại và địa chỉ chi tiết.');
            return;
        }
        addAddress({
            title: newTitle.trim() || '🏠 Địa chỉ',
            receiver: newReceiver.trim(),
            phone: newPhone.trim(),
            detail: newDetail.trim(),
            isDefault: newIsDefault,
        });
        setNewDetail('');
        setIsAddAddressFormVisible(false);
        Alert.alert('Thành công', 'Đã thêm địa chỉ giao hàng mới!');
    };

    const handleSaveProfile = () => {
        if (!editName.trim() || !editPhone.trim()) {
            Alert.alert('Lỗi', 'Vui lòng không để trống họ tên và số điện thoại.');
            return;
        }
        updateProfile({
            name: editName.trim(),
            phone: editPhone.trim(),
        });
        setIsEditProfileVisible(false);
        Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân!');
    };

    const handleLogout = () => {
        Alert.alert(
            'Đăng xuất',
            'Bạn có chắc chắn muốn đăng xuất tài khoản này không?',
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
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* 1. Header Người Dùng */}
                <View style={[styles.profileHeaderCard, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                    <View style={styles.headerTopRow}>
                        <View style={[styles.avatarWrapper, { backgroundColor: isDarkMode ? '#2A2A2A' : '#FFF0F0' }]}>
                            <Icon name="account" size={44} color={COLORS.primary} />
                        </View>
                        <View style={styles.userInfoCol}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={[styles.userNameText, { color: dynamicText }]}>{user?.name || 'Phong'}</Text>
                                <View style={styles.vipTag}>
                                    <Text style={styles.vipTagText}>VIP GOLD</Text>
                                </View>
                            </View>
                            <Text style={[styles.userEmailText, { color: dynamicSubText }]}>{user?.email || 'phong@gmail.com'}</Text>
                            <Text style={[styles.userPhoneText, { color: dynamicSubText }]}>📱 {user?.phone || '0987 654 321'}</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.editProfileIconBtn, { backgroundColor: isDarkMode ? '#2C2C2C' : '#F5F5F5' }]}
                            onPress={() => {
                                setEditName(user?.name || '');
                                setEditPhone(user?.phone || '0987 654 321');
                                setIsEditProfileVisible(true);
                            }}
                        >
                            <Icon name="account-edit-outline" size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    {/* THẺ THÀNH VIÊN VIP & TÍCH ĐIỂM */}
                    <View style={styles.memberVipCard}>
                        <View style={styles.memberCardHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="crown" size={20} color="#FFD700" style={{ marginRight: 6 }} />
                                <Text style={styles.memberCardTitle}>Thẻ Thành Viên ShopAI</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.checkInButton}
                                activeOpacity={0.8}
                                onPress={() => setIsCheckinModalVisible(true)}
                            >
                                <Icon name="gift-outline" size={14} color="#1E1E1E" style={{ marginRight: 4 }} />
                                <Text style={styles.checkInButtonText}>
                                    {hasCheckedInToday ? 'Đã nhận xu' : 'Điểm danh +50 Xu'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.pointsRow}>
                            <View>
                                <Text style={styles.pointsSubLabel}>Xu tích lũy hiện có</Text>
                                <Text style={styles.pointsValue}>{points.toLocaleString('vi-VN')} <Text style={{ fontSize: 14 }}>Xu</Text></Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.pointsSubLabel}>Quy đổi giảm giá</Text>
                                <Text style={styles.pointsEquiv}>{formatCurrency(points * 1000)}</Text>
                            </View>
                        </View>

                        {/* Thanh tiến trình nâng hạng */}
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBarTrack}>
                                <View style={[styles.progressBarFill, { width: '75%' }]} />
                            </View>
                            <View style={styles.progressLabelRow}>
                                <Text style={styles.progressText}>Hạng Vàng</Text>
                                <Text style={styles.progressText}>Còn 250 Xu lên Kim Cương 💎</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 2. Thống kê nhanh (Quick Stats) */}
                <View style={[styles.quickStatsBar, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => setIsVoucherModalVisible(true)}
                    >
                        <Text style={[styles.statValue, { color: COLORS.primary }]}>5</Text>
                        <Text style={[styles.statLabel, { color: dynamicSubText }]}>🎟️ Voucher</Text>
                    </TouchableOpacity>

                    <View style={[styles.statDivider, { backgroundColor: dynamicBorder }]} />

                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => setIsCheckinModalVisible(true)}
                    >
                        <Text style={[styles.statValue, { color: '#FAAD14' }]}>{points}</Text>
                        <Text style={[styles.statLabel, { color: dynamicSubText }]}>💰 Shop Xu</Text>
                    </TouchableOpacity>

                    <View style={[styles.statDivider, { backgroundColor: dynamicBorder }]} />

                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => Alert.alert('Yêu thích', 'Bạn đang có 12 sản phẩm trong danh sách theo dõi.')}
                    >
                        <Text style={[styles.statValue, { color: '#EB2F96' }]}>12</Text>
                        <Text style={[styles.statLabel, { color: dynamicSubText }]}>❤️ Yêu thích</Text>
                    </TouchableOpacity>

                    <View style={[styles.statDivider, { backgroundColor: dynamicBorder }]} />

                    <TouchableOpacity
                        style={styles.statItem}
                        onPress={() => Alert.alert('Đánh giá', 'Bạn đã thực hiện 8 đánh giá hữu ích.')}
                    >
                        <Text style={[styles.statValue, { color: '#52C41A' }]}>8</Text>
                        <Text style={[styles.statLabel, { color: dynamicSubText }]}>⭐ Đánh giá</Text>
                    </TouchableOpacity>
                </View>

                {/* 3. Trung tâm Đơn hàng (Order Center) */}
                <View style={[styles.sectionCard, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon name="package-variant-closed" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
                            <Text style={[styles.sectionHeading, { color: dynamicText }]}>Đơn hàng của tôi</Text>
                        </View>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => navigation.navigate('Orders')}
                        >
                            <Text style={[styles.viewAllText, { color: COLORS.secondary }]}>Xem tất cả ({orders.length})</Text>
                            <Icon name="chevron-right" size={18} color={COLORS.secondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.orderStatusGrid}>
                        <TouchableOpacity
                            style={styles.orderStatusCol}
                            onPress={() => navigation.navigate('Orders')}
                        >
                            <View style={styles.orderIconWrapper}>
                                <Icon name="credit-card-clock-outline" size={26} color="#FAAD14" />
                                {pendingOrdersCount > 0 && (
                                    <View style={styles.orderBadge}>
                                        <Text style={styles.orderBadgeText}>{pendingOrdersCount}</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={[styles.orderStatusLabel, { color: dynamicText }]}>Chờ thanh toán</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.orderStatusCol}
                            onPress={() => navigation.navigate('Orders')}
                        >
                            <View style={styles.orderIconWrapper}>
                                <Icon name="package-variant" size={26} color="#1890FF" />
                            </View>
                            <Text style={[styles.orderStatusLabel, { color: dynamicText }]}>Đang xử lý</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.orderStatusCol}
                            onPress={() => navigation.navigate('Orders')}
                        >
                            <View style={styles.orderIconWrapper}>
                                <Icon name="truck-fast-outline" size={26} color="#52C41A" />
                            </View>
                            <Text style={[styles.orderStatusLabel, { color: dynamicText }]}>Đang giao</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.orderStatusCol}
                            onPress={() => navigation.navigate('Orders')}
                        >
                            <View style={styles.orderIconWrapper}>
                                <Icon name="history" size={26} color="#722ED1" />
                            </View>
                            <Text style={[styles.orderStatusLabel, { color: dynamicText }]}>Lịch sử mua</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 4. Sổ Địa Chỉ Nhận Hàng (Address Section) */}
                <View style={[styles.sectionCard, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                    <View style={styles.sectionHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Icon name="map-marker-radius-outline" size={20} color="#FA541C" style={{ marginRight: 6 }} />
                            <Text style={[styles.sectionHeading, { color: dynamicText }]}>Sổ địa chỉ nhận hàng</Text>
                        </View>
                        <TouchableOpacity
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                            onPress={() => setIsAddressModalVisible(true)}
                        >
                            <Text style={[styles.viewAllText, { color: COLORS.secondary }]}>Quản lý ({addresses.length})</Text>
                            <Icon name="chevron-right" size={18} color={COLORS.secondary} />
                        </TouchableOpacity>
                    </View>

                    {defaultAddress ? (
                        <TouchableOpacity
                            style={[styles.defaultAddressBox, { backgroundColor: isDarkMode ? '#282828' : '#F9F9F9', borderColor: dynamicBorder }]}
                            activeOpacity={0.7}
                            onPress={() => setIsAddressModalVisible(true)}
                        >
                            <View style={styles.addressHeaderRow}>
                                <Text style={[styles.addressTitleText, { color: dynamicText }]}>{defaultAddress.title}</Text>
                                <View style={styles.defaultTag}>
                                    <Text style={styles.defaultTagText}>Mặc định</Text>
                                </View>
                            </View>
                            <Text style={[styles.addressReceiverText, { color: dynamicText }]}>
                                {defaultAddress.receiver} • <Text style={{ color: dynamicSubText }}>{defaultAddress.phone}</Text>
                            </Text>
                            <Text style={[styles.addressDetailText, { color: dynamicSubText }]} numberOfLines={2}>
                                {defaultAddress.detail}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={[styles.addAddressButton, { borderColor: COLORS.primary }]}
                            onPress={() => {
                                setIsAddressModalVisible(true);
                                setIsAddAddressFormVisible(true);
                            }}
                        >
                            <Icon name="plus" size={18} color={COLORS.primary} style={{ marginRight: 4 }} />
                            <Text style={{ color: COLORS.primary, fontWeight: '600' }}>Thêm địa chỉ giao hàng</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* 5. Tiện ích & Khuyến Mãi (Perks & Utilities) */}
                <View style={[styles.menuContainerCard, { backgroundColor: dynamicCardBg, borderColor: dynamicBorder }]}>
                    <TouchableOpacity
                        style={[styles.menuRowItem, { borderBottomColor: dynamicBorder }]}
                        activeOpacity={0.7}
                        onPress={() => setIsVoucherModalVisible(true)}
                    >
                        <View style={[styles.menuIconCircle, { backgroundColor: '#FFF0F6' }]}>
                            <Icon name="ticket-percent-outline" size={20} color="#EB2F96" />
                        </View>
                        <View style={styles.menuItemTextCol}>
                            <Text style={[styles.menuItemTitle, { color: dynamicText }]}>Kho Voucher & Ưu Đãi</Text>
                            <Text style={[styles.menuItemDesc, { color: dynamicSubText }]}>Giảm đến 50.000 ₫ & Freeship</Text>
                        </View>
                        <View style={[styles.pillBadge, { backgroundColor: '#FF4D4F' }]}>
                            <Text style={styles.pillBadgeText}>3 MỚI</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color={dynamicSubText} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuRowItem, { borderBottomColor: dynamicBorder }]}
                        activeOpacity={0.7}
                        onPress={() => setIsCheckinModalVisible(true)}
                    >
                        <View style={[styles.menuIconCircle, { backgroundColor: '#FFFBE6' }]}>
                            <Icon name="hand-coin-outline" size={20} color="#FAAD14" />
                        </View>
                        <View style={styles.menuItemTextCol}>
                            <Text style={[styles.menuItemTitle, { color: dynamicText }]}>Điểm Danh & Vòng Quay May Mắn</Text>
                            <Text style={[styles.menuItemDesc, { color: dynamicSubText }]}>Nhận xu mua sắm mỗi ngày</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color={dynamicSubText} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuRowItem, { borderBottomColor: dynamicBorder }]}
                        activeOpacity={0.7}
                        onPress={() => Alert.alert('Phương thức thanh toán', 'Bạn đang liên kết:\n• Thẻ Visa **** 8899\n• Ví MoMo (0987.654.321)\n• Thanh toán khi nhận hàng (COD)')}
                    >
                        <View style={[styles.menuIconCircle, { backgroundColor: '#E6F7FF' }]}>
                            <Icon name="wallet-outline" size={20} color="#1890FF" />
                        </View>
                        <View style={styles.menuItemTextCol}>
                            <Text style={[styles.menuItemTitle, { color: dynamicText }]}>Ví Điện Tử & Thẻ Thanh Toán</Text>
                            <Text style={[styles.menuItemDesc, { color: dynamicSubText }]}>Visa **** 8899, MoMo</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color={dynamicSubText} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuRowItem, { borderBottomColor: dynamicBorder }]}
                        activeOpacity={0.7}
                        onPress={() => Alert.alert('Hỗ trợ khách hàng ShopAI', 'Tổng đài CSKH: 1900 8888\nEmail: support@shopai.com\nThời gian làm việc: 24/7')}
                    >
                        <View style={[styles.menuIconCircle, { backgroundColor: '#F6FFED' }]}>
                            <Icon name="headset" size={20} color="#52C41A" />
                        </View>
                        <View style={styles.menuItemTextCol}>
                            <Text style={[styles.menuItemTitle, { color: dynamicText }]}>Trung Tâm Hỗ Trợ & CSKH</Text>
                            <Text style={[styles.menuItemDesc, { color: dynamicSubText }]}>Tổng đài 1900 8888 (24/7)</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color={dynamicSubText} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuRowItem, { borderBottomColor: dynamicBorder }]}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Settings')}
                    >
                        <View style={[styles.menuIconCircle, { backgroundColor: '#F0F5FF' }]}>
                            <Icon name="cog-outline" size={20} color="#2F54EB" />
                        </View>
                        <View style={styles.menuItemTextCol}>
                            <Text style={[styles.menuItemTitle, { color: dynamicText }]}>Cài Đặt Hệ Thống</Text>
                            <Text style={[styles.menuItemDesc, { color: dynamicSubText }]}>Chế độ tối, thông báo, bảo mật</Text>
                        </View>
                        <Icon name="chevron-right" size={20} color={dynamicSubText} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuRowItem, styles.logoutItem]}
                        activeOpacity={0.7}
                        onPress={handleLogout}
                    >
                        <View style={[styles.menuIconCircle, { backgroundColor: '#FFF1F0' }]}>
                            <Icon name="logout" size={20} color={COLORS.error} />
                        </View>
                        <View style={styles.menuItemTextCol}>
                            <Text style={[styles.menuItemTitle, { color: COLORS.error }]}>Đăng Xuất</Text>
                            <Text style={[styles.menuItemDesc, { color: dynamicSubText }]}>Thoát tài khoản khỏi thiết bị</Text>
                        </View>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* MODAL 1: QUẢN LÝ SỔ ĐỊA CHỈ */}
            <Modal
                visible={isAddressModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsAddressModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: dynamicCardBg }]}>
                        <View style={styles.modalHeaderRow}>
                            <Text style={[styles.modalMainTitle, { color: dynamicText }]}>Sổ Địa Chỉ Giao Hàng</Text>
                            <TouchableOpacity onPress={() => setIsAddressModalVisible(false)}>
                                <Icon name="close" size={24} color={dynamicSubText} />
                            </TouchableOpacity>
                        </View>

                        {isAddAddressFormVisible ? (
                            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                                <Text style={[styles.formSubTitle, { color: COLORS.primary }]}>+ Thêm địa chỉ mới</Text>

                                <Text style={[styles.inputLabel, { color: dynamicText }]}>Loại địa chỉ</Text>
                                <View style={styles.chipRow}>
                                    {['🏠 Nhà riêng', '🏢 Công ty / VP', '📍 Khác'].map((chip) => (
                                        <TouchableOpacity
                                            key={chip}
                                            style={[
                                                styles.chipBtn,
                                                newTitle === chip && { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
                                            ]}
                                            onPress={() => setNewTitle(chip)}
                                        >
                                            <Text
                                                style={[
                                                    styles.chipBtnText,
                                                    newTitle === chip && { color: '#FFFFFF', fontWeight: '700' },
                                                ]}
                                            >
                                                {chip}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <Text style={[styles.inputLabel, { color: dynamicText }]}>Tên người nhận</Text>
                                <TextInput
                                    style={[styles.modalInput, { color: dynamicText, borderColor: dynamicBorder, backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9' }]}
                                    value={newReceiver}
                                    onChangeText={setNewReceiver}
                                    placeholder="Ví dụ: Nguyễn Văn A"
                                    placeholderTextColor={dynamicSubText}
                                />

                                <Text style={[styles.inputLabel, { color: dynamicText }]}>Số điện thoại</Text>
                                <TextInput
                                    style={[styles.modalInput, { color: dynamicText, borderColor: dynamicBorder, backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9' }]}
                                    value={newPhone}
                                    onChangeText={setNewPhone}
                                    placeholder="Ví dụ: 0987 654 321"
                                    placeholderTextColor={dynamicSubText}
                                    keyboardType="phone-pad"
                                />

                                <Text style={[styles.inputLabel, { color: dynamicText }]}>Địa chỉ cụ thể (Số nhà, đường, quận/huyện, TP)</Text>
                                <TextInput
                                    style={[styles.modalInput, { height: 70, color: dynamicText, borderColor: dynamicBorder, backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9' }]}
                                    value={newDetail}
                                    onChangeText={setNewDetail}
                                    placeholder="Nhập địa chỉ nhận hàng chi tiết..."
                                    placeholderTextColor={dynamicSubText}
                                    multiline
                                />

                                <View style={styles.switchRow}>
                                    <Text style={[styles.switchLabel, { color: dynamicText }]}>Đặt làm địa chỉ mặc định</Text>
                                    <Switch
                                        value={newIsDefault}
                                        onValueChange={setNewIsDefault}
                                        trackColor={{ false: '#D9D9D9', true: COLORS.primary }}
                                    />
                                </View>

                                <View style={styles.modalActionButtons}>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { borderColor: dynamicBorder, borderWidth: 1 }]}
                                        onPress={() => setIsAddAddressFormVisible(false)}
                                    >
                                        <Text style={{ color: dynamicText, fontWeight: '600' }}>Quay lại</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                                        onPress={handleSaveNewAddress}
                                    >
                                        <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Lưu địa chỉ</Text>
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        ) : (
                            <View>
                                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                                    {addresses.map((item) => (
                                        <View
                                            key={item.id}
                                            style={[
                                                styles.addressCardItem,
                                                { borderColor: item.isDefault ? COLORS.primary : dynamicBorder, backgroundColor: isDarkMode ? '#252525' : '#FAFAFA' },
                                            ]}
                                        >
                                            <View style={styles.addressItemHeader}>
                                                <Text style={[styles.addressItemTitle, { color: dynamicText }]}>{item.title}</Text>
                                                {item.isDefault ? (
                                                    <View style={styles.defaultBadge}>
                                                        <Text style={styles.defaultBadgeText}>Mặc định</Text>
                                                    </View>
                                                ) : (
                                                    <TouchableOpacity
                                                        onPress={() => setDefaultAddress(item.id)}
                                                    >
                                                        <Text style={styles.setDefaultLink}>Đặt mặc định</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                            <Text style={[styles.addressItemUser, { color: dynamicText }]}>
                                                {item.receiver} ({item.phone})
                                            </Text>
                                            <Text style={[styles.addressItemDetail, { color: dynamicSubText }]}>
                                                {item.detail}
                                            </Text>
                                            {!item.isDefault && (
                                                <TouchableOpacity
                                                    style={styles.deleteAddrBtn}
                                                    onPress={() => deleteAddress(item.id)}
                                                >
                                                    <Icon name="trash-can-outline" size={16} color={COLORS.error} />
                                                    <Text style={{ color: COLORS.error, fontSize: 12, marginLeft: 4 }}>Xóa</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    ))}
                                </ScrollView>

                                <TouchableOpacity
                                    style={[styles.addAddrFullBtn, { backgroundColor: COLORS.primary }]}
                                    onPress={() => setIsAddAddressFormVisible(true)}
                                >
                                    <Icon name="plus" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={styles.addAddrFullBtnText}>+ Thêm địa chỉ mới</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {/* MODAL 2: KHO VOUCHER & MÃ GIẢM GIÁ */}
            <Modal
                visible={isVoucherModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsVoucherModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: dynamicCardBg }]}>
                        <View style={styles.modalHeaderRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="ticket-percent" size={24} color="#EB2F96" style={{ marginRight: 8 }} />
                                <Text style={[styles.modalMainTitle, { color: dynamicText }]}>Kho Voucher ShopAI</Text>
                            </View>
                            <TouchableOpacity onPress={() => setIsVoucherModalVisible(false)}>
                                <Icon name="close" size={24} color={dynamicSubText} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                            {vouchers.map((v) => (
                                <View
                                    key={v.id}
                                    style={[styles.voucherItemCard, { backgroundColor: isDarkMode ? '#262626' : '#FFF9FA', borderColor: '#FFADD2' }]}
                                >
                                    <View style={styles.voucherLeftCol}>
                                        <Text style={styles.voucherTitleText}>{v.title}</Text>
                                        <Text style={[styles.voucherDescText, { color: dynamicSubText }]}>{v.desc}</Text>
                                        <Text style={[styles.voucherExpText, { color: '#FA8C16' }]}>{v.exp}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.applyVoucherBtn}
                                        onPress={() => {
                                            setIsVoucherModalVisible(false);
                                            Alert.alert('Đã lưu mã!', `Mã ưu đãi "${v.code}" sẽ được tự động áp dụng tại bước Thanh toán giỏ hàng.`);
                                        }}
                                    >
                                        <Text style={styles.applyVoucherBtnText}>Dùng ngay</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* MODAL 3: ĐIỂM DANH NHẬN XU HÀNG NGÀY */}
            <Modal
                visible={isCheckinModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setIsCheckinModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: dynamicCardBg, alignItems: 'center' }]}>
                        <Text style={styles.checkinIconEmoji}>🎁</Text>
                        <Text style={[styles.modalMainTitle, { color: dynamicText, textAlign: 'center', marginBottom: 6 }]}>
                            Điểm Danh Hàng Ngày
                        </Text>
                        <Text style={[styles.checkinDesc, { color: dynamicSubText }]}>
                            Tích lũy ShopAI Xu để được giảm giá trực tiếp khi thanh toán đơn hàng.
                        </Text>

                        <View style={[styles.rewardBox, { backgroundColor: isDarkMode ? '#2D2710' : '#FFFBE6' }]}>
                            <Icon name="hand-coin" size={32} color="#FAAD14" />
                            <View style={{ marginLeft: 12 }}>
                                <Text style={[styles.rewardAmount, { color: '#D48806' }]}>+50 Xu ShopAI</Text>
                                <Text style={{ fontSize: 12, color: '#D48806' }}>Tương đương giảm 50.000 ₫</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[
                                styles.claimCheckinBtn,
                                hasCheckedInToday && { backgroundColor: '#8C8C8C' },
                            ]}
                            disabled={hasCheckedInToday}
                            onPress={handleCheckIn}
                        >
                            <Text style={styles.claimCheckinBtnText}>
                                {hasCheckedInToday ? '✓ Đã nhận hôm nay' : 'Nhận ngay +50 Xu'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{ marginTop: 14 }}
                            onPress={() => setIsCheckinModalVisible(false)}
                        >
                            <Text style={{ color: dynamicSubText, fontSize: 13 }}>Đóng lại</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* MODAL 4: CHỈNH SỬA THÔNG TIN CÁ NHÂN */}
            <Modal
                visible={isEditProfileVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsEditProfileVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalBox, { backgroundColor: dynamicCardBg }]}>
                        <Text style={[styles.modalMainTitle, { color: dynamicText, marginBottom: 12 }]}>
                            Cập Nhật Hồ Sơ
                        </Text>

                        <Text style={[styles.inputLabel, { color: dynamicText }]}>Họ và tên</Text>
                        <TextInput
                            style={[styles.modalInput, { color: dynamicText, borderColor: dynamicBorder, backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9' }]}
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Nhập họ và tên..."
                            placeholderTextColor={dynamicSubText}
                        />

                        <Text style={[styles.inputLabel, { color: dynamicText }]}>Số điện thoại</Text>
                        <TextInput
                            style={[styles.modalInput, { color: dynamicText, borderColor: dynamicBorder, backgroundColor: isDarkMode ? '#2A2A2A' : '#F9F9F9' }]}
                            value={editPhone}
                            onChangeText={setEditPhone}
                            placeholder="Nhập số điện thoại..."
                            placeholderTextColor={dynamicSubText}
                            keyboardType="phone-pad"
                        />

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity
                                style={[styles.actionBtn, { borderColor: dynamicBorder, borderWidth: 1 }]}
                                onPress={() => setIsEditProfileVisible(false)}
                            >
                                <Text style={{ color: dynamicText, fontWeight: '600' }}>Hủy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                                onPress={handleSaveProfile}
                            >
                                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Lưu thay đổi</Text>
                            </TouchableOpacity>
                        </View>
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
    scrollContent: {
        padding: SIZES.padding,
    },
    profileHeaderCard: {
        borderRadius: SIZES.radius,
        borderWidth: 1,
        padding: 16,
        marginBottom: 14,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarWrapper: {
        width: 68,
        height: 68,
        borderRadius: 34,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    userInfoCol: {
        flex: 1,
    },
    userNameText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    vipTag: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginLeft: 8,
    },
    vipTagText: {
        fontSize: 10,
        fontWeight: '900',
        color: '#1E1E1E',
    },
    userEmailText: {
        fontSize: 13,
        marginTop: 2,
    },
    userPhoneText: {
        fontSize: 12,
        marginTop: 2,
    },
    editProfileIconBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    memberVipCard: {
        backgroundColor: '#1F1F1F',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: '#383838',
    },
    memberCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    memberCardTitle: {
        color: '#FFD700',
        fontWeight: '700',
        fontSize: 13,
    },
    checkInButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFD700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 14,
    },
    checkInButtonText: {
        color: '#1E1E1E',
        fontSize: 11,
        fontWeight: '800',
    },
    pointsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    pointsSubLabel: {
        color: '#A0A0A0',
        fontSize: 11,
        marginBottom: 2,
    },
    pointsValue: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
    },
    pointsEquiv: {
        color: '#52C41A',
        fontSize: 16,
        fontWeight: '700',
    },
    progressContainer: {
        marginTop: 2,
    },
    progressBarTrack: {
        height: 6,
        backgroundColor: '#383838',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#FFD700',
        borderRadius: 3,
    },
    progressLabelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    progressText: {
        color: '#8C8C8C',
        fontSize: 10,
    },
    quickStatsBar: {
        flexDirection: 'row',
        borderRadius: SIZES.radius,
        borderWidth: 1,
        paddingVertical: 12,
        marginBottom: 14,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statValue: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 2,
    },
    statLabel: {
        fontSize: 11,
    },
    statDivider: {
        width: 1,
        height: 24,
    },
    sectionCard: {
        borderRadius: SIZES.radius,
        borderWidth: 1,
        padding: 14,
        marginBottom: 14,
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    sectionHeading: {
        fontSize: 15,
        fontWeight: '700',
    },
    viewAllText: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderStatusGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    orderStatusCol: {
        alignItems: 'center',
        flex: 1,
    },
    orderIconWrapper: {
        position: 'relative',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.03)',
        marginBottom: 6,
    },
    orderBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: COLORS.primary,
        borderRadius: 9,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    orderBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '800',
    },
    orderStatusLabel: {
        fontSize: 11,
        textAlign: 'center',
    },
    defaultAddressBox: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 12,
    },
    addressHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    addressTitleText: {
        fontWeight: '700',
        fontSize: 13,
        marginRight: 8,
    },
    defaultTag: {
        backgroundColor: 'rgba(82, 196, 26, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    defaultTagText: {
        color: COLORS.success,
        fontSize: 10,
        fontWeight: '700',
    },
    addressReceiverText: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 2,
    },
    addressDetailText: {
        fontSize: 12,
        lineHeight: 18,
    },
    addAddressButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderRadius: 8,
    },
    menuContainerCard: {
        borderRadius: SIZES.radius,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 14,
    },
    menuRowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
    },
    logoutItem: {
        borderBottomWidth: 0,
    },
    menuIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    menuItemTextCol: {
        flex: 1,
    },
    menuItemTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    menuItemDesc: {
        fontSize: 11,
    },
    pillBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 6,
    },
    pillBadgeText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 18,
    },
    modalBox: {
        borderRadius: 16,
        padding: 18,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    modalHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    modalMainTitle: {
        fontSize: 17,
        fontWeight: '700',
    },
    formSubTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 10,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        marginTop: 10,
    },
    chipRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 6,
    },
    chipBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#D9D9D9',
    },
    chipBtnText: {
        fontSize: 12,
        color: '#555555',
    },
    modalInput: {
        height: 42,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 13,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 14,
        marginBottom: 6,
    },
    switchLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    modalActionButtons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 18,
    },
    actionBtn: {
        flex: 1,
        height: 42,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addressCardItem: {
        borderRadius: 10,
        borderWidth: 1,
        padding: 12,
        marginBottom: 10,
    },
    addressItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    addressItemTitle: {
        fontWeight: '700',
        fontSize: 13,
    },
    defaultBadge: {
        backgroundColor: 'rgba(82, 196, 26, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    defaultBadgeText: {
        color: COLORS.success,
        fontSize: 10,
        fontWeight: '700',
    },
    setDefaultLink: {
        color: COLORS.secondary,
        fontSize: 11,
        fontWeight: '600',
    },
    addressItemUser: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 2,
    },
    addressItemDetail: {
        fontSize: 12,
        lineHeight: 16,
    },
    deleteAddrBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        marginTop: 6,
    },
    addAddrFullBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        height: 44,
        borderRadius: 8,
        marginTop: 10,
    },
    addAddrFullBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },
    voucherItemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        padding: 12,
        marginBottom: 10,
    },
    voucherLeftCol: {
        flex: 1,
    },
    voucherTitleText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#EB2F96',
        marginBottom: 2,
    },
    voucherDescText: {
        fontSize: 12,
        marginBottom: 2,
    },
    voucherExpText: {
        fontSize: 11,
        fontWeight: '600',
    },
    applyVoucherBtn: {
        backgroundColor: '#EB2F96',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        marginLeft: 10,
    },
    applyVoucherBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },
    checkinIconEmoji: {
        fontSize: 50,
        marginBottom: 10,
    },
    checkinDesc: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 16,
    },
    rewardBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 10,
        width: '100%',
        marginBottom: 20,
    },
    rewardAmount: {
        fontSize: 16,
        fontWeight: '800',
    },
    claimCheckinBtn: {
        backgroundColor: '#FAAD14',
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
    },
    claimCheckinBtnText: {
        color: '#1E1E1E',
        fontSize: 15,
        fontWeight: '800',
    },
});

export default ProfileScreen;