import {
  useEffect,
  useState,
} from "react";

import {
  MapPin,
} from "lucide-react";

import {
  getDriverShiftLocationHistory,
} from "../../api/locationApi";

import type {
  LocationHistoryPoint,
} from "../../types/location";

export function DriverLocationHistory({
  driverId,
  shiftId,
}: {
  driverId: string;
  shiftId: string;
}) {
  const [
    locations,
    setLocations,
  ] =
    useState<LocationHistoryPoint[]>(
      [],
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    const load =
      async () => {
        try {
          setLoading(
            true,
          );

          setError(
            null,
          );

          const response =
            await getDriverShiftLocationHistory(
              driverId,
              shiftId,
            );

          setLocations(
            response.locations ??
              [],
          );
        } catch (
          error
        ) {
          setError(
            error instanceof Error
              ? error.message
              : "Unable to load location history",
          );
        } finally {
          setLoading(
            false,
          );
        }
      };

    void load();
  }, [
    driverId,
    shiftId,
  ]);

  if (loading) {
    return (
      <div className="h-32 animate-pulse rounded-2xl bg-[#F0EDEE]" />
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#D6DEDE] bg-white">
      <div className="border-b border-[#EDF0F0] p-4">
        <h3 className="text-sm font-black text-[#07393C]">
          Shift Location History
        </h3>

        <p className="mt-1 text-xs text-[#667577]">
          {locations.length} recorded points
        </p>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {locations.map(
          (
            location,
            index,
          ) => (
            <div
              key={
                location._id ??
                `${location.recordedAt}-${index}`
              }
              className="flex gap-3 border-b border-[#EDF0F0] p-4 last:border-b-0"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF4F4] text-[#07393C]">
                <MapPin
                  size={14}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#07393C]">
                  {Number(
                    location.latitude,
                  ).toFixed(
                    5,
                  )}
                  ,{" "}
                  {Number(
                    location.longitude,
                  ).toFixed(
                    5,
                  )}
                </div>

                <div className="mt-1 text-[10px] text-[#667577]">
                  {new Date(
                    location.recordedAt,
                  ).toLocaleString()}
                </div>
              </div>
            </div>
          ),
        )}

        {locations.length ===
          0 && (
          <div className="p-8 text-center text-xs text-[#667577]">
            No location history for this shift.
          </div>
        )}
      </div>
    </div>
  );
}