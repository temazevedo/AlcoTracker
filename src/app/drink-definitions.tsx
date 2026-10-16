/* eslint-disable react-hooks/set-state-in-effect */
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, RefreshControl, Modal } from "react-native";
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
  }, [loadDefinitions]);  

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
        <Text style={styles.title}>Drink Definitions</Text>
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

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={() => setShowArchived(!showArchived)} style={[styles.bottomButton, styles.secondaryAction]}>
          <Text style={styles.secondaryActionText}>{showArchived ? "Hide Archived" : "Show Archived"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleAddNew} style={[styles.bottomButton, styles.primaryAction]}>
          <Text style={styles.primaryActionText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <Modal visible={showForm} transparent={false} animationType="slide" onRequestClose={handleFormClose}>
          <DrinkDefinitionForm
            initialData={editingId ? definitions.find(d => d.id === editingId) : undefined}
          />
        </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#212121",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E0E0E0",
    paddingBottom: 24,
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