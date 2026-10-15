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

// 1. Component Camera cho iOS (hỗ trợ useObjectOutput quét mã vạch trực tiếp từ phần cứng Apple)
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
            outputs={[objectOutput]}
        />
    );
};

// Cấu hình photoOutput chuẩn 640x480 tốc độ cao
const ANDROID_PHOTO_CONFIG = {
    targetResolution: { width: 640, height: 480 },
    quality: 0.85,
    qualityPrioritization: 'speed' as const,
};

// Chuẩn hóa bộ đệm ảnh sang RGBA cho jsQR
function normalizeToRgba(rawData: any): Uint8ClampedArray {
    const dataArray = new Uint8ClampedArray(rawData.buffer);
    if (rawData.pixelFormat === 'BGRA') {
        const rgba = new Uint8ClampedArray(rawData.buffer.byteLength);
        for (let i = 0; i < dataArray.length; i += 4) {
            rgba[i] = dataArray[i + 2];     // R
            rgba[i + 1] = dataArray[i + 1]; // G
            rgba[i + 2] = dataArray[i];     // B
            rgba[i + 3] = dataArray[i + 3]; // A
        }
        return rgba;
    }
    if (rawData.pixelFormat === 'ARGB') {
        const rgba = new Uint8ClampedArray(rawData.buffer.byteLength);
        for (let i = 0; i < dataArray.length; i += 4) {
            rgba[i] = dataArray[i + 1];     // R
            rgba[i + 1] = dataArray[i + 2]; // G
            rgba[i + 2] = dataArray[i + 3]; // B
            rgba[i + 3] = dataArray[i];     // A
        }
        return rgba;
    }
    if (rawData.pixelFormat === 'RGB') {
        const pixelCount = Math.round(rawData.width * rawData.height);
        const rgba = new Uint8ClampedArray(pixelCount * 4);
        for (let i = 0, j = 0; i < pixelCount; i++, j += 3) {
            const target = i * 4;
            rgba[target] = dataArray[j];
            rgba[target + 1] = dataArray[j + 1];
            rgba[target + 2] = dataArray[j + 2];
            rgba[target + 3] = 255;
        }
        return rgba;
    }
    return dataArray;
}

// Thuật toán giải mã QR đa tầng: Chống lóa màn hình điện thoại & webcam mờ
function decodeQrWithEnhancements(dataArray: Uint8ClampedArray, width: number, height: number): string | null {
    if (!dataArray || width <= 0 || height <= 0) return null;

    // 1. Quét thông thường (Standard jsQR)
    try {
        const res1 = jsQR(dataArray, width, height, { inversionAttempts: 'attemptBoth' });
        if (res1?.data && res1.data.trim().length > 0) return res1.data.trim();
    } catch {
        // bỏ qua nếu lỗi
    }

    const pixelCount = width * height;
    if (dataArray.length < pixelCount * 4) return null;

    // Trích xuất độ sáng (Luminance) để xử lý tương phản & lóa
    let minLum = 255;
    let maxLum = 0;
    let sumLum = 0;
    const lum = new Uint8ClampedArray(pixelCount);

    for (let i = 0, j = 0; i < pixelCount * 4; i += 4, j++) {
        const l = Math.round((dataArray[i] * 299 + dataArray[i + 1] * 587 + dataArray[i + 2] * 114) / 1000);
        lum[j] = l;
        if (l < minLum) minLum = l;
        if (l > maxLum) maxLum = l;
        sumLum += l;
    }

    const avgLum = Math.round(sumLum / pixelCount);
    const range = maxLum - minLum;

    // 2. Kéo dãn độ tương phản (Contrast Stretching)
    if (range > 15) {
        try {
            const stretched = new Uint8ClampedArray(pixelCount * 4);
            for (let j = 0, i = 0; j < pixelCount; j++, i += 4) {
                const val = Math.round(((lum[j] - minLum) * 255) / range);
                stretched[i] = val;
                stretched[i + 1] = val;
                stretched[i + 2] = val;
                stretched[i + 3] = 255;
            }
            const res2 = jsQR(stretched, width, height, { inversionAttempts: 'attemptBoth' });
            if (res2?.data && res2.data.trim().length > 0) return res2.data.trim();
        } catch {
            // bỏ qua
        }
    }

    // 3. Phân ngưỡng nhị phân đa tầng (Multi-level Adaptive Binary Thresholding)
    // Tối ưu đặc biệt khi quét màn hình điện thoại phát sáng hoặc bị chói webcam
    const thresholds = [
        avgLum,
        Math.round((minLum + maxLum) / 2),
        165, // Chống lóa màn hình sáng (Highlight threshold)
        195, // Màn hình cực sáng (Overexposed phone screen)
        95,  // Ánh sáng tối (Shadow threshold)
    ];

    const binarized = new Uint8ClampedArray(pixelCount * 4);
    for (const th of thresholds) {
        if (th <= 10 || th >= 245) continue;
        try {
            for (let j = 0, i = 0; j < pixelCount; j++, i += 4) {
                const val = lum[j] > th ? 255 : 0;
                binarized[i] = val;
                binarized[i + 1] = val;
                binarized[i + 2] = val;
                binarized[i + 3] = 255;
            }
            const resTh = jsQR(binarized, width, height, { inversionAttempts: 'attemptBoth' });
            if (resTh?.data && resTh.data.trim().length > 0) return resTh.data.trim();
        } catch {
            // bỏ qua
        }
    }

    return null;
}

