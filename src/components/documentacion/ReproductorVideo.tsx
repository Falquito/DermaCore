"use client";

import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { Loader2 } from "lucide-react"; // Asegúrate de tener lucide-react instalado

interface Lesson {
    id: number;
    title: string;
    videoId: string;
}

export default function ReproductorVideo({ activeLesson }: { activeLesson: Lesson }) {
    const [hasWindow, setHasWindow] = useState(false);
    const [isLoading, setIsLoading] = useState(true); 
    useEffect(() => {
        setHasWindow(true);
    }, []);

    useEffect(() => {
        setIsLoading(true);
    }, [activeLesson.videoId]);

    const videoUrl = activeLesson.videoId.includes("http") 
        ? activeLesson.videoId 
        : `https://www.youtube.com/watch?v=${activeLesson.videoId}`;

    if (!hasWindow) {
        return <div className="w-full aspect-video bg-slate-900 rounded-2xl animate-pulse ring-1 ring-slate-800" />;
    }

    return (
        <div className="relative w-full aspect-video group my-4">
            
        

            <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-slate-950 ring-1 ring-white/10 z-10">
                
        
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 z-20 transition-opacity duration-300">
                        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-2" />
                        <p className="text-slate-400 text-sm font-medium tracking-wide">Cargando lección...</p>
                    </div>
                )}

                {/* 4. REPRODUCTOR */}
                <ReactPlayer
                    src={videoUrl}
                    width="100%"
                    height="100%"
                    controls={true}
                    playing={false} 
                    
                    onReady={() => setIsLoading(false)}
                    
                    onError={() => setIsLoading(false)}

                    config={{
                        youtube: {
                            playerVars: { 
                                showinfo: 0, 
                                modestbranding: 1,
                                rel: 0 
                            }
                        } as any 
                    }}
                    style={{ backgroundColor: '#020617' }} 
                />

                <div className="absolute top-4 left-4 pointer-events-none z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    <div className="flex items-center gap-2 bg-slate-950/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
                        <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-200 tracking-widest uppercase">
                            LSLC <span className="text-cyan-400">Software</span>
                        </span>
                    </div>
                </div>

            </div>
        </div>
    );
}