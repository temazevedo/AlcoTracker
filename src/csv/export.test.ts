/**
 * CSV Export Tests
 */

import { 
  generateExportCsv, 
  exportDefinitionsToCsv, 
  exportEntriesToCsv,
  createExportData,
  escapeCsvField 
} from './export';
import { DrinkEntryRow, DrinkDefinitionRow } from '@/db/schema';

describe('escapeCsvField', () => {
  test('escapes commas', () => {
    expect(escapeCsvField('hello, world')).toBe('"hello, world"');
  });

  test('escapes double quotes', () => {
    expect(escapeCsvField('he said "hello"')).toBe('"he said ""hello"""');
  });

  test('escapes newlines', () => {
    expect(escapeCsvField('line1\nline2')).toBe('"line1\nline2"');
  });

  test('returns empty string for null/undefined', () => {
    expect(escapeCsvField(null)).toBe('');
    expect(escapeCsvField(undefined)).toBe('');
  });

  test('passes through simple values', () => {
    expect(escapeCsvField('simple')).toBe('simple');
    expect(escapeCsvField(123)).toBe('123');
    expect(escapeCsvField(45.67)).toBe('45.67');
  });
});

describe('exportDefinitionsToCsv', () => {
  const mockDefinitions: DrinkDefinitionRow[] = [
    {
      id: 1,
      name: 'Small beer',
      volume_ml: 330,
      abv: 5.0,
      is_favorite: 1,
      is_archived: 0,
      created_at: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 2,
      name: 'Glass of wine',
      volume_ml: 150,
      abv: 12.5,
      is_favorite: 0,
      is_archived: 0,
      created_at: '2026-01-15T10:00:00.000Z',
    },
  ];

  test('generates correct header', () => {
    const csv = exportDefinitionsToCsv(mockDefinitions);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id,name,volume_ml,abv,is_favorite,is_archived,created_at');
  });

  test('generates correct data rows', () => {
    const csv = exportDefinitionsToCsv(mockDefinitions);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('1,Small beer,330,5,1,0,2026-01-15T10:00:00.000Z');
    expect(lines[2]).toBe('2,Glass of wine,150,12.5,0,0,2026-01-15T10:00:00.000Z');
  });

  test('handles empty array', () => {
    const csv = exportDefinitionsToCsv([]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id,name,volume_ml,abv,is_favorite,is_archived,created_at');
    expect(lines.length).toBe(1);
  });

  test('escapes commas in name', () => {
    const defs: DrinkDefinitionRow[] = [{
      id: 1,
      name: 'Beer, Lager',
      volume_ml: 330,
      abv: 5.0,
      is_favorite: 0,
      is_archived: 0,
      created_at: '2026-01-15T10:00:00.000Z',
    }];
    const csv = exportDefinitionsToCsv(defs);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('1,"Beer, Lager",330,5,0,0,2026-01-15T10:00:00.000Z');
  });
});

describe('exportEntriesToCsv', () => {
  const mockEntries: DrinkEntryRow[] = [
    {
      id: 1,
      definition_id: 1,
      name_snapshot: 'Small beer',
      volume_ml: 330,
      abv: 5.0,
      grams: 12.95,
      consumed_at: '2026-10-14T20:00:00.000Z',
      session_id: 5,
      note: null,
      created_at: '2026-10-14T20:01:00.000Z',
    },
    {
      id: 2,
      definition_id: null,
      name_snapshot: 'Custom drink',
      volume_ml: 500,
      abv: 4.5,
      grams: 17.75,
      consumed_at: '2026-10-14T21:30:00.000Z',
      session_id: null,
      note: 'Tasty',
      created_at: '2026-10-14T21:31:00.000Z',
    },
  ];

  test('generates correct header', () => {
    const csv = exportEntriesToCsv(mockEntries);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id,definition_id,name_snapshot,volume_ml,abv,grams,consumed_at,session_id,note,created_at');
  });

  test('generates correct data rows', () => {
    const csv = exportEntriesToCsv(mockEntries);
    const lines = csv.split('\n');
    expect(lines[1]).toBe('1,1,Small beer,330,5,12.95,2026-10-14T20:00:00.000Z,5,,2026-10-14T20:01:00.000Z');
    expect(lines[2]).toBe('2,,Custom drink,500,4.5,17.75,2026-10-14T21:30:00.000Z,,Tasty,2026-10-14T21:31:00.000Z');
  });

  test('handles null note correctly', () => {
    const entries: DrinkEntryRow[] = [{
      id: 1,
      definition_id: 1,
      name_snapshot: 'Test',
      volume_ml: 330,
      abv: 5.0,
      grams: 12.95,
      consumed_at: '2026-10-14T20:00:00.000Z',
      session_id: null,
      note: null,
      created_at: '2026-10-14T20:01:00.000Z',
    }];
    const csv = exportEntriesToCsv(entries);
    const lines = csv.split('\n');
    // Note field should be empty (not "null" string)
    expect(lines[1]).toContain(',,2026-10-14T20:01:00.000Z');
  });
});

describe('generateExportCsv', () => {
  test('generates complete export with metadata', () => {
    const entries: DrinkEntryRow[] = [];
    const definitions: DrinkDefinitionRow[] = [];
    
    const data = {
      entries,
      definitions,
      exportedAt: '2026-10-15T10:30:00.000Z',
      version: 1,
    };
    
    const csv = generateExportCsv(data);
    const lines = csv.split('\n');
    
    expect(lines[0]).toBe('# ALCO_TRACKER_EXPORT');
    expect(lines[1]).toBe('# version: 1');
    expect(lines[2]).toBe('# exported_at: 2026-10-15T10:30:00.000Z');
    expect(lines[3]).toBe('');
    expect(lines[4]).toBe('# DRINK_DEFINITIONS');
    expect(lines[5]).toBe('id,name,volume_ml,abv,is_favorite,is_archived,created_at');
    expect(lines[6]).toBe('');
    expect(lines[7]).toBe('# DRINK_ENTRIES');
  });

  test('includes definitions and entries', () => {
    const definitions: DrinkDefinitionRow[] = [{
      id: 1,
      name: 'Test beer',
      volume_ml: 330,
      abv: 5.0,
      is_favorite: 1,
      is_archived: 0,
      created_at: '2026-01-15T10:00:00.000Z',
    }];
    
    const entries: DrinkEntryRow[] = [{
      id: 1,
      definition_id: 1,
      name_snapshot: 'Test beer',
      volume_ml: 330,
      abv: 5.0,
      grams: 12.95,
      consumed_at: '2026-10-14T20:00:00.000Z',
      session_id: 1,
      note: 'Test',
      created_at: '2026-10-14T20:01:00.000Z',
    }];
    
    const csv = generateExportCsv({
      entries,
      definitions,
      exportedAt: '2026-10-15T10:30:00.000Z',
      version: 1,
    });
    
    expect(csv).toContain('Test beer');
    expect(csv).toContain('# DRINK_DEFINITIONS');
    expect(csv).toContain('# DRINK_ENTRIES');
  });
});

describe('createExportData', () => {
  test('creates export data structure', () => {
    const entries: DrinkEntryRow[] = [];
    const definitions: DrinkDefinitionRow[] = [];
    
    const data = createExportData(entries, definitions);
    
    expect(data.entries).toEqual([]);
    expect(data.definitions).toEqual([]);
    expect(data.version).toBe(1);
    expect(data.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});