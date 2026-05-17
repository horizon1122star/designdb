import { Minus, Plus } from 'lucide-react';

interface BottomPanelProps {
  isSqlOpen: boolean;
  setIsSqlOpen: (open: boolean) => void;
  isReviewsOpen: boolean;
  setIsReviewsOpen: (open: boolean) => void;
  sql?: string;
  showSidebar: boolean;
}

export function BottomPanel({ isSqlOpen, setIsSqlOpen, isReviewsOpen, setIsReviewsOpen, sql, showSidebar }: BottomPanelProps) {
  const displaySql = sql || `-- Synthesizing architecture...\n-- Please wait a moment while DesignDB generates your schema.`;

  return (
    <div className={`absolute bottom-6 left-6 z-40 flex gap-4 pointer-events-none items-end transition-all duration-300 ${showSidebar ? 'right-[300px]' : 'right-[24px]'}`}>
      
      {/* SQL Code Pane */}
      <div 
        className={`flex-1 glass-panel rounded-xl border border-white/5 pointer-events-auto flex flex-col overflow-hidden relative transition-all duration-300 ease-in-out ${isSqlOpen ? 'h-64' : 'h-12'}`}
      >
        <div className="flex justify-between items-center px-4 py-3 bg-white/5 border-b border-white/5 relative z-10 shrink-0 cursor-pointer" onClick={() => setIsSqlOpen(!isSqlOpen)}>
          <div className="flex gap-2 items-center">
            <span className="text-sentry-purple font-mono text-[10px]">&lt;&gt;</span>
            <span className="text-xs text-white sentry-label">SQL Code</span>
          </div>
          <div className="flex items-center gap-4">
            {isSqlOpen && <span className="text-[10px] font-mono text-muted-foreground tracking-widest hidden sm:block">READ ONLY</span>}
            <button className="text-muted-foreground hover:text-white transition-colors cursor-pointer w-6 h-6 flex items-center justify-center">
              {isSqlOpen ? <Minus size={14} /> : <Plus size={14} />}
            </button>
          </div>
        </div>
        
        <div className={`flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed text-[#9fadbb] whitespace-pre p-scrollbar relative z-10 transition-opacity duration-300 ${isSqlOpen ? 'opacity-100' : 'opacity-0'}`}>
          {displaySql}
        </div>
      </div>
      
      {/* Reviews Logs Pane */}
      <div 
        className={`flex-1 glass-panel rounded-xl border border-white/5 pointer-events-auto flex flex-col overflow-hidden relative transition-all duration-300 ease-in-out ${isReviewsOpen ? 'h-64' : 'h-12'}`}
      >
        <div className="flex justify-between items-center px-4 py-3 bg-white/5 border-b border-white/5 relative z-10 shrink-0 cursor-pointer" onClick={() => setIsReviewsOpen(!isReviewsOpen)}>
          <div className="flex gap-2 items-center">
            <span className="text-white text-xs sentry-label">Reviews</span>
            {isReviewsOpen && <span className="bg-lime-green/20 text-lime-green px-1.5 py-0.5 rounded text-[9px] font-mono hidden sm:block">INTELLIGENCE</span>}
          </div>
          <button className="text-muted-foreground hover:text-white transition-colors cursor-pointer w-6 h-6 flex items-center justify-center">
             {isReviewsOpen ? <Minus size={14} /> : <Plus size={14} />}
          </button>
        </div>
        
        <div className={`flex-1 p-4 overflow-y-auto w-full relative z-10 p-scrollbar transition-opacity duration-300 ${isReviewsOpen ? 'opacity-100' : 'opacity-0'}`}>
          <div className="bg-[#150f23]/60 border border-[#362d59]/50 rounded-lg p-3 flex gap-3 shadow-ambient hover:border-lime-green/50 transition-all cursor-pointer">
             <div className="mt-0.5 text-lime-green shrink-0">✨</div>
             <div>
               <h4 className="text-[11px] sentry-label text-white mb-1">Insight</h4>
               <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                 {!sql ? "Analyzing requirements..." : "Generated 3NF architecture. Primary keys and foreign keys have been reconciled."}
               </p>
             </div>
          </div>
        </div>
      </div>

    </div>
  );
}
