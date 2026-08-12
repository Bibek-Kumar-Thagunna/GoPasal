import React, { useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { apiClient } from '../services/api-client';
import { useTranslation } from '../i18n';

type Message = { role: 'user' | 'bot'; text: string };

const QUICK_PROMPTS = ['Where is my order?', 'An item is missing', 'Talk to an agent'];

export function SupportChatWidget() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: t('support.chatGreeting', {
        defaultValue: "Hi! I'm the GoPasal assistant. Ask about your order status, missing items, or refunds.",
      }),
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const scrollRef = useRef<ScrollView>(null);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', text: trimmed }]);
    setBusy(true);
    try {
      const { data } = await apiClient.post<{
        data: { reply: string; action: string; conversationId: string };
      }>('/support/chat', { message: trimmed, conversationId });
      setConversationId(data.data.conversationId);
      setMessages((m) => [...m, { role: 'bot', text: data.data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: 'bot', text: t('support.chatError', { defaultValue: "I couldn't reach support right now. Try again or call us directly." }) },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Ionicons name="sparkles" size={16} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <GText variant="h4" color={colors.neutral[900]}>
            {t('support.chatTitle', { defaultValue: 'GoPasal Assistant' })}
          </GText>
          <GText variant="caption" color={colors.success.dark}>
            {t('support.chatOnline', { defaultValue: 'Instant answers' })}
          </GText>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.thread}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((m, i) => (
          <View
            key={i}
            style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleBot]}
          >
            <GText
              variant="bodySm"
              color={m.role === 'user' ? '#fff' : colors.neutral[800]}
              style={{ lineHeight: 19 }}
            >
              {m.text}
            </GText>
          </View>
        ))}
        {busy ? (
          <View style={[styles.bubble, styles.bubbleBot, styles.typing]}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.quickRow}>
        {QUICK_PROMPTS.map((q) => (
          <Pressable
            key={q}
            disabled={busy}
            onPress={() => void send(q)}
            style={styles.quickChip}
          >
            <GText variant="caption" color={colors.primary[700]}>{q}</GText>
          </Pressable>
        ))}
      </View>

      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => void send(input)}
          placeholder={t('support.chatPlaceholder', { defaultValue: 'Type your question…' })}
          placeholderTextColor={colors.neutral[400]}
          style={styles.input}
          multiline
        />
        <Pressable
          disabled={busy || !input.trim()}
          onPress={() => void send(input)}
          style={[styles.sendBtn, (busy || !input.trim()) && styles.sendBtnDisabled]}
        >
          <Ionicons name="arrow-up" size={18} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    padding: spacing.md,
    ...Platform.select({
      web: { boxShadow: '0 10px 30px rgba(15,23,42,0.06)' } as object,
      default: {},
    }),
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  thread: { maxHeight: 260, minHeight: 120 },
  bubble: {
    maxWidth: '86%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    marginBottom: spacing.xs,
  },
  bubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primary[600] },
  bubbleBot: { alignSelf: 'flex-start', backgroundColor: colors.neutral[100] },
  typing: { width: 48, alignItems: 'center' },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary[200],
    backgroundColor: colors.primary[50],
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    maxHeight: 100,
    fontSize: 15,
    color: colors.neutral[900],
    backgroundColor: colors.surface.background,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
