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
  const words = text.split(/\s+/).filter(Boolean);
  const titleLine = title?.trim() ? `«${title.trim()}»` : "текста без названия";

  if (selected) {
    return [
      `Я смотрю именно на выделение: «${selected.length > 180 ? `${selected.slice(0, 180).trim()}...` : selected}»`,
      "Что проверить: у каждого предложения должна быть своя работа — действие, образ, поворот мысли или давление на настроение.",
      "Если фраза звучит обобщённо, добавь конкретную деталь. Если предложение длинное, проверь, не прячет ли оно главный удар в середине.",
      question?.trim() ? `По твоему вопросу: ${question.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

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
        const { title, content, question, selection } = body;

        const key = process.env.LOVABLE_API_KEY;
        if (!key) {
          return Response.json({ reply: getFallbackReply({ title, content, question, selection }) });
        }

        const gateway = createLovableAiGatewayProvider(key);
        const model = gateway("google/gemini-3-flash-preview");

        const draft = `Заголовок: ${title || "(без названия)"}\n\nТекст:\n${content || "(пусто)"}`;

        const system = `
Ты — Муза. Не редактор и не соавтор.

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
          return Response.json({ reply: getFallbackReply({ title, content, question, selection }) });
        }
      },
    },
  },
});
