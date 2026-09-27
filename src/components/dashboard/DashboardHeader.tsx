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
    <header className="sticky top-0 z-30 flex h-15 items-center justify-between border-b border-[#D6DEDE] bg-white/95 px-5 backdrop-blur lg:px-8">
      <div className="flex flex-row gap-3">
         <h1 className=" text-xl font-black text-[#07393C]">
          {user?.name ?? "User"} 
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#D6DEDE] bg-white text-[#07393C] transition hover:bg-[#F0EDEE]"
        >
          <Bell size={16} />
        </button>

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