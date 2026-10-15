import { Vibration, Platform } from 'react-native';

/**
 * Trung tâm điều phối rung phản hồi của ShopAI.
 *
 * Vì sao phải bọc lại thay vì gọi thẳng Vibration?
 *  1. Sau này đổi sang expo-haptics chỉ cần sửa ĐÚNG file này.
 *  2. Có thể tắt toàn bộ rung bằng 1 công tắc (phục vụ Cài đặt của user).
 *  3. Mọi lỗi rung đều bị nuốt gọn — tính năng phụ KHÔNG được làm sập app.
 */

// Công tắc tổng. Sau này có thể nối vào Zustand để user tự bật/tắt trong Cài đặt.
let hapticsEnabled = true;

export const setHapticsEnabled = (value: boolean) => {
    hapticsEnabled = value;
};

/** Hàm rung lõi — mọi hàm bên dưới đều đi qua đây. */
const safeVibrate = (pattern: number | number[]) => {
    if (!hapticsEnabled) return;
    try {
        Vibration.vibrate(pattern);
    } catch (e) {
        // Máy không có motor rung, hoặc user đã tắt rung trong Cài đặt hệ thống.
        // Nuốt lỗi im lặng: thà không rung còn hơn crash app.
        console.log('[haptics] Thiết bị không hỗ trợ rung:', e);
    }
};

/** Chạm nhẹ — dùng cho các nút bấm phụ. */
export const hapticLight = () => safeVibrate(20);

/** Chạm vừa — dùng cho nút hành động chính (Thêm vào giỏ, Thanh toán). */
export const hapticMedium = () => safeVibrate(40);

/**
 * Rung "THÀNH CÔNG" — hai nhịp ngắn liền nhau, cảm giác "tích-tắc".
 * Mảng đọc là: [đợi 0ms, rung 30ms, nghỉ 60ms, rung 30ms]
 * Đây là mẫu ta dùng cho việc quét mã vạch trúng đích.
 */
export const hapticSuccess = () => {
    if (Platform.OS === 'ios') {
        // iOS bỏ qua tham số thời lượng của Vibration API (xem Phần 7.6),
        // nên chỉ rung một nhịp chuẩn. Sau Chương 8 hãy thay bằng:
        // Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        safeVibrate(1);
    } else {
        safeVibrate([0, 30, 60, 30]);
    }
};

/** Rung "LỖI" — ba nhịp dài hơn, cảm giác dứt khoát khó chịu. */
export const hapticError = () => safeVibrate([0, 60, 80, 60, 80, 60]);