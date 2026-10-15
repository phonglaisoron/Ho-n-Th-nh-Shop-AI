/** Toạ độ kho hàng trung tâm của ShopAI (giả lập: Quận 1, TP. Hồ Chí Minh). */
export const WAREHOUSE_COORDS = {
    latitude: 10.7769,
    longitude: 106.7009,
};

/** Bảng giá ship theo khoảng cách (đơn vị: VNĐ). */
export const SHIPPING_TIERS = [
    { maxKm: 5, fee: 15000, label: 'Nội thành — giao trong 2 giờ' },
    { maxKm: 20, fee: 25000, label: 'Ngoại thành — giao trong ngày' },
    { maxKm: 100, fee: 40000, label: 'Liên tỉnh gần — 1-2 ngày' },
    { maxKm: Infinity, fee: 60000, label: 'Liên tỉnh xa — 3-5 ngày' },
];

/** Phí mặc định khi KHÔNG xác định được vị trí (user từ chối quyền, GPS lỗi...). */
export const DEFAULT_SHIPPING_FEE = 30000;

/**
 * Tính khoảng cách đường chim bay giữa 2 toạ độ bằng công thức Haversine.
 * Đây là toán học thuần tuý, không đụng gì tới Native — bạn không cần thuộc công thức,
 * chỉ cần hiểu: đầu vào là 2 cặp (vĩ độ, kinh độ), đầu ra là số km.
 */
export const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number => {
    const R = 6371; // Bán kính Trái Đất, đơn vị km
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Tra bảng giá: từ số km ra mức phí + nhãn mô tả. */
export const getShippingTier = (distanceKm: number) => {
    return SHIPPING_TIERS.find((tier) => distanceKm <= tier.maxKm) ?? SHIPPING_TIERS[SHIPPING_TIERS.length - 1];
};