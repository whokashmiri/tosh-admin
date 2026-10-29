
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
  ChevronDown,
  ChevronUp,
  Phone,
  MessageCircle,
  MapPin,
  Car,
  Bike,
  PersonStanding,
  IdCard,
  UserRound,
} from "lucide-react";

import { useTranslation } from "react-i18next";
import { DriverOrderHistory } from "../components/drivers/DriverOrderHistory";

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

type DetailedDriver = Driver & {
  vehiclePlateNumber?: string | null;
  accommodation?: {
    address?: string | null;
    location?: {
      type: "Point";
      coordinates: [number, number];
    } | null;
  } | null;
};

const PLATE_LATIN = [
  "A", "B", "J", "D", "R", "S", "X", "T",
  "E", "G", "K", "L", "Z", "N", "H", "U", "V",
];

const PLATE_ARABIC = [
  "أ", "ب", "ح", "د", "ر", "س", "ص", "ط",
  "ع", "ق", "ك", "ل", "م", "ن", "هـ", "و", "ي",
];

const LATIN_TO_ARABIC = Object.fromEntries(
  PLATE_LATIN.map((value, index) => [
    value,
    PLATE_ARABIC[index],
  ]),
);

function englishPlate(value: string) {
  return [...value.toUpperCase().replace(/[\s-]/g, "")]
    .join(" ");
}

function arabicPlate(value: string) {
  return [...value.toUpperCase().replace(/[\s-]/g, "")]
    .map((char) => {
      if (/^[0-9]$/.test(char)) {
        return "٠١٢٣٤٥٦٧٨٩"[Number(char)];
      }
      return LATIN_TO_ARABIC[char] ?? char;
    })
    .join(" ");
}

function normalizeWhatsAppPhone(phone: string) {
  let value = phone.replace(/\D/g, "");

  if (value.startsWith("00")) {
    value = value.slice(2);
  }

  if (value.startsWith("05") && value.length === 10) {
    value = `966${value.slice(1)}`;
  } else if (value.startsWith("5") && value.length === 9) {
    value = `966${value}`;
  }

  return value;
}

