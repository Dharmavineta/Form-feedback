"use client";
import { useResponseStore } from "@/app/store/new-res-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormType, QuestionType } from "@/db/schema";
import React, { FC, useEffect, useState } from "react";
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
  const [streamedData, setStreamedData] = useState<string | "">("");
  const [formAnswer, setFormAnswer] = useState<string | "">("");
  const [isStreamComplete, setIsStreamComplete] = useState<boolean>(false);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.5 } },
  };

  const optionVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.5,
        duration: 1,
        ease: "easeOut",
      },
    }),
    exit: (i: number) => ({
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: {
        delay: i * 0.05,
        duration: 0.3,
        ease: "easeIn",
      },
    }),
  };

  const renderQuestionInput = () => {
    if (!formQuestions.length) return null;
    const currentQuestion = formQuestions[currentQuestionIndex];

    switch (currentQuestion.questionType) {
      case "text":
        return (
          <motion.div
            key="text-input"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <Input
              type="text"
              placeholder="Type your answer here"
              onChange={(e) => setFormAnswer(e.target.value)}
              className="w-full border-t-0 border-r-0 border-l-0 rounded-r-none rounded-l-none "
            />
          </motion.div>
        );
      case "radio":
        return (
          <motion.div
            key="radio-group"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <RadioGroup
              onValueChange={(value) => setFormAnswer(value)}
              className="grid grid-cols-1 gap-y-5"
            >
              {currentQuestion.options?.map((option, index) => (
                <motion.div
                  key={option.id}
                  custom={index}
                  variants={optionVariants}
                  className="flex items-center space-x-2 mb-2"
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="font-medium text-sm">
                    {option.text}
                  </Label>
                </motion.div>
              ))}
            </RadioGroup>
          </motion.div>
        );
      case "checkbox":
        return (
          <motion.div
            key="checkbox-group"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            {currentQuestion.options?.map((option, index) => (
              <motion.div
                key={option.id}
                custom={index}
                variants={optionVariants}
                className="flex items-center space-x-2 mb-2"
              >
                <Checkbox
                  id={option.id}
                  onCheckedChange={(checked) => {
                    if (checked) setFormAnswer(option.text);
                  }}
                />
                <Label htmlFor={option.id}>{option.text}</Label>
              </motion.div>
            ))}
          </motion.div>
        );
      case "select":
        return (
          <motion.div
            key="select"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <Select onValueChange={(value) => setFormAnswer(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {currentQuestion.options?.map((option) => (
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
            key="date"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <Input
              type="date"
              onChange={(e) => setFormAnswer(e.target.value)}
              className="w-full"
            />
          </motion.div>
        );
      case "time":
        return (
          <motion.div
            key="time"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={containerVariants}
          >
            <Input
              type="time"
              onChange={(e) => setFormAnswer(e.target.value)}
              className="w-full"
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  const {
    setFormQuestions,
    currentQuestionIndex,
    formQuestions,
    incrementQuestionIndex,
    addAnswer,
    answers,
  } = useResponseStore();

  useEffect(() => {
    setFormQuestions(formData.questions);
  }, [formData.questions, setFormQuestions]);

  useEffect(() => {
    const rephraseCurrentQuestion = async () => {
      if (formQuestions[currentQuestionIndex]) {
        const { output } = await rephraseQuestion(
          formQuestions[currentQuestionIndex].questionText,
          "no context"
        );
        let rephrased = "";
        for await (const delta of readStreamableValue(output)) {
          rephrased += delta;
          setStreamedData(rephrased);
        }
        setIsStreamComplete(true);
      }
    };

    rephraseCurrentQuestion();
  }, [currentQuestionIndex, formQuestions]);

  const handleSaveAnswer = () => {
    if (currentQuestionIndex === formQuestions.length - 1) {
      return toast.info("Thank you for completing the form");
    }
    addAnswer({
      questionId: formQuestions[currentQuestionIndex].id,
      answerText: formAnswer,
    });
    incrementQuestionIndex();
  };

  return (
    <div>
      <div className="max-w-lg">
        <h1 className="font-sans">
          {streamedData ? (
            streamedData.split("").map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { duration: 1 },
                }}
                transition={{ duration: 0.1 }}
              >
                {char}
              </motion.span>
            ))
          ) : (
            <div className="h-5 w-2 animate-pulse bg-black"></div>
          )}
        </h1>
      </div>
      <AnimatePresence mode="wait">
        {isStreamComplete && renderQuestionInput()}
      </AnimatePresence>
      <Button onClick={handleSaveAnswer}>Next Question</Button>
    </div>
  );
};

export default NewResponseForm;
