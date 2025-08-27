import { z } from 'zod';

// Enum for timesheet categories
export const timesheetCategorySchema = z.enum([
  'Ticket',
  'Koordinasi & kegiatan pendukung lainnya',
  'Meeting',
  'Adhoc/project',
  'Development & Testing',
  'Other'
]);

export type TimesheetCategory = z.infer<typeof timesheetCategorySchema>;

// Main timesheet schema
export const timesheetSchema = z.object({
  id: z.number(),
  nama: z.string(),
  waktu_mulai: z.coerce.date(),
  waktu_selesai: z.coerce.date(),
  kategori: timesheetCategorySchema,
  no_tiket_aktivitas: z.string().nullable(),
  jumlah_line_item: z.number().int(),
  durasi: z.number(), // Duration in seconds
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Timesheet = z.infer<typeof timesheetSchema>;

// Input schema for creating timesheet entries
export const createTimesheetInputSchema = z.object({
  nama: z.string().min(1, 'Nama is required'),
  waktu_mulai: z.coerce.date(),
  waktu_selesai: z.coerce.date(),
  kategori: timesheetCategorySchema,
  no_tiket_aktivitas: z.string().nullable(),
  jumlah_line_item: z.number().int().positive('Jumlah Line Item must be positive')
});

export type CreateTimesheetInput = z.infer<typeof createTimesheetInputSchema>;

// Input schema for updating timesheet entries
export const updateTimesheetInputSchema = z.object({
  id: z.number(),
  nama: z.string().min(1, 'Nama is required').optional(),
  waktu_mulai: z.coerce.date().optional(),
  waktu_selesai: z.coerce.date().optional(),
  kategori: timesheetCategorySchema.optional(),
  no_tiket_aktivitas: z.string().nullable().optional(),
  jumlah_line_item: z.number().int().positive('Jumlah Line Item must be positive').optional()
});

export type UpdateTimesheetInput = z.infer<typeof updateTimesheetInputSchema>;

// Schema for search/filter operations
export const searchTimesheetInputSchema = z.object({
  query: z.string().optional(), // Search by nama or no_tiket_aktivitas
  kategori: timesheetCategorySchema.optional() // Filter by category
});

export type SearchTimesheetInput = z.infer<typeof searchTimesheetInputSchema>;

// Schema for delete operation
export const deleteTimesheetInputSchema = z.object({
  id: z.number()
});

export type DeleteTimesheetInput = z.infer<typeof deleteTimesheetInputSchema>;

// Schema for get by ID operation
export const getTimesheetByIdInputSchema = z.object({
  id: z.number()
});

export type GetTimesheetByIdInput = z.infer<typeof getTimesheetByIdInputSchema>;