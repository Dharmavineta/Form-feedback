"use client";

import { ColumnDef } from "@tanstack/react-table";
import DataTableActions from "../data-table-actions";
import UpdateToggle from "../update-toggle";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type FormData = {
  id: string;
  title: string;
  isPublished: boolean | null;
  createdAt: Date | null;
  publishedAt: Date | null;
  updatedAt: Date | null;
  userId: string;
};

export const columns: ColumnDef<FormData>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date | null;
      return date ? date.toLocaleDateString() : "N/A";
    },
  },
  {
    accessorKey: "publishedAt",
    header: "Published At",
    cell: ({ row }) => {
      const date = row.getValue("publishedAt") as Date | null;
      return date ? date.toLocaleDateString() : "Not published";
    },
  },
  {
    id: "url",
    header: "Form URL",
    cell: ({ row }) => {
      const form = row.original;
      return (
        <Link target="_blank" href={`clean-forms/killa/${form.id}`}>
          <Button variant={"outline"} size={"sm"}>
            View Form
          </Button>
        </Link>
      );
    },
  },
  {
    accessorKey: "isPublished",
    header: "Status",
    cell: ({ row }) => {
      const form = row.original;
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <UpdateToggle
                key={form.id}
                formId={form.id}
                publishedAt={form.publishedAt}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Publish Form</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const form = row.original;
      return <DataTableActions form={form} />;
    },
  },
];
