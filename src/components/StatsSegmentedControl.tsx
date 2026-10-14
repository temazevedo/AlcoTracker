import { StyleSheet, View, Text, TouchableOpacity, useColorScheme } from 'react-native';

interface StatsSegmentedControlProps {
  selectedView: 'weekly' | 'monthly';
  onViewChange: (view: 'weekly' | 'monthly') => void;
}

export function StatsSegmentedControl({
  selectedView,
  onViewChange,
}: StatsSegmentedControlProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const activeBg = '#208AEF';
  const inactiveBg = isDark ? '#1E1E1E' : '#F5F5F5';
  const activeText = '#FFFFFF';
  const inactiveText = isDark ? '#BDBDBD' : '#757575';
  const borderColor = isDark ? '#333333' : '#E0E0E0';

  return (
    <View style={[styles.container, { backgroundColor: inactiveBg, borderColor }]}>
      <TouchableOpacity
        onPress={() => onViewChange('weekly')}
        style={[
          styles.segment,
          selectedView === 'weekly' && { backgroundColor: activeBg },
        ]}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.segmentText,
            selectedView === 'weekly' ? { color: activeText } : { color: inactiveText },
          ]}
        >
          Weekly
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => onViewChange('monthly')}
        style={[
          styles.segment,
          selectedView === 'monthly' && { backgroundColor: activeBg },
        ]}
        activeOpacity={0.8}
      >
        <Text
          style={[
            styles.segmentText,
            selectedView === 'monthly' ? { color: activeText } : { color: inactiveText },
          ]}
        >
          Monthly
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
  },
});