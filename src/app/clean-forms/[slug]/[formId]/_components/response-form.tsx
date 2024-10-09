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
import { continueConversation } from "@/app/actions";
import {
  getMutableAIState,
  readStreamableValue,
  useActions,
  useUIState,
} from "ai/rsc";

import { useChat } from "ai/react";

type formType = FormType & { questions: QuestionType[] };

type AnswerValue = string | string[] | undefined;
type SelectedAnswers = Record<string, AnswerValue>;

const ResponseForm = ({ formData }: { formData: formType }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [rephrasedQuestion, setRephrasedQuestion] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [isLoading, setIsLoading] = useState(true);
  const { messages, input, handleInputChange, handleSubmit } = useChat();
  const [generation, setGeneration] = useState<string>("");

  const currentQuestion = formData.questions[currentQuestionIndex];

  // const renderQuestionInput = () => {
  //   switch (currentQuestion.questionType) {
  //     case "text":
  //       return (
  //         <Input
  //           id={currentQuestion.id}
  //           type="text"
  //           value={(selectedAnswers[currentQuestion.id] as string) || ""}
  //           onChange={(e) => console.log(currentQuestion.id, e.target.value)}
  //         />
  //       );
  //     case "select":
  //       return (
  //         <Select
  //           value={selectedAnswers[currentQuestion.id] as string}
  //           onValueChange={(value) => console.log(currentQuestion.id, value)}
  //         >
  //           <SelectTrigger>
  //             <SelectValue placeholder="Choose one" />
  //           </SelectTrigger>
  //           <SelectContent>
  //             {currentQuestion.options?.map((option: QuestionOption) => (
  //               <SelectItem key={option.id} value={option.text}>
  //                 {option.text}
  //               </SelectItem>
  //             ))}
  //           </SelectContent>
  //         </Select>
  //       );
  //     case "radio":
  //       return (
  //         <RadioGroup
  //           value={selectedAnswers[currentQuestion.id] as string}
  //           onValueChange={(value) => console.log(currentQuestion.id, value)}
  //         >
  //           {currentQuestion.options?.map((option: QuestionOption) => (
  //             <div key={option.id} className="flex items-center space-x-2">
  //               <RadioGroupItem value={option.text} id={option.id} />
  //               <Label htmlFor={option.id}>{option.text}</Label>
  //             </div>
  //           ))}
  //         </RadioGroup>
  //       );
  //     case "checkbox":
  //       return (
  //         <div className="space-y-2">
  //           {currentQuestion.options?.map((option: QuestionOption) => (
  //             <label key={option.id} className="flex items-center space-x-2">
  //               <input
  //                 type="checkbox"
  //                 name={currentQuestion.id}
  //                 value={option.text}
  //                 checked={
  //                   Array.isArray(selectedAnswers[currentQuestion.id]) &&
  //                   (selectedAnswers[currentQuestion.id] as string[]).includes(
  //                     option.text
  //                   )
  //                 }
  //                 onChange={(e) => {
  //                   const currentAnswers =
  //                     (selectedAnswers[currentQuestion.id] as string[]) || [];
  //                   let updatedAnswers: string[];
  //                   if (e.target.checked) {
  //                     updatedAnswers = [...currentAnswers, option.text];
  //                   } else {
  //                     updatedAnswers = currentAnswers.filter(
  //                       (answer) => answer !== option.text
  //                     );
  //                   }
  //                   console.log(currentQuestion.id, updatedAnswers);
  //                 }}
  //               />
  //               <span>{option.text}</span>
  //             </label>
  //           ))}
  //         </div>
  //       );
  //     default:
  //       return null;
  //   }
  // };

  return (
    // <form className="w-[400px] flex flex-col gap-y-10">
    //   <div className="flex flex-col gap-y-8">
    //     <Label className="text-3xl" htmlFor={currentQuestion.id}>
    //       {messages && messages.map((m) => <div key={m.id}>{m.content}</div>)}
    //     </Label>
    //     {renderQuestionInput()}
    //   </div>
    //   <div className="flex justify-end">
    //     <Button type="button">
    //       {currentQuestionIndex < formData.questions.length - 1
    //         ? "Next"
    //         : "Submit"}
    //     </Button>
    //   </div>
    // </form>
    <div>
      <button
        onClick={async () => {
          const { output } = await continueConversation(
            "Give me a nextjs compoent for a complex form"
          );

          for await (const delta of readStreamableValue(output)) {
            setGeneration(
              (currentGeneration) => `${currentGeneration}${delta}`
            );
          }
        }}
      >
        Ask
      </button>

      <div>{generation}</div>
    </div>
  );
};

export default ResponseForm;
