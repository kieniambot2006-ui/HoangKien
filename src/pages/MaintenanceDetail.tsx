import { useParams, Link } from 'react-router-dom';
import { useMaintenanceLog, useDevice } from '../hooks/useQueries';

export default function MaintenanceDetail() {
  const { id } = useParams();
  const { data: log, isLoading } = useMaintenanceLog(Number(id));
  const { data: device } = useDevice(log?.deviceId ?? 0, { enabled: !!log?.deviceId });

  if (isLoading) return <Loader />;
  if (!log) return <p className="text-center py-8 text-gray-400">Không tìm thấy</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/maintenance" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-2xl font-semibold text-gray-800">Chi tiết bảo trì</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <Row label="Thiết bị" value={device?.name || '-'} />
        <Row label="Loại" value={log.type === 'repair' ? 'Sửa chữa' : log.type === 'maintenance' ? 'Bảo trì' : 'Nâng cấp'} />
        <Row label="Trạng thái" value={log.status === 'pending' ? 'Chờ xử lý' : log.status === 'in-progress' ? 'Đang thực hiện' : 'Hoàn thành'} />
        <Row label="Người thực hiện" value={log.performedBy || '-'} />
        <div><p className="text-sm text-gray-400 mb-1">Mô tả</p><p className="text-gray-700">{log.description}</p></div>
        {log.parts && <Row label="Linh kiện" value={log.parts} />}
        <Row label="Chi phí" value={log.cost > 0 ? `${log.cost.toLocaleString('vi-VN')}đ` : '-'} />
        {log.startDate && <Row label="Bắt đầu" value={new Date(log.startDate).toLocaleString('vi-VN')} />}
        {log.endDate && <Row label="Hoàn thành" value={new Date(log.endDate).toLocaleString('vi-VN')} />}
        {log.notes && <Row label="Ghi chú" value={log.notes} />}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-700">{value}</span>
    </div>
  );
}

function Loader() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" /></div>;
}
