import React, { useRef, useEffect } from "react";
import { Draggable, Droppable, DroppableProvided } from "@hello-pangea/dnd";
import { Plus, Trash2, GripVertical, LucideGrip } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useFormStore, Question } from "@/app/store";
import { questionTypeEnum } from "@/db/schema";
import { QuestionType } from "@/app/store";

interface QuestionItemProps {
  question: Question;
  index: number;
  isNewlyAdded: boolean;
  questionNumber: number; // Add this line
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  index,
  isNewlyAdded,
  questionNumber, // Add this line
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const newOptionInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isNewlyAdded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isNewlyAdded]);

  useEffect(() => {
    if (
      (question.questionType === "radio" ||
        question.questionType === "checkbox" ||
        question.questionType === "select") &&
      question.options.length === 0 &&
      newOptionInputRef.current
    ) {
      // Add a slight delay to ensure the input is rendered
      setTimeout(() => {
        newOptionInputRef.current?.focus();
      }, 0);
    }
  }, [question.questionType, question.options.length]);

  const {
    updateQuestionText,
    toggleRequired,
    updateQuestionType,
    deleteQuestion,
    addOption,
    removeOption,
    setNewOptionInput,
    updateOptionText,
    newOptionInputs,
    addNewQuestion,
  } = useFormStore();

  return (
    <Draggable draggableId={question.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="bg-white py-6 px-4 relative lg:w-[80%] border rounded-lg border-gray-200"
        >
          <div className="flex flex-col w-full">
            <div className="flex items-center w-full mb-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      {...provided.dragHandleProps}
                      className="absolute -left-8 top-1/2 -translate-y-1/2 flex items-center"
                    >
                      <LucideGrip className="text-sky-400 w-4 h-4 md:w-5 md:h-5" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Drag to reorder</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-zinc-800 font-normal text-xs mr-2 flex-shrink-0">
                {questionNumber}.
              </span>
              <Input
                type="text"
                value={question.questionText}
                onChange={(e) =>
                  updateQuestionText(question.id, e.target.value)
                }
                placeholder="Enter Your Question"
                className="flex-grow border-l-0 border-r-0 border-t-0 rounded-none"
                ref={inputRef}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteQuestion(question.id)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Delete question</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-x-4 items-center mt-2 ml-8">
              <Select
                value={question.questionType}
                onValueChange={(value) =>
                  updateQuestionType(question.id, value as QuestionType)
                }
              >
                <SelectTrigger className="w-[200px] md:w-[300px]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {questionTypeEnum.enumValues.map((type) => (
                    <SelectItem key={type} value={type}>
                      <span className="capitalize">{type}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center">
                <Checkbox
                  id={`required-${question.id}`}
                  checked={question.required}
                  onCheckedChange={() => toggleRequired(question.id)}
                  className="mr-2"
                />
                <Label htmlFor={`required-${question.id}`} className="text-sm">
                  Required
                </Label>
              </div>
            </div>
          </div>

          {/* Options section */}
          {(question.questionType === "radio" ||
            question.questionType === "checkbox" ||
            question.questionType === "select") && (
            <div className="ml-8 w-full md:w-[400px] lg:w-[500px] mt-4">
              <h4 className="font-semibold text-muted-foreground mb-2">
                Options:
              </h4>
              <Droppable droppableId={`${question.id}-options`} type="option">
                {(optionsProvided: DroppableProvided) => {
                  console.log("Rendering Droppable for question:", question.id);
                  return (
                    <div
                      {...optionsProvided.droppableProps}
                      ref={optionsProvided.innerRef}
                    >
                      {question.options.map((option, optionIndex) => (
                        <Draggable
                          key={option.id}
                          draggableId={`${question.id}-${option.id}`}
                          index={optionIndex}
                        >
                          {(optionProvided) => (
                            <div
                              ref={optionProvided.innerRef}
                              {...optionProvided.draggableProps}
                              {...optionProvided.dragHandleProps}
                              className="flex items-center mb-2"
                            >
                              <GripVertical className="mr-2 h-4 w-4" />
                              <Input
                                type="text"
                                value={option.text}
                                onChange={(e) =>
                                  updateOptionText(
                                    question.id,
                                    option.id,
                                    e.target.value
                                  )
                                }
                                className="mr-2 w-[70%] md:w-full"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  removeOption(question.id, option.id)
                                }
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {optionsProvided.placeholder}
                    </div>
                  );
                }}
              </Droppable>
              <div className="flex items-center mt-2">
                <Input
                  type="text"
                  placeholder="Add option"
                  value={newOptionInputs[question.id] || ""}
                  onChange={(e) =>
                    setNewOptionInput(question.id, e.target.value)
                  }
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (
                      e.key === "Enter" &&
                      e.currentTarget.value.trim() !== ""
                    ) {
                      addOption(question.id, e.currentTarget.value.trim());
                    }
                  }}
                  className="mr-2"
                  ref={newOptionInputRef}
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const inputValue = newOptionInputs[question.id];
                          if (inputValue && inputValue.trim() !== "") {
                            addOption(question.id, inputValue.trim());
                          } else {
                            addOption(question.id);
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add new option</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          )}

          {/* Add Question button only for the last question */}
          {index === useFormStore.getState().formQuestions.length - 1 && (
            <div className="absolute bottom-0 left-0 right-0 flex justify-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={() => addNewQuestion()}
                      className="rounded-full transform translate-y-1/2"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add new question</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};

export default QuestionItem;
