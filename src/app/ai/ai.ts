import { createAI } from "ai/rsc";
import {
  ClientMessage,
  continueConversation,
  ServerMessage,
} from "./ai-action";

export const AI = createAI<ServerMessage[], ClientMessage[]>({
  actions: {
    continueConversation,
  },
  initialAIState: [],
  initialUIState: [],
});
