'use client'

import { useState } from 'react'
import HeaderComponent from '@/components/obras-sociales/header'
import SearcherObraSocialComponent from '@/components/obras-sociales/searcherObraSocial'
import { useObraSocial } from '@/hooks/useObras'
import ListadoObraSocial from '@/components/obras-sociales/listaObraSocial'
import SkeletonListObraSocialComponent from '@/components/obras-sociales/skeletonListObraSocial'

export default function ObrasSocialesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const { obras, loading, error, refrescar } = useObraSocial()

  // Layout wrapper para consistencia
  const LayoutWrapper = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
      </div>
    </div>
  )

  if (loading) return (
    <LayoutWrapper>
      <HeaderComponent onRefresh={() => {}} loading={true} />
      <div className="space-y-6">
         <SearcherObraSocialComponent 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            setStatusFilter={setStatusFilter} 
            disabled={true}
         />
         <SkeletonListObraSocialComponent />
      </div>
    </LayoutWrapper>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-red-600">Error de carga</h3>
        <p className="text-slate-500">{error}</p>
      </div>
    </div>
  )

  const filteredObras = obras.filter((obra) => {
    const matchesSearch = obra.nombreObraSocial.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' 
      ? true 
      : statusFilter === 'ACTIVA' 
        ? obra.estadoObraSocial 
        : !obra.estadoObraSocial

    return matchesSearch && matchesStatus
  })

  return (
    <LayoutWrapper>
      <HeaderComponent onRefresh={refrescar}/>
      
      <div className="space-y-6">
        <SearcherObraSocialComponent 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          setStatusFilter={setStatusFilter} 
        />
        
        <ListadoObraSocial 
          onRefresh={refrescar} 
          obras={filteredObras} 
          isFiltered={searchTerm !== '' || statusFilter !== 'ALL'} // Para mostrar mensaje específico si filtra
        />
      </div>
    </LayoutWrapper>
  )
}