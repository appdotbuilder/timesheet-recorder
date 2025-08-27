import { db } from '../db';
import { timesheetsTable } from '../db/schema';
import { type DeleteTimesheetInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTimesheet = async (input: DeleteTimesheetInput): Promise<boolean> => {
  try {
    // Delete the timesheet entry
    const result = await db.delete(timesheetsTable)
      .where(eq(timesheetsTable.id, input.id))
      .execute();

    // Check if any row was deleted
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Timesheet deletion failed:', error);
    throw error;
  }
};