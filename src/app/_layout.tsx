import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { initializeDatabase } from "@/db/migrations";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initDb() {
      try {
        await initializeDatabase();
        if (mounted) setDbReady(true);
      } catch (error) {
        if (mounted) setDbError(String(error));
      }
    }

    initDb();
    return () => { mounted = false; };
  }, []);

  if (dbError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to initialize database:</Text>
        <Text style={styles.errorText}>{dbError}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={styles.loadingText}>Initializing database...</Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="add-drink" />
      <Stack.Screen name="edit-entry" />
      <Stack.Screen name="drink-definitions" />
      <Stack.Screen name="drink-definition-edit" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "gray",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "red",
    textAlign: "center",
    marginBottom: 8,
  },
});