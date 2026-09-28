import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  Activity,
  BarChart3,
  Bike,
  CalendarDays,
  Car,
  CheckCircle2,
  Clock3,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  Truck,
  UserCheck,
  Users,
  UserX,
  XCircle,
} from "lucide-react";

import {
  getSupervisorDashboardStats,
  getSupervisorRangeStats,
} from "../api/statsApi";

import {
  getMyDrivers,
} from "../api/driverApi";

import {
  DashboardHeader,
} from "../components/dashboard/DashboardHeader";

import {
  DashboardSidebar,
} from "../components/dashboard/DashboardSidebar";

import type {
  PeriodStats,
  StatsPeriod,
  SupervisorDashboardStatsResponse,
  SupervisorRangeStatsResponse,
} from "../types/stats";

import type {
  Driver,
} from "../types/driver";

export default function StatsPage() {
  const [
    dashboard,
    setDashboard,
  ] =
    useState<SupervisorDashboardStatsResponse | null>(
      null,
    );

  const [
    drivers,
    setDrivers,
  ] = useState<Driver[]>([]);

  const [
    selectedPeriod,
    setSelectedPeriod,
  ] =
    useState<StatsPeriod>(
      "today",
    );

  const [
    selectedDriverId,
    setSelectedDriverId,
  ] = useState("");

  const [
    from,
    setFrom,
  ] = useState(
    getDefaultFromDate(),
  );

  const [
    to,
    setTo,
  ] = useState(
    getTodayDate(),
  );

  const [
    rangeStats,
    setRangeStats,
  ] =
    useState<SupervisorRangeStatsResponse | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    loadingRange,
    setLoadingRange,
  ] = useState(false);

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
    rangeError,
    setRangeError,
  ] =
    useState<string | null>(
      null,
    );

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(true);

        setError(null);

        const [
          statsResponse,
          driversResponse,
        ] =
          await Promise.all([
            getSupervisorDashboardStats(),
            getMyDrivers(),
          ]);

        setDashboard(
          statsResponse,
        );

        setDrivers(
          driversResponse.drivers ??
            [],
        );
      } catch (error) {
        setError(
          getApiError(
            error,
            "Unable to load statistics",
          ),
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const periodStats =
    useMemo<
      PeriodStats | null
    >(() => {
      if (!dashboard) {
        return null;
      }

      return dashboard.stats[
        selectedPeriod
      ];
    }, [
      dashboard,
      selectedPeriod,
    ]);

  async function handleRefresh() {
    try {
      setRefreshing(true);

      await loadDashboard();

      if (
        rangeStats &&
        from &&
        to
      ) {
        await loadRangeStats();
      }
    } finally {
      setRefreshing(false);
    }
  }

  async function loadRangeStats() {
    if (
      !from ||
      !to
    ) {
      setRangeError(
        "Please select both From and To dates.",
      );

      return;
    }

    if (from > to) {
      setRangeError(
        "From date cannot be after To date.",
      );

      return;
    }

    try {
      setLoadingRange(true);

      setRangeError(null);

      const response =
        await getSupervisorRangeStats(
          from,
          to,
          selectedDriverId ||
            undefined,
        );

      setRangeStats(
        response,
      );
    } catch (error) {
      setRangeError(
        getApiError(
          error,
          "Unable to load range statistics",
        ),
      );
    } finally {
      setLoadingRange(false);
    }
  }

  function resetRange() {
    setSelectedDriverId(
      "",
    );

    setFrom(
      getDefaultFromDate(),
    );

    setTo(
      getTodayDate(),
    );

    setRangeStats(
      null,
    );

    setRangeError(
      null,
    );
  }

  const selectedDriver =
    drivers.find(
      (driver) =>
        (driver._id ??
          driver.id) ===
        selectedDriverId,
    );

  return (
    <div className="min-h-screen bg-[#F4F6F6]">
      <DashboardSidebar />

      <div className="lg:pl-64">
        <DashboardHeader />

        <main className="mx-auto max-w-[1600px] p-5 lg:p-8">
          {/* =========================
              PAGE HEADER
          ========================= */}

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3
                  size={22}
                  className="text-[#07393C]"
                />

                <h1 className="text-2xl font-black text-[#07393C]">
                  Statistics
                </h1>
              </div>

              <p className="mt-1 text-sm text-[#667577]">
                Monitor drivers,
                deliveries and working
                hours.
              </p>
            </div>

            <button
              type="button"
              disabled={
                refreshing
              }
              onClick={() =>
                void handleRefresh()
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

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <StatsLoading />
          ) : dashboard ? (
            <>
              {/* =========================
                  DRIVER SUMMARY
              ========================= */}

              <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  title="Total Drivers"
                  value={
                    dashboard.drivers
                      .total
                  }
                  icon={
                    <Users
                      size={20}
                    />
                  }
                />

                <StatCard
                  title="Working Now"
                  value={
                    dashboard.drivers
                      .workingNow
                  }
                  icon={
                    <Activity
                      size={20}
                    />
                  }
                  subtitle="Currently on shift"
                />

                <StatCard
                  title="Active Accounts"
                  value={
                    dashboard.drivers
                      .active
                  }
                  icon={
                    <UserCheck
                      size={20}
                    />
                  }
                />

                <StatCard
                  title="Inactive Accounts"
                  value={
                    dashboard.drivers
                      .inactive
                  }
                  icon={
                    <UserX
                      size={20}
                    />
                  }
                />
              </section>

              {/* =========================
                  PERIOD STATS
              ========================= */}

              <section className="mb-6 overflow-hidden rounded-2xl border border-[#D6DEDE] bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-[#EDF0F0] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-sm font-black text-[#07393C]">
                      Team Performance
                    </h2>

                    <p className="mt-1 text-xs text-[#667577]">
                      {
                        dashboard.timezone
                      }
                    </p>
                  </div>

                  <PeriodSelector
                    value={
                      selectedPeriod
                    }
                    onChange={
                      setSelectedPeriod
                    }
                  />
                </div>

                {periodStats && (
                  <div className="p-5">
                    <PeriodOverview
                      stats={
                        periodStats
                      }
                    />
                  </div>
                )}
              </section>

              {/* =========================
                  ORDER DISTRIBUTION
              ========================= */}

              {periodStats && (
                <section className="mb-6 grid gap-6 xl:grid-cols-[1fr_380px]">
                  <div className="rounded-2xl border border-[#D6DEDE] bg-white p-5 shadow-sm">
                    <div className="mb-6">
                      <h2 className="text-sm font-black text-[#07393C]">
                        Order Distribution
                      </h2>

                      <p className="mt-1 text-xs text-[#667577]">
                        Breakdown for{" "}
                        {getPeriodLabel(
                          selectedPeriod,
                        ).toLowerCase()}
                      </p>
                    </div>

                    <OrderDistribution
                      stats={
                        periodStats.orders
                      }
                    />
                  </div>

                  <div className="rounded-2xl border border-[#D6DEDE] bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-black text-[#07393C]">
                      Working Hours
                    </h2>

                    <p className="mt-1 text-xs text-[#667577]">
                      Total team working
                      time
                    </p>

                    <div className="mt-7 flex flex-col items-center justify-center py-4 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EAF4F4] text-[#07393C]">
                        <Clock3
                          size={31}
                        />
                      </div>

                      <div className="mt-5 text-4xl font-black text-[#07393C]">
                        {formatHours(
                          periodStats
                            .work
                            .totalHours,
                        )}
                      </div>

                      <div className="mt-1 text-xs font-semibold text-[#667577]">
                        total hours
                      </div>

                      <div className="mt-3 text-[10px] text-[#8A989A]">
                        {formatSeconds(
                          periodStats
                            .work
                            .totalSeconds,
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* =========================
                  CUSTOM RANGE
              ========================= */}

              <section className="rounded-2xl border border-[#D6DEDE] bg-white shadow-sm">
                <div className="border-b border-[#EDF0F0] p-5">
                  <div className="flex items-center gap-2">
                    <CalendarDays
                      size={17}
                      className="text-[#07393C]"
                    />

                    <h2 className="text-sm font-black text-[#07393C]">
                      Custom Report
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-[#667577]">
                    Select a date range
                    and optionally filter
                    by driver.
                  </p>
                </div>

                <div className="p-5">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_auto_auto]">
                    {/* DRIVER */}

                    <div>
                      <FilterLabel>
                        Driver
                      </FilterLabel>

                      <select
                        value={
                          selectedDriverId
                        }
                        onChange={(
                          event,
                        ) => {
                          setSelectedDriverId(
                            event
                              .target
                              .value,
                          );

                          setRangeStats(
                            null,
                          );
                        }}
                        className="h-10 w-full rounded-xl border border-[#CAD4D4] bg-white px-3 text-xs text-[#07393C] outline-none transition focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10"
                      >
                        <option value="">
                          Entire Team
                        </option>

                        {drivers.map(
                          (
                            driver,
                          ) => {
                            const id =
                              driver._id ??
                              driver.id;

                            if (
                              !id
                            ) {
                              return null;
                            }

                            return (
                              <option
                                key={
                                  id
                                }
                                value={
                                  id
                                }
                              >
                                {driver.shortName ||
                                  driver.name}
                              </option>
                            );
                          },
                        )}
                      </select>
                    </div>

                    {/* FROM */}

                    <div>
                      <FilterLabel>
                        From
                      </FilterLabel>

                      <input
                        type="date"
                        value={from}
                        max={
                          to ||
                          undefined
                        }
                        onChange={(
                          event,
                        ) => {
                          const value =
                            event
                              .target
                              .value;

                          setFrom(
                            value,
                          );

                          setRangeStats(
                            null,
                          );

                          if (
                            to &&
                            value >
                              to
                          ) {
                            setTo(
                              value,
                            );
                          }
                        }}
                        className="h-10 w-full rounded-xl border border-[#CAD4D4] bg-white px-3 text-xs text-[#07393C] outline-none transition focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10"
                      />
                    </div>

                    {/* TO */}

                    <div>
                      <FilterLabel>
                        To
                      </FilterLabel>

                      <input
                        type="date"
                        value={to}
                        min={
                          from ||
                          undefined
                        }
                        max={
                          getTodayDate()
                        }
                        onChange={(
                          event,
                        ) => {
                          setTo(
                            event
                              .target
                              .value,
                          );

                          setRangeStats(
                            null,
                          );
                        }}
                        className="h-10 w-full rounded-xl border border-[#CAD4D4] bg-white px-3 text-xs text-[#07393C] outline-none transition focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10"
                      />
                    </div>

                    {/* ANALYZE */}

                    <div className="self-end">
                      <button
                        type="button"
                        disabled={
                          loadingRange
                        }
                        onClick={() =>
                          void loadRangeStats()
                        }
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#07393C] px-5 text-xs font-black text-white transition hover:bg-[#2C666E] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {loadingRange ? (
                          <RefreshCw
                            size={
                              14
                            }
                            className="animate-spin"
                          />
                        ) : (
                          <Search
                            size={
                              14
                            }
                          />
                        )}

                        Analyze
                      </button>
                    </div>

                    {/* RESET */}

                    <div className="self-end">
                      <button
                        type="button"
                        onClick={
                          resetRange
                        }
                        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#CAD4D4] bg-white px-4 text-xs font-bold text-[#667577] transition hover:bg-[#F0EDEE]"
                      >
                        <RotateCcw
                          size={14}
                        />

                        Reset
                      </button>
                    </div>
                  </div>

                  {selectedDriver && (
                    <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#F4F8F8] p-3">
                      <DriverAvatar
                        driver={
                          selectedDriver
                        }
                      />

                      <div>
                        <div className="text-xs font-black text-[#07393C]">
                          {selectedDriver.shortName ||
                            selectedDriver.name}
                        </div>

                        <div className="mt-0.5 text-[10px] text-[#667577]">
                          Custom report
                          will show this
                          driver only.
                        </div>
                      </div>
                    </div>
                  )}

                  {rangeError && (
                    <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                      {rangeError}
                    </div>
                  )}

                  {loadingRange && (
                    <div className="mt-6">
                      <RangeLoading />
                    </div>
                  )}

                  {!loadingRange &&
                    rangeStats && (
                      <div className="mt-7 border-t border-[#EDF0F0] pt-6">
                        <RangeReport
                          stats={
                            rangeStats
                          }
                        />
                      </div>
                    )}
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   PERIOD SELECTOR
========================================================= */

function PeriodSelector({
  value,
  onChange,
}: {
  value: StatsPeriod;

  onChange: (
    value: StatsPeriod,
  ) => void;
}) {
  const options: {
    value: StatsPeriod;
    label: string;
  }[] = [
    {
      value: "today",
      label: "Today",
    },
    {
      value: "week",
      label: "Week",
    },
    {
      value: "month",
      label: "Month",
    },
  ];

  return (
    <div className="inline-flex rounded-xl bg-[#F0EDEE] p-1">
      {options.map(
        (option) => {
          const active =
            value ===
            option.value;

          return (
            <button
              key={
                option.value
              }
              type="button"
              onClick={() =>
                onChange(
                  option.value,
                )
              }
              className={`rounded-lg px-4 py-2 text-[11px] font-black transition ${
                active
                  ? "bg-[#07393C] text-white shadow-sm"
                  : "text-[#667577] hover:text-[#07393C]"
              }`}
            >
              {
                option.label
              }
            </button>
          );
        },
      )}
    </div>
  );
}

/* =========================================================
   PERIOD OVERVIEW
========================================================= */

function PeriodOverview({
  stats,
}: {
  stats: PeriodStats;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        label="Total Orders"
        value={
          stats.orders.total
        }
        icon={
          <Package
            size={17}
          />
        }
      />

      <MetricCard
        label="Picked Up"
        value={
          stats.orders
            .pickedUp
        }
        icon={
          <Truck
            size={17}
          />
        }
      />

      <MetricCard
        label="Delivered"
        value={
          stats.orders
            .delivered
        }
        icon={
          <CheckCircle2
            size={17}
          />
        }
      />

      <MetricCard
        label="Cancelled"
        value={
          stats.orders
            .cancelled
        }
        icon={
          <XCircle
            size={17}
          />
        }
      />

      <MetricCard
        label="Work Hours"
        value={formatHours(
          stats.work
            .totalHours,
        )}
        icon={
          <Clock3
            size={17}
          />
        }
      />
    </div>
  );
}

/* =========================================================
   ORDER DISTRIBUTION
========================================================= */

function OrderDistribution({
  stats,
}: {
  stats: PeriodStats["orders"];
}) {
  const total =
    Math.max(
      stats.total,
      1,
    );

  return (
    <div className="space-y-5">
      <DistributionRow
        label="Picked Up"
        value={
          stats.pickedUp
        }
        total={total}
      />

      <DistributionRow
        label="Delivered"
        value={
          stats.delivered
        }
        total={total}
      />

      <DistributionRow
        label="Cancelled"
        value={
          stats.cancelled
        }
        total={total}
      />
    </div>
  );
}

function DistributionRow({
  label,
  value,
  total,
}: {
  label: string;

  value: number;

  total: number;
}) {
  const percentage =
    Math.min(
      100,
      Math.max(
        0,
        (value / total) *
          100,
      ),
    );

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-xs font-bold text-[#667577]">
          {label}
        </span>

        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-[#07393C]">
            {value}
          </span>

          <span className="w-11 text-right text-[10px] text-[#8A989A]">
            {percentage.toFixed(
              0,
            )}
            %
          </span>
        </div>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-[#E6ECEC]">
        <div
          className="h-full rounded-full bg-[#2C666E] transition-all duration-300"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   CUSTOM RANGE REPORT
========================================================= */

function RangeReport({
  stats,
}: {
  stats:
    SupervisorRangeStatsResponse;
}) {
  const driverMode =
    stats.drivers.mode ===
    "driver";

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-black text-[#07393C]">
            {driverMode
              ? "Driver Report"
              : "Team Report"}
          </h3>

          <p className="mt-1 text-xs text-[#667577]">
            {formatSimpleDate(
              stats.range.from,
            )}{" "}
            →{" "}
            {formatSimpleDate(
              stats.range.to,
            )}
          </p>
        </div>

        <span className="w-fit rounded-full bg-[#EAF4F4] px-3 py-1 text-[10px] font-black text-[#2C666E]">
          {stats.timezone}
        </span>
      </div>

      {stats.drivers.mode ===
        "team" ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SmallStat
            label="Drivers"
            value={
              stats.drivers
                .total
            }
          />

          <SmallStat
            label="Active"
            value={
              stats.drivers
                .active
            }
          />

          <SmallStat
            label="Inactive"
            value={
              stats.drivers
                .inactive
            }
          />

          <SmallStat
            label="Working Now"
            value={
              stats.drivers
                .workingNow
            }
          />
        </div>
      ) : (
        <DriverRangeHeader
          stats={stats}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total Orders"
          value={
            stats.orders.total
          }
          icon={
            <Package
              size={17}
            />
          }
        />

        <MetricCard
          label="Picked Up"
          value={
            stats.orders
              .pickedUp
          }
          icon={
            <Truck
              size={17}
            />
          }
        />

        <MetricCard
          label="Delivered"
          value={
            stats.orders
              .delivered
          }
          icon={
            <CheckCircle2
              size={17}
            />
          }
        />

        <MetricCard
          label="Cancelled"
          value={
            stats.orders
              .cancelled
          }
          icon={
            <XCircle
              size={17}
            />
          }
        />

        <MetricCard
          label="Work Hours"
          value={formatHours(
            stats.work
              .totalHours,
          )}
          icon={
            <Clock3
              size={17}
            />
          }
        />
      </div>
    </div>
  );
}

/* =========================================================
   DRIVER RANGE HEADER
========================================================= */

function DriverRangeHeader({
  stats,
}: {
  stats:
    SupervisorRangeStatsResponse;
}) {
  if (
    stats.drivers.mode !==
    "driver"
  ) {
    return null;
  }

  const driver =
    stats.drivers.driver;

  return (
    <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-[#F4F8F8] p-4 sm:flex-row sm:items-center">
      <StatsDriverAvatar
        name={
          driver.name
        }
        url={
          driver.profilePicture
            ?.url
        }
      />

      <div className="min-w-0 flex-1">
        <div className="font-black text-[#07393C]">
          {driver.shortName ||
            driver.name}
        </div>

        {driver.shortName && (
          <div className="mt-0.5 text-xs text-[#667577]">
            {driver.name}
          </div>
        )}

        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-[#667577]">
          <span>
            Iqama:{" "}
            <strong>
              {
                driver.iqamaId
              }
            </strong>
          </span>

          {driver.phone && (
            <span>
              Phone:{" "}
              <strong>
                {
                  driver.phone
                }
              </strong>
            </span>
          )}

          {driver.vehicleType && (
            <span className="inline-flex items-center gap-1 capitalize">
              {driver.vehicleType ===
              "bike" ? (
                <Bike
                  size={11}
                />
              ) : (
                <Car
                  size={11}
                />
              )}

              {
                driver.vehicleType
              }
            </span>
          )}
        </div>
      </div>

      <span
        className={`w-fit rounded-full px-3 py-1 text-[10px] font-black ${
          stats.drivers
            .workingNow
            ? "bg-emerald-50 text-emerald-700"
            : "bg-[#E7ECEC] text-[#667577]"
        }`}
      >
        {stats.drivers
          .workingNow
          ? "Working Now"
          : "Not Working"}
      </span>
    </div>
  );
}

/* =========================================================
   CARDS
========================================================= */

function StatCard({
  title,
  value,
  icon,
  subtitle,
}: {
  title: string;

  value:
    | number
    | string;

  icon: ReactNode;

  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#D6DEDE] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-[#667577]">
            {title}
          </p>

          <div className="mt-2 text-3xl font-black text-[#07393C]">
            {value}
          </div>

          {subtitle && (
            <p className="mt-1 text-[10px] text-[#8A989A]">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF4F4] text-[#07393C]">
          {icon}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;

  value:
    | number
    | string;

  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#E1E7E7] bg-[#FAFCFC] p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-bold uppercase tracking-wide text-[#667577]">
          {label}
        </div>

        <div className="text-[#2C666E]">
          {icon}
        </div>
      </div>

      <div className="mt-3 text-xl font-black text-[#07393C]">
        {value}
      </div>
    </div>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;

  value: number;
}) {
  return (
    <div className="rounded-xl bg-[#F0EDEE] p-4">
      <div className="text-[9px] font-bold uppercase tracking-wide text-[#667577]">
        {label}
      </div>

      <div className="mt-2 text-xl font-black text-[#07393C]">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   DRIVER AVATAR
========================================================= */

function DriverAvatar({
  driver,
}: {
  driver: Driver;
}) {
  const imageUrl =
    driver.profilePicture
      ?.url;

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#07393C] text-xs font-black text-white">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={
            driver.name
          }
          className="h-full w-full object-cover"
        />
      ) : (
        getInitial(
          driver.name,
        )
      )}
    </div>
  );
}

function StatsDriverAvatar({
  name,
  url,
}: {
  name: string;

  url?:
    | string
    | null;
}) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#07393C] text-base font-black text-white">
      {url &&
      !failed ? (
        <img
          src={url}
          alt={name}
          onError={() =>
            setFailed(true)
          }
          className="h-full w-full object-cover"
        />
      ) : (
        getInitial(name)
      )}
    </div>
  );
}

/* =========================================================
   LABEL
========================================================= */

function FilterLabel({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <label className="mb-2 block text-[10px] font-black uppercase tracking-wide text-[#667577]">
      {children}
    </label>
  );
}

/* =========================================================
   LOADING
========================================================= */

function StatsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map(
          (_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-2xl bg-white"
            />
          ),
        )}
      </div>

      <div className="h-80 animate-pulse rounded-2xl bg-white" />
    </div>
  );
}

function RangeLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {Array.from({
        length: 5,
      }).map(
        (_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-xl bg-[#F0EDEE]"
          />
        ),
      )}
    </div>
  );
}

/* =========================================================
   HELPERS
========================================================= */

function getPeriodLabel(
  period: StatsPeriod,
) {
  switch (period) {
    case "today":
      return "Today";

    case "week":
      return "This Week";

    case "month":
      return "This Month";

    default:
      return period;
  }
}

function formatHours(
  value: number,
) {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    return "0";
  }

  if (
    Number.isInteger(
      value,
    )
  ) {
    return String(
      value,
    );
  }

  return value.toFixed(
    1,
  );
}

function formatSeconds(
  totalSeconds: number,
) {
  const safe =
    Math.max(
      0,
      Math.floor(
        totalSeconds || 0,
      ),
    );

  const hours =
    Math.floor(
      safe / 3600,
    );

  const minutes =
    Math.floor(
      (safe % 3600) /
        60,
    );

  return `${hours}h ${minutes}m`;
}

function getTodayDate() {
  return formatDateInput(
    new Date(),
  );
}

function getDefaultFromDate() {
  const date =
    new Date();

  date.setDate(
    date.getDate() -
      6,
  );

  return formatDateInput(
    date,
  );
}

function formatDateInput(
  date: Date,
) {
  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
        1,
    ).padStart(
      2,
      "0",
    );

  const day =
    String(
      date.getDate(),
    ).padStart(
      2,
      "0",
    );

  return `${year}-${month}-${day}`;
}

function formatSimpleDate(
  value: string,
) {
  const date =
    new Date(
      `${value}T00:00:00`,
    );

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }

  return date.toLocaleDateString(
    undefined,
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function getInitial(
  name?:
    | string
    | null,
) {
  return (
    name
      ?.trim()
      .charAt(0)
      .toUpperCase() ||
    "D"
  );
}

function getApiError(
  error: unknown,
  fallback: string,
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

    const message =
      axiosError.response
        ?.data?.message;

    if (message) {
      return message;
    }
  }

  if (
    error instanceof Error
  ) {
    return (
      error.message ||
      fallback
    );
  }

  return fallback;
}