import {
  io,
  Socket,
} from "socket.io-client";

import {
  getToken,
} from "../api/client";

import type {
  DriverLiveLocationUpdate,
} from "../types/location";

// const SOCKET_URL =
//   "https://driverhelp.167.71.231.64.nip.io";

// Local:
const SOCKET_URL =
  "http://localhost:9000";

let socket:
  Socket | null =
  null;

let connectingPromise:
  Promise<Socket> | null =
  null;


export interface DriverLiveLocationPayload {
  latitude: number;

  longitude: number;

  accuracy?:
    | number
    | null;

  speed?:
    | number
    | null;

  heading?:
    | number
    | null;
}

export interface LocationAcknowledgement {
  success: boolean;

  recordedAt?: string;

  locationId?: string;

  message?: string;
}


export function getSocket() {
  return socket;
}




function createSocket() {
  if (socket) {
    return socket;
  }

  socket = io(
    SOCKET_URL,
    {
      autoConnect: false,

      transports: [
        "websocket",
      ],

      reconnection: true,

      reconnectionAttempts:
        Infinity,

      reconnectionDelay:
        1000,

      reconnectionDelayMax:
        5000,

      timeout:
        20000,
    },
  );

  socket.on(
    "connect",
    () => {
      console.log(
        "[Socket] Connected:",
        socket?.id,
      );
    },
  );

  socket.on(
    "connect_error",
    (error) => {
      console.warn(
        "[Socket] Connect error:",
        error.message,
      );
    },
  );

  socket.on(
    "disconnect",
    (reason) => {
      console.log(
        "[Socket] Disconnected:",
        reason,
      );
    },
  );

  socket.io.on(
    "reconnect",
    (attempt) => {
      console.log(
        "[Socket] Reconnected:",
        attempt,
      );
    },
  );

  return socket;
}

export async function connectSocket() {
  const instance =
    createSocket();

  if (
    instance.connected
  ) {
    return instance;
  }

  if (
    connectingPromise
  ) {
    return connectingPromise;
  }

  connectingPromise =
    (async () => {
      const token =
        getToken();

      if (!token) {
        throw new Error(
          "Cannot connect socket without authentication token",
        );
      }

      instance.auth = {
        token,
      };

      return new Promise<Socket>(
        (
          resolve,
          reject,
        ) => {
          const handleConnect =
            () => {
              cleanup();

              resolve(
                instance,
              );
            };

          const handleError =
            (
              error:
                Error,
            ) => {
              cleanup();

              reject(
                error,
              );
            };

          const cleanup =
            () => {
              instance.off(
                "connect",
                handleConnect,
              );

              instance.off(
                "connect_error",
                handleError,
              );
            };

          instance.once(
            "connect",
            handleConnect,
          );

          instance.once(
            "connect_error",
            handleError,
          );

          instance.connect();
        },
      );
    })();

  try {
    return await connectingPromise;
  } finally {
    connectingPromise =
      null;
  }
}

export function disconnectSocket() {
  if (!socket) {
    return;
  }

  socket.removeAllListeners();

  socket.io.removeAllListeners();

  socket.disconnect();

  socket = null;

  connectingPromise =
    null;
}

export function isSocketConnected() {
  return (
    socket?.connected ===
    true
  );
}



export async function emitDriverLocation(
  payload:
    DriverLiveLocationPayload,
) {
  const instance =
    await connectSocket();

  return new Promise<LocationAcknowledgement>(
    (
      resolve,
      reject,
    ) => {
      const timeoutId =
        window.setTimeout(
          () => {
            reject(
              new Error(
                "Location update timed out",
              ),
            );
          },
          10000,
        );

      instance.emit(
        "driver:location:update",
        payload,
        (
          acknowledgement:
            LocationAcknowledgement,
        ) => {
          window.clearTimeout(
            timeoutId,
          );

          if (
            !acknowledgement
          ) {
            reject(
              new Error(
                "No acknowledgement received",
              ),
            );

            return;
          }

          if (
            acknowledgement.success ===
            false
          ) {
            reject(
              new Error(
                acknowledgement.message ||
                  "Unable to update location",
              ),
            );

            return;
          }

          resolve(
            acknowledgement,
          );
        },
      );
    },
  );
}
/*
 * SUPERVISOR / ADMIN
 *
 * Receive driver's live location.
 */
export function onDriverLocationUpdate(
  callback: (
    location:
      DriverLiveLocationUpdate,
  ) => void,
) {
  const instance =
    createSocket();

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
  callback:
    () => void,
) {
  const instance =
    createSocket();

  instance.on(
    "connect",
    callback,
  );

  return () => {
    instance.off(
      "connect",
      callback,
    );
  };
}

export function onSocketDisconnect(
  callback: (
    reason: string,
  ) => void,
) {
  const instance =
    createSocket();

  instance.on(
    "disconnect",
    callback,
  );

  return () => {
    instance.off(
      "disconnect",
      callback,
    );
  };
}

export function onSocketConnectError(
  callback: (
    error: Error,
  ) => void,
) {
  const instance =
    createSocket();

  instance.on(
    "connect_error",
    callback,
  );

  return () => {
    instance.off(
      "connect_error",
      callback,
    );
  };
}