import { z } from "zod";

export const formSchema = z.object({
  title: z.string(),
  description: z.string(),
  font: z.string().default("Arial"),
  backgroundColor: z.string().default("#FFFFFF"),
  questions: z.array(
    z.object({
      questionText: z.string(),
      questionType: z.enum([
        "text",
        "radio",
        "checkbox",
        "select",
        "date",
        "time",
      ]),
      order: z.number(),
      required: z.boolean(),
      options: z
        .array(
          z.object({
            id: z.string(),
            text: z.string(),
            order: z.number(),
          })
        )
        .optional(), // Allows for an empty array
    })
  ),
});

export type ZodFormType = z.infer<typeof formSchema>;
