"use client";

import { useState } from "react";
import { z } from "zod"; // Import Zod for validation
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteUser } from "@/lib/queries";
import { toast } from "sonner";
import { Share2Icon } from "lucide-react";

const emailSchema = z.string().email("Invalid email address");

export const AddUserModal = ({ reqId }) => {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  const handleSubmit = async () => {
    // Validate email using Zod
    const validation = emailSchema.safeParse(newEmail);

    if (!validation.success) {
      // Show error toast if validation fails
      toast.error(validation.error.errors[0].message);
      return;
    }

    setOpen(false);

    try {
      console.log({ reqId, newEmail });
      const data = await inviteUser(reqId, newEmail);
      if (data.error) {
        toast.error(data.error);
      } else {
        toast.success(data.message);
      }
    } catch (error) {
      console.error({ error });
      toast.error("Something went wrong");
    }
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" size="icon">
        <Share2Icon className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite Collaborator</DialogTitle>
            <DialogDescription>
              Add a collaborator to your workspace by entering their email
              address.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="email"
                placeholder="Enter collaborator's email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} size="sm">
              Send Invite
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
