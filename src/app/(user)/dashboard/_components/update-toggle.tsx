import React from "react";
import { updateForm } from "@/app/actions";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface UpdateToggleProps {
  formId: string;
  publishedAt: Date | null;
}

const UpdateToggle: React.FC<UpdateToggleProps> = ({ formId, publishedAt }) => {
  const isPublished = !!publishedAt;

  const handleTogglePublish = async () => {
    const newPublishStatus = !isPublished;

    toast.promise(
      async () => {
        await updateForm({
          id: formId,
          publishedAt: newPublishStatus ? new Date() : null,
        });
      },
      {
        loading: `${newPublishStatus ? "Publishing" : "Unpublishing"} form...`,
        success: `Form ${
          newPublishStatus ? "published" : "unpublished"
        } successfully`,
        error: `Failed to ${newPublishStatus ? "publish" : "unpublish"} form`,
      }
    );
  };

  return (
    <Switch
      checked={isPublished}
      onCheckedChange={handleTogglePublish}
      className="bg-red-500"
    />
  );
};

export default UpdateToggle;
