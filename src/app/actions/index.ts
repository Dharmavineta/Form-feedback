"use server";

import { db } from "@/db";
import {
  forms,
  questions,
  NewFormType,
  NewQuestionType,
  QuestionOption,
  users,
  responses,
  answers,
  NewResponseType,
  NewAnswerType,
} from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { streamText } from "ai";
import { ReactNode } from "react";
import { createStreamableValue, getMutableAIState } from "ai/rsc";
import { AI } from "../lib/ai";

// Initialize Gemini AI
const genAI = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY as string,
});

export interface ServerMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClientMessage {
  id: string;
  role: "user" | "assistant";
  display: ReactNode;
}

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
  const stream = createStreamableValue("");

  const prompt = context
    ? `Given the following context: "${context}", please rephrase the question: "${question}" in a very conversational way and give me the rephrased question only`
    : `Please rephrase the following question: "${question}" in a very conversational way and give me the rephrased question only`;

  (async () => {
    const { textStream } = await streamText({
      model: genAI("gemini-1.5-flash-8b"),
      prompt: prompt,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}

export async function initializeResponse(formId: string) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const newResponse: NewResponseType = {
      formId,
      sessionId: "", // You might want to implement session management
      isComplete: false,
      startedAt: new Date(),
    };

    const [createdResponse] = await db
      .insert(responses)
      .values(newResponse)
      .returning();

    return { responseId: createdResponse.id };
  } catch (error) {
    console.error("Failed to initialize response:", error);
    throw new Error("Failed to initialize response");
  }
}

export async function saveAnswer(answer: NewAnswerType) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await db.insert(answers).values(answer);
    return { message: "Answer saved successfully" };
  } catch (error) {
    console.error("Failed to save answer:", error);
    throw new Error("Failed to save answer");
  }
}

export async function submitResponses(
  responseId: string,
  submittedAnswers: NewAnswerType[]
) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await db.transaction(async (tx) => {
      // Update the response to mark it as complete
      await tx
        .update(responses)
        .set({ isComplete: true, completedAt: new Date() })
        .where(eq(responses.id, responseId));

      // Insert all answers
      if (submittedAnswers.length > 0) {
        for (const answer of submittedAnswers) {
          await tx.insert(answers).values(answer);
        }
      }
    });

    return { message: "Responses submitted successfully" };
  } catch (error) {
    console.error("Failed to submit responses:", error);
    throw new Error("Failed to submit responses");
  }
}
