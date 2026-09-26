import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Activity,
  Bike,
  Car,
  Clock3,
  PackageCheck,
  Users,
} from "lucide-react";

import {
  getMyDrivers,
} from "../api/driverApi";

import {
  getSupervisorDashboardStats,
} from "../api/statsApi";

import {
  DashboardSidebar,
} from "../components/dashboard/DashboardSidebar";

import {
  DashboardHeader,
} from "../components/dashboard/DashboardHeader";

import {
  StatCard,
} from "../components/dashboard/StatCard";

import type {
  Driver,
} from "../types/driver";

import type {
  SupervisorDashboardStatsResponse,
} from "../types/stats";

export default function DashboardPage() {
  const [
    drivers,
    setDrivers,
  ] =
    useState<Driver[]>(
      [],
    );

  const [
    stats,
    setStats,
  ] =
    useState<SupervisorDashboardStatsResponse | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const loadDashboard =
    useCallback(async () => {
      try {
        setLoading(
          true,
        );

        setError(
          null,
        );

        const [
          driversResponse,
          statsResponse,
        ] =
          await Promise.all([
            getMyDrivers(),
            getSupervisorDashboardStats(),
          ]);

        setDrivers(
          driversResponse.drivers ??
            [],
        );

        setStats(
          statsResponse,
        );
      } catch (
        error
      ) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load dashboard",
        );
      } finally {
        setLoading(
          false,
        );
      }
    }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const workingDrivers =
    drivers.filter(
      (driver) =>
        driver.workStatus ===
        "working",
    );

  const inactiveDrivers =
    drivers.filter(
      (driver) =>
        !driver.isActive,
    );

  return (
    <div className="min-h-screen bg-[#F4F6F6]">
      <DashboardSidebar />

      <div className="lg:pl-64">
        <DashboardHeader />

        <main className="mx-auto max-w-375 p-5 lg:p-8">
          <div className="mb-7">
            <h2 className="text-2xl font-black tracking-tight text-[#07393C]">
              Dashboard
            </h2>

            <p className="mt-1 text-sm text-[#667577]">
              Overview of drivers and delivery operations.
            </p>
          </div>

          {loading ? (
            <DashboardLoading />
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : (
            <>
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label="Total Drivers"
                  value={
                    stats?.drivers.total ??
                    drivers.length
                  }
                  helper="Drivers assigned to your operation"
                  icon={
                    <Users
                      size={20}
                    />
                  }
                />

                <StatCard
                  label="Working Now"
                  value={
                    stats?.drivers
                      .workingNow ??
                    workingDrivers.length
                  }
                  helper="Drivers with an active shift"
                  icon={
                    <Activity
                      size={20}
                    />
                  }
                />

                <StatCard
                  label="Delivered Today"
                  value={
                    stats?.stats.today
                      .orders
                      .delivered ??
                    0
                  }
                  helper="Completed deliveries today"
                  icon={
                    <PackageCheck
                      size={20}
                    />
                  }
                />

                <StatCard
                  label="Hours Today"
                  value={
                    stats?.stats.today
                      .work
                      .totalHours
                      ?.toFixed(
                        1,
                      ) ??
                    "0.0"
                  }
                  helper="Combined driver working time"
                  icon={
                    <Clock3
                      size={20}
                    />
                  }
                />
              </section>

              <section className="mt-7 grid gap-6 xl:grid-cols-[1.55fr_0.85fr]">
                <div className="overflow-hidden rounded-2xl border border-[#D6DEDE] bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#E5EAEA] px-5 py-4">
                    <div>
                      <h3 className="text-sm font-black text-[#07393C]">
                        Drivers
                      </h3>

                      <p className="mt-1 text-xs text-[#667577]">
                        Current driver availability
                      </p>
                    </div>

                    <div className="rounded-full bg-[#F0EDEE] px-3 py-1 text-xs font-bold text-[#2C666E]">
                      {
                        drivers.length
                      }{" "}
                      Total
                    </div>
                  </div>

                  <div className="divide-y divide-[#EDF0F0]">
                    {drivers
                      .slice(
                        0,
                        6,
                      )
                      .map(
                        (
                          driver,
                        ) => (
                          <DriverRow
                            key={
                              driver._id ??
                              driver.id
                            }
                            driver={
                              driver
                            }
                          />
                        ),
                      )}

                    {drivers.length ===
                      0 && (
                      <div className="p-8 text-center text-sm text-[#667577]">
                        No drivers found.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-[#D6DEDE] bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-black text-[#07393C]">
                      Driver Status
                    </h3>

                    <div className="mt-5 space-y-4">
                      <StatusRow
                        label="Working"
                        value={
                          workingDrivers.length
                        }
                        dotClass="bg-emerald-500"
                      />

                      <StatusRow
                        label="Not Working"
                        value={
                          Math.max(
                            drivers.length -
                              workingDrivers.length,
                            0,
                          )
                        }
                        dotClass="bg-slate-400"
                      />

                      <StatusRow
                        label="Inactive Accounts"
                        value={
                          inactiveDrivers.length
                        }
                        dotClass="bg-red-500"
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#07393C] p-5 text-white shadow-sm">
                    <p className="text-xs font-bold text-white/60">
                      Today
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {stats?.stats.today
                        .orders
                        .total ??
                        0}
                    </p>

                    <p className="mt-1 text-sm text-white/65">
                      Total orders
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white/10 p-3">
                        <div className="text-lg font-black">
                          {stats?.stats.today
                            .orders
                            .delivered ??
                            0}
                        </div>

                        <div className="mt-1 text-[10px] text-white/60">
                          Delivered
                        </div>
                      </div>

                      <div className="rounded-xl bg-white/10 p-3">
                        <div className="text-lg font-black">
                          {stats?.stats.today
                            .orders
                            .cancelled ??
                            0}
                        </div>

                        <div className="mt-1 text-[10px] text-white/60">
                          Cancelled
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function DriverRow({
  driver,
}: {
  driver: Driver;
}) {
  const isWorking =
    driver.workStatus ===
    "working";

  return (
    <div className="flex items-center gap-4 px-5 py-4 transition hover:bg-[#F8FAFA]">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D6DEDE] bg-[#F0EDEE]">
        {driver.profilePicture
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
          <span className="text-sm font-black text-[#07393C]">
            {driver.name
              ?.charAt(
                0,
              )
              .toUpperCase() ||
              "D"}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold text-[#0A090C]">
          {driver.shortName ||
            driver.name}
        </div>

        <div className="mt-1 truncate text-xs text-[#667577]">
          {driver.phone ||
            driver.iqamaId}
        </div>
      </div>

      <div className="hidden items-center gap-2 text-xs font-semibold text-[#667577] sm:flex">
        {driver.vehicleType ===
        "car" ? (
          <Car size={15} />
        ) : (
          <Bike size={15} />
        )}

        <span className="capitalize">
          {driver.vehicleType ||
            "Walking"}
        </span>
      </div>

      <div
        className={[
          "rounded-full px-3 py-1 text-[10px] font-extrabold",

          isWorking
            ? "bg-emerald-50 text-emerald-700"
            : "bg-slate-100 text-slate-500",
        ].join(" ")}
      >
        {isWorking
          ? "Working"
          : "Not Working"}
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  dotClass,
}: {
  label: string;
  value: number;
  dotClass: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span
          className={`h-2.5 w-2.5 rounded-full ${dotClass}`}
        />

        <span className="text-xs font-semibold text-[#667577]">
          {label}
        </span>
      </div>

      <span className="text-sm font-black text-[#07393C]">
        {value}
      </span>
    </div>
  );
}

function DashboardLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({
        length: 4,
      }).map(
        (
          _,
          index,
        ) => (
          <div
            key={
              index
            }
            className="h-32 animate-pulse rounded-2xl border border-[#D6DEDE] bg-white"
          />
        ),
      )}
    </div>
  );
}