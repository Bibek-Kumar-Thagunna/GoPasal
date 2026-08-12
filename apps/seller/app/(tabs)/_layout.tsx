import React from 'react';
import { useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SellerTabShell } from '../../src/components/layout/SellerTabShell';
import { SellerWorkspaceGate } from '../../src/components/layout/SellerWorkspaceGate';
import { useLanguageStore } from '../../src/store/language.store';

const SIDEBAR_W = 280;

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { t } = useLanguageStore();

  return (
    <SellerWorkspaceGate>
    <Tabs
      tabBar={(props) => <SellerTabShell {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: isDesktop ? { paddingLeft: SIDEBAR_W } : {},
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t('nav.dashboard'), tabBarIcon: (p) => <Ionicons name="grid-outline" {...p} /> }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: t('nav.orders'), tabBarIcon: (p) => <Ionicons name="bag-handle-outline" {...p} /> }}
      />
      <Tabs.Screen
        name="products"
        options={{ title: t('nav.products'), tabBarIcon: (p) => <Ionicons name="cube-outline" {...p} /> }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: t('nav.inventory'),
          tabBarIcon: (p) => <Ionicons name="layers-outline" {...p} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: t('nav.customers'),
          tabBarIcon: (p) => <Ionicons name="people-outline" {...p} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: t('nav.analytics'),
          tabBarIcon: (p) => <Ionicons name="bar-chart-outline" {...p} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: t('nav.earnings'),
          tabBarIcon: (p) => <Ionicons name="wallet-outline" {...p} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="promotions"
        options={{
          title: t('nav.promotions'),
          tabBarIcon: (p) => <Ionicons name="pricetag-outline" {...p} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: t('nav.reviews'),
          tabBarIcon: (p) => <Ionicons name="star-outline" {...p} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('nav.settings'),
          tabBarIcon: (p) => <Ionicons name="settings-outline" {...p} />,
          href: null,
        }}
      />
    </Tabs>
    </SellerWorkspaceGate>
  );
}
