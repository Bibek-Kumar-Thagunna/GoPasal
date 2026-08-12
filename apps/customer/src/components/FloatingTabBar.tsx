import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GText } from '../design-system/primitives/GText';
import { colors } from '../design-system/tokens/colors';
import { spacing } from '../design-system/tokens/spacing';
import { useTranslation, type TranslationKey } from '../i18n';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TabItem {
  key: string;
  labelKey: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
}

const tabs: TabItem[] = [
  { key: 'index', labelKey: 'nav.home', icon: 'home-outline', iconActive: 'home' },
  { key: 'categories', labelKey: 'nav.categories', icon: 'grid-outline', iconActive: 'grid' },
  { key: 'cart', labelKey: 'nav.cart', icon: 'bag-outline', iconActive: 'bag' },
  { key: 'orders', labelKey: 'nav.orders', icon: 'receipt-outline', iconActive: 'receipt' },
  { key: 'profile', labelKey: 'nav.profile', icon: 'person-outline', iconActive: 'person' },
];

interface BottomDockProps {
  activeTab: string;
  onTabPress: (key: string) => void;
  cartCount?: number;
}

function DockTab({
  tab,
  isActive,
  onPress,
  cartCount,
}: {
  tab: TabItem;
  isActive: boolean;
  onPress: () => void;
  cartCount?: number;
}) {
  const { t } = useTranslation();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 15 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
      style={[styles.tab, animStyle]}
    >
      {isActive && <View style={styles.activeIndicator} />}
      <View style={styles.iconWrap}>
        <Ionicons
          name={isActive ? tab.iconActive : tab.icon}
          size={22}
          color={isActive ? colors.accent[500] : colors.neutral[400]}
        />
        {tab.key === 'cart' && cartCount && cartCount > 0 ? (
          <View style={styles.cartBadge}>
            <GText
              variant="caption"
              color="#FFFFFF"
              style={styles.cartBadgeText}
            >
              {cartCount > 9 ? '9+' : cartCount}
            </GText>
          </View>
        ) : null}
      </View>
      <GText
        variant="caption"
        color={isActive ? colors.accent[500] : colors.neutral[400]}
        weight={isActive ? 'semibold' : 'medium'}
        style={styles.tabLabel}
      >
        {t(tab.labelKey)}
      </GText>
    </AnimatedPressable>
  );
}

export function BottomDock({ activeTab, onTabPress, cartCount }: BottomDockProps) {
  const insets = useSafeAreaInsets();
  
  // On some Android devices, virtual buttons overlay the app but insets.bottom returns 0
  // So we provide a larger fallback padding to ensure buttons are never hidden
  const minPadding = Platform.OS === 'ios' ? spacing['3xl'] : spacing['3xl'];
  
  return (
    <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, minPadding) }]}>
      {tabs.map((tab) => (
        <DockTab
          key={tab.key}
          tab={tab}
          isActive={activeTab === tab.key}
          onPress={() => onTabPress(tab.key)}
          cartCount={tab.key === 'cart' ? cartCount : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    flexDirection: 'row',
    backgroundColor: colors.surface.card,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[150],
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 16px rgba(0,0,0,0.05)',
      } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
    }),
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.xs,
    position: 'relative',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  activeIndicator: {
    position: 'absolute',
    top: 0,
    width: 20,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.accent[500],
  },
  iconWrap: {
    position: 'relative',
    padding: 2,
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -4,
    backgroundColor: colors.accent[500],
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
  tabLabel: {
    fontSize: 10,
  },
});

// Keep FloatingTabBar export for backward compat
export { BottomDock as FloatingTabBar };
