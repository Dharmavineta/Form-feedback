import { getFormById, getPublicFormById } from "@/app/actions";
import React from "react";
import ResponseForm from "./_components/response-form";

const FormView = async ({
  params,
}: {
  params: { slug: string; formId: string };
}) => {
  const formData = await getPublicFormById(params.formId);
  console.log(params.formId, "This is the formId");
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        backgroundColor: `${formData.backgroundColor}`,
      }}
    >
      <ResponseForm formData={formData} />
    </div>
  );
};

export default FormView;
