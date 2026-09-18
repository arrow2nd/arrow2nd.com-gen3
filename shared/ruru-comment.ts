import { z } from "zod";

export const commentSchema = z.strictObject({
  text: z
    .string()
    .trim()
    .min(1)
    .refine((text) => [...text].length <= 1000, "コメントは1,000文字以内です。"),
  generatedAt: z.iso.datetime(),
  sourceHash: z.string().regex(/^[a-f0-9]{64}$/),
});
export type RuruComment = z.infer<typeof commentSchema>;
