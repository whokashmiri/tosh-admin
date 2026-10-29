import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Image as ImageIcon, RefreshCw, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getSupervisorOrderCalendar, getSupervisorOrders } from "../../api/orderApi";

type Filter = "today" | "week" | "month" | "custom";
type HistoryOrder = {
  _id: string;
  orderId?: string | number | null;
  status: string;
  createdAt?: string | Date | null;
  pickupTime?: string | Date | null;
  deliveryTime?: string | Date | null;
  cancelledAt?: string | Date | null;
  pickupPhoto?: { url?: string | null } | null;
  deliveryPhoto?: { url?: string | null } | null;
  cancellationPhotos?: Array<{ url: string }> | null;
  cancellationReason?: string | null;
  cancellationNotes?: string | null;
  notes?: string | null;
};
type HistoryResponse = { orders?: HistoryOrder[]; pagination?: { total?: number; totalPages?: number } };
type CalendarResponse = { days?: Record<string, number> };

export interface DriverOrderHistoryProps {
  driverId: string;
  pageSize?: number;
  className?: string;
  /** Optional refresh trigger; increment after an external order change. */
  refreshKey?: number;
  /** Swap API functions if a different parent screen needs another source. */
  fetchOrders?: (params: { driverId: string; page: number; limit: number; status: "all"; from: string; to: string }) => Promise<HistoryResponse>;
  fetchCalendar?: (driverId: string, month: string) => Promise<CalendarResponse>;
}

