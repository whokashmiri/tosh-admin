import {
  type AuthResponse,
  type LoginPayload,
  type MeResponse,
  type RegisterPayload,
} from "../types/auth";

import {
  api,
  removeToken,
  saveToken,
} from "./client";

export async function login(
  payload:
    LoginPayload,
) {
  const response =
    await api.post<AuthResponse>(
      "/auth/login",
      payload,
    );

  const data =
    response.data;

  if (
    data.user.role !==
      "admin" &&
    data.user.role !==
      "supervisor"
  ) {
    throw new Error(
      "Only administrators and supervisors can access the web app",
    );
  }

  if (data.token) {
    saveToken(
      data.token,
    );
  }

  return data;
}

export async function register(
  payload:
    RegisterPayload,
) {
  const response =
    await api.post<AuthResponse>(
      "/auth/register",
      payload,
    );

  return response.data;
}

export async function getMe() {
  const response =
    await api.get<MeResponse>(
      "/auth/me",
    );

  const data =
    response.data;

  if (
    data.user.role !==
      "admin" &&
    data.user.role !==
      "supervisor"
  ) {
    removeToken();

    throw new Error(
      "This account cannot access the web app",
    );
  }

  return data;
}

export function logout() {
  removeToken();
}