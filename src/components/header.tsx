'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react'; // Importamos el ícono
import { useSidebarContext } from '@/components/ui/sidebar-context'; // Importamos nuestro hook
import LogoComponent from './Logo';

export function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const { toggleMobileMenu } = useSidebarContext();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/login');
  };

  return (
    <header className="h-16 bg-white border-b border-cyan-100 shadow-sm sticky top-0 z-50">
      <nav className=" mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-cyan-700 hover:bg-cyan-50 rounded-md transition-colors"
          >
            <Menu size={24} />
          </button>
            <LogoComponent/>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {session ? (
            <>
              <span className="text-sm text-cyan-700 font-medium truncate max-w-xs">
                {session.user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-sm"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-cyan-700 hover:bg-cyan-50 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 transition-colors shadow-sm"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>

      </nav>
    </header>
  );
}