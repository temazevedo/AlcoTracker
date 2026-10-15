/**
 * CSV Import Tests
 */

import { 
  parseCsv, 
  validateDefinitionRow, 
  validateEntryRow,
  rowToDefinitionInput,
  rowToEntryInput,
  detectEntryDuplicates,
  detectDefinitionDuplicates,
  generateImportPreview,
} from './import';
import { DrinkEntryRow, DrinkDefinitionRow } from '@/db/schema';
import { CreateEntryInput, CreateDefinitionInput } from '@/db/repository';

describe('parseCsv', () => {
  test('parses definitions and entries sections', () => {
    const csv = `# ALCO_TRACKER_EXPORT
# version: 1

# DRINK_DEFINITIONS
id,name,volume_ml,abv,is_favorite,is_archived,created_at
1,Small beer,330,5.0,1,0,2026-01-15T10:00:00.000Z

# DRINK_ENTRIES
id,definition_id,name_snapshot,volume_ml,abv,grams,consumed_at,session_id,note,created_at
1,1,Small beer,330,5.0,12.95,2026-10-14T20:00:00.000Z,1,,2026-10-14T20:01:00.000Z
`;

    const result = parseCsv(csv);
    
    expect(result.definitions).toHaveLength(1);
    expect(result.entries).toHaveLength(1);
    expect(result.definitions[0].data.name).toBe('Small beer');
    expect(result.entries[0].data.name_snapshot).toBe('Small beer');
  });

  test('handles quoted fields with commas', () => {
    const csv = `# DRINK_DEFINITIONS
id,name,volume_ml,abv,is_favorite,is_archived,created_at
1,"Beer, Lager",330,5.0,1,0,2026-01-15T10:00:00.000Z
`;
    
    const result = parseCsv(csv);
    expect(result.definitions[0].data.name).toBe('Beer, Lager');
  });

  test('handles empty lines and comments', () => {
    const csv = `
# ALCO_TRACKER_EXPORT

# DRINK_DEFINITIONS
id,name,volume_ml,abv,is_favorite,is_archived,created_at
1,Test,330,5.0,0,0,2026-01-15T10:00:00.000Z
`;
    
    const result = parseCsv(csv);
    expect(result.definitions).toHaveLength(1);
  });

  test('ignores PROFILE_SETTINGS section', () => {
    const csv = `# DRINK_DEFINITIONS
id,name,volume_ml,abv,is_favorite,is_archived,created_at
1,Test,330,5.0,0,0,2026-01-15T10:00:00.000Z

# PROFILE_SETTINGS
weight_kg,sex,units
70,male,metric
`;
    
    const result = parseCsv(csv);
    expect(result.definitions).toHaveLength(1);
    // PROFILE_SETTINGS rows should be ignored (section unknown)
  });
});

describe('validateDefinitionRow', () => {
  const validRow = {
    rowNumber: 1,
    data: {
      name: 'Test Beer',
      volume_ml: '330',
      abv: '5.0',
      is_favorite: '0',
      is_archived: '0',
      created_at: '2026-01-15T10:00:00.000Z',
    },
    section: 'definitions' as const,
  };

  test('validates correct row', () => {
    const result = validateDefinitionRow(validRow);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects missing name', () => {
    const row = { ...validRow, data: { ...validRow.data, name: '' } };
    const result = validateDefinitionRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Name is required');
  });

  test('rejects invalid volume', () => {
    const row = { ...validRow, data: { ...validRow.data, volume_ml: 'abc' } };
    const result = validateDefinitionRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Volume (ml) is required and must be a number');
  });

  test('rejects zero volume', () => {
    const row = { ...validRow, data: { ...validRow.data, volume_ml: '0' } };
    const result = validateDefinitionRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Volume must be positive');
  });

  test('rejects invalid ABV', () => {
    const row = { ...validRow, data: { ...validRow.data, abv: '150' } };
    const result = validateDefinitionRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('ABV must be between 0 and 100');
  });

  test('handles boolean is_favorite', () => {
    const row = { ...validRow, data: { ...validRow.data, is_favorite: 'true' } };
    const result = validateDefinitionRow(row);
    expect(result.isValid).toBe(true);
  });
});

