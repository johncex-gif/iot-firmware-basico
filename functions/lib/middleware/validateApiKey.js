"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateApiKey = void 0;
const admin = require("firebase-admin");
const validateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        const deviceId = req.headers['x-device-id'];
        if (!apiKey) {
            res.status(401).json({ error: 'Falta cabecera x-api-key' });
            return;
        }
        if (!deviceId) {
            res.status(400).json({ error: 'Falta cabecera x-device-id' });
            return;
        }
        // Buscar el dispositivo en Firestore
        const db = admin.firestore();
        const deviceDoc = await db.collection('devices').doc(deviceId).get();
        if (!deviceDoc.exists) {
            res.status(403).json({ error: 'Dispositivo no registrado o inválido' });
            return;
        }
        const deviceData = deviceDoc.data();
        // Validar la API Key
        if (!deviceData || deviceData.apiKey !== apiKey) {
            res.status(403).json({ error: 'API Key incorrecta para este dispositivo' });
            return;
        }
        // Adjuntar la información del dispositivo validado a la petición
        req.device = {
            deviceId: deviceId,
            ownerUid: deviceData.ownerUid,
            name: deviceData.name || 'Dispositivo IoT',
        };
        next();
    }
    catch (error) {
        console.error('Error en middleware validateApiKey:', error);
        res.status(500).json({ error: 'Error interno del servidor en validación' });
    }
};
exports.validateApiKey = validateApiKey;
//# sourceMappingURL=validateApiKey.js.map