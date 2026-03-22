import { z } from 'zod';

export const clientSchema = z.object({
  CL_IDCLIENTE_PK: z.number().optional(),
  CL_NOMBRE: z.string().min(1, 'El nombre es obligatorio').max(255),
  CL_TELEFONO: z.string().min(7, 'El teléfono debe tener al menos 7 caracteres').max(20),
  CL_EMAIL: z.string().email('Email inválido').optional().or(z.literal('')),
  CL_DIRECCION: z.string().max(255).optional().or(z.literal('')),
  CL_FECHA_NACIMIENTO: z.string().optional().or(z.literal('')),
  CL_FRECUENTE: z.boolean().default(false),
});

export type ClientFormData = z.infer<typeof clientSchema>;
