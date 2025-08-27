import { type CreateTimesheetInput, type Timesheet } from '../schema';

export const createTimesheet = async (input: CreateTimesheetInput): Promise<Timesheet> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is creating a new timesheet entry and persisting it in the database.
    // Calculate duration in seconds from waktu_mulai and waktu_selesai
    const durasi = Math.floor((input.waktu_selesai.getTime() - input.waktu_mulai.getTime()) / 1000);
    
    return Promise.resolve({
        id: 0, // Placeholder ID
        nama: input.nama,
        waktu_mulai: input.waktu_mulai,
        waktu_selesai: input.waktu_selesai,
        kategori: input.kategori,
        no_tiket_aktivitas: input.no_tiket_aktivitas,
        jumlah_line_item: input.jumlah_line_item,
        durasi: durasi,
        created_at: new Date(),
        updated_at: new Date()
    } as Timesheet);
};