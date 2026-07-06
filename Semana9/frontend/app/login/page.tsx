'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthGuard';
import { Cpu, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Error al autenticar con Google. Intente nuevamente.');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {/* Botón Volver a la Landing */}
      <Link href="/" style={{
        position: 'absolute',
        top: '40px',
        left: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: 'var(--text-secondary)',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: 600,
        transition: 'color 0.3s ease'
      }}
      onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <ArrowLeft size={16} /> Volver al Inicio
      </Link>

      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        {/* Logo */}
        <div style={{
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          padding: '12px',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)',
          marginBottom: '8px'
        }}>
          <Cpu size={32} color="white" />
        </div>

        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Iniciar Sesión</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Accede de forma rápida y segura a tu dashboard.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--error)',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '13px',
            width: '100%',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        {/* Botón de Autenticación de Google */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="btn-primary"
          style={{
            width: '100%',
            justifyContent: 'center',
            background: 'white',
            color: '#1e293b',
            boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)',
            gap: '12px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(0.95)'}
          onMouseLeave={(e) => e.currentTarget.style.filter = 'brightness(1)'}
        >
          {/* Logo SVG de Google */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          <span style={{ fontWeight: 700 }}>
            {loading ? 'Conectando...' : 'Continuar con Google'}
          </span>
        </button>

        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
          Al iniciar sesión, aceptas automáticamente los términos de servicio y la política de privacidad de la plataforma.
        </span>
      </div>
    </div>
  );
}
