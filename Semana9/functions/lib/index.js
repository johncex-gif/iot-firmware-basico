"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const validateApiKey_1 = require("./middleware/validateApiKey");
// Inicializar el SDK de Admin de Firebase.
// Al desplegarse en Cloud Functions, las credenciales se obtienen automáticamente
// del entorno de ejecución de Google Cloud.
admin.initializeApp();
const app = express();
// Middleware global
app.use(cors({ origin: true })); // Permitir peticiones desde cualquier origen (útil para pruebas locales)
app.use(express.json()); // Parsear el body de las peticiones como JSON
// =============================================================================
// POST /telemetry
//
// Endpoint principal para que el ESP32 envíe sus lecturas de sensores.
// La URL completa una vez desplegado es:
//   https://us-central1-<PROJECT_ID>.cloudfunctions.net/api/telemetry
//
// El ESP32 debe incluir en los headers HTTP:
//   x-api-key  : <API_KEY del dispositivo, guardada en Firestore>
//   x-device-id: <ID del documento del dispositivo en la colección /devices>
//
// El body debe ser un JSON con los datos del sensor, por ejemplo:
//   {
//     "temperature": 24.5,
//     "humidity": 60,
//     "pressure": 1013.25
//   }
//
// El middleware `validateApiKey` se encarga de:
//   1. Leer los headers x-api-key y x-device-id
//   2. Buscar el dispositivo en Firestore (/devices/<deviceId>)
//   3. Comparar la API Key recibida con la almacenada
//   4. Si todo es válido, adjunta el objeto `device` a la request y llama a next()
//   5. Si algo falla, responde con 401 / 400 / 403 según el caso
// =============================================================================
app.post('/telemetry', validateApiKey_1.validateApiKey, async (req, res) => {
    try {
        const { device } = req;
        const telemetryData = req.body;
        // Guardia de seguridad: el middleware siempre debería haber llenado `device`,
        // pero lo verificamos explícitamente para evitar errores en runtime.
        if (!device) {
            return res.status(500).json({ error: 'Error interno: dispositivo no adjunto por el middleware' });
        }
        // Validar que el ESP32 haya enviado datos en el body
        if (!telemetryData || typeof telemetryData !== 'object' || Object.keys(telemetryData).length === 0) {
            return res.status(400).json({
                error: 'El body de la petición está vacío o no es un objeto JSON válido',
            });
        }
        const db = admin.firestore();
        // -----------------------------------------------------------------------
        // Escritura en Firestore
        //
        // Colección: `telemetry`
        // Cada documento representa UNA lectura del sensor en un momento dado.
        // Se usa .add() para que Firestore genere automáticamente el ID del documento.
        //
        // Estructura del documento guardado:
        // {
        //   deviceId  : string   — ID del dispositivo que originó el dato
        //   ownerUid  : string   — UID de Firebase Auth del usuario dueño del dispositivo
        //   timestamp : Timestamp — Fecha/hora del servidor (no del ESP32)
        //   data      : object   — El payload JSON enviado por el ESP32
        // }
        // -----------------------------------------------------------------------
        const docRef = await db.collection('telemetry').add({
            deviceId: device.deviceId,
            ownerUid: device.ownerUid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            data: telemetryData,
        });
        // Actualizar el campo `lastSeen` en el documento del dispositivo
        // para que el dashboard muestre cuándo fue la última vez que envió datos.
        await db.collection('devices').doc(device.deviceId).update({
            lastSeen: admin.firestore.FieldValue.serverTimestamp(),
        });
        functions.logger.info('Telemetría registrada', {
            docId: docRef.id,
            deviceId: device.deviceId,
            ownerUid: device.ownerUid,
        });
        return res.status(201).json({
            success: true,
            message: 'Telemetría registrada correctamente',
            id: docRef.id,
        });
    }
    catch (error) {
        functions.logger.error('Error al guardar telemetría en Firestore:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});
// =============================================================================
// Exportar la aplicación Express como una única Cloud Function llamada `api`.
// Firebase enruta todas las peticiones a /api/* hacia esta función.
// =============================================================================
exports.api = functions.https.onRequest(app);
//# sourceMappingURL=index.js.map