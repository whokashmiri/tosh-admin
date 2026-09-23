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