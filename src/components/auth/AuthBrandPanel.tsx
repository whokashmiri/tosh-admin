import {
  BarChart3,
  MapPinned,
  ShieldCheck,
  Truck,
} from "lucide-react";

import { useTranslation } from "react-i18next";

export function AuthBrandPanel() {
  const { t } = useTranslation();

  return (
    <section className="relative hidden overflow-hidden bg-[#07393C] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[#2C666E]/35 blur-3xl" />

      <div className="absolute -bottom-28 -right-15 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur">
            <Truck size={24} />
          </div>

          <div>
            <div className="text-xl font-black tracking-[0.24em]">
              TOSH
            </div>

            <div className="mt-0.5 text-xs text-white/60">
              {t(
                "auth.operationsPlatform",
                "Delivery Operations Platform",
              )}
            </div>
          </div>
        </div>

        <div className="mt-20 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            {t(
              "auth.controlCenter",
              "Operations Control Center",
            )}
          </div>

          <h1 className="mt-6 text-4xl font-black leading-[1.12] tracking-tight xl:text-5xl">
            {t(
              "auth.heroTitle",
              "Manage your delivery operation from one place.",
            )}
          </h1>

          <p className="mt-5 max-w-lg text-sm leading-7 text-white/65 xl:text-base">
            {t(
              "auth.heroDescription",
              "Monitor drivers, live locations, orders and performance from a single real-time dashboard.",
            )}
          </p>
        </div>

        <div className="mt-12 grid gap-3 xl:grid-cols-3">
          <FeatureCard
            icon={<MapPinned size={18} />}
            title={t(
              "auth.liveTracking",
              "Live Tracking",
            )}
            description={t(
              "auth.liveTrackingDescription",
              "Track drivers and their latest locations.",
            )}
          />

          <FeatureCard
            icon={<BarChart3 size={18} />}
            title={t(
              "auth.performance",
              "Performance",
            )}
            description={t(
              "auth.performanceDescription",
              "Monitor shifts, orders and statistics.",
            )}
          />

          <FeatureCard
            icon={<ShieldCheck size={18} />}
            title={t(
              "auth.secureAccess",
              "Secure Access",
            )}
            description={t(
              "auth.secureAccessDescription",
              "Supervisor and administrator access only.",
            )}
          />
        </div>
      </div>

      <div className="relative z-10 mt-12 flex items-center gap-2 text-xs text-white/55">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />

        {t(
          "auth.systemOnline",
          "Operations system online",
        )}
      </div>
    </section>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
        {icon}
      </div>

      <div className="mt-4 text-sm font-bold">
        {title}
      </div>

      <div className="mt-1 text-xs leading-5 text-white/55">
        {description}
      </div>
    </div>
  );
}