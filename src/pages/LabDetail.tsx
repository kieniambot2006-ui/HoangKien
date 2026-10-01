import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { Device, Incident, MaintenanceLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLab, useDevicesByLab } from '../hooks/useQueries';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../hooks/useQueries';
import { useToast } from '../context/ToastContext';

const typeIcons: Record<string, string> = { desktop: '🖥️', laptop: '💻', printer: '🖨️', projector: '📽️' };
const CELL = 80;

const defaultSpecs = [
  'Intel Core i5-12400, 8GB RAM, 256GB SSD',
  'Intel Core i3-12100, 8GB RAM, 512GB SSD',
  'Intel Core i5-13400, 16GB RAM, 512GB SSD',
  'Intel Core i7-13700, 16GB RAM, 1TB SSD',
  'Intel Core i5-12400, 16GB RAM, 256GB SSD',
];

function generateDevices(labId: number, rows: number, cols: number) {
  const devices: Omit<Device, 'id'>[] = [];
  let idx = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      devices.push({
        name: `PC-${String(idx).padStart(2, '0')}`,
        type: 'desktop',
        labId,
        status: 'working',
        specification: defaultSpecs[idx % defaultSpecs.length],
        position: { row: r, col: c },
      });
      idx++;
    }
  }
  return devices;
}

