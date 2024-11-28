"use client";
import { DynamicWidth } from "@/components/provider/resize-width-provider";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { UserButton, useAuth } from "@clerk/nextjs";
import clsx from "clsx";
import { FileIcon, HistoryIcon } from "lucide-react";
import React, { useContext, useEffect, useState } from "react";
import { AIDialog } from "../ai/modal";
import { AddUserModal } from "../collaborator";
import ExportPdf from "../export/pdf";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import { updateWorkSpaceById, getWorkSpaceById } from "@/lib/queries";
import ActiveUsers from "../active-users";

const Navbar = ({ title, id }) => {
  const { resizableWidth, setResizableWidth } = useContext(DynamicWidth);
  const { userId } = useAuth();
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const checkOwnership = async () => {
      const data = await getWorkSpaceById(id);
      if (!data?.error) {
        setIsOwner(data?.data?.user_id === userId);
      }
    };
    checkOwnership();
  }, [id, userId]);

  const handleFilename = async (title) => {
    const data = await updateWorkSpaceById(id, { title });
    if (data.error) {
      toast.error(data.error);
    }
    toast.success(data.message);
  };

  return (
    <>
      <div className="p-3 backdrop-blur-md shadow-sm grid grid-cols-3 items-center">
        <div className="flex items-center">
          <span className="font-bold uppercase m-1 border-white border-2 py-1 px-2 mr-4">
            Logo
          </span>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/workspace">Index</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage asChild>
                  <input
                    className="bg-transparent py-1 px-2 border-none text-sm"
                    type="text"
                    defaultValue={title}
                    onBlur={(e) => handleFilename(e.target.value)}
                  />
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="text-center">
          <Button
            onClick={() => setResizableWidth(100)}
            variant="outline"
            size="sm"
            className={clsx("rounded-r-none", {
              " bg-accent text-accent-foreground": resizableWidth == 100,
            })}
          >
            Document
          </Button>
          <Button
            onClick={() => setResizableWidth(40)}
            variant="outline"
            size="sm"
            className={clsx("rounded-none", {
              " bg-accent text-accent-foreground":
                resizableWidth != 100 && resizableWidth != 0,
            })}
          >
            Both
          </Button>
          <Button
            onClick={() => setResizableWidth(0)}
            variant="outline"
            size="sm"
            className={clsx("rounded-l-none", {
              " bg-accent text-accent-foreground": resizableWidth == 0,
            })}
          >
            Canvas
          </Button>
        </div>
        <div className="flex items-center justify-end gap-4">
          {isOwner && <AddUserModal reqId={id} />}
          <ActiveUsers />
          <div className="flex items-center gap-2">
            <UserButton afterSignOutUrl="/" />
            <ModeToggle />
          </div>
        </div>
      </div>
      <Separator />
    </>
  );
};

export default Navbar;
