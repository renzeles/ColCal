import type { EventColor } from "@/lib/types";

export const EVENT_COLORS: EventColor[] = [
  "zinc",
  "red",
  "orange",
  "amber",
  "emerald",
  "sky",
  "violet",
  "pink",
];

export const EVENT_COLOR_LABEL: Record<EventColor, string> = {
  zinc: "Neutro",
  red: "Rojo",
  orange: "Naranja",
  amber: "Ámbar",
  emerald: "Verde",
  sky: "Cielo",
  violet: "Violeta",
  pink: "Rosa",
};

// Static mapping so Tailwind can statically detect classes
export const EVENT_COLOR_STYLES: Record<
  EventColor,
  { card: string; border: string; chip: string; ring: string; dot: string }
> = {
  zinc: {
    card: "bg-white",
    border: "border-zinc-200",
    chip: "bg-zinc-100 text-zinc-700",
    ring: "ring-zinc-400",
    dot: "bg-zinc-300",
  },
  red: {
    card: "bg-red-50",
    border: "border-red-200",
    chip: "bg-red-100 text-red-700",
    ring: "ring-red-400",
    dot: "bg-red-400",
  },
  orange: {
    card: "bg-orange-50",
    border: "border-orange-200",
    chip: "bg-orange-100 text-orange-700",
    ring: "ring-orange-400",
    dot: "bg-orange-400",
  },
  amber: {
    card: "bg-amber-50",
    border: "border-amber-200",
    chip: "bg-amber-100 text-amber-700",
    ring: "ring-amber-400",
    dot: "bg-amber-400",
  },
  emerald: {
    card: "bg-emerald-50",
    border: "border-emerald-200",
    chip: "bg-emerald-100 text-emerald-700",
    ring: "ring-emerald-400",
    dot: "bg-emerald-400",
  },
  sky: {
    card: "bg-sky-50",
    border: "border-sky-200",
    chip: "bg-sky-100 text-sky-700",
    ring: "ring-sky-400",
    dot: "bg-sky-400",
  },
  violet: {
    card: "bg-violet-50",
    border: "border-violet-200",
    chip: "bg-violet-100 text-violet-700",
    ring: "ring-violet-400",
    dot: "bg-violet-400",
  },
  pink: {
    card: "bg-pink-50",
    border: "border-pink-200",
    chip: "bg-pink-100 text-pink-700",
    ring: "ring-pink-400",
    dot: "bg-pink-400",
  },
};

export function getEventColorStyles(color: EventColor | null | undefined) {
  return EVENT_COLOR_STYLES[color ?? "zinc"];
}
