import { Handle, Position, NodeProps, useNodes, useEdges } from '@xyflow/react';
import { Key, Type, Minus, Server, ShoppingCart, Link } from 'lucide-react';
import { Magnetic } from '../Magnetic';
import { useHoverSync } from '../HoverContext';

export function TableNode(props: NodeProps) {
  const { data, id } = props;
  const { label, icon = 'server', attributes = [], isActive } = data as any;
  const { activeHover, setActiveHover } = useHoverSync();
  const nodes = useNodes();
  const edges = useEdges();
  
  const HeaderIcon = icon === 'cart' ? ShoppingCart : Server;
  const isTargetNode = activeHover?.targetNodeId === id;
  
  return (
    <div
      className={`node-panel w-56 p-3 bg-[#0C1520]/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300 ${isActive ? 'node-panel-active border-l-2 border-l-[#7eabfc] border-t-transparent border-r-transparent border-b-transparent rounded-l-none' : 'border-transparent'} ${isTargetNode ? 'border-sentry-purple/60 shadow-[0_0_24px_rgba(106,95,193,0.3)]' : ''}`}
      style={{
        borderTopColor: 'var(--theme-color, #C2EF4E)',
        borderTopWidth: '2px',
        fontFamily: 'var(--node-font, Vagnola, sans-serif)',
        opacity: 'var(--node-opacity, 1)' as any,
      }}
    >
      
      {/* Node Header */}
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2 px-1">
        <div className="flex items-center gap-2">
          <HeaderIcon size={14} className={isTargetNode ? 'text-sentry-purple' : 'text-[#a4e5ed] font-bold'} />
          <h3 className={`font-bold tracking-wide text-sm transition-colors ${isTargetNode ? 'text-white' : 'text-white'}`}>{label}</h3>
        </div>
        <Magnetic>
          <Minus size={14} className="text-muted-foreground/60 cursor-pointer hover:text-white transition-colors" />
        </Magnetic>
      </div>
      
      <Handle type="target" position={Position.Left} className="w-2 h-2 rounded-full border-none opacity-0" />

      {/* Node Properties */}
      <div className="flex flex-col gap-1 px-1">
        {attributes.length > 0 ? attributes.map((attr: any, idx: number) => {
          let FieldIcon = attr.isPk || attr.isFk ? Key : Type;
          if (attr.isFk && !attr.isPk) FieldIcon = Link;

          // Strictly defined universal active highlighting 
          const isHighlightedPk = isTargetNode && attr.isPk;
          const isHoveredFk = activeHover !== null && activeHover.sourceAttr === attr.name && !isTargetNode;

          return (
            <div 
              key={idx} 
              onMouseEnter={() => {
                // Universal Dynamic Edge Resolver Handler
                if (attr.isFk) {
                  // Stripping _id to correlate logical table structures dynamically
                  const targetLabel = attr.name.toLowerCase().replace('_id', '');
                  const targetNode = nodes.find(n => 
                    (n.data.label as string).toLowerCase() === targetLabel || 
                    (n.data.label as string).toLowerCase().startsWith(targetLabel)
                  );

                  if (targetNode) {
                    const edge = edges.find(e => 
                      (e.source === id && e.target === targetNode.id) || 
                      (e.target === id && e.source === targetNode.id)
                    );
                    if (edge) {
                      setActiveHover({ edgeId: edge.id, targetNodeId: targetNode.id, sourceAttr: attr.name });
                    }
                  }
                }
              }}
              onMouseLeave={() => {
                if (attr.isFk) setActiveHover(null);
              }}
              className={`flex justify-between items-center group py-1 px-1.5 rounded-md transition-all duration-300 ${attr.isFk ? 'cursor-pointer hover:bg-white/5' : ''} ${isHighlightedPk ? 'bg-sentry-purple/30 shadow-[0_0_12px_rgba(106,95,193,0.5)] scale-[1.05] border border-sentry-purple/50 z-20 relative' : isHoveredFk ? 'bg-lime-green/10 border border-lime-green/30' : 'border border-transparent'}`}
            >
              <div className="flex gap-2 items-center">
                <FieldIcon size={12} className={isHighlightedPk ? 'text-white' : isHoveredFk ? 'text-lime-green' : attr.isPk ? 'text-[#a4e5ed]' : attr.isFk ? 'text-[#7eabfc]' : 'text-muted-foreground'} />
                <span className={`text-xs font-mono transition-colors ${isHighlightedPk || isHoveredFk ? 'text-white font-bold' : 'text-[#d1d5db]'}`}>{attr.name}</span>
              </div>
              <span className={`text-[10px] font-mono lowercase transition-colors ${isHighlightedPk || isHoveredFk ? 'text-white' : attr.isPk ? 'text-[#a4e5ed]' : attr.isFk ? 'text-[#7eabfc]' : 'text-muted-foreground/80'}`}>
                {attr.type}
              </span>
            </div>
          )
        }) : (
          <span className="text-[10px] text-muted-foreground italic">No attributes defined...</span>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 rounded-full border-none opacity-0" />
    </div>
  );
}
