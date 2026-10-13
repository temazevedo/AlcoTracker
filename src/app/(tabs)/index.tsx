import { StyleSheet, Text, View, TouchableOpacity, useColorScheme } from "react-native";
import { useRouter } from "expo-router";

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleAddDrink = () => {
    router.push("/add-drink" as any);
  };

  const handleStartTracking = () => {
    router.push("/start-tracking" as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#F5F5F5" }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#212121" }]}>AlcoTracker</Text>
      </View>

      <View style={[styles.bacCard, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}>
        <Text style={[styles.bacLabel, { color: isDark ? "#BDBDBD" : "#757575" }]}>Current BAC</Text>
        <Text style={[styles.bacValue, { color: isDark ? "#FFFFFF" : "#212121" }]}>0.000 ‰</Text>
        <Text style={[styles.bacSubtext, { color: isDark ? "#9E9E9E" : "#9E9E9E" }]}>Time to ~0: —</Text>
      </View>

      <View style={[styles.graphPlaceholder, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}>
        <Text style={[styles.graphText, { color: isDark ? "#9E9E9E" : "#9E9E9E" }]}>BAC Graph (Feature 5)</Text>
      </View>

      <View style={styles.quickAddSection}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#212121" }]}>Quick Add</Text>
        <Text style={[styles.sectionSubtext, { color: isDark ? "#BDBDBD" : "#757575" }]}>Recent drinks will appear here</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity onPress={() => router.push("/add-drink" as any)} style={styles.primaryAction}>
          <Text style={styles.primaryActionText}>+ Add Drink</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/start-tracking" as any)} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>Start Tracking</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
  },
  bacCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bacLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  bacValue: {
    fontSize: 48,
    fontWeight: "700",
    marginBottom: 8,
  },
  bacSubtext: {
    fontSize: 14,
  },
  graphPlaceholder: {
    borderRadius: 16,
    padding: 32,
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  graphText: {
    fontSize: 16,
  },
  quickAddSection: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(32, 138, 239, 0.1)",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtext: {
    fontSize: 14,
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
});