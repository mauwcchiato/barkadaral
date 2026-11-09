"use client";

import { useState } from "react";
import { ArrowRight, CircleCheck, CircleX, RotateCcw, Trophy } from "lucide-react";
import type { StudySet } from "@/lib/schemas";

type Question = StudySet["quiz"][number];

export default function Quiz({ questions }: { questions: Question[] }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [pos, setPos] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!questions.length) return <p className="text-muted">No quiz questions were generated.</p>;

  const score = answers.filter((a, i) => a === questions[i].answerIndex).length;

  function restart() {
    setAnswers(questions.map(() => null));
    setPos(0);
    setFinished(false);
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const message =
      pct >= 90
        ? "Excellent! You really know this."
        : pct >= 70
          ? "Nice work. Review the ones you missed."
          : pct >= 50
            ? "Getting there. Try the flashcards, then retake it."
            : "Keep going. Go through the flashcards first, then try again.";
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div className="card animate-rise flex flex-col items-center gap-3 p-8 text-center">
          <Trophy className="h-10 w-10 text-accent" />
          <p className="font-serif text-6xl">
            {score}
            <span className="text-3xl text-muted"> / {questions.length}</span>
          </p>
          <p className="text-muted">{message}</p>
          <button onClick={restart} className="btn-primary mt-2">
            <RotateCcw className="h-4 w-4" /> Retake quiz
          </button>
        </div>

        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Review</h3>
        <ol className="flex flex-col gap-3">
          {questions.map((q, i) => {
            const correct = answers[i] === q.answerIndex;
            return (
              <li key={i} className="card flex gap-3 p-4">
                {correct ? (
                  <CircleCheck className="mt-0.5 h-5 w-5 shrink-0 text-good" />
                ) : (
                  <CircleX className="mt-0.5 h-5 w-5 shrink-0 text-bad" />
                )}
                <div className="text-sm">
                  <p className="font-medium">{q.question}</p>
                  {!correct && answers[i] !== null && (
                    <p className="mt-1 text-bad line-through decoration-bad/50">
                      {q.choices[answers[i]!]}
                    </p>
                  )}
                  <p className="mt-1 text-good">{q.choices[q.answerIndex]}</p>
                  <p className="mt-1 text-muted">{q.explanation}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    );
  }

  const q = questions[pos];
  const picked = answers[pos];
  const answered = picked !== null;
  const isLast = pos === questions.length - 1;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <div className="flex items-center gap-1.5" aria-label={`Question ${pos + 1} of ${questions.length}`}>
        {questions.map((qq, i) => {
          const a = answers[i];
          const color =
            a === null
              ? i === pos
                ? "bg-accent"
                : "bg-surface-2"
              : a === qq.answerIndex
                ? "bg-good"
                : "bg-bad";
          return <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${color}`} />;
        })}
      </div>

      <div key={pos} className="card animate-rise p-6 sm:p-8">
        <p className="mb-1 font-mono text-xs text-muted">
          Question {pos + 1} of {questions.length}
        </p>
        <p className="mb-6 font-serif text-2xl leading-snug sm:text-[1.75rem]">{q.question}</p>

        <div className="grid gap-2.5">
          {q.choices.map((choice, ci) => {
            let style = "border-line hover:border-accent/60 hover:bg-surface-2";
            let icon = null;
            if (answered) {
              if (ci === q.answerIndex) {
                style = "border-good bg-good-soft";
                icon = <CircleCheck className="h-5 w-5 shrink-0 text-good" />;
              } else if (ci === picked) {
                style = "border-bad bg-bad-soft";
                icon = <CircleX className="h-5 w-5 shrink-0 text-bad" />;
              } else {
                style = "border-line opacity-55";
              }
            }
            return (
              <button
                key={ci}
                type="button"
                disabled={answered}
                onClick={() => setAnswers((prev) => prev.map((a, i) => (i === pos ? ci : a)))}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${style}`}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-surface-2 font-mono text-sm text-muted">
                  {String.fromCharCode(65 + ci)}
                </span>
                <span className="flex-1">{choice}</span>
                {icon}
              </button>
            );
          })}
        </div>

        {answered && (
          <div
            className={`animate-rise mt-5 rounded-xl p-4 text-sm leading-relaxed ${
              picked === q.answerIndex ? "bg-good-soft" : "bg-bad-soft"
            }`}
          >
            <strong className={picked === q.answerIndex ? "text-good" : "text-bad"}>
              {picked === q.answerIndex ? "Correct! " : "Not quite. "}
            </strong>
            {q.explanation}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">
          Score: <strong className="text-foreground">{score}</strong>
        </span>
        <button
          onClick={() => (isLast ? setFinished(true) : setPos(pos + 1))}
          disabled={!answered}
          className="btn-primary"
        >
          {isLast ? "See results" : "Next question"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
