import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import MapLibreMap, {
  Marker,
  NavigationControl,
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
} from "lucide-react";

import {
  getDriverLocation,
  getMyDriversLocations,
} from "../api/locationApi";

import {
  getMyDrivers,
} from "../api/driverApi";

import {
  onDriverLocationUpdate,
} from "../socket/socket";

import {
  DashboardHeader,
} from "../components/dashboard/DashboardHeader";

import {
  DashboardSidebar,
} from "../components/dashboard/DashboardSidebar";

import type {
  Driver,
} from "../types/driver";

import type {
  DriverLiveLocationUpdate,
  DriverLocation,
} from "../types/location";

const MAP_STYLE =
  "https://tiles.openfreemap.org/styles/liberty";

const DEFAULT_LATITUDE =
  24.7136;

const DEFAULT_LONGITUDE =
  46.6753;

type LocationWithDriver = {
  location: DriverLocation;
  driver: Driver | null;
  isWorking: boolean;
};

export default function LiveLocationPage() {
  const [
    locations,
    setLocations,
  ] =
    useState<DriverLocation[]>(
      [],
    );

  const [
    drivers,
    setDrivers,
  ] =
    useState<Driver[]>(
      [],
    );

  const [
    workingStatus,
    setWorkingStatus,
  ] = useState<
    Record<string, boolean>
  >({});

  const [
    selectedDriverId,
    setSelectedDriverId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    viewState,
    setViewState,
  ] = useState({
    longitude:
      DEFAULT_LONGITUDE,

    latitude:
      DEFAULT_LATITUDE,

    zoom: 10,
  });

  const loadData =
    useCallback(
      async (
        background =
          false,
      ) => {
        try {
          if (background) {
            setRefreshing(
              true,
            );
          } else {
            setLoading(
              true,
            );
          }

          setError(null);

          const [
            locationResponse,
            driverResponse,
          ] =
            await Promise.all([
              getMyDriversLocations(),
              getMyDrivers(),
            ]);

          const nextLocations =
            locationResponse.locations ??
            [];

          const nextDrivers =
            driverResponse.drivers ??
            [];

          setLocations(
            nextLocations,
          );

          setDrivers(
            nextDrivers,
          );

          const statuses:
            Record<
              string,
              boolean
            > = {};

          for (
            const driver of
            nextDrivers
          ) {
            const id =
              driver._id ??
              driver.id;

            if (!id) {
              continue;
            }

            statuses[id] =
              driver.workStatus ===
              "working";
          }

          setWorkingStatus(
            statuses,
          );

          if (
            nextLocations.length >
            0
          ) {
            const first =
              nextLocations[0];

            const latitude =
              Number(
                first.latitude,
              );

            const longitude =
              Number(
                first.longitude,
              );

            if (
              Number.isFinite(
                latitude,
              ) &&
              Number.isFinite(
                longitude,
              )
            ) {
              setViewState(
                (current) => ({
                  ...current,

                  latitude,
                  longitude,

                  zoom:
                    12,
                }),
              );
            }
          }
        } catch (error) {
          setError(
            getApiError(
              error,
            ),
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [],
    );

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /*
   * LIVE SOCKET LOCATIONS
   */
  useEffect(() => {
    const cleanup =
      onDriverLocationUpdate(
        (
          update:
            DriverLiveLocationUpdate,
        ) => {
          setWorkingStatus(
            (current) => ({
              ...current,

              [update.driverId]:
                update.isWorking,
            }),
          );

          setLocations(
            (current) => {
              const index =
                current.findIndex(
                  (location) =>
                    getDriverId(
                      location,
                    ) ===
                    update.driverId,
                );

              if (
                index === -1
              ) {
                void loadData(
                  true,
                );

                return current;
              }

              const next = [
                ...current,
              ];

              next[index] = {
                ...next[index],

                latitude:
                  update.latitude,

                longitude:
                  update.longitude,

                accuracy:
                  update.accuracy,

                speed:
                  update.speed,

                heading:
                  update.heading,

                recordedAt:
                  update.recordedAt,
              };

              return next;
            },
          );
        },
      );

    return cleanup;
  }, [loadData]);

  const driverMap =
    useMemo(() => {
      const map =
        new Map<
          string,
          Driver
        >();

      for (
        const driver of
        drivers
      ) {
        const id =
          driver._id ??
          driver.id;

        if (id) {
          map.set(
            id,
            driver,
          );
        }
      }

      return map;
    }, [drivers]);

  const mappedLocations =
    useMemo<
      LocationWithDriver[]
    >(() => {
      return locations
        .filter(
          (
            location,
          ) => {
            const latitude =
              Number(
                location.latitude,
              );

            const longitude =
              Number(
                location.longitude,
              );

            return (
              Number.isFinite(
                latitude,
              ) &&
              Number.isFinite(
                longitude,
              )
            );
          },
        )
        .map(
          (
            location,
          ) => {
            const driverId =
              getDriverId(
                location,
              );

            const driver =
              driverId
                ? driverMap.get(
                    driverId,
                  ) ??
                  getLocationDriver(
                    location,
                  )
                : null;

            return {
              location,

              driver:
                driver as Driver | null,

              isWorking:
                driverId
                  ? workingStatus[
                      driverId
                    ] ??
                    false
                  : false,
            };
          },
        );
    }, [
      locations,
      driverMap,
      workingStatus,
    ]);

  const filteredLocations =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return mappedLocations;
      }

      return mappedLocations.filter(
        ({
          driver,
        }) =>
          [
            driver?.name,
            driver?.shortName,
            driver?.phone,
            driver?.iqamaId,
            driver?.vehicleType,
          ].some((value) =>
            String(
              value ?? "",
            )
              .toLowerCase()
              .includes(
                query,
              ),
          ),
      );
    }, [
      mappedLocations,
      search,
    ]);

  const selected =
    useMemo(() => {
      if (
        !selectedDriverId
      ) {
        return null;
      }

      return (
        mappedLocations.find(
          (
            item,
          ) =>
            getDriverId(
              item.location,
            ) ===
            selectedDriverId,
        ) ?? null
      );
    }, [
      mappedLocations,
      selectedDriverId,
    ]);

  async function selectDriver(
    item:
      LocationWithDriver,
  ) {
    const driverId =
      getDriverId(
        item.location,
      );

    if (!driverId) {
      return;
    }

    setSelectedDriverId(
      driverId,
    );

    /*
     * Get latest location directly
     * from driver endpoint as well.
     */
    try {
      const response =
        await getDriverLocation(
          driverId,
        );

      const location =
        response.location ??
        item.location;

      setViewState({
        longitude:
          Number(
            location.longitude,
          ),

        latitude:
          Number(
            location.latitude,
          ),

        zoom:
          15,
      });
    } catch {
      setViewState({
        longitude:
          Number(
            item.location
              .longitude,
          ),

        latitude:
          Number(
            item.location
              .latitude,
          ),

        zoom:
          15,
      });
    }
  }

  const workingCount =
    mappedLocations.filter(
      (item) =>
        item.isWorking,
    ).length;

  return (
    <div className="min-h-screen bg-[#F4F6F6]">
      <DashboardSidebar />

      <div className="lg:pl-64">
        <DashboardHeader />

        <main className="mx-auto max-w-[1600px] p-5 lg:p-8">
          {/* TITLE */}

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#07393C]">
                Live Location
              </h1>

              <p className="mt-1 text-sm text-[#667577]">
                Track drivers and their latest reported locations.
              </p>
            </div>

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() =>
                void loadData(
                  true,
                )
              }
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#CAD4D4] bg-white px-4 text-xs font-bold text-[#07393C] transition hover:bg-[#F0EDEE] disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>
          </div>

          {/* SUMMARY */}

          <div className="mb-5 grid gap-4 sm:grid-cols-3">
            <LocationStat
              title="On Map"
              value={
                mappedLocations.length
              }
              icon={
                <MapPin
                  size={19}
                />
              }
            />

            <LocationStat
              title="Working"
              value={
                workingCount
              }
              icon={
                <LocateFixed
                  size={19}
                />
              }
            />

            <LocationStat
              title="Drivers"
              value={
                drivers.length
              }
              icon={
                <Users
                  size={19}
                />
              }
            />
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="h-162.5 animate-pulse rounded-2xl border border-[#D6DEDE] bg-white" />
          ) : (
            <section className="grid min-h-162.5 overflow-hidden rounded-2xl border border-[#D6DEDE] bg-white shadow-sm xl:grid-cols-[1fr_340px]">
              {/* MAP */}

              <div className="relative min-h-125">
                <MapLibreMap
                  {...viewState}
                  onMove={(
                    event,
                  ) =>
                    setViewState(
                      event.viewState,
                    )
                  }
                  mapStyle={
                    MAP_STYLE
                  }
                  style={{
                    width:
                      "100%",

                    height:
                      "100%",
                  }}
                >
                  <NavigationControl
                    position="top-left"
                  />

                  {filteredLocations.map(
                    (
                      item,
                    ) => {
                      const driverId =
                        getDriverId(
                          item.location,
                        );

                      if (
                        !driverId
                      ) {
                        return null;
                      }

                      const selected =
                        selectedDriverId ===
                        driverId;

                      return (
                        <Marker
                          key={
                            driverId
                          }
                          longitude={Number(
                            item.location
                              .longitude,
                          )}
                          latitude={Number(
                            item.location
                              .latitude,
                          )}
                          anchor="bottom"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              void selectDriver(
                                item,
                              )
                            }
                            className="group flex flex-col items-center"
                          >
                            <div
                              className={[
                                "flex items-center gap-2 rounded-xl border bg-white p-2 shadow-lg transition",

                                selected
                                  ? "border-[#07393C] ring-2 ring-[#07393C]/10"
                                  : "border-[#D6DEDE]",

                                !item.isWorking
                                  ? "opacity-65 grayscale"
                                  : "",
                              ].join(
                                " ",
                              )}
                            >
                              <DriverAvatar
                                driver={
                                  item.driver
                                }
                                working={
                                  item.isWorking
                                }
                              />

                              <div className="max-w-28 text-left">
                                <div className="truncate text-[11px] font-black text-[#07393C]">
                                  {item
                                    .driver
                                    ?.shortName ||
                                    item
                                      .driver
                                      ?.name ||
                                    "Driver"}
                                </div>

                                <div className="mt-0.5 truncate text-[9px] text-[#667577]">
                                  {item
                                    .driver
                                    ?.phone ||
                                    "-"}
                                </div>
                              </div>
                            </div>

                            <div
                              className={[
                                "h-0 w-0 border-l-[6px] border-r-[6px] border-t-8 border-l-transparent border-r-transparent",

                                selected
                                  ? "border-t-[#07393C]"
                                  : "border-t-white",
                              ].join(
                                " ",
                              )}
                            />
                          </button>
                        </Marker>
                      );
                    },
                  )}
                </MapLibreMap>

                {selected && (
                  <SelectedDriverPanel
                    item={
                      selected
                    }
                  />
                )}
              </div>

              {/* RIGHT DRIVER LIST */}

              <aside className="border-t border-[#D6DEDE] bg-white xl:border-l xl:border-t-0">
                <div className="border-b border-[#EDF0F0] p-4">
                  <div className="text-sm font-black text-[#07393C]">
                    Drivers
                  </div>

                  <div className="mt-3 relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#667577]"
                    />

                    <input
                      value={
                        search
                      }
                      onChange={(
                        event,
                      ) =>
                        setSearch(
                          event
                            .target
                            .value,
                        )
                      }
                      placeholder="Search drivers..."
                      className="h-10 w-full rounded-xl border border-[#CAD4D4] pl-9 pr-3 text-xs outline-none focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10"
                    />
                  </div>
                </div>

                <div className="max-h-147.5 overflow-y-auto">
                  {filteredLocations.map(
                    (
                      item,
                    ) => {
                      const id =
                        getDriverId(
                          item.location,
                        );

                      return (
                        <button
                          key={
                            id
                          }
                          type="button"
                          onClick={() =>
                            void selectDriver(
                              item,
                            )
                          }
                          className={[
                            "flex w-full items-center gap-3 border-b border-[#EDF0F0] p-4 text-left transition hover:bg-[#F8FAFA]",

                            selectedDriverId ===
                            id
                              ? "bg-[#F0F7F7]"
                              : "",
                          ].join(
                            " ",
                          )}
                        >
                          <DriverAvatar
                            driver={
                              item.driver
                            }
                            working={
                              item.isWorking
                            }
                            size={
                              42
                            }
                          />

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-black text-[#07393C]">
                              {item
                                .driver
                                ?.shortName ||
                                item
                                  .driver
                                  ?.name ||
                                "Driver"}
                            </div>

                            {item
                              .driver
                              ?.shortName &&
                              item
                                .driver
                                ?.name && (
                                <div className="mt-0.5 truncate text-[10px] text-[#667577]">
                                  {
                                    item
                                      .driver
                                      .name
                                  }
                                </div>
                              )}

                            <div className="mt-1 flex items-center gap-2">
                              <VehicleInfo
                                vehicleType={
                                  item
                                    .driver
                                    ?.vehicleType
                                }
                                working={
                                  item.isWorking
                                }
                              />

                              <span className="text-[9px] text-[#8A989A]">
                                {formatLastSeen(
                                  item
                                    .location
                                    .recordedAt,
                                )}
                              </span>
                            </div>
                          </div>

                          <span
                            className={[
                              "h-2.5 w-2.5 shrink-0 rounded-full",

                              item.isWorking
                                ? "bg-emerald-500"
                                : "bg-slate-400",
                            ].join(
                              " ",
                            )}
                          />
                        </button>
                      );
                    },
                  )}

                  {filteredLocations.length ===
                    0 && (
                    <div className="p-8 text-center text-xs text-[#667577]">
                      No driver locations found.
                    </div>
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

function SelectedDriverPanel({
  item,
}: {
  item:
    LocationWithDriver;
}) {
  const {
    driver,
    location,
    isWorking,
  } = item;

  return (
    <div className="absolute bottom-5 left-5 right-5 z-10 max-w-md rounded-2xl border border-[#D6DEDE] bg-white/95 p-4 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-3">
        <DriverAvatar
          driver={
            driver
          }
          working={
            isWorking
          }
          size={
            48
          }
        />

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-black text-[#07393C]">
            {driver?.shortName ||
              driver?.name ||
              "Driver"}
          </div>

          {driver?.shortName &&
            driver.name && (
              <div className="mt-0.5 truncate text-xs text-[#667577]">
                {
                  driver.name
                }
              </div>
            )}

          <div className="mt-1 text-xs text-[#667577]">
            {driver?.phone ??
              "-"}
          </div>
        </div>

        <span
          className={[
            "rounded-full px-3 py-1 text-[10px] font-black",

            isWorking
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500",
          ].join(
            " ",
          )}
        >
          {isWorking
            ? "Working"
            : "Not Working"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <InfoBox
          label="Vehicle"
          value={
            driver?.vehicleType ??
            "Walking"
          }
        />

        <InfoBox
          label="Speed"
          value={
            location.speed !=
              null
              ? `${Math.max(
                  0,
                  Number(
                    location.speed,
                  ) *
                    3.6,
                ).toFixed(
                  0,
                )} km/h`
              : "-"
          }
        />

        <InfoBox
          label="Accuracy"
          value={
            location.accuracy !=
              null
              ? `${Math.round(
                  Number(
                    location.accuracy,
                  ),
                )} m`
              : "-"
          }
        />
      </div>

      <div className="mt-3 text-[10px] text-[#8A989A]">
        Last update:{" "}
        {formatLastSeen(
          location.recordedAt,
        )}
      </div>
    </div>
  );
}

function DriverAvatar({
  driver,
  working,
  size = 34,
}: {
  driver:
    | Driver
    | null;

  working:
    boolean;

  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
      }}
      className={[
        "shrink-0 overflow-hidden rounded-full border-2",

        working
          ? "border-emerald-500"
          : "border-slate-400 opacity-70",
      ].join(
        " ",
      )}
    >
      {driver?.profilePicture
        ?.url ? (
        <img
          src={
            driver
              .profilePicture
              .url
          }
          alt={
            driver.name
          }
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={[
            "flex h-full w-full items-center justify-center",

            working
              ? "bg-[#07393C] text-white"
              : "bg-slate-400 text-white",
          ].join(
            " ",
          )}
        >
          <PersonStanding
            size={
              size * 0.48
            }
          />
        </div>
      )}
    </div>
  );
}

function VehicleInfo({
  vehicleType,
  working,
}: {
  vehicleType?:
    | "car"
    | "bike"
    | null;

  working:
    boolean;
}) {
  const className =
    working
      ? "text-[#2C666E]"
      : "text-slate-400";

  return (
    <div className="flex items-center gap-1">
      {vehicleType ===
      "car" ? (
        <Car
          size={12}
          className={
            className
          }
        />
      ) : vehicleType ===
        "bike" ? (
        <Bike
          size={12}
          className={
            className
          }
        />
      ) : (
        <PersonStanding
          size={12}
          className={
            className
          }
        />
      )}

      <span
        className={`text-[9px] font-semibold capitalize ${className}`}
      >
        {vehicleType ??
          "walking"}
      </span>
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
  icon:
    React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#D6DEDE] bg-white p-4 shadow-sm">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF4F4] text-[#07393C]">
        {icon}
      </div>

      <div>
        <div className="text-2xl font-black text-[#07393C]">
          {value}
        </div>

        <div className="text-xs text-[#667577]">
          {title}
        </div>
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
      <div className="text-[9px] font-semibold text-[#667577]">
        {label}
      </div>

      <div className="mt-1 truncate text-xs font-black capitalize text-[#07393C]">
        {value}
      </div>
    </div>
  );
}

function getDriverId(
  location:
    DriverLocation,
) {
  if (
    typeof location.driver ===
    "string"
  ) {
    return location.driver;
  }

  return (
    location.driver?._id ??
    location.driver?.id ??
    null
  );
}

function getLocationDriver(
  location:
    DriverLocation,
) {
  if (
    typeof location.driver ===
    "string"
  ) {
    return null;
  }

  return location.driver;
}

function formatLastSeen(
  value?: string | null,
) {
  if (!value) {
    return "Unknown";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
  }

  const seconds =
    Math.floor(
      (Date.now() -
        date.getTime()) /
        1000,
    );

  if (seconds < 10) {
    return "Just now";
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes =
    Math.floor(
      seconds / 60,
    );

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `${hours}h ago`;
  }

  return date.toLocaleString();
}

function getApiError(
  error: unknown,
) {
  if (
    typeof error ===
      "object" &&
    error !== null &&
    "response" in error
  ) {
    const axiosError =
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

    if (
      axiosError.response
        ?.data?.message
    ) {
      return axiosError.response
        .data.message;
    }
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Unable to load driver locations";
}