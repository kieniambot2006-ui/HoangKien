import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Incident } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useIncident, useDevices, useCreateIncident, useUpdateIncident, useUpdateDevice } from '../hooks/useQueries';

function getInitialForm(existingIncident: Incident | undefined, isEdit: boolean, defaultDeviceId: string | null, defaultLabId: string | null, userName: string) {
  if (isEdit && existingIncident) {
    return { deviceId: existingIncident.deviceId, labId: existingIncident.labId, description: existingIncident.description, status: existingIncident.status, priority: existingIncident.priority,
      reportedBy: existingIncident.reportedBy, assignedTo: existingIncident.assignedTo || '', note: existingIncident.note, imageUrl: existingIncident.imageUrl || '',
      reportedAt: existingIncident.reportedAt, resolvedAt: existingIncident.resolvedAt };
  }
  return {
    deviceId: defaultDeviceId ? Number(defaultDeviceId) : 1,
    labId: defaultLabId ? Number(defaultLabId) : 1,
    description: '', status: 'pending' as Incident['status'], priority: 'medium' as Incident['priority'],
    reportedBy: userName, assignedTo: '', note: '', imageUrl: '',
    reportedAt: new Date().toISOString(), resolvedAt: null as string | null,
  };
}

export default function IncidentForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isEdit = Boolean(id);
  const defaultDeviceId = searchParams.get('deviceId');
  const defaultLabId = searchParams.get('labId');

  const { data: devices = [] } = useDevices();
  const { data: existingIncident } = useIncident(Number(id));
  const createIncident = useCreateIncident();
  const updateIncident = useUpdateIncident();
  const { mutateAsync: updateDevice } = useUpdateDevice();

  const [form, setForm] = useState(() => getInitialForm(undefined, isEdit, defaultDeviceId, defaultLabId, user?.name || ''));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (isEdit && existingIncident) {
      const newForm = getInitialForm(existingIncident, isEdit, defaultDeviceId, defaultLabId, user?.name || '');
      setForm(newForm);
      if (newForm.imageUrl) setImagePreview(newForm.imageUrl);
    }
  }, [existingIncident, isEdit, defaultDeviceId, defaultLabId, user?.name]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.description.trim()) e.description = 'Bắt buộc';
    if (!form.reportedBy.trim()) e.reportedBy = 'Bắt buộc';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (isEdit && id) {
        await updateIncident.mutateAsync({ id: Number(id), data: form });
        if (form.status === 'resolved' && existingIncident && existingIncident.status !== 'resolved') {
          try { await updateDevice({ id: form.deviceId, data: { status: 'working' } }); } catch {}
        }
        if (existingIncident && form.deviceId !== existingIncident.deviceId) {
          try { await updateDevice({ id: form.deviceId, data: { status: 'error' } }); } catch {}
        }
      } else {
        await createIncident.mutateAsync(form);
        try { await updateDevice({ id: form.deviceId, data: { status: 'error' } }); } catch {}
      }
      showToast(isEdit ? 'Đã cập nhật' : 'Đã gửi báo cáo', 'success');
      navigate('/incidents');
    } catch { showToast('Thao tác thất bại', 'error'); }
  };

  const handleDeviceChange = (deviceId: number) => {
    const device = devices.find((d) => d.id === deviceId);
    if (device) setForm({ ...form, deviceId, labId: device.labId });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 5 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => { setForm({ ...form, imageUrl: reader.result as string }); setImagePreview(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };

  const isLoading = createIncident.isPending || updateIncident.isPending;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{isEdit ? 'Sửa sự cố' : 'Báo sự cố mới'}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <Field label="Thiết bị">
          <select value={form.deviceId} onChange={(e) => handleDeviceChange(Number(e.target.value))} className="input-field">
            {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>

        <Field label="Mô tả sự cố" error={errors.description}>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field" rows={3} placeholder="Mô tả chi tiết sự cố..." />
        </Field>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh minh hoạ</label>
          <div className="flex items-center gap-4">
            <label className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition">
              <span className="text-2xl text-gray-300">📷</span>
              <span className="text-xs text-gray-400">Chọn ảnh</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            {imagePreview && (
              <div className="relative">
                <img src={imagePreview} alt="" className="w-24 h-24 object-cover rounded-lg" />
                <button type="button" onClick={() => { setForm({ ...form, imageUrl: '' }); setImagePreview(null); }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600">✕</button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Ưu tiên">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as Incident['priority'] })} className="input-field">
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Incident['status'] })} className="input-field">
              <option value="pending">Chờ xử lý</option>
              <option value="in-progress">Đang xử lý</option>
              <option value="resolved">Đã giải quyết</option>
            </select>
          </Field>
        </div>

        <Field label="Người báo cáo" error={errors.reportedBy}>
          <input type="text" value={form.reportedBy} onChange={(e) => setForm({ ...form, reportedBy: e.target.value })} className="input-field" />
        </Field>

        <Field label="Kỹ thuật viên phụ trách">
          <input type="text" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} className="input-field" placeholder="Tên KTV" />
        </Field>

        <Field label="Ghi chú">
          <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input-field" rows={2} />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? 'Đang lưu...' : 'Gửi báo cáo'}</button>
          <button type="button" onClick={() => navigate('/incidents')} className="btn-secondary">Hủy</button>
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
