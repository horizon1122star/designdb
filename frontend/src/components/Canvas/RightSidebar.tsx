"use client";

import { useState, useEffect } from "react";
import { Settings, ChevronRight, FormInput, Database, AlignLeft, Check, Trash2, Copy, Pencil, Plus, X, Key } from "lucide-react";
import { Magnetic } from "./Magnetic";
import { Node, Edge } from "@xyflow/react";

const SQL_TYPES = ["serial","integer","varchar(255)","text","boolean","timestamp","date","float","decimal","uuid","char(36)"];
const FONT_OPTIONS = ["Vagnola Regular","Inter","JetBrains Mono","Roboto","Fira Code"];
const THEME_COLORS = [
  { name:"Lime", hex:"#C2EF4E", bg:"bg-lime-green" },
  { name:"Purple", hex:"#6A5FC1", bg:"bg-sentry-purple" },
  { name:"Coral", hex:"#FF6B6B", bg:"bg-coral-accent" },
  { name:"Slate", hex:"#64748b", bg:"bg-slate-500" },
];
const QUICK_FIELDS = ["name","email","phone","password","address","is_active","created_at","updated_at"];

interface RightSidebarProps {
  nodes: Node[];
  setNodes: (updater: Node[] | ((nodes: Node[]) => Node[])) => void;
  edges: Edge[];
  setEdges: (updater: Edge[] | ((edges: Edge[]) => Edge[])) => void;
  selectedNodeId: string | null;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  onAutoLayout: () => void;
}

