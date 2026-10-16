import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useState, useCallback, useRef } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getProfile, updateProfile } from "@/db/repository";
import { ProfileSettingsRow } from "@/db/schema";
import { parseDecimal } from "@/utils/parseDecimal";

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const [weightKg, setWeightKg] = useState("");
  const [sex, setSex] = useState<"male" | "female">("male");
  const [eliminationRate, setEliminationRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"weight_kg" | "elimination_rate", string>>>({});
  const initialLoaded = useRef(false);

  const loadProfile = useCallback(async () => {
    const result = await getProfile();
    if (result.success && result.data) {
      const p: ProfileSettingsRow = result.data;
      if (!initialLoaded.current) {
        // Seed fields once per visit so in-progress edits aren't overwritten
        setWeightKg(String(p.weight_kg));
        setSex(p.sex);
        setEliminationRate(String(p.elimination_rate));
        initialLoaded.current = true;
      }
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      initialLoaded.current = false;
      loadProfile();
    }, [loadProfile])
  );

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    const weight = parseDecimal(weightKg);
    if (weightKg.trim() === "" || isNaN(weight) || weight <= 0) newErrors.weight_kg = "Weight must be a positive number";
    const rate = parseDecimal(eliminationRate);
    if (eliminationRate.trim() === "" || isNaN(rate) || rate <= 0) newErrors.elimination_rate = "Elimination rate must be a positive number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await updateProfile({
        weight_kg: parseDecimal(weightKg),
        sex,
        elimination_rate: parseDecimal(eliminationRate),
      });
      if (result.success) {
        router.back();
      } else {
        Alert.alert("Error", result.error);
      }
    } catch (error) {
      Alert.alert("Error", String(error));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.formScroll} contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Weight (kg) *</Text>
          <TextInput
            style={styles.input}
            value={weightKg}
            onChangeText={setWeightKg}
            placeholder="70"
            keyboardType="numeric"
          />
          {errors.weight_kg && <Text style={styles.error}>{errors.weight_kg}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sex *</Text>
          <View style={styles.segmentRow}>
            <TouchableOpacity
              onPress={() => setSex("male")}
              style={[styles.segmentButton, sex === "male" && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentButtonText, sex === "male" && styles.segmentButtonTextActive]}>Male</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setSex("female")}
              style={[styles.segmentButton, sex === "female" && styles.segmentButtonActive]}
            >
              <Text style={[styles.segmentButtonText, sex === "female" && styles.segmentButtonTextActive]}>Female</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Used to pick the Widmark body-water factor (r: 0.68 male, 0.55 female).
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Elimination Rate (‰/h) *</Text>
          <TextInput
            style={styles.input}
            value={eliminationRate}
            onChangeText={setEliminationRate}
            placeholder="0.15"
            keyboardType="decimal-pad"
          />
          {errors.elimination_rate && <Text style={styles.error}>{errors.elimination_rate}</Text>}
          <Text style={styles.hint}>
            Average is 0.15 ‰/h. Changing this value re-estimates all past sessions.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={handleCancel} style={[styles.bottomButton, styles.secondaryAction]}>
          <Text style={styles.secondaryActionText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.bottomButton, styles.primaryAction]}>
          <Text style={styles.primaryActionText}>{saving ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  bottomButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  secondaryAction: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#208AEF",
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#208AEF",
  },
  primaryAction: {
    backgroundColor: "#208AEF",
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  formScroll: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#424242",
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#212121",
  },
  error: {
    fontSize: 12,
    color: "#D32F2F",
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 6,
  },
  segmentRow: {
    flexDirection: "row",
    gap: 12,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E0E0E0",
  },
  segmentButtonActive: {
    borderColor: "#208AEF",
    backgroundColor: "#E8F4FD",
  },
  segmentButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#757575",
  },
  segmentButtonTextActive: {
    color: "#208AEF",
  },
  loadingText: {
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginTop: 40,
  },
});
