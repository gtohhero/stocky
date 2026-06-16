import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import './globals.css';
import BootstrapClient from './components/BootstrapClient';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stocky Farmacia - Tu farmacia de confianza',
  description: 'Sistema de gestión de inventario para farmacias',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {children}
        <BootstrapClient />
      </body>
    </html>
  );
}
