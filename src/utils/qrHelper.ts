// src/utils/qrHelper.ts
import { MOCK_PRODUCTS } from '@data/mockProducts';

export interface BankPreset {
    id: string;
    bankName: string;
    bankShortName: string;
    code: string; // VCB, MB, TCB, ACB
    accountNumber: string;
    accountName: string;
    color: string;
}

export const SHOP_BANK_PRESETS: BankPreset[] = [
    {
        id: 'vcb',
        bankName: 'Ngân hàng Ngoại Thương Việt Nam (Vietcombank)',
        bankShortName: 'Vietcombank',
        code: 'vietcombank',
        accountNumber: '1039095165',
        accountName: 'HO THI HUE MAN',
        color: '#006838',
    },
    {
        id: 'mb',
        bankName: 'Ngân hàng TMCP Quân Đội (MBBank)',
        bankShortName: 'MBBank',
        code: 'mbbank',
        accountNumber: '0987654321',
        accountName: 'SHOPAI CORP',
        color: '#1E3A8A',
    },
    {
        id: 'tcb',
        bankName: 'Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)',
        bankShortName: 'Techcombank',
        code: 'techcombank',
        accountNumber: '19036888999',
        accountName: 'SHOPAI OFFICIAL',
        color: '#DC2626',
    },
    {
        id: 'acb',
        bankName: 'Ngân hàng TMCP Á Châu (ACB)',
        bankShortName: 'ACB',
        code: 'acb',
        accountNumber: '8888888888',
        accountName: 'SHOPAI VIETNAM',
        color: '#0284C7',
    },
];

/**
 * Tạo link ảnh mã QR định danh cho từng sản phẩm (ShopAI Product QR)
 */
export function getProductQrUrl(productId: string, size = 350): string {
    const cleanId = productId.trim();
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&data=${encodeURIComponent(cleanId)}`;
}

/**
 * Tạo link ảnh mã QR thanh toán ngân hàng chuẩn VietQR
 */
export function getVietQrPaymentUrl(params: {
    bankCode?: string;
    accountNumber: string;
    amount: number;
    content: string;
    accountName: string;
    template?: 'compact' | 'compact2' | 'qr_only' | 'print';
}): string {
    const {
        bankCode = 'vietcombank',
        accountNumber,
        amount,
        content,
        accountName,
        template = 'compact2',
    } = params;

    const normalizedBank = bankCode.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanContent = encodeURIComponent(content.trim());
    const cleanAccountName = encodeURIComponent(accountName.trim());
    const roundedAmount = Math.max(0, Math.round(amount));

    return `https://img.vietqr.io/image/${normalizedBank}-${accountNumber}-${template}.png?amount=${roundedAmount}&addInfo=${cleanContent}&accountName=${cleanAccountName}`;
}

/**
 * Phân tích mã QR quét được và trả về productId hợp lệ trong hệ thống ShopAI
 */
export function parseScannedProductCode(rawCode: string): string | null {
    if (!rawCode || typeof rawCode !== 'string') return null;
    const text = rawCode.trim();

    // 1. Dạng mã SKU trực tiếp: prod_0, prod_1, ...
    if (/^prod_\d+$/i.test(text)) {
        const found = MOCK_PRODUCTS.find((p) => p.id.toLowerCase() === text.toLowerCase());
        return found ? found.id : text;
    }

    // 2. Dạng tiền tố SHOPAI_PRODUCT:prod_0 hoặc SHOPAI:prod_0
    if (text.startsWith('SHOPAI_PRODUCT:')) {
        const extracted = text.replace('SHOPAI_PRODUCT:', '').trim();
        return extracted;
    }
    if (text.startsWith('SHOPAI:')) {
        const extracted = text.replace('SHOPAI:', '').trim();
        return extracted;
    }

    // 3. Dạng JSON: {"id":"prod_0"} hoặc {"productId":"prod_0"}
    if (text.startsWith('{') && text.endsWith('}')) {
        try {
            const parsed = JSON.parse(text);
            const id = parsed.productId || parsed.id;
            if (id && typeof id === 'string') return id;
        } catch {
            // Không phải JSON hợp lệ
        }
    }

    // 4. Dạng đường link URL web: .../product/prod_0
    const urlMatch = text.match(/\/product\/(prod_\d+)/i);
    if (urlMatch && urlMatch[1]) {
        return urlMatch[1];
    }

    // 5. Kiểm tra trực tiếp với ID trong danh mục sản phẩm mẫu
    const matchedById = MOCK_PRODUCTS.find((p) => p.id.toLowerCase() === text.toLowerCase());
    if (matchedById) return matchedById.id;

    // 6. Kiểm tra theo tên sản phẩm nếu quét mã có chứa tên
    const matchedByName = MOCK_PRODUCTS.find(
        (p) => text.toLowerCase().includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(text.toLowerCase())
    );
    if (matchedByName) return matchedByName.id;

    return null;
}
