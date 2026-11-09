"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Layers,
  ListChecks,
  NotebookPen,
  Plus,
  Trash2,
} from "lucide-react";
import type { GenerateRequest, StudySet } from "@/lib/schemas";
import { SITE } from "@/lib/site";
import NotesInput, { type Difficulty } from "@/components/NotesInput";
import LoadingState from "@/components/LoadingState";
import Summary from "@/components/Summary";
import Flashcards from "@/components/Flashcards";
import Quiz from "@/components/Quiz";
import Wordmark from "@/components/Wordmark";

type Saved = { id: string; createdAt: number; set: StudySet };
type Tab = "summary" | "flashcards" | "quiz";

const STORAGE_KEY = "barkadaral:sets";

function loadSaved(): Saved[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function persist(sets: Saved[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets.slice(0, 20)));
  } catch {
    // storage full or blocked: history just won't persist
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function timeAgo(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

const TABS: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: "summary", label: "Summary", icon: NotebookPen },
  { id: "flashcards", label: "Flashcards", icon: Layers },
  { id: "quiz", label: "Quiz", icon: ListChecks },
];

const FEATURES = [
  { icon: NotebookPen, title: "Summary", text: "Key points and terms on one review sheet." },
  { icon: Layers, title: "Flashcards", text: "Flip, shuffle, and track what you know." },
  { icon: ListChecks, title: "Quiz", text: "Multiple choice with an explanation for every answer." },
];

