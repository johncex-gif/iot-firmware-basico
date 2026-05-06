const int potPin = 34;
const int ledPin = 2;

int potValue = 0;
int ledValue = 0;

void setup() {
  Serial.begin(9600);
  pinMode(ledPin, OUTPUT);
}

void loop() {
  potValue = analogRead(potPin);
  ledValue = map(potValue, 0, 4095, 0, 255);
  
  analogWrite(ledPin, ledValue);
  
  Serial.print(potValue);
  Serial.print(" , ");
  Serial.println(ledValue);
  
  delay(10);
}