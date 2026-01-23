"use client";

import { MediaPlayer, MediaProvider } from '@vidstack/react';
import { DefaultVideoLayout, defaultLayoutIcons } from '@vidstack/react/player/layouts/default';

// Estilos base
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

interface Lesson {
    id: number;
    title: string;
    videoId: string;
}

export default function ReproductorVideo({ activeLesson }: { activeLesson: Lesson }) {

  return (
    <div className="relative w-full aspect-video group">
      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

      <MediaPlayer 
        title={activeLesson.title}
        src={`youtube/${activeLesson.videoId}`} 
        aspectRatio="16/9"
        load="eager"
        className="w-full h-full relative rounded-xl overflow-hidden shadow-2xl bg-slate-950 ring-1 ring-white/10"
        
        style={{
            '--video-brand': 'rgb(6, 182, 212)',

          
            '--video-controls-margin': '16px', 
            
            '--video-controls-bg': 'rgba(15, 23, 42, 0.85)', 
            '--video-controls-backdrop-filter': 'blur(12px)',
            
            '--video-controls-border-radius': '12px',
            
      
            '--video-controls-border': '1px solid rgba(255,255,255,0.1)',

            
            '--video-slider-fill-bg': 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)',
            '--video-slider-height': '6px',
            '--video-slider-thumb-size': '16px',
            '--video-slider-thumb-bg': '#fff',
            '--video-slider-thumb-border': '2px solid #06b6d4',
            '--video-controls-color': '#ffffff',
        } as React.CSSProperties}
      >
        <MediaProvider />
        
        <DefaultVideoLayout 
            icons={defaultLayoutIcons} 
        />
      </MediaPlayer>
      <div className="absolute top-4 left-4 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
         <span className="bg-black/50 backdrop-blur-md text-white/80 text-[10px] font-bold tracking-widest px-2 py-1 rounded uppercase border border-white/10">
            LSLC<span className="text-cyan-400"> Software</span>
         </span>
      </div>

    </div>
  );
}