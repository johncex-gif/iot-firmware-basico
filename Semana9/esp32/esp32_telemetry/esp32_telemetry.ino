/**
 * esp32_telemetry.ino
 * -----------------------------------------------------------
 * Firmware para ESP32 con sensor DHT22 (GPIO 4).
 * Envía lecturas de temperatura y humedad al backend de
 * Firebase Cloud Functions mediante HTTPS POST (JSON).
 *
 * Librerías requeridas (instalar desde el Gestor de Librerías):
 *   - "DHT sensor library" de Adafruit
 *   - "Adafruit Unified Sensor" de Adafruit
 * -----------------------------------------------------------
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <DHT.h>
#include "config.h"

// ── Instancia del sensor ────────────────────────────────────
DHT dht(DHTPIN, DHTTYPE);

// ── Variables de control de tiempo ─────────────────────────
unsigned long lastSendTime    = 0;
unsigned long lastConnectTime = 0;
const unsigned long WIFI_RETRY_INTERVAL_MS = 10000; // 10 s entre intentos de reconexión

// ── Prototipos ──────────────────────────────────────────────
void connectWiFi();
bool sendTelemetry(float temperature, float humidity);

// ===========================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("=========================================");
  Serial.println("  ESP32 IoT Telemetry  |  DHT22 @ GPIO4 ");
  Serial.println("=========================================");

  dht.begin();
  Serial.println("[DHT22] Sensor inicializado.");

  connectWiFi();
}

// ===========================================================
void loop() {
  unsigned long now = millis();

  // ── Reconexión WiFi automática ───────────────────────────
  if (WiFi.status() != WL_CONNECTED) {
    if (now - lastConnectTime >= WIFI_RETRY_INTERVAL_MS || lastConnectTime == 0) {
      lastConnectTime = now;
      Serial.println("[WiFi] Conexión perdida. Intentando reconectar...");
      connectWiFi();
    }
    return; // No enviar datos hasta estar conectado
  }

  // ── Envío periódico de telemetría ────────────────────────
  if (now - lastSendTime >= SEND_INTERVAL_MS || lastSendTime == 0) {
    lastSendTime = now;

    // Leer sensor DHT22 (tarda ~250 ms en responder)
    float temperature = dht.readTemperature(); // °C
    float humidity    = dht.readHumidity();    // %RH

    // Validar lectura
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("[DHT22] ERROR: Lectura inválida. Verifica el cableado y el pin GPIO.");
      return;
    }

    Serial.printf("[DHT22] Temperatura: %.2f °C  |  Humedad: %.2f %%\n",
                  temperature, humidity);

    // Intentar envío; si falla, se reintentará en el siguiente ciclo
    sendTelemetry(temperature, humidity);
  }
}

// ===========================================================
// Función de conexión/reconexión WiFi (bloqueante hasta éxito)
// ===========================================================
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("[WiFi] Conectando a '");
  Serial.print(ssid);
  Serial.print("' ");

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 20000) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WiFi] Conectado. IP local: ");
    Serial.println(WiFi.localIP());
    lastConnectTime = millis();
  } else {
    Serial.println("[WiFi] No se pudo conectar. Se reintentará pronto.");
  }
}

// ===========================================================
// Envía la telemetría al endpoint HTTPS de Cloud Functions
// Retorna true si la petición fue exitosa (HTTP 2xx)
// ===========================================================
bool sendTelemetry(float temperature, float humidity) {
  WiFiClientSecure* client = new WiFiClientSecure;
  if (!client) {
    Serial.println("[HTTPS] ERROR: No se pudo crear WiFiClientSecure.");
    return false;
  }

  // NOTA: setInsecure() omite la validación del certificado raíz.
  // Válido para prototipado. En producción usa client->setCACert(root_ca).
  client->setInsecure();

  HTTPClient http;
  bool success = false;

  Serial.print("[HTTPS] POST -> ");
  Serial.println(serverUrl);

  if (http.begin(*client, serverUrl)) {
    // Cabeceras requeridas por el middleware de autenticación
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key",    apiKey);
    http.addHeader("x-device-id",  deviceId);

    // Construir payload JSON
    String payload = "{";
    payload += "\"temperature\":" + String(temperature, 2) + ",";
    payload += "\"humidity\":"    + String(humidity, 2);
    payload += "}";

    Serial.print("[HTTPS] Payload: ");
    Serial.println(payload);

    int httpCode = http.POST(payload);

    if (httpCode > 0) {
      Serial.printf("[HTTPS] Respuesta HTTP: %d\n", httpCode);
      if (httpCode >= 200 && httpCode < 300) {
        Serial.println("[HTTPS] Telemetría enviada correctamente.");
        String response = http.getString();
        if (response.length() > 0) {
          Serial.println("[HTTPS] Body: " + response);
        }
        success = true;
      } else {
        Serial.println("[HTTPS] El servidor devolvió un error: " + http.getString());
      }
    } else {
      Serial.printf("[HTTPS] Error de conexión: %s\n",
                    http.errorToString(httpCode).c_str());
    }

    http.end();
  } else {
    Serial.println("[HTTPS] ERROR: No se pudo iniciar la conexión HTTP.");
  }

  delete client;
  return success;
}
