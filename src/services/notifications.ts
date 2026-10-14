import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { getActiveSession, getRecentDistinctDrinks, createEntry, calculateGrams } from '@/db/repository';
import { SchedulableTriggerInputTypes, AndroidImportance } from 'expo-notifications';

const NOTIFICATION_CHANNEL_ID = 'alco-tracker-reminders';
const ACTION_ADD_LAST_DRINK = 'ADD_LAST_DRINK';
const ACTION_OPEN_APP = 'OPEN_APP';

/**
 * Configure notification behavior
 */
export function configureNotifications() {
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

/**
 * Setup Android notification channel
 */
export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: 'Session Reminders',
      description: 'Reminders to log drinks during tracking sessions',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#208AEF',
      enableVibrate: true,
      enableLights: true,
      sound: 'default',
    });
  }
}

/**
 * Request notification permissions (Android 13+)
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Notifications only work on physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
      android: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    finalStatus = status;
  }

  // Android 13+ requires POST_NOTIFICATIONS permission
  if (Platform.OS === 'android' && finalStatus === 'granted') {
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        android: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    } catch (e) {
      // Permission might not be available on older Android
      console.log('POST_NOTIFICATIONS permission not available:', e);
    }
  }

  return finalStatus === 'granted';
}

/**
 * Schedule all session notifications at once
 */
export async function scheduleSessionNotifications(
  sessionId: number,
  startAt: string,
  endAt: string,
  intervalMin: number
): Promise<string[]> {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const now = Date.now();

  // If start is in the past, start from now
  const actualStart = Math.max(start, now);
  
  // If end is in the past or too soon, don't schedule
  if (actualStart >= end) {
    return [];
  }

  const notificationIds: string[] = [];
  const intervalMs = intervalMin * 60 * 1000;
  
  // Schedule notifications at each interval
  for (let time = actualStart + intervalMs; time < end; time += intervalMs) {
    try {
      const triggerDate = new Date(time);
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Time to log a drink?',
          body: 'Did you have a drink? Tap to log it.',
          data: { sessionId, action: 'reminder' },
          sound: 'default',
        },
        trigger: {
          type: SchedulableTriggerInputTypes.CALENDAR,
          repeats: false,
          year: triggerDate.getFullYear(),
          month: triggerDate.getMonth() + 1,
          day: triggerDate.getDate(),
          hour: triggerDate.getHours(),
          minute: triggerDate.getMinutes(),
          second: 0,
        },
      });
      notificationIds.push(notificationId);
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  return notificationIds;
}

/**
 * Cancel all notifications for a session
 */
export async function cancelSessionNotifications(notificationIds: string[]): Promise<void> {
  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Reschedule session notifications (cancel old, schedule new)
 */
export async function rescheduleSessionNotifications(
  sessionId: number,
  oldNotificationIds: string[],
  newEndAt: string,
  newIntervalMin: number
): Promise<string[]> {
  await cancelSessionNotifications(oldNotificationIds);
  const activeSession = await getActiveSession();
  if (activeSession.success && activeSession.data) {
    return scheduleSessionNotifications(
      sessionId,
      activeSession.data.start_at,
      newEndAt,
      newIntervalMin
    );
  }
  return [];
}

/**
 * Handle notification response (user tapped action)
 */
export function addNotificationResponseListener(
  onAddLastDrink: () => Promise<void>,
  onOpenApp: () => void
) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const actionId = response.actionIdentifier;
    const data = response.notification.request.content.data;

    if (actionId === ACTION_ADD_LAST_DRINK) {
      onAddLastDrink();
    } else if (actionId === ACTION_OPEN_APP) {
      onOpenApp();
    } else if (!actionId && data?.sessionId) {
      // Default tap on notification body
      onOpenApp();
    }
  });

  return subscription;
}

/**
 * Remove notification response listener
 */
export function removeNotificationResponseListener(subscription: Notifications.Subscription): void {
  subscription.remove();
}

/**
 * Handle "Add last drink" action - creates entry with most recent drink
 */
export async function handleAddLastDrink(): Promise<void> {
  try {
    const recentDrinks = await getRecentDistinctDrinks(1);
    if (!recentDrinks.success || !recentDrinks.data || recentDrinks.data.length === 0) {
      console.log('No recent drinks found');
      return;
    }

    const lastDrink = recentDrinks.data[0];
    const activeSession = await getActiveSession();
    const sessionId = activeSession.success && activeSession.data ? activeSession.data.id : null;

    const grams = calculateGrams(lastDrink.volume_ml, lastDrink.abv);

    await createEntry({
      definition_id: lastDrink.definition_id,
      name_snapshot: lastDrink.name,
      volume_ml: lastDrink.volume_ml,
      abv: lastDrink.abv,
      grams,
      consumed_at: new Date().toISOString(),
      session_id: sessionId,
      note: 'Added via notification',
    });

    console.log('Added last drink via notification:', lastDrink.name);
  } catch (error) {
    console.error('Failed to add last drink:', error);
  }
}

/**
 * Check and handle notification that launched the app (cold start)
 */
export async function handleStartupNotification(): Promise<void> {
  const response = await Notifications.getLastNotificationResponseAsync();
  if (response) {
    const actionId = response.actionIdentifier;
    if (actionId === ACTION_ADD_LAST_DRINK) {
      await handleAddLastDrink();
    }
    // OPEN_APP is handled by navigation automatically
  }
}

/**
 * Get notification IDs for a session (for rescheduling/cancelling)
 * In a real app, these would be stored in the session record
 * For now, we'll cancel all and reschedule
 */
export async function getSessionNotificationIds(sessionId: number): Promise<string[]> {
  // In a production app, store notification IDs with the session
  // For now, we cancel all and reschedule
  return [];
}