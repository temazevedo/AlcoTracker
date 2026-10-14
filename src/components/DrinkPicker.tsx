/* eslint-disable react-hooks/set-state-in-effect */
import { StyleSheet, Text, View, TouchableOpacity, SectionList } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { getActiveDefinitions, getRecentDistinctDrinks } from "@/db/repository";
import { DrinkDefinitionRow } from "@/db/schema";

interface RecentDrink {
  name: string;
  volume_ml: number;
  abv: number;
  definition_id: number | null;
}

interface DrinkPickerProps {
  onSelect: (drink: DrinkDefinitionRow) => void;
  selectedDrink?: DrinkDefinitionRow | null;
}

export function DrinkPicker({ onSelect, selectedDrink }: DrinkPickerProps) {
  const [recentDrinks, setRecentDrinks] = useState<RecentDrink[]>([]);
  const [allDefinitions, setAllDefinitions] = useState<DrinkDefinitionRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDrinks = useCallback(async () => {
    setLoading(true);
    const [recentResult, allResult] = await Promise.all([
      getRecentDistinctDrinks(5),
      getActiveDefinitions(),
    ]);
    if (recentResult.success) setRecentDrinks(recentResult.data);
    if (allResult.success) setAllDefinitions(allResult.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDrinks();
  }, [loadDrinks]);  

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading drinks...</Text>
      </View>
    );
  }

  const sections = [
    { title: "Recent", data: recentDrinks },
    { title: "All Definitions", data: allDefinitions },
  ].filter((section) => section.data.length > 0);

  const renderItem = ({ item }: { item: DrinkDefinitionRow | RecentDrink }) => {
    const itemId = 'id' in item ? item.id : item.definition_id ?? -1;
    const isFavorite = 'is_favorite' in item ? item.is_favorite : false;
    const isSelected = selectedDrink && selectedDrink.id === itemId;
    
    return (
      <TouchableOpacity
        onPress={() => onSelect(item as DrinkDefinitionRow)}
        style={[styles.item, isSelected && styles.itemSelected]}
        accessibilityLabel={`${item.name}, ${item.volume_ml}ml, ${item.abv}%${isFavorite ? ", favorite" : ""}`}
      >
        <View style={styles.itemContent}>
          <Text style={isFavorite ? [styles.itemName, styles.itemFavorite] : styles.itemName}>{item.name}</Text>
          <Text style={styles.itemDetails}>{item.volume_ml}ml &bull; {item.abv}%</Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Text style={styles.checkmarkText}>&#10003;</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: { title: string; data: (DrinkDefinitionRow | RecentDrink)[] } }) => (
    <Text style={styles.sectionHeader}>{section.title}</Text>
  );

  if (sections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No drink definitions</Text>
        <Text style={styles.emptySubtext}>Create definitions in Settings first</Text>
      </View>
    );
  }

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item, index) => 'id' in item ? String(item.id) : `recent-${index}`}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
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
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#757575",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5F5F5",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#F0F0F0",
  },
  itemSelected: {
    backgroundColor: "#E3F2FD",
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
  },
  itemFavorite: {
    fontWeight: "600",
  },
  itemDetails: {
    fontSize: 13,
    color: "#757575",
    marginTop: 2,
  },
  checkmark: {
    marginLeft: 12,
    padding: 4,
  },
  checkmarkText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#208AEF",
  },
});