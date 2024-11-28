import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";
import Link from "next/link";
import React from "react";

const WorkspaceCard = ({ title, description, id, created_at }) => {
  console.log({ created_at });
  return (
    <div className="p-5 border rounded-sm space-y-6 ">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        <h5 className=" text-muted-foreground text-sm">{description}</h5>
      </div>
      <div className="flex justify-between items-end">
        <div className="text-sm mt-3">
          <h5 className="">Created At</h5>
          <h5 className="text-muted-foreground flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            {new Date(created_at).toDateString()}
          </h5>
        </div>
        <Button className="w-32">
          <Link href={"/workspace/" + id}>Open</Link>
        </Button>
      </div>
    </div>
  );
};

export default WorkspaceCard;
