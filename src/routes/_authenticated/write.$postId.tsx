import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { countWords, todayKey } from "@/lib/streak";
import { toast } from "sonner";
import { ArrowLeft, Download, Copy, Sparkles, FileText, Wand2, Lightbulb, LightbulbOff, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { MuseCloud } from "@/components/MuseCloud";

export const Route = createFileRoute("/_authenticated/write/$postId")({
  head: () => ({ meta: [{ title: "Письмо · Комната со столом" }] }),
  component: Editor,
});

type MuseAnchor = {
  top: number;
  left: number;
};

type TextSelection = {
  text: string;
  start: number;
  end: number;
  anchor: MuseAnchor;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getSelectionAnchor(textarea: HTMLTextAreaElement, selectionStart: number): MuseAnchor {
  const rect = textarea.getBoundingClientRect();
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement("div");
  const marker = document.createElement("span");

  mirror.style.position = "fixed";
  mirror.style.visibility = "hidden";
  mirror.style.pointerEvents = "none";
  mirror.style.whiteSpace = "pre-wrap";
  mirror.style.overflowWrap = "break-word";
  mirror.style.boxSizing = style.boxSizing;
  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.style.minHeight = `${textarea.clientHeight}px`;
  mirror.style.padding = style.padding;
  mirror.style.border = style.border;
  mirror.style.font = style.font;
  mirror.style.letterSpacing = style.letterSpacing;
  mirror.style.lineHeight = style.lineHeight;
  mirror.style.top = `${rect.top}px`;
  mirror.style.left = `${rect.left}px`;

  mirror.textContent = textarea.value.slice(0, selectionStart);
  marker.textContent = textarea.value.slice(selectionStart, selectionStart + 1) || ".";
  mirror.appendChild(marker);
  document.body.appendChild(mirror);

  const markerRect = marker.getBoundingClientRect();
  document.body.removeChild(mirror);
  const maxTop = Math.max(96, window.innerHeight - 320);
  const maxLeft = Math.max(16, window.innerWidth - 360);

  return {
    top: clamp(markerRect.top - textarea.scrollTop + 30, 96, maxTop),
    left: clamp(markerRect.left + 24, 16, maxLeft),
  };
}

function Editor() {
  const { postId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [lampOn, setLampOn] = useState(true);
  useEffect(() => {
  document.documentElement.classList.toggle("dark", !lampOn);
}, [lampOn]);
  const lastSaved = useRef({ title: "", content: "" });
  const baseWords = useRef(0);
  const sessionId = useRef<string | null>(null);
  const sessionWordsStart = useRef(0);


  // Диди, Добрый Друг (AI)

  const [showMuse, setShowMuse] = useState(false);
  const [museLoading, setMuseLoading] = useState(false);
  const [museReply, setMuseReply] = useState<string>("");
  const [activeSelection, setActiveSelection] = useState<TextSelection | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

 const askDidi = useCallback(async (question?: string, selection?: TextSelection | null) => {
  setMuseLoading(true);

  try {
 const res = await fetch("/api/muse", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title,
    content,
    question: question ?? "",
    selection: selection?.text ?? "",
  }),
});

const data = await res.json().catch(() => null);

if (!res.ok) {
  throw new Error(data?.error ?? "Диди не смог ответить");
}

    setMuseReply(data?.reply ?? "");
    setShowMuse(true);
  } catch (e) {
  console.error("DIDI ERROR FULL:", e);
  toast.error(e instanceof Error ? e.message : "Диди не смог ответить");

  setMuseReply("");
  } finally {
    setMuseLoading(false);
  }
}, [title, content]);

  useEffect(() => {
    const root = document.documentElement;
    const hadDarkClass = root.classList.contains("dark");

    root.classList.toggle("dark", !lampOn);

    return () => {
      root.classList.toggle("dark", hadDarkClass);
    };
  }, [lampOn]);

  const updateActiveSelection = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.slice(selectionStart, selectionEnd).trim();

    if (!selectedText || selectionStart === selectionEnd) {
      setActiveSelection(null);
      return;
    }

    const anchor = getSelectionAnchor(textarea, selectionStart);

    setActiveSelection({
      text: selectedText,
      start: selectionStart,
      end: selectionEnd,
      anchor,
    });
  }, []);

  const askSelection = useCallback(() => {
    if (!activeSelection) return;
    void askDidi(
      "Прокомментируй выделенный фрагмент по предложениям: где сильная фраза, где нужна конкретика, что стоит уточнить.",
      activeSelection,
    );
  }, [activeSelection, askDidi]);

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
      creator: "Комната со столом",
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
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
          <Link to="/dashboard" className="inline-flex h-8 shrink-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Стол
          </Link>
          <div className="flex shrink-0 items-center gap-3 text-xs font-mono text-muted-foreground">
            <span>{wc} сл. · {readMin} мин чтения</span>
            <span className="italic">
              {saving === "saving" ? "сохраняем…" : saving === "saved" ? "сохранено" : "·"}
            </span>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setLampOn((prev) => !prev)}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            >
              {lampOn ? <LightbulbOff className="h-3.5 w-3.5" /> : <Lightbulb className="h-3.5 w-3.5" />}
              {lampOn ? "Лампа" : "Лампа"}
            </button>
            <button
              onClick={() => { void askDidi(); }}
              disabled={museLoading}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-ember/40 bg-ember/10 px-3 text-xs text-ember transition hover:bg-ember/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Wand2 className="h-3.5 w-3.5" />
              {museLoading ? "Зовём…" : "Диди"}
            </button>
            <button onClick={copyText} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              <Copy className="h-3.5 w-3.5" /> Копировать
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                  <Share2 className="h-3.5 w-3.5" /> Поделиться
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportMd}>
                  <Download className="h-3.5 w-3.5" /> Markdown (.md)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportDocx}>
                  <FileText className="h-3.5 w-3.5" /> Word (.docx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value.replace(/--/g, "—"));
            setActiveSelection(null);
          }}
          placeholder="Начните здесь…"
          rows={24}
          className="editor-prose mt-8 w-full resize-none border-0 bg-transparent placeholder:text-muted-foreground/50"
          onMouseUp={updateActiveSelection}
          onKeyUp={updateActiveSelection}
          onSelect={updateActiveSelection}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "s") { e.preventDefault(); save(); }
          }}
        />
        <p className="mt-10 flex items-center gap-2 text-xs italic text-muted-foreground">
          <Sparkles className="h-3 w-3 text-ember" /> Автосохранение во время письма. ⌘S — сохранить сейчас.
        </p>
      </article>
{activeSelection && !showMuse && (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={askSelection}
    disabled={museLoading}
    className="fixed z-40 inline-flex items-center gap-1.5 rounded-full border border-ember/40 bg-card/95 px-3 py-2 text-xs text-ember shadow-lg backdrop-blur transition hover:bg-ember/10 disabled:cursor-not-allowed disabled:opacity-60"
    style={{
      top: activeSelection.anchor.top,
      left: activeSelection.anchor.left,
    }}
  >
    <Wand2 className="h-3.5 w-3.5" />
    {museLoading ? "Слушаем..." : "Диди о фразе"}
  </button>
)}
{showMuse && (
  <MuseCloud
    text={museReply}
    onClose={() => setShowMuse(false)}
  />
)}
    </main>
  );
}
