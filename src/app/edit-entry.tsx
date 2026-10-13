/* eslint-disable react-hooks/set-state-in-effect */
import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Keyboard, ScrollView } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { getEntryById, updateEntry, deleteEntry, getActiveDefinitions, calculateGrams } from "@/db/repository";
import { DrinkEntryRow, DrinkDefinitionRow } from "@/db/schema";
import { DrinkPicker } from "@/components/DrinkPicker";
import { DateTimePickerComponent } from "@/components/DateTimePicker";

export default function EditEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const [entry, setEntry] = useState<DrinkEntryRow | null>(null);
  const [definitions, setDefinitions] = useState<DrinkDefinitionRow[]>([]);
  const [selectedDrink, setSelectedDrink] = useState<DrinkDefinitionRow | null>(null);
  const [consumedAt, setConsumedAt] = useState<Date>(new Date());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadEntry = useCallback(async () => {
    if (!params.id) return;
    const result = await getEntryById(parseInt(params.id, 10));
    if (result.success && result.data) {
      const e = result.data;
      setEntry(e);
      setConsumedAt(new Date(e.consumed_at));
      setNote(e.note || "");
      // Find matching definition
      if (e.definition_id) {
        const def = definitions.find(d => d.id === e.definition_id);
        if (def) setSelectedDrink(def);
      }
    }
    setLoading(false);
  }, [definitions, params.id]);

  const loadDefinitions = useCallback(async () => {
    const result = await getActiveDefinitions();
    if (result.success) {
      setDefinitions(result.data);
    }
  }, []);

  useEffect(() => {
    if (params.id) {
      loadEntry();
      loadDefinitions();
    }
  }, [loadEntry, loadDefinitions, params.id]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleDrinkSelect = (drink: DrinkDefinitionRow) => {
    setSelectedDrink(drink);
  };

  const handleSave = useCallback(async () => {
    if (!entry || !selectedDrink) return;
    Keyboard.dismiss();
    setSaving(true);

    try {
      const grams = calculateGrams(selectedDrink.volume_ml, selectedDrink.abv);
      const result = await updateEntry(entry.id, {
        name_snapshot: selectedDrink.name,
        volume_ml: selectedDrink.volume_ml,
        abv: selectedDrink.abv,
        grams,
        consumed_at: consumedAt.toISOString(),
        note: note.trim() || null,
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
  }, [entry, selectedDrink, consumedAt, note]);

  const handleDelete = () => {
    if (!entry) return;
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this drink entry?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => doDelete() },
      ]
    );
  };

  const doDelete = useCallback(async () => {
    if (!entry) return;
    setSaving(true);
    try {
      const result = await deleteEntry(entry.id);
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
  }, [entry]);

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Entry not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Entry</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving} style={[styles.headerButton, styles.saveButton]}>
          <Text style={styles.headerButtonText}>{saving ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Drink *</Text>
          <DrinkPicker
            onSelect={handleDrinkSelect}
            selectedDrink={selectedDrink}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Time *</Text>
          <DateTimePickerComponent
            value={consumedAt}
            onChange={setConsumedAt}
            mode="datetime"
            label="When did you have this drink?"
            maximumDate={new Date()}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Note (optional)</Text>
          <TextInput
            style={styles.textArea}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {selectedDrink && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{selectedDrink.name}</Text>
              <Text style={styles.summaryValue}>{selectedDrink.volume_ml}ml &bull; {selectedDrink.abv}%</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Alcohol</Text>
              <Text style={styles.summaryValue}>{calculateGrams(selectedDrink.volume_ml, selectedDrink.abv).toFixed(2)}g</Text>
            </View>
          </View>
        )}

        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete Entry</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#757575",
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
  saveButton: {
    marginRight: 0,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
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
  textArea: {
    height: 80,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#212121",
  },
  summary: {
    marginTop: 8,
    padding: 16,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#424242",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#2E7D32",
  },
  deleteButton: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#C62828",
  },
});