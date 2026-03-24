import { z } from 'zod'

export const solicitudProductoSchema = z.object({
  SP_IDSOLICITUD_PK: z.number().optional(),
  PR_IDPRODUCTO_FK: z.number({ required_error: 'Debe seleccionar un producto' }),
  SC_IDSUCURSAL_FK: z.number({ required_error: 'Debe seleccionar una sucursal' }),
  TR_IDTRABAJADOR_FK: z.number().optional(), // Se asigna en el server
  SP_CANTIDAD: z.coerce.number().min(1, 'La cantidad mínima es 1'),
  SP_ESTADO: z.enum(['PENDIENTE', 'ENTREGADO', 'CANCELADO']).default('PENDIENTE'),
  SP_COMENTARIOS: z.string().optional().nullable(),
})

export type SolicitudProductoFormData = z.infer<typeof solicitudProductoSchema>
