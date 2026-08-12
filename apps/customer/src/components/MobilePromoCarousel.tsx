import React, { useRef, useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Image, useWindowDimensions, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../design-system/tokens/colors';
import { spacing, radius } from '../design-system/tokens/spacing';

const PROMO_BANNERS = [
  { id: '1', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80', link: '/search?category=grocery' },
  { id: '2', url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?auto=format&fit=crop&w=800&q=80', link: '/search?category=fresh' },
  { id: '3', url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80', link: '/search?category=fruits' },
];

export const MobilePromoCarousel = () => {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Only render on mobile-sized screens
  if (width >= 768 || Platform.OS === 'web') {
    return null;
  }

  // Calculate sizes to allow a peek of the next card
  const paddingHorizontal = spacing.md;
  const cardWidth = width - (paddingHorizontal * 2) - 30; // Leave 30px for the next card peek
  const cardHeight = cardWidth * 0.55; // Aspect ratio closer to 16:9
  const snapInterval = cardWidth + spacing.md;

  useEffect(() => {
    const interval = setInterval(() => {
      let nextIndex = currentIndex + 1;
      if (nextIndex >= PROMO_BANNERS.length) {
        nextIndex = 0;
      }
      
      setCurrentIndex(nextIndex);
      
      scrollRef.current?.scrollTo({
        x: nextIndex * snapInterval,
        animated: true,
      });
    }, 4000); // 4 seconds is a reasonable auto-slide duration

    return () => clearInterval(interval);
  }, [currentIndex, snapInterval]);

  const handleScroll = (event: any) => {
    // Update current index when user manually scrolls
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / snapInterval);
    if (index !== currentIndex) {
      setCurrentIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal }}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {PROMO_BANNERS.map((banner, index) => (
          <Pressable 
            key={banner.id} 
            onPress={() => router.push(banner.link as any)}
            style={[
              styles.cardWrapper, 
              { width: cardWidth, height: cardHeight },
              index < PROMO_BANNERS.length - 1 && { marginRight: spacing.md }
            ]}
          >
            <Image 
              source={{ uri: banner.url }} 
              style={styles.image} 
              resizeMode="cover"
            />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface.background,
  },
  cardWrapper: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.neutral[200],
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
