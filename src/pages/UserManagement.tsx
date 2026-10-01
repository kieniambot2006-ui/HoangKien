import { useState } from 'react';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useQueries';
import type { User } from '../types';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

export default function UserManagement() {
  const { data: users = [], isLoading: loading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const { showToast } = useToast();

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteUser.mutateAsync(confirmDelete.id);
      setConfirmDelete(null);
      showToast('Đã xóa tài khoản', 'success');
    } catch {
      showToast('Xóa tài khoản thất bại', 'error');
    }
  };

  const handleSave = async (data: Omit<User, 'id'>) => {
    try {
      if (editUser) {
        await updateUser.mutateAsync({ id: editUser.id, data });
      } else {
        await createUser.mutateAsync(data);
      }
      setShowForm(false);
      setEditUser(null);
      showToast(editUser ? 'Đã cập nhật' : 'Đã tạo tài khoản', 'success');
    } catch {
      showToast('Thao tác thất bại', 'error');
    }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý tài khoản</h1>
          <p className="text-sm text-gray-400 mt-1">Tạo và phân quyền người dùng</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditUser(null); }} className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600">+ Thêm tài khoản</button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Họ tên</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Vai trò</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">{u.name.charAt(0)}</div>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-gray-500">{u.email}</td>
                <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-5 py-3 text-right space-x-3">
                  <button onClick={() => { setEditUser(u); setShowForm(true); }} className="text-sm text-green-500 hover:text-green-600">Sửa</button>
                  <button onClick={() => setConfirmDelete({ id: u.id, name: u.name })} className="text-sm text-red-500 hover:text-red-600">Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <UserForm user={editUser} onSave={handleSave} onClose={() => { setShowForm(false); setEditUser(null); }} />
      )}

      {confirmDelete && (
        <ConfirmDialog title={`Xóa "${confirmDelete.name}"?`} message="Tài khoản sẽ bị xóa vĩnh viễn." onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}

function UserForm({ user, onSave, onClose }: { user: User | null; onSave: (data: Omit<User, 'id'>) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', password: user?.password || '',
    role: (user?.role || 'student') as User['role'], phone: user?.phone || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Bắt buộc';
    if (!form.email.trim()) e.email = 'Bắt buộc';
    if (!user && !form.password.trim()) e.password = 'Bắt buộc';
    if (form.email && !form.email.includes('@')) e.email = 'Email không hợp lệ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="user-form-title">
      <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 id="user-form-title" className="text-lg font-bold mb-4">{user ? 'Sửa tài khoản' : 'Tạo tài khoản mới'}</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Họ tên" error={errors.name}>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </Field>
          <Field label="Email" error={errors.email}>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" />
          </Field>
          {!user && (
            <Field label="Mật khẩu" error={errors.password}>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" />
            </Field>
          )}
          <Field label="Vai trò">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as User['role'] })} className="input-field">
              <option value="admin">Quản trị viên</option>
              <option value="staff">Kỹ thuật viên</option>
              <option value="teacher">Giảng viên</option>
              <option value="student">Sinh viên</option>
            </select>
          </Field>
          <Field label="Số điện thoại">
            <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" />
          </Field>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Lưu</button>
            <button type="button" onClick={onClose} className="btn-secondary">Hủy</button>
          </div>
        </form>
      </div>
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

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: 'bg-purple-50 text-purple-600',
    staff: 'bg-blue-50 text-blue-600',
    teacher: 'bg-green-50 text-green-600',
    student: 'bg-gray-50 text-gray-600',
  };
  const labels: Record<string, string> = {
    admin: 'Quản trị',
    staff: 'Kỹ thuật',
    teacher: 'Giảng viên',
    student: 'Sinh viên',
  };
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[role] || ''}`}>{labels[role] || role}</span>;
}

function Loader() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" /></div>;
}
