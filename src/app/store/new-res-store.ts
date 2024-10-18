import { create } from "zustand";

interface Question {
  questionId: string;
  originalQuestion: string;
  answer: string;
}

interface NewResStore {
  questions: Question[];
}
