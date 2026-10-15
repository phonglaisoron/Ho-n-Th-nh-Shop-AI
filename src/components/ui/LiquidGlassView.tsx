import React, { useMemo, memo } from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    StyleProp,
} from 'react-native';
import { LIQUID_GLASS, SIZES, IOS26_COLORS, COSMIC_THEME } from '@constants/theme';
import { useTheme } from '@contexts/ThemeContext';

export interface LiquidGlassViewProps {
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: 'subtle' | 'medium' | 'prominent';
    borderRadius?: number;
    bordered?: boolean;
    sheen?: boolean;
    glow?: boolean;
    glowColor?: string;
    interactive?: boolean;
    hudAccents?: boolean;
}

export const LiquidGlassView: React.FC<LiquidGlassViewProps> = ({
    children,
    style,
    intensity = 'medium',
    borderRadius = SIZES.radiusLg,
    bordered = true,
    sheen = true,
    glow = false,
    glowColor,
    hudAccents = false,
}) => {
    const { isDarkMode } = useTheme();

    const containerStyle = useMemo<ViewStyle>(() => {
        const glassTokens = isDarkMode ? LIQUID_GLASS.dark : LIQUID_GLASS.light;

        let bgColor = glassTokens.surface;
        if (intensity === 'subtle') {
            bgColor = isDarkMode ? 'rgba(10, 15, 38, 0.60)' : 'rgba(255, 255, 255, 0.65)';
        } else if (intensity === 'prominent') {
            bgColor = isDarkMode ? 'rgba(14, 21, 52, 0.90)' : 'rgba(255, 255, 255, 0.92)';
        }

        return {
            backgroundColor: bgColor,
            borderRadius,
            ...(bordered && {
                borderWidth: 1.2,
                borderTopColor: isDarkMode ? 'rgba(0, 245, 212, 0.45)' : 'rgba(255, 255, 255, 0.85)',
                borderLeftColor: isDarkMode ? 'rgba(0, 245, 212, 0.35)' : 'rgba(255, 255, 255, 0.70)',
                borderRightColor: isDarkMode ? 'rgba(147, 51, 234, 0.35)' : 'rgba(0, 245, 212, 0.25)',
                borderBottomColor: isDarkMode ? 'rgba(255, 0, 122, 0.25)' : 'rgba(255, 255, 255, 0.30)',
            }),
            ...(glow && {
                shadowColor: glowColor || (isDarkMode ? COSMIC_THEME.neonCyan : IOS26_COLORS.electricBlue),
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDarkMode ? 0.45 : 0.20,
                shadowRadius: 18,
                elevation: 10,
            }),
            ...(!glow && LIQUID_GLASS.shadow),
        };
    }, [isDarkMode, intensity, borderRadius, bordered, glow, glowColor]);

    return (
        <View style={[styles.outerWrapper, containerStyle, style]}>
            {/* Gloss Sheen Strip (Top Cosmic Reflection) */}
            {sheen && (
                <View
                    pointerEvents="none"
                    style={[
                        styles.sheenStrip,
                        {
                            borderTopLeftRadius: borderRadius,
                            borderTopRightRadius: borderRadius,
                            backgroundColor: isDarkMode
                                ? 'rgba(0, 245, 212, 0.08)'
                                : 'rgba(255, 255, 255, 0.35)',
                        },
                    ]}
                />
            )}

            {/* Specular laser highlight dot */}
            <View
                pointerEvents="none"
                style={[
                    styles.prismDot,
                    {
                        backgroundColor: isDarkMode ? COSMIC_THEME.neonCyan : '#FFFFFF',
                        opacity: isDarkMode ? 0.85 : 0.9,
                    },
                ]}
            />

            {/* Sci-Fi HUD Sub-mark */}
            {(hudAccents || isDarkMode) && (
                <View pointerEvents="none" style={styles.hudCornerBadge}>
                    <View style={styles.hudLine} />
                </View>
            )}

            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    outerWrapper: {
        overflow: 'hidden',
        position: 'relative',
    },
    sheenStrip: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '38%',
        borderBottomLeftRadius: 120,
        borderBottomRightRadius: 120,
    },
    prismDot: {
        position: 'absolute',
        top: 2,
        left: 18,
        width: 36,
        height: 2,
        borderRadius: 1,
    },
    hudCornerBadge: {
        position: 'absolute',
        bottom: 4,
        right: 8,
        opacity: 0.4,
    },
    hudLine: {
        width: 14,
        height: 1.5,
        backgroundColor: '#00F5D4',
        borderRadius: 1,
    },
});

export default memo(LiquidGlassView);
