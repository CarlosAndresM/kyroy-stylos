import imageCompression from 'browser-image-compression';

/**
 * Optimiza una imagen usando browser-image-compression para reducir su peso 
 * sin una pérdida de calidad perceptible.
 * 
 * @param file Archivo de imagen original
 * @param options Opciones de compresión personalizadas
 * @returns Archivo comprimido
 */
export async function compressImage(file: File, options?: any) {
  const defaultOptions = {
    maxSizeMB: 0.8,              // Tamaño máximo aproximado en MB
    maxWidthOrHeight: 1920,      // Resolución máxima permitida
    useWebWorker: true,         // Mejor rendimiento en hilo separado
    initialQuality: 0.8,        // Calidad inicial (0 a 1)
    ...options
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return compressedFile;
  } catch (error) {
    console.error('Error al comprimir la imagen:', error);
    // Si falla, devolvemos el original para no bloquear el flujo
    return file;
  }
}
