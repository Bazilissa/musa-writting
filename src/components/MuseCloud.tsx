interface MuseCloudProps {
  text: string;
  onClose: () => void;
}

export function MuseCloud({ text, onClose }: MuseCloudProps) {
  return (
    <div className="fixed right-8 top-1/3 z-50 w-[300px] animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="rounded-2xl border border-stone-200 bg-stone-50/95 p-4 shadow-xl backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.2em] text-stone-400">
            ✦ Муза
          </span>

          <button
            onClick={onClose}
            className="text-stone-400 transition hover:text-stone-600"
          >
            ×
          </button>
        </div>

        <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
          {text}
        </p>
      </div>
    </div>
  );
}
