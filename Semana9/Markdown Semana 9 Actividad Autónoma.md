# Actividad Autónoma: Diseño de Arquitectura de Datos NoSQL para IoT

**Estudiante:** John Alexander Alvarez  
**Materia:** AI Coding II  
**Proyecto:** Sistema de Telemetría DHT22 con ESP32 y Firebase

---

## 1. Diseño del Árbol JSON
La estructura propuesta utiliza un modelo jerárquico para separar el estado actual del dispositivo del histórico de eventos, optimizando así las consultas y la velocidad de respuesta del dashboard.

```json
{
  "devices": {
    "device_001": {
      "metadata": {
        "deviceId": "DHT22-ESP32-001",
        "location": "Laboratorio_A",
        "status": "online"
      },
      "current_state": {
        "temperature": 24.5,
        "humidity": 60.2,
        "timestamp": 1720374360
      }
    }
  },
  "telemetry": {
    "device_001_id_registro_01": {
      "temperature": 24.5,
      "humidity": 60.2,
      "timestamp": 1720374360
    },
    "device_001_id_registro_02": {
      "temperature": 24.6,
      "humidity": 60.1,
      "timestamp": 1720374420
    }
  }
}

## 2. Reglas de Seguridad
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Reglas para la Telemetría
    // El dispositivo IoT tiene permiso de escritura para registrar datos.
    // Los usuarios autenticados tienen permisos de lectura para ver el historial.
    match /telemetry/{document=**} {
      allow write: if true; 
      allow read: if request.auth != null;
    }

    // Reglas para el Estado de Dispositivos
    // Solo lectura para usuarios autenticados.
    // Escritura restringida: Solo el backend tiene control sobre el estado del hardware.
    match /devices/{deviceId} {
      allow read: if request.auth != null;
      allow write: if false; 
    }
  }
}

