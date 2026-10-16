import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { initializeDatabase } from "@/db/migrations";
import { getProfile } from "@/db/repository";
import { I18nProvider } from "@/i18n";
import { ThemeProvider } from "@/theme";
import { DisclaimerProvider } from "@/components/DisclaimerModal";
import { styles as layoutStyles } from "./_layout.styles";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);

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

  // Ensure the profile row exists so screens can read profile settings
  useEffect(() => {
    if (!dbReady) return;

    let mounted = true;

    async function checkProfile() {
      try {
        await getProfile();
      } catch (error) {
        console.warn('Failed to load profile:', error);
      }
      if (mounted) setProfileReady(true);
    }

    checkProfile();
    return () => { mounted = false; };
  }, [dbReady]);

  if (dbError) {
    return (
      <View style={layoutStyles.errorContainer}>
        <Text style={layoutStyles.errorText}>Failed to initialize database:</Text>
        <Text style={layoutStyles.errorText}>{dbError}</Text>
      </View>
    );
  }

  if (!dbReady) {
    return (
      <View style={layoutStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={layoutStyles.loadingText}>Initializing database...</Text>
      </View>
    );
  }

  if (!profileReady) {
    return (
      <View style={layoutStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={layoutStyles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <I18nProvider>
      <ThemeProvider>
        <DisclaimerProvider>
          <>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="add-drink" />
              <Stack.Screen name="edit-entry" />
              <Stack.Screen name="drink-definitions" />
              <Stack.Screen name="drink-definition-edit" />
              <Stack.Screen name="start-tracking" />
              <Stack.Screen name="session-summary" />
              <Stack.Screen name="import-preview" />
              <Stack.Screen name="profile-settings" />
            </Stack>
          </>
        </DisclaimerProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}