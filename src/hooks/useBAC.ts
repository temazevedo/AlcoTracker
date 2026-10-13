import { useState, useEffect, useCallback } from "react";
import { getTodaysEntries, getProfile } from "@/db/repository";
import { calculateBAC } from "@/bac/calculate";
import { BACPoint, PeakBAC, BACSeriesResult, Profile } from "@/bac/types";
import { DrinkEntryRow, ProfileSettingsRow } from "@/db/schema";

export interface BACData {
  currentBAC: number;
  peakBAC: PeakBAC | null;
  timeToZeroMinutes: number | null;
  series: BACPoint[];
  loading: boolean;
  error: string | null;
}

function mapProfileSettingsToProfile(settings: ProfileSettingsRow): Profile {
  return {
    weightKg: settings.weight_kg,
    sex: settings.sex,
    eliminationRate: settings.elimination_rate,
  };
}

export function useBAC(): BACData {
  const [data, setData] = useState<BACData>({
    currentBAC: 0,
    peakBAC: null,
    timeToZeroMinutes: null,
    series: [],
    loading: true,
    error: null,
  });

  const refresh = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch today's entries and profile in parallel
      const [entriesResult, profileResult] = await Promise.all([
        getTodaysEntries(),
        getProfile(),
      ]);

      if (!entriesResult.success) {
        throw new Error(entriesResult.error);
      }
      if (!profileResult.success) {
        throw new Error(profileResult.error);
      }

      const entries: DrinkEntryRow[] = entriesResult.data;
      const profileSettings: ProfileSettingsRow = profileResult.data;
      const profile: Profile = mapProfileSettingsToProfile(profileSettings);

      // Convert DrinkEntryRow to DrinkEntry for BAC calculation
      const drinkEntries = entries.map((e) => ({
        grams: e.grams,
        consumedAt: new Date(e.consumed_at),
      }));

      // Calculate BAC
      const result: BACSeriesResult = calculateBAC(drinkEntries, profile);

      setData({
        currentBAC: result.currentBAC,
        peakBAC: result.peakBAC,
        timeToZeroMinutes: result.timeToZeroMinutes,
        series: result.series,
        loading: false,
        error: null,
      });
    } catch (error) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: String(error),
      }));
    }
  }, []);

  useEffect(() => {
    refresh();

    // Update every 60 seconds
    const interval = setInterval(refresh, 60 * 1000);
    return () => clearInterval(interval);
  }, [refresh]);

  return data;
}