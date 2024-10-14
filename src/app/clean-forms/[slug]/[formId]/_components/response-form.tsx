"use client";
import React, { FC, useEffect, useState, useCallback } from "react";
import { useResponseStore } from "@/app/store/response-store";
import { rephraseQuestion } from "@/app/actions";
import { readStreamableValue } from "ai/rsc";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormType, QuestionType } from "@/db/schema";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type FormDataType = FormType & { questions: QuestionType[] };

const ResponseForm: FC<{ formData: FormDataType }> = ({ formData }) => {
  const {
    form,
    currentQuestionIndex,
    rephrasedQuestions,
    answers,
    isLoading,
    setForm,
    initializeResponse,
    addRephrasedQuestion,
    saveAnswer,
    moveToNextQuestion,
    submitResponses,
    conversationHistory,
    updateConversationHistory,
  } = useResponseStore();

  const [isRephrasing, setIsRephrasing] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [streamedQuestion, setStreamedQuestion] = useState<string>("");
  console.log(formData, "This is the formDATA bingo dingo dingo");

  useEffect(() => {
    setForm(formData);
    initializeResponse();
  }, [formData, setForm, initializeResponse]);

  const rephraseCurrentQuestion = useCallback(async () => {
    if (!form || currentQuestionIndex >= form.questions.length) return;

    setIsRephrasing(true);
    const currentQuestion = form.questions[currentQuestionIndex];

    // Build context from conversation history
    const context = conversationHistory
      .map(
        ({ question, answer }) => `Question: "${question}" Answer: "${answer}"`
      )
      .join("\n");

    try {
      const { output } = await rephraseQuestion(
        currentQuestion.questionText,
        context
      );

      let rephrased = "";
      for await (const delta of readStreamableValue(output)) {
        rephrased += delta;
        setStreamedQuestion(rephrased);
      }
      addRephrasedQuestion(rephrased);
    } catch (error) {
      console.error("Failed to rephrase question:", error);
    } finally {
      setIsRephrasing(false);
    }
  }, [form, currentQuestionIndex, conversationHistory, addRephrasedQuestion]);

  useEffect(() => {
    if (!form || rephrasedQuestions[currentQuestionIndex]) return;
    rephraseCurrentQuestion();
  }, [form, currentQuestionIndex, rephraseCurrentQuestion, rephrasedQuestions]);

  const router = useRouter();

  const handleAnswer = () => {
    if (!form) return;

    const currentQuestion = form.questions[currentQuestionIndex];

    if (currentQuestion.required && !currentAnswer) {
      toast.error("This question is required. Please provide an answer.");
      return;
    }

    if (currentAnswer) {
      saveAnswer({
        questionId: currentQuestion.id,
        answerText: currentAnswer,
      });
      updateConversationHistory(
        rephrasedQuestions[currentQuestionIndex] ||
          currentQuestion.questionText,
        currentAnswer
      );
    }

    setCurrentAnswer("");
    if (currentQuestionIndex < form.questions.length - 1) {
      moveToNextQuestion();
    } else {
      handleSubmit();
      // Redirect to the thank you page
      router.push("/thank-you");
    }
  };

  const handleSubmit = useCallback(async () => {
    try {
      await submitResponses();
      toast.success("Thank you for completing the questionnaire!");
      // Handle successful submission (e.g., redirect)
    } catch (error) {
      console.error("Failed to submit responses:", error);
      toast.error("Failed to submit responses. Please try again.");
    }
  }, [submitResponses]);

  const handleSkip = useCallback(() => {
    if (!form) return;
    const currentQuestion = form.questions[currentQuestionIndex];

    // Save an empty answer for the skipped question
    saveAnswer({
      questionId: currentQuestion.id,
      answerText: "",
    });
    // Update conversation history with skipped question
    updateConversationHistory(
      rephrasedQuestions[currentQuestionIndex] || currentQuestion.questionText,
      "[Skipped]"
    );

    setCurrentAnswer("");
    if (currentQuestionIndex < form.questions.length - 1) {
      moveToNextQuestion();
    } else {
      handleSubmit();
    }
  }, [
    form,
    currentQuestionIndex,
    saveAnswer,
    moveToNextQuestion,
    updateConversationHistory,
    rephrasedQuestions,
    handleSubmit, // Add this to the dependency array
  ]);

  const fadeVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const renderQuestionInput = () => {
    if (!form) return null;

    const currentQuestion = form.questions[currentQuestionIndex];

    switch (currentQuestion.questionType) {
      case "text":
        return (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeVariants}
            transition={{ duration: 0.5 }}
          >
            <Input
              type="text"
              onChange={(e) => setCurrentAnswer(e.target.value)}
              className="w-full"
            />
          </motion.div>
        );
      case "radio":
        return (
          <RadioGroup
            onValueChange={(value) => setCurrentAnswer(value)}
            className="grid grid-cols-1 gap-y-5  "
          >
            <AnimatePresence>
              {currentQuestion.options?.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeVariants}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center space-x-2 mb-2  "
                >
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="font-medium text-sm">
                    {option.text}
                  </Label>
                </motion.div>
              ))}
            </AnimatePresence>
          </RadioGroup>
        );
      case "checkbox":
        return (
          <div>
            <AnimatePresence>
              {currentQuestion.options?.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial="hidden"
                  animate="visible"
                  variants={fadeVariants}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-center space-x-2 mb-2"
                >
                  <Checkbox
                    id={option.id}
                    onCheckedChange={(checked) => {
                      if (checked) setCurrentAnswer(option.text);
                    }}
                  />
                  <Label htmlFor={option.id}>{option.text}</Label>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        );
      case "select":
        return (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeVariants}
            transition={{ duration: 0.5 }}
          >
            <Select onValueChange={(value) => setCurrentAnswer(value)}>
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
            initial="hidden"
            animate="visible"
            variants={fadeVariants}
            transition={{ duration: 0.5 }}
          >
            <Input
              type="date"
              onChange={(e) => setCurrentAnswer(e.target.value)}
              className="w-full"
            />
          </motion.div>
        );
      case "time":
        return (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeVariants}
            transition={{ duration: 0.5 }}
          >
            <Input
              type="time"
              onChange={(e) => setCurrentAnswer(e.target.value)}
              className="w-full"
            />
          </motion.div>
        );
      default:
        return null;
    }
  };

  if (!form || isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col p-6 w-full font-sans">
      <div className="w-full flex text-left flex-col">
        <h2 className="text-3xl font-bold mb-2">{form.title}</h2>
        <p className="text-lg mb-12">{form.description}</p>
      </div>
      <div className="flex-1 flex mt-40 justify-center">
        {currentQuestionIndex < form.questions.length ? (
          <div className="flex flex-col items-center w-full max-w-2xl ">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestionIndex}
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={fadeVariants}
                transition={{ duration: 0.5 }}
                className="mb-6 w-full flex flex-col gap-y-4"
              >
                <h3 className="text-2xl font-semibold mb-4 text-start border-b border-purple-200 pb-2">
                  {streamedQuestion || (
                    <div className="h-5 w-2 animate-pulse bg-black"></div>
                  )}
                </h3>
                {!isRephrasing && streamedQuestion && renderQuestionInput()}
              </motion.div>
            </AnimatePresence>
            <div className="w-full flex justify-end mt-6">
              <motion.button
                className="rounded-full bg-black p-3 text-white hover:bg-transparent hover:border hover:border-black hover:text-black transition-all duration-300"
                onClick={handleAnswer}
                disabled={isRephrasing || !streamedQuestion}
              >
                <ArrowRight size={24} />
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h3 className="text-2xl font-semibold mb-4">
              Thank you for completing the questionnaire!
            </h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResponseForm;