export default function Home() {
  const [notes, setNotes] = useState("");
  const [pdf, setPdf] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [current, setCurrent] = useState<Saved | null>(null);
  const [tab, setTab] = useState<Tab>("summary");

  useEffect(() => {
    // localStorage only exists in the browser, so load history after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSaved(loadSaved());
  }, []);

  async function generate() {
    setLoading(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const body: GenerateRequest = { notes, numQuestions, difficulty };
      if (pdf) {
        body.pdfBase64 = await fileToBase64(pdf);
        body.pdfName = pdf.name;
      }
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);

      const entry: Saved = { id: crypto.randomUUID(), createdAt: Date.now(), set: data };
      const next = [entry, ...saved];
      setSaved(next);
      persist(next);
      open(entry);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function open(entry: Saved) {
    setCurrent(entry);
    setTab("summary");
    window.scrollTo({ top: 0 });
  }

  function remove(id: string) {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    persist(next);
    if (current?.id === id) setCurrent(null);
  }

  return (
    <div className="paper-bg flex flex-1 flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line/70 bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl 2xl:max-w-7xl items-center justify-between px-4 sm:px-6">
          <button onClick={() => setCurrent(null)} className="flex items-center gap-2.5">
            <Image
              src="/logo-mark.png"
              alt=""
              width={40}
              height={40}
              className="h-9 w-9 rounded-xl bg-white ring-1 ring-line sm:h-10 sm:w-10"
              priority
            />
            <Wordmark className="text-xl sm:text-2xl" />
          </button>
          {current && (
            <button onClick={() => setCurrent(null)} className="btn-secondary py-2 text-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New study set</span>
              <span className="sm:hidden">New</span>
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl 2xl:max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-12 lg:py-16">
        {loading ? (
          <LoadingState />
        ) : current ? (
          /* ---------- Results ---------- */
          <div key={current.id} className="animate-rise flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <button onClick={() => setCurrent(null)} className="btn-ghost -ml-3 w-fit">
                <ArrowLeft className="h-4 w-4" /> All study sets
              </button>
              <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{current.set.title}</h1>
              <div className="flex flex-wrap gap-2 text-sm text-muted">
                <span className="rounded-full border border-line bg-surface px-3 py-1">
                  {current.set.summary.length} key points
                </span>
                <span className="rounded-full border border-line bg-surface px-3 py-1">
                  {current.set.flashcards.length} flashcards
                </span>
                <span className="rounded-full border border-line bg-surface px-3 py-1">
                  {current.set.quiz.length} quiz questions
                </span>
              </div>
            </div>

            <nav className="flex gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-card sm:w-fit" role="tablist">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => setTab(id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition sm:flex-none sm:px-5 ${
                    tab === id
                      ? "bg-accent text-white shadow-sm dark:text-[#121118]"
                      : "text-muted hover:bg-surface-2 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>

            <div className="animate-rise" key={tab}>
              {tab === "summary" && <Summary set={current.set} />}
              {tab === "flashcards" && (
                <Flashcards key={current.id} cards={current.set.flashcards} title={current.set.title} />
              )}
              {tab === "quiz" && <Quiz key={current.id} questions={current.set.quiz} />}
            </div>
          </div>
        ) : (
          /* ---------- Home ---------- */
          <div className="flex flex-col gap-14">
            <div className="grid items-start gap-8 lg:grid-cols-12 lg:gap-14">
              {/* Hero */}
              <section className="flex flex-col items-center gap-5 text-center lg:col-span-5 lg:items-start lg:pt-4 lg:text-left">
                <div className="flex items-center gap-4">
                  <Image
                    src="/logo-mark.png"
                    alt="BarkadAral logo: two friends reading a book together"
                    width={112}
                    height={112}
                    className="h-20 w-20 -rotate-3 rounded-2xl bg-white p-1 shadow-card ring-1 ring-line sm:h-24 sm:w-24 lg:h-28 lg:w-28"
                    priority
                  />
                  <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
                    Your AI study barkada
                    <br className="sm:hidden" />
                    <span className="hidden sm:inline"> · </span>Free, no sign-up
                  </span>
                </div>
                <h1 className="font-serif text-4xl leading-[1.08] sm:text-5xl xl:text-6xl">
                  Turn your notes into a <span className="highlight">study session</span>
                </h1>
                <p className="max-w-md text-base text-muted sm:text-lg">
                  Paste lecture notes or upload a PDF. Get a summary, flashcards and a practice quiz
                  in seconds.
                </p>
                <ul className="mt-2 hidden flex-col gap-4 lg:flex">
                  {FEATURES.map(({ icon: Icon, title, text }) => (
                    <li key={title} className="flex gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>
                        <span className="block font-semibold">{title}</span>
                        <span className="text-sm text-muted">{text}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Input */}
              <section className="w-full lg:col-span-7">
                <NotesInput
                  notes={notes}
                  setNotes={setNotes}
                  pdf={pdf}
                  setPdf={setPdf}
                  difficulty={difficulty}
                  setDifficulty={setDifficulty}
                  numQuestions={numQuestions}
                  setNumQuestions={setNumQuestions}
                  onGenerate={generate}
                  onError={setError}
                />
                {error && (
                  <p role="alert" className="animate-rise mt-4 rounded-xl border border-bad/30 bg-bad-soft px-4 py-3 text-sm text-bad">
                    {error}
                  </p>
                )}
              </section>
            </div>

            {/* Feature cards on small screens (shown beside the hero on large ones) */}
            {saved.length === 0 && (
              <section className="grid gap-3 sm:grid-cols-3 lg:hidden">
                {FEATURES.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="card flex gap-3 p-4 sm:flex-col sm:gap-0 sm:p-5">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-accent sm:mb-3 sm:mt-0" />
                    <div>
                      <p className="font-semibold">{title}</p>
                      <p className="mt-1 text-sm text-muted">{text}</p>
                    </div>
                  </div>
                ))}
              </section>
            )}

            {saved.length > 0 && (
              <section>
                <div className="mb-4 flex items-baseline justify-between gap-4">
                  <h2 className="font-serif text-2xl sm:text-3xl">Your study sets</h2>
                  <span className="text-xs text-muted">Saved in this browser</span>
                </div>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {saved.map((s) => (
                    <li key={s.id} className="group relative">
                      <button
                        onClick={() => open(s)}
                        className="card flex w-full flex-col gap-2 p-4 pr-12 text-left transition hover:-translate-y-0.5 hover:border-accent/40"
                      >
                        <span className="line-clamp-1 font-semibold">{s.set.title}</span>
                        <span className="flex flex-wrap items-center gap-3 text-xs text-muted">
                          <span className="flex items-center gap-1">
                            <Layers className="h-3.5 w-3.5" /> {s.set.flashcards.length}
                          </span>
                          <span className="flex items-center gap-1">
                            <ListChecks className="h-3.5 w-3.5" /> {s.set.quiz.length}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {timeAgo(s.createdAt)}
                          </span>
                        </span>
                      </button>
                      <button
                        onClick={() => remove(s.id)}
                        className="absolute right-2 top-2 rounded-lg p-2 text-muted opacity-100 transition hover:bg-bad-soft hover:text-bad sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                        aria-label={"Delete " + s.set.title}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </main>

      <footer className="border-t border-line/70">
        <div className="mx-auto flex max-w-6xl 2xl:max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-muted sm:px-6">
          <span className="flex items-center gap-2">
            <Wordmark className="text-lg" />
            <span>
              · Made by{" "}
              {SITE.portfolio ? (
                <a href={SITE.portfolio} className="font-semibold text-foreground hover:text-accent">
                  {SITE.author}
                </a>
              ) : (
                <span className="font-semibold text-foreground">{SITE.author}</span>
              )}
            </span>
          </span>
          <a href={SITE.github} className="hover:text-accent" target="_blank" rel="noreferrer">
            View source on GitHub →
          </a>
        </div>
      </footer>
    </div>
  );
}
