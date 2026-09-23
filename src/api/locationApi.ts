import {
  type DriverLocationResponse,
  type DriverShiftLocationHistoryResponse,
  type DriversLocationsResponse,

} from "../types/location";

import { api } from "./client";





export async function getMyDriversLocations() {
  const response =
    await api.get<DriversLocationsResponse>("/locations/drivers");

  return response.data;
}

export async function getDriverLocation(driverId: string) {
  const response = await api.get<DriverLocationResponse>(
    `/locations/drivers/${driverId}`,
  );

  return response.data;
}

export async function getDriverShiftLocationHistory(
  driverId: string,
  shiftId: string,
) {
  const response = await api.get<DriverShiftLocationHistoryResponse>(
    `/locations/drivers/${driverId}/shifts/${shiftId}/history`,
  );

  return response.data;
}
