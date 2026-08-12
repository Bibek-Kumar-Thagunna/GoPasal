import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" options={{ title: 'Seller Login — GoPasal Merchant Central' }} />
      <Stack.Screen name="register" options={{ title: 'Merchant Registration — GoPasal' }} />
      <Stack.Screen name="category-select" options={{ title: 'Select Shop Category — GoPasal Seller' }} />
      <Stack.Screen name="store-verification" options={{ title: 'Business Verification — GoPasal Seller' }} />
      <Stack.Screen name="under-review" options={{ title: 'Account Under Review — GoPasal Seller' }} />
      <Stack.Screen name="approved" options={{ title: 'Merchant Approved — Welcome to GoPasal' }} />
      <Stack.Screen name="store-setup" options={{ title: 'Finish Store Setup — GoPasal Merchant' }} />
      <Stack.Screen name="suspended" options={{ title: 'Account Notice — GoPasal' }} />
    </Stack>
  );
}
