import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import type { Device } from '../types';
import { useToast } from '../context/ToastContext';
import { useLabs, useDevice, useCreateDevice, useUpdateDevice } from '../hooks/useQueries';

function getInitialForm(existingDevice: Device | undefined, isEdit: boolean, defaultLabId: string | null) {
  if (isEdit && existingDevice) {
    return { name: existingDevice.name, type: existingDevice.type, labId: existingDevice.labId, status: existingDevice.status, specification: existingDevice.specification };
  }
  return {
    name: '', type: 'desktop' as Device['type'], labId: defaultLabId ? Number(defaultLabId) : 1,
    status: 'working' as Device['status'], specification: ''
  };
}

export default function DeviceForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(id);
  const defaultLabId = searchParams.get('labId');

  const { data: labs = [] } = useLabs();
  const { data: existingDevice } = useDevice(Number(id));
  const createDevice = useCreateDevice();
  const updateDevice = useUpdateDevice();

  const [form, setForm] = useState(() => getInitialForm(undefined, isEdit, defaultLabId));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && existingDevice) {
      setForm(getInitialForm(existingDevice, isEdit, defaultLabId));
    }
  }, [existingDevice, isEdit, defaultLabId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Bắt buộc';
    if (!form.specification.trim()) e.specification = 'Bắt buộc';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (isEdit && id) await updateDevice.mutateAsync({ id: Number(id), data: form });
      else await createDevice.mutateAsync(form);
      showToast(isEdit ? 'Đã cập nhật' : 'Đã thêm mới', 'success');
      navigate('/devices');
    } catch { showToast('Thao tác thất bại', 'error'); }
  };

  const isLoading = createDevice.isPending || updateDevice.isPending;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{isEdit ? 'Sửa thiết bị' : 'Thêm thiết bị'}</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <Field label="Tên thiết bị" error={errors.name}>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Loại">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Device['type'] })} className="input-field">
              <option value="desktop">Desktop</option>
              <option value="laptop">Laptop</option>
              <option value="printer">Máy in</option>
              <option value="projector">Máy chiếu</option>
            </select>
          </Field>
          <Field label="Phòng máy">
            <select value={form.labId} onChange={(e) => setForm({ ...form, labId: Number(e.target.value) })} className="input-field">
              {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Trạng thái">
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Device['status'] })} className="input-field">
            <option value="working">Hoạt động</option>
            <option value="error">Lỗi</option>
            <option value="maintenance">Bảo trì</option>
          </select>
        </Field>
        <Field label="Thông số kỹ thuật" error={errors.specification}>
          <textarea value={form.specification} onChange={(e) => setForm({ ...form, specification: e.target.value })} className="input-field" rows={3} />
        </Field>
        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? 'Đang lưu...' : 'Lưu'}</button>
          <button type="button" onClick={() => navigate('/devices')} className="btn-secondary">Hủy</button>
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