// 1.1 Component Camera cho Android (Xử lý chu kỳ quét an toàn, tránh tràn bộ đệm Camera2)
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
    const isScanningRef = useRef(false);
    const isProcessingRef = useRef(false);

    const photoOutput = usePhotoOutput
        ? usePhotoOutput(ANDROID_PHOTO_CONFIG)
        : null;

    // Tự động mở lại khả năng quét khi màn hình được focus
    useEffect(() => {
        if (isFocused) {
            isScanningRef.current = false;
        }
    }, [isFocused]);

    const scanCurrentFrame = useCallback(async (isManualTrigger = false): Promise<boolean> => {
        if (!photoOutput || !isFocused || isScanningRef.current || isProcessingRef.current) {
            return false;
        }

        try {
            isProcessingRef.current = true;
            if (isManualTrigger) {
                onScanningStateChange?.(true);
            }

            const photo = await photoOutput.capturePhoto(
                {
                    flashMode: 'off',
                    enableShutterSound: false,
                },
                {}
            );

            if (!photo) {
                isProcessingRef.current = false;
                onScanningStateChange?.(false);
                return false;
            }

            const fullImage = await photo.toImageAsync();
            photo.dispose?.();
            if (!fullImage) {
                isProcessingRef.current = false;
                onScanningStateChange?.(false);
                return false;
            }

            // 1. Cắt vùng trung tâm (ROI 75%) để tập trung vào mã QR bên trong khung ngắm
            const cropW = Math.round(fullImage.width * 0.75);
            const cropH = Math.round(fullImage.height * 0.75);
            const startX = Math.round((fullImage.width - cropW) / 2);
            const startY = Math.round((fullImage.height - cropH) / 2);
            const endX = startX + cropW;
            const endY = startY + cropH;

            let scanImage: any = null;
            try {
                scanImage = fullImage.crop(startX, startY, endX, endY);
            } catch {
                scanImage = fullImage;
            }

            // 2. RESIZE VỀ ĐỘ PHÂN GIẢI CHUẨN 480px ĐỂ jsQR CHẠY SIÊU TỐC (<15ms), KHÔNG LÀM ĐƠ MÁY
            const TARGET_WIDTH = 480;
            const scale = Math.min(TARGET_WIDTH / scanImage.width, 1);
            const targetW = Math.max(120, Math.round(scanImage.width * scale));
            const targetH = Math.max(120, Math.round(scanImage.height * scale));

            let smallImage: any = null;
            try {
                smallImage = scanImage.resize ? scanImage.resize(targetW, targetH) : await scanImage.resizeAsync(targetW, targetH);
            } catch {
                smallImage = scanImage;
            }

            // Bước 1: Quét trên ảnh cắt trung tâm đã resize
            let decoded: string | null = null;
            try {
                const rawCropped = smallImage.toRawPixelData ? smallImage.toRawPixelData() : await smallImage.toRawPixelDataAsync();
                if (rawCropped && rawCropped.buffer) {
                    const dataArray = normalizeToRgba(rawCropped);
                    decoded = decodeQrWithEnhancements(dataArray, Math.round(rawCropped.width), Math.round(rawCropped.height));
                }
            } catch (e) {
                console.warn('Cropped scan failed:', e);
            }

            // Bước 2: Nếu ảnh cắt chưa thấy, quét tiếp trên ảnh toàn khung hình (cũng resize về 480px để giữ hiệu năng siêu mượt)
            if (!decoded && scanImage !== fullImage) {
                try {
                    const fullScale = Math.min(TARGET_WIDTH / fullImage.width, 1);
                    const fullW = Math.max(120, Math.round(fullImage.width * fullScale));
                    const fullH = Math.max(120, Math.round(fullImage.height * fullScale));

                    let smallFull: any = null;
                    try {
                        smallFull = fullImage.resize ? fullImage.resize(fullW, fullH) : await fullImage.resizeAsync(fullW, fullH);
                    } catch {
                        smallFull = fullImage;
                    }

                    const rawFull = smallFull.toRawPixelData ? smallFull.toRawPixelData() : await smallFull.toRawPixelDataAsync();
                    if (rawFull && rawFull.buffer) {
                        const dataArray = normalizeToRgba(rawFull);
                        decoded = decodeQrWithEnhancements(dataArray, Math.round(rawFull.width), Math.round(rawFull.height));
                    }
                    if (smallFull && smallFull !== fullImage) {
                        smallFull.dispose?.();
                    }
                } catch (e) {
                    console.warn('Full image scan failed:', e);
                }
            }

            if (smallImage && smallImage !== scanImage) {
                smallImage.dispose?.();
            }
            if (scanImage && scanImage !== fullImage) {
                scanImage.dispose?.();
            }
            fullImage.dispose?.();

            if (decoded) {
                console.log('🎉 [ShopAI QR Auto-Scan Success]:', decoded);
                isScanningRef.current = true;
                onScanSuccess(decoded);
                onScanningStateChange?.(false);
                return true;
            }
        } catch (err: any) {
            console.warn('⚠️ [Camera Scan Warning]:', err?.message || err);
        } finally {
            isProcessingRef.current = false;
            onScanningStateChange?.(false);
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

    // Chu kỳ quét tự động an toàn (Sequential loop - chống nghẽn camera)
    useEffect(() => {
        if (!isFocused || !photoOutput) return;

        let isMounted = true;
        let timer: any = null;

        const loop = async () => {
            if (!isMounted || !isFocused || isScanningRef.current) return;
            try {
                await scanCurrentFrame(false);
            } catch (e) {
                console.warn('Scan frame error:', e);
            }
            if (isMounted && isFocused && !isScanningRef.current) {
                timer = setTimeout(loop, 800);
            }
        };

        // Bắt đầu chu kỳ quét đầu tiên sau 600ms
        timer = setTimeout(loop, 600);

        return () => {
            isMounted = false;
            if (timer) clearTimeout(timer);
        };
    }, [isFocused, photoOutput, scanCurrentFrame]);

    return (
        <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={isFocused}
            torch={torchOn ? 'on' : 'off'}
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

    useEffect(() => {
        if (!hasPermission && status === 'not-determined') {
            requestPermission();
        }
    }, [hasPermission, status, requestPermission]);

    if (device == null || !hasPermission) {
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
    const [hasAndroidPermission, setHasAndroidPermission] = useState(false);
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