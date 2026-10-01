export interface Lab {
  id: number;
  name: string;
  location: string;
  capacity: number;
  status: 'active' | 'maintenance' | 'closed';
  description: string;
  floorPlan?: FloorPlanConfig;
}

export interface FloorPlanConfig {
  width: number;
  height: number;
  gridSize: number;
  rows: number;
  cols: number;
}

export interface Device {
  id: number;
  name: string;
  type: 'desktop' | 'laptop' | 'printer' | 'projector';
  labId: number;
  status: 'working' | 'error' | 'maintenance';
  specification: string;
  position?: DevicePosition;
}

export interface DevicePosition {
  row: number;
  col: number;
}

export interface Incident {
  id: number;
  deviceId: number;
  labId: number;
  description: string;
  status: 'pending' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  reportedBy: string;
  assignedTo: string;
  reportedAt: string;
  resolvedAt: string | null;
  note: string;
  imageUrl?: string;
  timeline?: TimelineEntry[];
}

export interface TimelineEntry {
  time: string;
  action: string;
  by: string;
}

export interface Booking {
  id: number;
  labId: number;
  date: string;
  shift: 'morning' | 'afternoon' | 'evening';
  bookedBy: string;
  userId?: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  createdAt: string;
}

export interface MaintenanceLog {
  id: number;
  deviceId: number;
  performedBy: string;
  type: 'repair' | 'maintenance' | 'upgrade';
  description: string;
  parts: string;
  cost: number;
  startDate: string | null;
  endDate: string | null;
  status: 'pending' | 'in-progress' | 'completed';
  notes: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  username?: string;
  password?: string;
  role: 'admin' | 'staff' | 'teacher' | 'student';
  phone?: string;
  active?: boolean;
}

export interface LoginCredentials {
  identifier: string;
  password: string;
}

export interface ShiftInfo {
  id: string;
  label: string;
  time: string;
}

export const SHIFTS: ShiftInfo[] = [
  { id: 'morning', label: 'Ca sáng', time: '07:00 - 11:30' },
  { id: 'afternoon', label: 'Ca chiều', time: '13:00 - 17:30' },
  { id: 'evening', label: 'Ca tối', time: '18:00 - 21:00' },
];

export const DEVICE_TYPES = [
  { id: 'desktop', label: 'Desktop', icon: '🖥️' },
  { id: 'laptop', label: 'Laptop', icon: '💻' },
  { id: 'printer', label: 'Máy in', icon: '🖨️' },
  { id: 'projector', label: 'Máy chiếu', icon: '📽️' },
];

export const DEVICE_STATUS = [
  { id: 'working', label: 'Hoạt động', color: 'green' },
  { id: 'error', label: 'Lỗi', color: 'red' },
  { id: 'maintenance', label: 'Bảo trì', color: 'yellow' },
];

export const INCIDENT_STATUS = [
  { id: 'pending', label: 'Chờ xử lý', color: 'yellow' },
  { id: 'in-progress', label: 'Đang xử lý', color: 'blue' },
  { id: 'resolved', label: 'Đã giải quyết', color: 'green' },
];

export const PRIORITY = [
  { id: 'high', label: 'Cao', color: 'red' },
  { id: 'medium', label: 'Trung bình', color: 'yellow' },
  { id: 'low', label: 'Thấp', color: 'gray' },
];
