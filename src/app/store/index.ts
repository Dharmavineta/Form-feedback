import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { questionTypeEnum, QuestionOption, FormType } from "@/db/schema";
import { createForm } from "@/app/actions";
import { toast } from "sonner";
import { DropResult } from "@hello-pangea/dnd";

export type QuestionType = (typeof questionTypeEnum.enumValues)[number];

export interface Question {
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
  // initializeFormData: (
  //   formData: FormType & { questions: QuestionType[] }
  // ) => void;

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
    set((state) => ({
      formQuestions: [
        ...state.formQuestions,
        {
          id: uuidv4(),
          questionText,
          questionType: "text",
          options: [],
          required: false,
        },
      ],
    })),

  // initializeFormData: (formData) =>
  //   set({
  //     formName: formData.title,
  //     formDescription: formData.description || "",
  //     formQuestions: formData.questions.map((q) => ({
  //       id: q.id,
  //       questionText: q.questionText,
  //       questionType: q.questionType as QuestionType,
  //       options: (q.options as QuestionOption[]) || [],
  //       required: q.required,
  //     })),
  //     newOptionInputs: {},
  //   }),

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
          ? { ...q, options: q.options.filter((o) => o.id !== optionId) }
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
    set((state) => {
      const updatedQuestions = state.formQuestions.map((q) => {
        if (q.id === questionId) {
          const newOptions = Array.from(q.options);
          const [reorderedItem] = newOptions.splice(startIndex, 1);
          newOptions.splice(endIndex, 0, reorderedItem);
          // Update the order property of each option
          newOptions.forEach((option, index) => {
            option.order = index;
          });
          return { ...q, options: newOptions };
        }
        return q;
      });
      return { formQuestions: updatedQuestions };
    }),

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
        return result.message;
      },
      error: (error) => {
        console.error("Form creation error:", error);
        return error.message || "Failed to create form";
      },
    });
  },

  onDragEnd: (result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (type === "question") {
      set((state) => {
        const newQuestions = Array.from(state.formQuestions);
        const [reorderedItem] = newQuestions.splice(source.index, 1);
        newQuestions.splice(destination.index, 0, reorderedItem);
        return { formQuestions: newQuestions };
      });
    } else if (type === "option") {
      const questionId = source.droppableId.split("-options")[0];
      set((state) => {
        const updatedQuestions = state.formQuestions.map((q) => {
          if (q.id === questionId) {
            const newOptions = Array.from(q.options);
            const [reorderedItem] = newOptions.splice(source.index, 1);
            newOptions.splice(destination.index, 0, reorderedItem);
            newOptions.forEach((option, index) => {
              option.order = index;
            });
            return { ...q, options: newOptions };
          }
          return q;
        });
        return { formQuestions: updatedQuestions };
      });
    }
  },
}));
