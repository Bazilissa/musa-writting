import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { BookOpen, DoorOpen, Lightbulb } from "lucide-react";

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

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

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
      <section className="relative min-h-screen overflow-hidden paper-grain">
        <LandingRoomIllustration />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-7">
          <header className="flex items-center justify-between">
            <div className="font-display text-2xl tracking-tight">
              Комната <span className="italic text-ember">со столом</span>
            </div>
          </header>

          <div className="grid flex-1 gap-10 pb-[42vh] pt-12 lg:grid-cols-[0.72fr_0.48fr] lg:items-start lg:justify-between lg:pb-16">
            <section className="max-w-lg">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">
                Дверь приоткрыта
              </p>
              <h1 className="mt-5 font-display text-5xl font-light leading-[1.02] tracking-tight md:text-7xl">
                Пишите сегодня
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
                Справа лежат черновики и редактор. Слева - подсказки, цитаты, разминки и тихая мотивация на дни, когда основной рукописи лучше дать подышать.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openDesk}
                  className="inline-flex items-center gap-2 rounded-full bg-ember px-6 py-3 text-sm font-semibold text-accent-foreground shadow-sm transition hover:opacity-90"
                >
                  <DoorOpen className="h-4 w-4" /> Сесть за стол
                </button>
              </div>
            </section>
          </div>

          <button
            type="button"
            onClick={() => (user ? chooseDrawer("left") : setAuthOpen(true))}
            className="absolute bottom-[11%] left-[39%] h-[8%] w-[9%] rounded-md focus:outline-none focus:ring-2 focus:ring-ember/80"
            aria-label="Открыть левый ящик"
          />
          <button
            type="button"
            onClick={() => (user ? chooseDrawer("right") : setAuthOpen(true))}
            className="absolute bottom-[11%] left-[51%] h-[8%] w-[9%] rounded-md focus:outline-none focus:ring-2 focus:ring-ember/80"
            aria-label="Открыть правый ящик"
          />
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

function LandingRoomIllustration() {
  return (
    <svg
      className="pointer-events-none absolute bottom-[8vh] left-1/2 h-[68vh] w-[min(1180px,100vw)] -translate-x-1/2 text-ink opacity-75 lg:bottom-[4vh] lg:left-[58%] lg:h-[78vh] lg:w-[min(1240px,78vw)]"
      viewBox="0 0 1440 900"
      role="img"
      aria-label="Дверь в комнату: стол с лампой, пером и чернильницей, два ящика, кресло Диди и книжный шкаф"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <radialGradient id="lampGlow" cx="52%" cy="43%" r="34%">
          <stop offset="0%" stopColor="var(--ember)" stopOpacity="0.2" />
          <stop offset="58%" stopColor="var(--ember)" stopOpacity="0.07" />
          <stop offset="100%" stopColor="var(--ember)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="lineFade" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--ink)" stopOpacity="0.05" />
          <stop offset="48%" stopColor="var(--ink)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--ink)" stopOpacity="0.05" />
        </linearGradient>
      </defs>

      <rect width="1440" height="900" fill="transparent" />
      <circle cx="745" cy="410" r="330" fill="url(#lampGlow)" />
      <path d="M70 725 C320 684 594 688 822 716 C1040 742 1200 742 1392 712" fill="none" stroke="url(#lineFade)" strokeWidth="2" />

      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M198 720 V222 C198 126 280 70 383 70 H1010 C1114 70 1198 126 1198 222 V720" strokeWidth="2" opacity="0.5" />
        <path d="M228 720 V238 C228 160 300 104 392 104 H994 C1087 104 1168 160 1168 238 V720" strokeWidth="1.1" opacity="0.25" />
        <path d="M196 720 H1238" strokeWidth="1.6" opacity="0.32" />

        <g opacity="0.96">
          <path d="M470 584 C552 552 784 544 950 572 C974 576 990 590 994 609 C866 625 634 626 470 607 C468 598 468 591 470 584Z" strokeWidth="2.1" />
          <path d="M505 608 H950 V756 H518 V620" strokeWidth="1.8" />
          <path d="M564 645 H703 V718 H564Z" strokeWidth="1.5" />
          <path d="M760 645 H900 V718 H760Z" strokeWidth="1.5" />
          <path d="M633 681 H642" strokeWidth="5" stroke="var(--ember)" />
          <path d="M828 681 H837" strokeWidth="5" stroke="var(--ember)" />
          <path d="M558 756 V828 M916 756 V828" strokeWidth="5" opacity="0.55" />
        </g>

        <g>
          <path d="M721 560 V418" strokeWidth="4" opacity="0.6" />
          <path d="M660 344 H784 L754 417 H690Z" strokeWidth="1.8" stroke="var(--ember)" />
          <path d="M694 560 C710 568 744 568 760 560" strokeWidth="8" opacity="0.36" />
          <path d="M682 428 C704 442 740 442 762 428" strokeWidth="1" stroke="var(--ember)" opacity="0.55" />
        </g>

        <g>
          <ellipse cx="850" cy="548" rx="27" ry="19" strokeWidth="1.8" />
          <path d="M833 547 C843 538 858 537 868 547" strokeWidth="3" stroke="var(--ember)" />
          <path d="M849 536 C866 493 891 456 928 421" strokeWidth="2.2" />
          <path d="M861 503 C884 473 908 454 940 437" strokeWidth="11" opacity="0.18" />
          <path d="M856 510 C879 480 905 456 940 437 C929 468 902 495 864 518" strokeWidth="1.2" />
          <path d="M850 536 L934 431" strokeWidth="1" stroke="var(--ember)" opacity="0.75" />
        </g>

        <g opacity="0.86">
          <path d="M1044 738 V642 C1044 576 1093 532 1140 532 C1188 532 1236 576 1236 642 V738" strokeWidth="1.8" />
          <path d="M1072 681 C1090 646 1192 646 1210 681" strokeWidth="1.5" stroke="var(--ember)" opacity="0.55" />
          <path d="M1074 738 H1208 M1092 738 V803 M1190 738 V803" strokeWidth="4" opacity="0.42" />
        </g>

        <g opacity="0.78">
          <path d="M1238 255 H1418 V745 H1238" strokeWidth="1.8" />
          <path d="M1238 332 H1418 M1238 430 H1418 M1238 531 H1418 M1238 633 H1418" strokeWidth="1.2" opacity="0.55" />
          {[
            [1260, 278, 18, 48], [1290, 282, 16, 43], [1320, 272, 20, 54], [1362, 286, 17, 38], [1390, 275, 16, 50],
            [1256, 356, 18, 59], [1288, 350, 16, 64], [1322, 370, 20, 43], [1353, 361, 17, 52], [1388, 348, 19, 66],
            [1263, 454, 18, 62], [1295, 455, 18, 61], [1328, 448, 18, 69], [1368, 470, 18, 47], [1400, 452, 16, 64],
            [1260, 559, 18, 60], [1295, 550, 17, 68], [1326, 566, 17, 52], [1364, 558, 18, 61], [1396, 551, 17, 67],
            [1264, 658, 16, 57], [1290, 665, 18, 50], [1320, 654, 18, 62], [1354, 662, 16, 53], [1390, 651, 18, 66],
          ].map(([x, y, w, h], index) => (
            <path key={index} d={`M${x} ${y} V${y + h} H${x + w} V${y}`} strokeWidth="1" stroke={index % 3 === 0 ? "var(--ember)" : "currentColor"} opacity={index % 3 === 0 ? 0.7 : 0.42} />
          ))}
        </g>
      </g>
    </svg>
  );
}
