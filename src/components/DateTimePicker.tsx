import { StyleSheet, Text, View, TouchableOpacity, Platform , useColorScheme } from "react-native";
import React, { useState } from "react";
import DateTimePicker from "@react-native-community/datetimepicker";

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  mode?: "date" | "time" | "datetime";
  label?: string;
  placeholder?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

type AndroidMode = "date" | "time" | "datetime";

const DateTimePickerComponent: React.FC<DateTimePickerProps> = ({
  value,
  onChange,
  mode = "datetime",
  label,
  placeholder,
  minimumDate,
  maximumDate,
}: DateTimePickerProps) => {
  const [showPicker, setShowPicker] = useState(false);
  const colorScheme = useColorScheme();

  const handleConfirm = (selectedDate: Date | undefined) => {
    setShowPicker(false);
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  const handleCancel = () => {
    setShowPicker(false);
  };

  const formatDate = (date: Date): string => {
    if (mode === "date") {
      return date.toLocaleDateString();
    } else if (mode === "time") {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    }
  };

  const androidMode: AndroidMode = mode === "datetime" ? "datetime" : mode;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        onPress={() => setShowPicker(true)}
        style={[styles.button, { borderColor: colorScheme === "dark" ? "#555" : "#E0E0E0" }]}
        accessibilityLabel={label || "Select date and time"}
      >
        <Text style={[styles.buttonText, { color: colorScheme === "dark" ? "#FFF" : "#212121" }]}>
          {formatDate(value)}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerContainer, { backgroundColor: colorScheme === "dark" ? "#333" : "#FFF" }]}>
            <View style={styles.pickerHeader}>
              <TouchableOpacity onPress={handleCancel} style={styles.pickerButton}>
                <Text style={styles.pickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleConfirm(value)} style={styles.pickerButton}>
                <Text style={styles.pickerButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={value}
              mode={androidMode}
              is24Hour={true}
              onChange={({ nativeEvent }) => {
                if (nativeEvent?.timestamp !== undefined) {
                  handleConfirm(new Date(nativeEvent.timestamp));
                }
              }}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              style={styles.dateTimePicker}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#424242",
    marginBottom: 6,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
  },
  buttonText: {
    fontSize: 16,
  },
  pickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 20,
    maxHeight: "60%",
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  pickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#208AEF",
  },
  dateTimePicker: {
    flex: 1,
  },
});

export default DateTimePickerComponent;