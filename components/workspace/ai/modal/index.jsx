"use client";
import { AiResponse } from "@/components/provider/ai-response-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useContext, useState } from "react";

export const AIDialog = () => {
  const { response, setResponse } = useContext(AiResponse);
  const [prompt, setPrompt] = useState(
    "create a flowchart for inventory management"
  );
  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("http://localhost:3000/api/generate-by-ai", {
      method: "post",
      body: JSON.stringify(prompt),
    });
    if (res) {
      var data = await res.json();
      console.log({ data });
      data.mermaid = data.mermaid.replaceAll("```", "");
      data.editorJSFormat = data.editorJSFormat.replaceAll("```", "");
      data.mermaid = data.mermaid.replace("mermaid", "");
      data.editorJSFormat = data.editorJSFormat.replace("json", "");

      console.log(data);
      setResponse(data);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Generate with AI</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate with AI</DialogTitle>
          <DialogDescription>
            Write a information about your logic.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2">
          <div className="grid flex-1 gap-2">
            <Textarea
              id="prompt"
              placeholder="write a prompt..."
              defaultValue={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-start">
          <DialogClose asChild>
            <Button type="button" variant="secondary" onClick={handleSubmit}>
              Generate
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
