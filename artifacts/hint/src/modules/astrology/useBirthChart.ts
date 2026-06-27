import { useCallback, useEffect, useMemo, useState } from "react";
import { apiUrl } from "../../lib/api";
import type { BirthProfileInput, NormalizedBirthChart } from "./types";

type ProfileLike = {
  name: string;
  birthDate: string;
  birthTime?: string | null;
  birthPlace?: string | null;
} | null;

type CachedChart = {
  key: string;
  chart: NormalizedBirthChart;
};

function storageKey(anonId: string) {
  return `hint_birth_chart_v1_${anonId}`;
}

export function profileToBirthInput(anonId: string, profile: ProfileLike): BirthProfileInput | null {
  if (!profile?.birthDate) return null;
  return {
    userId: anonId,
    name: profile.name,
    birthday: profile.birthDate,
    birthTime: profile.birthTime ?? undefined,
    birthCity: profile.birthPlace ?? undefined,
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : undefined,
  };
}

export function birthChartCacheKey(input: BirthProfileInput) {
  return JSON.stringify({
    userId: input.userId ?? "",
    name: input.name ?? "",
    birthday: input.birthday,
    birthTime: input.birthTime ?? "",
    birthCity: input.birthCity ?? "",
    birthCountry: input.birthCountry ?? "",
    latitude: input.latitude ?? "",
    longitude: input.longitude ?? "",
    timezone: input.timezone ?? "",
  });
}

function readCachedChart(anonId: string, key: string) {
  try {
    const raw = window.localStorage.getItem(storageKey(anonId));
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedChart;
    return cached.key === key ? cached.chart : null;
  } catch {
    return null;
  }
}

function writeCachedChart(anonId: string, key: string, chart: NormalizedBirthChart) {
  try {
    window.localStorage.setItem(storageKey(anonId), JSON.stringify({ key, chart }));
  } catch {
    // Local cache is best-effort only.
  }
}

async function requestChart(input: BirthProfileInput, recalculate = false) {
  const response = await fetch(apiUrl(recalculate ? "/api/astrology/recalculate-chart" : "/api/astrology/birth-chart"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Chart calculation is unavailable right now.");
  }

  return response.json() as Promise<NormalizedBirthChart>;
}

export function useBirthChart(anonId: string, profile: ProfileLike) {
  const birthInput = useMemo(() => profileToBirthInput(anonId, profile), [anonId, profile?.birthDate, profile?.birthPlace, profile?.birthTime, profile?.name]);
  const key = useMemo(() => (birthInput ? birthChartCacheKey(birthInput) : ""), [birthInput]);
  const [chart, setChart] = useState<NormalizedBirthChart | null>(() => (birthInput && key ? readCachedChart(anonId, key) : null));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function loadChart() {
      if (!birthInput || !key) {
        setChart(null);
        setError(null);
        return;
      }

      const cached = readCachedChart(anonId, key);
      if (cached) {
        setChart(cached);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const next = await requestChart(birthInput);
        if (!alive) return;
        setChart(next);
        writeCachedChart(anonId, key, next);
      } catch (chartError) {
        if (!alive) return;
        setError(chartError instanceof Error ? chartError.message : "Chart calculation is unavailable right now.");
      } finally {
        if (alive) setIsLoading(false);
      }
    }

    void loadChart();
    return () => {
      alive = false;
    };
  }, [anonId, birthInput, key]);

  const recalculate = useCallback(async () => {
    if (!birthInput || !key) return null;
    setIsLoading(true);
    setError(null);
    try {
      const next = await requestChart(birthInput, true);
      setChart(next);
      writeCachedChart(anonId, key, next);
      return next;
    } catch (chartError) {
      setError(chartError instanceof Error ? chartError.message : "Chart calculation is unavailable right now.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [anonId, birthInput, key]);

  return {
    birthInput,
    chart,
    isLoading,
    error,
    recalculate,
  };
}
