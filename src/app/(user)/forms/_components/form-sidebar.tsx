"use client";

import React, { useState } from "react";
import AiInput from "./ai-input";
import ColorInput from "./color-input";

const FormSidebar = () => {
  return (
    <div className="hidden md:fixed h-screen lg:block border-r w-[350px]">
      <AiInput />
      <div>
        <ColorInput />
      </div>
    </div>
  );
};

export default FormSidebar;
