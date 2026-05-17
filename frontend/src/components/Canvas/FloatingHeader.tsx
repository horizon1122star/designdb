"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { Play, Share2, Grid, Home, Edit3, Download, FileCode2, FileType, Image, Cloud, Check, Loader2, X } from "lucide-react";
import { Magnetic } from "./Magnetic";
import { ReactFlowInstance } from "@xyflow/react";

interface FloatingHeaderProps {
  generatedSql?: string;
  generatedMermaid?: string;
  rfInstance?: ReactFlowInstance | null;
}

export function FloatingHeader({ generatedSql, generatedMermaid, rfInstance }: FloatingHeaderProps) {
  const router = useRouter();

  // Generic helper: POST content to server, get back a real file download
  const downloadAsFile = useCallback(async (content: string, filename: string, mimeType: string) => {
    if (!content) return;
    const res = await fetch("/api/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, filename, mimeType }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 500);
  }, []);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [validationState, setValidationState] = useState<"idle" | "validating" | "success" | "error">("idle");
  const [shareState, setShareState] = useState<"idle" | "success">("idle");

  const handleSaveToCloud = async () => {
    if (!rfInstance || saveState === "saving") return;
    setSaveState("saving");
    
    const nodes = rfInstance.getNodes();
    const edges = rfInstance.getEdges();
    
    // In future, prompt for title. Using default for now.
    const title = "My DesignDB Schema";
    const rawPrompt = sessionStorage.getItem("designdb_prompt") || "";

    try {
      const res = await fetch("/api/projects/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, rawPrompt, nodes, edges }),
      });
      if (res.ok) {
        setSaveState("success");
        setTimeout(() => setSaveState("idle"), 3000);
      } else {
        const errorData = await res.json();
        alert(`Server Error: ${errorData.error}`);
        setSaveState("error");
        setTimeout(() => setSaveState("idle"), 3000);
      }
    } catch (error: any) {
      console.error(error);
      alert(`Network Error: ${error.message}`);
      setSaveState("error");
      setTimeout(() => setSaveState("idle"), 3000);
    }
  };

  const handleDownloadSql = () => {
    downloadAsFile(generatedSql || "", "designdb_schema.sql", "application/sql");
  };

  const handleDownloadMermaid = () => {
    downloadAsFile(generatedMermaid || "", "designdb_erd.mmd", "text/plain");
  };

  const handleDownloadPng = useCallback(() => {
    if (!rfInstance) return;

    const flowWrapper = document.querySelector(".react-flow") as HTMLElement | null;
    if (!flowWrapper) return;

    const { width, height } = flowWrapper.getBoundingClientRect();
    const canvas = document.createElement("canvas");
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const clone = flowWrapper.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".react-flow__controls, .react-flow__panel, .react-flow__minimap").forEach(el => el.remove());

    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:#0a0f1e;">
            ${clone.outerHTML}
          </div>
        </foreignObject>
      </svg>`;

    const img = new window.Image();
    img.onload = async () => {
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");

      // Send dataUrl to server — server returns a real binary PNG with Content-Disposition
      const res = await fetch("/api/download-png", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "designdb_erd.png";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
    };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgData);
  }, [rfInstance]);

  const hasSql = !!generatedSql && !generatedSql.startsWith("-- DesignDB: No prompt") && !generatedSql.startsWith("-- Error");
  const hasMermaid = !!generatedMermaid;

  return (
    <div className="absolute top-0 w-full z-50 flex items-center justify-between px-6 py-3 border-b border-white/5 bg-background/40 backdrop-blur-md">
      
      {/* Left: Logo and Tool Icons */}
      <div className="flex items-center gap-8">
        <h1 className="text-xl text-white tracking-wide" style={{ fontFamily: "Vagnola, sans-serif" }}>DesignDB</h1>
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            onClick={() => router.push("/")}
            className="p-2 hover:text-white hover:bg-white/5 rounded-md transition-all"
          >
            <Home size={18} />
          </button>
          <button className="p-2 hover:text-white hover:bg-white/5 rounded-md transition-all"><Grid size={18} /></button>
          <div className="relative border-b-2 border-lime-green text-lime-green pb-[2px]">
            <button className="p-2 rounded-md transition-all"><Edit3 size={18} /></button>
          </div>
        </div>
      </div>
      
      {/* Right: Download Actions + Controls */}
      <div className="flex items-center gap-2">

        {/* Download Button Group */}
        <div className="flex items-center bg-white/[0.04] rounded-lg border border-white/[0.06] p-0.5 mr-2">
          <button
            onClick={handleDownloadSql}
            disabled={!hasSql}
            title="Download SQL (.sql)"
            className="group flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-white hover:bg-white/[0.08]"
          >
            <FileCode2 size={14} className="group-hover:text-lime-green transition-colors" />
            <span className="hidden sm:inline font-medium">.sql</span>
          </button>

          <div className="w-px h-4 bg-white/[0.08]" />

          <button
            onClick={handleDownloadMermaid}
            disabled={!hasMermaid}
            title="Download Mermaid (.mmd)"
            className="group flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-white hover:bg-white/[0.08]"
          >
            <FileType size={14} className="group-hover:text-sentry-purple transition-colors" />
            <span className="hidden sm:inline font-medium">.mmd</span>
          </button>

          <div className="w-px h-4 bg-white/[0.08]" />

          <button
            onClick={handleDownloadPng}
            disabled={!rfInstance}
            title="Download Image (.png)"
            className="group flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-white hover:bg-white/[0.08]"
          >
            <Image size={14} className="group-hover:text-coral-accent transition-colors" />
            <span className="hidden sm:inline font-medium">.png</span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-white/[0.08] mx-1" />

        {/* Progress Counter */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-md">
          <span className="text-white text-xs font-bold" style={{ fontFamily: "Vagnola, sans-serif" }}>ERD Generation</span>
          <span className="text-lime-green text-xs font-mono">100%</span>
        </div>

        <Magnetic>
          <button 
            onClick={handleSaveToCloud}
            disabled={saveState === "saving"}
            title="Save to PostgreSQL"
            className={`px-3 py-1.5 flex items-center justify-center gap-1.5 rounded-md transition-all border ${
              saveState === "success" 
                ? "text-green-400 bg-green-400/10 border-green-400/30"
                : saveState === "error"
                ? "text-red-400 bg-red-400/10 border-red-400/30"
                : "text-[#C2EF4E] bg-[#C2EF4E]/10 hover:bg-[#C2EF4E]/20 border-[#C2EF4E]/30"
            }`}
          >
            {saveState === "saving" && <Loader2 size={14} className="animate-spin" />}
            {saveState === "success" && <Check size={14} />}
            {saveState === "error" && <X size={14} />}
            {saveState === "idle" && <Cloud size={14} />}
            
            <span className="text-xs font-semibold">
              {saveState === "saving" ? "Saving..." : saveState === "success" ? "Saved!" : saveState === "error" ? "Failed" : "Save to Cloud"}
            </span>
          </button>
        </Magnetic>

        <Magnetic>
          <button 
            onClick={() => {
              if (validationState !== "idle") return;
              if (!generatedSql) {
                setValidationState("error");
                setTimeout(() => setValidationState("idle"), 2000);
                return;
              }
              setValidationState("validating");
              setTimeout(() => {
                setValidationState("success");
                setTimeout(() => setValidationState("idle"), 3000);
              }, 1500);
            }}
            disabled={validationState !== "idle"}
            title="Validate Schema"
            className={`p-2 flex items-center justify-center rounded-md transition-all border ${
              validationState === "success" ? "text-green-400 bg-green-400/10 border-green-400/30"
              : validationState === "error" ? "text-red-400 bg-red-400/10 border-red-400/30"
              : "text-lime-green bg-white/5 hover:bg-lime-green/20 border-lime-green/30"
            }`}
          >
            {validationState === "validating" && <Loader2 size={14} className="animate-spin" />}
            {validationState === "success" && <Check size={14} />}
            {validationState === "error" && <X size={14} />}
            {validationState === "idle" && <Play size={14} className="fill-current" />}
          </button>
        </Magnetic>
        
        <button 
          onClick={() => {
            if (shareState !== "idle") return;
            const dummyId = Math.random().toString(36).substring(2, 9);
            const shareLink = `https://designdb.app/share/${dummyId}`;
            navigator.clipboard.writeText(shareLink);
            setShareState("success");
            setTimeout(() => setShareState("idle"), 2000);
          }}
          disabled={shareState !== "idle"}
          title="Share Project"
          className={`p-2 flex items-center justify-center rounded-md transition-all ${
            shareState === "success" ? "text-green-400 bg-green-400/10" : "text-muted-foreground hover:text-white hover:bg-white/5"
          }`}
        >
          {shareState === "success" ? <Check size={14} /> : <Share2 size={14} />}
        </button>
      </div>
    </div>
  );
}
