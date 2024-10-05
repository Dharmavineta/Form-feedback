import React, { useState } from "react";
import { updateForm } from "@/app/actions";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface UpdateToggleProps {
  formId: string;
  publishedAt: Date | null;
}

const UpdateToggle: React.FC<UpdateToggleProps> = ({ formId, publishedAt }) => {
  const [isPublished, setIsPublished] = useState(!!publishedAt);

  const handleTogglePublish = async () => {
    const newPublishStatus = !isPublished;

    // Optimistic update
    setIsPublished(newPublishStatus);

    toast.promise(
      async () => {
        try {
          await updateForm({
            id: formId,
            publishedAt: newPublishStatus ? new Date() : null,
          });
        } catch (error) {
          // Revert the optimistic update if the server request fails
          setIsPublished(!newPublishStatus);
          throw error;
        }
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
    <div style={{ height: "24px", display: "flex", alignItems: "center" }}>
      <Switch
        checked={isPublished}
        onCheckedChange={handleTogglePublish}
        className="bg-red-500"
      />
    </div>
  );
};

export default UpdateToggle;
