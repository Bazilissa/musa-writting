import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getDailyPrompt } from "@/lib/prompts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inkwell — A daily writing studio" },
      { name: "description", content: "A quiet place to write, rewrite and share. Daily prompts, streaks and a calm editor for writers." },
      { property: "og:title", content: "Inkwell — A daily writing studio" },
      { property: "og:description", content: "Write every day. Share what's worth sharing." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const prompt = getDailyPrompt();

  return (
    <main className="min-h-screen bg-background paper-grain">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-8">
        <div className="font-display text-2xl tracking-tight">
          Ink<span className="italic text-ember">well</span>
        </div>
        <Link
          to="/auth"
          className="rounded-full border border-border px-5 py-2 text-sm font-medium transition hover:bg-secondary"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-20 pb-24 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          A studio for writers
        </p>
        <h1 className="mt-6 font-display text-6xl font-light leading-[1.05] tracking-tight text-foreground md:text-8xl">
          Write today.
          <span className="block italic text-ember">Rewrite tomorrow.</span>
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          A calm, distraction-free editor with a daily prompt and a gentle streak —
          built to make showing up the easy part.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/auth"
            className="rounded-full bg-primary px-7 py-3 text-base font-medium text-primary-foreground transition hover:opacity-90"
          >
            Begin writing
          </Link>
          <a href="#today" className="text-sm italic text-muted-foreground underline-offset-4 hover:underline">
            see today's prompt
          </a>
        </div>
      </section>

      <div className="rule mx-auto max-w-3xl" />

      <section id="today" className="mx-auto max-w-3xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">Today's prompt</p>
        <blockquote className="mt-6 font-display text-3xl font-light italic leading-snug text-foreground md:text-4xl">
          “{prompt}”
        </blockquote>
        <p className="mt-6 text-sm text-muted-foreground">
          A new prompt arrives every morning. No pressure — write a sentence or a thousand.
        </p>
      </section>

      <div className="rule mx-auto max-w-3xl" />

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-3">
        {[
          { k: "01", t: "A quiet editor", d: "Serif type, generous margins. Just you and the sentence." },
          { k: "02", t: "Daily ritual", d: "Streaks, a daily prompt and a small word goal you set." },
          { k: "03", t: "Share when ready", d: "Export any draft to Markdown or copy it polished to your clipboard." },
        ].map((f) => (
          <div key={f.k}>
            <div className="font-mono text-xs text-ember">{f.k}</div>
            <h3 className="mt-3 font-display text-2xl">{f.t}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-muted-foreground">
        Inkwell · made for the long, slow craft.
      </footer>
    </main>
  );
}
