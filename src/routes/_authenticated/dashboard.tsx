import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getDailyPrompt } from "@/lib/prompts";
import { calcStreak, lastNDays, todayKey, type DailyStat } from "@/lib/streak";
import { toast } from "sonner";
import { Plus, Flame, Target, BookOpen, Sparkles, Shuffle, Archive, Timer, CheckCircle2, Circle, Bell, BellOff, History } from "lucide-react";
import { getTodayChallenge } from "@/lib/dailyChallenges";
import { ensurePermission, loadReminderSettings, saveReminderSettings, scheduleNextReminder, type ReminderSettings } from "@/lib/reminders";


export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Комната со столом" }] }),
  component: Dashboard,
});

type Post = { id: string; title: string; content: string; word_count: number; updated_at: string };

const DEFAULT_GOAL = 200;
const DAYS_COUNT = 14;
const INSPIRATION_BOX = [
  {
    title: "Предмет на столе",
    prompt: "Выберите один предмет рядом с собой и напишите, что он знает о вас, но не говорит.",
  },
  {
    title: "Чужая фраза",
    prompt: "Вспомните фразу, услышанную случайно. Пусть она станет первой строкой сцены.",
  },
  {
    title: "Смена света",
    prompt: "Опишите комнату до и после того, как в ней изменился свет. Не объясняйте, что случилось.",
  },
  {
    title: "Неловкое молчание",
    prompt: "Два человека знают одно и то же, но делают вид, что не знают. Напишите минуту между ними.",
  },
  {
    title: "Тихое сопротивление",
    prompt: "Герой делает маленькое действие, которое никто не заметит, но для него это почти бунт.",
  },
];

const WRITER_QUOTES = [
  "Пишите регулярно, пусть даже немного: привычка держит дверь открытой.",
  "Черновик не обязан быть хорошим. Он обязан появиться.",
  "Страница становится живой, когда на ней есть конкретная вещь, жест или голос.",
  "Если нет сил идти дальше, опишите то, что уже стоит перед вами.",
];

