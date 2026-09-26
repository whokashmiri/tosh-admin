type StatCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon: React.ReactNode;
};

export function StatCard({
  label,
  value,
  helper,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[#D6DEDE] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-[#667577]">
            {label}
          </p>

          <p className="mt-2 text-3xl font-black tracking-tight text-[#07393C]">
            {value}
          </p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF4F4] text-[#07393C]">
          {icon}
        </div>
      </div>

      {helper && (
        <p className="mt-3 text-[11px] text-[#8A989A]">
          {helper}
        </p>
      )}
    </div>
  );
}