export default function LabDetail() {
  const { id } = useParams();
  const { isStaff } = useAuth();
  const { showToast } = useToast();
  const { data: lab, isLoading: labLoading } = useLab(Number(id));
  const { data: devices = [], isLoading: devicesLoading } = useDevicesByLab(Number(id));
  const queryClient = useQueryClient();

  const [view, setView] = useState<'list' | 'floor'>('list');
  const [selected, setSelected] = useState<Device | null>(null);
  const [selIncidents, setSelIncidents] = useState<Incident[]>([]);
  const [selLogs, setSelLogs] = useState<MaintenanceLog[]>([]);
  const [editing, setEditing] = useState(false);
  const [dragDev, setDragDev] = useState<Device | null>(null);
  const [localDevices, setLocalDevices] = useState<Device[]>([]);
  const [autoCreating, setAutoCreating] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addType, setAddType] = useState<Device['type']>('desktop');
  const [addSpec, setAddSpec] = useState('');
  const [addSaving, setAddSaving] = useState(false);

  useEffect(() => {
    if (devices.length > 0) {
      setLocalDevices(devices);
      return;
    }
    if (!lab?.floorPlan || devices.length > 0 || autoCreating) return;
    const { rows, cols } = lab.floorPlan;
    setAutoCreating(true);
    (async () => {
      try {
        const newDevices = generateDevices(lab.id, rows, cols);
        await Promise.all(newDevices.map((d) => api.devices.create(d)));
        await queryClient.invalidateQueries({ queryKey: queryKeys.devices });
        showToast(`Đã tự động tạo ${newDevices.length} máy cho ${lab.name}`, 'success');
      } catch {
        showToast('Tạo thiết bị tự động thất bại', 'error');
      } finally {
        setAutoCreating(false);
      }
    })();
  }, [id, devices, lab, autoCreating]);

  const closeModal = useCallback(() => setSelected(null), []);

  useEffect(() => {
    if (!selected) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [selected, closeModal]);

  const clickDevice = async (device: Device) => {
    setSelected(device);
    try {
      const [inc, logs] = await Promise.all([api.incidents.getAll(), api.maintenanceLogs.getByDevice(device.id)]);
      setSelIncidents(inc.filter((i) => i.deviceId === device.id && i.status !== 'resolved'));
      setSelLogs(logs);
    } catch {
      setSelIncidents([]);
      setSelLogs([]);
    }
  };

  const onDragStart = (e: React.DragEvent, dev: Device) => { setDragDev(dev); e.dataTransfer.effectAllowed = 'move'; };
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const onDrop = (e: React.DragEvent, row: number, col: number) => {
    e.preventDefault();
    if (!dragDev) return;
    const occ = localDevices.find((d) => d.position?.row === row && d.position?.col === col && d.id !== dragDev.id);
    if (occ) return;
    setLocalDevices(localDevices.map((d) => {
      if (d.id === dragDev.id) return { ...d, position: { row, col } };
      if (d.position?.row === row && d.position?.col === col) return { ...d, position: dragDev.position };
      return d;
    }));
    setDragDev(null);
  };

  const savePositions = async () => {
    try {
      const devicesToUpdate = localDevices.filter((d) => d.position);
      await Promise.all(
        devicesToUpdate.map((d) => api.devices.update(d.id, { position: d.position }))
      );
      await queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      setEditing(false);
    } catch {
      showToast('Lưu vị trí thất bại', 'error');
    }
  };

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addName.trim() || !lab) return;
    setAddSaving(true);
    try {
      const fp = lab.floorPlan || { rows: 5, cols: 8 };
      const usedPositions = new Set(localDevices.filter((d) => d.position).map((d) => `${d.position!.row},${d.position!.col}`));
      let pos: { row: number; col: number } | undefined;
      for (let r = 0; r < fp.rows; r++) {
        for (let c = 0; c < fp.cols; c++) {
          if (!usedPositions.has(`${r},${c}`)) { pos = { row: r, col: c }; break; }
        }
        if (pos) break;
      }
      await api.devices.create({
        name: addName.trim(),
        type: addType,
        labId: lab.id,
        status: 'working',
        specification: addSpec.trim() || 'Chưa cập nhật',
        position: pos,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.devices });
      setShowAdd(false);
      setAddName('');
      setAddSpec('');
      showToast(`Đã thêm ${addName.trim()}`, 'success');
    } catch {
      showToast('Thêm thiết bị thất bại', 'error');
    } finally {
      setAddSaving(false);
    }
  };

  const loading = labLoading || devicesLoading;
  if (loading) return <Loader />;
  if (!lab) return <Empty />;

  const fp = lab.floorPlan || { rows: 5, cols: 8 };
  const ok = localDevices.filter((d) => d.status === 'working').length;
  const err = localDevices.filter((d) => d.status === 'error').length;
  const fix = localDevices.filter((d) => d.status === 'maintenance').length;

  if (autoCreating) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <Link to="/labs" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{lab.name}</h1>
            <p className="text-sm text-gray-400">Đang tự động tạo thiết bị cho phòng...</p>
          </div>
        </div>
        <Loader />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link to="/labs" className="text-gray-400 hover:text-gray-600 text-lg">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{lab.name}</h1>
            <p className="text-sm text-gray-400">{lab.location} • {lab.capacity} máy</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isStaff && (
            <button onClick={() => setShowAdd(true)} className="bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-800">+ Thêm máy</button>
          )}
          <div className="bg-gray-100 rounded-lg p-0.5 flex">
            <button onClick={() => setView('list')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${view === 'list' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>
              ☰ Danh sách
            </button>
            <button onClick={() => setView('floor')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${view === 'floor' ? 'bg-white shadow text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}>
              ⊞ Sơ đồ
            </button>
          </div>
          {view === 'floor' && isStaff && (
            editing ? (
              <div className="flex gap-1.5">
                <button onClick={savePositions} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-green-600">Lưu</button>
                <button onClick={() => setEditing(false)} className="bg-gray-200 px-3 py-1.5 rounded-lg text-xs hover:bg-gray-300">Hủy</button>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-emerald-800">✏️ Sắp xếp</button>
            )
          )}
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-sm">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400" /> {ok} OK</span>
        {err > 0 && <span className="flex items-center gap-1.5 text-red-600 font-medium"><span className="w-3 h-3 rounded-full bg-red-400" /> {err} lỗi</span>}
        {fix > 0 && <span className="flex items-center gap-1.5 text-yellow-600"><span className="w-3 h-3 rounded-full bg-yellow-400" /> {fix} bảo trì</span>}
      </div>

      {view === 'list' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
          {localDevices.map((device) => (
            <button key={device.id} onClick={() => clickDevice(device)}
              className={`p-3 rounded-xl border-2 text-center transition-all hover:shadow-md ${
                device.status === 'working' ? 'border-green-300 bg-green-50 hover:bg-green-100' :
                device.status === 'error' ? 'border-red-300 bg-red-50 hover:bg-red-100' :
                'border-yellow-300 bg-yellow-50 hover:bg-yellow-100'
              }`}>
              <p className="text-2xl mb-1">{typeIcons[device.type]}</p>
              <p className="text-xs font-medium truncate">{device.name}</p>
              <p className={`text-xs mt-0.5 ${device.status === 'working' ? 'text-green-600' : device.status === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>
                {device.status === 'working' ? '✓ OK' : device.status === 'error' ? '✗ Lỗi' : '🔧 BT'}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-4 overflow-auto">
          {editing && <p className="text-xs text-emerald-700 mb-3">Kéo thả máy để sắp xếp vị trí trên sơ đồ</p>}
          <div className="relative bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 mx-auto"
            style={{ width: fp.cols * CELL + 20, height: fp.rows * CELL + 40 }}>
            {Array.from({ length: fp.rows }).map((_, r) =>
              Array.from({ length: fp.cols }).map((_, c) => {
                const dev = localDevices.find((d) => d.position?.row === r && d.position?.col === c);
                return (
                  <div key={`${r}-${c}`}
                    className={`absolute rounded-lg border transition-all ${editing ? 'hover:border-emerald-400 hover:bg-emerald-50/50' : ''} ${
                      dev ? (dev.status === 'working' ? 'bg-green-100 border-green-300' : dev.status === 'error' ? 'bg-red-100 border-red-300' : 'bg-yellow-100 border-yellow-300') : 'bg-white/60 border-gray-200'
                    }`}
                    style={{ left: c * CELL + 10, top: r * CELL + 10, width: CELL - 4, height: CELL - 4 }}
                    onDragOver={editing ? onDragOver : undefined}
                    onDrop={editing ? (e) => onDrop(e, r, c) : undefined}>
                    {dev ? (
                      <div className={`w-full h-full flex flex-col items-center justify-center rounded-lg ${editing ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
                        draggable={editing} onDragStart={(e) => onDragStart(e, dev)}
                        onClick={() => !editing && clickDevice(dev)}>
                        <span className="text-lg">{typeIcons[dev.type]}</span>
                        <p className="text-[9px] font-medium truncate w-full text-center px-0.5">{dev.name}</p>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${dev.status === 'working' ? 'bg-green-200 text-green-700' : dev.status === 'error' ? 'bg-red-200 text-red-700' : 'bg-yellow-200 text-yellow-700'}`}>
                          {dev.status === 'working' ? '✓' : dev.status === 'error' ? '✗' : '•'}
                        </span>
                      </div>
                    ) : editing && <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">+</div>}
                  </div>
                );
              })
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-gray-200 text-center py-1 text-[10px] text-gray-500 rounded-b-lg">🚪 Lối vào</div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setSelected(null)} role="dialog" aria-modal="true" aria-labelledby="device-modal-title">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{typeIcons[selected.type]}</span>
                <div>
                  <h2 id="device-modal-title" className="font-bold text-gray-800">{selected.name}</h2>
                  <p className="text-xs text-gray-400">{selected.type} • {selected.specification}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200" aria-label="Đóng">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className={`flex items-center gap-3 p-3 rounded-lg ${selected.status === 'working' ? 'bg-green-50 text-green-700' : selected.status === 'error' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>
                <span className="text-xl">{selected.status === 'working' ? '🟢' : selected.status === 'error' ? '🔴' : '🟡'}</span>
                <div>
                  <p className="font-medium">{selected.status === 'working' ? 'Hoạt động tốt' : selected.status === 'error' ? 'Đang gặp sự cố' : 'Đang bảo trì'}</p>
                  {selected.position && <p className="text-xs opacity-75">Vị trí: Hàng {selected.position.row + 1}, Cột {selected.position.col + 1}</p>}
                </div>
              </div>
              {selIncidents.length > 0 && (
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-red-700 mb-2">Sự cố ({selIncidents.length})</p>
                  {selIncidents.map((inc) => (
                    <div key={inc.id} className="bg-white rounded-lg p-2.5 mb-2 last:mb-0">
                      <p className="text-sm text-gray-700">{inc.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Bởi: {inc.reportedBy} • {new Date(inc.reportedAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                  ))}
                </div>
              )}
              {selLogs.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Bảo trì gần đây</p>
                  {selLogs.slice(0, 3).map((l) => (
                    <div key={l.id} className="flex justify-between py-1.5 text-xs">
                      <span className="text-gray-600 truncate max-w-[200px]">{l.description}</span>
                      <span className={`px-2 py-0.5 rounded-full flex-shrink-0 ${l.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        {l.status === 'completed' ? 'Xong' : 'Đang làm'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {selected.status === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-600 space-y-1">
                  <p className="font-medium text-red-700">Cần xử lý:</p>
                  <p>1. Kiểm tra nguồn điện và cáp</p>
                  <p>2. Nếu không khắc phục được → <Link to={`/incidents/new?deviceId=${selected.id}&labId=${selected.labId}`} className="underline">báo sự cố</Link></p>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {isStaff && <Link to={`/devices/edit/${selected.id}`} className="btn-primary flex-1 text-center text-sm">Sửa</Link>}
                <Link to={`/incidents/new?deviceId=${selected.id}&labId=${selected.labId}`} className="btn-danger flex-1 text-center text-sm">Báo sự cố</Link>
                {isStaff && <Link to={`/maintenance/new?deviceId=${selected.id}`} className="btn-success flex-1 text-center text-sm">Bảo trì</Link>}
              </div>
            </div>
          </div>
        </div>
      )}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Thêm máy mới vào {lab.name}</h3>
            <form onSubmit={handleAddDevice} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên máy</label>
                <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)}
                  className="input-field" placeholder="VD: PC-41" autoFocus required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
                <select value={addType} onChange={(e) => setAddType(e.target.value as Device['type'])} className="input-field">
                  <option value="desktop">Desktop</option>
                  <option value="laptop">Laptop</option>
                  <option value="printer">Máy in</option>
                  <option value="projector">Máy chiếu</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thông số</label>
                <input type="text" value={addSpec} onChange={(e) => setAddSpec(e.target.value)}
                  className="input-field" placeholder="VD: Intel i5, 8GB RAM, 256GB SSD" />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-600 hover:bg-gray-200">Hủy</button>
                <button type="submit" disabled={addSaving || !addName.trim()} className="flex-1 py-2 rounded-lg text-sm font-medium bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50">
                  {addSaving ? 'Đang thêm...' : 'Thêm máy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Empty() { return <div className="text-center py-12 text-gray-400">Không tìm thấy phòng máy</div>; }
function Loader() { return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" /></div>; }
