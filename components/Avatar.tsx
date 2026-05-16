type Props = {
  src: string | null | undefined;
  name: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
  xs: "h-5 w-5 text-[10px]",
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-24 w-24 text-2xl",
};

function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Bakery-toned palette for fallback avatars (seeded by name)
const PALETTES = [
  "from-[#8b5a3c] to-[#6b4423]",   // caramel → coffee
  "from-[#9a3c2b] to-[#7a2e1f]",   // cherry → dark cherry
  "from-[#ca8a04] to-[#a16207]",   // mustard → amber
  "from-[#8a9b6e] to-[#6b7a4a]",   // sage
  "from-[#3b5b73] to-[#2a3a52]",   // dusk blue
  "from-[#b08968] to-[#7f5539]",   // beige → warm brown
];
function paletteFor(name: string | null | undefined) {
  if (!name) return PALETTES[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTES[h % PALETTES.length];
}

export function Avatar({ src, name, size = "md", className = "" }: Props) {
  const cls = `rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br ${paletteFor(name)} text-white font-semibold shrink-0 ${SIZE_CLASSES[size]} ${className}`;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name ?? ""} className={cls} />
    );
  }
  return <div className={cls}>{initials(name)}</div>;
}
