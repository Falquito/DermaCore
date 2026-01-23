import { CheckCircle2, PlayCircle, ChevronDown, ChevronUp } from "lucide-react";

interface Lesson {
    id: number;
    title: string;
    videoId: string;
    duration: string;
    completed: boolean;
}

interface Module {
    title: string;
    lessons: Lesson[];
}

// Definimos qué props espera recibir este componente
interface SideBarProps {
    courseContent: Module[];
    activeLesson: Lesson;
    setActiveLesson: (lesson: Lesson) => void;
    openModules: number[];
    toggleModule: (index: number) => void;
}

export default function SideBar({ 
    courseContent, 
    activeLesson, 
    setActiveLesson, 
    openModules, 
    toggleModule 
}: SideBarProps) {
    
    return (
        <div className="w-full lg:w-[400px]  border-l border-gray-200 flex flex-col h-auto lg:h-screen lg:sticky lg:top-0 lg:overflow-y-auto">
            
            <div className="p-4 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
                <h2 className="font-bold text-lg text-gray-800">Contenido del Curso</h2>
                <p className="text-xs text-gray-500 mt-1">
                    3 Módulos • {courseContent.reduce((acc, mod) => acc + mod.lessons.length, 0)} Lecciones
                </p>
            </div>

            <div className="flex-1">
                {courseContent.map((module, modIndex) => {
                    const isOpen = openModules.includes(modIndex);
                    
                    return (
                        <div key={modIndex} className="border-b border-gray-100">
                            {/* Header del Módulo */}
                            <button 
                                onClick={() => toggleModule(modIndex)}
                                className="w-full flex items-center justify-between p-4 bg-gray-50/50 hover:bg-gray-100 transition-colors text-left"
                            >
                                <span className="font-bold text-sm text-gray-800">{module.title}</span>
                                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {/* Lecciones del Módulo */}
                            {isOpen && (
                                <div className="flex flex-col">
                                    {module.lessons.map((lesson: Lesson) => {
                                        const isActive = activeLesson.id === lesson.id;
                                        
                                        return (
                                            <div 
                                                key={lesson.id}
                                                onClick={() => setActiveLesson(lesson)}
                                                className={`
                                                    flex gap-3 p-4 cursor-pointer transition-all border-l-4
                                                    ${isActive 
                                                        ? 'bg-cyan-50 border-cyan-500' 
                                                        : 'bg-white border-transparent hover:bg-gray-50'
                                                    }
                                                `}
                                            >
                                                <div className="mt-1">
                                                    {isActive ? (
                                                        <div className="w-4 h-4 rounded-full border-2 border-cyan-300 bg-cyan-400"></div>
                                                    ) : lesson.completed ? (
                                                        <CheckCircle2 size={16} className="text-green-600" />
                                                    ) : (
                                                        <div className="w-4 h-4 rounded-full border-2 border-cyan-300" />
                                                    )}
                                                </div>

                                                <div className="flex flex-col gap-1">
                                                    <span className={`text-sm ${isActive ? 'font-bold text-[var(--primary)]' : 'text-gray-700'}`}>
                                                        {lesson.title}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                                        <PlayCircle size={12} />
                                                        <span>{lesson.duration}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}