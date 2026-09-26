import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import {
  Bike,
  Camera,
  Car,
  Loader2,
  UserRound,
  X,
} from "lucide-react";

import {
  createDriver,
  updateDriver,
} from "../../api/driverApi";

import type {
  Driver,
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
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const [
    name,
    setName,
  ] = useState("");

  const [
    shortName,
    setShortName,
  ] = useState("");

  const [
    iqamaId,
    setIqamaId,
  ] = useState("");

  const [
    phone,
    setPhone,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    vehicleType,
    setVehicleType,
  ] =
    useState<VehicleType>(
      "car",
    );

  const [
    profileFile,
    setProfileFile,
  ] =
    useState<File | null>(
      null,
    );

  const [
    previewUrl,
    setPreviewUrl,
  ] =
    useState<string | null>(
      null,
    );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const isEditing =
    Boolean(driver);

  useEffect(() => {
    if (!open) {
      return;
    }

    setName(
      driver?.name ??
        "",
    );

    setShortName(
      driver?.shortName ??
        "",
    );

    setIqamaId(
      driver?.iqamaId ??
        "",
    );

    setPhone(
      driver?.phone ??
        "",
    );

    setPassword("");

    setVehicleType(
      driver?.vehicleType ??
        "car",
    );

    setProfileFile(
      null,
    );

    setPreviewUrl(
      driver?.profilePicture
        ?.url ??
        null,
    );

    setError(
      null,
    );
  }, [
    open,
    driver,
  ]);

  useEffect(() => {
    return () => {
      if (
        previewUrl?.startsWith(
          "blob:",
        )
      ) {
        URL.revokeObjectURL(
          previewUrl,
        );
      }
    };
  }, [previewUrl]);

  if (!open) {
    return null;
  }

  function handleFileChange(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/",
      )
    ) {
      setError(
        "Please select an image file.",
      );

      return;
    }

    if (
      file.size >
      5 *
        1024 *
        1024
    ) {
      setError(
        "Profile image must be under 5MB.",
      );

      return;
    }

    if (
      previewUrl?.startsWith(
        "blob:",
      )
    ) {
      URL.revokeObjectURL(
        previewUrl,
      );
    }

    setProfileFile(
      file,
    );

    setPreviewUrl(
      URL.createObjectURL(
        file,
      ),
    );

    setError(
      null,
    );
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      isSaving
    ) {
      return;
    }

    const cleanName =
      name.trim();

    const cleanIqama =
      iqamaId.trim();

    if (!cleanName) {
      setError(
        "Full name is required.",
      );

      return;
    }

    if (!cleanIqama) {
      setError(
        "Iqama ID is required.",
      );

      return;
    }

    if (
      !isEditing &&
      password.length < 6
    ) {
      setError(
        "Password must be at least 6 characters.",
      );

      return;
    }

    if (
      isEditing &&
      password &&
      password.length < 6
    ) {
      setError(
        "Password must be at least 6 characters.",
      );

      return;
    }

    try {
      setError(null);

      setIsSaving(
        true,
      );

      if (
        isEditing &&
        driver
      ) {
        const driverId =
          driver._id ??
          driver.id;

        if (!driverId) {
          throw new Error(
            "Driver ID is missing.",
          );
        }

        await updateDriver(
          driverId,
          {
            name:
              cleanName,

            shortName:
              shortName.trim() ||
              null,

            iqamaId:
              cleanIqama,

            phone:
              phone.trim() ||
              null,

            vehicleType,

            profilePictureFile:
              profileFile,

            ...(password
              ? {
                  password,
                }
              : {}),
          },
        );
      } else {
        await createDriver({
          name:
            cleanName,

          shortName:
            shortName.trim() ||
            undefined,

          iqamaId:
            cleanIqama,

          phone:
            phone.trim() ||
            undefined,

          password,

          vehicleType,

          profilePictureFile:
            profileFile,
        });
      }

      onSaved();
    } catch (error) {
      setError(
        getApiError(
          error,
        ),
      );
    } finally {
      setIsSaving(
        false,
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E7EBEB] bg-white px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-[#07393C]">
              {isEditing
                ? "Edit Driver"
                : "Create Driver"}
            </h2>

            <p className="mt-1 text-xs text-[#667577]">
              {isEditing
                ? "Update driver information and vehicle."
                : "Add a new driver to your operation."}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              isSaving
            }
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0EDEE] text-[#07393C] transition hover:bg-[#E4EAEA]"
          >
            <X size={17} />
          </button>
        </div>

        <form
          onSubmit={
            handleSubmit
          }
          className="p-6"
        >
          <div className="mb-7 flex items-center gap-5">
            <div className="relative h-20 w-20 shrink-0">
              <div className="h-full w-full overflow-hidden rounded-full border-2 border-[#D6DEDE] bg-[#F0EDEE]">
                {previewUrl ? (
                  <img
                    src={
                      previewUrl
                    }
                    alt="Driver"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <UserRound
                      size={27}
                      className="text-[#667577]"
                    />
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-[#07393C] text-white shadow"
              >
                <Camera size={13} />
              </button>

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/*"
                onChange={
                  handleFileChange
                }
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

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Full Name"
              value={
                name
              }
              onChange={
                setName
              }
              placeholder="Driver full name"
            />

            <Field
              label="Short Name"
              value={
                shortName
              }
              onChange={
                setShortName
              }
              placeholder="Short display name"
            />

            <Field
              label="Iqama ID"
              value={
                iqamaId
              }
              onChange={
                setIqamaId
              }
              placeholder="Iqama ID"
            />

            <Field
              label="Phone"
              value={
                phone
              }
              onChange={
                setPhone
              }
              placeholder="Phone number"
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-bold text-[#07393C]">
                Vehicle Type
              </label>

              <div className="grid grid-cols-2 gap-3">
                <VehicleButton
                  active={
                    vehicleType ===
                    "car"
                  }
                  label="Car"
                  icon={
                    <Car size={17} />
                  }
                  onClick={() =>
                    setVehicleType(
                      "car",
                    )
                  }
                />

                <VehicleButton
                  active={
                    vehicleType ===
                    "bike"
                  }
                  label="Bike"
                  icon={
                    <Bike size={17} />
                  }
                  onClick={() =>
                    setVehicleType(
                      "bike",
                    )
                  }
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <Field
                label={
                  isEditing
                    ? "New Password"
                    : "Password"
                }
                value={
                  password
                }
                onChange={
                  setPassword
                }
                placeholder={
                  isEditing
                    ? "Leave empty to keep current password"
                    : "Minimum 6 characters"
                }
                type="password"
              />
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="mt-7 flex justify-end gap-3 border-t border-[#EDF0F0] pt-5">
            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                isSaving
              }
              className="h-11 rounded-xl border border-[#D6DEDE] px-5 text-sm font-bold text-[#667577] transition hover:bg-[#F0EDEE]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                isSaving
              }
              className="inline-flex h-11 min-w-36 items-center justify-center gap-2 rounded-xl bg-[#07393C] px-5 text-sm font-bold text-white transition hover:bg-[#2C666E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />

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
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;

  value: string;

  onChange: (
    value: string,
  ) => void;

  placeholder: string;

  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold text-[#07393C]">
        {label}
      </label>

      <input
        type={
          type
        }
        value={
          value
        }
        onChange={(
          event,
        ) =>
          onChange(
            event.target
              .value,
          )
        }
        placeholder={
          placeholder
        }
        className="h-11 w-full rounded-xl border border-[#CAD4D4] bg-white px-3 text-sm text-[#0A090C] outline-none transition placeholder:text-[#9AA8AA] focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10"
      />
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

  icon: React.ReactNode;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
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

    if (
      axiosError.response
        ?.data?.message
    ) {
      return axiosError.response
        .data.message;
    }
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Something went wrong";
}