import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Extraemos la cookie generada por la API de Login
  const sessionUser = request.cookies.get('session_user')?.value;

  // 1. Protección del frontend (cualquier ruta bajo /dashboard)
  if (pathname.startsWith('/dashboard')) {
    if (!sessionUser) {
      // Redirigir al inicio o login
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // 2. Protección de la API (cualquier ruta /api excepto las de auth)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
    if (!sessionUser) {
      return NextResponse.json(
        { 
          success: false, 
          data: null, 
          error: 'No autorizado', 
          meta: {} 
        },
        { status: 401 }
      );
    }
  }

  // 3. Comodidad: Si está logueado y abre la ruta base de la landing (sin ser una petición RSC interna de Next)
  if (pathname === '/' && sessionUser) {
    if (!request.headers.has('rsc') && !request.headers.has('next-router-prefetch')) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

/**
 * Limitamos el scope del middleware estricta y únicamente a las rutas que 
 * de verdad nos interesa interceptar. Esto evita que los "Server Actions"
 * en páginas públicas (como /auth/login) se rompan y además mejora muchísimo
 * el rendimiento del servidor en rutas estáticas y assets.
 */
export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/api/:path*',
    '/'
  ],
};
