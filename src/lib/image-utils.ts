import imageCompression from 'browser-image-compression';

/**
 * Optimiza una imagen en el cliente para reducir el peso antes de la subida.
 * No es obligatorio que convierta el formato aquí, ya que el servidor (Sharp)
 * se encarga de la estandarización final a JPEG.
 */
export async function compressImage(file: File, options?: any) {
  const defaultOptions = {
    maxSizeMB: 0.8,              // Tamaño máximo aproximado en MB
    maxWidthOrHeight: 1920,      // Resolución máxima permitida
    useWebWorker: true,         // Mejor rendimiento en hilo separado
    initialQuality: 0.8,        // Calidad inicial
    ...options
  };

  try {
    const compressedFile = await imageCompression(file, defaultOptions);
    return compressedFile;
  } catch (error) {
    console.warn('Compresión en cliente fallida, se usará original:', error);
    return file;
  }
}
