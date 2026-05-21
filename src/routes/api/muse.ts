import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

export async function POST({ request }) {
  const { title, content, question } = await request.json();

  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY не настроен");

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

  const { text } = await generateText({
    model,
    system,
    prompt,
  });

  return Response.json({ reply: text });
}
