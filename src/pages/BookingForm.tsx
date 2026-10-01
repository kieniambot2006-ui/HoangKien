import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SHIFTS } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLabs, useCreateBooking } from '../hooks/useQueries';
import { api } from '../services/api';

export default function BookingForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const { data: labs = [] } = useLabs();
  const createBooking = useCreateBooking();

  const [form, setForm] = useState({
    labId: 1, date: new Date().toISOString().split('T')[0],
    shift: 'morning' as 'morning' | 'afternoon' | 'evening',
    bookedBy: user?.name || '', userId: user?.id, purpose: '', status: 'pending' as const, createdAt: new Date().toISOString(),
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    if (!form.date || !form.labId || !form.shift) return;
    let cancelled = false;
    api.bookings.checkConflict(form.date, form.labId, form.shift)
      .then((result) => { if (!cancelled) setConflict(result); })
      .catch(() => { if (!cancelled) setConflict(false); });
    return () => { cancelled = true; };
  }, [form.date, form.labId, form.shift]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.bookedBy.trim()) e.bookedBy = 'Bắt buộc';
    if (!form.purpose.trim()) e.purpose = 'Bắt buộc';
    if (conflict) e.shift = 'Ca này đã được đặt';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await createBooking.mutateAsync(form);
      showToast('Đã đặt lịch', 'success');
      navigate(`/bookings?date=${encodeURIComponent(form.date)}`);
    } catch { showToast('Thất bại', 'error'); }
  };

  const isLoading = createBooking.isPending;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Đặt lịch sử dụng phòng</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <Field label="Phòng máy">
          <select value={form.labId} onChange={(e) => setForm({ ...form, labId: Number(e.target.value) })} className="input-field">
            {labs.filter((l) => l.status === 'active').map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </Field>
        <Field label="Ngày">
          <input type="date" value={form.date} min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
        </Field>
        <Field label="Ca sử dụng" error={errors.shift}>
          <div className="grid grid-cols-3 gap-2">
            {SHIFTS.map((s) => (
              <button key={s.id} type="button" onClick={() => setForm({ ...form, shift: s.id as any })}
                className={`p-3 rounded-lg border-2 text-center text-sm ${form.shift === s.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                <p className="font-medium">{s.label}</p>
                <p className="text-xs text-gray-400">{s.time}</p>
              </button>
            ))}
          </div>
        </Field>
        <Field label="Họ tên" error={errors.bookedBy}>
          <input type="text" value={form.bookedBy} onChange={(e) => setForm({ ...form, bookedBy: e.target.value })} className="input-field" />
        </Field>
        <Field label="Mục đích" error={errors.purpose}>
          <textarea value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} className="input-field" rows={2}
            placeholder="VD: Thực hành Lập trình Web" />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isLoading || conflict} className="btn-primary flex-1">{isLoading ? 'Đang xử lý...' : 'Đặt lịch'}</button>
          <button type="button" onClick={() => navigate('/bookings')} className="btn-secondary">Hủy</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
