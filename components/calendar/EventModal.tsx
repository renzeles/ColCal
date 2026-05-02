"use client";

import { useEffect, useState } from "react";
import { X, Calendar, Clock, MapPin, FileText, Image as ImageIcon, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { CalendarEvent } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (e: CalendarEvent) => void;
  onUpdated?: (e: CalendarEvent) => void;
  onDeleted?: (id: string) => void;
  userId: string;
  event?: CalendarEvent | null;
};

function defaultDateTime(offsetHours = 1) {
  const d = new Date();
  d.setHours(d.getHours() + offsetHours, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventModal({
  open,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
  userId,
  event,
}: Props) {
  const isEdit = !!event;
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [startAt, setStartAt] = useState(defaultDateTime(1));
  const [endAt, setEndAt] = useState(defaultDateTime(2));
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setConfirmDelete(false);
    setError(null);
    if (event) {
      setTitle(event.title);
      setDescription(event.description ?? "");
      setImageUrl(event.image_url ?? "");
      setStartAt(toLocalInput(event.start_at));
      setEndAt(event.end_at ? toLocalInput(event.end_at) : defaultDateTime(2));
      setLocation(event.location ?? "");
    } else {
      setTitle("");
      setDescription("");
      setImageUrl("");
      setStartAt(defaultDateTime(1));
      setEndAt(defaultDateTime(2));
      setLocation("");
    }
  }, [open, event]);

  async function handleSave() {
    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = {
      title: title.trim(),
      description: description.trim() || null,
      image_url: imageUrl.trim() || null,
      start_at: new Date(startAt).toISOString(),
      end_at: endAt ? new Date(endAt).toISOString() : null,
      location: location.trim() || null,
    };

    if (isEdit && event) {
      const { data, error } = await supabase
        .from("events")
        .update(payload)
        .eq("id", event.id)
        .select()
        .single();
      setSaving(false);
      if (error) { setError(error.message); return; }
      onUpdated?.(data as CalendarEvent);
    } else {
      const { data, error } = await supabase
        .from("events")
        .insert({ creator_id: userId, ...payload })
        .select()
        .single();
      setSaving(false);
      if (error) { setError(error.message); return; }
      onCreated(data as CalendarEvent);
    }
    onClose();
  }

  async function handleDelete() {
    if (!event) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", event.id);
    setDeleting(false);
    if (error) { setError(error.message); return; }
    onDeleted?.(event.id);
    onClose();
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-zinc-900 shadow-2xl border border-black/5 dark:border-white/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 flex items-center justify-between border-b border-black/5 dark:border-white/10">
          <h2 className="text-base font-semibold tracking-tight">
            {isEdit ? "Editar evento" : "Nuevo evento"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título del evento"
            className="w-full text-lg font-semibold bg-transparent border-0 outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
          />

          <Field icon={<FileText className="h-4 w-4" />}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción (opcional)"
              rows={3}
              className="w-full bg-transparent border-0 outline-none text-sm resize-none placeholder:text-zinc-400"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field icon={<Calendar className="h-4 w-4" />} label="Inicio">
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-sm"
              />
            </Field>
            <Field icon={<Clock className="h-4 w-4" />} label="Fin">
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full bg-transparent border-0 outline-none text-sm"
              />
            </Field>
          </div>

          <Field icon={<MapPin className="h-4 w-4" />}>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ubicación (opcional)"
              className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-zinc-400"
            />
          </Field>

          <Field icon={<ImageIcon className="h-4 w-4" />}>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL de imagen (opcional)"
              className="w-full bg-transparent border-0 outline-none text-sm placeholder:text-zinc-400"
            />
          </Field>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
        </div>

        <footer className="px-6 py-4 flex items-center justify-between gap-2 border-t border-black/5 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-950/30">
          {isEdit ? (
            confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">¿Eliminar?</span>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="h-8 px-3 rounded-full bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition disabled:opacity-60"
                >
                  {deleting ? "Eliminando…" : "Sí, eliminar"}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="h-8 px-3 rounded-full text-xs text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                title="Eliminar evento"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )
          ) : (
            <div />
          )}

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-full text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-9 px-5 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60"
            >
              {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear evento"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-black/5 dark:border-white/5">
      <div className="text-zinc-400 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        {label && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-0.5">
            {label}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
