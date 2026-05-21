import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { X } from "lucide-react";

interface MuseCloudProps {
  text: string;
  onClose: () => void;
  position?: { top: number; left: number } | null;
  selection?: string;
}

export function MuseCloud({ text, onClose, position, selection }: MuseCloudProps) {
  const [isDissolving, setIsDissolving] = useState(false);
  const contentMaxHeight = position
    ? `min(240px, calc(100vh - ${position.top}px - 112px))`
    : "min(240px, calc(100vh - 14rem))";
  const style = position
    ? {
        top: `${position.top}px`,
        left: `${position.left}px`,
        right: "auto",
      }
    : undefined;

  const close = () => {
    setIsDissolving(true);
    window.setTimeout(onClose, 420);
  };

  return (
    <div
      className={`muse-cloud fixed right-8 top-1/3 z-50 w-[min(320px,calc(100vw-2rem))] ${
        isDissolving ? "muse-cloud-dissolve" : "muse-cloud-arrive"
      }`}
      style={style}
    >
      <div className="muse-cloud-shell border border-ember/25 bg-card/95 p-4 shadow-xl backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Муза
          </span>

          <button
            onClick={close}
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

        <div
          className="muse-cloud-text prose prose-sm max-w-none overflow-y-auto pb-4 pr-2 text-sm leading-relaxed text-foreground"
          style={{ maxHeight: contentMaxHeight }}
        >
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
