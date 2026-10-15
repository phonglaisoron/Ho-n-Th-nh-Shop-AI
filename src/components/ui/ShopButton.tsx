import React, { memo, useRef } from "react";
import {
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
    StyleProp,
    Pressable,
    View,
    Animated,
} from "react-native";
import Typography from "@components/ui/Typography";
import { COLORS, SIZES, IOS26_COLORS } from "@constants/theme";
import { useTheme } from "@contexts/ThemeContext";
import { hapticLight } from "@utils/haptics";

export type ShopButtonVariant =
    | "primary"
    | "secondary"
    | "liquid-primary"
    | "liquid-glass"
    | "liquid-cyan";

export interface ShopButtonProps {
    title: string;
    onPress: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    accessibilityLabel?: string;
    variant?: ShopButtonVariant;
    icon?: React.ReactNode;
}

const ShopButton: React.FC<ShopButtonProps> = ({
    title,
    onPress,
    isLoading = false,
    disabled = false,
    style,
    textStyle,
    accessibilityLabel,
    variant = "liquid-primary",
    icon,
}) => {
    const { isDarkMode } = useTheme();
    const scale = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        Animated.spring(scale, {
            toValue: 0.96,
            useNativeDriver: true,
            bounciness: 4,
            speed: 18,
        }).start();
        hapticLight();
    };

    const handlePressOut = () => {
        Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
            bounciness: 4,
            speed: 18,
        }).start();
    };

    // Dynamic style based on variant
    const getVariantStyles = (): {
        container: ViewStyle;
        textColor: string;
        isLiquid: boolean;
    } => {
        switch (variant) {
            case "liquid-glass":
                return {
                    container: {
                        backgroundColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(255, 255, 255, 0.65)",
                        borderWidth: 1.2,
                        borderTopColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.35)"
                            : "rgba(255, 255, 255, 0.90)",
                        borderBottomColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.08)"
                            : "rgba(255, 255, 255, 0.30)",
                        borderColor: isDarkMode
                            ? "rgba(255, 255, 255, 0.15)"
                            : "rgba(255, 255, 255, 0.50)",
                        shadowColor: isDarkMode ? "#000" : "#94A3B8",
                        shadowOpacity: 0.15,
                        shadowRadius: 10,
                        elevation: 3,
                    },
                    textColor: isDarkMode ? "#FFFFFF" : COLORS.text,
                    isLiquid: true,
                };
            case "liquid-cyan":
                return {
                    container: {
                        backgroundColor: isDarkMode
                            ? "rgba(0, 245, 212, 0.18)"
                            : "rgba(0, 245, 212, 0.22)",
                        borderWidth: 1.2,
                        borderColor: IOS26_COLORS.quantumCyan,
                        shadowColor: IOS26_COLORS.quantumCyan,
                        shadowOpacity: 0.3,
                        shadowRadius: 12,
                        elevation: 5,
                    },
                    textColor: isDarkMode ? IOS26_COLORS.quantumCyan : "#008775",
                    isLiquid: true,
                };
            case "secondary":
                return {
                    container: {
                        backgroundColor: COLORS.secondary,
                        shadowColor: COLORS.secondary,
                        shadowOpacity: 0.25,
                        shadowRadius: 8,
                        elevation: 4,
                    },
                    textColor: "#FFFFFF",
                    isLiquid: false,
                };
            case "liquid-primary":
            case "primary":
            default: {
                const btnColor = isDarkMode ? IOS26_COLORS.quantumCyan : "#0284C7";
                const btnTextColor = isDarkMode ? "#050716" : "#FFFFFF";
                return {
                    container: {
                        backgroundColor: btnColor,
                        borderWidth: 1.2,
                        borderTopColor: "rgba(255, 255, 255, 0.55)",
                        borderLeftColor: "rgba(255, 255, 255, 0.35)",
                        borderBottomColor: "rgba(0, 0, 0, 0.2)",
                        borderRightColor: "rgba(0, 0, 0, 0.15)",
                        shadowColor: btnColor,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.38,
                        shadowRadius: 14,
                        elevation: 6,
                    },
                    textColor: btnTextColor,
                    isLiquid: true,
                };
            }
        }
    };

    const variantData = getVariantStyles();

    return (
        <Animated.View style={[{ transform: [{ scale }] }, style]}>
            <Pressable
                style={[
                    styles.button,
                    variantData.container,
                    disabled && styles.disabledButton,
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || isLoading}
                accessibilityLabel={accessibilityLabel ?? title}
                accessibilityRole="button"
            >
                {/* Top Gloss Sheen Overlay for Liquid Glass effect */}
                {variantData.isLiquid && !disabled && (
                    <View
                        pointerEvents="none"
                        style={[
                            styles.glossSheen,
                            {
                                backgroundColor:
                                    variant === "liquid-glass"
                                        ? isDarkMode
                                            ? "rgba(255, 255, 255, 0.08)"
                                            : "rgba(255, 255, 255, 0.40)"
                                        : "rgba(255, 255, 255, 0.22)",
                            },
                        ]}
                    />
                )}

                {isLoading ? (
                    <ActivityIndicator color={variantData.textColor} />
                ) : (
                    <View style={styles.contentRow}>
                        {icon && <View style={styles.iconWrap}>{icon}</View>}
                        <Typography
                            variant="body1"
                            color={variantData.textColor}
                            style={[styles.text, textStyle]}
                        >
                            {title}
                        </Typography>
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 50,
        borderRadius: SIZES.radiusXl,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: SIZES.padding,
        width: "100%",
        position: "relative",
        overflow: "hidden",
    },
    glossSheen: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "50%",
        borderTopLeftRadius: SIZES.radiusXl,
        borderTopRightRadius: SIZES.radiusXl,
        borderBottomLeftRadius: 50,
        borderBottomRightRadius: 50,
    },
    contentRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    iconWrap: {
        marginRight: 8,
    },
    text: {
        fontWeight: "700",
        letterSpacing: 0.3,
    },
    disabledButton: {
        backgroundColor: COLORS.border,
        borderColor: "transparent",
        shadowOpacity: 0,
        elevation: 0,
    },
});

export default memo(ShopButton);