import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import {
  Bike,
  Building2,
  Camera,
  Car,
  Eye,
  EyeOff,
  Loader2,
  UserRound,
  X,
} from "lucide-react";

import { createDriver, updateDriver } from "../../api/driverApi";

import type {
  Driver,
  DriverAccommodation,
  VehicleType,
} from "../../types/driver";

type DriverFormModalProps = {
  open: boolean;
  driver?: Driver | null;
  onClose: () => void;
  onSaved: () => void;
};

export function DriverFormModal({
  open,
  driver,
  onClose,
  onSaved,
}: DriverFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [iqamaId, setIqamaId] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [vehicleType, setVehicleType] = useState<VehicleType>("car");
  const [plateNumber, setPlateNumber] = useState("");

  const [accommodationAddress, setAccommodationAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");

  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(driver);

  // Fill / reset the form when the modal opens
  useEffect(() => {
    if (!open) return;

    setName(driver?.name ?? "");
    setShortName(driver?.shortName ?? "");
    setIqamaId(driver?.iqamaId ?? "");
    setPhone(driver?.phone ?? "");
    setPassword("");
    setShowPassword(false);

    setVehicleType(driver?.vehicleType ?? "car");
    setPlateNumber(driver?.vehiclePlateNumber ?? "");

    const coords = driver?.accommodation?.location?.coordinates;

    setAccommodationAddress(driver?.accommodation?.address ?? "");
    setLongitude(coords ? String(coords[0]) : "");
    setLatitude(coords ? String(coords[1]) : "");

    setProfileFile(null);
    setPreviewUrl(driver?.profilePicture?.url ?? null);
    setError(null);
  }, [open, driver]);

  // Revoke blob previews
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isSaving, onClose]);

  // Lock background scroll
  useEffect(() => {
    if (!open) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be under 5MB.");
      return;
    }

    setProfileFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSaving) return;

    const cleanName = name.trim();
    const cleanIqama = iqamaId.trim();

    if (!cleanName) {
      setError("Full name is required.");
      return;
    }

    if (!cleanIqama) {
      setError("Iqama ID is required.");
      return;
    }

    if ((!isEditing || password) && password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // Build accommodation payload
    const address = accommodationAddress.trim();
    const latText = latitude.trim();
    const lngText = longitude.trim();

    let accommodationPayload: DriverAccommodation | null = null;

    if (latText || lngText) {
      if (!latText || !lngText) {
        setError("Enter both latitude and longitude, or leave both empty.");
        return;
      }

      const lat = Number(latText);
      const lng = Number(lngText);

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        setError("Latitude or longitude is not valid.");
        return;
      }

      accommodationPayload = {
        address: address || null,
        location: {
          type: "Point",
          coordinates: [lng, lat], // GeoJSON: [longitude, latitude]
        },
      };
    } else if (address) {
      accommodationPayload = { address };
    }

    try {
      setError(null);
      setIsSaving(true);

      if (isEditing && driver) {
        const driverId = driver._id ?? driver.id;

        if (!driverId) throw new Error("Driver ID is missing.");

        await updateDriver(driverId, {
          name: cleanName,
          shortName: shortName.trim() || null,
          iqamaId: cleanIqama,
          phone: phone.trim() || null,
          vehicleType,
          vehiclePlateNumber: plateNumber.trim() || null,
          accommodation: accommodationPayload, // null clears it on the server
          profilePictureFile: profileFile,
          ...(password ? { password } : {}),
        });
      } else {
        await createDriver({
          name: cleanName,
          shortName: shortName.trim() || undefined,
          iqamaId: cleanIqama,
          phone: phone.trim() || undefined,
          password,
          vehicleType,
          vehiclePlateNumber: plateNumber.trim() || undefined,
          accommodation: accommodationPayload ?? undefined,
          profilePictureFile: profileFile,
        });
      }

      onSaved();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#E7EBEB] px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-[#07393C]">
              {isEditing ? "Edit Driver" : "Create Driver"}
            </h2>

            <p className="mt-1 text-xs text-[#667577]">
              {isEditing
                ? "Update driver information, vehicle and accommodation."
                : "Add a new driver to your operation."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EDEE] text-[#07393C] transition hover:bg-[#E4EAEA] disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Profile */}
          <div className="flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0">
              <div className="h-full w-full overflow-hidden rounded-full border-2 border-[#D6DEDE] bg-[#F0EDEE]">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Driver"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserRound size={27} className="text-[#667577]" />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Change profile picture"
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#07393C] text-white shadow transition hover:bg-[#2C666E]"
              >
                <Camera size={13} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div>
              <p className="text-sm font-bold text-[#07393C]">
                Profile Picture
              </p>

              <p className="mt-1 max-w-xs text-xs leading-5 text-[#667577]">
                JPG, PNG or WebP. Maximum size 5MB.
              </p>
            </div>
          </div>

          {/* Personal info */}
          <Section title="Personal Info">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Full Name"
                value={name}
                onChange={setName}
                placeholder="Driver full name"
                required
              />

              <Field
                label="Short Name"
                value={shortName}
                onChange={setShortName}
                placeholder="Short display name"
              />

              <Field
                label="Iqama ID"
                value={iqamaId}
                onChange={setIqamaId}
                placeholder="Iqama ID"
                required
              />

              <Field
                label="Phone"
                value={phone}
                onChange={setPhone}
                placeholder="05XXXXXXXX"
                type="tel"
              />
            </div>
          </Section>

          {/* Vehicle */}
          <Section title="Vehicle">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-bold text-[#07393C]">
                  Vehicle Type
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <VehicleButton
                    active={vehicleType === "car"}
                    label="Car"
                    icon={<Car size={17} />}
                    onClick={() => setVehicleType("car")}
                  />

                  <VehicleButton
                    active={vehicleType === "bike"}
                    label="Bike"
                    icon={<Bike size={17} />}
                    onClick={() => setVehicleType("bike")}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <Field
                  label="Plate Number"
                  value={plateNumber}
                  onChange={(value) => setPlateNumber(value.toUpperCase())}
                  placeholder="e.g. ABC 1234"
                />
              </div>
            </div>
          </Section>

          {/* Accommodation */}
          <Section title="Accommodation" icon={<Building2 size={14} />}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Field
                  label="Address"
                  value={accommodationAddress}
                  onChange={setAccommodationAddress}
                  placeholder="Building / camp / address / room"
                />
              </div>

              <Field
                label="Latitude"
                value={latitude}
                onChange={setLatitude}
                placeholder="e.g. 24.7136"
              />

              <Field
                label="Longitude"
                value={longitude}
                onChange={setLongitude}
                placeholder="e.g. 46.6753"
              />
            </div>
          </Section>

          {/* Security */}
          <Section title="Security">
            <Field
              label={isEditing ? "New Password" : "Password"}
              value={password}
              onChange={setPassword}
              placeholder={
                isEditing
                  ? "Leave empty to keep current password"
                  : "Minimum 6 characters"
              }
              type={showPassword ? "text" : "password"}
              required={!isEditing}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  className="flex h-full w-10 items-center justify-center text-[#667577] hover:text-[#07393C]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />
          </Section>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="flex shrink-0 justify-end gap-3 border-t border-[#EDF0F0] bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="h-11 rounded-xl border border-[#D6DEDE] px-5 text-sm font-bold text-[#667577] transition hover:bg-[#F0EDEE] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-[#07393C] px-5 text-sm font-bold text-white transition hover:bg-[#2C666E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Create Driver"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 border-b border-[#EDF0F0] pb-2">
        {icon && <span className="text-[#2C666E]">{icon}</span>}

        <h3 className="text-[11px] font-black uppercase tracking-wider text-[#2C666E]">
          {title}
        </h3>
      </div>

      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  required?: boolean;
  trailing?: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-[#07393C]">
        {label}
        {required && <span className="ms-0.5 text-red-500">*</span>}
      </label>

      <div className="relative h-11">
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={[
            "h-full w-full rounded-xl border border-[#CAD4D4] bg-white ps-3 text-sm text-[#0A090C] outline-none transition placeholder:text-[#9AA8AA] focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10",
            trailing ? "pe-10" : "pe-3",
          ].join(" ")}
        />

        {trailing && (
          <div className="absolute inset-y-0 inset-e-0">{trailing}</div>
        )}
      </div>
    </div>
  );
}

function VehicleButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-bold transition",
        active
          ? "border-[#07393C] bg-[#07393C] text-white"
          : "border-[#D6DEDE] bg-white text-[#667577] hover:bg-[#F0EDEE]",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );
}

function getApiError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const axiosError = error as {
      response?: { data?: { message?: string } };
    };

    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }
  }

  if (error instanceof Error) return error.message;

  return "Something went wrong";
}