const WRITING_PRACTICES = [
  {
    title: "5 минут без остановки",
    prompt: "Поставьте таймер на пять минут и пишите без пауз, исправлений и оценки. Последнюю фразу оставьте как начало нового абзаца.",
  },
  {
    title: "Предмет на столе",
    prompt: "Опишите один предмет на столе так, будто он хранит маленькую тайну сцены.",
  },
  {
    title: "Один жест",
    prompt: "Напишите сцену через один повторяющийся жест героя. Не называйте чувство напрямую.",
  },
];

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [goal, setGoal] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_GOAL;
    return Number(localStorage.getItem("inkwell_goal") || DEFAULT_GOAL);
  });
  const [drawer, setDrawer] = useState<"left" | "right">(() => {
    if (typeof window === "undefined") return "right";
    return localStorage.getItem("room_preferred_drawer") === "left" ? "left" : "right";
  });
  const [inspirationIndex, setInspirationIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [challengeDoneAt, setChallengeDoneAt] = useState<string | null>(null);
  const [reminder, setReminder] = useState<ReminderSettings>(() => loadReminderSettings());
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "denied",
  );

  const challenge = getTodayChallenge();


  useEffect(() => {
    if (!user) return;
    (async () => {
      const today = todayKey();
      const [p, s, c] = await Promise.all([
        supabase.from("posts").select("id,title,content,word_count,updated_at").order("updated_at", { ascending: false }),
        supabase.from("daily_stats").select("day,words_written").gte("day", lastNDays(60)[0]),
        supabase.from("daily_challenges").select("completed_at").eq("day", today).eq("challenge_key", challenge.key).maybeSingle(),
      ]);
      if (p.data) setPosts(p.data);
      if (s.data) setStats(s.data);
      if (c.data?.completed_at) setChallengeDoneAt(c.data.completed_at);
      setLoading(false);
    })();
  }, [user, challenge.key]);

  useEffect(() => {
    const cancel = scheduleNextReminder();
    return cancel;
  }, [reminder]);


  useEffect(() => {
    localStorage.setItem("inkwell_goal", String(goal));
  }, [goal]);

  const today = stats.find((s) => s.day === todayKey())?.words_written ?? 0;
  const streak = calcStreak(stats, goal);
  const goalPct = Math.min(100, Math.round((today / goal) * 100));
  const days = lastNDays(DAYS_COUNT);
  const dayMap = new Map(stats.map((s) => [s.day, s.words_written]));
  const prompt = getDailyPrompt();
  const inspiration = INSPIRATION_BOX[inspirationIndex];
  const quote = WRITER_QUOTES[new Date().getDate() % WRITER_QUOTES.length];
  const practice = WRITING_PRACTICES[new Date().getDay() % WRITING_PRACTICES.length];

  const newPost = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("posts")
      .insert({ user_id: user.id, title: "Без названия", content: "" })
      .select()
      .single();
    if (error) return toast.error(error.message);
    navigate({ to: "/write/$postId", params: { postId: data.id } });
  };

  const startWithText = async (text: string, title = "Без названия") => {
    if (!user) return;
    const { data, error } = await supabase
      .from("posts")
      .insert({ user_id: user.id, title, content: `> ${text}\n\n` })
      .select()
      .single();
    if (error) return toast.error(error.message);
    navigate({ to: "/write/$postId", params: { postId: data.id } });
  };

  const startWithPrompt = async () => {
    await startWithText(prompt, prompt.slice(0, 60));
  };

  const deletePost = async (id: string) => {
    if (!confirm("Удалить этот черновик навсегда?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPosts(posts.filter((p) => p.id !== id));
    toast.success("Черновик удалён.");
  };

  const shuffleInspiration = () => {
    setInspirationIndex((current) => (current + 1) % INSPIRATION_BOX.length);
  };

  const openDrawer = (nextDrawer: "left" | "right") => {
    localStorage.setItem("room_preferred_drawer", nextDrawer);
    setDrawer(nextDrawer);
  };

  const toggleChallenge = async () => {
    if (!user) return;
    const day = todayKey();
    if (challengeDoneAt) {
      const { error } = await supabase
        .from("daily_challenges").delete().eq("user_id", user.id).eq("day", day);
      if (error) return toast.error(error.message);
      setChallengeDoneAt(null);
      toast("Отметка снята.");
    } else {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("daily_challenges")
        .upsert({ user_id: user.id, day, challenge_key: challenge.key, completed_at: now }, { onConflict: "user_id,day" });
      if (error) return toast.error(error.message);
      setChallengeDoneAt(now);
      toast.success("Задание выполнено. До завтра!");
    }
  };

  const startChallenge = async () => {
    await startWithText(challenge.prompt, challenge.title);
  };

  const toggleReminder = async () => {
    if (!reminder.enabled) {
      const perm = await ensurePermission();
      setNotifPerm(perm);
      if (perm !== "granted") {
        toast.error("Разрешите уведомления в браузере, чтобы получать напоминания.");
        return;
      }
    }
    const next = { ...reminder, enabled: !reminder.enabled };
    saveReminderSettings(next);
    setReminder(next);
    toast.success(next.enabled ? `Напоминание в ${next.time}` : "Напоминания выключены.");
  };

  const updateReminderTime = (time: string) => {
    const next = { ...reminder, time };
    saveReminderSettings(next);
    setReminder(next);
  };


  const intensity = (n: number) => {
    if (n === 0) return "bg-secondary";
    const ratio = Math.min(1, n / goal);
    if (ratio < 0.25) return "bg-ember/20";
    if (ratio < 0.5) return "bg-ember/40";
    if (ratio < 0.85) return "bg-ember/65";
    return "bg-ember";
  };

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24">
      <section className="flex flex-col gap-5 pt-6 md:flex-row md:items-end md:justify-between">
        <div className="inline-flex w-fit rounded-full border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => openDrawer("left")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
              drawer === "left" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Archive className="h-4 w-4" /> Левый ящик
          </button>
          <button
            type="button"
            onClick={() => openDrawer("right")}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
              drawer === "right" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4" /> Правый ящик
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleReminder}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition ${
              reminder.enabled
                ? "border-ember/40 bg-ember/10 text-ember"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {reminder.enabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            {reminder.enabled ? `Напоминание в ${reminder.time}` : "Напоминания выключены"}
          </button>
          <input
            type="time"
            value={reminder.time}
            onChange={(e) => updateReminderTime(e.target.value)}
            className="rounded-full border border-border bg-transparent px-3 py-2 font-mono text-xs"
          />
          <Link
            to="/history"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted-foreground transition hover:text-foreground"
          >
            <History className="h-3.5 w-3.5" /> История сессий
          </Link>
        </div>
      </section>

      {drawer === "left" ? (
        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-ember" /> Задание дня
              </div>
              <button
                type="button"
                onClick={toggleChallenge}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition ${
                  challengeDoneAt
                    ? "border-ember/40 bg-ember/10 text-ember"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {challengeDoneAt ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                {challengeDoneAt ? "Выполнено" : "Отметить выполненным"}
              </button>
            </div>
            <h2 className="mt-4 font-display text-3xl font-light">{challenge.title}</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{challenge.prompt}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={startChallenge}
                className="rounded-full bg-ember px-5 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90"
              >
                Начать задание
              </button>
              <span className="text-xs italic text-muted-foreground">
                Ориентир: около {challenge.minWords} слов.
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">Тема дня</p>
            <blockquote className="mt-4 font-display text-2xl font-light italic leading-snug">
              «{prompt}»
            </blockquote>
            <button
              onClick={startWithPrompt}
              className="mt-6 rounded-full bg-ember px-5 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90"
            >
              Начать с этой темы
            </button>
          </div>


          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <Target className="h-3.5 w-3.5 text-ember" /> Цель по словам
            </div>
            <div className="mt-4 font-display text-5xl font-light">
              {today}
              <span className="ml-2 text-base italic text-muted-foreground">/ {goal}</span>
            </div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-ember transition-all" style={{ width: `${goalPct}%` }} />
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Сегодняшняя цель</span>
              <input
                type="number"
                min={50}
                step={50}
                value={goal}
                onChange={(e) => setGoal(Math.max(50, Number(e.target.value) || DEFAULT_GOAL))}
                className="w-24 rounded border border-border bg-transparent px-2 py-1 font-mono"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-ember" /> Последние {DAYS_COUNT} дней
            </div>
            <div className="mt-4 flex items-end gap-3">
              <div className="font-display text-5xl font-light">{streak}</div>
              <div className="pb-2 text-sm italic text-muted-foreground">дней подряд</div>
            </div>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {days.map((d) => {
                const count = dayMap.get(d) ?? 0;
                return (
                  <div
                    key={d}
                    title={`${d} · ${count} слов`}
                    className={`h-5 w-5 rounded-sm ${intensity(count)} ring-1 ring-border/40`}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-ember" /> Поиск вдохновения
            </div>
            <h2 className="mt-4 font-display text-3xl font-light">{inspiration.title}</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
              {inspiration.prompt}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void startWithText(inspiration.prompt, inspiration.title)}
                className="rounded-full bg-ember px-5 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90"
              >
                Начать писать
              </button>
              <button
                type="button"
                onClick={shuffleInspiration}
                className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm transition hover:bg-secondary"
              >
                <Shuffle className="h-4 w-4" /> Ещё
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
              <Timer className="h-3.5 w-3.5 text-ember" /> Разминка
            </div>
            <h2 className="mt-4 font-display text-3xl font-light">{practice.title}</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
              {practice.prompt}
            </p>
            <button
              type="button"
              onClick={() => void startWithText(practice.prompt, practice.title)}
              className="mt-6 rounded-full bg-ember px-5 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90"
            >
              Начать разминку
            </button>
          </div>
        </section>
      ) : (
        <section className="mt-10">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">Правый ящик</p>
              <h2 className="mt-2 font-display text-4xl font-light">Черновики</h2>
            </div>
            <button
              onClick={newPost}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Новый текст
            </button>
          </div>

          {loading ? (
            <p className="mt-8 text-sm italic text-muted-foreground">Открываем правый ящик…</p>
          ) : posts.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center">
              <p className="font-display text-2xl italic text-muted-foreground">Правый ящик пуст.</p>
              <p className="mt-2 text-sm text-muted-foreground">Создайте новый текст, когда будете готовы.</p>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-border">
              {posts.map((p) => (
                <li key={p.id} className="group flex items-center justify-between py-5">
                  <Link to="/write/$postId" params={{ postId: p.id }} className="flex-1">
                    <h3 className="font-display text-2xl font-light transition group-hover:text-ember">
                      {p.title || "Без названия"}
                    </h3>
                    <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                      {p.content.replace(/[#>*_`]/g, "").slice(0, 140) || "—"}
                    </p>
                  </Link>
                  <div className="ml-6 hidden items-center gap-6 text-xs text-muted-foreground md:flex">
                    <span className="font-mono">{p.word_count} сл.</span>
                    <span className="italic">{new Date(p.updated_at).toLocaleDateString("ru-RU", { month: "short", day: "numeric" })}</span>
                    <button onClick={() => deletePost(p.id)} className="text-muted-foreground/60 hover:text-destructive">
                      удалить
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </main>
  );
}
