import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../design-system/tokens/colors';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  size?: number;
  disabled?: boolean;
}

export const StarRating = ({ rating, onRatingChange, size = 24, disabled = false }: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hoverRating || rating);
        return (
          <Pressable
            key={star}
            onPress={() => !disabled && onRatingChange?.(star)}
            onHoverIn={() => !disabled && setHoverRating(star)}
            onHoverOut={() => !disabled && setHoverRating(0)}
            disabled={disabled}
            style={({ pressed }) => [
              styles.starWrap,
              pressed && !disabled && { transform: [{ scale: 0.9 }] }
            ]}
          >
            <Ionicons
              name={isFilled ? 'star' : 'star-outline'}
              size={size}
              color={isFilled ? colors.star.filled : colors.star.empty}
            />
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starWrap: {
    padding: 2,
  },
});
