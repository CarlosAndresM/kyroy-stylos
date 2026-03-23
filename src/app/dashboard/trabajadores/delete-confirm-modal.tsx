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
      <DialogContent className="sm:max-w-[425px] border-2 border-kyroy-border rounded-none shadow-[10px_10px_0px_0px_rgba(255,134,162,0.2)] p-0 overflow-hidden bg-white">
        <DialogHeader className="bg-gradient-to-r from-red-500 to-rose-600 p-6 border-b-2 border-red-700">
          <DialogTitle className="text-xl font-black text-white uppercase italic tracking-widest flex items-center gap-2">
            <AlertCircle className="size-5" /> ¿ELIMINAR TRABAJADOR?
          </DialogTitle>
          <DialogDescription className="text-white/80 font-bold uppercase text-[10px] tracking-widest italic pt-1">
             Esta acci&oacute;n es irreversible y requiere autorizaci&oacute;n.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <p className="text-xs font-medium text-slate-600 leading-relaxed">
            Estás a punto de eliminar permanentemente a <span className="font-black text-red-600 italic">"{workerName}"</span>.
          </p>

          <div className="space-y-2">
            <Label htmlFor="admin-password" title="Contraseña Administrativa" className="text-[10px] font-black uppercase text-slate-500 italic tracking-wider">
              CONTRASEÑA DE SEGURIDAD:
            </Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="CONFIRME SU IDENTIDAD"
              className="rounded-none border-2 border-kyroy-border focus:border-red-500 h-11 font-black shadow-sm bg-rose-50/10 transition-all text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="new-password"
            />
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-3">
            <p className="text-[9px] uppercase font-black text-red-600 tracking-tight leading-normal flex items-center gap-2">
              <AlertCircle className="size-3" /> SI TIENE REGISTROS ASOCIADOS (FACTURAS, VALES), SE IMPEDIRÁ LA ELIMINACIÓN.
            </p>
          </div>
        </div>

        <DialogFooter className="p-4 bg-slate-50 border-t-2 border-kyroy-border gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-none border-2 border-kyroy-border font-black uppercase text-xs h-11 px-6 hover:bg-white text-slate-400"
          >
            CANCELAR
          </Button>
          <Button
            type="button"
            disabled={!password || isSubmitting}
            onClick={handleConfirm}
            className="bg-red-600 hover:bg-red-700 text-white font-black rounded-none px-8 shadow-[4px_4px_0px_0px_rgba(185,28,28,0.2)] flex-1 sm:flex-none h-11 uppercase text-xs tracking-widest active:shadow-none translate-x-0 active:translate-x-[2px] active:translate-y-[2px]"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            CONFIRMAR ELIMINACIÓN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
