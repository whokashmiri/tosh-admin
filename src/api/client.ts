import axios from "axios";

// export const SERVER_URL =
//   "https://driverhelp.167.71.231.64.nip.io";
  export const SERVER_URL = "http://localhost:9000"

export const API_BASE_URL =
  `${SERVER_URL}/api`;

const AUTH_TOKEN_KEY =
  "authToken";

export const api =
  axios.create({
    baseURL:
      API_BASE_URL,

    timeout:
      30000,
  });

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem(
        AUTH_TOKEN_KEY,
      );

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },
  (error) =>
    Promise.reject(
      error,
    ),
);

export function saveToken(
  token: string,
) {
  localStorage.setItem(
    AUTH_TOKEN_KEY,
    token,
  );
}

export function getToken() {
  return localStorage.getItem(
    AUTH_TOKEN_KEY,
  );
}

export function removeToken() {
  localStorage.removeItem(
    AUTH_TOKEN_KEY,
  );
}