
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
  RefreshCw,
  Plus,
  ArrowUpRight,
} from "lucide-react";

import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getMyDrivers } from "../api/driverApi";

import {
  getSupervisorDashboardStats,
  getSupervisorDriversDashboard,
} from "../api/statsApi";

import { DashboardSidebar } from "../components/dashboard/DashboardSidebar";
import { DashboardHeader } from "../components/dashboard/DashboardHeader";
import { StatCard } from "../components/dashboard/StatCard";

import type { Driver } from "../types/driver";

import type {
  SupervisorDashboardStatsResponse,
  SupervisorDashboardDriverItem,
} from "../types/stats";

type DriverFilter = "all" | "working" | "notWorking";

type DashboardDriver = {
  driver: Driver;
  workingNow: boolean;
  orders: {
    deliveredToday: number;
    deliveredThisMonth: number;
  };
  todayWork: {
    firstShiftStartedAt: string | null;
    lastShiftEndedAt: string | null;
    totalSeconds: number;
    totalHours: number;
    workingNow: boolean;
  };
};

function formatTime(value?: string | null) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Riyadh",
  }).format(date);
}

function formatDuration(seconds?: number | null) {
  const totalMinutes = Math.floor(
    Math.max(0, Number(seconds) || 0) / 60,
  );

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (!hours && !minutes) return "0m";
  if (!hours) return `${minutes}m`;
  if (!minutes) return `${hours}h`;

  return `${hours}h ${minutes}m`;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [drivers, setDrivers] = useState<Driver[]>([]);

  const [dashboardDrivers, setDashboardDrivers] = useState<
    SupervisorDashboardDriverItem[]
  >([]);

  const [stats, setStats] =
    useState<SupervisorDashboardStatsResponse | null>(null);

  const [filter, setFilter] = useState<DriverFilter>("all");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(
    async (refresh = false) => {
      try {
        if (refresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError(null);

        const [
          driversResponse,
          statsResponse,
          dashboardResponse,
        ] = await Promise.all([
          getMyDrivers(),
          getSupervisorDashboardStats(),
          getSupervisorDriversDashboard(),
        ]);

        setDrivers(driversResponse.drivers ?? []);
        setStats(statsResponse);
        setDashboardDrivers(dashboardResponse.drivers ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : t(
                "supervisor.dashboardLoadFailed",
                "Unable to load dashboard",
              ),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  // Use the statistics API as the source of truth
  // for working status and delivery metrics.
  const detailedDrivers: DashboardDriver[] =
    dashboardDrivers.map((item) => {
      const matchingDriver = drivers.find(
        (driver) =>
          (driver._id ?? driver.id) === item.driver._id,
      );

      return {
        driver: {
          ...item.driver,
          ...matchingDriver,
          profilePicture:
            matchingDriver?.profilePicture ??
            item.driver.profilePicture,
        } as Driver,

        workingNow: item.todayWork.workingNow,

        orders: item.orders,

        todayWork: item.todayWork,
      };
    });

  const workingCount = detailedDrivers.filter(
    (item) => item.workingNow,
  ).length;

  const notWorkingCount =
    detailedDrivers.length - workingCount;

  const inactiveCount = detailedDrivers.filter(
    (item) => !item.driver.isActive,
  ).length;

  const visibleDrivers = detailedDrivers.filter((item) => {
    if (filter === "working") return item.workingNow;

    if (filter === "notWorking") {
      return !item.workingNow;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4F6F6]">
      <DashboardSidebar />

      <div className="lg:pl-64">
        <DashboardHeader />

        <main className="mx-auto max-w-375 p-4 lg:p-8">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-[#07393C]">
                {t("supervisor.dashboard", "Dashboard")}
              </h2>

              <p className="mt-1 text-sm text-[#667577]">
                {t(
                  "supervisor.dashboardDescription",
                  "Overview of drivers and delivery operations.",
                )}
              </p>
            </div>

            <button
              type="button"
              disabled={refreshing || loading}
              onClick={() => void loadDashboard(true)}
              className="flex h-10 items-center gap-2 rounded-xl border border-[#D6DEDE] bg-white px-4 text-xs font-bold text-[#07393C] transition hover:bg-[#F0EDEE] disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={refreshing ? "animate-spin" : ""}
              />

              {t("common.refresh", "Refresh")}
            </button>
          </div>

          {loading ? (
            <DashboardLoading />
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
              {error}
              <button
                type="button"
                onClick={() => void loadDashboard()}
                className="ms-3 underline"
              >
                {t("common.retry", "Retry")}
              </button>
            </div>
          ) : (
            <>
              {/* Operation summary */}
              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label={t("supervisor.totalDrivers", "Total Drivers")}
                  value={detailedDrivers.length}
               
                  icon={<Users size={20} />}
                />

                <StatCard
                  label={t("supervisor.workingNow", "Working Now")}
                  value={workingCount}
                
                  icon={<Activity size={20} />}
                />

                <StatCard
                  label={t("supervisor.deliveredToday", "Delivered Today")}
                  value={stats?.stats.today.orders.delivered ?? 0}
              
                  icon={<PackageCheck size={20} />}
                />

                <StatCard
                  label={t("supervisor.hoursToday", "Hours Today")}
                  value={
                    stats?.stats.today.work.totalHours?.toFixed(1) ??
                    "0.0"
                  }
               
                  icon={<Clock3 size={20} />}
                />
              </section>

              {/* Driver statistics */}
              <section className="mt-7 overflow-hidden rounded-2xl border border-[#D6DEDE] bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E5EAEA] p-5">
                  <div>
                    <h3 className="text-base font-black text-[#07393C]">
                      {t("supervisor.drivers", "Drivers")}
                    </h3>

                    <p className="mt-1 text-xs text-[#667577]">
                      {t(
                        "supervisor.driverStatsDescription",
                        "Live availability, deliveries and shift statistics",
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/dashboard/drivers")}
                    className="flex items-center gap-2 rounded-xl bg-[#07393C] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#2C666E]"
                  >
                    <Plus size={15} />

                    {t("drivers.createDriver", "Create Driver")}
                  </button>
                </div>

                {/* Clickable filters */}
                <div className="grid grid-cols-3 gap-3 border-b border-[#E5EAEA] p-4">
                  <FilterCard
                    label={t("supervisor.totalDrivers", "All Drivers")}
                    value={detailedDrivers.length}
                    active={filter === "all"}
                    onClick={() => setFilter("all")}
                  />

                  <FilterCard
                    label={t("supervisor.workingNow", "Working")}
                    value={workingCount}
                    active={filter === "working"}
                    onClick={() => setFilter("working")}
                  />

                  <FilterCard
                    label={t("supervisor.notWorking", "Not Working")}
                    value={notWorkingCount}
                    active={filter === "notWorking"}
                    onClick={() => setFilter("notWorking")}
                  />
                </div>

                <div className="flex items-center justify-between border-b border-[#EDF0F0] px-5 py-3">
                  <span className="text-xs font-bold text-[#07393C]">
                    {filter === "working"
                      ? t("supervisor.workingNow", "Working")
                      : filter === "notWorking"
                        ? t("supervisor.notWorking", "Not Working")
                        : t("supervisor.drivers", "Drivers")}
                  </span>

                  <span className="rounded-full bg-[#F0EDEE] px-3 py-1 text-xs font-bold text-[#2C666E]">
                    {visibleDrivers.length}
                  </span>
                </div>

                <div className="max-h-150 divide-y divide-[#EDF0F0] overflow-y-auto">
                  {visibleDrivers.length ? (
                    visibleDrivers.map((item) => (
                      <DriverRow
                        key={item.driver._id ?? item.driver.id}
                        item={item}
                        onClick={() => {
                          const id =
                            item.driver._id ?? item.driver.id;

                          if (id) {
                            navigate(`/dashboard/drivers/${id}`);
                          }
                        }}
                      />
                    ))
                  ) : (
                    <div className="p-10 text-center text-sm text-[#667577]">
                      {t(
                        "supervisor.noDrivers",
                        "No drivers found",
                      )}
                    </div>
                  )}
                </div>
              </section>

              {/* Bottom summary */}
              <section className="mt-6 grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#D6DEDE] bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-black text-[#07393C]">
                    {t("supervisor.driverStatus", "Driver Status")}
                  </h3>

                  <div className="mt-5 space-y-4">
                    <StatusRow
                      label={t("supervisor.workingNow", "Working")}
                      value={workingCount}
                      dotClass="bg-emerald-500"
                    />

                    <StatusRow
                      label={t("supervisor.notWorking", "Not Working")}
                      value={notWorkingCount}
                      dotClass="bg-slate-400"
                    />

                    <StatusRow
                      label={t("common.inactive", "Inactive Accounts")}
                      value={inactiveCount}
                      dotClass="bg-red-500"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-[#07393C] p-5 text-white shadow-sm">
                  <p className="text-xs font-bold text-white/60">
                    {t("common.today", "Today")}
                  </p>

                  <p className="mt-2 text-3xl font-black">
                    {stats?.stats.today.orders.total ?? 0}
                  </p>

                  <p className="mt-1 text-sm text-white/65">
                    {t("orders.total", "Total orders")}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-white/10 p-3">
                      <div className="text-lg font-black">
                        {stats?.stats.today.orders.delivered ?? 0}
                      </div>

                      <div className="mt-1 text-[10px] text-white/60">
                        {t("orders.delivered", "Delivered")}
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/10 p-3">
                      <div className="text-lg font-black">
                        {stats?.stats.today.orders.cancelled ?? 0}
                      </div>

                      <div className="mt-1 text-[10px] text-white/60">
                        {t("orders.cancelled", "Cancelled")}
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

function FilterCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-xl border p-3 text-center transition",
        active
          ? "border-[#07393C] bg-[#07393C] text-white"
          : "border-[#D6DEDE] bg-[#F8FAFA] text-[#07393C] hover:border-[#2C666E]",
      ].join(" ")}
    >
      <div className="text-xl font-black">{value}</div>
      <div className="mt-1 text-[11px] font-bold">{label}</div>
    </button>
  );
}

function DriverRow({
  item,
  onClick,
}: {
  item: DashboardDriver;
  onClick: () => void;
}) {
  const { t } = useTranslation();
  const { driver, orders, todayWork, workingNow } = item;

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-5 py-3 text-start transition hover:bg-[#F8FAFA]"
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 lg:flex-nowrap">
        {/* Left: identity */}
        <div className="flex min-w-0 flex-1 items-center gap-3 lg:w-64 lg:flex-none lg:shrink-0">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D6DEDE] bg-[#F0EDEE]">
            {driver.profilePicture?.url ? (
              <img
                src={driver.profilePicture.url}
                alt={driver.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-black text-[#07393C]">
                {driver.name?.charAt(0).toUpperCase() || "D"}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-extrabold text-[#0A090C]">
                {driver.shortName || driver.name}
              </span>
              <ArrowUpRight
                size={13}
                className="shrink-0 text-[#8A989A]"
              />
            </div>

            <div className="mt-0.5 flex items-center gap-2 text-xs text-[#667577]">
              <span>{driver.iqamaId}</span>

              {driver.vehicleType && (
                <span className="flex items-center gap-1 capitalize">
                  {driver.vehicleType === "car" ? (
                    <Car size={13} />
                  ) : driver.vehicleType === "bike" ? (
                    <Bike size={13} />
                  ) : null}
                  {driver.vehicleType}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Middle: status */}
        <div className="flex shrink-0 flex-col items-center gap-1 lg:w-32">
          <span
            className={[
              "rounded-full px-3 py-1 text-[10px] font-extrabold",
              workingNow
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500",
            ].join(" ")}
          >
            {workingNow
              ? t("supervisor.workingNow", "Working")
              : t("supervisor.notWorking", "Not Working")}
          </span>

          {!driver.isActive && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-[10px] font-bold text-red-600">
              {t("common.inactive", "Inactive")}
            </span>
          )}
        </div>

        {/* Right: stats */}
        <div className="grid w-full grid-cols-3 gap-2 sm:grid-cols-5 lg:w-auto lg:flex-1">
          <DriverMetric
            label={t("supervisor.deliveredToday", "Today")}
            value={orders.deliveredToday}
          />
          <DriverMetric
            label={t("supervisor.deliveredMonth", "Month")}
            value={orders.deliveredThisMonth}
          />
          <DriverMetric
            label={t("supervisor.firstShift", "Start")}
            value={formatTime(todayWork.firstShiftStartedAt)}
          />
          <DriverMetric
            label={t("supervisor.lastShift", "Finish")}
            value={formatTime(todayWork.lastShiftEndedAt)}
          />
          <DriverMetric
            label={t("supervisor.totalTime", "Total")}
            value={formatDuration(todayWork.totalSeconds)}
          />
        </div>
      </div>
    </button>
  );
}

function DriverMetric({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-[#F8FAFA] px-2 py-1.5 text-center">
      <div className="truncate text-[10px] font-semibold text-[#667577]">
        {label}
      </div>

      <div className="truncate text-sm font-black text-[#07393C]">
        {value}
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
        <span className={`h-2.5 w-2.5 rounded-full ${dotClass}`} />
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
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-2xl border border-[#D6DEDE] bg-white"
        />
      ))}
    </div>
  );
}
