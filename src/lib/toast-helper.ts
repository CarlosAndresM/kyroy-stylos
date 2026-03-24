import { toast as sonnerToast } from 'sonner'
import { CustomToast, ToastVariant } from '@/components/ui/custom-toast'
import * as React from 'react'


type ToastOptions = {
  description?: string
  id?: string | number
  duration?: number
}

const createToast = (variant: ToastVariant, defaultDuration: number) => {
  return (title: string, descriptionOrOptions?: string | ToastOptions) => {
    let description: string | undefined
    let id: string | number | undefined
    let duration = defaultDuration

    if (typeof descriptionOrOptions === 'string') {
      description = descriptionOrOptions
    } else if (typeof descriptionOrOptions === 'object') {
      description = descriptionOrOptions.description
      id = descriptionOrOptions.id
      if (descriptionOrOptions.duration) {
        duration = descriptionOrOptions.duration
      }
    }

    return sonnerToast.custom((toastId) => (
      React.createElement(CustomToast, {
        id: toastId,
        title,
        description,
        variant: variant,
        duration: duration
      })
    ), {
      id,
      duration,
    })
  }
}

export const toast = {
  success: createToast('success', 4000),
  error: createToast('error', 5000),
  info: createToast('info', 4000),
  warning: createToast('warning', 4000),
  dismiss: (id?: string | number) => sonnerToast.dismiss(id),
}
