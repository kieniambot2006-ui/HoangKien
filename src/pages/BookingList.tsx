import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type { Booking } from '../types';
import { SHIFTS } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useBookings, useLabs, useUpdateBooking, useDeleteBooking } from '../hooks/useQueries';

export default function BookingList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [selectedLab, setSelectedLab] = useState(0);
  const [sortBy, setSortBy] = useState<'createdAt' | 'lab'>('createdAt');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState<{ id: number; reason: string } | null>(null);
  const { user, isStaff } = useAuth();
  const { showToast } = useToast();

  const { data: bookings = [], isLoading: bookingsLoading } = useBookings();
  const { data: labs = [], isLoading: labsLoading } = useLabs();
  const { mutateAsync: updateBooking } = useUpdateBooking();
  const { mutateAsync: deleteBooking } = useDeleteBooking();

  const loading = bookingsLoading || labsLoading;

  const handleDelete = async (id: number) => {
    try {
      await deleteBooking(id);
      setConfirmDelete(null);
      showToast('Đã xóa lịch đặt', 'success');
    } catch {
      showToast('Xóa lịch đặt thất bại', 'error');
    }
  };

  const handleStatus = async (id: number, status: string, reason?: string) => {
    const updates: Partial<Booking> = { status: status as Booking['status'] };
    if (reason) updates.rejectReason = reason;
    try {
      await updateBooking({ id, data: updates });
      setRejectReason(null);
      showToast(status === 'approved' ? 'Đã duyệt' : 'Đã từ chối', 'success');
    } catch {
      showToast('Thao tác thất bại', 'error');
    }
  };

  const canDelete = (booking: Booking) => {
    if (isStaff) return true;
    if (booking.userId === user?.id) return true;
    return false;
  };

  const filtered = useMemo(() => {
    return bookings
      .filter((b) => b.date === selectedDate && (selectedLab === 0 || b.labId === selectedLab))
      .sort((a, b) => sortBy === 'lab'
        ? a.labId - b.labId
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [bookings, selectedDate, selectedLab, sortBy]);

  const bookingsByShift = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (b.status === 'rejected') continue;
      if (selectedLab !== 0 && b.labId !== selectedLab) continue;
      const key = `${b.date}-${b.shift}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    return map;
  }, [bookings, selectedLab]);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginatedBookings = useMemo(
    () => filtered.slice((page - 1) * pageSize, page * pageSize),
    [filtered, page],
  );
  const getLabName = (labId: number) => labs.find((l) => l.id === labId)?.name || '-';

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Đặt lịch</h1>
        <Link to="/bookings/new" className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition">+ Đặt lịch</Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
        <div className="flex gap-3 mb-4">
          <label htmlFor="booking-date" className="sr-only">Ngày</label>
          <input id="booking-date" type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setSearchParams({ date: e.target.value }); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <label htmlFor="booking-lab" className="sr-only">Phòng</label>
          <select id="booking-lab" value={selectedLab} onChange={(e) => { setSelectedLab(Number(e.target.value)); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={0}>Tất cả phòng</option>
            {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <label htmlFor="booking-sort" className="sr-only">Sắp xếp</label>
          <select id="booking-sort" value={sortBy} onChange={(e) => { setSortBy(e.target.value as 'createdAt' | 'lab'); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="createdAt">Mới nhất</option>
            <option value="lab">Theo phòng</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {SHIFTS.map((shift) => {
            const shiftBookings = bookingsByShift.get(`${selectedDate}-${shift.id}`) || [];
            const isBooked = shiftBookings.length > 0;
            return (
              <div key={shift.id} className={`p-4 rounded-xl border-2 ${isBooked ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{shift.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isBooked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {isBooked ? 'Đã đặt' : 'Trống'}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{shift.time}</p>
                {isBooked && <p className="text-xs text-gray-600 mt-2">{shiftBookings.length} phòng đã đặt</p>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-3">
        <h2 className="text-lg font-semibold text-gray-800">Danh sách phòng đã đặt lịch</h2>
        <p className="text-sm text-gray-500">Các phòng đã đặt trong ngày {selectedDate}</p>
      </div>
      <div className="space-y-3">
        {paginatedBookings.map((b) => (
          <div key={b.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={b.status} />
                  <span className="text-sm font-medium">{getLabName(b.labId)}</span>
                </div>
                <p className="text-sm text-gray-500">{b.bookedBy} • {b.purpose}</p>
                <p className="text-xs text-gray-400">{SHIFTS.find((s) => s.id === b.shift)?.label}</p>
                {b.rejectReason && <p className="text-xs text-red-500 mt-1">Lý do từ chối: {b.rejectReason}</p>}
              </div>
              <div className="flex items-center gap-2 text-sm">
                {isStaff && b.status === 'pending' && (
                  <>
                    <button onClick={() => handleStatus(b.id, 'approved')} className="text-green-500 hover:text-green-600" aria-label="Duyệt">Duyệt</button>
                    <button onClick={() => setRejectReason({ id: b.id, reason: '' })} className="text-red-500 hover:text-red-600" aria-label="Từ chối">Từ chối</button>
                  </>
                )}
                {canDelete(b) && (
                  <button type="button" onClick={() => setConfirmDelete(b.id)}
                    className="px-3 py-1.5 rounded-lg text-sm text-red-500 border border-red-100 hover:bg-red-50" aria-label="Xóa lịch đặt">
                    Xóa lịch
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">Không có lịch đặt</p>}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>Trang {page} / {pageCount}</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40">Trước</button>
            <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={page === pageCount}
              className="px-3 py-1.5 rounded-lg border border-gray-200 disabled:opacity-40">Sau</button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setConfirmDelete(null)} role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Xóa lịch đặt?</h3>
            <p className="text-sm text-gray-500 mb-6">Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">Hủy</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600">Xóa</button>
            </div>
          </div>
        </div>
      )}

      {rejectReason && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]" onClick={() => setRejectReason(null)} role="dialog" aria-modal="true">
          <div className="bg-white rounded-2xl w-full max-w-sm mx-4 p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Lý do từ chối</h3>
            <textarea value={rejectReason.reason} onChange={(e) => setRejectReason({ ...rejectReason, reason: e.target.value })}
              className="input-field mb-4" rows={3} placeholder="Nhập lý do từ chối..." />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setRejectReason(null)} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200">Hủy</button>
              <button onClick={() => handleStatus(rejectReason.id, 'rejected', rejectReason.reason)} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600" disabled={!rejectReason.reason.trim()}>Từ chối</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { pending: 'bg-yellow-50 text-yellow-600', approved: 'bg-green-50 text-green-600', rejected: 'bg-red-50 text-red-600' };
  const labels: Record<string, string> = { pending: 'Chờ duyệt', approved: 'Đã duyệt', rejected: 'Từ chối' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || ''}`}>{labels[status] || status}</span>;
}

function Loader() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" /></div>;
}
