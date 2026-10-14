import { StyleSheet, View, Text, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useColorScheme } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { getEntriesForStats } from '@/db/repository';
import { DrinkEntryRow } from '@/db/schema';
import { BarChartComponent } from '@/components/BarChart';
import { StatsSummaryCards } from '@/components/StatsSummaryCards';
import { StatsSegmentedControl } from '@/components/StatsSegmentedControl';
import { getWeeklyStats, getMonthlyStats, formatGrams, formatNumber } from '@/stats/aggregate';

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const [entries, setEntries] = useState<DrinkEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch 28 days for monthly view (4 weeks)
      const result = await getEntriesForStats(28);
      if (result.success) {
        setEntries(result.data);
      } else {
        setError(result.error || 'Failed to load entries');
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEntries();
  }, [loadEntries]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadEntries();
  }, [loadEntries]);

  // Compute stats
  const weeklyStats = getWeeklyStats(entries);
  const monthlyStats = getMonthlyStats(entries);

  const chartData = view === 'weekly'
    ? weeklyStats.days.map((d) => ({
        label: d.label,
        value: d.grams,
        isDrinkingDay: d.isDrinkingDay,
      }))
    : monthlyStats.weeks.map((w) => ({
        label: w.label,
        value: w.grams,
        isDrinkingDay: w.isDrinkingWeek,
      }));

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={[styles.loadingText, { color: isDark ? '#9E9E9E' : '#757575' }, { marginTop: 16 }]}>
          Loading stats...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <Text style={[styles.errorText, { color: '#D32F2F' }]}>{error}</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#208AEF']} />
      }
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#212121' }]}>Statistics</Text>
      </View>

      <View style={styles.content}>
        <StatsSegmentedControl selectedView={view} onViewChange={setView} />

        <StatsSummaryCards
          totalGrams={view === 'weekly' ? weeklyStats.totalGrams : monthlyStats.totalGrams}
          totalDrinks={view === 'weekly' ? weeklyStats.totalDrinks : monthlyStats.totalDrinks}
          avgGramsPerDrinkingDay={view === 'weekly' ? weeklyStats.avgGramsPerDrinkingDay : monthlyStats.avgGramsPerDrinkingWeek}
          avgDrinksPerDrinkingDay={view === 'weekly' ? weeklyStats.avgDrinksPerDrinkingDay : monthlyStats.avgDrinksPerDrinkingWeek}
          drinkingDays={view === 'weekly' ? weeklyStats.drinkingDays : monthlyStats.drinkingWeeks}
          totalDays={view === 'weekly' ? 7 : 4}
          formatGrams={formatGrams}
          formatNumber={formatNumber}
        />

        <BarChartComponent
          data={chartData}
          title={view === 'weekly' ? 'Grams per Day (Last 7 Days)' : 'Grams per Week (Last 4 Weeks)'}
          valueFormatter={formatGrams}
        />

        {/* Additional info */}
        <View style={[styles.infoCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
          <Text style={[styles.infoTitle, { color: isDark ? '#FFFFFF' : '#212121' }]}>
            {view === 'weekly' ? 'Weekly Summary' : 'Monthly Summary'}
          </Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: isDark ? '#BDBDBD' : '#757575' }]}>
                Drinking Days
              </Text>
              <Text style={[styles.infoValue, { color: isDark ? '#FFFFFF' : '#212121' }]}>
                {view === 'weekly' ? weeklyStats.drinkingDays : monthlyStats.drinkingWeeks} /
                {view === 'weekly' ? 7 : 4}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={[styles.infoLabel, { color: isDark ? '#BDBDBD' : '#757575' }]}>
                Peak {view === 'weekly' ? 'Day' : 'Week'}
              </Text>
              <Text style={[styles.infoValue, { color: '#FF5722' }]}>
                {(() => {
                  if (view === 'weekly') {
                    const peak = weeklyStats.days.reduce((max, d) => (d.grams > max.grams ? d : max), weeklyStats.days[0]);
                    return peak.isDrinkingDay ? `${peak.label}: ${formatGrams(peak.grams)}` : '—';
                  } else {
                    const peak = monthlyStats.weeks.reduce((max, w) => (w.grams > max.grams ? w : max), monthlyStats.weeks[0]);
                    return peak.isDrinkingWeek ? `${peak.label}: ${formatGrams(peak.grams)}` : '—';
                  }
                })()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#208AEF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
});