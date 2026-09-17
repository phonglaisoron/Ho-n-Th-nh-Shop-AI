// Khai báo kiểu dữ liệu trả về (TypeScript)
export type PostItem = {
    id: number;
    title: string;
    body: string;
};

// Hàm tải dữ liệu từ mạng Internet
export async function fetchSamplePosts(): Promise<PostItem[]> {
    const res = await fetch(
        'https://jsonplaceholder.typicode.com/posts?_limit=10',
    );
    if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
    }
    return res.json();
}