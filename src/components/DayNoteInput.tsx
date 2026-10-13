import { StyleSheet, Text, View, TextInput, TouchableOpacity, Keyboard } from "react-native";
import { useState, useEffect } from "react";
import { format, parseISO } from "date-fns";

interface DayNoteInputProps {
  date: string; // YYYY-MM-DD
  onSave: (date: string, note: string) => void;
  onCancel: () => void;
}

export function DayNoteInput({ date, onSave, onCancel }: DayNoteInputProps) {
  const [note, setNote] = useState("");

  useEffect(() => {
    // Focus the input when modal appears
    Keyboard.dismiss();
  }, []);

  const displayDate = format(parseISO(date), "EEEE, MMMM d");

  const handleSave = () => {
    Keyboard.dismiss();
    onSave(date, note.trim());
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modal}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onCancel} style={styles.modalButton}>
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Day Note</Text>
          <TouchableOpacity onPress={handleSave} style={styles.modalButton}>
            <Text style={styles.modalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <Text style={styles.dateText}>{displayDate}</Text>
          <TextInput
            style={styles.textArea}
            value={note}
            onChangeText={setNote}
            placeholder="Add a note for this day..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            autoFocus
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    paddingHorizontal: 16,
    zIndex: 100,
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  modalButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  modalButtonText: {
    fontSize: 16,
    color: "#208AEF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#208AEF",
  },
  modalContent: {
    padding: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#757575",
    marginBottom: 12,
  },
  textArea: {
    minHeight: 150,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
    color: "#212121",
  },
});