"use client";

import { Linkedin, Phone, ExternalLink, Code2, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-white border-t border-slate-200 mt-auto">
      {/* --- Parte Superior: Información Principal --- */}
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Columna 1: El Sistema (Dermacor) */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              DermaCore <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-medium">v1.0.0</span>
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              Sistema integral de gestión dermatológica. Optimizando la atención clínica y la administración de pacientes con tecnología de punta.
            </p>
          </div>

          {/* Columna 2: Enlaces Rápidos (Útil para el usuario) */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Soporte</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href={"/documentacion"} className="hover:text-cyan-600 transition-colors">Documentación</Link>
              </li>
              <li>
                <a href="#" className="hover:text-cyan-600 transition-colors">Reportar un error</a>
              </li>
              <li>
                <a href="/terminos-y-condiciones" className="hover:text-cyan-600 transition-colors">Términos y condiciones</a>
              </li>
            </ul>
          </div>

          {/* Columna 3: LSLC Software (La publicidad) */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Code2 size={16} className="text-cyan-600" />
              Desarrollado por
            </h4>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 shadow-sm">
                <div>
                  <Image className="rounded-xl" width={50} height={50} src="/Logo.jpg" alt="Logo LSLC"></Image>
                  <p className="font-bold text-slate-800 mb-1">LSLC Software</p>
                </div>
                <p className="text-xs text-slate-500 mb-3">Soluciones tecnológicas a medida. Salta, Argentina.</p>
                
                <div className="flex flex-col gap-2">
                    <a 
                        href="https://www.linkedin.com/company/lslc-software" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs flex items-center gap-2 text-slate-600 hover:text-[#0077b5] transition-colors font-medium group"
                    >
                        <Linkedin size={14} className="group-hover:scale-110 transition-transform"/>
                        linkedin.com/company/lslc-software
                        <ExternalLink size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    
                    <a 
                        href="https://wa.me/5493875043021" 
                        target="_blank" 
                        className="text-xs flex items-center gap-2 text-slate-600 hover:text-green-600 transition-colors font-medium"
                    >
                        <Phone size={14} />
                        +54 9 387 504 3021
                    </a>
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- Parte Inferior: Copyright --- */}
      <div className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 text-center md:text-left">
            &copy; {currentYear} DermaCore. Todos los derechos reservados.
          </p>
          
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <span>Hecho con</span>
            <Heart size={10} className="text-red-400 fill-red-400 animate-pulse" />
            <span>en Argentina por</span>
            <span className="font-semibold text-slate-600">LSLC Team</span>
          </div>
        </div>
      </div>
    </footer>
  );
}