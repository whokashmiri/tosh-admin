import {
  Bell,
  Menu,
} from "lucide-react";

import {
  useAuth,
} from "../../context/AuthContext";

export function DashboardHeader() {
  const {
    user,
  } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#D6DEDE] bg-white/95 px-5 backdrop-blur lg:px-8">
      <div>
        <p className="text-xs font-semibold text-[#667577]">
          Welcome back
        </p>

        <h1 className="mt-1 text-xl font-black text-[#07393C]">
          {user?.name ?? "User"}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6DEDE] bg-white text-[#07393C] transition hover:bg-[#F0EDEE]"
        >
          <Bell size={18} />
        </button>

        <div className="hidden items-center gap-3 rounded-xl border border-[#D6DEDE] bg-[#F8FAFA] px-3 py-2 sm:flex">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#07393C] text-sm font-black text-white">
            {user?.name
              ?.trim()
              .charAt(0)
              .toUpperCase() ?? "U"}
          </div>

          <div>
            <div className="text-xs font-bold text-[#0A090C]">
              {user?.name}
            </div>

            <div className="text-[10px] capitalize text-[#667577]">
              {user?.role}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D6DEDE] bg-white text-[#07393C] lg:hidden"
        >
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
}