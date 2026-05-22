import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getDailyPrompt } from "@/lib/prompts";
import { calcStreak, lastNDays, todayKey, type DailyStat } from "@/lib/streak";
import { toast } from "sonner";
import { Plus, Flame, Target, BookOpen, Sparkles, Shuffle, Archive, Quote, Timer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Комната со столом" }] }),
  component: Dashboard,
});

type Post = { id: string; title: string; content: string; word_count: number; updated_at: string };

const DEFAULT_GOAL = 200;
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

  useEffect(() => {
    if (!user) return;

    (async () => {
      const [p, s] = await Promise.all([
        supabase
          .from("posts")
          .select("id,title,content,word_count,updated_at")
          .order("updated_at", { ascending: false }),
        supabase
          .from("daily_stats")
          .select("day,words_written")
          .gte("day", lastNDays(60)[0]),
      ]);

      if (p.data) setPosts(p.data);
      if (s.data) setStats(s.data);
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    localStorage.setItem("inkwell_goal", String(goal));
  }, [goal]);

  const today = stats.find((s) => s.day === todayKey())?.words_written ?? 0;
  const streak = calcStreak(stats, goal);
  const goalPct = Math.min(100, Math.round((today / goal) * 100));

  const days = lastNDays(14);
  const dayMap = new Map(stats.map((s) => [s.day, s.words_written]));

  const prompt = getDailyPrompt();
  const inspiration = INSPIRATION_BOX[inspirationIndex];
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
    await startWithText(prompt, "Без названия");
  };

  const deletePost = async (id: string) => {
    if (!confirm("Удалить этот черновик навсегда?")) return;

    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) return toast.error(error.message);

    setPosts(posts.filter((p) => p.id !== id));
    toast.success("Черновик удалён.");
  };

  const shuffleInspiration = () => {
    setInspirationIndex((c) => (c + 1) % INSPIRATION_BOX.length);
  };

  const openDrawer = (next: "left" | "right") => {
    localStorage.setItem("room_preferred_drawer", next);
    setDrawer(next);
  };

  const intensity = (n: number) => {
    if (n === 0) return "bg-secondary";
    const r = Math.min(1, n / goal);
    if (r < 0.25) return "bg-ember/20";
    if (r < 0.5) return "bg-ember/40";
    if (r < 0.85) return "bg-ember/65";
    return "bg-ember";
  };

  return (
    <main className="mx-auto max-w-6xl px-6 pb-24">
      {/* HEADER */}
      <section className="flex flex-col gap-5 pt-6 md:flex-row md:items-end md:justify-between">
        <div className="inline-flex w-fit rounded-full border border-border bg-card p-1">
          <button
            onClick={() => openDrawer("left")}
            className={`px-4 py-2 rounded-full ${
              drawer === "left" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Archive className="h-4 w-4 inline" /> Левый
          </button>

          <button
            onClick={() => openDrawer("right")}
            className={`px-4 py-2 rounded-full ${
              drawer === "right" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <BookOpen className="h-4 w-4 inline" /> Правый
          </button>
        </div>
      </section>

      {/* LEFT */}
      {drawer === "left" ? (
        <section className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* prompt */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs uppercase text-ember">Тема дня</p>

            <blockquote className="mt-4 text-3xl italic">
              «{prompt}»
            </blockquote>

            <button
              onClick={startWithPrompt}
              className="mt-6 rounded-full bg-ember px-5 py-2 text-white"
            >
              Начать
            </button>
          </div>

          {/* practice */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <Timer className="h-4 w-4 text-ember" />
            <h2 className="mt-4 text-2xl">{practice.title}</h2>
            <p className="mt-3 text-muted-foreground">{practice.prompt}</p>
          </div>
        </section>
      ) : (
        /* RIGHT */
        <section className="mt-10">
          <div className="flex justify-between items-end">
            <h2 className="text-4xl">Черновики</h2>
            <button onClick={newPost} className="bg-primary text-white px-4 py-2 rounded-full">
              Новый
            </button>
          </div>

          {loading ? (
            <p className="mt-8 text-muted-foreground">Загрузка…</p>
          ) : (
            <>
              <ul className="mt-6 divide-y">
                {posts.map((p) => (
                  <li key={p.id} className="py-5 flex justify-between">
                    <Link to="/write/$postId" params={{ postId: p.id }}>
                      <h3>{p.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {p.content.slice(0, 120)}
                      </p>
                    </Link>

                    <button onClick={() => deletePost(p.id)}>удалить</button>
                  </li>
                ))}
              </ul>

              {/* inspiration */}
              <div className="mt-8 rounded-2xl border p-6">
                <h3>{inspiration.title}</h3>
                <p>{inspiration.prompt}</p>

                <button onClick={shuffleInspiration}>ещё</button>
              </div>

              {/* stats */}
              <div className="mt-6 rounded-2xl border p-6">
                <div className="text-5xl">{streak}</div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {days.map((d) => {
                    const count = dayMap.get(d) ?? 0;

                    return (
                      <div
                        key={d}
                        className={`h-5 w-5 rounded-sm ${intensity(count)}`}
                        title={`${d} · ${count}`}
                      />
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </main>
  );
}
