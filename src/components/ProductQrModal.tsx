// src/components/ProductQrModal.tsx
import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Product } from '../types/product.schema';
import { getProductQrUrl } from '@utils/qrHelper';
import { COLORS, SIZES, COSMIC_THEME } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import { hapticLight, hapticSuccess } from '@utils/haptics';

const { width } = Dimensions.get('window');
const QR_SIZE = Math.min(width * 0.65, 260);

interface Props {
    visible: boolean;
    product: Product | null;
    onClose: () => void;
    onViewDetail?: () => void;
}

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

const ProductQrModal: React.FC<Props> = ({
    visible,
    product,
    onClose,
    onViewDetail,
}) => {
    const { isDarkMode } = useTheme();
    const [imageLoading, setImageLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    if (!visible || !product) return null;

    const qrUrl = getProductQrUrl(product.id, 450);
    const dynamicCardBg = isDarkMode ? '#13172E' : '#FFFFFF';
    const dynamicText = isDarkMode ? '#F8FAFC' : '#0F172A';
    const dynamicSubText = isDarkMode ? '#94A3B8' : '#64748B';
    const dynamicBorder = isDarkMode ? 'rgba(0, 245, 212, 0.35)' : 'rgba(0, 0, 0, 0.1)';

    const handleCopySku = () => {
        hapticSuccess();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        Alert.alert('Đã sao chép SKU', `Mã sản phẩm: ${product.id}\nBạn có thể dán vào ô tìm kiếm hoặc bộ quét mã.`);
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            statusBarTranslucent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View
                    style={[
                        styles.dialogContainer,
                        {
                            backgroundColor: dynamicCardBg,
                            borderColor: dynamicBorder,
                        },
                    ]}
                >
                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            <View
                                style={[
                                    styles.iconBox,
                                    { backgroundColor: isDarkMode ? 'rgba(0, 245, 212, 0.15)' : 'rgba(2, 132, 199, 0.1)' },
                                ]}
                            >
                                <Icon
                                    name="qrcode-scan"
                                    size={20}
                                    color={isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary}
                                />
                            </View>
                            <Text style={[styles.dialogTitle, { color: dynamicText }]}>
                                Mã QR Sản Phẩm
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.closeBtn}
                            onPress={() => {
                                hapticLight();
                                onClose();
                            }}
                            hitSlop={10}
                        >
                            <Icon name="close" size={20} color={dynamicSubText} />
                        </TouchableOpacity>
                    </View>

                    {/* Product Summary */}
                    <View
                        style={[
                            styles.productSummaryBox,
                            {
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : '#F8FAFC',
                                borderColor: dynamicBorder,
                            },
                        ]}
                    >
                        <Image source={{ uri: product.image }} style={styles.productThumb} resizeMode="cover" />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={[styles.productName, { color: dynamicText }]} numberOfLines={2}>
                                {product.name}
                            </Text>
                            <Text
                                style={[
                                    styles.productPrice,
                                    { color: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary },
                                ]}
                            >
                                {formatCurrency(product.price)}
                            </Text>
                            <View style={styles.skuRow}>
                                <Text style={[styles.skuBadge, { color: dynamicSubText }]}>
                                    SKU: <Text style={{ fontWeight: '700', color: dynamicText }}>{product.id}</Text>
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* QR Code Container */}
                    <View style={styles.qrContainer}>
                        <View style={styles.qrWhiteBox}>
                            <Image
                                source={{ uri: qrUrl }}
                                style={{ width: QR_SIZE, height: QR_SIZE }}
                                resizeMode="contain"
                                onLoadStart={() => setImageLoading(true)}
                                onLoadEnd={() => setImageLoading(false)}
                            />
                            {imageLoading && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator
                                        size="large"
                                        color={isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary}
                                    />
                                    <Text style={styles.loadingText}>Đang tạo mã QR...</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.qrHint, { color: dynamicSubText }]}>
                            Quét mã này bằng chức năng Quét QR ở đầu trang chủ để mở chi tiết tức thì.
                        </Text>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtonsRow}>
                        <TouchableOpacity
                            style={[
                                styles.actionBtn,
                                {
                                    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#F1F5F9',
                                    borderColor: dynamicBorder,
                                },
                            ]}
                            onPress={handleCopySku}
                        >
                            <Icon
                                name={copied ? 'check' : 'content-copy'}
                                size={16}
                                color={copied ? '#10B981' : dynamicText}
                            />
                            <Text style={[styles.actionBtnText, { color: dynamicText }]}>
                                {copied ? 'Đã sao chép' : 'Chép SKU'}
                            </Text>
                        </TouchableOpacity>

                        {onViewDetail && (
                            <TouchableOpacity
                                style={[
                                    styles.actionBtn,
                                    styles.primaryBtn,
                                    {
                                        backgroundColor: isDarkMode ? COSMIC_THEME.neonCyan : COLORS.primary,
                                    },
                                ]}
                                onPress={() => {
                                    hapticLight();
                                    onClose();
                                    onViewDetail();
                                }}
                            >
                                <Icon
                                    name="arrow-right-circle"
                                    size={16}
                                    color={isDarkMode ? '#050716' : '#FFFFFF'}
                                />
                                <Text
                                    style={[
                                        styles.actionBtnText,
                                        {
                                            color: isDarkMode ? '#050716' : '#FFFFFF',
                                            fontWeight: '700',
                                        },
                                    ]}
                                >
                                    Xem chi tiết
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: SIZES.padding,
    },
    dialogContainer: {
        width: '100%',
        maxWidth: 380,
        borderRadius: 24,
        padding: 20,
        borderWidth: 1.5,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 18,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconBox: {
        width: 34,
        height: 34,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dialogTitle: {
        fontSize: 16,
        fontWeight: '800',
    },
    closeBtn: {
        padding: 6,
    },
    productSummaryBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 14,
        borderWidth: 1,
        marginBottom: 16,
    },
    productThumb: {
        width: 52,
        height: 52,
        borderRadius: 10,
    },
    productName: {
        fontSize: 13,
        fontWeight: '700',
        lineHeight: 18,
    },
    productPrice: {
        fontSize: 14,
        fontWeight: '800',
        marginTop: 2,
    },
    skuRow: {
        marginTop: 2,
    },
    skuBadge: {
        fontSize: 11,
    },
    qrContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 18,
    },
    qrWhiteBox: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    loadingText: {
        fontSize: 11,
        color: '#334155',
        fontWeight: '600',
    },
    qrHint: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 12,
        lineHeight: 17,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 10,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 44,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    primaryBtn: {
        borderWidth: 0,
    },
    actionBtnText: {
        fontSize: 13,
        fontWeight: '600',
    },
});

export default ProductQrModal;
