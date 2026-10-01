import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDevices, useLabs, useDeleteDevice } from '../hooks/useQueries';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

const typeIcons: Record<string, string> = {
  desktop: '🖥️',
  laptop: '💻',
  printer: '🖨️',
  projector: '📽️',
};

const typeLabels: Record<string, string> = {
  desktop: 'Desktop',
  laptop: 'Laptop',
  printer: 'Máy in',
  projector: 'Máy chiếu',
};

export default function DeviceList() {
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const { data: labs = [], isLoading: labsLoading } = useLabs();
  const { mutateAsync: deleteDevice } = useDeleteDevice();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null);
  const { isStaff } = useAuth();
  const { showToast } = useToast();

  const loading = devicesLoading || labsLoading;

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteDevice(confirmDelete.id);
      setConfirmDelete(null);
      showToast('Đã xóa thiết bị', 'success');
    } catch {
      showToast('Xóa thiết bị thất bại', 'error');
    }
  };

  const getLabName = (labId: number) => labs.find((l) => l.id === labId)?.name || '-';

  const filtered = devices.filter((d) => {
    const matchSearch = (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
                        (d.specification || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchType = typeFilter === 'all' || d.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const stats = {
    total: devices.length,
    working: devices.filter((d) => d.status === 'working').length,
    error: devices.filter((d) => d.status === 'error').length,
    maintenance: devices.filter((d) => d.status === 'maintenance').length,
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Danh sách thiết bị</h1>
          <p className="text-sm text-gray-400 mt-1">Quản lý tình trạng hoạt động của máy</p>
        </div>
        {isStaff && (
          <Link to="/devices/new" className="btn-primary">
            + Thêm thiết bị
          </Link>
        )}
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-xs text-gray-400">Tổng cộng</p>
        </div>
        <div className="bg-white rounded-xl border border-green-200 p-3 text-center">
          <p className="text-2xl font-bold text-green-500">{stats.working}</p>
          <p className="text-xs text-gray-400">Hoạt động</p>
        </div>
        <div className="bg-white rounded-xl border border-red-200 p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{stats.error}</p>
          <p className="text-xs text-gray-400">Lỗi</p>
        </div>
        <div className="bg-white rounded-xl border border-yellow-200 p-3 text-center">
          <p className="text-2xl font-bold text-yellow-500">{stats.maintenance}</p>
          <p className="text-xs text-gray-400">Bảo trì</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <label htmlFor="device-search" className="sr-only">Tìm thiết bị</label>
        <input
          id="device-search"
          type="text"
          placeholder="Tìm tên máy, thông số..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <label htmlFor="device-status" className="sr-only">Trạng thái</label>
        <select id="device-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="all">Tất cả trạng thái</option>
          <option value="working">Hoạt động</option>
          <option value="error">Lỗi</option>
          <option value="maintenance">Bảo trì</option>
        </select>
        <label htmlFor="device-type" className="sr-only">Loại thiết bị</label>
        <select id="device-type" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="all">Tất cả loại</option>
          <option value="desktop">Desktop</option>
          <option value="laptop">Laptop</option>
          <option value="printer">Máy in</option>
          <option value="projector">Máy chiếu</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thiết bị</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Loại</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Phòng máy</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thông số</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((device) => (
                <tr key={device.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{typeIcons[device.type] || '📦'}</span>
                      <span className="font-medium text-gray-800">{device.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{typeLabels[device.type] || device.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{getLabName(device.labId)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate" title={device.specification}>
                    {device.specification}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusBadge status={device.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/labs/${device.labId}`} className="text-xs text-emerald-700 hover:text-red-600 px-2 py-1 rounded bg-emerald-50">
                        Xem
                      </Link>
                      {isStaff && (
                        <>
                          <Link to={`/devices/edit/${device.id}`} className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded bg-green-50">
                            Sửa
                          </Link>
                          <button onClick={() => setConfirmDelete({ id: device.id, name: device.name })} className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded bg-red-50">
                            Xóa
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-gray-400">Không tìm thấy thiết bị</p>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-400 text-right">
        Hiển thị {filtered.length} / {devices.length} thiết bị
      </div>

      {confirmDelete && (
        <ConfirmDialog title={`Xóa "${confirmDelete.name}"?`} message="Thiết bị sẽ bị xóa vĩnh viễn. Các sự cố và lịch bảo trì liên quan sẽ không bị xóa." onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    working: 'bg-green-100 text-green-700 border border-green-200',
    error: 'bg-red-100 text-red-700 border border-red-200',
    maintenance: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  };
  const labels: Record<string, string> = {
    working: '✓ Hoạt động',
    error: '✗ Lỗi',
    maintenance: 'Đang bảo trì',
  };
  const icons: Record<string, string> = {
    working: '🟢',
    error: '🔴',
    maintenance: '🟡',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || ''}`}>
      <span>{icons[status]}</span>
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
