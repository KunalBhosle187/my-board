"use client";

import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export default function Page() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <div className="flex items-center justify-center min-h-screen">
      <SignUp
        appearance={{
          baseTheme: theme === "dark" ? dark : undefined,
          elements: {
            formButtonPrimary:
              "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600",
          },
        }}
        afterSignUpUrl="/workspace"
        redirectUrl="/workspace"
      />
    </div>
  );
}
