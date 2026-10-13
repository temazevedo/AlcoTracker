/* eslint-disable react-hooks/set-state-in-effect */
import { StyleSheet, Text, View, FlatList, Alert, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { format } from "date-fns";
import { getEntriesByDateRange, setDayNote, deleteEntry } from "@/db/repository";
import { DrinkEntryRow } from "@/db/schema";
import { DaySection } from "@/components/DaySection";
import { DayNoteInput } from "@/components/DayNoteInput";

export default function LogScreen() {
  const router = useRouter();
  const [entriesByDate, setEntriesByDate] = useState<Record<string, DrinkEntryRow[]>>({});
  const [sortedDates, setSortedDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [editingNoteDate, setEditingNoteDate] = useState<string | null>(null);

  // Load last 90 days of entries
  const loadEntries = useCallback(async () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);

    const startStr = format(startDate, "yyyy-MM-dd");
    const endStr = format(endDate, "yyyy-MM-dd");

    const result = await getEntriesByDateRange(startStr, endStr);
    if (result.success) {
      // Group by date
      const grouped: Record<string, DrinkEntryRow[]> = {};
      for (const entry of result.data) {
        const date = entry.consumed_at.split("T")[0]; // YYYY-MM-DD
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(entry);
      }
      setEntriesByDate(grouped);
      setSortedDates(Object.keys(grouped).sort((a, b) => b.localeCompare(a)));
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadEntries();
  };

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  };

  const handleDeleteEntry = (entry: DrinkEntryRow) => {
    Alert.alert(
      "Delete Entry",
      `Delete ${entry.name_snapshot} from ${entry.consumed_at.split("T")[0]}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteEntry(entry.id);
            if (result.success) {
              loadEntries();
            } else {
              Alert.alert("Error", result.error);
            }
          },
        },
      ]
    );
  };

  const handleEditEntry = (entry: DrinkEntryRow) => {
    router.push({ pathname: "/edit-entry", params: { id: String(entry.id) } } as any);
  };

  const handleDayNoteChange = async (date: string, note: string) => {
    const result = await setDayNote(date, note);
    if (!result.success) {
      Alert.alert("Error", result.error);
    }
    setEditingNoteDate(null);
  };

  if (loading && sortedDates.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading log...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Log</Text>
      </View>

      <FlatList
        data={sortedDates}
        keyExtractor={(item) => item}
        renderItem={({ item: date }) => (
          <DaySection
            date={date}
            entries={entriesByDate[date] || []}
            expanded={expandedDates.has(date)}
            onToggle={() => toggleDate(date)}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            onNotePress={() => setEditingNoteDate(date)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>
              Tap Add Drink on Home to log your first drink
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {editingNoteDate && (
        <DayNoteInput
          date={editingNoteDate}
          onSave={handleDayNoteChange}
          onCancel={() => setEditingNoteDate(null)}
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