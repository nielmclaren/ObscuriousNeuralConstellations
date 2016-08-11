

#include <OctoWS2811.h>

const int numLedsPerStrip = 13;

DMAMEM int displayMemory[6 * numLedsPerStrip];
int drawingMemory[6 * numLedsPerStrip];

const int config = WS2811_800kHz;

OctoWS2811 leds(numLedsPerStrip, displayMemory, drawingMemory, config);

void setup() {
  Serial.setTimeout(50);
  leds.begin();
  leds.show();
}

void loop() {
  loopLedControl();
}

void loopBasicTest() {
  if (Serial.available() > 0) {
    int c = Serial.read();
    if (c == '*') {
      for (int i = 0; i < 6 * numLedsPerStrip; i++) {
        leds.setPixel(i, 0xff0000);
      }
      leds.show();
    } else if (c == '#') {
      for (int i = 0; i < 6 * numLedsPerStrip; i++) {
        leds.setPixel(i, 0x0000ff);
      }
      leds.show();
    }
  }
}

void loopByteTest() {
  int count;
  if (Serial.available() > 0) {
    int c = Serial.read();
    if (c == '*') {
      count = Serial.readBytes((char *)drawingMemory, sizeof(drawingMemory));
      if (count == 0) {
        for (int i = 0; i < 6 * numLedsPerStrip; i++) {
          if (i % 3 == 0) {
            leds.setPixel(i, 0xffff00);
          }
          else if (i % 3 == 1) {
            leds.setPixel(i, 0x00ffff);
          }
          else {
            leds.setPixel(i, 0xff00ff);
          }
        }
      }
      else if (count == 1) {
        wipe(0xff0000);
      }
      else if (count == 2) {
        wipe(0x00ff00);
      }
      else if (count == 3) {
        wipe(0x0000ff);
      }
      else if (count == 4) {
        wipe(0xffff00);
      }
      else {
        for (int i = 0; i < 6 * numLedsPerStrip; i++) {
          if (i % 3 == 0) {
            leds.setPixel(i, 0xff0000);
          }
          else if (i % 3 == 1) {
            leds.setPixel(i, 0x00ff00);
          }
          else {
            leds.setPixel(i, 0x0000ff);
          }
        }
        leds.show();
      }
    }
  }
}

void loopLedControl() {
  int count;
  int startChar = Serial.read();
  if (startChar == '*') {
    count = Serial.readBytes((char *)drawingMemory, sizeof(drawingMemory));
    if (count == sizeof(drawingMemory)) {
      leds.show();
    }
    else {
      for (int i = 0; i < 6 * numLedsPerStrip; i++) {
        if (i % 3 == 0) {
          leds.setPixel(i, 0xff0000);
        }
        else if (i % 3 == 1) {
          leds.setPixel(i, 0x00ff00);
        }
        else {
          leds.setPixel(i, 0x0000ff);
        }
      }
      leds.show();
    }
  } else if (startChar >= 0) {
    // discard unknown characters
  }
}

void wipe(int color) {
  for (int i = 0; i < 6 * numLedsPerStrip; i++) {
    leds.setPixel(i, color);
  }
  leds.show();
}
