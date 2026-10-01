import { useParams, Link } from 'react-router-dom';
import { useIncident, useDevice, useLab } from '../hooks/useQueries';

export default function IncidentDetail() {
  const { id } = useParams();
  const { data: incident, isLoading } = useIncident(Number(id));
  const { data: device } = useDevice(incident?.deviceId ?? 0, { enabled: !!incident?.deviceId });
  const { data: lab } = useLab(incident?.labId ?? 0, { enabled: !!incident?.labId });

  if (isLoading) return <Loader />;
  if (!incident) return <p className="text-center py-8 text-gray-400">Không tìm thấy</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/incidents" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-2xl font-semibold text-gray-800">Chi tiết sự cố</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        <Row label="Thiết bị" value={device?.name || '-'} />
        <Row label="Phòng" value={lab?.name || '-'} />
        <Row label="Ưu tiên" value={incident.priority === 'high' ? 'Cao' : incident.priority === 'medium' ? 'Trung bình' : 'Thấp'} />
        <Row label="Trạng thái" value={incident.status === 'pending' ? 'Chờ xử lý' : incident.status === 'in-progress' ? 'Đang xử lý' : 'Đã giải quyết'} />
        <div>
          <p className="text-sm text-gray-400 mb-1">Mô tả</p>
          <p className="text-gray-700">{incident.description}</p>
        </div>
        {incident.imageUrl && <img src={incident.imageUrl} alt="" className="w-full max-w-sm rounded-lg" />}
        <Row label="Người báo" value={incident.reportedBy} />
        {incident.assignedTo && <Row label="KTV phụ trách" value={incident.assignedTo} />}
        <Row label="Ngày báo" value={new Date(incident.reportedAt).toLocaleString('vi-VN')} />
        {incident.resolvedAt && <Row label="Ngày giải quyết" value={new Date(incident.resolvedAt).toLocaleString('vi-VN')} />}
        {incident.note && <Row label="Ghi chú" value={incident.note} />}
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
