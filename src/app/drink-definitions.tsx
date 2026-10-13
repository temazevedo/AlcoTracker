/* eslint-disable react-hooks/set-state-in-effect */
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { getAllDefinitions, getActiveDefinitions, archiveDefinition, unarchiveDefinition, toggleFavorite } from "@/db/repository";
import { DrinkDefinitionRow } from "@/db/schema";
import { DrinkDefinitionItem } from "@/components/DrinkDefinitionItem";
import { DrinkDefinitionForm } from "@/components/DrinkDefinitionForm";

export default function DrinkDefinitionsScreen() {
  const router = useRouter();
  const [definitions, setDefinitions] = useState<DrinkDefinitionRow[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const loadDefinitions = useCallback(async () => {
    setLoading(true);
    const result = showArchived ? await getAllDefinitions() : await getActiveDefinitions();
    if (result.success) {
      setDefinitions(result.data);
    }
    setLoading(false);
    setRefreshing(false);
  }, [showArchived]);

  useEffect(() => {
    loadDefinitions();
  }, [loadDefinitions]); // eslint-disable-line react-hooks/set-state-in-effect

  const handleToggleArchive = async (def: DrinkDefinitionRow) => {
    const result = def.is_archived ? await unarchiveDefinition(def.id) : await archiveDefinition(def.id);
    if (result.success) {
      loadDefinitions();
    } else {
      Alert.alert("Error", result.error);
    }
  };

  const handleToggleFavorite = async (def: DrinkDefinitionRow) => {
    const result = await toggleFavorite(def.id);
    if (result.success) {
      loadDefinitions();
    } else {
      Alert.alert("Error", result.error);
    }
  };

  const handleEdit = (def: DrinkDefinitionRow) => {
    setEditingId(def.id);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingId(null);
    loadDefinitions();
  };

  const handleAddNew = () => {
    setEditingId(null);
    setShowForm(true);
  };

  if (loading && definitions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading definitions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Drink Definitions</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowArchived(!showArchived)} style={styles.toggleButton}>
            <Text style={[styles.toggleText, showArchived && styles.toggleActive]}>
              {showArchived ? "Hide Archived" : "Show Archived"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddNew} style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={definitions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <DrinkDefinitionItem
            definition={item}
            onEdit={() => handleEdit(item)}
            onToggleArchive={() => handleToggleArchive(item)}
            onToggleFavorite={() => handleToggleFavorite(item)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadDefinitions} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {showArchived ? "No definitions yet" : "No active definitions"}
            </Text>
            <Text style={styles.emptySubtext}>
              {showArchived ? "Tap + Add to create your first definition" : "Tap + Add to create one"}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {showForm && (
        <DrinkDefinitionForm
          initialData={editingId ? definitions.find(d => d.id === editingId) : undefined}
        />
      )}
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
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212121",
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },
  toggleText: {
    fontSize: 13,
    color: "#757575",
  },
  toggleActive: {
    backgroundColor: "#208AEF",
    color: "#FFFFFF",
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#208AEF",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
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
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#757575",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9E9E9E",
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
});