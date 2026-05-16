// Lightweight natural-language event parser (ES + EN)
// Extracts date, time, and title from free-form text.

const DAYS_ES: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miércoles: 3, miercoles: 3,
  jueves: 4, viernes: 5, sábado: 6, sabado: 6,
};
const DAYS_EN: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};
const DAYS = { ...DAYS_ES, ...DAYS_EN };

const MONTHS_ES: Record<string, number> = {
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
};

function nextDow(target: number, from = new Date()): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const diff = (target - d.getDay() + 7) % 7 || 7; // never today
  d.setDate(d.getDate() + diff);
  return d;
}

function startOfTomorrow(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type ParsedEvent = {
  title: string;
  start: Date | null;
  end: Date | null;
  ambiguity: string[];
};

export function parseQuickEvent(input: string): ParsedEvent {
  const lower = input.toLowerCase();
  const tokens = lower.split(/\s+/);
  const ambiguity: string[] = [];

  // ── Date ──
  let date: Date | null = null;

  if (/(^|\s)(hoy|today)(\s|$)/.test(lower)) date = startOfToday();
  else if (/(^|\s)(ma[ñn]ana|tomorrow)(\s|$)/.test(lower)) date = startOfTomorrow();
  else if (/(pasado\s*ma[ñn]ana|day\s+after\s+tomorrow)/.test(lower)) {
    const d = startOfTomorrow();
    d.setDate(d.getDate() + 1);
    date = d;
  } else {
    // Day-of-week
    for (const tok of tokens) {
      const clean = tok.replace(/[^a-záéíóúñ]/gi, "");
      if (DAYS[clean] !== undefined) {
        date = nextDow(DAYS[clean]);
        break;
      }
    }
    // DD/MM or DD-MM or DD de mes
    const ddmm = lower.match(/(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?/);
    if (!date && ddmm) {
      const day = +ddmm[1];
      const month = +ddmm[2] - 1;
      const year = ddmm[3] ? (+ddmm[3] < 100 ? 2000 + +ddmm[3] : +ddmm[3]) : new Date().getFullYear();
      const d = new Date(year, month, day);
      d.setHours(0, 0, 0, 0);
      if (d.getTime() >= startOfToday().getTime()) date = d;
      else { d.setFullYear(d.getFullYear() + 1); date = d; }
    }
    // "12 de enero", "12 enero"
    if (!date) {
      const m = lower.match(/(\d{1,2})\s*(?:de\s+)?([a-záéíóúñ]+)/);
      if (m && MONTHS_ES[m[2]] !== undefined) {
        const day = +m[1];
        const month = MONTHS_ES[m[2]];
        const today = startOfToday();
        let year = today.getFullYear();
        const d = new Date(year, month, day);
        if (d.getTime() < today.getTime()) { year++; d.setFullYear(year); }
        d.setHours(0, 0, 0, 0);
        date = d;
      }
    }
  }

  // ── Time ──
  let hour: number | null = null;
  let minute = 0;

  // "20:30", "20.30", "8:30pm"
  const tm = lower.match(/(\d{1,2})[:\.](\d{2})\s*(am|pm)?/);
  if (tm) {
    hour = +tm[1];
    minute = +tm[2];
    const ampm = tm[3];
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
  } else {
    // "8pm", "9am"
    const ampmMatch = lower.match(/(\d{1,2})\s*(am|pm)/);
    if (ampmMatch) {
      hour = +ampmMatch[1];
      if (ampmMatch[2] === "pm" && hour < 12) hour += 12;
      if (ampmMatch[2] === "am" && hour === 12) hour = 0;
    } else {
      // "a las 9", "at 9"
      const aLasMatch = lower.match(/(?:a\s+las|at)\s+(\d{1,2})(?:\s*hs?)?(?!\s*[\/\-])/);
      if (aLasMatch) {
        hour = +aLasMatch[1];
        // Assume PM if 1-11 and looks like evening event
        if (hour >= 1 && hour <= 11) hour += 12;
      } else {
        // "20hs", "21hs"
        const hsMatch = lower.match(/(\d{1,2})\s*hs/);
        if (hsMatch) hour = +hsMatch[1];
      }
    }
  }

  let start: Date | null = null;
  let end: Date | null = null;
  if (date) {
    start = new Date(date);
    if (hour !== null) {
      start.setHours(hour, minute, 0, 0);
    } else {
      start.setHours(20, 0, 0, 0); // default 8pm
      ambiguity.push("hora");
    }
    end = new Date(start);
    end.setHours(end.getHours() + 2); // default 2h duration
  } else {
    ambiguity.push("fecha");
  }

  // ── Title: strip out date/time tokens ──
  let title = input
    .replace(/(\d{1,2}[:\.]\d{2}\s*(am|pm)?)/gi, "")
    .replace(/(\d{1,2}\s*(am|pm))/gi, "")
    .replace(/\b(\d{1,2})\s*hs?\b/gi, "")
    .replace(/(a\s+las|at)\s+\d{1,2}\b/gi, "")
    .replace(/(\d{1,2}[\/\-\.]\d{1,2}([\/\-\.]\d{2,4})?)/g, "")
    .replace(/\b(hoy|today|mañana|manana|tomorrow|pasado\s+mañana|day\s+after\s+tomorrow)\b/gi, "")
    .replace(/\b(el|the)?\s*(domingo|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, "")
    .replace(/\b\d{1,2}\s*(?:de\s+)?(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (!title) title = input.trim();
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return { title, start, end, ambiguity };
}

// Format Date to YYYY-MM-DDTHH:mm for datetime-local input or query string
export function toLocalIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
