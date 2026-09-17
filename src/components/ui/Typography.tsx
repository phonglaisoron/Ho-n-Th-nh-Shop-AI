import React, { memo } from "react";
import { Text, TextStyle, StyleProp } from "react-native";
import { COLORS, FONTS } from "@constants/theme";

type Variant = keyof typeof FONTS;

interface Props {
    children: React.ReactNode;
    variant?: Variant;
    color?: string;
    style?: StyleProp<TextStyle>;
    numberOfLines?: number;
}

const Typography = ({
    children,
    variant = "body1",
    color = COLORS.text,
    style,
    numberOfLines,
}: Props) => {
    return (
        <Text
            numberOfLines={numberOfLines}
            style={[FONTS[variant], { color }, style]}
        >
            {children}
        </Text>
    );
};

export default memo(Typography);