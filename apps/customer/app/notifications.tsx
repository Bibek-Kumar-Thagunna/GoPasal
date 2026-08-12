import React, { useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../src/design-system/primitives/GText';
import { colors } from '../src/design-system/tokens/colors';
import { spacing, radius } from '../src/design-system/tokens/spacing';
import { EmptyState } from '../src/components/StateViews';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotifications } from '../src/services/hooks';
import { apiClient } from '../src/services/api-client';
import { ENDPOINTS } from '../src/services/endpoints';
import { QUERY_KEYS } from '../src/constants';
import { useTranslation } from '../src/i18n';
import { WebPageShell } from '../src/components/WebPageShell';

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: notifications, isLoading } = useNotifications();
  
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(ENDPOINTS.notifications.read(id));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });

  const deleteNotif = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(ENDPOINTS.notifications.delete(id));
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });

  const deleteAllNotifs = useMutation({
    mutationFn: async () => {
      await apiClient.delete(ENDPOINTS.notifications.deleteAll);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.notifications });
    },
  });

  useEffect(() => {
    if (notifications) {
      notifications.forEach(n => {
        if (!n.isRead) {
          markRead.mutate(n.id);
        }
      });
    }
  }, [notifications]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <WebPageShell>
      <View style={styles.header}>
        <Pressable onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/' as any);
            }
          }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.neutral[800]} />
        </Pressable>
        <GText variant="h2" color={colors.neutral[900]}>{t('notifications.title')}</GText>
        {notifications && notifications.length > 0 ? (
          <Pressable 
            onPress={() => deleteAllNotifs.mutate()} 
            style={styles.clearBtn} 
            disabled={deleteAllNotifs.isPending}
          >
            <GText variant="bodySm" weight="medium" color={colors.error.dark}>Clear All</GText>
          </Pressable>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {!isLoading && (!notifications || notifications.length === 0) ? (
        <EmptyState icon="notifications-outline" title={t('notifications.allQuiet')} message={t('notifications.allQuietMsg')} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {notifications?.map((notif, i) => (
            <Animated.View key={notif.id} entering={FadeInDown.delay(i * 40).duration(300)}>
              <Pressable
                style={[styles.notifItem, !notif.isRead && styles.notifUnread]}
                onPress={() => {
                  if (!notif.isRead) markRead.mutate(notif.id);
                }}
              >
                <View style={[styles.notifIcon, !notif.isRead && styles.notifIconUnread]}>
                  <Ionicons
                    name={getNotifIcon(notif.type)}
                    size={20}
                    color={!notif.isRead ? colors.primary[600] : colors.neutral[400]}
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <GText variant="body" weight={notif.isRead ? 'regular' : 'semibold'} color={colors.neutral[900]}>
                    {notif.title}
                  </GText>
                  <GText variant="bodySm" color={colors.neutral[500]}>{notif.message}</GText>
                  <GText variant="caption" color={colors.neutral[400]}>
                    {new Date(notif.createdAt).toLocaleString()}
                  </GText>
                </View>
                {!notif.isRead && <View style={styles.unreadDot} />}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    deleteNotif.mutate(notif.id);
                  }}
                  style={styles.deleteBtn}
                  disabled={deleteNotif.isPending}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.neutral[400]} />
                </Pressable>
              </Pressable>
            </Animated.View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
      </WebPageShell>
    </SafeAreaView>
  );
}

function getNotifIcon(type: string): keyof typeof Ionicons.glyphMap {
  if (type.includes('order')) return 'receipt-outline';
  if (type.includes('delivery')) return 'bicycle-outline';
  if (type.includes('offer') || type.includes('promo')) return 'pricetag-outline';
  return 'notifications-outline';
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: spacing.lg, paddingBottom: spacing['2xl'], paddingTop: spacing.md },
  notifItem: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    // Modern shadow
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0,0,0,0.03)' } as any,
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 }
    })
  },
  notifUnread: { 
    backgroundColor: colors.mint[50], 
    borderColor: colors.mint[100],
  },
  notifIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center',
  },
  notifIconUnread: { backgroundColor: '#ffffff' },
  unreadDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: colors.primary[500],
  },
  deleteBtn: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  clearBtn: {
    height: 36,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.pill,
    backgroundColor: colors.error.light,
  },
});
