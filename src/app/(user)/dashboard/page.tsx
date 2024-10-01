import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import React from "react";
import { DataTable } from "./_components/data-table/data-table";

const Dashboard = () => {
  return (
    <div className="">
      <div className="flex justify-end">
        <Link href={"/form"}>
          <Button className="flex gap-x-2" size={"sm"}>
            <Plus className="w-4 h-4" />
            Create New Form
          </Button>
        </Link>
      </div>
      <div>
        <h1>Dashboard</h1>
        {/* <DataTable/> */}
      </div>
    </div>
  );
};

export default Dashboard;
