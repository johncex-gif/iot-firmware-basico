'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthGuard';
import { Cpu, Eye, Shield, Zap, ArrowRight, Activity, Database, Sparkles } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Luces de fondo (Ambient Glow) */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>

      {/* Navegación */}
      <nav className="nav-container">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            padding: '8px',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)'
          }}>
            <Cpu size={24} color="white" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '0.5px' }}>
            IoT<span style={{ color: 'var(--accent-cyan)' }}>Nova</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href={user ? "/dashboard" : "/login"} className="btn-secondary" style={{ padding: '8px 20px', fontSize: '14px' }}>
            {user ? 'Ir al Dashboard' : 'Iniciar Sesión'}
          </Link>
        </div>
      </nav>

      {/* Sección Hero */}
      <header style={{
        maxWidth: '1200px',
        margin: '140px auto 60px auto',
        padding: '0 24px',
        display: 'grid',
        gridTemplateColumns: '1.2fr 0.8fr',
        gap: '40px',
        alignItems: 'center'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(6, 182, 212, 0.08)',
            border: '1px solid rgba(6, 182, 212, 0.2)',
            padding: '6px 16px',
            borderRadius: '30px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--accent-cyan)',
            marginBottom: '20px'
          }}>
            <Sparkles size={14} /> Prototipado IoT simplificado
          </div>
          <h1 style={{
            fontSize: '56px',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-1px',
            marginBottom: '24px'
          }}>
            Monitorea tu Hardware en <br />
            <span className="gradient-text">Tiempo Real</span>
          </h1>
          <p style={{
            fontSize: '18px',
            color: 'var(--text-secondary)',
            marginBottom: '36px',
            lineHeight: '1.6',
            maxWidth: '540px'
          }}>
            Conecta tu ESP32 de forma segura a través de Cloud Functions, almacena datos telemétricos en Firestore y visualízalos al instante en un panel de control interactivo de alto rendimiento.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <Link href={user ? "/dashboard" : "/login"} className="btn-primary">
              Comenzar Ahora <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn-secondary">
              Ver Características
            </a>
          </div>
        </div>

        {/* Mockup de la plataforma */}
        <div className="glass-card" style={{
          position: 'relative',
          padding: '30px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.6), rgba(30, 41, 59, 0.4))'
        }}>
          <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', width: '100%' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
            </div>
            <div style={{
              marginLeft: 'auto',
              fontSize: '12px',
              color: 'var(--success)',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '2px 8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 600
            }}>
              <span className="pulse-glow" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
              ESP32 Conectado
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Temperatura</span>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--accent-cyan)' }}>24.5 °C</div>
            </div>
            <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Humedad</span>
              <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--accent-purple)' }}>58.2 %</div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Último payload recibido:</span>
            <pre style={{
              fontSize: '11px',
              background: '#020617',
              padding: '10px',
              borderRadius: '6px',
              marginTop: '8px',
              color: '#38bdf8',
              overflowX: 'auto',
              fontFamily: 'monospace'
            }}>
              {`{
  "sensor": "DHT22",
  "temperature": 24.5,
  "humidity": 58.2,
  "rssi": -65
}`}
            </pre>
          </div>
        </div>
      </header>

      {/* Características del Sistema */}
      <section id="features" style={{
        maxWidth: '1200px',
        margin: '100px auto',
        padding: '0 24px'
      }}>
        <h2 style={{
          textAlign: 'center',
          fontSize: '36px',
          fontWeight: 800,
          marginBottom: '50px'
        }}>
          Todo lo necesario para tu <span className="gradient-text">Prototipo IoT</span>
        </h2>

        <div className="grid-container">
          <div className="glass-card">
            <div style={{ color: 'var(--accent-cyan)', marginBottom: '16px' }}><Zap size={32} /></div>
            <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>Transmisión Ultrarrápida</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Hospedaje frontend en Vercel para una carga instantánea y comunicación con Cloud Functions en milisegundos.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ color: 'var(--accent-purple)', marginBottom: '16px' }}><Database size={32} /></div>
            <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>Base de Datos Firestore</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Base de datos escalable NoSQL que permite suscripciones en tiempo real para actualizar la interfaz al instante.
            </p>
          </div>

          <div className="glass-card">
            <div style={{ color: 'var(--accent-blue)', marginBottom: '16px' }}><Shield size={32} /></div>
            <h3 style={{ marginBottom: '10px', fontSize: '20px' }}>Acceso Seguro (Google)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6' }}>
              Autenticación rápida de Google y reglas granulares en Firestore para proteger la información del dispositivo.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-card)',
        padding: '40px 24px',
        textAlign: 'center',
        color: 'var(--text-secondary)',
        fontSize: '14px'
      }}>
        <p>© 2026 IoTNova. Desarrollado con Next.js, Firebase y Vercel.</p>
      </footer>
    </div>
  );
}
