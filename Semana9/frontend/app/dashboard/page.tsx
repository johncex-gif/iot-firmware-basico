'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthGuard';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  addDoc,
  setDoc,
  doc
} from 'firebase/firestore';
import {
  Cpu,
  LogOut,
  Plus,
  Copy,
  Check,
  TrendingUp,
  Thermometer,
  Droplets,
  Radio,
  User as UserIcon,
  Database,
  Grid
} from 'lucide-react';
import Link from 'next/link';

// Componentes dinámicos de Recharts para evitar errores de SSR
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

interface Device {
  id: string;
  apiKey: string;
  name: string;
  ownerUid: string;
  createdAt: any;
}

interface TelemetryData {
  id: string;
  deviceId: string;
  timestamp: any;
  data: {
    temperature?: number;
    humidity?: number;
    [key: string]: any;
  };
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [telemetry, setTelemetry] = useState<TelemetryData[]>([]);
  
  // Estados de formularios
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceId, setNewDeviceId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // =============================================================================
  // 1. ESCUCHA ACTIVA DE DISPOSITIVOS EN FIRESTORE (TIEMPO REAL)
  // =============================================================================
  // Suscribe un listener en tiempo real a la colección 'devices' filtrando por
  // el usuario autenticado (ownerUid). Permite actualizar la UI si se añade/edita un dispositivo.
  useEffect(() => {
    if (!user) return;

    // Consulta: Busca dispositivos en la colección 'devices' donde el propietario coincide con el UID de Firebase Auth
    const q = query(
      collection(db, 'devices'),
      where('ownerUid', '==', user.uid)
    );

    // onSnapshot establece una conexión persistente (WebSockets) con Firestore.
    // Se ejecuta inmediatamente con el estado actual de la base de datos y luego en cada actualización.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const devList: Device[] = [];
      snapshot.forEach((docSnap) => {
        // Combinamos el ID del documento de Firestore con los campos de datos
        devList.push({ id: docSnap.id, ...docSnap.data() } as Device);
      });
      setDevices(devList);
      // Seleccionar automáticamente el primer dispositivo de la lista si no hay ninguno seleccionado previamente
      if (devList.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devList[0].id);
      }
    });

    // Función de limpieza: desvincula el listener en tiempo real cuando el componente se desmonta o cambia el usuario
    return () => unsubscribe();
  }, [user, selectedDeviceId]);

  // =============================================================================
  // 2. ESCUCHA ACTIVA DE TELEMETRÍA EN FIRESTORE (TIEMPO REAL)
  // =============================================================================
  // Suscribe un listener en tiempo real para obtener las últimas 20 lecturas de telemetría
  // asociadas al dispositivo seleccionado actualmente.
  useEffect(() => {
    if (!selectedDeviceId) {
      setTelemetry([]);
      return;
    }

    // Consulta: Colección 'telemetry', filtrando por ID de dispositivo, ordenando por timestamp descendente
    // y limitando los resultados a los últimos 20 registros.
    const q = query(
      collection(db, 'telemetry'),
      where('deviceId', '==', selectedDeviceId),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const readings: TelemetryData[] = [];
      snapshot.forEach((docSnap) => {
        const raw = docSnap.data();
        readings.push({
          id: docSnap.id,
          deviceId: raw.deviceId,
          // Convertir el tipo Timestamp de Firestore a un objeto Date de JS
          timestamp: raw.timestamp?.toDate() || new Date(),
          data: raw.data
        });
      });
      // Invertir el arreglo para que el gráfico muestre la línea temporal correctamente de izquierda a derecha (más antiguo a más nuevo)
      setTelemetry(readings.reverse());
    });

    // Desconectar el listener cuando el dispositivo seleccionado cambie o el componente se desmonte
    return () => unsubscribe();
  }, [selectedDeviceId]);

  // Registrar un nuevo dispositivo físico en la base de datos Firestore.
  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newDeviceId || !newDeviceName) return;

    setIsCreating(true);
    try {
      // Generar una clave de API aleatoria simple para autenticar las peticiones POST del ESP32
      const generatedApiKey = 'key_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Crear una referencia al documento en la colección 'devices' usando el ID ingresado como ID del documento (en minúsculas)
      const newDevRef = doc(db, 'devices', newDeviceId.trim().toLowerCase());
      
      // Escribir el nuevo documento en Firestore. Si ya existe, se sobrescribirá.
      await setDoc(newDevRef, {
        apiKey: generatedApiKey,
        name: newDeviceName,
        ownerUid: user.uid,
        createdAt: new Date()
      });

      setSelectedDeviceId(newDeviceId.trim().toLowerCase());
      setNewDeviceId('');
      setNewDeviceName('');
    } catch (err) {
      console.error('Error al registrar dispositivo:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const copyToClipboard = (text: string, type: 'id' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'id') {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  // Obtener el dispositivo seleccionado actualmente
  const activeDevice = devices.find(d => d.id === selectedDeviceId);

  // Obtener la última lectura
  const latestReading = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

  // Verificar si el dispositivo está en línea (último dato hace menos de 3 minutos)
  const isOnline = latestReading
    ? (new Date().getTime() - latestReading.timestamp.getTime()) < 3 * 60 * 1000
    : false;

  // =============================================================================
  // FORMATEAR DATOS PARA EL GRÁFICO (RECHARTS)
  // =============================================================================
  // Transforma el arreglo de lecturas de telemetría en el formato plano que
  // espera Recharts. Cada objeto tiene un campo para el eje X (tiempo formateado)
  // y campos para las variables que se representarán en el eje Y (temperatura y humedad).
  const chartData = telemetry.map(t => {
    // Formatear el timestamp a formato de hora legible local 'HH:MM:SS' para el eje X
    const timeStr = t.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      name: timeStr,                           // Etiqueta del eje X
      Temperatura: t.data.temperature || 0,     // Primer valor del eje Y
      Humedad: t.data.humidity || 0,           // Segundo valor del eje Y
    };
  });

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navegación */}
      <nav className="nav-container" style={{ position: 'relative' }}>
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
          <span style={{ fontSize: '20px', fontWeight: 800 }}>
            IoT<span style={{ color: 'var(--accent-cyan)' }}>Nova</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Grid size={16} /> Dashboard
          </Link>
          <Link href="/dashboard/logs" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }} onMouseEnter={e => e.currentTarget.style.color = 'white'} onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
            <Database size={16} /> Historial
          </Link>
          <button onClick={logout} className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={16} /> Salir
          </button>
        </div>
      </nav>

      {/* Contenedor Principal */}
      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '40px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* Fila de Perfil e Info de Selección de Dispositivo */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
          
          {/* Card de Dispositivo Activo */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'flex-start', width: '100%' }}>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Dispositivo Seleccionado</span>
                {devices.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 800 }}>{activeDevice?.name}</h2>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '30px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: isOnline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      color: isOnline ? 'var(--success)' : 'var(--error)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <span className={isOnline ? "pulse-glow" : ""} style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isOnline ? 'var(--success)' : 'var(--error)' }}></span>
                      {isOnline ? 'En línea' : 'Desconectado'}
                    </span>
                  </div>
                ) : (
                  <h2 style={{ fontSize: '20px', fontWeight: 800, marginTop: '4px', color: 'var(--text-secondary)' }}>No tienes dispositivos</h2>
                )}
              </div>

              {/* Selector */}
              {devices.length > 0 && (
                <select
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  style={{
                    marginLeft: 'auto',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: 'white',
                    border: '1px solid var(--border-card)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Credenciales para copiar al ESP32 */}
            {activeDevice && (
              <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Device ID: <code style={{ color: 'white' }}>{activeDevice.id}</code></span>
                  <button onClick={() => copyToClipboard(activeDevice.id, 'id')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-cyan)' }}>
                    {copiedId ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)', padding: '8px 12px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>API Key: <code style={{ color: 'white' }}>{activeDevice.apiKey.substring(0, 10)}...</code></span>
                  <button onClick={() => copyToClipboard(activeDevice.apiKey, 'key')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-cyan)' }}>
                    {copiedKey ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card de Usuario */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)'
            }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.displayName || ''} style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
              ) : (
                <UserIcon size={30} color="white" />
              )}
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>{user?.displayName}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px' }}>{user?.email}</p>
              <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', background: 'rgba(6,182,212,0.1)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginTop: '6px', fontWeight: 600 }}>Usuario Desarrollador</span>
            </div>
          </div>

        </div>

        {/* Fila de Widgets Numéricos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ color: 'var(--accent-cyan)', background: 'rgba(6, 182, 212, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <Thermometer size={32} />
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Última Temperatura</span>
              <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px' }}>
                {latestReading?.data.temperature !== undefined ? `${latestReading.data.temperature} °C` : '--'}
              </h2>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ color: 'var(--accent-purple)', background: 'rgba(168, 85, 247, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <Droplets size={32} />
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Última Humedad</span>
              <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px' }}>
                {latestReading?.data.humidity !== undefined ? `${latestReading.data.humidity} %` : '--'}
              </h2>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ color: 'var(--accent-blue)', background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '12px' }}>
              <Radio size={32} />
            </div>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Lecturas Registradas</span>
              <h2 style={{ fontSize: '32px', fontWeight: 800, marginTop: '4px' }}>
                {telemetry.length} <span style={{ fontSize: '14px', fontWeight: 400, color: 'var(--text-secondary)' }}>(historial cargado)</span>
              </h2>
            </div>
          </div>

        </div>

        {/* Sección de Gráfico y Formulario de Creación de Dispositivos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.6fr', gap: '24px' }}>
          
          {/* Card de Gráfico */}
          <div className="glass-card" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={18} color="var(--accent-cyan)" /> Comportamiento de Variables
            </h3>
            
            <div style={{ flex: 1, width: '100%', height: '100%', minHeight: '300px' }}>
              {telemetry.length > 0 ? (
                {/* 
                  ResponsiveContainer: Hace que el gráfico se adapte dinámicamente al tamaño del contenedor padre.
                  LineChart: Componente raíz del gráfico que recibe el arreglo `chartData` formateado.
                  CartesianGrid: Cuadrícula de fondo del gráfico.
                  XAxis: Eje horizontal vinculado a la propiedad 'name' (marca de tiempo formateada).
                  YAxis: Eje vertical que escala los valores de las variables.
                  Tooltip: Cuadro emergente que se muestra al pasar el mouse por encima del gráfico.
                  Legend: Leyenda que identifica las series (Líneas) del gráfico.
                  Line: Cada una de las series graficadas (Temperatura en cian, Humedad en púrpura).
                */}
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
                    <YAxis stroke="var(--text-secondary)" style={{ fontSize: '11px' }} />
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid var(--border-card)', borderRadius: '8px', color: 'white' }} />
                    <Legend />
                    <Line type="monotone" dataKey="Temperatura" stroke="var(--accent-cyan)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Humedad" stroke="var(--accent-purple)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '10px' }}>
                  <Radio size={48} style={{ opacity: 0.3 }} />
                  <span>Esperando datos del dispositivo... Envíe un POST desde su ESP32.</span>
                </div>
              )}
            </div>
          </div>

          {/* Card de Creación de Dispositivo */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={18} color="var(--accent-cyan)" /> Registrar Dispositivo
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>
                Crea un nuevo dispositivo para generar sus credenciales de posteo.
              </p>
            </div>

            <form onSubmit={handleCreateDevice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Device ID (Ej: esp32_sensor)</label>
                <input
                  type="text"
                  required
                  placeholder="ej: esp32_sala"
                  className="input-field"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>Nombre Amigable</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Sensor Sala Star"
                  className="input-field"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                />
              </div>

              <button type="submit" disabled={isCreating} className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                {isCreating ? 'Registrando...' : 'Registrar'}
              </button>
            </form>
          </div>

        </div>

      </main>
    </div>
  );
}
