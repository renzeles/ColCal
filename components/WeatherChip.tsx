"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudRain, Snowflake, Sun, Wind } from "lucide-react";

// Open-Meteo weather codes → label + icon
function weatherInfo(code: number) {
  if ([0].includes(code)) return { icon: Sun, label: "Clear", color: "text-amber-500" };
  if ([1, 2].includes(code)) return { icon: Sun, label: "Mostly clear", color: "text-amber-400" };
  if ([3].includes(code)) return { icon: Cloud, label: "Cloudy", color: "text-stone-400" };
  if ([45, 48].includes(code)) return { icon: Cloud, label: "Foggy", color: "text-stone-500" };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { icon: CloudRain, label: "Rain", color: "text-sky-500" };
  if ([71, 73, 75, 77, 85, 86].includes(code))
    return { icon: Snowflake, label: "Snow", color: "text-sky-300" };
  if ([95, 96, 99].includes(code)) return { icon: Wind, label: "Storm", color: "text-violet-500" };
  return { icon: Cloud, label: "—", color: "text-stone-400" };
}

type Props = {
  city: string;
  country?: string;
  iso: string; // event start ISO date+time
};

type Forecast = { code: number; tMin: number; tMax: number };

export function WeatherChip({ city, country, iso }: Props) {
  const [data, setData] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const eventDate = new Date(iso);
    const daysAway = Math.floor((eventDate.getTime() - Date.now()) / 86_400_000);
    // Open-Meteo gives 16-day forecast — outside that we skip
    if (daysAway < 0 || daysAway > 15) { setLoading(false); return; }

    (async () => {
      try {
        // Geocode city → lat/lng (free Open-Meteo geocoding)
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1${country ? `&country=${encodeURIComponent(country)}` : ""}`;
        const geo = await (await fetch(geoUrl)).json();
        if (cancelled) return;
        const loc = geo?.results?.[0];
        if (!loc) { setLoading(false); return; }
        const dateStr = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}-${String(eventDate.getDate()).padStart(2, "0")}`;
        const wUrl = `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
        const w = await (await fetch(wUrl)).json();
        if (cancelled) return;
        const code = w?.daily?.weather_code?.[0];
        const tMin = w?.daily?.temperature_2m_min?.[0];
        const tMax = w?.daily?.temperature_2m_max?.[0];
        if (typeof code === "number") setData({ code, tMin, tMax });
      } catch { /* silent */ }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [city, country, iso]);

  if (loading || !data) return null;
  const w = weatherInfo(data.code);
  const Icon = w.icon;

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-stone-50 border border-stone-200">
      <Icon className={`h-4 w-4 ${w.color}`} strokeWidth={2.5} />
      <span className="text-xs font-bold text-stone-700">{w.label}</span>
      <span className="text-xs text-stone-500 tabular-nums">
        {Math.round(data.tMin)}° / {Math.round(data.tMax)}°
      </span>
    </div>
  );
}
