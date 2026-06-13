/**
 * Minimal in-process daily scheduler — no dependency, no persistence.
 *
 * Single-instance deployment (one container on Unraid) means no distributed
 * locking is needed. A missed run (container restarted across the target
 * hour) simply waits for the next day — fine for non-time-critical jobs like
 * reminders. Uses a self-rearming setTimeout rather than setInterval so the
 * fire time can't drift.
 */

type DailyTask = () => Promise<void> | void;

function msUntilNext(hour: number): number {
  const now = new Date();
  const next = new Date(now);
  next.setHours(hour, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  return next.getTime() - now.getTime();
}

/** Run `task` every day at `hour`:00 server time (first run at the next
 *  occurrence, not at startup). Task errors are logged, never thrown — a
 *  failed run must not kill the rearm chain or the process. */
export function scheduleDaily(name: string, hour: number, task: DailyTask): void {
  const arm = (): void => {
    const delay = msUntilNext(hour);
    setTimeout(async () => {
      try {
        await task();
      } catch (err) {
        console.error(`Scheduled task "${name}" failed:`, err);
      }
      arm();
    }, delay);
  };
  arm();
  console.log(`🗓️  Scheduled "${name}" daily at ${String(hour).padStart(2, '0')}:00`);
}
