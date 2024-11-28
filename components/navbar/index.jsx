"use client";
import React from "react";
import { ModeToggle } from "../theme/mode-toggle";

const Navbar = () => {
  return (
    <div className="bg-transparent fixed top-0 z-10 min-w-full ">
      <nav className="py-7 px-10 flex justify-between items-center ">
        <h5 className="text-2xl font-bold uppercase underline outline py-2 w-fit px-6 outline-[3px]">
          Logo
        </h5>
        <ModeToggle />
      </nav>
    </div>
  );
};

export default Navbar;
