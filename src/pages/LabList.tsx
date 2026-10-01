import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { useLabs, useDeleteLab } from '../hooks/useQueries';

export default function LabList() {
  const [search, setSearch] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const { isStaff } = useAuth();
  const { showToast } = useToast();
  const { data: labs = [], isLoading } = useLabs();
  const { mutateAsync: deleteLab } = useDeleteLab();

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteLab(confirmDelete.id);
      setConfirmDelete(null);
      showToast('Đã xóa phòng máy', 'success');
    } catch {
      showToast('Xóa phòng máy thất bại', 'error');
    }
  };

  const filtered = labs.filter(
    (l) => l.name.toLowerCase().includes(search.toLowerCase()) || l.location.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Phòng máy</h1>
        {isStaff && (
          <Link to="/labs/new" className="btn-primary">
            + Thêm mới
          </Link>
        )}
      </div>

      <label htmlFor="lab-search" className="sr-only">Tìm phòng máy</label>
      <input
        id="lab-search"
        type="text"
        placeholder="Tìm kiếm..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
      />

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Tên phòng</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Vị trí</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Sức chứa</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((lab) => (
              <tr key={lab.id} className="hover:bg-gray-50 transition">
                <td className="px-5 py-4">
                  <Link to={`/labs/${lab.id}`} className="font-medium text-gray-800 hover:text-emerald-700">{lab.name}</Link>
                </td>
                <td className="px-5 py-4 text-sm text-gray-500 hidden sm:table-cell">{lab.location}</td>
                <td className="px-5 py-4 text-sm text-gray-500 hidden md:table-cell">{lab.capacity} máy</td>
                <td className="px-5 py-4">
                  <StatusBadge status={lab.status} />
                </td>
                <td className="px-5 py-4 text-right space-x-3">
                  <Link to={`/labs/${lab.id}`} className="text-sm text-emerald-700 hover:text-red-600">Xem</Link>
                  {isStaff && (
                    <>
                      <Link to={`/labs/edit/${lab.id}`} className="text-sm text-green-500 hover:text-green-600">Sửa</Link>
                      <button onClick={() => setConfirmDelete({ id: lab.id, name: lab.name })} className="text-sm text-red-500 hover:text-red-600">Xóa</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center py-8 text-gray-400">Không tìm thấy phòng máy</p>}
      </div>

      {confirmDelete && (
        <ConfirmDialog title={`Xóa "${confirmDelete.name}"?`} message="Phòng máy sẽ bị xóa. Các thiết bị, lịch đặt và sự cố liên quan sẽ không bị xóa." onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-50 text-green-600',
    maintenance: 'bg-yellow-50 text-yellow-600',
    closed: 'bg-red-50 text-red-600',
  };
  const labels: Record<string, string> = {
    active: 'Hoạt động',
    maintenance: 'Bảo trì',
    closed: 'Đóng cửa',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
}

function Loader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );
}
