import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timesheetsTable } from '../db/schema';
import { type GetTimesheetByIdInput, type CreateTimesheetInput } from '../schema';
import { getTimesheetById } from '../handlers/get_timesheet_by_id';

// Test input for creating a timesheet
const testTimesheetInput: CreateTimesheetInput = {
  nama: 'John Doe',
  waktu_mulai: new Date('2024-01-15T09:00:00Z'),
  waktu_selesai: new Date('2024-01-15T17:00:00Z'),
  kategori: 'Development & Testing',
  no_tiket_aktivitas: 'TICKET-123',
  jumlah_line_item: 5
};

describe('getTimesheetById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return timesheet when found by ID', async () => {
    // Create a test timesheet first
    const durasi = Math.floor((testTimesheetInput.waktu_selesai.getTime() - testTimesheetInput.waktu_mulai.getTime()) / 1000);
    
    const insertResult = await db.insert(timesheetsTable)
      .values({
        nama: testTimesheetInput.nama,
        waktu_mulai: testTimesheetInput.waktu_mulai,
        waktu_selesai: testTimesheetInput.waktu_selesai,
        kategori: testTimesheetInput.kategori,
        no_tiket_aktivitas: testTimesheetInput.no_tiket_aktivitas,
        jumlah_line_item: testTimesheetInput.jumlah_line_item,
        durasi: durasi
      })
      .returning()
      .execute();

    const createdTimesheet = insertResult[0];

    // Test the handler
    const input: GetTimesheetByIdInput = { id: createdTimesheet.id };
    const result = await getTimesheetById(input);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toBe(createdTimesheet.id);
    expect(result!.nama).toBe('John Doe');
    expect(result!.kategori).toBe('Development & Testing');
    expect(result!.no_tiket_aktivitas).toBe('TICKET-123');
    expect(result!.jumlah_line_item).toBe(5);
    expect(result!.durasi).toBe(durasi);
    expect(result!.waktu_mulai).toEqual(testTimesheetInput.waktu_mulai);
    expect(result!.waktu_selesai).toEqual(testTimesheetInput.waktu_selesai);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null when timesheet not found', async () => {
    const input: GetTimesheetByIdInput = { id: 999 };
    const result = await getTimesheetById(input);

    expect(result).toBeNull();
  });

  it('should handle timesheet with null no_tiket_aktivitas', async () => {
    // Create timesheet with null ticket number
    const timesheetWithNullTicket: CreateTimesheetInput = {
      ...testTimesheetInput,
      no_tiket_aktivitas: null
    };

    const durasi = Math.floor((timesheetWithNullTicket.waktu_selesai.getTime() - timesheetWithNullTicket.waktu_mulai.getTime()) / 1000);

    const insertResult = await db.insert(timesheetsTable)
      .values({
        nama: timesheetWithNullTicket.nama,
        waktu_mulai: timesheetWithNullTicket.waktu_mulai,
        waktu_selesai: timesheetWithNullTicket.waktu_selesai,
        kategori: timesheetWithNullTicket.kategori,
        no_tiket_aktivitas: timesheetWithNullTicket.no_tiket_aktivitas,
        jumlah_line_item: timesheetWithNullTicket.jumlah_line_item,
        durasi: durasi
      })
      .returning()
      .execute();

    const createdTimesheet = insertResult[0];

    // Test the handler
    const input: GetTimesheetByIdInput = { id: createdTimesheet.id };
    const result = await getTimesheetById(input);

    expect(result).not.toBeNull();
    expect(result!.no_tiket_aktivitas).toBeNull();
    expect(result!.nama).toBe(timesheetWithNullTicket.nama);
    expect(result!.kategori).toBe(timesheetWithNullTicket.kategori);
  });

  it('should return timesheet with different categories', async () => {
    const categories = ['Ticket', 'Meeting', 'Other'] as const;
    const createdTimesheets = [];

    // Create timesheets with different categories
    for (const kategori of categories) {
      const timesheetInput = {
        ...testTimesheetInput,
        kategori,
        nama: `User for ${kategori}`
      };

      const durasi = Math.floor((timesheetInput.waktu_selesai.getTime() - timesheetInput.waktu_mulai.getTime()) / 1000);

      const insertResult = await db.insert(timesheetsTable)
        .values({
          nama: timesheetInput.nama,
          waktu_mulai: timesheetInput.waktu_mulai,
          waktu_selesai: timesheetInput.waktu_selesai,
          kategori: timesheetInput.kategori,
          no_tiket_aktivitas: timesheetInput.no_tiket_aktivitas,
          jumlah_line_item: timesheetInput.jumlah_line_item,
          durasi: durasi
        })
        .returning()
        .execute();

      createdTimesheets.push(insertResult[0]);
    }

    // Test each created timesheet
    for (let i = 0; i < createdTimesheets.length; i++) {
      const timesheet = createdTimesheets[i];
      const input: GetTimesheetByIdInput = { id: timesheet.id };
      const result = await getTimesheetById(input);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(timesheet.id);
      expect(result!.kategori).toBe(categories[i]);
      expect(result!.nama).toBe(`User for ${categories[i]}`);
    }
  });

  it('should return timesheet with correct timestamp handling', async () => {
    // Create timesheet with specific timestamps
    const startTime = new Date('2024-03-15T08:30:00Z');
    const endTime = new Date('2024-03-15T16:45:00Z');
    
    const timesheetInput = {
      ...testTimesheetInput,
      waktu_mulai: startTime,
      waktu_selesai: endTime
    };

    const durasi = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const insertResult = await db.insert(timesheetsTable)
      .values({
        nama: timesheetInput.nama,
        waktu_mulai: timesheetInput.waktu_mulai,
        waktu_selesai: timesheetInput.waktu_selesai,
        kategori: timesheetInput.kategori,
        no_tiket_aktivitas: timesheetInput.no_tiket_aktivitas,
        jumlah_line_item: timesheetInput.jumlah_line_item,
        durasi: durasi
      })
      .returning()
      .execute();

    const createdTimesheet = insertResult[0];

    // Test the handler
    const input: GetTimesheetByIdInput = { id: createdTimesheet.id };
    const result = await getTimesheetById(input);

    expect(result).not.toBeNull();
    expect(result!.waktu_mulai).toEqual(startTime);
    expect(result!.waktu_selesai).toEqual(endTime);
    expect(result!.durasi).toBe(durasi);
    
    // Verify duration calculation is correct (8 hours 15 minutes = 29700 seconds)
    expect(result!.durasi).toBe(29700);
  });
});