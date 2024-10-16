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
import { generateObject, generateText, streamText } from "ai";
import { createStreamableValue } from "ai/rsc";
import { z } from "zod";
const genAI = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY as string,
});

type FormInputType = Omit<NewFormType, "userId"> & {
  questions: (Omit<NewQuestionType, "formId" | "order"> & {
    options?: QuestionOption[] | null;
  })[];
  font: string;
  backgroundColor: string;
};

export async function aiGenerateForm(input: string) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }
}

export async function createForm(input: FormInputType) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    return await db.transaction(async (tx) => {
      // Create the form
      const [createdForm] = await tx
        .insert(forms)
        .values({
          userId,
          title: input.title,
          description: input.description,
          isPublished: input.isPublished ?? false,
          font: input.font,
          backgroundColor: input.backgroundColor,
        })
        .returning();

      // Create questions
      const questionsToInsert = input.questions.map((q, index) => ({
        formId: createdForm.id,
        questionText: q.questionText,
        questionType: q.questionType,
        order: index,
        required: q.required ?? false,
        options: q.options,
      }));

      await tx.insert(questions).values(questionsToInsert);

      revalidatePath("/forms");
      revalidatePath("/dashboard");

      return { message: "Form created successfully", formId: createdForm.id };
    });
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
  font?: string;
  backgroundColor?: string;
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

  const prompt = `You are building a smart, interactive form that asks questions in a natural, conversational manner. The form evolves dynamically as it progresses, taking into account the previous questions and answers. You are provided with a list of previously asked questions and the user's answers. Your goal is to rephrase the next question in a way that feels engaging and interactive, maintaining a friendly tone.

Each question should be framed in such a way that it acknowledges the user's prior answers and leads smoothly into the next inquiry. The questions should be longer, conversational, and make the user feel like they are part of a friendly dialogue rather than a rigid survey.

Previous questions and answers:
${context}

Next question to be rephrased:
${question}

Guidelines for rephrasing:

Acknowledge the user's previous answer.
Maintain a conversational, friendly tone.
Make the question feel natural and engaging, not just a short, rigid line.
Use open-ended phrases to keep the interaction flowing smoothly.

Please provide only the rephrased question in your response.`;

  (async () => {
    const { textStream } = await streamText({
      model: google("gemini-1.5-pro-002"),
      prompt: prompt,
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }

    stream.done();
  })();

  return { output: stream.value };
}

export async function generateAIForm(input: string) {
  const prompt = `Generate a form object that strictly adheres to the following schema:
  {
    "title": "string",
    "description": "string",
    "isPublished": "boolean",
    "font": "string",
    "backgroundColor": "string",
    "questions": [
      {
        "questionText": "string",
        "questionType": "text | radio | checkbox | select | date | time",
        "order": "number",
        "required": "boolean",
        "options": [
          {
            "id": "string",
            "text": "string",
            "order": "number"
          }
        ] | []
      }
    ]
  }

The rules for generating the options array:
  - If the questionType is "radio", "checkbox", or "select", generate an array of option objects with "id", "text", and "order" as shown in the schema.
  - If the questionType is "text", "date", or "time", the options array must be an empty array [].

Use this input for context: "${input}".
The generated form should follow this schema precisely, including the presence of the options array for each question, even if it is empty.

**Important**: Return only the plain JSON object. Do not include any markdown formatting, such as \`\`\`json, or any other text.`;

  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const response = await generateText({
      model: google("gemini-1.5-pro-002"),
      prompt: prompt,
    });

    return response.text;
  } catch (error) {
    console.log(error);
    return error;
  }
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

export async function saveAnswerToDatabase(answer: NewAnswerType) {
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

export async function updateExistingForm(
  input: FormInputType & { id: string }
) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  console.log(
    input.backgroundColor,
    "This is the background color from server action"
  );

  try {
    return await db.transaction(async (tx) => {
      // Update the form
      await tx
        .update(forms)
        .set({
          title: input.title,
          description: input.description,
          isPublished: input.isPublished ?? false,
          updatedAt: new Date(),
          font: input.font,
          backgroundColor: input.backgroundColor,
        })
        .where(eq(forms.id, input.id));

      // Delete all existing questions
      await tx.delete(questions).where(eq(questions.formId, input.id));

      // Insert new questions
      const questionsToInsert = input.questions.map((q, index) => ({
        formId: input.id,
        questionText: q.questionText,
        questionType: q.questionType,
        order: index,
        required: q.required ?? false,
        options: q.options,
      }));

      await tx.insert(questions).values(questionsToInsert);

      revalidatePath("/forms");
      revalidatePath("/dashboard");

      return { message: "Form updated successfully", formId: input.id };
    });
  } catch (error) {
    console.error("Failed to update form:", error);
    throw new Error("Failed to update form");
  }
}

export async function getPublicFormById(formId: string) {
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

    // Only return the form if it's published
    // if (!form.isPublished) {
    //   throw new Error("Form is not published");
    // }

    // Remove sensitive information
    const { userId, ...publicForm } = form;

    return publicForm;
  } catch (error) {
    console.error("Failed to fetch public form:", error);
    throw new Error("Failed to fetch public form");
  }
}
