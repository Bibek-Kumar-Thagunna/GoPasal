import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Extrapolation,
  Easing,
  ReduceMotion,
  SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { GText } from './GText';
import { colors } from '../design-system/tokens/colors';

// ── Device + screen geometry ──
const PHONE_W = 270;
const PHONE_H = 560;
const FRAME_PAD = 4;
const BEZEL_PAD = 8;
const INSET = FRAME_PAD + BEZEL_PAD;
const SCREEN_W = PHONE_W - INSET * 2; // 246
const SCREEN_H = PHONE_H - INSET * 2; // 536
const HEADER_H = 66; // pushes content below the Dynamic Island
const ISLAND_SAFE = 46; // top padding so text sits under the island

// ── Timeline (single ~18s loop) ──
const SC = {
  splash: [0.0, 0.06] as const,
  browse: [0.05, 0.2] as const,
  cart: [0.19, 0.31] as const,
  address: [0.3, 0.42] as const,
  payment: [0.41, 0.55] as const,
  packed: [0.54, 0.64] as const,
  delivery: [0.63, 0.88] as const,
  delivered: [0.87, 1.0] as const,
};

// Rider route inside the delivery map.
const SHOP = { x: 40, y: 46 };
const HOME = { x: 200, y: 250 };
const RIDE_T = [0.66, 0.71, 0.76, 0.81, 0.85];
const RIDE_X = [SHOP.x, 80, 140, 175, HOME.x];
const RIDE_Y = [SHOP.y, 130, 160, 215, HOME.y];

function win(v: number, s: number, e: number) {
  'worklet';
  return interpolate(v, [s, s + 0.02, e - 0.02, e], [0, 1, 1, 0], Extrapolation.CLAMP);
}

function useScene(t: SharedValue<number>, s: number, e: number) {
  return useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [s, s + 0.018, e - 0.018, e], [0, 1, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(t.value, [s, s + 0.03, e - 0.03, e], [26, 0, 0, -26], Extrapolation.CLAMP) }],
  }));
}

function usePop(t: SharedValue<number>, at: number) {
  return useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [at - 0.025, at], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(t.value, [at - 0.025, at, at + 0.03], [0.3, 1.25, 1], Extrapolation.CLAMP) }],
  }));
}

const PRODUCTS = [
  { icon: 'leaf' as const, bg: colors.primary[50], fg: colors.primary[600], name: 'Fresh spinach', price: 'Rs 45', qty: '1 bunch' },
  { icon: 'nutrition' as const, bg: colors.accent[50], fg: colors.accent[600], name: 'Bananas', price: 'Rs 120', qty: '1 dozen' },
  { icon: 'cafe' as const, bg: '#EFEAFB', fg: '#6D4FC4', name: 'Local honey', price: 'Rs 380', qty: '500 g' },
];

const PAYMENTS = [
  { key: 'cod', label: 'Cash on delivery', sub: 'Pay when it arrives', color: colors.primary[600], bg: colors.primary[50], icon: 'cash-outline' as const },
  { key: 'esewa', label: 'eSewa', sub: 'Instant wallet', color: '#3FA535', bg: '#E6F4E3', initial: 'e' },
  { key: 'khalti', label: 'Khalti', sub: 'Digital wallet', color: '#5C2D91', bg: '#EEE7F6', initial: 'K' },
];

