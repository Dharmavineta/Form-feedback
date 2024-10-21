"use client";
import { useResponseStore } from "@/app/store/new-res-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { answers, FormType, QuestionType } from "@/db/schema";
import React, { FC, useEffect, useState, useCallback, useMemo } from "react";
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
import { ArrowRight } from "lucide-react";

type FormDataType = Omit<FormType, "userId"> & { questions: QuestionType[] };

const NewResponseForm: FC<{ formData: FormDataType }> = ({ formData }) => {
  const [streamedData, setStreamedData] = useState<string>("");
  const [formAnswer, setFormAnswer] = useState<string>("");
  const [isStreamComplete, setIsStreamComplete] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);

  const {
    setFormQuestions,
    currentQuestionIndex,
    formQuestions,
    incrementQuestionIndex,
    addAnswer,
    llmContext,
    setLlmContext,
    setFormMetadata,
  } = useResponseStore();

  const fadeVariants = useCallback(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, ease: "easeOut" },
      },
    }),
    []
  );

  const optionVariants = useCallback(
    () => ({
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
    }),
    []
  );

  const streamVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3 } },
  };

  useEffect(() => {
    setFormQuestions(formData.questions);
    setFormMetadata(formData.title, formData?.description || "");
  }, [formData, setFormQuestions, setFormMetadata]);

  useEffect(() => {
    const handleStream = async () => {
      try {
        setShowOptions(false);
        setStreamedData("");
        setFormAnswer("");
        setSelectedCheckboxes([]);
        setIsStreamComplete(false);

        let prompt = "";

        if (currentQuestionIndex === null) {
          prompt = `Based on this form titled "${formData.title}" with description "${formData.description}", create a warm, welcoming introduction message for the user. This should be friendly and set expectations for what's to come.`;
        } else if (currentQuestionIndex === formQuestions.length) {
          prompt = `Create a grateful, positive closing message thanking the user for completing the form titled "${formData.title}". Use the context of their previous answers to make it personal: ${llmContext}`;
        } else {
          prompt = formQuestions[currentQuestionIndex].questionText;
        }

        const { output } = await rephraseQuestion(prompt, llmContext);

        for await (const delta of readStreamableValue(output)) {
          setStreamedData((prev) => prev + delta);
        }

        setIsStreamComplete(true);
        setTimeout(() => setShowOptions(true), 500);
      } catch (error) {
        console.error("Error in handleStream:", error);
      }
    };

    handleStream();
  }, [
    currentQuestionIndex,
    formQuestions,
    llmContext,
    formData.title,
    formData.description,
  ]);

  const handleCheckboxChange = useCallback(
    (optionId: string, checked: boolean) => {
      setSelectedCheckboxes((prev) => {
        if (checked) {
          return [...prev, optionId];
        } else {
          return prev.filter((id) => id !== optionId);
        }
      });

      setFormAnswer((prev) => {
        if (currentQuestionIndex === null) return prev;
        const currentOptions =
          formQuestions[currentQuestionIndex].options || [];
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
    },
    [currentQuestionIndex, formQuestions, selectedCheckboxes]
  );

  const renderQuestionInput = useCallback(() => {
    if (
      !formQuestions.length ||
      currentQuestionIndex === null ||
      currentQuestionIndex === formQuestions.length
    )
      return null;
    const currentQuestion = formQuestions[currentQuestionIndex];

    const renderInput = () => {
      switch (currentQuestion.questionType) {
        case "text":
          return (
            <motion.div
              variants={optionVariants()}
              initial="hidden"
              animate="visible"
              className="w-full"
            >
              <Input
                type="text"
                placeholder="Type your answer here"
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                className="w-full border-t-0 border-r-0 border-l-0 rounded-r-none rounded-l-none min-w-[672px]"
              />
            </motion.div>
          );

        case "radio":
          return (
            <RadioGroup
              value={formAnswer}
              onValueChange={setFormAnswer}
              className="grid grid-cols-1 gap-y-5"
            >
              {currentQuestion.options?.map((option, index) => (
                <motion.div
                  key={option.id}
                  custom={index}
                  variants={optionVariants()}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center space-x-2 mb-2 w-[672px]"
                >
                  <RadioGroupItem value={option.text} id={option.id} />
                  <Label htmlFor={option.id} className="font-medium text-sm">
                    {option.text}
                  </Label>
                </motion.div>
              ))}
            </RadioGroup>
          );

        case "checkbox":
          return (
            <div className="space-y-4 w-[672px]">
              {currentQuestion.options?.map((option, index) => (
                <motion.div
                  key={option.id}
                  custom={index}
                  variants={optionVariants()}
                  initial="hidden"
                  animate="visible"
                  className="flex space-x-2 w-full"
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
              variants={optionVariants()}
              initial="hidden"
              animate="visible"
              className="w-[672px]"
            >
              <Select value={formAnswer} onValueChange={setFormAnswer}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {currentQuestion.options?.map((option) => (
                    <SelectItem key={option.id} value={option.text}>
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
              variants={optionVariants()}
              initial="hidden"
              animate="visible"
              className="w-[672px]"
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
              variants={optionVariants()}
              initial="hidden"
              animate="visible"
              className="w-[672px]"
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
        variants={fadeVariants()}
        className="space-y-4"
      >
        {renderInput()}
      </motion.div>
    );
  }, [
    currentQuestionIndex,
    formQuestions,
    formAnswer,
    selectedCheckboxes,
    handleCheckboxChange,
    fadeVariants,
    optionVariants,
  ]);

  const handleNext = async () => {
    if (currentQuestionIndex === null) {
      incrementQuestionIndex();
      return;
    }

    if (currentQuestionIndex < formQuestions.length) {
      if (!formAnswer) {
        toast.error("Please provide an answer before proceeding");
        return;
      }

      const currentQuestion = formQuestions[currentQuestionIndex];
      addAnswer({
        questionId: currentQuestion.id,
        answerText: formAnswer,
      });

      const newContext = `Question:${currentQuestion.questionText}\nAnswer:${formAnswer}`;
      setLlmContext(newContext);
    }

    if (currentQuestionIndex === formQuestions.length) {
      toast.success("Thank you for completing the form!");
      return;
    }

    incrementQuestionIndex();
  };

  return (
    <div className="space-y-6 min-h-screen w-full">
      <motion.div
        className="flex font-sans flex-col gap-y-4 p-10 lg:px-32 lg:py-16 max-w-6xl"
        initial="hidden"
        animate="visible"
        variants={fadeVariants()}
      >
        <motion.h1 className="text-4xl" variants={fadeVariants()}>
          {formData.title}
        </motion.h1>
        <motion.h1
          className="text-md text-muted-foreground"
          variants={fadeVariants()}
        >
          {formData.description}
        </motion.h1>
      </motion.div>
      <div className="flex flex-col gap-y-4 items-center justify-center">
        <motion.div
          variants={streamVariants}
          initial="hidden"
          animate="visible"
          className="font-sans text-xl w-[672px] min-h-[32px] relative"
        >
          {streamedData}
          {!isStreamComplete && (
            <motion.span
              animate={{ opacity: [0, 1] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
              className="absolute"
              style={{
                left: streamedData ? "auto" : "0",
                marginLeft: streamedData ? "1px" : "0",
              }}
            >
              |
            </motion.span>
          )}
        </motion.div>
      </div>
      <div className="flex flex-col items-center justify-center w-full">
        <div className="flex justify-center">
          <AnimatePresence mode="wait">
            {isStreamComplete &&
              currentQuestionIndex !== null &&
              currentQuestionIndex < formQuestions.length &&
              renderQuestionInput()}
          </AnimatePresence>
        </div>

        {showOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="w-[672px] flex justify-end"
          >
            <motion.div className="mt-10">
              <Button
                onClick={handleNext}
                size="icon"
                className="rounded-full w-12 h-12 transition-all duration-300 bg-primary hover:scale-110"
                aria-label={
                  currentQuestionIndex === null
                    ? "Begin"
                    : currentQuestionIndex === formQuestions.length
                    ? "Submit"
                    : "Next Question"
                }
              >
                <ArrowRight className="w-6 h-6" />
              </Button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NewResponseForm;
