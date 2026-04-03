import React, { useState, useRef, useEffect } from 'react';
import { useAudioVolume } from './hooks/useAudioVolume';
import { CustomFace } from './components/CustomFace';
import { SequenceFace } from './components/SequenceFace';
import { ShaderFace } from './components/ShaderFace';
import { HUD } from './components/HUD';
import { Mic, MicOff, Image as ImageIcon, Cpu, Layers, Box, Settings, ChevronDown } from 'lucide-react';

export default function App() {
  const { volume, isListening, startListening, stopListening } = useAudioVolume();
  const [mode, setMode] = useState<'custom' | 'sequence' | 'shader'>('shader');
  const [showSettings, setShowSettings] = useState(false);
  const [reactivity, setReactivity] = useState(1.0);
  const [zoomReactivity, setZoomReactivity] = useState(0.5);
  const [manualZoom, setManualZoom] = useState(0.0);
  const [bgColor, setBgColor] = useState('#3399ff');
  const [skinColor, setSkinColor] = useState('#bfa68e');
  const [eyeColor, setEyeColor] = useState('#331a0d');
  const [eyeReactivity, setEyeReactivity] = useState(3.0);
  const [characterType, setCharacterType] = useState(0.0);
  
  const effectiveVolume = volume * reactivity;

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans selection:bg-pink-500/30">
      {/* Header */}
      <header className="flex items-center justify-end px-6 py-4 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {/* Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all border ${
                showSettings 
                  ? 'bg-gray-800 text-white border-gray-600' 
                  : 'bg-gray-900/50 text-gray-300 border-gray-700 hover:bg-gray-800'
              }`}
            >
              <Settings className="w-4 h-4 mr-2" />
              Options
              <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showSettings ? 'rotate-180' : ''}`} />
            </button>

            {showSettings && (
              <div className="absolute right-0 mt-2 w-80 max-h-[80vh] overflow-y-auto bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-5 z-50 flex flex-col gap-6 custom-scrollbar">
                {/* Mode Selection */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Display Mode</label>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setMode('shader')}
                      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        mode === 'shader' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <Box className="w-4 h-4 mr-3" /> 3D Shader
                    </button>
                    <button
                      onClick={() => setMode('sequence')}
                      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        mode === 'sequence' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <Layers className="w-4 h-4 mr-3" /> Image Sequence
                    </button>
                    <button
                      onClick={() => setMode('custom')}
                      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        mode === 'custom' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 mr-3" /> Custom Jaw
                    </button>
                  </div>
                </div>

                {/* Character Selection */}
                {mode === 'shader' && (
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Character</label>
                    <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                      <button
                        onClick={() => {
                          setCharacterType(0.0);
                          setSkinColor('#bfa68e');
                          setEyeColor('#331a0d');
                        }}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                          characterType === 0.0 ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        Robot
                      </button>
                      <button
                        onClick={() => {
                          setCharacterType(1.0);
                          setSkinColor('#ff5522');
                          setEyeColor('#ffaa00');
                        }}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${
                          characterType === 1.0 ? 'bg-gray-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        Demon Girl
                      </button>
                    </div>
                  </div>
                )}

                {/* Reactivity Slider */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex justify-between">
                    <span>Audio Reactivity</span>
                    <span className="text-cyan-400">{reactivity.toFixed(1)}x</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.1" max="3.0" step="0.1" 
                    value={reactivity} 
                    onChange={(e) => setReactivity(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                {/* Zoom Reactivity Slider */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex justify-between">
                    <span>Zoom Reactivity</span>
                    <span className="text-cyan-400">{zoomReactivity.toFixed(1)}x</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.0" max="2.0" step="0.1" 
                    value={zoomReactivity} 
                    onChange={(e) => setZoomReactivity(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                {/* Manual Zoom Slider */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex justify-between">
                    <span>Manual Zoom</span>
                    <span className="text-cyan-400">{manualZoom.toFixed(1)}</span>
                  </label>
                  <input 
                    type="range" 
                    min="-2.0" max="2.0" step="0.1" 
                    value={manualZoom} 
                    onChange={(e) => setManualZoom(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                {/* Eye Reactivity Slider */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex justify-between">
                    <span>Eye Reactivity</span>
                    <span className="text-cyan-400">{eyeReactivity.toFixed(1)}x</span>
                  </label>
                  <input 
                    type="range" 
                    min="0.0" max="10.0" step="0.5" 
                    value={eyeReactivity} 
                    onChange={(e) => setEyeReactivity(parseFloat(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                {/* Background Color */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Background Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={bgColor} 
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer bg-gray-800 border border-gray-700 p-0.5"
                    />
                    <span className="text-sm text-gray-300 font-mono">{bgColor}</span>
                  </div>
                </div>

                {/* Skin Color */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Skin Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={skinColor} 
                      onChange={(e) => setSkinColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer bg-gray-800 border border-gray-700 p-0.5"
                    />
                    <span className="text-sm text-gray-300 font-mono">{skinColor}</span>
                  </div>
                </div>

                {/* Eye Color */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Eye Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={eyeColor} 
                      onChange={(e) => setEyeColor(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer bg-gray-800 border border-gray-700 p-0.5"
                    />
                    <span className="text-sm text-gray-300 font-mono">{eyeColor}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mic Toggle */}
          <button
            onClick={isListening ? stopListening : startListening}
            className={`flex items-center px-4 py-2 font-semibold rounded-lg transition-all shadow-lg ${
              isListening 
                ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 shadow-red-500/10' 
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/20'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 mr-2" />
                Stop Mic
              </>
            ) : (
              <>
                <Mic className="w-4 h-4 mr-2" />
                Start Mic
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center py-12 px-6 relative overflow-y-auto overflow-x-hidden">
        {/* Background ambient glow based on volume */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-75 ease-out"
          style={{
            background: `radial-gradient(circle at center, rgba(34, 211, 238, ${effectiveVolume * 0.15}) 0%, transparent 70%)`
          }}
        />

        <div className="w-full max-w-[1200px] relative z-10 mx-auto mt-16 mb-16">
          {/* TV Antenna */}
          <div className="absolute -top-8 left-1/4 w-1/2 h-10 z-0 origin-bottom-left transform rotate-2">
            <div className="w-full h-3.5 bg-[#a0522d] rounded-full shadow-md" />
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-20 h-5 bg-[#4a4a4a] rounded-full" />
          </div>

          {/* TV Legs */}
          <div className="absolute -bottom-10 left-32 w-12 h-16 bg-gradient-to-b from-[#3a200d] to-[#1a0f05] rounded-b-md shadow-2xl" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }} />
          <div className="absolute -bottom-10 right-32 w-12 h-16 bg-gradient-to-b from-[#3a200d] to-[#1a0f05] rounded-b-md shadow-2xl" style={{ clipPath: 'polygon(0 0, 100% 0, 80% 100%, 20% 100%)' }} />

          {/* Main TV Body */}
          <div className="relative z-10 w-full h-[800px] bg-gradient-to-br from-[#8b4513] to-[#5c2e0b] rounded-[2.5rem] p-4 shadow-2xl border-[10px] border-[#4a2409] ring-2 ring-[#8b4513] ring-inset">
            
            {/* Inner White/Cream Line */}
            <div className="w-full h-full border-[4px] border-[#e8dcc7] rounded-[2rem] p-6 flex gap-8 bg-gradient-to-br from-[#7a3a10] to-[#4a2005]">
              
              {/* Screen Area */}
              <div className="flex-1 relative bg-[#333] rounded-[3.5rem] p-8 shadow-[inset_0_0_40px_rgba(0,0,0,0.9)] border-[6px] border-[#222]">
                {/* Actual Screen */}
                <div className="w-full h-full bg-black rounded-[2.5rem] overflow-hidden relative shadow-[inset_0_0_60px_rgba(0,0,0,1)]">
                  
                  {/* CRT Glass reflection */}
                  <div className="absolute inset-0 z-50 pointer-events-none rounded-[2.5rem] bg-gradient-to-br from-white/10 via-transparent to-transparent" />
                  
                  {/* Screen Content */}
                  <div className="absolute inset-0 z-20">
                    {/* TV Station Logo */}
                    <img 
                      src="https://drive.google.com/thumbnail?id=1OX1Sldz1IMLq1t1krJq4_iTu0gG2u05h&sz=w800" 
                      alt="KORA-97 Logo" 
                      className="absolute top-8 right-8 w-48 h-auto z-40 opacity-80 pointer-events-none drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />

                    {/* HUD Overlay */}
                    {isListening && <HUD volume={effectiveVolume} />}

                    {!isListening && (
                      <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
                        <div className="text-center p-8 max-w-sm">
                          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                            <Mic className="w-8 h-8 text-blue-400" />
                          </div>
                          <h2 className="text-xl font-bold text-white mb-3">Microphone Required</h2>
                          <p className="text-sm text-gray-400 mb-8">
                            Click "Start Mic" to allow the browser to listen to your voice.
                          </p>
                          <button
                            onClick={startListening}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center w-full"
                          >
                            <Mic className="w-5 h-5 mr-2" />
                            Enable Microphone
                          </button>
                        </div>
                      </div>
                    )}

                    <div className={`w-full h-full transition-all duration-500 ${isListening ? 'opacity-100 scale-100' : 'opacity-50 scale-95 blur-sm'}`}>
                      {mode === 'shader' && (
                        <ShaderFace 
                          volume={effectiveVolume} 
                          zoomReactivity={zoomReactivity} 
                          manualZoom={manualZoom}
                          bgColor={bgColor}
                          skinColor={skinColor}
                          eyeColor={eyeColor}
                          eyeReactivity={eyeReactivity}
                          characterType={characterType}
                        />
                      )}
                      {mode === 'custom' && <CustomFace volume={effectiveVolume} />}
                      {mode === 'sequence' && <SequenceFace volume={effectiveVolume} />}
                    </div>
                  </div>
                </div>
              </div>

              {/* Control Panel */}
              <div className="w-72 flex flex-col gap-5 py-2 shrink-0 hidden md:flex">
                
                {/* Top Panel (Knob + Speaker) */}
                <div className="bg-[#f4ebd8] rounded-t-[4rem] rounded-b-lg p-6 flex flex-col items-center shadow-md border-b-[6px] border-r-[6px] border-[#d0c0a8]">
                  {/* Red light */}
                  <div className="w-3.5 h-3.5 bg-red-600 rounded-full mb-6 shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
                  
                  {/* Top Knob */}
                  <div className="w-32 h-32 rounded-full bg-[#e8dcc7] shadow-[0_6px_20px_rgba(0,0,0,0.3)] relative flex items-center justify-center border border-[#d0c0a8] mb-10">
                    <div className="w-20 h-20 rounded-full bg-[#d0c0a8] shadow-[inset_0_3px_10px_rgba(0,0,0,0.3)] relative flex items-center justify-center">
                      <div className="w-2 h-16 bg-gray-700 rounded-full transform rotate-45 shadow-sm" />
                    </div>
                  </div>

                  {/* Speaker Grill */}
                  <div className="w-full flex flex-col gap-2 px-3 mb-3">
                    {Array.from({ length: 5 }).map((_, rowIdx) => (
                      <div key={rowIdx} className="flex justify-between gap-1.5">
                        {Array.from({ length: 12 }).map((_, colIdx) => (
                          <div key={colIdx} className="w-2 h-2.5 bg-gray-800 rounded-sm opacity-80" />
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Radio Display */}
                <div className="bg-[#1a1a1a] rounded-md h-16 border-2 border-[#3a3a3a] shadow-inner p-3 flex flex-col justify-center relative overflow-hidden mx-2">
                  <div className="flex justify-between text-[11px] text-gray-400 font-mono mb-2 px-1">
                    <span>FM 88 92 96 100 104</span>
                  </div>
                  <div className="flex justify-between items-center px-1">
                    <div className="h-1 w-full bg-gray-600 relative rounded-full">
                      <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-1.5 h-5 bg-red-500 rounded-sm" />
                    </div>
                  </div>
                </div>

                {/* Slot */}
                <div className="bg-[#111] h-4 rounded-sm border-b border-white/10 shadow-inner mx-5 mt-2" />

                {/* Bottom Knob */}
                <div className="mt-auto flex justify-center mb-6">
                  <div className="w-36 h-36 rounded-full bg-[#e8dcc7] shadow-[0_6px_20px_rgba(0,0,0,0.4)] relative flex items-center justify-center border border-[#d0c0a8]">
                    {/* Ribbed texture effect */}
                    <div className="absolute inset-1.5 rounded-full border-[5px] border-[#d0c0a8] border-dashed opacity-40" />
                    <div className="w-20 h-20 rounded-full bg-[#d0c0a8] shadow-[inset_0_3px_10px_rgba(0,0,0,0.3)] relative flex items-center justify-center z-10">
                      <div className="w-2 h-16 bg-gray-700 rounded-full transform -rotate-12 shadow-sm" />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
