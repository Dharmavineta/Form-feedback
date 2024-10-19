import { getFormById, getPublicFormById } from "@/app/actions";
import React from "react";
import ResponseForm from "./_components/response-form";
import NewResponseForm from "./_components/new-response-form";

const FormView = async ({
  params,
}: {
  params: { slug: string; formId: string };
}) => {
  const formData = await getPublicFormById(params.formId);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: `${formData.backgroundColor}`,
      }}
    >
      <NewResponseForm formData={formData} />
    </div>
  );
};

export default FormView;
