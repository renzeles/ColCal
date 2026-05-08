type Props = {
  src: string | null | undefined;
  name: string | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZE_CLASSES: Record<NonNullable<Props["size"]>, string> = {
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

export function Avatar({ src, name, size = "md", className = "" }: Props) {
  const cls = `rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-violet-400 to-blue-500 text-white font-semibold shrink-0 ${SIZE_CLASSES[size]} ${className}`;
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name ?? ""} className={cls} />
    );
  }
  return <div className={cls}>{initials(name)}</div>;
}
