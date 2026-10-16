/* eslint-disable react-hooks/set-state-in-effect */
import { StyleSheet, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getSessionById } from '@/db/repository';
import { SessionRow } from '@/db/schema';
import { SessionSummaryCard } from '@/components/SessionSummaryCard';
import { useState, useEffect, useCallback } from 'react';

export default function SessionSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ sessionId?: string }>();
  const [session, setSession] = useState<SessionRow | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  const loadSession = useCallback(async () => {
    if (!params.sessionId) {
      setLoading(false);
      return;
    }
    const result = await getSessionById(parseInt(params.sessionId, 10));
    if (result.success && result.data) {
      setSession(result.data);
    }
    setLoading(false);
  }, [params.sessionId]);

  useEffect(() => {
    if (params.sessionId) {
      loadSession();
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [params.sessionId]);

  const handleViewLog = () => {
    // Navigate to log tab
    router.push('/(tabs)/log' as any);
  };

  const handleDone = () => {
    // Pop back to the main screen
    router.dismissAll();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Session not found</Text>
      </View>
    );
  }

  return (
    <SessionSummaryCard
      session={session}
      onViewLog={handleViewLog}
      onDone={handleDone}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#757575',
  },
});