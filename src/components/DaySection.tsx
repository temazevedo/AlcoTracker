import { StyleSheet, Text, View, TouchableOpacity, FlatList } from "react-native";
import { format, parseISO } from "date-fns";
import { DrinkEntryRow } from "@/db/schema";
import { calculateGrams } from "@/db/repository";

interface DaySectionProps {
  date: string; // YYYY-MM-DD
  entries: DrinkEntryRow[];
  expanded: boolean;
  onToggle: () => void;
  onEditEntry: (entry: DrinkEntryRow) => void;
  onDeleteEntry: (entry: DrinkEntryRow) => void;
  onNotePress: () => void;
}

export function DaySection({ date, entries, expanded, onToggle, onEditEntry, onDeleteEntry, onNotePress }: DaySectionProps) {
  const displayDate = format(parseISO(date), "EEEE, MMMM d");
  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;

  const totalGrams = entries.reduce((sum, e) => sum + e.grams, 0);
  const drinkCount = entries.length;

  const renderEntry = ({ item }: { item: DrinkEntryRow }) => (
    <TouchableOpacity
      onPress={() => onEditEntry(item)}
      onLongPress={() => onDeleteEntry(item)}
      style={styles.entryItem}
    >
      <View style={styles.entryContent}>
        <View style={styles.entryMain}>
          <Text style={styles.entryName}>{item.name_snapshot}</Text>
          <Text style={styles.entryTime}>
            {format(parseISO(item.consumed_at), "HH:mm")}
          </Text>
        </View>
        <View style={styles.entryDetails}>
          <Text style={styles.entryVolume}>
            {item.volume_ml}ml • {item.abv}%
          </Text>
          <Text style={styles.entryGrams}>
            {item.grams.toFixed(2)}g
          </Text>
        </View>
      </View>
      {item.note && (
        <Text style={styles.entryNote}>{item.note}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={onToggle} style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.dateContainer}>
            <Text style={[styles.dateText, isToday && styles.dateToday]}>{displayDate}</Text>
            {isToday && <Text style={styles.todayBadge}>Today</Text>}
          </View>
          <Text style={styles.totals}>
            {totalGrams.toFixed(1)}g • {drinkCount} {drinkCount === 1 ? "drink" : "drinks"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={onNotePress} style={styles.noteButton}>
            <Text style={styles.noteButtonText}>📝 Note</Text>
          </TouchableOpacity>
          <Text style={styles.chevron}>{expanded ? "▲" : "▼"}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.entriesContainer}>
          <FlatList
            data={entries}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderEntry}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptyEntries}>
                <Text style={styles.emptyEntriesText}>No entries for this day</Text>
              </View>
            }
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: {
    flex: 1,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212121",
  },
  dateToday: {
    color: "#208AEF",
  },
  todayBadge: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    backgroundColor: "#208AEF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  totals: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noteButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFF3E0",
    borderRadius: 16,
  },
  noteButtonText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#E65100",
  },
  chevron: {
    width: 20,
    height: 20,
    tintColor: "#9E9E9E",
  },
  entriesContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#F0F0F0",
  },
  entryItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FAFAFA",
  },
  entryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  entryMain: {
    flex: 1,
  },
  entryName: {
    fontSize: 15,
    fontWeight: "500",
    color: "#212121",
  },
  entryTime: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 2,
  },
  entryDetails: {
    alignItems: "flex-end",
  },
  entryVolume: {
    fontSize: 12,
    color: "#757575",
  },
  entryGrams: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    marginTop: 2,
  },
  entryNote: {
    fontSize: 12,
    color: "#9E9E9E",
    fontStyle: "italic",
    marginTop: 6,
    paddingHorizontal: 4,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 16,
  },
  emptyEntries: {
    padding: 24,
    alignItems: "center",
  },
  emptyEntriesText: {
    fontSize: 14,
    color: "#9E9E9E",
  },
});