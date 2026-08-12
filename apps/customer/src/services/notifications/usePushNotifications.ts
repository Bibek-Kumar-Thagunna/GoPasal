import { useEffect, useRef, useState } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../api-client';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

import { useAuthStore } from '../../store/auth.store';

export const usePushNotifications = (): PushNotificationState => {
  if (Platform.OS === 'web') {
    return {};
  }

  const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken>();
  const [notification, setNotification] = useState<Notifications.Notification>();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

  async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return;
      }
      
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        
      if (!projectId) {
        console.warn('Project ID not found in app.json/app.config.js');
      }

      try {
        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
        console.log("Expo Push Token:", pushTokenString);
        return pushTokenString;
      } catch (e: unknown) {
        const errorString = String(e);
        if (errorString.includes('FirebaseApp is not initialized')) {
          console.warn('Push Notifications disabled: Firebase (google-services.json) is not configured.');
        } else {
          console.warn(`Could not get push token: ${errorString}`);
        }
      }
    } else {
      console.warn('Must use physical device for push notifications');
    }

    return token;
  }

  useEffect(() => {
    if (Platform.OS === 'web') return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token as any);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.orderId) {
        router.push(`/order/${data.orderId}` as any);
      } else if (data?.productId) {
        router.push(`/product/${data.productId}` as any);
      } else if (data?.url) {
        router.push(data.url as any);
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (user && expoPushToken) {
      apiClient.put('/profile', { pushToken: expoPushToken }).catch((err) => {
        console.error('Failed to sync push token', err);
      });
    }
  }, [user, expoPushToken]);

  return { expoPushToken, notification };
};
