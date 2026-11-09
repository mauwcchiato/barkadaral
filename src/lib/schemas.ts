import { z } from "zod";

// Shape of what the AI returns. Shared by the API route (validation)
// and the UI (types).
export const StudySetSchema = z.object({
  title: z.string().describe("Short title for these notes, max 8 words"),
  summary: z
    .array(z.string())
    .describe("4-8 bullet points capturing the most important ideas"),
  keyTerms: z
    .array(
      z.object({
        term: z.string(),
        definition: z.string().describe("One or two plain-language sentences"),
      }),
    )
    .describe("The important vocabulary from the notes"),
  flashcards: z.array(
    z.object({
      front: z.string().describe("A question or prompt"),
      back: z.string().describe("The answer, concise"),
    }),
  ),
  quiz: z.array(
    z.object({
      question: z.string(),
      choices: z.array(z.string()).describe("Exactly 4 answer choices"),
      answerIndex: z
        .number()
        .int()
        .describe("0-based index of the correct choice"),
      explanation: z
        .string()
        .describe("Why the correct answer is right, 1-2 sentences"),
    }),
  ),
});

export type StudySet = z.infer<typeof StudySetSchema>;

export const GenerateRequestSchema = z
  .object({
    notes: z.string().max(60_000).optional(),
    pdfBase64: z.string().max(4_000_000).optional(),
    pdfName: z.string().max(200).optional(),
    numQuestions: z.number().int().min(3).max(20).default(10),
    difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  })
  .refine((r) => (r.notes && r.notes.trim().length >= 50) || r.pdfBase64, {
    message: "Paste at least a few sentences of notes, or upload a PDF.",
  });

export type GenerateRequest = z.input<typeof GenerateRequestSchema>;
