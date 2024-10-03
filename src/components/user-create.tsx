"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { createUserIfNotExists } from "@/app/actions";

export function UserInitializer() {
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded && user) {
      const initializeUser = async () => {
        try {
          const result = await createUserIfNotExists(
            user.id,
            user.primaryEmailAddress?.emailAddress || "",
            `${user.firstName || ""} ${user.lastName || ""}`.trim()
          );
          console.log(result.message);
        } catch (error) {
          console.error("Failed to initialize user:", error);
        }
      };

      initializeUser();
    }
  }, [user, isLoaded]);

  return null;
}
