import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

type MuseRequest = {
  title?: string;
  content?: string;
  question?: string;
};

function getFallbackReply({ title, content, question }: MuseRequest) {
  const text = content?.trim() || "";
  const words = text.split(/\s+/).filter(Boolean);
  const titleLine = title?.trim() ? `«${title.trim()}»` : "текста без названия";

  if (!text) {
    return "Муза рядом. Пока текст пустой, начни с одного живого образа, одной сцены или фразы, которая не отпускает. Когда появится хотя бы абзац, я смогу подсветить ритм, слабые места и направление развития.";
  }

  const questionLine = question?.trim()
    ? `\n\nНа твой вопрос: ${question.trim()}\nЯ бы сначала искала ответ внутри самого сильного образа текста: что он обещает читателю и чем это обещание можно усилить?`
    : "";

  return [
    `Я прочитала ${titleLine}. Сейчас в тексте примерно ${words.length} слов.`,
    "Что уже работает: есть материал, с которым можно разговаривать, а значит стоит беречь интонацию и не спешить с переписыванием.",
    "Куда смотреть дальше: проверь первый абзац на ясный крючок, найди место с самой сильной эмоцией и дай ему больше конкретики. Если сцена кажется плоской, добавь действие, деталь пространства или внутреннее противоречие героя.",
    "Мягкое задание: выдели один абзац, без которого текст всё равно понятен. Либо удали его, либо заставь выполнять работу: раскрывать характер, двигать мысль или менять настроение.",
    questionLine,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export const Route = createFileRoute("/api/muse")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as MuseRequest;
        const { title, content, question } = body;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return Response.json({ reply: getFallbackReply({ title, content, question }) });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const draft = `Заголовок: ${title || "(без названия)"}\n\nТекст:\n${content || "(пусто)"}`;

        const system = `
Ты — Муза, бережный литературный редактор.
Ты не переписываешь текст, а даёшь наблюдения, слабые места и направления развития.
`;

        const prompt = question
          ? `${draft}\n\nВопрос автора: ${question}`
          : `Прочитай текст и дай обратную связь как Муза.\n\n${draft}`;

        try {
          const { text } = await generateText({
            model,
            system,
            prompt,
          });

          return Response.json({ reply: text });
        } catch (error) {
          console.error("Muse AI error:", error);
          return Response.json({ reply: getFallbackReply({ title, content, question }) });
        }
      },
    },
  },
});
