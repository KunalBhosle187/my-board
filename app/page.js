"use client";

import Navbar from "@/components/navbar";
import HighlightedButton from "@/components/ui/highlighted-button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function Home() {
  const [opacity, setOpacity] = useState(0);
  const [btnOpacity, setBtnOpacity] = useState(0);

  setTimeout(() => {
    setOpacity(1);
  }, 2000);

  setTimeout(() => {
    setBtnOpacity(1);
  }, 3000);

  return (
    <main className="fixed left-0 right-0 top-0 bottom-0">
      <Navbar />
      <div className="h-[65rem] w-full dark:bg-black bg-white  dark:bg-grid-white/[0.2] bg-grid-black/[0.2] relative flex items-center justify-center">
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        <div className=" w-2/3 mt-[-8%] text-center">
          <TextGenerateEffect
            words={"Whiteboard design & idea collaboration"}
            className="text-center capitalize text-3xl sm:text-7xl font-bold relative z-20 bg-clip-text text-transparent bg-gradient-to-b from-neutral-200 to-neutral-500 py-1"
          />
          <p
            className={`w-1/2 mx-auto border opacity-${opacity} transition-opacity duration-[1000ms] rounded-md p-5 my-3 backdrop-blur-lg `}
          >
            Forget about sharing ideas in many different places. We integrated
            all the features you need in one place to speed up the workflow
            process. Focus on the ideas & creative part only.
          </p>
          <HighlightedButton
            asChild
            className={`opacity-${btnOpacity} transition-opacity duration-[2000ms] mt-3`}
          >
            <Link href={"/workspace"}>Get started</Link>
          </HighlightedButton>
        </div>
      </div>
    </main>
  );
}
