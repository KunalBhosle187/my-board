"use client";
import { Button } from "@/components/ui/button";
import { Clock, Users2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import EditWorkspace from "../forms/edit";

const WorkspaceCard = ({
  title,
  description,
  id,
  created_at,
  user_id,
  invite = [],
}) => {
  const { userId } = useAuth();
  const isShared = user_id !== userId || invite.includes(userId);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "group relative overflow-hidden rounded-xl border p-6 shadow-sm transition-all hover:shadow-md",
        "bg-gradient-to-b from-background/10 to-background dark:from-background/20 dark:to-background/50"
      )}
    >
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-black/10" />
      <div className="relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {isShared && (
            <Badge variant="secondary" className="gap-1.5">
              <Users2 className="h-3.5 w-3.5" />
              Shared
            </Badge>
          )}
        </div>

        {!isShared && (
          <EditWorkspace
            id={id}
            currentTitle={title}
            currentDescription={description}
          />
        )}

        <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>

        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="mr-1.5 h-3.5 w-3.5" />
          {new Date(created_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>

        <div className="pt-4">
          <Button
            asChild
            className="group/button w-full justify-between"
            variant="outline"
          >
            <Link href={"/workspace/" + id}>
              <span>Open Workspace</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover/button:translate-x-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Hover effect */}
      <div className="absolute inset-0 transition-opacity group-hover:opacity-10">
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-black/5 to-transparent dark:from-black/10" />
      </div>
    </motion.div>
  );
};

export default WorkspaceCard;
