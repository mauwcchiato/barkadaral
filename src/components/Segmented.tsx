"use client";

type Option<T> = { value: T; label: string; hint?: string };

export default function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </legend>
      <div className="flex rounded-xl border border-line bg-surface-2 p-1">
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              title={o.hint}
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? "bg-surface text-foreground shadow-sm ring-1 ring-line"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