export default function DriversPage() {
  const { t } = useTranslation();

  const [drivers, setDrivers] = useState<DetailedDriver[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createVisible, setCreateVisible] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(
    null,
  );

  const [expandedDriverId, setExpandedDriverId] = useState<
    string | null
  >(null);

  const [updatingStatusId, setUpdatingStatusId] = useState<
    string | null
  >(null);

  const loadDrivers = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      const response = await getMyDrivers();

      setDrivers(response.drivers ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("drivers.loadFailed", "Unable to load drivers"),
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  const filteredDrivers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return drivers;

    return drivers.filter((driver) =>
      [
        driver.name,
        driver.shortName,
        driver.iqamaId,
        driver.phone,
        driver.vehicleType,
        driver.vehiclePlateNumber,
        driver.accommodation?.address,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query),
      ),
    );
  }, [drivers, search]);

  const workingCount = drivers.filter(
    (driver) => driver.workStatus === "working",
  ).length;

  const activeCount = drivers.filter(
    (driver) => driver.isActive,
  ).length;

  async function handleToggleStatus(driver: Driver) {
    const driverId = driver._id ?? driver.id;

    if (!driverId) return;

    if (driver.isActive) {
      const confirmed = window.confirm(
        t(
          "drivers.deactivateConfirmMessage",
          "Are you sure you want to deactivate this driver?",
        ),
      );

      if (!confirmed) return;
    }

    try {
      setUpdatingStatusId(driverId);
      setError(null);

      const response = await updateDriverStatus(
        driverId,
        !driver.isActive,
      );

      setDrivers((current) =>
        current.map((item) =>
          (item._id ?? item.id) === driverId
            ? { ...item, ...response.driver }
            : item,
        ),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t("drivers.updateFailed", "Unable to update driver"),
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  function toggleDetails(driverId: string) {
    setExpandedDriverId((current) =>
      current === driverId ? null : driverId,
    );
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
                {t("supervisor.drivers", "Drivers")}
              </h1>

              <p className="mt-1 text-sm text-[#667577]">
                {t(
                  "drivers.manageDescription",
                  "Manage drivers, vehicles and account access.",
                )}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCreateVisible(true)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#07393C] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#2C666E]"
            >
              <Plus size={17} />
              {t("drivers.createDriver", "Create Driver")}
            </button>
          </div>

          <section className="mb-6 grid gap-4 sm:grid-cols-3">
            <SummaryCard
              label={t("supervisor.totalDrivers", "Total Drivers")}
              value={drivers.length}
            />

            <SummaryCard
              label={t("supervisor.workingNow", "Working Now")}
              value={workingCount}
            />

            <SummaryCard
              label={t("drivers.activeAccounts", "Active Accounts")}
              value={activeCount}
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-[#D6DEDE] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#E7EBEB] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Users size={18} className="text-[#07393C]" />

                <div>
                  <h2 className="text-sm font-black text-[#07393C]">
                    {t("drivers.directory", "Driver Directory")}
                  </h2>

                  <p className="text-xs text-[#667577]">
                    {filteredDrivers.length}{" "}
                    {t("supervisor.drivers", "drivers")}
                  </p>
                </div>
              </div>

              <div className="relative w-full sm:w-72">
                <Search
                  size={16}
                  className="pointer-events-none absolute inset-s-3 top-1/2 -translate-y-1/2 text-[#667577]"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t(
                    "drivers.search",
                    "Search name, phone, Iqama or plate",
                  )}
                  className="h-10 w-full rounded-xl border border-[#CAD4D4] bg-white ps-10 pe-3 text-sm outline-none transition focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10"
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
                {Array.from({ length: 5 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-xl bg-[#F0EDEE]"
                  />
                ))}
              </div>
            ) : filteredDrivers.length === 0 ? (
              <div className="p-12 text-center">
                <Users
                  size={28}
                  className="mx-auto text-[#9AA8AA]"
                />

                <p className="mt-3 text-sm font-bold text-[#07393C]">
                  {t("supervisor.noDrivers", "No drivers found")}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#EDF0F0]">
             {filteredDrivers.map((driver) => {
  const driverId = driver._id ?? driver.id ?? "";
  const expanded = expandedDriverId === driverId;

  return (
    <div key={driverId} className="flex w-full flex-col">
      {/* Compact row */}
      <div className="flex items-center gap-3 px-4 py-2 transition hover:bg-[#F8FAFA]">
        <div className="min-w-0 flex-1">
          <DriverRow
            driver={driver}
            isUpdatingStatus={updatingStatusId === driverId}
            onEdit={() => setEditingDriver(driver)}
            onToggleStatus={() => void handleToggleStatus(driver)}
          />
        </div>

        <button
          type="button"
          disabled={!driverId}
          onClick={() => toggleDetails(driverId)}
          aria-expanded={expanded}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#D6DEDE] bg-[#F8FAFA] px-2.5 py-1.5 text-xs font-bold text-[#07393C] transition hover:bg-[#F0EDEE] disabled:opacity-50"
        >
          {expanded
            ? t("drivers.hideDetails", "Hide Details")
            : t("drivers.viewDetails", "View Details")}

          {expanded ? (
            <ChevronUp size={14} />
          ) : (
            <ChevronDown size={14} />
          )}
        </button>
      </div>

      {/* Details open below the row */}
      {expanded && <DriverDetailsPanel driver={driver} />}
    </div>
  );
})}
              </div>
            )}
          </section>
        </main>
      </div>

      <DriverFormModal
        open={createVisible}
        onClose={() => setCreateVisible(false)}
        onSaved={() => {
          setCreateVisible(false);
          void loadDrivers();
        }}
      />

      <DriverFormModal
        open={Boolean(editingDriver)}
        driver={editingDriver}
        onClose={() => setEditingDriver(null)}
        onSaved={() => {
          setEditingDriver(null);
          void loadDrivers();
        }}
      />
    </div>
  );
}

function DriverDetailsPanel({
  driver,
}: {
  driver: DetailedDriver;
}) {
  const { t } = useTranslation();

  const coordinates =
    driver.accommodation?.location?.coordinates;

  const plate = driver.vehiclePlateNumber ?? "";

  const vehicleLabel =
    driver.vehicleType === "car"
      ? t("drivers.car", "Car")
      : driver.vehicleType === "bike"
        ? t("drivers.bike", "Bike")
        : t("drivers.walking", "Walking");

  const VehicleIcon =
    driver.vehicleType === "car"
      ? Car
      : driver.vehicleType === "bike"
        ? Bike
        : PersonStanding;

  const phone = driver.phone?.trim();

  const mapsUrl =
    coordinates?.length === 2 &&
    coordinates.every(Number.isFinite)
      ? `https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}`
      : null;

  return (
    <div className="border-t border-[#E5EAEA] bg-[#F8FAFA] p-4 sm:p-6">
      <div className="rounded-xl border border-[#D6DEDE] bg-white p-5">
        <div className="mb-5 flex items-center gap-3 border-b border-[#EDF0F0] pb-4">
          <UserRound size={19} className="text-[#2C666E]" />

          <div>
            <h3 className="text-sm font-black text-[#07393C]">
              {t("drivers.information", "Driver Information")}
            </h3>

            <p className="mt-1 text-xs text-[#667577]">
              {driver.name}
            </p>
          </div>
        </div>

        <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem
            label={t("drivers.fullName", "Full Name")}
            value={driver.name}
          />

          <DetailItem
            label={t("drivers.shortName", "Short Name")}
            value={driver.shortName}
          />

          <DetailItem
            label={t("profile.iqama", "Iqama ID")}
            value={driver.iqamaId}
            icon={<IdCard size={15} />}
          />

          <DetailItem
            label={t("profile.phone", "Phone")}
            value={phone}
            icon={<Phone size={15} />}
          />

          <DetailItem
            label={t("drivers.vehicleType", "Vehicle Type")}
            value={vehicleLabel}
            icon={<VehicleIcon size={15} />}
          />

          <DetailItem
            label={t("common.status", "Account Status")}
            value={
              driver.isActive
                ? t("common.active", "Active")
                : t("common.inactive", "Inactive")
            }
          />

          <DetailItem
            label={t("drivers.plateEnglish", "Plate (English)")}
            value={plate ? englishPlate(plate) : "-"}
          />

          <DetailItem
            label={t("drivers.plateArabic", "Plate (Arabic)")}
            value={plate ? arabicPlate(plate) : "-"}
          />
        </div>

        {/* Accommodation */}
        <div className="mt-5 rounded-xl border border-[#D6DEDE] bg-[#F8FAFA] p-4">
          <div className="flex items-start gap-3">
            <MapPin
              size={18}
              className="mt-0.5 shrink-0 text-[#2C666E]"
            />

            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#667577]">
                {t(
                  "drivers.accommodation",
                  "Accommodation Location",
                )}
              </p>

              <p className="mt-2 wrap-break-word text-sm font-bold text-[#07393C]">
                {driver.accommodation?.address || "-"}
              </p>

              {coordinates?.length === 2 && (
                <p className="mt-2 text-xs text-[#667577]">
                  {coordinates[1].toFixed(6)},{" "}
                  {coordinates[0].toFixed(6)}
                  {" "}(lat, lng)
                </p>
              )}

              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex text-xs font-bold text-[#2C666E] underline"
                >
                  {t("drivers.openMap", "Open in Google Maps")}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Contact actions */}
        {phone && (
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#07393C] px-5 text-xs font-bold text-white transition hover:bg-[#2C666E]"
            >
              <Phone size={15} />
              {t("drivers.call", "Call")}
            </a>

            <a
              href={`https://wa.me/${normalizeWhatsAppPhone(phone)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#D6DEDE] bg-white px-5 text-xs font-bold text-[#07393C] transition hover:bg-[#F0EDEE]"
            >
              <MessageCircle size={15} />
              WhatsApp
            </a>
          </div>
        )}
      </div>
      <DriverOrderHistory driverId={driver._id ?? driver.id ?? ""} className="mt-4" />
    </div>
  );
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: React.ReactNode;
}) {
  return (
    <div className="min-w-0 border-b border-[#EDF0F0] py-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#667577]">
        {icon}
        {label}
      </div>

      <p className="mt-2 wrap-break-word text-sm font-extrabold text-[#0A090C]">
        {value || "-"}
      </p>
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
