/**
 * TUSO v1 — Typed Client SDK
 * Wraps invokeKernelFunction for all TUSO endpoints with proper typing.
 */
import { invokeKernelFunction } from '@/lib/kernel/kernelClient';

const FN = 'tuso-v1';

function invoke<T>(path: string, options: { method?: string; body?: Record<string, unknown> } = {}) {
  return invokeKernelFunction<T>(FN, {
    body: { ...(options.body || {}), _path: path, _method: options.method || 'GET' },
    method: options.method || 'GET',
  });
}

// We actually need to pass the path via headers or body since edge functions
// don't support sub-routing via Supabase invoke. Use body._path convention.
// The edge function already handles URL parsing from the actual request URL.

export const tusoClient = {
  // Facilities
  listFacilities: () => invoke<{ facilities: any[] }>('facilities'),
  getFacility: (id: string) => invoke<any>(`facilities/${id}`),
  createFacility: (data: Record<string, unknown>) => invoke<any>('facilities', { method: 'POST', body: data }),
  updateFacility: (id: string, data: Record<string, unknown>) => invoke<any>(`facilities/${id}`, { method: 'PATCH', body: data }),
  mergeFacilities: (data: Record<string, unknown>) => invoke<any>('facilities/merge', { method: 'POST', body: data }),

  // Workspaces
  listWorkspaces: (facilityId: string) => invoke<{ workspaces: any[] }>(`facilities/${facilityId}/workspaces`),
  getWorkspace: (id: string) => invoke<any>(`workspaces/${id}`),
  createWorkspace: (facilityId: string, data: Record<string, unknown>) => invoke<any>(`facilities/${facilityId}/workspaces`, { method: 'POST', body: data }),
  updateWorkspace: (id: string, data: Record<string, unknown>) => invoke<any>(`workspaces/${id}`, { method: 'PUT', body: data }),
  overrideWorkspace: (id: string, reason: string, payload?: Record<string, unknown>) =>
    invoke<any>(`workspaces/${id}/override`, { method: 'POST', body: { override_reason: reason, override_payload: payload } }),

  // Shifts
  getShiftOptions: (facilityId: string, providerId?: string) =>
    invoke<{ options: any[] }>(`facilities/${facilityId}/start-shift/options${providerId ? `?providerId=${providerId}` : ''}`),
  startShift: (facilityId: string, workspaceIds: string[]) =>
    invoke<any>(`facilities/${facilityId}/start-shift`, { method: 'POST', body: { workspace_ids: workspaceIds } }),

  // Resources & Bookings
  listResources: (facilityId: string) => invoke<{ resources: any[] }>(`facilities/${facilityId}/resources`),
  createResource: (facilityId: string, data: Record<string, unknown>) => invoke<any>(`facilities/${facilityId}/resources`, { method: 'POST', body: data }),
  createBooking: (resourceId: string, data: Record<string, unknown>) => invoke<any>(`resources/${resourceId}/bookings`, { method: 'POST', body: data }),
  listBookings: (resourceId: string) => invoke<{ bookings: any[] }>(`resources/${resourceId}/bookings`),
  cancelBooking: (bookingId: string) => invoke<any>(`bookings/${bookingId}`, { method: 'DELETE' }),
  getCalendarSlots: (facilityId: string) => invoke<any>(`facilities/${facilityId}/calendars/slots`),

  // Config
  getEffectiveConfig: (facilityId: string) => invoke<any>(`facilities/${facilityId}/config/effective`),
  updateConfig: (facilityId: string, configJson: Record<string, unknown>) =>
    invoke<any>(`facilities/${facilityId}/config`, { method: 'PUT', body: { config_json: configJson } }),
  getConfigHistory: (facilityId: string) => invoke<{ versions: any[] }>(`facilities/${facilityId}/config/history`),
  rollbackConfig: (facilityId: string, targetVersion: number) =>
    invoke<any>(`facilities/${facilityId}/config/rollback`, { method: 'POST', body: { target_version: targetVersion } }),

  // Telemetry
  ingestPCT: (data: Record<string, unknown>) => invoke<any>('telemetry/pct', { method: 'POST', body: data }),
  ingestOROS: (data: Record<string, unknown>) => invoke<any>('telemetry/oros', { method: 'POST', body: data }),

  // Control Tower
  getFacilitySummary: (facilityId: string) => invoke<any>(`control-tower/facilities/${facilityId}/summary`),
  getAlerts: (status?: string) => invoke<{ alerts: any[] }>(`control-tower/alerts${status ? `?status=${status}` : ''}`),
  resolveAlert: (alertId: string) => invoke<any>(`control-tower/alerts/${alertId}/resolve`, { method: 'POST' }),

  // GOFR
  triggerSync: (direction: string) => invoke<any>('gofr/sync', { method: 'POST', body: { direction } }),
  getSyncLog: () => invoke<{ sync_log: any[] }>('gofr/sync-log'),
};
