import React, { useCallback, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ShopButton from '@components/ShopButton';
import { COLORS, SIZES, IOS26_COLORS } from '@constants/theme';
import { AI_GREETING, AI_SUGGESTIONS } from '@constants/aiPrompt';
import { askShopAI, toFriendlyError, type ChatTurn } from '@services/geminiService';
import { useTheme } from '@contexts/ThemeContext';

type Message = {
    id: string;
    text: string;
    isBot: boolean;
    status?: 'sent' | 'error'; // 'error' -> hiện nút Thử lại (Phần 8.10)
};

export default function AIChatScreen() {
    const navigation = useNavigation<any>();
    const { isDarkMode } = useTheme();

    const [messages, setMessages] = useState<Message[]>([
        { id: 'greeting', text: AI_GREETING, isBot: true, status: 'sent' },
    ]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const listRef = useRef<FlatList<Message>>(null);
    // Lưu lại câu hỏi vừa lỗi để nút "Thử lại" biết phải gửi lại cái gì
    const lastQuestionRef = useRef<string>('');

    const scrollToEnd = () => {
        // Hoãn một nhịp để FlatList kịp render item mới rồi mới cuộn
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    };

    /** Dựng lịch sử hội thoại theo đúng định dạng Gemini yêu cầu. */
    const buildHistory = useCallback((list: Message[]): ChatTurn[] => {
        return list
            .filter((m) => m.id !== 'greeting' && m.status !== 'error') // Bỏ câu chào và các tin lỗi
            .map((m) => ({
                role: m.isBot ? ('model' as const) : ('user' as const),
                parts: [{ text: m.text }],
            }));
    }, []);

    /** Lõi gửi tin — dùng chung cho cả nút Gửi lẫn nút Thử lại. */
    const send = useCallback(
        async (question: string, historySource: Message[]) => {
            lastQuestionRef.current = question;
            setIsTyping(true);
            scrollToEnd();
            try {
                const reply = await askShopAI(question, buildHistory(historySource));
                setMessages((prev) => [
                    ...prev,
                    { id: `bot-${Date.now()}`, text: reply, isBot: true, status: 'sent' },
                ]);
            } catch (error) {
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `err-${Date.now()}`,
                        text: toFriendlyError(error),
                        isBot: true,
                        status: 'error',
                    },
                ]);
            } finally {
                setIsTyping(false);
                scrollToEnd();
            }
        },
        [buildHistory],
    );

    const handleSend = useCallback(
        (overrideText?: string) => {
            const text = (overrideText ?? inputText).trim();
            if (!text || isTyping) return; // Chống spam: đang chờ AI thì không cho gửi tiếp

            const userMsg: Message = {
                id: `user-${Date.now()}`,
                text,
                isBot: false,
                status: 'sent',
            };
            const next = [...messages, userMsg];
            setMessages(next);
            setInputText(''); // Xoá ô nhập NGAY LẬP TỨC để user cảm thấy phản hồi tức thì
            send(text, next);
        },
        [inputText, isTyping, messages, send],
    );

    /** Nút Thử lại: xoá bong bóng lỗi cuối cùng rồi gửi lại đúng câu hỏi cũ. */
    const handleRetry = useCallback(() => {
        if (isTyping || !lastQuestionRef.current) return;
        const cleaned = messages.filter((m) => m.status !== 'error');
        setMessages(cleaned);
        send(lastQuestionRef.current, cleaned);
    }, [isTyping, messages, send]);

    const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
    const botBubbleBg = isDarkMode ? '#1E293B' : '#E2E8F0';
    const botTextColor = isDarkMode ? '#F1F5F9' : '#0F172A';
    const headerBg = isDarkMode ? '#0F172A' : '#FFFFFF';
    const inputAreaBg = isDarkMode ? '#0F172A' : '#FFFFFF';
    const inputBg = isDarkMode ? '#1E293B' : '#F1F5F9';

    const renderItem = ({ item }: { item: Message }) => (
        <View style={styles.messageRow}>
            <View
                style={[
                    styles.bubble,
                    item.isBot ? [styles.botBubble, { backgroundColor: botBubbleBg }] : styles.userBubble,
                    item.status === 'error' && styles.errorBubble,
                ]}
            >
                <Text
                    selectable // Cho phép chạm giữ để copy (Phần 8.10)
                    style={{
                        color: item.isBot
                            ? item.status === 'error'
                                ? '#DC2626'
                                : botTextColor
                            : '#FFFFFF',
                        fontSize: 15,
                        lineHeight: 22,
                    }}
                >
                    {item.text}
                </Text>
            </View>
            {item.status === 'error' && (
                <Pressable onPress={handleRetry} style={styles.retryBtn}>
                    <Text style={styles.retryText}>🔄 Thử lại</Text>
                </Pressable>
            )}
        </View>
    );

    /** Trạng thái rỗng: gợi ý sẵn câu hỏi để user biết hỏi gì (Phần 8.10). */
    const renderSuggestions = () => (
        <View style={styles.suggestBox}>
            <Text style={[styles.suggestTitle, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>
                💡 Gợi ý câu hỏi cho bạn:
            </Text>
            <View style={styles.chipRow}>
                {AI_SUGGESTIONS.map((s) => (
                    <Pressable
                        key={s}
                        style={[
                            styles.chip,
                            {
                                borderColor: isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary,
                                backgroundColor: isDarkMode
                                    ? 'rgba(0, 245, 212, 0.10)'
                                    : 'rgba(2, 132, 199, 0.08)',
                            },
                        ]}
                        onPress={() => handleSend(s)}
                        disabled={isTyping}
                    >
                        <Text
                            style={[
                                styles.chipText,
                                { color: isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary },
                            ]}
                        >
                            {s}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );

    const canSend = inputText.trim().length > 0 && !isTyping;

    return (
        <SafeAreaView
            style={[
                styles.safeArea,
                { backgroundColor: isDarkMode ? '#0B0F19' : COLORS.background },
            ]}
            edges={['top', 'bottom']}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {/* Header thanh lịch với nút Back và Trạng thái AI */}
                <View
                    style={[
                        styles.header,
                        {
                            backgroundColor: headerBg,
                            borderBottomColor: isDarkMode
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.06)',
                        },
                    ]}
                >
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={styles.backBtn}
                        hitSlop={12}
                    >
                        <Icon name="arrow-left" size={24} color={textColor} />
                    </Pressable>
                    <View style={styles.headerInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.headerTitle, { color: textColor }]}>
                                Tư vấn Shop<Text style={{ color: IOS26_COLORS.quantumCyan }}>AI</Text>
                            </Text>
                            <View style={styles.geminiBadge}>
                                <Text style={styles.geminiBadgeText}>Gemini</Text>
                            </View>
                        </View>
                        <Text
                            style={[
                                styles.headerSub,
                                { color: isTyping ? IOS26_COLORS.quantumCyan : '#10B981' },
                            ]}
                        >
                            {isTyping ? '● Đang soạn tin...' : '● Đang hoạt động'}
                        </Text>
                    </View>
                </View>

                {/* Danh sách tin nhắn */}
                <FlatList
                    ref={listRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={{ padding: SIZES.padding, flexGrow: 1 }}
                    onContentSizeChange={scrollToEnd}
                    keyboardShouldPersistTaps="handled"
                    ListFooterComponent={
                        <>
                            {messages.length <= 1 && renderSuggestions()}
                            {/* Typing indicator — bong bóng đang soạn tin */}
                            {isTyping && (
                                <View
                                    style={[
                                        styles.bubble,
                                        styles.botBubble,
                                        styles.typingBubble,
                                        { backgroundColor: botBubbleBg },
                                    ]}
                                >
                                    <ActivityIndicator
                                        size="small"
                                        color={isDarkMode ? IOS26_COLORS.quantumCyan : COLORS.primary}
                                    />
                                    <Text
                                        style={[
                                            styles.typingText,
                                            { color: isDarkMode ? '#94A3B8' : '#64748B' },
                                        ]}
                                    >
                                        {' '}Trợ lý đang suy nghĩ...
                                    </Text>
                                </View>
                            )}
                        </>
                    }
                />

                {/* Ô nhập tin nhắn */}
                <View
                    style={[
                        styles.inputArea,
                        {
                            backgroundColor: inputAreaBg,
                            borderTopColor: isDarkMode
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.06)',
                        },
                    ]}
                >
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: inputBg,
                                color: textColor,
                            },
                        ]}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Nhập câu hỏi tư vấn sản phẩm..."
                        placeholderTextColor={isDarkMode ? '#64748B' : '#94A3B8'}
                        maxLength={500}
                        editable={!isTyping}
                        multiline
                    />
                    <ShopButton
                        title="Gửi"
                        onPress={() => handleSend()}
                        isLoading={isTyping}
                        disabled={!canSend}
                        variant="liquid-cyan"
                        style={{
                            width: 76,
                            height: 42,
                            opacity: canSend ? 1 : 0.45,
                        }}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    backBtn: {
        padding: 4,
        marginRight: 12,
    },
    headerInfo: {
        flex: 1,
    },
    headerTitle: {
        fontSize: SIZES.h3,
        fontWeight: 'bold',
    },
    geminiBadge: {
        backgroundColor: 'rgba(0, 245, 212, 0.15)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    geminiBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: IOS26_COLORS.quantumCyan,
    },
    headerSub: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    messageRow: {
        marginBottom: 8,
    },
    bubble: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 20,
        maxWidth: '82%',
    },
    botBubble: {
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    userBubble: {
        backgroundColor: COLORS.primary,
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    errorBubble: {
        backgroundColor: '#FEE2E2',
        borderWidth: 1,
        borderColor: COLORS.error,
    },
    typingBubble: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        marginBottom: 8,
    },
    typingText: {
        fontSize: 13,
        marginLeft: 6,
    },
    retryBtn: {
        alignSelf: 'flex-start',
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    retryText: {
        color: COLORS.primary,
        fontWeight: '700',
        fontSize: 13,
    },
    suggestBox: {
        marginTop: 12,
        marginBottom: 16,
    },
    suggestTitle: {
        fontSize: 13,
        fontWeight: '600',
        marginBottom: 8,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        borderWidth: 1,
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    chipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    inputArea: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 10,
        alignItems: 'flex-end',
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        minHeight: 42,
        maxHeight: 110,
        borderRadius: 21,
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 10,
        marginRight: 8,
        fontSize: 15,
    },
});
