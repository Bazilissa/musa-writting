import { supabase } from "@/integrations/supabase/client";

const KEY = "muza_visitor_id";
const SESSION_KEY = "muza_visit_logged";

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}

export async function trackVisit(path: string) {
  if (typeof window === "undefined") return;
  // throttle: one log per tab session per path
  const tag = `${SESSION_KEY}:${path}`;
  if (sessionStorage.getItem(tag)) return;
  sessionStorage.setItem(tag, "1");

  const visitor_id = getVisitorId();
  const { data } = await supabase.auth.getSession();
  await supabase.from("site_visits").insert({
    visitor_id,
    user_id: data.session?.user.id ?? null,
    path,
    user_agent: navigator.userAgent.slice(0, 500),
  });
}
