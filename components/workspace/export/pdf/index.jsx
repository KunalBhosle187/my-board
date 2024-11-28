"use client";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import { DownloadIcon, GitPullRequestDraft } from "lucide-react";
import React, { useContext, useState } from "react";
import { editorJsParser } from "editorjs-data-parser";
import { EditorData } from "@/components/provider/editor-provider";
import { ExcalidrawData } from "@/components/provider/excalidraw-provider";
import { exportToCanvas, exportToSvg } from "@excalidraw/excalidraw";

const ExportPdf = () => {
  const { blocks } = useContext(EditorData);
  const { excalidrawAPI } = useContext(ExcalidrawData);

  const handleExport = async () => {
    const elements = await excalidrawAPI.getSceneElements();
    const appState = await excalidrawAPI.getAppState();

    const canvas = await exportToCanvas({ elements, appState });

    const ctx = canvas.getContext("2d");

    let result = editorJsParser(blocks);
    result = `<article  class="prose max-w-full ">
    <image src="${canvas.toDataURL()}" class="w-full h-fit" />
    ${result}</article>`;
    const res = await fetch("/api/export/pdf", {
      method: "POST",
      body: JSON.stringify(result),
    });

    if (res.ok) {
      const link = document.createElement("a");
      link.href = "/document.pdf";
      link.download = "document.pdf";
      link.click();
    }
  };
  return (
    <Button onClick={handleExport}>
      <DownloadIcon className="h-5 w-5 mr-2" /> Export Pdf
    </Button>
  );
};

export default ExportPdf;
