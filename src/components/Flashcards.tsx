"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Download, RotateCcw, Shuffle } from "lucide-react";
import type { StudySet } from "@/lib/schemas";

type Card = StudySet["flashcards"][number];

function downloadCsv(cards: Card[], title: string) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const csv = cards.map((c) => `${esc(c.front)},${esc(c.back)}`).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^\w\- ]+/g, "").trim() || "flashcards"}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Flashcards({ cards, title }: { cards: Card[]; title: string }) {
  const [order, setOrder] = useState(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState<Set<number>>(new Set());

  const id = order[pos];
  const card = cards[id];

  function go(delta: number) {
    setFlipped(false);
    setPos((p) => (p + delta + order.length) % order.length);
  }

  function shuffle() {
    const next = [...order];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setOrder(next);
    setPos(0);
    setFlipped(false);
  }

  function mark(isKnown: boolean) {
    setKnown((prev) => {
      const next = new Set(prev);
      if (isKnown) next.add(id);
      else next.delete(id);
      return next;
    });
    go(1);
  }

  function reset() {
    setKnown(new Set());
    setPos(0);
    setFlipped(false);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!card) return <p className="text-muted">No flashcards were generated.</p>;

  const progress = (known.size / cards.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-good transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 text-sm text-muted">
          <strong className="text-foreground">{known.size}</strong> of {cards.length} known
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flip-card h-72 w-full cursor-pointer sm:h-80"
        aria-label={flipped ? "Show question" : "Show answer"}
      >
        <div className={`flip-inner ${flipped ? "is-flipped" : ""}`}>
          <div className="flip-face card">
            <span className="absolute left-5 top-4 font-mono text-xs text-muted">
              {pos + 1} / {order.length}
            </span>
            {known.has(id) && (
              <span className="absolute right-4 top-3 flex items-center gap-1 rounded-full bg-good-soft px-2 py-0.5 text-xs font-medium text-good">
                <Check className="h-3 w-3" /> Known
              </span>
            )}
            <p className="font-serif text-2xl leading-snug sm:text-3xl">{card.front}</p>
            <span className="absolute bottom-4 text-xs text-muted">Tap to reveal answer</span>
          </div>
          <div className="flip-face flip-back border border-accent/30 bg-accent-soft shadow-card">
            <span className="absolute left-5 top-4 text-xs font-semibold uppercase tracking-wider text-accent">
              Answer
            </span>
            <p className="text-lg leading-relaxed sm:text-xl">{card.back}</p>
          </div>
        </div>
      </button>

      <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-2">
        <button onClick={() => go(-1)} className="btn-secondary px-3" aria-label="Previous card">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => mark(false)} className="btn-secondary">
          <RotateCcw className="h-4 w-4" /> Still learning
        </button>
        <button
          onClick={() => mark(true)}
          className="btn-secondary border-good/40 text-good hover:border-good hover:bg-good-soft"
        >
          <Check className="h-4 w-4" /> I know this
        </button>
        <button onClick={() => go(1)} className="btn-secondary px-3" aria-label="Next card">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1 text-sm">
        <button onClick={shuffle} className="btn-ghost">
          <Shuffle className="h-4 w-4" /> Shuffle
        </button>
        <button onClick={reset} className="btn-ghost">
          <RotateCcw className="h-4 w-4" /> Reset progress
        </button>
        <button onClick={() => downloadCsv(cards, title)} className="btn-ghost">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
      <p className="hidden text-center text-xs text-muted sm:block">
        Shortcuts: <kbd className="rounded border border-line px-1">Space</kbd> flip ·{" "}
        <kbd className="rounded border border-line px-1">←</kbd>{" "}
        <kbd className="rounded border border-line px-1">→</kbd> move
      </p>
    </div>
  );
}
