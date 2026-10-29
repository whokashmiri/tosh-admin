
import {
  io,
  type Socket,
} from "socket.io-client";

import { getToken } from "../api/client";

import type {
  DriverLiveLocationPayload,
  DriverLiveLocationUpdate,
  LocationAcknowledgement,
} from "../types/location";

const SOCKET_URL =
  "https://driverhelp.167.71.231.64.nip.io";

let socket: Socket | null = null;

let connectingPromise: Promise<Socket> | null = null;

const ACK_TIMEOUT_MS = 10000;

function createSocket(): Socket {
  if (socket) {
    return socket;
  }

  const instance = io(SOCKET_URL, {
    autoConnect: false,

    transports: ["websocket"],

    reconnection: true,
    reconnectionAttempts: Infinity,

    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,

    timeout: 20000,
  });

  instance.on("connect", () => {
    console.log("[Socket] Connected:", instance.id);
  });

  instance.on("connect_error", (error: Error) => {
    console.warn(
      "[Socket] Connection error:",
      error.message,
    );
  });

  instance.on("disconnect", (reason: string) => {
    console.log("[Socket] Disconnected:", reason);
  });

  instance.io.on("reconnect", (attempt: number) => {
    console.log("[Socket] Reconnected:", attempt);
  });

  /*
   * Read the current token on every connection,
   * including automatic reconnection.
   */
  instance.io.on("reconnect_attempt", () => {
    void Promise.resolve(getToken())
      .then((token) => {
        if (token) {
          instance.auth = { token };
        } else {
          // Do not reconnect with expired account credentials.
          instance.disconnect();
        }
      })
      .catch(() => {
        instance.disconnect();
      });
  });

  socket = instance;

  return instance;
}

export function getSocket(): Socket | null {
  return socket;
}

export function isSocketConnected(): boolean {
  return socket?.connected === true;
}

/**
 * Connect using the currently authenticated user.
 */
export async function connectSocket(): Promise<Socket> {
  const instance = createSocket();

  if (connectingPromise) {
    return connectingPromise;
  }

  const pending = (async (): Promise<Socket> => {
    const token = await Promise.resolve(getToken());

    if (!token) {
      throw new Error(
        "Cannot connect Socket.IO without an authentication token",
      );
    }

    if (instance.connected) {
      return instance;
    }

    instance.auth = { token };

    return new Promise<Socket>((resolve, reject) => {
      let settled = false;

      const finish = (error?: Error) => {
        if (settled) return;

        settled = true;
        cleanup();

        if (error) {
          reject(error);
        } else {
          resolve(instance);
        }
      };

      const handleConnect = () => {
        finish();
      };

      const handleConnectError = (error: Error) => {
        finish(error);
      };

      const handleDisconnect = () => {
        finish(
          new Error("Socket disconnected before connection completed"),
        );
      };

      const timeout = window.setTimeout(() => {
        finish(new Error("Socket connection timed out"));
      }, 25000);

      const cleanup = () => {
        window.clearTimeout(timeout);

        instance.off("connect", handleConnect);
        instance.off("connect_error", handleConnectError);
        instance.off("disconnect", handleDisconnect);
      };

      instance.once("connect", handleConnect);

      instance.once("connect_error", handleConnectError);

      instance.once("disconnect", handleDisconnect);

      instance.connect();
    });
  })();

  connectingPromise = pending;

  try {
    return await pending;
  } finally {
    if (connectingPromise === pending) {
      connectingPromise = null;
    }
  }
}

/**
 * Disconnect on logout or when changing accounts.
 *
 * Do not use this in normal LiveLocation component
 * cleanup if other screens share the socket.
 */
export function disconnectSocket(): void {
  if (!socket) return;

  socket.removeAllListeners();
  socket.io.removeAllListeners();
  socket.disconnect();

  socket = null;
  connectingPromise = null;
}

/**
 * DRIVER -> BACKEND
 *
 * Retained for compatibility.
 *
 * The current backend listens for:
 * driver:location
 */
export async function emitDriverLocation(
  payload: DriverLiveLocationPayload,
): Promise<LocationAcknowledgement> {
  const instance = await connectSocket();

  return new Promise<LocationAcknowledgement>(
    (resolve, reject) => {
      instance
        .timeout(ACK_TIMEOUT_MS)
        .emit(
          "driver:location",
          payload,
          (
            error: Error | null,
            acknowledgement?: LocationAcknowledgement,
          ) => {
            if (error) {
              reject(
                new Error("Location update timed out"),
              );
              return;
            }

            if (!acknowledgement) {
              reject(
                new Error("No location acknowledgement received"),
              );
              return;
            }

            if (!acknowledgement.success) {
              reject(
                new Error(
                  acknowledgement.message ||
                    "Unable to update location",
                ),
              );
              return;
            }

            resolve(acknowledgement);
          },
        );
    },
  );
}

/**
 * SUPERVISOR <- BACKEND
 *
 * Receives accepted live positions from:
 * - Foreground Socket.IO tracking
 * - Background HTTP tracking
 */
export function onDriverLocationUpdate(
  callback: (
    update: DriverLiveLocationUpdate,
  ) => void,
): () => void {
  const instance = createSocket();

  instance.on(
    "driver:location:update",
    callback,
  );

  return () => {
    instance.off(
      "driver:location:update",
      callback,
    );
  };
}

export function onSocketConnect(
  callback: () => void,
): () => void {
  const instance = createSocket();

  instance.on("connect", callback);

  return () => {
    instance.off("connect", callback);
  };
}

export function onSocketDisconnect(
  callback: (reason: string) => void,
): () => void {
  const instance = createSocket();

  instance.on("disconnect", callback);

  return () => {
    instance.off("disconnect", callback);
  };
}

export function onSocketConnectError(
  callback: (error: Error) => void,
): () => void {
  const instance = createSocket();

  instance.on("connect_error", callback);

  return () => {
    instance.off("connect_error", callback);
  };
}
