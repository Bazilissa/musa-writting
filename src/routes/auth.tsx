import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Inkwell" },
      { name: "description", content: "Sign in or create your Inkwell writing account." },
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
        toast.success("Welcome. You're signed in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-background paper-grain flex flex-col">
      <header className="mx-auto w-full max-w-6xl px-6 py-8">
        <Link to="/" className="font-display text-xl tracking-tight">
          Ink<span className="italic text-ember">well</span>
        </Link>
      </header>
      <div className="flex flex-1 items-center justify-center px-6 pb-20">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-4xl font-light tracking-tight">
            {mode === "signin" ? "Welcome back." : "Begin writing."}
          </h1>
          <p className="mt-2 text-sm italic text-muted-foreground">
            {mode === "signin" ? "Pick up where you left the sentence." : "A page is waiting."}
          </p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Email</label>
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full border-0 border-b border-border bg-transparent py-2 text-lg font-serif focus:border-ember focus:outline-none"
              />
            </div>
            <div>
              <label className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Password</label>
              <input
                type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full border-0 border-b border-border bg-transparent py-2 text-lg font-serif focus:border-ember focus:outline-none"
              />
            </div>
            <button
              type="submit" disabled={busy}
              className="mt-6 w-full rounded-full bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-center text-sm italic text-muted-foreground underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "No account yet? Create one." : "Already have an account? Sign in."}
          </button>
        </div>
      </div>
    </main>
  );
}
