import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  connectSocket,
  emitDriverLocation,
  isSocketConnected,
} from "../socket/socket";

type UseLocationTrackingOptions = {
  enabled: boolean;

  /*
   * Minimum time between
   * locations sent to server.
   */
  intervalMs?: number;

  /*
   * Minimum movement in meters
   * before sending another point.
   */
  distanceInterval?: number;
};

export type BrowserLocation = {
  latitude: number;

  longitude: number;

  accuracy:
    | number
    | null;

  speed:
    | number
    | null;

  heading:
    | number
    | null;

  timestamp: number;
};

export function useLocationTracking({
  enabled,

  intervalMs = 3000,

  distanceInterval = 3,
}: UseLocationTrackingOptions) {
  const [
    isTracking,
    setIsTracking,
  ] = useState(false);

  const [
    permissionGranted,
    setPermissionGranted,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    lastLocation,
    setLastLocation,
  ] =
    useState<BrowserLocation | null>(
      null,
    );

  /*
   * Browser watchPosition ID.
   */
  const watchIdRef =
    useRef<number | null>(
      null,
    );

  /*
   * Prevent overlapping socket
   * requests.
   */
  const sendingRef =
    useRef(false);

  /*
   * Used for throttling.
   */
  const lastSentAtRef =
    useRef(0);

  /*
   * Used for distance filtering.
   */
  const lastSentLocationRef =
    useRef<BrowserLocation | null>(
      null,
    );

  /*
   * Prevent async startTracking()
   * from starting more than once.
   */
  const startingRef =
    useRef(false);

  const stopTracking =
    useCallback(() => {
      if (
        watchIdRef.current !==
        null
      ) {
        navigator.geolocation.clearWatch(
          watchIdRef.current,
        );

        watchIdRef.current =
          null;
      }

      sendingRef.current =
        false;

      startingRef.current =
        false;

      lastSentAtRef.current =
        0;

      lastSentLocationRef.current =
        null;

      setIsTracking(
        false,
      );
    }, []);

  /*
   * Determines whether a location
   * should actually be sent.
   *
   * Browser GPS can fire more often
   * than requested, so we enforce
   * time/distance ourselves.
   */
  const shouldSendLocation =
    useCallback(
      (
        location:
          BrowserLocation,
      ) => {
        const now =
          Date.now();

        const previous =
          lastSentLocationRef.current;

        /*
         * Always send first point.
         */
        if (!previous) {
          return true;
        }

        const elapsed =
          now -
          lastSentAtRef.current;

        const distance =
          calculateDistanceMeters(
            previous.latitude,
            previous.longitude,
            location.latitude,
            location.longitude,
          );

        /*
         * Send if enough time passed
         * OR driver moved enough.
         */
        return (
          elapsed >=
            intervalMs ||
          distance >=
            distanceInterval
        );
      },
      [
        intervalMs,
        distanceInterval,
      ],
    );

  const sendLocation =
    useCallback(
      async (
        location:
          BrowserLocation,
      ) => {
        /*
         * Avoid stacked socket
         * acknowledgements.
         */
        if (
          sendingRef.current
        ) {
          return;
        }

        if (
          !shouldSendLocation(
            location,
          )
        ) {
          return;
        }

        sendingRef.current =
          true;

        try {
          if (
            !isSocketConnected()
          ) {
            await connectSocket();
          }

          await emitDriverLocation({
            latitude:
              location.latitude,

            longitude:
              location.longitude,

            accuracy:
              location.accuracy,

            speed:
              location.speed,

            heading:
              location.heading,
          });

          lastSentAtRef.current =
            Date.now();

          lastSentLocationRef.current =
            location;

          setError(null);
        } catch (error) {
          setError(
            getLocationErrorMessage(
              error,
              "Unable to send location",
            ),
          );
        } finally {
          sendingRef.current =
            false;
        }
      },
      [
        shouldSendLocation,
      ],
    );

  const handlePosition =
    useCallback(
      (
        position:
          GeolocationPosition,
      ) => {
        const location:
          BrowserLocation = {
          latitude:
            position.coords
              .latitude,

          longitude:
            position.coords
              .longitude,

          accuracy:
            Number.isFinite(
              position.coords
                .accuracy,
            )
              ? position.coords
                  .accuracy
              : null,

          speed:
            position.coords
              .speed != null &&
            Number.isFinite(
              position.coords
                .speed,
            )
              ? position.coords
                  .speed
              : null,

          heading:
            position.coords
              .heading != null &&
            Number.isFinite(
              position.coords
                .heading,
            )
              ? position.coords
                  .heading
              : null,

          timestamp:
            position.timestamp,
        };

        /*
         * UI gets every browser
         * location update.
         */
        setLastLocation(
          location,
        );

        /*
         * Server sending is
         * independently throttled.
         */
        void sendLocation(
          location,
        );
      },
      [
        sendLocation,
      ],
    );

  const handlePositionError =
    useCallback(
      (
        positionError:
          GeolocationPositionError,
      ) => {
        switch (
          positionError.code
        ) {
          case positionError.PERMISSION_DENIED:
            setPermissionGranted(
              false,
            );

            setError(
              "Location permission was denied. Allow location access in your browser settings.",
            );

            break;

          case positionError.POSITION_UNAVAILABLE:
            setError(
              "Your current location is unavailable.",
            );

            break;

          case positionError.TIMEOUT:
            setError(
              "Location request timed out.",
            );

            break;

          default:
            setError(
              positionError.message ||
                "Unable to get location",
            );
        }
      },
      [],
    );

  const startTracking =
    useCallback(async () => {
      if (
        watchIdRef.current !==
          null ||
        startingRef.current
      ) {
        return;
      }

      if (
        !("geolocation" in
          navigator)
      ) {
        setError(
          "Location tracking is not supported by this browser.",
        );

        setPermissionGranted(
          false,
        );

        return;
      }

      startingRef.current =
        true;

      try {
        setError(null);

        /*
         * Connect socket first.
         */
        if (
          !isSocketConnected()
        ) {
          await connectSocket();
        }

        /*
         * getCurrentPosition triggers
         * browser permission request.
         */
        navigator.geolocation.getCurrentPosition(
          (
            position,
          ) => {
            setPermissionGranted(
              true,
            );

            handlePosition(
              position,
            );
          },

          (
            positionError,
          ) => {
            handlePositionError(
              positionError,
            );
          },

          {
            enableHighAccuracy:
              true,

            timeout:
              15000,

            maximumAge:
              0,
          },
        );

        /*
         * Start continuous browser
         * location tracking.
         */
        const watchId =
          navigator.geolocation.watchPosition(
            (
              position,
            ) => {
              setPermissionGranted(
                true,
              );

              handlePosition(
                position,
              );
            },

            (
              positionError,
            ) => {
              handlePositionError(
                positionError,
              );
            },

            {
              enableHighAccuracy:
                true,

              timeout:
                20000,

              /*
               * Don't reuse an old
               * cached location.
               */
              maximumAge:
                0,
            },
          );

        watchIdRef.current =
          watchId;

        setIsTracking(
          true,
        );
      } catch (error) {
        setError(
          getLocationErrorMessage(
            error,
            "Unable to start location tracking",
          ),
        );

        setIsTracking(
          false,
        );
      } finally {
        startingRef.current =
          false;
      }
    }, [
      handlePosition,
      handlePositionError,
    ]);

  useEffect(() => {
    if (enabled) {
      void startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [
    enabled,
    startTracking,
    stopTracking,
  ]);

  return {
    isTracking,

    permissionGranted,

    error,

    lastLocation,

    startTracking,

    stopTracking,
  };
}

/*
 * Haversine distance.
 *
 * Returns distance between two GPS
 * coordinates in meters.
 */
function calculateDistanceMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number,
) {
  const earthRadius =
    6371000;

  const latitudeDifference =
    degreesToRadians(
      latitude2 -
        latitude1,
    );

  const longitudeDifference =
    degreesToRadians(
      longitude2 -
        longitude1,
    );

  const firstLatitude =
    degreesToRadians(
      latitude1,
    );

  const secondLatitude =
    degreesToRadians(
      latitude2,
    );

  const a =
    Math.sin(
      latitudeDifference /
        2,
    ) **
      2 +
    Math.cos(
      firstLatitude,
    ) *
      Math.cos(
        secondLatitude,
      ) *
      Math.sin(
        longitudeDifference /
          2,
      ) **
        2;

  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(
        1 - a,
      ),
    );

  return (
    earthRadius *
    c
  );
}

function degreesToRadians(
  value: number,
) {
  return (
    value *
    (Math.PI / 180)
  );
}

function getLocationErrorMessage(
  error: unknown,
  fallback: string,
) {
  if (
    error instanceof Error
  ) {
    return (
      error.message ||
      fallback
    );
  }

  if (
    typeof error ===
      "string"
  ) {
    return error;
  }

  return fallback;
}