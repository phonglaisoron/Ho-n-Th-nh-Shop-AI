// src/constants/theme.ts
export const COLORS = {
    primary: "#0284C7",        // Xanh dương công nghệ (Ocean Blue) đồng bộ Trang chủ
    primaryCyan: "#00F5D4",    // Xanh ngọc lượng tử (Quantum Cyan)
    secondary: "#00B4D8",      // Xanh lam nhạt (Sky Aqua)
    background: "#F5F5F5",
    surface: "#FFFFFF",
    text: "#2C3E50",
    textLight: "#7F8C8D",
    border: "#E8E8E8",
    error: "#EF4444",
    success: "#10B981",
};

/** Hệ màu quang phổ lỏng iOS 26 & Vũ trụ tương lai */
export const IOS26_COLORS = {
    quantumCyan: "#00F5D4",
    auroraViolet: "#7928CA",
    hyperCoral: "#FF007A",
    electricBlue: "#0070F3",
    liquidGold: "#FFB800",
    deepSpaceDark: "#050716", // Vũ trụ đêm sâu thẳm Deep Cosmos
    deepSpaceCard: "#0C102A", // Vỏ module trạm vũ trụ
};

/** Hệ màu Futuristic Cosmic Sci-Fi chuyên biệt */
export const COSMIC_THEME = {
    voidBlack: "#030611",      // Khoảng chân không vũ trụ
    deepCosmos: "#060A1F",     // Không gian sâu
    nebulaDark: "#0B102E",     // Vùng tinh vân tối
    moduleCard: "rgba(13, 19, 48, 0.78)", // Kính buồng lái / module phi thuyền
    moduleCardBorder: "rgba(0, 245, 212, 0.30)", // Viền quang lượng tử
    neonCyan: "#00F5D4",       // Tia laser Cyan năng lượng
    plasmaViolet: "#9333EA",   // Plasma tím lượng tử
    supernovaPink: "#FF007A",  // Siêu tân tinh hồng neon
    starlightBlue: "#38BDF8",  // Ánh sáng sao
    pulsarGold: "#FACC15",     // Năng lượng pulsar vàng kim
    starlightWhite: "#F8FAFC", // Trắng ánh sao
    hudGrid: "rgba(0, 245, 212, 0.12)", // Lưới radar HUD
    starlightDust: "rgba(255, 255, 255, 0.8)",
};

/** Tokens thiết kế Liquid Glass & Futuristic Sci-Fi HUD */
export const LIQUID_GLASS = {
    // Độ trong suốt bề mặt kính (Trạm không gian ban ngày)
    light: {
        surface: "rgba(240, 246, 255, 0.82)",
        surfaceElevated: "rgba(255, 255, 255, 0.92)",
        border: "rgba(0, 245, 212, 0.35)",
        borderBottom: "rgba(121, 40, 202, 0.20)",
        sheen: "rgba(255, 255, 255, 0.65)",
        inputBg: "rgba(255, 255, 255, 0.75)",
        text: "#060919",
        textMuted: "#475569",
        glow: "rgba(0, 245, 212, 0.25)",
    },
    // Chế độ vũ trụ sâu thẳm (Deep Space Cockpit)
    dark: {
        surface: "rgba(10, 15, 38, 0.82)",
        surfaceElevated: "rgba(16, 24, 58, 0.90)",
        border: "rgba(0, 245, 212, 0.32)",
        borderBottom: "rgba(147, 51, 234, 0.22)",
        sheen: "rgba(0, 245, 212, 0.25)",
        inputBg: "rgba(6, 10, 28, 0.75)",
        text: "#F8FAFC",
        textMuted: "#94A3B8",
        glow: "rgba(0, 245, 212, 0.35)",
    },
    // Viền lăng kính tán sắc 7 màu & Neon Cyber HUD
    prism: {
        cyan: "rgba(0, 245, 212, 0.65)",
        violet: "rgba(147, 51, 234, 0.60)",
        coral: "rgba(255, 0, 122, 0.60)",
        silver: "rgba(248, 250, 252, 0.90)",
    },
    // Đổ bóng mờ năng lượng vũ trụ
    shadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
    },
    subtleShadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 4,
    },
};

export const SIZES = {
    base: 8,
    font: 14,
    radius: 12,
    radiusLg: 20,
    radiusXl: 28,
    radiusPill: 999,
    padding: 16,
    h1: 24,
    h2: 20,
    h3: 18,
    body1: 16,
    body2: 14,
    small: 12,
};

/** Map variant chữ → fontSize / fontWeight (dùng cho Typography) */
export const FONTS = {
    h1: { fontSize: SIZES.h1, fontWeight: "700" as const },
    h2: { fontSize: SIZES.h2, fontWeight: "700" as const },
    h3: { fontSize: SIZES.h3, fontWeight: "600" as const },
    body1: { fontSize: SIZES.body1, fontWeight: "400" as const },
    body2: { fontSize: SIZES.body2, fontWeight: "400" as const },
    small: { fontSize: SIZES.small, fontWeight: "400" as const },
};