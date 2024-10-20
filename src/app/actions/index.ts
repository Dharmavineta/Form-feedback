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
import { formSchema } from "@/types";
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

  const prompt = `You are building a smart, interactive form that asks questions in a natural, conversational manner. The form evolves dynamically as it progresses, taking into account the previous questions and answers. You are provided with a list of previously asked questions and the user's answers, where each question is preceded by "Question:" and each answer is preceded by "Answer:".

Your goal is to rephrase the next question in a way that feels engaging, friendly, and interactive, as if the form is having a real-time conversation with the user. The rephrased question should:
- Be longer, conversational, and directly responsive to the user's prior answers, without making assumptions not present in the context.
- Show empathy or excitement depending on whether the user gave a positive or negative response.
- Make the user feel like they are part of an ongoing, evolving dialogue.
- Use open-ended phrases that flow naturally from the user's previous input to the next question, maintaining a dynamic conversation.

If no context is provided, assume this is the first question, greet the user warmly (e.g., "Good day to you!") and ask the question in a friendly, conversational way without assuming any prior knowledge.

Do not introduce new information or ask additional questions. Keep the rephrasing focused on the question.

Previous questions and answers:
${context}

Next question to be rephrased:
${question}`;

  (async () => {
    const { textStream } = await streamText({
      model: google("gemini-1.5-flash-002"),
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
  const prompt = `Generate a JSON string representation of a form object that strictly adheres to the following schema:
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

**Important**: Return only a valid JSON string that can be parsed into an object. Ensure that the output is a plain string that contains valid JSON with double quotes around all keys and string values. Do not return an actual JSON object. Avoid markdown formatting, code blocks, or any additional text like "Here's your response:" or "This is the object you wanted".`;

  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const response = await generateText({
      model: genAI("gemini-1.5-flash-8b"),
      prompt: prompt,
    });

    return response.text;
  } catch (error) {
    console.log(error);
    return error;
  }
}

// export async function initializeResponse(formId: string) {
//   const { userId } = auth();

//   if (!userId) {
//     throw new Error("Unauthorized");
//   }

//   try {
//     const newResponse: NewResponseType = {
//       formId,
//       sessionId: "", // You might want to implement session management
//       isComplete: false,
//       startedAt: new Date(),
//     };

//     const [createdResponse] = await db
//       .insert(responses)
//       .values(newResponse)
//       .returning();

//     return { responseId: createdResponse.id };
//   } catch (error) {
//     console.error("Failed to initialize response:", error);
//     throw new Error("Failed to initialize response");
//   }
// }

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

export async function generateAIObject(input: string) {
  const prompt = ` 
  Generate a form based on the following user input: "${input}".

**Title and Description:**
- Create an engaging title and description that balances creativity and clarity, making it appealing without being overly artistic or too plain. If the input specifically indicates a need for creativity, provide a more imaginative title and description.

**Questions:**
- Ensure a variety of question lengths and types, including both concise and detailed questions. For questions that require deeper thought, elaboration, or context (e.g., user preferences, decision-making, experiences), generate more descriptive and detailed questions. For straightforward inquiries (e.g., factual data, yes/no answers), keep the questions brief.
- Maintain a mix of short and detailed questions throughout the form for better engagement.

**Form Schema:**
- For questions with "questionType" as "radio", "checkbox", or "select", include a non-empty "options" array, where each option has an "id", "text", and "order".
- For questions with "questionType" as "text", "date", or "time", the "options" array can be empty.
- Ensure there is a clear balance between open-ended and multiple-choice questions.
  `;

  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const { object } = await generateObject({
      model: google("gemini-1.5-flash-002"),
      schema: formSchema,
      output: "object",
      prompt: prompt,
    });

    return object;
  } catch (error) {
    console.log(error);
    return error;
  }
}

type MessageType = "intro" | "outro";

export async function generateFormMessage(type: MessageType, context: string) {
  console.log(context, "This is the context from the server action");
  const stream = createStreamableValue("");

  const prompts = {
    intro: `Using the context provided below, generate a welcoming and engaging introduction for the user. The intro should encourage the user to begin the form-filling process by emphasizing the purpose of the form and making them feel comfortable and motivated to proceed. Keep the tone friendly and clear, with a balance of professionalism and approachability.

Context: ${context}`,

    outro: `Using the context provided below, create a warm and dynamic closing note. First, acknowledge the user's last answer and respond to it naturally. Then, use the form title and description from the context to generate a polite and personalized thank-you message for completing the form. Ensure the user feels appreciated for their time and input, while staying within the provided information without adding any unrelated details.

Context: ${context}`,
  };

  (async () => {
    const { textStream } = await streamText({
      model: google("gemini-1.5-flash-002"),
      prompt: prompts[type],
    });

    for await (const delta of textStream) {
      stream.update(delta);
    }
    stream.done();
  })();

  return { output: stream.value };
}

export async function submitFormResponse(
  formId: string,
  answersData: Omit<NewAnswerType, "responseId">[]
) {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    return await db.transaction(async (tx) => {
      // Create the response
      const [createdResponse] = await tx
        .insert(responses)
        .values({
          formId,
          startedAt: new Date(), // You might want to pass this in if you've been tracking it
          completedAt: new Date(),
          totalTimeSpent: 0, // Calculate this if you've been tracking time
          isComplete: true,
        } as NewResponseType)
        .returning();

      // Create answers
      const answersToInsert = answersData.map((answer) => ({
        ...answer,
        responseId: createdResponse.id,
      }));

      await tx.insert(answers).values(answersToInsert);

      // Optional: Update form stats
      // You could update daily stats or form views here if needed

      return {
        message: "Form response submitted successfully",
        responseId: createdResponse.id,
      };
    });
  } catch (error) {
    console.error("Failed to submit form response:", error);
    throw new Error("Failed to submit form response");
  }
}
