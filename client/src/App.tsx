import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Download, Play, Square, Save, Search } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Timesheet, CreateTimesheetInput, UpdateTimesheetInput, TimesheetCategory } from '../../server/src/schema';

// Utility function to format duration
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// Utility function to format datetime for display
const formatDateTime = (date: Date): string => {
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Category options based on schema
const categoryOptions: TimesheetCategory[] = [
  'Ticket',
  'Koordinasi & kegiatan pendukung lainnya',
  'Meeting',
  'Adhoc/project',
  'Development & Testing',
  'Other'
];

// Edit Dialog Component
interface EditTimesheetDialogProps {
  timesheet: Timesheet;
  onUpdate: () => void;
  trigger: React.ReactNode;
}

function EditTimesheetDialog({ timesheet, onUpdate, trigger }: EditTimesheetDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<UpdateTimesheetInput>({
    id: timesheet.id,
    nama: timesheet.nama,
    waktu_mulai: timesheet.waktu_mulai,
    waktu_selesai: timesheet.waktu_selesai,
    kategori: timesheet.kategori,
    no_tiket_aktivitas: timesheet.no_tiket_aktivitas,
    jumlah_line_item: timesheet.jumlah_line_item
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.updateTimesheet.mutate(formData);
      onUpdate();
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to update timesheet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Timesheet Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nama">Nama *</Label>
              <Input
                id="nama"
                value={formData.nama || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateTimesheetInput) => ({ ...prev, nama: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="kategori">Kategori *</Label>
              <Select
                value={formData.kategori || ''}
                onValueChange={(value: TimesheetCategory) =>
                  setFormData((prev: UpdateTimesheetInput) => ({ ...prev, kategori: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((category: TimesheetCategory) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="waktu_mulai">Waktu Mulai</Label>
              <Input
                id="waktu_mulai"
                type="datetime-local"
                value={formData.waktu_mulai ? new Date(formData.waktu_mulai.getTime() - formData.waktu_mulai.getTimezoneOffset() * 60000).toISOString().slice(0, 19) : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateTimesheetInput) => ({
                    ...prev,
                    waktu_mulai: e.target.value ? new Date(e.target.value) : undefined
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="waktu_selesai">Waktu Selesai</Label>
              <Input
                id="waktu_selesai"
                type="datetime-local"
                value={formData.waktu_selesai ? new Date(formData.waktu_selesai.getTime() - formData.waktu_selesai.getTimezoneOffset() * 60000).toISOString().slice(0, 19) : ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateTimesheetInput) => ({
                    ...prev,
                    waktu_selesai: e.target.value ? new Date(e.target.value) : undefined
                  }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="no_tiket_aktivitas">No Tiket/Aktivitas</Label>
              <Input
                id="no_tiket_aktivitas"
                value={formData.no_tiket_aktivitas || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateTimesheetInput) => ({
                    ...prev,
                    no_tiket_aktivitas: e.target.value || null
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="jumlah_line_item">Jumlah Line Item *</Label>
              <Input
                id="jumlah_line_item"
                type="number"
                min="1"
                value={formData.jumlah_line_item || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData((prev: UpdateTimesheetInput) => ({
                    ...prev,
                    jumlah_line_item: parseInt(e.target.value) || 0
                  }))
                }
                required
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function App() {
  // User name state
  const [userName, setUserName] = useState<string>('');
  const [isUserNameSet, setIsUserNameSet] = useState<boolean>(false);

  // Timer state
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [currentDuration, setCurrentDuration] = useState<number>(0);

  // Form state
  const [formData, setFormData] = useState<CreateTimesheetInput>({
    nama: '',
    waktu_mulai: new Date(),
    waktu_selesai: new Date(),
    kategori: 'Ticket',
    no_tiket_aktivitas: null,
    jumlah_line_item: 1
  });

  // Data state
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  // Load timesheets
  const loadTimesheets = useCallback(async () => {
    try {
      const searchInput = {
        query: searchQuery || undefined,
        kategori: categoryFilter ? categoryFilter as TimesheetCategory : undefined
      };
      const result = await trpc.getTimesheets.query(searchInput);
      setTimesheets(result);
    } catch (error) {
      console.error('Failed to load timesheets:', error);
    }
  }, [searchQuery, categoryFilter]);

  useEffect(() => {
    if (isUserNameSet) {
      loadTimesheets();
    }
  }, [loadTimesheets, isUserNameSet]);

  // Timer effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isTimerRunning && timerStart) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - timerStart.getTime()) / 1000);
        setCurrentDuration(duration);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isTimerRunning, timerStart]);

  // Initialize form with user name when set
  useEffect(() => {
    if (userName) {
      setFormData((prev: CreateTimesheetInput) => ({ ...prev, nama: userName }));
    }
  }, [userName]);

  // Handle user name submission
  const handleUserNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setIsUserNameSet(true);
    }
  };

  // Timer controls
  const startTimer = () => {
    const now = new Date();
    setTimerStart(now);
    setIsTimerRunning(true);
    setCurrentDuration(0);
    setFormData((prev: CreateTimesheetInput) => ({ ...prev, waktu_mulai: now }));
  };

  const stopTimer = () => {
    const now = new Date();
    setIsTimerRunning(false);
    setFormData((prev: CreateTimesheetInput) => ({ ...prev, waktu_selesai: now }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTimerRunning && timerStart) {
      setIsLoading(true);
      try {
        const response = await trpc.createTimesheet.mutate(formData);
        setTimesheets((prev: Timesheet[]) => [...prev, response]);
        // Reset form
        setFormData({
          nama: userName,
          waktu_mulai: new Date(),
          waktu_selesai: new Date(),
          kategori: 'Ticket',
          no_tiket_aktivitas: null,
          jumlah_line_item: 1
        });
        setTimerStart(null);
        setCurrentDuration(0);
      } catch (error) {
        console.error('Failed to create timesheet:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Delete timesheet
  const handleDelete = async (id: number) => {
    try {
      await trpc.deleteTimesheet.mutate({ id });
      setTimesheets((prev: Timesheet[]) => prev.filter((t: Timesheet) => t.id !== id));
    } catch (error) {
      console.error('Failed to delete timesheet:', error);
    }
  };

  // Export to Excel (simple HTML table export)
  const exportToExcel = () => {
    const headers = ['ID', 'Nama', 'Waktu Mulai', 'Waktu Selesai', 'Kategori', 'No Tiket/Aktivitas', 'Jumlah Line Item', 'Durasi'];
    const rows = timesheets.map((timesheet: Timesheet) => [
      timesheet.id,
      timesheet.nama,
      formatDateTime(timesheet.waktu_mulai),
      formatDateTime(timesheet.waktu_selesai),
      timesheet.kategori,
      timesheet.no_tiket_aktivitas || '',
      timesheet.jumlah_line_item,
      formatDuration(timesheet.durasi)
    ]);

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += headers.join(',') + '\n';
    rows.forEach((row: any[]) => {
      csvContent += row.map((field: any) => `"${field}"`).join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'timesheet_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // User name entry screen
  if (!isUserNameSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-800">📋 Timesheet App</CardTitle>
            <p className="text-gray-600">Masukkan nama Anda untuk memulai</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUserNameSubmit} className="space-y-4">
              <div>
                <Label htmlFor="userName" className="text-sm font-medium">
                  Nama Anda
                </Label>
                <Input
                  id="userName"
                  type="text"
                  placeholder="Masukkan nama Anda..."
                  value={userName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUserName(e.target.value)}
                  required
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={!userName.trim()}>
                Mulai ✨
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📋 Timesheet Recording App
          </h1>
          <p className="text-gray-600">Selamat datang, <span className="font-semibold text-blue-600">{userName}</span>! 👋</p>
        </div>

        {/* Timesheet Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⏱️ Input Timesheet Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="nama">Nama *</Label>
                  <Input
                    id="nama"
                    value={formData.nama}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTimesheetInput) => ({ ...prev, nama: e.target.value }))
                    }
                    required
                    className="bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="kategori">Kategori *</Label>
                  <Select
                    value={formData.kategori}
                    onValueChange={(value: TimesheetCategory) =>
                      setFormData((prev: CreateTimesheetInput) => ({ ...prev, kategori: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((category: TimesheetCategory) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="no_tiket_aktivitas">No Tiket/Aktivitas</Label>
                  <Input
                    id="no_tiket_aktivitas"
                    value={formData.no_tiket_aktivitas || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTimesheetInput) => ({
                        ...prev,
                        no_tiket_aktivitas: e.target.value || null
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="jumlah_line_item">Jumlah Line Item *</Label>
                  <Input
                    id="jumlah_line_item"
                    type="number"
                    min="1"
                    value={formData.jumlah_line_item}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTimesheetInput) => ({
                        ...prev,
                        jumlah_line_item: parseInt(e.target.value) || 1
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Durasi Real-time</Label>
                  <div className="bg-gray-50 border rounded-md px-3 py-2 font-mono text-lg">
                    {formatDuration(currentDuration)}
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    onClick={startTimer}
                    disabled={isTimerRunning}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Mulai
                  </Button>
                  <Button
                    type="button"
                    onClick={stopTimer}
                    disabled={!isTimerRunning}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Selesai
                  </Button>
                </div>
              </div>
              
              {timerStart && !isTimerRunning && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Waktu Mulai:</strong> {formatDateTime(formData.waktu_mulai)} <br />
                    <strong>Waktu Selesai:</strong> {formatDateTime(formData.waktu_selesai)} <br />
                    <strong>Total Durasi:</strong> {formatDuration(currentDuration)}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || isTimerRunning || !timerStart}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isLoading ? 'Menyimpan...' : 'Simpan Timesheet'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search and Filter Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Pencarian & Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <Label htmlFor="search">Cari berdasarkan Nama atau No Tiket</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Ketik untuk mencari..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="min-w-48">
                <Label htmlFor="categoryFilter">Filter Kategori</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Semua kategori</SelectItem>
                    {categoryOptions.map((category: TimesheetCategory) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={exportToExcel} variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timesheet Data Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Data Timesheet
              <Badge variant="secondary">{timesheets.length} entries</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timesheets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Belum ada data timesheet. Mulai dengan membuat entry baru! 📝</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead>Waktu Mulai</TableHead>
                      <TableHead>Waktu Selesai</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>No Tiket/Aktivitas</TableHead>
                      <TableHead>Jumlah Line Item</TableHead>
                      <TableHead>Durasi</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timesheets.map((timesheet: Timesheet) => (
                      <TableRow key={timesheet.id}>
                        <TableCell className="font-mono">{timesheet.id}</TableCell>
                        <TableCell className="font-medium">{timesheet.nama}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatDateTime(timesheet.waktu_mulai)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {formatDateTime(timesheet.waktu_selesai)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{timesheet.kategori}</Badge>
                        </TableCell>
                        <TableCell>{timesheet.no_tiket_aktivitas || '-'}</TableCell>
                        <TableCell className="text-center">{timesheet.jumlah_line_item}</TableCell>
                        <TableCell className="font-mono font-bold">
                          {formatDuration(timesheet.durasi)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <EditTimesheetDialog
                              timesheet={timesheet}
                              onUpdate={loadTimesheets}
                              trigger={
                                <Button variant="outline" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              }
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus timesheet entry ini?
                                    Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(timesheet.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Hapus
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default App;