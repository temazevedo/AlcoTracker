/* eslint-disable react-hooks/set-state-in-effect */
import { StyleSheet, Text, View, TextInput, Switch, TouchableOpacity, Alert, Keyboard } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { createDefinition, updateDefinition, getDefinitionById } from "@/db/repository";
import { DrinkDefinitionRow } from "@/db/schema";

type Mode = "create" | "edit";

interface DrinkDefinitionFormProps {
  initialData?: DrinkDefinitionRow;
}

export function DrinkDefinitionForm({ initialData }: DrinkDefinitionFormProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: Mode; id?: string }>();
  const mode = params.mode ?? (initialData ? "edit" : "create");
  const id = params.id ? parseInt(params.id, 10) : initialData?.id;

  const [name, setName] = useState("");
  const [volume_ml, setVolumeMl] = useState("");
  const [abv, setAbv] = useState("");
  const [is_favorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"name" | "volume_ml" | "abv", string>>>({});

  const loadDefinition = useCallback(async () => {
    if (!id) return;
    const result = await getDefinitionById(id);
    if (result.success && result.data) {
      const d = result.data;
      setName(d.name);
      setVolumeMl(String(d.volume_ml));
      setAbv(String(d.abv));
      setIsFavorite(d.is_favorite === 1);
    }
  }, [id]);

  useEffect(() => {
    if (mode === "edit" && id) {
      loadDefinition();
    }
  }, [loadDefinition, id, mode]);  

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!name.trim()) newErrors.name = "Name is required";
    const vol = parseInt(volume_ml, 10);
    if (!volume_ml || isNaN(vol) || vol <= 0) newErrors.volume_ml = "Volume must be a positive number";
    const abvVal = parseFloat(abv);
    if (!abv || isNaN(abvVal) || abvVal < 0 || abvVal > 100) newErrors.abv = "ABV must be between 0 and 100";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    Keyboard.dismiss();
    setLoading(true);

    const vol = parseInt(volume_ml, 10);
    const abvVal = parseFloat(abv);

    try {
      if (mode === "create") {
        const result = await createDefinition(name.trim(), vol, abvVal, is_favorite);
        if (result.success) {
          router.back();
        } else {
          Alert.alert("Error", result.error);
        }
      } else if (id) {
        const result = await updateDefinition(id, { name: name.trim(), volume_ml: vol, abv: abvVal });
        if (result.success) {
          router.back();
        } else {
          Alert.alert("Error", result.error);
        }
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
        <Text style={styles.headerTitle}>{mode === "create" ? "New Definition" : "Edit Definition"}</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={[styles.headerButton, styles.saveButton]}>
          <Text style={styles.headerButtonText}>{loading ? "Saving..." : "Save"}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Small beer"
            autoCapitalize="words"
            autoFocus
          />
          {errors.name && <Text style={styles.error}>{errors.name}</Text>}
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Volume (ml) *</Text>
            <TextInput
              style={styles.input}
              value={volume_ml}
              onChangeText={setVolumeMl}
              placeholder="330"
              keyboardType="numeric"
            />
            {errors.volume_ml && <Text style={styles.error}>{errors.volume_ml}</Text>}
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>ABV (%) *</Text>
            <TextInput
              style={styles.input}
              value={abv}
              onChangeText={setAbv}
              placeholder="5.0"
              keyboardType="decimal-pad"
            />
            {errors.abv && <Text style={styles.error}>{errors.abv}</Text>}
          </View>
        </View>

        <View style={styles.field}>
          <View style={styles.switchRow}>
            <Text style={styles.label}>Favorite</Text>
            <Switch
              value={is_favorite}
              onValueChange={setIsFavorite}
            />
          </View>
        </View>
      </View>
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
  row: {
    flexDirection: "row",
    gap: 12,
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
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});