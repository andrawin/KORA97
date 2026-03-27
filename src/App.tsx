import React, { useState, useRef, useEffect } from 'react';
import { useAudioVolume } from './hooks/useAudioVolume';
import { CustomFace } from './components/CustomFace';
import { SequenceFace } from './components/SequenceFace';
import { ShaderFace } from './components/ShaderFace';
import { HUD } from './components/HUD';
import { Mic, MicOff, Image as ImageIcon, Cpu, Layers, Box, Settings, ChevronDown } from 'lucide-react';

export default function App() {
  const { volume, isListening, startListening, stopListening, transcript } = useAudioVolume();
  const [mode, setMode] = useState<'custom' | 'sequence' | 'shader'>('shader');
  const [showSettings, setShowSettings] = useState(false);
  const [reactivity, setReactivity] = useState(1.0);
  const [zoomReactivity, setZoomReactivity] = useState(0.5);
  
  const effectiveVolume = volume * reactivity;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-pink-500/30">
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
              <div className="absolute right-0 mt-2 w-72 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-5 z-50 flex flex-col gap-6">
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
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background ambient glow based on volume */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-75 ease-out"
          style={{
            background: `radial-gradient(circle at center, rgba(34, 211, 238, ${effectiveVolume * 0.15}) 0%, transparent 70%)`
          }}
        />

        <div className="w-full max-w-4xl h-[600px] flex items-center justify-center relative z-10">
          
          {/* TV Station Logo */}
          <img 
            src="https://drive.google.com/thumbnail?id=1OX1Sldz1IMLq1t1krJq4_iTu0gG2u05h&sz=w800" 
            alt="KORA-97 Logo" 
            className="absolute top-6 right-6 w-36 h-auto z-40 opacity-80 pointer-events-none drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            onError={(e) => {
              // Fallback if the direct image link fails
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

          {/* HUD Overlay */}
          {isListening && <HUD volume={effectiveVolume} transcript={transcript} />}

          {!isListening && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-gray-950/60 backdrop-blur-sm rounded-2xl border border-gray-800">
              <div className="text-center p-8 max-w-md">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/30">
                  <Mic className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Microphone Required</h2>
                <p className="text-gray-400 mb-8">
                  Click "Start Mic" to allow the browser to listen to your voice. The robot's face will react to the audio volume.
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
            {mode === 'shader' && <ShaderFace volume={effectiveVolume} zoomReactivity={zoomReactivity} />}
            {mode === 'custom' && <CustomFace volume={effectiveVolume} />}
            {mode === 'sequence' && <SequenceFace volume={effectiveVolume} />}
          </div>
        </div>
      </main>
    </div>
  );
}
