import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useColorScheme } from 'react-native';
import { BACPoint, PeakBAC } from '@/bac/types';

interface BACGraphProps {
  series: BACPoint[];
  peakBAC: PeakBAC | null;
  timeToZeroMinutes: number | null;
  width?: number;
  height?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export function BACGraph({
  series,
  peakBAC,
  timeToZeroMinutes,
  width = screenWidth - 32,
  height = 200,
}: BACGraphProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const gridColor = isDark ? '#444444' : '#E0E0E0';
  const textColor = isDark ? '#BDBDBD' : '#757575';
  const lineColor = '#208AEF';
  const peakColor = '#FF5722';
  const zeroLineColor = isDark ? '#666666' : '#CCCCCC';
  const bgColor = isDark ? '#1E1E1E' : '#FFFFFF';

  if (series.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: bgColor, width, height }]}>
        <Text style={[styles.emptyText, { color: '#9E9E9E' }]}>No BAC data</Text>
        <Text style={[styles.emptySubtext, { color: '#9E9E9E' }]}>Add drinks to see BAC graph</Text>
      </View>
    );
  }

  const chartData = series.map((point) => ({
    value: point.bac,
    label: point.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    x: point.time.getTime(),
  }));

  const minTime = series[0].time.getTime();
  const maxTime = series[series.length - 1].time.getTime();

  const maxBAC = peakBAC ? peakBAC.bac : Math.max(...series.map((p) => p.bac));
  const yMax = maxBAC * 1.2 || 0.5;

  const peakData = peakBAC
    ? [{
      value: peakBAC.bac,
      label: peakBAC.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      x: peakBAC.time.getTime(),
    }]
    : [];

  const zeroLineData = timeToZeroMinutes
    ? [
        { value: 0, label: '', x: minTime },
        { value: 0, label: '', x: maxTime },
      ]
    : [];

  return (
    <View style={[styles.container, { backgroundColor: bgColor, width, height }]}>
      <LineChart
        data={chartData}
        data2={peakBAC ? peakData : undefined}
        data3={timeToZeroMinutes ? zeroLineData : undefined}
        color={lineColor}
        color2={peakColor}
        color3={zeroLineColor}
        thickness={2}
        thickness2={0}
        thickness3={1}
        strokeDashArray3={[4, 4]}
        areaChart={true}
        startFillColor={isDark ? 'rgba(32, 138, 239, 0.15)' : 'rgba(32, 138, 239, 0.1)'}
        endFillColor={isDark ? 'rgba(32, 138, 239, 0.15)' : 'rgba(32, 138, 239, 0.1)'}
        dataPointsHeight2={8}
        dataPointsWidth2={8}
        dataPointsColor2={peakColor}
        dataPointsHeight3={0}
        dataPointsWidth3={0}
        areaChart2={false}
        areaChart3={false}
        hideRules={false}
        mostNegativeValue={0}
        maxValue={yMax}
        formatYLabel={(label: string) => label}
        rulesColor={gridColor}
        textColor={textColor}
        curved={true}
        hideDataPoints={false}
        hideYAxisText={false}
        yAxisLabelWidth={40}
        xAxisLabelTextStyle={{ color: textColor, fontSize: 10 }}
        yAxisTextStyle={{ color: textColor, fontSize: 10 }}
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
});