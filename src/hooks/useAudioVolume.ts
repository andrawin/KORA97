import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useAudioVolume() {
  const [volume, setVolume] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const isSpeechActiveRef = useRef(false);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);
      
      setIsListening(true);
      isSpeechActiveRef.current = true;
      setTranscript("");
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        // Normalize volume to 0-1 range (approximate)
        const normalizedVolume = Math.min(average / 128, 1);
        
        // Smooth the volume a bit
        setVolume(prev => prev * 0.7 + normalizedVolume * 0.3);
        
        requestRef.current = requestAnimationFrame(updateVolume);
      };
      
      updateVolume();

      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        recognitionRef.current.onerror = (event: any) => {
          if (event.error === 'network' || event.error === 'not-allowed' || event.error === 'service-not-allowed') {
            console.warn("Speech recognition unavailable:", event.error);
            isSpeechActiveRef.current = false;
            setTranscript("[Speech recognition unavailable: Network/Browser restriction]");
            setTimeout(() => setTranscript(""), 5000); // Clear error message after 5s
          } else {
            console.warn("Speech recognition error:", event.error);
          }
        };

        recognitionRef.current.onend = () => {
          // Restart if still listening and no fatal error occurred
          if (isSpeechActiveRef.current && recognitionRef.current) {
             try { recognitionRef.current.start(); } catch(e) {}
          }
        };

        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Failed to start speech recognition:", e);
        }
      } else {
        setTranscript("[Speech recognition not supported in this browser]");
        setTimeout(() => setTranscript(""), 5000);
      }

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone. Please ensure you have granted permission.");
    }
  };

  const stopListening = () => {
    isSpeechActiveRef.current = false;
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioContextRef.current) audioContextRef.current.close();
    
    if (recognitionRef.current) {
      recognitionRef.current.onend = null; // Prevent auto-restart
      try { recognitionRef.current.stop(); } catch(e) {}
    }
    
    setIsListening(false);
    setVolume(0);
    setTranscript("");
  };

  useEffect(() => {
    return stopListening;
  }, []);

  return { volume, isListening, startListening, stopListening, transcript };
}
