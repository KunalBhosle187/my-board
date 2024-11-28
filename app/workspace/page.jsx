import { Separator } from "@/components/ui/separator";
import Create from "@/components/workspace/forms/create";
import Navbar from "@/components/workspace/index/navbar";
import { getWorkSpaceByUserId } from "@/lib/queries";
import React from "react";
import WorkspaceCard from "@/components/workspace/card";

const WorkspaceIndex = async () => {
  const workspace = await getWorkSpaceByUserId();

  return (
    <main className="">
      <Navbar />
      <div className="container">
        <Create />
        <Separator />
        <div className="py-10 grid grid-cols-4 gap-4">
          {workspace?.data?.map((item) => (
            <WorkspaceCard
              key={item.id}
              id={item.id}
              title={item.title}
              description={item.description}
              created_at={item.created_at}
            />
          ))}
        </div>
      </div>
    </main>
  );
};

export default WorkspaceIndex;
