import { db } from '../db';
import { timesheetsTable } from '../db/schema';
import { type Timesheet, type SearchTimesheetInput } from '../schema';
import { eq, or, ilike, and, desc, type SQL } from 'drizzle-orm';

export const getTimesheets = async (input?: SearchTimesheetInput): Promise<Timesheet[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (input?.query) {
      // Case-insensitive search on nama and no_tiket_aktivitas
      conditions.push(
        or(
          ilike(timesheetsTable.nama, `%${input.query}%`),
          ilike(timesheetsTable.no_tiket_aktivitas, `%${input.query}%`)
        )!
      );
    }

    if (input?.kategori) {
      // Filter by category
      conditions.push(eq(timesheetsTable.kategori, input.kategori));
    }

    // Build and execute query in one go to avoid type inference issues
    const results = conditions.length > 0
      ? await db.select()
          .from(timesheetsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(timesheetsTable.created_at))
          .execute()
      : await db.select()
          .from(timesheetsTable)
          .orderBy(desc(timesheetsTable.created_at))
          .execute();

    // Return results (no numeric conversion needed as durasi is integer)
    return results;
  } catch (error) {
    console.error('Get timesheets failed:', error);
    throw error;
  }
};