export function RightSidebar({ nodes, setNodes, edges, setEdges, selectedNodeId, showGrid, setShowGrid, onAutoLayout }: RightSidebarProps) {
  // Creation state
  const [creationMode, setCreationMode] = useState<"inputs"|"transform"|"database">("inputs");
  const [tableName, setTableName] = useState("");
  const [quickFields, setQuickFields] = useState<string[]>(["name","email"]);
  const [viewName, setViewName] = useState("");
  const [sourceTable, setSourceTable] = useState("");
  const [expression, setExpression] = useState("");
  const [colCount, setColCount] = useState(3);

  // Editing state
  const [editingAttr, setEditingAttr] = useState<{idx:number,field:"name"|"type"}|null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingNodeName, setEditingNodeName] = useState(false);
  const [newNodeName, setNewNodeName] = useState("");

  // UI state
  const [fontOpen, setFontOpen] = useState(false);
  const [selectedFont, setSelectedFont] = useState("Vagnola Regular");
  const [themeColor, setThemeColor] = useState("#C2EF4E");
  const [showSettings, setShowSettings] = useState(false);
  const [sqlDialect, setSqlDialect] = useState("PostgreSQL");
  const [autoLayout, setAutoLayout] = useState(false);
  const [nodeOpacity, setNodeOpacity] = useState(100);

  // Apply CSS variables for theme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--theme-color", themeColor);
    root.style.setProperty("--node-font", selectedFont === "Vagnola Regular" ? "Vagnola, sans-serif" : `${selectedFont}, sans-serif`);
    root.style.setProperty("--node-opacity", String(nodeOpacity / 100));
  }, [themeColor, selectedFont, nodeOpacity]);

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
  const selectedAttrs = selectedNode ? ((selectedNode.data.attributes as any[]) || []) : [];

  // --- HELPERS ---
  const uniqueName = (base: string) => {
    const names = nodes.map(n => n.data.label as string);
    let name = base; let i = 1;
    while (names.includes(name)) { name = `${base}_${i}`; i++; }
    return name;
  };

  const addNode = (label: string, attrs: any[]) => {
    const offset = nodes.length * 60;
    const newNode: Node = {
      id: label, type: "tableMode",
      position: { x: 200 + offset, y: 150 + offset },
      data: { label, icon: "server", attributes: attrs },
    };
    setNodes((nds: Node[]) => [...nds, newNode]);
    if (autoLayout) setTimeout(onAutoLayout, 100);
  };

  // --- CREATION HANDLERS ---
  const handleCreateInputs = () => {
    const name = uniqueName(tableName.trim() || "new_form");
    const attrs: any[] = [{ name: `${name}_id`, type: "serial", isPk: true, isFk: false }];
    quickFields.forEach(f => {
      const type = f.includes("is_") ? "boolean" : f.includes("_at") ? "timestamp" : "varchar(255)";
      attrs.push({ name: f, type, isPk: false, isFk: false });
    });
    addNode(name, attrs);
    setTableName("");
  };

  const handleCreateTransform = () => {
    const name = uniqueName(viewName.trim() || "computed_view");
    const attrs: any[] = [
      { name: "view_id", type: "serial", isPk: true, isFk: false },
      { name: "source_table", type: "varchar(100)", isPk: false, isFk: false },
      { name: "expression", type: "text", isPk: false, isFk: false },
      { name: "result_type", type: "varchar(50)", isPk: false, isFk: false },
    ];
    if (sourceTable) attrs[1] = { ...attrs[1], name: `${sourceTable}_ref` };
    addNode(name, attrs);
    setViewName(""); setSourceTable(""); setExpression("");
  };

  const handleCreateDatabase = () => {
    const name = uniqueName(tableName.trim() || "new_table");
    const attrs: any[] = [{ name: "id", type: "serial", isPk: true, isFk: false }];
    for (let i = 1; i <= colCount; i++) attrs.push({ name: `column_${i}`, type: "varchar(255)", isPk: false, isFk: false });
    addNode(name, attrs);
    setTableName("");
  };

  // --- ATTRIBUTE CRUD ---
  const updateAttr = (idx: number, field: string, value: any) => {
    if (!selectedNodeId) return;
    setNodes((nds: Node[]) => nds.map(n => {
      if (n.id !== selectedNodeId) return n;
      const attrs = [...((n.data.attributes as any[]) || [])];
      attrs[idx] = { ...attrs[idx], [field]: value };
      return { ...n, data: { ...n.data, attributes: attrs } };
    }));
  };

  const deleteAttr = (idx: number) => {
    if (!selectedNodeId) return;
    setNodes((nds: Node[]) => nds.map(n => {
      if (n.id !== selectedNodeId) return n;
      const attrs = [...((n.data.attributes as any[]) || [])];
      attrs.splice(idx, 1);
      return { ...n, data: { ...n.data, attributes: attrs } };
    }));
  };

  const addAttr = () => {
    if (!selectedNodeId) return;
    setNodes((nds: Node[]) => nds.map(n => {
      if (n.id !== selectedNodeId) return n;
      const attrs = [...((n.data.attributes as any[]) || [])];
      const newAttr = { name: `field_${attrs.length + 1}`, type: "varchar(255)", isPk: false, isFk: false };
      return { ...n, data: { ...n.data, attributes: [...attrs, newAttr] } };
    }));
  };

  // --- NODE ACTIONS ---
  const renameNode = () => {
    if (!selectedNodeId || !newNodeName.trim()) return;
    setNodes((nds: Node[]) => nds.map(n =>
      n.id === selectedNodeId ? { ...n, id: newNodeName, data: { ...n.data, label: newNodeName } } : n
    ));
    setEdges((eds: Edge[]) => eds.map(e => ({
      ...e,
      source: e.source === selectedNodeId ? newNodeName : e.source,
      target: e.target === selectedNodeId ? newNodeName : e.target,
    })));
    setEditingNodeName(false);
  };

  const duplicateNode = () => {
    if (!selectedNode) return;
    const name = uniqueName((selectedNode.data.label as string) + "_copy");
    addNode(name, [...((selectedNode.data.attributes as any[]) || [])]);
  };

  const deleteNode = () => {
    if (!selectedNodeId) return;
    setNodes((nds: Node[]) => nds.filter(n => n.id !== selectedNodeId));
    setEdges((eds: Edge[]) => eds.filter(e => e.source !== selectedNodeId && e.target !== selectedNodeId));
  };

  const toggleQuickField = (f: string) => {
    setQuickFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  return (
    <div className="absolute right-0 top-[53px] bottom-0 w-[280px] z-40 bg-[#050B14]/85 backdrop-blur-xl border-l border-white/[0.06] flex flex-col pointer-events-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-[15px] font-semibold flex items-center gap-1.5 tracking-tight">
          <span className="text-lime-green">Components</span>
          <ChevronRight size={14} className="text-white/20" />
        </h2>
        <span className="text-[9px] text-white/30 font-mono tracking-[0.18em] uppercase mt-1.5 block">Node Library</span>
      </div>
      <div className="mx-5 h-px bg-white/[0.05]" />

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 p-scrollbar">

        {/* === CREATION === */}
        <div>
          <span className="text-[9px] text-white/25 font-mono uppercase tracking-[0.18em] block mb-2">Creation</span>
          <div className="flex gap-1 mb-3">
            {(["inputs","transform","database"] as const).map(mode => (
              <button key={mode} onClick={() => setCreationMode(mode)}
                className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-all capitalize ${creationMode === mode ? "bg-lime-green/15 text-lime-green border border-lime-green/30" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04] border border-transparent"}`}>
                {mode === "inputs" ? "Inputs" : mode === "transform" ? "Transform" : "Database"}
              </button>
            ))}
          </div>

          {/* Sub-forms */}
          <div className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-3 space-y-2.5">
            {creationMode === "inputs" && (<>
              <input value={tableName} onChange={e => setTableName(e.target.value)} placeholder="Table name (e.g. users)"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[12px] text-white placeholder:text-white/20 outline-none focus:border-lime-green/40" />
              <span className="text-[9px] text-white/25 font-mono block">Quick-add fields:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_FIELDS.map(f => (
                  <button key={f} onClick={() => toggleQuickField(f)}
                    className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${quickFields.includes(f) ? "bg-lime-green/15 text-lime-green border-lime-green/30" : "text-white/30 border-white/[0.08] hover:text-white/50"}`}>
                    {f}
                  </button>
                ))}
              </div>
              <button onClick={handleCreateInputs} className="w-full py-1.5 bg-lime-green/10 text-lime-green text-[11px] font-medium rounded-md border border-lime-green/20 hover:bg-lime-green/20 transition-all">Create Input Table</button>
            </>)}

            {creationMode === "transform" && (<>
              <input value={viewName} onChange={e => setViewName(e.target.value)} placeholder="View name (e.g. revenue_view)"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[12px] text-white placeholder:text-white/20 outline-none focus:border-lime-green/40" />
              <select value={sourceTable} onChange={e => setSourceTable(e.target.value)}
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[12px] text-white outline-none appearance-none cursor-pointer">
                <option value="">Source table...</option>
                {nodes.map(n => <option key={n.id} value={n.data.label as string}>{n.data.label as string}</option>)}
              </select>
              <textarea value={expression} onChange={e => setExpression(e.target.value)} placeholder="Expression (optional)"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[12px] text-white placeholder:text-white/20 outline-none focus:border-lime-green/40 resize-none h-14" />
              <button onClick={handleCreateTransform} className="w-full py-1.5 bg-sentry-purple/15 text-sentry-purple text-[11px] font-medium rounded-md border border-sentry-purple/20 hover:bg-sentry-purple/25 transition-all">Create View</button>
            </>)}

            {creationMode === "database" && (<>
              <input value={tableName} onChange={e => setTableName(e.target.value)} placeholder="Table name (e.g. orders)"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-[12px] text-white placeholder:text-white/20 outline-none focus:border-lime-green/40" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30">Columns:</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setColCount(Math.max(1, colCount - 1))} className="w-5 h-5 rounded bg-white/[0.06] text-white/40 hover:text-white text-xs flex items-center justify-center">-</button>
                  <span className="text-[12px] text-white/70 font-mono w-4 text-center">{colCount}</span>
                  <button onClick={() => setColCount(Math.min(10, colCount + 1))} className="w-5 h-5 rounded bg-white/[0.06] text-white/40 hover:text-white text-xs flex items-center justify-center">+</button>
                </div>
              </div>
              <button onClick={handleCreateDatabase} className="w-full py-1.5 bg-white/[0.06] text-white/70 text-[11px] font-medium rounded-md border border-white/[0.08] hover:bg-white/[0.10] hover:text-white transition-all">Create Table</button>
            </>)}
          </div>
        </div>

        {/* === SELECTED NODE === */}
        <div>
          <span className="text-[9px] text-white/25 font-mono uppercase tracking-[0.18em] block mb-2">Selected Node</span>
          {selectedNode ? (
            <div className="bg-white/[0.03] rounded-lg border border-white/[0.06] p-3 space-y-2.5">
              {/* Node name */}
              <div className="flex items-center justify-between">
                {editingNodeName ? (
                  <input autoFocus value={newNodeName} onChange={e => setNewNodeName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && renameNode()}
                    onBlur={renameNode}
                    className="flex-1 bg-white/[0.06] border border-lime-green/40 rounded px-2 py-0.5 text-[12px] text-lime-green font-mono outline-none" />
                ) : (
                  <span className="text-[13px] text-lime-green font-mono font-bold truncate">{selectedNode.data.label as string}</span>
                )}
                <div className="flex gap-1 ml-2 shrink-0">
                  <button onClick={() => { setEditingNodeName(true); setNewNodeName(selectedNode.data.label as string); }}
                    className="p-1 rounded hover:bg-white/[0.06] text-white/30 hover:text-white transition-all"><Pencil size={11} /></button>
                  <button onClick={duplicateNode}
                    className="p-1 rounded hover:bg-white/[0.06] text-white/30 hover:text-blue-400 transition-all"><Copy size={11} /></button>
                  <button onClick={deleteNode}
                    className="p-1 rounded hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-all"><Trash2 size={11} /></button>
                </div>
              </div>

              <div className="h-px bg-white/[0.05]" />

              {/* Attributes */}
              <div className="space-y-1 max-h-48 overflow-y-auto p-scrollbar">
                {selectedAttrs.map((attr: any, idx: number) => (
                  <div key={idx} className="flex items-center gap-1.5 group py-0.5 px-1 rounded hover:bg-white/[0.03] transition-all">
                    <button onClick={() => updateAttr(idx, "isPk", !attr.isPk)}
                      className={`shrink-0 ${attr.isPk ? "text-yellow-400" : "text-white/15 hover:text-white/30"} transition-colors`}>
                      <Key size={10} />
                    </button>
                    {editingAttr?.idx === idx && editingAttr.field === "name" ? (
                      <input autoFocus value={editValue} onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { updateAttr(idx, "name", editValue); setEditingAttr(null); }}}
                        onBlur={() => { updateAttr(idx, "name", editValue); setEditingAttr(null); }}
                        className="flex-1 bg-white/[0.06] border border-lime-green/30 rounded px-1 py-0 text-[11px] text-white font-mono outline-none" />
                    ) : (
                      <span onClick={() => { setEditingAttr({idx, field:"name"}); setEditValue(attr.name); }}
                        className="flex-1 text-[11px] text-white/70 font-mono cursor-pointer hover:text-white truncate">{attr.name}</span>
                    )}
                    {editingAttr?.idx === idx && editingAttr.field === "type" ? (
                      <select autoFocus value={editValue} onChange={e => { updateAttr(idx, "type", e.target.value); setEditingAttr(null); }}
                        onBlur={() => setEditingAttr(null)}
                        className="bg-[#0C1520] border border-white/[0.1] rounded px-1 py-0 text-[10px] text-white/60 font-mono outline-none">
                        {SQL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    ) : (
                      <span onClick={() => { setEditingAttr({idx, field:"type"}); setEditValue(attr.type); }}
                        className="text-[10px] text-white/40 font-mono cursor-pointer hover:text-white/60 shrink-0">{attr.type}</span>
                    )}
                    <button onClick={() => deleteAttr(idx)}
                      className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all shrink-0"><X size={10} /></button>
                  </div>
                ))}
              </div>

              <button onClick={addAttr}
                className="w-full flex items-center justify-center gap-1 py-1 border border-dashed border-white/[0.08] rounded text-[10px] text-white/30 hover:text-lime-green hover:border-lime-green/40 transition-all font-mono">
                <Plus size={10} /> Add Attribute
              </button>
            </div>
          ) : (
            <div className="bg-white/[0.02] rounded-lg border border-dashed border-white/[0.06] p-4 text-center">
              <span className="text-[11px] text-white/20 font-mono">Click a node to inspect</span>
            </div>
          )}
        </div>

        {/* === TYPOGRAPHY === */}
        <div className="relative">
          <span className="text-[9px] text-white/25 font-mono uppercase tracking-[0.18em] block mb-2">Typography</span>
          <div onClick={() => setFontOpen(p => !p)}
            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-white/[0.07] transition-colors">
            <span className="text-[12px] text-white/80">{selectedFont}</span>
            <span className="text-white/20 text-[10px]">↕</span>
          </div>
          {fontOpen && (
            <div className="absolute left-0 right-0 mt-1 bg-[#0C1520] border border-white/[0.08] rounded-lg overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] z-50">
              {FONT_OPTIONS.map(f => (
                <button key={f} onClick={() => { setSelectedFont(f); setFontOpen(false); }}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-[11px] transition-colors ${selectedFont === f ? "bg-lime-green/10 text-lime-green" : "text-white/50 hover:bg-white/[0.05] hover:text-white"}`}
                  style={{ fontFamily: f === "Vagnola Regular" ? "Vagnola, sans-serif" : f }}>
                  <span>{f}</span>
                  {selectedFont === f && <Check size={11} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* === TABLE THEME === */}
        <div>
          <span className="text-[9px] text-white/25 font-mono uppercase tracking-[0.18em] block mb-2">Table Theme</span>
          <div className="flex gap-2.5 px-0.5">
            {THEME_COLORS.map(tc => (
              <div key={tc.name} onClick={() => setThemeColor(tc.hex)}
                className={`w-6 h-6 rounded-[4px] ${tc.bg} cursor-pointer hover:scale-110 transition-transform ${themeColor === tc.hex ? "ring-[1.5px] ring-white/30 ring-offset-2 ring-offset-[#050B14] shadow-[0_0_10px_rgba(194,239,78,0.3)]" : ""}`} />
            ))}
          </div>
        </div>
      </div>

      {/* === SETTINGS === */}
      <div className="border-t border-white/[0.05]">
        <button onClick={() => setShowSettings(p => !p)}
          className="w-full flex items-center gap-2.5 px-5 py-3 text-white/30 hover:text-white transition-colors group">
          <Settings size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-[13px]">Settings</span>
          <ChevronRight size={12} className={`ml-auto transition-transform ${showSettings ? "rotate-90" : ""} text-white/15`} />
        </button>
        {showSettings && (
          <div className="px-5 pb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/30 font-mono">SQL Dialect</span>
              <select value={sqlDialect} onChange={e => setSqlDialect(e.target.value)}
                className="bg-white/[0.05] border border-white/[0.08] rounded px-2 py-0.5 text-[10px] text-white/60 outline-none cursor-pointer">
                <option>PostgreSQL</option><option>MySQL</option><option>SQLite</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/30 font-mono">Auto-layout</span>
              <button onClick={() => setAutoLayout(!autoLayout)}
                className={`w-8 h-4 rounded-full transition-colors relative ${autoLayout ? "bg-lime-green/40" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${autoLayout ? "left-[18px] bg-lime-green" : "left-0.5 bg-white/40"}`} />
              </button>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-white/30 font-mono">Opacity</span>
                <span className="text-[9px] text-white/20 font-mono">{nodeOpacity}%</span>
              </div>
              <input type="range" min="30" max="100" value={nodeOpacity} onChange={e => setNodeOpacity(parseInt(e.target.value))}
                className="w-full accent-lime-green h-1 cursor-pointer" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-white/30 font-mono">Show grid</span>
              <button onClick={() => setShowGrid(!showGrid)}
                className={`w-8 h-4 rounded-full transition-colors relative ${showGrid ? "bg-lime-green/40" : "bg-white/10"}`}>
                <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${showGrid ? "left-[18px] bg-lime-green" : "left-0.5 bg-white/40"}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
