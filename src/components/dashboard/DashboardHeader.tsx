
import {
  Bell,
  Menu,
  Languages,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export function DashboardHeader() {
  const { user } = useAuth();

  const {
    language,
    toggleLanguage,
  } = useLanguage();

  return (
    <header className="sticky top-0 z-30 flex h-15 items-center justify-between border-b border-[#D6DEDE] bg-white/95 px-5 backdrop-blur lg:px-8">
      <div className="flex flex-row gap-3">
        <h1 className="text-xl font-black text-[#07393C]">
          {user?.name ?? "User"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <button
          type="button"
          onClick={() => void toggleLanguage()}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#D6DEDE] bg-white px-3 text-xs font-bold text-[#07393C] transition hover:border-[#2C666E] hover:bg-[#F0EDEE]"
          aria-label="Switch language"
        >
          <Languages size={15} />

          {language === "ar"
            ? "English"
            : "العربية"}
        </button>

        {/* Notifications */}
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D6DEDE] bg-white text-[#07393C] transition hover:bg-[#F0EDEE]"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </button>

        {/* User Information */}
        <div className="hidden items-center gap-3 rounded-xl border border-[#D6DEDE] bg-[#F8FAFA] px-3 py-2 sm:flex">
          <div className="flex flex-row gap-5">
            <div className="text-xs font-bold text-[#0A090C]">
              {user?.name}
            </div>

            <div className="text-[10px] capitalize text-[#667577]">
              {user?.role}
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6DEDE] bg-white text-[#07393C] lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
}
