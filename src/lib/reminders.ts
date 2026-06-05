import { todayKey } from "./streak";

const ENABLED_KEY = "inkwell_reminder_enabled";
const TIME_KEY = "inkwell_reminder_time";
const LAST_SHOWN_KEY = "inkwell_reminder_last_shown";

export type ReminderSettings = {
  enabled: boolean;
  time: string; // "HH:MM"
};

export function loadReminderSettings(): ReminderSettings {
  if (typeof window === "undefined") return { enabled: false, time: "20:00" };
  return {
    enabled: localStorage.getItem(ENABLED_KEY) === "1",
    time: localStorage.getItem(TIME_KEY) || "20:00",
  };
}

export function saveReminderSettings(s: ReminderSettings) {
  localStorage.setItem(ENABLED_KEY, s.enabled ? "1" : "0");
  localStorage.setItem(TIME_KEY, s.time);
}

export async function ensurePermission(): Promise<NotificationPermission> {
  if (typeof Notification === "undefined") return "denied";
  if (Notification.permission === "default") {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

export function scheduleNextReminder(onFire?: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const { enabled, time } = loadReminderSettings();
  if (!enabled) return () => {};
  const [hh, mm] = time.split(":").map(Number);
  const next = new Date();
  next.setHours(hh, mm, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  const delay = next.getTime() - Date.now();
  const id = window.setTimeout(() => {
    const last = localStorage.getItem(LAST_SHOWN_KEY);
    const today = todayKey();
    if (last !== today && typeof Notification !== "undefined" && Notification.permission === "granted") {
      try {
        new Notification("Комната со столом", { body: "Сегодняшняя страница ждёт вас." });
        localStorage.setItem(LAST_SHOWN_KEY, today);
      } catch {
        // Notification can fail silently in some browsers
      }
    }
    onFire?.();
    scheduleNextReminder(onFire);
  }, delay);
  return () => window.clearTimeout(id);
}
