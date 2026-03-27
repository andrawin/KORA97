import React, { useEffect, useState } from 'react';

export function HUD({ volume, transcript }: { volume: number, transcript?: string }) {
  const [pcCount, setPcCount] = useState(0);
  const [hexCode, setHexCode] = useState('0x0000');
  const [scanline, setScanline] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const erratic = Math.sin(Date.now() / 100) * Math.cos(Date.now() / 230);
      const loops = Math.floor(3 + erratic * 2);
      setPcCount(Math.floor(loops * 1500 + Math.random() * 500 + (volume * 5000)));
      setHexCode('0x' + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0'));
    }, 100);
    return () => clearInterval(interval);
  }, [volume]);

  useEffect(() => {
    let animationFrame: number;
    const animate = () => {
      setScanline((prev) => (prev + 0.5) % 100);
      animationFrame = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  const tilt = (volume * 15).toFixed(2);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - Math.min(volume, 1) * circumference;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-2xl">
      {/* Scanline effect */}
      <div 
        className="absolute left-0 right-0 h-1 bg-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.5)]"
        style={{ top: `${scanline}%` }}
      />
      
      {/* Vignette */}
      <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(8,145,178,0.15)]" />

      {/* Center Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-40">
        <div className="absolute inset-0 border border-cyan-500/20 rounded-full" />
        <div className="absolute inset-4 border-2 border-cyan-400/30 rounded-full border-dashed animate-[spin_20s_linear_infinite]" />
        <div className="absolute inset-12 border border-cyan-500/20 rounded-full animate-[spin_15s_linear_infinite_reverse]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 20%, 0 20%, 0 80%, 100% 80%, 100% 100%, 0 100%)' }} />
        
        {/* Crosshairs */}
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-cyan-500/30 -translate-y-1/2" />
        <div className="absolute left-1/2 top-0 w-[1px] h-full bg-cyan-500/30 -translate-x-1/2" />
        
        {/* Brackets */}
        <div className="absolute top-1/4 left-1/4 w-8 h-8 border-t-2 border-l-2 border-cyan-400/60" />
        <div className="absolute top-1/4 right-1/4 w-8 h-8 border-t-2 border-r-2 border-cyan-400/60" />
        <div className="absolute bottom-1/4 left-1/4 w-8 h-8 border-b-2 border-l-2 border-cyan-400/60" />
        <div className="absolute bottom-1/4 right-1/4 w-8 h-8 border-b-2 border-r-2 border-cyan-400/60" />
      </div>

      {/* Left Panel: Audio Reactivity */}
      <div className="absolute left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-4">
        <div className="text-cyan-400/80 font-mono text-xs tracking-widest">AUDIO INPUT</div>
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90 transform">
            <circle
              cx="96" cy="96" r={radius}
              stroke="rgba(34,211,238,0.1)"
              strokeWidth="8"
              fill="none"
              strokeDasharray="4 4"
            />
            <circle
              cx="96" cy="96" r={radius}
              stroke="rgba(34,211,238,0.8)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-75 ease-out"
              style={{ filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.6))' }}
            />
          </svg>
          <div className="flex flex-col items-center justify-center">
            <span className="text-cyan-300 text-3xl font-bold font-mono">{(volume * 100).toFixed(0)}</span>
            <span className="text-cyan-500/60 text-[10px] font-mono">PERCENT</span>
          </div>
        </div>
        
        {/* Decorative bars */}
        <div className="flex gap-1 h-12 items-end mt-4">
          {[...Array(12)].map((_, i) => (
            <div 
              key={i} 
              className="w-2 bg-cyan-400/40 transition-all duration-75"
              style={{ height: `${Math.max(10, Math.random() * volume * 100)}%` }}
            />
          ))}
        </div>
      </div>

      {/* Right Panel: Data Readouts */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-8 text-right">
        <div className="relative">
          <div className="absolute -left-4 top-1/2 w-2 h-[1px] bg-cyan-400/50" />
          <div className="text-cyan-500/60 font-mono text-[10px] tracking-widest mb-1">HEAD TILT ANGLE</div>
          <div className="text-cyan-300 font-mono text-2xl font-bold tracking-wider">{tilt}°</div>
        </div>
        
        <div className="relative">
          <div className="absolute -left-4 top-1/2 w-2 h-[1px] bg-cyan-400/50" />
          <div className="text-cyan-500/60 font-mono text-[10px] tracking-widest mb-1">PT CLOUD DENSITY</div>
          <div className="text-cyan-300 font-mono text-2xl font-bold tracking-wider">{pcCount.toLocaleString()}</div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-1/2 w-2 h-[1px] bg-cyan-400/50" />
          <div className="text-cyan-500/60 font-mono text-[10px] tracking-widest mb-1">SYS MEMORY BLOCK</div>
          <div className="text-cyan-300 font-mono text-xl tracking-wider">{hexCode}</div>
        </div>

        <div className="relative">
          <div className="absolute -left-4 top-1/2 w-2 h-[1px] bg-cyan-400/50" />
          <div className="text-cyan-500/60 font-mono text-[10px] tracking-widest mb-1">STATUS</div>
          <div className="text-cyan-300 font-mono text-xl tracking-wider animate-pulse">ONLINE</div>
        </div>
      </div>

      {/* Subtitles / Transcript */}
      {transcript && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-3/4 max-w-2xl text-center">
          <p className="text-white text-xl md:text-2xl font-medium tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] bg-black/40 px-6 py-3 rounded-lg inline-block backdrop-blur-sm border border-white/10">
            {transcript}
          </p>
        </div>
      )}

      {/* Top/Bottom decorative elements */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="w-12 h-1 bg-cyan-500/40" />
        <div className="w-32 h-1 bg-cyan-400/80 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
        <div className="w-12 h-1 bg-cyan-500/40" />
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="w-8 h-1 bg-cyan-500/40" />
        <div className="w-4 h-1 bg-cyan-400/80" />
        <div className="w-8 h-1 bg-cyan-500/40" />
      </div>
    </div>
  );
}
