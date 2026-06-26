import { ReactNode, useRef, useState, MouseEvent, useEffect } from "react";
import { cn } from "../../utils/cn";

// ============ Spotlight (hover-follow) ============
export function Spotlight({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--x", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--y", `${e.clientY - rect.top}px`);
  };
  return (
    <div ref={ref} onMouseMove={onMove} className={cn("relative overflow-hidden", className)}>
      <div className="spotlight" />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============ BackgroundGrid ============
export function BackgroundGrid({ dark = false, children, className }: { dark?: boolean; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className={cn("absolute inset-0", dark ? "grid-bg-dark" : "grid-bg")} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============ Dot background ============
export function DotBackground({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.12) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        maskImage: "radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%)",
      }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============ AnimatedText reveal (word-by-word) ============
export function AnimatedText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={cn("inline-block", className)}>
      {words.map((w, i) => (
        <span
          key={i}
          className="inline-block animate-float-up"
          style={{ animationDelay: `${delay + i * 0.08}s`, marginRight: "0.25em" }}
        >
          {w}
        </span>
      ))}
    </span>
  );
}

// ============ BentoGrid ============
export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-4", className)}>{children}</div>;
}
export function BentoItem({ children, className, span = 1 }: { children: ReactNode; className?: string; span?: 1 | 2 | 3 }) {
  const spanCls = span === 2 ? "md:col-span-2" : span === 3 ? "md:col-span-3" : "";
  return (
    <div className={cn("group relative rounded-2xl border border-neutral-200 bg-white p-5 hover:shadow-md transition-shadow overflow-hidden", spanCls, className)}>
      {children}
    </div>
  );
}

// ============ 3D Tilt Card ============
export function TiltCard({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg) translateZ(4px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ""; };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={cn("tilt-card", className)}>
      {children}
    </div>
  );
}

// ============ Magnetic Button ============
export function MagneticButton({ children, onClick, className }: { children: ReactNode; onClick?: () => void; className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const onMove = (e: MouseEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2);
    const y = e.clientY - (r.top + r.height / 2);
    ref.current.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ""; };
  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{ transition: "transform 150ms cubic-bezier(0.2,0.8,0.2,1)" }}
      className={cn("cursor-pointer", className)}
    >
      {children}
    </button>
  );
}

// ============ Moving Border Card ============
export function MovingBorderCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("relative rounded-2xl moving-border", className)}>
      <div className="relative rounded-2xl bg-white p-5 m-[2px]">{children}</div>
    </div>
  );
}

// ============ Beam effect line ============
export function Beam({ className }: { className?: string }) {
  return <div className={cn("relative h-[1px] overflow-hidden bg-neutral-200", className)}><div className="absolute inset-y-0 w-1/3 beam-line" /></div>;
}

// ============ Emergency alert banner (full-width animated) ============
export function EmergencyBanner({ title, description, onAccept, onDismiss }: { title: string; description: string; onAccept: () => void; onDismiss: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-red-300 bg-gradient-to-r from-red-50 via-red-50 to-amber-50 p-4">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -inset-2 opacity-40" style={{
          backgroundImage: "repeating-linear-gradient(45deg, rgba(239,68,68,0.15) 0 10px, transparent 10px 20px)",
        }} />
      </div>
      <div className="relative flex items-center gap-4">
        <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-red-600 text-white shrink-0">
          <span className="absolute inset-0 rounded-full bg-red-500 pulse-ring" />
          <svg className="relative" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/></svg>
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-red-800">{title}</div>
          <div className="text-xs text-red-700 mt-0.5">{description}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={onAccept} className="h-9 px-3 rounded-md bg-red-600 text-white text-xs font-medium hover:bg-red-700 cursor-pointer">Accept</button>
          <button onClick={onDismiss} className="h-9 px-3 rounded-md border border-red-300 text-red-700 text-xs font-medium hover:bg-red-100 cursor-pointer">Dismiss</button>
        </div>
      </div>
    </div>
  );
}

// ============ Count-up stat ============
export function Stat({ label, value, trend, icon }: { label: string; value: ReactNode; trend?: string; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-neutral-900 tabular-nums">{value}</div>
        {trend && <div className="mt-1 text-xs text-emerald-600">{trend}</div>}
      </div>
      {icon && <div className="h-10 w-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-600">{icon}</div>}
    </div>
  );
}

// ============ File dropzone (shadcn style) ============
export function Dropzone({ onFile, label = "Drop file here or click to browse" }: { onFile: (f: File) => void; label?: string }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        dragging ? "border-neutral-900 bg-neutral-50" : "border-neutral-300 hover:border-neutral-400 hover:bg-neutral-50"
      )}
    >
      <input ref={inputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      <div className="text-sm font-medium text-neutral-700">{label}</div>
      <div className="text-xs text-neutral-500 mt-1">PDF, JPG, PNG up to 10MB</div>
    </div>
  );
}

// ============ Animated counter ============
export function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = display;
    const end = value;
    const duration = 700;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <span className="tabular-nums">{display}</span>;
}
