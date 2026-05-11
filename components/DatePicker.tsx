"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useT } from "@/lib/i18n";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_ES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const DAYS_ES = ["D", "L", "M", "M", "J", "V", "S"];

function fmtPretty(iso: string, lang: string) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(lang === "es" ? "es-AR" : "en-GB", {
    day: "numeric", month: "short",
  });
}

function toISO(year: number, month: number, day: number) {
  const m = String(month + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

type Props = {
  value: string;          // YYYY-MM-DD
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
};

export function DatePicker({ value, onChange, placeholder = "Date", className = "" }: Props) {
  const { lang } = useT();
  const [open, setOpen] = useState(false);

  const today = new Date();
  const initial = value ? new Date(value + "T00:00:00") : today;

  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const ref = useRef<HTMLDivElement>(null);

  // Sync view to value when it changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function shiftMonth(dir: 1 | -1) {
    setViewMonth((m) => {
      const next = m + dir;
      if (next < 0) { setViewYear((y) => y - 1); return 11; }
      if (next > 11) { setViewYear((y) => y + 1); return 0; }
      return next;
    });
  }

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const months = lang === "es" ? MONTHS_ES : MONTHS;
  const dayLabels = lang === "es" ? DAYS_ES : DAYS;

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const selectedISO = value;
  const isSelected = (day: number) => selectedISO === toISO(viewYear, viewMonth, day);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {/* Trigger pill */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ height: "3.25rem" }}
        className={`px-5 rounded-2xl border-2 flex items-center gap-2.5 transition-all cursor-pointer btn-modern ${
          value
            ? "bg-[#8b5a3c] border-[#8b5a3c] text-white"
            : "bg-stone-50 border-stone-200 text-stone-700 hover:border-[#8b5a3c] hover:bg-white"
        }`}
        aria-label="Pick a date"
      >
        <Calendar className={`h-[18px] w-[18px] ${value ? "text-white" : "text-[#8b5a3c]"}`} strokeWidth={2.5} />
        <span className="text-sm font-bold whitespace-nowrap tracking-tight">
          {value ? fmtPretty(value, lang) : placeholder}
        </span>
      </button>

      {/* Popover calendar */}
      {open && (
        <>
          {/* Mobile: full backdrop bottom sheet */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm sm:hidden"
            onClick={() => setOpen(false)}
          />
          <div
            className={`
              z-50 w-[320px] bg-white rounded-3xl shadow-2xl border border-stone-100 overflow-hidden
              fixed left-1/2 -translate-x-1/2 bottom-4 sm:bottom-auto sm:left-auto sm:translate-x-0
              sm:absolute sm:top-full sm:right-0 sm:mt-2
              animate-in fade-in slide-in-from-bottom-2 duration-200
            `}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <button
                onClick={() => shiftMonth(-1)}
                className="h-9 w-9 rounded-full bg-stone-100 hover:bg-[#8b5a3c] hover:text-white text-stone-600 flex items-center justify-center transition cursor-pointer"
                aria-label="Previous month"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={2.5} />
              </button>
              <p className="text-base font-extrabold text-stone-900 tracking-tight">
                {months[viewMonth]} {viewYear}
              </p>
              <button
                onClick={() => shiftMonth(1)}
                className="h-9 w-9 rounded-full bg-stone-100 hover:bg-[#8b5a3c] hover:text-white text-stone-600 flex items-center justify-center transition cursor-pointer"
                aria-label="Next month"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 px-3 pb-1">
              {dayLabels.map((d, i) => (
                <div key={i} className="h-8 flex items-center justify-center text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5 px-3 pb-4">
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const selected = isSelected(day);
                const todayCell = isToday(day);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      onChange(toISO(viewYear, viewMonth, day));
                      setOpen(false);
                    }}
                    className={`
                      relative h-10 rounded-xl text-sm font-semibold transition cursor-pointer
                      ${selected
                        ? "bg-[#8b5a3c] text-white shadow-md"
                        : todayCell
                        ? "bg-[#fbf6ee] text-[#8b5a3c] border border-[#8b5a3c]/40"
                        : "text-stone-700 hover:bg-stone-100"
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-4 pb-4 pt-1 border-t border-stone-100">
              <button
                onClick={() => {
                  const isoToday = toISO(today.getFullYear(), today.getMonth(), today.getDate());
                  onChange(isoToday);
                  setViewYear(today.getFullYear());
                  setViewMonth(today.getMonth());
                  setOpen(false);
                }}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-[#8b5a3c] hover:bg-[#fbf6ee] transition cursor-pointer uppercase tracking-wider"
              >
                Today
              </button>
              {value && (
                <button
                  onClick={() => { onChange(""); setOpen(false); }}
                  className="flex-1 py-2 rounded-xl text-xs font-bold text-stone-500 hover:bg-stone-100 transition cursor-pointer uppercase tracking-wider"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
