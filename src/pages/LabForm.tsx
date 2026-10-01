import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Lab } from '../types';
import { useToast } from '../context/ToastContext';
import { useLab, useCreateLab, useUpdateLab } from '../hooks/useQueries';

function getInitialForm(existingLab: Lab | undefined, isEdit: boolean) {
  if (isEdit && existingLab) {
    return { name: existingLab.name, location: existingLab.location, capacity: existingLab.capacity, status: existingLab.status, description: existingLab.description };
  }
  return { name: '', location: '', capacity: 30, status: 'active' as Lab['status'], description: '' };
}

export default function LabForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  const { data: existingLab } = useLab(Number(id));
  const createLab = useCreateLab();
  const updateLab = useUpdateLab();

  const [form, setForm] = useState(() => getInitialForm(undefined, isEdit));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEdit && existingLab) {
      setForm(getInitialForm(existingLab, isEdit));
    }
  }, [existingLab, isEdit]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Bắt buộc';
    if (!form.location.trim()) e.location = 'Bắt buộc';
    if (!form.description.trim()) e.description = 'Bắt buộc';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      if (isEdit && id) await updateLab.mutateAsync({ id: Number(id), data: form });
      else await createLab.mutateAsync(form);
      showToast(isEdit ? 'Đã cập nhật' : 'Đã thêm mới', 'success');
      navigate('/labs');
    } catch { showToast('Thao tác thất bại', 'error'); }
  };

  const isLoading = createLab.isPending || updateLab.isPending;

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{isEdit ? 'Sửa phòng máy' : 'Thêm phòng máy'}</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <Field label="Tên phòng" error={errors.name}>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field" placeholder="VD: Phòng A101" />
        </Field>

        <Field label="Vị trí" error={errors.location}>
          <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
            className="input-field" placeholder="VD: Tầng 1, Tòa A" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Sức chứa">
            <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
              className="input-field" min="1" />
          </Field>
          <Field label="Trạng thái">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Lab['status'] })}
              className="input-field">
              <option value="active">Hoạt động</option>
              <option value="maintenance">Bảo trì</option>
              <option value="closed">Đóng cửa</option>
            </select>
          </Field>
        </div>

        <Field label="Mô tả" error={errors.description}>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field" rows={3} placeholder="Mô tả về phòng máy..." />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={isLoading} className="btn-primary flex-1">{isLoading ? 'Đang lưu...' : 'Lưu'}</button>
          <button type="button" onClick={() => navigate('/labs')} className="btn-secondary">Hủy</button>
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
