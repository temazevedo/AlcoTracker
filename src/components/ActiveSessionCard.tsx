import { StyleSheet, Text, View, TouchableOpacity, Modal, Alert, TextInput , useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import { SessionRow } from '@/db/schema';
import { InlineDateTimePicker } from './InlineDateTimePicker';

interface ActiveSessionCardProps {
  session: SessionRow;
  onStop: () => void;
  onExtend: (newEndAt: Date) => void;
  onChangeInterval: (newIntervalMin: number) => void;
}

export function ActiveSessionCard({ session, onStop, onExtend, onChangeInterval }: ActiveSessionCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showIntervalModal, setShowIntervalModal] = useState(false);
  const [extendEndAt, setExtendEndAt] = useState<Date>(new Date(session.end_at));
  const [newInterval, setNewInterval] = useState<string>(String(session.interval_min));
  const [extendPickerMode, setExtendPickerMode] = useState<'date' | 'time'>('date');
  const [now, setNow] = useState(() => Date.now());

  // Update current time every second for time remaining calculations
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeRemaining = (): string => {
    const end = new Date(session.end_at).getTime();
    const diff = end - now;
    if (diff <= 0) return 'Ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const formatNextReminder = (): string => {
    const start = new Date(session.start_at).getTime();
    const intervalMs = session.interval_min * 60 * 1000;
    
    if (now < start) return 'Starting soon';
    
    const elapsed = now - start;
    const nextReminderTime = start + Math.ceil(elapsed / intervalMs) * intervalMs;
    const end = new Date(session.end_at).getTime();
    
    if (nextReminderTime > end) return 'Session ending';
    return new Date(nextReminderTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleExtend = () => {
    if (extendEndAt <= new Date(session.end_at)) {
      Alert.alert('Error', 'New end time must be after current end time');
      return;
    }
    onExtend(extendEndAt);
    setShowExtendModal(false);
  };

  const handleChangeInterval = () => {
    const interval = parseInt(newInterval, 10);
    if (isNaN(interval) || interval <= 0) {
      Alert.alert('Error', 'Please enter a valid interval');
      return;
    }
    if (interval > 480) {
      Alert.alert('Error', 'Interval cannot exceed 8 hours (480 min)');
      return;
    }
    onChangeInterval(interval);
    setShowIntervalModal(false);
  };

  const handleExtendDateChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(extendEndAt.getHours(), extendEndAt.getMinutes(), extendEndAt.getSeconds());
      setExtendEndAt(newDate);
    }
  };

  const handleExtendTimeChange = (event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const newDate = new Date(extendEndAt);
      newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      setExtendEndAt(newDate);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
      <View style={styles.header}>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
          <Text style={[styles.statusText, { color: isDark ? '#FFFFFF' : '#212121' }]}>ACTIVE SESSION</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: isDark ? '#BDBDBD' : '#757575' }]}>Time Remaining</Text>
          <Text style={[styles.infoValue, { color: isDark ? '#FFFFFF' : '#212121' }]}>{formatTimeRemaining()}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: isDark ? '#BDBDBD' : '#757575' }]}>Next Reminder</Text>
          <Text style={[styles.infoValue, { color: isDark ? '#4CAF50' : '#4CAF50' }]}>{formatNextReminder()}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: isDark ? '#BDBDBD' : '#757575' }]}>Interval</Text>
          <Text style={[styles.infoValue, { color: isDark ? '#FFFFFF' : '#212121' }]}>{session.interval_min} min</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: isDark ? '#BDBDBD' : '#757575' }]}>Ends At</Text>
          <Text style={[styles.infoValue, { color: isDark ? '#FFFFFF' : '#212121' }]}>
            {new Date(session.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => setShowExtendModal(true)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Extend</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowIntervalModal(true)} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Change Interval</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onStop} style={styles.actionButton}>
          <Text style={styles.actionButtonText}>Stop</Text>
        </TouchableOpacity>
      </View>

      {/* Extend Modal */}
      {showExtendModal && (
        <Modal visible={showExtendModal} animationType="slide" transparent={false}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowExtendModal(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Extend Session</Text>
              <TouchableOpacity onPress={handleExtend} style={styles.modalButton}>
                <Text style={styles.modalSaveText}>Extend</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={[styles.modalLabel, { color: isDark ? '#FFFFFF' : '#212121' }]}>New End Time</Text>
              <TouchableOpacity onPress={() => { setExtendPickerMode('date'); }} style={styles.datetimeButton}>
                <Text style={[styles.datetimeButtonText, { color: isDark ? '#FFFFFF' : '#212121' }]}>
                  {new Date(extendEndAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setExtendPickerMode('time'); }} style={styles.datetimeButton}>
                <Text style={[styles.datetimeButtonText, { color: isDark ? '#FFFFFF' : '#212121' }]}>
                  {extendEndAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </TouchableOpacity>
              <InlineDateTimePicker
                value={extendEndAt}
                mode={extendPickerMode}
                is24Hour={true}
                onChange={(_event, selectedDate) => {
                  if (selectedDate) {
                    setExtendEndAt(selectedDate);
                  }
                }}
                minimumDate={new Date(session.end_at)}
                maximumDate={new Date(new Date(session.start_at).getTime() + 24 * 60 * 60 * 1000)}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Change Interval Modal */}
      {showIntervalModal && (
        <Modal visible={showIntervalModal} animationType="slide" transparent={false}>
          <View style={[styles.modalContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowIntervalModal(false)} style={styles.modalButton}>
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Change Interval</Text>
              <TouchableOpacity onPress={handleChangeInterval} style={styles.modalButton}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={[styles.modalLabel, { color: isDark ? '#FFFFFF' : '#212121' }]}>Reminder Interval (minutes)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? '#2C2C2C' : '#F5F5F5' }]}
                value={newInterval}
                onChangeText={setNewInterval}
                placeholder="30"
                keyboardType="numeric"
                autoFocus
              />
              <Text style={styles.infoHint}>Minimum 5 min, maximum 480 min (8 hours)</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#E8F5E9',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#C8E6C9',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#208AEF',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#208AEF',
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  modalButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  modalButtonText: {
    fontSize: 16,
    color: '#208AEF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#208AEF',
  },
  modalContent: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  datetimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  datetimeButtonText: {
    fontSize: 16,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  infoHint: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
});