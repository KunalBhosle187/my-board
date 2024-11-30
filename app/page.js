"use client";

import Navbar from "@/components/navbar";
import HighlightedButton from "@/components/ui/highlighted-button";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <main className="h-screen w-screen">
      <Navbar />
      <div className="h-[65rem] w-full dark:bg-black bg-white dark:bg-grid-white/[0.2] bg-grid-black/[0.2] relative flex items-center justify-center">
        <div className="absolute pointer-events-none inset-0 flex items-center justify-center dark:bg-black bg-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-2/3 mt-[-8%] text-center"
        >
          <TextGenerateEffect
            words={"Whiteboard design & idea collaboration"}
            className="text-center capitalize text-3xl sm:text-7xl font-bold relative z-20 bg-clip-text text-transparent py-1"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="w-1/2 mx-auto border rounded-md p-5 my-3 backdrop-blur-lg dark:text-neutral-200 text-neutral-800"
          >
            Forget about sharing ideas in many different places. We integrated
            all the features you need in one place to speed up the workflow
            process. Focus on the ideas & creative part only.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 2 }}
          >
            <HighlightedButton asChild className="mt-3">
              <Link href={"/workspace"}>Get started</Link>
            </HighlightedButton>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
