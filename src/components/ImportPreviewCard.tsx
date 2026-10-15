import { StyleSheet, View, Text, TouchableOpacity, FlatList, useColorScheme } from 'react-native';
import { ImportPreviewEntry, ImportPreviewDefinition } from '@/csv/import';

interface ImportPreviewCardProps {
  preview: {
    entries: ImportPreviewEntry[];
    definitions: ImportPreviewDefinition[];
  };
  onChoiceChange: (type: 'entry' | 'definition', rowNumber: number, choice: 'skip' | 'overwrite' | 'add-new') => void;
  onToggleSection: (section: 'entries' | 'definitions') => void;
  expandedSections: { entries: boolean; definitions: boolean };
}

export function ImportPreviewCard({ preview, onChoiceChange, onToggleSection, expandedSections }: ImportPreviewCardProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
  const primaryColor = '#208AEF';
  const textColor = isDark ? '#FFFFFF' : '#212121';
  const subTextColor = isDark ? '#BDBDBD' : '#757575';
  const borderColor = isDark ? '#333333' : '#E0E0E0';
  const errorColor = '#D32F2F';
  const warningColor = '#FF9800';
  const successColor = '#4CAF50';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return successColor;
      case 'duplicate': return warningColor;
      case 'error': return errorColor;
      default: return subTextColor;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'valid': return 'Valid';
      case 'duplicate': return 'Duplicate';
      case 'error': return 'Error';
      default: return status;
    }
  };

  const renderRow = (item: ImportPreviewEntry | ImportPreviewDefinition, index: number, type: 'entry' | 'definition') => {
    const status = item.status;
    const statusColor = getStatusColor(status);
    
    let mainText = '';
    let detailText = '';
    
    if (type === 'entry') {
      const entry = item as ImportPreviewEntry;
      mainText = entry.data.name_snapshot;
      detailText = `${entry.data.volume_ml}ml • ${entry.data.abv}% • ${formatDate(entry.data.consumed_at)} • ${entry.data.grams.toFixed(2)}g`;
    } else {
      const def = item as ImportPreviewDefinition;
      mainText = def.data.name;
      detailText = `${def.data.volume_ml}ml • ${def.data.abv}%`;
    }

    return (
      <TouchableOpacity 
        style={[styles.row, { backgroundColor: cardBg, borderColor }]}
        onPress={() => onToggleSection(type === 'entry' ? 'entries' : 'definitions')}
        activeOpacity={0.8}
      >
        <View style={styles.rowLeft}>
          <View 
            style={[
              styles.statusDot, 
              { backgroundColor: statusColor }
            ]}
          />
          <View style={styles.rowText}>
            <Text style={[styles.rowMain, { color: textColor }]}>{mainText}</Text>
            <Text style={[styles.rowDetail, { color: subTextColor }]}>{detailText}</Text>
          </View>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
            <Text style={{ color: statusColor, fontWeight: '600', fontSize: 11 }}>
              {getStatusLabel(status)}
            </Text>
          </Text>
          {status === 'duplicate' && (
            <View style={styles.choiceButtons}>
              {type === 'entry' ? (
                <>
                  <TouchableOpacity
                    style={[styles.choiceButton, item.userChoice === 'skip' ? styles.choiceButtonActive : {}, { borderColor: item.userChoice === 'skip' ? statusColor : borderColor }]}
                    onPress={() => onChoiceChange('entry', item.rowNumber, 'skip')}
                  >
                    <Text style={[styles.choiceButtonText, { color: item.userChoice === 'skip' ? statusColor : subTextColor }]}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.choiceButton, item.userChoice === 'overwrite' ? styles.choiceButtonActive : {}, { borderColor: item.userChoice === 'overwrite' ? statusColor : borderColor }]}
                    onPress={() => onChoiceChange('entry', item.rowNumber, 'overwrite')}
                  >
                    <Text style={[styles.choiceButtonText, { color: item.userChoice === 'overwrite' ? statusColor : subTextColor }]}>Overwrite</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.choiceButton, item.userChoice === 'add-new' ? styles.choiceButtonActive : {}, { borderColor: item.userChoice === 'add-new' ? statusColor : borderColor }]}
                    onPress={() => onChoiceChange('entry', item.rowNumber, 'add-new')}
                  >
                    <Text style={[styles.choiceButtonText, { color: item.userChoice === 'add-new' ? statusColor : subTextColor }]}>Add New</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.choiceButton, item.userChoice === 'skip' ? styles.choiceButtonActive : {}, { borderColor: item.userChoice === 'skip' ? statusColor : borderColor }]}
                    onPress={() => onChoiceChange('definition', item.rowNumber, 'skip')}
                  >
                    <Text style={[styles.choiceButtonText, { color: item.userChoice === 'skip' ? statusColor : subTextColor }]}>Skip</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.choiceButton, item.userChoice === 'overwrite' ? styles.choiceButtonActive : {}, { borderColor: item.userChoice === 'overwrite' ? statusColor : borderColor }]}
                    onPress={() => onChoiceChange('definition', item.rowNumber, 'overwrite')}
                  >
                    <Text style={[styles.choiceButtonText, { color: item.userChoice === 'overwrite' ? statusColor : subTextColor }]}>Overwrite</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Entries Section */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor }]}>
        <TouchableOpacity onPress={() => onToggleSection('entries')} style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={[styles.sectionIcon, { color: primaryColor }]}>
              {expandedSections.entries ? '▼' : '▶'}
            </Text>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Entries</Text>
          </View>
          <View style={styles.sectionStats}>
            <Text style={[styles.statBadge, { backgroundColor: '#4CAF5020', borderColor: '#4CAF50' }]}>
              <Text style={{ color: '#4CAF50', fontWeight: '600', fontSize: 11 }}>{preview.entries.filter(e => e.status === 'valid').length} valid</Text>
            </Text>
            <Text style={[styles.statBadge, { backgroundColor: '#FF980020', borderColor: '#FF9800' }]}>
              <Text style={{ color: '#FF9800', fontWeight: '600', fontSize: 11 }}>{preview.entries.filter(e => e.status === 'duplicate').length} dup</Text>
            </Text>
            <Text style={[styles.statBadge, { backgroundColor: '#D32F2F20', borderColor: '#D32F2F' }]}>
              <Text style={{ color: '#D32F2F', fontWeight: '600', fontSize: 11 }}>{preview.entries.filter(e => e.status === 'error').length} err</Text>
            </Text>
          </View>
        </TouchableOpacity>

        {expandedSections.entries && preview.entries.length > 0 && (
          <FlatList
            data={preview.entries}
            keyExtractor={(item, index) => `entry-${item.rowNumber}`}
            renderItem={({ item, index }) => renderRow(item, index, 'entry')}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptySection}>
                <Text style={[styles.emptyText, { color: subTextColor }]}>No entries in CSV</Text>
              </View>
            }
          />
        )}
      </View>

      {/* Definitions Section */}
      <View style={[styles.section, { backgroundColor: cardBg, borderColor, marginTop: 16 }]}>
        <TouchableOpacity onPress={() => onToggleSection('definitions')} style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={[styles.sectionIcon, { color: primaryColor }]}>
              {expandedSections.definitions ? '▼' : '▶'}
            </Text>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Definitions</Text>
          </View>
          <View style={styles.sectionStats}>
            <Text style={[styles.statBadge, { backgroundColor: '#4CAF5020', borderColor: '#4CAF50' }]}>
              <Text style={{ color: '#4CAF50', fontWeight: '600', fontSize: 11 }}>{preview.definitions.filter(d => d.status === 'valid').length} valid</Text>
            </Text>
            <Text style={[styles.statBadge, { backgroundColor: '#FF980020', borderColor: '#FF9800' }]}>
              <Text style={{ color: '#FF9800', fontWeight: '600', fontSize: 11 }}>{preview.definitions.filter(d => d.status === 'duplicate').length} dup</Text>
            </Text>
            <Text style={[styles.statBadge, { backgroundColor: '#D32F2F20', borderColor: '#D32F2F' }]}>
              <Text style={{ color: '#D32F2F', fontWeight: '600', fontSize: 11 }}>{preview.definitions.filter(d => d.status === 'error').length} err</Text>
            </Text>
          </View>
        </TouchableOpacity>

        {expandedSections.definitions && preview.definitions.length > 0 && (
          <FlatList
            data={preview.definitions}
            keyExtractor={(item, index) => `def-${item.rowNumber}`}
            renderItem={({ item, index }) => renderRow(item, index, 'definition')}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <View style={styles.emptySection}>
                <Text style={[styles.emptyText, { color: subTextColor }]}>No definitions in CSV</Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for bottom button
  },
  section: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionStats: {
    flexDirection: 'row',
    gap: 6,
  },
  statBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  rowText: {
    flex: 1,
  },
  rowMain: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 2,
  },
  rowDetail: {
    fontSize: 12,
  },
  rowRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 8,
    marginLeft: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  choiceButtons: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  choiceButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  choiceButtonActive: {
    backgroundColor: '#208AEF20',
  },
  choiceButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
  emptySection: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});