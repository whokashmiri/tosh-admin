export type UserRole =
  | "driver"
  | "supervisor"
  | "admin";

export interface UserProfilePicture {
  url:
    | string
    | null;

  publicId:
    | string
    | null;
}

export interface AuthUser {
  id: string;

  _id?: string;

  iqamaId: string;

  name: string;

  shortName?:
    | string
    | null;

  phone?:
    | string
    | null;

  profilePicture?:
    | UserProfilePicture
    | null;

  vehicleType?:
    | "car"
    | "bike"
    | null;

  role:
    UserRole;

  isActive:
    boolean;

  supervisor?:
    | string
    | null;

  lastLoginAt?:
    | string
    | null;

  createdAt?:
    string;

  updatedAt?:
    string;
}

export interface LoginPayload {
  iqamaId:
    string;

  password:
    string;
}

export interface RegisterPayload {
  name: string;

  iqamaId: string;

  password: string;

  role: "admin" | "supervisor";
}

export interface AuthResponse {
  success:
    boolean;

  token:
    string;

  user:
    AuthUser;
}

export interface MeResponse {
  success:
    boolean;

  user:
    AuthUser;
}