export const HeroVisual = ({ compact = false }: { compact?: boolean }) => {
  const t = useSharedValue(0);
  const bob = useSharedValue(0);
  const sway = useSharedValue(0);

  useEffect(() => {
    const opts = { reduceMotion: ReduceMotion.Never };
    t.value = withRepeat(withTiming(1, { duration: 20000, easing: Easing.linear, ...opts }), -1, false, undefined, ReduceMotion.Never);
    bob.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease), ...opts }), -1, true, undefined, ReduceMotion.Never);
    sway.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.inOut(Easing.ease), ...opts }), -1, true, undefined, ReduceMotion.Never);
  }, [t, bob, sway]);

  const scale = compact ? 0.8 : 1;
  const ryFrom = compact ? -9 : -15;
  const ryTo = compact ? -4 : -8;

  const phoneStyle = useAnimatedStyle(() => {
    const ry = interpolate(sway.value, [0, 1], [ryFrom, ryTo]);
    const ty = interpolate(bob.value, [0, 1], [0, -7]);
    return {
      transform: [
        { perspective: 1100 },
        { rotateX: '2deg' },
        { rotateY: `${ry}deg` },
        { translateY: ty },
        { scale },
      ],
    };
  });

  // Scenes
  const splash = useScene(t, SC.splash[0], SC.splash[1]);
  const browse = useScene(t, SC.browse[0], SC.browse[1]);
  const cart = useScene(t, SC.cart[0], SC.cart[1]);
  const address = useScene(t, SC.address[0], SC.address[1]);
  const payment = useScene(t, SC.payment[0], SC.payment[1]);
  const packed = useScene(t, SC.packed[0], SC.packed[1]);
  const delivery = useScene(t, SC.delivery[0], SC.delivery[1]);
  const delivered = useScene(t, SC.delivered[0], SC.delivered[1]);

  // Inner animations
  const splashLogo = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(t.value, [0, 0.022, 0.045], [0.6, 1.1, 1], Extrapolation.CLAMP) }],
  }));
  const added0 = usePop(t, 0.09);
  const added1 = usePop(t, 0.12);
  const added2 = usePop(t, 0.15);
  const addedStyles = [added0, added1, added2];
  const cartBadgeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.085, 0.1], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(t.value, [0.085, 0.1, 0.115, 0.13, 0.145, 0.16], [0.2, 1.3, 1, 1.3, 1, 1.25], Extrapolation.CLAMP) }],
  }));

  const addressCheck = usePop(t, 0.37);
  const payCheck = usePop(t, 0.5);
  const payHighlight = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.47, 0.49], [0, 1], Extrapolation.CLAMP),
  }));

  const packedRing = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(t.value, [0.56, 0.59, 0.62], [0.4, 1.12, 1], Extrapolation.CLAMP) }],
    opacity: interpolate(t.value, [0.56, 0.58], [0, 1], Extrapolation.CLAMP),
  }));
  const packTape = useAnimatedStyle(() => ({
    transform: [{ scaleX: interpolate(t.value, [0.59, 0.62], [0, 1], Extrapolation.CLAMP) }],
  }));

  const statusOut = useAnimatedStyle(() => ({ opacity: win(t.value, 0.63, 0.82) }));
  const statusArriving = useAnimatedStyle(() => ({ opacity: interpolate(t.value, [0.82, 0.84, 0.88], [0, 1, 1], Extrapolation.CLAMP) }));
  const boxAtShop = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.63, 0.65, 0.85], [1, 1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(bob.value, [0, 1], [0, -3]) }],
  }));
  const riderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0.64, 0.67, 0.85, 0.88], [0, 1, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(t.value, RIDE_T, RIDE_X, Extrapolation.CLAMP) },
      { translateY: interpolate(t.value, RIDE_T, RIDE_Y, Extrapolation.CLAMP) + interpolate(bob.value, [0, 1], [0, -2]) },
      { rotateZ: `${interpolate(t.value, RIDE_T, [6, -3, 2, -4, 0], Extrapolation.CLAMP)}deg` },
    ],
  }));
  const deliveredCheck = usePop(t, 0.91);
  const star0 = usePop(t, 0.94);
  const star1 = usePop(t, 0.955);
  const star2 = usePop(t, 0.97);
  const starStyles = [star0, star1, star2];

  return (
    <View style={[styles.outer, { width: PHONE_W * scale + 60, height: PHONE_H * scale + 30 }]} pointerEvents="none">
      <Animated.View style={[styles.phoneShadow, phoneStyle]}>
        <LinearGradient
          colors={['#54545c', '#161618', '#0d0d0f', '#161618', '#54545c']}
          locations={[0, 0.08, 0.5, 0.92, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.frame}
        >
          <View style={[styles.btn, styles.btnActionLeft]} />
          <View style={[styles.btn, styles.btnVolUp]} />
          <View style={[styles.btn, styles.btnVolDown]} />
          <View style={[styles.btn, styles.btnPower]} />

          <View style={styles.bezel}>
            <View style={styles.stage}>
              {/* ── 1. Splash ── */}
              <Animated.View style={[styles.scene, styles.centerScene, splash]}>
                <Animated.View style={[styles.splashLogo, splashLogo]}>
                  <GText style={styles.splashLetter} weight="bold">G</GText>
                </Animated.View>
                <GText style={styles.splashName} weight="bold">GoPasal</GText>
                <GText style={styles.splashTag}>Your neighbourhood shops</GText>
              </Animated.View>

              {/* ── 2. Browse & add ── */}
              <Animated.View style={[styles.scene, browse]}>
                <View style={styles.header}>
                  <GText style={styles.headerTitle} weight="bold">Shop</GText>
                  <View>
                    <Ionicons name="cart" size={20} color={colors.primary[600]} />
                    <Animated.View style={[styles.cartBadge, cartBadgeStyle]}><View style={styles.cartBadgeDot} /></Animated.View>
                  </View>
                </View>
                <View style={styles.body}>
                  {PRODUCTS.map((p, i) => (
                    <View key={p.name} style={styles.row}>
                      <View style={[styles.thumb, { backgroundColor: p.bg }]}><Ionicons name={p.icon} size={18} color={p.fg} /></View>
                      <View style={styles.rowText}>
                        <GText style={styles.rowName} weight="semiBold" numberOfLines={1}>{p.name}</GText>
                        <GText style={styles.rowPrice} weight="bold">{p.price}</GText>
                      </View>
                      <View style={styles.addBtn}>
                        <Ionicons name="add" size={16} color={colors.primary[600]} />
                        <Animated.View style={[styles.addedBtn, addedStyles[i]]}><Ionicons name="checkmark" size={15} color="#fff" /></Animated.View>
                      </View>
                    </View>
                  ))}
                </View>
              </Animated.View>

              {/* ── 3. Cart ── */}
              <Animated.View style={[styles.scene, cart]}>
                <View style={styles.header}><GText style={styles.headerTitle} weight="bold">Your cart</GText></View>
                <View style={styles.body}>
                  {PRODUCTS.map((p) => (
                    <View key={p.name} style={styles.row}>
                      <View style={[styles.thumb, { backgroundColor: p.bg }]}><Ionicons name={p.icon} size={18} color={p.fg} /></View>
                      <View style={styles.rowText}>
                        <GText style={styles.rowName} weight="semiBold" numberOfLines={1}>{p.name}</GText>
                        <GText style={styles.rowQty}>{p.qty}</GText>
                      </View>
                      <GText style={styles.rowPrice} weight="bold">{p.price}</GText>
                    </View>
                  ))}
                  <View style={styles.totalRow}>
                    <GText style={styles.totalLabel}>Subtotal</GText>
                    <GText style={styles.totalValue} weight="bold">Rs 545</GText>
                  </View>
                </View>
                <Button label="Proceed to checkout" />
              </Animated.View>

              {/* ── 4. Address ── */}
              <Animated.View style={[styles.scene, address]}>
                <View style={styles.header}><GText style={styles.headerTitle} weight="bold">Delivery address</GText></View>
                <View style={styles.body}>
                  <View style={[styles.optCard, styles.optCardActive]}>
                    <View style={styles.optIcon}><Ionicons name="home" size={17} color={colors.primary[600]} /></View>
                    <View style={styles.rowText}>
                      <GText style={styles.rowName} weight="semiBold">Home</GText>
                      <GText style={styles.rowQty} numberOfLines={1}>Baluwatar, Kathmandu</GText>
                    </View>
                    <Animated.View style={[styles.radioOn, addressCheck]}><Ionicons name="checkmark" size={13} color="#fff" /></Animated.View>
                  </View>
                  <View style={styles.optCard}>
                    <View style={styles.optIconMuted}><Ionicons name="briefcase" size={16} color={colors.neutral[500]} /></View>
                    <View style={styles.rowText}>
                      <GText style={styles.rowName} weight="semiBold">Work</GText>
                      <GText style={styles.rowQty} numberOfLines={1}>Durbar Marg, Kathmandu</GText>
                    </View>
                    <View style={styles.radioOff} />
                  </View>
                </View>
                <Button label="Deliver here" />
              </Animated.View>

              {/* ── 5. Payment ── */}
              <Animated.View style={[styles.scene, payment]}>
                <View style={styles.header}><GText style={styles.headerTitle} weight="bold">Payment</GText></View>
                <View style={styles.body}>
                  {PAYMENTS.map((p) => {
                    const isSel = p.key === 'khalti';
                    return (
                      <View key={p.key} style={styles.optCard}>
                        {isSel && <Animated.View style={[styles.payHighlight, payHighlight]} />}
                        {p.icon ? (
                          <View style={[styles.optIcon, { backgroundColor: p.bg }]}><Ionicons name={p.icon} size={16} color={p.color} /></View>
                        ) : (
                          <View style={[styles.optIcon, { backgroundColor: p.bg }]}><GText style={[styles.payInitial, { color: p.color }]} weight="bold">{p.initial}</GText></View>
                        )}
                        <View style={styles.rowText}>
                          <GText style={styles.rowName} weight="semiBold">{p.label}</GText>
                          <GText style={styles.rowQty}>{p.sub}</GText>
                        </View>
                        {isSel ? (
                          <Animated.View style={[styles.radioOn, payCheck]}><Ionicons name="checkmark" size={13} color="#fff" /></Animated.View>
                        ) : (
                          <View style={styles.radioOff} />
                        )}
                      </View>
                    );
                  })}
                </View>
                <Button label="Pay Rs 545" />
              </Animated.View>

              {/* ── 6. Packed ── */}
              <Animated.View style={[styles.scene, styles.centerScene, packed]}>
                <Animated.View style={[styles.packBoxBig, packedRing]}>
                  <Animated.View style={[styles.packTape, packTape]} />
                  <Ionicons name="cube" size={40} color={colors.accent[600]} />
                </Animated.View>
                <GText style={styles.bigTitle} weight="bold">Order packed</GText>
                <GText style={styles.bigSub}>Gauri Store has packed your order</GText>
              </Animated.View>

              {/* ── 7. Out for delivery ── */}
              <Animated.View style={[styles.scene, delivery]}>
                <View style={styles.trackHeader}>
                  <View style={styles.liveDot} />
                  <View style={styles.statusWrap}>
                    <Animated.View style={[styles.statusAbs, statusOut]}><GText style={styles.statusText} weight="bold">Out for delivery</GText></Animated.View>
                    <Animated.View style={[styles.statusAbs, statusArriving]}><GText style={[styles.statusText, { color: colors.success.dark }]} weight="bold">Almost at your door</GText></Animated.View>
                  </View>
                </View>
                <View style={styles.map}>
                  <Svg width={SCREEN_W} height={MAP_H} style={StyleSheet.absoluteFill}>
                    <Path d={`M0,${MAP_H * 0.44} H${SCREEN_W}`} stroke={colors.neutral[200]} strokeWidth={20} opacity={0.7} />
                    <Path d={`M${SCREEN_W * 0.66},0 V${MAP_H}`} stroke={colors.neutral[200]} strokeWidth={20} opacity={0.7} />
                    <Path d={ROUTE} stroke={colors.primary[500]} strokeWidth={3.5} strokeDasharray="1 8" strokeLinecap="round" fill="none" />
                    <Circle cx={SHOP.x} cy={SHOP.y} r={4} fill={colors.primary[600]} />
                    <Circle cx={HOME.x} cy={HOME.y} r={4} fill={colors.accent[600]} />
                  </Svg>

                  <View style={[styles.marker, { left: SHOP.x - 16, top: SHOP.y - 16, backgroundColor: colors.primary[600] }]}><Ionicons name="storefront" size={16} color="#fff" /></View>
                  <Animated.View style={[styles.packDot, { left: SHOP.x + 6, top: SHOP.y - 24 }, boxAtShop]}><Ionicons name="cube" size={12} color={colors.accent[700]} /></Animated.View>
                  <View style={[styles.marker, { left: HOME.x - 16, top: HOME.y - 16, backgroundColor: colors.surface.card, borderWidth: 2, borderColor: colors.accent[500] }]}><Ionicons name="home" size={15} color={colors.accent[600]} /></View>

                  <Animated.View style={[styles.rider, riderStyle]}>
                    <View style={styles.riderPinWrap}>
                      <LinearGradient
                        colors={[colors.primary[400], colors.primary[700]]}
                        start={{ x: 0.2, y: 0 }}
                        end={{ x: 0.8, y: 1 }}
                        style={styles.riderPinCircle}
                      >
                        <MaterialCommunityIcons name="moped" size={19} color="#fff" />
                      </LinearGradient>
                      <View style={styles.riderTail} />
                      <View style={styles.riderParcel}><Ionicons name="cube" size={8} color="#fff" /></View>
                    </View>
                  </Animated.View>
                </View>
                <View style={styles.riderCard}>
                  <View style={styles.riderAvatar}><Ionicons name="person" size={18} color={colors.primary[700]} /></View>
                  <View style={styles.rowText}>
                    <GText style={styles.rowName} weight="bold">Ramesh · Shop rider</GText>
                    <GText style={styles.rowQty}>Delivering from Gauri Store</GText>
                  </View>
                  <View style={styles.callBtn}><Ionicons name="call" size={15} color={colors.primary[600]} /></View>
                </View>
              </Animated.View>

              {/* ── 8. Delivered ── */}
              <Animated.View style={[styles.scene, styles.centerScene, delivered]}>
                <Animated.View style={[styles.deliveredRing, deliveredCheck]}>
                  <Ionicons name="checkmark" size={42} color="#fff" />
                </Animated.View>
                <GText style={styles.bigTitle} weight="bold">Delivered!</GText>
                <GText style={styles.bigSub}>Enjoy your order from Gauri Store</GText>
                <View style={styles.starsRow}>
                  {starStyles.map((s, i) => (
                    <Animated.View key={i} style={s}><Ionicons name="star" size={20} color={colors.gold[500]} /></Animated.View>
                  ))}
                </View>
              </Animated.View>

              {/* Glass sheen + Dynamic Island on top */}
              <LinearGradient colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 0.7, y: 0.6 }} style={styles.sheen} pointerEvents="none" />
              <View style={styles.island}><View style={styles.islandLens} /></View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const TRACK_HEADER_H = 62;
