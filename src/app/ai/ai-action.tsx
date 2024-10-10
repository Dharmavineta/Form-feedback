"use server";

import { getMutableAIState, streamUI } from "ai/rsc";
import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import { ReactNode } from "react";
import { z } from "zod";
import { generateId } from "ai";

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

export async function continueConversation(
  input: string
): Promise<ClientMessage> {
  "use server";

  const history = getMutableAIState();
  console.log(history, "This is history");

  const result = await streamUI({
    model: genAI("gemini-1.5-flash-8b"),
    messages: [...history.get(), { role: "user", content: input }],
    text: ({ content, done }) => {
      if (done) {
        history.done((messages: ServerMessage[]) => [
          ...messages,
          { role: "assistant", content },
        ]);
      }

      return <div> Hello{content}</div>;
    },
    // tools: {
    //   showStockInformation: {
    //     description:
    //       "Get stock information for symbol for the last numOfMonths months",
    //     parameters: z.object({
    //       symbol: z
    //         .string()
    //         .describe("The stock symbol to get information for"),
    //       numOfMonths: z
    //         .number()
    //         .describe("The number of months to get historical information for"),
    //     }),
    //     generate: async ({ symbol, numOfMonths }) => {
    //       history.done((messages: ServerMessage[]) => [
    //         ...messages,
    //         {
    //           role: "assistant",
    //           content: `Showing stock information for ${symbol}`,
    //         },
    //       ]);

    //       return <Stock symbol={symbol} numOfMonths={numOfMonths} />;
    //     },
    //   },
    // },
  });

  return {
    id: generateId(),
    role: "assistant",
    display: result.value,
  };
}
