import { StyleSheet, View, Text, Dimensions, useColorScheme } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

interface BarChartDataPoint {
  label: string;
  value: number;
  isDrinkingDay?: boolean;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  width?: number;
  height?: number;
  maxValue?: number;
  title?: string;
  valueFormatter?: (value: number) => string;
}

const { width: screenWidth } = Dimensions.get('window');

export function BarChartComponent({
  data,
  width = screenWidth - 32,
  height = 220,
  maxValue,
  title,
  valueFormatter = (v) => v.toFixed(0),
}: BarChartProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const primaryColor = '#208AEF';
  const mutedColor = isDark ? '#444444' : '#E0E0E0';
  const textColor = isDark ? '#BDBDBD' : '#757575';
  const bgColor = isDark ? '#1E1E1E' : '#FFFFFF';
  const gridColor = isDark ? '#444444' : '#E0E0E0';

  if (data.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: bgColor, width, height }]}>
        <Text style={[styles.emptyText, { color: '#9E9E9E' }]}>{title || 'No data'}</Text>
        <Text style={[styles.emptySubtext, { color: '#9E9E9E' }]}>No entries for this period</Text>
      </View>
    );
  }

  // Calculate max value if not provided
  const computedMaxValue = maxValue ?? Math.max(...data.map(d => d.value), 1) * 1.2;

  // Transform data for gifted-charts
  const chartData = data.map((point, index) => ({
    value: point.value,
    label: point.label,
    x: index,
    color: point.isDrinkingDay ? primaryColor : mutedColor,
  }));

  return (
    <View style={[styles.container, { backgroundColor: bgColor, width, height }]}>
      {title && (
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#212121' }, { marginBottom: 8 }]}>
          {title}
        </Text>
      )}
      <BarChart
        data={chartData}
        width={width}
        height={height - (title ? 32 : 0)}
        barWidth={width / (data.length * 1.5)}
        maxValue={computedMaxValue}
        color={primaryColor}
        backgroundColor={bgColor}
        hideRules={false}
        hideYAxisText={false}
        yAxisLabelWidth={40}
        xAxisLabelTextStyle={{ color: textColor, fontSize: 10 }}
        yAxisTextStyle={{ color: textColor, fontSize: 10 }}
        formatYLabel={(label: string) => valueFormatter(parseFloat(label))}
        animationDuration={800}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginTop: 8,
  },
});

export { BarChartComponent as BarChart };