"use client";

import { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
  ReactFlowInstance,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';

import { FloatingHeader } from "./FloatingHeader";
import { RightSidebar } from "./RightSidebar";
import { TableNode } from "./Nodes/TableNode";
import { PulseEdge } from "./Edges/PulseEdge";
import { CrowsFootEdge } from "./Edges/CrowsFootEdge";
import { HoverProvider } from "./HoverContext";
import { FloatingDock } from "../ui/floating-dock";
import { IterativeCommandBar } from "./IterativeCommandBar";
import { BottomPanel } from "./BottomPanel";
import { DataTypesPanel } from "./DataTypesPanel";
import { CursorDotGrid } from "./CursorDotGrid";
import { Database, LayoutTemplate, Cable, ArrowLeftRight, Component, Loader2 } from "lucide-react";

const nodeTypes = {
  tableMode: TableNode,
};

const edgeTypes = {
  pulseMode: PulseEdge,
  crowsFoot: CrowsFootEdge,
};

// dockItems moved inside component to access state

// --- DAGRE LAYOUT ENGINE ---
const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'LR') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  const isHorizontal = direction === 'LR' || direction === 'RL';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: isHorizontal ? 350 : 200, align: 'UL' });

  nodes.forEach((node) => {
    const attrsCount = node.data?.attributes ? (node.data.attributes as any[]).length : 0;
    const nodeHeight = 60 + (attrsCount * 36); 
    dagreGraph.setNode(node.id, { width: 340, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - 340 / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export function Canvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [generatedSql, setGeneratedSql] = useState<string>("");
  const [generatedMermaid, setGeneratedMermaid] = useState<string>("");
  
  // Progress & Sync states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isStaggering, setIsStaggering] = useState(false);
  
  // Logic tracking states
  const [rawSchemaContext, setRawSchemaContext] = useState<any>(null);
  
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const hasFetched = useRef(false);

  // Dock toggle states
  const [showSidebar, setShowSidebar] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(false);
  const [showDataTypes, setShowDataTypes] = useState(false);
  const [layoutDirection, setLayoutDirection] = useState<'LR' | 'TB'>('LR');
  const [edgeStyle, setEdgeStyle] = useState<'crowsFoot' | 'pulseMode'>('crowsFoot');
  const [isSqlOpen, setIsSqlOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);

  // Sidebar state
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);

  const handleAutoLayout = useCallback(() => {
    if (nodes.length > 0) {
      const layouted = getLayoutedElements(nodes, edges, layoutDirection);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      if (rfInstance) setTimeout(() => rfInstance.fitView({ duration: 800, padding: 0.1 }), 200);
    }
  }, [nodes, edges, layoutDirection, rfInstance, setNodes, setEdges]);

  const onConnect = useCallback((params: Edge | Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // --- DOCK HANDLERS ---
  const handleLayoutToggle = useCallback(() => {
    const newDir = layoutDirection === 'LR' ? 'TB' : 'LR';
    setLayoutDirection(newDir);
    if (nodes.length > 0) {
      const layouted = getLayoutedElements(nodes, edges, newDir);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
      if (rfInstance) {
        setTimeout(() => rfInstance.fitView({ duration: 800, padding: 0.1 }), 200);
      }
    }
  }, [layoutDirection, nodes, edges, rfInstance, setNodes, setEdges]);

  const handleEdgeToggle = useCallback(() => {
    const newStyle = edgeStyle === 'crowsFoot' ? 'pulseMode' : 'crowsFoot';
    setEdgeStyle(newStyle);
    setEdges(eds => eds.map(e => ({ ...e, type: newStyle })));
  }, [edgeStyle, setEdges]);

  const dockItems = [
    { title: "Components",    href: "#", icon: <Component size={20} />,      onClick: () => setShowSidebar(p => !p),     isActive: showSidebar },
    { title: "Layouts",       href: "#", icon: <LayoutTemplate size={20} />,  onClick: handleLayoutToggle,                isActive: layoutDirection === 'TB' },
    { title: "Data Types",    href: "#", icon: <Database size={20} />,        onClick: () => setShowDataTypes(p => !p),    isActive: showDataTypes },
    { title: "Relationships", href: "#", icon: <Cable size={20} />,           onClick: handleEdgeToggle,                  isActive: edgeStyle === 'pulseMode' },
    { title: "Mappings",      href: "#", icon: <ArrowLeftRight size={20} />,  onClick: () => setShowBottomPanel(p => !p),  isActive: showBottomPanel },
  ];

  useEffect(() => {
    if (hasFetched.current) return;
    
    const prompt = sessionStorage.getItem("designdb_prompt");
    if (prompt) {
      sessionStorage.removeItem("designdb_prompt");
      generateSchema(prompt);
    } else if (nodes.length === 0) {
      setGeneratedSql("-- DesignDB: No prompt provided. Type something on the home page!");
    }
    
    hasFetched.current = true;
  }, []);

  const generateSchema = async (prompt: string, existingSchema?: any) => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // We only clear the graph if it's a completely new build, 
    // otherwise we keep the old graph visible while mutating
    if (!existingSchema) {
      setNodes([]); 
      setEdges([]);
    }
    
    try {
      // Fake progress 0-50% while waiting for API
      const fetchInterval = setInterval(() => {
        setGenerationProgress(prev => (prev < 45 ? prev + 1 : prev));
      }, 100);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, existingSchema }),
      });
      clearInterval(fetchInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      setGeneratedSql(data.sql); // Silently kept for quick export
      setGeneratedMermaid(data.mermaid || ""); // Keep mermaid for export
      setRawSchemaContext(data.schema); // Save real context for next iteration
      setGenerationProgress(50); // API is complete, start rendering graph

      // Construct un-layouted nodes with schema data
      const rawNodes: Node[] = data.schema.entities.map((entity: any) => ({
        id: entity.name,
        type: 'tableMode',
        position: { x: 0, y: 0 },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        data: {
          label: entity.name,
          icon: 'server',
          attributes: entity.attributes.map((attr: any) => ({
            name: attr.name,
            type: attr.dataType,
            isPk: attr.isPrimaryKey,
            isFk: data.schema.relationships.some((r: any) => r.fromEntity === entity.name && r.foreignKey === attr.name),
          }))
        }
      }));

      // Construct edges explicitly to flow from Parent (One) -> Child (Many) for the layout
      const rawEdges: Edge[] = data.schema.relationships.map((rel: any, index: number) => ({
        id: `e-${index}`,
        source: rel.toEntity,
        target: rel.fromEntity,
        type: 'crowsFoot',
        data: { relationshipType: rel.type },
      }));

      // Apply Horizontal DAG Layout Engine
      const layouted = getLayoutedElements(rawNodes, rawEdges, 'LR');
      
      // If doing a mutation, just flash the entire modified graph instantly for snappy UX
      if (existingSchema) {
         setNodes(layouted.nodes);
         setEdges(layouted.edges);
         setIsGenerating(false);
         setGenerationProgress(100);
         if (rfInstance) {
           setTimeout(() => rfInstance.fitView({ duration: 800, padding: 0.1 }), 200);
         }
         return;
      }

      // If initial build, execute Staggered Sync Progress 50% -> 100%
      setIsStaggering(true);
      const totalElements = layouted.nodes.length + layouted.edges.length;
      let revealedNodes: Node[] = [];
      let revealedEdges: Edge[] = [];
      
      let nodeIdx = 0;
      let edgeIdx = 0;

      // Reveal 1 element every 150ms for a satisfying build effect
      const staggerInterval = setInterval(() => {
        let progressed = false;

        // Reveal Nodes first
        if (nodeIdx < layouted.nodes.length) {
          revealedNodes = [...revealedNodes, layouted.nodes[nodeIdx]];
          setNodes(revealedNodes);
          nodeIdx++;
          progressed = true;
        } 
        // Then reveal Edges
        else if (edgeIdx < layouted.edges.length) {
          revealedEdges = [...revealedEdges, layouted.edges[edgeIdx]];
          setEdges(revealedEdges);
          edgeIdx++;
          progressed = true;
        }

        // Sync Progress Bar
        const renderedCount = nodeIdx + edgeIdx;
        const progressChunk = Math.round(50 + ((renderedCount / totalElements) * 50));
        setGenerationProgress(Math.min(progressChunk, 100));

        // Dynamically fit view as the graph grows horizontally
        if (rfInstance) {
           rfInstance.fitView({ duration: 300, padding: 0.2 });
        }

        // Finish
        if (!progressed) {
          clearInterval(staggerInterval);
          setIsStaggering(false);
          setIsGenerating(false);
          
          if (rfInstance) {
            setTimeout(() => rfInstance.fitView({ duration: 800, padding: 0.1 }), 200);
          }
        }
      }, 150);

    } catch (error: any) {
      console.error('Failed to generate schema:', error);
      const errorMessage = error.message || "Please check your API key and try again.";
      setGeneratedSql(`-- Error generating schema: ${errorMessage}\n-- Check your terminal logs for details.`);
      setIsGenerating(false);
      setIsStaggering(false);
    }
  };

  const showProgressOverlay = isGenerating || isStaggering;

  return (
    <div className="w-full h-full flex flex-col relative text-sm">
      <FloatingHeader
        generatedSql={generatedSql}
        generatedMermaid={generatedMermaid}
        rfInstance={rfInstance}
      />

      {/* SVG Definitions for Crow's Foot Markers */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0 }}>
        <defs>
          <marker id="crow-one" markerWidth="20" markerHeight="16" refX="10" refY="8" orient="auto-start-reverse">
            <path d="M 0 8 L 15 8 M 7 3 L 7 13 M 12 3 L 12 13" stroke="rgba(106, 95, 193, 0.8)" fill="none" strokeWidth="1.5" />
          </marker>
          <marker id="crow-many" markerWidth="20" markerHeight="16" refX="15" refY="8" orient="auto-start-reverse">
            <path d="M 0 8 L 15 8 M 5 8 L 15 3 M 5 8 L 15 13" stroke="rgba(106, 95, 193, 0.8)" fill="none" strokeWidth="1.5" />
          </marker>
        </defs>
      </svg>
      
      <div className="flex-1 w-full relative overflow-hidden">
        <HoverProvider>
          <div className="absolute inset-0 z-0">
            {/* Animated dotted grid background */}
            <div className="animated-dot-grid" />
            <div className="canvas-vignette" />
            <CursorDotGrid />
            
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onInit={setRfInstance}
              onNodeClick={(_event, node) => setSelectedNodeId(node.id)}
              onPaneClick={() => setSelectedNodeId(null)}
              colorMode="dark"
            >
              {showGrid && <Background gap={24} size={1.2} variant={BackgroundVariant.Dots} color="rgba(255, 255, 255, 0.08)" />}
              
              {showProgressOverlay && (
                <Panel position="top-center" className="mt-20">
                  <div className="flex flex-col items-center gap-3 backdrop-blur-md bg-[#090C15]/80 px-8 py-5 rounded-2xl border border-sentry-purple/50 shadow-[0_0_40px_rgba(30,84,159,0.2)]">
                    <div className="flex items-center gap-3 text-white">
                      <Loader2 className="animate-spin text-sentry-purple" size={20} />
                      <span className="text-sm tracking-widest uppercase font-semibold">
                         {isStaggering ? "Rendering Architecture" : "Synthesizing Schema"}
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden mt-2 relative">
                      <div 
                        className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-sentry-purple to-[#4a90d9] transition-all duration-300 ease-out"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <div className="text-[10px] font-mono text-white/50 tracking-wider">
                       {generationProgress}%
                    </div>
                  </div>
                </Panel>
              )}

              {/* Left Side Floating Dock Panel */}
              <Panel 
                position="top-left" 
                className="flex flex-col items-center gap-6 pointer-events-none transition-all duration-300 ease-in-out !m-0"
                style={{ top: "40%", transform: "translateY(-50%)", left: "24px" }}
              >
                <div className="pointer-events-auto shadow-ambient rounded-2xl bg-[#090C15]/50 border-white/5 pb-2 mb-2">
                  <FloatingDock items={dockItems} />
                </div>
              </Panel>

              {/* Right Side Controls Panel */}
              <Panel
                position="top-right"
                className="pointer-events-none transition-all duration-300 ease-in-out !m-0"
                style={{ top: "50%", transform: "translateY(-50%)", right: showSidebar ? "320px" : "24px" }}
              >
                <div className="pointer-events-auto">
                  <Controls 
                    showInteractive={false} 
                    className="glass-panel text-white fill-white border-none shadow-ambient !relative !bottom-auto !right-auto !m-0" 
                  />
                </div>
              </Panel>
            </ReactFlow>
          </div>
        </HoverProvider>

        <IterativeCommandBar 
           onSubmit={(prompt) => generateSchema(prompt, rawSchemaContext)} 
           isGenerating={showProgressOverlay} 
        />
        
        {showSidebar && (
          <RightSidebar
            nodes={nodes}
            setNodes={setNodes}
            edges={edges}
            setEdges={setEdges}
            selectedNodeId={selectedNodeId}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            onAutoLayout={handleAutoLayout}
          />
        )}

        {showBottomPanel && (
          <BottomPanel
            isSqlOpen={isSqlOpen}
            setIsSqlOpen={setIsSqlOpen}
            isReviewsOpen={isReviewsOpen}
            setIsReviewsOpen={setIsReviewsOpen}
            sql={generatedSql}
            showSidebar={showSidebar}
          />
        )}

        {showDataTypes && (
          <DataTypesPanel onClose={() => setShowDataTypes(false)} />
        )}
      </div>
    </div>
  );
}
