import { Sparkles, ArrowUp } from "lucide-react";
import { useState } from "react";

interface Props {
  onSubmit: (prompt: string) => void;
  isGenerating: boolean;
}

export function IterativeCommandBar({ onSubmit, isGenerating }: Props) {
  const [prompt, setPrompt] = useState("");

  const handleSubmit = () => {
    if (!prompt.trim() || isGenerating) return;
    onSubmit(prompt);
    setPrompt("");
  };

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50 transition-all duration-300">
      <div 
        className="glass-panel p-2 rounded-2xl flex items-center gap-3 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all"
        style={{
           border: isGenerating ? "1px solid rgba(194, 239, 78, 0.4)" : "1px solid rgba(255,255,255,0.1)",
           background: isGenerating ? "rgba(20, 25, 40, 0.85)" : "rgba(10, 15, 25, 0.75)"
        }}
      >
        <div className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 ml-1 transition-colors ${isGenerating ? 'bg-lime-green/20 text-lime-green animate-pulse' : 'bg-sentry-purple/20 text-sentry-purple'}`}>
          <Sparkles size={14} />
        </div>
        <input 
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder={isGenerating ? "Synthesizing changes..." : "Modify architecture (e.g. Add an audit log table)..."}
          className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 outline-none font-sans"
          disabled={isGenerating}
        />
        <button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isGenerating}
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed mr-1"
          style={{
             background: prompt.trim() && !isGenerating ? "linear-gradient(135deg, #1e549f 0%, #052c52 100%)" : "rgba(255,255,255,0.05)",
             color: prompt.trim() && !isGenerating ? "white" : "rgba(255,255,255,0.4)",
             border: prompt.trim() && !isGenerating ? "1px solid rgba(30,84,159,0.5)" : "1px solid transparent",
          }}
        >
          <ArrowUp size={16} />
        </button>
      </div>
    </div>
  );
}
