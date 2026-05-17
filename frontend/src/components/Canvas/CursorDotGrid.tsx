"use client";

import { useEffect, useRef, useCallback } from "react";

const DOT_SPACING = 28;
const DOT_SIZE = 1.5;
const MAX_DOT_SIZE = 3.5;
const INFLUENCE_RADIUS = 120;
const MIN_OPACITY = 0.03;
const MAX_OPACITY = 0.6;
const FADE_SPEED = 0.04;

interface Dot {
  x: number;
  y: number;
  currentOpacity: number;
  targetOpacity: number;
  currentSize: number;
  targetSize: number;
}

export function CursorDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const rafRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const initDots = useCallback((width: number, height: number) => {
    const dots: Dot[] = [];
    const cols = Math.ceil(width / DOT_SPACING) + 1;
    const rows = Math.ceil(height / DOT_SPACING) + 1;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        dots.push({
          x: col * DOT_SPACING,
          y: row * DOT_SPACING,
          currentOpacity: MIN_OPACITY,
          targetOpacity: MIN_OPACITY,
          currentSize: DOT_SIZE,
          targetSize: DOT_SIZE,
        });
      }
    }
    dotsRef.current = dots;
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    const mouse = mouseRef.current;
    const dots = dotsRef.current;

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];

      // Calculate distance to mouse
      if (mouse.active) {
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < INFLUENCE_RADIUS) {
          const intensity = 1 - dist / INFLUENCE_RADIUS;
          const easedIntensity = intensity * intensity; // Quadratic ease for softer falloff
          dot.targetOpacity = MIN_OPACITY + (MAX_OPACITY - MIN_OPACITY) * easedIntensity;
          dot.targetSize = DOT_SIZE + (MAX_DOT_SIZE - DOT_SIZE) * easedIntensity;
        } else {
          dot.targetOpacity = MIN_OPACITY;
          dot.targetSize = DOT_SIZE;
        }
      } else {
        dot.targetOpacity = MIN_OPACITY;
        dot.targetSize = DOT_SIZE;
      }

      // Smooth interpolation
      dot.currentOpacity += (dot.targetOpacity - dot.currentOpacity) * FADE_SPEED;
      dot.currentSize += (dot.targetSize - dot.currentSize) * FADE_SPEED;

      // Only draw if somewhat visible
      if (dot.currentOpacity > 0.01) {
        // Lime-green glow for dots near cursor, neutral white for distant
        const intensity = (dot.currentOpacity - MIN_OPACITY) / (MAX_OPACITY - MIN_OPACITY);
        const r = Math.round(194 * intensity + 255 * (1 - intensity));
        const g = Math.round(239 * intensity + 255 * (1 - intensity));
        const b = Math.round(78 * intensity + 255 * (1 - intensity));

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.currentSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${dot.currentOpacity})`;
        ctx.fill();
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      initDots(rect.width, rect.height);
    };

    // Use window-level mouse tracking so we never block pointer events
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { ...mouseRef.current, active: false };
    };

    resize();
    rafRef.current = requestAnimationFrame(animate);

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [initDots, animate]);

  return (
    <div ref={containerRef} className="absolute inset-0 z-[1] pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ mixBlendMode: "screen" }}
      />
    </div>
  );
}
