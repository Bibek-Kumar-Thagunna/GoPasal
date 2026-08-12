import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  Pressable,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import apiClient from '../../src/services/api';
import { useSellerWorkspace } from '../../src/hooks/useSellerWorkspace';
import { useSellerTenantReady } from '../../src/hooks/useSellerTenantReady';

function T({ style, children, n }: { style?: object; children: React.ReactNode; n?: number }) {
  return (
    <Animated.Text numberOfLines={n} style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]}>
      {children}
    </Animated.Text>
  );
}

type CouponRow = {
  id: string;
  code: string;
  type: 'FIXED' | 'PERCENT';
  value: string;
  minOrderValue: string | null;
  maxDiscount: string | null;
  startDate: string;
  endDate: string;
  status: string;
  usageLimitTotal: number | null;
  usageLimitPerUser: number | null;
  usedCount: number | null;
};

export default function PromotionsScreen() {
  const qc = useQueryClient();
  const { isReady } = useSellerTenantReady();
  const { activeStoreId, hasPermission } = useSellerWorkspace();
  const canManage = hasPermission('promotions.manage');
  const [modalOpen, setModalOpen] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'FIXED' | 'PERCENT'>('PERCENT');
  const [value, setValue] = useState('10');
  const [minOrder, setMinOrder] = useState('0');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().slice(0, 10);
  });

  const listQuery = useQuery({
    queryKey: ['seller-coupons', activeStoreId],
    queryFn: async () => {
      const { data } = await apiClient.get('/seller/coupons');
      return (data?.data ?? []) as CouponRow[];
    },
    enabled: isReady && canManage,
    retry: false,
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'ACTIVE' | 'PAUSED' }) => {
      await apiClient.patch(`/seller/coupons/${id}/status`, { status });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['seller-coupons'] });
    },
    onError: (e: unknown) => {
      const msg = isAxiosError(e) ? (e.response?.data as { message?: string })?.message : (e as Error).message;
      Alert.alert('Could not update coupon', msg || 'Try again');
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const v = Number(value);
      const minV = minOrder.trim() === '' ? 0 : Number(minOrder);
      if (!code.trim()) throw new Error('Enter a coupon code');
      if (!Number.isFinite(v) || v < 0) throw new Error('Invalid discount value');
      if (!Number.isFinite(minV) || minV < 0) throw new Error('Invalid minimum order');
      await apiClient.post('/seller/coupons', {
        code: code.trim(),
        type,
        value: v,
        minOrderValue: minV,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      });
    },
    onSuccess: async () => {
      setModalOpen(false);
      setCode('');
      setValue(type === 'PERCENT' ? '10' : '50');
      await qc.invalidateQueries({ queryKey: ['seller-coupons'] });
    },
    onError: (e: unknown) => {
      const msg = isAxiosError(e) ? (e.response?.data as { message?: string })?.message : (e as Error).message;
      Alert.alert('Could not create coupon', msg || 'Try again');
    },
  });

  const forbidden = isAxiosError(listQuery.error) && listQuery.error.response?.status === 403;
  const rows = listQuery.data ?? [];

  if (!canManage || forbidden) {
    return (
      <SafeAreaView style={styles.page} edges={['top']}>
        <View style={styles.header}>
          <T style={styles.title}>Promotions</T>
        </View>
        <View style={styles.center}>
          <Ionicons name="pricetag-outline" size={44} color={colors.neutral[300]} />
          <T style={styles.blockTitle}>No access</T>
          <T style={styles.blockSub}>Your role does not include managing store coupons.</T>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <View style={styles.headerRow}>
        <View>
          <T style={styles.title}>Promotions</T>
          <T style={styles.hint}>Store-scoped discount codes</T>
        </View>
        <Pressable style={styles.addBtn} onPress={() => setModalOpen(true)}>
          <Ionicons name="add" size={22} color="#fff" />
          <T style={styles.addBtnTxt}>New</T>
        </Pressable>
      </View>

      {listQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary[600]} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={listQuery.isRefetching} onRefresh={() => void listQuery.refetch()} />
          }
        >
          {rows.length === 0 ? (
            <View style={styles.empty}>
              <T style={styles.emptyTitle}>No coupons yet</T>
              <T style={styles.emptySub}>Create a code customers can apply at checkout (when checkout supports it).</T>
            </View>
          ) : (
            rows.map((c, i) => (
              <Animated.View key={c.id} entering={FadeInDown.delay(Math.min(i, 10) * 40)} style={styles.card}>
                <View style={styles.cardLeft}>
                  <T style={styles.code}>{c.code}</T>
                  <T style={styles.meta}>
                    {c.type === 'PERCENT' ? `${c.value}% off` : `NPR ${c.value} off`} · min NPR {c.minOrderValue ?? '0'}
                  </T>
                  <T style={styles.dates} n={2}>
                    {String(c.startDate).slice(0, 10)} → {String(c.endDate).slice(0, 10)}
                  </T>
                </View>
                <Pressable
                  style={[styles.statusPill, c.status !== 'ACTIVE' && styles.statusOff]}
                  onPress={() => {
                    const next = c.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
                    statusMut.mutate({ id: c.id, status: next });
                  }}
                >
                  <T style={styles.statusTxt}>
                    {statusMut.isPending ? '…' : c.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                  </T>
                </Pressable>
              </Animated.View>
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={modalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHead}>
              <T style={styles.modalTitle}>New coupon</T>
              <Pressable onPress={() => !createMut.isPending && setModalOpen(false)}>
                <Ionicons name="close" size={24} color={colors.neutral[600]} />
              </Pressable>
            </View>
            <T style={styles.lab}>Code</T>
            <TextInput
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              placeholder="SAVE10"
              placeholderTextColor={colors.neutral[400]}
              style={styles.input}
            />
            <T style={styles.lab}>Type</T>
            <View style={styles.typeRow}>
              {(['PERCENT', 'FIXED'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[styles.typeChip, type === t && styles.typeChipOn]}
                >
                  <T style={[styles.typeChipTxt, type === t && styles.typeChipTxtOn]}>{t === 'PERCENT' ? '%' : 'Fixed NPR'}</T>
                </Pressable>
              ))}
            </View>
            <T style={styles.lab}>{type === 'PERCENT' ? 'Percent off' : 'Amount off (NPR)'}</T>
            <TextInput
              value={value}
              onChangeText={setValue}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <T style={styles.lab}>Minimum order (NPR)</T>
            <TextInput
              value={minOrder}
              onChangeText={setMinOrder}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <T style={styles.lab}>Start</T>
                <TextInput value={startDate} onChangeText={setStartDate} style={styles.input} />
              </View>
              <View style={{ width: spacing.md }} />
              <View style={{ flex: 1 }}>
                <T style={styles.lab}>End</T>
                <TextInput value={endDate} onChangeText={setEndDate} style={styles.input} />
              </View>
            </View>
            <Pressable
              style={[styles.submit, createMut.isPending && { opacity: 0.6 }]}
              disabled={createMut.isPending}
              onPress={() => createMut.mutate()}
            >
              {createMut.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <T style={styles.submitTxt}>Create coupon</T>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  header: { paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  title: { fontFamily: 'Poppins-Bold', fontSize: 26, color: colors.neutral[900] },
  hint: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[500], marginTop: 2 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary[600],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  addBtnTxt: { fontFamily: 'Poppins-SemiBold', color: '#fff', fontSize: 14 },
  list: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.neutral[150],
    marginBottom: spacing.sm,
  },
  cardLeft: { flex: 1 },
  code: { fontFamily: 'Poppins-Bold', fontSize: 18, color: colors.neutral[900] },
  meta: { fontFamily: 'Inter', fontSize: 13, color: colors.neutral[600], marginTop: 4 },
  dates: { fontFamily: 'Inter', fontSize: 11, color: colors.neutral[400], marginTop: 4 },
  statusPill: {
    backgroundColor: colors.success.light,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  statusOff: { backgroundColor: colors.neutral[150] },
  statusTxt: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: colors.success.dark },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: spacing['2xl'], alignItems: 'center' },
  emptyTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 17, color: colors.neutral[800] },
  emptySub: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500], textAlign: 'center', marginTop: 8 },
  blockTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 18, marginTop: spacing.md },
  blockSub: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[500], textAlign: 'center', marginTop: 6 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing['2xl'],
    paddingBottom: spacing['3xl'],
  },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  modalTitle: { fontFamily: 'Poppins-Bold', fontSize: 20, color: colors.neutral[900] },
  lab: { fontFamily: 'Inter-SemiBold', fontSize: 12, color: colors.neutral[600], marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontFamily: 'Inter',
    fontSize: 15,
    color: colors.neutral[900],
  },
  typeRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  typeChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  typeChipOn: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  typeChipTxt: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.neutral[600] },
  typeChipTxtOn: { color: colors.primary[700] },
  row2: { flexDirection: 'row' },
  submit: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary[600],
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  submitTxt: { fontFamily: 'Poppins-SemiBold', color: '#fff', fontSize: 16 },
});
