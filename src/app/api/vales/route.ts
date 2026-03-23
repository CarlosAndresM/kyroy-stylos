import { NextResponse } from 'next/server';
import { getAllAdelantosService, createAdelantoService } from '@/features/vales/services';

export async function GET() {
  try {
    const response = await getAllAdelantosService();
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, data: null }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const response = await createAdelantoService(body);
    if (!response.success) {
      return NextResponse.json(response, { status: 400 });
    }
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, data: null }, { status: 500 });
  }
}
