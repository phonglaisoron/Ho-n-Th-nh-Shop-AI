import React from "react";
import {
    View,
    TextInput,
    StyleSheet,
    TextInputProps,
    ViewStyle,
} from "react-native";
import Typography from "./Typography";
import { COLORS, SIZES } from "@constants/theme";

interface Props extends TextInputProps {
    label?: string;
    error?: string;
    containerStyle?: ViewStyle;
}

const ShopInput = ({ label, error, containerStyle, style, ...rest }: Props) => {
    return (
        <View style={[styles.wrap, containerStyle]}>
            {label ? (
                <Typography variant="body2" style={styles.label}>
                    {label}
                </Typography>
            ) : null}
            <TextInput
                placeholderTextColor={COLORS.textLight}
                cursorColor={COLORS.primary}
                underlineColorAndroid="transparent"
                autoCorrect={false}
                style={[styles.input, error ? styles.inputError : null, style]}
                {...rest}
            />
            {error ? (
                <Typography variant="small" color={COLORS.error} style={styles.error}>
                    {error}
                </Typography>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { marginBottom: SIZES.padding },
    label: { marginBottom: 6 },
    input: {
        height: 48,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: SIZES.radius,
        paddingHorizontal: SIZES.padding,
        backgroundColor: COLORS.surface,
        fontSize: SIZES.body1,
        color: COLORS.text,
    },
    inputError: { borderColor: COLORS.error },
    error: { marginTop: 4 },
});

export default ShopInput;