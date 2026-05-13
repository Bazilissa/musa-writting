import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { countWords, todayKey } from "@/lib/streak";
import { toast } from "sonner";
import { ArrowLeft, Download, Copy, Sparkles, FileText } from "lucide-react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";

export const Route = createFileRoute("/_authenticated/write/$postId")({
  head: () => ({ meta: [{ title: "Письмо · Муза" }] }),
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
      .update({ title: title || "Без названия", content, word_count: wc })
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
    a.download = `${(title || "bez-nazvaniya").toLowerCase().replace(/\s+/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Экспортировано в Markdown.");
  };

  const exportDocx = async () => {
    const FONT = "Times New Roman";
    const SIZE = 24; // 12pt (half-points)
    const LINE_150 = 360; // 240 = single, 360 = 1.5
    const paragraphs: Paragraph[] = [
      new Paragraph({
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { line: LINE_150, after: 240 },
        children: [new TextRun({ text: title || "Без названия", font: FONT, size: SIZE, bold: true })],
      }),
      new Paragraph({ children: [new TextRun("")] }),
      ...content.split(/\n\n+/).map(
        (block) =>
          new Paragraph({
            spacing: { after: 200, line: LINE_150 },
            children: block.split("\n").flatMap((line, i) =>
              i === 0
                ? [new TextRun({ text: line, font: FONT, size: SIZE })]
                : [new TextRun({ text: line, font: FONT, size: SIZE, break: 1 })],
            ),
          }),
      ),
    ];
    const doc = new Document({
      creator: "Муза",
      title: title || "Без названия",
      styles: {
        default: {
          document: { run: { font: FONT, size: SIZE }, paragraph: { spacing: { line: LINE_150 } } },
        },
      },
      sections: [{ children: paragraphs }],
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "bez-nazvaniya").toLowerCase().replace(/\s+/g, "-")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Экспортировано в Word.");
  };

  const copyText = async () => {
    await navigator.clipboard.writeText(`${title}\n\n${content}`);
    toast.success("Скопировано в буфер обмена.");
  };

  const wc = countWords(content);
  const readMin = Math.max(1, Math.round(wc / 220));

  return (
    <main className="pb-24">
      <div className="sticky top-0 z-10 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Стол
          </Link>
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span>{wc} сл. · {readMin} мин чтения</span>
            <span className="italic">
              {saving === "saving" ? "сохраняем…" : saving === "saved" ? "сохранено" : "·"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copyText} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary">
              <Copy className="h-3.5 w-3.5" /> Копировать
            </button>
            <button onClick={exportMd} className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-secondary">
              <Download className="h-3.5 w-3.5" /> .md
            </button>
            <button onClick={exportDocx} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground hover:opacity-90">
              <FileText className="h-3.5 w-3.5" /> .docx
            </button>
          </div>
        </div>
      </div>

      <article className="mx-auto max-w-3xl px-6 pt-12">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Без названия"
          className="w-full border-0 bg-transparent font-display text-5xl font-light tracking-tight text-foreground placeholder:text-muted-foreground/50 focus:outline-none md:text-6xl"
        />
        <div className="rule mt-6" />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Начните здесь…"
          rows={24}
          className="editor-prose mt-8 w-full resize-none border-0 bg-transparent placeholder:text-muted-foreground/50"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
          }}
        />
        <p className="mt-10 flex items-center gap-2 text-xs italic text-muted-foreground">
          <Sparkles className="h-3 w-3 text-ember" /> Автосохранение во время письма. ⌘S — сохранить сейчас.
        </p>
      </article>
    </main>
  );
}
