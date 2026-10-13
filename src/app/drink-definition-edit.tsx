/* eslint-disable react-hooks/set-state-in-effect */
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getDefinitionById } from "@/db/repository";
import { DrinkDefinitionForm } from "@/components/DrinkDefinitionForm";
import { DrinkDefinitionRow } from "@/db/schema";
import { useState, useEffect, useCallback } from "react";

export default function DrinkDefinitionEditScreen() {
  const params = useLocalSearchParams<{ id?: string; mode?: "create" | "edit" }>();
  const [definition, setDefinition] = useState<DrinkDefinitionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDefinition = useCallback(async () => {
    if (!params.id) {
      setLoading(false);
      return;
    }
    const result = await getDefinitionById(parseInt(params.id, 10));
    if (result.success && result.data) {
      setDefinition(result.data);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      loadDefinition();
    } else {
      setLoading(false);
    }
  }, [loadDefinition]);

  return (
    <View style={styles.container}>
      <DrinkDefinitionForm
        initialData={definition || undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
});