function dateKey(date: Date): string {
  // en-CA usually gives ISO, but build parts to avoid locale-dependent formatting.
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Riyadh", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (name: string) => parts.find((p) => p.type === name)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
function parseDay(value: string) { return new Date(`${value}T12:00:00Z`); }
function shiftDay(value: string, count: number) {
  const date = parseDay(value);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
function rangeFor(filter: Exclude<Filter, "custom">, today: string) {
  if (filter === "today") return { from: today, to: today };
  if (filter === "month") return { from: `${today.slice(0, 7)}-01`, to: today };
  // Sunday through today in the Saudi working week.
  return { from: shiftDay(today, -parseDay(today).getUTCDay()), to: today };
}
function dateLabel(value: string) {
  return parseDay(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}
function dateTime(value?: string | Date | null) {
  if (!value) return "-";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleString(undefined, {
    timeZone: "Asia/Riyadh", year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit",
  });
}
function errorText(error: unknown) {
  if (error && typeof error === "object" && "response" in error) {
    const typed = error as { response?: { data?: { message?: string } } };
    if (typed.response?.data?.message) return typed.response.data.message;
  }
  return error instanceof Error ? error.message : "Unable to load order history";
}

export function DriverOrderHistory({
  driverId, pageSize = 10, className = "", refreshKey = 0,
  fetchOrders = getSupervisorOrders,
  fetchCalendar = getSupervisorOrderCalendar,
}: DriverOrderHistoryProps) {
  const { t } = useTranslation();
  const [today, setToday] = useState(() => dateKey(new Date()));
  const [filter, setFilter] = useState<Filter>("today");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [anchor, setAnchor] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState(today.slice(0, 7));
  const [calendarCounts, setCalendarCounts] = useState<Record<string, number>>({});
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [orders, setOrders] = useState<HistoryOrder[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const orderRequest = useRef(0);
  const calendarRequest = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => setToday(dateKey(new Date())), 60000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (filter !== "custom") {
      const range = rangeFor(filter, today);
      setFrom(range.from);
      setTo(range.to);
    }
  }, [today, filter]);
  useEffect(() => {
    setFilter("today");
    setFrom(today); setTo(today); setAnchor(null); setPage(1);
    setVisibleMonth(today.slice(0, 7)); setOrders([]); setTotal(0);
  }, [driverId]); // Reset when changing the driver.

  const fetchHistory = useCallback(async () => {
    if (!driverId) return;
    const request = ++orderRequest.current;
    setLoading(true); setError(null);
    try {
      const response = await fetchOrders({ driverId, page, limit: pageSize, status: "all", from, to });
      if (request !== orderRequest.current) return;
      setOrders(response.orders ?? []);
      setTotal(response.pagination?.total ?? 0);
      setTotalPages(Math.max(1, response.pagination?.totalPages ?? 1));
    } catch (err) {
      if (request !== orderRequest.current) return;
      setOrders([]); setTotal(0); setTotalPages(1); setError(errorText(err));
    } finally {
      if (request === orderRequest.current) setLoading(false);
    }
  }, [driverId, fetchOrders, from, to, page, pageSize]);

  useEffect(() => {
    void fetchHistory();
    return () => { orderRequest.current++; };
  }, [fetchHistory, retryCount, refreshKey]);

  useEffect(() => {
    if (filter !== "custom" || !driverId) return;
    const request = ++calendarRequest.current;
    setCalendarLoading(true);
    void fetchCalendar(driverId, visibleMonth).then((response) => {
      if (request === calendarRequest.current) setCalendarCounts(response.days ?? {});
    }).catch((err: unknown) => {
      if (request === calendarRequest.current) {
        setCalendarCounts({});
        console.warn("[DriverOrderHistory] Calendar unavailable", errorText(err));
      }
    }).finally(() => {
      if (request === calendarRequest.current) setCalendarLoading(false);
    });
    return () => { calendarRequest.current++; };
  }, [driverId, filter, visibleMonth, fetchCalendar, refreshKey]);

  const currentMonth = today.slice(0, 7);
  const monthDays = useMemo(() => {
    const first = parseDay(`${visibleMonth}-01`);
    const offset = first.getUTCDay();
    const numberOfDays = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
    const cells: (string | null)[] = Array.from({ length: offset }, () => null);
    for (let n = 1; n <= numberOfDays; n++) cells.push(`${visibleMonth}-${String(n).padStart(2, "0")}`);
    while (cells.length % 7) cells.push(null);
    return cells;
  }, [visibleMonth]);
  const monthTitle = useMemo(() => parseDay(`${visibleMonth}-01`).toLocaleDateString(undefined, {
    month: "long", year: "numeric", timeZone: "UTC",
  }), [visibleMonth]);

  const chooseFilter = (next: Filter) => {
    setFilter(next); setPage(1); setAnchor(null);
    if (next === "custom") {
      setVisibleMonth(from.slice(0, 7));
    } else {
      const range = rangeFor(next, today);
      setFrom(range.from); setTo(range.to);
    }
  };
  const chooseDay = (day: string) => {
    if (day > today) return;
    if (!anchor || anchor === day) {
      setFrom(day); setTo(day);
      setAnchor(anchor === day ? null : day);
    } else {
      setFrom(day < anchor ? day : anchor);
      setTo(day > anchor ? day : anchor);
      setAnchor(null);
    }
    setPage(1);
  };
  const moveMonth = (amount: number) => {
    const d = parseDay(`${visibleMonth}-01`);
    d.setUTCMonth(d.getUTCMonth() + amount);
    const next = d.toISOString().slice(0, 7);
    if (next <= currentMonth) setVisibleMonth(next);
  };

  return (
    <section className={`rounded-xl border border-[#D6DEDE] bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={19} className="text-[#07393C]" />
          <h3 className="text-sm font-black text-[#07393C]">{t("orders.history", "Order History")}</h3>
          <span className="rounded-full bg-[#F0EDEE] px-2 py-1 text-xs font-bold text-[#2C666E]">{total}</span>
        </div>
        <button type="button" onClick={() => setRetryCount((c) => c + 1)} disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg border border-[#CAD4D4] px-3 py-2 text-xs font-bold text-[#07393C] disabled:opacity-50">
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> {t("common.refresh", "Refresh")}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Date range">
        {(["today", "week", "month", "custom"] as const).map((option) => (
          <button key={option} type="button" onClick={() => chooseFilter(option)} aria-pressed={filter === option}
            className={`rounded-lg border px-4 py-2 text-xs font-bold ${filter === option
              ? "border-[#07393C] bg-[#07393C] text-white"
              : "border-[#CAD4D4] bg-white text-[#07393C] hover:bg-[#F0EDEE]"}`}>
            {t(`stats.${option}`, option[0].toUpperCase() + option.slice(1))}
          </button>
        ))}
      </div>

      {filter === "custom" && (
        <div className="mt-4 max-w-md rounded-xl border border-[#D6DEDE] p-3">
          <p className="mb-3 text-xs text-[#667577]">{t("orders.driverHistoryCalendarHelp", "Select a day, then select another day to choose a range.")}</p>
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="rounded-lg p-2 hover:bg-[#F0EDEE]"><ChevronLeft size={17}/></button>
            <strong className="text-sm text-[#07393C]">{monthTitle}</strong>
            <button type="button" onClick={() => moveMonth(1)} disabled={visibleMonth >= currentMonth} aria-label="Next month"
              className="rounded-lg p-2 hover:bg-[#F0EDEE] disabled:opacity-30"><ChevronRight size={17}/></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const).map((d) => (
              <span key={d} className="py-1 text-[10px] font-bold text-[#667577]">{d}</span>
            ))}
            {monthDays.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} />;
              const selected = day >= from && day <= to;
              const edge = day === from || day === to;
              const disabled = day > today;
              const count = calendarCounts[day] ?? 0;
              return (
                <button key={day} type="button" disabled={disabled} onClick={() => chooseDay(day)}
                  aria-label={`${dateLabel(day)}, ${count} orders`} aria-pressed={selected}
                  className={`flex min-h-12 flex-col items-center justify-center rounded-lg px-1 py-1 text-xs ${disabled ? "cursor-not-allowed opacity-30" : "hover:bg-[#E5F2F2]"} ${selected ? "bg-[#DDE9EA]" : ""} ${edge ? "!bg-[#07393C] !text-white" : "text-[#07393C]"}`}>
                  <span className="font-bold">{Number(day.slice(-2))}</span>
                  <span className={`mt-1 min-w-5 rounded px-1 text-[9px] ${edge ? "bg-white/20 text-white" : count ? "bg-[#E5F2F2] text-[#07393C]" : "text-[#667577]"}`}>{calendarLoading ? "·" : count}</span>
                </button>
              );
            })}
          </div>
          {anchor && <p className="mt-2 text-xs text-amber-700">{t("orders.selectEndDate", "Select end date")}</p>}
        </div>
      )}

      <div className="mt-4 rounded-lg bg-[#F0EDEE] px-3 py-2 text-xs text-[#07393C]">
        <span className="font-semibold text-[#667577]">{from === to ? t("orders.selectedDay", "Selected Day") : t("orders.selectedRange", "Selected Range")}: </span>
        <strong>{dateLabel(from)}{from !== to ? ` - ${dateLabel(to)}` : ""}</strong>
      </div>

      {loading ? <div className="py-10 text-center text-sm text-[#667577]">{t("orders.loadingHistory", "Loading order history...")}</div>
        : error ? <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">{error} <button type="button" onClick={() => setRetryCount((c) => c + 1)} className="ms-2 font-bold underline">{t("common.retry", "Retry")}</button></div>
        : orders.length === 0 ? <div className="py-10 text-center text-sm font-semibold text-[#667577]">{t("orders.empty", "No orders found")}</div>
        : <div className="mt-4 space-y-2">{orders.map((order) => <OrderCard key={order._id} order={order} onPreview={setPreview} />)}</div>}

      {!loading && !error && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#EDF0F0] pt-4">
          <button type="button" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg bg-[#07393C] px-4 py-2 text-xs font-bold text-white disabled:opacity-35">{t("common.previous", "Previous")}</button>
          <span className="text-xs font-bold text-[#07393C]">{page} / {totalPages}</span>
          <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="rounded-lg bg-[#07393C] px-4 py-2 text-xs font-bold text-white disabled:opacity-35">{t("common.next", "Next")}</button>
        </div>
      )}

      {preview && (
        <div role="dialog" aria-modal="true" aria-label="Order photo" onClick={() => setPreview(null)}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/90 p-6">
          <button type="button" onClick={() => setPreview(null)} aria-label="Close preview" className="absolute end-6 top-6 rounded-full bg-white/15 p-2 text-white"><X size={22}/></button>
          <img src={preview} alt="Order evidence" onClick={(event) => event.stopPropagation()} className="max-h-[85vh] max-w-full object-contain" />
        </div>
      )}
    </section>
  );
}

function OrderCard({ order, onPreview }: { order: HistoryOrder; onPreview: (url: string) => void }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const delivered = order.status === "delivered";
  const cancelled = order.status === "cancelled";
  const badge = delivered ? "bg-green-50 text-green-700" : cancelled ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700";
  const label = delivered ? t("orders.delivered", "Delivered") : cancelled ? t("orders.cancelled", "Cancelled") : t("orders.active", "Active");
  return (
    <article className="overflow-hidden rounded-xl border border-[#D6DEDE] bg-[#FCFDFD]">
      <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}
        className="flex w-full items-center gap-3 p-3 text-start hover:bg-[#F8FAFA]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-black text-[#07393C]">{order.orderId ? `Order #${order.orderId}` : t("orders.order", "Order")}</p>
          <p className="mt-1 text-[10px] text-[#667577]">{dateTime(order.createdAt)} | {dateTime(order.deliveryTime ?? order.pickupTime)}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${badge}`}>{label}</span>
        {expanded ? <ChevronUp size={16} className="text-[#07393C]"/> : <ChevronDown size={16} className="text-[#07393C]"/>}
      </button>
      {expanded && (
        <div className="border-t border-[#D6DEDE] p-3">
          <div className="grid grid-cols-2 gap-3">
            <Evidence label={t("orders.pickup", "Pickup")} url={order.pickupPhoto?.url} onPreview={onPreview}/>
            {delivered && <Evidence label={t("orders.deliveryPhoto", "Delivery")} url={order.deliveryPhoto?.url} onPreview={onPreview}/>}
          </div>
          {cancelled && !!order.cancellationPhotos?.length && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-bold text-[#667577]">{t("orders.cancelPhotos", "Cancellation Evidence")}</p>
              <div className="flex flex-wrap gap-2">{order.cancellationPhotos.map((photo, index) => (
                <button type="button" key={`${photo.url}-${index}`} onClick={() => onPreview(photo.url)} aria-label="View cancellation evidence">
                  <img src={photo.url} alt="Cancellation evidence" className="h-20 w-20 rounded-lg object-cover" loading="lazy"/>
                </button>
              ))}</div>
            </div>
          )}
          <div className="mt-3 divide-y divide-[#EDF0F0]">
            <Detail label={t("orders.pickupTime", "Pickup")} value={dateTime(order.pickupTime)}/>
            {delivered && <Detail label={t("orders.deliveryTime", "Delivery")} value={dateTime(order.deliveryTime)}/>} 
            {cancelled && <Detail label={t("orders.cancelledAt", "Cancelled")} value={dateTime(order.cancelledAt)}/>} 
            {cancelled && !!order.cancellationReason && <Detail label={t("orders.cancelReason", "Reason")} value={order.cancellationReason.replace(/_/g, " ")}/>} 
          </div>
          {cancelled && !!order.cancellationNotes && <p className="mt-3 rounded-lg bg-[#F0EDEE] p-3 text-xs text-[#07393C]">{order.cancellationNotes}</p>}
          {!!order.notes && <p className="mt-3 rounded-lg bg-[#F0EDEE] p-3 text-xs text-[#07393C]">{order.notes}</p>}
        </div>
      )}
    </article>
  );
}
function Evidence({ label, url, onPreview }: { label: string; url?: string | null; onPreview: (url: string) => void }) {
  return <div><p className="mb-2 text-xs font-bold text-[#667577]">{label}</p>{url
    ? <button type="button" onClick={() => onPreview(url)} className="relative block w-full overflow-hidden rounded-lg border border-[#CAD4D4]">
        <img src={url} alt={label} loading="lazy" className="h-32 w-full object-cover"/><span className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white">View</span>
      </button>
    : <div className="flex h-32 items-center justify-center rounded-lg bg-[#F0EDEE] text-[#667577]"><ImageIcon size={18}/></div>}</div>;
}
function Detail({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 py-2 text-xs"><span className="text-[#667577]">{label}</span><span className="text-end font-bold text-[#07393C]">{value}</span></div>;
}

export default DriverOrderHistory;
