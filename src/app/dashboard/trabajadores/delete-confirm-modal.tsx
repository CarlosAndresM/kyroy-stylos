'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Label } from '@/components/ui/label'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (password: string) => Promise<void>
  workerName: string
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  workerName
}: DeleteConfirmModalProps) {
  const [password, setPassword] = React.useState('')
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleConfirm = async () => {
    if (!password) return
    setIsSubmitting(true)
    try {
      await onConfirm(password)
      setPassword('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] border-red-200 dark:border-red-900/50 rounded-[32px] overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500" />

        <DialogHeader className="pt-4">
          <div className="size-12 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
            <AlertCircle className="size-8" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white">
            ¿Eliminar Trabajador?
          </DialogTitle>
          <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium pt-2">
            Estás a punto de eliminar permanentemente a <span className="font-black text-red-500 italic">"{workerName}"</span>.
            Esta acción solo se permite si el trabajador no tiene registros asociados.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-password" title="Contraseña Administrativa" className="font-bold text-slate-700 dark:text-slate-300">
              Confirma con tu contraseña
            </Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="Introduce tu contraseña"
              className="rounded-xl border-slate-200 focus:ring-red-500 focus:border-red-500 h-12"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="new-password"
            />
          </div>
          <div className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 rounded-2xl p-4">
            <p className="text-[10px] uppercase font-black text-red-500 tracking-widest leading-normal">
              Advertencia: Si el trabajador tiene facturas, servicios o vales registrados, el sistema impedirá la eliminación por integridad de datos.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl flex-1 sm:flex-none"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!password || isSubmitting}
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl px-8 shadow-lg shadow-red-500/20 flex-1 sm:flex-none"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Eliminación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
