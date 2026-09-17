// src/data/mockProducts.ts
export interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
}

// Tạo mảng 50 sản phẩm mẫu
export const MOCK_PRODUCTS: Product[] = Array.from({ length: 50 }).map(
    (_, index) => ({
        id: `prod_${index}`,
        name: `Tai nghe Bluetooth Pro ${index}`,
        price: 1500000 + index * 10000,
        image: `https://picsum.photos/id/${10 + index}/400/400`,
    }),
);