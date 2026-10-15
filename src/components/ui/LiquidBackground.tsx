import React, { memo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface LiquidBackgroundProps {
    children?: React.ReactNode;
}

/**
 * LiquidBackground - Tối ưu hóa hiệu năng cao
 * Thay thế 11 vòng lặp JS Animation nặng bằng Mesh Gradient tĩnh siêu nhẹ,
 * giải phóng hoàn toàn CPU & GPU compositor, loại bỏ hiện tượng giật lag khi cuộn trang.
 */
export const LiquidBackground: React.FC<LiquidBackgroundProps> = memo(({ children }) => {
    const { isDarkMode } = useTheme();

    return (
        <View style={styles.container}>
            {/* Nền Cyber / Minimalist tĩnh siêu mượt */}
            <View
                style={[
                    StyleSheet.absoluteFill,
                    {
                        backgroundColor: isDarkMode ? '#050716' : '#F8FAFC',
                    },
                ]}
            >
                {/* Vùng ánh sáng Cyber Cyan góc trên */}
                <View
                    style={[
                        styles.orb,
                        styles.orb1,
                        {
                            backgroundColor: isDarkMode
                                ? 'rgba(0, 245, 212, 0.10)'
                                : 'rgba(14, 165, 233, 0.06)',
                        },
                    ]}
                />

                {/* Vùng ánh sáng Plasma Violet góc dưới */}
                <View
                    style={[
                        styles.orb,
                        styles.orb2,
                        {
                            backgroundColor: isDarkMode
                                ? 'rgba(147, 51, 234, 0.08)'
                                : 'rgba(168, 85, 247, 0.05)',
                        },
                    ]}
                />

                {/* Vùng ánh sáng Deep Blue ở giữa */}
                <View
                    style={[
                        styles.orb,
                        styles.orb3,
                        {
                            backgroundColor: isDarkMode
                                ? 'rgba(59, 130, 246, 0.07)'
                                : 'rgba(56, 189, 248, 0.04)',
                        },
                    ]}
                />
            </View>

            {children}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    orb: {
        position: 'absolute',
        borderRadius: 9999,
    },
    orb1: {
        top: -height * 0.06,
        left: -width * 0.12,
        width: width * 0.85,
        height: width * 0.85,
    },
    orb2: {
        bottom: -height * 0.06,
        right: -width * 0.15,
        width: width * 0.90,
        height: width * 0.90,
    },
    orb3: {
        top: height * 0.35,
        left: width * 0.15,
        width: width * 0.65,
        height: width * 0.65,
    },
});

export default LiquidBackground;
