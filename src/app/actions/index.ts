"use server";

import { db } from "@/db";
import {
  forms,
  questions,
  questionOptions,
  NewFormType,
  NewQuestionType,
  NewQuestionOptionType,
  questionTypeEnum,
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// This type extends NewFormType to include the nested questions and options
type FormInputType = Omit<NewFormType, "userId"> & {
  questions: (Omit<NewQuestionType, "formId" | "order"> & {
    options?: Omit<NewQuestionOptionType, "questionId" | "order">[];
  })[];
};

export async function createForm(input: FormInputType) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    return await db.transaction(async (tx) => {
      // Create the form
      const newForm: NewFormType = {
        ...input,
        userId,
      };
      const [createdForm] = await tx.insert(forms).values(newForm).returning();

      // Create questions and their options
      for (let i = 0; i < input.questions.length; i++) {
        const q = input.questions[i];
        const newQuestion: NewQuestionType = {
          ...q,
          formId: createdForm.id,
          order: i,
        };
        const [createdQuestion] = await tx
          .insert(questions)
          .values(newQuestion)
          .returning();

        // If the question has options, create them
        if (q.options && q.options.length > 0) {
          const newOptions: NewQuestionOptionType[] = q.options.map(
            (option, index) => ({
              ...option,
              questionId: createdQuestion.id,
              order: index,
            })
          );
          await tx.insert(questionOptions).values(newOptions);
        }
      }

      return createdForm;
    });
  } catch (error) {
    console.error("Failed to create form:", error);
    throw new Error("Failed to create form");
  } finally {
    revalidatePath("/forms");
  }
}
