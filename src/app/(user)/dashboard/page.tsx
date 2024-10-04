import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";
import { DataTable } from "./_components/data-table/data-table";
import { columns } from "./_components/data-table/columns";
import { getForms } from "@/app/actions";
import { Switch } from "@/components/ui/switch";

const Dashboard = async () => {
  const forms = await getForms();

  return (
    <div className="space-y-4 p-5">
      <div className="flex justify-between items-center ">
        <h1 className="text-xl font-bold">Dashboard</h1>
        <Link href="/forms/create">
          <Button className="flex gap-x-2" size="sm">
            <Plus className="w-4 h-4" />
            Create New Form
          </Button>
        </Link>
      </div>
      {forms.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No forms created yet.</p>
          <Link href="/forms/create">
            <Button className="mt-4">Create Your First Form</Button>
          </Link>
        </div>
      ) : (
        <DataTable columns={columns} data={forms} />
      )}
    </div>
  );
};

export default Dashboard;
