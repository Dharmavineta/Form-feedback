import { generateAIForm } from "@/app/actions";
import { useFormStore } from "@/app/store";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SparklesIcon } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";

const AiInput = () => {
  const [disabled, setDisabled] = useState(false);
  const [input, setInput] = useState<string>("");
  const { initializeFormData } = useFormStore();
  const { user } = useUser();

  const handleAIForm = async () => {
    setDisabled(true);
    if (input.trim().length < 20) {
      toast.error("Please enter a valid query");
      setDisabled(false);
      return;
    }

    try {
      const formString = await generateAIForm(input);
      const object = JSON.parse(formString as string);

      // Initialize the form data with the AI-generated object
      initializeFormData({
        id: user?.id as string,
        title: object.title,
        description: object.description,
        isPublished: object.isPublished,
        font: object.font,
        backgroundColor: object.backgroundColor,
        questions: object.questions,
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: "",
        publishedAt: null,
      });

      toast.success("AI form generated successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate AI form");
    } finally {
      setDisabled(false);
    }
  };

  return (
    <div className="flex flex-col gap-y-5">
      <div className="pt-10 px-5 space-y-1 ">
        <Label className="font-bold" htmlFor="ai">
          AI Form Assistant
        </Label>
        <div className="relative">
          <Textarea
            onChange={(e) => setInput(e.target.value)}
            id="ai"
            className="min-h-32 max-h-52"
            placeholder="Enter your form query here"
          />
          {!input && (
            <SparklesIcon className="h-4 w-4  absolute top-[11px] right-[110px] text-gray-400" />
          )}
        </div>
      </div>
      <div className="flex justify-end pr-5">
        <Button
          disabled={input.trim().length < 15 || disabled}
          size={"sm"}
          className="flex gap-x-2 "
          onClick={handleAIForm}
        >
          Generate Form
          <SparklesIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AiInput;
