import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ArrowLeft, Clock, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "История сессий · Комната со столом" }] }),
  component: HistoryPage,
});

type Session = {
  id: string;
  post_id: string;
  started_at: string;
  ended_at: string | null;
  words_written: number;
  posts: { title: string } | null;
};

function fmtDuration(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const m = Math.max(1, Math.round(ms / 60000));
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  return `${h} ч ${m % 60} мин`;
}

function HistoryPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("writing_sessions")
        .select("id,post_id,started_at,ended_at,words_written,posts(title)")
        .order("started_at", { ascending: false })
        .limit(100);
      if (data) setSessions(data as unknown as Session[]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <main className="mx-auto max-w-4xl px-6 pb-24 pt-6">
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Стол
      </Link>
      <h1 className="mt-6 font-display text-4xl font-light">История сессий</h1>
      <p className="mt-2 text-sm italic text-muted-foreground">
        Каждая запись — один заход за стол. Здесь видно, сколько слов вы прибавили и в какой текст.
      </p>

      {loading ? (
        <p className="mt-10 text-sm italic text-muted-foreground">Перелистываем дневник…</p>
      ) : sessions.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="font-display text-2xl italic text-muted-foreground">Пока ни одной сессии.</p>
          <p className="mt-2 text-sm text-muted-foreground">Откройте любой черновик и начните писать — здесь появится запись.</p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-border">
          {sessions.map((s) => (
            <li key={s.id} className="flex items-center justify-between py-4">
              <Link to="/write/$postId" params={{ postId: s.post_id }} className="flex-1">
                <h3 className="font-display text-xl font-light transition hover:text-ember">
                  {s.posts?.title || "Без названия"}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{new Date(s.started_at).toLocaleString("ru-RU", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtDuration(s.started_at, s.ended_at)}</span>
                  <span className="inline-flex items-center gap-1 font-mono"><BookOpen className="h-3 w-3" /> +{s.words_written} сл.</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
