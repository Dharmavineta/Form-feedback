"use client";
import { useResponseStore } from "@/app/store/new-res-store";
import { Button } from "@/components/ui/button";
import { FormType, QuestionType } from "@/db/schema";
import React, { FC, useEffect } from "react";

type FormDataType = Omit<FormType, "userId"> & { questions: QuestionType[] };

const NewResponseForm: FC<{ formData: FormDataType }> = ({ formData }) => {
  const {
    setFormQuestions,
    currentQuestionIndex,
    formQuestions,
    incrementQuestionIndex,
  } = useResponseStore();

  useEffect(() => {
    setFormQuestions(formData.questions);
  }, [formData.questions, setFormQuestions]);

  return (
    <div>
      <div>{formQuestions[currentQuestionIndex].questionText}</div>
      <Button onClick={() => incrementQuestionIndex()}>Next Question</Button>
    </div>
  );
};

export default NewResponseForm;
