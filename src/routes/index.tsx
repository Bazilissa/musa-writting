import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { getDailyPrompt } from "@/lib/prompts";
import { RoomLogo } from "@/components/RoomLogo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Комната со столом" },
      { name: "description", content: "Тихое место для письма: стол, черновики, ежедневные подсказки и Добрый Друг Диди, которого можно позвать к тексту." },
      { property: "og:title", content: "Комната со столом" },
      { property: "og:description", content: "Пишите в тихой комнате. Иногда зовите Диди." },
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
          <RoomLogo className="h-11 w-11" compact />
          <span className="font-display text-2xl tracking-tight">
            Комната <span className="italic text-ember">со столом</span>
          </span>
        </Link>
        <Link
          to="/auth"
          className="rounded-full border border-border px-5 py-2 text-sm font-medium transition hover:bg-secondary"
        >
          Войти
        </Link>
      </header>

      <section className="mx-auto max-w-4xl px-6 pt-8 pb-20 text-center">
        <RoomLogo className="mx-auto mb-10 h-44 w-44 md:h-56 md:w-56" />
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Тихое место для письма
        </p>
        <h1 className="mt-6 font-display text-6xl font-light leading-[1.05] tracking-tight text-foreground md:text-8xl">
          Комната
          <span className="block italic text-ember">со столом</span>
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          Место, где текст можно оставить на столе, вернуться к нему завтра и иногда позвать Диди —
          Доброго Друга, который слушает фрагмент, не перехватывая авторский голос.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            to="/auth"
            className="rounded-full bg-primary px-7 py-3 text-base font-medium text-primary-foreground transition hover:opacity-90"
          >
            Войти в комнату
          </Link>
          <a href="#didi" className="text-sm italic text-muted-foreground underline-offset-4 hover:underline">
            кто такой Диди
          </a>
        </div>
      </section>

      <div className="rule mx-auto max-w-3xl" />

      <section id="didi" className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-[0.85fr_1.15fr] md:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">Добрый Друг</p>
          <h2 className="mt-4 font-display text-4xl font-light leading-tight md:text-5xl">
            Диди приходит ненадолго.
          </h2>
        </div>
        <div className="text-lg leading-relaxed text-muted-foreground">
          <p>
            Диди не редактирует и не сочиняет вместо вас. Он замечает напряжение,
            ритм, недосказанность и задаёт маленький вопрос, от которого текст становится слышнее.
          </p>
          <p className="mt-5">
            Его можно позвать к выделенному фрагменту или ко всему черновику. Через минуту облачко тает,
            как мысль, которую уже можно унести обратно за стол.
          </p>
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
          { k: "01", t: "Стол", d: "Черновики лежат спокойно: можно открыть любой текст и продолжить без лишнего шума." },
          { k: "02", t: "Диди", d: "Добрый Друг отвечает коротко, не переписывает фразы и не превращает письмо в урок." },
          { k: "03", t: "Ритуал", d: "Подсказки, серия дней и экспорт в Word помогают возвращаться к письму без давления." },
        ].map((f) => (
          <div key={f.k}>
            <div className="font-mono text-xs text-ember">{f.k}</div>
            <h3 className="mt-3 font-display text-2xl">{f.t}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="mx-auto max-w-6xl px-6 py-10 text-center text-xs text-muted-foreground">
        Комната со столом · для долгого, неспешного ремесла.
      </footer>
    </main>
  );
}
