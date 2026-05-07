"use client";

import { useEffect, useState, Suspense } from "react";
import { Terminal, Cpu, Clock as ClockIcon, Server, Database, Video } from "lucide-react";
import { getDatabaseStatus } from "./actions";
import HLSPlayer from "@/components/HLSPlayer";

export default function Home() {
  const [time, setTime] = useState<Date | null>(null);
  
  const quotes = [
    "Simplicity is the soul of efficiency.",
    "Make it work, make it right, make it fast.",
    "Talk is cheap. Show me the code.",
    "Code is like humor. When you have to explain it, it's bad.",
    "First, solve the problem. Then, write the code."
  ];
  
  const [quoteIndex, setQuoteIndex] = useState(0);
  
  interface DbStatus {
    status: string;
    version: string | null;
    database: string | null;
    latency: number;
    error?: string;
  }
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

  useEffect(() => {
    // DB Polling
    const fetchDb = async () => {
      try {
        const res = await getDatabaseStatus();
        setDbStatus(res);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDb();
    const dbPollTimer = setInterval(fetchDb, 5000);

    // Defer the initial state update to avoiding calling setState synchronously
    // within the effect body, which prevents cascading renders.
    const initialTimer = setTimeout(() => {
      setTime(new Date());
    }, 0);

    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    const quoteTimer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 10000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(timer);
      clearInterval(quoteTimer);
      clearInterval(dbPollTimer);
    };
  }, [quotes.length]);

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      {/* Background Ambient Blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-5xl p-6 md:p-12 flex flex-col gap-8">
        
        {/* Header Section */}
        <header className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Terminal className="text-indigo-400 w-6 h-6" />
            <span className="font-mono text-xl font-bold tracking-tight text-white/90">
              DevSpace<span className="text-indigo-500">_</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-400 font-mono glass-panel px-4 py-1.5 rounded-full border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            SYSTEM ONLINE
          </div>
        </header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          
          {/* Live CDN Stream Section - spans 2 cols */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <Video className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white/90 tracking-tight">Live CDN Stream</h2>
                  <p className="text-xs text-slate-500 font-mono">10.128.50.149 // MASTER_MANIFEST</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Live</span>
              </div>
            </div>
            
            <Suspense fallback={
              <div className="w-full aspect-video rounded-3xl bg-slate-900 animate-pulse flex items-center justify-center border border-white/5">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  <span className="text-slate-500 font-mono text-xs uppercase tracking-widest">Initializing HLS Pipeline...</span>
                </div>
              </div>
            }>
              <HLSPlayer src={process.env.NEXT_PUBLIC_HLS_SOURCE || "http://10.128.50.149/live/stream/playlist.m3u8"} />
            </Suspense>
          </div>

          {/* Quick Stats Column */}
          <div className="flex flex-col gap-6 col-span-1 border-gray-100">
            
            <div className="glass-panel p-6 rounded-3xl flex-1 flex flex-col relative overflow-hidden group hover:bg-white/4 transition-colors duration-500">
               <div className="absolute -right-6 -top-6 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors duration-500">
                 <Database className="w-32 h-32" strokeWidth={1} />
               </div>
               <div className="relative z-10 flex items-center gap-2 mb-6 text-slate-300">
                  <Database className={`w-5 h-5 ${dbStatus?.status === 'online' ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <h3 className="font-semibold tracking-wide">Database Pulse</h3>
               </div>
               <div className="relative z-10 flex-1 flex flex-col justify-center gap-6">
                 <div className="group/stat">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-slate-400 text-sm font-medium">Status</span>
                     <span className={`font-mono px-2 py-1 rounded text-xs border transition-colors ${dbStatus?.status === 'online' ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20 group-hover/stat:bg-emerald-500/20' : 'text-red-300 bg-red-500/10 border-red-500/20'}`}>
                       {dbStatus ? dbStatus.status.toUpperCase() : 'CONNECTING...'}
                     </span>
                   </div>
                   <div className="text-xs text-slate-500 truncate h-4 mb-2">
                     {dbStatus?.database ? `DB: ${dbStatus.database}` : 'Verifying connection...'}
                   </div>
                 </div>
                 
                 <div className="group/stat">
                   <div className="flex justify-between items-center mb-2">
                     <span className="text-slate-400 text-sm font-medium">Query Latency</span>
                     <span className="text-blue-300 font-mono bg-blue-500/10 px-2 py-1 rounded text-xs border border-blue-500/20 group-hover/stat:bg-blue-500/20">{dbStatus && dbStatus.status === 'online' ? `${dbStatus.latency}ms` : '--'}</span>
                   </div>
                   <div className="w-full bg-slate-800/50 rounded-full h-1.5 overflow-hidden">
                     <div className="bg-linear-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: dbStatus?.status === 'online' ? `${Math.max(5, 100 - (dbStatus.latency / 2))}%` : '0%' }}></div>
                   </div>
                 </div>
               </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-white/5 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-fuchsia-500/10 rounded-2xl group-hover:bg-fuchsia-500/20 transition-colors border border-fuchsia-500/10">
                  <Cpu className="w-6 h-6 text-fuchsia-400 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <h3 className="text-slate-200 font-medium">Node Deployment</h3>
                  <p className="text-xs text-slate-400 mt-1">Ready for production</p>
                </div>
              </div>
              <Server className="text-slate-500 w-5 h-5 group-hover:text-fuchsia-400 transition-colors" />
            </div>

          </div>
        </div>

        {/* Footer Quote Panel */}
        <div className="glass-panel p-6 md:p-8 rounded-3xl flex items-center justify-center mt-2 group hover:bg-white/4 transition-colors duration-500 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-linear-to-b from-indigo-500/50 flex to-purple-500/50"></div>
          <p className="text-lg md:text-xl font-light text-slate-300 italic text-center max-w-2xl px-4 py-2" key={quoteIndex}>
            &quot;{quotes[quoteIndex]}&quot;
          </p>
        </div>

      </div>
    </main>
  );
}
