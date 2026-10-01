import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { MaintenanceLog } from '../types';
import { useToast } from '../context/ToastContext';
import { useDevices, useMaintenanceLog, useCreateMaintenanceLog, useUpdateMaintenanceLog, useUpdateDevice } from '../hooks/useQueries';

function getInitialForm(existingLog: MaintenanceLog | undefined, isEdit: boolean, defaultDeviceId: string | null) {
  if (isEdit && existingLog) {
    return { deviceId: existingLog.deviceId, performedBy: existingLog.performedBy, type: existingLog.type, description: existingLog.description,
      parts: existingLog.parts, cost: existingLog.cost, startDate: existingLog.startDate?.slice(0, 16) || '', endDate: existingLog.endDate?.slice(0, 16) || '',
      status: existingLog.status, notes: existingLog.notes };
  }
  return {
    deviceId: defaultDeviceId ? Number(defaultDeviceId) : 1, performedBy: '',
    type: 'maintenance' as MaintenanceLog['type'], description: '', parts: '', cost: 0,
    startDate: new Date().toISOString().slice(0, 16), endDate: '',
    status: 'pending' as MaintenanceLog['status'], notes: '',
  };
}

export default function MaintenanceForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(id);
  const defaultDeviceId = searchParams.get('deviceId');

  const { data: devices = [] } = useDevices();
  const { data: existingLog } = useMaintenanceLog(Number(id));
  const createLog = useCreateMaintenanceLog();
  const updateLog = useUpdateMaintenanceLog();
  const { mutateAsync: updateDevice } = useUpdateDevice();

  const [form, setForm] = useState(() => getInitialForm(undefined, isEdit, defaultDeviceId));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && existingLog) {
      setForm(getInitialForm(existingLog, isEdit, defaultDeviceId));
    }
  }, [existingLog, isEdit, defaultDeviceId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.description.trim()) e.description = 'Bắt buộc';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const data = { ...form, startDate: form.startDate ? new Date(form.startDate).toISOString() : null, endDate: form.endDate ? new Date(form.endDate).toISOString() : null };
      if (isEdit && id) {
        await updateLog.mutateAsync({ id: Number(id), data });
        if (data.status === 'completed' && existingLog && existingLog.status !== 'completed') {
          try { await updateDevice({ id: form.deviceId, data: { status: 'working' } }); } catch {}
        } else if (data.status === 'in-progress' && existingLog && existingLog.status === 'pending') {
          try { await updateDevice({ id: form.deviceId, data: { status: 'maintenance' } }); } catch {}
        }
      } else {
        await createLog.mutateAsync(data);
        try { await updateDevice({ id: form.deviceId, data: { status: 'maintenance' } }); } catch {}
      }
      showToast(isEdit ? 'Đã cập nhật' : 'Đã thêm mới', 'success');
      navigate('/maintenance');
    } catch { showToast('Thất bại', 'error'); }
  };

  const isLoading = createLog.isPending || updateLog.isPending;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{isEdit ? 'Sửa bảo trì' : 'Thêm bảo trì'}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <Field label="Thiết bị">
          <select value={form.deviceId} onChange={(e) => setForm({ ...form, deviceId: Number(e.target.value) })} className="input-field">
            {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Loại">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="input-field">
              <option value="repair">Sửa chữa</option>
              <option value="maintenance">Bảo trì</option>
              <option value="upgrade">Nâng cấp</option>
            </select>
          </Field>
          <Field label="Trạng thái">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })} className="input-field">
              <option value="pending">Chờ xử lý</option>
              <option value="in-progress">Đang thực hiện</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </Field>
        </div>
        <Field label="Mô tả" error={errors.description}>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" rows={3} />
        </Field>
        <Field label="Linh kiện thay thế">
          <input type="text" value={form.parts} onChange={(e) => setForm({ ...form, parts: e.target.value })} className="input-field" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Chi phí (VNĐ)">
            <input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} className="input-field" min="0" />
          </Field>
          <Field label="Người thực hiện">
            <input type="text" value={form.performedBy} onChange={(e) => setForm({ ...form, performedBy: e.target.value })} className="input-field" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Ngày bắt đầu">
            <input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input-field" />
          </Field>
          <Field label="Ngày hoàn thành">
            <input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input-field" />
          </Field>
        </div>
        <Field label="Ghi chú">
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? 'Đang lưu...' : 'Lưu'}</button>
          <button type="button" onClick={() => navigate('/maintenance')} className="btn-secondary">Hủy</button>
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
