import Image from 'next/image'

export default function Home() {
  return (
    <div 
      className="min-h-screen text-gray-900 relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: 'url(/fondo.jpg)',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay para mejorar legibilidad - TEMPORALMENTE DESACTIVADO */}
      {/* <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/20 z-10"></div> */}
      
      {/* Content */}
      <div className="relative z-20">
        {/* Header */}
        <div className="text-center py-6">
          <div className="mb-4">
            <Image
              src="/logo.png"
              alt="CareLink Logo"
              width={200}
              height={200}
              className="mx-auto drop-shadow-sm"
              priority
            />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-emerald-600 mb-4 drop-shadow-sm">
            CareLink
          </h1>
          <p className="text-xl text-emerald-600 drop-shadow-sm">
            Sistema de gestión de salud y cuidado
          </p>
        </div>
        
        {/* Three Sections - Más delgadas */}
        <div className="flex flex-col md:flex-row min-h-[50vh]">
          {/* Gerencia Section - Violeta Crema */}
          <a 
            href="/login" 
            className="flex-1 group cursor-pointer transition-all duration-300 hover:bg-purple-300 bg-purple-200 flex flex-col items-center justify-center p-6 md:p-8 text-purple-800"
          >
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"/>
                  <path d="M21 9V7L15 6.5C14.8 6.2 14.5 6 14.2 6H9.8C9.5 6 9.2 6.2 9 6.5L3 7V9H4V16C4 17.1 4.9 18 6 18H8V20C8 21.1 8.9 22 10 22H14C15.1 22 16 21.1 16 20V18H18C19.1 18 20 17.1 20 16V9H21ZM18 16H6V8H7.5L8 7.5H16L16.5 8H18V16Z"/>
                  <rect x="9" y="9" width="6" height="1"/>
                  <rect x="10" y="11" width="4" height="1"/>
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-purple-900 transition-colors">
                Gerencia
              </h2>
              <p className="text-sm text-purple-700 group-hover:text-purple-800 transition-colors">
                Administración y gestión del sistema
              </p>
            </div>
          </a>

          {/* Profesionales Section - Azul Crema */}
          <a 
            href="/login" 
            className="flex-1 group cursor-pointer transition-all duration-300 hover:bg-blue-300 bg-blue-200 flex flex-col items-center justify-center p-6 md:p-8 text-blue-800 border-x-2 border-white"
          >
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="10" y="4" width="4" height="16" rx="1" />
                  <rect x="4" y="10" width="16" height="4" rx="1" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-blue-900 transition-colors">
                Profesionales
              </h2>
              <p className="text-sm text-blue-700 group-hover:text-blue-800 transition-colors">
                Médicos y especialistas
              </p>
            </div>
          </a>

          {/* Mesa de Entrada Section - Verde Crema */}
          <a 
            href="/login" 
            className="flex-1 group cursor-pointer transition-all duration-300 hover:bg-green-300 bg-green-200 flex flex-col items-center justify-center p-6 md:p-8 text-green-800"
          >
            <div className="text-center">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 group-hover:text-green-900 transition-colors">
                Mesa de Entrada
              </h2>
              <p className="text-sm text-green-700 group-hover:text-green-800 transition-colors">
                Recepción y atención al paciente
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
