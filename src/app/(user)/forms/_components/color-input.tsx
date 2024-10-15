import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import React, { useState } from "react";

const ColorInput = () => {
  const colors = [
    { id: 1, code: "#edf6f9" },
    { id: 2, code: "#f8edeb" },
    { id: 3, code: "#eff7f6" },
    { id: 4, code: "#ede0d4" },
    { id: 5, code: "#f8f9fa" },
    { id: 6, code: "#e0e1dd" },
    { id: 7, code: "#faf3dd" },
    { id: 8, code: "#eaf4f4" },
    { id: 9, code: "#e2eafc" },
  ];
  const [color, setColor] = useState("#FFFFFFF");
  return (
    <div className="px-5 mt-10 w-full">
      <div className="flex flex-col gap-y-4">
        <Label className="font-bold text-sm">
          Background Color For your Form
        </Label>
        <div className="grid grid-cols-3 gap-y-5 place-items-center">
          {colors.map((c, i) => (
            <div
              style={{ backgroundColor: `${c.code}` }}
              key={c.id}
              onClick={() => setColor(c.code)}
              className={cn(
                `w-10 cursor-pointer h-10 rounded-full`,
                color === c.code && "border border-black"
              )}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ColorInput;
