import { getFormById, getPublicFormById } from "@/app/actions";
import React from "react";
import ResponseForm from "./_components/response-form";

const FormView = async ({
  params,
}: {
  params: { slug: string; formId: string };
}) => {
  const formData = await getPublicFormById(params.formId);
  console.log(
    formData.backgroundColor,
    "This is the formData background color binbo binbo binob inbo binb;oi bn;lja"
  );
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: `${formData.backgroundColor}`,
      }}
    >
      <ResponseForm formData={formData} />
    </div>
  );
};

export default FormView;
