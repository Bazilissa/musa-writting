import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAdminStats } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

function AdminPage() {
  const fetchStats = useServerFn(getAdminStats);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(),
  });

  if (isLoading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
          загрузка статистики…
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="font-display text-3xl">Админка</h1>
        <p className="mt-4 text-sm text-destructive">
          {(error as Error).message}
        </p>
        <p className="mt-2 text-sm text-muted-foreground italic">
          Доступ только для администраторов.
        </p>
      </main>
    );
  }

  if (!data) return null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-10">
      <header>
        <h1 className="font-display text-3xl tracking-tight">Админка</h1>
        <p className="mt-1 text-sm text-muted-foreground italic">
          Тихая комната за стеклом — сюда видно, кто заходил и что писал.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Всего посещений" value={data.totalVisits} />
        <StatCard label="Уникальных посетителей" value={data.uniqueAllTime} />
        <StatCard label="Аккаунтов" value={data.accountsCount} />
      </section>

      <section>
        <h2 className="font-display text-xl mb-3">Посетители по дням (30 дней)</h2>
        <div className="rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-normal">День</th>
                <th className="px-4 py-2 font-normal">Уникальных</th>
                <th className="px-4 py-2 font-normal">Всего визитов</th>
              </tr>
            </thead>
            <tbody>
              {data.daily.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-muted-foreground italic">
                    Пока тишина.
                  </td>
                </tr>
              )}
              {data.daily.map((d) => (
                <tr key={d.day} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono">{d.day}</td>
                  <td className="px-4 py-2">{d.unique}</td>
                  <td className="px-4 py-2 text-muted-foreground">{d.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl mb-3">Пользователи и черновики</h2>
        <div className="rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-normal">Email</th>
                <th className="px-4 py-2 font-normal">Регистрация</th>
                <th className="px-4 py-2 font-normal">Черновиков</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2 font-mono text-muted-foreground">
                    {new Date(u.created_at).toISOString().slice(0, 10)}
                  </td>
                  <td className="px-4 py-2">{u.drafts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <div className="mt-2 font-display text-4xl">{value}</div>
    </div>
  );
}
