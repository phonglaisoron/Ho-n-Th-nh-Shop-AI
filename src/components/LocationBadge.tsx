import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCurrentLocation } from '@hooks/useCurrentLocation';
import {
    DEFAULT_SHIPPING_FEE,
    WAREHOUSE_COORDS,
    getDistanceKm,
    getShippingTier,
} from '@constants/shipping';
import { COLORS, SIZES, IOS26_COLORS } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { hapticLight } from '@utils/haptics';

const formatVnd = (value: number) => `${value.toLocaleString('vi-VN')}đ`;

const LocationBadge = () => {
    const { coords, loading, error, refresh } = useCurrentLocation();
    const { isDarkMode } = useTheme();

    const textColor = isDarkMode ? '#F8FAFC' : '#1E293B';
    const textMutedColor = isDarkMode ? '#94A3B8' : '#64748B';
    const cardBg = isDarkMode ? 'rgba(12, 18, 46, 0.88)' : '#FFFFFF';
    const borderColor = isDarkMode ? 'rgba(0, 245, 212, 0.28)' : 'rgba(0, 0, 0, 0.05)';

    const handleRefresh = () => {
        hapticLight();
        refresh();
    };

    // --- Trạng thái 1: Đang dò GPS ---
    if (loading) {
        return (
            <View style={styles.outerMargin}>
                <View style={[styles.container, { backgroundColor: cardBg, borderColor }]}>
                    <ActivityIndicator
                        size="small"
                        color={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                    />
                    <Text style={[styles.textMuted, { color: textMutedColor, marginLeft: 8 }]}>
                        Đang định vị địa chỉ giao hàng...
                    </Text>
                </View>
            </View>
        );
    }

    // --- Trạng thái 2: Lỗi / bị từ chối -> fallback nhẹ nhàng ---
    if (error || !coords) {
        return (
            <View style={styles.outerMargin}>
                <Pressable
                    style={[styles.container, { backgroundColor: cardBg, borderColor }]}
                    onPress={handleRefresh}
                >
                    <View style={styles.iconCircleWarning}>
                        <Icon name="map-marker-alert-outline" size={16} color="#FF9800" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.title, { color: textColor }]}>
                            Chưa rõ vị trí · Tạm tính ship {formatVnd(DEFAULT_SHIPPING_FEE)}
                        </Text>
                        <Text style={[styles.subtitle, { color: textMutedColor }]}>
                            Bấm để cấp quyền hoặc thử lại
                        </Text>
                    </View>
                    <View style={styles.actionBtn}>
                        <Icon name="refresh" size={16} color={COLORS.primary} />
                    </View>
                </Pressable>
            </View>
        );
    }

    // --- Trạng thái 3: Thành công -> tính khoảng cách và tra bảng giá ---
    const distanceKm = getDistanceKm(
        coords.latitude,
        coords.longitude,
        WAREHOUSE_COORDS.latitude,
        WAREHOUSE_COORDS.longitude
    );
    const tier = getShippingTier(distanceKm);

    return (
        <View style={styles.outerMargin}>
            <Pressable
                style={[styles.container, { backgroundColor: cardBg, borderColor }]}
                onPress={handleRefresh}
            >
                <View style={styles.iconCircleSuccess}>
                    <Icon
                        name="map-marker-check"
                        size={16}
                        color={isDarkMode ? IOS26_COLORS.quantumCyan : '#10B981'}
                    />
                </View>

                <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.title, { color: textColor }]}>
                        Cách kho {distanceKm.toFixed(1)} km · Phí ship {formatVnd(tier.fee)}
                    </Text>
                    <Text style={[styles.subtitle, { color: textMutedColor }]}>
                        ⚡ {tier.label} · Cam kết giao đúng hẹn
                    </Text>
                </View>

                <View style={[styles.actionBtn, { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9' }]}>
                    <Icon
                        name="refresh"
                        size={16}
                        color={isDarkMode ? IOS26_COLORS.quantumCyan : '#64748B'}
                    />
                </View>
            </Pressable>
        </View>
    );
};

const styles = StyleSheet.create({
    outerMargin: {
        paddingHorizontal: SIZES.padding,
        paddingTop: 4,
        paddingBottom: 4,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
    iconCircleSuccess: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    iconCircleWarning: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 152, 0, 0.12)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    title: {
        fontSize: 12.5,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 11,
        marginTop: 2,
    },
    textMuted: {
        fontSize: 12,
        flex: 1,
    },
    actionBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default LocationBadge;