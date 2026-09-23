import {
  useState,
  type FormEvent,
} from "react";

import {
  ArrowLeft,
  Eye,
  EyeOff,
  Languages,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useTranslation,
} from "react-i18next";

import {
  register,
} from "../../api/authApi";

import {
  useLanguage,
} from "../../context/LanguageContext";

function getErrorMessage(
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

  return "Unable to create account";
}

export function RegisterForm() {
  const { t } =
    useTranslation();

  const navigate =
    useNavigate();

  const {
    language,
    toggleLanguage,
  } = useLanguage();

  const [
    name,
    setName,
  ] = useState("");

  const [
    iqamaId,
    setIqamaId,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    success,
    setSuccess,
  ] =
    useState<string | null>(
      null,
    );

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      isSubmitting
    ) {
      return;
    }

    const cleanName =
      name.trim();

    const cleanIqamaId =
      iqamaId.trim();

    if (!cleanName) {
      setError(
        t(
          "auth.nameRequired",
          "Full name is required",
        ),
      );

      return;
    }

    if (!cleanIqamaId) {
      setError(
        t(
          "auth.iqamaRequired",
          "Iqama ID is required",
        ),
      );

      return;
    }

    if (
      password.length < 6
    ) {
      setError(
        t(
          "auth.passwordMinimum",
          "Password must be at least 6 characters",
        ),
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        t(
          "auth.passwordMismatch",
          "Passwords do not match",
        ),
      );

      return;
    }

    try {
      setError(null);

      setSuccess(null);

      setIsSubmitting(
        true,
      );

      await register({
        name:
          cleanName,

        iqamaId:
          cleanIqamaId,

        password,
      });

      setSuccess(
        t(
          "auth.accountCreated",
          "Account created successfully",
        ),
      );

      setName("");

      setIqamaId("");

      setPassword("");

      setConfirmPassword("");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
        ),
      );
    } finally {
      setIsSubmitting(
        false,
      );
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* TOP */}

      <div className="mb-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            navigate(
              "/login",
            )
          }
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D6DEDE] bg-white px-3 text-xs font-bold text-[#07393C] transition hover:bg-[#F0EDEE]"
        >
          <ArrowLeft
            size={15}
          />

          {t(
            "common.back",
            "Back",
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            void toggleLanguage()
          }
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D6DEDE] bg-white px-3 text-xs font-bold text-[#07393C] transition hover:border-[#2C666E] hover:bg-[#F0EDEE]"
        >
          <Languages
            size={15}
          />

          {language === "ar"
            ? "English"
            : "العربية"}
        </button>
      </div>

      {/* HEADER */}

      <div className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07393C] text-white shadow-lg shadow-[#07393C]/15">
          <ShieldCheck
            size={21}
          />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2C666E]">
          {t(
            "auth.adminRegistration",
            "Management Registration",
          )}
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0A090C]">
          {t(
            "auth.createAccount",
            "Create an account",
          )}
        </h1>

        <p className="mt-3 max-w-sm text-sm leading-6 text-[#667577]">
          {t(
            "auth.createAccountDescription",
            "Create a management account for the TOSH operations platform.",
          )}
        </p>
      </div>

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-4"
      >
        {/* NAME */}

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-xs font-bold text-[#07393C]"
          >
            {t(
              "auth.fullName",
              "Full Name",
            )}
          </label>

          <div className="group relative">
            <UserRound
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#667577] group-focus-within:text-[#07393C] rtl:left-auto rtl:right-4"
            />

            <input
              id="name"
              type="text"
              value={name}
              autoComplete="name"
              onChange={(
                event,
              ) => {
                setName(
                  event.target
                    .value,
                );

                setError(
                  null,
                );

                setSuccess(
                  null,
                );
              }}
              placeholder={t(
                "auth.fullNamePlaceholder",
                "Enter full name",
              )}
              className="h-12 w-full rounded-xl border border-[#CAD4D4] bg-white pl-11 pr-4 text-sm font-medium text-[#0A090C] outline-none transition placeholder:text-[#9AA8AA] focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10 rtl:pl-4 rtl:pr-11"
            />
          </div>
        </div>

        {/* IQAMA */}

        <div>
          <label
            htmlFor="registerIqama"
            className="mb-2 block text-xs font-bold text-[#07393C]"
          >
            {t(
              "auth.iqamaId",
              "Iqama ID",
            )}
          </label>

          <div className="group relative">
            <UserRound
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#667577] group-focus-within:text-[#07393C] rtl:left-auto rtl:right-4"
            />

            <input
              id="registerIqama"
              type="text"
              inputMode="numeric"
              value={
                iqamaId
              }
              onChange={(
                event,
              ) => {
                setIqamaId(
                  event.target
                    .value,
                );

                setError(
                  null,
                );

                setSuccess(
                  null,
                );
              }}
              placeholder={t(
                "auth.iqamaPlaceholder",
                "Enter your Iqama ID",
              )}
              className="h-12 w-full rounded-xl border border-[#CAD4D4] bg-white pl-11 pr-4 text-sm font-medium text-[#0A090C] outline-none transition placeholder:text-[#9AA8AA] focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10 rtl:pl-4 rtl:pr-11"
            />
          </div>
        </div>

        {/* PASSWORD */}

        <PasswordInput
          id="registerPassword"
          label={t(
            "auth.password",
            "Password",
          )}
          value={
            password
          }
          visible={
            showPassword
          }
          onToggle={() =>
            setShowPassword(
              (current) =>
                !current,
            )
          }
          onChange={(
            value,
          ) => {
            setPassword(
              value,
            );

            setError(
              null,
            );

            setSuccess(
              null,
            );
          }}
          placeholder={t(
            "auth.passwordPlaceholder",
            "Enter password",
          )}
        />

        {/* CONFIRM PASSWORD */}

        <PasswordInput
          id="confirmPassword"
          label={t(
            "auth.confirmPassword",
            "Confirm Password",
          )}
          value={
            confirmPassword
          }
          visible={
            showConfirmPassword
          }
          onToggle={() =>
            setShowConfirmPassword(
              (current) =>
                !current,
            )
          }
          onChange={(
            value,
          ) => {
            setConfirmPassword(
              value,
            );

            setError(
              null,
            );

            setSuccess(
              null,
            );
          }}
          placeholder={t(
            "auth.confirmPasswordPlaceholder",
            "Enter password again",
          )}
        />

        {/* ERROR */}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* SUCCESS */}

        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-700">
            {success}
          </div>
        )}

        {/* SUBMIT */}

        <button
          type="submit"
          disabled={
            isSubmitting
          }
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#07393C] text-sm font-extrabold text-white shadow-lg shadow-[#07393C]/15 transition hover:bg-[#2C666E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />

              {t(
                "auth.creating",
                "Creating account...",
              )}
            </>
          ) : (
            <>
              <UserPlus
                size={17}
              />

              {t(
                "auth.createAccountButton",
                "Create Account",
              )}
            </>
          )}
        </button>
      </form>

      <div className="mt-7 rounded-xl bg-[#F0EDEE] px-4 py-3 text-center text-[11px] leading-5 text-[#667577]">
        {t(
          "auth.managementOnly",
          "This registration page is intended for authorized management accounts only.",
        )}
      </div>
    </div>
  );
}

