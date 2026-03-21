"use client";

type TimerProps = {
  formatted: string;
  seconds: number;
  timerReady: boolean;
};

export function Timer({ formatted, seconds, timerReady }: TimerProps) {
  const displayTime = timerReady ? formatted : "--:--:--";

  const colorClass =
    !timerReady
      ? "text-muted-foreground"
      : seconds < 60
        ? "text-red-600 dark:text-red-400"
        : seconds < 300
          ? "text-amber-600 dark:text-amber-400"
          : "text-foreground";

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg"
      role="timer"
      aria-label={timerReady ? `Time remaining: ${formatted}` : "Loading timer..."}
    >
      <span className="material-symbols-outlined text-muted-foreground text-[20px]" aria-hidden="true">
        timer
      </span>
      <span className={`font-mono font-bold text-base ${colorClass}`} aria-hidden="true">
        {displayTime}
      </span>
      {timerReady && seconds === 300 && (
        <span className="sr-only" role="alert">5 minutes remaining</span>
      )}
      {timerReady && seconds === 60 && (
        <span className="sr-only" role="alert">1 minute remaining</span>
      )}
    </div>
  );
}
