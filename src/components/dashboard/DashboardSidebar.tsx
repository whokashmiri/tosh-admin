import {
  BarChart3,
  Filter,
  Home,
  MapPinned,
  Users,
  LogOut,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

type SidebarItem = {
  label: string;
  icon: React.ReactNode;
  path: string;
};

const items: SidebarItem[] = [
  {
    label: "Home",
    icon: <Home size={18} />,
    path: "/dashboard",
  },
  {
    label: "Stats",
    icon: <BarChart3 size={18} />,
    path: "/dashboard/stats",
  },
  {
    label: "Live Location",
    icon: <MapPinned size={18} />,
    path: "/dashboard/live-location",
  },
  {
    label: "Driver Details",
    icon: <Users size={18} />,
    path: "/dashboard/drivers",
  },
   {
    label: "Orders",
    icon: <Users size={18} />,
    path: "/dashboard/orders",
  },
  {
    label: "Filter",
    icon: <Filter size={18} />,
    path: "/dashboard/filter",
  },
];

export function DashboardSidebar() {
  const navigate =
    useNavigate();

  const {
    logout,
  } = useAuth();

  const currentPath =
    window.location.pathname;

  async function handleLogout() {
    await logout();

    navigate(
      "/login",
      {
        replace: true,
      },
    );
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-[#D6DEDE] bg-[#07393C] text-white lg:flex">
      <div className="flex h-20 items-center border-b border-white/10 px-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg font-black">
          T
        </div>

        <div className="ml-3">
          <div className="text-lg font-black tracking-[0.18em]">
            TOSH
          </div>

          <div className="text-[10px] text-white/50">
            Operations Dashboard
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        {items.map((item) => {
          const active =
            currentPath === item.path;

          return (
            <button
              key={item.path}
              type="button"
              onClick={() =>
                navigate(
                  item.path,
                )
              }
              className={[
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition",

                active
                  ? "bg-white text-[#07393C] shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {item.icon}

              <span>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() =>
            void handleLogout()
          }
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} />

          Logout
        </button>
      </div>
    </aside>
  );
}