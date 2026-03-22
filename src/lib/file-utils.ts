import { rename, unlink, mkdir, access } from 'fs/promises';
import { join, dirname } from 'path';

/**
 * Mueve un archivo de la carpeta temporal a la carpeta permanente de uploads.
 * @param tempUrl URL relativa del archivo en temp (ej: /uploads/temp/file.jpg)
 * @returns Nueva URL relativa permanente
 */
export async function finalizeUpload(tempUrl: string, invoiceNumber: string): Promise<string> {
  if (!tempUrl || !tempUrl.includes('/temp/')) return tempUrl;

  const fileName = tempUrl.split('/').pop() || '';
  const oldPath = join(process.cwd(), 'public', 'uploads', 'temp', fileName);

  // Sanitizar el número de factura para usarlo en el nombre de la carpeta
  const sanitizedInvoice = invoiceNumber.toString().replace(/[^a-zA-Z0-9]/g, '_');
  const invoiceFolder = `invoice-${sanitizedInvoice}`;
  const relativePath = join('uploads', invoiceFolder, fileName);
  const newPath = join(process.cwd(), 'public', relativePath);

  try {
    // Asegurar que el directorio de la factura existe
    await mkdir(dirname(newPath), { recursive: true });

    // Mover el archivo
    await rename(oldPath, newPath);

    return `/${relativePath.replace(/\\/g, '/')}`;
  } catch (error) {
    console.error(`Error al finalizar upload para ${tempUrl}:`, error);
    return tempUrl; // Devolver el original si falla
  }
}

/**
 * Elimina un archivo de la carpeta temporal.
 * @param tempUrl URL relativa del archivo (ej: /uploads/temp/file.jpg)
 */
export async function deleteTempFile(tempUrl: string): Promise<void> {
  if (!tempUrl || !tempUrl.includes('/temp/')) return;

  const fileName = tempUrl.split('/').pop() || '';
  const path = join(process.cwd(), 'public', 'uploads', 'temp', fileName);

  try {
    await access(path);
    await unlink(path);
  } catch (error) {
    // El archivo no existe o no se puede borrar, ignoramos
  }
}
