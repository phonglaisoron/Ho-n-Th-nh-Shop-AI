import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Image,
    Linking,
    Modal,
    PermissionsAndroid,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import jsQR from 'jsqr';
import { scanNitroImage } from '@utils/qrScannerEngine';
import { COLORS, SIZES } from '@constants/theme';
import { hapticLight, hapticSuccess } from '@utils/haptics';
import { parseScannedProductCode, getProductQrUrl } from '@utils/qrHelper';
import { MOCK_PRODUCTS } from '@data/mockProducts';

const { width } = Dimensions.get('window');
const SCAN_BOX_SIZE = width * 0.72;

// Tải an toàn module Camera Native (VisionCamera v5)
let VisionCameraModule: any = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    VisionCameraModule = require('react-native-vision-camera');
} catch {
    VisionCameraModule = null;
}

// 1. Component Camera cho iOS (hỗ trợ useObjectOutput quét mã vạch trực tiếp từ phần cứng Apple ở 60 FPS)
const IOSCameraView = ({
    navigation,
    visionCamera,
    torchOn,
    device,
    isFocused,
    onScanSuccess,
}: {
    navigation: any;
    visionCamera: any;
    torchOn: boolean;
    device: any;
    isFocused: boolean;
    onScanSuccess: (code: string) => void;
}) => {
    const { Camera, useObjectOutput, isScannedCode } = visionCamera;
    const isScanning = useRef(false);

    const handleObjectsScanned = useCallback(
        (objects: any[]) => {
            if (isScanning.current) return;
            if (!objects || objects.length === 0) return;

            const first = objects[0];
            const value = isScannedCode ? (isScannedCode(first) ? first.value : first?.value) : first?.value;
            if (!value) return;

            isScanning.current = true;
            onScanSuccess(value);
        },
        [isScannedCode, onScanSuccess],
    );

    const objectOutput = useObjectOutput({
        types: ['qr', 'ean-13', 'code-128'],
        onObjectsScanned: handleObjectsScanned,
    });

    return (
        <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isFocused}
            torch={torchOn ? 'on' : 'off'}
            enableNativeTapToFocusGesture={true}
            enableNativeZoomGesture={true}
            outputs={[objectOutput]}
        />
    );
};

