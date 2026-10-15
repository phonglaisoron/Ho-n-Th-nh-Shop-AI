// src/data/mockProducts.ts
import { Product } from '../types/product.schema';

export interface TechProductItem {
    name: string;
    price: number;
    image: string;
    category: 'phone' | 'laptop' | 'audio' | 'watch' | 'accessories';
    rating: number;
    description: string;
}

export const REAL_TECH_CATALOG: TechProductItem[] = [
    {
        name: 'iPhone 15 Pro Max 256GB Titan Tự Nhiên',
        price: 29490000,
        image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=500&q=80',
        category: 'phone',
        rating: 4.9,
        description: 'Khung viền Titan chuẩn hàng không, chip Apple A17 Pro mạnh mẽ, camera zoom 5x sắc nét.',
    },
    {
        name: 'Samsung Galaxy S24 Ultra 12GB/256GB AI',
        price: 26990000,
        image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&q=80',
        category: 'phone',
        rating: 4.8,
        description: 'Tích hợp Galaxy AI thông minh, bút S-Pen quyền năng, khung viền Titan và camera 200MP.',
    },
    {
        name: 'MacBook Air 15 inch M3 16GB / 512GB SSD',
        price: 32890000,
        image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&q=80',
        category: 'laptop',
        rating: 4.9,
        description: 'Mỏng nhẹ đỉnh cao với chip Apple M3 siêu tốc, pin 18 tiếng, màn hình Liquid Retina tuyệt đẹp.',
    },
    {
        name: 'Tai nghe Bluetooth Apple AirPods Pro 2 MagSafe',
        price: 5490000,
        image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=500&q=80',
        category: 'audio',
        rating: 4.9,
        description: 'Chống ồn chủ động gấp 2 lần, âm thanh không gian sống động, chip H2 và hộp sạc USB-C.',
    },
    {
        name: 'Đồng hồ Apple Watch Series 9 GPS 45mm',
        price: 9190000,
        image: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=500&q=80',
        category: 'watch',
        rating: 4.8,
        description: 'Thao tác chạm hai lần Double Tap kỳ diệu, màn hình sáng gấp đôi, đo sức khỏe chuyên sâu.',
    },
    {
        name: 'Loa Bluetooth Marshall Emberton II Chính Hãng',
        price: 3950000,
        image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=500&q=80',
        category: 'audio',
        rating: 4.7,
        description: 'Âm thanh đa hướng 360 độ True Stereophonic, pin hơn 30 giờ chơi nhạc, chuẩn chống nước IP67.',
    },
    {
        name: 'Chuột không dây Logitech MX Master 3S',
        price: 2190000,
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80',
        category: 'accessories',
        rating: 4.9,
        description: 'Cảm biến 8000 DPI lướt mượt trên kính, con lăn siêu tốc MagSpeed, click êm ái chống ồn.',
    },
    {
        name: 'Bàn phím cơ không dây NuPhy Air75 V2 RGB',
        price: 2850000,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
        category: 'accessories',
        rating: 4.8,
        description: 'Bàn phím cơ Low-profile siêu mỏng, kết nối không dây 2.4GHz 1000Hz, gõ đầm tay cực êm.',
    },
    {
        name: 'Máy tính bảng iPad Pro 11 inch M4 OLED 256GB',
        price: 27990000,
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80',
        category: 'phone',
        rating: 4.9,
        description: 'Thiết kế siêu mỏng 5.3mm, chip Apple M4 thế hệ mới, màn hình Ultra Retina XDR Tandem OLED.',
    },
    {
        name: 'Củ sạc nhanh Anker GaNPrime 65W 3 Cổng Type-C',
        price: 890000,
        image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=500&q=80',
        category: 'accessories',
        rating: 4.8,
        description: 'Công nghệ GaN III thu nhỏ kích thước, sạc đồng thời 3 thiết bị an toàn với cảm biến ActiveShield 2.0.',
    },
    {
        name: 'Tai nghe Chống ồn Sony WH-1000XM5 Hi-Res',
        price: 7490000,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
        category: 'audio',
        rating: 4.9,
        description: 'Bộ xử lý chống ồn V1 kết hợp HD QN1 lọc tạp âm vượt trội, đệm da cao cấp êm tai cả ngày.',
    },
    {
        name: 'Màn hình Dell UltraSharp 27" 4K IPS Black U2723QE',
        price: 13890000,
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
        category: 'laptop',
        rating: 4.9,
        description: 'Độ tương phản 2000:1 cực sâu, 98% DCI-P3 chuẩn đồ họa, cổng USB-C Hub 90W sạc laptop.',
    },
    {
        name: 'Đồng hồ Samsung Galaxy Watch6 Classic 43mm',
        price: 6490000,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
        category: 'watch',
        rating: 4.7,
        description: 'Vòng xoay bezel cơ học sang trọng, kính Sapphire chống trầy xước, phân tích sức khỏe BIA.',
    },
    {
        name: 'Ổ cứng SSD Di Động Samsung T7 Shield 1TB USB 3.2',
        price: 2590000,
        image: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&q=80',
        category: 'accessories',
        rating: 4.8,
        description: 'Tốc độ đọc ghi lên tới 1050MB/s, vỏ bọc cao su chống va đập rơi vỡ 3 mét, chuẩn chống nước IP65.',
    },
    {
        name: 'Tay cầm chơi game Sony DualSense PS5 Không dây',
        price: 1790000,
        image: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=500&q=80',
        category: 'accessories',
        rating: 4.8,
        description: 'Rung haptic chân thực, cò nhấn thích ứng Adaptive Triggers, micro lọc âm và loa tích hợp.',
    },
    {
        name: 'Camera an ninh Xiaomi Smart Camera C400 2.5K',
        price: 990000,
        image: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&q=80',
        category: 'accessories',
        rating: 4.7,
        description: 'Độ nét cao 2.5K 4MP, quay quét toàn cảnh 360 độ, phát hiện người AI và đàm thoại 2 chiều.',
    },
    {
        name: 'Pin sạc dự phòng không dây MagSafe Baseus 20W',
        price: 590000,
        image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80',
        category: 'accessories',
        rating: 4.6,
        description: 'Dung lượng 10.000mAh, nam châm hít chắc chắn, sạc nhanh Type-C PD 20W và không dây 15W.',
    },
    {
        name: 'Kính thực tế ảo Meta Quest 3 128GB VR/MR',
        price: 13500000,
        image: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=500&q=80',
        category: 'accessories',
        rating: 4.9,
        description: 'Thực tế hỗn hợp Mixed Reality sống động với camera xuyên thấu màu sắc, chip Snapdragon XR2 Gen 2.',
    },
    {
        name: 'Laptop Gaming ASUS ROG Zephyrus G16 OLED',
        price: 48990000,
        image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&q=80',
        category: 'laptop',
        rating: 4.9,
        description: 'Vỏ nhôm CNC cao cấp, màn hình OLED ROG Nebula 240Hz, đồ họa NVIDIA RTX 4070 mạnh mẽ.',
    },
    {
        name: 'Loa thông minh Google Nest Audio Hi-Fi',
        price: 2190000,
        image: 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=500&q=80',
        category: 'audio',
        rating: 4.7,
        description: 'Trợ lý ảo Google thông minh, âm trầm sống động hơn 75%, kết nối nhà thông minh Smart Home.',
    },
];

export const MOCK_PRODUCTS: Product[] = Array.from({ length: 40 }).map((_, index) => {
    const catalogItem = REAL_TECH_CATALOG[index % REAL_TECH_CATALOG.length];
    return {
        id: `prod_${index}`,
        name: index >= REAL_TECH_CATALOG.length ? `${catalogItem.name} (Bản nâng cấp V${Math.floor(index / REAL_TECH_CATALOG.length) + 1})` : catalogItem.name,
        price: catalogItem.price,
        image: catalogItem.image,
        category: catalogItem.category,
        rating: catalogItem.rating,
        description: catalogItem.description,
    };
});