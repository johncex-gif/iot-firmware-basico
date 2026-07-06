import React from 'react';
import '@/app/globals.css';
import { AuthProvider, AuthGuard } from '@/components/AuthGuard';

export const metadata = {
  title: 'IoT Telemetry - Monitoreo en Tiempo Real',
  description: 'Plataforma avanzada para monitoreo, visualización y análisis de datos de sensores IoT desde dispositivos ESP32.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
