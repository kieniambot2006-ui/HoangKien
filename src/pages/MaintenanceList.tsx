import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMaintenanceLogs, useDevices, useDeleteMaintenanceLog, useUpdateDevice } from '../hooks/useQueries';
import type { MaintenanceLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

export default function MaintenanceList() {
  const { data: logs = [], isLoading: logsLoading } = useMaintenanceLogs();
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const { mutateAsync: deleteLog } = useDeleteMaintenanceLog();
  const { mutateAsync: updateDevice } = useUpdateDevice();
  const [statusFilter, setStatusFilter] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const { isStaff } = useAuth();
  const { showToast } = useToast();

  const loading = logsLoading || devicesLoading;

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const log = logs.find((l) => l.id === confirmDeleteId);
      await deleteLog(confirmDeleteId);
      if (log && log.status !== 'completed') {
        const otherActive = logs.filter((l) => l.deviceId === log.deviceId && l.id !== confirmDeleteId && l.status !== 'completed');
        if (otherActive.length === 0) {
          try { await updateDevice({ id: log.deviceId, data: { status: 'working' } }); } catch {}
        }
      }
      setConfirmDeleteId(null);
      showToast('Đã xóa bản ghi', 'success');
    } catch {
      showToast('Xóa bản ghi thất bại', 'error');
    }
  };

  const getDeviceName = (deviceId: number) => devices.find((d) => d.id === deviceId)?.name || '-';
  const filtered = logs.filter((l: MaintenanceLog) => statusFilter === 'all' || l.status === statusFilter);
  const totalCost = filtered.reduce((sum, l: MaintenanceLog) => sum + l.cost, 0);

  if (loading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Nhật ký bảo trì</h1>
        {isStaff && <Link to="/maintenance/new" className="btn-primary">+ Thêm mới</Link>}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{logs.length}</p>
          <p className="text-xs text-gray-400">Tổng bản ghi</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{logs.filter((l: MaintenanceLog) => l.status === 'in-progress').length}</p>
          <p className="text-xs text-gray-400">Đang thực hiện</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-500">{totalCost.toLocaleString('vi-VN')}đ</p>
          <p className="text-xs text-gray-400">Tổng chi phí</p>
        </div>
      </div>

      <label htmlFor="maintenance-status" className="sr-only">Trạng thái</label>
      <select id="maintenance-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-2 border border-gray-200 rounded-lg text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500">
        <option value="all">Tất cả trạng thái</option>
        <option value="pending">Chờ xử lý</option>
        <option value="in-progress">Đang thực hiện</option>
        <option value="completed">Hoàn thành</option>
      </select>

      <div className="space-y-3">
        {filtered.map((log) => (
          <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TypeBadge type={log.type} />
                  <StatusBadge status={log.status} />
                </div>
                <p className="font-medium text-gray-800">{getDeviceName(log.deviceId)}</p>
                <p className="text-sm text-gray-500 truncate max-w-md">{log.description}</p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium text-gray-800">{log.cost > 0 ? `${log.cost.toLocaleString('vi-VN')}đ` : '-'}</p>
                <p className="text-xs text-gray-400">{log.performedBy || 'Chưa phân công'}</p>
                <div className="flex gap-2 mt-2">
                  <Link to={`/maintenance/${log.id}`} className="text-emerald-700 hover:text-red-600">Chi tiết</Link>
                  {isStaff && <button onClick={() => setConfirmDeleteId(log.id)} className="text-red-500 hover:text-red-600">Xóa</button>}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-center py-8 text-gray-400 bg-white rounded-xl border border-gray-100">Không có bản ghi</p>}
      </div>

      {confirmDeleteId && (
        <ConfirmDialog title="Xóa bản ghi bảo trì?" message="Bản ghi bảo trì sẽ bị xóa vĩnh viễn." onConfirm={handleDelete} onCancel={() => setConfirmDeleteId(null)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = { pending: 'bg-yellow-50 text-yellow-600', 'in-progress': 'bg-emerald-50 text-emerald-700', completed: 'bg-green-50 text-green-600' };
  const labels: Record<string, string> = { pending: 'Chờ xử lý', 'in-progress': 'Đang thực hiện', completed: 'Hoàn thành' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status] || ''}`}>{labels[status] || status}</span>;
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = { repair: 'bg-red-50 text-red-600', maintenance: 'bg-emerald-50 text-emerald-700', upgrade: 'bg-purple-50 text-purple-600' };
  const labels: Record<string, string> = { repair: 'Sửa chữa', maintenance: 'Bảo trì', upgrade: 'Nâng cấp' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[type] || ''}`}>{labels[type] || type}</span>;
}

function Loader() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" /></div>;
}
