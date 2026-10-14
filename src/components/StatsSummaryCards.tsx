import { StyleSheet, View, Text, useColorScheme } from 'react-native';

interface StatsSummaryCardProps {
  label: string;
  value: string;
  icon?: string;
}

interface StatsSummaryCardsProps {
  totalGrams: number;
  totalDrinks: number;
  avgGramsPerDrinkingDay: number;
  avgDrinksPerDrinkingDay: number;
  drinkingDays: number;
  totalDays: number;
  formatGrams?: (grams: number) => string;
  formatNumber?: (num: number) => string;
}

export function StatsSummaryCards({
  totalGrams,
  totalDrinks,
  avgGramsPerDrinkingDay,
  avgDrinksPerDrinkingDay,
  drinkingDays,
  totalDays,
  formatGrams = (g) => (g >= 100 ? `${g.toFixed(0)}g` : g >= 10 ? `${g.toFixed(1)}g` : `${g.toFixed(2)}g`),
  formatNumber = (n) => (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)),
}: StatsSummaryCardsProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const primaryColor = '#208AEF';
  const textColor = isDark ? '#FFFFFF' : '#212121';
  const subTextColor = isDark ? '#BDBDBD' : '#757575';
  const borderColor = isDark ? '#333333' : '#E0E0E0';

  const cards = [
    {
      label: 'Total Alcohol',
      value: formatGrams(totalGrams),
      color: primaryColor,
    },
    {
      label: 'Total Drinks',
      value: formatNumber(totalDrinks),
      color: '#4CAF50',
    },
    {
      label: 'Avg g/Drinking Day',
      value: drinkingDays > 0 ? formatGrams(avgGramsPerDrinkingDay) : '—',
      color: '#FF9800',
    },
    {
      label: 'Avg Drinks/Day',
      value: drinkingDays > 0 ? formatNumber(avgDrinksPerDrinkingDay) : '—',
      color: '#9C27B0',
    },
  ];

  return (
    <View style={styles.grid}>
      {cards.map((card, index) => (
        <View key={index} style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
          <View style={styles.cardTop}>
            <Text style={[styles.cardLabel, { color: subTextColor }]}>{card.label}</Text>
          </View>
          <Text style={[styles.cardValue, { color: card.color }]}>{card.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTop: {
    marginBottom: 8,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
});