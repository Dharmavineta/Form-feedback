import { NewAnswerType, QuestionOption, QuestionType } from "@/db/schema";
import { create } from "zustand";

type QuestionWithOptions = QuestionType & {
  options: QuestionOption[] | null;
};

interface ResponseStore {
  formQuestions: QuestionWithOptions[];
  setFormQuestions: (questions: QuestionWithOptions[]) => void;
  currentQuestionIndex: number | null;
  incrementQuestionIndex: () => void;
  getCurrentQuestion: () => QuestionWithOptions | null;
  answers: Partial<NewAnswerType>[];
  addAnswer: (answer: Partial<NewAnswerType>) => void;
  llmContext: string;
  setLlmContext: (context: string) => void;
  formTitle: string;
  formDescription: string;
  setFormMetadata: (title: string, description: string) => void;
}

export const useResponseStore = create<ResponseStore>((set, get) => ({
  formQuestions: [],
  currentQuestionIndex: null,
  answers: [],
  llmContext: "",
  formDescription: "",
  formTitle: "",

  setFormQuestions: (questions: QuestionWithOptions[]) => {
    set({
      formQuestions: questions,
      currentQuestionIndex: null,
    });
  },

  incrementQuestionIndex: () => {
    set((state) => {
      const nextIndex =
        state.currentQuestionIndex === null
          ? 0
          : state.currentQuestionIndex + 1;
      if (nextIndex <= state.formQuestions.length) {
        return { currentQuestionIndex: nextIndex };
      }
      return state;
    });
  },

  getCurrentQuestion: () => {
    const { formQuestions, currentQuestionIndex } = get();
    return currentQuestionIndex !== null &&
      currentQuestionIndex < formQuestions.length
      ? formQuestions[currentQuestionIndex]
      : null;
  },

  addAnswer: (answer: Partial<NewAnswerType>) => {
    set((state) => ({ answers: [...state.answers, answer] }));
  },

  setLlmContext: (context: string) => {
    set({ llmContext: context });
  },

  setFormMetadata: (title: string, description: string) => {
    set({
      formTitle: title,
      formDescription: description,
    });
  },
}));
