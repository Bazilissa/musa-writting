export type DailyStat = { day: string; words_written: number };

export function todayKey(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function calcStreak(stats: DailyStat[], goal: number): number {
  const set = new Set(stats.filter((s) => s.words_written >= goal).map((s) => s.day));
  let streak = 0;
  const cursor = new Date();
  // If today not yet hit, start from yesterday so the streak isn't reset mid-day
  if (!set.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(todayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function lastNDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const c = new Date(d);
    c.setDate(d.getDate() - i);
    days.push(todayKey(c));
  }
  return days;
}