const RIDER_CARD_H = 84;
const MAP_H = SCREEN_H - TRACK_HEADER_H - RIDER_CARD_H;
const ROUTE = `M${SHOP.x},${SHOP.y} C 70,130 64,160 110,176 C 156,192 168,225 ${HOME.x},${HOME.y}`;

const Button = ({ label }: { label: string }) => (
  <View style={styles.cta}><GText style={styles.ctaText} weight="bold">{label}</GText></View>
);

const styles = StyleSheet.create({
  outer: { alignItems: 'center', justifyContent: 'center' },
  phoneShadow: {
    width: PHONE_W,
    height: PHONE_H,
    borderRadius: 56,
    shadowColor: '#0A1F18',
    shadowOffset: { width: -10, height: 26 },
    shadowOpacity: 0.5,
    shadowRadius: 38,
    elevation: 24,
  },
  frame: { flex: 1, borderRadius: 56, padding: FRAME_PAD },
  bezel: { flex: 1, backgroundColor: '#000', borderRadius: 52, padding: BEZEL_PAD },
  stage: { flex: 1, borderRadius: 44, overflow: 'hidden', backgroundColor: colors.surface.card, position: 'relative' },
  sheen: { ...StyleSheet.absoluteFillObject, zIndex: 40 },
  island: {
    position: 'absolute', top: 10, left: SCREEN_W / 2 - 48, width: 96, height: 30, borderRadius: 16,
    backgroundColor: '#000', zIndex: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 10,
  },
  islandLens: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0E1530', borderWidth: 1, borderColor: '#1c2647' },

  btn: { position: 'absolute', backgroundColor: '#2a2a2e', borderRadius: 2, zIndex: 2 },
  btnActionLeft: { left: -1.5, top: 96, width: 3, height: 30 },
  btnVolUp: { left: -1.5, top: 142, width: 3, height: 52 },
  btnVolDown: { left: -1.5, top: 204, width: 3, height: 52 },
  btnPower: { right: -1.5, top: 168, width: 3, height: 84 },

  scene: { ...StyleSheet.absoluteFillObject, borderRadius: 44, backgroundColor: colors.surface.card, overflow: 'hidden' },
  centerScene: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 },

  header: { height: HEADER_H, paddingTop: ISLAND_SAFE, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 16, color: colors.neutral[900] },
  body: { flex: 1, paddingHorizontal: 14, paddingTop: 4, gap: 9 },

  cartBadge: { position: 'absolute', top: -5, right: -6, width: 14, height: 14, borderRadius: 7, backgroundColor: colors.accent[500], alignItems: 'center', justifyContent: 'center' },
  cartBadgeDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface.card, borderRadius: 14, padding: 8, borderWidth: 1, borderColor: colors.neutral[100] },
  thumb: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 2 },
  rowName: { fontSize: 13, color: colors.neutral[800] },
  rowPrice: { fontSize: 12.5, color: colors.primary[600] },
  rowQty: { fontSize: 11, color: colors.neutral[500] },
  addBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  addedBtn: { ...StyleSheet.absoluteFillObject, borderRadius: 10, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center' },

  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 6, paddingTop: 6, marginTop: 2, borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  totalLabel: { fontSize: 13, color: colors.neutral[600] },
  totalValue: { fontSize: 15, color: colors.neutral[900] },

  optCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface.card, borderRadius: 14, padding: 11, borderWidth: 1.5, borderColor: colors.neutral[150], overflow: 'hidden' },
  optCardActive: { borderColor: colors.primary[400], backgroundColor: colors.primary[50] },
  optIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  optIconMuted: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.neutral[100], alignItems: 'center', justifyContent: 'center' },
  radioOn: { width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  radioOff: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.neutral[300] },
  payHighlight: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.primary[50] },
  payInitial: { fontSize: 16 },

  cta: { margin: 14, height: 46, borderRadius: 14, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 14, color: '#fff' },

  // Splash
  splashLogo: { width: 72, height: 72, borderRadius: 22, backgroundColor: colors.primary[500], alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary[700], shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 14 },
  splashLetter: { fontSize: 38, color: '#fff' },
  splashName: { fontSize: 22, color: colors.primary[700], marginTop: 6 },
  splashTag: { fontSize: 12.5, color: colors.neutral[500] },

  // Packed / Delivered
  packBoxBig: { width: 96, height: 96, borderRadius: 24, backgroundColor: colors.accent[50], alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  packTape: { position: 'absolute', top: '46%', left: 0, right: 0, height: 8, backgroundColor: colors.accent[200] },
  bigTitle: { fontSize: 20, color: colors.neutral[900], marginTop: 10 },
  bigSub: { fontSize: 13, color: colors.neutral[500], textAlign: 'center' },
  deliveredRing: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.success.main, alignItems: 'center', justifyContent: 'center', shadowColor: colors.success.dark, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.32, shadowRadius: 18 },
  starsRow: { flexDirection: 'row', gap: 6, marginTop: 8 },

  // Tracking
  trackHeader: { height: TRACK_HEADER_H, paddingTop: ISLAND_SAFE, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 9 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.success.main },
  statusWrap: { flex: 1, height: 20, justifyContent: 'center' },
  statusAbs: { position: 'absolute' },
  statusText: { fontSize: 14, color: colors.neutral[800] },
  map: { width: SCREEN_W, height: MAP_H, backgroundColor: '#E4EDE8', position: 'relative', overflow: 'hidden' },
  marker: { position: 'absolute', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, zIndex: 6 },
  packDot: { position: 'absolute', width: 22, height: 22, borderRadius: 7, backgroundColor: colors.accent[100], alignItems: 'center', justifyContent: 'center', zIndex: 7 },
  rider: { position: 'absolute', left: -17, top: -17, zIndex: 10 },
  riderPinWrap: { alignItems: 'center' },
  riderPinCircle: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#fff',
    shadowColor: '#06251B', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  riderTail: {
    width: 0, height: 0, marginTop: -3,
    borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 9,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.primary[700],
  },
  riderParcel: {
    position: 'absolute', top: -3, right: -3, width: 15, height: 15, borderRadius: 5,
    backgroundColor: colors.accent[500], alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  riderCard: { height: RIDER_CARD_H, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, backgroundColor: colors.surface.card, borderTopWidth: 1, borderTopColor: colors.neutral[100] },
  riderAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' },
  callBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary[50], alignItems: 'center', justifyContent: 'center' },
});
