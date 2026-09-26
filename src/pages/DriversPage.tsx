import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
  Users,
} from "lucide-react";

import {
  getMyDrivers,
  updateDriverStatus,
} from "../api/driverApi";

import {
  DashboardSidebar,
} from "../components/dashboard/DashboardSidebar";

import {
  DashboardHeader,
} from "../components/dashboard/DashboardHeader";

import {
  DriverFormModal,
} from "../components/drivers/DriverFormModal";

import {
  DriverRow,
} from "../components/drivers/DriverRow";

import type {
  Driver,
} from "../types/driver";

export default function DriversPage() {
  const [
    drivers,
    setDrivers,
  ] = useState<Driver[]>([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    createVisible,
    setCreateVisible,
  ] = useState(false);

  const [
    editingDriver,
    setEditingDriver,
  ] = useState<Driver | null>(null);

  const [
    updatingStatusId,
    setUpdatingStatusId,
  ] = useState<string | null>(null);

  const loadDrivers =
    useCallback(async () => {
      try {
        setError(null);

        setIsLoading(true);

        const response =
          await getMyDrivers();

        setDrivers(
          response.drivers ?? [],
        );
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Unable to load drivers",
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  const filteredDrivers =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return drivers;
      }

      return drivers.filter(
        (driver) => {
          return [
            driver.name,
            driver.shortName,
            driver.iqamaId,
            driver.phone,
            driver.vehicleType,
          ].some((value) =>
            String(
              value ?? "",
            )
              .toLowerCase()
              .includes(query),
          );
        },
      );
    }, [
      drivers,
      search,
    ]);

  const workingCount =
    drivers.filter(
      (driver) =>
        driver.workStatus ===
        "working",
    ).length;

  const activeCount =
    drivers.filter(
      (driver) =>
        driver.isActive,
    ).length;

  async function handleToggleStatus(
    driver: Driver,
  ) {
    const driverId =
      driver._id ??
      driver.id;

    if (!driverId) {
      return;
    }

    try {
      setUpdatingStatusId(
        driverId,
      );

      const response =
        await updateDriverStatus(
          driverId,
          !driver.isActive,
        );

      setDrivers(
        (current) =>
          current.map(
            (item) =>
              (item._id ??
                item.id) ===
              driverId
                ? response.driver
                : item,
          ),
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to update driver",
      );
    } finally {
      setUpdatingStatusId(
        null,
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F6F6]">
      <DashboardSidebar />

      <div className="lg:pl-64">
        <DashboardHeader />

        <main className="mx-auto max-w-375 p-5 lg:p-8">
          <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#07393C]">
                Drivers
              </h1>

              <p className="mt-1 text-sm text-[#667577]">
                Manage drivers, vehicles and account access.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setCreateVisible(
                  true,
                )
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#07393C] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2C666E]"
            >
              <Plus size={17} />

              Create Driver
            </button>
          </div>

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label="Total Drivers"
              value={
                drivers.length
              }
            />

            <SummaryCard
              label="Working Now"
              value={
                workingCount
              }
            />

            <SummaryCard
              label="Active Accounts"
              value={
                activeCount
              }
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#D6DEDE] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#E7EBEB] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Users
                  size={18}
                  className="text-[#07393C]"
                />

                <div>
                  <h2 className="text-sm font-black text-[#07393C]">
                    Driver Directory
                  </h2>

                  <p className="text-xs text-[#667577]">
                    {
                      filteredDrivers.length
                    }{" "}
                    drivers
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#667577]"
                />

                <input
                  value={search}
                  onChange={(
                    event,
                  ) =>
                    setSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Search name, phone or Iqama"
                  className="h-10 w-full rounded-xl border border-[#CAD4D4] bg-white pl-10 pr-3 text-sm outline-none transition focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10"
                />
              </div>
            </div>

            {error && (
              <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {isLoading ? (
              <div className="space-y-2 p-5">
                {Array.from({
                  length: 5,
                }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="h-16 animate-pulse rounded-xl bg-[#F0EDEE]"
                    />
                  ),
                )}
              </div>
            ) : filteredDrivers.length ===
              0 ? (
              <div className="p-12 text-center">
                <Users
                  size={28}
                  className="mx-auto text-[#9AA8AA]"
                />

                <p className="mt-3 text-sm font-bold text-[#07393C]">
                  No drivers found
                </p>

                <p className="mt-1 text-xs text-[#667577]">
                  Create a driver or change your search.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EDF0F0]">
                {filteredDrivers.map(
                  (driver) => {
                    const driverId =
                      driver._id ??
                      driver.id ??
                      "";

                    return (
                      <DriverRow
                        key={
                          driverId
                        }
                        driver={
                          driver
                        }
                        isUpdatingStatus={
                          updatingStatusId ===
                          driverId
                        }
                        onEdit={() =>
                          setEditingDriver(
                            driver,
                          )
                        }
                        onToggleStatus={() =>
                          void handleToggleStatus(
                            driver,
                          )
                        }
                      />
                    );
                  },
                )}
              </div>
            )}
          </section>
        </main>
      </div>

      <DriverFormModal
        open={
          createVisible
        }
        onClose={() =>
          setCreateVisible(
            false,
          )
        }
        onSaved={() => {
          setCreateVisible(
            false,
          );

          void loadDrivers();
        }}
      />

      <DriverFormModal
        open={
          Boolean(
            editingDriver,
          )
        }
        driver={
          editingDriver
        }
        onClose={() =>
          setEditingDriver(
            null,
          )
        }
        onSaved={() => {
          setEditingDriver(
            null,
          );

          void loadDrivers();
        }}
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[#D6DEDE] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-[#667577]">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black text-[#07393C]">
        {value}
      </p>
    </div>
  );
}