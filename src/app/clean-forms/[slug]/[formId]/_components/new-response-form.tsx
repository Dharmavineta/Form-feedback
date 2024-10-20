"use client";
import { useResponseStore } from "@/app/store/new-res-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { answers, FormType, QuestionType } from "@/db/schema";
import React, {
  FC,
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
  const [currentText, setCurrentText] = useState<string>("");
  const [formAnswer, setFormAnswer] = useState<string>("");
  const [isStreamComplete, setIsStreamComplete] = useState<boolean>(false);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<string[]>([]);
  const animationRef = useRef<{ cancel: boolean }>({ cancel: false });

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    }),
    []
  );

  const optionVariants = useMemo(
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

  const {
    setFormQuestions,
    currentQuestionIndex,
    formQuestions,
    incrementQuestionIndex,
    addAnswer,
    llmContext,
    setLlmContext,
    answers: userAnswers,
  } = useResponseStore();

  useEffect(() => {
    setFormQuestions(formData.questions);
  }, [formData.questions, setFormQuestions]);

  const animateText = async (text: string, startIndex: number) => {
    if (!text) return;

    for (let i = startIndex + 1; i <= text.length; i++) {
      if (animationRef.current.cancel) break;
      setCurrentText(text.slice(0, i));
      await new Promise((resolve) => setTimeout(resolve, 0));
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
          llmContext
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
  }, [currentQuestionIndex, formQuestions, llmContext]);

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
              className="w-full"
            >
              <Input
                type="text"
                placeholder="Type your answer here"
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                className="w-full border-t-0 border-r-0 border-l-0 rounded-r-none rounded-l-none min-w-[512px] md:min-w-[672px]"
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
                  variants={optionVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center space-x-2 mb-2 md:w-[512px] md:min-w-[672px]"
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
            <div className="space-y-4 w-[512px] md:w-[672px]">
              {currentQuestion.options?.map((option, index) => (
                <motion.div
                  key={option.id}
                  custom={index}
                  variants={optionVariants}
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
              variants={optionVariants}
              initial="hidden"
              animate="visible"
              className="w-full min-w-[512px] md:min-w-[672px]"
            >
              <Select value={formAnswer} onValueChange={setFormAnswer}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an option" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {currentQuestion.options?.map((option, index) => (
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
              variants={optionVariants}
              initial="hidden"
              animate="visible"
              className="w-full"
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
              className="w-full"
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
  }, [
    currentQuestionIndex,
    formQuestions,
    formAnswer,
    selectedCheckboxes,
    handleCheckboxChange,
    containerVariants,
    optionVariants,
    showOptions,
  ]);

  const currentQuestion = useMemo(
    () => formQuestions[currentQuestionIndex],
    [formQuestions, currentQuestionIndex]
  );

  const handleSaveAnswer = async () => {
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

    const newContext = `Question:${currentQuestion.questionText}\nAnswer:${formAnswer}`;
    setLlmContext(newContext);

    incrementQuestionIndex();
  };

  const isLastQuestion = currentQuestionIndex === formQuestions.length - 1;

  return (
    <div className="space-y-6 min-h-screen w-full">
      <div className="flex font-sans flex-col gap-y-4 p-10 lg:px-32 lg:py-16 max-w-6xl">
        <h1 className=" text-4xl">{formData.title}</h1>
        <h1 className=" text-md text-muted-foreground">
          {formData.description}
        </h1>
      </div>
      <div className=" flex flex-col gap-y-4 items-center justify-center">
        <h1 className="font-sans text-xl max-w-lg md:max-w-2xl">
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
      <div className="flex flex-col items-center justify-center w-full ">
        <div className="flex justify-center ">
          <AnimatePresence mode="wait">
            {isStreamComplete && renderQuestionInput()}
          </AnimatePresence>
        </div>

        {showOptions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className=" w-[512px] md:w-[672px] flex justify-end"
          >
            {isLastQuestion ? (
              <Button onClick={handleSaveAnswer} className="mt-4">
                Submit
              </Button>
            ) : (
              <motion.div className="mt-4">
                <Button
                  onClick={handleSaveAnswer}
                  size="icon"
                  className="rounded-full w-12 h-12 transition-all duration-300 bg-primary text-primary-foreground border-2 hover:bg-transparent hover:text-black hover:border-slate-300"
                  aria-label="Next Question"
                >
                  <ArrowRight className="w-6 h-6" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default NewResponseForm;
