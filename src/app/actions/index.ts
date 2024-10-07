"use server";

import { db } from "@/db";
import {
  forms,
  questions,
  NewFormType,
  NewQuestionType,
  QuestionOption,
  users,
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { StreamingTextResponse, GoogleGenerativeAIStream } from "ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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
      const questionsToInsert = input.questions.map((q, i) => ({
        ...q,
        formId: createdForm.id,
        order: i,
        options: q.options || [],
      }));
      await tx.insert(questions).values(questionsToInsert);
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
    const existingUser = await db.query.users.findFirst({
      where: eq(users.clerkId, clerkId),
    });

    if (!existingUser) {
      await db.insert(users).values({
        clerkId,
        email,
        name,
      });
      console.log("User created");
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
    const userForms = await db.query.forms.findMany({
      where: eq(forms.userId, userId),
      orderBy: [desc(forms.updatedAt)],
      with: {
        questions: {
          orderBy: [questions.order],
        },
      },
    });

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
    const form = await db.query.forms.findFirst({
      where: eq(forms.id, formId),
      with: {
        questions: {
          orderBy: [questions.order],
        },
      },
    });

    if (!form) {
      throw new Error("Form not found");
    }

    // Check if the form belongs to the current user
    if (form.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return form;
  } catch (error) {
    console.error("Failed to fetch form:", error);
    throw new Error("Failed to fetch form");
  }
}

export async function rephraseQuestion(question: string, context: string = "") {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = context
      ? `Given the following context: "${context}", please rephrase the question: "${question}"`
      : `Please rephrase the following question: "${question}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rephrasedQuestion = response.text();

    return new Response(JSON.stringify({ rephrasedQuestion }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Failed to rephrase question:", error);
    return new Response(JSON.stringify({ rephrasedQuestion: question }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
