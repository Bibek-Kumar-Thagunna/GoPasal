import { useEffect, useRef, useState } from 'react';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from '../api';

export interface PushNotificationState {
  expoPushToken?: Notifications.ExpoPushToken;
  notification?: Notifications.Notification;
}

export const usePushNotifications = (): PushNotificationState => {
  if (Platform.OS === 'web') {
    return {};
  }

  const [expoPushToken, setExpoPushToken] = useState<Notifications.ExpoPushToken>();
  const [notification, setNotification] = useState<Notifications.Notification>();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  async function registerForPushNotificationsAsync() {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
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
          return;
        }
        
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

        const pushTokenString = (
          await Notifications.getExpoPushTokenAsync(
            projectId ? { projectId } : undefined
          )
        ).data;
        return pushTokenString;
      }
    } catch {
      // Safe fallback when running in Expo Go or without EAS project ID
    }
    return undefined;
  }

  useEffect(() => {
    if (Platform.OS === 'web') return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        api.put('/profile', { pushToken: token }).catch(() => {});
      }
    }).catch(() => {});

    try {
      if ((Platform.OS as string) !== 'web') {
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

      notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
        setNotification(notification);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
        // Notification tapped
      });
    } catch {
      // Ignore if notifications fail in dev env
    }

    return () => {
      try {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch {}
    };
  }, []);

  return { expoPushToken, notification };
};
