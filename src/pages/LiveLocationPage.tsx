
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import MapLibreMap, {
  Marker,
  NavigationControl,
  type MapRef,
} from "react-map-gl/maplibre";

import {
  Bike,
  Car,
  LocateFixed,
  MapPin,
  PersonStanding,
  RefreshCw,
  Search,
  Users,
  Phone,
  X,
} from "lucide-react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getMyDriversLocations } from "../api/locationApi";
import { getMyDrivers } from "../api/driverApi";

import {
  connectSocket,
  onDriverLocationUpdate,
  onSocketConnect,
  onSocketDisconnect,
  onSocketConnectError,
} from "../socket/socket";

import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { DashboardSidebar } from "../components/dashboard/DashboardSidebar";

import type { Driver } from "../types/driver";
import type {
  DriverLiveLocationUpdate,
  DriverLocation,
} from "../types/location";

const MAP_STYLE =
  "https://tiles.openfreemap.org/styles/liberty";

const DEFAULT_CENTER = {
  longitude: 46.6753,
  latitude: 24.7136,
  zoom: 10,
};

const LOCATION_FRESH_MS = 2 * 60 * 1000;

const REST_REFRESH_MS = 30000;

type LocationWithDriver = {
  location: DriverLocation;
  driver: Driver | null;
  isWorking: boolean;
  fresh: boolean;
};

type SocketState =
  | "connecting"
  | "connected"
  | "disconnected";

function getDriverId(location: DriverLocation): string | null {
  if (typeof location.driver === "string") {
    return location.driver;
  }

  return location.driver?._id ?? location.driver?.id ?? null;
}

function getLocationDriver(location: DriverLocation) {
  if (typeof location.driver === "string") return null;
  return location.driver;
}

function getTime(value?: string | null): number | null {
  if (!value) return null;

  const time = new Date(value).getTime();

  return Number.isFinite(time) ? time : null;
}

function isFresh(value: string | null | undefined, now: number) {
  const time = getTime(value);

  return (
    time !== null &&
    time <= now + 30000 &&
    now - time <= LOCATION_FRESH_MS
  );
}

