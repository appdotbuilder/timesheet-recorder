import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timesheetsTable } from '../db/schema';
import { type DeleteTimesheetInput, type CreateTimesheetInput } from '../schema';
import { deleteTimesheet } from '../handlers/delete_timesheet';
import { eq } from 'drizzle-orm';

// Test input for creating a timesheet to delete
const testTimesheetInput: CreateTimesheetInput = {
  nama: 'Test User',
  waktu_mulai: new Date('2024-01-01T09:00:00Z'),
  waktu_selesai: new Date('2024-01-01T17:00:00Z'),
  kategori: 'Ticket',
  no_tiket_aktivitas: 'TKT-001',
  jumlah_line_item: 5
};

// Helper function to create a test timesheet
const createTestTimesheet = async (): Promise<number> => {
  const startTime = testTimesheetInput.waktu_mulai;
  const endTime = testTimesheetInput.waktu_selesai;
  const durasi = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

  const result = await db.insert(timesheetsTable)
    .values({
      nama: testTimesheetInput.nama,
      waktu_mulai: startTime,
      waktu_selesai: endTime,
      kategori: testTimesheetInput.kategori,
      no_tiket_aktivitas: testTimesheetInput.no_tiket_aktivitas,
      jumlah_line_item: testTimesheetInput.jumlah_line_item,
      durasi
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('deleteTimesheet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing timesheet', async () => {
    // Create a test timesheet first
    const timesheetId = await createTestTimesheet();

    const input: DeleteTimesheetInput = { id: timesheetId };
    const result = await deleteTimesheet(input);

    // Should return true indicating successful deletion
    expect(result).toBe(true);

    // Verify the timesheet no longer exists in the database
    const timesheets = await db.select()
      .from(timesheetsTable)
      .where(eq(timesheetsTable.id, timesheetId))
      .execute();

    expect(timesheets).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent timesheet', async () => {
    const nonExistentId = 99999;
    const input: DeleteTimesheetInput = { id: nonExistentId };
    
    const result = await deleteTimesheet(input);

    // Should return false as no timesheet exists with this ID
    expect(result).toBe(false);
  });

  it('should only delete the specified timesheet', async () => {
    // Create multiple test timesheets
    const timesheetId1 = await createTestTimesheet();
    const timesheetId2 = await createTestTimesheet();

    // Delete only the first timesheet
    const input: DeleteTimesheetInput = { id: timesheetId1 };
    const result = await deleteTimesheet(input);

    expect(result).toBe(true);

    // Verify first timesheet is deleted
    const deletedTimesheet = await db.select()
      .from(timesheetsTable)
      .where(eq(timesheetsTable.id, timesheetId1))
      .execute();

    expect(deletedTimesheet).toHaveLength(0);

    // Verify second timesheet still exists
    const remainingTimesheet = await db.select()
      .from(timesheetsTable)
      .where(eq(timesheetsTable.id, timesheetId2))
      .execute();

    expect(remainingTimesheet).toHaveLength(1);
    expect(remainingTimesheet[0].id).toBe(timesheetId2);
  });

  it('should handle deletion of timesheet with null no_tiket_aktivitas', async () => {
    // Create timesheet with null ticket number
    const timesheetWithNullTicket: CreateTimesheetInput = {
      ...testTimesheetInput,
      no_tiket_aktivitas: null
    };

    const startTime = timesheetWithNullTicket.waktu_mulai;
    const endTime = timesheetWithNullTicket.waktu_selesai;
    const durasi = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const result = await db.insert(timesheetsTable)
      .values({
        nama: timesheetWithNullTicket.nama,
        waktu_mulai: startTime,
        waktu_selesai: endTime,
        kategori: timesheetWithNullTicket.kategori,
        no_tiket_aktivitas: timesheetWithNullTicket.no_tiket_aktivitas,
        jumlah_line_item: timesheetWithNullTicket.jumlah_line_item,
        durasi
      })
      .returning()
      .execute();

    const timesheetId = result[0].id;

    // Delete the timesheet
    const input: DeleteTimesheetInput = { id: timesheetId };
    const deleteResult = await deleteTimesheet(input);

    expect(deleteResult).toBe(true);

    // Verify deletion
    const timesheets = await db.select()
      .from(timesheetsTable)
      .where(eq(timesheetsTable.id, timesheetId))
      .execute();

    expect(timesheets).toHaveLength(0);
  });

  it('should handle different timesheet categories', async () => {
    // Create timesheet with different category
    const timesheetWithDifferentCategory: CreateTimesheetInput = {
      ...testTimesheetInput,
      kategori: 'Development & Testing'
    };

    const startTime = timesheetWithDifferentCategory.waktu_mulai;
    const endTime = timesheetWithDifferentCategory.waktu_selesai;
    const durasi = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    const result = await db.insert(timesheetsTable)
      .values({
        nama: timesheetWithDifferentCategory.nama,
        waktu_mulai: startTime,
        waktu_selesai: endTime,
        kategori: timesheetWithDifferentCategory.kategori,
        no_tiket_aktivitas: timesheetWithDifferentCategory.no_tiket_aktivitas,
        jumlah_line_item: timesheetWithDifferentCategory.jumlah_line_item,
        durasi
      })
      .returning()
      .execute();

    const timesheetId = result[0].id;

    // Delete the timesheet
    const input: DeleteTimesheetInput = { id: timesheetId };
    const deleteResult = await deleteTimesheet(input);

    expect(deleteResult).toBe(true);

    // Verify deletion
    const timesheets = await db.select()
      .from(timesheetsTable)
      .where(eq(timesheetsTable.id, timesheetId))
      .execute();

    expect(timesheets).toHaveLength(0);
  });
});