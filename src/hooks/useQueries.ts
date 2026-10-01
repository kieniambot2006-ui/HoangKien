import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Lab, Device, Incident, Booking, MaintenanceLog, User } from '../types';

/**
 * Query keys tập trung tại đây.
 * Mỗi resource có key list + key detail (theo id).
 * Khi mutate thành công → invalidate key list để refetch.
 */
export const queryKeys = {
  labs: ['labs'] as const,
  lab: (id: number) => ['labs', id] as const,
  devices: ['devices'] as const,
  device: (id: number) => ['devices', id] as const,
  devicesByLab: (labId: number) => ['devices', 'lab', labId] as const,
  incidents: ['incidents'] as const,
  incident: (id: number) => ['incidents', id] as const,
  bookings: ['bookings'] as const,
  booking: (id: number) => ['bookings', id] as const,
  maintenanceLogs: ['maintenanceLogs'] as const,
  maintenanceLog: (id: number) => ['maintenanceLogs', id] as const,
  maintenanceLogsByDevice: (deviceId: number) => ['maintenanceLogs', 'device', deviceId] as const,
  users: ['users'] as const,
};

export function useLabs() {
  return useQuery({ queryKey: queryKeys.labs, queryFn: api.labs.getAll });
}

export function useLab(id: number, options?: { enabled?: boolean }) {
  return useQuery({ queryKey: queryKeys.lab(id), queryFn: () => api.labs.getById(id), enabled: options?.enabled ?? true });
}

export function useCreateLab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Lab, 'id'>) => api.labs.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.labs }),
  });
}

export function useUpdateLab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Lab> }) => api.labs.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.labs }),
  });
}

export function useDeleteLab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.labs.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.labs });
      qc.invalidateQueries({ queryKey: queryKeys.devices });
      qc.invalidateQueries({ queryKey: queryKeys.bookings });
      qc.invalidateQueries({ queryKey: queryKeys.incidents });
    },
  });
}

export function useDevices() {
  return useQuery({ queryKey: queryKeys.devices, queryFn: api.devices.getAll });
}

/** useDevice accept `enabled` option — dùng khi cần chờ parent load xong (VD: IncidentDetail chờ incident load trước) */
export function useDevice(id: number, options?: { enabled?: boolean }) {
  return useQuery({ queryKey: queryKeys.device(id), queryFn: () => api.devices.getById(id), enabled: options?.enabled ?? true });
}

export function useDevicesByLab(labId: number) {
  return useQuery({ queryKey: queryKeys.devicesByLab(labId), queryFn: () => api.devices.getByLab(labId) });
}

export function useCreateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Device, 'id'>) => api.devices.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.devices }),
  });
}

/**
 * useUpdateDevice invalidate cả incidents vì khi đổi device status
 * (VD: resolve incident → device working), incident list cũng cần refresh.
 */
export function useUpdateDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Device> }) => api.devices.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices });
      qc.invalidateQueries({ queryKey: queryKeys.incidents });
    },
  });
}

export function useDeleteDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.devices.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.devices });
      qc.invalidateQueries({ queryKey: queryKeys.incidents });
      qc.invalidateQueries({ queryKey: queryKeys.maintenanceLogs });
    },
  });
}

export function useIncidents() {
  return useQuery({ queryKey: queryKeys.incidents, queryFn: api.incidents.getAll });
}

export function useIncident(id: number) {
  return useQuery({ queryKey: queryKeys.incident(id), queryFn: () => api.incidents.getById(id) });
}

export function useCreateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Incident, 'id'>) => api.incidents.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.incidents }),
  });
}

export function useUpdateIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Incident> }) => api.incidents.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.incidents }),
  });
}

export function useDeleteIncident() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.incidents.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.incidents });
      qc.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useBookings() {
  return useQuery({ queryKey: queryKeys.bookings, queryFn: api.bookings.getAll });
}

export function useBooking(id: number) {
  return useQuery({ queryKey: queryKeys.booking(id), queryFn: () => api.bookings.getById(id) });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Booking, 'id'>) => api.bookings.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bookings }),
  });
}

export function useUpdateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Booking> }) => api.bookings.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bookings }),
  });
}

export function useDeleteBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.bookings.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.bookings }),
  });
}

export function useMaintenanceLogs() {
  return useQuery({ queryKey: queryKeys.maintenanceLogs, queryFn: api.maintenanceLogs.getAll });
}

export function useMaintenanceLog(id: number) {
  return useQuery({ queryKey: queryKeys.maintenanceLog(id), queryFn: () => api.maintenanceLogs.getById(id) });
}

export function useMaintenanceLogsByDevice(deviceId: number) {
  return useQuery({ queryKey: queryKeys.maintenanceLogsByDevice(deviceId), queryFn: () => api.maintenanceLogs.getByDevice(deviceId) });
}

export function useCreateMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<MaintenanceLog, 'id'>) => api.maintenanceLogs.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.maintenanceLogs }),
  });
}

export function useUpdateMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MaintenanceLog> }) => api.maintenanceLogs.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.maintenanceLogs }),
  });
}

export function useDeleteMaintenanceLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.maintenanceLogs.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.maintenanceLogs });
      qc.invalidateQueries({ queryKey: queryKeys.devices });
    },
  });
}

export function useUsers() {
  return useQuery({ queryKey: queryKeys.users, queryFn: api.users.getAll });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<User, 'id'>) => api.users.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) => api.users.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.users }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.users.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users });
      qc.invalidateQueries({ queryKey: queryKeys.incidents });
      qc.invalidateQueries({ queryKey: queryKeys.maintenanceLogs });
      qc.invalidateQueries({ queryKey: queryKeys.bookings });
    },
  });
}
