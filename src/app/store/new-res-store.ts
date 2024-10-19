import { NewAnswerType, QuestionOption, QuestionType } from "@/db/schema";
import { create } from "zustand";

type QuestionWithOptions = QuestionType & {
  options: QuestionOption[];
};

interface ResponseStore {
  formQuestions: QuestionWithOptions[];
  setFormQuestions: (questions: QuestionWithOptions[]) => void;
  currentQuestionIndex: number;
  incrementQuestionIndex: () => void;
  getCurrentQuestion: () => QuestionWithOptions | null;
  answers: NewAnswerType[];
  addAnswer: (answer: NewAnswerType) => void;
  llmContext: string;
  setLlmContext: (context: string) => void;
  formTitle: string;
  formDescription: string;
  setInitialNoteContext: (title: string, description: string) => void;
  initialNoteContext: string;
  endNote: string;
}

export const useResponseStore = create<ResponseStore>((set, get) => ({
  formQuestions: [],
  currentQuestionIndex: 0,
  answers: [],
  llmContext: "",
  formDescription: "",
  formTitle: "",
  initialNoteContext: "",
  endNote: "",

  setFormQuestions: (questions: QuestionWithOptions[]) => {
    set({
      formQuestions: questions,
      currentQuestionIndex: 0,
    });
  },

  incrementQuestionIndex: () => {
    set((state) => {
      const nextIndex = state.currentQuestionIndex + 1;
      if (nextIndex < state.formQuestions.length) {
        return { currentQuestionIndex: nextIndex };
      }
      return state; // If we're at the last question, don't change anything
    });
  },

  getCurrentQuestion: () => {
    const { formQuestions, currentQuestionIndex } = get();
    return formQuestions[currentQuestionIndex] || null;
  },

  addAnswer: (answer: NewAnswerType) => {
    set((state) => ({ answers: [...state.answers, answer] }));
  },

  setLlmContext: (context: string) => {
    set({ llmContext: context });
  },

  setInitialNoteContext: (title: string, description: string) => {
    set({
      formTitle: title,
      formDescription: description,
      initialNoteContext: `${title}\n${description}`,
    });
  },
}));
