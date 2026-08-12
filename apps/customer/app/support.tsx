import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  TextInput,
  Linking,
  Platform,
  useWindowDimensions,
  LayoutAnimation,
  UIManager,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { GText } from '../src/design-system/primitives/GText';
import { Button } from '../src/design-system/primitives/Button';
import { colors } from '../src/design-system/tokens/colors';
import { spacing, radius } from '../src/design-system/tokens/spacing';
import { apiClient } from '../src/services/api-client';
import { ENDPOINTS } from '../src/services/endpoints';
import { useOrders } from '../src/services/hooks';
import { useAuthStore } from '../src/store/auth.store';
import { useTranslation, type TranslationKey } from '../src/i18n';
import { WebPageShell } from '../src/components/WebPageShell';
import { SupportChatWidget } from '../src/components/SupportChatWidget';
import { formatMoney } from '../src/utils/money';
import type { Order } from '../src/types';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SUPPORT_PHONE = '+97715970000';
const SUPPORT_EMAIL = 'support@gopasal.com';
const SUPPORT_WHATSAPP = '9779800000000';

type ContactAction = {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  labelKey: TranslationKey;
  detailKey?: TranslationKey;
  detailRaw?: string;
  tint: string;
  url: string;
};

const CONTACT_ACTIONS: ContactAction[] = [
  {
    key: 'call',
    icon: 'call',
    labelKey: 'support.callUs',
    detailKey: 'support.callDetail',
    tint: colors.primary[500],
    url: `tel:${SUPPORT_PHONE}`,
  },
  {
    key: 'whatsapp',
    icon: 'logo-whatsapp',
    labelKey: 'support.whatsapp',
    detailKey: 'support.whatsappDetail',
    tint: '#25D366',
    url: `https://wa.me/${SUPPORT_WHATSAPP}`,
  },
  {
    key: 'email',
    icon: 'mail',
    labelKey: 'support.email',
    detailRaw: SUPPORT_EMAIL,
    tint: colors.info.main,
    url: `mailto:${SUPPORT_EMAIL}`,
  },
];

const FAQS: { qKey: TranslationKey; aKey: TranslationKey }[] = [
  { qKey: 'support.faq1q', aKey: 'support.faq1a' },
  { qKey: 'support.faq2q', aKey: 'support.faq2a' },
  { qKey: 'support.faq3q', aKey: 'support.faq3a' },
  { qKey: 'support.faq4q', aKey: 'support.faq4a' },
  { qKey: 'support.faq5q', aKey: 'support.faq5a' },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING_PAYMENT: { bg: colors.warning.light, text: colors.warning.dark },
  PLACED: { bg: colors.warning.light, text: colors.warning.dark },
  ACCEPTED: { bg: colors.info.light, text: colors.info.dark },
  CONFIRMED: { bg: colors.info.light, text: colors.info.dark },
  PACKED: { bg: colors.info.light, text: colors.info.dark },
  OUT_FOR_DELIVERY: { bg: colors.info.light, text: colors.info.dark },
  DELIVERED: { bg: colors.success.light, text: colors.success.dark },
  CANCELLED: { bg: colors.error.light, text: colors.error.dark },
};

const KNOWN_STATUSES = new Set([
  'PENDING_PAYMENT', 'PLACED', 'ACCEPTED', 'CONFIRMED', 'PACKED', 'SHIPPED',
  'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'PENDING', 'PREPARING', 'READY',
]);

function translateStatus(t: (key: TranslationKey) => string, status: string): string {
  if (KNOWN_STATUSES.has(status)) return t(`status.${status}` as TranslationKey);
  return status;
}

function formatOrderDateTime(date: string): string {
  try {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return date;
  }
}

function orderShortId(id: string): string {
  return id.slice(0, 8).toLowerCase();
}

