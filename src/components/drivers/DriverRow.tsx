import {
  Bike,
  Car,
  Pencil,
  PersonStanding,
} from "lucide-react";

import type {
  Driver,
} from "../../types/driver";

type DriverRowProps = {
  driver: Driver;

  isUpdatingStatus: boolean;

  onEdit: () => void;

  onToggleStatus: () => void;
};

export function DriverRow({
  driver,
  isUpdatingStatus,
  onEdit,
  onToggleStatus,
}: DriverRowProps) {
  const isWorking =
    driver.workStatus ===
    "working";

  return (
    <div className="flex flex-col gap-4 px-5 py-4 transition hover:bg-[#FAFBFB] lg:flex-row lg:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#D6DEDE] bg-[#F0EDEE]">
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
            <div className="flex h-full w-full items-center justify-center text-sm font-black text-[#07393C]">
              {driver.name
                ?.trim()
                .charAt(0)
                .toUpperCase() ||
                "D"}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="truncate text-sm font-black text-[#0A090C]">
            {driver.shortName ||
              driver.name}
          </div>

          {driver.shortName && (
            <div className="mt-0.5 truncate text-xs text-[#667577]">
              {driver.name}
            </div>
          )}

          <div className="mt-1 text-xs text-[#8A989A]">
            {driver.phone ||
              driver.iqamaId}
          </div>
        </div>
      </div>

      <div className="flex min-w-27.5 items-center gap-2">
        <VehicleIcon
          type={
            driver.vehicleType
          }
        />

        <span className="text-xs font-semibold capitalize text-[#667577]">
          {driver.vehicleType ??
            "Walking"}
        </span>
      </div>

      <div className="min-w-23.75">
        <span
          className={[
            "inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold",

            isWorking
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500",
          ].join(" ")}
        >
          {isWorking
            ? "Working"
            : "Not Working"}
        </span>
      </div>

      <div className="min-w-22.5">
        <span
          className={[
            "inline-flex rounded-full px-3 py-1 text-[10px] font-extrabold",

            driver.isActive
              ? "bg-[#EAF7EE] text-[#166534]"
              : "bg-red-50 text-red-700",
          ].join(" ")}
        >
          {driver.isActive
            ? "Active"
            : "Inactive"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={
            onEdit
          }
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D6DEDE] text-[#07393C] transition hover:bg-[#F0EDEE]"
        >
          <Pencil size={15} />
        </button>

        <button
          type="button"
          disabled={
            isUpdatingStatus
          }
          onClick={
            onToggleStatus
          }
          className={[
            "h-9 rounded-lg px-3 text-xs font-bold transition",

            driver.isActive
              ? "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              : "bg-[#07393C] text-white hover:bg-[#2C666E]",

            isUpdatingStatus
              ? "cursor-not-allowed opacity-50"
              : "",
          ].join(" ")}
        >
          {isUpdatingStatus
            ? "Saving..."
            : driver.isActive
              ? "Deactivate"
              : "Activate"}
        </button>
      </div>
    </div>
  );
}

function VehicleIcon({
  type,
}: {
  type?:
    | "car"
    | "bike"
    | null;
}) {
  if (
    type ===
    "car"
  ) {
    return (
      <Car
        size={16}
        className="text-[#2C666E]"
      />
    );
  }

  if (
    type ===
    "bike"
  ) {
    return (
      <Bike
        size={16}
        className="text-[#2C666E]"
      />
    );
  }

  return (
    <PersonStanding
      size={16}
      className="text-[#667577]"
    />
  );
}