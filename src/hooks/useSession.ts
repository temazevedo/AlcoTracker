import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';
import {
  createSession,
  getActiveSession,
  endSession,
  cancelSession,
  updateSessionInterval,
  getEntriesBySession,
 getTodaysEntries, getProfile } from '@/db/repository';
import { SessionRow } from '@/db/schema';
import { calculateBAC, getTimeToZero, getPeakBAC } from '@/bac/calculate';
import { scheduleSessionNotifications, cancelSessionNotifications, rescheduleSessionNotifications, cancelAllNotifications } from '@/services/notifications';

interface SessionState {
  session: SessionRow | null;
  loading: boolean;
  error: string | null;
  entries: any[];
  currentBAC: number;
  peakBAC: { bac: number; time: Date } | null;
  timeToZeroMinutes: number | null;
}

export function useSession() {
  const router = useRouter();
  const [state, setState] = useState<SessionState>({
    session: null,
    loading: true,
    error: null,
    entries: [],
    currentBAC: 0,
    peakBAC: null,
    timeToZeroMinutes: null,
  });

  // Load active session on mount
  useEffect(() => {
    loadActiveSession();
  }, []);

  const loadActiveSession = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await getActiveSession();
      if (result.success && result.data) {
        const session = result.data;
        const entriesResult = await getEntriesBySession(session.id);
        const entries = entriesResult.success ? entriesResult.data : [];
        
        // Calculate BAC for session
        const profileResult = await getProfile();
        let currentBAC = 0;
        let peakBAC = null;
        let timeToZeroMinutes = null;
        
        if (profileResult.success && profileResult.data) {
          const profileData = profileResult.data;
          // Convert ProfileSettingsRow to Profile format for calculateBAC
          const profile = {
            weightKg: profileData.weight_kg,
            sex: profileData.sex,
            eliminationRate: profileData.elimination_rate,
          };
          const drinkEntries = entries.map(e => ({
            grams: e.grams,
            consumedAt: new Date(e.consumed_at),
          }));
          const bacResult = calculateBAC(drinkEntries, profile);
          currentBAC = bacResult.currentBAC;
          peakBAC = bacResult.peakBAC;
          timeToZeroMinutes = bacResult.timeToZeroMinutes;
        }

        setState(prev => ({
          ...prev,
          session,
          entries,
          currentBAC,
          peakBAC,
          timeToZeroMinutes,
          loading: false,
        }));
      } else {
        setState(prev => ({ ...prev, session: null, loading: false }));
      }
    } catch (error) {
      setState(prev => ({ ...prev, error: String(error), loading: false }));
    }
  }, []);

  const startSession = useCallback(async (
    startAt: Date,
    endAt: Date,
    intervalMin: number
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await createSession({
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        interval_min: intervalMin,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Schedule notifications
      await scheduleSessionNotifications(
        result.data.id,
        result.data.start_at,
        result.data.end_at,
        intervalMin
      );

      await loadActiveSession();
      router.replace('/(tabs)');
    } catch (error) {
      setState(prev => ({ ...prev, error: String(error), loading: false }));
      Alert.alert('Error', String(error));
    }
  }, []);

  const stopSession = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const active = await getActiveSession();
      if (!active.success || !active.data) return;

      // Cancel notifications
      // In a real app, we'd store notification IDs with the session
      // For now, cancel all and rely on reschedule logic
      await cancelAllNotifications();

      const result = await endSession(active.data.id);
      if (!result.success) {
        throw new Error(result.error);
      }

      await loadActiveSession();
      
      // Navigate to session summary
      router.push({ pathname: '/session-summary', params: { sessionId: String(active.data.id) } } as any);
    } catch (error) {
      setState(prev => ({ ...prev, error: String(error), loading: false }));
      Alert.alert('Error', String(error));
    }
  }, []);

  const extendSession = useCallback(async (newEndAt: Date) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const active = await getActiveSession();
      if (!active.success || !active.data) return;

      // Get old notification IDs (in real app, stored with session)
      const oldNotificationIds: string[] = []; // Would be stored with session

      const result = await rescheduleSessionNotifications(
        active.data.id,
        oldNotificationIds,
        newEndAt.toISOString(),
        active.data.interval_min
      );

      const updateResult = await updateSessionInterval(active.data.id, active.data.interval_min);
      // Update end_at would need a separate function
      
      await loadActiveSession();
    } catch (error) {
      setState(prev => ({ ...prev, error: String(error), loading: false }));
      Alert.alert('Error', String(error));
    }
  }, []);

  const changeInterval = useCallback(async (newIntervalMin: number) => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const active = await getActiveSession();
      if (!active.success || !active.data) return;

      const oldNotificationIds: string[] = [];

      const newEndAt = new Date(active.data.end_at).toISOString();
      
      await rescheduleSessionNotifications(
        active.data.id,
        oldNotificationIds,
        newEndAt,
        newIntervalMin
      );

      await updateSessionInterval(active.data.id, newIntervalMin);
      await loadActiveSession();
    } catch (error) {
      setState(prev => ({ ...prev, error: String(error), loading: false }));
      Alert.alert('Error', String(error));
    }
  }, []);

  // Format time remaining
  const getTimeRemaining = useCallback(() => {
    if (!state.session) return null;
    const end = new Date(state.session.end_at).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  }, [state.session]);

  const getNextReminder = useCallback(() => {
    if (!state.session) return null;
    const now = Date.now();
    const start = new Date(state.session.start_at).getTime();
    const intervalMs = state.session.interval_min * 60 * 1000;
    
    if (now < start) return new Date(start);
    
    const elapsed = now - start;
    const nextReminderTime = start + Math.ceil(elapsed / intervalMs) * intervalMs;
    const end = new Date(state.session.end_at).getTime();
    
    if (nextReminderTime > end) return null;
    return new Date(nextReminderTime);
  }, [state.session]);

  return {
    ...state,
    startSession,
    stopSession,
    extendSession,
    changeInterval,
    refresh: loadActiveSession,
    getTimeRemaining,
    getNextReminder,
  };
}