"use client";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFormStore } from "@/app/store";
import QuestionList from "./QuestionList";
import { toast } from "sonner";
import { FormType, QuestionType } from "@/db/schema";
import { useRouter } from "next/navigation";
import { updateExistingForm } from "@/app/actions";
import Link from "next/link";
import LoadingState from "./loading-state";

type FormWithQuestions = FormType & {
  questions: QuestionType[];
};

interface FormBuilderProps {
  formData: FormWithQuestions | null;
}

const FormBuilder: FC<FormBuilderProps> = ({ formData }) => {
  const [loading, setLoading] = useState(true);
  const {
    formQuestions,
    formName,
    formDescription,
    addNewQuestion,
    setFormName,
    setFormDescription,
    saveForm,
    onDragEnd,
    initializeFormData,
    backgroundColor,
  } = useFormStore();
  const router = useRouter();

  useEffect(() => {
    initializeFormData(formData);
    setLoading(false);
  }, [formData, initializeFormData]);

  const handleAddNewQuestion = useCallback(() => {
    addNewQuestion();
  }, [addNewQuestion]);

  const handleSaveForm = async () => {
    if (!formName.trim()) {
      toast.error("Form Name Required", {
        description: "Please enter a name for your form before saving.",
      });
      return;
    }

    const emptyQuestions = formQuestions
      .map((q, index) => ({ ...q, number: index + 1 }))
      .filter((q) => !q.questionText.trim());

    if (emptyQuestions.length > 0) {
      const emptyQuestionNumbers = emptyQuestions
        .map((q) => q.number)
        .join(", ");
      const questionWord =
        emptyQuestions.length === 1 ? "question" : "questions";
      const isAre = emptyQuestions.length === 1 ? "is" : "are";

      toast.error("Empty Questions", {
        description: `Please fill in all question texts before saving. 
          ${emptyQuestions.length} ${questionWord} ${isAre} empty: ${emptyQuestionNumbers}.`,
      });
      return;
    }

    toast.promise(saveForm(), {
      loading: "Creating your form...",
      success: (data) => {
        router.push("/dashboard");
        return `${data.message} `;
      },
      error: "Failed to create the form",
    });
  };

  if (loading) return <LoadingState />;

  const handleEdit = async () => {
    if (!formData) {
      toast.error("No form data to update");
      return;
    }

    if (!formName.trim()) {
      toast.error("Form Name Required", {
        description: "Please enter a name for your form before saving.",
      });
      return;
    }

    const emptyQuestions = formQuestions
      .map((q, index) => ({ ...q, number: index + 1 }))
      .filter((q) => !q.questionText.trim());

    if (emptyQuestions.length > 0) {
      const emptyQuestionNumbers = emptyQuestions
        .map((q) => q.number)
        .join(", ");
      const questionWord =
        emptyQuestions.length === 1 ? "question" : "questions";
      const isAre = emptyQuestions.length === 1 ? "is" : "are";

      toast.error("Empty Questions", {
        description: `Please fill in all question texts before saving. 
          ${emptyQuestions.length} ${questionWord} ${isAre} empty: ${emptyQuestionNumbers}.`,
      });
      return;
    }

    const updatedFormData = {
      id: formData.id,
      title: formName,
      description: formDescription,
      isPublished: formData.isPublished,
      font: formData.font || "Arial", // Use existing font or default to "Arial"
      backgroundColor: backgroundColor || "#FFFFFF", // Use existing backgroundColor or default to white
      questions: formQuestions.map((q) => ({
        questionText: q.questionText,
        questionType: q.questionType,
        required: q.required,
        options: q.options,
      })),
    };

    toast.promise(updateExistingForm(updatedFormData), {
      loading: "Updating your form...",
      success: (data) => {
        return `${data.message}`;
      },
      error: "Failed to update the form",
    });
  };

  return (
    <div className="px-10 md:px-10 lg:px-20 mx-auto min-h-[calc(100vh-3.6rem)] flex flex-col ">
      <div className="flex justify-between w-full pt-4">
        <Link
          className="text-sm  hover:underline flex items-center justify-center"
          href={"/dashboard"}
        >
          &larr; Dashboard
        </Link>
        <div className="flex text-sm items-center gap-x-2 fixed right-16">
          <h1>
            Theme<strong>:</strong>
          </h1>
          <div
            style={{ background: `${backgroundColor}` }}
            className="w-5 h-5 font-bold"
          >
            {backgroundColor === "#FFFFFF" && "white"}
          </div>
        </div>
      </div>
      {/* Form Name and Description */}
      <div className="bg-white w-full rounded-lg pt-8 mb-14 md:w-[90%]">
        <div className="w-full">
          <Input
            type="text"
            placeholder="Form Name"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full text-4xl font-semibold border-none focus:ring-0 focus:outline-none placeholder:text-gray-300 mb-2"
          />
          <div className="h-px bg-gray-200 w-full mb-2"></div>
          <Input
            type="text"
            placeholder="Form Description"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            className="w-full text-base text-gray-600 border-none focus:ring-0 focus:outline-none placeholder:text-gray-300"
          />
        </div>
      </div>

      {formQuestions.length === 0 ? (
        <div className="flex justify-center items-center flex-1 pb-10">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  onClick={handleAddNewQuestion}
                  className="rounded-full h-12 w-12"
                >
                  <Plus className="h-4 w-4 " />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a question</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        <div className="pb-20">
          <DragDropContext onDragEnd={onDragEnd}>
            <QuestionList questions={formQuestions} />
          </DragDropContext>
        </div>
      )}

      <div className="flex justify-end items-end mt-4 pb-10 fixed bottom-0 right-20">
        <Button size="sm" onClick={formData ? handleEdit : handleSaveForm}>
          {formData ? "Save Changes" : "Create Form"}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(FormBuilder);
