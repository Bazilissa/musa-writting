import ReactMarkdown from "react-markdown";
import { X } from "lucide-react";

interface MuseCloudProps {
  text: string;
  onClose: () => void;
  position?: { top: number; left: number } | null;
  selection?: string;
}

export function MuseCloud({ text, onClose, position, selection }: MuseCloudProps) {
  const style = position
    ? {
        top: `${position.top}px`,
        left: `${position.left}px`,
        right: "auto",
      }
    : undefined;

  return (
    <div
      className="fixed right-8 top-1/3 z-50 w-[min(340px,calc(100vw-2rem))] animate-in fade-in slide-in-from-right-4 duration-300"
      style={style}
    >
      <div className="rounded-lg border border-ember/30 bg-card/95 p-4 shadow-xl backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Муза
          </span>

          <button
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition hover:bg-secondary hover:text-foreground"
            aria-label="Закрыть Музу"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {selection ? (
          <blockquote className="mb-3 border-l-2 border-ember/50 pl-3 text-sm italic leading-snug text-muted-foreground">
            {selection.length > 140 ? `${selection.slice(0, 140).trim()}...` : selection}
          </blockquote>
        ) : null}

        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
