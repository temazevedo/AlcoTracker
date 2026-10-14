import { SessionSetupForm } from '@/components/SessionSetupForm';
import { useSession } from '@/hooks/useSession';
import { StyleSheet, View } from 'react-native';

export default function StartTrackingScreen() {
  const { session, startSession, refresh } = useSession();

  const handleStart = (startAt: Date, endAt: Date, intervalMin: number) => {
    startSession(startAt, endAt, intervalMin);
  };

  const handleCancel = () => {
    // Navigate back to home
  };

  if (session) {
    // If there's already an active session, show the active session card
    // or redirect to home
    return null;
  }

  return (
    <View style={styles.container}>
      <SessionSetupForm
        onStart={handleStart}
        onCancel={handleCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});