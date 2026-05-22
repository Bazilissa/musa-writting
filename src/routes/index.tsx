import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getDailyPrompt } from "@/lib/prompts";
import { toast } from "sonner";
import { BookOpen, DoorOpen, Feather, Flame, Lightbulb, PenLine, Sparkles } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Комната со столом" },
      { name: "description", content: "Дверь в тихую комнату для письма: стол, два ящика, подсказки, черновики и Добрый Друг Диди." },
      { property: "og:title", content: "Комната со столом" },
      { property: "og:description", content: "Сядьте за стол, выберите левый или правый ящик и возвращайтесь к письму без давления." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: PenLine, title: "Правый ящик", text: "Черновики, редактор, экспорт и Диди рядом с текстом." },
  { icon: Sparkles, title: "Левый ящик", text: "Подсказки дня, случайные темы, цитаты и короткие разминки." },
  { icon: Flame, title: "Тихая статистика", text: "Серия дней и слова за неделю без гонки и наказаний." },
];

const writerQuotes = [
  "Писать можно тихо. Главное - вернуться.",
  "Одна ясная строка уже держит дверь открытой.",
  "Ремесло любит маленькие повторения.",
];

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [didiOpen, setDidiOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const prompt = getDailyPrompt();
  const quote = writerQuotes[new Date().getDate() % writerQuotes.length];

  useEffect(() => {
    if (!loading && user) setAuthOpen(false);
  }, [user, loading]);

  const chooseDrawer = (drawer: "left" | "right") => {
    localStorage.setItem("room_preferred_drawer", drawer);
    navigate({ to: "/dashboard" });
  };

  const openDesk = () => {
    if (user) {
      setAuthOpen(false);
      return;
    }
    setAuthOpen(true);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Добро пожаловать. Можно выбрать ящик.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Не получилось войти");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="relative min-h-screen overflow-hidden">
        <div className="absolute inset-0 room-door-scene" aria-hidden="true">
          <div className="room-door" />
          <div className="room-bookcase" />
          <div className="room-chair" />
          <div className="room-desk">
            <div className="room-lamp" />
            <div className="room-inkwell" />
            <div className="room-feather" />
            <div className="room-drawer room-drawer-left" />
            <div className="room-drawer room-drawer-right" />
          </div>
          <div className="room-floor-shadow" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-7">
          <header className="flex items-center justify-between">
            <div className="font-display text-2xl tracking-tight">
              Комната <span className="italic text-ember">со столом</span>
            </div>
            <button
              type="button"
              onClick={openDesk}
              className="rounded-full border border-paper/40 bg-paper/20 px-5 py-2 text-sm font-medium text-paper shadow-sm backdrop-blur transition hover:bg-paper/30"
            >
              Сесть за стол
            </button>
          </header>

          <div className="grid flex-1 items-end gap-10 pb-8 pt-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <section className="max-w-xl text-paper drop-shadow">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-paper/75">
                Дверь приоткрыта
              </p>
              <h1 className="mt-5 font-display text-5xl font-light leading-[1.02] tracking-tight md:text-7xl">
                Сядьте за стол, когда строка позовёт.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-paper/82">
                Справа лежат черновики и редактор. Слева - подсказки, цитаты, разминки и тихая мотивация на дни, когда основной рукописи лучше дать подышать.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openDesk}
                  className="inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-sm font-semibold text-ink shadow-xl transition hover:opacity-90"
                >
                  <DoorOpen className="h-4 w-4" /> Сесть за стол
                </button>
                <button
                  type="button"
                  onClick={() => setDidiOpen((current) => !current)}
                  className="rounded-full border border-paper/45 bg-paper/15 px-5 py-3 text-sm text-paper backdrop-blur transition hover:bg-paper/25"
                >
                  Кресло Доброго Друга
                </button>
              </div>
            </section>

            <section className="ml-auto w-full max-w-md text-paper">
              <div className="grid gap-3">
                {features.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="border-b border-paper/25 pb-4">
                    <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] text-paper/70">
                      <Icon className="h-3.5 w-3.5" /> {title}
                    </div>
                    <p className="mt-2 text-base leading-relaxed text-paper/85">{text}</p>
                  </div>
                ))}
              </div>
              <blockquote className="mt-6 font-display text-2xl font-light italic leading-snug">
                «{quote}»
              </blockquote>
            </section>
          </div>

          <button
            type="button"
            onClick={() => setDidiOpen((current) => !current)}
            className="absolute bottom-[22%] right-[21%] h-[25%] w-[13%] rounded-[45%] focus:outline-none focus:ring-2 focus:ring-paper/80"
            aria-label="Узнать, кто такой Диди"
          />
          <button
            type="button"
            onClick={() => (user ? chooseDrawer("left") : setAuthOpen(true))}
            className="absolute bottom-[16%] left-[47%] h-[8%] w-[9%] rounded-md focus:outline-none focus:ring-2 focus:ring-paper/80"
            aria-label="Открыть левый ящик"
          />
          <button
            type="button"
            onClick={() => (user ? chooseDrawer("right") : setAuthOpen(true))}
            className="absolute bottom-[16%] left-[56%] h-[8%] w-[9%] rounded-md focus:outline-none focus:ring-2 focus:ring-paper/80"
            aria-label="Открыть правый ящик"
          />

          {didiOpen ? (
            <aside className="absolute bottom-[18%] right-[7%] z-20 w-[min(330px,calc(100vw-2rem))] rounded-[1.5rem] border border-paper/30 bg-paper/92 p-5 text-ink shadow-2xl backdrop-blur">
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-ember">Добрый Друг</p>
              <h2 className="mt-2 font-display text-3xl font-light">Диди сидит рядом.</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Он не оценивает и не переписывает за вас. Диди слушает фрагмент, замечает ритм, напряжение или недосказанность и задаёт короткий вопрос, который помогает вернуться к собственному голосу.
              </p>
            </aside>
          ) : null}
        </div>
      </section>

      {authOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-4 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-ember">Вход в комнату</p>
                <h2 className="mt-2 font-display text-4xl font-light">
                  {mode === "signin" ? "С возвращением." : "Поставим стол."}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setAuthOpen(false)}
                className="rounded-full px-3 py-1 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                закрыть
              </button>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Почта</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="mt-2 w-full border-0 border-b border-border bg-transparent py-2 text-lg font-serif focus:border-ember focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Пароль</span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="mt-2 w-full border-0 border-b border-border bg-transparent py-2 text-lg font-serif focus:border-ember focus:outline-none"
                />
              </label>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "…" : mode === "signin" ? "Войти" : "Создать аккаунт"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-5 w-full text-center text-sm italic text-muted-foreground underline-offset-4 hover:underline"
            >
              {mode === "signin" ? "Ещё нет аккаунта? Создайте." : "Уже есть аккаунт? Войдите."}
            </button>
          </section>
        </div>
      ) : null}

      {user && !authOpen ? (
        <div className="fixed inset-x-0 bottom-5 z-40 mx-auto w-[min(720px,calc(100vw-2rem))] rounded-full border border-border bg-card/95 px-4 py-3 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-muted-foreground">Выберите ящик перед тем, как сесть.</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => chooseDrawer("left")}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm transition hover:bg-secondary sm:flex-none"
              >
                <Lightbulb className="h-4 w-4 text-ember" /> Левый
              </button>
              <button
                type="button"
                onClick={() => chooseDrawer("right")}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground transition hover:opacity-90 sm:flex-none"
              >
                <BookOpen className="h-4 w-4" /> Правый
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
