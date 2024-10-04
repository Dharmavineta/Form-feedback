import React from "react";
import FormBuilder from "../_components/form-builder";
import { getFormById } from "@/app/actions";
import { notFound } from "next/navigation";

interface FormPageProps {
  params: {
    formId: string;
  };
}

const FormPage = async ({ params }: FormPageProps) => {
  const formId = params.formId;

  if (formId === "create") {
    // Handle new form creation
    return <FormBuilder formData={null} />;
  }

  const form = await getFormById(formId);

  if (!form) {
    // Handle non-existent form
    notFound();
  }

  return (
    <div>
      <FormBuilder formData={form} />
    </div>
  );
};

export default FormPage;
