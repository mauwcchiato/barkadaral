"use client";

import { useEffect, useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

const STEPS = [
  "Reading your notes",
  "Picking out the key ideas",
  "Writing flashcards",
  "Building quiz questions",
  "Checking the answers",
];

export default function LoadingState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // The AI doesn't report progress, so advance at a steady pace and
    // hold on the last step until the response arrives.
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="card animate-rise mx-auto flex w-full max-w-md flex-col gap-5 p-8" role="status" aria-live="polite">
      <div>
        <p className="font-serif text-3xl">Making your study set…</p>
        <p className="mt-1 text-sm text-muted">This usually takes 15–40 seconds.</p>
      </div>
      <ol className="flex flex-col gap-3">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 text-sm transition ${
                done ? "text-foreground" : active ? "font-medium text-foreground" : "text-muted/60"
              }`}
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${
                  done
                    ? "border-good bg-good-soft text-good"
                    : active
                      ? "border-accent text-accent"
                      : "border-line"
                }`}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" />
                ) : active ? (
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                ) : null}
              </span>
              {label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
