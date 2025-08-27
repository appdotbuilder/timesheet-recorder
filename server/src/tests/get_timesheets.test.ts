import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timesheetsTable } from '../db/schema';
import { type CreateTimesheetInput, type SearchTimesheetInput } from '../schema';
import { getTimesheets } from '../handlers/get_timesheets';

// Helper function to calculate duration in seconds
const calculateDuration = (start: Date, end: Date): number => {
  return Math.floor((end.getTime() - start.getTime()) / 1000);
};

// Test data setup
const createTestTimesheet = async (overrides: Partial<CreateTimesheetInput> = {}) => {
  const waktu_mulai = new Date('2024-01-15T09:00:00Z');
  const waktu_selesai = new Date('2024-01-15T17:00:00Z');
  
  const defaultData: CreateTimesheetInput = {
    nama: 'John Doe',
    waktu_mulai,
    waktu_selesai,
    kategori: 'Ticket',
    no_tiket_aktivitas: 'TKT-001',
    jumlah_line_item: 5,
    ...overrides
  };

  const durasi = calculateDuration(defaultData.waktu_mulai, defaultData.waktu_selesai);

  const result = await db.insert(timesheetsTable)
    .values({
      nama: defaultData.nama,
      waktu_mulai: defaultData.waktu_mulai,
      waktu_selesai: defaultData.waktu_selesai,
      kategori: defaultData.kategori,
      no_tiket_aktivitas: defaultData.no_tiket_aktivitas,
      jumlah_line_item: defaultData.jumlah_line_item,
      durasi
    })
    .returning()
    .execute();

  return result[0];
};

describe('getTimesheets', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all timesheets when no input provided', async () => {
    // Create test data
    await createTestTimesheet({ nama: 'Alice' });
    await createTestTimesheet({ nama: 'Bob' });
    await createTestTimesheet({ nama: 'Charlie' });

    const result = await getTimesheets();

    expect(result).toHaveLength(3);
    expect(result[0].nama).toBeDefined();
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no timesheets exist', async () => {
    const result = await getTimesheets();
    expect(result).toHaveLength(0);
  });

  it('should search by nama (case-insensitive)', async () => {
    await createTestTimesheet({ nama: 'Alice Smith' });
    await createTestTimesheet({ nama: 'Bob Jones' });
    await createTestTimesheet({ nama: 'Charlie Brown' });

    const input: SearchTimesheetInput = { query: 'alice' };
    const result = await getTimesheets(input);

    expect(result).toHaveLength(1);
    expect(result[0].nama).toBe('Alice Smith');
  });

  it('should search by no_tiket_aktivitas (case-insensitive)', async () => {
    await createTestTimesheet({ no_tiket_aktivitas: 'TKT-001' });
    await createTestTimesheet({ no_tiket_aktivitas: 'TKT-002' });
    await createTestTimesheet({ no_tiket_aktivitas: 'BUG-123' });

    const input: SearchTimesheetInput = { query: 'tkt' };
    const result = await getTimesheets(input);

    expect(result).toHaveLength(2);
    expect(result.some(t => t.no_tiket_aktivitas === 'TKT-001')).toBe(true);
    expect(result.some(t => t.no_tiket_aktivitas === 'TKT-002')).toBe(true);
  });

  it('should search across both nama and no_tiket_aktivitas', async () => {
    await createTestTimesheet({ nama: 'Alice', no_tiket_aktivitas: 'TKT-001' });
    await createTestTimesheet({ nama: 'Bob', no_tiket_aktivitas: 'BUG-123' });
    await createTestTimesheet({ nama: 'Charlie', no_tiket_aktivitas: 'FEAT-456' });

    const input: SearchTimesheetInput = { query: 'bug' };
    const result = await getTimesheets(input);

    expect(result).toHaveLength(1);
    expect(result[0].nama).toBe('Bob');
    expect(result[0].no_tiket_aktivitas).toBe('BUG-123');
  });

  it('should filter by kategori', async () => {
    await createTestTimesheet({ kategori: 'Ticket' });
    await createTestTimesheet({ kategori: 'Meeting' });
    await createTestTimesheet({ kategori: 'Development & Testing' });

    const input: SearchTimesheetInput = { kategori: 'Meeting' };
    const result = await getTimesheets(input);

    expect(result).toHaveLength(1);
    expect(result[0].kategori).toBe('Meeting');
  });

  it('should combine search query and kategori filter', async () => {
    await createTestTimesheet({ nama: 'Alice', kategori: 'Ticket' });
    await createTestTimesheet({ nama: 'Alice', kategori: 'Meeting' });
    await createTestTimesheet({ nama: 'Bob', kategori: 'Ticket' });

    const input: SearchTimesheetInput = { query: 'alice', kategori: 'Ticket' };
    const result = await getTimesheets(input);

    expect(result).toHaveLength(1);
    expect(result[0].nama).toBe('Alice');
    expect(result[0].kategori).toBe('Ticket');
  });

  it('should handle null no_tiket_aktivitas in search', async () => {
    await createTestTimesheet({ nama: 'Alice', no_tiket_aktivitas: null });
    await createTestTimesheet({ nama: 'Bob', no_tiket_aktivitas: 'TKT-001' });

    const input: SearchTimesheetInput = { query: 'alice' };
    const result = await getTimesheets(input);

    expect(result).toHaveLength(1);
    expect(result[0].nama).toBe('Alice');
    expect(result[0].no_tiket_aktivitas).toBeNull();
  });

  it('should return results ordered by created_at descending', async () => {
    // Create timesheets with slight time differences
    const first = await createTestTimesheet({ nama: 'First' });
    
    // Wait a small amount to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const second = await createTestTimesheet({ nama: 'Second' });
    
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const third = await createTestTimesheet({ nama: 'Third' });

    const result = await getTimesheets();

    expect(result).toHaveLength(3);
    // Most recent should be first
    expect(result[0].nama).toBe('Third');
    expect(result[1].nama).toBe('Second');
    expect(result[2].nama).toBe('First');
  });

  it('should return no results when search query matches nothing', async () => {
    await createTestTimesheet({ nama: 'Alice', no_tiket_aktivitas: 'TKT-001' });
    await createTestTimesheet({ nama: 'Bob', no_tiket_aktivitas: 'BUG-123' });

    const input: SearchTimesheetInput = { query: 'nonexistent' };
    const result = await getTimesheets(input);

    expect(result).toHaveLength(0);
  });

  it('should return no results when kategori filter matches nothing', async () => {
    await createTestTimesheet({ kategori: 'Ticket' });
    await createTestTimesheet({ kategori: 'Meeting' });

    const input: SearchTimesheetInput = { kategori: 'Other' };
    const result = await getTimesheets(input);

    expect(result).toHaveLength(0);
  });

  it('should handle partial matches correctly', async () => {
    await createTestTimesheet({ nama: 'Development Team' });
    await createTestTimesheet({ nama: 'Developer John' });
    await createTestTimesheet({ nama: 'QA Tester' });

    const input: SearchTimesheetInput = { query: 'dev' };
    const result = await getTimesheets(input);

    expect(result).toHaveLength(2);
    expect(result.some(t => t.nama === 'Development Team')).toBe(true);
    expect(result.some(t => t.nama === 'Developer John')).toBe(true);
  });
});