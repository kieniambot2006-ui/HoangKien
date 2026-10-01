import type { Lab, Device, Incident, Booking, MaintenanceLog, User, LoginCredentials } from '../types';

const API = 'http://localhost:3001';

/** Fetch JSON từ json-server, throw nếu response không OK */
async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Lỗi ${res.status}`);
  return res.json();
}

/** API client — tất cả HTTP calls đi qua đây */
export const api = {
  labs: {
    getAll: () => fetchJSON<Lab[]>(`${API}/labs`),
    getById: (id: number) => fetchJSON<Lab>(`${API}/labs/${id}`),
    create: (data: Omit<Lab, 'id'>) => fetchJSON<Lab>(`${API}/labs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Lab>) => fetchJSON<Lab>(`${API}/labs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    delete: (id: number) => fetch(`${API}/labs/${id}`, { method: 'DELETE' }).then((res) => { if (!res.ok) throw new Error(`Lỗi ${res.status}`); }),
  },

  devices: {
    getAll: () => fetchJSON<Device[]>(`${API}/devices`),
    getById: (id: number) => fetchJSON<Device>(`${API}/devices/${id}`),
    getByLab: (labId: number) => fetchJSON<Device[]>(`${API}/devices?labId=${labId}`),
    create: (data: Omit<Device, 'id'>) => fetchJSON<Device>(`${API}/devices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Device>) => fetchJSON<Device>(`${API}/devices/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    delete: (id: number) => fetch(`${API}/devices/${id}`, { method: 'DELETE' }).then((res) => { if (!res.ok) throw new Error(`Lỗi ${res.status}`); }),
  },

  incidents: {
    getAll: () => fetchJSON<Incident[]>(`${API}/incidents`),
    getById: (id: number) => fetchJSON<Incident>(`${API}/incidents/${id}`),
    create: (data: Omit<Incident, 'id'>) => fetchJSON<Incident>(`${API}/incidents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Incident>) => fetchJSON<Incident>(`${API}/incidents/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    delete: (id: number) => fetch(`${API}/incidents/${id}`, { method: 'DELETE' }).then((res) => { if (!res.ok) throw new Error(`Lỗi ${res.status}`); }),
  },

  bookings: {
    getAll: () => fetchJSON<Booking[]>(`${API}/bookings`),
    getById: (id: number) => fetchJSON<Booking>(`${API}/bookings/${id}`),
    /** Kiểm tra conflict: cùng ngày + phòng + ca, bỏ qua booking đã reject hoặc đang edit */
    checkConflict: async (date: string, labId: number, shift: string, excludeId?: number) => {
      const bookings = await fetchJSON<Booking[]>(`${API}/bookings?date=${date}&labId=${labId}&shift=${shift}`);
      return bookings.some((b) => b.status !== 'rejected' && b.id !== excludeId);
    },
    create: (data: Omit<Booking, 'id'>) => fetchJSON<Booking>(`${API}/bookings`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    update: (id: number, data: Partial<Booking>) => fetchJSON<Booking>(`${API}/bookings/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    delete: (id: number) => fetch(`${API}/bookings/${id}`, { method: 'DELETE' }).then((res) => { if (!res.ok) throw new Error(`Lỗi ${res.status}`); }),
  },

  maintenanceLogs: {
    getAll: () => fetchJSON<MaintenanceLog[]>(`${API}/maintenanceLogs`),
    getById: (id: number) => fetchJSON<MaintenanceLog>(`${API}/maintenanceLogs/${id}`),
    getByDevice: (deviceId: number) => fetchJSON<MaintenanceLog[]>(`${API}/maintenanceLogs?deviceId=${deviceId}`),
    create: (data: Omit<MaintenanceLog, 'id'>) => fetchJSON<MaintenanceLog>(`${API}/maintenanceLogs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    update: (id: number, data: Partial<MaintenanceLog>) => fetchJSON<MaintenanceLog>(`${API}/maintenanceLogs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    delete: (id: number) => fetch(`${API}/maintenanceLogs/${id}`, { method: 'DELETE' }).then((res) => { if (!res.ok) throw new Error(`Lỗi ${res.status}`); }),
  },

  users: {
    getAll: () => fetchJSON<User[]>(`${API}/users`),
    getById: (id: number) => fetchJSON<User>(`${API}/users/${id}`),
    /** Login: fetch users theo password, rồi filter client-side theo email/username */
    login: (credentials: LoginCredentials) =>
      fetchJSON<User[]>(`${API}/users?password=${encodeURIComponent(credentials.password)}`).then((users) => {
        const user = users.find((item) => item.email === credentials.identifier || item.username === credentials.identifier);
        if (!user) throw new Error('Username, email hoặc mật khẩu không đúng');
        return user;
      }),
    create: (data: Omit<User, 'id'>) => fetchJSON<User>(`${API}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    update: (id: number, data: Partial<User>) => fetchJSON<User>(`${API}/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }),
    delete: (id: number) => fetch(`${API}/users/${id}`, { method: 'DELETE' }).then((res) => { if (!res.ok) throw new Error(`Lỗi ${res.status}`); }),
  },
};
