'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface LoadingGateProps {
  children: React.ReactNode
}

/**
 * Componente que asegura un estado de carga consistente de al menos 0.5 segundos.
 * Mantiene el contenido renderizado por detrás para una transición fluida.
 */
export function LoadingGate({ children }: LoadingGateProps) {
  const [loading, setLoading] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    // Forzamos al menos 0.5 segundos de carga para consistencia visual
    const timer = setTimeout(() => {
      setFadeOut(true) // Iniciamos salida suave (0.3s)
      setTimeout(() => setLoading(false), 300)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative min-h-[400px]">
      {/* Contenido (siempre se carga por detrás y es visible bajo el blur) */}
      <div className="w-full h-full">
        {children}
      </div>

      {/* Overlay de carga (portal opcional, pero aquí manual para que sea 'dentro del page') */}
      {loading && (
        <div className={cn(
          "fixed inset-0 sm:left-[280px] sm:top-20 z-[80] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-md transition-all duration-300",
          fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
        )}>
          <div className="flex flex-col items-center gap-4">
            <div className="relative size-16">
              <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full" />
              <div className="absolute inset-0 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 animate-pulse">
              Cargando...
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
