import { StyleSheet, Text, View, TouchableOpacity, Switch, Alert } from "react-native";
import { useRouter } from "expo-router";
import { DrinkDefinitionRow } from "@/db/schema";

interface DrinkDefinitionItemProps {
  definition: DrinkDefinitionRow;
  onEdit: () => void;
  onToggleArchive: () => void;
  onToggleFavorite: () => void;
}

export function DrinkDefinitionItem({
  definition,
  onEdit,
  onToggleArchive,
  onToggleFavorite,
}: DrinkDefinitionItemProps) {
  const router = useRouter();

  const handlePress = () => {
    if (definition.is_archived) {
      onToggleArchive();
    } else {
      onEdit();
    }
  };

  const handleLongPress = () => {
    Alert.alert(
      definition.name,
      undefined,
      [
        { text: "Edit", onPress: onEdit },
        {
          text: definition.is_archived ? "Unarchive" : "Archive",
          onPress: onToggleArchive,
          style: definition.is_archived ? "default" : "destructive",
        },
        {
          text: definition.is_favorite ? "Remove from favorites" : "Add to favorites",
          onPress: onToggleFavorite,
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={styles.container}
      accessibilityLabel={`${definition.name}, ${definition.volume_ml}ml, ${definition.abv}% ABV${definition.is_favorite ? ", favorite" : ""}${definition.is_archived ? ", archived" : ""}`}
    >
      <View style={styles.content}>
        <View style={styles.info}>
          <Text style={definition.is_archived ? [styles.name, styles.archivedName] : styles.name}>{definition.name}</Text>
          <Text style={definition.is_archived ? [styles.details, styles.archivedDetails] : styles.details}>
            {definition.volume_ml}ml • {definition.abv}%
          </Text>
        </View>
        <View style={styles.actions}>
          <Switch
            value={definition.is_favorite === 1}
            onValueChange={onToggleFavorite}
            disabled={definition.is_archived === 1}
            accessibilityLabel={definition.is_favorite ? "Remove from favorites" : "Add to favorites"}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E0E0E0",
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "500",
    color: "#212121",
  },
  archivedName: {
    color: "#9E9E9E",
    textDecorationLine: "line-through",
  },
  details: {
    fontSize: 13,
    color: "#757575",
    marginTop: 2,
  },
  archivedDetails: {
    color: "#BDBDBD",
  },
  actions: {
    marginLeft: 16,
  },
});