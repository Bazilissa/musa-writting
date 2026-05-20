import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getDailyPrompt } from "@/lib/prompts";
import muzaLogo from "@/assets/muza-logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Муза — студия для ежедневного письма" },
      { name: "description", content: "Тихое место, чтобы писать, переписывать и делиться. Ежедневные подсказки, серии и спокойный редактор для писателей." },
      { property: "og:title", content: "Муза — студия для ежедневного письма" },
      { property: "og:description", content: "Пишите каждый день. Делитесь тем, что стоит того." },
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
        <Link to="/" className="flex items-center gap-2">
          <img src={muzaLogo} alt="Муза" className="h-10 w-10 object-contain" />
          <span className="font-display text-2xl tracking-tight">
            Му<span className="italic text-ember">за</span>
          </span>
        </Link>
        <Link
          to="/auth"
          className="rounded-full border border-border px-5 py-2 text-sm font-medium transition hover:bg-secondary"
        >
          Войти
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-12 pb-24 text-center">
        <img src={muzaLogo} alt="Муза — логотип" className="mx-auto mb-8 h-48 w-48 object-contain md:h-64 md:w-64" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Студия для писателей
        </p>
        <h1 className="mt-6 font-display text-6xl font-light leading-[1.05] tracking-tight text-foreground md:text-8xl">
          Пишите сегодня.
          <span className="block italic text-ember">Переписывайте завтра.</span>
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Спокойный редактор без отвлечений с ежедневной подсказкой и мягкой серией —
          чтобы появляться за столом было легко.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/auth"
            className="rounded-full bg-primary px-7 py-3 text-base font-medium text-primary-foreground transition hover:opacity-90"
          >
            Начать писать
          </Link>
          <a href="#today" className="text-sm italic text-muted-foreground underline-offset-4 hover:underline">
            подсказка дня
          </a>
        </div>
      </section>

      <div className="rule mx-auto max-w-3xl" />

      <section id="today" className="mx-auto max-w-3xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">Подсказка дня</p>
        <blockquote className="mt-6 font-display text-3xl font-light italic leading-snug text-foreground md:text-4xl">
          «{prompt}»
        </blockquote>
        <p className="mt-6 text-sm text-muted-foreground">
          Каждое утро приходит новая подсказка. Без давления — напишите одно предложение или тысячу.
        </p>
      </section>

      <div className="rule mx-auto max-w-3xl" />

      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-3">
        {[
          { k: "01", t: "Тихий редактор", d: "Серифный шрифт, щедрые поля. Только вы и предложение." },
          { k: "02", t: "Ежедневный ритуал", d: "Серии, подсказка дня и небольшая цель по словам, которую задаёте вы." },
          { k: "03", t: "Делитесь, когда готовы", d: "Экспортируйте любой черновик в Markdown или Word — или скопируйте в буфер." },
        ].map((f) => (
          <div key={f.k}>
            <div className="font-mono text-xs text-ember">{f.k}</div>
            <h3 className="mt-3 font-display text-2xl">{f.t}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-muted-foreground">
        Муза · для долгого, неспешного ремесла.
      </footer>
    </main>
  );
}
