"use client";

import { useState } from "react";
import { z } from "zod"; // Import Zod for validation
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inviteUser } from "@/lib/queries";
import { toast } from "sonner";

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
      <Button onClick={() => setOpen(true)}>Add Users</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
          </DialogHeader>
          <div>
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Enter email address"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => navigator.clipboard.writeText(window.location)}
            >
              Copy link
            </Button>
            <Button onClick={handleSubmit}>Invite</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};