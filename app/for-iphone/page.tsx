import Link from "next/link";
import { ChevronLeft, Plus, Share, Smartphone, Sparkles } from "lucide-react";

const STEPS = [
  {
    n: 1,
    title: "Open Agenddi in Safari",
    desc: "Add to Home Screen only works from Safari on iPhone — not Chrome or Firefox.",
  },
  {
    n: 2,
    title: "Tap the Share button",
    desc: "It's the square with an arrow pointing up, at the bottom of the screen.",
    icon: <Share className="h-4 w-4" strokeWidth={2.5} />,
  },
  {
    n: 3,
    title: 'Choose "Add to Home Screen"',
    desc: "Scroll down through the share menu options until you find it.",
    icon: <Plus className="h-4 w-4" strokeWidth={2.5} />,
  },
  {
    n: 4,
    title: "Confirm the name",
    desc: 'Leave it as "Agenddi" or rename it, then tap Add in the top-right.',
  },
  {
    n: 5,
    title: "You're set",
    desc: "The Agenddi icon now lives on your home screen — tap it to open just like a native app.",
    icon: <Sparkles className="h-4 w-4" strokeWidth={2.5} />,
  },
];

export default function ForIPhonePage() {
  return (
    <div className="min-h-screen bakery-bg">
      <div className="max-w-md mx-auto px-5 pt-6 pb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-[#8b5a3c] font-semibold mb-8"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Link>

        <div className="text-center mb-10">
          <div className="h-16 w-16 rounded-3xl bg-[#8b5a3c] text-white flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Smartphone className="h-8 w-8" strokeWidth={2} />
          </div>
          <p className="eyebrow mb-2">For iPhone</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-stone-900">
            Add Agenddi to your<br />home screen
          </h1>
          <p className="text-sm text-stone-600 mt-3 leading-relaxed">
            Agenddi is a web app — but you can install it like a native app in 30 seconds.
          </p>
        </div>

        <ol className="space-y-3">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-4 bg-white rounded-2xl card-shadow p-4">
              <div className="shrink-0 h-10 w-10 rounded-full bg-[#fbf6ee] text-[#8b5a3c] font-extrabold text-sm flex items-center justify-center border border-[#8b5a3c]/15">
                {s.n}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-stone-900 tracking-tight">{s.title}</h3>
                  {s.icon && (
                    <span className="inline-flex items-center justify-center h-7 w-7 rounded-lg bg-stone-100 text-stone-700">
                      {s.icon}
                    </span>
                  )}
                </div>
                <p className="text-sm text-stone-600 mt-1 leading-snug">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 p-5 rounded-2xl bg-[#fbf6ee] border border-[#8b5a3c]/15">
          <p className="text-xs text-stone-600 leading-relaxed">
            <span className="font-bold text-[#8b5a3c]">Why?</span> When you add Agenddi to your home
            screen, it opens fullscreen, loads instantly, and feels like an app — without taking up
            any storage on your phone.
          </p>
        </div>

        <p className="text-center mt-8 text-[11px] text-stone-400 font-medium">
          On Android? Same idea — open in Chrome → menu → "Install app".
        </p>
      </div>
    </div>
  );
}
