import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

type MuseRequest = {
  title?: string;
  content?: string;
  question?: string;
  selection?: string;
};

function getFallbackReply({ title, content, question, selection }: MuseRequest) {
  const text = content?.trim() || "";
  const selected = selection?.trim() || "";
  const titleLine = title?.trim() ? `«${title.trim()}»` : "текста без названия";

  if (selected) {
    return [
      `В этом фрагменте слышится не столько мысль, сколько попытка нащупать тон: «${selected.length > 140 ? `${selected.slice(0, 140).trim()}...` : selected}»`,
      "Я бы прислушалась к месту, где образ начинает сопротивляться буквальному смыслу. Там может быть вход глубже.",
      question?.trim() ? `Маленький вопрос рядом с твоим: что в этой фразе хочется оставить недосказанным?` : "Маленький импульс: что здесь лучше не объяснять, а дать почувствовать?",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  if (!text) {
    return "Диди рядом. Не нужно начинать правильно.\n\nВозьми один предмет, жест или странное ощущение и дай ему побыть первым.\n\nЧто в этой сцене уже молчит, но просится наружу?";
  }

  const questionLine = question?.trim()
    ? `\n\nВ твоём вопросе слышится желание не украсить текст, а точнее понять, зачем он появился. Я бы пошла туда.`
    : "";

  return [
    `Я прочитала ${titleLine}. В тексте уже есть точка, где бытовое может стать личным, почти упрямым образом.`,
    "Не спеши объяснять его. Посмотри, какое чувство прячется за этим предметом или действием: раздражение, смешливость, стыд, нежность?",
    "Один маленький импульс: спроси у этой фразы, чего она боится назвать прямо.",
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
        const { title, content, question, selection } = body;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return Response.json({ reply: getFallbackReply({ title, content, question, selection }) });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const draft = `Заголовок: ${title || "(без названия)"}\n\nТекст:\n${content || "(пусто)"}`;

        const system = `
Ты — Диди, Добрый Друг. Не редактор и не соавтор.

Ты помогаешь писателю услышать собственный текст глубже, но никогда не переписываешь за него и не предлагаешь готовые фразы.

Твои принципы:

— Ты говоришь кратко и точно.
— Не анализируй текст как преподаватель.
— Не используй списки советов и длинные разборы.
— Не предлагай готовые переписанные предложения.
— Не превращай ответ в "литературную критику".

Вместо этого:
— замечай эмоциональное напряжение,
— указывай на места, где чувствуется энергия,
— мягко задавай вопросы,
— подталкивай автора к более глубокому исследованию сцены, героя или чувства.

Ты можешь:
— отметить интересный образ,
— заметить недосказанность,
— почувствовать скрытый конфликт,
— обратить внимание на ритм или атмосферу.

Ты не должна доминировать над текстом автора.
Твой ответ всегда короче самого фрагмента.

Тон:
— спокойный,
— внимательный,
— немного интимный,
— без восторженных похвал,
— без канцелярита,
— без "отличная работа!".

Если текст короткий или автор застрял:
не критикуй.
Дай один маленький импульс:
образ, вопрос, ощущение или направление мысли.

Отвечай по-русски.

Максимум:
3 коротких абзаца.
`;

        const prompt = selection?.trim()
          ? `${draft}\n\nВыделенный фрагмент автора:\n${selection.trim()}\n\nОтзовись только на выделенный фрагмент. Заметь, где в нём есть энергия, напряжение, ритм, недосказанность или скрытый конфликт. Не переписывай и не давай список правок. ${question ? `\n\nВопрос автора: ${question}` : ""}`
          : question
          ? `${draft}\n\nВопрос автора: ${question}`
          : `Прочитай текст и откликнись как Диди, Добрый Друг.\n\n${draft}`;

        try {
          const { text } = await generateText({
            model,
            system,
            prompt,
          });

          return Response.json({ reply: text });
        } catch (error) {
          console.error("Didi AI error:", error);
          return Response.json({ reply: getFallbackReply({ title, content, question, selection }) });
        }
      },
    },
  },
});
