import { StyleSheet, Text, View, TouchableOpacity, useColorScheme, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { useBAC } from "@/hooks/useBAC";
import { useSession } from "@/hooks/useSession";
import { getRecentDistinctDrinks } from "@/db/repository";
import { BACGraph } from "@/components/BACGraph";
import { QuickAddButtons } from "@/components/QuickAddButtons";
import { ActiveSessionCard } from "@/components/ActiveSessionCard";
import { useState, useEffect } from "react";

// Type for recent drinks from getRecentDistinctDrinks
interface RecentDrink {
  name: string;
  volume_ml: number;
  abv: number;
  definition_id: number | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const { currentBAC, peakBAC, timeToZeroMinutes, series, loading, error } = useBAC();
  const { session, loading: sessionLoading, stopSession, extendSession, changeInterval, refresh: refreshSession } = useSession();
  const [quickAddDrinks, setQuickAddDrinks] = useState<RecentDrink[]>([]);
  const [drinksLoading, setDrinksLoading] = useState(true);

  useEffect(() => {
    const loadDrinks = async () => {
      setDrinksLoading(true);
      const result = await getRecentDistinctDrinks(4);
      if (result.success) {
        setQuickAddDrinks(result.data);
      }
      setDrinksLoading(false);
    };
    loadDrinks();
  }, []);

  const formatBAC = (bac: number): string => {
    return bac.toFixed(3);
  };

  const formatTimeToZero = (minutes: number | null): string => {
    if (minutes === null || minutes <= 0) return "—";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#F5F5F5" }]}>
        <View style={[styles.errorCard, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}>
          <Text style={[styles.errorText, { color: "#D32F2F" }]}>Failed to load BAC data</Text>
          <Text style={[styles.errorDetail, { color: isDark ? "#BDBDBD" : "#757575" }]}>{error}</Text>
        </View>
      </View>
    );
  }

  const bacDisplay = loading ? "—" : formatBAC(currentBAC);
  const peakDisplay = peakBAC ? formatBAC(peakBAC.bac) : "—";
  const timeToZeroDisplay = timeToZeroMinutes !== null ? formatTimeToZero(timeToZeroMinutes) : "—";

  const handleStopSession = () => {
    stopSession();
  };

  const handleExtendSession = (newEndAt: Date) => {
    extendSession(newEndAt);
  };

  const handleChangeInterval = (newIntervalMin: number) => {
    changeInterval(newIntervalMin);
  };

  const handleViewLog = () => {
    router.push("/(tabs)/log" as any);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { backgroundColor: isDark ? "#121212" : "#F5F5F5" }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#212121" }]}>AlcoTracker</Text>
      </View>

      {/* Active Session Card */}
      {session && (
        <ActiveSessionCard
          session={session}
          onStop={handleStopSession}
          onExtend={handleExtendSession}
          onChangeInterval={handleChangeInterval}
        />
      )}

      {/* BAC Card */}
      <View style={[styles.bacCard, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}>
        <View style={styles.bacRow}>
          <View style={styles.bacItem}>
            <Text style={[styles.bacLabel, { color: isDark ? "#BDBDBD" : "#757575" }]}>Current BAC</Text>
            <Text style={[styles.bacValue, { color: isDark ? "#FFFFFF" : "#212121" }]}>{bacDisplay} ‰</Text>
          </View>
          <View style={[styles.bacDivider, { backgroundColor: isDark ? "#444" : "#E0E0E0" }]} />
          <View style={styles.bacItem}>
            <Text style={[styles.bacLabel, { color: isDark ? "#BDBDBD" : "#757575" }]}>Peak BAC</Text>
            <Text style={[styles.bacValue, { color: isDark ? "#FF5722" : "#FF5722" }]}>{peakDisplay} ‰</Text>
          </View>
          <View style={[styles.bacDivider, { backgroundColor: isDark ? "#444" : "#E0E0E0" }]} />
          <View style={styles.bacItem}>
            <Text style={[styles.bacLabel, { color: isDark ? "#BDBDBD" : "#757575" }]}>Time to ~0</Text>
            <Text style={[styles.bacValue, { color: isDark ? "#4CAF50" : "#4CAF50" }]}>{timeToZeroDisplay}</Text>
          </View>
        </View>
      </View>

      {/* BAC Graph */}
      <View style={[styles.graphCard, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}>
        <BACGraph
          series={series}
          peakBAC={peakBAC}
          timeToZeroMinutes={timeToZeroMinutes}
        />
      </View>

      {/* Quick Add */}
      <View style={styles.quickAddSection}>
        <View style={styles.quickAddHeader}>
          <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#212121" }]}>Quick Add</Text>
          {drinksLoading ? (
            <ActivityIndicator size="small" color="#208AEF" />
          ) : (
            <QuickAddButtons
              drinks={quickAddDrinks}
              onPress={(drink) => {
                if (drink.definition_id) {
                  router.push({ pathname: "/add-drink", params: { preselectedDrinkId: String(drink.definition_id) } } as any);
                }
              }}
            />
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {!session && (
          <TouchableOpacity onPress={() => router.push("/start-tracking" as any)} style={styles.primaryAction}>
            <Text style={styles.primaryActionText}>Start Tracking</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={() => router.push("/add-drink" as any)} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>+ Add Drink</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Type for recent drinks from getRecentDistinctDrinks
interface RecentDrink {
  name: string;
  volume_ml: number;
  abv: number;
  definition_id: number | null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  bacCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bacRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bacItem: {
    flex: 1,
    alignItems: "center",
  },
  bacDivider: {
    width: 1,
    height: 48,
  },
  bacLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  bacValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  graphCard: {
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
  },
  quickAddSection: {
    marginBottom: 24,
  },
  quickAddHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  actions: {
    gap: 12,
    marginTop: 8,
  },
  primaryAction: {
    backgroundColor: "#208AEF",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#208AEF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  secondaryAction: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#208AEF",
  },
  secondaryActionText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#208AEF",
  },
  errorCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  errorDetail: {
    fontSize: 13,
    textAlign: "center",
  },
});