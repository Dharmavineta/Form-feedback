import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { questionTypeEnum, QuestionOption } from "@/db/schema";
import { createForm } from "@/app/actions";
import { toast } from "sonner";
import { DropResult } from "@hello-pangea/dnd";

type QuestionType = (typeof questionTypeEnum.enumValues)[number];

interface Question {
  id: string;
  questionText: string;
  questionType: QuestionType;
  options: QuestionOption[];
  required: boolean;
}

interface FormState {
  formQuestions: Question[];
  formName: string;
  formDescription: string;
  newOptionInputs: Record<string, string>;
  addNewQuestion: (questionText?: string) => void;
  updateQuestionText: (id: string, text: string) => void;
  toggleRequired: (id: string) => void;
  updateQuestionType: (id: string, newType: QuestionType) => void;
  addOption: (questionId: string, optionText?: string) => void;
  removeOption: (questionId: string, optionId: string) => void;
  reorderQuestions: (startIndex: number, endIndex: number) => void;
  reorderOptions: (
    questionId: string,
    startIndex: number,
    endIndex: number
  ) => void;
  deleteQuestion: (id: string) => void;
  setFormName: (name: string) => void;
  setFormDescription: (description: string) => void;
  setNewOptionInput: (questionId: string, value: string) => void;
  updateOptionText: (
    questionId: string,
    optionId: string,
    text: string
  ) => void;
  saveForm: () => Promise<void>;
  onDragEnd: (result: DropResult) => void;
}

export const useFormStore = create<FormState>((set, get) => ({
  formQuestions: [],
  formName: "",
  formDescription: "",
  newOptionInputs: {},

  addNewQuestion: (questionText = "") =>
    set((state) => {
      const newQuestion: Question = {
        id: uuidv4(),
        questionText,
        questionType: "text",
        options: [],
        required: false,
      };
      return { formQuestions: [...state.formQuestions, newQuestion] };
    }),

  updateQuestionText: (id, text) =>
    set((state) => ({
      formQuestions: state.formQuestions.map((q) =>
        q.id === id ? { ...q, questionText: text } : q
      ),
    })),

  toggleRequired: (id) =>
    set((state) => ({
      formQuestions: state.formQuestions.map((q) =>
        q.id === id ? { ...q, required: !q.required } : q
      ),
    })),

  updateQuestionType: (id, newType) =>
    set((state) => ({
      formQuestions: state.formQuestions.map((q) =>
        q.id === id ? { ...q, questionType: newType, options: [] } : q
      ),
    })),

  addOption: (questionId, optionText = "") =>
    set((state) => ({
      formQuestions: state.formQuestions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: [
                ...q.options,
                { id: uuidv4(), text: optionText, order: q.options.length },
              ],
            }
          : q
      ),
      newOptionInputs: { ...state.newOptionInputs, [questionId]: "" },
    })),

  removeOption: (questionId, optionId) =>
    set((state) => ({
      formQuestions: state.formQuestions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.filter((option) => option.id !== optionId),
            }
          : q
      ),
    })),

  reorderQuestions: (startIndex, endIndex) =>
    set((state) => {
      const newQuestions = Array.from(state.formQuestions);
      const [reorderedItem] = newQuestions.splice(startIndex, 1);
      newQuestions.splice(endIndex, 0, reorderedItem);
      return { formQuestions: newQuestions };
    }),

  reorderOptions: (questionId, startIndex, endIndex) =>
    set((state) => ({
      formQuestions: state.formQuestions.map((q) => {
        if (q.id === questionId) {
          const newOptions = Array.from(q.options);
          const [reorderedItem] = newOptions.splice(startIndex, 1);
          newOptions.splice(endIndex, 0, reorderedItem);
          return { ...q, options: newOptions };
        }
        return q;
      }),
    })),

  deleteQuestion: (id) =>
    set((state) => ({
      formQuestions: state.formQuestions.filter((q) => q.id !== id),
    })),

  setFormName: (name) => set({ formName: name }),
  setFormDescription: (description) => set({ formDescription: description }),
  setNewOptionInput: (questionId, value) =>
    set((state) => ({
      newOptionInputs: { ...state.newOptionInputs, [questionId]: value },
    })),

  updateOptionText: (questionId, optionId, text) =>
    set((state) => ({
      formQuestions: state.formQuestions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((o) =>
                o.id === optionId ? { ...o, text } : o
              ),
            }
          : q
      ),
    })),
  saveForm: async () => {
    const { formName, formDescription, formQuestions } = get();
    const formData = {
      title: formName,
      description: formDescription,
      questions: formQuestions.map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        required: q.required,
        options: q.options,
      })),
    };

    const promise = createForm(formData);

    toast.promise(promise, {
      loading: "Creating form...",
      success: (result) => {
        // You might want to clear the form or perform other actions here
        // set({ formQuestions: [], formName: "", formDescription: "" });
        return result.message;
      },
      error: (error) => {
        console.error("Form creation error:", error);
        return error.message || "Failed to create form";
      },
    });
  },
  onDragEnd: (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === "question") {
      get().reorderQuestions(source.index, destination.index);
    } else if (type === "option") {
      const [questionId] = source.droppableId.split("-");
      get().reorderOptions(questionId, source.index, destination.index);
    }
  },
}));
