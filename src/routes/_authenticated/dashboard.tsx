import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getDailyPrompt } from "@/lib/prompts";
import { calcStreak, lastNDays, todayKey, type DailyStat } from "@/lib/streak";
import { toast } from "sonner";
import { Plus, Flame, Target, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Desk · Inkwell" }] }),
  component: Dashboard,
});

type Post = { id: string; title: string; content: string; word_count: number; updated_at: string };

const DEFAULT_GOAL = 200;

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState<DailyStat[]>([]);
  const [goal, setGoal] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_GOAL;
    return Number(localStorage.getItem("inkwell_goal") || DEFAULT_GOAL);
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, s] = await Promise.all([
        supabase.from("posts").select("id,title,content,word_count,updated_at").order("updated_at", { ascending: false }),
        supabase.from("daily_stats").select("day,words_written").gte("day", lastNDays(60)[0]),
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
  const days = lastNDays(35);
  const dayMap = new Map(stats.map((s) => [s.day, s.words_written]));
  const prompt = getDailyPrompt();

  const newPost = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("posts")
      .insert({ user_id: user.id, title: "Untitled", content: "" })
      .select()
      .single();
    if (error) return toast.error(error.message);
    navigate({ to: "/write/$postId", params: { postId: data.id } });
  };

  const startWithPrompt = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("posts")
      .insert({ user_id: user.id, title: prompt.slice(0, 60), content: `> ${prompt}\n\n` })
      .select()
      .single();
    if (error) return toast.error(error.message);
    navigate({ to: "/write/$postId", params: { postId: data.id } });
  };

  const deletePost = async (id: string) => {
    if (!confirm("Delete this draft permanently?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setPosts(posts.filter((p) => p.id !== id));
    toast.success("Draft removed.");
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
      <section className="grid gap-6 pt-6 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-ember" /> Streak
          </div>
          <div className="mt-3 font-display text-5xl font-light">
            {streak}
            <span className="ml-2 text-base italic text-muted-foreground">days</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Days in a row you hit your goal.</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <Target className="h-3.5 w-3.5 text-ember" /> Today
          </div>
          <div className="mt-3 font-display text-5xl font-light">
            {today}
            <span className="ml-2 text-base italic text-muted-foreground">/ {goal} words</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-ember transition-all" style={{ width: `${goalPct}%` }} />
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Goal</span>
            <input
              type="number" min={50} step={50} value={goal}
              onChange={(e) => setGoal(Math.max(50, Number(e.target.value) || DEFAULT_GOAL))}
              className="w-20 rounded border border-border bg-transparent px-2 py-1 font-mono"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5 text-ember" /> Drafts
          </div>
          <div className="mt-3 font-display text-5xl font-light">{posts.length}</div>
          <p className="mt-2 text-sm text-muted-foreground">Pieces in your desk drawer.</p>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-border bg-card p-6">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">Today's prompt</p>
        <blockquote className="mt-3 font-display text-2xl font-light italic leading-snug md:text-3xl">
          “{prompt}”
        </blockquote>
        <button
          onClick={startWithPrompt}
          className="mt-5 rounded-full bg-ember px-5 py-2 text-sm font-medium text-accent-foreground transition hover:opacity-90"
        >
          Write from this prompt
        </button>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg">Last 35 days</h2>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {days.map((d) => {
            const count = dayMap.get(d) ?? 0;
            return (
              <div
                key={d}
                title={`${d} · ${count} words`}
                className={`h-5 w-5 rounded-sm ${intensity(count)} ring-1 ring-border/40`}
              />
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-3xl font-light">Your drafts</h2>
          <button
            onClick={newPost}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New piece
          </button>
        </div>

        {loading ? (
          <p className="mt-8 text-sm italic text-muted-foreground">Opening the drawer…</p>
        ) : posts.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-border p-12 text-center">
            <p className="font-display text-2xl italic text-muted-foreground">An empty desk.</p>
            <p className="mt-2 text-sm text-muted-foreground">Begin a new piece, or write from today's prompt.</p>
          </div>
        ) : (
          <ul className="mt-6 divide-y divide-border">
            {posts.map((p) => (
              <li key={p.id} className="group flex items-center justify-between py-5">
                <Link
                  to="/write/$postId" params={{ postId: p.id }}
                  className="flex-1"
                >
                  <h3 className="font-display text-2xl font-light transition group-hover:text-ember">
                    {p.title || "Untitled"}
                  </h3>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {p.content.replace(/[#>*_`]/g, "").slice(0, 140) || "—"}
                  </p>
                </Link>
                <div className="ml-6 hidden items-center gap-6 text-xs text-muted-foreground md:flex">
                  <span className="font-mono">{p.word_count} words</span>
                  <span className="italic">{new Date(p.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
                  <button onClick={() => deletePost(p.id)} className="text-muted-foreground/60 hover:text-destructive">
                    delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
