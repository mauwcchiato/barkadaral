"use client";

import { useRef, useState } from "react";
import { FileText, Sparkles, Upload, Wand2, X } from "lucide-react";
import Segmented from "./Segmented";
import { SAMPLE_NOTES } from "@/lib/sample-notes";

export type Difficulty = "easy" | "medium" | "hard";

const MAX_PDF_BYTES = 3 * 1024 * 1024; // keeps requests under typical host body limits
const MAX_CHARS = 60000;

export default function NotesInput({
  notes,
  setNotes,
  pdf,
  setPdf,
  difficulty,
  setDifficulty,
  numQuestions,
  setNumQuestions,
  onGenerate,
  onError,
}: {
  notes: string;
  setNotes: (v: string) => void;
  pdf: File | null;
  setPdf: (f: File | null) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  numQuestions: number;
  setNumQuestions: (n: number) => void;
  onGenerate: () => void;
  onError: (msg: string | null) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    onError(null);
    if (!file) return;
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      if (file.size > MAX_PDF_BYTES) {
        onError("That PDF is over 3 MB. Try a smaller file or paste the text instead.");
        return;
      }
      setPdf(file);
    } else if (file.type.startsWith("text/") || /\.(txt|md)$/i.test(file.name)) {
      setNotes((await file.text()).slice(0, MAX_CHARS));
      setPdf(null);
    } else {
      onError("Upload a PDF, .txt or .md file.");
    }
  }

  const canGenerate = notes.trim().length >= 50 || pdf !== null;

  return (
    <div className="card overflow-hidden">
      <div
        className={`relative transition ${dragging ? "bg-accent-soft" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files?.[0]);
        }}
      >
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Paste your lecture notes, a reading, or a chapter summary…"
          className="block h-52 w-full resize-y bg-transparent p-5 text-[15px] leading-relaxed outline-none placeholder:text-muted/70 sm:h-64 lg:h-80"
          maxLength={MAX_CHARS}
          aria-label="Your notes"
        />
        {dragging && (
          <div className="pointer-events-none absolute inset-3 grid place-items-center rounded-xl border-2 border-dashed border-accent text-accent">
            <span className="flex items-center gap-2 font-medium">
              <Upload className="h-5 w-5" /> Drop your file here
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-surface-2/60 px-4 py-3">
        <input
          ref={fileInput}
          type="file"
          accept=".pdf,.txt,.md,text/plain,application/pdf"
          className="hidden"
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <button onClick={() => fileInput.current?.click()} className="btn-ghost">
          <Upload className="h-4 w-4" /> <span>Upload<span className="hidden sm:inline"> PDF or text</span></span>
        </button>
        <button onClick={() => setNotes(SAMPLE_NOTES)} className="btn-ghost">
          <Wand2 className="h-4 w-4" /><span className="sm:hidden">Sample</span><span className="hidden sm:inline">Try sample notes</span>
        </button>
        {pdf && (
          <span className="flex items-center gap-2 rounded-lg bg-accent-soft py-1 pl-3 pr-1 text-sm">
            <FileText className="h-4 w-4 text-accent" />
            <span className="max-w-[12rem] truncate">{pdf.name}</span>
            <button
              onClick={() => setPdf(null)}
              aria-label="Remove PDF"
              className="rounded p-1 text-muted hover:bg-surface hover:text-bad"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </span>
        )}
        <span className="ml-auto font-mono text-xs text-muted">
          {notes.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
        </span>
      </div>

      <div className="flex flex-col gap-4 border-t border-line p-4 sm:flex-row sm:items-end">
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
          <Segmented
            label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            options={[
              { value: "easy", label: "Easy", hint: "Recall facts and definitions" },
              { value: "medium", label: "Medium", hint: "Understand and compare ideas" },
              { value: "hard", label: "Hard", hint: "Apply ideas to new situations" },
            ]}
          />
          <Segmented
            label="Questions"
            value={numQuestions}
            onChange={setNumQuestions}
            options={[5, 10, 15, 20].map((n) => ({ value: n, label: String(n) }))}
          />
        </div>
        <button onClick={onGenerate} disabled={!canGenerate} className="btn-primary px-6 py-3 sm:w-auto">
          <Sparkles className="h-4 w-4" /> Generate study set
        </button>
      </div>
    </div>
  );
}
