import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { useColorScheme } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { parseCsv, generateImportPreview, ImportPreview, ImportPreviewEntry, ImportPreviewDefinition } from '@/csv/import';
import { getAllEntries, getAllDefinitionsForExport, bulkCreateEntries, bulkCreateDefinitions } from '@/db/repository';
import { exportDefinitionsToCsv, exportEntriesToCsv, generateExportCsv, createExportData } from '@/csv/export';
import { ImportPreviewCard } from '@/components/ImportPreviewCard';

export default function ImportPreviewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: 'import' | 'export' }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState({ entries: true, definitions: true });
  const [mode, setMode] = useState<'import' | 'export'>(() => {
    if (params.mode === 'export') return 'export';
    return 'import';
  });

  useEffect(() => {
    if (params.mode === 'export') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('export');
    } else if (params.mode === 'import') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('import');
    }
  }, [params.mode]);

  // Handle import flow - processImport defined first
  const processImport = async (content: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Parse CSV
      const parsed = parseCsv(content);
      
      // Get existing data for duplicate detection
      const [entriesResult, definitionsResult] = await Promise.all([
        getAllEntries(),
        getAllDefinitionsForExport(),
      ]);
      
      if (!entriesResult.success) throw new Error(entriesResult.error);
      if (!definitionsResult.success) throw new Error(definitionsResult.error);
      
      // Generate preview
      const previewData = generateImportPreview(
        parsed,
        entriesResult.data,
        definitionsResult.data
      );
      
      setPreview(previewData);
      setMode('import');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Handle import flow
  const handlePickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'text/csv',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) return;
      
      const fileUri = result.assets[0].uri;
      setPickedFile(fileUri);
      
      // Read file content using new API
      const file = new (FileSystem as any).File(fileUri);
      const buffer = await file.arrayBuffer();
      const decoder = new TextDecoder('utf-8');
      const content = decoder.decode(buffer);
      
      await processImport(content);
    } catch (err) {
      setError(String(err));
    }
  }, [processImport]);

  const handleChoiceChange = useCallback((
    type: 'entry' | 'definition', 
    rowNumber: number, 
    choice: 'skip' | 'overwrite' | 'add-new'
  ) => {
    setPreview(prev => {
      if (!prev) return prev;
      
      if (type === 'entry') {
        return {
          ...prev,
          entries: prev.entries.map(e => 
            e.rowNumber === rowNumber ? { ...e, userChoice: choice } : e
          ),
        };
      } else {
        return {
          ...prev,
          definitions: prev.definitions.map(d => 
            d.rowNumber === rowNumber ? { ...d, userChoice: choice } : d
          ),
        };
      }
    });
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!preview) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Process entries
      const validEntries = preview.entries
        .filter(e => e.status === 'valid' || (e.status === 'duplicate' && e.userChoice === 'overwrite') || (e.status === 'duplicate' && e.userChoice === 'add-new'))
        .map(e => e.data);
      
      if (validEntries.length > 0) {
        const entriesResult = await bulkCreateEntries(validEntries);
        if (!entriesResult.success) throw new Error(entriesResult.error);
      }
      
      // Process definitions
      const validDefinitions = preview.definitions
        .filter(d => d.status === 'valid' || (d.status === 'duplicate' && d.userChoice === 'overwrite'))
        .map(d => d.data);
      
      if (validDefinitions.length > 0) {
        const definitionsResult = await bulkCreateDefinitions(validDefinitions);
        if (!definitionsResult.success) throw new Error(definitionsResult.error);
      }
      
      Alert.alert('Success', `Imported ${validEntries.length} entries and ${validDefinitions.length} definitions`);
      setPreview(null);
      setMode('import');
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [preview]);

  const handleExport = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [entriesResult, definitionsResult] = await Promise.all([
        getAllEntries(),
        getAllDefinitionsForExport(),
      ]);
      
      if (!entriesResult.success) throw new Error(entriesResult.error);
      if (!definitionsResult.success) throw new Error(definitionsResult.error);
      
      const exportData = createExportData(entriesResult.data, definitionsResult.data);
      const csvContent = generateExportCsv(exportData);
      
      // Save to file and share using new FileSystem API
      const filename = `alcotracker-export-${new Date().toISOString().split('T')[0]}.csv`;
      const directory = new (FileSystem as any).Directory((FileSystem as any).Paths.document);
      const file = directory.createFile(filename, 'text/csv');
      
      // Write CSV content using writableStream
      const encoder = new TextEncoder();
      const writer = file.writableStream().getWriter();
      await writer.write(encoder.encode(csvContent));
      await writer.close();
      
      // Get the file URI for sharing
      const fileUri = file.uri;
      
      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export AlcoTracker Data',
      });
      
      Alert.alert('Export Complete', 'Your data has been exported successfully');
    } catch (err) {
      setError(String(err));
      Alert.alert('Export Failed', String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleSection = (section: 'entries' | 'definitions') => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading && !preview) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
        <ActivityIndicator size="large" color="#208AEF" />
        <Text style={[styles.loadingText, { color: isDark ? '#9E9E9E' : '#757575' }, { marginTop: 16 }]}>
          {mode === 'import' ? 'Processing CSV...' : 'Preparing export...'}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#212121' }]}>
          {mode === 'import' ? 'Import Preview' : 'Export Data'}
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: '#D32F2F20' }]}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)} style={styles.errorDismiss}>
            <Text style={styles.errorDismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
      >
        {mode === 'import' ? (
          <>
            {!pickedFile && !preview && (
              <View style={[styles.actionCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
                <Text style={[styles.actionTitle, { color: isDark ? '#FFFFFF' : '#212121' }]}>Import CSV Data</Text>
                <Text style={[styles.actionDesc, { color: isDark ? '#BDBDBD' : '#757575' }, { marginBottom: 16 }]}>
                  Select a CSV file to preview and import your drink data and definitions.
                </Text>
                <TouchableOpacity onPress={handlePickFile} style={[styles.primaryButton, { backgroundColor: '#208AEF' }]}>
                  <Text style={styles.primaryButtonText}>Choose CSV File</Text>
                </TouchableOpacity>
              </View>
            )}

            {preview && (
              <ImportPreviewCard
                preview={preview}
                onChoiceChange={handleChoiceChange}
                onToggleSection={toggleSection}
                expandedSections={expandedSections}
              />
            )}

            {preview && (
              <View style={[styles.bottomAction, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
                <TouchableOpacity onPress={handleConfirmImport} disabled={loading} style={[styles.primaryButton, { backgroundColor: '#4CAF50' }]}>
                  <Text style={styles.primaryButtonText}>
                    {loading ? 'Importing...' : 'Confirm Import'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        ) : (
          <View style={[styles.actionCard, { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF' }]}>
            <Text style={[styles.actionTitle, { color: isDark ? '#FFFFFF' : '#212121' }]}>Export All Data</Text>
            <Text style={[styles.actionDesc, { color: isDark ? '#BDBDBD' : '#757575' }, { marginBottom: 16 }]}>
              Export all drink entries and definitions to a CSV file via Android share sheet.
            </Text>
            <TouchableOpacity onPress={handleExport} disabled={loading} style={[styles.primaryButton, { backgroundColor: '#208AEF' }]}>
              <Text style={styles.primaryButtonText}>
                {loading ? 'Exporting...' : 'Export CSV'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#208AEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  actionCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E0E0E0',
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  actionDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    margin: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D32F2F',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  errorDismissText: {
    color: '#D32F2F',
    fontWeight: '600',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E0E0E0',
  },
});