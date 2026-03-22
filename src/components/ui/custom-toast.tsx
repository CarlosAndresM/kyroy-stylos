'use client'

import * as React from 'react'
import { X, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { toast as sonnerToast } from 'sonner'
import { cn } from '@/lib/utils'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

interface CustomToastProps {
  id: string | number
  title: string
  description?: string
  variant: ToastVariant
}

export const CustomToast = ({ id, title, description, variant }: CustomToastProps) => {
  const [progress, setProgress] = React.useState(100)
  const duration = 4000 // default duration

  React.useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => Math.max(0, prev - (100 / (duration / 10))))
    }, 10)

    return () => clearInterval(timer)
  }, [])

  const variants = {
    success: {
      icon: <Check className="w-7 h-7 text-white stroke-[3px]" />,
      iconBg: 'bg-emerald-500',
      progressBar: 'bg-emerald-500',
    },
    error: {
      icon: <X className="w-6 h-6 text-white stroke-[3px]" />,
      iconBg: 'bg-rose-500',
      progressBar: 'bg-rose-500',
    },
    info: {
      icon: <Info className="w-6 h-6 text-white stroke-[2px]" />,
      iconBg: 'bg-blue-500',
      progressBar: 'bg-blue-500',
    },
    warning: {
      icon: <AlertTriangle className="w-6 h-6 text-white stroke-[2px]" />,
      iconBg: 'bg-amber-500',
      progressBar: 'bg-amber-500',
    },
  }

  const { icon, iconBg, progressBar } = variants[variant]

  return (
    <div className="relative w-full max-w-[400px] bg-white rounded-lg shadow-xl overflow-hidden border border-gray-100/50 group">
      <div className="flex items-stretch p-4">
        {/* Icon Section */}
        <div className="flex items-center justify-center pr-4">
          <div className={cn("w-12 h-12 flex items-center justify-center rounded-full shadow-sm", iconBg)}>
            {icon}
          </div>
        </div>

        {/* Separator */}
        <div className="w-[1px] bg-gray-100 mx-1" />

        {/* Content Section */}
        <div className="flex-1 pl-4 pr-6 py-1">
          <h3 className="text-[15px] font-bold text-slate-800 leading-tight">
            {title}
          </h3>
          {description && (
            <p className="text-[13px] text-slate-500 mt-1 leading-normal font-medium">
              {description}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            sonnerToast.dismiss(id);
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all z-[100] cursor-pointer"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress Bar Container */}
      <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-50/50">
        {/* Actual Progress Bar */}
        <div
          className={cn("h-full transition-all duration-100 ease-linear", progressBar)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