export default function SupportScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const [orderId, setOrderId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [focusField, setFocusField] = useState<'reason' | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const orderList = orders ?? [];
  const selectedOrder = useMemo(
    () => orderList.find((o) => o.id === orderId) ?? null,
    [orderList, orderId],
  );

  const handleSelectOrder = (order: Order) => {
    setOrderId(order.id);
    setPickerOpen(false);
    setFormError(null);
  };

  const handleContact = (url: string) => {
    Linking.openURL(url).catch(() => {
      setFormError(t('support.errContact'));
    });
  };

  const handleToggleFaq = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenFaq((prev) => (prev === index ? null : index));
  };

  const resetForm = () => {
    setOrderId('');
    setReason('');
    setFormError(null);
    setSubmitted(false);
  };

  const handleSubmit = async () => {
    setFormError(null);
    if (!orderId.trim()) {
      setFormError(t('support.errOrderId'));
      return;
    }
    if (reason.trim().length < 5) {
      setFormError(t('support.errReason'));
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post(ENDPOINTS.disputes.create, {
        orderId: orderId.trim(),
        reason: reason.trim(),
      });
      setSubmitted(true);
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: { message?: string } })?.error?.message ??
          t('support.errSubmit')
        : t('support.errSubmit');
      setFormError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <WebPageShell maxWidth={760}>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/' as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <GText variant="h3" color={colors.neutral[900]}>{t('support.title')}</GText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Intro */}
          <View style={styles.intro}>
            <GText variant="h1" color={colors.neutral[900]}>{t('support.howCanWeHelp')}</GText>
            <GText variant="body" color={colors.neutral[500]} style={styles.introSub}>
              {t('support.intro')}
            </GText>
          </View>

          {/* AI assistant */}
          <View style={styles.section}>
            <SupportChatWidget />
          </View>

          {/* Quick contact actions */}
          <View style={[styles.contactRow, isWide && styles.contactRowWide]}>
            {CONTACT_ACTIONS.map((action) => (
              <Pressable
                key={action.key}
                style={({ pressed }) => [styles.contactCard, pressed && styles.pressed]}
                onPress={() => handleContact(action.url)}
              >
                <View style={[styles.contactIcon, { backgroundColor: `${action.tint}1A` }]}>
                  <Ionicons name={action.icon} size={22} color={action.tint} />
                </View>
                <View style={styles.contactText}>
                  <GText variant="h4" color={colors.neutral[900]}>{t(action.labelKey)}</GText>
                  <GText variant="bodySm" color={colors.neutral[500]} numberOfLines={1}>
                    {action.detailKey ? t(action.detailKey) : action.detailRaw}
                  </GText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
              </Pressable>
            ))}
          </View>

          {/* FAQ */}
          <View style={styles.section}>
            <GText variant="sectionLabel" color={colors.neutral[500]} style={styles.sectionLabel}>
              {t('support.faqTitle')}
            </GText>
            <View style={styles.faqCard}>
              {FAQS.map((faq, index) => {
                const open = openFaq === index;
                return (
                  <View key={faq.qKey} style={[styles.faqItem, index === FAQS.length - 1 && styles.faqItemLast]}>
                    <Pressable
                      style={styles.faqHead}
                      onPress={() => handleToggleFaq(index)}
                      accessibilityRole="button"
                    >
                      <GText variant="body" weight="semibold" color={colors.neutral[900]} style={styles.faqQ}>
                        {t(faq.qKey)}
                      </GText>
                      <Ionicons
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.neutral[500]}
                      />
                    </Pressable>
                    {open ? (
                      <GText variant="bodySm" color={colors.neutral[600]} style={styles.faqA}>
                        {t(faq.aKey)}
                      </GText>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Report an issue */}
          <View style={styles.section}>
            <GText variant="sectionLabel" color={colors.neutral[500]} style={styles.sectionLabel}>
              {t('support.reportTitle')}
            </GText>

            {submitted ? (
              <View style={styles.successCard}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={44} color={colors.success.main} />
                </View>
                <GText variant="h3" color={colors.neutral[900]} align="center">
                  {t('support.requestSubmitted')}
                </GText>
                <GText variant="body" color={colors.neutral[500]} align="center" style={styles.successText}>
                  {t('support.requestSubmittedMsg')}
                </GText>
                <View style={styles.successBtns}>
                  <Button label={t('common.backToHome')} fullWidth onPress={() => router.replace('/' as any)} />
                  <Pressable onPress={resetForm} style={styles.linkBtn}>
                    <GText variant="button" color={colors.primary[600]}>{t('support.submitAnother')}</GText>
                  </Pressable>
                </View>
              </View>
            ) : (
              <View style={styles.formCard}>
                <GText variant="bodySm" color={colors.neutral[500]}>
                  {t('support.disputeIntro')}
                </GText>

                <GText variant="bodySm" weight="semibold" style={styles.label}>{t('support.orderId')}</GText>

                {!isAuthenticated ? (
                  <View style={styles.authPrompt}>
                    <GText variant="bodySm" color={colors.neutral[600]}>{t('support.signInPrompt')}</GText>
                    <Button
                      label={t('common.login')}
                      variant="outline"
                      fullWidth
                      onPress={() => router.push('/(auth)/login')}
                    />
                  </View>
                ) : ordersLoading ? (
                  <View style={styles.orderPickerLoading}>
                    <ActivityIndicator size="small" color={colors.primary[500]} />
                  </View>
                ) : orderList.length === 0 ? (
                  <View style={styles.emptyOrders}>
                    <Ionicons name="receipt-outline" size={28} color={colors.neutral[400]} />
                    <GText variant="body" weight="semibold" color={colors.neutral[800]} align="center">
                      {t('support.noOrders')}
                    </GText>
                    <GText variant="bodySm" color={colors.neutral[500]} align="center">
                      {t('support.noOrdersMsg')}
                    </GText>
                    <Pressable
                      onPress={() => router.push('/(tabs)/orders' as any)}
                      style={styles.viewOrdersLink}
                    >
                      <GText variant="button" color={colors.primary[600]}>{t('support.viewOrders')}</GText>
                      <Ionicons name="arrow-forward" size={16} color={colors.primary[600]} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={({ pressed }) => [
                      styles.orderPicker,
                      selectedOrder && styles.orderPickerSelected,
                      pressed && styles.pressed,
                    ]}
                    onPress={() => setPickerOpen(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t('support.selectOrderPlaceholder')}
                  >
                    {selectedOrder ? (
                      <View style={styles.orderPickerContent}>
                        <View style={styles.orderPickerMain}>
                          <GText variant="body" weight="semibold" color={colors.neutral[900]} numberOfLines={1} style={{ flex: 1, marginRight: spacing.sm }}>
                            {selectedOrder.items?.length > 0 
                              ? `${selectedOrder.items[0].productName}${selectedOrder.items.length > 1 ? ` +${selectedOrder.items.length - 1} more` : ''}` 
                              : `Order #${orderShortId(selectedOrder.id)}`}
                          </GText>
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor:
                                  (STATUS_COLORS[selectedOrder.status] ?? STATUS_COLORS.PLACED).bg,
                              },
                            ]}
                          >
                            <GText
                              variant="caption"
                              weight="semibold"
                              color={(STATUS_COLORS[selectedOrder.status] ?? STATUS_COLORS.PLACED).text}
                            >
                              {translateStatus(t, selectedOrder.status)}
                            </GText>
                          </View>
                        </View>
                        <View style={styles.orderPickerMeta}>
                          <GText variant="caption" color={colors.neutral[500]}>
                            {formatOrderDateTime(selectedOrder.createdAt)}
                          </GText>
                          <GText variant="bodySm" weight="semibold" color={colors.primary[700]}>
                            {formatMoney(selectedOrder.total)}
                          </GText>
                        </View>
                      </View>
                    ) : (
                      <GText variant="body" color={colors.neutral[400]}>
                        {t('support.selectOrderPlaceholder')}
                      </GText>
                    )}
                    <Ionicons name="chevron-down" size={18} color={colors.neutral[500]} />
                  </Pressable>
                )}

                <Modal
                  visible={pickerOpen}
                  animationType="slide"
                  transparent
                  onRequestClose={() => setPickerOpen(false)}
                >
                  <Pressable style={styles.sheetOverlay} onPress={() => setPickerOpen(false)}>
                    <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
                      <View style={styles.sheetHandle} />
                      <GText variant="h3" color={colors.neutral[900]}>{t('support.pickOrderTitle')}</GText>
                      <ScrollView
                        style={styles.sheetList}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                      >
                        {orderList.map((order) => {
                          const selected = order.id === orderId;
                          const statusColor = STATUS_COLORS[order.status] ?? STATUS_COLORS.PLACED;
                          return (
                            <Pressable
                              key={order.id}
                              style={[styles.orderRow, selected && styles.orderRowSelected]}
                              onPress={() => handleSelectOrder(order)}
                            >
                              <View style={styles.orderRowBody}>
                                <View style={styles.orderRowTop}>
                                  <GText variant="body" weight="semibold" color={colors.neutral[900]} numberOfLines={1} style={{ flex: 1, marginRight: spacing.sm }}>
                                    {order.items?.length > 0 
                                      ? `${order.items[0].productName}${order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}` 
                                      : `Order #${orderShortId(order.id)}`}
                                  </GText>
                                  <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                                    <GText variant="caption" weight="semibold" color={statusColor.text}>
                                      {translateStatus(t, order.status)}
                                    </GText>
                                  </View>
                                </View>
                                <View style={styles.orderRowMeta}>
                                  <GText variant="caption" color={colors.neutral[500]}>
                                    {formatOrderDateTime(order.createdAt)}
                                  </GText>
                                  <GText variant="bodySm" weight="semibold" color={colors.primary[700]}>
                                    {formatMoney(order.total)}
                                  </GText>
                                </View>
                              </View>
                              <Ionicons
                                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                                size={22}
                                color={selected ? colors.primary[500] : colors.neutral[300]}
                              />
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </Pressable>
                  </Pressable>
                </Modal>

                <GText variant="bodySm" weight="semibold" style={styles.label}>{t('support.whatWrong')}</GText>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder={t('support.describePlaceholder')}
                  multiline
                  numberOfLines={4}
                  style={[styles.input, styles.textArea, focusField === 'reason' && styles.inputFocused]}
                  placeholderTextColor={colors.neutral[400]}
                  textAlignVertical="top"
                  onFocus={() => setFocusField('reason')}
                  onBlur={() => setFocusField(null)}
                />

                {formError ? (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle" size={16} color={colors.error.main} />
                    <GText variant="bodySm" color={colors.error.main} style={{ flex: 1 }}>
                      {formError}
                    </GText>
                  </View>
                ) : null}

                <Button
                  label={submitting ? t('support.submitting') : t('support.submitRequest')}
                  fullWidth
                  loading={submitting}
                  onPress={() => void handleSubmit()}
                  style={styles.submitBtn}
                />
              </View>
            )}
          </View>
        </View>
      </ScrollView>
      </WebPageShell>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[150],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingBottom: spacing['4xl'] },
  container: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  intro: { gap: spacing.xs, marginBottom: spacing.xl },
  introSub: { maxWidth: 560 },

  contactRow: { gap: spacing.md, marginBottom: spacing['2xl'] },
  contactRowWide: { flexDirection: 'row' },
  contactCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pressed: { opacity: 0.7 },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: { flex: 1, gap: 2 },

  section: { marginBottom: spacing['2xl'] },
  sectionLabel: { marginBottom: spacing.sm },

  faqCard: {
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  faqItem: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  faqItemLast: { borderBottomWidth: 0 },
  faqHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  faqQ: { flex: 1 },
  faqA: { marginTop: spacing.sm, lineHeight: 20 },

  formCard: {
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  label: { marginTop: spacing.sm },
  input: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    color: colors.neutral[900],
    backgroundColor: colors.surface.card,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  inputFocused: { borderColor: colors.primary[400] },
  textArea: { minHeight: 110 },
  authPrompt: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  orderPickerLoading: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.lg,
  },
  emptyOrders: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  viewOrdersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  orderPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface.card,
  },
  orderPickerSelected: {
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  orderPickerContent: { flex: 1, gap: spacing.xs },
  orderPickerMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  orderPickerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
    maxHeight: '70%',
    gap: spacing.md,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral[300],
    marginBottom: spacing.xs,
  },
  sheetList: { maxHeight: 420 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    backgroundColor: colors.surface.card,
    marginBottom: spacing.sm,
  },
  orderRowSelected: {
    borderColor: colors.primary[400],
    backgroundColor: colors.primary[50],
  },
  orderRowBody: { flex: 1, gap: spacing.xs },
  orderRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  orderRowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.error.light,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
  },
  submitBtn: { marginTop: spacing.sm },

  successCard: {
    alignItems: 'center',
    backgroundColor: colors.surface.card,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  successText: { maxWidth: 420 },
  successBtns: { width: '100%', maxWidth: 320, gap: spacing.sm, marginTop: spacing.md },
  linkBtn: { alignItems: 'center', paddingVertical: spacing.sm },
});
