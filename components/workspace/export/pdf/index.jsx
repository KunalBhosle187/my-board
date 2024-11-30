import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "lucide-react";
import React, { useContext } from "react";
import { editorJsParser } from "editorjs-data-parser";
import { EditorData } from "@/components/provider/editor-provider";
import { ExcalidrawData } from "@/components/provider/excalidraw-provider";
import { exportToCanvas } from "@excalidraw/excalidraw";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";

const ExportPdf = () => {
  const { blocks } = useContext(EditorData);
  const { excalidrawAPI } = useContext(ExcalidrawData);
  const [isExporting, setIsExporting] = useState(false);
  const { userId } = useAuth();
  const [logoBase64, setLogoBase64] = useState(null);

  useEffect(() => {
    console.log("Current editor blocks:", blocks);
  }, [blocks]);

  useEffect(() => {
    // Load and convert logo to base64
    const loadLogo = async () => {
      try {
        const response = await fetch("/logo.png");
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => setLogoBase64(reader.result);
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error loading logo:", error);
      }
    };
    loadLogo();
  }, []);

  const getDocumentTitle = () => {
    const workspaceTitle = document.getElementById("workspace-title");
    if (workspaceTitle && workspaceTitle.value) {
      return workspaceTitle.value;
    }

    if (!blocks || blocks.length === 0) return "Untitled Document";

    const titleBlock = blocks.find(
      (block) => block.type === "header" && block.data.level === 1
    );
    return titleBlock ? titleBlock.data.text : "Untitled Document";
  };

  const generateFileName = () => {
    const title = getDocumentTitle()
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase();
    const date = new Date();
    return `${title}-${date.toISOString().split("T")[0]}.pdf`;
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const createTableOfContents = (blocks) => {
    const headers = blocks.filter((block) => block.type === "header");
    if (headers.length <= 1) return ""; // Don't create TOC if only title exists

    return `
       <div class="table-of-contents">
        <h2>Table of Contents</h2>
        <ul>
          ${headers
            .map(
              (header) => `
            <li class="toc-level-${header.data.level}">
              ${header.data.text}
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
    `;
  };

  const handleExport = async () => {
    try {
      console.log("Starting export with blocks:", blocks);

      if (!excalidrawAPI) {
        toast.error(
          "Please wait for the canvas to load completely before exporting."
        );
        return;
      }

      if (!blocks || blocks.length === 0) {
        toast.error(
          "No editor content to export. Please add some content to the editor first."
        );
        return;
      }

      setIsExporting(true);

      const elements = await excalidrawAPI.getSceneElements();
      if (!elements || elements.length === 0) {
        toast.error(
          "No canvas content to export. Please add some content to the canvas first."
        );
        return;
      }

      const appState = await excalidrawAPI.getAppState();

      const canvas = await exportToCanvas({
        elements,
        appState: {
          ...appState,
          exportWithDarkMode: false,
          exportScale: 2,
          viewBackgroundColor: "#ffffff",
        },
      });

      // Parse editor content
      let editorContent = "";
      try {
        editorContent = editorJsParser(blocks);
        console.log("Parsed editor content:", editorContent);
      } catch (error) {
        console.error("Error parsing editor content:", error);
        toast.error("Error processing editor content. Please try again.");
        return;
      }

      const tableOfContents = createTableOfContents(blocks);

      const result = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page {
          margin: 0.35in;
          size: A4;
          padding: 0;
        }
        html, body {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          background: #fff;
          min-height: 100vh;
        }
        .page {
          position: relative;
          min-height: calc(100vh - 0.7in); /* Account for margins */
          height: calc(100vh - 0.7in);
          padding: 1rem;
          border: 1px solid gray;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .cover-page {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 4rem 2rem;
          text-align: center;
        }
        .logo {
          margin-top: 3rem;
          margin-bottom: 5rem;
        }
        .logo img {
          width: 200px;
          height: auto;
          object-fit: contain;
        }
        .title {
          font-size: 2.75rem;
          margin: 2rem 0;
          color: #1a1a1a;
          letter-spacing: 0.05em;
          font-weight: 600;
          line-height: 1.3;
          max-width: 80%;
        }
        .metadata {
          margin-top: auto;
          color: #666;
          font-size: 1rem;
          line-height: 1.8;
        }
        .table-of-contents {
          padding: 2rem 1rem;
          margin: 2rem 0;
          page-break-after: always;
        }
        .table-of-contents h2 {
          color: #2d3748;
          margin-bottom: 2rem;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
          font-size: 1.75rem;
        }
        .table-of-contents ul {
          list-style-type: none;
          padding: 0;
        }
        .table-of-contents li {
          margin: 1rem 0;
          color: #4a5568;
        }
        .toc-level-1 { 
          margin-left: 0; 
          font-weight: 600;
          font-size: 1.1rem;
        }
        .toc-level-2 { 
          margin-left: 1.5rem;
          font-size: 1rem;
        }
        .toc-level-3 { 
          margin-left: 3rem;
          font-size: 0.95rem;
        }
        
        .content {
          max-width: 100%;
          margin: 0 auto;
        }
        .canvas-container {
          margin: 2rem 0;
          page-break-after: always;
        }
        .canvas-container img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 0 auto;
        }
        h1 {
          font-size: 2rem;
          color: #2d3748;
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        h2 {
          font-size: 1.5rem;
          color: #2d3748;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }
        h3 {
          font-size: 1.25rem;
          color: #2d3748;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
        }
        p {
          margin: 1rem 0;
          line-height: 1.7;
        }
        code {
          background: #f8f9fa;
          padding: 0.2rem 0.4rem;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        blockquote {
          margin: 1.5rem 0;
          padding-left: 1rem;
          border-left: 3px solid #e2e8f0;
          color: #4a5568;
        }
        ul, ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }
        li {
          margin: 0.5rem 0;
        }
        .section-title {
          font-size: 2rem;
          color: #2d3748;
          margin: 2rem 0;
          padding-bottom: 0.5rem;
          border-bottom: 2px solid #e2e8f0;
          text-align: left;
          width: 100%;
          font-weight: 600;
        }
        .section-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          page-break-before: always;
          page-break-after: always;
        }
        .content {
          max-width: 100%;
          margin: 0 auto;
        }
        @media print {
          .page {
            margin: 0;
            padding: 1rem;
            min-height: 100vh;
            height: 100vh;
            page-break-after: always;
            page-break-inside: avoid;
          }
          .section-container {
            min-height: 100vh;
            height: 100vh;
          }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="cover-page">
          <div class="logo">
            <img src="${logoBase64 || ""}" alt="Logo" />
          </div>
          <h1 class="title">${getDocumentTitle()}</h1>
          <div class="metadata">
            <p>Generated on ${formatDate(new Date())}</p>
            <p>Document ID: ${userId}</p>
          </div>
        </div>
      </div>

      <div class="page">
        <div class="section-container">
          <h2 class="section-title">Whiteboard Design</h2>
          <div class="canvas-container">
            <img src="${canvas.toDataURL()}" alt="Whiteboard Content" />
          </div>
        </div>
      </div>

      <div class="page">
        <div class="section-container">
          <h2 class="section-title">Requirements & Documentation</h2>
          ${editorContent}
        </div>
      </div>
    </body>
    </html>
  
      `;

      console.log("Sending to API:", result);

      const res = await fetch("/api/export/pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(result),
      });

      if (!res.ok) {
        throw new Error(`Export failed: ${res.statusText}`);
      }

      const link = document.createElement("a");
      link.href = "/document.pdf";
      link.download = generateFileName();
      link.click();

      toast.success("Your workspace has been exported to PDF");
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error.message || "Failed to export workspace to PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      className={isExporting ? "opacity-50 cursor-not-allowed" : ""}
      size="sm"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <DownloadIcon className="h-5 w-5 mr-2" />
          Export PDF
        </>
      )}
    </Button>
  );
};

export default ExportPdf;