// 1.1 Component Camera cho Android (Quét đa tầng chuẩn ngân hàng: Tự động lấy nét, 120ms cycle, chống lóa)
const AndroidCameraView = ({
    visionCamera,
    torchOn,
    device,
    isFocused,
    onScanSuccess,
    triggerScanRef,
    onScanningStateChange,
}: {
    visionCamera: any;
    torchOn: boolean;
    device: any;
    isFocused: boolean;
    onScanSuccess: (code: string) => void;
    triggerScanRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
    onScanningStateChange?: (scanning: boolean) => void;
}) => {
    const { Camera, usePhotoOutput } = visionCamera;
    const cameraRef = useRef<any>(null);
    const isScanningRef = useRef(false);
    const isProcessingRef = useRef(false);

    const photoConfig = React.useMemo(() => ({
        targetResolution: { width: 1280, height: 960 },
        quality: 0.85,
        qualityPrioritization: 'balanced' as const,
    }), []);

    const photoOutput = usePhotoOutput
        ? usePhotoOutput(photoConfig)
        : null;

    // Tự động mở lại khả năng quét khi màn hình được focus
    useEffect(() => {
        if (isFocused) {
            isScanningRef.current = false;
        }
    }, [isFocused]);

    const scanCurrentFrame = useCallback(async (isManualTrigger = false): Promise<boolean> => {
        if (!isFocused || isScanningRef.current || isProcessingRef.current) {
            return false;
        }

        try {
            isProcessingRef.current = true;
            if (isManualTrigger) {
                onScanningStateChange?.(true);
            }

            const startTime = Date.now();
            let image: any = null;

            // 1. Ưu tiên hàng đầu: Chụp snapshot trực tiếp từ Preview TextureView (1-3ms, không khóa AE/AF phần cứng)
            if (cameraRef.current?.takeSnapshot) {
                try {
                    image = await cameraRef.current.takeSnapshot();
                } catch {
                    image = null;
                }
            }

            // 2. Dự phòng: Capture photo với timeout 1000ms để không bao giờ bị nghẽn camera
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

            // Quét đa tầng chuẩn ngân hàng: Cắt 1:1 tâm khung ngắm -> Toàn ảnh -> Xoay -> Chống lóa
            const decoded = await scanNitroImage(image, { cropFactor: 0.72 });
            image.dispose?.();
            const duration = Date.now() - startTime;

            if (decoded) {
                console.log(`🎉 [ShopAI Bank-Grade QR Scanned in ${duration}ms]:`, decoded);
                isScanningRef.current = true;
                onScanSuccess(decoded);
                return true;
            }
        } catch (err: any) {
            console.warn('⚠️ [Camera Scan Error]:', err?.message || err);
        } finally {
            isProcessingRef.current = false;
            if (isManualTrigger) {
                onScanningStateChange?.(false);
            }
        }

        return false;
    }, [photoOutput, isFocused, onScanSuccess, onScanningStateChange]);

    // Gắn hàm quét thủ công vào ref
    useEffect(() => {
        if (triggerScanRef) {
            triggerScanRef.current = () => scanCurrentFrame(true);
        }
        return () => {
            if (triggerScanRef) triggerScanRef.current = null;
        };
    }, [triggerScanRef, scanCurrentFrame]);

    // Chu kỳ quét tự động siêu mượt 100ms (tức thì như app ngân hàng khi lướt qua mã)
    useEffect(() => {
        if (!isFocused) return;

        let isMounted = true;
        let timer: any = null;

        const loop = async () => {
            if (!isMounted || !isFocused || isScanningRef.current) return;
            try {
                const found = await scanCurrentFrame(false);
                if (found) return;
            } catch (e) {
                // Tiếp tục quét
            }
            if (isMounted && isFocused && !isScanningRef.current) {
                timer = setTimeout(loop, 100);
            }
        };

        // Bắt đầu quét ngay sau 150ms khi camera sẵn sàng
        timer = setTimeout(loop, 150);

        return () => {
            isMounted = false;
            if (timer) clearTimeout(timer);
        };
    }, [isFocused, scanCurrentFrame]);

    return (
        <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isFocused}
            torch={torchOn ? 'on' : 'off'}
            enableNativeTapToFocusGesture={true}
            enableNativeZoomGesture={true}
            implementationMode="compatible"
            outputs={photoOutput ? [photoOutput] : []}
        />
    );
};

// 1.2 Component Camera thực tế
const RealCameraView = ({
    navigation,
    visionCamera,
    torchOn,
    onScanSuccess,
    triggerScanRef,
    onScanningStateChange,
}: {
    navigation: any;
    visionCamera: any;
    torchOn: boolean;
    onScanSuccess: (code: string) => void;
    triggerScanRef?: React.MutableRefObject<(() => Promise<boolean>) | null>;
    onScanningStateChange?: (scanning: boolean) => void;
}) => {
    const { useCameraDevice, useCameraPermission } = visionCamera;
    const { hasPermission, requestPermission, status } = useCameraPermission();
    const backDevice = useCameraDevice('back');
    const frontDevice = useCameraDevice('front');
    const device = backDevice || frontDevice;
    const isFocused = useIsFocused();

    console.log('📷 [RealCameraView]', {
        backDevice: !!backDevice,
        frontDevice: !!frontDevice,
        device: device ? `${device.position} (${device.id})` : null,
        hasPermission,
        status,
        isFocused,
    });

    useEffect(() => {
        if (!hasPermission && status === 'not-determined') {
            requestPermission();
        }
    }, [hasPermission, status, requestPermission]);

    if (device == null || !hasPermission) {
        console.log('⚠️ [RealCameraView] Early return null because:', { noDevice: device == null, noPerm: !hasPermission });
        return null;
    }

    if (Platform.OS === 'ios' && visionCamera.useObjectOutput) {
        return (
            <IOSCameraView
                navigation={navigation}
                visionCamera={visionCamera}
                torchOn={torchOn}
                device={device}
                isFocused={isFocused}
                onScanSuccess={onScanSuccess}
            />
        );
    }

    return (
        <AndroidCameraView
            visionCamera={visionCamera}
            torchOn={torchOn}
            device={device}
            isFocused={isFocused}
            onScanSuccess={onScanSuccess}
            triggerScanRef={triggerScanRef}
            onScanningStateChange={onScanningStateChange}
        />
    );
};

