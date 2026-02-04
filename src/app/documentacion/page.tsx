"use client"
import { useState } from "react";
import FooterReproductorVideo from "@/components/documentacion/FooterReproductorVideo";
import { courseContent } from "../../../contentDocumentacion/contenidoDelCurso";
import CourseSideBar from "@/components/documentacion/SideBar";
import dynamic from "next/dynamic";


const ReproductorVideo = dynamic(
  () => import("@/components/documentacion/ReproductorVideo"),
  { 
    ssr: false,
    loading: () => <div className="w-full aspect-video bg-slate-900 animate-pulse rounded-xl" /> 
  }
);

export default function DocumentacionPage() {
  const [activeLesson, setActiveLesson] = useState(courseContent[0].lessons[0]);
  const [openModules, setOpenModules] = useState<number[]>([0]);
  const [activeTab, setActiveTab] = useState("overview");

  const toggleModule = (index: number) => {
    if (openModules.includes(index)) {
      setOpenModules(openModules.filter((i) => i !== index));
    } else {
      setOpenModules([...openModules, index]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 text-gray-800 font-sans gap-5">
      
      <div className="flex-1 flex flex-col">
        <ReproductorVideo activeLesson={activeLesson} />
        
        <FooterReproductorVideo 
            activeLesson={activeLesson} 
            activeTab={activeTab}        
            setActiveTab={setActiveTab}  
        />
      </div>

      <CourseSideBar 
          courseContent={courseContent}
          activeLesson={activeLesson}
          setActiveLesson={setActiveLesson}
          openModules={openModules}
          toggleModule={toggleModule}
      />

    </div>
  );
}