function validCoordinates(
  latitude: number,
  longitude: number,
): boolean {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function formatAge(value: string | null | undefined, now: number) {
  const time = getTime(value);

  if (time === null) return "Unknown";

  const seconds = Math.max(
    0,
    Math.floor((now - time) / 1000),
  );

  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return new Date(time).toLocaleString();
}

// Preserve the newest coordinate when REST and Socket.IO
// updates are received in different orders.
function mergeLocations(
  current: DriverLocation[],
  incoming: DriverLocation[],
): DriverLocation[] {
  const byDriver = new Map<string, DriverLocation>();

  for (const item of current) {
    const id = getDriverId(item);
    if (id) byDriver.set(id, item);
  }

  for (const item of incoming) {
    const id = getDriverId(item);
    if (!id) continue;

    const latitude = Number(item.latitude);
    const longitude = Number(item.longitude);

    if (!validCoordinates(latitude, longitude)) continue;

    const previous = byDriver.get(id);

    const incomingTime = getTime(item.recordedAt);
    const previousTime = getTime(previous?.recordedAt);

    if (previous && (
      incomingTime === null ||
      (previousTime !== null && incomingTime <= previousTime)
    )) {
      continue;
    }

    byDriver.set(id, {
      ...previous,
      ...item,
      latitude,
      longitude,
      // Preserve populated profile data from REST when
      // a later response only contains a driver ID.
      driver:
        typeof item.driver === "string" &&
        previous &&
        typeof previous.driver !== "string"
          ? previous.driver
          : item.driver,
    });
  }

  return [...byDriver.values()];
}

export default function LiveLocationPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const mapRef = useRef<MapRef | null>(null);
  const initialFitDone = useRef(false);
  const loadRequestRef = useRef(0);
  const socketTimesRef = useRef<Record<string, number>>({});
  const refreshInFlightRef = useRef(false);
  const lastUnknownRefreshRef = useRef(0);
  const statusReceivedAtRef = useRef<Record<string, number>>({});
  const knownLocationIdsRef = useRef(new Set<string>());

  const [mapReady, setMapReady] = useState(false);

  const [locations, setLocations] = useState<DriverLocation[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [workingStatus, setWorkingStatus] = useState<
    Record<string, boolean>
  >({});

  const [selectedDriverId, setSelectedDriverId] =
    useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketState, setSocketState] =
    useState<SocketState>("connecting");

  const [now, setNow] = useState(Date.now());

  const [viewState, setViewState] = useState(DEFAULT_CENTER);

  const loadData = useCallback(async (background = false) => {
    if (background && refreshInFlightRef.current) return;
    if (background) refreshInFlightRef.current = true;
    const requestId = ++loadRequestRef.current;
    const requestStartedAt = Date.now();

    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const [locationResponse, driverResponse] =
        await Promise.all([
          getMyDriversLocations(),
          getMyDrivers(),
        ]);

      if (requestId !== loadRequestRef.current) return;

      const incomingLocations = locationResponse.locations ?? [];
      const incomingDrivers = driverResponse.drivers ?? [];

      setLocations((current) =>
        mergeLocations(current, incomingLocations),
      );
      for (const item of incomingLocations) {
        const id = getDriverId(item);
        if (id) knownLocationIdsRef.current.add(id);
      }

      setDrivers(incomingDrivers);

      const initialStatuses: Record<string, boolean> = {};

      for (const driver of incomingDrivers) {
        const id = driver._id ?? driver.id;

        if (id) {
          initialStatuses[id] = driver.workStatus === "working";
        }
      }

      // The REST driver directory is the authority for shift status.
      // A real-time location event received AFTER this request started
      // can supersede this snapshot; earlier events cannot.
      setWorkingStatus((current) => {
        const next = { ...initialStatuses };
        for (const [id, status] of Object.entries(current)) {
          if ((statusReceivedAtRef.current[id] ?? 0) > requestStartedAt) {
            next[id] = status;
          }
        }
        return next;
      });
    } catch (err) {
      if (requestId !== loadRequestRef.current) return;

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load driver locations",
      );
    } finally {
      if (background) refreshInFlightRef.current = false;
      if (requestId === loadRequestRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  // Initial REST load and periodic synchronization.
  useEffect(() => {
    void loadData();

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void loadData(true);
      }
    }, REST_REFRESH_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void loadData(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      loadRequestRef.current++;
      window.clearInterval(interval);
      document.removeEventListener(
        "visibilitychange",
        handleVisibility,
      );
    };
  }, [loadData]);

  // Update freshness independently of location events.
  useEffect(() => {
    const interval = window.setInterval(
      () => setNow(Date.now()),
      10000,
    );

    return () => window.clearInterval(interval);
  }, []);

  // Connect to the authenticated supervisor socket.
  useEffect(() => {
    let active = true;

    const cleanupLocation = onDriverLocationUpdate(
      (update: DriverLiveLocationUpdate) => {
        if (!active || !update.driverId) return;

        const latitude = Number(update.latitude);
        const longitude = Number(update.longitude);
        const incomingTime = getTime(update.recordedAt);

        if (
          !validCoordinates(latitude, longitude) ||
          incomingTime === null ||
          !isFresh(update.recordedAt, Date.now())
        ) {
          return;
        }

        const previousSocketTime =
          socketTimesRef.current[update.driverId] ?? -Infinity;

        if (incomingTime <= previousSocketTime) return;

        socketTimesRef.current[update.driverId] = incomingTime;
        statusReceivedAtRef.current[update.driverId] = Date.now();

        setWorkingStatus((current) => ({
          ...current,
          [update.driverId]: update.isWorking,
        }));

        setNow(Date.now());

        // A newly assigned driver may not exist in the initial REST list.
        // Fetch their populated profile without inserting an unknown marker.
        // Throttle this recovery to prevent request storms.
        if (!knownLocationIdsRef.current.has(update.driverId)) {
          if (Date.now() - lastUnknownRefreshRef.current > 5000) {
            lastUnknownRefreshRef.current = Date.now();
            void loadData(true);
          }
          return;
        }

        setLocations((current) => {
          const previous = current.find(
            (item) => getDriverId(item) === update.driverId,
          );

          if (!previous) {
            // REST provides the driver profile.
            // Synchronize when a new location appears.
            return current;
          }

          const previousTime =
            getTime(previous.recordedAt) ?? -Infinity;

          if (incomingTime <= previousTime) return current;

          const next: DriverLocation = {
            ...previous,
            latitude,
            longitude,
            accuracy: update.accuracy,
            speed: update.speed,
            heading: update.heading,
            recordedAt: update.recordedAt,
          };

          return current.map((item) =>
            getDriverId(item) === update.driverId
              ? next
              : item,
          );
        });
      },
    );

    const cleanupConnect = onSocketConnect(() => {
      if (!active) return;

      setSocketState("connected");

      // Recover any updates missed during disconnection.
      void loadData(true);
    });

    const cleanupDisconnect = onSocketDisconnect(() => {
      if (active) setSocketState("disconnected");
    });

    const cleanupError = onSocketConnectError((err) => {
      if (!active) return;

      setSocketState("disconnected");
      console.warn("[LiveMap] Socket error:", err.message);
    });

    setSocketState("connecting");

    void connectSocket()
      .then(() => {
        if (active) setSocketState("connected");
      })
      .catch((err) => {
        if (!active) return;

        setSocketState("disconnected");
        console.warn("[LiveMap] Connection failed:", err);
      });

    return () => {
      active = false;
      cleanupLocation();
      cleanupConnect();
      cleanupDisconnect();
      cleanupError();
    };
  }, [loadData]);

  const driverMap = useMemo(() => {
    const map = new Map<string, Driver>();

    for (const driver of drivers) {
      const id = driver._id ?? driver.id;
      if (id) map.set(id, driver);
    }

    return map;
  }, [drivers]);

  const mappedLocations = useMemo<LocationWithDriver[]>(() => {
    return locations.flatMap((location) => {
      const id = getDriverId(location);
      if (!id) return [];

      const latitude = Number(location.latitude);
      const longitude = Number(location.longitude);

      if (!validCoordinates(latitude, longitude)) return [];

      const driver =
        driverMap.get(id) ??
        (getLocationDriver(location) as Driver | null);

      return [{
        location: {
          ...location,
          latitude,
          longitude,
        },
        driver,
        isWorking:
          workingStatus[id] ??
          (driver?.workStatus === "working"),
        fresh: isFresh(location.recordedAt, now),
      }];
    });
  }, [locations, driverMap, workingStatus, now]);

  const filteredLocations = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return mappedLocations;

    return mappedLocations.filter(({ driver }) =>
      [
        driver?.name,
        driver?.shortName,
        driver?.phone,
        driver?.iqamaId,
        driver?.vehicleType,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query),
      ),
    );
  }, [mappedLocations, search]);

  const selected = useMemo(() => {
    return mappedLocations.find(
      (item) =>
        getDriverId(item.location) === selectedDriverId,
    ) ?? null;
  }, [mappedLocations, selectedDriverId]);

  const fitAllDrivers = useCallback(() => {
    const map = mapRef.current;

    if (!map || mappedLocations.length === 0) return;

    if (mappedLocations.length === 1) {
      const location = mappedLocations[0].location;

      map.flyTo({
        center: [
          Number(location.longitude),
          Number(location.latitude),
        ],
        zoom: 14,
        duration: 600,
      });

      return;
    }

    let west = Infinity;
    let east = -Infinity;
    let south = Infinity;
    let north = -Infinity;

    for (const item of mappedLocations) {
      const longitude = Number(item.location.longitude);
      const latitude = Number(item.location.latitude);

      west = Math.min(west, longitude);
      east = Math.max(east, longitude);
      south = Math.min(south, latitude);
      north = Math.max(north, latitude);
    }

    map.fitBounds(
      [[west, south], [east, north]],
      {
        padding: {
          top: 90,
          right: 90,
          bottom: 110,
          left: 90,
        },
        maxZoom: 15,
        duration: 700,
      },
    );
  }, [mappedLocations]);

  const mapDriverIds = useMemo(
    () => mappedLocations.map((item) => getDriverId(item.location)).sort().join(","),
    [mappedLocations],
  );

  useEffect(() => {
    if (!mapReady || loading || mappedLocations.length === 0) return;

    // Fit when drivers first appear or the set of visible drivers changes.
    // Do NOT continuously recenter while existing drivers move.
    const timer = window.setTimeout(() => {
      fitAllDrivers();
      initialFitDone.current = true;
    }, initialFitDone.current ? 250 : 550);

    return () => window.clearTimeout(timer);
    // Depend on driver identity, not GPS position or 10-second freshness ticks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, loading, mapDriverIds]);

  function selectDriver(item: LocationWithDriver) {
    const id = getDriverId(item.location);
    if (!id) return;

    setSelectedDriverId(id);

    // Use the newest position already merged into state.
    mapRef.current?.flyTo({
      center: [
        Number(item.location.longitude),
        Number(item.location.latitude),
      ],
      zoom: 15,
      duration: 600,
    });
  }

  const workingCount = mappedLocations.filter(
    (item) => item.isWorking,
  ).length;

  const freshCount = mappedLocations.filter(
    (item) => item.fresh,
  ).length;

  return (
    <div className="min-h-screen bg-[#F4F6F6]">
      <DashboardSidebar />

      <div className="lg:pl-64">
        <DashboardHeader />

        <main className="mx-auto max-w-400 p-4 lg:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-[#07393C]">
                {t("supervisor.liveMap", "Live Map")}
              </h1>
              <p className="mt-1 text-sm text-[#667577]">
                {t("location.liveTracking", "Driver locations")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-xs font-bold text-[#667577]">
                <span
                  className={`h-2 w-2 rounded-full ${
                    socketState === "connected"
                      ? "bg-emerald-500"
                      : socketState === "connecting"
                        ? "bg-amber-500"
                        : "bg-red-500"
                  }`}
                />
                {socketState === "connected"
                  ? "Connected"
                  : socketState === "connecting"
                    ? "Connecting"
                    : "Disconnected"}
              </span>

              <button
                type="button"
                disabled={refreshing}
                onClick={() => void loadData(true)}
                className="flex items-center gap-2 rounded-xl border border-[#D6DEDE] bg-white px-4 py-2.5 text-xs font-bold text-[#07393C] disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={refreshing ? "animate-spin" : ""}
                />
                {t("common.refresh", "Refresh")}
              </button>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <LocationStat title="On Map" value={mappedLocations.length} icon={<MapPin size={19} />} />
            <LocationStat title="Working" value={workingCount} icon={<LocateFixed size={19} />} />
            <LocationStat title="Fresh GPS" value={freshCount} icon={<RefreshCw size={19} />} />
            <LocationStat title="Drivers" value={drivers.length} icon={<Users size={19} />} />
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          {loading && mappedLocations.length === 0 ? (
            <div className="flex h-120 items-center justify-center rounded-2xl bg-white text-sm text-[#667577]">
              Loading locations...
            </div>
          ) : (
            <section className="grid h-[75vh] min-h-125 overflow-hidden rounded-2xl border border-[#D6DEDE] bg-white shadow-sm xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="relative min-h-0">
                <MapLibreMap
                  ref={mapRef}
                  {...viewState}
                  onMove={(event) => {
                    setViewState({
                      longitude: event.viewState.longitude,
                      latitude: event.viewState.latitude,
                      zoom: event.viewState.zoom,
                    });
                  }}
                  onLoad={() => setMapReady(true)}
                  mapStyle={MAP_STYLE}
                  style={{ width: "100%", height: "100%" }}
                >
                  <NavigationControl position="top-left" />

                  {filteredLocations.map((item) => {
                    const id = getDriverId(item.location);
                    if (!id) return null;

                    const active = item.isWorking && item.fresh;
                    const selectedMarker = selectedDriverId === id;

                    return (
                      <Marker
                        key={id}
                        longitude={Number(item.location.longitude)}
                        latitude={Number(item.location.latitude)}
                        anchor="bottom"
                      >
                        <button
                          type="button"
                          onClick={() => selectDriver(item)}
                          className="flex flex-col items-center"
                        >
                          <div
                            className={`flex items-center gap-2 rounded-xl border-2 bg-white p-2 shadow-lg ${
                              selectedMarker
                                ? "border-[#07393C]"
                                : "border-[#D6DEDE]"
                            } ${!active ? "opacity-70" : ""}`}
                          >
                            <DriverAvatar
                              driver={item.driver}
                              active={active}
                            />

                            <div className="max-w-32 text-start">
                              <p className="truncate text-[11px] font-black text-[#07393C]">
                                {item.driver?.shortName ||
                                  item.driver?.name ||
                                  "Driver"}
                              </p>
                              <p className="truncate text-[9px] text-[#667577]">
                                {item.driver?.phone || "-"}
                              </p>
                              <VehicleInfo
                                vehicleType={item.driver?.vehicleType}
                              />
                            </div>
                          </div>
                          <div className="h-0 w-0 border-x-6 border-t-8 border-x-transparent border-t-white" />
                        </button>
                      </Marker>
                    );
                  })}
                </MapLibreMap>

                <div className="absolute inset-e-3 top-3 z-10">
                  <button
                    type="button"
                    onClick={fitAllDrivers}
                    disabled={mappedLocations.length === 0}
                    className="rounded-xl bg-[#07393C] px-4 py-2 text-xs font-bold text-white shadow-lg disabled:opacity-50"
                  >
                    {t("location.showAll", "Show All")}
                  </button>
                </div>

                {selected && (
                  <div className="absolute inset-x-3 bottom-6 z-10 max-w-md rounded-2xl border border-[#D6DEDE] bg-white p-4 shadow-xl">
                    <div className="flex items-start gap-3">
                      <DriverAvatar
                        driver={selected.driver}
                        active={selected.isWorking && selected.fresh}
                        size={46}
                      />

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-black text-[#07393C]">
                          {selected.driver?.shortName ||
                            selected.driver?.name ||
                            "Driver"}
                        </h3>
                        <p className="text-xs text-[#667577]">
                          {selected.driver?.phone || "-"}
                        </p>
                        <p className="mt-1 text-[10px] text-[#667577]">
                          {selected.isWorking ? "Working" : "Not Working"}
                          {" · "}
                          {selected.fresh ? "Fresh GPS" : "Stale GPS"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedDriverId(null)}
                        aria-label="Close driver details"
                      >
                        <X size={17} />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <InfoBox
                        label="Latitude"
                        value={Number(selected.location.latitude).toFixed(5)}
                      />
                      <InfoBox
                        label="Longitude"
                        value={Number(selected.location.longitude).toFixed(5)}
                      />
                      <InfoBox
                        label="Speed"
                        value={
                          selected.location.speed != null
                            ? `${Math.max(0, Number(selected.location.speed) * 3.6).toFixed(0)} km/h`
                            : "-"
                        }
                      />
                      <InfoBox
                        label="Accuracy"
                        value={
                          selected.location.accuracy != null
                            ? `${Math.round(Number(selected.location.accuracy))} m`
                            : "-"
                        }
                      />
                    </div>

                    <p className="mt-3 text-[10px] text-[#667577]">
                      Last GPS: {formatAge(selected.location.recordedAt, now)}
                    </p>

                    {getDriverId(selected.location) && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/dashboard/drivers/${getDriverId(selected.location)}`,
                          )
                        }
                        className="mt-3 w-full rounded-lg bg-[#07393C] py-2 text-xs font-bold text-white"
                      >
                        {t("drivers.viewDriver", "View Driver")}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <aside className="flex min-h-0 flex-col border-t border-[#D6DEDE] xl:border-s xl:border-t-0">
                <div className="border-b border-[#EDF0F0] p-4">
                  <h3 className="text-sm font-black text-[#07393C]">
                    {t("supervisor.drivers", "Drivers")}
                  </h3>

                  <div className="relative mt-3">
                    <Search
                      size={15}
                      className="pointer-events-none absolute inset-s-3 top-3 text-[#667577]"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search drivers..."
                      className="h-10 w-full rounded-xl border border-[#D6DEDE] ps-9 pe-3 text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                  {filteredLocations.map((item) => {
                    const id = getDriverId(item.location);
                    const active = item.isWorking && item.fresh;

                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => selectDriver(item)}
                        className={`flex w-full items-center gap-3 border-b border-[#EDF0F0] p-4 text-start hover:bg-[#F8FAFA] ${
                          selectedDriverId === id ? "bg-[#F0F7F7]" : ""
                        }`}
                      >
                        <DriverAvatar
                          driver={item.driver}
                          active={active}
                          size={42}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-black text-[#07393C]">
                            {item.driver?.shortName ||
                              item.driver?.name ||
                              "Driver"}
                          </div>

                          <div className="mt-1 flex items-center gap-1 text-[10px] text-[#667577]">
                            <Phone size={11} />
                            {item.driver?.phone || "-"}
                          </div>

                          <div className="mt-1 text-[10px] text-[#667577]">
                            {formatAge(item.location.recordedAt, now)}
                          </div>
                        </div>

                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            active ? "bg-emerald-500" : "bg-slate-400"
                          }`}
                        />
                      </button>
                    );
                  })}

                  {filteredLocations.length === 0 && (
                    <p className="p-8 text-center text-xs text-[#667577]">
                      No driver locations found.
                    </p>
                  )}
                </div>
              </aside>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function DriverAvatar({
  driver,
  active,
  size = 34,
}: {
  driver: Driver | null;
  active: boolean;
  size?: number;
}) {
  return (
    <div
      style={{ width: size, height: size }}
      className={`shrink-0 overflow-hidden rounded-full border-2 ${
        active ? "border-emerald-500" : "border-slate-400"
      }`}
    >
      {driver?.profilePicture?.url ? (
        <img
          src={driver.profilePicture.url}
          alt={driver.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#07393C] text-white">
          <PersonStanding size={size * 0.48} />
        </div>
      )}
    </div>
  );
}

function VehicleInfo({
  vehicleType,
}: {
  vehicleType?: "car" | "bike" | null;
}) {
  const Icon =
    vehicleType === "car"
      ? Car
      : vehicleType === "bike"
        ? Bike
        : PersonStanding;

  return (
    <div className="mt-1 flex items-center gap-1 text-[9px] text-[#667577]">
      <Icon size={12} />
      <span className="capitalize">{vehicleType || "walking"}</span>
    </div>
  );
}

function LocationStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#D6DEDE] bg-white p-4 shadow-sm">
      <div className="text-[#07393C]">{icon}</div>
      <div>
        <div className="text-xl font-black text-[#07393C]">
          {value}
        </div>
        <div className="text-xs text-[#667577]">{title}</div>
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-[#F0EDEE] p-3">
      <div className="text-[10px] text-[#667577]">{label}</div>
      <div className="mt-1 text-xs font-black text-[#07393C]">
        {value}
      </div>
    </div>
  );
}
