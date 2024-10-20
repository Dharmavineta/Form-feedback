"use client";
import { useResponseStore } from "@/app/store/new-res-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormType, QuestionType } from "@/db/schema";
import React, { FC, useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { readStreamableValue } from "ai/rsc";
import { rephraseQuestion } from "@/app/actions";
import { toast } from "sonner";

type FormDataType = Omit<FormType, "userId"> & { questions: QuestionType[] };

const NewResponseForm: FC<{ formData: FormDataType }> = ({ formData }) => {
  const [currentText, setCurrentText] = useState<string>("");
  const [formAnswer, setFormAnswer] = useState<string>("");
  const [isStreamComplete, setIsStreamComplete] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
  const animationRef = useRef<{ cancel: boolean }>({ cancel: false });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const optionVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  const {
    setFormQuestions,
    currentQuestionIndex,
    formQuestions,
    incrementQuestionIndex,
    addAnswer,
  } = useResponseStore();

  useEffect(() => {
    setFormQuestions(formData.questions);
  }, [formData.questions, setFormQuestions]);

  const animateText = async (text: string, startIndex: number) => {
    if (!text) return;

    for (let i = startIndex + 1; i <= text.length; i++) {
      if (animationRef.current.cancel) break;
      setCurrentText(text.slice(0, i));
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  };

  useEffect(() => {
    const currentRef = animationRef.current;
    currentRef.cancel = false;

    const rephraseCurrentQuestion = async () => {
      if (!formQuestions[currentQuestionIndex]) return;

      try {
        setShowOptions(false);
        setCurrentText("");
        setFormAnswer("");
        setSelectedCheckboxes([]);
        setIsStreamComplete(false);

        const { output } = await rephraseQuestion(
          formQuestions[currentQuestionIndex].questionText,
          "no context"
        );

        let accumulatedText = "";
        for await (const delta of readStreamableValue(output)) {
          if (currentRef.cancel) return;
          accumulatedText += delta;
          await animateText(
            accumulatedText,
            accumulatedText.length - (delta?.length || 0)
          );
        }

        if (!currentRef.cancel) {
          setIsStreamComplete(true);
          setTimeout(() => setShowOptions(true), 500);
        }
      } catch (error) {
        console.error("Error in rephraseCurrentQuestion:", error);
      }
    };

    rephraseCurrentQuestion();

    return () => {
      currentRef.cancel = true;
    };
  }, [currentQuestionIndex, formQuestions]);

  const handleCheckboxChange = (optionId: string, checked: boolean) => {
    setSelectedCheckboxes((prev) => {
      if (checked) {
        return [...prev, optionId];
      } else {
        return prev.filter((id) => id !== optionId);
      }
    });
    setFormAnswer((prev) => {
      const currentOptions = formQuestions[currentQuestionIndex].options || [];
      const selectedOptions = currentOptions
        .filter((opt) =>
          checked
            ? [...selectedCheckboxes, optionId].includes(opt.id)
            : selectedCheckboxes
                .filter((id) => id !== optionId)
                .includes(opt.id)
        )
        .map((opt) => opt.text)
        .join(", ");
      return selectedOptions;
    });
  };

  const renderQuestionInput = () => {
    if (!formQuestions.length) return null;
    const currentQuestion = formQuestions[currentQuestionIndex];

    const renderInput = () => {
      switch (currentQuestion.questionType) {
        case "text":
          return (
            <motion.div
              variants={optionVariants}
              initial="hidden"
              animate="visible"
            >
              <Input
                type="text"
                placeholder="Type your answer here"
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                className="w-full border-t-0 border-r-0 border-l-0 rounded-r-none rounded-l-none"
              />
            </motion.div>
          );

        case "radio":
          return (
            <RadioGroup
              value={formAnswer}
              onValueChange={(value) => setFormAnswer(value)}
              className="grid grid-cols-1 gap-y-5"
            >
              {currentQuestion.options?.map((option, index) => (
                <motion.div
                  key={option.id}
                  custom={index}
                  variants={optionVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center space-x-2 mb-2"
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="font-medium text-sm">
                    {option.text}
                  </Label>
                </motion.div>
              ))}
            </RadioGroup>
          );

        case "checkbox":
          return (
            <div className="space-y-4">
              {currentQuestion.options?.map((option, index) => (
                <motion.div
                  key={option.id}
                  custom={index}
                  variants={optionVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={option.id}
                    checked={selectedCheckboxes.includes(option.id)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(option.id, checked as boolean)
                    }
                  />
                  <Label htmlFor={option.id} className="font-medium text-sm">
                    {option.text}
                  </Label>
                </motion.div>
              ))}
            </div>
          );

        case "select":
          return (
            <motion.div
              variants={optionVariants}
              initial="hidden"
              animate="visible"
            >
              <Select value={formAnswer} onValueChange={setFormAnswer}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent>
                  {currentQuestion.options?.map((option, index) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </motion.div>
          );

        case "date":
          return (
            <motion.div
              variants={optionVariants}
              initial="hidden"
              animate="visible"
            >
              <Input
                type="date"
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                className="w-full"
              />
            </motion.div>
          );

        case "time":
          return (
            <motion.div
              variants={optionVariants}
              initial="hidden"
              animate="visible"
            >
              <Input
                type="time"
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                className="w-full"
              />
            </motion.div>
          );

        default:
          return null;
      }
    };

    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="space-y-4"
      >
        {showOptions && renderInput()}
      </motion.div>
    );
  };

  const handleSaveAnswer = () => {
    if (!formAnswer) {
      toast.error("Please provide an answer before proceeding");
      return;
    }

    if (currentQuestionIndex === formQuestions.length - 1) {
      addAnswer({
        questionId: formQuestions[currentQuestionIndex].id,
        answerText: formAnswer,
      });
      toast.success("Thank you for completing the form!");
      return;
    }

    addAnswer({
      questionId: formQuestions[currentQuestionIndex].id,
      answerText: formAnswer,
    });
    incrementQuestionIndex();
  };

  return (
    <div className="space-y-6">
      <div className="max-w-lg">
        <h1 className="font-sans text-lg">
          {currentText}
          {!isStreamComplete && (
            <motion.span
              animate={{ opacity: [0, 1] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
              className="inline-block ml-1"
            >
              |
            </motion.span>
          )}
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {isStreamComplete && renderQuestionInput()}
      </AnimatePresence>

      {showOptions && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button onClick={handleSaveAnswer} className="mt-4">
            {currentQuestionIndex === formQuestions.length - 1
              ? "Submit"
              : "Next Question"}
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default NewResponseForm;
