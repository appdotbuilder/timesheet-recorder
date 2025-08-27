import { db } from '../db';
import { timesheetsTable } from '../db/schema';
import { type CreateTimesheetInput, type Timesheet } from '../schema';

export const createTimesheet = async (input: CreateTimesheetInput): Promise<Timesheet> => {
  try {
    // Calculate duration in seconds from waktu_mulai and waktu_selesai
    const durasi = Math.floor((input.waktu_selesai.getTime() - input.waktu_mulai.getTime()) / 1000);
    
    // Insert timesheet record
    const result = await db.insert(timesheetsTable)
      .values({
        nama: input.nama,
        waktu_mulai: input.waktu_mulai,
        waktu_selesai: input.waktu_selesai,
        kategori: input.kategori,
        no_tiket_aktivitas: input.no_tiket_aktivitas,
        jumlah_line_item: input.jumlah_line_item,
        durasi: durasi
        // created_at and updated_at will be set automatically by defaultNow()
      })
      .returning()
      .execute();

    // Return the created timesheet
    return result[0];
  } catch (error) {
    console.error('Timesheet creation failed:', error);
    throw error;
  }
};