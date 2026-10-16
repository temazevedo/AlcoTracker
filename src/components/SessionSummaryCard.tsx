import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, ScrollView , useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { SessionRow , DrinkEntryRow } from '@/db/schema';
import { getEntriesBySession, getProfile } from '@/db/repository';
import { calculateBAC } from '@/bac/calculate';
import { useState, useEffect, useCallback } from 'react';

interface SessionSummaryCardProps {
  session: SessionRow;
  onViewLog: () => void;
  onDone: () => void;
}

export function SessionSummaryCard({ session, onViewLog, onDone }: SessionSummaryCardProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [entries, setEntries] = useState<DrinkEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    totalGrams: number;
    drinkCount: number;
    peakBAC: { bac: number; time: Date } | null;
    timeToZeroMinutes: number | null;
  } | null>(null);

  const loadSessionData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getEntriesBySession(session.id);
      if (result.success) {
        setEntries(result.data);
        
        // Calculate stats
        const totalGrams = result.data.reduce((sum: number, e: DrinkEntryRow) => sum + e.grams, 0);
        const drinkCount = result.data.length;
        
        // Get profile for BAC calculation
        const profileResult = await getProfile();
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
          const drinkEntries = result.data.map((e: DrinkEntryRow) => ({
            grams: e.grams,
            consumedAt: new Date(e.consumed_at),
          }));
          const bacResult = calculateBAC(drinkEntries, profile);
          peakBAC = bacResult.peakBAC;
          timeToZeroMinutes = bacResult.timeToZeroMinutes;
        }
        
        setStats({
          totalGrams,
          drinkCount,
          peakBAC,
          timeToZeroMinutes,
        });
      }
    } catch (error) {
      console.error('Failed to load session summary:', error);
    } finally {
      setLoading(false);
    }
  }, [session.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSessionData();
  }, [loadSessionData]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={[styles.loadingText, { color: isDark ? '#9E9E9E' : '#757575' }, { marginTop: 16 }]}>Loading session summary...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onDone} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Done</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#212121' }]}>Session Summary</Text>
        <TouchableOpacity onPress={onViewLog} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>View Log</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Session Info */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
          <View style={styles.cardHeader}>
            <View style={styles.sessionInfo}>
              <Text style={[styles.sessionTitle, { color: isDark ? '#FFFFFF' : '#212121' }]}>
                {formatDate(session.start_at)}
              </Text>
              <Text style={[styles.sessionTime, { color: isDark ? '#BDBDBD' : '#757575' }]}>
                {new Date(session.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                {new Date(session.end_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <View style={styles.statusBadge}>
                <Text style={[styles.statusText, { backgroundColor: session.status === 'active' ? '#E8F5E9' : session.status === 'ended' ? '#FFF3E0' : '#FFEBEE', color: session.status === 'active' ? '#2E7D32' : session.status === 'ended' ? '#E65100' : '#C62828' }]}>
                  {session.status.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          {/* Key Stats */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#212121' }]}>{stats?.totalGrams?.toFixed(1) || '0.0'}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#BDBDBD' : '#757575' }]}>Total Alcohol (g)</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: isDark ? '#FFFFFF' : '#212121' }]}>{stats?.drinkCount || 0}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#BDBDBD' : '#757575' }]}>Drinks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: stats?.peakBAC ? '#FF5722' : (isDark ? '#FFFFFF' : '#212121') }]}>{stats?.peakBAC ? stats.peakBAC.bac.toFixed(3) : '0.000'}</Text>
              <Text style={[styles.statLabel, { color: isDark ? '#BDBDBD' : '#757575' }]}>Peak BAC (‰)</Text>
            </View>
            <View style={stats && stats.timeToZeroMinutes !== null && stats.timeToZeroMinutes !== undefined ? styles.statItem : styles.statItemHidden}>
              <Text style={[styles.statValue, { color: stats && stats.timeToZeroMinutes ? '#4CAF50' : (isDark ? '#FFFFFF' : '#212121') }]}>
                {stats && stats.timeToZeroMinutes !== null && stats.timeToZeroMinutes !== undefined 
                  ? (() => {
                      const mins = stats.timeToZeroMinutes!;
                      if (mins <= 0) return 'Now';
                      const hours = Math.floor(mins / 60);
                      const minsRem = mins % 60;
                      return hours > 0 ? `${hours}h ${minsRem}m` : `${minsRem}m`;
                    })() 
                  : '—'}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? '#BDBDBD' : '#757575' }]}>Time to ~0</Text>
            </View>
          </View>
        </View>

        {/* Entries List */}
        <View style={[styles.card, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', marginTop: 16 }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#212121' }]}>Drinks in Session</Text>
            <Text style={[styles.cardSubtitle, { color: isDark ? '#BDBDBD' : '#757575' }]}>{entries.length} entries</Text>
          </View>

          {entries.length === 0 ? (
            <View style={styles.emptyEntries}>
              <Text style={[styles.emptyEntriesText, { color: isDark ? '#9E9E9E' : '#757575' }]}>No drinks logged in this session</Text>
            </View>
          ) : (
            entries.map((item, index) => (
              <View key={String(item.id)}>
                <View style={styles.entryItem}>
                  <View style={styles.entryContent}>
                    <View style={styles.entryMain}>
                      <Text style={[styles.entryName, { color: isDark ? '#FFFFFF' : '#212121' }]}>{item.name_snapshot}</Text>
                      <Text style={[styles.entryTime, { color: isDark ? '#9E9E9E' : '#757575' }]}>{formatTime(item.consumed_at)}</Text>
                    </View>
                    <View style={styles.entryDetails}>
                      <Text style={[styles.entryVolume, { color: isDark ? '#BDBDBD' : '#757575' }]}>{item.volume_ml}ml • {item.abv}%</Text>
                      <Text style={[styles.entryGrams, { color: '#4CAF50' }]}>{item.grams.toFixed(2)}g</Text>
                    </View>
                  </View>
                  {item.note && (
                    <Text style={[styles.entryNote, { color: isDark ? '#BDBDBD' : '#9E9E9E' }]}>{item.note}</Text>
                  )}
                </View>
                {index < entries.length - 1 && <View style={styles.separator} />}
              </View>
            ))
          )}
        </View>

        {/* Actions */}
        <View style={[styles.actions, { marginTop: 24 }]}>
          <TouchableOpacity onPress={onViewLog} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>View Full Log</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onDone} style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Done</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#208AEF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 13,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(32, 138, 239, 0.1)',
  },
  statItemHidden: {
    flex: 1,
    minWidth: '45%',
    opacity: 0,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  entryItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FAFAFA',
  },
  entryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  entryMain: {
    flex: 1,
  },
  entryName: {
    fontSize: 15,
    fontWeight: '500',
  },
  entryTime: {
    fontSize: 12,
    marginTop: 2,
  },
  entryDetails: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  entryVolume: {
    fontSize: 12,
  },
  entryGrams: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginTop: 2,
  },
  entryNote: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
    paddingHorizontal: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  emptyEntries: {
    padding: 24,
    alignItems: 'center',
  },
  emptyEntriesText: {
    fontSize: 14,
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  primaryAction: {
    backgroundColor: '#208AEF',
    borderRadius: 12,
    paddingVertical: 16,
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
  secondaryAction: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#208AEF',
  },
  secondaryActionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#208AEF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
});