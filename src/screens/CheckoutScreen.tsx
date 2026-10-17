import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    TextInput,
    Modal,
    ActivityIndicator,
    Dimensions,
    Animated,
    Alert,
    Platform,
    PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import jsQR from 'jsqr';
import { scanNitroImage } from '@utils/qrScannerEngine';

import { useCartStore, CartItem } from '@store/useCartStore';
import { useOrderStore, ShippingAddress, BankPaymentInfo } from '@store/useOrderStore';
import { useQueryClient } from '@tanstack/react-query';
import axiosClient from '@api/axiosClient';
import { getCrashlytics as crashlytics } from '@react-native-firebase/crashlytics';
import { APP_ENV, API_BASE_URL } from '@constants/env';
import LiquidBackground from '@components/ui/LiquidBackground';
import LiquidGlassView from '@components/ui/LiquidGlassView';
import ShopButton from '@components/ShopButton';
import { COLORS, SIZES, IOS26_COLORS, COSMIC_THEME } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { getVietQrPaymentUrl, SHOP_BANK_PRESETS } from '@utils/qrHelper';

const { width } = Dimensions.get('window');
const SCAN_BOX_SIZE = width * 0.72;

// Tải an toàn module Camera Native
let VisionCameraModule: any = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    VisionCameraModule = require('react-native-vision-camera');
} catch {
    VisionCameraModule = null;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

// Danh sách địa chỉ giao hàng mẫu
const SAMPLE_ADDRESSES: ShippingAddress[] = [
    {
        id: 'addr_1',
        recipientName: 'Nguyễn Văn An',
        phone: '(+84) 987 654 321',
        address: 'Tầng 12, Tòa nhà Bitexco Financial Tower, Số 2 Hải Triều, P. Bến Nghé, Quận 1, TP. Hồ Chí Minh',
        tag: 'Văn phòng',
        isDefault: true,
    },
    {
        id: 'addr_2',
        recipientName: 'Nguyễn Văn An',
        phone: '(+84) 912 345 678',
        address: 'Số 45/12 Đường Nguyễn Trãi, Phường 2, Quận 5, TP. Hồ Chí Minh',
        tag: 'Nhà riêng',
        isDefault: false,
    },
    {
        id: 'addr_3',
        recipientName: 'Trần Thị Mai (Mẹ)',
        phone: '(+84) 903 888 999',
        address: 'Số 88 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
        tag: 'Khác',
        isDefault: false,
    },
];

// Danh sách Voucher có sẵn
interface VoucherItem {
    code: string;
    title: string;
    discountType: 'fixed' | 'percent' | 'freeship';
    discountValue: number;
    minOrder: number;
    description: string;
}

const AVAILABLE_VOUCHERS: VoucherItem[] = [
    {
        code: 'FREESHIP',
        title: 'Miễn phí vận chuyển',
        discountType: 'freeship',
        discountValue: 25000,
        minOrder: 0,
        description: 'Giảm tối đa 25.000₫ phí giao hàng toàn quốc',
    },
    {
        code: 'SHOPAI50K',
        title: 'Giảm 50.000₫',
        discountType: 'fixed',
        discountValue: 50000,
        minOrder: 500000,
        description: 'Áp dụng cho đơn hàng từ 500.000₫',
    },
    {
        code: 'TECH100K',
        title: 'Giảm 100.000₫',
        discountType: 'fixed',
        discountValue: 100000,
        minOrder: 2000000,
        description: 'Ưu đãi đơn công nghệ từ 2.000.000₫',
    },
    {
        code: 'VIETQR20K',
        title: 'Giảm 20.000₫ VietQR',
        discountType: 'fixed',
        discountValue: 20000,
        minOrder: 100000,
        description: 'Giảm thêm khi quét mã QR Ngân hàng / VietQR',
    },
];

// Tùy chọn giao hàng
interface ShippingOption {
    id: string;
    name: string;
    provider: string;
    fee: number;
    estimatedDate: string;
    badge?: string;
}

const SHIPPING_OPTIONS: ShippingOption[] = [
    {
        id: 'express',
        name: 'Hỏa tốc 2H',
        provider: 'GrabExpress / ShopeeFood',
        fee: 45000,
        estimatedDate: 'Hôm nay (Trong vòng 2 giờ)',
        badge: 'Siêu tốc',
    },
    {
        id: 'standard',
        name: 'Giao hàng Nhanh',
        provider: 'Giao Hàng Nhanh / Viettel Post',
        fee: 25000,
        estimatedDate: '26 Th09 - 28 Th09',
        badge: 'Phổ biến',
    },
    {
        id: 'economy',
        name: 'Giao Tiết kiệm',
        provider: 'VNPost / J&T Express',
        fee: 15000,
        estimatedDate: '29 Th09 - 02 Th10',
    },
];

// Dữ liệu tài khoản VietQR mặc định / mẫu
const DEFAULT_BANK_INFO: BankPaymentInfo = {
    bankName: 'Ngân hàng Ngoại Thương Việt Nam (Vietcombank)',
    bankShortName: 'Vietcombank',
    accountNumber: '1039095165',
    accountName: 'HO THI HUE MAN',
    transferContent: 'SHOPAI ' + Math.floor(100000 + Math.random() * 900000),
    amount: 0,
    verified: true,
};

// Component Camera Quét mã QR phụ trách chụp từng khung hình và phân tích qua bộ engine chuẩn ngân hàng
const QrCameraStream = ({
    onScanSuccess,
    torchOn,
}: {
    onScanSuccess: (data: string) => void;
    torchOn: boolean;
}) => {
    const { useCameraDevice, Camera, usePhotoOutput } = VisionCameraModule;
    const backDevice = useCameraDevice('back');
    const frontDevice = useCameraDevice('front');
    const device = backDevice || frontDevice;
    const cameraRef = useRef<any>(null);
    const isScanningRef = useRef(false);
    const isProcessingRef = useRef(false);

    const photoConfig = React.useMemo(() => ({
        targetResolution: { width: 1280, height: 960 },
        quality: 0.85,
        qualityPrioritization: (device?.supportsSpeedQualityPrioritization ? 'speed' : 'balanced') as any,
    }), [device]);

    const photoOutput = usePhotoOutput
        ? usePhotoOutput(photoConfig)
        : null;

    const scanCurrentFrame = useCallback(async (): Promise<boolean> => {
        if (isScanningRef.current || isProcessingRef.current) return false;

        try {
            isProcessingRef.current = true;
            let image: any = null;

            // 1. Snapshot siêu tốc từ TextureView (1-3ms, không khóa sensor)
            if (cameraRef.current?.takeSnapshot) {
                try {
                    image = await cameraRef.current.takeSnapshot();
                } catch {
                    image = null;
                }
            }

            // 2. Dự phòng: Capture photo với timeout 1000ms
            if (!image && photoOutput?.capturePhoto) {
                try {
                    const photo = await Promise.race([
                        photoOutput.capturePhoto(
                            { flashMode: 'off', enableShutterSound: false },
                            {}
                        ),
                        new Promise<null>((_, reject) =>
                            setTimeout(() => reject(new Error('capture timeout')), 1000)
                        ),
                    ]);
                    if (photo) {
                        image = await photo.toImageAsync();
                        photo.dispose?.();
                    }
                } catch {
                    image = null;
                }
            }

            if (!image) {
                return false;
            }

            // Quét đa tầng: Cắt 1:1 tâm khung ngắm -> Toàn ảnh -> Xoay -> Chống lóa
            const qrResult = await scanNitroImage(image, { cropFactor: 0.72 });
            image.dispose?.();

            if (qrResult && qrResult.trim().length > 0) {
                console.log('🎉 [Checkout VietQR Bank-Grade Scanned]:', qrResult);
                isScanningRef.current = true;
                onScanSuccess(qrResult.trim());
                return true;
            }
        } catch (e: any) {
            console.warn('Checkout QR scan warning:', e?.message || e);
        } finally {
            isProcessingRef.current = false;
        }

        return false;
    }, [photoOutput, onScanSuccess]);

    // Chu kỳ quét nhanh liên tục 100ms chuẩn ứng dụng ngân hàng
    useEffect(() => {
        let isMounted = true;
        let timer: any = null;

        const loop = async () => {
            if (!isMounted || isScanningRef.current) return;
            try {
                const found = await scanCurrentFrame();
                if (found) return;
            } catch {
                // Tiếp tục
            }
            if (isMounted && !isScanningRef.current) {
                timer = setTimeout(loop, 100);
            }
        };

        timer = setTimeout(loop, 200);

        return () => {
            isMounted = false;
            if (timer) clearTimeout(timer);
        };
    }, [scanCurrentFrame]);

    if (!device) return null;

    return (
        <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            torch={torchOn ? 'on' : 'off'}
            enableNativeTapToFocusGesture={true}
            enableNativeZoomGesture={true}
            implementationMode="compatible"
            outputs={photoOutput ? [photoOutput] : []}
        />
    );
};

const CheckoutScreen = () => {
    const navigation = useNavigation<any>();
    const items = useCartStore((state) => state.items);
    const subtotal = useCartStore((state) => state.totalPrice());
    const totalQuantity = useCartStore((state) => state.totalQuantity());
    const clearCart = useCartStore((state) => state.clearCart);
    const addOrder = useOrderStore((state) => state.addOrder);
    const { isDarkMode } = useTheme();
    const queryClient = useQueryClient();

    // States cho Địa chỉ
    const [selectedAddress, setSelectedAddress] = useState<ShippingAddress>(SAMPLE_ADDRESSES[0]);
    const [addressModalVisible, setAddressModalVisible] = useState(false);

    // States cho Vận chuyển
    const [selectedShipping, setSelectedShipping] = useState<ShippingOption>(SHIPPING_OPTIONS[1]);

    // States cho Voucher & Khuyến mãi
    const [appliedVoucher, setAppliedVoucher] = useState<VoucherItem | null>(AVAILABLE_VOUCHERS[0]);
    const [customPromoInput, setCustomPromoInput] = useState('');
    const [voucherModalVisible, setVoucherModalVisible] = useState(false);

    // States cho Phương thức thanh toán
    // 'COD' | 'VIETQR' | 'SPAYLATER' | 'CARD'
    const [paymentMethod, setPaymentMethod] = useState<'COD' | 'VIETQR' | 'SPAYLATER' | 'CARD'>('VIETQR');
    const [payLaterTerm, setPayLaterTerm] = useState<'1' | '3' | '6'>('3');

    // States cho Quét mã QR Ngân hàng
    const [bankInfo, setBankInfo] = useState<BankPaymentInfo>({
        ...DEFAULT_BANK_INFO,
        amount: subtotal + selectedShipping.fee - (appliedVoucher?.discountValue || 0),
    });
    const [qrScannerModalVisible, setQrScannerModalVisible] = useState(false);
    const [qrPreviewModalVisible, setQrPreviewModalVisible] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Ghi chú đơn hàng
    const [orderNote, setOrderNote] = useState('');

    // Xử lý Đặt hàng
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderSuccessData, setOrderSuccessData] = useState<any | null>(null);
    const [successModalVisible, setSuccessModalVisible] = useState(false);

    // Hiệu ứng tia Laser cho Camera Modal
    const laserAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (qrScannerModalVisible) {
            const loopAnim = Animated.loop(
                Animated.sequence([
                    Animated.timing(laserAnim, {
                        toValue: SCAN_BOX_SIZE - 6,
                        duration: 1800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(laserAnim, {
                        toValue: 0,
                        duration: 1800,
                        useNativeDriver: true,
                    }),
                ])
            );
            loopAnim.start();
            return () => loopAnim.stop();
        }
    }, [qrScannerModalVisible, laserAnim]);

    // Tính toán chiết khấu & Tổng tiền
    const shippingFee = selectedShipping.fee;
    let shippingDiscount = 0;
    let voucherDiscount = 0;

    if (appliedVoucher) {
        if (appliedVoucher.discountType === 'freeship') {
            shippingDiscount = Math.min(shippingFee, appliedVoucher.discountValue);
        } else {
            voucherDiscount = appliedVoucher.discountValue;
        }
    }

    const finalTotal = Math.max(0, subtotal + shippingFee - shippingDiscount - voucherDiscount);

    // Đồng bộ số tiền trong thông tin chuyển khoản ngân hàng
    useEffect(() => {
        setBankInfo((prev) => ({
            ...prev,
            amount: finalTotal,
        }));
    }, [finalTotal]);

    // Xin quyền Camera
    const requestCameraPermission = async () => {
        if (Platform.OS !== 'android') {
            setHasCameraPermission(true);
            return true;
        }
        try {
            const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA, {
                title: 'ShopAI cần quyền Camera',
                message: 'Ứng dụng cần Camera để quét mã VietQR và mã thanh toán ngân hàng.',
                buttonPositive: 'Cho phép',
                buttonNegative: 'Hủy',
            });
            const ok = granted === PermissionsAndroid.RESULTS.GRANTED;
            setHasCameraPermission(ok);
            return ok;
        } catch {
            return false;
        }
    };

    const handleOpenScanner = async () => {
        hapticLight();
        const ok = await requestCameraPermission();
        if (ok || Platform.OS === 'ios') {
            setQrScannerModalVisible(true);
        } else {
            Alert.alert('Chưa cấp quyền', 'Vui lòng cấp quyền Camera để quét mã QR ngân hàng.');
        }
    };

    // Xử lý khi quét được mã QR ngân hàng
    const handleBankQrScanned = (qrData: string) => {
        hapticSuccess();
        setQrScannerModalVisible(false);

        // Phân tích mã QR VietQR hoặc ngân hàng
        let detectedBank = 'Vietcombank';
        let detectedAcc = '1039095165';
        let detectedName = 'HO THI HUE MAN';

        if (qrData.includes('970436') || qrData.toLowerCase().includes('vietcombank') || qrData.toLowerCase().includes('vcb')) {
            detectedBank = 'Ngân hàng Ngoại Thương Việt Nam (Vietcombank)';
        } else if (qrData.includes('970422') || qrData.toLowerCase().includes('mbbank') || qrData.toLowerCase().includes('mb')) {
            detectedBank = 'Ngân hàng Quân Đội (MBBank)';
            detectedAcc = '098765432199';
            detectedName = 'NGUYEN VAN AN';
        } else if (qrData.includes('970407') || qrData.toLowerCase().includes('techcombank')) {
            detectedBank = 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)';
            detectedAcc = '19036589412015';
            detectedName = 'SHOPAI OFFICIAL STORE';
        }

        const newBankInfo: BankPaymentInfo = {
            bankName: detectedBank,
            bankShortName: detectedBank.split('(')[1]?.replace(')', '') || 'Vietcombank',
            accountNumber: detectedAcc,
            accountName: detectedName,
            transferContent: 'SHOPAI ' + Math.floor(100000 + Math.random() * 900000),
            amount: finalTotal,
            qrData,
            verified: true,
        };

        setBankInfo(newBankInfo);

        Alert.alert(
            '✅ Quét mã VietQR thành công!',
            `Ngân hàng: ${newBankInfo.bankName}\nChủ tài khoản: ${newBankInfo.accountName}\nSố tài khoản: ${newBankInfo.accountNumber}\nSố tiền: ${formatCurrency(finalTotal)}`
        );
    };

    // Chọn mã VietQR mẫu
    const handleSelectPresetBank = (bankKey: 'VCB' | 'MB' | 'TCB') => {
        hapticLight();
        if (bankKey === 'VCB') {
            setBankInfo({
                bankName: 'Ngân hàng Ngoại Thương Việt Nam (Vietcombank)',
                bankShortName: 'Vietcombank',
                accountNumber: '1039095165',
                accountName: 'HO THI HUE MAN',
                transferContent: 'SHOPAI ' + Math.floor(100000 + Math.random() * 900000),
                amount: finalTotal,
                verified: true,
            });
        } else if (bankKey === 'MB') {
            setBankInfo({
                bankName: 'Ngân hàng TMCP Quân Đội (MBBank)',
                bankShortName: 'MBBank',
                accountNumber: '038899988899',
                accountName: 'SHOPAI VIETNAM CO LTD',
                transferContent: 'SHOPAI ' + Math.floor(100000 + Math.random() * 900000),
                amount: finalTotal,
                verified: true,
            });
        } else {
            setBankInfo({
                bankName: 'Ngân hàng Kỹ Thương Việt Nam (Techcombank)',
                bankShortName: 'Techcombank',
                accountNumber: '19036589412015',
                accountName: 'SHOPAI E-COMMERCE',
                transferContent: 'SHOPAI ' + Math.floor(100000 + Math.random() * 900000),
                amount: finalTotal,
                verified: true,
            });
        }
        setQrScannerModalVisible(false);
    };

    // Sao chép thông tin
    const handleCopy = (text: string, label: string) => {
        hapticLight();
        setCopiedField(label);
        setTimeout(() => setCopiedField(null), 2000);
        Alert.alert('Đã sao chép', `Đã sao chép ${label}: ${text}`);
    };

    // Áp dụng mã Voucher tự nhập
    const handleApplyCustomPromo = () => {
        if (!customPromoInput.trim()) return;
        const code = customPromoInput.trim().toUpperCase();
        const found = AVAILABLE_VOUCHERS.find((v) => v.code === code);
        if (found) {
            if (subtotal < found.minOrder) {
                Alert.alert('Không đủ điều kiện', `Mã ${code} yêu cầu đơn hàng tối thiểu từ ${formatCurrency(found.minOrder)}`);
                return;
            }
            setAppliedVoucher(found);
            setCustomPromoInput('');
            setVoucherModalVisible(false);
            hapticSuccess();
            Alert.alert('Thành công', `Đã áp dụng mã giảm giá ${found.title}!`);
        } else {
            Alert.alert('Mã không hợp lệ', 'Mã khuyến mãi không tồn tại hoặc đã hết hạn.');
        }
    };

    // Xử lý xác nhận Đặt hàng
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handlePlaceOrder = async () => {
        if (items.length === 0) {
            Alert.alert('Giỏ hàng trống', 'Vui lòng chọn sản phẩm trước khi thanh toán.');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage(null);
        hapticLight();

        // ➕ Breadcrumb: rắc vụn bánh mì TRƯỚC khi làm việc nguy hiểm
        crashlytics().log(`Checkout: bắt đầu đặt hàng, ${items.length} loại sản phẩm`);

        // ➕ Custom Keys: gắn bối cảnh vào MỌI báo cáo phát sinh từ đây trở đi
        crashlytics().setAttributes({
            screen: 'CheckoutScreen',
            cart_item_count: String(items.length),
            cart_total: String(finalTotal),
            app_env: APP_ENV,
            api_base_url: API_BASE_URL, // Cực giá trị: phát hiện ngay App bản Store trỏ nhầm IP LAN
        });

        try {
            // Tính đúng tổng tiền của các sản phẩm theo giá gốc trong giỏ
            const orderItemsTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

            // Gửi đơn hàng thật lên NestJS Server (axiosClient tự động gắn Bearer Token)
            const response = await axiosClient.post('/api/orders', {
                items: items.map((item) => ({ productId: item.id, quantity: item.quantity })),
                total: orderItemsTotal,
            });

            const backendOrder = response.data;
            const orderId = backendOrder.id || `ORD-${Date.now().toString().slice(-6)}`;

            crashlytics().log(`Checkout: đặt hàng THÀNH CÔNG, orderId = ${orderId}`);

            const newOrder = {
                id: orderId,
                items: [...items],
                subtotal,
                shippingFee,
                discount: shippingDiscount + voucherDiscount,
                voucherCode: appliedVoucher?.code,
                total: finalTotal,
                paymentMethod,
                payLaterTerm: paymentMethod === 'SPAYLATER' ? `${payLaterTerm} tháng` : undefined,
                shippingAddress: selectedAddress,
                deliveryDate: selectedShipping.estimatedDate,
                shippingOption: selectedShipping.name,
                bankInfo: paymentMethod === 'VIETQR' ? bankInfo : undefined,
                note: orderNote.trim() || undefined,
                status: (paymentMethod === 'COD' ? 'PENDING' : 'PAID') as 'PENDING' | 'PAID',
                createdAt: backendOrder.createdAt || new Date().toISOString(),
            };

            addOrder(newOrder);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            clearCart(); // CHỈ xóa giỏ hàng khi Server xác nhận thành công
            hapticSuccess();
            setOrderSuccessData(newOrder);
            setSuccessModalVisible(true);
        } catch (error: any) {
            const err = error instanceof Error ? error : new Error(error?.message || 'Checkout error');

            // ➕ Ghi nhận Non-Fatal: App không sập, người dùng vẫn thấy thông báo lịch sự,
            //    nhưng đội kỹ thuật biết ngay có bao nhiêu đơn hàng đang thất bại ngoài đời thực.
            crashlytics().log(`Checkout: đặt hàng THẤT BẠI - ${err.message}`);
            crashlytics().recordError(err, 'CheckoutOrderFailed'); // Tham số 2: đặt tên nhóm lỗi cho dễ lọc

            const serverMessage = error?.response?.data?.message;
            const message = Array.isArray(serverMessage)
                ? serverMessage.join(', ')
                : serverMessage ?? (err.message || 'Đặt hàng thất bại, vui lòng thử lại');
            setErrorMessage(message);
            Alert.alert('Đặt hàng thất bại', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirm = handlePlaceOrder;

    const dynamicText = isDarkMode ? '#F8FAFC' : '#0F172A';
    const dynamicSubText = isDarkMode ? '#94A3B8' : '#64748B';
    const dynamicBorder = isDarkMode ? 'rgba(0, 245, 212, 0.25)' : 'rgba(0, 0, 0, 0.08)';

    // Dynamic QR image url từ VietQR QuickLink API
    const vietQrUrl = getVietQrPaymentUrl({
        bankCode: bankInfo.bankShortName || 'vietcombank',
        accountNumber: bankInfo.accountNumber,
        amount: finalTotal,
        content: bankInfo.transferContent,
        accountName: bankInfo.accountName,
        template: 'compact2',
    });

    return (
        <LiquidBackground>
            <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
                {/* Header thanh toán */}
                <View style={styles.headerWrapper}>
                    <LiquidGlassView
                        intensity="prominent"
                        borderRadius={SIZES.radiusLg}
                        sheen={true}
                        bordered={true}
                        style={styles.headerBar}
                    >
                        <TouchableOpacity
                            style={styles.headerBackBtn}
                            onPress={() => navigation.goBack()}
                        >
                            <Icon name="arrow-left" size={22} color={dynamicText} />
                        </TouchableOpacity>
                        <View style={{ alignItems: 'center' }}>
                            <Text style={[styles.headerTitle, { color: dynamicText }]}>
                                Thanh toán đơn hàng
                            </Text>
                            <Text style={[styles.headerSubtitle, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                Giỏ hàng ➔ Xác nhận ➔ Hoàn tất
                            </Text>
                        </View>
                        <View style={{ width: 36 }} />
                    </LiquidGlassView>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* SECTION 1: ĐỊA CHỈ NHẬN HÀNG */}
                    <LiquidGlassView
                        intensity="medium"
                        borderRadius={SIZES.radiusLg}
                        bordered={true}
                        sheen={true}
                        style={styles.cardSection}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.iconBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                                    <Icon name="map-marker" size={18} color="#EF4444" />
                                </View>
                                <Text style={[styles.sectionTitle, { color: dynamicText }]}>
                                    Địa chỉ nhận hàng
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    hapticLight();
                                    setAddressModalVisible(true);
                                }}
                                style={styles.actionLinkBtn}
                            >
                                <Text style={[styles.actionLinkText, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                    Thay đổi
                                </Text>
                                <Icon name="chevron-right" size={16} color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.addressInfoBox}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <Text style={[styles.recipientName, { color: dynamicText }]}>
                                    {selectedAddress.recipientName}
                                </Text>
                                <Text style={[styles.recipientPhone, { color: dynamicSubText }]}>
                                    {selectedAddress.phone}
                                </Text>
                                <View style={[styles.addressTagBadge, { backgroundColor: isDarkMode ? 'rgba(0, 245, 212, 0.15)' : '#E0F2FE' }]}>
                                    <Text style={[styles.addressTagText, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                        {selectedAddress.tag}
                                    </Text>
                                </View>
                            </View>
                            <Text style={[styles.addressDetail, { color: dynamicSubText }]}>
                                {selectedAddress.address}
                            </Text>
                        </View>
                    </LiquidGlassView>

                    {/* SECTION 2: DANH SÁCH SẢN PHẨM MUA */}
                    <LiquidGlassView
                        intensity="medium"
                        borderRadius={SIZES.radiusLg}
                        bordered={true}
                        sheen={true}
                        style={styles.cardSection}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.iconBadge, { backgroundColor: 'rgba(0, 245, 212, 0.15)' }]}>
                                    <Icon name="shopping-outline" size={18} color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                                </View>
                                <Text style={[styles.sectionTitle, { color: dynamicText }]}>
                                    Sản phẩm đặt mua ({totalQuantity})
                                </Text>
                            </View>
                        </View>

                        {items.map((item, idx) => (
                            <View
                                key={item.id}
                                style={[
                                    styles.itemRow,
                                    idx < items.length - 1 && { borderBottomWidth: 1, borderBottomColor: dynamicBorder },
                                ]}
                            >
                                <Image source={{ uri: item.image }} style={styles.itemThumb} />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.itemName, { color: dynamicText }]} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <Text style={[styles.itemCategory, { color: dynamicSubText }]}>
                                        Danh mục: {item.category || 'Công nghệ & Phụ kiện'}
                                    </Text>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                                        <Text style={[styles.itemPrice, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>
                                            {formatCurrency(item.price)}
                                        </Text>
                                        <Text style={[styles.itemQty, { color: dynamicSubText }]}>
                                            x{item.quantity}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Ghi chú đơn hàng */}
                        <View style={styles.noteInputWrapper}>
                            <Icon name="comment-text-outline" size={18} color={dynamicSubText} style={{ marginRight: 8 }} />
                            <TextInput
                                style={[styles.noteInput, { color: dynamicText }]}
                                placeholder="Lưu ý cho Người bán / Shipper (tùy chọn)..."
                                placeholderTextColor={dynamicSubText}
                                value={orderNote}
                                onChangeText={setOrderNote}
                            />
                        </View>
                    </LiquidGlassView>

                    {/* SECTION 3: HÌNH THỨC GIAO HÀNG & NGÀY NHẬN */}
                    <LiquidGlassView
                        intensity="medium"
                        borderRadius={SIZES.radiusLg}
                        bordered={true}
                        sheen={true}
                        style={styles.cardSection}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.iconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                                    <Icon name="truck-delivery-outline" size={18} color="#38BDF8" />
                                </View>
                                <Text style={[styles.sectionTitle, { color: dynamicText }]}>
                                    Phương thức vận chuyển
                                </Text>
                            </View>
                        </View>

                        {SHIPPING_OPTIONS.map((opt) => {
                            const isSelected = selectedShipping.id === opt.id;
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        hapticLight();
                                        setSelectedShipping(opt);
                                    }}
                                    style={[
                                        styles.shippingOptionCard,
                                        {
                                            borderColor: isSelected
                                                ? isDarkMode ? '#00F5D4' : COLORS.primary
                                                : dynamicBorder,
                                            backgroundColor: isSelected
                                                ? isDarkMode ? 'rgba(0, 245, 212, 0.08)' : 'rgba(2, 132, 199, 0.06)'
                                                : 'transparent',
                                        },
                                    ]}
                                >
                                    <View style={styles.radioCircle}>
                                        {isSelected && <View style={[styles.radioDot, { backgroundColor: isDarkMode ? '#00F5D4' : COLORS.primary }]} />}
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 10 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                            <Text style={[styles.shippingName, { color: dynamicText }]}>
                                                {opt.name}
                                            </Text>
                                            {opt.badge && (
                                                <View style={styles.shippingBadge}>
                                                    <Text style={styles.shippingBadgeText}>{opt.badge}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.shippingDesc, { color: dynamicSubText }]}>
                                            {opt.provider}
                                        </Text>
                                        <Text style={[styles.deliveryDateText, { color: isDarkMode ? '#00F5D4' : '#0284C7' }]}>
                                            🕒 Nhận hàng dự kiến: {opt.estimatedDate}
                                        </Text>
                                    </View>
                                    <Text style={[styles.shippingFeeText, { color: dynamicText }]}>
                                        {formatCurrency(opt.fee)}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </LiquidGlassView>

                    {/* SECTION 4: SHOPAI VOUCHER & MÃ GIẢM GIÁ */}
                    <LiquidGlassView
                        intensity="medium"
                        borderRadius={SIZES.radiusLg}
                        bordered={true}
                        sheen={true}
                        style={styles.cardSection}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.iconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                    <Icon name="ticket-percent-outline" size={18} color="#F59E0B" />
                                </View>
                                <Text style={[styles.sectionTitle, { color: dynamicText }]}>
                                    ShopAI Voucher & Ưu đãi
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => {
                                    hapticLight();
                                    setVoucherModalVisible(true);
                                }}
                                style={styles.actionLinkBtn}
                            >
                                <Text style={[styles.actionLinkText, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                    Chọn mã khác
                                </Text>
                                <Icon name="chevron-right" size={16} color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        {/* Voucher đang kích hoạt */}
                        {appliedVoucher ? (
                            <View style={[styles.activeVoucherCard, { borderColor: isDarkMode ? '#00F5D4' : '#10B981' }]}>
                                <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Icon name="check-decagram" size={16} color="#10B981" />
                                        <Text style={[styles.activeVoucherTitle, { color: dynamicText }]}>
                                            Mã: {appliedVoucher.code} ({appliedVoucher.title})
                                        </Text>
                                    </View>
                                    <Text style={[styles.activeVoucherDesc, { color: dynamicSubText }]}>
                                        {appliedVoucher.description}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => {
                                        hapticLight();
                                        setAppliedVoucher(null);
                                    }}
                                    style={styles.removeVoucherBtn}
                                >
                                    <Icon name="close" size={16} color={COLORS.error} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                onPress={() => setVoucherModalVisible(true)}
                                style={[styles.selectVoucherPlaceholder, { borderColor: dynamicBorder }]}
                            >
                                <Text style={[styles.selectVoucherPlaceholderText, { color: dynamicSubText }]}>
                                    Chưa áp dụng voucher. Bấm để chọn mã giảm giá!
                                </Text>
                            </TouchableOpacity>
                        )}
                    </LiquidGlassView>

                    {/* SECTION 5: PHƯƠNG THỨC THANH TOÁN */}
                    <LiquidGlassView
                        intensity="medium"
                        borderRadius={SIZES.radiusLg}
                        bordered={true}
                        sheen={true}
                        style={styles.cardSection}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.iconBadge, { backgroundColor: 'rgba(147, 51, 234, 0.15)' }]}>
                                    <Icon name="credit-card-settings-outline" size={18} color="#A855F7" />
                                </View>
                                <Text style={[styles.sectionTitle, { color: dynamicText }]}>
                                    Phương thức thanh toán
                                </Text>
                            </View>
                        </View>

                        {/* 1. Quét mã QR Ngân hàng / VietQR */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                hapticLight();
                                setPaymentMethod('VIETQR');
                            }}
                            style={[
                                styles.paymentMethodCard,
                                {
                                    borderColor: paymentMethod === 'VIETQR' ? (isDarkMode ? '#00F5D4' : COLORS.primary) : dynamicBorder,
                                    backgroundColor: paymentMethod === 'VIETQR' ? (isDarkMode ? 'rgba(0, 245, 212, 0.08)' : 'rgba(2, 132, 199, 0.06)') : 'transparent',
                                },
                            ]}
                        >
                            <View style={styles.radioCircle}>
                                {paymentMethod === 'VIETQR' && <View style={[styles.radioDot, { backgroundColor: isDarkMode ? '#00F5D4' : COLORS.primary }]} />}
                            </View>
                            <View style={[styles.methodIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                                <Icon name="qrcode-scan" size={20} color="#10B981" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[styles.paymentMethodName, { color: dynamicText }]}>
                                        Quét mã QR Ngân hàng / VietQR
                                    </Text>
                                    <View style={[styles.popularBadge, { backgroundColor: '#10B981' }]}>
                                        <Text style={styles.popularBadgeText}>Khuyên dùng</Text>
                                    </View>
                                </View>
                                <Text style={[styles.paymentMethodDesc, { color: dynamicSubText }]}>
                                    Tự động mở Camera quét mã VietQR từ mọi ngân hàng
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Chi tiết khi chọn VietQR: Thẻ ngân hàng chuẩn chính thống */}
                        {paymentMethod === 'VIETQR' && (
                            <View style={[styles.vietQrBox, { backgroundColor: isDarkMode ? 'rgba(6, 10, 28, 0.75)' : '#F0F9FF', borderColor: isDarkMode ? 'rgba(0, 245, 212, 0.3)' : '#BAE6FD' }]}>
                                <View style={styles.vietQrHeader}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Icon name="bank" size={18} color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                                        <Text style={[styles.bankTitle, { color: dynamicText }]}>
                                            Mã QR Thanh Toán (VietQR · 24/7)
                                        </Text>
                                    </View>
                                    <View style={styles.verifiedBadge}>
                                        <Icon name="check-circle" size={14} color="#10B981" />
                                        <Text style={styles.verifiedBadgeText}>Tự động nhận diện</Text>
                                    </View>
                                </View>

                                {/* Chọn nhanh ngân hàng thụ hưởng */}
                                <View style={styles.bankSelectSection}>
                                    <Text style={[styles.bankSelectTitle, { color: dynamicSubText }]}>
                                        Chọn tài khoản ngân hàng chuyển tiền:
                                    </Text>
                                    <View style={styles.bankPresetsRow}>
                                        {SHOP_BANK_PRESETS.map((preset) => {
                                            const isSelected = bankInfo.accountNumber === preset.accountNumber;
                                            return (
                                                <TouchableOpacity
                                                    key={preset.id}
                                                    style={[
                                                        styles.bankPresetBadge,
                                                        {
                                                            backgroundColor: isSelected ? preset.color : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#E2E8F0'),
                                                            borderWidth: isSelected ? 1.5 : 0,
                                                            borderColor: isSelected ? (isDarkMode ? '#00F5D4' : preset.color) : 'transparent',
                                                        },
                                                    ]}
                                                    onPress={() => {
                                                        hapticLight();
                                                        setBankInfo({
                                                            bankName: preset.bankName,
                                                            bankShortName: preset.bankShortName,
                                                            accountNumber: preset.accountNumber,
                                                            accountName: preset.accountName,
                                                            transferContent: bankInfo.transferContent,
                                                            amount: finalTotal,
                                                            verified: true,
                                                        });
                                                    }}
                                                >
                                                    <Text style={[styles.bankPresetText, { color: isSelected ? '#FFFFFF' : dynamicText, fontWeight: isSelected ? '800' : '600' }]}>
                                                        {preset.bankShortName}
                                                    </Text>
                                                    <Text style={[styles.bankPresetSub, { color: isSelected ? 'rgba(255,255,255,0.85)' : dynamicSubText }]}>
                                                        {preset.accountName}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Khung hiển thị mã QR thanh toán trung tâm */}
                                <View style={styles.qrCenterWrapper}>
                                    <TouchableOpacity
                                        activeOpacity={0.88}
                                        style={styles.qrImageFrameLarge}
                                        onPress={() => {
                                            hapticLight();
                                            setQrPreviewModalVisible(true);
                                        }}
                                    >
                                        <Image
                                            source={{ uri: vietQrUrl }}
                                            style={styles.vietQrImageLarge}
                                            resizeMode="contain"
                                        />
                                        <View style={styles.qrExpandBadge}>
                                            <Icon name="arrow-expand-all" size={11} color="#FFFFFF" />
                                            <Text style={styles.qrExpandText}>Chạm để phóng to mã QR</Text>
                                        </View>
                                    </TouchableOpacity>
                                    <Text style={[styles.qrScanHintText, { color: dynamicSubText }]}>
                                        Mở app Ngân hàng hoặc MoMo / VNPay, quét mã QR trên để thanh toán tự động đúng số tiền và nội dung
                                    </Text>
                                </View>

                                {/* Danh sách thông tin chi tiết có nút sao chép */}
                                <View style={styles.bankFieldsList}>
                                    {/* Ngân hàng */}
                                    <View style={styles.bankFieldItem}>
                                        <Text style={[styles.bankFieldLabel, { color: dynamicSubText }]}>Ngân hàng:</Text>
                                        <Text style={[styles.bankFieldValue, { color: dynamicText }]} numberOfLines={1}>
                                            {bankInfo.bankName}
                                        </Text>
                                    </View>

                                    {/* Tên tài khoản */}
                                    <View style={styles.bankFieldItem}>
                                        <Text style={[styles.bankFieldLabel, { color: dynamicSubText }]}>Chủ tài khoản:</Text>
                                        <Text style={[styles.bankFieldValueBold, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                            {bankInfo.accountName}
                                        </Text>
                                    </View>

                                    {/* Số tài khoản */}
                                    <View style={styles.bankFieldItemWithCopy}>
                                        <View>
                                            <Text style={[styles.bankFieldLabel, { color: dynamicSubText }]}>Số tài khoản:</Text>
                                            <Text style={[styles.bankFieldValueMono, { color: dynamicText }]}>
                                                {bankInfo.accountNumber}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.copyBtn}
                                            onPress={() => handleCopy(bankInfo.accountNumber, 'Số tài khoản')}
                                        >
                                            <Icon name="content-copy" size={14} color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                                            <Text style={[styles.copyBtnText, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                                {copiedField === 'Số tài khoản' ? 'Đã chép' : 'Sao chép'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Số tiền */}
                                    <View style={styles.bankFieldItemWithCopy}>
                                        <View>
                                            <Text style={[styles.bankFieldLabel, { color: dynamicSubText }]}>Số tiền thanh toán:</Text>
                                            <Text style={[styles.bankFieldAmount, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>
                                                {formatCurrency(finalTotal)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.copyBtn}
                                            onPress={() => handleCopy(finalTotal.toString(), 'Số tiền')}
                                        >
                                            <Icon name="content-copy" size={14} color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                                            <Text style={[styles.copyBtnText, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                                Sao chép
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Nội dung chuyển khoản */}
                                    <View style={styles.bankFieldItemWithCopy}>
                                        <View>
                                            <Text style={[styles.bankFieldLabel, { color: dynamicSubText }]}>Nội dung CK:</Text>
                                            <Text style={[styles.bankFieldValueMono, { color: '#EF4444' }]}>
                                                {bankInfo.transferContent}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.copyBtn}
                                            onPress={() => handleCopy(bankInfo.transferContent, 'Nội dung')}
                                        >
                                            <Icon name="content-copy" size={14} color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                                            <Text style={[styles.copyBtnText, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                                Sao chép
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        )}

                        {/* 2. COD - Thanh toán khi nhận hàng */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                hapticLight();
                                setPaymentMethod('COD');
                            }}
                            style={[
                                styles.paymentMethodCard,
                                {
                                    borderColor: paymentMethod === 'COD' ? (isDarkMode ? '#00F5D4' : COLORS.primary) : dynamicBorder,
                                    backgroundColor: paymentMethod === 'COD' ? (isDarkMode ? 'rgba(0, 245, 212, 0.08)' : 'rgba(2, 132, 199, 0.06)') : 'transparent',
                                },
                            ]}
                        >
                            <View style={styles.radioCircle}>
                                {paymentMethod === 'COD' && <View style={[styles.radioDot, { backgroundColor: isDarkMode ? '#00F5D4' : COLORS.primary }]} />}
                            </View>
                            <View style={[styles.methodIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                                <Icon name="cash-multiple" size={20} color="#F59E0B" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={[styles.paymentMethodName, { color: dynamicText }]}>
                                    Thanh toán khi nhận hàng (COD)
                                </Text>
                                <Text style={[styles.paymentMethodDesc, { color: dynamicSubText }]}>
                                    Thanh toán tiền mặt cho shipper khi nhận được hàng
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* 3. Ví Trả Sau / SPayLater */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                hapticLight();
                                setPaymentMethod('SPAYLATER');
                            }}
                            style={[
                                styles.paymentMethodCard,
                                {
                                    borderColor: paymentMethod === 'SPAYLATER' ? (isDarkMode ? '#00F5D4' : COLORS.primary) : dynamicBorder,
                                    backgroundColor: paymentMethod === 'SPAYLATER' ? (isDarkMode ? 'rgba(0, 245, 212, 0.08)' : 'rgba(2, 132, 199, 0.06)') : 'transparent',
                                },
                            ]}
                        >
                            <View style={styles.radioCircle}>
                                {paymentMethod === 'SPAYLATER' && <View style={[styles.radioDot, { backgroundColor: isDarkMode ? '#00F5D4' : COLORS.primary }]} />}
                            </View>
                            <View style={[styles.methodIconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                                <Icon name="credit-card-clock-outline" size={20} color="#EC4899" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={[styles.paymentMethodName, { color: dynamicText }]}>
                                        Ví Trả Sau (SPayLater / 0% Lãi suất)
                                    </Text>
                                    <View style={[styles.popularBadge, { backgroundColor: '#EC4899' }]}>
                                        <Text style={styles.popularBadgeText}>0% Lãi</Text>
                                    </View>
                                </View>
                                <Text style={[styles.paymentMethodDesc, { color: dynamicSubText }]}>
                                    Mua trước - Trả sau chia nhỏ kỳ hạn linh hoạt
                                </Text>
                            </View>
                        </TouchableOpacity>

                        {/* Chi tiết kỳ hạn Ví Trả Sau */}
                        {paymentMethod === 'SPAYLATER' && (
                            <View style={[styles.payLaterBox, { backgroundColor: isDarkMode ? 'rgba(6, 10, 28, 0.75)' : '#FDF2F8', borderColor: isDarkMode ? 'rgba(236, 72, 153, 0.3)' : '#FBCFE8' }]}>
                                <Text style={[styles.payLaterTitle, { color: dynamicText }]}>
                                    Chọn kỳ hạn thanh toán:
                                </Text>
                                <View style={styles.payLaterTermsRow}>
                                    {[
                                        { term: '1', label: '1 Tháng', fee: '0đ phí' },
                                        { term: '3', label: '3 Tháng', fee: `${formatCurrency(Math.round(finalTotal / 3))}/tháng` },
                                        { term: '6', label: '6 Tháng', fee: `${formatCurrency(Math.round(finalTotal / 6))}/tháng` },
                                    ].map((t) => {
                                        const active = payLaterTerm === t.term;
                                        return (
                                            <TouchableOpacity
                                                key={t.term}
                                                style={[
                                                    styles.termButton,
                                                    active
                                                        ? { backgroundColor: '#EC4899', borderColor: '#EC4899' }
                                                        : { borderColor: dynamicBorder, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#FFF' },
                                                ]}
                                                onPress={() => {
                                                    hapticLight();
                                                    setPayLaterTerm(t.term as any);
                                                }}
                                            >
                                                <Text style={[styles.termButtonText, { color: active ? '#FFF' : dynamicText }]}>
                                                    {t.label}
                                                </Text>
                                                <Text style={[styles.termFeeText, { color: active ? '#FFF' : dynamicSubText }]}>
                                                    {t.fee}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        )}

                        {/* 4. Thẻ tín dụng / Ghi nợ */}
                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                                hapticLight();
                                setPaymentMethod('CARD');
                            }}
                            style={[
                                styles.paymentMethodCard,
                                {
                                    borderColor: paymentMethod === 'CARD' ? (isDarkMode ? '#00F5D4' : COLORS.primary) : dynamicBorder,
                                    backgroundColor: paymentMethod === 'CARD' ? (isDarkMode ? 'rgba(0, 245, 212, 0.08)' : 'rgba(2, 132, 199, 0.06)') : 'transparent',
                                },
                            ]}
                        >
                            <View style={styles.radioCircle}>
                                {paymentMethod === 'CARD' && <View style={[styles.radioDot, { backgroundColor: isDarkMode ? '#00F5D4' : COLORS.primary }]} />}
                            </View>
                            <View style={[styles.methodIconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                                <Icon name="credit-card-outline" size={20} color="#3B82F6" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={[styles.paymentMethodName, { color: dynamicText }]}>
                                    Thẻ Quốc tế (Visa, Mastercard, JCB) & ATM
                                </Text>
                                <Text style={[styles.paymentMethodDesc, { color: dynamicSubText }]}>
                                    Thanh toán an toàn bảo mật chuẩn 3D-Secure
                                </Text>
                            </View>
                        </TouchableOpacity>
                    </LiquidGlassView>

                    {/* SECTION 6: CHI TIẾT THANH TOÁN (HÓA ĐƠN) */}
                    <LiquidGlassView
                        intensity="medium"
                        borderRadius={SIZES.radiusLg}
                        bordered={true}
                        sheen={true}
                        style={styles.cardSection}
                    >
                        <View style={styles.sectionHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.iconBadge, { backgroundColor: 'rgba(0, 245, 212, 0.15)' }]}>
                                    <Icon name="receipt" size={18} color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                                </View>
                                <Text style={[styles.sectionTitle, { color: dynamicText }]}>
                                    Chi tiết thanh toán
                                </Text>
                            </View>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: dynamicSubText }]}>Tổng tiền hàng</Text>
                            <Text style={[styles.summaryValue, { color: dynamicText }]}>{formatCurrency(subtotal)}</Text>
                        </View>

                        <View style={styles.summaryRow}>
                            <Text style={[styles.summaryLabel, { color: dynamicSubText }]}>Phí vận chuyển ({selectedShipping.name})</Text>
                            <Text style={[styles.summaryValue, { color: dynamicText }]}>{formatCurrency(shippingFee)}</Text>
                        </View>

                        {shippingDiscount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: '#10B981' }]}>Giảm giá phí vận chuyển</Text>
                                <Text style={[styles.summaryValue, { color: '#10B981', fontWeight: '700' }]}>
                                    -{formatCurrency(shippingDiscount)}
                                </Text>
                            </View>
                        )}

                        {voucherDiscount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={[styles.summaryLabel, { color: '#10B981' }]}>Voucher giảm giá</Text>
                                <Text style={[styles.summaryValue, { color: '#10B981', fontWeight: '700' }]}>
                                    -{formatCurrency(voucherDiscount)}
                                </Text>
                            </View>
                        )}

                        <View style={[styles.divider, { backgroundColor: dynamicBorder }]} />

                        <View style={styles.finalTotalRow}>
                            <View>
                                <Text style={[styles.finalTotalLabel, { color: dynamicText }]}>Tổng thanh toán</Text>
                                <Text style={[styles.vatNote, { color: dynamicSubText }]}>Đã bao gồm thuế VAT (nếu có)</Text>
                            </View>
                            <Text style={[styles.finalTotalValue, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>
                                {formatCurrency(finalTotal)}
                            </Text>
                        </View>
                    </LiquidGlassView>

                    <View style={{ height: 120 }} />
                </ScrollView>

                {/* STICKY BOTTOM CHECKOUT BAR */}
                <View style={styles.bottomBarWrapper}>
                    <LiquidGlassView
                        intensity="prominent"
                        borderRadius={SIZES.radiusXl}
                        bordered={true}
                        sheen={true}
                        glow={true}
                        glowColor={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                        style={styles.bottomBar}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.bottomBarTotalLabel, { color: dynamicSubText }]}>
                                Tổng thanh toán:
                            </Text>
                            <Text style={[styles.bottomBarTotalValue, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>
                                {formatCurrency(finalTotal)}
                            </Text>
                        </View>

                        {isSubmitting ? (
                            <ActivityIndicator size="large" color={COLORS.primary} style={{ paddingHorizontal: 30 }} />
                        ) : (
                            <ShopButton
                                title="Đặt hàng ngay"
                                onPress={handlePlaceOrder}
                                variant="liquid-primary"
                                icon={<Icon name="shield-check" size={18} color="#FFF" />}
                                style={styles.placeOrderBtn}
                            />
                        )}
                    </LiquidGlassView>
                </View>

                {/* MODAL 1: CHỌN ĐỊA CHỈ */}
                <Modal
                    visible={addressModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setAddressModalVisible(false)}
                >
                    <View style={styles.modalBackdrop}>
                        <LiquidGlassView
                            intensity="prominent"
                            borderRadius={SIZES.radiusXl}
                            bordered={true}
                            sheen={true}
                            style={styles.modalContent}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: dynamicText }]}>Chọn địa chỉ nhận hàng</Text>
                                <TouchableOpacity onPress={() => setAddressModalVisible(false)}>
                                    <Icon name="close" size={22} color={dynamicText} />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 380 }}>
                                {SAMPLE_ADDRESSES.map((addr) => {
                                    const isSelected = selectedAddress.id === addr.id;
                                    return (
                                        <TouchableOpacity
                                            key={addr.id}
                                            style={[
                                                styles.addressSelectCard,
                                                {
                                                    borderColor: isSelected ? (isDarkMode ? '#00F5D4' : COLORS.primary) : dynamicBorder,
                                                    backgroundColor: isSelected ? (isDarkMode ? 'rgba(0, 245, 212, 0.08)' : '#F0F9FF') : 'transparent',
                                                },
                                            ]}
                                            onPress={() => {
                                                hapticLight();
                                                setSelectedAddress(addr);
                                                setAddressModalVisible(false);
                                            }}
                                        >
                                            <View style={styles.radioCircle}>
                                                {isSelected && <View style={[styles.radioDot, { backgroundColor: isDarkMode ? '#00F5D4' : COLORS.primary }]} />}
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 10 }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                    <Text style={[styles.recipientName, { color: dynamicText }]}>{addr.recipientName}</Text>
                                                    <Text style={[styles.recipientPhone, { color: dynamicSubText }]}>{addr.phone}</Text>
                                                    <View style={[styles.addressTagBadge, { backgroundColor: isDarkMode ? 'rgba(0, 245, 212, 0.15)' : '#E0F2FE' }]}>
                                                        <Text style={[styles.addressTagText, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>{addr.tag}</Text>
                                                    </View>
                                                </View>
                                                <Text style={[styles.addressDetail, { color: dynamicSubText, marginTop: 4 }]}>
                                                    {addr.address}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </LiquidGlassView>
                    </View>
                </Modal>

                {/* MODAL 2: CHỌN VOUCHER / NHẬP MÃ */}
                <Modal
                    visible={voucherModalVisible}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setVoucherModalVisible(false)}
                >
                    <View style={styles.modalBackdrop}>
                        <LiquidGlassView
                            intensity="prominent"
                            borderRadius={SIZES.radiusXl}
                            bordered={true}
                            sheen={true}
                            style={styles.modalContent}
                        >
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: dynamicText }]}>ShopAI Voucher</Text>
                                <TouchableOpacity onPress={() => setVoucherModalVisible(false)}>
                                    <Icon name="close" size={22} color={dynamicText} />
                                </TouchableOpacity>
                            </View>

                            {/* Ô nhập mã */}
                            <View style={styles.voucherInputRow}>
                                <TextInput
                                    style={[styles.voucherTextInput, { color: dynamicText, borderColor: dynamicBorder }]}
                                    placeholder="Nhập mã ưu đãi (FREESHIP, TECH100K...)"
                                    placeholderTextColor={dynamicSubText}
                                    value={customPromoInput}
                                    onChangeText={setCustomPromoInput}
                                    autoCapitalize="characters"
                                />
                                <TouchableOpacity
                                    style={[styles.applyVoucherBtn, { backgroundColor: isDarkMode ? '#00F5D4' : COLORS.primary }]}
                                    onPress={handleApplyCustomPromo}
                                >
                                    <Text style={[styles.applyVoucherBtnText, { color: isDarkMode ? '#060A1F' : '#FFF' }]}>Áp dụng</Text>
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={{ maxHeight: 340 }}>
                                {AVAILABLE_VOUCHERS.map((v) => {
                                    const isSelected = appliedVoucher?.code === v.code;
                                    return (
                                        <TouchableOpacity
                                            key={v.code}
                                            style={[
                                                styles.voucherCard,
                                                {
                                                    borderColor: isSelected ? (isDarkMode ? '#00F5D4' : COLORS.primary) : dynamicBorder,
                                                    backgroundColor: isSelected ? (isDarkMode ? 'rgba(0, 245, 212, 0.08)' : '#F0FDF4') : 'transparent',
                                                },
                                            ]}
                                            onPress={() => {
                                                hapticSuccess();
                                                setAppliedVoucher(v);
                                                setVoucherModalVisible(false);
                                            }}
                                        >
                                            <View style={[styles.voucherIconBox, { backgroundColor: isDarkMode ? 'rgba(0, 245, 212, 0.15)' : '#DCFCE7' }]}>
                                                <Icon name="ticket-percent" size={24} color={isDarkMode ? '#00F5D4' : '#16A34A'} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 12 }}>
                                                <Text style={[styles.voucherCardTitle, { color: dynamicText }]}>{v.title}</Text>
                                                <Text style={[styles.voucherCardDesc, { color: dynamicSubText }]}>{v.description}</Text>
                                                <Text style={[styles.voucherCardCode, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                                    Mã: {v.code}
                                                </Text>
                                            </View>
                                            <View style={styles.radioCircle}>
                                                {isSelected && <View style={[styles.radioDot, { backgroundColor: isDarkMode ? '#00F5D4' : COLORS.primary }]} />}
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </LiquidGlassView>
                    </View>
                </Modal>

                {/* MODAL 3: CAMERA QUÉT MÃ QR NGÂN HÀNG (LIVE VIETQR SCANNER) */}
                <Modal
                    visible={qrScannerModalVisible}
                    animationType="fade"
                    transparent={false}
                    onRequestClose={() => setQrScannerModalVisible(false)}
                >
                    <View style={styles.cameraModalContainer}>
                        {/* Live Camera Stream */}
                        {VisionCameraModule && hasCameraPermission && qrScannerModalVisible && (
                            <QrCameraStream
                                onScanSuccess={handleBankQrScanned}
                                torchOn={torchOn}
                            />
                        )}

                        {/* Overlay ngắm quét */}
                        <View style={styles.camTopOverlay}>
                            <View style={styles.camHeaderBar}>
                                <TouchableOpacity
                                    style={styles.camCircleBtn}
                                    onPress={() => setQrScannerModalVisible(false)}
                                >
                                    <Icon name="close" size={24} color="#FFF" />
                                </TouchableOpacity>
                                <Text style={styles.camHeaderTitle}>Quét mã VietQR Ngân hàng</Text>
                                <TouchableOpacity
                                    style={[styles.camCircleBtn, torchOn && { backgroundColor: '#FFD700' }]}
                                    onPress={() => setTorchOn(!torchOn)}
                                >
                                    <Icon
                                        name={torchOn ? 'flashlight' : 'flashlight-off'}
                                        size={22}
                                        color={torchOn ? '#000' : '#FFF'}
                                    />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.camHintText}>
                                Đặt mã VietQR từ App ngân hàng khác hoặc màn hình vào giữa khung ngắm để tự động nhận diện
                            </Text>
                        </View>

                        {/* Scanner Box + Laser */}
                        <View style={styles.camMiddleRow}>
                            <View style={styles.camSideOverlay} />
                            <View style={styles.camScannerBox}>
                                <View style={[styles.camCorner, styles.camCornerTL]} />
                                <View style={[styles.camCorner, styles.camCornerTR]} />
                                <View style={[styles.camCorner, styles.camCornerBL]} />
                                <View style={[styles.camCorner, styles.camCornerBR]} />

                                <Animated.View
                                    style={[
                                        styles.camLaserLine,
                                        { transform: [{ translateY: laserAnim }] },
                                    ]}
                                />

                                <View style={styles.camAiBadge}>
                                    <Icon name="qrcode-scan" size={14} color="#00E676" />
                                    <Text style={styles.camAiBadgeText}>VietQR Auto-Detect</Text>
                                </View>
                            </View>
                            <View style={styles.camSideOverlay} />
                        </View>

                        {/* Bottom Bar: Mẫu ngân hàng test nhanh */}
                        <View style={styles.camBottomOverlay}>
                            <Text style={styles.camBottomLabel}>Hoặc chọn nhanh mã ngân hàng đã xác thực:</Text>
                            <View style={styles.bankPresetsRow}>
                                <TouchableOpacity
                                    style={[styles.bankPresetBadge, { backgroundColor: '#006838' }]}
                                    onPress={() => handleSelectPresetBank('VCB')}
                                >
                                    <Text style={styles.bankPresetText}>Vietcombank</Text>
                                    <Text style={styles.bankPresetSub}>HO THI HUE MAN</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.bankPresetBadge, { backgroundColor: '#1E3A8A' }]}
                                    onPress={() => handleSelectPresetBank('MB')}
                                >
                                    <Text style={styles.bankPresetText}>MBBank</Text>
                                    <Text style={styles.bankPresetSub}>ShopAI Corp</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.bankPresetBadge, { backgroundColor: '#DC2626' }]}
                                    onPress={() => handleSelectPresetBank('TCB')}
                                >
                                    <Text style={styles.bankPresetText}>Techcombank</Text>
                                    <Text style={styles.bankPresetSub}>ShopAI Official</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* MODAL 4: ĐẶT HÀNG THÀNH CÔNG */}
                <Modal
                    visible={successModalVisible}
                    animationType="fade"
                    transparent={true}
                    onRequestClose={() => {
                        setSuccessModalVisible(false);
                        navigation.navigate('ShopAI', { screen: 'HomeTab' });
                    }}
                >
                    <View style={styles.modalBackdrop}>
                        <LiquidGlassView
                            intensity="prominent"
                            borderRadius={SIZES.radiusXl}
                            bordered={true}
                            sheen={true}
                            glow={true}
                            glowColor="#10B981"
                            style={styles.successModalCard}
                        >
                            <View style={styles.successIconCircle}>
                                <Icon name="check-bold" size={40} color="#10B981" />
                            </View>

                            <Text style={[styles.successTitle, { color: dynamicText }]}>
                                Đặt hàng thành công!
                            </Text>
                            <Text style={[styles.successSubtitle, { color: dynamicSubText }]}>
                                Cảm ơn bạn đã tin tưởng mua sắm tại ShopAI
                            </Text>

                            {orderSuccessData && (
                                <View style={[styles.successDetailsBox, { backgroundColor: isDarkMode ? 'rgba(6, 10, 28, 0.6)' : '#F8FAFC', borderColor: dynamicBorder }]}>
                                    <View style={styles.successDetailRow}>
                                        <Text style={[styles.successDetailLabel, { color: dynamicSubText }]}>Mã đơn hàng:</Text>
                                        <Text style={[styles.successDetailValue, { color: dynamicText }]}>#{orderSuccessData.id}</Text>
                                    </View>

                                    <View style={styles.successDetailRow}>
                                        <Text style={[styles.successDetailLabel, { color: dynamicSubText }]}>Phương thức:</Text>
                                        <Text style={[styles.successDetailValue, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                            {orderSuccessData.paymentMethod === 'VIETQR'
                                                ? 'Quét mã VietQR'
                                                : orderSuccessData.paymentMethod === 'COD'
                                                ? 'COD (Tiền mặt)'
                                                : orderSuccessData.paymentMethod === 'SPAYLATER'
                                                ? `Ví Trả Sau (${orderSuccessData.payLaterTerm})`
                                                : 'Thẻ Quốc tế / ATM'}
                                        </Text>
                                    </View>

                                    <View style={styles.successDetailRow}>
                                        <Text style={[styles.successDetailLabel, { color: dynamicSubText }]}>Dự kiến giao:</Text>
                                        <Text style={[styles.successDetailValue, { color: '#10B981', fontWeight: '700' }]}>
                                            {orderSuccessData.deliveryDate}
                                        </Text>
                                    </View>

                                    <View style={styles.successDetailRow}>
                                        <Text style={[styles.successDetailLabel, { color: dynamicSubText }]}>Tổng thanh toán:</Text>
                                        <Text style={[styles.successDetailTotal, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>
                                            {formatCurrency(orderSuccessData.total)}
                                        </Text>
                                    </View>
                                </View>
                            )}

                            {/* Mã QR thanh toán hiển thị trực tiếp trong Modal thành công nếu chọn VietQR */}
                            {orderSuccessData?.paymentMethod === 'VIETQR' && (
                                <View style={[styles.successQrBox, { backgroundColor: isDarkMode ? 'rgba(0, 245, 212, 0.08)' : '#F0FDF4', borderColor: isDarkMode ? 'rgba(0, 245, 212, 0.3)' : '#86EFAC' }]}>
                                    <Text style={[styles.successQrTitle, { color: dynamicText }]}>
                                        ⚡ Quét mã VietQR thanh toán ngay
                                    </Text>
                                    <View style={styles.successQrWhiteFrame}>
                                        <Image
                                            source={{
                                                uri: getVietQrPaymentUrl({
                                                    bankCode: orderSuccessData.bankInfo?.bankShortName || bankInfo.bankShortName || 'vietcombank',
                                                    accountNumber: orderSuccessData.bankInfo?.accountNumber || bankInfo.accountNumber,
                                                    amount: orderSuccessData.total,
                                                    content: orderSuccessData.bankInfo?.transferContent || bankInfo.transferContent,
                                                    accountName: orderSuccessData.bankInfo?.accountName || bankInfo.accountName,
                                                    template: 'compact2',
                                                }),
                                            }}
                                            style={{ width: 140, height: 140 }}
                                            resizeMode="contain"
                                        />
                                    </View>
                                    <Text style={[styles.successQrMemo, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>
                                        Nội dung CK: {orderSuccessData.bankInfo?.transferContent || bankInfo.transferContent}
                                    </Text>
                                </View>
                            )}

                            <View style={styles.successBtnStack}>
                                <ShopButton
                                    title="Xem chi tiết đơn hàng"
                                    onPress={() => {
                                        setSuccessModalVisible(false);
                                        navigation.navigate('OrderDetail', { orderId: orderSuccessData?.id });
                                    }}
                                    variant="liquid-primary"
                                    icon={<Icon name="receipt" size={16} color="#FFF" />}
                                />
                                <TouchableOpacity
                                    style={styles.continueShoppingBtn}
                                    onPress={() => {
                                        setSuccessModalVisible(false);
                                        navigation.navigate('RootDrawer');
                                    }}
                                >
                                    <Text style={[styles.continueShoppingText, { color: isDarkMode ? '#00F5D4' : COLORS.primary }]}>
                                        Tiếp tục mua sắm
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </LiquidGlassView>
                    </View>
                </Modal>

                {/* MODAL 5: PHÓNG TO MÃ QR THANH TOÁN VIETQR */}
                <Modal
                    visible={qrPreviewModalVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setQrPreviewModalVisible(false)}
                >
                    <View style={styles.modalBackdrop}>
                        <LiquidGlassView
                            intensity="prominent"
                            borderRadius={SIZES.radiusXl}
                            bordered={true}
                            style={styles.qrPreviewModalCard}
                        >
                            <View style={styles.modalHeader}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Icon name="qrcode-scan" size={20} color={isDarkMode ? '#00F5D4' : COLORS.primary} />
                                    <Text style={[styles.modalTitle, { color: dynamicText }]}>
                                        Mã QR Thanh Toán
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => setQrPreviewModalVisible(false)}>
                                    <Icon name="close" size={22} color={dynamicText} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.qrPreviewCenterBox}>
                                <View style={styles.qrWhiteFrameLarge}>
                                    <Image
                                        source={{ uri: vietQrUrl }}
                                        style={{ width: 220, height: 220 }}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={[styles.qrPreviewBankText, { color: dynamicText }]}>
                                    {bankInfo.bankName}
                                </Text>
                                <Text style={[styles.qrPreviewAmountText, { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary }]}>
                                    {formatCurrency(finalTotal)}
                                </Text>
                                <Text style={[styles.qrPreviewMemoText, { color: dynamicSubText }]}>
                                    Nội dung: <Text style={{ color: '#EF4444', fontWeight: '800' }}>{bankInfo.transferContent}</Text>
                                </Text>
                            </View>

                            <View style={{ gap: 8, marginTop: 14 }}>
                                <ShopButton
                                    title="Đã lưu mã / Chuyển khoản xong"
                                    onPress={() => setQrPreviewModalVisible(false)}
                                    variant="liquid-primary"
                                    icon={<Icon name="check-circle" size={16} color="#FFF" />}
                                />
                            </View>
                        </LiquidGlassView>
                    </View>
                </Modal>
            </SafeAreaView>
        </LiquidBackground>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1 },
    headerWrapper: {
        paddingHorizontal: SIZES.padding,
        paddingTop: 8,
        paddingBottom: 6,
    },
    headerBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    headerBackBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
    },
    headerSubtitle: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
    scrollContent: {
        padding: SIZES.padding,
        gap: 14,
    },
    cardSection: {
        padding: 14,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '800',
    },
    actionLinkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    actionLinkText: {
        fontSize: 12,
        fontWeight: '700',
    },
    addressInfoBox: {
        marginTop: 4,
    },
    recipientName: {
        fontSize: 14,
        fontWeight: '700',
    },
    recipientPhone: {
        fontSize: 13,
    },
    addressTagBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    addressTagText: {
        fontSize: 10,
        fontWeight: '800',
    },
    addressDetail: {
        fontSize: 13,
        lineHeight: 18,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    itemThumb: {
        width: 54,
        height: 54,
        borderRadius: 10,
        backgroundColor: '#0F172A',
    },
    itemName: {
        fontSize: 13,
        fontWeight: '700',
    },
    itemCategory: {
        fontSize: 11,
        marginTop: 2,
    },
    itemPrice: {
        fontSize: 13,
        fontWeight: '800',
    },
    itemQty: {
        fontSize: 12,
        fontWeight: '600',
    },
    noteInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 10,
        paddingHorizontal: 10,
        marginTop: 10,
    },
    noteInput: {
        flex: 1,
        height: 40,
        fontSize: 12,
    },
    shippingOptionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    radioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 1.5,
        borderColor: '#94A3B8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    shippingName: {
        fontSize: 13,
        fontWeight: '700',
    },
    shippingBadge: {
        backgroundColor: '#F59E0B',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    shippingBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
    },
    shippingDesc: {
        fontSize: 11,
        marginTop: 2,
    },
    deliveryDateText: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
    shippingFeeText: {
        fontSize: 13,
        fontWeight: '800',
    },
    activeVoucherCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
    },
    activeVoucherTitle: {
        fontSize: 13,
        fontWeight: '800',
    },
    activeVoucherDesc: {
        fontSize: 11,
        marginTop: 2,
    },
    removeVoucherBtn: {
        padding: 6,
    },
    selectVoucherPlaceholder: {
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    selectVoucherPlaceholderText: {
        fontSize: 12,
        fontWeight: '600',
    },
    paymentMethodCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    methodIconBox: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    paymentMethodName: {
        fontSize: 13,
        fontWeight: '700',
    },
    paymentMethodDesc: {
        fontSize: 11,
        marginTop: 2,
    },
    popularBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    popularBadgeText: {
        color: '#FFF',
        fontSize: 9,
        fontWeight: '800',
    },
    vietQrBox: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 12,
        marginTop: 4,
        marginBottom: 10,
    },
    vietQrHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    bankTitle: {
        fontSize: 14,
        fontWeight: '800',
    },
    verifiedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    verifiedBadgeText: {
        color: '#10B981',
        fontSize: 10,
        fontWeight: '700',
    },
    cameraScanBtnRow: {
        marginBottom: 12,
    },
    openCamBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 10,
    },
    openCamBtnText: {
        fontSize: 13,
        fontWeight: '800',
    },
    bankCardWrapper: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
    },
    qrImageContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        padding: 6,
        borderRadius: 10,
    },
    vietQrImage: {
        width: 90,
        height: 90,
    },
    qrScanHint: {
        fontSize: 8,
        color: '#64748B',
        fontWeight: '700',
        marginTop: 2,
    },
    bankFieldsList: {
        flex: 1,
        gap: 6,
    },
    bankFieldItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    bankFieldLabel: {
        fontSize: 11,
    },
    bankFieldValue: {
        fontSize: 11,
        fontWeight: '600',
    },
    bankFieldValueBold: {
        fontSize: 12,
        fontWeight: '800',
    },
    bankFieldItemWithCopy: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bankFieldValueMono: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    bankFieldAmount: {
        fontSize: 13,
        fontWeight: '900',
    },
    copyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: 'rgba(0, 245, 212, 0.12)',
    },
    copyBtnText: {
        fontSize: 10,
        fontWeight: '700',
    },
    payLaterBox: {
        borderRadius: 14,
        borderWidth: 1,
        padding: 12,
        marginTop: 4,
        marginBottom: 10,
    },
    payLaterTitle: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 8,
    },
    payLaterTermsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    termButton: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    termButtonText: {
        fontSize: 12,
        fontWeight: '800',
    },
    termFeeText: {
        fontSize: 10,
        marginTop: 2,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    summaryLabel: {
        fontSize: 13,
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        marginVertical: 10,
    },
    finalTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    finalTotalLabel: {
        fontSize: 15,
        fontWeight: '800',
    },
    vatNote: {
        fontSize: 10,
        marginTop: 2,
    },
    finalTotalValue: {
        fontSize: 20,
        fontWeight: '900',
    },
    bottomBarWrapper: {
        position: 'absolute',
        bottom: 12,
        left: 14,
        right: 14,
    },
    bottomBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    bottomBarTotalLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    bottomBarTotalValue: {
        fontSize: 18,
        fontWeight: '900',
        letterSpacing: -0.3,
    },
    placeOrderBtn: {
        minWidth: 150,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContent: {
        width: '100%',
        padding: 18,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    addressSelectCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    voucherInputRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14,
    },
    voucherTextInput: {
        flex: 1,
        height: 44,
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        fontSize: 13,
    },
    applyVoucherBtn: {
        height: 44,
        paddingHorizontal: 16,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyVoucherBtnText: {
        fontSize: 13,
        fontWeight: '800',
    },
    voucherCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
    },
    voucherIconBox: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
    voucherCardTitle: {
        fontSize: 14,
        fontWeight: '800',
    },
    voucherCardDesc: {
        fontSize: 11,
        marginTop: 2,
    },
    voucherCardCode: {
        fontSize: 11,
        fontWeight: '800',
        marginTop: 4,
    },
    cameraModalContainer: {
        flex: 1,
        backgroundColor: '#000000',
    },
    camTopOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
        paddingTop: 45,
        paddingBottom: 20,
    },
    camHeaderBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    camHeaderTitle: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: 'bold',
    },
    camCircleBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    camHintText: {
        color: '#E0E0E0',
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 18,
        marginHorizontal: 16,
    },
    camMiddleRow: {
        flexDirection: 'row',
        height: SCAN_BOX_SIZE,
    },
    camSideOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    camScannerBox: {
        width: SCAN_BOX_SIZE,
        height: SCAN_BOX_SIZE,
        backgroundColor: 'transparent',
        position: 'relative',
        overflow: 'hidden',
    },
    camCorner: {
        position: 'absolute',
        width: 28,
        height: 28,
        borderColor: '#00F5D4',
    },
    camCornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 10 },
    camCornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 10 },
    camCornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 10 },
    camCornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 10 },
    camLaserLine: {
        height: 3,
        width: '100%',
        backgroundColor: '#00E676',
        shadowColor: '#00E676',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 6,
    },
    camAiBadge: {
        position: 'absolute',
        bottom: 10,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0,230,118,0.4)',
    },
    camAiBadgeText: {
        color: '#00E676',
        fontSize: 11,
        fontWeight: 'bold',
    },
    camBottomOverlay: {
        flex: 1.4,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'flex-end',
        paddingHorizontal: SIZES.padding,
        paddingBottom: 30,
        gap: 12,
    },
    camBottomLabel: {
        color: '#BBBBBB',
        fontSize: 12,
        textAlign: 'center',
    },
    bankPresetsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 8,
    },
    bankPresetBadge: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bankPresetText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    bankPresetSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 9,
        marginTop: 2,
    },
    successModalCard: {
        width: '100%',
        padding: 24,
        alignItems: 'center',
    },
    successIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 4,
    },
    successSubtitle: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 16,
    },
    successDetailsBox: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        padding: 14,
        gap: 8,
        marginBottom: 20,
    },
    successDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    successDetailLabel: {
        fontSize: 12,
    },
    successDetailValue: {
        fontSize: 13,
        fontWeight: '600',
    },
    successDetailTotal: {
        fontSize: 16,
        fontWeight: '900',
    },
    successBtnStack: {
        width: '100%',
        gap: 10,
    },
    continueShoppingBtn: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    continueShoppingText: {
        fontSize: 14,
        fontWeight: '700',
    },
    bankSelectSection: {
        marginBottom: 14,
    },
    bankSelectTitle: {
        fontSize: 11,
        marginBottom: 6,
        fontWeight: '600',
    },
    qrCenterWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    qrImageFrameLarge: {
        backgroundColor: '#FFFFFF',
        padding: 10,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    vietQrImageLarge: {
        width: 170,
        height: 170,
    },
    qrExpandBadge: {
        position: 'absolute',
        bottom: 6,
        backgroundColor: 'rgba(0,0,0,0.75)',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    qrExpandText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    qrScanHintText: {
        fontSize: 11,
        textAlign: 'center',
        marginTop: 10,
        lineHeight: 16,
        paddingHorizontal: 10,
    },
    successQrBox: {
        width: '100%',
        borderRadius: 14,
        borderWidth: 1.5,
        padding: 12,
        alignItems: 'center',
        marginBottom: 16,
    },
    successQrTitle: {
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 8,
        textAlign: 'center',
    },
    successQrWhiteFrame: {
        backgroundColor: '#FFFFFF',
        padding: 8,
        borderRadius: 12,
        marginBottom: 8,
    },
    successQrMemo: {
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    qrPreviewModalCard: {
        width: '100%',
        maxWidth: 360,
        padding: 20,
        alignItems: 'center',
    },
    qrPreviewCenterBox: {
        alignItems: 'center',
        width: '100%',
        marginVertical: 12,
    },
    qrWhiteFrameLarge: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 16,
        marginBottom: 12,
        elevation: 8,
    },
    qrPreviewBankText: {
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 4,
    },
    qrPreviewAmountText: {
        fontSize: 20,
        fontWeight: '900',
        marginBottom: 4,
    },
    qrPreviewMemoText: {
        fontSize: 12,
        textAlign: 'center',
    },
});

export default CheckoutScreen;
