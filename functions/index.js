// NOTA: Este archivo (index.js) NO es el que se despliega en Firebase.
// El código real de la Cloud Function está en:  src/index.ts
// Firebase compila el TypeScript y ejecuta:     lib/index.js  (generado automáticamente)
//
// Para hacer cambios, edita:  src/index.ts
// Para compilar:              npm run build
// Para desplegar:             npm run deploy

// Inicializa Firebase Admin SDK (solo una vez)
admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ maxInstances: 10 });

/**
 * Endpoint IoT para recibir datos de sensores desde el ESP32.
 *
 * URL de la función: https://<region>-<project-id>.cloudfunctions.net/api
 * Ruta del endpoint: POST /data
 * URL completa:      POST https://<region>-<project-id>.cloudfunctions.net/api/data
 *
 * Body JSON esperado:
 * {
 *   "deviceId":    "esp32-001",   // string,  OBLIGATORIO
 *   "temperatura": 25.3,          // number,  OBLIGATORIO
 *   "humedad":     60.1,          // number,  OBLIGATORIO
 *   "timestamp":   1720000000000  // number (ms epoch), OPCIONAL — se genera si no llega
 * }
 */
exports.api = onRequest(async (req, res) => {
  // ── Log de depuración: imprime TODO lo que llega ──────────────────────────
  logger.info("=== Nueva petición recibida ===", {
    method:  req.method,
    path:    req.path,
    headers: req.headers,
    body:    req.body,
  });

  // ── Solo acepta POST ───────────────────────────────────────────────────────
  if (req.method !== "POST") {
    logger.warn(`Método no permitido: ${req.method}`);
    return res.status(405).json({ error: "Método no permitido. Usa POST." });
  }

  // ── Solo acepta la ruta /data ──────────────────────────────────────────────
  if (req.path !== "/data") {
    logger.warn(`Ruta no encontrada: '${req.path}'. Usa POST /data`);
    return res.status(404).json({
      error: `Ruta '${req.path}' no encontrada.`,
      ayuda: "La ruta correcta es: POST /data  →  URL completa: .../api/data",
    });
  }

  // ── Validación de campos obligatorios ─────────────────────────────────────
  const { deviceId, temperatura, humedad, timestamp } = req.body;

  const camposFaltantes = [];
  if (deviceId   === undefined) camposFaltantes.push("deviceId");
  if (temperatura === undefined) camposFaltantes.push("temperatura");
  if (humedad    === undefined) camposFaltantes.push("humedad");

  if (camposFaltantes.length > 0) {
    logger.warn("Campos faltantes en el body:", camposFaltantes);
    return res.status(400).json({
      error: "Faltan campos obligatorios en el JSON.",
      camposFaltantes,
      bodyRecibido:    req.body,
      camposEsperados: ["deviceId", "temperatura", "humedad", "timestamp (opcional)"],
    });
  }

  // ── Guardar en Firestore ───────────────────────────────────────────────────
  try {
    const dataToSave = {
      deviceId:    String(deviceId),
      temperatura: Number(temperatura),
      humedad:     Number(humedad),
      timestamp:   timestamp ? Number(timestamp) : Date.now(),
      creadoEn:    admin.firestore.FieldValue.serverTimestamp(),
    };

    logger.info("Guardando datos en Firestore:", dataToSave);

    const docRef = await db
      .collection("sensores")
      .doc(String(deviceId))
      .collection("lecturas")
      .add(dataToSave);

    logger.info(`Datos guardados. Doc ID: ${docRef.id}`);

    return res.status(200).json({
      success: true,
      message: "Datos recibidos y guardados correctamente.",
      docId:   docRef.id,
      datos:   dataToSave,
    });
  } catch (err) {
    logger.error("Error al guardar en Firestore:", err);
    return res.status(500).json({
      error:   "Error interno al guardar en Firestore.",
      detalle: err.message,
    });
  }
});
