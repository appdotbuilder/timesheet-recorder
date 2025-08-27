import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { timesheetsTable } from '../db/schema';
import { type UpdateTimesheetInput, type CreateTimesheetInput } from '../schema';
import { updateTimesheet } from '../handlers/update_timesheet';
import { eq } from 'drizzle-orm';

// Helper function to create a test timesheet
const createTestTimesheet = async (): Promise<number> => {
  const testData: CreateTimesheetInput = {
    nama: 'Test User',
    waktu_mulai: new Date('2024-01-01T09:00:00Z'),
    waktu_selesai: new Date('2024-01-01T17:00:00Z'),
    kategori: 'Ticket',
    no_tiket_aktivitas: 'TICKET-001',
    jumlah_line_item: 5
  };

  const result = await db.insert(timesheetsTable)
    .values({
      ...testData,
      durasi: Math.floor((testData.waktu_selesai.getTime() - testData.waktu_mulai.getTime()) / 1000)
    })
    .returning({ id: timesheetsTable.id })
    .execute();

  return result[0].id;
};

describe('updateTimesheet', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update basic fields without affecting duration', async () => {
    const timesheetId = await createTestTimesheet();
    
    const updateInput: UpdateTimesheetInput = {
      id: timesheetId,
      nama: 'Updated User',
      kategori: 'Meeting',
      no_tiket_aktivitas: 'TICKET-002',
      jumlah_line_item: 10
    };

    const result = await updateTimesheet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(timesheetId);
    expect(result!.nama).toEqual('Updated User');
    expect(result!.kategori).toEqual('Meeting');
    expect(result!.no_tiket_aktivitas).toEqual('TICKET-002');
    expect(result!.jumlah_line_item).toEqual(10);
    expect(result!.durasi).toEqual(8 * 60 * 60); // Original 8 hours should remain
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should recalculate duration when waktu_mulai is updated', async () => {
    const timesheetId = await createTestTimesheet();
    
    const updateInput: UpdateTimesheetInput = {
      id: timesheetId,
      waktu_mulai: new Date('2024-01-01T10:00:00Z') // Start 1 hour later
    };

    const result = await updateTimesheet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.waktu_mulai).toEqual(new Date('2024-01-01T10:00:00Z'));
    expect(result!.durasi).toEqual(7 * 60 * 60); // Should be 7 hours now
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should recalculate duration when waktu_selesai is updated', async () => {
    const timesheetId = await createTestTimesheet();
    
    const updateInput: UpdateTimesheetInput = {
      id: timesheetId,
      waktu_selesai: new Date('2024-01-01T18:00:00Z') // End 1 hour later
    };

    const result = await updateTimesheet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.waktu_selesai).toEqual(new Date('2024-01-01T18:00:00Z'));
    expect(result!.durasi).toEqual(9 * 60 * 60); // Should be 9 hours now
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should recalculate duration when both times are updated', async () => {
    const timesheetId = await createTestTimesheet();
    
    const updateInput: UpdateTimesheetInput = {
      id: timesheetId,
      waktu_mulai: new Date('2024-01-01T08:00:00Z'),
      waktu_selesai: new Date('2024-01-01T16:00:00Z')
    };

    const result = await updateTimesheet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.waktu_mulai).toEqual(new Date('2024-01-01T08:00:00Z'));
    expect(result!.waktu_selesai).toEqual(new Date('2024-01-01T16:00:00Z'));
    expect(result!.durasi).toEqual(8 * 60 * 60); // Should be 8 hours
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should handle partial updates correctly', async () => {
    const timesheetId = await createTestTimesheet();
    
    const updateInput: UpdateTimesheetInput = {
      id: timesheetId,
      nama: 'Partially Updated User'
    };

    const result = await updateTimesheet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.nama).toEqual('Partially Updated User');
    // Other fields should remain unchanged
    expect(result!.kategori).toEqual('Ticket');
    expect(result!.no_tiket_aktivitas).toEqual('TICKET-001');
    expect(result!.jumlah_line_item).toEqual(5);
    expect(result!.durasi).toEqual(8 * 60 * 60); // Duration unchanged
  });

  it('should set no_tiket_aktivitas to null', async () => {
    const timesheetId = await createTestTimesheet();
    
    const updateInput: UpdateTimesheetInput = {
      id: timesheetId,
      no_tiket_aktivitas: null
    };

    const result = await updateTimesheet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.no_tiket_aktivitas).toBeNull();
  });

  it('should return null when timesheet does not exist', async () => {
    const nonExistentId = 99999;
    
    const updateInput: UpdateTimesheetInput = {
      id: nonExistentId,
      nama: 'Should Not Update'
    };

    const result = await updateTimesheet(updateInput);

    expect(result).toBeNull();
  });

  it('should persist changes in database', async () => {
    const timesheetId = await createTestTimesheet();
    
    const updateInput: UpdateTimesheetInput = {
      id: timesheetId,
      nama: 'Database Test User',
      kategori: 'Development & Testing'
    };

    await updateTimesheet(updateInput);

    // Verify changes in database
    const dbRecord = await db.select()
      .from(timesheetsTable)
      .where(eq(timesheetsTable.id, timesheetId))
      .execute();

    expect(dbRecord).toHaveLength(1);
    expect(dbRecord[0].nama).toEqual('Database Test User');
    expect(dbRecord[0].kategori).toEqual('Development & Testing');
    expect(dbRecord[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle duration calculation with fractional seconds', async () => {
    const timesheetId = await createTestTimesheet();
    
    // Create times with fractional seconds difference
    const updateInput: UpdateTimesheetInput = {
      id: timesheetId,
      waktu_mulai: new Date('2024-01-01T09:00:00.500Z'),
      waktu_selesai: new Date('2024-01-01T09:01:30.750Z')
    };

    const result = await updateTimesheet(updateInput);

    expect(result).not.toBeNull();
    // Duration should be floored: 90.25 seconds -> 90 seconds
    expect(result!.durasi).toEqual(90);
  });

  it('should update all fields at once', async () => {
    const timesheetId = await createTestTimesheet();
    
    const updateInput: UpdateTimesheetInput = {
      id: timesheetId,
      nama: 'Completely Updated User',
      waktu_mulai: new Date('2024-01-02T10:00:00Z'),
      waktu_selesai: new Date('2024-01-02T15:00:00Z'),
      kategori: 'Other',
      no_tiket_aktivitas: 'NEW-TICKET-003',
      jumlah_line_item: 15
    };

    const result = await updateTimesheet(updateInput);

    expect(result).not.toBeNull();
    expect(result!.nama).toEqual('Completely Updated User');
    expect(result!.waktu_mulai).toEqual(new Date('2024-01-02T10:00:00Z'));
    expect(result!.waktu_selesai).toEqual(new Date('2024-01-02T15:00:00Z'));
    expect(result!.kategori).toEqual('Other');
    expect(result!.no_tiket_aktivitas).toEqual('NEW-TICKET-003');
    expect(result!.jumlah_line_item).toEqual(15);
    expect(result!.durasi).toEqual(5 * 60 * 60); // 5 hours
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});