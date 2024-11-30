"use client";
import { DynamicWidth } from "@/components/provider/resize-width-provider";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import clsx from "clsx";
import { FileIcon, HistoryIcon } from "lucide-react";
import React, { useContext } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserButton } from "@clerk/nextjs";

const Navbar = () => {
  const { resizableWidth, setResizableWidth } = useContext(DynamicWidth);

  return (
    <>
      <div className="p-3 backdrop-blur-md shadow-sm flex justify-between items-center">
        <div>
          <img src="/logo.png" alt="Logo" className="h-10 w-auto mr-4" />
        </div>

        <div className="flex items-center gap-x-3">
          <UserButton />
          <ModeToggle />
        </div>
      </div>
      <Separator />
    </>
  );
};

export default Navbar;
