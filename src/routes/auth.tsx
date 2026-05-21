import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { RoomLogo } from "@/components/RoomLogo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вход · Комната со столом" },
      { name: "description", content: "Войдите или создайте аккаунт в Комнате со столом." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + "/dashboard" },
        });
        if (error) throw error;
        toast.success("Добро пожаловать. Вы вошли.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Что-то пошло не так");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background paper-grain">
      <header className="mx-auto w-full max-w-6xl px-6 py-6">
        <Link to="/" className="flex items-center gap-2">
          <RoomLogo className="h-10 w-10" compact />
          <span className="font-display text-xl tracking-tight">
            Комната <span className="italic text-ember">со столом</span>
          </span>
        </Link>
      </header>
      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-10 px-6 pb-16 pt-6 md:grid-cols-[1.05fr_0.95fr] md:items-center">
        <section className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-border/70 bg-card/45 p-8 shadow-sm md:min-h-[560px] md:p-10">
          <div className="absolute inset-0 opacity-60">
            <svg viewBox="0 0 620 560" className="h-full w-full" aria-hidden="true">
              <path d="M92 112h220v150H92z" fill="none" stroke="var(--border)" strokeWidth="2" />
              <path d="M92 184h220M202 112v150" stroke="var(--border)" strokeWidth="1.5" />
              <path d="M78 360h470" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
              <path d="M130 360v96M492 360v96" stroke="var(--border)" strokeWidth="3" strokeLinecap="round" />
              <path d="M190 318h190" stroke="var(--ember)" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
              <path d="M392 304c28-34 82-34 110 0" fill="none" stroke="var(--border)" strokeWidth="2" />
              <path d="M447 304v54" stroke="var(--border)" strokeWidth="2" />
            </svg>
          </div>

          <div className="relative flex h-full flex-col justify-between">
            <div>
              <RoomLogo className="h-28 w-28 md:h-36 md:w-36" />
              <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-ember">Внутри тихо</p>
              <h1 className="mt-4 max-w-md font-display text-5xl font-light leading-tight tracking-tight md:text-6xl">
                Место, где текст можно оставить на столе.
              </h1>
            </div>

            <div className="mt-12 max-w-md text-lg leading-relaxed text-muted-foreground">
              <p>
                Диди не проверяет и не оценивает. Он приходит ненадолго, чтобы заметить ритм,
                напряжение или недосказанность в выбранном фрагменте.
              </p>
              <p className="mt-5 italic">
                Иногда одного мягкого вопроса достаточно, чтобы продолжить.
              </p>
            </div>
          </div>
        </section>

        <section className="flex justify-center md:justify-end">
          <div className="w-full max-w-sm">
            <h2 className="font-display text-4xl font-light tracking-tight">
              {mode === "signin" ? "С возвращением." : "Поставим стол."}
            </h2>
            <p className="mt-2 text-sm italic text-muted-foreground">
              {mode === "signin" ? "Ваши черновики ждут там, где вы их оставили." : "Создадим тихое место для ваших текстов."}
            </p>

            <form onSubmit={submit} className="mt-8 space-y-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Почта</label>
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full border-0 border-b border-border bg-transparent py-2 text-lg font-serif focus:border-ember focus:outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Пароль</label>
                <input
                  type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full border-0 border-b border-border bg-transparent py-2 text-lg font-serif focus:border-ember focus:outline-none"
                />
              </div>
              <button
                type="submit" disabled={busy}
                className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "…" : mode === "signin" ? "Войти" : "Создать аккаунт"}
              </button>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              className="mt-6 w-full text-center text-sm italic text-muted-foreground underline-offset-4 hover:underline"
            >
              {mode === "signin" ? "Ещё нет аккаунта? Создайте." : "Уже есть аккаунт? Войдите."}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
