import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timesheetsTable } from '../db/schema';
import { type CreateTimesheetInput } from '../schema';
import { createTimesheet } from '../handlers/create_timesheet';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateTimesheetInput = {
  nama: 'John Doe',
  waktu_mulai: new Date('2024-01-15T08:00:00.000Z'),
  waktu_selesai: new Date('2024-01-15T12:00:00.000Z'),
  kategori: 'Development & Testing',
  no_tiket_aktivitas: 'TICKET-123',
  jumlah_line_item: 5
};

// Test input with null ticket number
const testInputNullTicket: CreateTimesheetInput = {
  nama: 'Jane Smith',
  waktu_mulai: new Date('2024-01-15T14:00:00.000Z'),
  waktu_selesai: new Date('2024-01-15T16:30:00.000Z'),
  kategori: 'Meeting',
  no_tiket_aktivitas: null,
  jumlah_line_item: 3
};

describe('createTimesheet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a timesheet with all fields', async () => {
    const result = await createTimesheet(testInput);

    // Verify all fields are correctly set
    expect(result.nama).toEqual('John Doe');
    expect(result.waktu_mulai).toEqual(new Date('2024-01-15T08:00:00.000Z'));
    expect(result.waktu_selesai).toEqual(new Date('2024-01-15T12:00:00.000Z'));
    expect(result.kategori).toEqual('Development & Testing');
    expect(result.no_tiket_aktivitas).toEqual('TICKET-123');
    expect(result.jumlah_line_item).toEqual(5);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should calculate duration correctly', async () => {
    const result = await createTimesheet(testInput);
    
    // Duration should be 4 hours = 14400 seconds (12:00 - 08:00)
    const expectedDuration = 4 * 60 * 60; // 4 hours in seconds
    expect(result.durasi).toEqual(expectedDuration);
  });

  it('should handle null ticket number', async () => {
    const result = await createTimesheet(testInputNullTicket);

    expect(result.nama).toEqual('Jane Smith');
    expect(result.no_tiket_aktivitas).toBeNull();
    expect(result.kategori).toEqual('Meeting');
    expect(result.jumlah_line_item).toEqual(3);
  });

  it('should calculate duration for different time ranges', async () => {
    const result = await createTimesheet(testInputNullTicket);
    
    // Duration should be 2.5 hours = 9000 seconds (16:30 - 14:00)
    const expectedDuration = 2.5 * 60 * 60; // 2.5 hours in seconds
    expect(result.durasi).toEqual(expectedDuration);
  });

  it('should save timesheet to database', async () => {
    const result = await createTimesheet(testInput);

    // Query the database to verify the record was saved
    const timesheets = await db.select()
      .from(timesheetsTable)
      .where(eq(timesheetsTable.id, result.id))
      .execute();

    expect(timesheets).toHaveLength(1);
    expect(timesheets[0].nama).toEqual('John Doe');
    expect(timesheets[0].kategori).toEqual('Development & Testing');
    expect(timesheets[0].no_tiket_aktivitas).toEqual('TICKET-123');
    expect(timesheets[0].jumlah_line_item).toEqual(5);
    expect(timesheets[0].durasi).toEqual(14400); // 4 hours in seconds
    expect(timesheets[0].created_at).toBeInstanceOf(Date);
    expect(timesheets[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle all timesheet categories', async () => {
    const categories = [
      'Ticket',
      'Koordinasi & kegiatan pendukung lainnya',
      'Meeting',
      'Adhoc/project',
      'Development & Testing',
      'Other'
    ] as const;

    for (const category of categories) {
      const input: CreateTimesheetInput = {
        nama: `Test User for ${category}`,
        waktu_mulai: new Date('2024-01-15T09:00:00.000Z'),
        waktu_selesai: new Date('2024-01-15T10:00:00.000Z'),
        kategori: category,
        no_tiket_aktivitas: null,
        jumlah_line_item: 1
      };

      const result = await createTimesheet(input);
      expect(result.kategori).toEqual(category);
      expect(result.nama).toEqual(`Test User for ${category}`);
    }
  });

  it('should handle short duration tasks', async () => {
    const shortTaskInput: CreateTimesheetInput = {
      nama: 'Quick Task',
      waktu_mulai: new Date('2024-01-15T10:00:00.000Z'),
      waktu_selesai: new Date('2024-01-15T10:15:00.000Z'), // 15 minutes
      kategori: 'Other',
      no_tiket_aktivitas: 'QUICK-001',
      jumlah_line_item: 1
    };

    const result = await createTimesheet(shortTaskInput);
    
    // Duration should be 15 minutes = 900 seconds
    const expectedDuration = 15 * 60; // 15 minutes in seconds
    expect(result.durasi).toEqual(expectedDuration);
  });

  it('should set created_at and updated_at timestamps', async () => {
    const beforeCreate = new Date();
    const result = await createTimesheet(testInput);
    const afterCreate = new Date();

    // Verify timestamps are within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 1000);
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 1000);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 1000);
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 1000);
  });
});