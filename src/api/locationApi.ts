
import type {
  DriverLocationResponse,
  DriverShiftLocationHistoryResponse,
  DriversLocationsResponse,
} from "../types/location";

import { api } from "./client";

/**
 * Supervisor: get the latest recorded GPS position
 * of all assigned drivers.
 */
export async function getMyDriversLocations(signal?: AbortSignal) {
  const response = await api.get<DriversLocationsResponse>(
    "/locations/drivers",
    { signal },
  );

  return response.data;
}

/**
 * Supervisor: get one driver's latest GPS position.
 */
export async function getDriverLocation(
  driverId: string,
  signal?: AbortSignal,
) {
  const response = await api.get<DriverLocationResponse>(
    `/locations/drivers/${encodeURIComponent(driverId)}`,
    { signal },
  );

  return response.data;
}

/**
 * Legacy endpoint.
 *
 * The current backend returns HTTP 410 because
 * shift location history is no longer stored.
 *
 * Keep this only for compatibility with existing imports.
 */
export async function getDriverShiftLocationHistory(
  driverId: string,
  shiftId: string,
  signal?: AbortSignal,
) {
  const response =
    await api.get<DriverShiftLocationHistoryResponse>(
      `/locations/drivers/${encodeURIComponent(driverId)}/shifts/${encodeURIComponent(shiftId)}/history`,
      { signal },
    );

  return response.data;
}
