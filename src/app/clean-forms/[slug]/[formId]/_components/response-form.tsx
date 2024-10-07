// ResponseForm.tsx
"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormType, QuestionOption, QuestionType } from "@/db/schema";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { rephraseQuestion } from "@/app/actions";

type formType = FormType & { questions: QuestionType[] };

type AnswerValue = string | string[] | undefined;
type SelectedAnswers = Record<string, AnswerValue>;

const ResponseForm = ({ formData }: { formData: formType }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [rephrasedQuestion, setRephrasedQuestion] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [isLoading, setIsLoading] = useState(true);

  const currentQuestion = formData.questions[currentQuestionIndex];

  useEffect(() => {
    const fetchRephrasedQuestion = async () => {
      setIsLoading(true);
      setRephrasedQuestion(""); // Clear previous question
      const context =
        currentQuestionIndex > 0
          ? `Previous question: "${
              formData.questions[currentQuestionIndex - 1].questionText
            }", Answer: "${
              selectedAnswers[formData.questions[currentQuestionIndex - 1].id]
            }"`
          : "";

      try {
        const response = await rephraseQuestion(
          currentQuestion.questionText,
          context
        );
        const data = await response.json();
        setRephrasedQuestion(data.rephrasedQuestion);
      } catch (error) {
        console.error("Error fetching rephrased question:", error);
        setRephrasedQuestion(currentQuestion.questionText); // Fallback to original question
      } finally {
        setIsLoading(false);
      }
    };

    fetchRephrasedQuestion();
  }, [
    currentQuestionIndex,
    currentQuestion.questionText,
    formData.questions,
    selectedAnswers,
  ]);

  const handleInputChange = (questionId: string, value: AnswerValue) => {
    setSelectedAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionId]: value,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < formData.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Handle form submission
      console.log("Form submitted:", selectedAnswers);
    }
  };

  const renderQuestionInput = () => {
    switch (currentQuestion.questionType) {
      case "text":
        return (
          <Input
            id={currentQuestion.id}
            type="text"
            value={(selectedAnswers[currentQuestion.id] as string) || ""}
            onChange={(e) =>
              handleInputChange(currentQuestion.id, e.target.value)
            }
          />
        );
      case "select":
        return (
          <Select
            value={selectedAnswers[currentQuestion.id] as string}
            onValueChange={(value) =>
              handleInputChange(currentQuestion.id, value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose one" />
            </SelectTrigger>
            <SelectContent>
              {currentQuestion.options?.map((option: QuestionOption) => (
                <SelectItem key={option.id} value={option.text}>
                  {option.text}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "radio":
        return (
          <RadioGroup
            value={selectedAnswers[currentQuestion.id] as string}
            onValueChange={(value) =>
              handleInputChange(currentQuestion.id, value)
            }
          >
            {currentQuestion.options?.map((option: QuestionOption) => (
              <div key={option.id} className="flex items-center space-x-2">
                <RadioGroupItem value={option.text} id={option.id} />
                <Label htmlFor={option.id}>{option.text}</Label>
              </div>
            ))}
          </RadioGroup>
        );
      case "checkbox":
        return (
          <div className="space-y-2">
            {currentQuestion.options?.map((option: QuestionOption) => (
              <label key={option.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name={currentQuestion.id}
                  value={option.text}
                  checked={
                    Array.isArray(selectedAnswers[currentQuestion.id]) &&
                    (selectedAnswers[currentQuestion.id] as string[]).includes(
                      option.text
                    )
                  }
                  onChange={(e) => {
                    const currentAnswers =
                      (selectedAnswers[currentQuestion.id] as string[]) || [];
                    let updatedAnswers: string[];
                    if (e.target.checked) {
                      updatedAnswers = [...currentAnswers, option.text];
                    } else {
                      updatedAnswers = currentAnswers.filter(
                        (answer) => answer !== option.text
                      );
                    }
                    handleInputChange(currentQuestion.id, updatedAnswers);
                  }}
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <form className="w-[400px] flex flex-col gap-y-10">
      <div className="flex flex-col gap-y-8">
        <Label className="text-3xl" htmlFor={currentQuestion.id}>
          {rephrasedQuestion ||
            (isLoading
              ? "Rephrasing question..."
              : currentQuestion.questionText)}
        </Label>
        {renderQuestionInput()}
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={handleNext}>
          {currentQuestionIndex < formData.questions.length - 1
            ? "Next"
            : "Submit"}
        </Button>
      </div>
    </form>
  );
};

export default ResponseForm;
