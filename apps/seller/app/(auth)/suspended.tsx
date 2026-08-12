import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthLayout } from '../../src/components/ui/AuthLayout';
import { Button } from '../../src/components/ui/Button';
import { colors } from '../../src/design-system/tokens/colors';
import { spacing } from '../../src/design-system/tokens/spacing';
import { useAuthStore } from '../../src/store/auth.store';

function Text({ style, children }: { style?: object; children: React.ReactNode }) {
  return (
    <Animated.Text style={[{ fontFamily: 'Inter', color: colors.neutral[900] }, style]}>
      {children}
    </Animated.Text>
  );
}

export default function SuspendedScreen() {
  const router = useRouter();

  const handleSignOut = async () => {
    await useAuthStore.getState().logout();
    router.replace('/(auth)/login' as any);
  };

  return (
    <AuthLayout showFooter={false}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.wrap}>
        <View style={styles.icon}>
          <Ionicons name="pause-circle" size={48} color={colors.warning.main} />
        </View>
        <Text style={styles.title}>Store suspended</Text>
        <Text style={styles.body}>
          GoPasal operations paused this storefront. Customers cannot place new orders until your
          account is reactivated by the platform team.
        </Text>
        <Button
          label="Contact support"
          variant="outline"
          fullWidth
          onPress={() => void Linking.openURL('mailto:support@gopasal.com')}
        />
        <Button label="Sign out" fullWidth onPress={handleSignOut} />
      </Animated.View>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg, paddingVertical: spacing.xl },
  icon: { alignSelf: 'center' },
  title: { fontSize: 24, fontFamily: 'Poppins-Bold', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, color: colors.neutral[600], textAlign: 'center' },
});
