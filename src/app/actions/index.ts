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

export async function getForms() {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const userForms = await db
      .select()
      .from(forms)
      .where(eq(forms.userId, userId));

    return userForms;
  } catch (error) {
    console.error("Failed to fetch forms:", error);
    throw new Error("Failed to fetch forms");
  }
}

export async function deleteForm(formId: string) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    // Delete the form (questions will be deleted automatically due to cascade)
    await db.delete(forms).where(eq(forms.id, formId));

    revalidatePath("/forms");
    revalidatePath("/dashboard");

    return { message: "Form deleted successfully" };
  } catch (error) {
    console.error("Failed to delete form:", error);
    throw new Error("Failed to delete form");
  }
}

type UpdateFormInput = Partial<Omit<NewFormType, "id" | "userId">> & {
  id: string;
};

export async function updateForm(input: UpdateFormInput) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const { id, ...updateData } = input;

  try {
    await db.update(forms).set(updateData).where(eq(forms.id, id));

    revalidatePath("/forms");
    revalidatePath("/dashboard");

    return { message: "Form updated successfully" };
  } catch (error) {
    console.error("Failed to update form:", error);
    throw new Error("Failed to update form");
  }
}

export async function getFormById(formId: string) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const form = await db
      .select()
      .from(forms)
      .where(eq(forms.id, formId))
      .limit(1);

    if (form.length === 0) {
      throw new Error("Form not found");
    }

    // Check if the form belongs to the current user
    if (form[0].userId !== userId) {
      throw new Error("Unauthorized");
    }

    return form[0];
  } catch (error) {
    console.error("Failed to fetch form:", error);
    throw new Error("Failed to fetch form");
  }
}
