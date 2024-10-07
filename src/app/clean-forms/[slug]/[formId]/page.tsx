import { getFormById } from "@/app/actions";
import React from "react";
import ResponseForm from "./_components/response-form";

const FormView = async ({
  params,
}: {
  params: { slug: string; formId: string };
}) => {
  const formData = await getFormById(params.formId);
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundImage: "linear-gradient(to top, #fad0c4 0%, #ffd1ff 100%)",
      }}
    >
      <ResponseForm formData={formData} />
    </div>
  );
};

export default FormView;
