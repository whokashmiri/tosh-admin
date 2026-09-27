import {
  useEffect,
  useState,
} from "react";

import {
  ImageIcon,
  Package,
  UserRound,
  X,
} from "lucide-react";

import type {
  Order,
  OrderStatus,
} from "../../types/order";

type Props = {
  open: boolean;

  order:
    | Order
    | null;

  onClose: () => void;
};

export function OrderDetailsModal({
  open,
  order,
  onClose,
}: Props) {
  /*
   * Close with Escape.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        onClose();
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, [
    open,
    onClose,
  ]);

  if (
    !open ||
    !order
  ) {
    return null;
  }

  const driver =
    typeof order.rider ===
      "string"
      ? null
      : order.rider;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[2px]"
      onMouseDown={(
        event,
      ) => {
        /*
         * Close only when clicking
         * the dark backdrop.
         */
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        {/* =========================
            HEADER
        ========================= */}

        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-[#EDF0F0] bg-white px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <Package
                size={18}
                className="text-[#07393C]"
              />

              <h2 className="text-lg font-black text-[#07393C]">
                Order Details
              </h2>
            </div>

            <p className="mt-1 text-xs text-[#667577]">
              Order #
              {order.orderId ??
                order._id}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EDEE] text-[#07393C] transition hover:bg-[#E4EAEA]"
            aria-label="Close order details"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* =========================
              GENERAL INFORMATION
          ========================= */}

          <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <InfoCard
              label="Status"
              value={
                getStatusLabel(
                  order.status,
                )
              }
            />

            <InfoCard
              label="Pickup"
              value={formatDate(
                order.pickupTime,
              )}
            />

            <InfoCard
              label="Delivery"
              value={
                order.deliveryTime
                  ? formatDate(
                      order.deliveryTime,
                    )
                  : "--"
              }
            />

            <InfoCard
              label="Duration"
              value={formatDuration(
                order.durationSeconds,
              )}
            />
          </section>

          {/* =========================
              DRIVER
          ========================= */}

          <section className="rounded-2xl border border-[#D6DEDE] bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <UserRound
                size={16}
                className="text-[#07393C]"
              />

              <h3 className="text-sm font-black text-[#07393C]">
                Driver
              </h3>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <DriverProfileImage
                imageUrl={
                  driver
                    ?.profilePicture
                    ?.url
                }
                name={
                  driver?.name
                }
              />

              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-black text-[#07393C]">
                  {driver?.shortName ||
                    driver?.name ||
                    "Driver"}
                </div>

                {driver?.shortName &&
                  driver?.name && (
                    <div className="mt-1 truncate text-xs text-[#667577]">
                      {driver.name}
                    </div>
                  )}

                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <DriverInfo
                    label="Phone"
                    value={
                      driver?.phone ||
                      "--"
                    }
                  />

                  <DriverInfo
                    label="Iqama"
                    value={
                      driver?.iqamaId ||
                      "--"
                    }
                  />

                  <DriverInfo
                    label="Vehicle"
                    value={
                      driver?.vehicleType ||
                      "--"
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          {/* =========================
              ORDER PHOTOS
          ========================= */}

          <section>
            <div className="mb-4 flex items-center gap-2">
              <ImageIcon
                size={16}
                className="text-[#07393C]"
              />

              <div>
                <h3 className="text-sm font-black text-[#07393C]">
                  Order Photos
                </h3>

                <p className="mt-1 text-[10px] text-[#667577]">
                  Pickup and delivery evidence
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <OrderPhoto
                title="Pickup Photo"
                url={
                  order.pickupPhoto
                    ?.url
                }
                takenAt={
                  order.pickupPhoto
                    ?.takenAt
                }
              />

              <OrderPhoto
                title="Delivery Photo"
                url={
                  order.deliveryPhoto
                    ?.url
                }
                takenAt={
                  order.deliveryPhoto
                    ?.takenAt
                }
              />
            </div>
          </section>

          {/* =========================
              NOTES
          ========================= */}

          {!!order.notes?.trim() && (
            <section className="rounded-2xl bg-[#F0EDEE] p-5">
              <div className="text-xs font-black text-[#07393C]">
                Order Notes
              </div>

              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#667577]">
                {order.notes}
              </p>
            </section>
          )}

          {/* =========================
              CANCELLATION
          ========================= */}

          {order.status ===
            "cancelled" && (
            <CancellationSection
              order={order}
            />
          )}

          {/* =========================
              SYSTEM INFORMATION
          ========================= */}

          <section className="border-t border-[#EDF0F0] pt-5">
            <h3 className="mb-4 text-xs font-black uppercase tracking-wide text-[#667577]">
              Order Information
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <SmallInfo
                label="Order ID"
                value={
                  order.orderId !=
                  null
                    ? String(
                        order.orderId,
                      )
                    : "--"
                }
              />

              <SmallInfo
                label="Database ID"
                value={
                  order._id
                }
              />

              <SmallInfo
                label="Created"
                value={formatDate(
                  order.createdAt,
                )}
              />

              <SmallInfo
                label="Updated"
                value={formatDate(
                  order.updatedAt,
                )}
              />

              <SmallInfo
                label="Supervisor"
                value={
                  order.supervisor ||
                  "--"
                }
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   ORDER PHOTO
========================================================= */

function OrderPhoto({
  title,
  url,
  takenAt,
}: {
  title: string;

  url?:
    | string
    | null;

  takenAt?:
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

  if (
    !url ||
    failed
  ) {
    return (
      <div>
        <PhotoHeader
          title={title}
          takenAt={
            takenAt
          }
        />

        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-[#CAD4D4] bg-[#F8FAFA]">
          <ImageIcon
            size={28}
            className="text-[#A5B0B1]"
          />

          <span className="mt-3 text-xs font-semibold text-[#8A989A]">
            {failed
              ? "Unable to load photo"
              : "No photo"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PhotoHeader
        title={title}
        takenAt={
          takenAt
        }
      />

      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="group block overflow-hidden rounded-2xl border border-[#D6DEDE] bg-[#F0EDEE]"
      >
        <div className="relative h-64 overflow-hidden">
          <img
            src={url}
            alt={title}
            onError={() => {
              console.error(
                `[OrderDetails] Failed to load ${title}:`,
                url,
              );

              setFailed(true);
            }}
            className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
          />

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-3 pt-8 opacity-0 transition group-hover:opacity-100">
            <span className="text-xs font-bold text-white">
              Open full image
            </span>
          </div>
        </div>
      </a>
    </div>
  );
}

/* =========================================================
   PHOTO HEADER
========================================================= */

function PhotoHeader({
  title,
  takenAt,
}: {
  title: string;

  takenAt?:
    | string
    | null;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <div className="text-xs font-bold text-[#667577]">
        {title}
      </div>

      {takenAt && (
        <div className="text-right text-[9px] text-[#8A989A]">
          {formatDate(
            takenAt,
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   DRIVER PROFILE IMAGE
========================================================= */

function DriverProfileImage({
  imageUrl,
  name,
}: {
  imageUrl?:
    | string
    | null;

  name?:
    | string
    | null;
}) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [imageUrl]);

  const initial =
    name
      ?.trim()
      .charAt(0)
      .toUpperCase() ||
    "D";

  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D6DEDE] bg-[#07393C] text-lg font-black text-white">
      {imageUrl &&
      !failed ? (
        <img
          src={imageUrl}
          alt={
            name ||
            "Driver"
          }
          onError={() => {
            setFailed(true);
          }}
          className="h-full w-full object-cover"
        />
      ) : (
        initial
      )}
    </div>
  );
}

/* =========================================================
   DRIVER INFO
========================================================= */

function DriverInfo({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-wide text-[#8A989A]">
        {label}
      </div>

      <div className="mt-1 truncate text-xs font-bold capitalize text-[#07393C]">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   CANCELLATION
========================================================= */

function CancellationSection({
  order,
}: {
  order: Order;
}) {
  return (
    <section className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <div>
        <h3 className="text-sm font-black text-red-700">
          Cancellation Details
        </h3>

        <p className="mt-1 text-xs text-red-700/70">
          Information recorded when this order was cancelled.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <InfoCard
          label="Reason"
          value={formatCancellationReason(
            order.cancellationReason,
          )}
        />

        <InfoCard
          label="Cancelled At"
          value={
            order.cancelledAt
              ? formatDate(
                  order.cancelledAt,
                )
              : "--"
          }
        />
      </div>

      {!!order
        .cancellationNotes
        ?.trim() && (
        <div className="mt-4 rounded-xl border border-red-100 bg-white/60 p-4">
          <div className="text-xs font-bold text-red-700">
            Cancellation Notes
          </div>

          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-red-700/80">
            {
              order.cancellationNotes
            }
          </p>
        </div>
      )}

      {!!order
        .cancellationPhotos
        ?.length && (
        <div className="mt-5">
          <div className="mb-3 text-xs font-bold text-red-700">
            Cancellation Photos
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {order.cancellationPhotos.map(
              (
                photo,
                index,
              ) => (
                <CancellationPhoto
                  key={
                    photo.publicId ||
                    `${photo.url}-${index}`
                  }
                  url={
                    photo.url
                  }
                  index={
                    index
                  }
                />
              ),
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/* =========================================================
   CANCELLATION PHOTO
========================================================= */

function CancellationPhoto({
  url,
  index,
}: {
  url?:
    | string
    | null;

  index: number;
}) {
  const [
    failed,
    setFailed,
  ] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (
    !url ||
    failed
  ) {
    return (
      <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-white/50">
        <ImageIcon
          size={21}
          className="text-red-300"
        />

        <span className="mt-2 text-[10px] font-semibold text-red-500">
          Photo unavailable
        </span>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group overflow-hidden rounded-xl border border-red-200 bg-white"
    >
      <img
        src={url}
        alt={`Cancellation ${
          index + 1
        }`}
        onError={() => {
          console.error(
            "[OrderDetails] Cancellation image failed:",
            url,
          );

          setFailed(true);
        }}
        className="h-36 w-full object-cover transition duration-200 group-hover:scale-[1.03]"
      />
    </a>
  );
}

/* =========================================================
   INFO CARD
========================================================= */

function InfoCard({
  label,
  value,
}: {
  label: string;

  value:
    | string
    | number
    | null
    | undefined;
}) {
  return (
    <div className="rounded-xl bg-[#F0EDEE] p-4">
      <div className="text-[10px] font-bold uppercase tracking-wide text-[#667577]">
        {label}
      </div>

      <div className="mt-2 break-words text-sm font-black text-[#07393C]">
        {value ??
          "--"}
      </div>
    </div>
  );
}

/* =========================================================
   SMALL INFO
========================================================= */

function SmallInfo({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div>
      <div className="text-[9px] font-bold uppercase tracking-wide text-[#8A989A]">
        {label}
      </div>

      <div className="mt-1 break-all text-xs font-semibold text-[#07393C]">
        {value}
      </div>
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function getStatusLabel(
  status: OrderStatus,
) {
  switch (status) {
    case "picked_up":
      return "Active";

    case "delivered":
      return "Delivered";

    case "cancelled":
      return "Cancelled";

    default:
      return status;
  }
}

/* =========================================================
   CANCELLATION REASON
========================================================= */

function formatCancellationReason(
  value:
    | string
    | null
    | undefined,
) {
  if (!value) {
    return "--";
  }

  return value
    .replaceAll(
      "_",
      " ",
    )
    .replace(
      /\b\w/g,
      (character) =>
        character.toUpperCase(),
    );
}

/* =========================================================
   DATE
========================================================= */

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

/* =========================================================
   DURATION
========================================================= */

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

  const safeSeconds =
    Math.max(
      0,
      Math.floor(
        seconds,
      ),
    );

  const hours =
    Math.floor(
      safeSeconds /
        3600,
    );

  const minutes =
    Math.floor(
      (safeSeconds %
        3600) /
        60,
    );

  const remainingSeconds =
    safeSeconds %
    60;

  return [
    hours,
    minutes,
    remainingSeconds,
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