import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink, access } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No se recibió ningún archivo' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generar nombre de archivo único
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${uuidv4()}.${extension}`;
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'temp');
    
    // Asegurar que el directorio temporal existe
    await mkdir(uploadDir, { recursive: true });
    
    const path = join(uploadDir, fileName);

    await writeFile(path, buffer);
    const url = `/uploads/temp/${fileName}`;

    return NextResponse.json({ success: true, url });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ success: false, error: 'Error interno al subir el archivo' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url || !url.includes('/temp/')) {
      return NextResponse.json({ success: false, error: 'URL inválida o no es temporal' }, { status: 400 });
    }

    const fileName = url.split('/').pop();
    const path = join(process.cwd(), 'public', 'uploads', 'temp', fileName!);

    try {
      await access(path);
      await unlink(path);
      return NextResponse.json({ success: true, message: 'Archivo eliminado de temp' });
    } catch (e) {
      return NextResponse.json({ success: true, message: 'El archivo ya no existe' });
    }
  } catch (error) {
    console.error('Error deleting temp file:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar archivo' }, { status: 500 });
  }
}
