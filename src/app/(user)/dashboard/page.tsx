import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";
import { DataTable } from "./_components/data-table/data-table";
import { columns } from "./_components/data-table/columns";
import { getForms } from "@/app/actions";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Dashboard = async () => {
  const forms = await getForms();

  return (
    <div className="space-y-4 p-5">
      <div className="flex justify-between items-center ">
        <h1 className="text-xl font-bold">Dashboard</h1>
        {forms.length !== 0 && (
          <Link href="/forms/create">
            <Button className="flex gap-x-2 text-xs" size={"sm"}>
              <Plus className="w-4 h-4" />
              Create New Form
            </Button>
          </Link>
        )}
      </div>
      {forms.length === 0 ? (
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <p className="text-gray-400 text-sm">No forms created yet.</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Link href="/forms/create">
                    <Button size={"icon"} className="mt-4 rounded-full">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create New Form</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      ) : (
        <DataTable columns={columns} data={forms} />
      )}
    </div>
  );
};

export default Dashboard;
