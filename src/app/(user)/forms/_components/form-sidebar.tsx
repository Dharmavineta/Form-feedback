"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SparklesIcon } from "lucide-react";
import React, { useState } from "react";

const FormSidebar = () => {
  const [input, setInput] = useState<string>("");
  return (
    <div className="hidden md:fixed h-screen md:block border-r w-[350px]">
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
          <Button size={"sm"} className="flex gap-x-2 ">
            Generate Form
            <SparklesIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FormSidebar;
