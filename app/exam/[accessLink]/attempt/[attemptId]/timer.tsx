"use client";

type TimerProps = {
  formatted: string;
  seconds: number;
};

export function Timer({ formatted, seconds }: TimerProps) {
  const colorClass =
    seconds < 60
      ? "text-red-600 dark:text-red-400"
      : seconds < 300
        ? "text-amber-600 dark:text-amber-400"
        : "text-slate-900 dark:text-white";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
      <span className="material-symbols-outlined text-slate-500 text-[20px]">
        timer
      </span>
      <span className={`font-mono font-bold text-base ${colorClass}`}>
        {formatted}
      </span>
    </div>
  );
}
