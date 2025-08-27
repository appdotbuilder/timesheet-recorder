import { db } from '../db';
import { timesheetsTable } from '../db/schema';
import { type UpdateTimesheetInput, type Timesheet } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTimesheet = async (input: UpdateTimesheetInput): Promise<Timesheet | null> => {
  try {
    // First, check if the timesheet exists
    const existingTimesheet = await db.select()
      .from(timesheetsTable)
      .where(eq(timesheetsTable.id, input.id))
      .execute();

    if (existingTimesheet.length === 0) {
      return null;
    }

    // Prepare update values, excluding the ID
    const { id, ...updateData } = input;
    
    // Calculate duration if either waktu_mulai or waktu_selesai is being updated
    let calculatedDurasi: number | undefined;
    
    if (updateData.waktu_mulai || updateData.waktu_selesai) {
      // Get current values for times that aren't being updated
      const currentRecord = existingTimesheet[0];
      const startTime = updateData.waktu_mulai || currentRecord.waktu_mulai;
      const endTime = updateData.waktu_selesai || currentRecord.waktu_selesai;
      
      // Calculate duration in seconds
      calculatedDurasi = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    }

    // Build the update object with only provided fields
    const updateValues: any = {
      ...updateData,
      updated_at: new Date()
    };

    // Add calculated duration if times were updated
    if (calculatedDurasi !== undefined) {
      updateValues.durasi = calculatedDurasi;
    }

    // Perform the update
    const result = await db.update(timesheetsTable)
      .set(updateValues)
      .where(eq(timesheetsTable.id, input.id))
      .returning()
      .execute();

    return result[0] || null;
  } catch (error) {
    console.error('Timesheet update failed:', error);
    throw error;
  }
};