import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
    isDarkMode: boolean;
    toggleTheme: () => void;
}

// Bước 1: Tạo kênh phát sóng (giá trị mặc định chỉ dùng khi thiếu Provider)
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Bước 2: Provider — Component Cha bọc quanh App để phát sóng xuống toàn bộ cây con
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const toggleTheme = () => setIsDarkMode((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

// Bước 3: Custom Hook để bất kỳ Component con nào cũng "bắt sóng" được, không cần Props
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme phải được gọi bên trong <ThemeProvider>');
    }
    return context;
};