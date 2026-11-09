import { ApiError, FinishReason, GoogleGenAI, type Part } from "@google/genai";
import { z } from "zod";
import { GenerateRequestSchema, StudySetSchema } from "@/lib/schemas";
import { rateLimit } from "@/lib/rate-limit";

// Generating a full study set can take a while; give the function room.
export const maxDuration = 120;

// gemini-3.5-flash-lite is fast and available on the Gemini API free tier.
const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

// JSON Schema sent to Gemini so it must answer in exactly this shape.
// ($schema is metadata Gemini doesn't need, so it's dropped.)
const { $schema: _unused, ...RESPONSE_SCHEMA } = z.toJSONSchema(StudySetSchema);
void _unused;

const SYSTEM_PROMPT = `You are BarkadAral, a tutor that turns a student's notes into study material.

Work only from the material the student provides. Do not invent facts that are not supported by it; if the notes are thin, make fewer, better items rather than padding.

Guidelines:
- Summary bullets should be short and self-contained, the way a good student writes a review sheet.
- Flashcards test one idea each. Fronts are questions, not just a word.
- Quiz questions have exactly 4 choices with one clearly correct answer. Wrong choices should be plausible mistakes a student might make, not jokes. Vary the position of the correct answer.
- Match the requested difficulty: easy = recall of definitions and facts; medium = understanding and comparison; hard = application to new situations and multi-step reasoning.
- Write in the same language as the notes (for example, if the notes are in Filipino, write in Filipino).`;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set. Add it to .env.local or your host's settings.");
    return Response.json(
      { error: "The server isn't configured yet (missing API key)." },
      { status: 500 },
    );
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!rateLimit(ip)) {
    return Response.json(
      { error: "You've made a lot of requests. Please wait a bit and try again." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = GenerateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }
  const { notes, pdfBase64, numQuestions, difficulty } = parsed.data;

  const parts: Part[] = [];
  if (pdfBase64) {
    parts.push({ inlineData: { mimeType: "application/pdf", data: pdfBase64 } });
  }
  if (notes?.trim()) {
    parts.push({ text: `<notes>\n${notes}\n</notes>` });
  }
  parts.push({
    text: `Create a study set from the material above.
Difficulty: ${difficulty}
Quiz questions: ${numQuestions}
Flashcards: about ${numQuestions}`,
  });

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
        maxOutputTokens: 16000,
      },
    });

    const finish = response.candidates?.[0]?.finishReason;
    if (finish === FinishReason.SAFETY || response.promptFeedback?.blockReason) {
      return Response.json(
        { error: "The AI couldn't work with this material. Try different notes." },
        { status: 422 },
      );
    }
    if (finish === FinishReason.MAX_TOKENS) {
      return Response.json(
        { error: "The notes were too long to finish. Try a shorter section." },
        { status: 422 },
      );
    }

    let json: unknown;
    try {
      json = JSON.parse(response.text ?? "");
    } catch {
      json = null;
    }
    const result = StudySetSchema.safeParse(json);
    if (!result.success) {
      console.error("Model returned an unexpected shape:", result.error?.issues ?? "not JSON");
      return Response.json(
        { error: "The AI gave an unexpected answer. Please try again." },
        { status: 502 },
      );
    }

    // Keep only well-formed quiz questions, then shuffle each question's
    // choices. Models tend to put the right answer in the same spot, which
    // would let students guess the pattern.
    const studySet = result.data;
    studySet.quiz = studySet.quiz
      .filter(
        (q) => q.choices.length >= 2 && q.answerIndex >= 0 && q.answerIndex < q.choices.length,
      )
      .map((q) => {
        const correct = q.choices[q.answerIndex];
        const choices = shuffle(q.choices);
        return { ...q, choices, answerIndex: choices.indexOf(correct) };
      });

    return Response.json(studySet);
  } catch (err) {
    if (err instanceof ApiError) {
      console.error(`Gemini API error ${err.status}:`, err.message);
      if (err.status === 429) {
        return Response.json(
          { error: "The free AI limit was reached. Wait a minute and try again." },
          { status: 429 },
        );
      }
      if (err.status === 400 && /api key/i.test(err.message)) {
        return Response.json(
          { error: "The server's API key is invalid." },
          { status: 500 },
        );
      }
      if (err.status === 400) {
        return Response.json(
          { error: "That file couldn't be read. Try a different PDF or paste the text." },
          { status: 400 },
        );
      }
    }
    console.error("Generation failed:", err);
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
