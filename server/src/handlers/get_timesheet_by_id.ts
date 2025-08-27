import { db } from '../db';
import { timesheetsTable } from '../db/schema';
import { type GetTimesheetByIdInput, type Timesheet } from '../schema';
import { eq } from 'drizzle-orm';

export const getTimesheetById = async (input: GetTimesheetByIdInput): Promise<Timesheet | null> => {
  try {
    // Query for the timesheet by ID
    const results = await db.select()
      .from(timesheetsTable)
      .where(eq(timesheetsTable.id, input.id))
      .execute();

    // Return null if no timesheet found
    if (results.length === 0) {
      return null;
    }

    // Return the found timesheet (no numeric conversions needed for this schema)
    return results[0];
  } catch (error) {
    console.error('Get timesheet by ID failed:', error);
    throw error;
  }
};