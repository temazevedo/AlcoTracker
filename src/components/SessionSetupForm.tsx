import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Keyboard, ScrollView , useColorScheme } from 'react-native';
import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { InlineDateTimePicker } from './InlineDateTimePicker';

interface SessionSetupFormProps {
  onStart: (startAt: Date, endAt: Date, intervalMin: number) => void;
  onCancel: () => void;
}

export function SessionSetupForm({ onStart, onCancel }: SessionSetupFormProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const initialStartAt = new Date();
const initialEndAt = new Date(initialStartAt.getTime() + 4 * 60 * 60 * 1000);

  const [startAt, setStartAt] = useState<Date>(initialStartAt);
  const [endAt, setEndAt] = useState<Date>(initialEndAt);
  const [intervalMin, setIntervalMin] = useState<string>('30');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startPickerMode, setStartPickerMode] = useState<'date' | 'time'>('date');
  const [endPickerMode, setEndPickerMode] = useState<'date' | 'time'>('date');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!startAt) {
      newErrors.startAt = 'Start time is required';
    }
    if (!endAt) {
      newErrors.endAt = 'End time is required';
    }
    if (startAt && endAt && endAt <= startAt) {
      newErrors.endAt = 'End time must be after start time';
    }
    
    const interval = parseInt(intervalMin, 10);
    if (!intervalMin || isNaN(interval) || interval <= 0) {
      newErrors.intervalMin = 'Interval must be a positive number';
    } else if (interval > 480) {
      newErrors.intervalMin = 'Interval cannot exceed 8 hours (480 min)';
    }
    
    // Check max session duration (24 hours)
    if (startAt && endAt) {
      const diffHours = (endAt.getTime() - startAt.getTime()) / (1000 * 60 * 60);
      if (diffHours > 24) {
        newErrors.endAt = 'Session cannot exceed 24 hours';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStart = () => {
    if (!validate()) return;
    Keyboard.dismiss();
    setLoading(true);
    onStart(startAt, endAt, parseInt(intervalMin, 10));
  };

  const handleCancel = () => {
    Keyboard.dismiss();
    onCancel();
  };

  const handleStartDateChange = (selectedDate?: Date) => {
    if (selectedDate) {
      // Preserve time from existing startAt
      const newDate = new Date(selectedDate);
      newDate.setHours(startAt.getHours(), startAt.getMinutes(), startAt.getSeconds());
      setStartAt(newDate);
    }
    setShowStartPicker(false);
  };

  const handleStartTimeChange = (selectedDate?: Date) => {
    if (selectedDate) {
      const newDate = new Date(startAt);
      newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      setStartAt(newDate);
    }
    setShowStartPicker(false);
  };

  const handleEndDateChange = (selectedDate?: Date) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      newDate.setHours(endAt.getHours(), endAt.getMinutes(), endAt.getSeconds());
      setEndAt(newDate);
    }
    setShowEndPicker(false);
  };

  const handleEndTimeChange = (selectedDate?: Date) => {
    if (selectedDate) {
      const newDate = new Date(endAt);
      newDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      setEndAt(newDate);
    }
    setShowEndPicker(false);
  };

  const showStartDatePicker = () => {
    setStartPickerMode('date');
    setShowStartPicker(true);
  };

  const showStartTimePicker = () => {
    setStartPickerMode('time');
    setShowStartPicker(true);
  };

  const showEndDatePicker = () => {
    setEndPickerMode('date');
    setShowEndPicker(true);
  };

  const showEndTimePicker = () => {
    setEndPickerMode('time');
    setShowEndPicker(true);
  };

  const formatDateTime = (date: Date): string => {
    return date.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#212121' }]}>Start Tracking</Text>
        <TouchableOpacity onPress={handleStart} disabled={loading} style={[styles.headerButton, styles.saveButton]}>
          <Text style={styles.headerButtonText}>{loading ? 'Starting...' : 'Start'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#212121' }]}>Start Time *</Text>
            <TouchableOpacity onPress={showStartDatePicker} style={[styles.datetimeButton, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
              <Text style={[styles.datetimeButtonText, { color: isDark ? '#FFFFFF' : '#212121' }]}>
                {formatDateTime(startAt)}
              </Text>
            </TouchableOpacity>
            {errors.startAt && <Text style={styles.errorText}>{errors.startAt}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#212121' }]}>End Time *</Text>
            <TouchableOpacity onPress={showEndDatePicker} style={[styles.datetimeButton, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
              <Text style={[styles.datetimeButtonText, { color: isDark ? '#FFFFFF' : '#212121' }]}>
                {formatDateTime(endAt)}
              </Text>
            </TouchableOpacity>
            {errors.endAt && <Text style={styles.errorText}>{errors.endAt}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: isDark ? '#FFFFFF' : '#212121' }]}>Reminder Interval (min) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}
              value={intervalMin}
              onChangeText={setIntervalMin}
              placeholder="30"
              keyboardType="numeric"
            />
            {errors.intervalMin && <Text style={styles.errorText}>{errors.intervalMin}</Text>}
          </View>

          <View style={styles.infoBox}>
            <Text style={[styles.infoTitle, { color: isDark ? '#FFFFFF' : '#212121' }]}>How it works</Text>
            <Text style={[styles.infoText, { color: isDark ? '#BDBDBD' : '#757575' }]}>
              • You'll get a notification every {intervalMin || '30'} minutes to log your drink
            </Text>
            <Text style={[styles.infoText, { color: isDark ? '#BDBDBD' : '#757575' }]}>
              • Notifications work even when the app is closed
            </Text>
            <Text style={[styles.infoText, { color: isDark ? '#BDBDBD' : '#757575' }]}>
              • Tap "Add last drink" on the notification to quickly log your most recent drink
            </Text>
            <Text style={[styles.infoText, { color: isDark ? '#BDBDBD' : '#757575' }]}>
              • Battery saver mode may delay notifications
            </Text>
          </View>

          <TouchableOpacity onPress={handleStart} disabled={loading} style={[styles.primaryAction, { backgroundColor: loading ? '#90CAF9' : '#208AEF' }]}>
            <Text style={styles.primaryActionText}>{loading ? 'Starting...' : 'Start'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date/Time Pickers */}
      {showStartPicker ? (
        <InlineDateTimePicker
          value={startAt}
          mode={startPickerMode}
          is24Hour={true}
          onChange={(_event, selectedDate) => {
            if (selectedDate) {
              if (startPickerMode === 'date') {
                handleStartDateChange(selectedDate);
              } else {
                handleStartTimeChange(selectedDate);
              }
            }
            setShowStartPicker(false);
          }}
          minimumDate={new Date()}
        />
      ) : null}
      {showEndPicker ? (
        <InlineDateTimePicker
          value={endAt}
          mode={endPickerMode}
          is24Hour={true}
          onChange={(_event, selectedDate) => {
            if (selectedDate) {
              if (endPickerMode === 'date') {
                handleEndDateChange(selectedDate);
              } else {
                handleEndTimeChange(selectedDate);
              }
            }
            setShowEndPicker(false);
          }}
          minimumDate={startAt}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#208AEF',
  },
  saveButton: {
    marginRight: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#424242',
    marginBottom: 6,
  },
  datetimeButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
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
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    marginTop: 4,
  },
  infoBox: {
    marginTop: 8,
    padding: 16,
    backgroundColor: 'rgba(32, 138, 239, 0.1)',
    borderRadius: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
  primaryAction: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#208AEF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});