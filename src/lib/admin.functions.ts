import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function ensureAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);

    // Total visits
    const { count: totalVisits } = await supabaseAdmin
      .from("site_visits")
      .select("*", { count: "exact", head: true });

    // All visits for daily aggregation
    const since = new Date();
    since.setDate(since.getDate() - 29);
    const { data: visits } = await supabaseAdmin
      .from("site_visits")
      .select("visitor_id, created_at")
      .gte("created_at", since.toISOString());

    const dailyMap = new Map<string, Set<string>>();
    const dailyTotalMap = new Map<string, number>();
    (visits ?? []).forEach((v) => {
      const day = new Date(v.created_at).toISOString().slice(0, 10);
      if (!dailyMap.has(day)) dailyMap.set(day, new Set());
      dailyMap.get(day)!.add(v.visitor_id);
      dailyTotalMap.set(day, (dailyTotalMap.get(day) ?? 0) + 1);
    });
    const daily = Array.from(dailyMap.entries())
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([day, set]) => ({
        day,
        unique: set.size,
        total: dailyTotalMap.get(day) ?? 0,
      }));

    // Total unique visitors all-time
    const { data: allVisitors } = await supabaseAdmin
      .from("site_visits")
      .select("visitor_id");
    const uniqueAllTime = new Set((allVisitors ?? []).map((v) => v.visitor_id)).size;

    // Accounts
    const { data: usersList, error: usersError } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (usersError) throw new Error(usersError.message);
    const accounts = usersList.users.map((u) => ({
      id: u.id,
      email: u.email ?? "—",
      created_at: u.created_at,
    }));

    // Drafts per user
    const { data: posts } = await supabaseAdmin
      .from("posts")
      .select("user_id");
    const draftsMap = new Map<string, number>();
    (posts ?? []).forEach((p) => {
      draftsMap.set(p.user_id, (draftsMap.get(p.user_id) ?? 0) + 1);
    });

    const users = accounts.map((a) => ({
      ...a,
      drafts: draftsMap.get(a.id) ?? 0,
    }));

    return {
      totalVisits: totalVisits ?? 0,
      uniqueAllTime,
      accountsCount: accounts.length,
      daily,
      users,
    };
  });
