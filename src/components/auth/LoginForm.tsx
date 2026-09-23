import {
  useState,
  type FormEvent,
} from "react";

import {
  Eye,
  EyeOff,
  Languages,
  Loader2,
  LockKeyhole,
  LogIn,
  UserRound,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to sign in";
}

export function LoginForm() {
  const { t } = useTranslation();

  const navigate = useNavigate();

  const { login } = useAuth();

  const {
    language,
    toggleLanguage,
  } = useLanguage();

  const [iqamaId, setIqamaId] = useState("");

  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    const cleanIqamaId = iqamaId.trim();

    if (!cleanIqamaId) {
      setError(
        t(
          "auth.iqamaRequired",
          "Iqama ID is required",
        ),
      );

      return;
    }

    if (!password) {
      setError(
        t(
          "auth.passwordRequired",
          "Password is required",
        ),
      );

      return;
    }

    try {
      setError(null);

      setIsSubmitting(true);

      const user = await login({
        iqamaId: cleanIqamaId,
        password,
      });

      if (user.role === "admin") {
        navigate("/admin", {
          replace: true,
        });

        return;
      }

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-10 flex items-center justify-between lg:justify-end">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#07393C] text-sm font-black text-white">
            T
          </div>

          <span className="text-lg font-black tracking-[0.18em] text-[#07393C]">
            TOSH
          </span>
        </div>

        <button
          type="button"
          onClick={() => void toggleLanguage()}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D6DEDE] bg-white px-3 text-xs font-bold text-[#07393C] transition hover:border-[#2C666E] hover:bg-[#F0EDEE]"
        >
          <Languages size={15} />

          {language === "ar"
            ? "English"
            : "العربية"}
        </button>
      </div>

      <div className="mb-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#07393C] text-white shadow-lg shadow-[#07393C]/15">
          <LogIn size={20} />
        </div>

        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2C666E]">
          {t(
            "auth.welcomeBack",
            "Welcome back",
          )}
        </p>

        <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0A090C]">
          {t(
            "auth.signIn",
            "Sign in to TOSH",
          )}
        </h2>

        <p className="mt-3 max-w-sm text-sm leading-6 text-[#667577]">
          {t(
            "auth.loginDescription",
            "Enter your account credentials to access the operations dashboard.",
          )}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="iqamaId"
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
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#667577] transition group-focus-within:text-[#07393C] rtl:left-auto rtl:right-4"
            />

            <input
              id="iqamaId"
              type="text"
              inputMode="numeric"
              autoComplete="username"
              value={iqamaId}
              onChange={(event) => {
                setIqamaId(event.target.value);

                if (error) {
                  setError(null);
                }
              }}
              placeholder={t(
                "auth.iqamaPlaceholder",
                "Enter your Iqama ID",
              )}
              className="h-12 w-full rounded-xl border border-[#CAD4D4] bg-white pl-11 pr-4 text-sm font-medium text-[#0A090C] outline-none transition placeholder:text-[#9AA8AA] focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10 rtl:pl-4 rtl:pr-11"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-2 block text-xs font-bold text-[#07393C]"
          >
            {t(
              "auth.password",
              "Password",
            )}
          </label>

          <div className="group relative">
            <LockKeyhole
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#667577] transition group-focus-within:text-[#07393C] rtl:left-auto rtl:right-4"
            />

            <input
              id="password"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);

                if (error) {
                  setError(null);
                }
              }}
              placeholder={t(
                "auth.passwordPlaceholder",
                "Enter your password",
              )}
              className="h-12 w-full rounded-xl border border-[#CAD4D4] bg-white pl-11 pr-12 text-sm font-medium text-[#0A090C] outline-none transition placeholder:text-[#9AA8AA] focus:border-[#07393C] focus:ring-4 focus:ring-[#07393C]/10 rtl:pl-12 rtl:pr-11"
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#667577] transition hover:bg-[#F0EDEE] hover:text-[#07393C] rtl:left-3 rtl:right-auto"
            >
              {showPassword
                ? <EyeOff size={16} />
                : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#07393C] px-4 text-sm font-extrabold text-white shadow-lg shadow-[#07393C]/15 transition hover:bg-[#2C666E] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2
                size={17}
                className="animate-spin"
              />

              {t(
                "auth.signingIn",
                "Signing in...",
              )}
            </>
          ) : (
            <>
              <LogIn size={17} />

              {t(
                "auth.signInButton",
                "Sign In",
              )}
            </>
          )}
        </button>
      </form>

      <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-[#8A989A]">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

        {t(
          "auth.authorizedOnly",
          "Authorized supervisors and administrators only",
        )}
      </div>
    </div>
  );
}