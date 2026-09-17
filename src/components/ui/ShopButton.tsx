// src/components/ShopButton.tsx
import React, { memo } from "react";
import {
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from "react-native";
import Typography from "@components/ui/Typography";
import { COLORS, SIZES } from "@constants/theme";

interface ShopButtonProps {
    title: string;
    onPress: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    style?: ViewStyle;
    textStyle?: TextStyle;
    accessibilityLabel?: string; // Tuỳ chọn — xem note Accessibility ở Phần 3.2 mục 3
}

const ShopButton: React.FC<ShopButtonProps> = ({
    title,
    onPress,
    isLoading = false,
    disabled = false,
    style,
    textStyle,
    accessibilityLabel,
}) => {
    return (
        <TouchableOpacity
            style={[styles.button, disabled && styles.disabledButton, style]}
            onPress={onPress}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            // Không truyền riêng thì mặc định lấy luôn `title` — màn hình đọc (VoiceOver/TalkBack) luôn có tên nút để đọc
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityRole="button"
        >
            {isLoading ? (
                <ActivityIndicator color={COLORS.surface} />
            ) : (
                <Typography
                    variant="body1"
                    color={COLORS.surface}
                    style={[{ fontWeight: "600" }, textStyle]}
                >
                    {title}
                </Typography>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        backgroundColor: COLORS.primary,
        height: 48,
        borderRadius: SIZES.radius,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: SIZES.padding,
        width: "100%",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: COLORS.border,
        shadowOpacity: 0,
        elevation: 0,
    },
});

export default memo(ShopButton);