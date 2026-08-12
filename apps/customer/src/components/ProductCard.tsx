import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { GText } from './GText';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';
import { formatMoney } from '../utils/money';
import { useTranslation } from '../i18n';

import { Ionicons } from '@expo/vector-icons';

interface Props {
  name: string;
  price: number | string; // decimal rupees from the API
  imageUrl: string;
  unit?: string;
  cartQuantity?: number;
  onAdd?: () => void;
  onIncrement?: () => void;
  onDecrement?: () => void;
  onPress?: () => void;
  onRemoveAction?: () => void;
  removeIcon?: 'trash-outline' | 'heart-dislike-outline' | 'close';
  style?: any;
}

export const ProductCard = ({ name, price, imageUrl, unit = '1 pc', cartQuantity = 0, onAdd, onIncrement, onDecrement, onPress, onRemoveAction, removeIcon = 'trash-outline', style }: Props) => {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const showRemoteImage = Boolean(imageUrl) && !imageFailed;

  React.useEffect(() => {
    setImageLoaded(false);
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        style,
        pressed && styles.pressed
      ]}
      onPress={onPress}
    >
      <View style={styles.imageBox}>
        {/* Instant local placeholder so cards never look empty while remote image loads */}
        {(!imageLoaded || imageFailed) && (
          <View style={styles.imagePlaceholder} pointerEvents="none">
            <Ionicons name="bag-handle-outline" size={40} color={colors.primary[400]} />
          </View>
        )}
        {showRemoteImage && (
          <Image
            source={{ uri: imageUrl }}
            style={[styles.image, !imageLoaded && styles.imageHidden]}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={120}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageFailed(true)}
          />
        )}
        {onRemoveAction && (
          <Pressable style={styles.removeActionBtn} onPress={onRemoveAction} hitSlop={10}>
            <Ionicons name={removeIcon} size={18} color={colors.neutral[500]} />
          </Pressable>
        )}
      </View>

      <View style={styles.content}>
        <GText style={styles.name} numberOfLines={2}>{name}</GText>
        {unit ? <GText style={styles.unit}>{unit}</GText> : null}

        <View style={styles.bottomRow}>
          <GText style={styles.price} weight="bold">{formatMoney(price)}</GText>
          
          {cartQuantity > 0 ? (
            <View style={styles.stepperContainer}>
              <Pressable style={styles.stepperBtn} onPress={onDecrement} hitSlop={10}>
                <Ionicons name="remove" size={16} color={colors.primary[600]} />
              </Pressable>
              <GText style={styles.stepperValue} weight="semiBold">{cartQuantity}</GText>
              <Pressable style={styles.stepperBtn} onPress={onIncrement} hitSlop={10}>
                <Ionicons name="add" size={16} color={colors.primary[600]} />
              </Pressable>
            </View>
          ) : (
            <Pressable 
              style={({ pressed }) => [
                styles.addButton,
                pressed && styles.addButtonPressed
              ]} 
              onPress={onAdd}
              hitSlop={10}
            >
              <GText style={styles.addButtonText} weight="semiBold">{t('common.add')}</GText>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    width: 160, // Default — parent can override via style prop
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        cursor: 'pointer',
        transitionProperty: 'transform, box-shadow',
        transitionDuration: '200ms',
        transitionTimingFunction: 'ease-out',
      } as any
    }),
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1, // Perfect square makes products look consistent
    backgroundColor: '#F8F9FA', // Cleaner, neutral background
    padding: spacing.xs, // Less padding, bigger image
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  imagePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  imageHidden: {
    opacity: 0,
  },
  removeActionBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    padding: spacing.md,
    backgroundColor: '#ffffff',
  },
  name: {
    fontSize: 13,
    color: colors.neutral[800],
    lineHeight: 18,
    fontFamily: 'Inter',
    marginBottom: spacing.sm,
    minHeight: 36, // Fixed height for alignment across horizontal list
  },
  unit: {
    fontSize: 11,
    color: colors.neutral[500],
    fontFamily: 'Inter',
    marginTop: -spacing.xs,
    marginBottom: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  price: {
    fontSize: 15,
    color: colors.neutral[900],
  },
  addButton: {
    backgroundColor: colors.primary[500], // Teal color exact to reference
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  addButtonPressed: {
    backgroundColor: colors.primary[600],
    transform: [{ scale: 0.95 }],
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  stepperBtn: {
    padding: 4,
  },
  stepperValue: {
    fontSize: 14,
    color: colors.neutral[900],
    marginHorizontal: 8,
    minWidth: 16,
    textAlign: 'center',
  },
});
