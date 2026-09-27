import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  Truck,
} from "lucide-react";

import {
  getSupervisorActiveOrders,
  getSupervisorOrders,
} from "../api/orderApi";

import {
  getMyDrivers,
} from "../api/driverApi";

import {
  DashboardHeader,
} from "../components/dashboard/DashboardHeader";

import {
  DashboardSidebar,
} from "../components/dashboard/DashboardSidebar";

import {
  OrderDetailsModal,
} from "../components/orders/OrderDetailsModal";

import type {
  Order,
  OrderPagination,
  SupervisorOrdersQuery,
  SupervisorOrderStatusFilter,
} from "../types/order";

import type {
  Driver,
} from "../types/driver";

const PAGE_SIZE = 10;

const EMPTY_PAGINATION: OrderPagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export default function OrdersPage() {
  const [
    activeOrders,
    setActiveOrders,
  ] = useState<Order[]>([]);

  const [
    orders,
    setOrders,
  ] = useState<Order[]>([]);

  const [
    drivers,
    setDrivers,
  ] = useState<Driver[]>([]);

  const [
    selectedDriverId,
    setSelectedDriverId,
  ] = useState("");

  const [
    status,
    setStatus,
  ] =
    useState<SupervisorOrderStatusFilter>(
      "all",
    );

  const [
    from,
    setFrom,
  ] = useState("");

  const [
    to,
    setTo,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    page,
    setPage,
  ] = useState(1);

  const [
    pagination,
    setPagination,
  ] =
    useState<OrderPagination>(
      EMPTY_PAGINATION,
    );

  const [
  selectedOrder,
  setSelectedOrder,
] =
  useState<Order | null>(
    null,
  );

  const [
    loadingInitial,
    setLoadingInitial,
  ] = useState(true);

  const [
    loadingOrders,
    setLoadingOrders,
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

  /*
   * Load data that does not depend
   * on history filters.
   */
  const loadInitialData =
    useCallback(async () => {
      try {
        setLoadingInitial(true);

        setError(null);

        const [
          activeResponse,
          driverResponse,
        ] =
          await Promise.all([
            getSupervisorActiveOrders(),
            getMyDrivers(),
          ]);

        setActiveOrders(
          activeResponse.orders ??
            [],
        );

        setDrivers(
          driverResponse.drivers ??
            [],
        );
      } catch (error) {
        setError(
          getApiError(error),
        );
      } finally {
        setLoadingInitial(false);
      }
    }, []);

  /*
   * Load paginated history.
   *
   * All filters here are sent to
   * the backend.
   */
  const loadOrders =
    useCallback(
      async (
        showRefresh =
          false,
      ) => {
        try {
          if (showRefresh) {
            setRefreshing(true);
          }

          setLoadingOrders(true);

          setError(null);

          const params:
            SupervisorOrdersQuery =
            {
              page,

              limit:
                PAGE_SIZE,

              driverId:
                selectedDriverId ||
                undefined,

              status,

              from:
                from ||
                undefined,

              to:
                to ||
                undefined,
            };

          const response =
            await getSupervisorOrders(
              params,
            );

          setOrders(
            response.orders ??
              [],
          );

          setPagination(
            response.pagination ??
              EMPTY_PAGINATION,
          );
        } catch (error) {
          setError(
            getApiError(error),
          );
        } finally {
          setLoadingOrders(false);

          setRefreshing(false);
        }
      },
      [
        page,
        selectedDriverId,
        status,
        from,
        to,
      ],
    );

  useEffect(() => {
    void loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  /*
   * Search is local to the currently
   * loaded page.
   */
  const visibleOrders =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return orders;
      }

      return orders.filter(
        (order) => {
          const driver =
            getOrderDriver(
              order,
            );

          return [
            order.orderId,
            order._id,
            driver?.name,
            driver?.shortName,
            driver?.phone,
            driver?.iqamaId,
            order.status,
          ].some((value) =>
            String(
              value ?? "",
            )
              .toLowerCase()
              .includes(
                query,
              ),
          );
        },
      );
    }, [
      orders,
      search,
    ]);

  function handleDriverChange(
    value: string,
  ) {
    setPage(1);

    setSelectedDriverId(
      value,
    );
  }

  function handleStatusChange(
    value:
      SupervisorOrderStatusFilter,
  ) {
    setPage(1);

    setStatus(value);
  }

  function handleFromChange(
    value: string,
  ) {
    setPage(1);

    setFrom(value);

    /*
     * If current "to" date becomes
     * invalid, clear it.
     */
    if (
      value &&
      to &&
      to < value
    ) {
      setTo("");
    }
  }

  function handleToChange(
    value: string,
  ) {
    setPage(1);

    setTo(value);
  }

  function resetFilters() {
    setSelectedDriverId(
      "",
    );

    setStatus(
      "all",
    );

    setFrom("");

    setTo("");

    setSearch("");

    setPage(1);
  }

  async function handleRefresh() {
    try {
      setRefreshing(true);

      await Promise.all([
        loadInitialData(),
        loadOrders(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }

  /*
   * These are counts from the currently
   * loaded history page.
   *
   * For global totals by status, use
   * your stats API instead.
   */
  const deliveredCount =
    orders.filter(
      (order) =>
        order.status ===
        "delivered",
    ).length;

  const cancelledCount =
    orders.filter(
      (order) =>
        order.status ===
        "cancelled",
    ).length;

  const pickedUpCount =
    orders.filter(
      (order) =>
        order.status ===
        "picked_up",
    ).length;

  return (
    <div className="min-h-screen bg-[#F4F6F6]">
      <DashboardSidebar />

      <div className="lg:pl-64">
        <DashboardHeader />

        <main className="mx-auto max-w-[1600px] p-5 lg:p-8">
          {/* =========================
              HEADER
          ========================= */}

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-black text-[#07393C]">
                Orders
              </h1>

              <p className="mt-1 text-sm text-[#667577]">
                Monitor active
                deliveries and review
                order history.
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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#CAD4D4] bg-white px-4 text-xs font-bold text-[#07393C] transition hover:bg-[#F0EDEE] disabled:cursor-not-allowed disabled:opacity-50"
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

          {/* =========================
              SUMMARY
          ========================= */}

          <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OrderStat
              label="Active Orders"
              value={
                activeOrders.length
              }
              icon={
                <Truck
                  size={19}
                />
              }
            />

            <OrderStat
              label="Total History"
              value={
                pagination.total
              }
              icon={
                <Package
                  size={19}
                />
              }
            />

            <OrderStat
              label="Delivered On Page"
              value={
                deliveredCount
              }
              icon={
                <Package
                  size={19}
                />
              }
            />

            <OrderStat
              label="Cancelled On Page"
              value={
                cancelledCount
              }
              icon={
                <Clock3
                  size={19}
                />
              }
            />
          </section>

          {/* =========================
              ACTIVE DELIVERIES
          ========================= */}

          {!loadingInitial &&
            activeOrders.length >
              0 && (
              <section className="mb-6 overflow-hidden rounded-2xl border border-[#D6DEDE] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#EDF0F0] px-5 py-4">
                  <div>
                    <h2 className="text-sm font-black text-[#07393C]">
                      Active Deliveries
                    </h2>

                    <p className="mt-1 text-xs text-[#667577]">
                      Orders currently
                      being delivered
                    </p>
                  </div>

                  <span className="rounded-full bg-[#EAF4F4] px-3 py-1 text-[10px] font-black text-[#07393C]">
                    {
                      activeOrders.length
                    }{" "}
                    Active
                  </span>
                </div>

                <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
                  {activeOrders.map(
                    (order) => (
                      <ActiveOrderCard
                        key={
                          order._id
                        }
                        order={
                          order
                        }
                        onView={() =>
                          setSelectedOrder(
                            order,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              </section>
            )}

          {/* =========================
              FILTERS
          ========================= */}

          <section className="mb-6 rounded-2xl border border-[#D6DEDE] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter
                  size={17}
                  className="text-[#07393C]"
                />

                <h2 className="text-sm font-black text-[#07393C]">
                  Filters
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  resetFilters
                }
                className="flex items-center gap-1.5 text-xs font-bold text-[#667577] transition hover:text-[#07393C]"
              >
                <RotateCcw
                  size={13}
                />

                Reset
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {/* SEARCH */}

              <div>
                <FilterLabel>
                  Search
                </FilterLabel>

                <div className="relative">
                  <Search
                    size={15}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#667577]"
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
                    placeholder="Order or driver"
                    className="h-10 w-full rounded-xl border border-[#CAD4D4] bg-white pl-9 pr-3 text-xs text-[#07393C] outline-none transition placeholder:text-[#9AA8AA] focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10"
                  />
                </div>
              </div>

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
                  ) =>
                    handleDriverChange(
                      event
                        .target
                        .value,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#CAD4D4] bg-white px-3 text-xs text-[#07393C] outline-none transition focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10"
                >
                  <option value="">
                    All Drivers
                  </option>

                  {drivers.map(
                    (driver) => {
                      const id =
                        driver._id ??
                        driver.id;

                      if (!id) {
                        return null;
                      }

                      return (
                        <option
                          key={id}
                          value={id}
                        >
                          {driver.shortName ||
                            driver.name}
                        </option>
                      );
                    },
                  )}
                </select>
              </div>

              {/* STATUS */}

              <div>
                <FilterLabel>
                  Status
                </FilterLabel>

                <select
                  value={
                    status
                  }
                  onChange={(
                    event,
                  ) =>
                    handleStatusChange(
                      event
                        .target
                        .value as SupervisorOrderStatusFilter,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#CAD4D4] bg-white px-3 text-xs text-[#07393C] outline-none transition focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10"
                >
                  <option value="all">
                    All
                  </option>

                  <option value="picked_up">
                    Active
                  </option>

                  <option value="delivered">
                    Delivered
                  </option>

                  <option value="cancelled">
                    Cancelled
                  </option>
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
                  ) =>
                    handleFromChange(
                      event
                        .target
                        .value,
                    )
                  }
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
                  onChange={(
                    event,
                  ) =>
                    handleToChange(
                      event
                        .target
                        .value,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-[#CAD4D4] bg-white px-3 text-xs text-[#07393C] outline-none transition focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10"
                />
              </div>
            </div>

            {/* ACTIVE FILTER SUMMARY */}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {selectedDriverId && (
                <FilterChip
                  label={`Driver: ${
                    drivers.find(
                      (
                        driver,
                      ) =>
                        (driver._id ??
                          driver.id) ===
                        selectedDriverId,
                    )
                      ?.shortName ||
                    drivers.find(
                      (
                        driver,
                      ) =>
                        (driver._id ??
                          driver.id) ===
                        selectedDriverId,
                    )?.name ||
                    "Selected"
                  }`}
                />
              )}

              {status !==
                "all" && (
                <FilterChip
                  label={
                    status ===
                    "picked_up"
                      ? "Status: Active"
                      : `Status: ${capitalize(
                          status,
                        )}`
                  }
                />
              )}

              {from && (
                <FilterChip
                  label={`From: ${from}`}
                />
              )}

              {to && (
                <FilterChip
                  label={`To: ${to}`}
                />
              )}
            </div>
          </section>

          {/* =========================
              ERROR
          ========================= */}

          {error && (
            <div className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <span>
                {error}
              </span>

              <button
                type="button"
                onClick={() =>
                  setError(null)
                }
                className="shrink-0 text-xs font-black"
              >
                ×
              </button>
            </div>
          )}

          {/* =========================
              ORDER HISTORY
          ========================= */}

          <section className="overflow-hidden rounded-2xl border border-[#D6DEDE] bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-[#EDF0F0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-black text-[#07393C]">
                  Order History
                </h2>

                <p className="mt-1 text-xs text-[#667577]">
                  {pagination.total}{" "}
                  total result
                  {pagination.total ===
                  1
                    ? ""
                    : "s"}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
                <span className="rounded-full bg-[#EAF4F4] px-3 py-1 text-[#07393C]">
                  {
                    pickedUpCount
                  }{" "}
                  active on page
                </span>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  {
                    deliveredCount
                  }{" "}
                  delivered on page
                </span>

                <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
                  {
                    cancelledCount
                  }{" "}
                  cancelled on page
                </span>
              </div>
            </div>

            {loadingOrders ? (
              <TableLoading />
            ) : visibleOrders.length ===
              0 ? (
              <div className="p-12 text-center">
                <Package
                  size={30}
                  className="mx-auto text-[#A5B0B1]"
                />

                <p className="mt-3 text-sm font-bold text-[#07393C]">
                  No orders found
                </p>

                <p className="mt-1 text-xs text-[#667577]">
                  Try changing the
                  selected filters.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-237.5">
                    <thead>
                      <tr className="border-b border-[#EDF0F0] bg-[#F8FAFA] text-left">
                        <TableHead>
                          Order
                        </TableHead>

                        <TableHead>
                          Driver
                        </TableHead>

                        <TableHead>
                          Status
                        </TableHead>

                        <TableHead>
                          Pickup
                        </TableHead>

                        <TableHead>
                          Delivery
                        </TableHead>

                        <TableHead>
                          Duration
                        </TableHead>

                        <TableHead>
                          Actions
                        </TableHead>
                      </tr>
                    </thead>

                    <tbody>
                      {visibleOrders.map(
                        (order) => (
                          <OrderTableRow
                            key={
                              order._id
                            }
                            order={
                              order
                            }
                            onView={() =>
                              setSelectedOrder(
                                order,
                              )
                            }
                          />
                        ),
                      )}
                    </tbody>
                  </table>
                </div>

                {/* =========================
                    PAGINATION
                ========================= */}

                <div className="flex flex-col gap-3 border-t border-[#EDF0F0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-[#667577]">
                      Page{" "}
                      <strong className="text-[#07393C]">
                        {
                          pagination.page
                        }
                      </strong>{" "}
                      of{" "}
                      <strong className="text-[#07393C]">
                        {
                          pagination.totalPages
                        }
                      </strong>
                    </p>

                    <p className="mt-1 text-[10px] text-[#8A989A]">
                      {
                        pagination.total
                      }{" "}
                      total orders
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={
                        !pagination.hasPreviousPage ||
                        loadingOrders
                      }
                      onClick={() =>
                        setPage(
                          Math.max(
                            1,
                            pagination.page -
                              1,
                          ),
                        )
                      }
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-[#CAD4D4] bg-white px-3 text-xs font-bold text-[#07393C] transition hover:bg-[#F0EDEE] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft
                        size={15}
                      />

                      Previous
                    </button>

                    <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#07393C] px-3 text-xs font-black text-white">
                      {
                        pagination.page
                      }
                    </div>

                    <button
                      type="button"
                      disabled={
                        !pagination.hasNextPage ||
                        loadingOrders
                      }
                      onClick={() =>
                        setPage(
                          Math.min(
                            pagination.totalPages,
                            pagination.page +
                              1,
                          ),
                        )
                      }
                      className="inline-flex h-9 items-center justify-center gap-1 rounded-lg border border-[#CAD4D4] bg-white px-3 text-xs font-bold text-[#07393C] transition hover:bg-[#F0EDEE] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next

                      <ChevronRight
                        size={15}
                      />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </main>
      </div>

      {/* =========================
          ORDER DETAILS MODAL
      ========================= */}

      <OrderDetailsModal
  order={
    selectedOrder
  }
  open={
    Boolean(
      selectedOrder,
    )
  }
  onClose={() =>
    setSelectedOrder(
      null,
    )
  }
/>
    </div>
  );
}

/* =========================================================
   ACTIVE ORDER CARD
========================================================= */

function ActiveOrderCard({
  order,
  onView,
}: {
  order: Order;

  onView: () => void;
}) {
  const driver =
    getOrderDriver(
      order,
    );

  return (
    <button
      type="button"
      onClick={onView}
      className="rounded-xl border border-[#DCE4E4] bg-[#FAFCFC] p-4 text-left transition hover:border-[#2C666E] hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-black text-[#07393C]">
            #
            {order.orderId ??
              order._id}
          </div>

          <div className="mt-1 truncate text-xs font-semibold text-[#667577]">
            {driver?.shortName ||
              driver?.name ||
              "Driver"}
          </div>
        </div>

        <StatusBadge
          status={
            order.status
          }
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-[10px] text-[#667577]">
        <CalendarDays
          size={12}
        />

        {formatDate(
          order.pickupTime ??
            order.createdAt,
        )}
      </div>
    </button>
  );
}

/* =========================================================
   TABLE ROW
========================================================= */

function OrderTableRow({
  order,
  onView,
}: {
  order: Order;

  onView: () => void;
}) {
  const driver =
    getOrderDriver(
      order,
    );

  return (
    <tr className="border-b border-[#EDF0F0] transition last:border-b-0 hover:bg-[#FAFBFB]">
      <TableCell>
        <div className="font-black text-[#07393C]">
          #
          {order.orderId ??
            order._id}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3">
          <DriverAvatar
            name={
              driver?.name
            }
            imageUrl={
              driver
                ?.profilePicture
                ?.url
            }
          />

          <div className="min-w-0">
            <div className="max-w-40 truncate font-bold text-[#0A090C]">
              {driver?.shortName ||
                driver?.name ||
                "Driver"}
            </div>

            <div className="mt-0.5 max-w-40 truncate text-[10px] text-[#667577]">
              {driver?.phone ||
                driver?.iqamaId ||
                "-"}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell>
        <StatusBadge
          status={
            order.status
          }
        />
      </TableCell>

      <TableCell>
        {formatDate(
          order.pickupTime ??
            order.createdAt,
        )}
      </TableCell>

      <TableCell>
        {order.deliveryTime
          ? formatDate(
              order.deliveryTime,
            )
          : "--"}
      </TableCell>

      <TableCell>
        {formatDuration(
          order.durationSeconds,
        )}
      </TableCell>

      <TableCell>
        <button
          type="button"
          onClick={onView}
          className="flex h-9 items-center gap-2 rounded-lg border border-[#CAD4D4] bg-white px-3 text-[11px] font-bold text-[#07393C] transition hover:bg-[#F0EDEE]"
        >
          <Eye size={14} />

          View
        </button>
      </TableCell>
    </tr>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}: {
  status?:
    | "picked_up"
    | "delivered"
    | "cancelled";
}) {
  const value =
    status ??
    "picked_up";

  const label =
    value === "picked_up"
      ? "Active"
      : value === "delivered"
        ? "Delivered"
        : "Cancelled";

  const className =
    value === "delivered"
      ? "bg-emerald-50 text-emerald-700"
      : value ===
          "cancelled"
        ? "bg-red-50 text-red-700"
        : "bg-[#EAF4F4] text-[#07393C]";

  return (
    <span
      className={`inline-flex shrink-0 rounded-full px-3 py-1 text-[10px] font-black ${className}`}
    >
      {label}
    </span>
  );
}

/* =========================================================
   DRIVER AVATAR
========================================================= */

function DriverAvatar({
  name,
  imageUrl,
}: {
  name?: string;

  imageUrl?:
    | string
    | null;
}) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#07393C] text-xs font-black text-white">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={
            name ??
            "Driver"
          }
          className="h-full w-full object-cover"
        />
      ) : (
        name
          ?.trim()
          .charAt(0)
          .toUpperCase() ??
        "D"
      )}
    </div>
  );
}

/* =========================================================
   SUMMARY CARD
========================================================= */

function OrderStat({
  label,
  value,
  icon,
}: {
  label: string;

  value: number;

  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[#D6DEDE] bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF4F4] text-[#07393C]">
        {icon}
      </div>

      <div>
        <div className="text-2xl font-black text-[#07393C]">
          {value}
        </div>

        <div className="text-xs text-[#667577]">
          {label}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   FILTER LABEL
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
   FILTER CHIP
========================================================= */

function FilterChip({
  label,
}: {
  label: string;
}) {
  return (
    <span className="rounded-full bg-[#EAF4F4] px-3 py-1 text-[10px] font-bold text-[#2C666E]">
      {label}
    </span>
  );
}

/* =========================================================
   TABLE HELPERS
========================================================= */

function TableHead({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wide text-[#667577]">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children:
    ReactNode;
}) {
  return (
    <td className="px-5 py-4 text-xs text-[#667577]">
      {children}
    </td>
  );
}

function TableLoading() {
  return (
    <div className="space-y-2 p-5">
      {Array.from({
        length: 7,
      }).map(
        (_, index) => (
          <div
            key={index}
            className="h-14 animate-pulse rounded-xl bg-[#F0EDEE]"
          />
        ),
      )}
    </div>
  );
}

/* =========================================================
   ORDER HELPERS
========================================================= */

function getOrderDriver(
  order: Order,
) {
  if (
    typeof order.rider ===
    "string"
  ) {
    return null;
  }

  return order.rider;
}

function formatDate(
  value?:
    | string
    | Date
    | null,
) {
  if (!value) {
    return "--";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "--";
  }

  return date.toLocaleString();
}

function formatDuration(
  seconds?:
    | number
    | null,
) {
  if (
    seconds == null
  ) {
    return "--";
  }

  const safe =
    Math.max(
      0,
      Math.floor(
        seconds,
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

  const remaining =
    safe % 60;

  return [
    hours,
    minutes,
    remaining,
  ]
    .map((value) =>
      String(
        value,
      ).padStart(
        2,
        "0",
      ),
    )
    .join(":");
}

function capitalize(
  value: string,
) {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

/* =========================================================
   API ERROR
========================================================= */

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
    return error.message;
  }

  return "Unable to load orders";
}