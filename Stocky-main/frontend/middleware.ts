import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const userStr = request.cookies.get('user')?.value;
  
  const path = request.nextUrl.pathname;
  
  // Rutas públicas (no requieren autenticación)
  const publicPaths = ['/', '/login', '/signup', '/product'];
  const isPublicPath = publicPaths.some(p => path.startsWith(p));
  
  // Si es ruta pública, permitir acceso
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Si no hay token, redirigir a login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Verificar roles según la ruta
  if (userStr) {
    const user = JSON.parse(userStr);
    
    // Rutas de admin
    if (path.startsWith('/admin') && user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Rutas de worker
    if (path.startsWith('/worker') && user.role !== 'WORKER' && user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/worker/:path*',
    '/products/:path*',
    '/sales/:path*'
  ]
};