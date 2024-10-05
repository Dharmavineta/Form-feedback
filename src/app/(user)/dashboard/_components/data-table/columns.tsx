"use client";

import { ColumnDef } from "@tanstack/react-table";
import DataTableActions from "../data-table-actions";
import UpdateToggle from "../update-toggle";

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
    accessorKey: "isPublished",
    header: "Status",
    cell: ({ row }) => {
      const form = row.original;
      return (
        <UpdateToggle
          key={form.id}
          formId={form.id}
          publishedAt={form.publishedAt}
        />
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
