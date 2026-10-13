import { StyleSheet, Text, View, TouchableOpacity, ScrollView, useColorScheme } from "react-native";
import { useRouter } from "expo-router";
import { DrinkDefinitionRow } from "@/db/schema";

interface QuickAddDrink {
  name: string;
  volume_ml: number;
  abv: number;
  definition_id: number | null;
}

interface QuickAddButtonsProps {
  drinks: QuickAddDrink[];
  onPress: (drink: QuickAddDrink) => void;
}

export function QuickAddButtons({ drinks, onPress }: QuickAddButtonsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  if (drinks.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: isDark ? "rgba(32, 138, 239, 0.08)" : "rgba(32, 138, 239, 0.1)" }]}>
        <Text style={[styles.emptyText, { color: isDark ? "#9E9E9E" : "#757575" }]}>No recent drinks</Text>
        <Text style={[styles.emptySubtext, { color: isDark ? "#BDBDBD" : "#9E9E9E" }]}>Add drinks to see quick-add buttons</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {drinks.slice(0, 4).map((drink) => (
        <TouchableOpacity
          key={drink.name}
          onPress={() => onPress(drink)}
          style={[styles.button, { backgroundColor: isDark ? "#1E1E1E" : "#FFFFFF" }]}
          accessibilityLabel={`Add ${drink.name}, ${drink.volume_ml}ml, ${drink.abv}%`}
        >
          <Text style={[styles.buttonName, { color: isDark ? "#FFFFFF" : "#212121" }]}>{drink.name}</Text>
          <Text style={[styles.buttonDetails, { color: isDark ? "#BDBDBD" : "#757575" }]}>
            {drink.volume_ml}ml · {drink.abv}%
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonName: {
    fontSize: 14,
    fontWeight: "600",
  },
  buttonDetails: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    textAlign: "center",
  },
});