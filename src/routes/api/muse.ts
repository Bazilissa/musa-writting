import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway";

export async function POST(request: Request) {
  const { title, content, question } = await request.json();

  const key = process.env.LOVABLE_API_KEY;
 if (!key) {
  return Response.json(
    { error: "LOVABLE_API_KEY не настроен" },
    { status: 500 }
  );
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
} catch (e: any) {
  return Response.json(
    { error: e?.message ?? "AI error" },
    { status: 500 }
  );
}
