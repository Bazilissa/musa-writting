import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "./ai-gateway";

const InputSchema = z.object({
  title: z.string().max(500).optional().default(""),
  content: z.string().max(50000).optional().default(""),
  question: z.string().max(2000).optional().default(""),
});

export const askMuse = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY не настроен");

    const gateway = createLovableAiGatewayProvider(key);
    const model = gateway("google/gemini-3-flash-preview");

    const draft = `Заголовок: ${data.title || "(без названия)"}\n\nТекст:\n${data.content || "(пусто)"}`;

    const system = `Ты — Муза, дружелюбный литературный наставник и редактор. Ты читаешь черновик автора и помогаешь ему расти.

Твои принципы:
— Будь тёплой, поддерживающей, но честной. Никакой воды и шаблонных похвал.
— Сначала кратко скажи, что цепляет в тексте (1–2 пункта).
— Затем дай 3–5 конкретных советов по улучшению: язык, ритм, структура, образы, точка зрения, диалог. Указывай на конкретные фразы из черновика, если можно.
— В конце — одна короткая мотивирующая мысль, чтобы автор продолжил писать (1–2 предложения).
— Если автор задал вопрос — ответь на него прямо, в том же духе.
— Пиши по-русски. Используй markdown с заголовками **Что работает**, **Что улучшить**, **Дальше**.
— Если черновик почти пуст, не критикуй — предложи стартовый импульс: образ, фразу, вопрос, на который стоит ответить письмом.`;

    const userPrompt = data.question
      ? `Вот мой черновик:\n\n${draft}\n\nМой вопрос: ${data.question}`
      : `Вот мой черновик. Дай мне обратную связь и совет, как улучшить, и подбодри писать дальше.\n\n${draft}`;

    const { text } = await generateText({
      model,
      system,
      prompt: userPrompt,
    });

    return { reply: text };
  });