// Danh sách sản phẩm mẫu để người dùng thử nghiệm nhanh
const SAMPLE_QUICK_PRODUCTS = [
    { id: 'prod_0', name: 'iPhone 15 Pro Max', icon: 'cellphone' },
    { id: 'prod_1', name: 'Galaxy S24 Ultra', icon: 'cellphone' },
    { id: 'prod_2', name: 'MacBook Air M3', icon: 'laptop' },
    { id: 'prod_3', name: 'AirPods Pro 2', icon: 'headphones' },
];

export const ScannerScreen = ({ navigation }: any) => {
    const [torchOn, setTorchOn] = useState(false);
    const [manualCode, setManualCode] = useState('');
    const [hasAndroidPermission, setHasAndroidPermission] = useState(true);
    const [isScanningActive, setIsScanningActive] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showSampleModal, setShowSampleModal] = useState(false);
    const isScanning = useRef(false);
    const triggerScanRef = useRef<(() => Promise<boolean>) | null>(null);

    // Hoạt ảnh tia Laser quét
    const laserAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
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
            ]),
        );
        loopAnim.start();

        return () => loopAnim.stop();
    }, [laserAnim]);

    // Yêu cầu quyền truy cập Camera trên Android
    useEffect(() => {
        if (Platform.OS === 'android') {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA).then((result) => {
                setHasAndroidPermission(result === PermissionsAndroid.RESULTS.GRANTED);
            });
        } else {
            setHasAndroidPermission(true);
        }
    }, []);

    const handleGoBack = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        } else {
            navigation.navigate('RootDrawer', { screen: 'ShopAI' });
        }
    }, [navigation]);

    // Tự động mở lại khả năng quét khi màn hình được quay lại
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            isScanning.current = false;
        });
        return unsubscribe;
    }, [navigation]);

    // Xử lý mã quét thành công
    const onScanSuccess = useCallback((rawCode: string) => {
        if (isScanning.current) return;
        isScanning.current = true;
        hapticSuccess();

        const code = rawCode.trim();
        console.log('🎯 [Scanner Triggered]:', code);

        const productId = parseScannedProductCode(code);

        if (productId) {
            // Là sản phẩm ShopAI -> Điều hướng an toàn bằng navigate để giữ lịch sử quay lại
            navigation.navigate('ProductDetail', { productId, autoOpenQr: false });
        } else if (code.startsWith('http://') || code.startsWith('https://')) {
            // Là đường link web
            Alert.alert(
                '🌐 Đã tìm thấy liên kết web',
                `Liên kết: ${code}\n\nBạn có muốn mở trang web này trong trình duyệt không?`,
                [
                    {
                        text: 'Quét tiếp',
                        style: 'cancel',
                        onPress: () => {
                            isScanning.current = false;
                        },
                    },
                    {
                        text: 'Mở liên kết',
                        onPress: () => {
                            Linking.openURL(code).catch(() => {});
                            isScanning.current = false;
                        },
                    },
                ]
            );
        } else if (code.includes('000201') || code.includes('QRIBFTTA') || code.includes('Vietcombank') || code.length > 25) {
            // Mã VietQR / Thanh toán ngân hàng
            Alert.alert(
                '💳 Đã nhận diện mã VietQR Ngân hàng',
                `Đã đọc thành công mã QR thanh toán!\n\nNội dung mã:\n${code.substring(0, 90)}...`,
                [
                    {
                        text: 'Quét tiếp',
                        style: 'cancel',
                        onPress: () => {
                            isScanning.current = false;
                        },
                    },
                    {
                        text: 'Vào giỏ hàng thanh toán',
                        onPress: () => navigation.navigate('Cart'),
                    },
                ]
            );
        } else {
            // Mã voucher hoặc chuỗi khác
            Alert.alert(
                '📦 Mã đã quét thành công',
                `Nội dung: ${code}`,
                [
                    {
                        text: 'Quét tiếp',
                        onPress: () => {
                            isScanning.current = false;
                        },
                    },
                    {
                        text: 'Về Trang chủ',
                        onPress: () => handleGoBack(),
                    },
                ]
            );
        }
    }, [navigation, handleGoBack]);

    // Bấm nút "Chụp & Quét ngay" thủ công
    const handleManualSnap = async () => {
        hapticLight();
        if (triggerScanRef.current) {
            setIsAnalyzing(true);
            const found = await triggerScanRef.current();
            setIsAnalyzing(false);
            if (!found) {
                Alert.alert(
                    '🔍 Chưa đọc được mã QR',
                    'Hãy giữ camera vuông góc với mã QR, giữ khoảng cách 15-20cm hoặc chạm nút chọn sản phẩm mẫu bên dưới để xem ngay chi tiết!',
                    [{ text: 'Đã hiểu' }]
                );
            }
        } else {
            Alert.alert('Thông báo', 'Camera đang khởi tạo, vui lòng thử lại sau giây lát!');
        }
    };

    return (
        <View style={styles.container}>
            {/* Lớp hiển thị luồng Camera */}
            {VisionCameraModule && hasAndroidPermission && isScanningActive && (
                <RealCameraView
                    navigation={navigation}
                    visionCamera={VisionCameraModule}
                    torchOn={torchOn}
                    onScanSuccess={onScanSuccess}
                    triggerScanRef={triggerScanRef}
                    onScanningStateChange={setIsAnalyzing}
                />
            )}

            {/* Lớp nền tối mờ phía trên */}
            <View style={styles.topOverlay}>
                <View style={styles.headerBar}>
                    <TouchableOpacity
                        style={styles.circleButton}
                        onPress={handleGoBack}
                    >
                        <Icon name="arrow-left" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Quét mã QR / Barcode</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            style={[styles.circleButton, torchOn && { backgroundColor: '#FFD700' }]}
                            onPress={() => setTorchOn(!torchOn)}
                        >
                            <Icon
                                name={torchOn ? 'flashlight' : 'flashlight-off'}
                                size={22}
                                color={torchOn ? '#000000' : '#FFFFFF'}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <Text style={styles.hintText}>
                    Căn chỉnh mã QR hoặc mã vạch vào giữa khung ngắm để tự động nhận diện
                </Text>
            </View>

            {/* Khung ngắm quét mã + Tia Laser */}
            <View style={styles.middleRow}>
                <View style={styles.sideOverlay} />
                <View style={styles.scannerBox}>
                    {/* 4 Góc khung quét */}
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />

                    {/* Tia laser quét */}
                    <Animated.View
                        style={[
                            styles.laserLine,
                            { transform: [{ translateY: laserAnim }] },
                        ]}
                    />

                    {/* Huy hiệu quét */}
                    <View style={styles.aiBadge}>
                        <Icon name="qrcode-scan" size={14} color="#00F5D4" />
                        <Text style={styles.aiBadgeText}>
                            {isAnalyzing ? 'Đang phân tích...' : 'AI Auto-Scan 60FPS'}
                        </Text>
                    </View>
                </View>
                <View style={styles.sideOverlay} />
            </View>

            {/* Khu vực điều khiển dưới cùng: Nút chụp quét ngay + Nhập tay + Chọn nhanh */}
            <View style={styles.bottomOverlay}>
                {/* NÚT CHỤP & QUÉT TỨC THÌ (MANUAL SHUTTER TRIGGER) */}
                <View style={styles.snapRow}>
                    <TouchableOpacity
                        style={[styles.snapButton, isAnalyzing && { opacity: 0.7 }]}
                        activeOpacity={0.8}
                        onPress={handleManualSnap}
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? (
                            <ActivityIndicator size="small" color="#050716" style={{ marginRight: 8 }} />
                        ) : (
                            <Icon name="camera" size={20} color="#050716" style={{ marginRight: 8 }} />
                        )}
                        <Text style={styles.snapButtonText}>
                            {isAnalyzing ? 'Đang quét ảnh...' : '📸 Chụp & Quét ngay'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.galleryButton}
                        activeOpacity={0.8}
                        onPress={() => setShowSampleModal(true)}
                    >
                        <Icon name="image-multiple-outline" size={20} color="#00F5D4" />
                        <Text style={styles.galleryButtonText}>Chọn mã QR</Text>
                    </TouchableOpacity>
                </View>

                {/* Hướng dẫn khi quét qua webcam / màn hình */}
                <View style={styles.tipCard}>
                    <Icon name="lightbulb-on-outline" size={15} color="#00F5D4" style={{ marginRight: 6, marginTop: 1 }} />
                    <Text style={styles.tipCardText}>
                        <Text style={{ fontWeight: '700', color: '#00F5D4' }}>Mẹo quét camera:</Text> Giữ điện thoại cách 15-20cm, giảm nhẹ độ sáng màn hình để tránh lóa webcam.
                    </Text>
                </View>

                {/* Thanh test nhanh mã mẫu cho máy ảo / không có camera */}
                <View style={styles.quickScanSection}>
                    <Text style={styles.quickScanLabel}>Hoặc chọn nhanh sản phẩm để xem chi tiết:</Text>
                    <View style={styles.quickButtonsRow}>
                        {SAMPLE_QUICK_PRODUCTS.map((prod) => (
                            <TouchableOpacity
                                key={prod.id}
                                style={styles.quickBadge}
                                onPress={() => onScanSuccess(prod.id)}
                            >
                                <Icon name={prod.icon} size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
                                <Text style={styles.quickBadgeText} numberOfLines={1}>{prod.name.split(' ')[0]}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Nhập mã thủ công */}
                <View style={styles.manualInputRow}>
                    <TextInput
                        style={styles.textInput}
                        placeholder="Nhập mã SKU (vd: prod_3, prod_0)..."
                        placeholderTextColor="#888888"
                        value={manualCode}
                        onChangeText={setManualCode}
                        autoCapitalize="none"
                    />
                    <TouchableOpacity
                        style={[
                            styles.confirmButton,
                            { opacity: manualCode.trim().length > 0 ? 1 : 0.5 },
                        ]}
                        disabled={manualCode.trim().length === 0}
                        onPress={() => onScanSuccess(manualCode.trim())}
                    >
                        <Text style={styles.confirmButtonText}>Xác nhận</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* MODAL DANH SÁCH MÃ QR SẢN PHẨM MẪU (DÀNH CHO MÁY ẢO / TEST NHANH) */}
            <Modal
                visible={showSampleModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowSampleModal(false)}
            >
                <View style={styles.sampleModalBackdrop}>
                    <TouchableOpacity
                        style={StyleSheet.absoluteFill}
                        activeOpacity={1}
                        onPress={() => setShowSampleModal(false)}
                    />
                    <View style={styles.sampleModalCard}>
                        <View style={styles.sampleModalHeader}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Icon name="qrcode-scan" size={22} color="#00F5D4" />
                                <Text style={styles.sampleModalTitle}>Danh Sách Mã QR Sản Phẩm</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setShowSampleModal(false)}
                                style={styles.sampleCloseBtn}
                            >
                                <Icon name="close" size={20} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.sampleModalSub}>
                            Chạm vào bất kỳ sản phẩm nào để mô phỏng quét tức thì:
                        </Text>

                        <View style={{ gap: 10, marginTop: 10 }}>
                            {/* Mã VietQR Ngân Hàng mẫu */}
                            <TouchableOpacity
                                style={[styles.sampleItemRow, { borderColor: '#10B981', borderWidth: 1 }]}
                                onPress={() => {
                                    setShowSampleModal(false);
                                    onScanSuccess('00020101021238580010A00000072701280006970436011410390951650208QRIBFTTA52045999530370454061000005802VN62160812DH171243162663047D32');
                                }}
                            >
                                <View style={[styles.sampleThumb, { backgroundColor: '#006838', alignItems: 'center', justifyContent: 'center' }]}>
                                    <Icon name="bank" size={24} color="#FFF" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.sampleItemName} numberOfLines={1}>VietQR Vietcombank (Thanh toán)</Text>
                                    <Text style={styles.sampleItemSku}>Mã chuẩn EMVCo Ngân hàng</Text>
                                </View>
                                <View style={[styles.sampleScanBtnBadge, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                                    <Icon name="qrcode-scan" size={16} color="#10B981" />
                                    <Text style={[styles.sampleScanBtnText, { color: '#10B981' }]}>Quét VietQR</Text>
                                </View>
                            </TouchableOpacity>

                            {MOCK_PRODUCTS.slice(0, 5).map((p) => (
                                <TouchableOpacity
                                    key={p.id}
                                    style={styles.sampleItemRow}
                                    onPress={() => {
                                        setShowSampleModal(false);
                                        onScanSuccess(p.id);
                                    }}
                                >
                                    <Image source={{ uri: p.image }} style={styles.sampleThumb} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.sampleItemName} numberOfLines={1}>{p.name}</Text>
                                        <Text style={styles.sampleItemSku}>Mã SKU: <Text style={{ color: '#00F5D4', fontWeight: '700' }}>{p.id}</Text></Text>
                                    </View>
                                    <View style={styles.sampleScanBtnBadge}>
                                        <Icon name="check-circle-outline" size={16} color="#00F5D4" />
                                        <Text style={styles.sampleScanBtnText}>Xem ngay</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    topOverlay: {
        backgroundColor: 'rgba(0,0,0,0.70)',
        justifyContent: 'space-between',
        paddingHorizontal: SIZES.padding,
        paddingTop: Platform.OS === 'ios' ? 50 : 36,
        paddingBottom: 16,
    },
    headerBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    circleButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    hintText: {
        color: '#E2E8F0',
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    middleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: SCAN_BOX_SIZE,
    },
    sideOverlay: {
        flex: 1,
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.70)',
    },
    scannerBox: {
        width: SCAN_BOX_SIZE,
        height: SCAN_BOX_SIZE,
        position: 'relative',
        borderWidth: 1.5,
        borderColor: 'rgba(0, 245, 212, 0.4)',
        backgroundColor: 'transparent',
    },
    corner: {
        position: 'absolute',
        width: 24,
        height: 24,
        borderColor: '#00F5D4',
    },
    cornerTL: {
        top: -2,
        left: -2,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    cornerTR: {
        top: -2,
        right: -2,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    cornerBL: {
        bottom: -2,
        left: -2,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    cornerBR: {
        bottom: -2,
        right: -2,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    laserLine: {
        width: '100%',
        height: 3,
        backgroundColor: '#00F5D4',
        shadowColor: '#00F5D4',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 8,
        elevation: 6,
    },
    aiBadge: {
        position: 'absolute',
        bottom: 8,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 245, 212, 0.35)',
        gap: 5,
    },
    aiBadgeText: {
        color: '#00F5D4',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    bottomOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.70)',
        paddingHorizontal: SIZES.padding,
        paddingTop: 14,
        paddingBottom: Platform.OS === 'ios' ? 36 : 24,
        justifyContent: 'space-between',
    },
    snapRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    snapButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00F5D4',
        height: 46,
        borderRadius: 23,
        shadowColor: '#00F5D4',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 5,
    },
    snapButtonText: {
        color: '#050716',
        fontSize: 14,
        fontWeight: '900',
    },
    galleryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 245, 212, 0.15)',
        borderColor: 'rgba(0, 245, 212, 0.40)',
        borderWidth: 1,
        height: 46,
        paddingHorizontal: 14,
        borderRadius: 23,
        gap: 6,
    },
    galleryButtonText: {
        color: '#00F5D4',
        fontSize: 12,
        fontWeight: '700',
    },
    tipCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: 'rgba(0, 245, 212, 0.10)',
        borderColor: 'rgba(0, 245, 212, 0.25)',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 7,
        marginBottom: 6,
    },
    tipCardText: {
        color: '#CBD5E1',
        fontSize: 11,
        flex: 1,
        lineHeight: 16,
    },
    quickScanSection: {
        marginBottom: 8,
    },
    quickScanLabel: {
        color: '#94A3B8',
        fontSize: 11,
        fontWeight: '700',
        marginBottom: 6,
    },
    quickButtonsRow: {
        flexDirection: 'row',
        gap: 8,
    },
    quickBadge: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderColor: 'rgba(255, 255, 255, 0.25)',
        borderWidth: 1,
        borderRadius: 10,
        paddingVertical: 7,
        paddingHorizontal: 4,
    },
    quickBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },
    manualInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.10)',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.20)',
        paddingHorizontal: 10,
        height: 44,
    },
    textInput: {
        flex: 1,
        color: '#FFFFFF',
        fontSize: 12,
        paddingVertical: 0,
    },
    confirmButton: {
        backgroundColor: '#00F5D4',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    confirmButtonText: {
        color: '#050716',
        fontSize: 12,
        fontWeight: '800',
    },
    sampleModalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.80)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    sampleModalCard: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#0B0F28',
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(0, 245, 212, 0.4)',
        padding: 18,
    },
    sampleModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    sampleModalTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
    },
    sampleCloseBtn: {
        padding: 4,
    },
    sampleModalSub: {
        color: '#94A3B8',
        fontSize: 12,
        marginBottom: 10,
    },
    sampleItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        borderRadius: 12,
        padding: 10,
        gap: 10,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    sampleThumb: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: '#1E293B',
    },
    sampleItemName: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700',
    },
    sampleItemSku: {
        color: '#64748B',
        fontSize: 11,
        marginTop: 2,
    },
    sampleScanBtnBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 245, 212, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    sampleScanBtnText: {
        color: '#00F5D4',
        fontSize: 11,
        fontWeight: '700',
    },
});

export default ScannerScreen;