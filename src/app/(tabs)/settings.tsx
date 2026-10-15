import { StyleSheet, Text, View, TouchableOpacity, Switch, useColorScheme } from "react-native";
import { useRouter } from "expo-router";

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const handleDrinkDefinitions = () => {
    router.push("/drink-definitions" as any);
  };

  const handleExportCSV = () => {
    router.push("/import-preview?mode=export" as any);
  };

  const handleImportCSV = () => {
    router.push("/import-preview?mode=import" as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#121212" : "#F5F5F5" }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? "#FFFFFF" : "#212121" }]}>Settings</Text>
      </View>

      <View style={[styles.section, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#212121" }]}>Profile</Text>
        <TouchableOpacity style={styles.settingsRow} onPress={() => {}}>
          <Text style={[styles.settingsLabel, { color: isDark ? "#FFFFFF" : "#212121" }]}>Weight & Sex</Text>
          <Text style={[styles.settingsValue, { color: isDark ? "#BDBDBD" : "#757575" }]}>Not set</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsRow} onPress={() => {}}>
          <Text style={[styles.settingsLabel, { color: isDark ? "#FFFFFF" : "#212121" }]}>Units</Text>
          <Text style={[styles.settingsValue, { color: isDark ? "#BDBDBD" : "#757575" }]}>Metric (‰)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsRow} onPress={() => {}}>
          <Text style={[styles.settingsLabel, { color: isDark ? "#FFFFFF" : "#212121" }]}>Elimination Rate</Text>
          <Text style={[styles.settingsValue, { color: isDark ? "#BDBDBD" : "#757575" }]}>0.15 ‰/h</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#212121" }]}>Drinks</Text>
        <TouchableOpacity style={styles.settingsRow} onPress={handleDrinkDefinitions}>
          <Text style={[styles.settingsLabel, { color: isDark ? "#FFFFFF" : "#212121" }]}>Drink Definitions</Text>
          <Text style={[styles.settingsValue, { color: isDark ? "#BDBDBD" : "#757575" }]}>Manage your drinks</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#212121" }]}>Notifications</Text>
        <TouchableOpacity style={styles.settingsRow} onPress={() => {}}>
          <Text style={[styles.settingsLabel, { color: isDark ? "#FFFFFF" : "#212121" }]}>Session Reminders</Text>
          <Switch
            value={false}
            onValueChange={() => {}}
            disabled
          />
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#212121" }]}>Data</Text>
        <TouchableOpacity style={styles.settingsRow} onPress={handleExportCSV}>
          <Text style={[styles.settingsLabel, { color: isDark ? "#FFFFFF" : "#212121" }]}>Export CSV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsRow} onPress={handleImportCSV}>
          <Text style={[styles.settingsLabel, { color: isDark ? "#FFFFFF" : "#212121" }]}>Import CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.section, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}>
        <Text style={[styles.sectionTitle, { color: isDark ? "#FFFFFF" : "#212121" }]}>About</Text>
        <TouchableOpacity style={styles.settingsRow} onPress={() => {}}>
          <Text style={[styles.settingsLabel, { color: isDark ? "#FFFFFF" : "#212121" }]}>Disclaimer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingsRow} onPress={() => {}}>
          <Text style={[styles.settingsLabel, { color: isDark ? "#FFFFFF" : "#212121" }]}>Version 1.0.0</Text>
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
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingsValue: {
    fontSize: 14,
  },
});