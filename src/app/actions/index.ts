"use server";

import { db } from "@/db";
import {
  forms,
  questions,
  questionOptions,
  NewFormType,
  NewQuestionType,
  NewQuestionOptionType,
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

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
    await db.transaction(async (tx) => {
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
    });

    revalidatePath("/forms");
    revalidatePath("/dashboard");

    return { message: "Form created successfully" };
  } catch (error) {
    console.error("Failed to create form:", error);
    throw new Error("Failed to create form");
  }
}

export async function createUserIfNotExists(
  clerkId: string,
  email: string,
  name: string
) {
  try {
    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);

    const existingUser = existingUsers[0];

    if (!existingUser) {
      const result = await db.insert(users).values({
        clerkId,
        email,
        name,
      });
      console.log("User created:", result);
      return { message: "User created successfully" };
    } else {
      console.log("User already exists:", existingUser);
      return { message: "User already exists" };
    }
  } catch (error) {
    console.error("Failed to create user:", error);
    throw new Error("Failed to create user");
  }
}
