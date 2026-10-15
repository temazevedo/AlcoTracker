import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity } from "react-native";
import { initializeDatabase } from "@/db/migrations";
import { getProfile, acceptDisclaimer } from "@/db/repository";
import { I18nProvider } from "@/i18n";
import { ThemeProvider } from "@/theme";
import { styles as layoutStyles } from "./_layout.styles";

export default function RootLayout() {
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

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

  // Check if disclaimer has been accepted
  useEffect(() => {
    if (!dbReady) return;
    
    let mounted = true;
    
    async function checkDisclaimer() {
      try {
        const result = await getProfile();
        if (mounted && result.success && result.data) {
          const profile = result.data;
          if (!profile.disclaimer_accepted_at) {
            setShowDisclaimer(true);
          }
        }
        setProfileReady(true);
      } catch (error) {
        console.warn('Failed to check disclaimer:', error);
        setProfileReady(true);
      }
    }
    
    checkDisclaimer();
    return () => { mounted = false; };
  }, [dbReady]);

  const handleAcceptDisclaimer = async () => {
    try {
      await acceptDisclaimer();
      setShowDisclaimer(false);
    } catch (error) {
      console.error('Failed to accept disclaimer:', error);
    }
  };

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
          {showDisclaimer && (
            <DisclaimerModal
              onAccept={handleAcceptDisclaimer}
              visible={showDisclaimer}
            />
          )}
        </>
      </ThemeProvider>
    </I18nProvider>
  );
}

// Disclaimer Modal Component
function DisclaimerModal({ 
  visible, 
  onAccept 
}: { 
  visible: boolean; 
  onAccept: () => void; 
}) {
  if (!visible) return null;
  
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'disclaimer.title': 'Important Disclaimer',
      'disclaimer.text': 'This app provides approximate Blood Alcohol Content (BAC) estimates based on the Widmark formula. These estimates are approximations and should never be used to determine fitness to drive or operate machinery. Never drink and drive. Consult a healthcare professional for medical advice. The developers are not responsible for any decisions made based on this app\'s estimates.',
      'disclaimer.accept': 'I Understand & Accept',
    };
    return translations[key] || key;
  };
  
  if (!visible) return null;
  
  return (
    <View style={layoutStyles.disclaimerOverlay}>
      <View style={layoutStyles.disclaimerModal}>
        <Text style={layoutStyles.disclaimerTitle}>{t('disclaimer.title')}</Text>
        <View style={layoutStyles.disclaimerScroll}>
          <Text style={layoutStyles.disclaimerText}>{t('disclaimer.text')}</Text>
        </View>
        <TouchableOpacity 
          onPress={onAccept}
          style={layoutStyles.disclaimerAcceptButton}
          activeOpacity={0.8}
        >
          <Text style={layoutStyles.disclaimerAcceptButtonText}>{t('disclaimer.accept')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}