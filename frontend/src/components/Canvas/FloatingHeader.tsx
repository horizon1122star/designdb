"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { Play, Share2, Grid, Home, Edit3, Download, FileCode2, FileType, Image } from "lucide-react";
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
          <button className="p-2 flex items-center justify-center text-lime-green bg-white/5 hover:bg-lime-green/20 rounded-md transition-all border border-lime-green/30">
            <Play size={14} className="fill-current" />
          </button>
        </Magnetic>
        
        <button className="p-2 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/5 rounded-md transition-all">
          <Share2 size={14} />
        </button>
      </div>
    </div>
  );
}
