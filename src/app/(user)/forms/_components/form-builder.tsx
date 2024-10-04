"use client";
import React, { FC } from "react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

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
import { questionTypeEnum } from "@/db/schema";
import { useFormStore } from "@/app/store";

type QuestionType = (typeof questionTypeEnum.enumValues)[number];

const FormBuilder: FC = () => {
  const {
    formQuestions,
    formName,
    formDescription,
    newOptionInputs,
    addNewQuestion,
    updateQuestionText,
    toggleRequired,
    updateQuestionType,
    addOption,
    removeOption,
    deleteQuestion,
    setFormName,
    setFormDescription,
    setNewOptionInput,
    updateOptionText,
    saveForm,
    onDragEnd,
  } = useFormStore();

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
                  onClick={() => addNewQuestion()}
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
          <Droppable droppableId="questions" type="question">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-12"
              >
                {formQuestions.map((question, index) => (
                  <Draggable
                    key={question.id}
                    draggableId={question.id}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="bg-white py-10 px-5 relative lg:w-[80%] border rounded-lg border-gray-200"
                      >
                        <div className="flex flex-col w-full">
                          <div className="flex items-center w-full mb-4">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <div
                                    {...provided.dragHandleProps}
                                    className="mr-4 md:absolute md:-left-8 md:top-1/2 md:-translate-y-1/2"
                                  >
                                    <LucideGrip className="text-sky-400 w-4 h-4 md:w-5 md:h-5" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Drag to reorder</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Input
                              type="text"
                              value={question.questionText}
                              onChange={(e) =>
                                updateQuestionText(question.id, e.target.value)
                              }
                              placeholder="Enter Your Question"
                              className="flex-grow border-l-0 border-r-0 border-t-0 rounded-none"
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
                                updateQuestionType(
                                  question.id,
                                  value as QuestionType
                                )
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
                                onCheckedChange={() =>
                                  toggleRequired(question.id)
                                }
                                className="mr-2"
                              />
                              <Label
                                htmlFor={`required-${question.id}`}
                                className="text-sm"
                              >
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
                            <Droppable
                              droppableId={`${question.id}-options`}
                              type="option"
                            >
                              {(provided) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                >
                                  {question.options.map((option, i) => (
                                    <Draggable
                                      key={option.id}
                                      draggableId={option.id}
                                      index={i}
                                    >
                                      {(provided) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className="flex items-center mb-2"
                                        >
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger>
                                                <div
                                                  {...provided.dragHandleProps}
                                                  className="mr-2"
                                                >
                                                  <GripVertical className="text-gray-400" />
                                                </div>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Drag to reorder option</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
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
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  onClick={() =>
                                                    removeOption(
                                                      question.id,
                                                      option.id
                                                    )
                                                  }
                                                >
                                                  <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                              </TooltipTrigger>
                                              <TooltipContent>
                                                <p>Delete option</p>
                                              </TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                            <div className="flex items-center mt-2 ml-6">
                              <Input
                                type="text"
                                placeholder="Add option"
                                value={newOptionInputs[question.id] || ""}
                                onChange={(e) =>
                                  setNewOptionInput(question.id, e.target.value)
                                }
                                onKeyDown={(
                                  e: React.KeyboardEvent<HTMLInputElement>
                                ) => {
                                  if (
                                    e.key === "Enter" &&
                                    e.currentTarget.value.trim() !== ""
                                  ) {
                                    addOption(
                                      question.id,
                                      e.currentTarget.value.trim()
                                    );
                                  }
                                }}
                                className="mr-2"
                              />
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        const inputValue =
                                          newOptionInputs[question.id];
                                        if (
                                          inputValue &&
                                          inputValue.trim() !== ""
                                        ) {
                                          addOption(
                                            question.id,
                                            inputValue.trim()
                                          );
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
                        {index === formQuestions.length - 1 && (
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
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      <div className="flex justify-end mt-4">
        <Button size="sm" onClick={saveForm}>
          Save Form
        </Button>
      </div>
    </div>
  );
};

export default FormBuilder;
