"use server";

import { db } from "@/db";
import {
  forms,
  questions,
  NewFormType,
  NewQuestionType,
  QuestionOption,
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

// Update the FormInputType to match the schema
type FormInputType = Omit<NewFormType, "userId"> & {
  questions: (Omit<NewQuestionType, "formId" | "order"> & {
    options?: QuestionOption[];
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
          options: q.options || [],
        };
        await tx.insert(questions).values(newQuestion);
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
