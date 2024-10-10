import { create } from "zustand";
import { FormType, QuestionType, NewAnswerType } from "@/db/schema";
import { initializeResponse, saveAnswer, submitResponses } from "@/app/actions";

interface ResponseState {
  form: (FormType & { questions: QuestionType[] }) | null;
  currentQuestionIndex: number;
  rephrasedQuestions: string[];
  answers: NewAnswerType[];
  isLoading: boolean;
  conversation: { role: string; content: string }[];
  responseId: string | null;
  conversationHistory: { question: string; answer: string }[];

  setForm: (form: FormType & { questions: QuestionType[] }) => void;
  initializeResponse: () => Promise<void>;
  addRephrasedQuestion: (rephrased: string) => void;
  saveAnswer: (answer: Omit<NewAnswerType, "responseId">) => Promise<void>;
  moveToNextQuestion: () => void;
  submitResponses: () => Promise<void>;
  addToConversation: (role: string, content: string) => void;
  updateConversationHistory: (question: string, answer: string) => void;
}

export const useResponseStore = create<ResponseState>((set, get) => ({
  form: null,
  currentQuestionIndex: 0,
  rephrasedQuestions: [],
  answers: [],
  isLoading: false,
  conversation: [],
  responseId: null,
  conversationHistory: [],

  setForm: (form) => set({ form }),

  initializeResponse: async () => {
    const { form } = get();
    if (!form) return;

    try {
      const { responseId } = await initializeResponse(form.id);
      set({ responseId });
    } catch (error) {
      console.error("Failed to initialize response:", error);
    }
  },

  addRephrasedQuestion: (rephrased: string) => {
    set((state) => ({
      rephrasedQuestions: [
        ...state.rephrasedQuestions.slice(0, state.currentQuestionIndex),
        rephrased,
        ...state.rephrasedQuestions.slice(state.currentQuestionIndex + 1),
      ],
    }));
    get().addToConversation("assistant", rephrased);
  },

  saveAnswer: async (answer) => {
    const { responseId, form, currentQuestionIndex, rephrasedQuestions } =
      get();
    if (!responseId || !form) {
      console.error("No response ID or form available");
      return;
    }
    const newAnswer: NewAnswerType = { ...answer, responseId };
    try {
      await saveAnswer(newAnswer);
      set((state) => ({
        answers: [...state.answers, newAnswer],
      }));
      get().addToConversation("user", answer.answerText || "");

      // Update conversation history
      const currentQuestion =
        rephrasedQuestions[currentQuestionIndex] ||
        form.questions[currentQuestionIndex].questionText;
      get().updateConversationHistory(currentQuestion, answer.answerText || "");
    } catch (error) {
      console.error("Failed to save answer:", error);
    }
  },

  moveToNextQuestion: () => {
    set((state) => ({ currentQuestionIndex: state.currentQuestionIndex + 1 }));
  },

  submitResponses: async () => {
    const { responseId, answers } = get();
    if (!responseId) return;

    try {
      await submitResponses(responseId, answers);
      // Handle successful submission (e.g., show a success message, redirect)
    } catch (error) {
      console.error("Failed to submit responses:", error);
      // Handle error (e.g., show error message to user)
    }
  },

  addToConversation: (role, content) => {
    set((state) => ({
      conversation: [...state.conversation, { role, content }],
    }));
  },

  updateConversationHistory: (question: string, answer: string) => {
    set((state) => ({
      conversationHistory: [...state.conversationHistory, { question, answer }],
    }));
  },
}));
