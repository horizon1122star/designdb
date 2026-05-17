"use client";

import { X } from "lucide-react";

const DATA_TYPES = [
  { type: "INT",          desc: "Whole numbers",       pg: "INTEGER",      mysql: "INT",         sqlite: "INTEGER" },
  { type: "VARCHAR(n)",   desc: "Variable-length text", pg: "VARCHAR(n)",   mysql: "VARCHAR(n)",  sqlite: "TEXT" },
  { type: "TEXT",         desc: "Long text content",   pg: "TEXT",         mysql: "TEXT",        sqlite: "TEXT" },
  { type: "BOOLEAN",      desc: "True / False",        pg: "BOOLEAN",      mysql: "TINYINT(1)",  sqlite: "INTEGER" },
  { type: "DATETIME",     desc: "Date & time",         pg: "TIMESTAMP",    mysql: "DATETIME",    sqlite: "TEXT" },
  { type: "DATE",         desc: "Date only",           pg: "DATE",         mysql: "DATE",        sqlite: "TEXT" },
  { type: "DECIMAL(p,s)", desc: "Precise decimals",    pg: "DECIMAL(p,s)", mysql: "DECIMAL(p,s)",sqlite: "REAL" },
  { type: "FLOAT",        desc: "Floating point",      pg: "FLOAT",        mysql: "FLOAT",       sqlite: "REAL" },
  { type: "UUID",         desc: "Unique identifier",   pg: "UUID",         mysql: "CHAR(36)",    sqlite: "TEXT" },
  { type: "SERIAL",       desc: "Auto-increment",      pg: "SERIAL",       mysql: "AUTO_INCREMENT", sqlite: "AUTOINCREMENT" },
];

interface DataTypesPanelProps {
  onClose: () => void;
}

export function DataTypesPanel({ onClose }: DataTypesPanelProps) {
  return (
    <div className="absolute left-24 top-1/2 -translate-y-1/2 z-50 w-[420px] max-h-[70vh] overflow-hidden rounded-xl border border-white/[0.08] bg-[#090C15]/95 backdrop-blur-xl shadow-[0_16px_64px_rgba(0,0,0,0.6)]">
      
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">Data Type Reference</h3>
          <span className="text-[9px] text-white/30 font-mono tracking-[0.18em] uppercase">SQL Dialect Mapping</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-white/30 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <X size={14} />
        </button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_0.8fr_0.8fr_0.8fr] gap-px px-5 py-2 border-b border-white/[0.04] text-[9px] font-mono text-white/25 tracking-[0.15em] uppercase">
        <span>Type</span>
        <span>PostgreSQL</span>
        <span>MySQL</span>
        <span>SQLite</span>
      </div>

      {/* Rows */}
      <div className="overflow-y-auto max-h-[50vh] p-scrollbar">
        {DATA_TYPES.map((dt, i) => (
          <div
            key={dt.type}
            className={`grid grid-cols-[1fr_0.8fr_0.8fr_0.8fr] gap-px px-5 py-2.5 text-xs transition-colors hover:bg-white/[0.03] ${
              i % 2 === 0 ? "bg-transparent" : "bg-white/[0.01]"
            }`}
          >
            <div className="flex flex-col">
              <span className="text-lime-green font-mono font-medium text-[11px]">{dt.type}</span>
              <span className="text-white/30 text-[10px] mt-0.5">{dt.desc}</span>
            </div>
            <span className="text-white/60 font-mono text-[11px] self-center">{dt.pg}</span>
            <span className="text-white/60 font-mono text-[11px] self-center">{dt.mysql}</span>
            <span className="text-white/60 font-mono text-[11px] self-center">{dt.sqlite}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-5 py-2.5 border-t border-white/[0.04] text-[10px] text-white/20 font-mono">
        Mappings from <span className="text-sentry-purple">export_sql.ts</span>
      </div>
    </div>
  );
}
