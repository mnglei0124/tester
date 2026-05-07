"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls, { ErrorData, Events, LevelLoadedData, FragBufferedData } from 'hls.js';
import { Settings, Activity, AlertTriangle, CheckCircle, BarChart2, Loader2, SignalHigh, SignalLow } from 'lucide-react';

interface Props {
  src: string;
}

interface QualityLevel {
  id: number;
  height: number;
  bitrate: number;
  name: string;
}

export default function HLSPlayer({ src }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 is Auto
  const [bufferLength, setBufferLength] = useState<number>(0);
  const [isOverloaded, setIsOverloaded] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [latencyStatus, setLatencyStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');

  // Ping Feature: Check backend status every 30s
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(src, { method: 'HEAD', cache: 'no-cache' });
        if (response.status >= 500) {
          setIsOverloaded(true);
        } else {
          setIsOverloaded(false);
        }
      } catch (error) {
        setIsOverloaded(true);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [src]);

  // HLS Initialization
  useEffect(() => {
    if (!videoRef.current) return;

    const hls = new Hls({
      // Low Latency Settings
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 10,
      maxBufferLength: 30,
      maxMaxBufferLength: 60,
      enableWorker: true,
      // Automatic Fallback / Retry Logic
      fragLoadingRetryCount: 3,
      fragLoadingMaxRetryTimeout: 1000,
      levelLoadingRetryCount: 3,
      manifestLoadingRetryCount: 3,
      // CORS Handling
      xhrSetup: (xhr, url) => {
        xhr.withCredentials = false; // Set to true if your Varnish/CDN requires credentials (cookies/auth)
      }
    });

    hlsRef.current = hls;

    if (Hls.isSupported()) {
      hls.loadSource(src);
      hls.attachMedia(videoRef.current);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const availableLevels = hls.levels.map((level, index) => ({
          id: index,
          height: level.height,
          bitrate: level.bitrate,
          name: level.name || `${level.height}p`,
        }));
        setLevels(availableLevels);
      });

      // Analytics Hook: Frag_Buffered event
      hls.on(Hls.Events.FRAG_BUFFERED, (event, data: FragBufferedData) => {
        console.log(`[Analytics] Frag_Buffered: ID=${data.frag.sn}, Duration=${data.frag.duration.toFixed(2)}s, Type=${data.frag.type}`);
        // Here you would normally send this to your database
      });

      // Buffer Length Monitoring
      const bufferInterval = setInterval(() => {
        if (hls.mainLoop) {
          const len = hls.mainLoop.bufferLen || 0;
          setBufferLength(Number(len.toFixed(2)));
          
          // Latency visualization logic
          if (len < 2) setLatencyStatus('critical');
          else if (len < 5) setLatencyStatus('warning');
          else setLatencyStatus('healthy');
        }
      }, 500);

      hls.on(Hls.Events.ERROR, (event, data: ErrorData) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Fatal network error encountered, trying to recover");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Fatal media error encountered, trying to recover");
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });

      return () => {
        clearInterval(bufferInterval);
        hls.destroy();
      };
    } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari support
      videoRef.current.src = src;
    }
  }, [src]);

  const changeLevel = (levelId: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
      setCurrentLevel(levelId);
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-900 border border-white/10 group shadow-2xl">
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        autoPlay
        muted
        playsInline
      />

      {/* Overlay: Server Overloaded Message */}
      {isOverloaded && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
          <AlertTriangle className="w-16 h-16 text-red-500 animate-pulse mb-4" />
          <h2 className="text-2xl font-bold text-white">Server Overloaded</h2>
          <p className="text-slate-400 mt-2">The gateway is experiencing high latency. Retrying...</p>
        </div>
      )}

      {/* Buffer Health Visualizer */}
      <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
        <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 backdrop-blur-xl bg-slate-900/40">
          <Activity className={`w-4 h-4 ${latencyStatus === 'healthy' ? 'text-emerald-400' : latencyStatus === 'warning' ? 'text-amber-400' : 'text-red-500 animate-pulse'}`} />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Buffer Health</span>
            <span className="text-sm font-mono font-bold text-white">{bufferLength}s</span>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className="glass-panel px-4 py-2 rounded-2xl flex items-center gap-3 border border-white/10 backdrop-blur-xl bg-slate-900/40">
          {isOverloaded ? (
            <SignalLow className="w-4 h-4 text-red-500" />
          ) : (
            <SignalHigh className="w-4 h-4 text-emerald-400" />
          )}
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">CDN Status</span>
            <span className="text-sm font-bold text-white">{isOverloaded ? 'Degraded' : 'Optimal'}</span>
          </div>
        </div>
      </div>

      {/* Quality Gear Menu */}
      <div className="absolute bottom-6 right-6 z-20">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-3 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95 group/gear"
        >
          <Settings className={`w-6 h-6 transition-transform duration-500 ${isMenuOpen ? 'rotate-90' : 'group-hover/gear:rotate-45'}`} />
        </button>

        {isMenuOpen && (
          <div className="absolute bottom-full right-0 mb-4 w-48 glass-panel rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="p-3 border-b border-white/5 bg-white/5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <BarChart2 className="w-3 h-3" />
                Quality Selection
              </span>
            </div>
            <div className="p-1">
              <button
                onClick={() => changeLevel(-1)}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between ${currentLevel === -1 ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'text-slate-300 hover:bg-white/5'}`}
              >
                Auto
                {currentLevel === -1 && <CheckCircle className="w-4 h-4" />}
              </button>
              {levels.map((level) => (
                <button
                  key={level.id}
                  onClick={() => changeLevel(level.id)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between ${currentLevel === level.id ? 'bg-indigo-500/20 text-indigo-400 font-bold' : 'text-slate-300 hover:bg-white/5'}`}
                >
                  {level.name}
                  {currentLevel === level.id && <CheckCircle className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Watermark / Logo */}
      <div className="absolute bottom-6 left-6 opacity-40 pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <span className="text-xs font-mono font-bold text-white tracking-tighter">CDN_STREAM_V2</span>
        </div>
      </div>
    </div>
  );
}
