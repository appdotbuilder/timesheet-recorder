import { serial, text, pgTable, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';

// Define the category enum for PostgreSQL
export const timesheetCategoryEnum = pgEnum('timesheet_category', [
  'Ticket',
  'Koordinasi & kegiatan pendukung lainnya',
  'Meeting',
  'Adhoc/project',
  'Development & Testing',
  'Other'
]);

// Timesheet table definition
export const timesheetsTable = pgTable('timesheets', {
  id: serial('id').primaryKey(),
  nama: text('nama').notNull(),
  waktu_mulai: timestamp('waktu_mulai', { withTimezone: true }).notNull(),
  waktu_selesai: timestamp('waktu_selesai', { withTimezone: true }).notNull(),
  kategori: timesheetCategoryEnum('kategori').notNull(),
  no_tiket_aktivitas: text('no_tiket_aktivitas'), // Nullable by default
  jumlah_line_item: integer('jumlah_line_item').notNull(),
  durasi: integer('durasi').notNull(), // Duration in seconds
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// TypeScript types for the table schema
export type Timesheet = typeof timesheetsTable.$inferSelect; // For SELECT operations
export type NewTimesheet = typeof timesheetsTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { timesheets: timesheetsTable };