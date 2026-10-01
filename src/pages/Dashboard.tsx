import { Link } from 'react-router-dom';
import { useDevices, useIncidents, useLabs, useMaintenanceLogs } from '../hooks/useQueries';
import { useAuth } from '../context/AuthContext';
import type { Device, Incident, Lab } from '../types';

export default function Dashboard() {
  const { isStaff } = useAuth();
  const { data: labs = [], isLoading: labsLoading, error: labsError } = useLabs();
  const { data: devices = [], isLoading: devicesLoading, error: devicesError } = useDevices();
  const { data: incidents = [], isLoading: incidentsLoading, error: incidentsError } = useIncidents();
  const { data: maintenanceLogs = [], isLoading: maintenanceLoading, error: maintenanceError } = useMaintenanceLogs();

  const loading = labsLoading || devicesLoading || incidentsLoading || maintenanceLoading;
  const error = labsError || devicesError || incidentsError || maintenanceError;

  if (loading) return <Loader />;
  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8 text-center">
        <p className="font-semibold text-red-600">Không thể tải dữ liệu demo.</p>
        <p className="mt-1 text-sm text-gray-500">Hãy chạy `npm run server` rồi tải lại trang.</p>
        <button onClick={() => window.location.reload()} className="btn-primary mt-4">Thử lại</button>
      </div>
    );
  }

  const workingDevices = devices.filter((device) => device.status === 'working').length;
  const errorDevices = devices.filter((device) => device.status === 'error').length;
  const maintenanceDevices = devices.filter((device) => device.status === 'maintenance').length;
  const openIncidents = incidents.filter((incident) => incident.status !== 'resolved');
  const pendingIncidents = incidents.filter((incident) => incident.status === 'pending');
  const activeMaintenance = maintenanceLogs.filter((log) => log.status !== 'completed').length;
  const recentIncidents = [...openIncidents]
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="hidden h-16 w-20 items-center justify-center rounded-2xl border border-emerald-100 bg-white shadow-sm sm:flex">
              <img src="/logobachkhoa.png" alt="BK" className="h-12 w-auto object-contain" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-red-600">Đề tài project</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
                Quản lý phòng máy thực hành và sự cố thiết bị
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
                Hệ thống giúp theo dõi phòng máy, tình trạng thiết bị, tiếp nhận báo cáo sự cố và ghi nhận quá trình sửa chữa.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/incidents/new" className="btn-danger">Báo sự cố</Link>
            <Link to="/devices" className="btn-secondary">Xem thiết bị</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Phòng máy" value={labs.length} hint={`${labs.filter((lab) => lab.status === 'active').length} đang dùng`} tone="green" />
        <MetricCard label="Thiết bị" value={devices.length} hint={`${workingDevices} hoạt động tốt`} tone="slate" />
        <MetricCard label="Máy đang lỗi" value={errorDevices} hint={`${maintenanceDevices} đang bảo trì`} tone="red" />
        <MetricCard label="Sự cố chờ xử lý" value={pendingIncidents.length} hint={`${openIncidents.length} chưa hoàn tất`} tone="yellow" />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-gray-900">Sự cố cần theo dõi</h2>
              <p className="text-sm text-gray-400">Danh sách này là phần dễ demo nhất khi thuyết trình.</p>
            </div>
            <Link to="/incidents" className="text-sm font-semibold text-emerald-700 hover:text-red-600">Xem tất cả</Link>
          </div>

          <div className="space-y-3">
            {recentIncidents.map((incident) => (
              <IncidentRow
                key={incident.id}
                incident={incident}
                device={devices.find((device) => device.id === incident.deviceId)}
                lab={labs.find((lab) => lab.id === incident.labId)}
              />
            ))}
            {recentIncidents.length === 0 && (
              <div className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/60 p-5 text-center">
                <p className="font-semibold text-emerald-700">Hiện không có sự cố mở</p>
                <p className="mt-1 text-sm text-emerald-700/70">Tất cả thiết bị đã được xử lý ổn định.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-gray-900">Quy trình xử lý</h2>
            <div className="mt-4 space-y-3">
              <ProcessStep step="1" title="Báo sự cố" text="Giảng viên hoặc sinh viên chọn thiết bị và mô tả lỗi." />
              <ProcessStep step="2" title="Kỹ thuật viên tiếp nhận" text="Cập nhật trạng thái đang xử lý, phân công người phụ trách." />
              <ProcessStep step="3" title="Hoàn tất sửa chữa" text="Ghi chú kết quả, đưa thiết bị về trạng thái hoạt động." />
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-gray-900">Bảo trì hôm nay</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SmallStat label="Đang làm" value={activeMaintenance} />
              <SmallStat label="Đã ghi nhận" value={maintenanceLogs.length} />
            </div>
            {isStaff ? (
              <Link to="/maintenance" className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-red-600">
                Mở nhật ký bảo trì →
              </Link>
            ) : (
              <p className="mt-4 text-sm text-gray-500">Kỹ thuật viên cập nhật nhật ký bảo trì sau khi xử lý.</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-gray-900">Tình trạng từng phòng máy</h2>
            <p className="text-sm text-gray-400">Dùng phần này để trình bày hệ thống theo dõi thiết bị theo phòng.</p>
          </div>
          <Link to="/labs" className="text-sm font-semibold text-emerald-700 hover:text-red-600">Quản lý phòng</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {labs.map((lab) => (
            <LabHealthCard key={lab.id} lab={lab} devices={devices.filter((device) => device.labId === lab.id)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, hint, tone }: { label: string; value: number; hint: string; tone: 'green' | 'slate' | 'red' | 'yellow' }) {
  const tones = {
    green: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    slate: 'border-slate-100 bg-slate-50 text-slate-700',
    red: 'border-red-100 bg-red-50 text-red-600',
    yellow: 'border-yellow-100 bg-yellow-50 text-yellow-700',
  };

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-sm font-semibold opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-70">{hint}</p>
    </div>
  );
}

function IncidentRow({ incident, device, lab }: { incident: Incident; device?: Device; lab?: Lab }) {
  const priorityClass = incident.priority === 'high' ? 'bg-red-100 text-red-700' : incident.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600';
  const statusText = incident.status === 'pending' ? 'Chờ xử lý' : 'Đang xử lý';

  return (
    <Link to={`/incidents/${incident.id}`} className="block rounded-xl border border-gray-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${priorityClass}`}>
          {incident.priority === 'high' ? 'Ưu tiên cao' : incident.priority === 'medium' ? 'Ưu tiên TB' : 'Ưu tiên thấp'}
        </span>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600">{statusText}</span>
      </div>
      <p className="mt-3 font-semibold text-gray-800">{incident.description}</p>
      <p className="mt-2 text-sm text-gray-500">
        {device?.name || 'Thiết bị'} • {lab?.name || 'Phòng máy'} • {incident.reportedBy}
      </p>
    </Link>
  );
}

function ProcessStep({ step, title, text }: { step: string; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">{step}</span>
      <div>
        <p className="font-semibold text-gray-800">{title}</p>
        <p className="text-sm leading-5 text-gray-500">{text}</p>
      </div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function LabHealthCard({ lab, devices }: { lab: Lab; devices: Device[] }) {
  const working = devices.filter((device) => device.status === 'working').length;
  const error = devices.filter((device) => device.status === 'error').length;
  const maintenance = devices.filter((device) => device.status === 'maintenance').length;
  const percent = devices.length ? Math.round((working / devices.length) * 100) : 0;

  return (
    <Link to={`/labs/${lab.id}`} className="rounded-xl border border-gray-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-gray-900">{lab.name}</p>
          <p className="text-sm text-gray-500">{lab.location}</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{percent}% OK</span>
      </div>
      <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-gray-100">
        <span className="bg-emerald-500" style={{ width: `${devices.length ? (working / devices.length) * 100 : 0}%` }} />
        <span className="bg-red-500" style={{ width: `${devices.length ? (error / devices.length) * 100 : 0}%` }} />
        <span className="bg-yellow-400" style={{ width: `${devices.length ? (maintenance / devices.length) * 100 : 0}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
        <span>{working} hoạt động</span>
        <span>{error} lỗi</span>
        <span>{maintenance} bảo trì</span>
      </div>
    </Link>
  );
}

function Loader() {
  return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-600" />
    </div>
  );
}
