"use client";
import React, { FC, useCallback } from "react";
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
import { FormType } from "@/db/schema";
interface FormBuilderProps {
  formData?: FormType | null;
}

const FormBuilder: FC<FormBuilderProps> = ({ formData }) => {
  const {
    formQuestions,
    formName,
    formDescription,
    addNewQuestion,
    setFormName,
    setFormDescription,
    saveForm,
    onDragEnd,
  } = useFormStore();

  const handleAddNewQuestion = useCallback(() => {
    addNewQuestion();
  }, [addNewQuestion]);

  const handleSaveForm = () => {
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

    saveForm();
  };

  return (
    <div className="px-10 md:px-10 lg:px-20 mx-auto min-h-screen">
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
        <div className="flex justify-center items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleAddNewQuestion}
                  className="rounded-full h-12 w-12 flex items-center p-0 justify-center"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a question</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <QuestionList questions={formQuestions} />
        </DragDropContext>
      )}

      <div className="flex justify-end mt-4">
        <Button size="sm" onClick={handleSaveForm}>
          {formData ? "Save Changes" : "Create Form"}
        </Button>
      </div>
    </div>
  );
};

export default React.memo(FormBuilder);
