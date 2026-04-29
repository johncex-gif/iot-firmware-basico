#include <Arduino.h>

// Definición del pin GPIO 22
const int ledPin = 22;

void setup() {
  pinMode(ledPin, OUTPUT);
  Serial.begin(115200);
  Serial.println("Sistema de LED iniciado en GPIO 22");
}

void loop() {
  digitalWrite(ledPin, HIGH); // Enciende el LED
  Serial.println("LED Encendido");
  delay(1000);
  
  digitalWrite(ledPin, LOW);  // Apaga el LED
  Serial.println("LED Apagado");
  delay(1000);
}