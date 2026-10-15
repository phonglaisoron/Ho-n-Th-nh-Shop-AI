import React, { useState } from "react";
import {
    View,
    TextInput,
    StyleSheet,
    TextInputProps,
    ViewStyle,
    TextStyle,
} from "react-native";
import Typography from "./Typography";
import { COLORS, SIZES, IOS26_COLORS, LIQUID_GLASS } from "@constants/theme";
import { useTheme } from "@contexts/ThemeContext";

interface Props extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
    inputStyle?: TextStyle;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const ShopInput = ({
    label,
    error,
    containerStyle,
    inputStyle,
    leftIcon,
    rightIcon,
    onFocus,
    onBlur,
    ...rest
}: Props) => {
    const { isDarkMode } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const glassTokens = isDarkMode ? LIQUID_GLASS.dark : LIQUID_GLASS.light;

    const handleFocus = (e: any) => {
        setIsFocused(true);
        if (onFocus) onFocus(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        if (onBlur) onBlur(e);
    };

    return (
        <View style={[styles.wrap, containerStyle]}>
            {label ? (
                <Typography
                    variant="body2"
                    style={[
                        styles.label,
                        {
                            color: isDarkMode ? "#CBD5E1" : "#334155",
                            fontWeight: "600",
                        },
                    ]}
                >
                    {label}
                </Typography>
            ) : null}

            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: glassTokens.inputBg,
                        borderColor: error
                            ? COLORS.error
                            : isFocused
                            ? isDarkMode
                                ? IOS26_COLORS.quantumCyan
                                : COLORS.primary
                            : isDarkMode
                            ? "rgba(255, 255, 255, 0.16)"
                            : "rgba(255, 255, 255, 0.8)",
                    },
                    isFocused && {
                        shadowColor: isDarkMode
                            ? IOS26_COLORS.quantumCyan
                            : COLORS.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.35,
                        shadowRadius: 8,
                        elevation: 4,
                    },
                    error ? styles.inputError : null,
                ]}
            >
                {/* Micro Top Gloss Sheen on Input Trench */}
                <View
                    pointerEvents="none"
                    style={[
                        styles.inputSheen,
                        {
                            backgroundColor: isDarkMode
                                ? "rgba(255, 255, 255, 0.05)"
                                : "rgba(255, 255, 255, 0.35)",
                        },
                    ]}
                />

                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <TextInput
                    placeholderTextColor={isDarkMode ? "#64748B" : "#94A3B8"}
                    cursorColor={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                    underlineColorAndroid="transparent"
                    autoCorrect={false}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={[
                        styles.input,
                        { color: isDarkMode ? "#F8FAFC" : COLORS.text },
                        inputStyle,
                    ]}
                    {...rest}
                />

                {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
            </View>

            {error ? (
                <Typography
                    variant="small"
                    color={COLORS.error}
                    style={styles.error}
                >
                    {error}
                </Typography>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: {
        marginBottom: SIZES.padding,
    },
    label: {
        marginBottom: 8,
        letterSpacing: 0.2,
    },
    inputContainer: {
        height: 52,
        borderRadius: SIZES.radiusLg,
        borderWidth: 1.2,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        position: "relative",
        overflow: "hidden",
    },
    inputSheen: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: "40%",
        borderTopLeftRadius: SIZES.radiusLg,
        borderTopRightRadius: SIZES.radiusLg,
    },
    input: {
        flex: 1,
        height: "100%",
        fontSize: SIZES.body1,
        fontWeight: "500",
        paddingHorizontal: 4,
    },
    leftIcon: {
        marginRight: 10,
    },
    rightIcon: {
        marginLeft: 10,
    },
    inputError: {
        borderColor: COLORS.error,
    },
    error: {
        marginTop: 6,
        marginLeft: 4,
        fontWeight: "500",
    },
});

export default ShopInput;