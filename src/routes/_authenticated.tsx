import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">загрузка…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background paper-grain">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/dashboard" className="font-display text-xl tracking-tight">
          Му<span className="italic text-ember">за</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            Стол
          </Link>
          <button onClick={() => signOut()} className="italic text-muted-foreground hover:text-foreground">
            Выйти
          </button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