describe('validateEntryRow', () => {
  const validRow = {
    rowNumber: 1,
    data: {
      name_snapshot: 'Test Beer',
      volume_ml: '330',
      abv: '5.0',
      grams: '12.95',
      consumed_at: '2026-10-14T20:00:00.000Z',
      definition_id: '1',
      session_id: '1',
      note: 'Test note',
      created_at: '2026-10-14T20:01:00.000Z',
    },
    section: 'entries' as const,
  };

  test('validates correct row', () => {
    const result = validateEntryRow(validRow);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('rejects missing name', () => {
    const row = { ...validRow, data: { ...validRow.data, name_snapshot: '' } };
    const result = validateEntryRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Drink name (name_snapshot) is required');
  });

  test('rejects invalid consumed_at', () => {
    const row = { ...validRow, data: { ...validRow.data, consumed_at: 'invalid-date' } };
    const result = validateEntryRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Consumed date (consumed_at) is required and must be valid ISO8601');
  });

  test('rejects negative grams', () => {
    const row = { ...validRow, data: { ...validRow.data, grams: '-5' } };
    const result = validateEntryRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Grams must be non-negative');
  });

  test('handles optional definition_id', () => {
    const row = { ...validRow, data: { ...validRow.data, definition_id: '' } };
    const result = validateEntryRow(row);
    expect(result.isValid).toBe(true);
  });

  test('rejects invalid definition_id', () => {
    const row = { ...validRow, data: { ...validRow.data, definition_id: 'abc' } };
    const result = validateEntryRow(row);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Definition ID must be a number if provided');
  });
});

describe('rowToDefinitionInput', () => {
  test('converts row to CreateDefinitionInput', () => {
    const row = {
      rowNumber: 1,
      data: {
        name: 'Test Beer',
        volume_ml: '330',
        abv: '5.0',
        is_favorite: '1',
        is_archived: '0',
      },
      section: 'definitions' as const,
    };

    const input = rowToDefinitionInput(row);

    expect(input).toEqual({
      name: 'Test Beer',
      volume_ml: 330,
      abv: 5.0,
      is_favorite: true,
      is_archived: false,
    });
  });

  test('handles false boolean strings', () => {
    const row = {
      rowNumber: 1,
      data: {
        name: 'Test',
        volume_ml: '330',
        abv: '5.0',
        is_favorite: '0',
        is_archived: '0',
      },
      section: 'definitions' as const,
    };

    const input = rowToDefinitionInput(row);
    expect(input.is_favorite).toBe(false);
    expect(input.is_archived).toBe(false);
  });
});

describe('rowToEntryInput', () => {
  test('converts row to CreateEntryInput', () => {
    const row = {
      rowNumber: 1,
      data: {
        name_snapshot: 'Test Beer',
        volume_ml: '330',
        abv: '5.0',
        grams: '12.95',
        consumed_at: '2026-10-14T20:00:00.000Z',
        definition_id: '1',
        session_id: '1',
        note: 'Test note',
      },
      section: 'entries' as const,
    };

    const input = rowToEntryInput(row);

    expect(input).toEqual({
      definition_id: 1,
      name_snapshot: 'Test Beer',
      volume_ml: 330,
      abv: 5.0,
      grams: 12.95,
      consumed_at: '2026-10-14T20:00:00.000Z',
      session_id: 1,
      note: 'Test note',
    });
  });

  test('handles missing optional fields', () => {
    const row = {
      rowNumber: 1,
      data: {
        name_snapshot: 'Test',
        volume_ml: '330',
        abv: '5.0',
        grams: '12.95',
        consumed_at: '2026-10-14T20:00:00.000Z',
        definition_id: '',
        session_id: '',
        note: '',
      },
      section: 'entries' as const,
    };

    const input = rowToEntryInput(row);
    expect(input.definition_id).toBeNull();
    expect(input.session_id).toBeNull();
    expect(input.note).toBeNull();
  });
});

describe('detectEntryDuplicates', () => {
  const existingEntries: DrinkEntryRow[] = [
    {
      id: 1,
      definition_id: 1,
      name_snapshot: 'Beer',
      volume_ml: 330,
      abv: 5.0,
      grams: 12.95,
      consumed_at: '2026-10-14T20:00:00.000Z',
      session_id: 1,
      note: null,
      created_at: '2026-10-14T20:01:00.000Z',
    },
  ];

  test('detects exact duplicate', () => {
    const entries: CreateEntryInput[] = [
      {
        definition_id: 1,
        name_snapshot: 'Beer',
        volume_ml: 330,
        abv: 5.0,
        grams: 12.95,
        consumed_at: '2026-10-14T20:00:00.000Z',
        session_id: 1,
        note: null,
      },
    ];

    const duplicates = detectEntryDuplicates(entries, existingEntries);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].matchType).toBe('exact');
  });

  test('detects fuzzy duplicate (same time, same name)', () => {
    const entries: CreateEntryInput[] = [
      {
        definition_id: 1,
        name_snapshot: 'Beer',
        volume_ml: 500,
        abv: 5.0,
        grams: 19.7,
        consumed_at: '2026-10-14T20:03:00.000Z', // 3 min later
        session_id: 1,
        note: null,
      },
    ];

    const duplicates = detectEntryDuplicates(entries, existingEntries);
    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].matchType).toBe('fuzzy');
  });

  test('does not flag different drink at same time', () => {
    const entries: CreateEntryInput[] = [
      {
        definition_id: 1,
        name_snapshot: 'Wine',
        volume_ml: 150,
        abv: 12.0,
        grams: 14.1,
        consumed_at: '2026-10-14T20:00:00.000Z',
        session_id: 1,
        note: null,
      },
    ];

    const duplicates = detectEntryDuplicates(entries, existingEntries);
    expect(duplicates).toHaveLength(0);
  });

  test('does not flag same drink at very different time', () => {
    const entries: CreateEntryInput[] = [
      {
        definition_id: 1,
        name_snapshot: 'Beer',
        volume_ml: 330,
        abv: 5.0,
        grams: 12.95,
        consumed_at: '2026-10-14T22:00:00.000Z', // 2 hours later
        session_id: 1,
        note: null,
      },
    ];

    const duplicates = detectEntryDuplicates(entries, existingEntries);
    expect(duplicates).toHaveLength(0);
  });
});

