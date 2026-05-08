import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { countWords, todayKey } from "@/lib/streak";
import { toast } from "sonner";
import { ArrowLeft, Download, Copy, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/write/$postId")({
  head: () => ({ meta: [{ title: "Writing · Inkwell" }] }),
  component: Editor,
});

function Editor() {
  const { postId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const lastSaved = useRef({ title: "", content: "" });
  const baseWords = useRef(0);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("title,content,word_count")
        .eq("id", postId)
        .single();
      if (error) {
        toast.error(error.message);
        navigate({ to: "/dashboard" });
        return;
      }
      setTitle(data.title);
      setContent(data.content);
      lastSaved.current = { title: data.title, content: data.content };
      baseWords.current = data.word_count;
      setLoaded(true);
    })();
  }, [postId, navigate]);

  const save = useCallback(async () => {
    if (!user) return;
    if (title === lastSaved.current.title && content === lastSaved.current.content) return;
    setSaving("saving");
    const wc = countWords(content);
    const { error } = await supabase
      .from("posts")
      .update({ title: title || "Untitled", content, word_count: wc })
      .eq("id", postId);
    if (error) {
      toast.error(error.message);
      setSaving("idle");
      return;
    }

    // Update daily stats: add the delta of words written this session
    const delta = Math.max(0, wc - baseWords.current);
    if (delta > 0) {
      const day = todayKey();
      const { data: existing } = await supabase
        .from("daily_stats").select("words_written").eq("day", day).maybeSingle();
      const newTotal = (existing?.words_written ?? 0) + delta;
      if (existing) {
        await supabase.from("daily_stats").update({ words_written: newTotal }).eq("day", day);
      } else {
        await supabase.from("daily_stats").insert({ user_id: user.id, day, words_written: newTotal });
      }
      baseWords.current = wc;
    } else {
      baseWords.current = wc;
    }
    lastSaved.current = { title, content };
    setSaving("saved");
    setTimeout(() => setSaving("idle"), 1500);
  }, [title, content, postId, user]);

  // Autosave debounce
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(save, 1200);
    return () => clearTimeout(t);
  }, [title, content, loaded, save]);

  const exportMd = () => {
    const blob = new Blob([`# ${title}\n\n${content}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "untitled").toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exported as Markdown.");
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(`${title}\n\n${content}`);
    toast.success("Copied to clipboard.");
  };

  const wc = countWords(content);
  const readMin = Math.max(1, Math.round(wc / 220));

  return (
    <main className="pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Desk
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span>{wc} words · {readMin} min read</span>
            <span className="italic">
              {saving === "saving" ? "saving…" : saving === "saved" ? "saved" : "·"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyText} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary">
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
            <button onClick={exportMd} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90">
              <Download className="h-3.5 w-3.5" /> .md
            </button>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 pt-12">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="w-full border-0 bg-transparent font-display text-5xl font-light tracking-tight text-foreground placeholder:text-muted-foreground/50 focus:outline-none md:text-6xl"
        />
        <div className="rule mt-6" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Begin here…"
          rows={24}
          className="editor-prose mt-8 w-full resize-none border-0 bg-transparent placeholder:text-muted-foreground/50"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
          }}
        />
        <p className="mt-10 flex items-center gap-2 text-xs italic text-muted-foreground">
          <Sparkles className="h-3 w-3 text-ember" /> Autosaves as you write. ⌘S to save now.
        </p>
      </article>
    </main>
  );
}
