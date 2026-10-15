import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useAuthStore } from '@store/useAuthStore';

/** Sau bao lâu ở nền thì bắt khoá lại — 2 phút là mức cân bằng cho một App thương mại điện tử. */
export const APP_LOCK_TIMEOUT_MS = 2 * 60 * 1000;

type Params = {
  isUnlocked: boolean;
  setIsUnlocked: (value: boolean) => void;
};

/**
 * Tự động khoá lại ứng dụng (bắt xác thực sinh trắc học lại) nếu App bị đưa
 * vào nền quá lâu. Đây là lớp phòng thủ BỔ SUNG cho BiometricGateScreen:
 * cổng khoá cũ chỉ kiểm tra lúc App KHỞI ĐỘNG LẠI, còn hook này canh gác
 * ngay cả khi App chỉ tạm rời sang nền rồi quay lại (chưa từng bị tắt hẳn).
 */
export const useAppLock = ({ isUnlocked, setIsUnlocked }: Params) => {
  const token = useAuthStore((state) => state.token);
  // Mốc thời gian lúc App RỜI sang nền — dùng useRef vì đổi giá trị không cần re-render
  const backgroundedAtRef = useRef<number | null>(null);

  useEffect(() => {
    // Chưa đăng nhập thì chưa có gì để khoá
    if (token == null) return;

    const handleChange = (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        // 'inactive' xảy ra trên iOS lúc kéo Control Center, có cuộc gọi đến...
        // vẫn ghi nhận để không bỏ sót các trường hợp biên.
        backgroundedAtRef.current = Date.now();
        return;
      }

      if (nextState === 'active' && backgroundedAtRef.current != null) {
        const elapsedMs = Date.now() - backgroundedAtRef.current;
        if (elapsedMs > APP_LOCK_TIMEOUT_MS) {
          setIsUnlocked(false); // Quá hạn -> khoá lại, bắt quét sinh trắc học từ đầu
        }
        backgroundedAtRef.current = null;
      }
    };

    const sub = AppState.addEventListener('change', handleChange);
    return () => sub.remove(); // Dọn listener khi Component gọi hook này unmount
  }, [token, setIsUnlocked]);
};
