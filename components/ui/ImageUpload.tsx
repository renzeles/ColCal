"use client";

import { useRef, useState } from "react";
import { Upload, Link, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  placeholder?: string;
  previewClass?: string;
};

export function ImageUpload({
  value,
  onChange,
  bucket = "event-images",
  placeholder = "https://… o subí un archivo",
  previewClass = "h-32 w-full",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"url" | "file">("url");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo no puede superar 5 MB");
      return;
    }
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: false });
    setUploading(false);
    if (uploadError) { setError(uploadError.message); return; }
    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
    onChange(publicUrl);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {value && (
        <div className={`relative rounded-xl overflow-hidden ${previewClass}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex gap-1 p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800/50 text-xs">
        <TabBtn active={tab === "url"} onClick={() => setTab("url")}>
          <Link className="h-3.5 w-3.5" /> URL
        </TabBtn>
        <TabBtn active={tab === "file"} onClick={() => setTab("file")}>
          <Upload className="h-3.5 w-3.5" /> Subir archivo
        </TabBtn>
      </div>

      {tab === "url" ? (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-zinc-400"
        />
      ) : (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full h-9 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-600 text-xs text-zinc-500 hover:border-blue-400 hover:text-blue-500 dark:hover:border-blue-500 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            {uploading ? "Subiendo…" : "Elegir imagen"}
          </button>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-red-500">{error}</p>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-medium transition ${
        active
          ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-800 dark:text-white"
          : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}
