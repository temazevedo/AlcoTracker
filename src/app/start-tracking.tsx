import { StyleSheet, Text, View, TouchableOpacity, useColorScheme } from "react-native";
import { useRouter } from "expo-router";

export default function StartTrackingScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleStart = () => {
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#F5F5F5" }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? "#FFFFFF" : "#212121" }]}>Start Tracking</Text>
        <TouchableOpacity onPress={handleStart} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Start</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.form, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#212121" }]}>Session Settings</Text>
        
        <View style={styles.field}>
          <Text style={[styles.label, { color: isDark ? "#FFFFFF" : "#212121" }]}>Start Time</Text>
          <View style={[styles.placeholder, { backgroundColor: isDark ? "#2C2C2C" : "#F5F5F5" }]}>
            <Text style={[styles.placeholderText, { color: isDark ? "#9E9E9E" : "#757575" }]}>Now</Text>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: isDark ? "#FFFFFF" : "#212121" }]}>End Time</Text>
          <View style={[styles.placeholder, { backgroundColor: isDark ? "#2C2C2C" : "#F5F5F5" }]}>
            <Text style={[styles.placeholderText, { color: isDark ? "#9E9E9E" : "#757575" }]}>In 4 hours</Text>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: isDark ? "#FFFFFF" : "#212121" }]}>Reminder Interval</Text>
          <View style={[styles.placeholder, { backgroundColor: isDark ? "#2C2C2C" : "#F5F5F5" }]}>
            <Text style={[styles.placeholderText, { color: isDark ? "#9E9E9E" : "#757575" }]}>30 minutes</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity onPress={handleStart} style={[styles.primaryAction, { backgroundColor: "#208AEF" }]}>
        <Text style={styles.primaryActionText}>Start Session</Text>
      </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: "#208AEF",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
  },
  form: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 8,
  },
  placeholder: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  placeholderText: {
    fontSize: 16,
  },
  primaryAction: {
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 12,
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
});