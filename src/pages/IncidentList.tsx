import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useIncidents, useDevices, useLabs, useUpdateIncident, useDeleteIncident, useUpdateDevice } from '../hooks/useQueries';
import type { Incident } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from '../components/ConfirmDialog';

export default function IncidentList() {
  const { data: incidents = [], isLoading: incidentsLoading } = useIncidents();
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const { data: labs = [], isLoading: labsLoading } = useLabs();
  const { mutateAsync: updateIncident } = useUpdateIncident();
  const { mutateAsync: deleteIncident } = useDeleteIncident();
  const { mutateAsync: updateDevice } = useUpdateDevice();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [labFilter, setLabFilter] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const { isStaff } = useAuth();
  const { showToast } = useToast();

  const handleDelete = async (id: number) => {
    try {
      const inc = incidents.find((i) => i.id === id);
      await deleteIncident(id);
      if (inc) {
        const otherOpen = incidents.filter((i) => i.deviceId === inc.deviceId && i.id !== id && i.status !== 'resolved');
        if (otherOpen.length === 0) {
          try { await updateDevice({ id: inc.deviceId, data: { status: 'working' } }); } catch {}
        }
      }
      setConfirmDeleteId(null);
      showToast('Đã xóa sự cố', 'success');
    } catch {
      showToast('Xóa sự cố thất bại', 'error');
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const updates: Partial<Incident> = { status: status as Incident['status'] };
    if (status === 'resolved') updates.resolvedAt = new Date().toISOString();

    try {
      await updateIncident({ id, data: updates });
      if (status === 'resolved') {
        const inc = incidents.find((i) => i.id === id);
        if (inc) {
          const otherOpen = incidents.filter((i) => i.deviceId === inc.deviceId && i.id !== id && i.status !== 'resolved');
          if (otherOpen.length === 0) {
            try { await updateDevice({ id: inc.deviceId, data: { status: 'working' } }); } catch {}
          }
        }
      }
      showToast('Đã cập nhật', 'success');
    } catch {
      showToast('Cập nhật thất bại', 'error');
    }
  };

  const getDevice = (deviceId: number) => devices.find((d) => d.id === deviceId);
  const getLab = (labId: number) => labs.find((l) => l.id === labId);

  const filtered = incidents.filter((i) => {
    const d = getDevice(i.deviceId);
    const matchSearch = (i.description || '').toLowerCase().includes(search.toLowerCase()) || d?.name?.toLowerCase().includes(search.toLowerCase()) || (i.reportedBy || '').toLowerCase().includes(search.toLowerCase()) || (i.assignedTo && i.assignedTo.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === 'all' || i.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || i.priority === priorityFilter;
    const matchLab = labFilter === 0 || i.labId === labFilter;
    return matchSearch && matchStatus && matchPriority && matchLab;
  });

  const stats = {
    pending: incidents.filter((i) => i.status === 'pending').length,
    inProgress: incidents.filter((i) => i.status === 'in-progress').length,
    resolved: incidents.filter((i) => i.status === 'resolved').length,
  };

  if (incidentsLoading || devicesLoading || labsLoading) return <Loader />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý sự cố</h1>
          <p className="text-sm text-gray-400 mt-1">{stats.pending} chờ xử lý • {stats.inProgress} đang xử lý • {stats.resolved} đã xong</p>
        </div>
        <Link to="/incidents/new" className="btn-danger">+ Báo sự cố</Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <label htmlFor="incident-search" className="sr-only">Tìm kiếm</label>
        <input id="incident-search" type="text" placeholder="Tìm mô tả, người báo, KTV..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <label htmlFor="incident-status" className="sr-only">Trạng thái</label>
        <select id="incident-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto">
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="in-progress">Đang xử lý</option>
          <option value="resolved">Đã giải quyết</option>
        </select>
        <label htmlFor="incident-priority" className="sr-only">Ưu tiên</label>
        <select id="incident-priority" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="input-field w-auto">
          <option value="all">Tất cả ưu tiên</option>
          <option value="high">Cao</option>
          <option value="medium">Trung bình</option>
          <option value="low">Thấp</option>
        </select>
        <label htmlFor="incident-lab" className="sr-only">Phòng</label>
        <select id="incident-lab" value={labFilter} onChange={(e) => setLabFilter(Number(e.target.value))} className="input-field w-auto">
          <option value={0}>Tất cả phòng</option>
          {labs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      <div className="space-y-2">
        {filtered.map((inc) => {
          const device = getDevice(inc.deviceId);
          const lab = getLab(inc.labId);
          return (
            <div key={inc.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-sm transition">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      inc.priority === 'high' ? 'bg-red-100 text-red-700' : inc.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'
                    }`}>{inc.priority === 'high' ? '🔴 Cao' : inc.priority === 'medium' ? '🟡 TB' : '⚪ Thấp'}</span>
                    <StatusBadge status={inc.status} />
                  </div>
                  <p className="font-medium text-gray-800 text-sm">{inc.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-400">
                    <span>💻 {device?.name || 'N/A'}</span>
                    <span>🏢 {lab?.name || 'N/A'}</span>
                    <span>👤 {inc.reportedBy}</span>
                    {inc.assignedTo && <span className="text-emerald-700">🔧 {inc.assignedTo}</span>}
                    <span>📅 {new Date(inc.reportedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <Link to={`/incidents/${inc.id}`} className="text-xs text-emerald-700 hover:text-red-600 px-2 py-1 rounded bg-emerald-50">Chi tiết</Link>
                  {isStaff && inc.status !== 'resolved' && (
                    <button onClick={() => handleStatusChange(inc.id, inc.status === 'pending' ? 'in-progress' : 'resolved')}
                      className="text-xs text-green-600 hover:text-green-700 px-2 py-1 rounded bg-green-50">
                      {inc.status === 'pending' ? 'Xử lý' : 'Hoàn thành'}
                    </button>
                  )}
                  {isStaff && <button onClick={() => setConfirmDeleteId(inc.id)} className="text-xs text-red-500 hover:text-red-600 px-2 py-1 rounded bg-red-50">Xóa</button>}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-100">Không tìm thấy sự cố</p>}
      </div>

      {confirmDeleteId && (
        <ConfirmDialog title="Xóa sự cố?" message="Hành động này không thể hoàn tác. Sự cố sẽ bị xóa vĩnh viễn." onConfirm={() => handleDelete(confirmDeleteId)} onCancel={() => setConfirmDeleteId(null)} />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-600',
    'in-progress': 'bg-emerald-50 text-emerald-700',
    resolved: 'bg-green-50 text-green-600',
  };
  const labels: Record<string, string> = { pending: '⏳ Chờ xử lý', 'in-progress': '🔄 Đang xử lý', resolved: '✅ Đã giải quyết' };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${styles[status] || ''}`}>{labels[status] || status}</span>;
}

function Loader() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" /></div>;
}
