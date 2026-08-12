import React, { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import {
  View,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../src/services/api';
import { useAuthStore } from '../../src/store/auth.store';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing, radius } from '../../src/design-system/tokens/spacing';
import { useSellerWorkspace } from '../../src/hooks/useSellerWorkspace';
import { useSellerTenantReady } from '../../src/hooks/useSellerTenantReady';
import { usePublicConfig } from '../../src/hooks/usePublicConfig';
import { StoreDeliveryLocationSection } from '../../src/components/store/StoreDeliveryLocationSection';
import { StoreDeliveryChargesSection } from '../../src/components/store/StoreDeliveryChargesSection';
import { formatCoordinate, validateStoreGeoPayload } from '../../src/utils/coordinates';
import {
  buildDeliveryChargesPayload,
  readStoreDeliveryCharges,
} from '../../src/utils/store-delivery-charges';

const SHOP_TYPES = ['GROCERY', 'PHARMACY', 'RESTAURANT', 'ELECTRONICS'];
const ALL_DELIVERY_TYPES = [
  { id: 'MERCHANT_SELF', label: 'We deliver (our staff / shop)' },
  { id: 'PICKUP_ONLY', label: 'Pickup only (no delivery)' },
  { id: 'PLATFORM', label: 'GoPasal fleet delivery' },
  { id: 'HYBRID', label: 'Merchant + GoPasal fleet (advanced)' },
] as const;

const ROLE_OPTS = ['MANAGER', 'CASHIER', 'PACKER', 'DRIVER'] as const;
type StaffRole = (typeof ROLE_OPTS)[number];

function T({ style, children, n }: any) {
  return (
    <Animated.Text numberOfLines={n} style={[{ fontFamily: 'Poppins', color: colors.neutral[900] }, style]}>
      {children}
    </Animated.Text>
  );
}

function formatStaffRoles(row: { roles?: { role: string }[]; role?: string }) {
  const fromJunction = row.roles?.map((x) => x.role).filter(Boolean);
  if (fromJunction && fromJunction.length > 0) return fromJunction.join(' · ');
  if (row.role) return String(row.role);
  return '—';
}

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const qc = useQueryClient();
  const { isReady } = useSellerTenantReady();
  const { platformDeliveryEnabled } = usePublicConfig();
  const { payload: storePayload, isLoading, hasPermission, accessRole, refetch: refetchWorkspace } =
    useSellerWorkspace();

  const deliveryTypes = ALL_DELIVERY_TYPES.filter(
    (t) =>
      t.id === 'MERCHANT_SELF' ||
      t.id === 'PICKUP_ONLY' ||
      platformDeliveryEnabled
  );

  const canStaffManage = hasPermission('staff.manage');
  const canAnnounceView = hasPermission('announcements.view');
  const canAnnounceManage = hasPermission('announcements.manage');
  const canEditStoreProfile = accessRole === 'OWNER';

  const primaryStoreId =
    storePayload?.stores?.find((s: { parentStoreId?: string | null }) => !s.parentStoreId)?.id ??
    (storePayload?.store as { id?: string } | undefined)?.id;

  const { mutate: updateStore, isPending: isUpdating } = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      await apiClient.put('/seller/stores/me', payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['seller-stores-me'] });
      void refetchWorkspace();
      Alert.alert('Success', 'Store updated successfully');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update store');
    },
  });

  const [form, setForm] = useState({
    name: '',
    address: '',
    description: '',
    shopType: 'GROCERY',
    deliveryType: 'MERCHANT_SELF',
    latitudeText: '',
    longitudeText: '',
    radiusText: '3',
    deliveryFeeText: '',
    freeDeliveryThresholdText: '',
    alwaysFreeDelivery: false,
  });

  const [branchName, setBranchName] = useState('');
  const [branchSlug, setBranchSlug] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteRoles, setInviteRoles] = useState<StaffRole[]>(['MANAGER']);

  const [roleModal, setRoleModal] = useState<{ staffId: string; roles: StaffRole[] } | null>(null);

  useEffect(() => {
    const s = storePayload?.store as Record<string, unknown> | undefined;
    if (!s) return;
    const dt = String(s.deliveryType || 'MERCHANT_SELF');
    const lat = s.latitude as number | null | undefined;
    const lon = s.longitude as number | null | undefined;
    const radius = s.deliveryRadius as number | null | undefined;
    const deliveryCharges = readStoreDeliveryCharges(s.metadata);
    setForm({
      name: String(s.name || ''),
      address: String(s.address || ''),
      description: String(s.description || ''),
      shopType: String(s.shopType || 'GROCERY'),
      deliveryType: dt === 'SELF' ? 'MERCHANT_SELF' : dt,
      latitudeText: formatCoordinate(lat ?? null),
      longitudeText: formatCoordinate(lon ?? null),
      radiusText: radius != null && Number.isFinite(radius) ? String(radius) : '3',
      ...deliveryCharges,
    });
  }, [storePayload]);

  const requiresDeliveryArea =
    form.deliveryType === 'MERCHANT_SELF' ||
    form.deliveryType === 'PLATFORM' ||
    form.deliveryType === 'HYBRID';

  const handleSaveStoreProfile = () => {
    if (!canEditStoreProfile) return;

    const geo = validateStoreGeoPayload({
      latitudeText: form.latitudeText,
      longitudeText: form.longitudeText,
      radiusText: form.radiusText,
      requiresDeliveryArea,
    });

    if (geo.ok === false) {
      Alert.alert('Location required', geo.message);
      return;
    }

    const pickupOnly = form.deliveryType === 'PICKUP_ONLY';
    const deliveryPayload = buildDeliveryChargesPayload({
      deliveryFeeText: form.deliveryFeeText,
      freeDeliveryThresholdText: form.freeDeliveryThresholdText,
      alwaysFreeDelivery: form.alwaysFreeDelivery,
      pickupOnly,
    });

    if (deliveryPayload && 'invalid' in deliveryPayload) {
      Alert.alert('Delivery charges', 'Enter valid amounts (0 or greater) for delivery fee and threshold.');
      return;
    }

    const payload: Record<string, unknown> = {
      name: form.name,
      address: form.address,
      description: form.description,
      shopType: form.shopType,
      deliveryType: form.deliveryType,
    };
    if (geo.latitude != null && geo.longitude != null) {
      payload.latitude = geo.latitude;
      payload.longitude = geo.longitude;
    }
    if (requiresDeliveryArea && geo.deliveryRadius != null) {
      payload.deliveryRadius = geo.deliveryRadius;
    } else if (geo.deliveryRadius != null) {
      payload.deliveryRadius = geo.deliveryRadius;
    }
    if (deliveryPayload) {
      Object.assign(payload, deliveryPayload);
    }
    updateStore(payload);
  };

  const storeId = (storePayload?.store as { id?: string } | undefined)?.id;

  const { data: staffList = [], refetch: refetchStaff } = useQuery({
    queryKey: ['seller-staff', storeId],
    queryFn: async () => {
      if (!storeId || !canStaffManage) return [];
      const { data } = await apiClient.get(`/seller/staff/${storeId}`);
      return data?.data ?? [];
    },
    enabled: isReady && !!storeId && canStaffManage,
  });

  const { data: announcements = [], refetch: refetchAnnouncements } = useQuery({
    queryKey: ['seller-announcements', storeId],
    queryFn: async () => {
      if (!storeId || !canAnnounceView) return [];
      const { data } = await apiClient.get('/seller/announcements');
      return data?.data ?? [];
    },
    enabled: isReady && !!storeId && canAnnounceView,
  });

  const toggleInviteRole = (r: StaffRole) => {
    setInviteRoles((prev) => {
      const has = prev.includes(r);
      if (has && prev.length === 1) return prev;
      if (has) return prev.filter((x) => x !== r);
      return [...prev, r];
    });
  };

  const { mutate: inviteStaff, isPending: inviting } = useMutation({
    mutationFn: async () => {
      if (!storeId) return;
      await apiClient.post(`/seller/staff/${storeId}/invite`, {
        phone: invitePhone.trim(),
        roles: inviteRoles,
      });
    },
    onSuccess: () => {
      setInvitePhone('');
      void refetchStaff();
      void qc.invalidateQueries({ queryKey: ['seller-stores-me'] });
      Alert.alert('Success', 'Staff member added (they must already have a GoPasal account on this phone).');
    },
    onError: (err: any) => {
      Alert.alert('Invite failed', err.response?.data?.error?.message || 'Could not invite staff');
    },
  });

  const { mutate: saveStaffRoles, isPending: savingRoles } = useMutation({
    mutationFn: async (payload: { staffId: string; roles: StaffRole[] }) => {
      if (!storeId) return;
      await apiClient.put(`/seller/staff/${storeId}/${payload.staffId}/roles`, {
        roles: payload.roles,
      });
    },
    onSuccess: () => {
      setRoleModal(null);
      void refetchStaff();
      Alert.alert('Updated', 'Roles saved for this team member.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.error?.message || 'Could not update roles');
    },
  });

  const [annTitle, setAnnTitle] = useState('');
  const [annBody, setAnnBody] = useState('');
  const [annScope, setAnnScope] = useState<'ALL_BRANCHES' | 'SINGLE_STORE'>('ALL_BRANCHES');

  const { mutate: postAnnouncement, isPending: postingAnn } = useMutation({
    mutationFn: async () => {
      await apiClient.post('/seller/announcements', {
        scope: annScope,
        title: annTitle.trim(),
        body: annBody.trim(),
      });
    },
    onSuccess: () => {
      setAnnTitle('');
      setAnnBody('');
      void refetchAnnouncements();
      Alert.alert('Posted', 'Your notice is visible to the team.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.error?.message || 'Could not post notice');
    },
  });

  const { mutate: createBranch, isPending: creatingBranch } = useMutation({
    mutationFn: async () => {
      if (!primaryStoreId) throw new Error('No primary store');
      await apiClient.post('/seller/stores', {
        name: branchName.trim(),
        slug: branchSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        parentStoreId: primaryStoreId,
        deliveryType: form.deliveryType,
      });
    },
    onSuccess: () => {
      setBranchName('');
      setBranchSlug('');
      qc.invalidateQueries({ queryKey: ['seller-stores-me'] });
      Alert.alert('Success', 'Branch created. Switch to it from the sidebar store card.');
    },
    onError: (err: any) => {
      Alert.alert('Branch', err.response?.data?.error?.message || 'Could not create branch');
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator color={colors.hero.gradientStart} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.page} edges={['top']}>
      <Modal visible={!!roleModal} transparent animationType="fade" onRequestClose={() => setRoleModal(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRoleModal(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <T style={styles.modalTitle}>Roles for this member</T>
            <View style={styles.pillsRow}>
              {ROLE_OPTS.map((r) => {
                const on = roleModal?.roles.includes(r);
                return (
                  <Pressable
                    key={r}
                    style={[styles.pill, on && styles.pillActive]}
                    onPress={() => {
                      if (!roleModal) return;
                      const has = roleModal.roles.includes(r);
                      let next = has ? roleModal.roles.filter((x) => x !== r) : [...roleModal.roles, r];
                      if (next.length === 0) next = ['MANAGER'];
                      setRoleModal({ ...roleModal, roles: next as StaffRole[] });
                    }}
                  >
                    <T style={[styles.pillText, on && styles.pillTextActive]}>{r}</T>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              style={[styles.saveBtn, savingRoles && styles.saveBtnDisabled]}
              disabled={savingRoles || !roleModal}
              onPress={() => roleModal && saveStaffRoles({ staffId: roleModal.staffId, roles: roleModal.roles })}
            >
              {savingRoles ? <ActivityIndicator color="#fff" /> : <T style={styles.saveText}>Save roles</T>}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.header}>
        <T style={styles.title}>Settings</T>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <T style={styles.sectionTitle}>Store Profile</T>
          <View style={styles.card}>
            {!canEditStoreProfile ? (
              <T style={styles.hint}>Only the business owner can change public store profile fields here.</T>
            ) : null}
            <View style={styles.inputGroup}>
              <T style={styles.label}>Store Name</T>
              <TextInput
                style={styles.input}
                value={form.name}
                editable={canEditStoreProfile}
                onChangeText={(t) => setForm({ ...form, name: t })}
                placeholder="E.g. Ason Ko Pasal"
              />
            </View>

            <View style={styles.inputGroup}>
              <T style={styles.label}>Address</T>
              <TextInput
                style={styles.input}
                value={form.address}
                editable={canEditStoreProfile}
                onChangeText={(t) => setForm({ ...form, address: t })}
                placeholder="Store Address"
              />
            </View>

            <View style={styles.inputGroup}>
              <T style={styles.label}>Description</T>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description}
                editable={canEditStoreProfile}
                onChangeText={(t) => setForm({ ...form, description: t })}
                placeholder="What does your store sell?"
                multiline
              />
            </View>

            <T style={styles.label}>Shop Category</T>
            <View style={styles.pillsRow}>
              {SHOP_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.pill, form.shopType === type && styles.pillActive]}
                  onPress={() => canEditStoreProfile && setForm((prev) => ({ ...prev, shopType: type }))}
                >
                  <T style={[styles.pillText, form.shopType === type && styles.pillTextActive]}>{type}</T>
                </Pressable>
              ))}
            </View>

            <T style={[styles.label, { marginTop: spacing.md }]}>Delivery Preference</T>
            {!platformDeliveryEnabled ? (
              <T style={styles.hintMuted}>
                GoPasal fleet options appear here when the platform enables fleet delivery for your region.
              </T>
            ) : null}
            <Pressable style={styles.linkRow} onPress={() => router.push('/delivery' as any)}>
              <Ionicons name="bicycle-outline" size={18} color={colors.primary[600]} />
              <T style={styles.linkRowText}>View delivery summary</T>
              <Ionicons name="chevron-forward" size={16} color={colors.neutral[400]} />
            </Pressable>
            {deliveryTypes.map((type) => (
              <Pressable
                key={type.id}
                style={[styles.radioRow, form.deliveryType === type.id && styles.radioRowActive]}
                onPress={() => canEditStoreProfile && setForm((prev) => ({ ...prev, deliveryType: type.id }))}
              >
                <View style={[styles.radioRadio, form.deliveryType === type.id && styles.radioRadioActive]} />
                <T style={[styles.radioText, form.deliveryType === type.id && styles.radioTextActive]}>
                  {type.label}
                </T>
              </Pressable>
            ))}

            <StoreDeliveryLocationSection
              latitudeText={form.latitudeText}
              longitudeText={form.longitudeText}
              radiusText={form.radiusText}
              disabled={!canEditStoreProfile}
              requiresDeliveryArea={requiresDeliveryArea}
              onLatitudeChange={(latitudeText) => setForm((prev) => ({ ...prev, latitudeText }))}
              onLongitudeChange={(longitudeText) => setForm((prev) => ({ ...prev, longitudeText }))}
              onRadiusChange={(radiusText) => setForm((prev) => ({ ...prev, radiusText }))}
            />

            <StoreDeliveryChargesSection
              deliveryFeeText={form.deliveryFeeText}
              freeDeliveryThresholdText={form.freeDeliveryThresholdText}
              alwaysFreeDelivery={form.alwaysFreeDelivery}
              disabled={!canEditStoreProfile}
              pickupOnly={form.deliveryType === 'PICKUP_ONLY'}
              onDeliveryFeeChange={(deliveryFeeText) => setForm((prev) => ({ ...prev, deliveryFeeText }))}
              onFreeDeliveryThresholdChange={(freeDeliveryThresholdText) =>
                setForm((prev) => ({ ...prev, freeDeliveryThresholdText }))
              }
              onAlwaysFreeDeliveryChange={(alwaysFreeDelivery) =>
                setForm((prev) => ({
                  ...prev,
                  alwaysFreeDelivery,
                  ...(alwaysFreeDelivery ? { deliveryFeeText: '0', freeDeliveryThresholdText: '' } : {}),
                }))
              }
            />

            <Pressable
              style={[styles.saveBtn, (isUpdating || !canEditStoreProfile) && styles.saveBtnDisabled]}
              onPress={handleSaveStoreProfile}
              disabled={isUpdating || !canEditStoreProfile}
            >
              {isUpdating ? <ActivityIndicator color="#fff" /> : <T style={styles.saveText}>Save Changes</T>}
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={{ marginTop: spacing.xl }}>
          <T style={styles.sectionTitle}>Team</T>
          <View style={styles.card}>
            {!canStaffManage ? (
              <T style={styles.hint}>
                Your role does not include team management for this location. Ask an owner or manager if you need
                access.
              </T>
            ) : (
              <>
                {staffList.length === 0 ? (
                  <T style={styles.hint}>No staff yet — invite teammates and assign one or more roles each.</T>
                ) : (
                  staffList.map((row: any) => (
                    <View key={row.id} style={styles.staffRow}>
                      <View style={{ flex: 1 }}>
                        <T style={styles.staffName}>{row.user?.name || row.user?.phone || 'Member'}</T>
                        <T style={styles.staffMeta}>
                          {formatStaffRoles(row)} · {row.status}
                        </T>
                      </View>
                      <Pressable
                        style={styles.editRolesBtn}
                        onPress={() =>
                          setRoleModal({
                            staffId: row.id,
                            roles: (row.roles?.map((x: { role: string }) => x.role) || ['MANAGER']) as StaffRole[],
                          })
                        }
                      >
                        <T style={styles.editRolesTxt}>Roles</T>
                      </Pressable>
                    </View>
                  ))
                )}
                <T style={[styles.label, { marginTop: spacing.md }]}>Invite by phone</T>
                <TextInput
                  style={styles.input}
                  placeholder="98XXXXXXXX"
                  placeholderTextColor={colors.neutral[400]}
                  keyboardType="phone-pad"
                  value={invitePhone}
                  onChangeText={setInvitePhone}
                />
                <T style={[styles.label, { marginTop: spacing.sm }]}>Roles (tap to combine)</T>
                <View style={styles.pillsRow}>
                  {ROLE_OPTS.map((r) => {
                    const on = inviteRoles.includes(r);
                    return (
                      <Pressable
                        key={r}
                        style={[styles.pill, on && styles.pillActive]}
                        onPress={() => toggleInviteRole(r)}
                      >
                        <T style={[styles.pillText, on && styles.pillTextActive]}>{r}</T>
                      </Pressable>
                    );
                  })}
                </View>
                <Pressable
                  style={[styles.saveBtn, inviting && styles.saveBtnDisabled]}
                  onPress={() => invitePhone.trim().length >= 9 && inviteRoles.length > 0 && inviteStaff()}
                  disabled={inviting || invitePhone.trim().length < 9 || inviteRoles.length === 0}
                >
                  {inviting ? <ActivityIndicator color="#fff" /> : <T style={styles.saveText}>Send invite</T>}
                </Pressable>
              </>
            )}
          </View>
        </Animated.View>

        {canAnnounceView ? (
          <Animated.View entering={FadeInDown.delay(165).duration(400)} style={{ marginTop: spacing.xl }}>
            <T style={styles.sectionTitle}>Notices</T>
            <View style={styles.card}>
              <T style={styles.hint}>Org-wide or this-location messages for your team.</T>
              {announcements.length === 0 ? (
                <T style={[styles.hint, { marginTop: spacing.sm }]}>No notices yet.</T>
              ) : (
                announcements.map((a: any) => (
                  <View key={a.id} style={styles.annRow}>
                    <T style={styles.annTitle}>{a.title}</T>
                    <T style={styles.annMeta}>
                      {a.scope === 'ALL_BRANCHES' ? 'All branches' : 'This branch'} ·{' '}
                      {new Date(a.createdAt).toLocaleDateString()}
                    </T>
                    <T style={styles.annBody} n={4}>
                      {a.body}
                    </T>
                  </View>
                ))
              )}
              {canAnnounceManage ? (
                <>
                  <T style={[styles.label, { marginTop: spacing.lg }]}>New notice</T>
                  <View style={styles.pillsRow}>
                    <Pressable
                      style={[styles.pill, annScope === 'ALL_BRANCHES' && styles.pillActive]}
                      onPress={() => setAnnScope('ALL_BRANCHES')}
                    >
                      <T style={[styles.pillText, annScope === 'ALL_BRANCHES' && styles.pillTextActive]}>
                        All branches
                      </T>
                    </Pressable>
                    <Pressable
                      style={[styles.pill, annScope === 'SINGLE_STORE' && styles.pillActive]}
                      onPress={() => setAnnScope('SINGLE_STORE')}
                    >
                      <T style={[styles.pillText, annScope === 'SINGLE_STORE' && styles.pillTextActive]}>
                        This branch only
                      </T>
                    </Pressable>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Title"
                    value={annTitle}
                    onChangeText={setAnnTitle}
                  />
                  <TextInput
                    style={[styles.input, styles.textArea, { marginTop: spacing.sm }]}
                    placeholder="Message"
                    value={annBody}
                    onChangeText={setAnnBody}
                    multiline
                  />
                  <Pressable
                    style={[styles.saveBtn, postingAnn && styles.saveBtnDisabled]}
                    disabled={postingAnn || annTitle.trim().length < 1 || annBody.trim().length < 1}
                    onPress={() => postAnnouncement()}
                  >
                    {postingAnn ? <ActivityIndicator color="#fff" /> : <T style={styles.saveText}>Post notice</T>}
                  </Pressable>
                </>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        {accessRole === 'OWNER' ? (
          <Animated.View entering={FadeInDown.delay(180).duration(400)} style={{ marginTop: spacing.xl }}>
            <T style={styles.sectionTitle}>Branches</T>
            <View style={styles.card}>
              <T style={styles.hint}>
                Add another outlet under the same business. It inherits approval when your main store is active.
              </T>
              <T style={[styles.label, { marginTop: spacing.md }]}>Branch name</T>
              <TextInput
                style={styles.input}
                value={branchName}
                onChangeText={setBranchName}
                placeholder="e.g. Patan outlet"
              />
              <T style={[styles.label, { marginTop: spacing.md }]}>URL slug (lowercase, hyphens)</T>
              <TextInput
                style={styles.input}
                value={branchSlug}
                onChangeText={(t) => setBranchSlug(t.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                placeholder="my-shop-patan"
              />
              <Pressable
                style={[styles.saveBtn, creatingBranch && styles.saveBtnDisabled]}
                onPress={() => branchName.trim().length >= 3 && branchSlug.trim().length >= 3 && createBranch()}
                disabled={creatingBranch || branchName.trim().length < 3 || branchSlug.trim().length < 3}
              >
                {creatingBranch ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <T style={styles.saveText}>Create branch</T>
                )}
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={{ marginTop: spacing.xl }}>
          <T style={styles.sectionTitle}>Account</T>
          <View style={styles.card}>
            {canEditStoreProfile ? (
              <Pressable
                style={styles.menuItem}
                onPress={() => router.push('/shop-tier')}
              >
                <View style={[styles.menuIcon, { backgroundColor: colors.mint[100] }]}>
                  <Ionicons name="rocket-outline" size={20} color={colors.primary[600]} />
                </View>
                <T style={{ flex: 1, fontFamily: 'Poppins-SemiBold', fontSize: 15 }}>Shop tier & marketing</T>
                <Ionicons name="chevron-forward" size={18} color={colors.neutral[400]} />
              </Pressable>
            ) : null}
            <Pressable style={styles.menuItem} onPress={logout}>
              <View style={[styles.menuIcon, { backgroundColor: colors.error.light }]}>
                <Ionicons name="log-out-outline" size={20} color={colors.error.main} />
              </View>
              <T style={styles.menuTextDestructive}>Sign out</T>
            </Pressable>
          </View>
        </Animated.View>

        <T style={styles.versionInfo}>GoPasal Seller v2.0.0</T>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.surface.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing['2xl'], paddingTop: spacing.lg, paddingBottom: spacing.sm },
  title: { fontFamily: 'Poppins-Bold', fontSize: 26, color: colors.neutral[900] },
  content: { padding: spacing.lg },
  sectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.neutral[500],
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface.card,
    borderRadius: radius.xl,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.neutral[700], marginBottom: spacing.xs },
  input: {
    borderWidth: 1.5,
    borderColor: colors.neutral[200],
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontFamily: 'Inter',
    fontSize: 14,
    color: colors.neutral[900],
  },
  textArea: { height: 100, paddingTop: spacing.md, textAlignVertical: 'top' },
  saveBtn: {
    backgroundColor: colors.primary[500],
    height: 50,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveText: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: '#fff' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  menuIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  menuTextDestructive: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.error.main },
  versionInfo: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.neutral[400],
    textAlign: 'center',
    marginTop: spacing['3xl'],
    marginBottom: spacing.xl,
  },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  pillActive: { backgroundColor: colors.primary[50], borderColor: colors.primary[400] },
  pillText: { fontFamily: 'Inter-Medium', fontSize: 13, color: colors.neutral[600] },
  pillTextActive: { color: colors.primary[700] },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.neutral[50],
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  radioRowActive: { backgroundColor: colors.primary[50], borderColor: colors.primary[200] },
  radioRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    marginRight: spacing.sm,
  },
  radioRadioActive: { borderColor: colors.primary[500], backgroundColor: colors.primary[500], borderWidth: 5 },
  radioText: { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.neutral[700] },
  radioTextActive: { color: colors.primary[800], fontFamily: 'Inter-SemiBold' },
  hint: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[600], lineHeight: 20 },
  hintMuted: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: colors.neutral[500],
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  linkRowText: { flex: 1, fontFamily: 'Inter-Medium', fontSize: 14, color: colors.primary[700] },
  staffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  staffName: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.neutral[900] },
  staffMeta: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500], marginTop: 2 },
  editRolesBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.neutral[100],
  },
  editRolesTxt: { fontFamily: 'Inter-SemiBold', fontSize: 13, color: colors.primary[700] },
  annRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  annTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.neutral[900] },
  annMeta: { fontFamily: 'Inter', fontSize: 12, color: colors.neutral[500], marginTop: 2 },
  annBody: { fontFamily: 'Inter', fontSize: 14, color: colors.neutral[700], marginTop: spacing.sm, lineHeight: 20 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: radius.xl,
    padding: spacing.xl,
  },
  modalTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 18, marginBottom: spacing.md, color: colors.neutral[900] },
});
