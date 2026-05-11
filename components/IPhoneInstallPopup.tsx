"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Share, Smartphone, X } from "lucide-react";

const STORAGE_KEY = "agenddi_install_dismissed_v1";

export function IPhoneInstallPopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Mobile only
    if (window.innerWidth > 640) return;
    // Already running as installed PWA — don't show
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari quirk
      // @ts-expect-error iOS-only navigator extension
      window.navigator.standalone === true;
    if (standalone) return;
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    // Small delay to not feel jarring on first paint
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:hidden animate-in fade-in duration-300">
      <button
        type="button"
        aria-label="Close"
        onClick={dismiss}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative bg-[#f5efe2] w-full rounded-t-3xl shadow-2xl p-6 pb-8 animate-in slide-in-from-bottom duration-300">
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 h-9 w-9 rounded-full bg-stone-200/60 hover:bg-stone-200 flex items-center justify-center"
        >
          <X className="h-4 w-4 text-stone-700" strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-[#8b5a3c] text-white flex items-center justify-center shrink-0 shadow-md">
            <Smartphone className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <p className="eyebrow">For iPhone</p>
            <h3 className="text-xl font-extrabold tracking-tight text-stone-900 leading-tight">
              Install Agenddi
            </h3>
          </div>
        </div>

        <p className="text-sm text-stone-600 leading-relaxed mb-4">
          Add Agenddi to your home screen for a true app experience — fullscreen, instant, free.
        </p>

        {/* Quick steps */}
        <ol className="space-y-2 mb-5">
          <li className="flex items-center gap-2.5 text-sm text-stone-700">
            <span className="h-6 w-6 rounded-full bg-[#fbf6ee] text-[#8b5a3c] text-xs font-extrabold flex items-center justify-center shrink-0">1</span>
            Open in Safari
          </li>
          <li className="flex items-center gap-2.5 text-sm text-stone-700">
            <span className="h-6 w-6 rounded-full bg-[#fbf6ee] text-[#8b5a3c] text-xs font-extrabold flex items-center justify-center shrink-0">2</span>
            Tap <Share className="h-3.5 w-3.5 inline-block mx-0.5 text-stone-500" strokeWidth={2.5} />
            <span className="font-bold">Share</span>
          </li>
          <li className="flex items-center gap-2.5 text-sm text-stone-700">
            <span className="h-6 w-6 rounded-full bg-[#fbf6ee] text-[#8b5a3c] text-xs font-extrabold flex items-center justify-center shrink-0">3</span>
            Tap <Plus className="h-3.5 w-3.5 inline-block mx-0.5 text-stone-500" strokeWidth={2.5} />
            <span className="font-bold">Add to Home Screen</span>
          </li>
        </ol>

        <div className="flex gap-2">
          <Link
            href="/for-iphone"
            onClick={dismiss}
            className="flex-1 h-11 rounded-2xl bg-stone-900 text-[#faf6ef] font-extrabold text-sm tracking-tight flex items-center justify-center hover:bg-[#8b5a3c] transition"
          >
            See full guide →
          </Link>
          <button
            onClick={dismiss}
            className="px-5 h-11 rounded-2xl border-2 border-stone-200 text-stone-700 font-bold text-sm hover:bg-white transition"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
