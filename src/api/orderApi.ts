import type {
  OrderResponse,
  OrdersResponse,
  SupervisorOrdersQuery,
  SupervisorOrdersResponse,
} from "../types/order";

import {
  api,
} from "./client";

export async function getSupervisorActiveOrders() {
  const response =
    await api.get<OrdersResponse>(
      "/orders/supervisor/active",
    );

  return response.data;
}

export async function getSupervisorOrders(
  params:
    SupervisorOrdersQuery = {},
) {
  const response =
    await api.get<SupervisorOrdersResponse>(
      "/orders/supervisor/history",
      {
        params: {
          page:
            params.page ?? 1,

          limit:
            params.limit ?? 10,

          ...(params.driverId
            ? {
                driverId:
                  params.driverId,
              }
            : {}),

          ...(params.status &&
          params.status !==
            "all"
            ? {
                status:
                  params.status,
              }
            : {}),

          ...(params.from
            ? {
                from:
                  params.from,
              }
            : {}),

          ...(params.to
            ? {
                to:
                  params.to,
              }
            : {}),
        },
      },
    );

  return response.data;
}

export async function getOrderById(
  orderId: string,
) {
  const response =
    await api.get<OrderResponse>(
      `/orders/${orderId}`,
    );

  return response.data;
}


export interface SupervisorOrderCalendarResponse {
  success: boolean;
  driverId?: string;
  month?: string;
  days: Record<string, number>;
}

/**
 * Get daily order counts for a driver.
 *
 * month format: YYYY-MM
 * Example: 2026-10
 */
export async function getSupervisorOrderCalendar(
  driverId: string,
  month: string,
) {
  const response =
    await api.get<SupervisorOrderCalendarResponse>(
      "/orders/supervisor/calendar",
      {
        params: {
          driverId,
          month,
        },
      },
    );

  return response.data;
}