function PasswordInput({
  id,
  label,
  value,
  visible,
  placeholder,
  onChange,
  onToggle,
}: {
  id: string;

  label: string;

  value: string;

  visible: boolean;

  placeholder: string;

  onChange: (
    value: string,
  ) => void;

  onToggle:
    () => void;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-bold text-[#07393C]"
      >
        {label}
      </label>

      <div className="group relative">
        <LockKeyhole
          size={17}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#667577] group-focus-within:text-[#07393C] rtl:left-auto rtl:right-4"
        />

        <input
          id={id}
          type={
            visible
              ? "text"
              : "password"
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
          autoComplete="new-password"
          className="h-12 w-full rounded-xl border border-[#CAD4D4] bg-white pl-11 pr-12 text-sm font-medium text-[#0A090C] outline-none transition placeholder:text-[#9AA8AA] focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10 rtl:pl-12 rtl:pr-11"
        />

        <button
          type="button"
          onClick={
            onToggle
          }
          className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#667577] transition hover:bg-[#F0EDEE] hover:text-[#07393C] rtl:left-3 rtl:right-auto"
        >
          {visible ? (
            <EyeOff
              size={16}
            />
          ) : (
            <Eye
              size={16}
            />
          )}
        </button>
      </div>
    </div>
  );
}