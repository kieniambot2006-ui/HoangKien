import { useLabs } from '../hooks/useQueries';
import { useDevices } from '../hooks/useQueries';
import { useIncidents } from '../hooks/useQueries';
import { useMaintenanceLogs } from '../hooks/useQueries';

export default function Statistics() {
  const { data: labs = [], isLoading: loadingLabs } = useLabs();
  const { data: devices = [], isLoading: loadingDevices } = useDevices();
  const { data: incidents = [], isLoading: loadingIncidents } = useIncidents();
  const { data: maintenanceLogs = [], isLoading: loadingMaintenance } = useMaintenanceLogs();

  if (loadingLabs || loadingDevices || loadingIncidents || loadingMaintenance) return <Loader />;

  const workingDevices = devices.filter((d) => d.status === 'working').length;
  const errorDevices = devices.filter((d) => d.status === 'error').length;
  const resolvedIncidents = incidents.filter((i) => i.status === 'resolved' && i.resolvedAt);
  const avgTime = resolvedIncidents.length > 0
    ? resolvedIncidents.reduce((sum, i) => sum + (new Date(i.resolvedAt!).getTime() - new Date(i.reportedAt).getTime()), 0) / resolvedIncidents.length / 3600000
    : 0;
  const totalCost = maintenanceLogs.reduce((sum, l) => sum + l.cost, 0);

  const labStats = labs.map((lab) => {
    const labDevices = devices.filter((d) => d.labId === lab.id);
    return {
      ...lab,
      total: labDevices.length,
      working: labDevices.filter((d) => d.status === 'working').length,
      error: labDevices.filter((d) => d.status === 'error').length,
    };
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Thống kê</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card title="Tổng thiết bị" value={devices.length} icon="💻" color="blue" />
        <Card title="Đang hoạt động" value={workingDevices} icon="✅" color="green" />
        <Card title="Lỗi" value={errorDevices} icon="⚠️" color="red" />
        <Card title="Chi phí bảo trì" value={`${(totalCost / 1000000).toFixed(1)}M`} icon="💰" color="purple" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Tỷ lệ máy theo phòng</h2>
          <div className="space-y-4">
            {labStats.filter((l) => l.status === 'active').map((lab) => {
              const percent = lab.total > 0 ? Math.round((lab.working / lab.total) * 100) : 0;
              return (
                <div key={lab.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{lab.name}</span>
                    <span className="text-gray-400">{lab.working}/{lab.total}</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${percent >= 80 ? 'bg-green-400' : percent >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`}
                      style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Thống kê sự cố</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-yellow-50 rounded-xl">
              <p className="text-2xl font-bold text-yellow-600">{incidents.filter((i) => i.status === 'pending').length}</p>
              <p className="text-xs text-gray-400">Chờ xử lý</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">{incidents.filter((i) => i.status === 'in-progress').length}</p>
              <p className="text-xs text-gray-400">Đang xử lý</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{incidents.filter((i) => i.status === 'resolved').length}</p>
              <p className="text-xs text-gray-400">Đã giải quyết</p>
            </div>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Thời gian xử lý TB</span>
              <span className="font-medium">{avgTime.toFixed(1)} giờ</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Chi tiết theo phòng</h2>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Phòng</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Tổng</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">OK</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Lỗi</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Tỷ lệ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {labStats.filter((l) => l.status === 'active').map((lab) => {
              const percent = lab.total > 0 ? Math.round((lab.error / lab.total) * 100) : 0;
              return (
                <tr key={lab.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium">{lab.name}</td>
                  <td className="px-5 py-3 text-gray-500">{lab.total}</td>
                  <td className="px-5 py-3 text-green-500">{lab.working}</td>
                  <td className="px-5 py-3 text-red-500">{lab.error}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="bg-red-400 h-full rounded-full" style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{percent}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
        <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${colors[color]}`}>{icon}</span>
      </div>
    </div>
  );
}

function Loader() {
  return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" /></div>;
}
