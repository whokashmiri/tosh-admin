
import type {
  DriverProfilePicture,
  DriverWorkStatus,
  VehicleType,
} from "./driver";

export interface LocationPayload {
  latitude: number;
  longitude: number;

  accuracy?: number | null;
  speed?: number | null;
  heading?: number | null;

  recordedAt?: string;
}

export interface LocationDriver {
  id?: string;
  _id: string;

  name?: string;
  shortName?: string | null;
  iqamaId?: string;
  phone?: string | null;

  vehicleType?: VehicleType | null;
  isActive?: boolean;
  workStatus?: DriverWorkStatus;

  profilePicture?: DriverProfilePicture | null;
}

export interface DriverLocation {
  _id: string;

  driver: string | LocationDriver;
  supervisor: string;

  latitude: number;
  longitude: number;

  accuracy: number | null;
  speed: number | null;
  heading: number | null;

  recordedAt: string;

  createdAt?: string;
  updatedAt?: string;
}

export interface LocationHistoryPoint {
  _id?: string;

  latitude: number;
  longitude: number;

  accuracy: number | null;
  speed: number | null;
  heading: number | null;

  recordedAt: string;
}

export interface UpdateMyLocationResponse {
  success: boolean;
  accepted?: boolean;
  location: DriverLocation;
  recordedAt?: string;
  locationId?: string | null;
  shiftId?: string | null;
  isWorking?: boolean;
}

export interface MyLocationResponse {
  success: boolean;
  location: DriverLocation | null;
}

export interface DriversLocationsResponse {
  success: boolean;
  count: number;
  locations: DriverLocation[];
}

export interface DriverLocationResponse {
  success: boolean;

  driver: {
    id?: string;
    _id: string;

    name: string;
    shortName?: string | null;
    iqamaId: string;
    phone?: string | null;

    vehicleType?: VehicleType | null;
    isActive: boolean;
    workStatus?: DriverWorkStatus;

    profilePicture?: DriverProfilePicture | null;
  };

  location: DriverLocation | null;
}

export interface DriverShiftLocationHistoryResponse {
  success: boolean;

  shift: {
    id: string;
    startedAt: string;
    endedAt: string | null;
    status: "active" | "completed";
  };

  count: number;
  locations: LocationHistoryPoint[];
}

/**
 * DRIVER -> BACKEND
 *
 * Foreground GPS transmission.
 * Socket event: driver:location
 */
export type DriverLiveLocationPayload = LocationPayload;

/**
 * BACKEND -> SUPERVISOR
 *
 * Received after the backend accepts a new GPS
 * coordinate from either Socket.IO or HTTP.
 *
 * Socket event: driver:location:update
 */
export interface DriverLiveLocationUpdate {
  driverId: string;

  latitude: number;
  longitude: number;

  accuracy: number | null;
  speed: number | null;
  heading: number | null;

  recordedAt: string;

  shiftId: string | null;
  isWorking: boolean;
}

/**
 * Acknowledgement from the backend.
 */
export interface LocationAcknowledgement {
  success: boolean;

  accepted?: boolean;
  recordedAt?: string;
  locationId?: string | null;

  message?: string;
}