describe('detectDefinitionDuplicates', () => {
  const existingDefinitions: DrinkDefinitionRow[] = [
    {
      id: 1,
      name: 'Small Beer',
      volume_ml: 330,
      abv: 5.0,
      is_favorite: 1,
      is_archived: 0,
      created_at: '2026-01-15T10:00:00.000Z',
    },
  ];

  test('detects duplicate definition', () => {
    const definitions: CreateDefinitionInput[] = [
      { name: 'Small Beer', volume_ml: 330, abv: 5.0, is_favorite: false, is_archived: false },
    ];

    const duplicates = detectDefinitionDuplicates(definitions, existingDefinitions);
    expect(duplicates).toHaveLength(1);
  });

  test('does not flag different volume/abv', () => {
    const definitions: CreateDefinitionInput[] = [
      { name: 'Small Beer', volume_ml: 500, abv: 5.0, is_favorite: false, is_archived: false },
    ];

    const duplicates = detectDefinitionDuplicates(definitions, existingDefinitions);
    expect(duplicates).toHaveLength(0);
  });
});

describe('generateImportPreview', () => {
  const existingEntries: DrinkEntryRow[] = [
    {
      id: 1,
      definition_id: 1,
      name_snapshot: 'Beer',
      volume_ml: 330,
      abv: 5.0,
      grams: 12.95,
      consumed_at: '2026-10-14T20:00:00.000Z',
      session_id: 1,
      note: null,
      created_at: '2026-10-14T20:01:00.000Z',
    },
  ];

  const existingDefinitions: DrinkDefinitionRow[] = [
    {
      id: 1,
      name: 'Small Beer',
      volume_ml: 330,
      abv: 5.0,
      is_favorite: 1,
      is_archived: 0,
      created_at: '2026-01-15T10:00:00.000Z',
    },
  ];

  test('generates preview with correct counts', () => {
    const parsed = {
      definitions: [
        {
          rowNumber: 1,
          data: { name: 'New Beer', volume_ml: '330', abv: '5.0', is_favorite: '0', is_archived: '0', created_at: '2026-01-15T10:00:00.000Z' },
          section: 'definitions' as const,
        },
        {
          rowNumber: 2,
          data: { name: 'Small Beer', volume_ml: '330', abv: '5.0', is_favorite: '0', is_archived: '0', created_at: '2026-01-15T10:00:00.000Z' },
          section: 'definitions' as const,
        },
      ],
      entries: [
        {
          rowNumber: 3,
          data: { name_snapshot: 'Wine', volume_ml: '150', abv: '12.0', grams: '14.1', consumed_at: '2026-10-14T20:00:00.000Z', definition_id: '', session_id: '', note: '', created_at: '2026-10-14T20:01:00.000Z' },
          section: 'entries' as const,
        },
        {
          rowNumber: 4,
          data: { name_snapshot: 'Beer', volume_ml: '330', abv: '5.0', grams: '12.95', consumed_at: '2026-10-14T20:00:00.000Z', definition_id: '', session_id: '', note: '', created_at: '2026-10-14T20:01:00.000Z' },
          section: 'entries' as const,
        },
      ],
      errors: [],
    };

    const preview = generateImportPreview(parsed, existingEntries, existingDefinitions);

    expect(preview.validDefinitions).toBe(1);
    expect(preview.duplicateDefinitions).toBe(1);
    expect(preview.validEntries).toBe(1);
    expect(preview.duplicateEntries).toBe(1);
    expect(preview.errorDefinitions).toBe(0);
    expect(preview.errorEntries).toBe(0);
  });

  test('marks invalid rows as errors', () => {
    const parsed = {
      definitions: [
        {
          rowNumber: 1,
          data: { name: '', volume_ml: '330', abv: '5.0', is_favorite: '0', is_archived: '0', created_at: '' },
          section: 'definitions' as const,
        },
      ],
      entries: [],
      errors: [],
    };

    const preview = generateImportPreview(parsed, [], []);

    expect(preview.errorDefinitions).toBe(1);
    expect(preview.definitions[0].status).toBe('error');
    expect(preview.definitions[0].errorMessage).toContain('Name is required');
  });
});