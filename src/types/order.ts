export type OrderStatus =
  | "picked_up"
  | "delivered"
  | "cancelled";

export type OrderCancellationReason =
  | "customer_unavailable"
  | "wrong_address"
  | "vehicle_issue"
  | "order_issue"
  | "emergency"
  | "other";

export interface OrderPhoto {
  url: string;
  publicId: string;
  takenAt: string;
}

export interface OrderRider {
  _id: string;
  id?: string;

  name?: string;
  shortName?: string | null;

  iqamaId?: string;
  phone?: string | null;

  vehicleType?: "car" | "bike" | null;

  profilePicture?: {
    url: string | null;
    publicId: string | null;
  } | null;
}

export interface Order {
  _id: string;

  orderId: number | null;

  rider:
    | string
    | OrderRider;

  supervisor: string;

  pickupPhoto: OrderPhoto;

  deliveryPhoto:
    | OrderPhoto
    | null;

  pickupTime: string;

  deliveryTime:
    | string
    | null;

  durationSeconds:
    | number
    | null;

  status: OrderStatus;

  notes: string;

  cancellationReason:
    | OrderCancellationReason
    | null;

  cancellationNotes: string;

  cancellationPhotos: OrderPhoto[];

  cancelledAt:
    | string
    | null;

  createdAt: string;

  updatedAt: string;
}

export interface OrderResponse {
  success: boolean;

  message?: string;

  order: Order;
}

export interface ActiveOrderResponse {
  success: boolean;

  order:
    | Order
    | null;
}

export interface OrdersResponse {
  success: boolean;

  count: number;

  orders: Order[];
}

export interface DeleteOrderResponse {
  success: boolean;

  message: string;
}

export type SupervisorOrderStatusFilter =
  | "all"
  | "picked_up"
  | "delivered"
  | "cancelled";

export interface SupervisorOrdersQuery {
  page?: number;

  limit?: number;

  driverId?: string;

  status?: SupervisorOrderStatusFilter;

  from?: string;

  to?: string;
}

export interface OrderPagination {
  page: number;

  limit: number;

  total: number;

  totalPages: number;

  hasNextPage: boolean;

  hasPreviousPage: boolean;
}

export interface SupervisorOrdersResponse {
  success: boolean;

  pagination: OrderPagination;

  filters?: {
    driverId?:
      | string
      | null;

    status?:
      | string
      | null;

    from?:
      | string
      | null;

    to?:
      | string
      | null;
  };

  orders: Order[];
}