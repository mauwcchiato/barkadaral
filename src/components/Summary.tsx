import { Lightbulb, BookMarked } from "lucide-react";
import type { StudySet } from "@/lib/schemas";

export default function Summary({ set }: { set: StudySet }) {
  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <section className="card p-6 lg:col-span-3">
        <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
          <Lightbulb className="h-4 w-4 text-accent" /> Key points
        </h3>
        <ol className="flex flex-col gap-4">
          {set.summary.map((point, i) => (
            <li key={i} className="flex gap-4">
              <span className="font-serif text-2xl leading-none text-accent">{i + 1}</span>
              <span className="leading-relaxed">{point}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="card p-6 lg:col-span-2">
        <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted">
          <BookMarked className="h-4 w-4 text-accent" /> Key terms
        </h3>
        <dl className="flex flex-col divide-y divide-line">
          {set.keyTerms.map((t, i) => (
            <div key={i} className="py-3 first:pt-0 last:pb-0">
              <dt className="font-semibold">
                <span className="highlight">{t.term}</span>
              </dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted">{t.definition}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
