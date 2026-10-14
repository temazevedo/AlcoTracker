import { StyleSheet, Text, View, TouchableOpacity, TextInput, Alert, Keyboard, Modal } from "react-native";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createEntry, getActiveSession, calculateGrams, getDefinitionById } from "@/db/repository";
import { DrinkDefinitionRow } from "@/db/schema";
import { DrinkPicker } from "@/components/DrinkPicker";
import DateTimePickerComponent from "@/components/DateTimePicker";

export default function AddDrinkScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ preselectedDrinkId?: string }>();
  const [selectedDrink, setSelectedDrink] = useState<DrinkDefinitionRow | null>(null);
  const [consumedAt, setConsumedAt] = useState<Date>(new Date());
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  // Load preselected drink if provided
  useEffect(() => {
    if (params.preselectedDrinkId) {
      const loadDrink = async () => {
        const result = await getDefinitionById(parseInt(params.preselectedDrinkId!, 10));
        if (result.success && result.data) {
          setSelectedDrink(result.data);
        }
      };
      loadDrink();
    }
  }, [params.preselectedDrinkId]);

  // Load active session if any
  useEffect(() => {
    const loadSession = async () => {
      const result = await getActiveSession();
      // Session handling can be added here if needed
    };
    loadSession();
  }, []);

  const handleDrinkSelect = (drink: DrinkDefinitionRow) => {
    setSelectedDrink(drink);
    setShowPicker(false);
  };

  const handleSave = async () => {
    if (!selectedDrink) {
      Alert.alert("Error", "Please select a drink");
      return;
    }
    Keyboard.dismiss();
    setLoading(true);

    try {
      const grams = calculateGrams(selectedDrink.volume_ml, selectedDrink.abv);
      const sessionResult = await getActiveSession();
      const sessionId = sessionResult.success && sessionResult.data ? sessionResult.data.id : null;

      const result = await createEntry({
        definition_id: selectedDrink.id,
        name_snapshot: selectedDrink.name,
        volume_ml: selectedDrink.volume_ml,
        abv: selectedDrink.abv,
        grams,
        consumed_at: consumedAt.toISOString(),
        session_id: sessionId,
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
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Drink</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading || !selectedDrink} style={[styles.headerButton, styles.saveButton]}>
          <Text style={styles.headerButtonText}>{loading ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Drink *</Text>
          <TouchableOpacity onPress={() => setShowPicker(true)} style={styles.drinkButton}>
            <View style={styles.drinkButtonContent}>
              {selectedDrink ? (
                <>
                  <Text style={styles.drinkButtonName}>{selectedDrink.name}</Text>
                  <Text style={styles.drinkButtonDetails}>{selectedDrink.volume_ml}ml • {selectedDrink.abv}%</Text>
                </>
              ) : (
                <Text style={styles.drinkButtonPlaceholder}>Select a drink</Text>
              )}
            </View>
            <Text style={styles.drinkButtonArrow}>▼</Text>
          </TouchableOpacity>
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
              <Text style={styles.summaryValue}>{selectedDrink.volume_ml}ml • {selectedDrink.abv}%</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Alcohol</Text>
              <Text style={styles.summaryValue}>{calculateGrams(selectedDrink.volume_ml, selectedDrink.abv).toFixed(2)}g</Text>
            </View>
          </View>
        )}
      </View>

      <Modal visible={showPicker} animationType="slide" transparent={false}>
        <View style={styles.pickerModal}>
          <View style={styles.pickerModalHeader}>
            <TouchableOpacity onPress={() => setShowPicker(false)} style={styles.pickerModalButton}>
              <Text style={styles.pickerModalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.pickerModalTitle}>Select Drink</Text>
            <TouchableOpacity style={styles.pickerModalButton} />
          </View>
          <DrinkPicker
            onSelect={handleDrinkSelect}
            selectedDrink={selectedDrink}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
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
  drinkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  drinkButtonContent: {
    flex: 1,
  },
  drinkButtonName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
  },
  drinkButtonDetails: {
    fontSize: 12,
    color: "#757575",
    marginTop: 2,
  },
  drinkButtonPlaceholder: {
    fontSize: 16,
    color: "#9E9E9E",
  },
  drinkButtonArrow: {
    fontSize: 16,
    color: "#9E9E9E",
    marginLeft: 8,
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
  pickerModal: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  pickerModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  pickerModalButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  pickerModalButtonText: {
    fontSize: 16,
    color: "#208AEF",
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
  },
});