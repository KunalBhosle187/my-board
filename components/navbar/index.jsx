"use client";
import React from "react";
import { ModeToggle } from "../theme/mode-toggle";
import { useAuth } from "@clerk/nextjs";
import { AddUserModal } from "../workspace/collaborator";
import { usePathname } from "next/navigation";

const Navbar = () => {
  const pathname = usePathname();

  return (
    <div className="bg-transparent fixed top-0 z-10 min-w-full ">
      <nav className="py-7 px-10 flex justify-between items-center ">
        <img src="/logo.png" alt="Logo" className="h-14 w-auto mr-4" />
        <div className="flex items-center gap-4">
          <ModeToggle />
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
